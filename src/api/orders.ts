import { request } from "./request";
import type { PageResult } from "../types/api";
import type { AdminOrder, OrderPageQuery } from "../types/orders";

export const orders = {
  page: (params: OrderPageQuery, signal?: AbortSignal) =>
    request<PageResult<AdminOrder>>({
      url: "/order/admin/orders",
      params,
      signal,
    }),
  get: (id: number) =>
    request<AdminOrder>({
      url: `/order/admin/orders/${id}`,
    }),
};
