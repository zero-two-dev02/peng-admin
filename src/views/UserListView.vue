<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { getRoleList, type RoleListItem } from "../api/roles";
import { errorMessage } from "../utils/errors";
import { confirmAction } from "../composables/useMutation";
import { useAuthStore } from "../stores/auth";
import {
  assignUserRoles,
  createUser,
  deleteUser,
  getUser,
  getUserPage,
  getUserRoles,
  resetUserPassword,
  updateUser,
  type UserPageItem,
  type UserRoleItem,
} from "../api/users";

import PageHeader from "../components/PageHeader.vue";
import { replacementSummary, canReplaceRoles } from "../utils/safety";
const relationsLoaded = ref(false);
const createOpen = ref(false);
const pageNo = ref(1);
const pageSize = 10;
const username = ref("");
const status = ref("");
const createUsername = ref("");
const createNickname = ref("");
const createPassword = ref("");
const users = ref<UserPageItem[]>([]);
const total = ref(0);
const selectedUser = ref<UserPageItem | null>(null);
const userRoles = ref<UserRoleItem[]>([]);
const roleOptions = ref<RoleListItem[]>([]);
const selectedRoleCodes = ref<string[]>([]);
const editNickname = ref("");
const editStatus = ref("0");
const resetPassword = ref("");
const message = ref("");
const roleMessage = ref("");
const editMessage = ref("");
const assignMessage = ref("");
const passwordMessage = ref("");
const createMessage = ref("");
const deleteMessage = ref("");
const isLoading = ref(false);
const isLoadingRoles = ref(false);
const isUpdatingUser = ref(false);
const isAssigningRoles = ref(false);
const isResettingPassword = ref(false);
const isCreatingUser = ref(false);
const isDeletingUser = ref(false);
const authStore = useAuthStore();

const totalPages = computed(() =>
  Math.max(1, Math.ceil(total.value / pageSize)),
);
const canGoPrevious = computed(() => pageNo.value > 1 && !isLoading.value);
const canGoNext = computed(
  () => pageNo.value < totalPages.value && !isLoading.value,
);
const disabledAssignedRoles = computed(() =>
  userRoles.value.filter((role) => role.status !== 0),
);
const canSubmitRoles = computed(
  () =>
    selectedUser.value !== null &&
    canReplaceRoles(relationsLoaded.value, userRoles.value) &&
    !isLoadingRoles.value &&
    !isAssigningRoles.value,
);
const canReadUserRoles = computed(() =>
  authStore.hasPermission("system:user:role:read"),
);
const canWriteUsers = computed(() =>
  authStore.hasPermission("system:user:write"),
);
const canAssignUserRoles = computed(() =>
  authStore.hasPermission("system:user:role:assign"),
);
const canResetUserPassword = computed(() =>
  authStore.hasPermission("system:user:password:reset"),
);
const canManageUser = computed(
  () =>
    canReadUserRoles.value ||
    canWriteUsers.value ||
    canAssignUserRoles.value ||
    canResetUserPassword.value,
);

function getStatusText(userStatus: number) {
  return userStatus === 0 ? "启用" : "停用";
}

async function loadUsers() {
  if (isLoading.value) {
    return;
  }

  message.value = "";
  isLoading.value = true;

  try {
    const result = await getUserPage({
      pageNo: pageNo.value,
      pageSize,
      username: username.value || undefined,
      status: status.value === "" ? undefined : Number(status.value),
    });

    if (result.code !== 0 || result.data === null) {
      users.value = [];
      total.value = 0;
      message.value = result.message;
      return;
    }

    users.value = result.data.list;
    total.value = result.data.total;
  } catch (failure) {
    users.value = [];
    total.value = 0;
    message.value = errorMessage(failure);
  } finally {
    isLoading.value = false;
  }
}

async function handleCreateUser() {
  if (isCreatingUser.value) {
    return;
  }

  createMessage.value = "";
  isCreatingUser.value = true;

  try {
    const result = await createUser({
      username: createUsername.value,
      nickname: createNickname.value,
      password: createPassword.value,
    });

    if (result.code !== 0 || result.data === null) {
      createMessage.value = result.message;
      return;
    }

    const createdUsername = createUsername.value;
    createUsername.value = "";
    createNickname.value = "";
    createPassword.value = "";
    createOpen.value = false;
    username.value = createdUsername;
    pageNo.value = 1;
    await loadUsers();
    createMessage.value = `用户 ${createdUsername} 已创建，默认启用。`;
  } catch (failure) {
    createMessage.value = errorMessage(failure);
  } finally {
    createPassword.value = "";
    isCreatingUser.value = false;
  }
}

