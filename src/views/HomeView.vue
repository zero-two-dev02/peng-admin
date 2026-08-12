<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  getCurrentUser,
  logout,
  type CurrentUserResponse,
  updateCurrentUserPassword,
} from '../api/auth'
import { getSystemInfo } from '../api/system'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const currentUser = ref<CurrentUserResponse | null>(null)
const message = ref('')
const isLoggingOut = ref(false)
const oldPassword = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')
const passwordMessage = ref('')
const isUpdatingPassword = ref(false)
const systemInfo = ref('')
const systemMessage = ref('')
const isLoadingSystemInfo = ref(false)

async function handleLoadSystemInfo() {
  if (isLoadingSystemInfo.value) {
    return
  }

  systemInfo.value = ''
  systemMessage.value = ''
  isLoadingSystemInfo.value = true

  try {
    const result = await getSystemInfo()

    if (result.code !== 0 || result.data === null) {
      systemMessage.value = result.message
      return
    }

    systemInfo.value = result.data
  } catch {
    systemMessage.value = 'System 服务不可达'
  } finally {
    isLoadingSystemInfo.value = false
  }
}

async function handleLoadCurrentUser() {
  const accessToken = authStore.accessToken

  if (accessToken === null) {
    currentUser.value = null
    message.value = '请先登录'
    return
  }

  message.value = ''

  try {
    const result = await getCurrentUser()

    if (result.code !== 0 || result.data === null) {
      currentUser.value = null
      message.value = result.message
      return
    }

    currentUser.value = result.data
    authStore.setPermissions(result.data.permissions)
  } catch {
    currentUser.value = null
    message.value = '无法连接服务器'
  }
}

async function handleLogout() {
  if (isLoggingOut.value) {
    return
  }

  message.value = ''
  isLoggingOut.value = true

  try {
    const result = await logout()

    if (result.code !== 0 || result.data !== true) {
      message.value = result.message
      return
    }

    authStore.clearSession()
    currentUser.value = null
    await router.replace({ name: 'login' })
  } catch {
    message.value = '无法连接服务器'
  } finally {
    isLoggingOut.value = false
  }
}

async function handleUpdatePassword() {
  if (isUpdatingPassword.value) {
    return
  }

  if (!oldPassword.value || !newPassword.value || !confirmNewPassword.value) {
    passwordMessage.value = '请完整填写旧密码、新密码和确认密码'
    return
  }

  if (oldPassword.value.length < 8 || oldPassword.value.length > 64) {
    passwordMessage.value = '旧密码长度必须为 8 到 64 位'
    return
  }

  if (newPassword.value.length < 8 || newPassword.value.length > 64) {
    passwordMessage.value = '新密码长度必须为 8 到 64 位'
    return
  }

  if (newPassword.value !== confirmNewPassword.value) {
    passwordMessage.value = '两次输入的新密码不一致'
    return
  }

  passwordMessage.value = ''
  isUpdatingPassword.value = true

  try {
    const result = await updateCurrentUserPassword({
      oldPassword: oldPassword.value,
      newPassword: newPassword.value,
    })

    if (result.code !== 0 || result.data !== true) {
      passwordMessage.value = result.message
      return
    }

    oldPassword.value = ''
    newPassword.value = ''
    confirmNewPassword.value = ''
    authStore.clearSession()
    await router.replace({
      name: 'login',
      query: { passwordUpdated: '1' },
    })
  } catch {
    passwordMessage.value = '无法连接服务器'
  } finally {
    isUpdatingPassword.value = false
  }
}

onMounted(() => {
  void handleLoadSystemInfo()
})
</script>

<template>
  <main class="home-page">
    <h1>Yudao 管理后台</h1>
    <p>Vue 3 管理端学习项目</p>

    <section class="system-status" aria-live="polite">
      <p v-if="systemInfo">System 服务正常：{{ systemInfo }}</p>
      <p v-else-if="systemMessage" class="warning-text">{{ systemMessage }}</p>
      <p v-else class="muted-text">正在检测 System 服务...</p>
      <button
        class="text-button"
        type="button"
        :disabled="isLoadingSystemInfo"
        @click="handleLoadSystemInfo"
      >
        {{ isLoadingSystemInfo ? '检测中...' : '重新检测' }}
      </button>
    </section>

    <button class="login-button" type="button" @click="handleLoadCurrentUser">
      读取当前用户
    </button>

    <button
      class="login-button"
      type="button"
      :disabled="isLoggingOut"
      @click="handleLogout"
    >
      {{ isLoggingOut ? '注销中...' : '注销登录' }}
    </button>

    <div v-if="currentUser">
      <p>当前用户 ID：{{ currentUser.userId }}</p>
      <p>权限数量：{{ currentUser.permissions.length }}</p>
    </div>

    <p v-if="message" class="form-message">{{ message }}</p>

    <form
      v-if="authStore.hasSession"
      class="login-form password-form"
      @submit.prevent="handleUpdatePassword"
    >
      <h2>修改当前用户密码</h2>
      <p class="warning-text">
        修改成功后，当前用户的全部登录状态都会失效，需要使用新密码重新登录。
      </p>

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

      <button class="login-button" type="submit" :disabled="isUpdatingPassword">
        {{ isUpdatingPassword ? '修改中...' : '修改密码' }}
      </button>

      <p v-if="passwordMessage" class="form-message">
        {{ passwordMessage }}
      </p>
    </form>
  </main>
</template>
