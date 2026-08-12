import type { CommonResult } from '../types/api'
import http from './http'

export interface PermissionListItem {
  code: string
  name: string
}

export interface PermissionCreateRequest {
  code: string
  name: string
}

export interface PermissionUpdateRequest {
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

export async function createPermission(
  request: PermissionCreateRequest,
): Promise<CommonResult<number>> {
  const response = await http.post<CommonResult<number>>(
    '/system/permission/create',
    request,
  )
  return response.data
}

export async function updatePermission(
  request: PermissionUpdateRequest,
): Promise<CommonResult<boolean>> {
  const response = await http.put<CommonResult<boolean>>(
    '/system/permission/update',
    request,
  )
  return response.data
}

export async function deletePermission(
  code: string,
): Promise<CommonResult<boolean>> {
  const response = await http.delete<CommonResult<boolean>>(
    '/system/permission/delete',
    {
      params: { code },
    },
  )
  return response.data
}
