import { createApp } from "vue";
import {
  ElAlert,
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElButton,
  ElCard,
  ElDialog,
  ElDrawer,
  ElEmpty,
  ElPagination,
  ElSkeleton,
  ElTable,
  ElTableColumn,
  ElTag,
  ElTimeline,
  ElTimelineItem,
} from "element-plus";
import "element-plus/dist/index.css";
import "./style.css";
import "./operations.css";
import App from "./App.vue";
import { setupHttpInterceptors } from "./api/setup-http-interceptors";
import router from "./router";
import pinia from "./stores";

setupHttpInterceptors();

const app = createApp(App).use(pinia).use(router);
for (const component of [
  ElAlert,
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElButton,
  ElCard,
  ElDialog,
  ElDrawer,
  ElEmpty,
  ElPagination,
  ElSkeleton,
  ElTable,
  ElTableColumn,
  ElTag,
  ElTimeline,
  ElTimelineItem,
])
  app.use(component);
app.mount("#app");
