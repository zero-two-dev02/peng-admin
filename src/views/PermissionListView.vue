<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  getPermissionList,
  type PermissionListItem,
} from '../api/permissions'

const permissions = ref<PermissionListItem[]>([])
const message = ref('')
const isLoading = ref(false)

async function loadPermissions() {
  if (isLoading.value) {
    return
  }

  message.value = ''
  isLoading.value = true

  try {
    const result = await getPermissionList()

    if (result.code !== 0 || result.data === null) {
      permissions.value = []
      message.value = result.message
      return
    }

    permissions.value = result.data
  } catch {
    permissions.value = []
    message.value = '无法连接服务器，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void loadPermissions()
})
</script>

<template>
  <main class="user-page">
    <section class="table-section">
      <header class="table-header">
        <h1>权限列表</h1>
        <button
          class="login-button"
          type="button"
          :disabled="isLoading"
          @click="loadPermissions"
        >
          {{ isLoading ? '读取中...' : '刷新' }}
        </button>
      </header>

      <table>
        <thead>
          <tr>
            <th>权限编码</th>
            <th>权限名称</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="permission in permissions" :key="permission.code">
            <td>{{ permission.code }}</td>
            <td>{{ permission.name }}</td>
          </tr>
          <tr v-if="permissions.length === 0">
            <td colspan="2">{{ message || '暂无数据' }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <p v-if="message && permissions.length > 0" class="form-message">
      {{ message }}
    </p>
  </main>
</template>
