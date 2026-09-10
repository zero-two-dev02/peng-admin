import { request } from "./request";
import type { PageResult } from "../types/api";
import type { PointRecord, Adjustment, Query } from "../types/operations";
export const members = {
  records: (params: Query, signal?: AbortSignal) =>
    request<PageResult<PointRecord>>({
      url: "/member/admin/points/record-page",
      params,
      signal,
    }),
  adjust: (data: Adjustment & { memberUserId: number }) =>
    request<boolean>({
      url: "/member/admin/points/adjust",
      method: "POST",
      data,
    }),
};
