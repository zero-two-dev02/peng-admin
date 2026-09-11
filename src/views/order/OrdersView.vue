<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { orders } from "../../api/orders";
import type { AdminOrder } from "../../types/orders";
import { useQuery } from "../../composables/useQuery";
import { displayTime, fenToYuan } from "../../utils/safety";
import { orderStatusLabel, orderStatusTagType } from "../../utils/orders";
import PageHeader from "../../components/PageHeader.vue";
import PagePagination from "../../components/PagePagination.vue";
import QueryState from "../../components/QueryState.vue";

const filter = reactive({ orderNo: "", userId: "", status: "" });
const applied = ref({ ...filter });
const page = ref(1);
const detailId = ref<number | null>(null);
const detailOpen = ref(false);

const { data, loading, error, load } = useQuery((signal) => {
  const current = applied.value;
  return orders.page(
    {
      pageNo: page.value,
      pageSize: 20,
      orderNo: current.orderNo || undefined,
      userId: current.userId ? Number(current.userId) : undefined,
      status: current.status === "" ? undefined : Number(current.status),
    },
    signal,
  );
});

const detail = useQuery(() => orders.get(detailId.value!));

function search() {
  applied.value = { ...filter };
  page.value = 1;
  void load();
}

function changePage(value: number) {
  page.value = value;
  void load();
}

function showDetail(order: AdminOrder) {
  detailId.value = order.id;
  detailOpen.value = true;
  void detail.load();
}

function displayValue(value: string | null | undefined) {
  return value || "—";
}

onMounted(load);
</script>

<template>
  <PageHeader
    title="订单管理"
    description="只读查询 Order 服务保存的订单事实；详情会重新读取服务端数据。"
  />
  <form class="filter-bar" @submit.prevent="search">
    <label
      >订单号<input v-model.trim="filter.orderNo" maxlength="64" /></label
    ><label
      >用户 ID<input
        v-model="filter.userId"
        type="number"
        min="1"
        step="1" /></label
    ><label
      >订单状态<select v-model="filter.status">
        <option value="">全部</option>
        <option value="0">创建中</option>
        <option value="1">待支付</option>
        <option value="2">取消中</option>
        <option value="3">已取消</option>
        <option value="4">已支付</option>
        <option value="5">支付确认中</option>
      </select></label
    ><el-button type="primary" native-type="submit" :loading="loading"
      >查询</el-button
    >
  </form>
  <p class="time-hint">时间按后端返回值原样显示，不擅自增加或减少时区偏移。</p>
  <section class="surface">
    <QueryState
      :loading="loading"
      :error="error"
      :empty="data?.list.length === 0"
      @retry="load"
      ><el-table :data="data?.list ?? []">
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column prop="orderNo" label="订单号" min-width="220" />
        <el-table-column prop="userId" label="用户 ID" width="110" />
        <el-table-column label="商品" min-width="220">
          <template #default="{ row }">
            <div>{{ row.productName }}</div>
            <small>{{ row.spuId }} / SKU {{ row.skuId }}</small>
          </template>
        </el-table-column>
        <el-table-column prop="skuSpecification" label="规格" min-width="150" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column label="单价 / 总额（元）" width="150">
          <template #default="{ row }">
            {{ fenToYuan(row.unitPriceFen) }} /
            {{ fenToYuan(row.totalPriceFen) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="125">
          <template #default="{ row }">
            <el-tag :type="orderStatusTagType(row.status)">
              {{ orderStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="190">
          <template #default="{ row }">
            {{ displayTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button link type="primary" @click="showDetail(row)"
              >详情</el-button
            >
          </template>
        </el-table-column>
      </el-table></QueryState
    ><PagePagination
      :page="page"
      :total="data?.total ?? 0"
      :disabled="loading"
      @change="changePage"
    />
  </section>

  <el-drawer v-model="detailOpen" title="订单详情" size="min(720px, 94vw)">
    <QueryState
      :loading="detail.loading.value"
      :error="detail.error.value"
      :empty="!detail.data.value"
      @retry="detail.load"
      ><template v-if="detail.data.value">
        <p class="time-hint">
          仅展示订单服务自身事实；不包含用户昵称、支付状态、库存状态、物流或退款信息。
        </p>
        <dl class="detail-grid">
          <dt>订单 ID</dt>
          <dd>{{ detail.data.value.id }}</dd>
          <dt>订单号</dt>
          <dd>{{ detail.data.value.orderNo }}</dd>
          <dt>用户 ID</dt>
          <dd>{{ detail.data.value.userId }}</dd>
          <dt>SPU / SKU</dt>
          <dd>{{ detail.data.value.spuId }} / {{ detail.data.value.skuId }}</dd>
          <dt>商品</dt>
          <dd>{{ detail.data.value.productName }}</dd>
          <dt>规格</dt>
          <dd>{{ detail.data.value.skuSpecification }}</dd>
          <dt>数量</dt>
          <dd>{{ detail.data.value.quantity }}</dd>
          <dt>单价</dt>
          <dd>{{ fenToYuan(detail.data.value.unitPriceFen) }} 元</dd>
          <dt>订单总额</dt>
          <dd>{{ fenToYuan(detail.data.value.totalPriceFen) }} 元</dd>
          <dt>订单状态</dt>
          <dd>
            <el-tag :type="orderStatusTagType(detail.data.value.status)">
              {{ orderStatusLabel(detail.data.value.status) }}
            </el-tag>
          </dd>
          <dt>创建时间</dt>
          <dd>{{ displayValue(displayTime(detail.data.value.createdAt)) }}</dd>
          <dt>更新时间</dt>
          <dd>{{ displayValue(displayTime(detail.data.value.updatedAt)) }}</dd>
          <dt>过期时间</dt>
          <dd>
            {{ displayValue(displayTime(detail.data.value.expiresAt)) }}
          </dd>
        </dl>
        <h3>取消信息</h3>
        <dl class="detail-grid">
          <dt>取消 ID</dt>
          <dd>{{ displayValue(detail.data.value.cancellationId) }}</dd>
          <dt>取消原因</dt>
          <dd>{{ displayValue(detail.data.value.cancelReason) }}</dd>
          <dt>发起取消时间</dt>
          <dd>
            {{ displayValue(displayTime(detail.data.value.cancellationRequestedAt)) }}
          </dd>
          <dt>完成取消时间</dt>
          <dd>
            {{ displayValue(displayTime(detail.data.value.cancelledAt)) }}
          </dd>
        </dl>
        <el-button @click="detail.load">重新读取详情</el-button>
      </template></QueryState>
  </el-drawer>
</template>

<style scoped>
.detail-grid {
  display: grid;
  grid-template-columns: minmax(120px, 0.35fr) minmax(0, 1fr);
  gap: 0.65rem 1rem;
  margin: 0 0 1.25rem;
}

.detail-grid dt {
  color: var(--muted, #667085);
  font-weight: 600;
}

.detail-grid dd {
  margin: 0;
  overflow-wrap: anywhere;
}
</style>
