<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  getRolePage,
  getRolePermissionCodes,
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
const message = ref('')
const permissionMessage = ref('')
const isLoading = ref(false)
const isLoadingPermissions = ref(false)

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
  isLoadingPermissions.value = true

  try {
    const result = await getRolePermissionCodes(role.code)

    if (result.code !== 0 || result.data === null) {
      permissionMessage.value = result.message
      return
    }

    permissionCodes.value = result.data
  } catch {
    permissionMessage.value = '无法连接服务器，请稍后重试'
  } finally {
    isLoadingPermissions.value = false
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
    </section>

    <p v-if="message && roles.length > 0" class="form-message">{{ message }}</p>
  </main>
</template>
