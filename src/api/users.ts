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

export interface UserCreateRequest {
  username: string
  password: string
  nickname: string
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

export async function getUser(
  id: number,
): Promise<CommonResult<UserPageItem>> {
  const response = await http.get<CommonResult<UserPageItem>>(
    '/system/user/get',
    {
      params: { id },
    },
  )
  return response.data
}

export async function createUser(
  request: UserCreateRequest,
): Promise<CommonResult<number>> {
  const response = await http.post<CommonResult<number>>(
    '/system/user/create',
    request,
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

export async function deleteUser(id: number): Promise<CommonResult<boolean>> {
  const response = await http.delete<CommonResult<boolean>>(
    '/system/user/delete',
    {
      params: { id },
    },
  )
  return response.data
}
