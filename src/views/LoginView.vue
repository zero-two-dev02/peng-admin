<script setup lang="ts">
import { ref } from 'vue'
import { getCurrentUser, login } from '../api/auth'
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
    let sessionEstablished = false

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
        sessionEstablished = true
        const currentUserResult = await getCurrentUser()
        if (currentUserResult.code !== 0 || currentUserResult.data === null) {
            authStore.clearSession()
            message.value = currentUserResult.message
            return
        }

        authStore.setPermissions(currentUserResult.data.permissions)
        password.value = ''
        await router.push({ name: 'home' })
    } catch {
        if (sessionEstablished) {
            authStore.clearSession()
        }
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
