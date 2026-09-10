<script setup lang="ts">
defineProps<{ loading: boolean; error: string; empty?: boolean }>();
defineEmits<{ retry: [] }>();
</script>
<template>
  <div v-if="loading" role="status" class="query-state">
    <el-skeleton :rows="4" animated /><span>正在加载…</span>
  </div>
  <div v-else-if="error" role="alert" class="query-state">
    <el-alert :title="error" type="error" :closable="false" /><el-button
      @click="$emit('retry')"
      >重新查询</el-button
    >
  </div>
  <el-empty v-else-if="empty" description="当前筛选条件下暂无数据" />
  <slot v-else />
</template>
