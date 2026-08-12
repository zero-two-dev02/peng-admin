import type { CommonResult, PageResult } from '../types/api'
import http from './http'

export interface UserPageRequest {
  pageNo: number
  pageSize: number
  username?: string
  status?: number
}

export interface UserPageItem {
  id: number
  username: string
  nickname: string
  status: number
}

export interface UserRoleItem {
  code: string
  name: string
  status: number
}

export interface UserUpdateRequest {
  id: number
  nickname: string
  status: number
}

export interface UserRoleAssignRequest {
  id: number
  roleCodes: string[]
}

export interface UserPasswordResetRequest {
  id: number
  password: string
}

export async function getUserPage(
  request: UserPageRequest,
): Promise<CommonResult<PageResult<UserPageItem>>> {
  const response = await http.get<CommonResult<PageResult<UserPageItem>>>(
    '/system/user/page',
    {
      params: request,
    },
  )
  return response.data
}

export async function getUserRoles(
  id: number,
): Promise<CommonResult<UserRoleItem[]>> {
  const response = await http.get<CommonResult<UserRoleItem[]>>(
    '/system/user/role-list',
    {
      params: {
        id,
      },
    },
  )
  return response.data
}

export async function updateUser(
  request: UserUpdateRequest,
): Promise<CommonResult<boolean>> {
  const response = await http.put<CommonResult<boolean>>(
    '/system/user/update',
    request,
  )
  return response.data
}

export async function assignUserRoles(
  request: UserRoleAssignRequest,
): Promise<CommonResult<boolean>> {
  const response = await http.put<CommonResult<boolean>>(
    '/system/user/assign-roles',
    request,
  )
  return response.data
}

export async function resetUserPassword(
  request: UserPasswordResetRequest,
): Promise<CommonResult<boolean>> {
  const response = await http.put<CommonResult<boolean>>(
    '/system/user/reset-password',
    request,
  )
  return response.data
}
