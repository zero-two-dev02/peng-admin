<script setup lang="ts">
import { onMounted, ref } from "vue";
import { inventory } from "../../api/inventory";
import { useAuthStore } from "../../stores/auth";
import { useQuery } from "../../composables/useQuery";
import { displayTime } from "../../utils/safety";
import AdjustmentDialog from "../../components/AdjustmentDialog.vue";
import PageHeader from "../../components/PageHeader.vue";
import QueryState from "../../components/QueryState.vue";
import PagePagination from "../../components/PagePagination.vue";
const auth = useAuthStore();
const skuId = ref("");
const appliedId = ref<number>();
const page = ref(1);
const open = ref(false);
const target = ref<number>();
const mode = ref<"stock" | "initialize">("stock");
const { data, loading, error, load } = useQuery((signal) =>
  inventory.stocks(
    { skuId: appliedId.value, pageNo: page.value, pageSize: 20 },
    signal,
  ),
);
function search() {
  appliedId.value = skuId.value ? Number(skuId.value) : undefined;
  page.value = 1;
  void load();
}
function change(value: number) {
  page.value = value;
  void load();
}
function edit(kind: "stock" | "initialize", id?: number) {
  mode.value = kind;
  target.value = id;
  open.value = true;
}
onMounted(load);
</script>
<template>
  <PageHeader
    title="库存总览"
    description="可用库存与预占库存分别展示，预占操作仅由后端服务执行。"
    ><el-button
      v-if="auth.hasPermission('inventory:stock:adjust')"
      type="primary"
      @click="edit('initialize')"
      >初始化库存</el-button
    ></PageHeader
  >
  <form class="filter-bar" @submit.prevent="search">
    <label>SKU ID<input v-model="skuId" type="number" min="1" step="1" /></label
    ><el-button type="primary" native-type="submit" :loading="loading"
      >查询</el-button
    >
  </form>
  <section class="surface">
    <QueryState
      :loading="loading"
      :error="error"
      :empty="data?.list.length === 0"
      @retry="load"
      ><el-table :data="data?.list ?? []"
        ><el-table-column
          prop="skuId"
          label="SKU ID"
          width="130"
        /><el-table-column
          prop="availableStock"
          label="可用库存"
        /><el-table-column
          prop="reservedStock"
          label="预占库存"
        /><el-table-column label="更新时间（数据库时间）" min-width="220"
          ><template #default="{ row }">{{
            displayTime(row.updatedAt)
          }}</template></el-table-column
        ><el-table-column label="操作" min-width="180"
          ><template #default="{ row }"
            ><el-button
              v-if="auth.hasPermission('inventory:stock:adjust')"
              link
              type="primary"
              @click="edit('stock', row.skuId)"
              >调整</el-button
            ><RouterLink
              :to="{ path: '/inventory/records', query: { skuId: row.skuId } }"
              >查看流水</RouterLink
            ></template
          ></el-table-column
        ></el-table
      ></QueryState
    ><PagePagination
      :page="page"
      :total="data?.total ?? 0"
      :disabled="loading"
      @change="change"
    />
  </section>
  <AdjustmentDialog
    v-model="open"
    :mode="mode"
    :initial-target="target"
    @done="load"
  />
</template>
