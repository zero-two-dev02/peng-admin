<script setup lang="ts">
import { ref } from 'vue'
import { login } from '../api/auth'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const username = ref('')
const password = ref('')
const message = ref('')
const isSubmitting = ref(false)

const authStore = useAuthStore()
const router = useRouter()

async function handleSubmit() {
    if (!username.value || !password.value) {
        message.value = '请输入账号和密码'
        return
    }

    if (isSubmitting.value) {
        return
    }

    message.value = ''
    isSubmitting.value = true

    try {
        const result = await login({
            username: username.value,
            password: password.value,
        })

        if (result.code !== 0 || result.data === null) {
            message.value = result.message
            return
        }

        authStore.setSession(result.data)
        password.value = ''
        await router.push({ name: 'home' })
    } catch {
        message.value = '无法连接服务器，请稍后重试'
    } finally {
        isSubmitting.value = false
    }
}
</script>

<template>
    <main class="home-page">
        <form class="login-form" @submit.prevent="handleSubmit">
            <h1>登录</h1>

            <label class="form-field">
                <span>账号</span>
                <input v-model.trim="username" type="text" autocomplete="username" />
            </label>

            <label class="form-field">
                <span>密码</span>
                <input v-model="password" type="password" autocomplete="current-password" />
            </label>

            <button class="login-button" type="submit" :disabled="isSubmitting">
                {{ isSubmitting ? '登录中...' : '登录' }}
            </button>

            <p v-if="message" class="form-message">{{ message }}</p>
        </form>
    </main>
</template>
