<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";
import { useAuthStore } from "./stores/auth";
import { navigation } from "./router/navigation";
import { ElConfigProvider } from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
const auth = useAuthStore();
const route = useRoute();
const mobileOpen = ref(false);
const visible = computed(() =>
  navigation.filter(
    (item) => !item.permission || auth.hasPermission(item.permission),
  ),
);
const groups = computed(() => [
  ...new Set(visible.value.map((item) => item.group)),
]);
const bare = computed(() => !auth.hasSession || route.meta.bare);
watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false;
  },
);
</script>
<template>
  <ElConfigProvider :locale="zhCn">
    <RouterView v-if="bare" />
    <div v-else class="ops-shell">
      <a class="skip-link" href="#main-content">跳到主要内容</a>
      <aside class="ops-sidebar">
        <RouterLink to="/" class="app-brand"
          ><span class="app-brand-mark">Y</span
          ><span
            ><strong>Yudao</strong><small>运营管理中心</small></span
          ></RouterLink
        >
        <nav aria-label="主导航">
          <section v-for="group in groups" :key="group">
            <p class="app-nav-label">{{ group }}</p>
            <RouterLink
              v-for="item in visible.filter((item) => item.group === group)"
              :key="item.path"
              :to="item.path"
              >{{ item.title }}</RouterLink
            >
          </section>
        </nav>
        <p class="sidebar-note">真实业务 · 最小权限</p>
      </aside>
      <el-drawer
        v-model="mobileOpen"
        title="导航"
        direction="ltr"
        size="min(300px, 90vw)"
        class="mobile-navigation"
      >
        <nav aria-label="移动导航">
          <section v-for="group in groups" :key="group">
            <h3>{{ group }}</h3>
            <RouterLink
              v-for="item in visible.filter((item) => item.group === group)"
              :key="item.path"
              :to="item.path"
              >{{ item.title }}</RouterLink
            >
          </section>
        </nav>
      </el-drawer>
      <section class="ops-workspace">
        <header class="ops-header">
          <el-button
            class="mobile-menu-button"
            aria-label="打开导航"
            @click="mobileOpen = true"
            >菜单</el-button
          ><el-breadcrumb separator="/"
            ><el-breadcrumb-item :to="{ path: '/' }"
              >运营中心</el-breadcrumb-item
            ><el-breadcrumb-item>{{
              route.meta.title
            }}</el-breadcrumb-item></el-breadcrumb
          ><RouterLink class="app-account-link" to="/account"
            >账户 {{ auth.userId }}</RouterLink
          >
        </header>
        <main id="main-content" class="ops-content" tabindex="-1">
          <RouterView :key="route.path" />
        </main>
      </section>
    </div>
  </ElConfigProvider>
</template>
