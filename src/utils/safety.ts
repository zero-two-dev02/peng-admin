export function safeReturnPath(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u001f]/.test(value)
  )
    return "/";
  try {
    const decoded = decodeURIComponent(value);
    if (
      decoded.startsWith("//") ||
      /[\\\u0000-\u001f]/.test(decoded) ||
      /^\/login(?:[/?#]|$)/.test(decoded)
    )
      return "/";
  } catch {
    return "/";
  }
  return value;
}
export function replacementDiff(before: string[], after: string[]) {
  return {
    added: after.filter((value) => !before.includes(value)),
    removed: before.filter((value) => !after.includes(value)),
  };
}
export function replacementSummary(before: string[], after: string[]) {
  const diff = replacementDiff(before, after);
  return `新增：${diff.added.join("、") || "无"}\n移除：${diff.removed.join("、") || "无"}\n本次将完整替换原有关系。确认继续？`;
}
export function canReplaceRoles(loaded: boolean, roles: { status: number }[]) {
  return loaded && roles.every((role) => role.status === 0);
}
export function newBusinessNo() {
  return `ADMIN-${crypto.randomUUID()}`;
}
export function yuanToFen(value: string): number {
  if (!/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(value))
    throw new Error("金额须为非负数，最多两位小数。");
  const [whole = "0", fraction = ""] = value.split(".");
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(result)) throw new Error("金额超过安全整数范围。");
  return result;
}
export function fenToYuan(value: number): string {
  if (!Number.isSafeInteger(value)) return "金额超出显示范围";
  return `${Math.trunc(value / 100)}.${String(Math.abs(value % 100)).padStart(2, "0")}`;
}
// Notice scheduling is evaluated against the Notice service's explicit UTC Clock.
export function localToUtcInput(value: string): string {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime()))
    throw new Error("请选择有效时间。");
  return date.toISOString().slice(0, 23);
}
export function validateRange(begin?: string, end?: string) {
  if (begin && end && begin > end)
    throw new Error("开始时间不能晚于结束时间。");
}
export function displayTime(
  value: string | null | undefined,
  utc = false,
): string {
  if (!value) return "—";
  if (!utc) return value.replace("T", " ");
  const date = new Date(
    /[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`,
  );
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("zh-CN", { hour12: false });
}
