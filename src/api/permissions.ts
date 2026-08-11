import type { CommonResult } from '../types/api'
import http from './http'

export interface PermissionListItem {
  code: string
  name: string
}

export async function getPermissionList(): Promise<
  CommonResult<PermissionListItem[]>
> {
  const response = await http.get<CommonResult<PermissionListItem[]>>(
    '/system/permission/list',
  )
  return response.data
}
