<template>
  <section v-loading="loading" class="dashboard">
    <header class="dash-hero">
      <div>
        <div class="dash-eyebrow">个人投资决策工作台</div>
        <h1>投资工作台</h1>
      </div>
      <div class="dash-date">{{ today }}</div>
    </header>

    <AssetSection :assets="assetCards" :trend="assetTrend" />
    <AlertSection :alerts="alerts" />
    <QuickEntry :entries="quickEntry" />
  </section>
</template>

<script setup>
import { computed, onMounted } from 'vue'

import AlertSection from './components/AlertSection.vue'
import AssetSection from './components/AssetSection.vue'
import QuickEntry from './components/QuickEntry.vue'
import { useDashboard } from './composables/useDashboard'

const { loading, refresh, assetCards, assetTrend, alerts, quickEntry } =
  useDashboard()

const today = computed(() =>
  new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
)

onMounted(refresh)
</script>

<style scoped lang="scss">
.dashboard {
  --dash-surface: #ffffff;
  --dash-border: rgba(16, 34, 53, 0.09);
  --dash-text: #102235;
  --dash-muted: #6f879d;
  --dash-accent: #d99a4d;
  --dash-accent-soft: rgba(217, 154, 77, 0.12);
  --dash-up: #f56c6c;
  --dash-down: #67c23a;
  --dash-warn: #d9892f;
  --dash-shadow: 0 14px 34px rgba(16, 34, 53, 0.08);

  display: grid;
  gap: var(--app-page-gap);
  min-width: 0;
  padding: 2px;
  color: var(--dash-text);
}

.dash-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin: 8px 6px 2px;
}

.dash-hero h1 {
  margin: 6px 0 0;
  font-size: 28px;
  letter-spacing: 0.01em;
  color: var(--dash-text);
}

.dash-date {
  color: var(--dash-muted);
  font-size: 14px;
  white-space: nowrap;
}

@media (max-width: 720px) {
  .dash-hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

<style lang="scss">
.dash-eyebrow {
  color: var(--dash-accent);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.dash-panel {
  padding: var(--app-card-padding);
  border-radius: var(--app-radius-xl);
  background: var(--app-surface);
  box-shadow: var(--app-shadow);
  min-width: 0;
}

.section-title {
  margin-bottom: 16px;
  color: var(--dash-text);
  font-size: 16px;
  font-weight: 700;
  position: relative;
  padding-left: 12px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 4px;
  height: 14px;
  border-radius: 3px;
  transform: translateY(-50%);
  background: var(--dash-accent);
}

.dash-empty {
  padding: 18px;
  color: var(--dash-muted);
  border: 1px dashed var(--dash-border);
  border-radius: 14px;
  text-align: center;
}
</style>
