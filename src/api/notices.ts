import { request } from "./request";
import type { PageResult } from "../types/api";
import type {
  Notice,
  NoticeDetail,
  NoticeInput,
  Query,
} from "../types/operations";
const base = "/notice/admin";
export const notices = {
  page: (params: Query, signal?: AbortSignal) =>
    request<PageResult<Notice>>({ url: base + "/page", params, signal }),
  get: (id: number) =>
    request<NoticeDetail>({ url: base + "/get", params: { id } }),
  create: (data: NoticeInput) =>
    request<number>({ url: base + "/create", method: "POST", data }),
  update: (data: NoticeInput & { id: number; version: number }) =>
    request<boolean>({ url: base + "/update", method: "PUT", data }),
  action: (
    action: "publish" | "offline" | "schedule",
    id: number,
    publishTime?: string,
  ) =>
    request<boolean>({
      url: base + "/" + action,
      method: "PUT",
      data: { id, publishTime },
    }),
  delete: (id: number) =>
    request<boolean>({
      url: base + "/delete",
      method: "DELETE",
      params: { id },
    }),
};
