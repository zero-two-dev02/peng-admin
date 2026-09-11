import axios from "axios";
export type ErrorKind =
  | "authentication"
  | "permission"
  | "business"
  | "network"
  | "timeout"
  | "cancelled"
  | "http"
  | "protocol";
const forbiddenCodes = new Set([
  1002002001, 1002001004, 1003002001, 1004002001, 1006002001, 1007002006,
  1008002005,
]);
export class ApiError extends Error {
  kind: ErrorKind;
  code?: number;
  uncertain: boolean;
  constructor(
    message: string,
    kind: ErrorKind,
    code?: number,
    uncertain = false,
  ) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.code = code;
    this.uncertain = uncertain;
  }
}
export function businessError(code: number, message: string): ApiError {
  return new ApiError(
    message,
    code === 1002001003
      ? "authentication"
      : forbiddenCodes.has(code)
        ? "permission"
        : "business",
    code,
  );
}
export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isCancel(error)) return new ApiError("请求已取消。", "cancelled");
  if (axios.isAxiosError(error)) {
    const writing = !["get", "head", "options"].includes(
      error.config?.method ?? "get",
    );
    if (!error.response)
      return new ApiError(
        error.code === "ECONNABORTED" ? "请求超时。" : "网络或后端服务不可用。",
        error.code === "ECONNABORTED" ? "timeout" : "network",
        undefined,
        writing,
      );
    const status = error.response.status;
    return new ApiError(
      status === 401
        ? "登录已失效，请重新登录。"
        : status === 403
          ? "无权执行此操作。"
          : `服务器返回 HTTP ${status}，请稍后重试。`,
      status === 401
        ? "authentication"
        : status === 403
          ? "permission"
          : "http",
      status,
      writing && status >= 500,
    );
  }
  return new ApiError(
    error instanceof Error ? error.message : "操作失败，请重试。",
    "business",
  );
}
export function errorMessage(error: unknown): string {
  const result = normalizeError(error);
  return (
    result.message +
    (result.uncertain
      ? " 写入结果不确定，请先查询核实；不要重复创建或更换业务号。"
      : "")
  );
}
