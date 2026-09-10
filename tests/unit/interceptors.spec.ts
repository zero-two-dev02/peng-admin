import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from "axios";
const session = vi.hoisted(() => ({
  accessToken: "isolated-test-only",
  clearSession: vi.fn(),
  setPermissions: vi.fn(),
}));
const replace = vi.hoisted(() => vi.fn());
vi.mock("../../src/router", () => ({
  default: {
    currentRoute: { value: { name: "workbench", fullPath: "/payment/orders" } },
    replace,
  },
}));
vi.mock("../../src/stores/auth", () => ({ useAuthStore: () => session }));
import http from "../../src/api/http";
import { setupHttpInterceptors } from "../../src/api/setup-http-interceptors";

function response(
  config: InternalAxiosRequestConfig,
  data: unknown,
  status = 200,
) {
  return {
    data,
    status,
    statusText: String(status),
    config,
    headers: new AxiosHeaders(),
  };
}
describe("actual Axios interceptors", () => {
  beforeAll(setupHttpInterceptors);
  beforeEach(() => vi.clearAllMocks());
  it("returns CommonResult success intact", async () => {
    http.defaults.adapter = async (config) =>
      response(config, { code: 0, data: false });
    expect((await http.get("/test")).data.data).toBe(false);
  });
  it("rejects HTTP 200 business conflict, preserves session", async () => {
    http.defaults.adapter = async (config) =>
      response(config, { code: 1004003006, message: "版本冲突" });
    await expect(http.put("/test", {})).rejects.toMatchObject({
      kind: "business",
      message: "版本冲突",
    });
    expect(session.clearSession).not.toHaveBeenCalled();
  });
  it("invalid token clears only memory and redirects with safe return", async () => {
    http.defaults.adapter = async (config) =>
      response(config, { code: 1002001003, message: "expired" });
    await expect(http.get("/test")).rejects.toMatchObject({
      kind: "authentication",
    });
    expect(session.clearSession).toHaveBeenCalledOnce();
    expect(replace).toHaveBeenCalledWith({
      name: "login",
      query: { reason: "expired", returnTo: "/payment/orders" },
    });
  });
  it("permission denial invalidates permission snapshot, not the session", async () => {
    http.defaults.adapter = async (config) =>
      response(config, { code: 1008002005, message: "denied" });
    await expect(http.get("/test")).rejects.toMatchObject({
      kind: "permission",
    });
    expect(session.setPermissions).toHaveBeenCalledWith([]);
    expect(session.clearSession).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith("/403");
  });
  it("HTTP 503 write is uncertain and is never retried automatically", async () => {
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError(
        "unavailable",
        "ERR_BAD_RESPONSE",
        config,
        undefined,
        response(config, {}, 503),
      );
    });
    http.defaults.adapter = adapter;
    await expect(http.post("/test", {})).rejects.toMatchObject({
      kind: "http",
      code: 503,
      uncertain: true,
    });
    expect(adapter).toHaveBeenCalledOnce();
    expect(session.clearSession).not.toHaveBeenCalled();
  });
  it("malformed successful write response is uncertain, not a business failure", async () => {
    http.defaults.adapter = async (config) =>
      response(config, "gateway response");
    await expect(http.post("/test", {})).rejects.toMatchObject({
      kind: "protocol",
      uncertain: true,
    });
  });
  it("generic server failure in HTTP 200 write remains uncertain", async () => {
    http.defaults.adapter = async (config) =>
      response(config, { code: 500, message: "internal" });
    await expect(http.post("/test", {})).rejects.toMatchObject({
      kind: "business",
      uncertain: true,
    });
  });
});
