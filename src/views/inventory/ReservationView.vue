<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { inventory } from "../../api/inventory";
import { useQuery } from "../../composables/useQuery";
import { displayTime } from "../../utils/safety";
import PageHeader from "../../components/PageHeader.vue";
import QueryState from "../../components/QueryState.vue";
import PagePagination from "../../components/PagePagination.vue";
const filter = reactive({ skuId: "", status: "" });
const applied = ref({ ...filter });
const page = ref(1);
const selected = ref("");
const open = ref(false);
const { data, loading, error, load } = useQuery((signal) =>
  inventory.reservations(
    {
      skuId: applied.value.skuId ? Number(applied.value.skuId) : undefined,
      status:
        applied.value.status === "" ? undefined : Number(applied.value.status),
      pageNo: page.value,
      pageSize: 20,
    },
    signal,
  ),
);
const events = useQuery(() => inventory.events(selected.value));
function search() {
  applied.value = { ...filter };
  page.value = 1;
  void load();
}
function change(value: number) {
  page.value = value;
  void load();
}
function detail(no: string) {
  selected.value = no;
  open.value = true;
  void events.load();
}
onMounted(load);
</script>
<template>
  <PageHeader
    title="库存预占"
    description="仅查询预占状态及事件，不允许浏览器执行预占、确认或释放。"
  />
  <form class="filter-bar" @submit.prevent="search">
    <label
      >SKU ID<input
        v-model="filter.skuId"
        type="number"
        min="1"
        step="1" /></label
    ><label
      >状态<select v-model="filter.status">
        <option value="">全部</option>
        <option value="0">已预占</option>
        <option value="1">已确认</option>
        <option value="2">已释放</option>
      </select></label
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
          prop="reservationNo"
          label="预占单号"
          min-width="250"
        /><el-table-column
          prop="skuId"
          label="SKU ID"
          width="110"
        /><el-table-column
          prop="quantity"
          label="数量"
          width="90"
        /><el-table-column label="状态" width="110"
          ><template #default="{ row }">{{
            ["已预占", "已确认", "已释放"][row.status] ?? "未知"
          }}</template></el-table-column
        ><el-table-column label="创建时间（数据库时间）" min-width="210"
          ><template #default="{ row }">{{
            displayTime(row.createdAt)
          }}</template></el-table-column
        ><el-table-column label="操作" width="130"
          ><template #default="{ row }"
            ><el-button link type="primary" @click="detail(row.reservationNo)"
              >事件时间线</el-button
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
  <el-drawer v-model="open" title="预占事件" size="min(560px, 94vw)"
    ><p>{{ selected }}</p>
    <QueryState
      :loading="events.loading.value"
      :error="events.error.value"
      :empty="events.data.value?.length === 0"
      @retry="events.load"
      ><el-timeline
        ><el-timeline-item
          v-for="(event, index) in events.data.value"
          :key="index"
          :timestamp="displayTime(event.createdAt)"
          >{{ event.eventType }}</el-timeline-item
        ></el-timeline
      ></QueryState
    ></el-drawer
  >
</template>
