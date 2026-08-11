<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getRoleList, type RoleListItem } from '../api/roles'

const roles = ref<RoleListItem[]>([])
const message = ref('')
const isLoading = ref(false)

async function loadRoles() {
  if (isLoading.value) {
    return
  }

  message.value = ''
  isLoading.value = true

  try {
    const result = await getRoleList()

    if (result.code !== 0 || result.data === null) {
      roles.value = []
      message.value = result.message
      return
    }

    roles.value = result.data
  } catch {
    roles.value = []
    message.value = '无法连接服务器，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void loadRoles()
})
</script>

<template>
  <main class="user-page">
    <section class="table-section">
      <header class="table-header">
        <h1>角色列表</h1>
        <button
          class="login-button"
          type="button"
          :disabled="isLoading"
          @click="loadRoles"
        >
          {{ isLoading ? '读取中...' : '刷新' }}
        </button>
      </header>

      <table>
        <thead>
          <tr>
            <th>角色编码</th>
            <th>角色名称</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="role in roles" :key="role.code">
            <td>{{ role.code }}</td>
            <td>{{ role.name }}</td>
          </tr>
          <tr v-if="roles.length === 0">
            <td colspan="2">{{ message || '暂无数据' }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <p v-if="message && roles.length > 0" class="form-message">{{ message }}</p>
  </main>
</template>
