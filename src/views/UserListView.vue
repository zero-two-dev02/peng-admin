<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getRoleList, type RoleListItem } from '../api/roles'
import {
  assignUserRoles,
  getUserPage,
  getUserRoles,
  updateUser,
  type UserPageItem,
  type UserRoleItem,
} from '../api/users'

const pageNo = ref(1)
const pageSize = 10
const username = ref('')
const status = ref('')
const users = ref<UserPageItem[]>([])
const total = ref(0)
const selectedUser = ref<UserPageItem | null>(null)
const userRoles = ref<UserRoleItem[]>([])
const roleOptions = ref<RoleListItem[]>([])
const selectedRoleCodes = ref<string[]>([])
const editNickname = ref('')
const editStatus = ref('0')
const message = ref('')
const roleMessage = ref('')
const editMessage = ref('')
const assignMessage = ref('')
const isLoading = ref(false)
const isLoadingRoles = ref(false)
const isUpdatingUser = ref(false)
const isAssigningRoles = ref(false)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const canGoPrevious = computed(() => pageNo.value > 1 && !isLoading.value)
const canGoNext = computed(
  () => pageNo.value < totalPages.value && !isLoading.value,
)
const disabledAssignedRoles = computed(() =>
  userRoles.value.filter((role) => role.status !== 0),
)
const canSubmitRoles = computed(
  () =>
    selectedUser.value !== null &&
    disabledAssignedRoles.value.length === 0 &&
    !isAssigningRoles.value,
)

function getStatusText(userStatus: number) {
  return userStatus === 0 ? '启用' : '停用'
}

