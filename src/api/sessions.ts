import { request } from "./request";
export const sessions = {
  list: (id: number, signal?: AbortSignal) =>
    request<{ expiresAt: string }[]>({
      url: "/system/user/session-list",
      params: { id },
      signal,
    }),
  revoke: (id: number) =>
    request<boolean>({
      url: "/system/user/force-logout",
      method: "PUT",
      data: { id },
    }),
};
