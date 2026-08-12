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
