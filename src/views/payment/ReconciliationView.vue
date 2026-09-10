<script setup lang="ts">
import { reactive, ref } from "vue";
import { payments } from "../../api/payments";
import { useQuery } from "../../composables/useQuery";
import { validateRange } from "../../utils/safety";
import PageHeader from "../../components/PageHeader.vue";
import QueryState from "../../components/QueryState.vue";
const filter = reactive({ beginTime: "", endTime: "" });
const applied = ref({ ...filter });
const requested = ref(false);
const { data, loading, error, load } = useQuery((signal) => {
  validateRange(applied.value.beginTime, applied.value.endTime);
  return payments.reconcile(
    {
      beginTime: applied.value.beginTime
        ? applied.value.beginTime + ":00"
        : undefined,
      endTime: applied.value.endTime
        ? applied.value.endTime + ":00"
        : undefined,
    },
    signal,
  );
});
function search() {
  applied.value = { ...filter };
  requested.value = true;
  void load();
}
</script>
<template>
  <PageHeader
    title="支付数量核对"
    description="成功支付记录数与回调事件记录数的数量比较，不是资金对账。"
  /><el-alert
    title="差值为零不代表金额一致、逐笔匹配或无遗漏支付。历史支付可能早于回调事件表上线。"
    type="warning"
    :closable="false"
    show-icon
  />
  <form class="filter-bar" @submit.prevent="search">
    <label
      >开始时间<input v-model="filter.beginTime" type="datetime-local" /></label
    ><label
      >结束时间<input v-model="filter.endTime" type="datetime-local" /></label
    ><el-button native-type="submit" type="primary" :loading="loading"
      >执行数量核对</el-button
    >
  </form>
  <p class="time-hint">
    按数据库墙上时间查询。成功支付按 paidAt，回调事件按
    createTime，包含起止边界；留空代表不限该边界。
  </p>
  <section v-if="requested" class="surface">
    <QueryState :loading="loading" :error="error" @retry="load"
      ><p>
        查询范围：{{ applied.beginTime || "不限起点" }} —
        {{ applied.endTime || "不限终点" }}
      </p>
      <div v-if="data" class="summary-grid">
        <article>
          <h3>成功支付数</h3>
          <strong class="stat-number">{{ data.succeededPaymentCount }}</strong>
        </article>
        <article>
          <h3>回调事件数</h3>
          <strong class="stat-number">{{ data.callbackEventCount }}</strong>
        </article>
        <article>
          <h3>数量差值</h3>
          <strong class="stat-number">{{ data.difference }}</strong>
          <p>成功支付数 − 回调事件数</p>
        </article>
      </div></QueryState
    >
  </section>
  <el-empty v-else description="选择时间范围后执行核对" />
</template>
