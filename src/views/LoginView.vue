<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getCurrentUser, login } from "../api/auth";
import { useAuthStore } from "../stores/auth";

import { safeReturnPath } from "../utils/safety";
import { errorMessage } from "../utils/errors";

const username = ref("");
const password = ref("");
const route = useRoute();
const message = ref(
  route.query.passwordUpdated === "1"
    ? "密码修改成功，请使用新密码重新登录。"
    : route.query.reason === "expired"
      ? "登录已失效，请重新登录。"
      : "登录信息仅保存在内存，刷新页面后需要重新登录。",
);
const isSubmitting = ref(false);

const authStore = useAuthStore();
const router = useRouter();

async function handleSubmit() {
  if (!username.value || !password.value) {
    message.value = "请输入账号和密码。";
    return;
  }

  if (isSubmitting.value) {
    return;
  }

  message.value = "";
  isSubmitting.value = true;
  let sessionEstablished = false;

  try {
    const result = await login({
      username: username.value,
      password: password.value,
    });

    if (result.code !== 0 || result.data === null) {
      message.value = result.message;
      return;
    }

    authStore.setSession(result.data);
    sessionEstablished = true;
    const currentUserResult = await getCurrentUser();
    if (currentUserResult.code !== 0 || currentUserResult.data === null) {
      authStore.clearSession();
      message.value = currentUserResult.message;
      return;
    }

    authStore.setPermissions(currentUserResult.data.permissions);
    password.value = "";
    await router.push(safeReturnPath(route.query.returnTo));
  } catch (failure) {
    if (sessionEstablished) {
      authStore.clearSession();
    }
    message.value = errorMessage(failure);
  } finally {
    password.value = "";
    isSubmitting.value = false;
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-intro" aria-labelledby="login-intro-title">
      <RouterLink
        class="login-brand"
        to="/login"
        aria-label="Yudao 管理后台登录页"
      >
        <span class="app-brand-mark" aria-hidden="true">Y</span>
        <span>Yudao</span>
      </RouterLink>
      <div>
        <p class="login-kicker">ADMINISTRATION CONSOLE</p>
        <h1 id="login-intro-title">让运营工作清晰有序</h1>
        <p>商品、公告、库存、会员积分与支付记录，统一协作入口。</p>
      </div>
    </section>

    <section class="login-card" aria-labelledby="login-title">
      <header>
        <p class="login-kicker">欢迎回来</p>
        <h2 id="login-title">登录管理后台</h2>
        <p>请输入您的账号和密码以继续。</p>
      </header>

      <form class="login-form" @submit.prevent="handleSubmit">
        <label class="form-field">
          <span>账号</span>
          <input
            v-model.trim="username"
            type="text"
            autocomplete="username"
            required
          />
        </label>

        <label class="form-field">
          <span>密码</span>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
          />
        </label>

        <button class="login-button" type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? "登录中…" : "登录" }}
        </button>

        <p v-if="message" class="form-message" role="status" aria-live="polite">
          {{ message }}
        </p>
      </form>
    </section>
  </main>
</template>
