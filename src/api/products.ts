import { request } from "./request";
import type { PageResult } from "../types/api";
import type {
  Category,
  Spu,
  SpuDetail,
  SpuInput,
  Query,
} from "../types/operations";
const base = "/product/admin";
export const products = {
  categories: (signal?: AbortSignal) =>
    request<Category[]>({ url: base + "/category/list", signal }),
  category: (id: number) =>
    request<Category>({ url: base + "/category/get", params: { id } }),
  createCategory: (data: { code: string; name: string }) =>
    request<number>({ url: base + "/category", method: "POST", data }),
  updateCategory: (data: { id: number; name: string; status: number }) =>
    request<boolean>({ url: base + "/category/update", method: "PUT", data }),
  page: (params: Query, signal?: AbortSignal) =>
    request<PageResult<Spu>>({ url: base + "/spu/page", params, signal }),
  detail: (id: number) =>
    request<SpuDetail>({ url: base + "/spu/get", params: { id } }),
  create: (data: SpuInput) =>
    request<number>({ url: base + "/spu", method: "POST", data }),
  update: (data: {
    id: number;
    categoryId: number;
    name: string;
    description: string;
    version: number;
  }) => request<boolean>({ url: base + "/spu/update", method: "PUT", data }),
  status: (
    kind: "spu" | "sku",
    data: { id: number; expectedStatus: number; status: number },
  ) =>
    request<boolean>({
      url: base + "/" + kind + "/status",
      method: "PUT",
      data,
    }),
  archive: (
    action: "archive" | "recover",
    data: { id: number; version: number },
  ) => request<boolean>({ url: base + "/spu/" + action, method: "PUT", data }),
  updateSku: (data: {
    id: number;
    specification: string;
    priceFen: number;
    version: number;
  }) => request<boolean>({ url: base + "/sku/update", method: "PUT", data }),
};
