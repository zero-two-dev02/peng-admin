<script setup lang="ts">
import { ref } from 'vue'

const username = ref('')
const password = ref('')
const message = ref('')

function handleSubmit() {
  if (!username.value || !password.value) {
    message.value = '请输入账号和密码'
    return
  }

  message.value = `已读取账号：${username.value}`
}
</script>

<template>
  <main class="home-page">
    <form class="login-form" @submit.prevent="handleSubmit">
      <h1>登录</h1>

      <label class="form-field">
        <span>账号</span>
        <input
          v-model.trim="username"
          type="text"
          autocomplete="username"
        />
      </label>

      <label class="form-field">
        <span>密码</span>
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
        />
      </label>

      <button class="login-button" type="submit">登录</button>

      <p v-if="message" class="form-message">{{ message }}</p>
    </form>
  </main>
</template>
