import { request } from "./request";
import type { PageResult } from "../types/api";
import type { AuditRow, Query } from "../types/operations";
export type AuditDomain = "system" | "notice" | "payment";
const urls = {
  system: "/system/operation-audit/page",
  notice: "/notice/admin/operation-audit/page",
  payment: "/payment/admin/operation-audit",
};
export const auditPage = (
  domain: AuditDomain,
  params: Query,
  signal?: AbortSignal,
) => request<PageResult<AuditRow>>({ url: urls[domain], params, signal });
