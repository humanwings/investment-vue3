<template>
  <section class="dash-panel">
    <div class="section-title">快捷入口</div>
    <div class="entry-grid">
      <button
        v-for="entry in entries"
        :key="entry.key"
        type="button"
        class="entry-card"
        @click="go(entry.to)"
      >
        <span class="entry-label">{{ entry.label }}</span>
        <span v-if="entry.badge" class="entry-badge">{{ entry.badge }}</span>
      </button>
    </div>
  </section>
</template>

<script setup>
import { useRouter } from 'vue-router'

defineProps({
  entries: { type: Array, default: () => [] }
})
const router = useRouter()

function go(to) {
  router.push(to)
}
</script>

<style scoped lang="scss">
.entry-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.entry-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px;
  border-radius: 16px;
  border: 1px solid var(--dash-border);
  background: var(--dash-surface);
  color: var(--dash-text);
  text-align: left;
  cursor: pointer;
}

.entry-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--dash-shadow);
}

.entry-label {
  font-weight: 600;
}

.entry-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 26px;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--dash-accent-soft);
  color: var(--dash-accent);
  font-size: 13px;
  font-weight: 700;
}

@media (max-width: 1100px) {
  .entry-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
