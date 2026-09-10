import { request } from "./request";
import type { PageResult } from "../types/api";
import type {
  PaymentOrder,
  CallbackEvent,
  Reconciliation,
  Query,
} from "../types/operations";
export const payments = {
  orders: (params: Query, signal?: AbortSignal) =>
    request<PageResult<PaymentOrder>>({
      url: "/payment/admin/orders",
      params,
      signal,
    }),
  events: (params: Query, signal?: AbortSignal) =>
    request<PageResult<CallbackEvent>>({
      url: "/payment/admin/callback-events",
      params,
      signal,
    }),
  reconcile: (params: Query, signal?: AbortSignal) =>
    request<Reconciliation>({
      url: "/payment/admin/callback-events/reconciliation",
      params,
      signal,
    }),
};
