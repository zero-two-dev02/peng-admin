<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { payments } from "../../api/payments";
import { useQuery } from "../../composables/useQuery";
import { useAuthStore } from "../../stores/auth";
import { fenToYuan } from "../../utils/safety";
import PageHeader from "../../components/PageHeader.vue";
import QueryState from "../../components/QueryState.vue";
import PagePagination from "../../components/PagePagination.vue";
const auth = useAuthStore();
const filter = reactive({ paymentNo: "", orderNo: "", status: "" });
const applied = ref({ ...filter });
const page = ref(1);
const { data, loading, error, load } = useQuery((signal) =>
  payments.orders(
    {
      pageNo: page.value,
      pageSize: 20,
      paymentNo: applied.value.paymentNo || undefined,
      orderNo: applied.value.orderNo || undefined,
      status:
        applied.value.status === "" ? undefined : Number(applied.value.status),
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
    title="支付单"
    description="仅展示服务端返回的支付事实，不提供模拟付款或强制成功操作。"
  />
  <form class="filter-bar" @submit.prevent="search">
    <label>支付单号<input v-model.trim="filter.paymentNo" /></label
    ><label>订单号<input v-model.trim="filter.orderNo" /></label
    ><label
      >状态<select v-model="filter.status">
        <option value="">全部</option>
        <option value="0">待支付</option>
        <option value="1">已成功</option>
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
        ><el-table-column prop="id" label="ID" width="90" /><el-table-column
          prop="paymentNo"
          label="支付单号"
          min-width="220"
        /><el-table-column
          prop="orderNo"
          label="订单号"
          min-width="220"
        /><el-table-column label="金额（元）" min-width="120"
          ><template #default="{ row }">{{
            fenToYuan(row.amountFen)
          }}</template></el-table-column
        ><el-table-column label="状态" width="100"
          ><template #default="{ row }"
            ><el-tag :type="row.status === 1 ? 'success' : 'warning'">{{
              row.status === 1
                ? "已成功"
                : row.status === 0
                  ? "待支付"
                  : "未知状态 " + row.status
            }}</el-tag></template
          ></el-table-column
        ><el-table-column
          v-if="auth.hasPermission('payment:audit:read')"
          label="关联查询"
          min-width="180"
          ><template #default="{ row }"
            ><RouterLink
              :to="{
                path: '/payment/audits',
                query: { paymentNo: row.paymentNo },
              }"
              >操作审计</RouterLink
            >
            ·
            <RouterLink
              :to="{
                path: '/payment/callback-events',
                query: { paymentNo: row.paymentNo },
              }"
              >回调事件</RouterLink
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
</template>
