import type { CommonResult, PageResult } from '../types/api'
import http from './http'

export interface RoleListItem {
  code: string
  name: string
}

export interface RolePageRequest {
  pageNo: number
  pageSize: number
  code?: string
  status?: number
}

export interface RolePageItem {
  code: string
  name: string
  status: number
  builtIn: boolean
}

export interface RoleUpdateRequest {
  roleCode: string
  name: string
  status: number
}

export interface RolePermissionAssignRequest {
  roleCode: string
  permissionCodes: string[]
}

export async function getRoleList(): Promise<CommonResult<RoleListItem[]>> {
  const response = await http.get<CommonResult<RoleListItem[]>>(
    '/system/role/list',
  )
  return response.data
}

export async function getRolePage(
  request: RolePageRequest,
): Promise<CommonResult<PageResult<RolePageItem>>> {
  const response = await http.get<CommonResult<PageResult<RolePageItem>>>(
    '/system/role/page',
    {
      params: request,
    },
  )
  return response.data
}

export async function getRolePermissionCodes(
  roleCode: string,
): Promise<CommonResult<string[]>> {
  const response = await http.get<CommonResult<string[]>>(
    '/system/role/permission-codes',
    {
      params: {
        roleCode,
      },
    },
  )
  return response.data
}

export async function updateRole(
  request: RoleUpdateRequest,
): Promise<CommonResult<boolean>> {
  const response = await http.put<CommonResult<boolean>>(
    '/system/role/update',
    request,
  )
  return response.data
}

export async function assignRolePermissions(
  request: RolePermissionAssignRequest,
): Promise<CommonResult<boolean>> {
  const response = await http.put<CommonResult<boolean>>(
    '/system/role/assign-permissions',
    request,
  )
  return response.data
}

export async function deleteRole(
  roleCode: string,
): Promise<CommonResult<boolean>> {
  const response = await http.delete<CommonResult<boolean>>(
    '/system/role/delete',
    {
      params: { roleCode },
    },
  )
  return response.data
}
