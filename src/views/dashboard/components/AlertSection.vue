<template>
  <section class="dash-panel">
    <div class="section-title">待办提醒</div>
    <div class="alert-grid">
      <button
        v-for="alert in alerts"
        :key="alert.key"
        type="button"
        class="alert-card"
        :class="'is-' + alert.type"
        @click="go(alert.to)"
      >
        <div class="alert-main">
          <span class="alert-label">{{ alert.label }}</span>
          <strong class="alert-value">{{ alert.value }}</strong>
        </div>
        <div class="alert-side">
          <span class="alert-helper">{{ alert.helper }}</span>
          <span class="alert-arrow">›</span>
        </div>
      </button>
    </div>
  </section>
</template>

<script setup>
import { useRouter } from 'vue-router'

defineProps({
  alerts: { type: Array, default: () => [] }
})
const router = useRouter()

function go(to) {
  router.push(to)
}
</script>

<style scoped lang="scss">
.alert-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.alert-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px;
  border-radius: 16px;
  border: 1px solid var(--dash-border);
  background: var(--dash-surface);
  text-align: left;
  cursor: pointer;
}

.alert-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--dash-shadow);
}

.alert-main {
  display: grid;
  gap: 6px;
}

.alert-label {
  color: var(--dash-muted);
  font-size: 13px;
}

.alert-value {
  font-size: 30px;
  line-height: 1;
  color: var(--dash-text);
}

.alert-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.alert-helper {
  color: var(--dash-muted);
  font-size: 12px;
}

.alert-arrow {
  color: var(--dash-muted);
  font-size: 18px;
  line-height: 1;
}

.alert-card.is-warn .alert-value {
  color: var(--dash-warn);
}

.alert-card.is-danger .alert-value {
  color: var(--dash-up);
}

.alert-card.is-up .alert-value {
  color: var(--dash-down);
}

@media (max-width: 1100px) {
  .alert-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
