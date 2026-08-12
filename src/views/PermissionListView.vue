<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  deletePermission,
  getPermissionList,
  updatePermission,
  type PermissionListItem,
} from '../api/permissions'

const permissions = ref<PermissionListItem[]>([])
const message = ref('')
const isLoading = ref(false)
const selectedPermission = ref<PermissionListItem | null>(null)
const editName = ref('')
const editMessage = ref('')
const deleteMessage = ref('')
const isUpdatingPermission = ref(false)
const isDeletingPermission = ref(false)

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

function handleSelectPermission(permission: PermissionListItem) {
  selectedPermission.value = permission
  editName.value = permission.name
  editMessage.value = ''
  deleteMessage.value = ''
}

async function handleUpdatePermission() {
  if (selectedPermission.value === null || isUpdatingPermission.value) return
  editMessage.value = ''
  isUpdatingPermission.value = true
  try {
    const result = await updatePermission({ code: selectedPermission.value.code, name: editName.value })
    if (result.code !== 0 || result.data !== true) {
      editMessage.value = result.message
      return
    }
    selectedPermission.value = { ...selectedPermission.value, name: editName.value }
    editMessage.value = '权限名称已保存。'
    await loadPermissions()
  } catch {
    editMessage.value = '无法连接服务器，请稍后重试。'
  } finally {
    isUpdatingPermission.value = false
  }
}

async function handleDeletePermission() {
  if (selectedPermission.value === null || isDeletingPermission.value) return
  if (!window.confirm(`确认永久删除权限 ${selectedPermission.value.code} 吗？此操作不可恢复。`)) return
  deleteMessage.value = ''
  isDeletingPermission.value = true
  try {
    const result = await deletePermission(selectedPermission.value.code)
    if (result.code !== 0 || result.data !== true) {
      deleteMessage.value = result.message
      return
    }
    selectedPermission.value = null
    await loadPermissions()
  } catch {
    deleteMessage.value = '无法连接服务器，请稍后重试。'
  } finally {
    isDeletingPermission.value = false
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
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="permission in permissions" :key="permission.code">
            <td>{{ permission.code }}</td>
            <td>{{ permission.name }}</td>
            <td><button class="text-button" type="button" @click="handleSelectPermission(permission)">编辑</button></td>
          </tr>
          <tr v-if="permissions.length === 0">
            <td colspan="3">{{ message || '暂无数据' }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section v-if="selectedPermission" class="detail-panel">
      <header class="table-header">
        <h2>编辑权限</h2>
        <p>{{ selectedPermission.code }}</p>
      </header>
      <form class="inline-form" @submit.prevent="handleUpdatePermission">
        <label>权限名称<input v-model.trim="editName" type="text" maxlength="64" /></label>
        <p class="muted-text">权限编码只用于鉴权定位，不能修改。</p>
        <button class="login-button" type="submit" :disabled="isUpdatingPermission">{{ isUpdatingPermission ? '保存中...' : '保存权限名称' }}</button>
        <p v-if="editMessage" class="form-message">{{ editMessage }}</p>
      </form>
      <section class="inline-form">
        <h3>删除权限</h3>
        <p class="warning-text">仅能删除未被角色引用的自定义权限；内置权限会被后端拒绝。</p>
        <button class="danger-button" type="button" :disabled="isDeletingPermission" @click="handleDeletePermission">{{ isDeletingPermission ? '删除中...' : '永久删除权限' }}</button>
        <p v-if="deleteMessage" class="form-message">{{ deleteMessage }}</p>
      </section>
    </section>

    <p v-if="message && permissions.length > 0" class="form-message">
      {{ message }}
    </p>
  </main>
</template>
