<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getPermissionList, type PermissionListItem } from '../api/permissions'
import {
  assignRolePermissions,
  deleteRole,
  getRolePage,
  getRolePermissionCodes,
  updateRole,
  type RolePageItem,
} from '../api/roles'

const pageNo = ref(1)
const pageSize = 10
const code = ref('')
const status = ref('')
const roles = ref<RolePageItem[]>([])
const total = ref(0)
const selectedRole = ref<RolePageItem | null>(null)
const permissionCodes = ref<string[]>([])
const permissionOptions = ref<PermissionListItem[]>([])
const selectedPermissionCodes = ref<string[]>([])
const editName = ref('')
const editStatus = ref('0')
const message = ref('')
const permissionMessage = ref('')
const editMessage = ref('')
const assignMessage = ref('')
const deleteMessage = ref('')
const isLoading = ref(false)
const isLoadingPermissions = ref(false)
const isUpdatingRole = ref(false)
const isAssigningPermissions = ref(false)
const isDeletingRole = ref(false)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const canGoPrevious = computed(() => pageNo.value > 1 && !isLoading.value)
const canGoNext = computed(
  () => pageNo.value < totalPages.value && !isLoading.value,
)

function getStatusText(roleStatus: number) {
  return roleStatus === 0 ? '启用' : '停用'
}

function getBuiltInText(builtIn: boolean) {
  return builtIn ? '内置' : '自定义'
}