async function loadUsers() {
  if (isLoading.value) {
    return
  }

  message.value = ''
  isLoading.value = true

  try {
    const result = await getUserPage({
      pageNo: pageNo.value,
      pageSize,
      username: username.value || undefined,
      status: status.value === '' ? undefined : Number(status.value),
    })

    if (result.code !== 0 || result.data === null) {
      users.value = []
      total.value = 0
      message.value = result.message
      return
    }

    users.value = result.data.list
    total.value = result.data.total
  } catch {
    users.value = []
    total.value = 0
    message.value = '无法连接服务器，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

async function loadRoleOptions() {
  const result = await getRoleList()

  if (result.code !== 0 || result.data === null) {
    assignMessage.value = result.message
    roleOptions.value = []
    return
  }

  roleOptions.value = result.data
}

async function handleViewRoles(user: UserPageItem) {
  selectedUser.value = user
  userRoles.value = []
  roleMessage.value = ''
  editMessage.value = ''
  assignMessage.value = ''
  editNickname.value = user.nickname
  editStatus.value = String(user.status)
  isLoadingRoles.value = true

  try {
    const result = await getUserRoles(user.id)

    if (result.code !== 0 || result.data === null) {
      roleMessage.value = result.message
      selectedRoleCodes.value = []
      return
    }

    userRoles.value = result.data
    selectedRoleCodes.value = result.data
      .filter((role) => role.status === 0)
      .map((role) => role.code)
    await loadRoleOptions()
  } catch {
    roleMessage.value = '无法连接服务器，请稍后重试'
  } finally {
    isLoadingRoles.value = false
  }
}

async function handleUpdateUser() {
  if (selectedUser.value === null || isUpdatingUser.value) {
    return
  }

  editMessage.value = ''
  isUpdatingUser.value = true

  try {
    const result = await updateUser({
      id: selectedUser.value.id,
      nickname: editNickname.value,
      status: Number(editStatus.value),
    })

    if (result.code !== 0 || result.data !== true) {
      editMessage.value = result.message
      return
    }

    editMessage.value = '用户信息已更新'
    selectedUser.value = {
      ...selectedUser.value,
      nickname: editNickname.value,
      status: Number(editStatus.value),
    }
    await loadUsers()
  } catch {
    editMessage.value = '无法连接服务器，请稍后重试'
  } finally {
    isUpdatingUser.value = false
  }
}

async function handleAssignRoles() {
  if (!canSubmitRoles.value || selectedUser.value === null) {
    return
  }

  assignMessage.value = ''
  isAssigningRoles.value = true

  try {
    const result = await assignUserRoles({
      id: selectedUser.value.id,
      roleCodes: selectedRoleCodes.value,
    })

    if (result.code !== 0 || result.data !== true) {
      assignMessage.value = result.message
      return
    }

    await handleViewRoles(selectedUser.value)
    assignMessage.value = '用户角色已保存'
  } catch {
    assignMessage.value = '无法连接服务器，请稍后重试'
  } finally {
    isAssigningRoles.value = false
  }
}

function handleSearch() {
  pageNo.value = 1
  void loadUsers()
}

function handlePreviousPage() {
  if (!canGoPrevious.value) {
    return
  }

  pageNo.value -= 1
  void loadUsers()
}

function handleNextPage() {
  if (!canGoNext.value) {
    return
  }

  pageNo.value += 1
  void loadUsers()
}

onMounted(() => {
  void loadUsers()
})
</script>

<template>
  <main class="user-page">
    <section class="page-toolbar" aria-label="用户筛选">
      <label>
        用户名
        <input v-model.trim="username" type="text" placeholder="输入用户名" />
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
        <h1>用户列表</h1>
        <p>共 {{ total }} 条</p>
      </header>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>用户名</th>
            <th>昵称</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.username }}</td>
            <td>{{ user.nickname }}</td>
            <td>{{ getStatusText(user.status) }}</td>
            <td>
              <button
                class="text-button"
                type="button"
                @click="handleViewRoles(user)"
              >
                查看角色
              </button>
            </td>
          </tr>
          <tr v-if="users.length === 0">
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

    <section v-if="selectedUser" class="detail-panel">
      <header class="table-header">
        <h2>{{ selectedUser.username }} 的角色</h2>
        <p>用户 ID：{{ selectedUser.id }}</p>
      </header>

      <p v-if="isLoadingRoles" class="muted-text">读取中...</p>
      <p v-else-if="roleMessage" class="form-message">{{ roleMessage }}</p>

      <table v-else>
        <thead>
          <tr>
            <th>角色编码</th>
            <th>角色名称</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="role in userRoles" :key="role.code">
            <td>{{ role.code }}</td>
            <td>{{ role.name }}</td>
            <td>{{ getStatusText(role.status) }}</td>
          </tr>
          <tr v-if="userRoles.length === 0">
            <td colspan="3">暂无角色</td>
          </tr>
        </tbody>
      </table>

      <form class="inline-form" @submit.prevent="handleUpdateUser">
        <h3>更新基本信息</h3>
        <label>
          昵称
          <input v-model.trim="editNickname" type="text" />
        </label>
        <label>
          状态
          <select v-model="editStatus">
            <option value="0">启用</option>
            <option value="1">停用</option>
          </select>
        </label>
        <button class="login-button" type="submit" :disabled="isUpdatingUser">
          {{ isUpdatingUser ? '保存中...' : '保存用户信息' }}
        </button>
        <p v-if="editMessage" class="form-message">{{ editMessage }}</p>
      </form>

      <form class="inline-form" @submit.prevent="handleAssignRoles">
        <h3>分配角色</h3>
        <p v-if="disabledAssignedRoles.length > 0" class="warning-text">
          当前用户存在停用角色，页面不会提交角色变更，避免完整替换时隐式移除这些角色。
        </p>
        <div class="checkbox-grid">
          <label v-for="role in roleOptions" :key="role.code">
            <input
              v-model="selectedRoleCodes"
              type="checkbox"
              :value="role.code"
              :disabled="disabledAssignedRoles.length > 0"
            />
            {{ role.name }}（{{ role.code }}）
          </label>
        </div>
        <button class="login-button" type="submit" :disabled="!canSubmitRoles">
          {{ isAssigningRoles ? '保存中...' : '保存角色分配' }}
        </button>
        <p v-if="assignMessage" class="form-message">{{ assignMessage }}</p>
      </form>
    </section>

    <p v-if="message && users.length > 0" class="form-message">{{ message }}</p>
  </main>
</template>
