<script setup lang="ts">
defineProps<{ title: string; description?: string }>();
</script>
<template>
  <header class="page-heading">
    <div>
      <p class="eyebrow">YUDAO · OPERATIONS</p>
      <h1>{{ title }}</h1>
      <p v-if="description" class="muted-text">{{ description }}</p>
    </div>
    <div class="actions"><slot /></div>
  </header>
</template>
