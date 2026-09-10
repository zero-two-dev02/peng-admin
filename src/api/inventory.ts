import { request } from "./request";
import type { PageResult } from "../types/api";
import type {
  Stock,
  StockRecord,
  Reservation,
  ReservationEvent,
  Adjustment,
  Query,
} from "../types/operations";
export const inventory = {
  stocks: (params: Query, signal?: AbortSignal) =>
    request<PageResult<Stock>>({
      url: "/inventory/admin/stock/page",
      params,
      signal,
    }),
  records: (params: Query, signal?: AbortSignal) =>
    request<PageResult<StockRecord>>({
      url: "/inventory/admin/stock/record-page",
      params,
      signal,
    }),
  initialize: (
    data: Omit<Adjustment, "changeValue"> & {
      skuId: number;
      initialStock: number;
    },
  ) =>
    request<boolean>({
      url: "/inventory/admin/stock/initialize",
      method: "POST",
      data,
    }),
  adjust: (data: Adjustment & { skuId: number }) =>
    request<boolean>({
      url: "/inventory/admin/stock/adjust",
      method: "POST",
      data,
    }),
  reservations: (params: Query, signal?: AbortSignal) =>
    request<PageResult<Reservation>>({
      url: "/inventory/admin/reservations/page",
      params,
      signal,
    }),
  events: (reservationNo: string) =>
    request<ReservationEvent[]>({
      url: "/inventory/admin/reservations/event-list",
      params: { reservationNo },
    }),
};
