<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  createPermission,
  deletePermission,
  getPermissionList,
  updatePermission,
  type PermissionListItem,
} from "../api/permissions";
import { errorMessage } from "../utils/errors";
import { confirmAction } from "../composables/useMutation";
import { useAuthStore } from "../stores/auth";
import PageHeader from "../components/PageHeader.vue";

const permissions = ref<PermissionListItem[]>([]);
const message = ref("");
const isLoading = ref(false);
const createCode = ref("");
const createName = ref("");
const createMessage = ref("");
const isCreatingPermission = ref(false);
const createOpen = ref(false);
const selectedPermission = ref<PermissionListItem | null>(null);
const editName = ref("");
const editMessage = ref("");
const deleteMessage = ref("");
const isUpdatingPermission = ref(false);
const isDeletingPermission = ref(false);
const authStore = useAuthStore();

const canWritePermissions = () =>
  authStore.hasPermission("system:permission:write");
const canDeletePermissions = () =>
  authStore.hasPermission("system:permission:delete");

async function loadPermissions() {
  if (isLoading.value) {
    return;
  }

  message.value = "";
  isLoading.value = true;

  try {
    const result = await getPermissionList();

    if (result.code !== 0 || result.data === null) {
      permissions.value = [];
      message.value = result.message;
      return;
    }

    permissions.value = result.data;
  } catch (failure) {
    permissions.value = [];
    message.value = errorMessage(failure);
  } finally {
    isLoading.value = false;
  }
}

async function handleCreatePermission() {
  if (isCreatingPermission.value) {
    return;
  }

  createMessage.value = "";
  isCreatingPermission.value = true;

  try {
    const result = await createPermission({
      code: createCode.value,
      name: createName.value,
    });

    if (result.code !== 0 || result.data === null) {
      createMessage.value = result.message;
      return;
    }

    const createdCode = createCode.value;
    createCode.value = "";
    createName.value = "";
    await loadPermissions();
    selectedPermission.value =
      permissions.value.find((permission) => permission.code === createdCode) ??
      null;
    editName.value = selectedPermission.value?.name ?? "";
    createMessage.value = `权限 ${createdCode} 已创建，尚未授予任何角色。`;
    createOpen.value = false;
  } catch (failure) {
    createMessage.value = errorMessage(failure);
  } finally {
    isCreatingPermission.value = false;
  }
}

function handleSelectPermission(permission: PermissionListItem) {
  selectedPermission.value = permission;
  editName.value = permission.name;
  editMessage.value = "";
  deleteMessage.value = "";
}

async function handleUpdatePermission() {
  if (selectedPermission.value === null || isUpdatingPermission.value) return;
  editMessage.value = "";
  isUpdatingPermission.value = true;
  try {
    const result = await updatePermission({
      code: selectedPermission.value.code,
      name: editName.value,
    });
    if (result.code !== 0 || result.data !== true) {
      editMessage.value = result.message;
      return;
    }
    selectedPermission.value = {
      ...selectedPermission.value,
      name: editName.value,
    };
    editMessage.value = "权限名称已保存。";
    await loadPermissions();
  } catch (failure) {
    editMessage.value = errorMessage(failure);
  } finally {
    isUpdatingPermission.value = false;
  }
}

async function handleDeletePermission() {
  if (selectedPermission.value === null || isDeletingPermission.value) return;
  isDeletingPermission.value = true;
  if (
    !(await confirmAction(
      `确认永久删除权限 ${selectedPermission.value.code} 吗？此操作不可恢复。`,
    ))
  ) {
    isDeletingPermission.value = false;
    return;
  }
  deleteMessage.value = "";
  isDeletingPermission.value = true;
  try {
    const result = await deletePermission(selectedPermission.value.code);
    if (result.code !== 0 || result.data !== true) {
      deleteMessage.value = result.message;
      return;
    }
    selectedPermission.value = null;
    await loadPermissions();
  } catch (failure) {
    deleteMessage.value = errorMessage(failure);
  } finally {
    isDeletingPermission.value = false;
  }
}

onMounted(() => {
  void loadPermissions();
});
</script>

