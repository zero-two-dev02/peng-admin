export interface CommonResult<T> {
  code: number
  message: string
  data: T | null
}
