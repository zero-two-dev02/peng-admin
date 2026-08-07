<script setup lang="ts">
import { ref } from 'vue'
import {
  getCurrentUser,
  type CurrentUserResponse,
} from '../api/auth'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const currentUser = ref<CurrentUserResponse | null>(null)
const message = ref('')

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
</script>

<template>
  <main class="home-page">
    <h1>Yudao 管理后台</h1>
    <p>Vue 3 管理端学习项目</p>

    <button class="login-button" type="button" @click="handleLoadCurrentUser">
      读取当前用户
    </button>

    <div v-if="currentUser">
      <p>当前用户 ID：{{ currentUser.userId }}</p>
      <p>权限数量：{{ currentUser.permissions.length }}</p>
    </div>

    <p v-if="message" class="form-message">{{ message }}</p>
  </main>
</template>
