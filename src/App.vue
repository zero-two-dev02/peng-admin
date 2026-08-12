<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const isLoginPage = computed(() => route.name === 'login')
const canReadUsers = computed(() => authStore.hasPermission('system:user:read'))
const canReadRoles = computed(() => authStore.hasPermission('system:role:read'))
const canReadPermissions = computed(() =>
  authStore.hasPermission('system:permission:read'),
)
</script>

<template>
  <a v-if="!isLoginPage" class="skip-link" href="#main-content">跳到主要内容</a>

  <RouterView v-if="isLoginPage" />

  <div v-else class="app-shell">
    <aside class="app-sidebar">
      <RouterLink class="app-brand" to="/" aria-label="Yudao 管理后台首页">
        <span class="app-brand-mark" aria-hidden="true">Y</span>
        <span>
          <strong>Yudao</strong>
          <small>管理后台</small>
        </span>
      </RouterLink>

      <nav class="app-nav" aria-label="主导航">
        <p class="app-nav-label">工作台</p>
        <RouterLink to="/">概览</RouterLink>

        <template v-if="canReadUsers || canReadRoles || canReadPermissions">
          <p class="app-nav-label">系统管理</p>
          <RouterLink v-if="canReadUsers" to="/system/users">用户管理</RouterLink>
          <RouterLink v-if="canReadRoles" to="/system/roles">角色管理</RouterLink>
          <RouterLink v-if="canReadPermissions" to="/system/permissions">
            权限管理
          </RouterLink>
        </template>
      </nav>
    </aside>

    <section class="app-workspace">
      <header class="app-header">
        <div>
          <p class="app-header-eyebrow">Yudao Administration</p>
          <p class="app-header-title">系统管理控制台</p>
        </div>
        <RouterLink class="app-account-link" to="/">账户与安全</RouterLink>
      </header>

      <div id="main-content" class="app-content" tabindex="-1">
        <RouterView />
      </div>
    </section>
  </div>
</template>
