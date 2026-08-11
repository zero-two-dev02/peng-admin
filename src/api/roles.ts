import type { CommonResult } from '../types/api'
import http from './http'

export interface RoleListItem {
  code: string
  name: string
}

export async function getRoleList(): Promise<CommonResult<RoleListItem[]>> {
  const response = await http.get<CommonResult<RoleListItem[]>>(
    '/system/role/list',
  )
  return response.data
}
