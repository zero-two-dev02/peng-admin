<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getPermissionList, type PermissionListItem } from '../api/permissions'
import { useAuthStore } from '../stores/auth'
import {
  assignRolePermissions,
  createRole,
  deleteRole,
  getRolePage,
  getRolePermissionCodes,
  getRoleUserPage,
  updateRole,
  type RolePageItem,
  type RoleUserPageItem,
} from '../api/roles'

const pageNo = ref(1)
const pageSize = 10
const code = ref('')
const status = ref('')
const createCode = ref('')
const createName = ref('')
const roles = ref<RolePageItem[]>([])
const total = ref(0)
const selectedRole = ref<RolePageItem | null>(null)
const permissionCodes = ref<string[]>([])
const permissionOptions = ref<PermissionListItem[]>([])
const selectedPermissionCodes = ref<string[]>([])
const roleUsers = ref<RoleUserPageItem[]>([])
const roleUserPageNo = ref(1)
const roleUserTotal = ref(0)
const editName = ref('')
const editStatus = ref('0')
const message = ref('')
const permissionMessage = ref('')
const editMessage = ref('')
const assignMessage = ref('')
const deleteMessage = ref('')
const createMessage = ref('')
const isLoading = ref(false)
const isLoadingPermissions = ref(false)
const isLoadingRoleUsers = ref(false)
const isUpdatingRole = ref(false)
const isAssigningPermissions = ref(false)
const isDeletingRole = ref(false)
const isCreatingRole = ref(false)
const authStore = useAuthStore()

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const roleUserTotalPages = computed(() =>
  Math.max(1, Math.ceil(roleUserTotal.value / pageSize)),
)
const canGoPrevious = computed(() => pageNo.value > 1 && !isLoading.value)
const canGoNext = computed(
  () => pageNo.value < totalPages.value && !isLoading.value,
)
const canWriteRoles = computed(() => authStore.hasPermission('system:role:write'))
const canReadRolePermissions = computed(() =>
  authStore.hasPermission('system:role:permission:read'),
)
const canAssignRolePermissions = computed(() =>
  authStore.hasPermission('system:role:permission:assign'),
)
const canDeleteRoles = computed(() =>
  authStore.hasPermission('system:role:delete'),
)
const canManageRole = computed(
  () =>
    canReadRolePermissions.value ||
    canWriteRoles.value ||
    canAssignRolePermissions.value ||
    canDeleteRoles.value,
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

async function handleCreateRole() {
  if (isCreatingRole.value) {
    return
  }

  createMessage.value = ''
  isCreatingRole.value = true

  try {
    const result = await createRole({
      code: createCode.value,
      name: createName.value,
    })

    if (result.code !== 0 || result.data === null) {
      createMessage.value = result.message
      return
    }

    const createdCode = createCode.value
    createCode.value = ''
    createName.value = ''
    code.value = createdCode
    pageNo.value = 1
    await loadRoles()

    const createdRole = roles.value.find((role) => role.code === createdCode)
    if (createdRole) {
      await handleViewPermissions(createdRole)
    }
    createMessage.value = `角色 ${createdCode} 已创建，默认启用且未分配权限。`
  } catch {
    createMessage.value = '无法连接服务器，请稍后重试。'
  } finally {
    isCreatingRole.value = false
  }
}

async function handleViewPermissions(role: RolePageItem) {
  selectedRole.value = role
  permissionCodes.value = []
  roleUsers.value = []
  roleUserPageNo.value = 1
  roleUserTotal.value = 0
  permissionMessage.value = ''
  editMessage.value = ''
  assignMessage.value = ''
  deleteMessage.value = ''
  editName.value = role.name
  editStatus.value = String(role.status)
  isLoadingPermissions.value = true
  void loadRoleUsers()

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

async function loadRoleUsers() {
  if (selectedRole.value === null || isLoadingRoleUsers.value) {
    return
  }

  isLoadingRoleUsers.value = true

  try {
    const result = await getRoleUserPage({
      roleCode: selectedRole.value.code,
      pageNo: roleUserPageNo.value,
      pageSize,
    })

    if (result.code !== 0 || result.data === null) {
      roleUsers.value = []
      roleUserTotal.value = 0
      return
    }

    roleUsers.value = result.data.list
    roleUserTotal.value = result.data.total
  } catch {
    roleUsers.value = []
    roleUserTotal.value = 0
  } finally {
    isLoadingRoleUsers.value = false
  }
}

function handlePreviousRoleUserPage() {
  if (roleUserPageNo.value <= 1 || isLoadingRoleUsers.value) {
    return
  }

  roleUserPageNo.value -= 1
  void loadRoleUsers()
}

function handleNextRoleUserPage() {
  if (
    roleUserPageNo.value >= roleUserTotalPages.value ||
    isLoadingRoleUsers.value
  ) {
    return
  }

  roleUserPageNo.value += 1
  void loadRoleUsers()
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
    createMessage.value = ''
    selectedRole.value = null
    permissionCodes.value = []
    roleUsers.value = []
    roleUserTotal.value = 0
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
    <section v-if="canWriteRoles" class="detail-panel">
      <form class="inline-form" @submit.prevent="handleCreateRole">
        <h1>创建自定义角色</h1>
        <p class="muted-text">新角色默认启用且不含权限；创建后可在下方单独分配权限。</p>
        <label>
          角色编码
          <input
            v-model.trim="createCode"
            type="text"
            minlength="3"
            maxlength="64"
            pattern="[a-z][a-z0-9_-]*"
            placeholder="例如 auditor"
            required
          />
        </label>
        <label>
          角色名称
          <input v-model.trim="createName" type="text" maxlength="64" required />
        </label>
        <button class="login-button" type="submit" :disabled="isCreatingRole">
          {{ isCreatingRole ? '创建中...' : '创建角色' }}
        </button>
        <p v-if="createMessage" class="form-message">{{ createMessage }}</p>
      </form>
    </section>

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
                v-if="canManageRole"
                class="text-button"
                type="button"
                @click="handleViewPermissions(role)"
              >
                管理角色
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

      <form v-if="canWriteRoles" class="inline-form" @submit.prevent="handleUpdateRole">
        <h3>更新角色信息</h3>
        <label>角色名称<input v-model.trim="editName" type="text" maxlength="64" /></label>
        <label>状态<select v-model="editStatus"><option value="0">启用</option><option value="1">停用</option></select></label>
        <button class="login-button" type="submit" :disabled="isUpdatingRole">{{ isUpdatingRole ? '保存中...' : '保存角色信息' }}</button>
        <p v-if="editMessage" class="form-message">{{ editMessage }}</p>
      </form>

      <form v-if="canAssignRolePermissions" class="inline-form" @submit.prevent="handleAssignPermissions">
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

      <section v-if="canDeleteRoles" class="inline-form">
        <h3>角色成员</h3>
        <p v-if="isLoadingRoleUsers" class="muted-text">读取中...</p>
        <table v-else>
          <thead>
            <tr>
              <th>ID</th>
              <th>用户名</th>
              <th>昵称</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in roleUsers" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.username }}</td>
              <td>{{ user.nickname }}</td>
              <td>{{ getStatusText(user.status) }}</td>
            </tr>
            <tr v-if="roleUsers.length === 0">
              <td colspan="4">暂无成员</td>
            </tr>
          </tbody>
        </table>
        <footer class="pagination">
          <button
            type="button"
            :disabled="roleUserPageNo <= 1 || isLoadingRoleUsers"
            @click="handlePreviousRoleUserPage"
          >
            上一页
          </button>
          <span>第 {{ roleUserPageNo }} / {{ roleUserTotalPages }} 页</span>
          <button
            type="button"
            :disabled="roleUserPageNo >= roleUserTotalPages || isLoadingRoleUsers"
            @click="handleNextRoleUserPage"
          >
            下一页
          </button>
        </footer>
      </section>

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