async function loadRoleOptions() {
  const result = await getRoleList();

  if (result.code !== 0 || result.data === null) {
    assignMessage.value = result.message;
    roleOptions.value = [];
    return;
  }

  roleOptions.value = result.data;
  relationsLoaded.value = true;
}

async function handleViewRoles(user: UserPageItem) {
  if (
    isLoadingRoles.value ||
    isUpdatingUser.value ||
    isAssigningRoles.value ||
    isResettingPassword.value ||
    isDeletingUser.value
  )
    return;
  relationsLoaded.value = false;
  roleOptions.value = [];
  selectedRoleCodes.value = [];
  resetPassword.value = "";
  selectedUser.value = user;
  userRoles.value = [];
  roleMessage.value = "";
  editMessage.value = "";
  assignMessage.value = "";
  passwordMessage.value = "";
  editNickname.value = user.nickname;
  editStatus.value = String(user.status);
  isLoadingRoles.value = true;

  try {
    const userResult = await getUser(user.id);

    if (userResult.code !== 0 || userResult.data === null) {
      message.value = userResult.message;
      selectedUser.value = null;
      return;
    }

    selectedUser.value = userResult.data;
    editNickname.value = userResult.data.nickname;
    editStatus.value = String(userResult.data.status);

    if (!canReadUserRoles.value) {
      roleMessage.value = "没有角色关系读取权限，已禁止完整替换。";
      return;
    }
    const result = await getUserRoles(user.id);

    if (result.code !== 0 || result.data === null) {
      roleMessage.value = result.message;
      selectedRoleCodes.value = [];
      return;
    }

    userRoles.value = result.data;
    selectedRoleCodes.value = result.data
      .filter((role) => role.status === 0)
      .map((role) => role.code);
    if (authStore.hasPermission("system:role:read")) await loadRoleOptions();
    else assignMessage.value = "没有角色目录读取权限，不能安全分配。";
  } catch (failure) {
    roleMessage.value = errorMessage(failure);
  } finally {
    isLoadingRoles.value = false;
  }
}

async function handleUpdateUser() {
  if (selectedUser.value === null || isUpdatingUser.value) {
    return;
  }

  editMessage.value = "";
  isUpdatingUser.value = true;

  try {
    const result = await updateUser({
      id: selectedUser.value.id,
      nickname: editNickname.value,
      status: Number(editStatus.value),
    });

    if (result.code !== 0 || result.data !== true) {
      editMessage.value = result.message;
      return;
    }

    editMessage.value = "用户信息已更新";
    selectedUser.value = {
      ...selectedUser.value,
      nickname: editNickname.value,
      status: Number(editStatus.value),
    };
    await loadUsers();
  } catch (failure) {
    editMessage.value = errorMessage(failure);
  } finally {
    isUpdatingUser.value = false;
  }
}

async function handleAssignRoles() {
  if (!canSubmitRoles.value || selectedUser.value === null) {
    return;
  }

  assignMessage.value = "";
  isAssigningRoles.value = true;
  if (
    !(await confirmAction(
      replacementSummary(
        userRoles.value.map((role) => role.code),
        selectedRoleCodes.value,
      ),
    ))
  ) {
    isAssigningRoles.value = false;
    return;
  }

  try {
    const result = await assignUserRoles({
      id: selectedUser.value.id,
      roleCodes: selectedRoleCodes.value,
    });

    if (result.code !== 0 || result.data !== true) {
      assignMessage.value = result.message;
      return;
    }

    relationsLoaded.value = false;
    const refreshed = await getUserRoles(selectedUser.value.id);
    if (refreshed.data) {
      userRoles.value = refreshed.data;
      selectedRoleCodes.value = refreshed.data.map((role) => role.code);
      relationsLoaded.value = true;
    }
    assignMessage.value = "用户角色已保存";
  } catch (failure) {
    relationsLoaded.value = false;
    assignMessage.value = errorMessage(failure) + " 请重新加载用户关系。";
  } finally {
    isAssigningRoles.value = false;
  }
}

