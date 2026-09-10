import type { CommonResult } from "../types/api";
import http from "./http";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  userId: number;
  accessToken: string;
  expiresTime: string;
}

export interface CurrentUserResponse {
  userId: number;
  permissions: string[];
}

export interface CurrentUserPasswordUpdateRequest {
  oldPassword: string;
  newPassword: string;
}

export async function login(
  request: LoginRequest,
): Promise<CommonResult<LoginResponse>> {
  const response = await http.post<CommonResult<LoginResponse>>(
    "/system/auth/login",
    request,
  );
  return response.data;
}

export async function getCurrentUser(): Promise<
  CommonResult<CurrentUserResponse>
> {
  const response =
    await http.get<CommonResult<CurrentUserResponse>>("/system/auth/me");
  return response.data;
}

export async function logout(): Promise<CommonResult<boolean>> {
  const response = await http.post<CommonResult<boolean>>(
    "/system/auth/logout",
  );
  return response.data;
}

export async function updateCurrentUserPassword(
  request: CurrentUserPasswordUpdateRequest,
): Promise<CommonResult<boolean>> {
  const response = await http.put<CommonResult<boolean>>(
    "/system/auth/update-password",
    request,
  );
  return response.data;
}
