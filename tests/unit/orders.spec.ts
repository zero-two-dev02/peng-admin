import { beforeEach, describe, expect, it, vi } from "vitest";
import { orders } from "../../src/api/orders";
import { navigation } from "../../src/router/navigation";
import { request } from "../../src/api/request";
import { orderStatusLabel, orderStatusTagType } from "../../src/utils/orders";

vi.mock("../../src/api/request", () => ({
  request: vi.fn(),
}));

describe("admin order contracts", () => {
  beforeEach(() => {
    vi.mocked(request).mockReset();
  });

  it("declares the order menu with its independent read permission", () => {
    expect(navigation).toContainEqual({
      path: "/order/orders",
      title: "订单管理",
      group: "交易",
      permission: "order:read",
    });
  });

  it("preserves exact query parameters and detail URL", async () => {
    vi.mocked(request).mockResolvedValue({ list: [], total: 37 });
    const signal = new AbortController().signal;

    await orders.page(
      { pageNo: 2, pageSize: 20, orderNo: "ORDER-001", userId: 7, status: 4 },
      signal,
    );
    await orders.get(11);

    expect(request).toHaveBeenNthCalledWith(1, {
      url: "/order/admin/orders",
      params: { pageNo: 2, pageSize: 20, orderNo: "ORDER-001", userId: 7, status: 4 },
      signal,
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      url: "/order/admin/orders/11",
    });
  });

  it("renders unknown statuses with the raw value", () => {
    expect(orderStatusLabel(99)).toBe("未知状态（99）");
    expect(orderStatusTagType(99)).toBe("danger");
    expect(orderStatusLabel(4)).toBe("已支付");
  });
});
