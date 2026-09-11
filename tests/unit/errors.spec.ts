import { describe, expect, it } from "vitest";
import { AxiosError, CanceledError } from "axios";
import {
  businessError,
  errorMessage,
  normalizeError,
} from "../../src/utils/errors";
describe("error classification", () => {
  it("only actual invalid-token code invalidates auth", () =>
    expect(businessError(1002001003, "expired").kind).toBe("authentication"));
  it.each([1003002002, 1004002002, 1005002002, 1006002002, 1008002004])(
    "keeps session for service failure %s",
    (code) => expect(businessError(code, "unavailable").kind).toBe("business"),
  );
  it.each([
    1002002001, 1002001004, 1003002001, 1004002001, 1006002001, 1007002006,
    1008002005,
  ])("classifies denied %s", (code) =>
    expect(businessError(code, "denied").kind).toBe("permission"),
  );
  it("distinguishes cancellation", () =>
    expect(normalizeError(new CanceledError()).kind).toBe("cancelled"));
  it("write timeout is uncertain and warns against repeated creation", () => {
    const error = new AxiosError("timeout", "ECONNABORTED", {
      method: "post",
    } as never);
    expect(normalizeError(error).uncertain).toBe(true);
    expect(errorMessage(error)).toContain("先查询核实");
  });
  it("read network failure is not empty data or logged out", () => {
    const result = normalizeError(new AxiosError("network", "ERR_NETWORK"));
    expect(result.kind).toBe("network");
    expect(result.uncertain).toBe(false);
  });
  it("409 business conflict retains its message", () =>
    expect(
      errorMessage(businessError(1004003006, "商品数据已变化，请刷新后重试")),
    ).toContain("刷新"));
});
