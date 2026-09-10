<script setup lang="ts">
import { computed, onMounted } from "vue";
import { navigation } from "../router/navigation";
import { useAuthStore } from "../stores/auth";
import { getSystemInfo } from "../api/system";
import { useQuery } from "../composables/useQuery";
import PageHeader from "../components/PageHeader.vue";
import QueryState from "../components/QueryState.vue";
const auth = useAuthStore();
const entries = computed(() =>
  navigation.filter(
    (item) => item.permission && auth.hasPermission(item.permission),
  ),
);
const { data, loading, error, load } = useQuery(
  async () => (await getSystemInfo()).data,
);
onMounted(load);
</script>
<template>
  <PageHeader
    title="运营工作台"
    description="围绕真实业务处理日常工作。此页不是经营统计报表。"
  />
  <section class="workbench-banner">
    <div>
      <p class="eyebrow">WORKSPACE</p>
      <h2>欢迎回来，账户 {{ auth.userId }}</h2>
      <p>从商品、内容到库存与支付，按授权访问您的工作区。</p>
    </div>
    <RouterLink to="/account">账户与安全 →</RouterLink>
  </section>
  <div class="summary-grid">
    <el-card
      ><h3>可访问入口</h3>
      <strong class="stat-number">{{ entries.length }}</strong>
      <p>口径：当前权限对应的导航入口数</p></el-card
    ><el-card
      ><h3>会话策略</h3>
      <strong>仅内存</strong>
      <p>刷新后需重新登录；不在浏览器持久保存凭据。</p></el-card
    ><el-card
      ><h3>Gateway → System</h3>
      <QueryState :loading="loading" :error="error" @retry="load"
        ><p>{{ data }}</p>
        <el-button @click="load">重新检测</el-button></QueryState
      ></el-card
    >
  </div>
  <h2 class="section-title">业务入口</h2>
  <el-empty
    v-if="!entries.length"
    description="当前账户暂无业务权限。您仍可管理个人安全设置。"
  />
  <nav class="entry-grid" aria-label="业务快捷入口">
    <RouterLink v-for="item in entries" :key="item.path" :to="item.path"
      ><small>{{ item.group }}</small
      ><strong>{{ item.title }}</strong
      ><span>进入工作区 →</span></RouterLink
    >
  </nav>
</template>
