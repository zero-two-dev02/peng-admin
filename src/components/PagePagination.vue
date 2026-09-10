<script setup lang="ts">
defineProps<{
  page: number;
  total: number;
  size?: number;
  disabled?: boolean;
}>();
defineEmits<{ change: [page: number] }>();
</script>
<template>
  <el-pagination
    class="page-pagination"
    :current-page="page"
    :page-size="size ?? 20"
    :total="total"
    :disabled="disabled"
    layout="total, prev, pager, next"
    :pager-count="5"
    @current-change="$emit('change', $event)"
  />
</template>
