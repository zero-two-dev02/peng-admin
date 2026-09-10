<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { inventory } from "../../api/inventory";
import { useQuery } from "../../composables/useQuery";
import { displayTime } from "../../utils/safety";
import PageHeader from "../../components/PageHeader.vue";
import QueryState from "../../components/QueryState.vue";
import PagePagination from "../../components/PagePagination.vue";
const route = useRoute();
const filter = reactive({
  skuId: String(route.query.skuId ?? ""),
  businessType: "",
  businessNo: "",
});
const applied = ref({ ...filter });
const page = ref(1);
const { data, loading, error, load } = useQuery((signal) =>
  inventory.records(
    {
      skuId: applied.value.skuId ? Number(applied.value.skuId) : undefined,
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
  page.value = 1;
  void load();
}
function change(value: number) {
  page.value = value;
  void load();
}
onMounted(load);
</script>
<template>
  <PageHeader
    title="库存流水"
    description="按业务号核实库存变动；历史流水不可直接编辑或删除。"
  />
  <form class="filter-bar" @submit.prevent="search">
    <label
      >SKU ID<input
        v-model="filter.skuId"
        type="number"
        min="1"
        step="1" /></label
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
  <section class="surface">
    <QueryState
      :loading="loading"
      :error="error"
      :empty="data?.list.length === 0"
      @retry="load"
      ><el-table :data="data?.list ?? []"
        ><el-table-column prop="id" label="ID" width="90" /><el-table-column
          prop="skuId"
          label="SKU ID"
          width="110"
        /><el-table-column
          prop="businessType"
          label="业务类型"
          min-width="170"
        /><el-table-column
          prop="businessNo"
          label="业务号"
          min-width="260"
        /><el-table-column
          prop="changeValue"
          label="变动量"
          width="100"
        /><el-table-column
          prop="remark"
          label="原因"
          min-width="180"
        /><el-table-column label="时间（数据库时间）" min-width="210"
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
</template>
