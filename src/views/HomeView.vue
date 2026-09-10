<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  getCurrentUser,
  logout,
  type CurrentUserResponse,
  updateCurrentUserPassword,
} from "../api/auth";
import { getSystemInfo } from "../api/system";
import { errorMessage } from "../utils/errors";
import { confirmAction } from "../composables/useMutation";
import { useAuthStore } from "../stores/auth";

const authStore = useAuthStore();
const router = useRouter();
const currentUser = ref<CurrentUserResponse | null>(null);
const message = ref("");
const isLoggingOut = ref(false);
const oldPassword = ref("");
const newPassword = ref("");
const confirmNewPassword = ref("");
const passwordMessage = ref("");
const isUpdatingPassword = ref(false);
const systemInfo = ref("");
const systemMessage = ref("");
const isLoadingSystemInfo = ref(false);
const canReadUsers = computed(() =>
  authStore.hasPermission("system:user:read"),
);
const canReadRoles = computed(() =>
  authStore.hasPermission("system:role:read"),
);
const canReadPermissions = computed(() =>
  authStore.hasPermission("system:permission:read"),
);

async function handleLoadSystemInfo() {
  if (isLoadingSystemInfo.value) return;

  systemInfo.value = "";
  systemMessage.value = "";
  isLoadingSystemInfo.value = true;

  try {
    const result = await getSystemInfo();

    if (result.code !== 0 || result.data === null) {
      systemMessage.value = result.message;
      return;
    }

    systemInfo.value = result.data;
  } catch (failure) {
    systemMessage.value = errorMessage(failure);
  } finally {
    isLoadingSystemInfo.value = false;
  }
}

async function handleLoadCurrentUser() {
  if (authStore.accessToken === null) {
    currentUser.value = null;
    message.value = "请先登录。";
    return;
  }

  message.value = "";

  try {
    const result = await getCurrentUser();

    if (result.code !== 0 || result.data === null) {
      currentUser.value = null;
      message.value = result.message;
      return;
    }

    currentUser.value = result.data;
    authStore.setPermissions(result.data.permissions);
  } catch (failure) {
    currentUser.value = null;
    message.value = errorMessage(failure);
  }
}

async function handleLogout() {
  if (isLoggingOut.value) return;

  message.value = "";
  isLoggingOut.value = true;

  try {
    const result = await logout();

    if (result.code !== 0 || result.data !== true) {
      message.value = result.message;
      return;
    }

    authStore.clearSession();
    currentUser.value = null;
    await router.replace({ name: "login" });
  } catch (failure) {
    message.value = errorMessage(failure);
  } finally {
    isLoggingOut.value = false;
  }
}

async function handleUpdatePassword() {
  if (isUpdatingPassword.value) return;

  if (!oldPassword.value || !newPassword.value || !confirmNewPassword.value) {
    passwordMessage.value = "请完整填写旧密码、新密码和确认密码。";
    return;
  }

  if (oldPassword.value.length < 8 || oldPassword.value.length > 64) {
    passwordMessage.value = "旧密码长度必须为 8 到 64 位。";
    return;
  }

  if (newPassword.value.length < 8 || newPassword.value.length > 64) {
    passwordMessage.value = "新密码长度必须为 8 到 64 位。";
    return;
  }

  if (newPassword.value !== confirmNewPassword.value) {
    passwordMessage.value = "两次输入的新密码不一致。";
    return;
  }

  passwordMessage.value = "";
  isUpdatingPassword.value = true;
  if (!(await confirmAction("确认修改自己的密码？全部登录会话会立即失效。"))) {
    isUpdatingPassword.value = false;
    return;
  }

  try {
    const result = await updateCurrentUserPassword({
      oldPassword: oldPassword.value,
      newPassword: newPassword.value,
    });

    if (result.code !== 0 || result.data !== true) {
      passwordMessage.value = result.message;
      return;
    }

    oldPassword.value = "";
    newPassword.value = "";
    confirmNewPassword.value = "";
    authStore.clearSession();
    await router.replace({
      name: "login",
      query: { passwordUpdated: "1" },
    });
  } catch (failure) {
    passwordMessage.value = errorMessage(failure);
  } finally {
    oldPassword.value = "";
    newPassword.value = "";
    confirmNewPassword.value = "";
    isUpdatingPassword.value = false;
  }
}

onMounted(() => {
  void handleLoadSystemInfo();
});
</script>

