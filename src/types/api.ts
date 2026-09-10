export interface CommonResult<T> {
  code: number;
  message: string;
  data: T | null;
}

export interface PageResult<T> {
  list: T[];
  total: number;
}