async function loadRoles() {
  if (isLoading.value) {
    return
  }

  message.value = ''
  isLoading.value = true

  try {
    const result = await getRolePage({
      pageNo: pageNo.value,
      pageSize,
      code: code.value || undefined,
      status: status.value === '' ? undefined : Number(status.value),
    })

    if (result.code !== 0 || result.data === null) {
      roles.value = []
      total.value = 0
      message.value = result.message
      return
    }

    roles.value = result.data.list
    total.value = result.data.total
  } catch {
    roles.value = []
    total.value = 0
    message.value = '无法连接服务器，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

async function handleViewPermissions(role: RolePageItem) {
  selectedRole.value = role
  permissionCodes.value = []
  permissionMessage.value = ''
  editMessage.value = ''
  assignMessage.value = ''
  deleteMessage.value = ''
  editName.value = role.name
  editStatus.value = String(role.status)
  isLoadingPermissions.value = true

  try {
    const result = await getRolePermissionCodes(role.code)

    if (result.code !== 0 || result.data === null) {
      permissionMessage.value = result.message
      return
    }

    permissionCodes.value = result.data
    selectedPermissionCodes.value = [...result.data]
    const permissionResult = await getPermissionList()
    if (permissionResult.code !== 0 || permissionResult.data === null) {
      assignMessage.value = permissionResult.message
      return
    }
    permissionOptions.value = permissionResult.data
  } catch {
    permissionMessage.value = '无法连接服务器，请稍后重试'
  } finally {
    isLoadingPermissions.value = false
  }
}

async function handleUpdateRole() {
  if (selectedRole.value === null || isUpdatingRole.value) return
  editMessage.value = ''
  isUpdatingRole.value = true
  try {
    const result = await updateRole({
      roleCode: selectedRole.value.code,
      name: editName.value,
      status: Number(editStatus.value),
    })
    if (result.code !== 0 || result.data !== true) {
      editMessage.value = result.message
      return
    }
    selectedRole.value = { ...selectedRole.value, name: editName.value, status: Number(editStatus.value) }
    editMessage.value = '角色信息已保存。'
    await loadRoles()
  } catch {
    editMessage.value = '无法连接服务器，请稍后重试。'
  } finally {
    isUpdatingRole.value = false
  }
}

async function handleAssignPermissions() {
  if (selectedRole.value === null || isAssigningPermissions.value) return
  if (!window.confirm(`确认保存角色 ${selectedRole.value.code} 的完整权限集合吗？未勾选的现有权限会被移除。`)) return
  assignMessage.value = ''
  isAssigningPermissions.value = true
  try {
    const result = await assignRolePermissions({ roleCode: selectedRole.value.code, permissionCodes: selectedPermissionCodes.value })
    if (result.code !== 0 || result.data !== true) {
      assignMessage.value = result.message
      return
    }
    permissionCodes.value = [...selectedPermissionCodes.value]
    assignMessage.value = '角色权限已保存。'
  } catch {
    assignMessage.value = '无法连接服务器，请稍后重试。'
  } finally {
    isAssigningPermissions.value = false
  }
}

async function handleDeleteRole() {
  if (selectedRole.value === null || isDeletingRole.value) return
  if (!window.confirm(`确认永久删除角色 ${selectedRole.value.code} 吗？此操作不可恢复。`)) return
  deleteMessage.value = ''
  isDeletingRole.value = true
  try {
    const result = await deleteRole(selectedRole.value.code)
    if (result.code !== 0 || result.data !== true) {
      deleteMessage.value = result.message
      return
    }
    selectedRole.value = null
    permissionCodes.value = []
    await loadRoles()
  } catch {
    deleteMessage.value = '无法连接服务器，请稍后重试。'
  } finally {
    isDeletingRole.value = false
  }
}

function handleSearch() {
  pageNo.value = 1
  void loadRoles()
}

function handlePreviousPage() {
  if (!canGoPrevious.value) {
    return
  }

  pageNo.value -= 1
  void loadRoles()
}

function handleNextPage() {
  if (!canGoNext.value) {
    return
  }

  pageNo.value += 1
  void loadRoles()
}

onMounted(() => {
  void loadRoles()
})
</script>

<template>
  <main class="user-page">
    <section class="page-toolbar" aria-label="角色筛选">
      <label>
        角色编码
        <input v-model.trim="code" type="text" placeholder="输入角色编码" />
      </label>

      <label>
        状态
        <select v-model="status">
          <option value="">全部</option>
          <option value="0">启用</option>
          <option value="1">停用</option>
        </select>
      </label>

      <button
        class="login-button"
        type="button"
        :disabled="isLoading"
        @click="handleSearch"
      >
        {{ isLoading ? '读取中...' : '查询' }}
      </button>
    </section>

    <section class="table-section">
      <header class="table-header">
        <h1>角色列表</h1>
        <p>共 {{ total }} 条</p>
      </header>

      <table>
        <thead>
          <tr>
            <th>角色编码</th>
            <th>角色名称</th>
            <th>状态</th>
            <th>类型</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="role in roles" :key="role.code">
            <td>{{ role.code }}</td>
            <td>{{ role.name }}</td>
            <td>{{ getStatusText(role.status) }}</td>
            <td>{{ getBuiltInText(role.builtIn) }}</td>
            <td>
              <button
                class="text-button"
                type="button"
                @click="handleViewPermissions(role)"
              >
                查看权限
              </button>
            </td>
          </tr>
          <tr v-if="roles.length === 0">
            <td colspan="5">{{ message || '暂无数据' }}</td>
          </tr>
        </tbody>
      </table>

      <footer class="pagination">
        <button type="button" :disabled="!canGoPrevious" @click="handlePreviousPage">
          上一页
        </button>
        <span>第 {{ pageNo }} / {{ totalPages }} 页</span>
        <button type="button" :disabled="!canGoNext" @click="handleNextPage">
          下一页
        </button>
      </footer>
    </section>

    <section v-if="selectedRole" class="detail-panel">
      <header class="table-header">
        <h2>{{ selectedRole.name }} 的权限</h2>
        <p>共 {{ permissionCodes.length }} 项</p>
      </header>

      <p v-if="isLoadingPermissions" class="muted-text">读取中...</p>
      <p v-else-if="permissionMessage" class="form-message">
        {{ permissionMessage }}
      </p>
      <div v-else class="tag-list">
        <span v-for="permissionCode in permissionCodes" :key="permissionCode">
          {{ permissionCode }}
        </span>
        <span v-if="permissionCodes.length === 0">暂无权限</span>
      </div>

      <form class="inline-form" @submit.prevent="handleUpdateRole">
        <h3>更新角色信息</h3>
        <label>角色名称<input v-model.trim="editName" type="text" maxlength="64" /></label>
        <label>状态<select v-model="editStatus"><option value="0">启用</option><option value="1">停用</option></select></label>
        <button class="login-button" type="submit" :disabled="isUpdatingRole">{{ isUpdatingRole ? '保存中...' : '保存角色信息' }}</button>
        <p v-if="editMessage" class="form-message">{{ editMessage }}</p>
      </form>

      <form class="inline-form" @submit.prevent="handleAssignPermissions">
        <h3>分配权限</h3>
        <p class="warning-text">保存会整体替换此角色当前拥有的权限。</p>
        <div class="checkbox-grid">
          <label v-for="permission in permissionOptions" :key="permission.code">
            <input v-model="selectedPermissionCodes" type="checkbox" :value="permission.code" />
            {{ permission.name }}（{{ permission.code }}）
          </label>
        </div>
        <button class="login-button" type="submit" :disabled="isAssigningPermissions">{{ isAssigningPermissions ? '保存中...' : '保存权限分配' }}</button>
        <p v-if="assignMessage" class="form-message">{{ assignMessage }}</p>
      </form>

      <section class="inline-form">
        <h3>删除角色</h3>
        <p class="warning-text">仅能删除未关联用户的自定义角色；内置角色会被后端拒绝。</p>
        <button class="danger-button" type="button" :disabled="isDeletingRole" @click="handleDeleteRole">{{ isDeletingRole ? '删除中...' : '永久删除角色' }}</button>
        <p v-if="deleteMessage" class="form-message">{{ deleteMessage }}</p>
      </section>
    </section>

    <p v-if="message && roles.length > 0" class="form-message">{{ message }}</p>
  </main>
</template>