<template>
  <main class="dashboard-page">
    <header class="dashboard-hero">
      <div>
        <p class="dashboard-kicker">工作台</p>
        <h1>个人中心</h1>
        <p>在一个清晰的入口查看服务状态、账户权限与安全设置。</p>
      </div>
      <button
        class="secondary-button"
        type="button"
        :disabled="isLoadingSystemInfo"
        @click="handleLoadSystemInfo"
      >
        {{ isLoadingSystemInfo ? "检测中…" : "刷新服务状态" }}
      </button>
    </header>

    <section class="dashboard-stat-grid" aria-label="系统概览">
      <article class="dashboard-stat-card">
        <p class="dashboard-stat-label">System 服务</p>
        <strong v-if="systemInfo" class="status-badge status-badge-success"
          >运行正常</strong
        >
        <strong
          v-else-if="systemMessage"
          class="status-badge status-badge-warning"
          >需要关注</strong
        >
        <strong v-else class="status-badge status-badge-neutral"
          >正在检测</strong
        >
        <p v-if="systemInfo" class="dashboard-card-detail">{{ systemInfo }}</p>
        <p v-else-if="systemMessage" class="dashboard-card-detail">
          {{ systemMessage }}
        </p>
        <p v-else class="dashboard-card-detail">正在连接 System 服务…</p>
      </article>

      <article class="dashboard-stat-card">
        <p class="dashboard-stat-label">当前账户</p>
        <strong class="dashboard-stat-value">
          {{ currentUser?.userId ?? authStore.userId ?? "未读取" }}
        </strong>
        <p class="dashboard-card-detail">账户 ID</p>
      </article>

      <article class="dashboard-stat-card">
        <p class="dashboard-stat-label">已加载权限</p>
        <strong class="dashboard-stat-value">
          {{ currentUser?.permissions.length ?? authStore.permissions.length }}
        </strong>
        <p class="dashboard-card-detail">用于前端菜单与操作提示</p>
      </article>
    </section>

    <section class="dashboard-grid">
      <article class="dashboard-panel">
        <header class="dashboard-panel-header">
          <div>
            <p class="dashboard-kicker">账户</p>
            <h2>账户与会话</h2>
          </div>
          <button
            class="text-button"
            type="button"
            @click="handleLoadCurrentUser"
          >
            刷新账户信息
          </button>
        </header>
        <dl class="account-summary">
          <div>
            <dt>账户 ID</dt>
            <dd>{{ currentUser?.userId ?? authStore.userId ?? "未读取" }}</dd>
          </div>
          <div>
            <dt>权限数量</dt>
            <dd>
              {{
                currentUser?.permissions.length ?? authStore.permissions.length
              }}
            </dd>
          </div>
        </dl>
        <p
          v-if="message"
          class="form-message dashboard-message"
          role="status"
          aria-live="polite"
        >
          {{ message }}
        </p>
        <button
          class="danger-button dashboard-danger-button"
          type="button"
          :disabled="isLoggingOut"
          @click="handleLogout"
        >
          {{ isLoggingOut ? "注销中…" : "注销登录" }}
        </button>
      </article>

      <article class="dashboard-panel">
        <header class="dashboard-panel-header">
          <div>
            <p class="dashboard-kicker">快捷入口</p>
            <h2>系统管理</h2>
          </div>
        </header>
        <nav class="dashboard-shortcuts" aria-label="系统管理快捷入口">
          <RouterLink v-if="canReadUsers" to="/system/users"
            >用户管理</RouterLink
          >
          <RouterLink v-if="canReadRoles" to="/system/roles"
            >角色管理</RouterLink
          >
          <RouterLink v-if="canReadPermissions" to="/system/permissions">
            权限管理
          </RouterLink>
          <p
            v-if="!canReadUsers && !canReadRoles && !canReadPermissions"
            class="muted-text"
          >
            当前账户暂无可访问的管理模块。
          </p>
        </nav>
      </article>
    </section>

    <section
      v-if="authStore.hasSession"
      class="dashboard-panel dashboard-security-panel"
    >
      <header class="dashboard-panel-header">
        <div>
          <p class="dashboard-kicker">安全设置</p>
          <h2>修改当前账户密码</h2>
        </div>
      </header>
      <p class="warning-text">
        修改成功后，当前用户的全部登录状态都会失效，需要使用新密码重新登录。
      </p>

      <form
        class="dashboard-password-form"
        @submit.prevent="handleUpdatePassword"
      >
        <label class="form-field">
          <span>旧密码</span>
          <input
            v-model="oldPassword"
            type="password"
            autocomplete="current-password"
            minlength="8"
            maxlength="64"
            required
          />
        </label>
        <label class="form-field">
          <span>新密码</span>
          <input
            v-model="newPassword"
            type="password"
            autocomplete="new-password"
            minlength="8"
            maxlength="64"
            required
          />
        </label>
        <label class="form-field">
          <span>确认新密码</span>
          <input
            v-model="confirmNewPassword"
            type="password"
            autocomplete="new-password"
            minlength="8"
            maxlength="64"
            required
          />
        </label>
        <div class="dashboard-password-actions">
          <button
            class="login-button"
            type="submit"
            :disabled="isUpdatingPassword"
          >
            {{ isUpdatingPassword ? "修改中…" : "修改密码" }}
          </button>
          <p
            v-if="passwordMessage"
            class="form-message"
            role="status"
            aria-live="polite"
          >
            {{ passwordMessage }}
          </p>
        </div>
      </form>
    </section>
  </main>
</template>
