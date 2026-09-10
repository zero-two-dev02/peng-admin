<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import { sessions } from "../api/sessions";
import { useAuthStore } from "../stores/auth";
import { useQuery } from "../composables/useQuery";
import { useMutation } from "../composables/useMutation";
import { displayTime } from "../utils/safety";
import PageHeader from "../components/PageHeader.vue";
import QueryState from "../components/QueryState.vue";
const auth = useAuthStore();
const route = useRoute();
const userId = ref(Number(route.query.userId) || undefined);
const selectedId = ref<number>();
const { data, loading, error, load } = useQuery((signal) =>
  sessions.list(selectedId.value!, signal),
);
const { saving, saveError, run } = useMutation();
function search() {
  if (!userId.value || !Number.isSafeInteger(userId.value) || userId.value < 1)
    return;
  selectedId.value = userId.value;
  void load();
}
function revoke() {
  if (selectedId.value)
    void run(
      () => sessions.revoke(selectedId.value!),
      load,
      `强制用户 ${selectedId.value} 的全部会话下线？请确认是获授权的目标用户。`,
    );
}
</script>
<template>
  <PageHeader
    title="用户会话"
    description="仅展示活跃会话过期时间；不读取或显示会话凭据。"
  />
  <form class="filter-bar" @submit.prevent="search">
    <label
      >System 用户 ID<input
        v-model.number="userId"
        type="number"
        min="1"
        step="1"
        required /></label
    ><el-button native-type="submit" type="primary" :loading="loading"
      >查询会话</el-button
    >
  </form>
  <el-alert
    v-if="saveError"
    :title="saveError"
    type="error"
    :closable="false"
  />
  <section v-if="selectedId" class="surface">
    <h2>用户 {{ selectedId }}</h2>
    <el-button
      v-if="auth.hasPermission('system:user:session:force-logout')"
      type="danger"
      :disabled="selectedId === auth.userId"
      :loading="saving"
      @click="revoke"
      >强制全部下线</el-button
    ><QueryState
      :loading="loading"
      :error="error"
      :empty="data?.length === 0"
      @retry="load"
      ><el-table :data="data ?? []"
        ><el-table-column label="会话过期时间（本地显示）"
          ><template #default="{ row }">{{
            displayTime(row.expiresAt, true)
          }}</template></el-table-column
        ></el-table
      ></QueryState
    >
  </section>
  <el-empty v-else description="请输入目标用户 ID 后查询" />
</template>
