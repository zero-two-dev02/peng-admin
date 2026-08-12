<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
const canReadUsers = computed(() => authStore.hasPermission('system:user:read'))
const canReadRoles = computed(() => authStore.hasPermission('system:role:read'))
const canReadPermissions = computed(() =>
  authStore.hasPermission('system:permission:read'),
)
</script>

<template>
  <header class="app-header">
    <nav class="app-nav" aria-label="主导航">
      <RouterLink to="/">首页</RouterLink>
      <RouterLink v-if="canReadUsers" to="/system/users">用户</RouterLink>
      <RouterLink v-if="canReadRoles" to="/system/roles">角色</RouterLink>
      <RouterLink v-if="canReadPermissions" to="/system/permissions">权限</RouterLink>
      <RouterLink to="/login">登录</RouterLink>
    </nav>
  </header>

  <RouterView />
</template>
