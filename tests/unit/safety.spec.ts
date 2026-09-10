import { describe, expect, it } from "vitest";
import {
  canReplaceRoles,
  fenToYuan,
  localToUtcInput,
  newBusinessNo,
  replacementDiff,
  safeReturnPath,
  validateRange,
  yuanToFen,
} from "../../src/utils/safety";
describe("safe return path", () => {
  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/%2f%2fevil.example",
    "/login",
    "/login?returnTo=x",
    null,
  ])("rejects %s", (input) => expect(safeReturnPath(input)).toBe("/"));
  it("preserves internal route and query", () =>
    expect(safeReturnPath("/payment/orders?status=1")).toBe(
      "/payment/orders?status=1",
    ));
});
describe("replacement protection", () => {
  it("requires both relationships and candidates to load", () =>
    expect(canReplaceRoles(false, [])).toBe(false));
  it("blocks disabled roles", () =>
    expect(canReplaceRoles(true, [{ status: 1 }])).toBe(false));
  it("allows explicitly loaded empty roles", () =>
    expect(canReplaceRoles(true, [])).toBe(true));
  it("shows exact addition and removal", () =>
    expect(replacementDiff(["a", "b"], ["b", "c"])).toEqual({
      added: ["c"],
      removed: ["a"],
    }));
});
describe("money and time", () => {
  it.each([
    ["0.29", 29],
    ["123.45", 12345],
    ["0", 0],
    ["1.2", 120],
  ])("converts %s without floating rounding", (yuan, fen) =>
    expect(yuanToFen(yuan)).toBe(fen),
  );
  it.each(["1.234", "-1", "1e3", "NaN", "9007199254740991"])(
    "rejects invalid money %s",
    (value) => expect(() => yuanToFen(value)).toThrow(),
  );
  it("formats fen", () => expect(fenToYuan(29)).toBe("0.29"));
  it("rejects inverted time ranges", () =>
    expect(() => validateRange("2026-09-02", "2026-09-01")).toThrow());
  it("converts a known offset to UTC without suffix", () =>
    expect(localToUtcInput("2026-09-01T10:00:00+08:00")).toBe(
      "2026-09-01T02:00:00.000",
    ));
  it("business numbers fit the contract and are distinct across new intentions", () => {
    const a = newBusinessNo();
    expect(a.length).toBeLessThanOrEqual(64);
    expect(a).not.toBe(newBusinessNo());
  });
});
