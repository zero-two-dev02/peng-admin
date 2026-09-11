import { test, expect, type Page } from "@playwright/test";
import { navigation } from "../../src/router/navigation";
const allPermissions = [
  ...new Set([
    ...navigation.map((item) => item.permission).filter(Boolean),
    "system:user:write",
    "system:user:role:read",
    "system:user:role:assign",
    "system:user:password:reset",
    "system:user:session:force-logout",
    "system:role:write",
    "system:role:permission:read",
    "system:role:permission:assign",
    "system:role:delete",
    "system:permission:write",
    "system:permission:delete",
    "notice:create",
    "notice:update",
    "notice:publish",
    "notice:offline",
    "notice:delete",
    "product:category:create",
    "product:category:update",
    "product:spu:create",
    "product:spu:update",
    "product:spu:archive",
    "product:spu:recover",
    "product:spu:status:update",
    "product:sku:update",
    "product:sku:status:update",
    "member:points:adjust",
    "inventory:stock:adjust",
  ]),
];
const ok = (data: unknown) => ({ code: 0, message: "success", data });
type FixtureOptions = { orderTotal?: number; orderStatus?: number };
async function fixture(
  page: Page,
  permissions = allPermissions,
  options: FixtureOptions = {},
) {
  await page.route(
    (url) => url.pathname.startsWith("/api/"),
    async (route) => {
      const path = new URL(route.request().url()).pathname.replace("/api", "");
      let data: unknown = { list: [], total: 0 };
      if (path === "/system/auth/login")
        data = {
          userId: 900001,
          accessToken: "isolated-fixture-token",
          expiresTime: "2099-01-01T00:00:00Z",
        };
      else if (path === "/system/auth/me")
        data = { userId: 900001, permissions };
      else if (path === "/system/info") data = "隔离测试服务";
      else if (path === "/system/permission/list")
        data = permissions.map((code) => ({ code, name: code }));
      else if (path === "/system/role/list")
        data = [{ code: "test_role", name: "测试角色" }];
      else if (path === "/system/user/page")
        data = {
          list: [
            {
              id: 900002,
              username: "fixture_user",
              nickname: "隔离用户",
              status: 0,
            },
          ],
          total: 1,
        };
      else if (path === "/system/user/get")
        data = {
          id: 900002,
          username: "fixture_user",
          nickname: "隔离用户",
          status: 0,
        };
      else if (path === "/system/user/role-list")
        data = [{ code: "test_role", name: "测试角色", status: 0 }];
      else if (path === "/system/role/page")
        data = {
          list: [
            { code: "test_role", name: "测试角色", status: 0, builtIn: false },
          ],
          total: 1,
        };
      else if (path === "/system/role/permission-codes") data = ["notice:read"];
      else if (path === "/product/admin/category/list")
        data = [
          { id: 800001, code: "fixture-category", name: "隔离类目", status: 1 },
        ];
      else if (path === "/payment/admin/orders")
        data = {
          list: [
            {
              id: 700001,
              paymentNo: "FIXTURE-PAY",
              orderNo: "FIXTURE-ORDER",
              amountFen: 29,
              status: 1,
            },
          ],
          total: 1,
        };
      else if (path === "/payment/admin/callback-events/reconciliation")
        data = {
          succeededPaymentCount: 2,
          callbackEventCount: 1,
          difference: 1,
        };
      else if (path === "/order/admin/orders") {
        const order = {
          id: 700101,
          orderNo: "FIXTURE-ORDER-ADMIN",
          userId: 900002,
          spuId: 800001,
          skuId: 800002,
          productName: "隔离商品",
          skuSpecification: "标准",
          unitPriceFen: 29,
          quantity: 2,
          totalPriceFen: 58,
          status: options.orderStatus ?? 4,
          createdAt: "2026-09-11T10:00:00",
          updatedAt: "2026-09-11T10:01:00",
          expiresAt: null,
          cancellationId: null,
          cancelReason: null,
          cancellationRequestedAt: null,
          cancelledAt: null,
        };
        data = {
          list: options.orderTotal === 0 ? [] : [order],
          total: options.orderTotal ?? 1,
        };
      }
      else if (path === "/order/admin/orders/700101")
        data = {
          id: 700101,
          orderNo: "FIXTURE-ORDER-ADMIN",
          userId: 900002,
          spuId: 800001,
          skuId: 800002,
          productName: "隔离商品",
          skuSpecification: "标准",
          unitPriceFen: 29,
          quantity: 2,
          totalPriceFen: 58,
          status: options.orderStatus ?? 4,
          createdAt: "2026-09-11T10:00:00",
          updatedAt: "2026-09-11T10:01:00",
          expiresAt: null,
          cancellationId: null,
          cancelReason: null,
          cancellationRequestedAt: null,
          cancelledAt: null,
        };
      else if (path === "/system/user/session-list")
        data = [{ expiresAt: "2099-01-01T00:00:00Z" }];
      if (route.request().method() !== "GET" && path !== "/system/auth/login")
        data = true;
      await route.fulfill({ json: ok(data) });
    },
  );
}
async function login(page: Page, target = "/") {
  await page.goto("/login?returnTo=" + encodeURIComponent(target));
  await page.getByLabel("账号", { exact: true }).fill("fixture_admin");
  await page.getByLabel("密码", { exact: true }).fill("Fixture-only-123");
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
test("memory login protects routes and safe return; refresh logs out", async ({
  page,
}) => {
  await fixture(page);
  await page.goto("/payment/orders");
  await expect(page).toHaveURL(/\/login\?returnTo=/);
  await login(page, "/payment/orders");
  await expect(
    page.getByRole("heading", { name: "支付单", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/login/);
});
test("no permissions has a usable landing without protected menus", async ({
  page,
}) => {
  await fixture(page, []);
  await login(page);
  await expect(
    page.getByText("当前账户暂无业务权限。您仍可管理个人安全设置。"),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "主导航" }).getByText("用户管理"),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "个人中心", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "个人中心", exact: true }),
  ).toBeVisible();
});
test("all available domain pages render and issue only public admin requests", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await fixture(page);
  await login(page);
  for (const item of navigation.filter((item) => item.path !== "/")) {
    await page
      .getByRole("navigation", { name: "主导航" })
      .getByRole("link", { name: item.title, exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(item.path + "$"));
    await expect(page.locator("#main-content h1").first()).toBeVisible();
  }
  expect(errors).toEqual([]);
});
test("payment quantity reconciliation uses truthful labels and validates range", async ({
  page,
}) => {
  await fixture(page);
  await login(page, "/payment/reconciliation");
  await page.getByLabel("开始时间").fill("2026-09-02T10:00");
  await page.getByLabel("结束时间").fill("2026-09-01T10:00");
  await page.getByRole("button", { name: "执行数量核对" }).click();
  await expect(page.getByText("开始时间不能晚于结束时间。")).toBeVisible();
  await page.getByLabel("结束时间").fill("2026-09-03T10:00");
  await page.getByRole("button", { name: "执行数量核对" }).click();
  await expect(
    page.getByRole("heading", { name: "数量差值", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "差值为零不代表金额一致、逐笔匹配或无遗漏支付。历史支付可能早于回调事件表上线。",
    ),
  ).toBeVisible();
});
test("backend unavailable is not represented as empty data", async ({
  page,
}) => {
  await fixture(page);
  await page.route("**/api/payment/admin/orders*", (route) =>
    route.fulfill({ status: 503, json: { message: "down" } }),
  );
  await login(page, "/payment/orders");
  await expect(page.getByText(/服务器返回 HTTP 503/)).toBeVisible();
  await expect(page.getByText("当前筛选条件下暂无数据")).toHaveCount(0);
  await expect(page).toHaveURL(/\/payment\/orders/);
});
test("order query uses exact filters, database total pagination and detail reread", async ({
  page,
}) => {
  await fixture(page, allPermissions, { orderTotal: 41 });
  await login(page, "/order/orders");
  await expect(
    page.getByRole("heading", { name: "订单管理", exact: true }),
  ).toBeVisible();

  await page.getByLabel("订单号", { exact: true }).fill("FIXTURE-ORDER-ADMIN");
  await page.getByLabel("用户 ID", { exact: true }).fill("900002");
  await page
    .getByRole("combobox", { name: "订单状态", exact: true })
    .selectOption("4");
  const filteredRequest = page.waitForRequest(
    (request) =>
      request.method() === "GET" &&
      request.url().includes("/order/admin/orders"),
  );
  await page.getByRole("button", { name: "查询", exact: true }).click();
  const filteredUrl = new URL((await filteredRequest).url());
  expect(filteredUrl.searchParams.get("orderNo")).toBe("FIXTURE-ORDER-ADMIN");
  expect(filteredUrl.searchParams.get("userId")).toBe("900002");
  expect(filteredUrl.searchParams.get("status")).toBe("4");
  expect(filteredUrl.searchParams.get("pageNo")).toBe("1");
  expect(filteredUrl.searchParams.get("pageSize")).toBe("20");
  await expect(page.getByText("共 41 条")).toBeVisible();

  const pageRequest = page.waitForRequest(
    (request) =>
      request.method() === "GET" &&
      new URL(request.url()).searchParams.get("pageNo") === "2",
  );
  await page.locator(".page-pagination .btn-next").click();
  await pageRequest;

  const detailRequest = page.waitForRequest(
    (request) =>
      request.method() === "GET" &&
      new URL(request.url()).pathname.endsWith("/order/admin/orders/700101"),
  );
  await page.getByRole("button", { name: "详情", exact: true }).click();
  await detailRequest;
  await expect(page.getByRole("heading", { name: "取消信息", exact: true })).toBeVisible();
  await expect(page.getByText("仅展示订单服务自身事实")).toBeVisible();
  await expect(
    page.locator("#main-content").getByRole("button", { name: /付款成功|退款|发货/ }),
  ).toHaveCount(0);
  await expect(
    page.locator("#main-content").getByRole("link", { name: /付款成功|退款|发货/ }),
  ).toHaveCount(0);
});
test("order page shows unknown status and distinct empty/error states", async ({
  page,
}) => {
  await fixture(page, allPermissions, { orderStatus: 99 });
  await login(page, "/order/orders");
  await expect(page.getByText("未知状态（99）", { exact: true })).toBeVisible();

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page).toHaveURL(/\/login/);
  await page.route("**/api/order/admin/orders*", (route) =>
    route.fulfill({ status: 503, json: { message: "down" } }),
  );
  await page.getByLabel("账号", { exact: true }).fill("fixture_admin");
  await page.getByLabel("密码", { exact: true }).fill("Fixture-only-123");
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page.getByText(/服务器返回 HTTP 503/)).toBeVisible();
  await expect(page.getByText("当前筛选条件下暂无数据")).toHaveCount(0);

  await page.unroute("**/api/order/admin/orders*");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page).toHaveURL(/\/login/);
  await page.route("**/api/order/admin/orders*", (route) =>
    route.fulfill({ json: ok({ list: [], total: 0 }) }),
  );
  await page.getByLabel("账号", { exact: true }).fill("fixture_admin");
  await page.getByLabel("密码", { exact: true }).fill("Fixture-only-123");
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page.getByText("当前筛选条件下暂无数据")).toBeVisible();
});
test("order route redirects users without order:read to 403", async ({ page }) => {
  await fixture(page, []);
  await login(page, "/order/orders");
  await expect(page).toHaveURL(/\/403$/);
});
test("auth-service outage keeps session, real invalid-token clears it", async ({
  page,
}) => {
  await fixture(page);
  await page.route("**/api/notice/admin/page*", (route) =>
    route.fulfill({
      json: { code: 1003002002, message: "认证服务暂时不可用", data: null },
    }),
  );
  await login(page, "/notice");
  await expect(page.getByText("认证服务暂时不可用")).toBeVisible();
  await expect(page).toHaveURL(/\/notice$/);
  await page.unroute("**/api/notice/admin/page*");
  await page.route("**/api/notice/admin/page*", (route) =>
    route.fulfill({
      json: { code: 1002001003, message: "登录失效", data: null },
    }),
  );
  await page.getByRole("button", { name: "重新查询" }).click();
  await expect(page).toHaveURL(/\/login/);
});
test("role relationship read failure blocks full replacement", async ({
  page,
}) => {
  await fixture(page);
  await page.route("**/api/system/user/role-list*", (route) =>
    route.fulfill({ status: 503, json: { message: "down" } }),
  );
  await login(page, "/system/users");
  await page.getByRole("button", { name: "管理用户", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "保存角色分配", exact: true }),
  ).toBeDisabled();
});
test("disabled assigned role is retained and replacement is blocked", async ({
  page,
}) => {
  await fixture(page);
  await page.route("**/api/system/user/role-list*", (route) =>
    route.fulfill({
      json: ok([{ code: "disabled_role", name: "已停用角色", status: 1 }]),
    }),
  );
  await login(page, "/system/users");
  await page.getByRole("button", { name: "管理用户", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "保存角色分配", exact: true }),
  ).toBeDisabled();
  await expect(page.getByText("已停用角色", { exact: true })).toBeVisible();
});
test("assignment requires explicit difference confirmation", async ({
  page,
}) => {
  await fixture(page);
  await login(page, "/system/roles");
  await page.getByRole("button", { name: "管理角色", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "保存权限分配", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "保存权限分配", exact: true }).click();
  await expect(page.getByText(/新增：无/)).toBeVisible();
  await page.getByRole("button", { name: "取消", exact: true }).click();
});
test("notice create and product create send contract fields", async ({
  page,
}) => {
  await fixture(page);
  await login(page, "/notice");
  await page.getByRole("button", { name: "创建公告", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("标题", { exact: true }).fill("隔离公告");
  await dialog.getByLabel("摘要", { exact: true }).fill("隔离摘要");
  await dialog
    .getByLabel("正文（纯文本）", { exact: true })
    .fill("<script>untrusted</script>");
  const noticeReq = page.waitForRequest((request) =>
    request.url().endsWith("/notice/admin/create"),
  );
  await dialog.getByRole("button", { name: "保存公告" }).click();
  expect((await noticeReq).postDataJSON()).toEqual({
    title: "隔离公告",
    summary: "隔离摘要",
    content: "<script>untrusted</script>",
  });
  await page
    .getByRole("navigation", { name: "主导航" })
    .getByRole("link", { name: "商品与规格", exact: true })
    .click();
  await page.getByRole("button", { name: "创建商品", exact: true }).click();
  const product = page.getByRole("dialog");
  await product.getByLabel("商品编码", { exact: true }).fill("fixture-spu");
  await product.getByLabel("商品名称", { exact: true }).fill("隔离商品");
  await product.getByLabel("类目 ID", { exact: true }).fill("800001");
  await product.getByLabel("SKU 编码", { exact: true }).fill("fixture-sku");
  await product.getByLabel("规格", { exact: true }).fill("标准");
  await product.getByLabel("价格（元）", { exact: true }).fill("0.29");
  const productReq = page.waitForRequest(
    (request) =>
      request.url().endsWith("/product/admin/spu") &&
      request.method() === "POST",
  );
  await product.getByRole("button", { name: "保存商品", exact: true }).click();
  expect((await productReq).postDataJSON().skus[0].priceFen).toBe(29);
});
test("stock uncertain write locks original intent and verifies before closing", async ({
  page,
}) => {
  await fixture(page);
  await page.route("**/api/inventory/admin/stock/initialize", (route) =>
    route.abort("timedout"),
  );
  await login(page, "/inventory/stocks");
  await page.getByRole("button", { name: "初始化库存", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("SKU ID", { exact: true }).fill("800001");
  await dialog.getByLabel("调整原因", { exact: true }).fill("隔离测试");
  const businessNo = await dialog
    .getByLabel("业务号（本次意图固定）")
    .inputValue();
  await dialog.getByRole("button", { name: "确认调整", exact: true }).click();
  await page.getByRole("button", { name: "确认执行", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "先查询核实" }),
  ).toBeVisible();
  await expect(dialog.getByLabel("SKU ID", { exact: true })).toBeDisabled();
  await expect(
    dialog.getByRole("button", { name: "以原业务号重试" }),
  ).toBeDisabled();
  await dialog.getByRole("button", { name: "先查询核实" }).click();
  await expect(
    dialog.getByRole("button", { name: "以原业务号重试" }),
  ).toBeEnabled();
  expect(await dialog.getByLabel("业务号（本次意图固定）").inputValue()).toBe(
    businessNo,
  );
});
for (const width of [375, 768, 1024, 1440]) {
  test("responsive workspace " + width, async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width, height: 900 });
    await fixture(page);
    await login(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width < 768) {
      await page.getByRole("button", { name: "打开导航" }).click();
      await expect(
        page.getByRole("navigation", { name: "移动导航" }),
      ).toBeVisible();
      await page.screenshot({
        path: "test-results/mobile-navigation-375.png",
        animations: "disabled",
      });
      await page
        .getByRole("dialog", { name: "导航", exact: true })
        .getByRole("button", { name: "关闭此对话框" })
        .click();
      await expect(
        page.getByRole("navigation", { name: "移动导航" }),
      ).toBeHidden();
    }
    await page.screenshot({
      path: `test-results/workbench-${width}.png`,
      fullPage: true,
      animations: "disabled",
    });
    for (const item of navigation.filter((item) => item.path !== "/")) {
      if (width < 768) {
        await page.getByRole("button", { name: "打开导航" }).click();
        await page
          .getByRole("navigation", { name: "移动导航" })
          .getByRole("link", { name: item.title, exact: true })
          .click();
      } else {
        await page
          .getByRole("navigation", { name: "主导航" })
          .getByRole("link", { name: item.title, exact: true })
          .click();
      }
      await expect(page).toHaveURL(new RegExp(item.path + "$"));
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        item.path + " overflow",
      ).toBe(true);
    }
  });
}

