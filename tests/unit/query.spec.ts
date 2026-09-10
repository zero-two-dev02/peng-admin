import { effectScope } from "vue";
import { describe, expect, it } from "vitest";
import { useQuery } from "../../src/composables/useQuery";
describe("latest query wins", () => {
  it("old response never overwrites new filters", async () => {
    const resolvers: ((value: string) => void)[] = [];
    const scope = effectScope();
    const query = scope.run(() =>
      useQuery(() => new Promise<string>((resolve) => resolvers.push(resolve))),
    )!;
    const first = query.load();
    const second = query.load();
    resolvers[1]!("new");
    await second;
    resolvers[0]!("old");
    await first;
    expect(query.data.value).toBe("new");
    expect(query.loading.value).toBe(false);
    scope.stop();
  });
  it("failed query has an error, not a fake empty list", async () => {
    const scope = effectScope();
    const query = scope.run(() =>
      useQuery(async () => {
        throw new Error("unavailable");
      }),
    )!;
    await query.load();
    expect(query.error.value).toBe("unavailable");
    expect(query.data.value).toBeUndefined();
    scope.stop();
  });
});
