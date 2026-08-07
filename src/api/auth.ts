import type { CommonResult } from '../types/api'
import http from './http'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  userId: number
  accessToken: string
  expiresTime: string
}

export async function login(
  request: LoginRequest,
): Promise<CommonResult<LoginResponse>> {
  const response = await http.post<CommonResult<LoginResponse>>(
    '/system/auth/login',
    request,
  )
  return response.data
}
