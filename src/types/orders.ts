export interface AdminOrder {
  id: number;
  orderNo: string;
  userId: number;
  spuId: number;
  skuId: number;
  productName: string;
  skuSpecification: string;
  unitPriceFen: number;
  quantity: number;
  totalPriceFen: number;
  status: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  cancellationId: string | null;
  cancelReason: string | null;
  cancellationRequestedAt: string | null;
  cancelledAt: string | null;
}

export interface OrderPageQuery {
  pageNo: number;
  pageSize: number;
  orderNo?: string;
  userId?: number;
  status?: number;
}
