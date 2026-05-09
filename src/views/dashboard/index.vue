<template>
  <section class="dashboard">
    <div class="hero">
      <div>
        <div class="eyebrow">Overview</div>
        <h2>Investment Workspace</h2>
        <p>
          Focus on pending analysis, company valuation coverage, and strategy
          tracking from one place.
        </p>
      </div>
      <div class="hero-actions">
        <el-button
          type="primary"
          @click="router.push('/barginhunting/analyte/waitlist')"
          >Open Waitlist</el-button
        >
        <el-button @click="refreshDashboard">Refresh</el-button>
      </div>
    </div>

    <div class="metric-grid">
      <article
        v-for="card in metrics"
        :key="card.key"
        class="metric-card"
        @click="router.push(card.to)"
      >
        <span class="label">{{ card.label }}</span>
        <strong>{{ card.value }}</strong>
        <small>{{ card.helper }}</small>
      </article>
    </div>

    <div class="content-grid">
      <article class="panel">
        <div class="panel-head">
          <div>
            <div class="eyebrow">Queue</div>
            <h3>Pending Analytes</h3>
          </div>
          <el-button
            text
            @click="router.push('/barginhunting/analyte/waitlist')"
            >View All</el-button
          >
        </div>
        <div v-if="loading" class="empty">Loading pending analytes...</div>
        <div v-else-if="waitHighlights.length" class="list">
          <button
            v-for="item in waitHighlights"
            :key="item.analyteId"
            class="list-item"
            type="button"
            @click="router.push('/barginhunting/analyte/waitlist')"
          >
            <strong>{{ item.name }}</strong>
            <span>{{ item.stockCode }} · {{ item.ndate }}</span>
          </button>
        </div>
        <div v-else class="empty">No pending analytes.</div>
      </article>

      <article class="panel shortcuts">
        <div class="panel-head">
          <div>
            <div class="eyebrow">Actions</div>
            <h3>Quick Entry</h3>
          </div>
        </div>
        <div class="shortcut-grid">
          <button
            v-for="item in shortcuts"
            :key="item.label"
            class="shortcut"
            type="button"
            @click="router.push(item.to)"
          >
            <strong>{{ item.label }}</strong>
            <span>{{ item.helper }}</span>
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { getDonePage, getWaitList } from '@/api/analyte'
import { getCompanyList } from '@/api/company'
import { getStrategyList } from '@/api/strategy'

const router = useRouter()
const loading = ref(false)
const waitSummary = ref({ total: 0, list: [] })
const doneSummary = ref({ total: 0 })
const companySummary = ref({ total: 0 })
const strategySummary = ref({ total: 0 })

const metrics = computed(() => [
  {
    key: 'wait',
    label: 'Pending',
    value: waitSummary.value.total,
    helper: 'New analytes waiting for review',
    to: '/barginhunting/analyte/waitlist'
  },
  {
    key: 'done',
    label: 'Completed',
    value: doneSummary.value.total,
    helper: 'Analytes already reviewed',
    to: '/barginhunting/analyte/donelist'
  },
  {
    key: 'strategy',
    label: 'Strategies',
    value: strategySummary.value.total,
    helper: 'Saved trading and research strategies',
    to: '/barginhunting/strategy/strategylist'
  },
  {
    key: 'company',
    label: 'Companies',
    value: companySummary.value.total,
    helper: 'Tracked companies in valuation',
    to: '/companyvaluation/valuation/company'
  }
])

const waitHighlights = computed(() => waitSummary.value.list.slice(0, 4))
const shortcuts = [
  {
    label: 'Company Valuation',
    helper: 'Open the valuation company pool',
    to: '/companyvaluation/valuation/company'
  },
  {
    label: 'Strategy List',
    helper: 'Review saved strategies',
    to: '/barginhunting/strategy/strategylist'
  },
  {
    label: 'Macro Settings',
    helper: 'Maintain shared valuation settings',
    to: '/companyvaluation/settings/macrosettings'
  }
]

refreshDashboard()

async function refreshDashboard() {
  loading.value = true
  try {
    const [waitResult, doneResult, companyResult, strategyResult] =
      await Promise.allSettled([
        getWaitList(),
        getDonePage(),
        getCompanyList(),
        getStrategyList()
      ])

    if (waitResult.status === 'fulfilled') {
      const data = waitResult.value.data || {}
      waitSummary.value = {
        total: data.sum || 0,
        list: data.list || []
      }
    }

    if (doneResult.status === 'fulfilled') {
      const data = doneResult.value.data || {}
      doneSummary.value = { total: data.sum || 0 }
    }

    if (companyResult.status === 'fulfilled') {
      const data = companyResult.value.data || {}
      companySummary.value = { total: data.sum || 0 }
    }

    if (strategyResult.status === 'fulfilled') {
      const data = strategyResult.value.data || {}
      strategySummary.value = { total: (data.strategyList || []).length }
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.dashboard {
  display: grid;
  gap: 22px;
}

.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 28px;
  border-radius: 24px;
  background: linear-gradient(
    135deg,
    #123353 0%,
    #1f517e 55%,
    #dbeaf5 55%,
    #dbeaf5 100%
  );
  color: #fff;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.eyebrow {
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.8;
}

.hero h2 {
  margin: 0 0 8px;
  font-size: 32px;
}

.hero p {
  margin: 0;
  max-width: 560px;
  line-height: 1.6;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.metric-card {
  display: grid;
  gap: 8px;
  padding: 22px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 18px 40px rgba(18, 51, 83, 0.08);
  border: none;
  text-align: left;
  cursor: pointer;
}

.label {
  display: block;
  color: #6f879d;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.metric-card strong {
  font-size: 32px;
  color: #11293f;
}

.metric-card small {
  color: #70859a;
  line-height: 1.5;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.panel {
  padding: 24px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 18px 40px rgba(18, 51, 83, 0.06);
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.panel-head h3 {
  margin: 0;
  color: #11293f;
  font-size: 20px;
}

.list {
  display: grid;
  gap: 10px;
}

.list-item,
.shortcut {
  display: grid;
  gap: 4px;
  width: 100%;
  padding: 14px 16px;
  border: 1px solid rgba(17, 41, 63, 0.08);
  border-radius: 16px;
  background: #f7fafc;
  text-align: left;
  cursor: pointer;
}

.list-item strong,
.shortcut strong {
  color: #17324a;
}

.list-item span,
.shortcut span,
.empty {
  color: #70859a;
  line-height: 1.5;
}

.shortcut-grid {
  display: grid;
  gap: 10px;
}

@media (max-width: 960px) {
  .hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .metric-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1280px) {
  .metric-grid,
  .content-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
