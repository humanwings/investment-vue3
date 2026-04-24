<template>
  <div class="assumption-strip">
    <div v-for="item in items" :key="item.label" class="assumption-item">
      <span>{{ item.label }}</span>
      <strong>{{ item.value || '-' }}</strong>
      <small v-if="item.source">{{ item.source }}</small>
    </div>
  </div>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    default: () => []
  }
})
</script>

<style scoped lang="scss">
.assumption-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
}

.assumption-item {
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 12px 14px;
  border-radius: 8px;
  background: rgba(23, 50, 74, 0.06);
}

span,
small {
  color: var(--app-text-muted);
  font-size: 12px;
}

strong {
  overflow-wrap: anywhere;
  color: var(--app-text);
  font-size: 16px;
  line-height: 1.25;
}
</style>
