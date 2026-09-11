export function orderStatusLabel(status: number): string {
  return (
    {
      0: "创建中",
      1: "待支付",
      2: "取消中",
      3: "已取消",
      4: "已支付",
      5: "支付确认中",
    }[status] ?? `未知状态（${status}）`
  );
}

export function orderStatusTagType(
  status: number,
): "success" | "warning" | "danger" | "info" {
  if (status === 4) return "success";
  if (status === 3) return "info";
  if (status === 2 || status === 5) return "warning";
  if (status === 0 || status === 1) return "warning";
  return "danger";
}
