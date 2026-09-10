import type { AxiosRequestConfig } from "axios";
import type { CommonResult } from "../types/api";
import http from "./http";
import { ApiError, businessError } from "../utils/errors";
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const { data } = await http.request<CommonResult<T>>(config);
  if (data.code !== 0) throw businessError(data.code, data.message);
  if (data.data === null) throw new ApiError("响应缺少数据。", "protocol");
  return data.data;
}
