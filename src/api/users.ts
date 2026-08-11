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
