<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getUserPage, type UserPageItem } from '../api/users'

const pageNo = ref(1)
const pageSize = 10
const username = ref('')
const status = ref('')
const users = ref<UserPageItem[]>([])
const total = ref(0)
const message = ref('')
const isLoading = ref(false)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const canGoPrevious = computed(() => pageNo.value > 1 && !isLoading.value)
const canGoNext = computed(
  () => pageNo.value < totalPages.value && !isLoading.value,
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
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.username }}</td>
            <td>{{ user.nickname }}</td>
            <td>{{ getStatusText(user.status) }}</td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="4">{{ message || '暂无数据' }}</td>
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

    <p v-if="message && users.length > 0" class="form-message">{{ message }}</p>
  </main>
</template>