test("permission denial removes protected navigation and 404 is a bare page", async ({
  page,
}) => {
  await fixture(page);
  await page.route("**/api/payment/admin/orders*", (route) =>
    route.fulfill({
      json: { code: 1008002005, data: null, message: "权限已变更" },
    }),
  );
  await login(page, "/payment/orders");
  await expect(page).toHaveURL(/\/403$/);
  await expect(page.getByRole("navigation", { name: "主导航" })).toHaveCount(0);
  await page.goto("/nonexistent-fixture-path");
  await expect(page.getByText("404", { exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "主导航" })).toHaveCount(0);
});

test("category writes, member lookup, sessions and payment links use real contract shapes", async ({
  page,
}) => {
  await fixture(page);
  await login(page, "/product/categories");
  await page.getByRole("button", { name: "创建类目", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("类目编码", { exact: true })
    .fill("fixture-new-category");
  await dialog.getByLabel("名称", { exact: true }).fill("隔离新类目");
  const request = page.waitForRequest(
    (req) =>
      req.method() === "POST" && req.url().endsWith("/product/admin/category"),
  );
  await dialog.getByRole("button", { name: "保存类目", exact: true }).click();
  expect((await request).postDataJSON()).toEqual({
    code: "fixture-new-category",
    name: "隔离新类目",
  });
  await page
    .getByRole("navigation", { name: "主导航" })
    .getByRole("link", { name: "会员积分", exact: true })
    .click();
  await page.getByLabel("System 用户 ID", { exact: true }).fill("900002");
  const memberRequest = page.waitForRequest((req) =>
    req.url().includes("/member/admin/points/record-page"),
  );
  await page.getByRole("button", { name: "查询", exact: true }).click();
  expect(
    new URL((await memberRequest).url()).searchParams.get("memberUserId"),
  ).toBe("900002");
  await page
    .getByRole("navigation", { name: "主导航" })
    .getByRole("link", { name: "用户会话", exact: true })
    .click();
  await expect(page).toHaveURL(/\/system\/sessions$/);
  await expect(
    page.getByRole("heading", { name: "用户会话", exact: true }),
  ).toBeVisible();
  await page.getByLabel("System 用户 ID", { exact: true }).fill("900002");
  await page.getByRole("button", { name: "查询会话", exact: true }).click();
  await expect(page.getByText(/2099/)).toBeVisible();
  await page.getByRole("button", { name: "强制全部下线", exact: true }).click();
  await expect(page.getByText(/强制用户 900002 的全部会话下线/)).toBeVisible();
  await page.getByRole("button", { name: "取消", exact: true }).click();
  await page
    .getByRole("navigation", { name: "主导航" })
    .getByRole("link", { name: "支付单", exact: true })
    .click();
  await expect(page).toHaveURL(/\/payment\/orders$/);
  await page
    .getByRole("table")
    .getByRole("link", { name: "回调事件", exact: true })
    .click();
  await expect(page.getByLabel("支付单号", { exact: true })).toHaveValue(
    "FIXTURE-PAY",
  );
});
