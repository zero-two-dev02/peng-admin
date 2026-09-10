export interface PageQuery {
  pageNo: number;
  pageSize: number;
}
export interface AuditRow {
  id: number;
  operatorUserId?: number;
  action: string;
  targetType?: string;
  targetIdentifier?: string;
  paymentNo?: string;
  success: boolean;
  failureReason: string | null;
  createTime: string;
}
export interface CallbackEvent {
  id: number;
  eventNo: string;
  paymentNo: string;
  channelTransactionNo: string;
  amountFen: number;
  createTime: string;
}
export interface PaymentOrder {
  id: number;
  paymentNo: string;
  orderNo: string;
  amountFen: number;
  status: number;
}
export interface Reconciliation {
  succeededPaymentCount: number;
  callbackEventCount: number;
  difference: number;
}
export interface PointRecord {
  id: number;
  businessType: string;
  businessNo: string;
  changeValue: number;
  remark: string;
  createdAt: string;
}
export interface Adjustment {
  businessType: string;
  businessNo: string;
  changeValue: number;
  remark: string;
}
export interface Stock {
  skuId: number;
  availableStock: number;
  reservedStock: number;
  updatedAt: string;
}
export interface StockRecord extends PointRecord {
  skuId: number;
}
export interface Reservation {
  reservationNo: string;
  skuId: number;
  quantity: number;
  status: number;
  createdAt: string;
  updatedAt: string;
}
export interface ReservationEvent {
  eventType: string;
  createdAt: string;
}
export interface Notice {
  id: number;
  title: string;
  summary: string;
  status: number;
  version: number;
  publishTime: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface NoticeDetail extends Notice {
  content: string;
}
export interface NoticeInput {
  title: string;
  summary: string;
  content: string;
}
export interface Category {
  id: number;
  code: string;
  name: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}
export interface Spu {
  id: number;
  categoryId: number;
  code: string;
  name: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}
export interface Sku {
  id: number;
  code: string;
  specification: string;
  priceFen: number;
  status: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}
export interface SpuDetail extends Spu {
  description: string;
  version: number;
  skus: Sku[];
}
export interface SpuInput {
  categoryId: number;
  code: string;
  name: string;
  description: string;
  skus: { code: string; specification: string; priceFen: number }[];
}
export type Query = Record<string, string | number | boolean | undefined>;
