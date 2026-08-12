import type { CommonResult } from '../types/api'
import http from './http'

export async function getSystemInfo(): Promise<CommonResult<string>> {
  const response = await http.get<CommonResult<string>>('/system/info')
  return response.data
}
