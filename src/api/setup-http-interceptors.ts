import router from "../router";
import pinia from "../stores";
import { useAuthStore } from "../stores/auth";
import http from "./http";
import { ApiError, businessError, normalizeError } from "../utils/errors";
import { safeReturnPath } from "../utils/safety";

const AUTH_ACCESS_TOKEN_INVALID = 1_002_001_003;

function getResultCode(data: unknown): number | null {
  if (typeof data !== "object" || data === null || !("code" in data)) {
    return null;
  }

  const code = (data as { code?: unknown }).code;
  return typeof code === "number" ? code : null;
}

export function setupHttpInterceptors() {
  http.interceptors.request.use((config) => {
    const authStore = useAuthStore(pinia);

    if (authStore.accessToken !== null) {
      config.headers.set("Authorization", `Bearer ${authStore.accessToken}`);
    }

    return config;
  });

  function handle(error: unknown) {
    const failure = normalizeError(error);
    const auth = useAuthStore(pinia);
    if (failure.kind === "authentication") {
      auth.clearSession();
      if (router.currentRoute.value.name !== "login")
        void router.replace({
          name: "login",
          query: {
            reason: "expired",
            returnTo: safeReturnPath(router.currentRoute.value.fullPath),
          },
        });
    }
    if (failure.kind === "permission") {
      auth.setPermissions([]);
      if (router.currentRoute.value.name !== "forbidden")
        void router.replace("/403");
    }
    return Promise.reject(failure);
  }
  http.interceptors.response.use((response) => {
    const writing = !["get", "head", "options"].includes(
      response.config.method ?? "get",
    );
    const code = getResultCode(response.data);
    if (code === null)
      return handle(
        new ApiError(
          "服务响应格式不符合契约。",
          "protocol",
          undefined,
          writing,
        ),
      );
    if (code === AUTH_ACCESS_TOKEN_INVALID || code !== 0) {
      const failure = businessError(
        code,
        response.data.message || "业务请求失败。",
      );
      if (writing && code === 500) failure.uncertain = true;
      return handle(failure);
    }
    return response;
  }, handle);
}
