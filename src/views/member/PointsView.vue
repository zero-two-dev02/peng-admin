<script setup lang="ts">
import { reactive, ref } from "vue";
import { members } from "../../api/members";
import { useAuthStore } from "../../stores/auth";
import { useQuery } from "../../composables/useQuery";
import { displayTime } from "../../utils/safety";
import AdjustmentDialog from "../../components/AdjustmentDialog.vue";
import PageHeader from "../../components/PageHeader.vue";
import QueryState from "../../components/QueryState.vue";
import PagePagination from "../../components/PagePagination.vue";
const auth = useAuthStore();
const filter = reactive({ memberUserId: "", businessType: "", businessNo: "" });
const applied = ref({ ...filter });
const page = ref(1);
const requested = ref(false);
const open = ref(false);
const { data, loading, error, load } = useQuery((signal) =>
  members.records(
    {
      memberUserId: Number(applied.value.memberUserId),
      businessType: applied.value.businessType || undefined,
      businessNo: applied.value.businessNo || undefined,
      pageNo: page.value,
      pageSize: 20,
    },
    signal,
  ),
);
function search() {
  applied.value = { ...filter };
  requested.value = true;
  page.value = 1;
  void load();
}
function change(value: number) {
  page.value = value;
  void load();
}
function refresh() {
  if (requested.value) void load();
}
</script>
<template>
  <PageHeader
    title="会员积分"
    description="不可变积分流水；当前接口按 System 用户 ID 查找其会员档案。"
    ><el-button
      v-if="auth.hasPermission('member:points:adjust')"
      type="primary"
      @click="open = true"
      >人工调整</el-button
    ></PageHeader
  ><el-alert
    title="memberUserId 是当前后端的历史命名，实际指 System 用户 ID。会员档案 ID 不能填在这里；暂无会员目录接口。"
    type="info"
    :closable="false"
  />
  <form class="filter-bar" @submit.prevent="search">
    <label
      >System 用户 ID<input
        v-model="filter.memberUserId"
        type="number"
        min="1"
        step="1"
        required /></label
    ><label
      >业务类型<input
        v-model.trim="filter.businessType"
        maxlength="32" /></label
    ><label
      >业务号<input v-model.trim="filter.businessNo" maxlength="64" /></label
    ><el-button type="primary" native-type="submit" :loading="loading"
      >查询</el-button
    >
  </form>
  <section v-if="requested" class="surface">
    <QueryState
      :loading="loading"
      :error="error"
      :empty="data?.list.length === 0"
      @retry="load"
      ><el-table :data="data?.list ?? []"
        ><el-table-column prop="id" label="ID" width="90" /><el-table-column
          prop="businessType"
          label="业务类型"
          min-width="160"
        /><el-table-column
          prop="businessNo"
          label="业务号"
          min-width="260"
        /><el-table-column
          prop="changeValue"
          label="积分变动"
          width="120"
        /><el-table-column
          prop="remark"
          label="原因"
          min-width="180"
        /><el-table-column label="记录时间（数据库时间）" min-width="220"
          ><template #default="{ row }">{{
            displayTime(row.createdAt)
          }}</template></el-table-column
        ></el-table
      ></QueryState
    ><PagePagination
      :page="page"
      :total="data?.total ?? 0"
      :disabled="loading"
      @change="change"
    />
  </section>
  <el-empty
    v-else
    description="请输入已核实的 System 用户 ID 后查询"
  /><AdjustmentDialog
    v-model="open"
    mode="points"
    :initial-target="Number(filter.memberUserId) || undefined"
    @done="refresh"
  />
</template>