async function handleResetPassword() {
  if (
    selectedUser.value === null ||
    isResettingPassword.value ||
    resetPassword.value.length < 8
  ) {
    return;
  }

  isResettingPassword.value = true;
  if (
    !(await confirmAction(
      `确认重置用户 ${selectedUser.value.username} 的密码吗？该用户当前登录态将立即失效。`,
    ))
  ) {
    isResettingPassword.value = false;
    return;
  }

  passwordMessage.value = "";
  isResettingPassword.value = true;

  try {
    const result = await resetUserPassword({
      id: selectedUser.value.id,
      password: resetPassword.value,
    });

    if (result.code !== 0 || result.data !== true) {
      passwordMessage.value = result.message;
      return;
    }

    resetPassword.value = "";
    passwordMessage.value = "密码已重置，用户需要使用新密码重新登录。";
  } catch (failure) {
    passwordMessage.value = errorMessage(failure);
  } finally {
    resetPassword.value = "";
    isResettingPassword.value = false;
  }
}

async function handleDeleteUser() {
  if (selectedUser.value === null || isDeletingUser.value) {
    return;
  }

  isDeletingUser.value = true;
  if (
    !(await confirmAction(
      `确认永久删除用户 ${selectedUser.value.username} 吗？此操作不可恢复；请先确保该用户不再分配任何角色。`,
    ))
  ) {
    isDeletingUser.value = false;
    return;
  }

  deleteMessage.value = "";
  isDeletingUser.value = true;

  try {
    const result = await deleteUser(selectedUser.value.id);

    if (result.code !== 0 || result.data !== true) {
      deleteMessage.value = result.message;
      return;
    }

    createMessage.value = "";
    selectedUser.value = null;
    userRoles.value = [];
    selectedRoleCodes.value = [];
    await loadUsers();
  } catch (failure) {
    deleteMessage.value = errorMessage(failure);
  } finally {
    isDeletingUser.value = false;
  }
}

function handleSearch() {
  pageNo.value = 1;
  void loadUsers();
}

function handlePreviousPage() {
  if (!canGoPrevious.value) {
    return;
  }

  pageNo.value -= 1;
  void loadUsers();
}

function handleNextPage() {
  if (!canGoNext.value) {
    return;
  }

  pageNo.value += 1;
  void loadUsers();
}

onMounted(() => {
  void loadUsers();
});
</script>

