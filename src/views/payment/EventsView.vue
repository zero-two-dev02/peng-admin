<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { payments } from "../../api/payments";
import { useQuery } from "../../composables/useQuery";
import { displayTime, fenToYuan, validateRange } from "../../utils/safety";
import PageHeader from "../../components/PageHeader.vue";
import QueryState from "../../components/QueryState.vue";
import PagePagination from "../../components/PagePagination.vue";
const route = useRoute();
const filter = reactive({
  paymentNo: String(route.query.paymentNo ?? ""),
  channelTransactionNo: "",
  beginTime: "",
  endTime: "",
});
const applied = ref({ ...filter });
const page = ref(1);
const { data, loading, error, load } = useQuery((signal) => {
  const f = applied.value;
  validateRange(f.beginTime, f.endTime);
  return payments.events(
    {
      pageNo: page.value,
      pageSize: 20,
      paymentNo: f.paymentNo || undefined,
      channelTransactionNo: f.channelTransactionNo || undefined,
      beginTime: f.beginTime ? f.beginTime + ":00" : undefined,
      endTime: f.endTime ? f.endTime + ":00" : undefined,
    },
    signal,
  );
});
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
    title="支付回调事件"
    description="只读查看服务端验签并持久化的回调事件，不在浏览器发送回调。"
  />
  <form class="filter-bar" @submit.prevent="search">
    <label>支付单号<input v-model.trim="filter.paymentNo" /></label
    ><label
      >渠道交易号<input v-model.trim="filter.channelTransactionNo" /></label
    ><label
      >开始时间<input v-model="filter.beginTime" type="datetime-local" /></label
    ><label
      >结束时间<input v-model="filter.endTime" type="datetime-local" /></label
    ><el-button type="primary" native-type="submit" :loading="loading"
      >查询</el-button
    >
  </form>
  <p class="time-hint">数据库墙上时间，原样查询和展示，不假定为 UTC。</p>
  <section class="surface">
    <QueryState
      :loading="loading"
      :error="error"
      :empty="data?.list.length === 0"
      @retry="load"
      ><el-table :data="data?.list ?? []"
        ><el-table-column prop="id" label="ID" width="90" /><el-table-column
          prop="eventNo"
          label="事件号"
          min-width="200"
        /><el-table-column
          prop="paymentNo"
          label="支付单号"
          min-width="220"
        /><el-table-column
          prop="channelTransactionNo"
          label="渠道交易号"
          min-width="200"
        /><el-table-column label="金额（元）" width="130"
          ><template #default="{ row }">{{
            fenToYuan(row.amountFen)
          }}</template></el-table-column
        ><el-table-column label="记录时间" min-width="210"
          ><template #default="{ row }">{{
            displayTime(row.createTime)
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
