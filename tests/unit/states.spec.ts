import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import QueryState from "../../src/components/QueryState.vue";
import { createPinia, setActivePinia } from "pinia";
import { useAuthStore } from "../../src/stores/auth";
describe("async UI and memory session", () => {
  it("error takes precedence over empty state", () => {
    const wrapper = mount(QueryState, {
      props: { loading: false, error: "offline", empty: true },
      global: {
        stubs: {
          ElAlert: { props: ["title"], template: "<p>{{title}}</p>" },
          ElButton: true,
          ElEmpty: true,
        },
      },
    });
    expect(wrapper.text()).toContain("offline");
    expect(wrapper.find("el-empty-stub").exists()).toBe(false);
  });
  it("clears permissions along with invalid session", () => {
    setActivePinia(createPinia());
    const auth = useAuthStore();
    auth.setSession({
      userId: 1,
      accessToken: "isolated-test",
      expiresTime: "2099-01-01",
    });
    auth.setPermissions(["notice:read"]);
    auth.clearSession();
    expect(auth.hasSession).toBe(false);
    expect(auth.permissions).toEqual([]);
  });
  it("a new app has no persisted credentials", () => {
    setActivePinia(createPinia());
    expect(useAuthStore().hasSession).toBe(false);
  });
});
