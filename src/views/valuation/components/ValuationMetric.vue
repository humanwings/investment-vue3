<template>
  <div class="valuation-metric">
    <span class="metric-label">{{ label }}</span>
    <strong>{{ displayValue }}</strong>
    <small v-if="hint">{{ hint }}</small>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    default: ''
  },
  hint: {
    type: String,
    default: ''
  },
  emptyText: {
    type: String,
    default: '-'
  }
})

const displayValue = computed(() => {
  if (props.value === null || props.value === undefined || props.value === '') {
    return props.emptyText
  }
  return props.value
})
</script>

<style scoped lang="scss">
.valuation-metric {
  display: grid;
  gap: 6px;
  min-width: 0;
  padding: 14px 16px;
  border: 1px solid rgba(16, 34, 53, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.62);
}

.metric-label,
small {
  color: var(--app-text-muted);
  font-size: 12px;
}

strong {
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--app-text);
  font-size: 20px;
  line-height: 1.2;
}
</style>
