import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import pinia from "../stores";
import { useAuthStore } from "../stores/auth";
import { navigation } from "./navigation";
import { safeReturnPath } from "../utils/safety";
const pages = {
  "/": () => import("../views/WorkbenchView.vue"),
  "/account": () => import("../views/HomeView.vue"),
  "/system/users": () => import("../views/UserListView.vue"),
  "/system/roles": () => import("../views/RoleListView.vue"),
  "/system/permissions": () => import("../views/PermissionListView.vue"),
  "/system/sessions": () => import("../views/SessionView.vue"),
  "/system/audits": () => import("../views/AuditView.vue"),
  "/notice": () => import("../views/notice/NoticeView.vue"),
  "/notice/audits": () => import("../views/AuditView.vue"),
  "/product/categories": () => import("../views/product/CategoryView.vue"),
  "/product/spu": () => import("../views/product/SpuView.vue"),
  "/member/points": () => import("../views/member/PointsView.vue"),
  "/inventory/stocks": () => import("../views/inventory/StockView.vue"),
  "/inventory/records": () => import("../views/inventory/StockRecordView.vue"),
  "/inventory/reservations": () =>
    import("../views/inventory/ReservationView.vue"),
  "/payment/orders": () => import("../views/payment/OrdersView.vue"),
  "/payment/audits": () => import("../views/AuditView.vue"),
  "/payment/callback-events": () => import("../views/payment/EventsView.vue"),
  "/payment/reconciliation": () =>
    import("../views/payment/ReconciliationView.vue"),
};
const routes: RouteRecordRaw[] = navigation.map((item) => ({
  path: item.path,
  name: item.path === "/" ? "home" : item.path,
  component: pages[item.path],
  props: item.path.endsWith("/audits")
    ? { domain: item.path.split("/")[1] }
    : undefined,
  meta: {
    requiresAuth: true,
    requiredPermission: item.permission,
    title: item.title,
  },
}));
routes.push(
  {
    path: "/login",
    name: "login",
    component: () => import("../views/LoginView.vue"),
    meta: { bare: true, title: "登录" },
  },
  {
    path: "/403",
    name: "forbidden",
    component: () => import("../views/ErrorView.vue"),
    props: { code: "403" },
    meta: { bare: true, title: "无权限" },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("../views/ErrorView.vue"),
    props: { code: "404" },
    meta: { bare: true, title: "页面不存在" },
  },
);
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});
router.beforeEach((to) => {
  const auth = useAuthStore(pinia);
  if (to.meta.requiresAuth && !auth.hasSession)
    return { name: "login", query: { returnTo: safeReturnPath(to.fullPath) } };
  if (
    typeof to.meta.requiredPermission === "string" &&
    to.meta.requiredPermission &&
    !auth.hasPermission(to.meta.requiredPermission)
  )
    return { name: "forbidden" };
  if (to.name === "login" && auth.hasSession) return { name: "home" };
});
router.afterEach((to) => {
  document.title = `${String(to.meta.title ?? "页面")} · Yudao`;
});
export default router;
