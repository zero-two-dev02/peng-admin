<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { auditPage, type AuditDomain } from "../api/audits";
import { useQuery } from "../composables/useQuery";
import { displayTime, validateRange } from "../utils/safety";
import PageHeader from "../components/PageHeader.vue";
import QueryState from "../components/QueryState.vue";
import PagePagination from "../components/PagePagination.vue";
const props = defineProps<{ domain: AuditDomain }>();
const route = useRoute();
const filter = reactive({
  operatorUserId: "",
  action: "",
  targetType: "",
  targetIdentifier: "",
  paymentNo: String(route.query.paymentNo ?? ""),
  success: "",
  beginTime: "",
  endTime: "",
});
const applied = ref({ ...filter });
const page = ref(1);
const title = computed(
  () =>
    ({
      system: "System 操作审计",
      notice: "公告操作审计",
      payment: "支付操作审计",
    })[props.domain],
);
const { data, loading, error, load } = useQuery((signal) => {
  const f = applied.value;
  validateRange(f.beginTime, f.endTime);
  return auditPage(
    props.domain,
    {
      pageNo: page.value,
      pageSize: 20,
      operatorUserId:
        props.domain !== "payment" && f.operatorUserId
          ? Number(f.operatorUserId)
          : undefined,
      action: props.domain !== "payment" ? f.action || undefined : undefined,
      targetType:
        props.domain === "system" ? f.targetType || undefined : undefined,
      targetIdentifier:
        props.domain !== "payment"
          ? f.targetIdentifier || undefined
          : undefined,
      paymentNo:
        props.domain === "payment" ? f.paymentNo || undefined : undefined,
      success:
        f.success === ""
          ? undefined
          : props.domain === "payment"
            ? f.success === "1"
            : Number(f.success),
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
function changePage(value: number) {
  page.value = value;
  void load();
}
onMounted(load);
</script>
<template>
  <PageHeader
    :title="title"
    description="只读审计事实；失败记录与成功记录同样保留。"
  />
  <form class="filter-bar" @submit.prevent="search">
    <template v-if="domain !== 'payment'"
      ><label
        >操作人 ID<input
          v-model="filter.operatorUserId"
          type="number"
          min="1"
          step="1" /></label
      ><label
        >动作编码<input v-model.trim="filter.action" maxlength="64" /></label
      ><label
        >目标标识<input
          v-model.trim="filter.targetIdentifier"
          maxlength="128" /></label
      ><label v-if="domain === 'system'"
        >目标类型<input
          v-model.trim="filter.targetType"
          maxlength="64" /></label
    ></template>
    <label v-else>支付单号<input v-model.trim="filter.paymentNo" /></label>
    <label
      >结果<select v-model="filter.success">
        <option value="">全部</option>
        <option value="1">成功</option>
        <option value="0">失败</option>
      </select></label
    >
    <label
      >开始时间<input v-model="filter.beginTime" type="datetime-local" /></label
    ><label
      >结束时间<input v-model="filter.endTime" type="datetime-local" /></label
    ><el-button type="primary" native-type="submit" :loading="loading"
      >查询</el-button
    >
  </form>
  <p class="time-hint">
    时间按各服务数据库墙上时间原样查询/显示，不擅自转换为
    UTC；部署时请统一并核实数据库时区。
  </p>
  <section class="surface">
    <QueryState
      :loading="loading"
      :error="error"
      :empty="data?.list.length === 0"
      @retry="load"
      ><el-table :data="data?.list ?? []"
        ><el-table-column prop="id" label="ID" width="90" /><el-table-column
          v-if="domain !== 'payment'"
          prop="operatorUserId"
          label="操作人"
          width="110"
        /><el-table-column
          prop="action"
          label="动作"
          min-width="200"
        /><el-table-column
          v-if="domain === 'system'"
          prop="targetType"
          label="目标类型"
          min-width="120"
        /><el-table-column
          :prop="domain === 'payment' ? 'paymentNo' : 'targetIdentifier'"
          label="目标"
          min-width="180"
        /><el-table-column label="结果" width="90"
          ><template #default="{ row }"
            ><el-tag :type="row.success ? 'success' : 'danger'">{{
              row.success ? "成功" : "失败"
            }}</el-tag></template
          ></el-table-column
        ><el-table-column
          prop="failureReason"
          label="失败摘要"
          min-width="180"
        /><el-table-column label="时间" min-width="200"
          ><template #default="{ row }">{{
            displayTime(row.createTime)
          }}</template></el-table-column
        ></el-table
      ></QueryState
    ><PagePagination
      :page="page"
      :total="data?.total ?? 0"
      :disabled="loading"
      @change="changePage"
    />
  </section>
</template>
