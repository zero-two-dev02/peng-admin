<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  getCurrentUser,
  logout,
  type CurrentUserResponse,
} from '../api/auth'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const currentUser = ref<CurrentUserResponse | null>(null)
const message = ref('')
const isLoggingOut = ref(false)

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
</script>

<template>
  <main class="home-page">
    <h1>Yudao 管理后台</h1>
    <p>Vue 3 管理端学习项目</p>

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
  </main>
</template>
