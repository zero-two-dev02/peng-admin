<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header class="app-header">
    <nav class="app-nav" aria-label="主导航">
      <RouterLink to="/">首页</RouterLink>
      <RouterLink to="/system/users">用户</RouterLink>
      <RouterLink to="/login">登录</RouterLink>
    </nav>
  </header>

  <RouterView />
</template>
