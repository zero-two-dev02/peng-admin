<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { getCurrentUser } from "../api/auth";
import { useAuthStore } from "../stores/auth";
import { errorMessage } from "../utils/errors";
defineProps<{ code: string }>();
const auth = useAuthStore();
const router = useRouter();
const loading = ref(false);
const error = ref("");
async function refresh() {
  if (loading.value) return;
  loading.value = true;
  try {
    const result = await getCurrentUser();
    if (result.data) auth.setPermissions(result.data.permissions);
    await router.push("/");
  } catch (failure) {
    error.value = errorMessage(failure);
  } finally {
    loading.value = false;
  }
}
</script>
<template>
  <main class="standalone-state">
    <p class="eyebrow">YUDAO</p>
    <h1>{{ code }}</h1>
    <h2>{{ code === "403" ? "您暂时无权访问此功能" : "页面不存在" }}</h2>
    <p>
      {{
        code === "403"
          ? "授权以服务端为准。权限变更后可重新读取账户信息。"
          : "请检查地址，或返回工作台。"
      }}
    </p>
    <RouterLink :to="auth.hasSession ? '/' : '/login'"
      >返回{{ auth.hasSession ? "工作台" : "登录页" }}</RouterLink
    ><el-button
      v-if="code === '403' && auth.hasSession"
      :loading="loading"
      @click="refresh"
      >刷新权限</el-button
    >
    <p v-if="error" role="alert">{{ error }}</p>
  </main>
</template>