<template>
  <main class="user-page management-page">
    <PageHeader
      title="用户管理"
      description="身份、角色与会话分别授权；危险操作只用于明确的目标用户。"
      ><el-button v-if="canWriteUsers" type="primary" @click="createOpen = true"
        >创建用户</el-button
      ></PageHeader
    >
    <el-dialog
      v-model="createOpen"
      title="创建用户"
      width="min(640px, 94vw)"
      :close-on-click-modal="false"
      :show-close="!isCreatingUser"
      :close-on-press-escape="!isCreatingUser"
      @closed="createPassword = ''"
    >
      <section v-if="canWriteUsers" class="detail-panel create-panel">
        <form class="inline-form" @submit.prevent="handleCreateUser">
          <h1>创建用户</h1>
          <p class="muted-text">
            新用户默认启用且未分配角色。密码仅用于本次提交，创建后不会回显。
          </p>
          <label>
            用户名
            <input
              v-model.trim="createUsername"
              type="text"
              minlength="4"
              maxlength="32"
              pattern="[A-Za-z0-9_]+"
              placeholder="4-32 位字母、数字或下划线"
              required
            />
          </label>
          <label>
            昵称
            <input
              v-model.trim="createNickname"
              type="text"
              maxlength="64"
              required
            />
          </label>
          <label>
            初始密码
            <input
              v-model="createPassword"
              type="password"
              minlength="8"
              maxlength="64"
              autocomplete="new-password"
              required
            />
          </label>
          <button class="login-button" type="submit" :disabled="isCreatingUser">
            {{ isCreatingUser ? "创建中..." : "创建用户" }}
          </button>
          <p v-if="createMessage" class="form-message">{{ createMessage }}</p>
        </form>
      </section>
    </el-dialog>
    <section class="page-toolbar management-filter-panel" aria-label="用户筛选">
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
        {{ isLoading ? "读取中..." : "查询" }}
      </button>
    </section>

    <section class="table-section management-table-panel">
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
            <td>
              <span
                :class="
                  user.status === 0
                    ? 'status-badge status-badge-success'
                    : 'status-badge status-badge-neutral'
                "
              >
                {{ getStatusText(user.status) }}
              </span>
            </td>
            <td>
              <button
                v-if="canManageUser"
                class="text-button"
                type="button"
                :disabled="
                  isLoadingRoles ||
                  isUpdatingUser ||
                  isAssigningRoles ||
                  isResettingPassword ||
                  isDeletingUser
                "
                @click="handleViewRoles(user)"
              >
                管理用户
              </button>
            </td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="5">{{ message || "暂无数据" }}</td>
          </tr>
        </tbody>
      </table>

      <footer class="pagination">
        <button
          type="button"
          :disabled="!canGoPrevious"
          @click="handlePreviousPage"
        >
          上一页
        </button>
        <span>第 {{ pageNo }} / {{ totalPages }} 页</span>
        <button type="button" :disabled="!canGoNext" @click="handleNextPage">
          下一页
        </button>
      </footer>
    </section>

    <el-drawer
      :model-value="selectedUser !== null"
      title="用户管理"
      size="min(760px, 94vw)"
      :close-on-click-modal="false"
      :show-close="
        !isLoadingRoles &&
        !isUpdatingUser &&
        !isAssigningRoles &&
        !isResettingPassword &&
        !isDeletingUser
      "
      :close-on-press-escape="
        !isLoadingRoles &&
        !isUpdatingUser &&
        !isAssigningRoles &&
        !isResettingPassword &&
        !isDeletingUser
      "
      @close="
        selectedUser = null;
        resetPassword = '';
      "
    >
      <section v-if="selectedUser" class="detail-panel management-detail-panel">
        <header class="table-header">
          <h2>{{ selectedUser.username }} 的角色</h2>
          <p>用户 ID：{{ selectedUser.id }}</p>
        </header>

        <p v-if="isLoadingRoles" class="muted-text">读取中...</p>
        <p v-else-if="roleMessage" class="form-message">{{ roleMessage }}</p>

        <table v-else-if="canReadUserRoles">
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

        <form
          v-if="canWriteUsers"
          class="inline-form"
          @submit.prevent="handleUpdateUser"
        >
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
            {{ isUpdatingUser ? "保存中..." : "保存用户信息" }}
          </button>
          <p v-if="editMessage" class="form-message">{{ editMessage }}</p>
        </form>

        <form
          v-if="canAssignUserRoles"
          class="inline-form"
          @submit.prevent="handleAssignRoles"
        >
          <h3>分配角色</h3>
          <p v-if="!relationsLoaded" role="alert">
            关系或候选项尚未完整加载，禁止提交。请重新选择该用户读取。
          </p>
          <p v-if="disabledAssignedRoles.length > 0" class="warning-text">
            当前用户存在停用角色，页面不会提交角色变更，避免完整替换时隐式移除这些角色。
          </p>
          <div class="checkbox-grid">
            <label v-for="role in roleOptions" :key="role.code">
              <input
                v-model="selectedRoleCodes"
                type="checkbox"
                :value="role.code"
                :disabled="
                  disabledAssignedRoles.length > 0 ||
                  isAssigningRoles ||
                  !relationsLoaded
                "
              />
              {{ role.name }}（{{ role.code }}）
            </label>
          </div>
          <button
            class="login-button"
            type="submit"
            :disabled="!canSubmitRoles"
          >
            {{ isAssigningRoles ? "保存中..." : "保存角色分配" }}
          </button>
          <p v-if="assignMessage" class="form-message">{{ assignMessage }}</p>
        </form>

        <form
          v-if="canResetUserPassword"
          class="inline-form"
          @submit.prevent="handleResetPassword"
        >
          <h3>重置密码</h3>
          <p class="warning-text">
            保存后无法读取旧密码，并会使该用户当前登录态失效。
          </p>
          <label>
            新密码
            <input
              v-model="resetPassword"
              type="password"
              minlength="8"
              maxlength="64"
              autocomplete="new-password"
            />
          </label>
          <button
            class="danger-button"
            type="submit"
            :disabled="isResettingPassword || resetPassword.length < 8"
          >
            {{ isResettingPassword ? "重置中..." : "重置用户密码" }}
          </button>
          <p v-if="passwordMessage" class="form-message">
            {{ passwordMessage }}
          </p>
        </form>

        <section v-if="canWriteUsers" class="inline-form danger-zone">
          <h3>删除用户</h3>
          <p class="warning-text">
            删除不可恢复。后端会拒绝删除当前登录用户、最后一个启用管理员，以及仍分配角色的用户。
          </p>
          <button
            class="danger-button"
            type="button"
            :disabled="isDeletingUser"
            @click="handleDeleteUser"
          >
            {{ isDeletingUser ? "删除中..." : "永久删除用户" }}
          </button>
          <p v-if="deleteMessage" class="form-message">{{ deleteMessage }}</p>
        </section>
      </section>
    </el-drawer>
    <p v-if="message && users.length > 0" class="form-message">{{ message }}</p>
  </main>
</template>