<template>
  <main class="user-page management-page">
    <PageHeader
      title="权限目录"
      description="维护权限名称与自定义权限。登记不等于授权，内置权限受后端保护。"
    >
      <el-button
        v-if="canWritePermissions()"
        type="primary"
        @click="createOpen = true"
        >创建权限</el-button
      >
    </PageHeader>
    <el-dialog
      v-model="createOpen"
      title="创建自定义权限"
      width="min(600px, 94vw)"
      :close-on-click-modal="false"
      :show-close="!isCreatingPermission"
      :close-on-press-escape="!isCreatingPermission"
    >
      <section v-if="canWritePermissions()" class="detail-panel create-panel">
        <form class="inline-form" @submit.prevent="handleCreatePermission">
          <h1>创建自定义权限</h1>
          <p class="muted-text">
            新权限只登记到权限目录，不会自动授予任何角色。
          </p>
          <label>
            权限编码
            <input
              v-model.trim="createCode"
              type="text"
              minlength="3"
              maxlength="128"
              pattern="[a-z][a-z0-9:._-]*"
              placeholder="例如 system:report:read"
              required
            />
          </label>
          <label>
            权限名称
            <input
              v-model.trim="createName"
              type="text"
              maxlength="64"
              required
            />
          </label>
          <button
            class="login-button"
            type="submit"
            :disabled="isCreatingPermission"
          >
            {{ isCreatingPermission ? "创建中..." : "创建权限" }}
          </button>
          <p v-if="createMessage" class="form-message">{{ createMessage }}</p>
        </form>
      </section>
    </el-dialog>
    <section class="table-section management-table-panel">
      <header class="table-header">
        <h1>权限列表</h1>
        <button
          class="login-button"
          type="button"
          :disabled="isLoading"
          @click="loadPermissions"
        >
          {{ isLoading ? "读取中..." : "刷新" }}
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
            <td>
              <button
                v-if="canWritePermissions() || canDeletePermissions()"
                class="text-button"
                type="button"
                @click="handleSelectPermission(permission)"
              >
                编辑
              </button>
            </td>
          </tr>
          <tr v-if="permissions.length === 0">
            <td colspan="3">{{ message || "暂无数据" }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <el-dialog
      :model-value="selectedPermission !== null"
      title="权限管理"
      width="min(640px, 94vw)"
      :close-on-click-modal="false"
      :show-close="!isUpdatingPermission && !isDeletingPermission"
      :close-on-press-escape="!isUpdatingPermission && !isDeletingPermission"
      @close="selectedPermission = null"
    >
      <section
        v-if="selectedPermission"
        class="detail-panel management-detail-panel"
      >
        <header class="table-header">
          <h2>编辑权限</h2>
          <p>{{ selectedPermission.code }}</p>
        </header>
        <form
          v-if="canWritePermissions()"
          class="inline-form"
          @submit.prevent="handleUpdatePermission"
        >
          <label
            >权限名称<input v-model.trim="editName" type="text" maxlength="64"
          /></label>
          <p class="muted-text">权限编码只用于鉴权定位，不能修改。</p>
          <button
            class="login-button"
            type="submit"
            :disabled="isUpdatingPermission"
          >
            {{ isUpdatingPermission ? "保存中..." : "保存权限名称" }}
          </button>
          <p v-if="editMessage" class="form-message">{{ editMessage }}</p>
        </form>
        <section v-if="canDeletePermissions()" class="inline-form danger-zone">
          <h3>删除权限</h3>
          <p class="warning-text">
            仅能删除未被角色引用的自定义权限；内置权限会被后端拒绝。
          </p>
          <button
            class="danger-button"
            type="button"
            :disabled="isDeletingPermission"
            @click="handleDeletePermission"
          >
            {{ isDeletingPermission ? "删除中..." : "永久删除权限" }}
          </button>
          <p v-if="deleteMessage" class="form-message">{{ deleteMessage }}</p>
        </section>
      </section>
    </el-dialog>
    <p v-if="message && permissions.length > 0" class="form-message">
      {{ message }}
    </p>
  </main>
</template>
