<template>
  <section class="dashboard">
    <div class="hero">
      <div>
        <div class="eyebrow">Overview</div>
        <h2>投资分析工作台</h2>
        <p>集中查看待处理数据、估值覆盖、策略数量和推荐榜状态，直接进入高频业务页面。</p>
      </div>
      <div class="hero-actions">
        <el-button type="primary" @click="router.push('/barginhunting/analyte/waitlist')">处理新数据</el-button>
        <el-button @click="refreshDashboard">刷新看板</el-button>
      </div>
    </div>

    <div class="metric-grid">
      <article v-for="card in metrics" :key="card.key" class="metric-card" @click="router.push(card.to)">
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
            <h3>待处理数据</h3>
          </div>
          <el-button text @click="router.push('/barginhunting/analyte/waitlist')">查看全部</el-button>
        </div>
        <div v-if="loading" class="empty">正在加载概览数据...</div>
        <div v-else-if="waitHighlights.length" class="list">
          <button v-for="item in waitHighlights" :key="item.analyteId" class="list-item" type="button" @click="router.push('/barginhunting/analyte/waitlist')">
            <strong>{{ item.name }}</strong>
            <span>{{ item.stockCode }} · {{ item.ndate }}</span>
          </button>
        </div>
        <div v-else class="empty">当前没有待处理数据</div>
      </article>

      <article class="panel">
        <div class="panel-head">
          <div>
            <div class="eyebrow">Ranking</div>
            <h3>推荐榜前列</h3>
          </div>
          <el-button text @click="router.push('/companyvaluation/valuation/recommend')">进入榜单</el-button>
        </div>
        <div v-if="loading" class="empty">正在加载推荐榜...</div>
        <div v-else-if="recommendHighlights.length" class="list">
          <button
            v-for="item in recommendHighlights"
            :key="item.stockCode"
            class="list-item"
            type="button"
            @click="goRecommendDetail(item)"
          >
            <strong>{{ item.rankNo }}. {{ item.stockName }}</strong>
            <span>{{ item.stockCode }} · 推荐分 {{ item.recommendScore ?? '-' }}</span>
          </button>
        </div>
        <div v-else class="empty">当前没有推荐榜数据</div>
      </article>

      <article class="panel shortcuts">
        <div class="panel-head">
          <div>
            <div class="eyebrow">Actions</div>
            <h3>快捷入口</h3>
          </div>
        </div>
        <div class="shortcut-grid">
          <button v-for="item in shortcuts" :key="item.label" class="shortcut" type="button" @click="router.push(item.to)">
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
import { getRecommendRank } from '@/api/recommend'
import { getStrategyList } from '@/api/strategy'

const router = useRouter()
const loading = ref(false)
const waitSummary = ref({ total: 0, list: [] })
const doneSummary = ref({ total: 0 })
const companySummary = ref({ total: 0 })
const strategySummary = ref({ total: 0 })
const recommendSummary = ref({ total: 0, snapshotDate: '', list: [] })

const metrics = computed(() => [
  {
    key: 'wait',
    label: '待处理数据',
    value: waitSummary.value.total,
    helper: '新导入且待决策的数据项',
    to: '/barginhunting/analyte/waitlist'
  },
  {
    key: 'done',
    label: '历史数据',
    value: doneSummary.value.total,
    helper: '已处理并沉淀的历史记录',
    to: '/barginhunting/analyte/donelist'
  },
  {
    key: 'strategy',
    label: '策略数量',
    value: strategySummary.value.total,
    helper: '当前可维护的交易策略',
    to: '/barginhunting/strategy/strategylist'
  },
  {
    key: 'company',
    label: '估值公司',
    value: companySummary.value.total,
    helper: '已纳入估值池的公司',
    to: '/companyvaluation/valuation/company'
  },
  {
    key: 'recommend',
    label: '推荐榜股票',
    value: recommendSummary.value.total,
    helper: recommendSummary.value.snapshotDate ? `榜单日期 ${recommendSummary.value.snapshotDate}` : '最新推荐榜概览',
    to: '/companyvaluation/valuation/recommend'
  }
])

const waitHighlights = computed(() => waitSummary.value.list.slice(0, 4))
const recommendHighlights = computed(() => recommendSummary.value.list.slice(0, 5))
const shortcuts = [
  { label: '公司估值', helper: '管理估值池与价格更新', to: '/companyvaluation/valuation/company' },
  { label: '策略一览', helper: '检证、比较和维护策略', to: '/barginhunting/strategy/strategylist' },
  { label: '大V管理', helper: '维护作者及原始推荐数据', to: '/companyvaluation/settings/recommendauthors' },
  { label: '参数设置', helper: '调整宏观与行业参数', to: '/companyvaluation/settings/macrosettings' }
]

refreshDashboard()

async function refreshDashboard() {
  loading.value = true
  try {
    const [waitResult, doneResult, companyResult, strategyResult, recommendResult] = await Promise.allSettled([
      getWaitList(),
      getDonePage(),
      getCompanyList(),
      getStrategyList(),
      getRecommendRank({})
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

    if (recommendResult.status === 'fulfilled') {
      const data = recommendResult.value.data || {}
      recommendSummary.value = {
        total: data.sum || 0,
        snapshotDate: data.snapshotDate || '',
        list: data.list || []
      }
    }
  } finally {
    loading.value = false
  }
}

function goRecommendDetail(item) {
  router.push({
    name: 'RecommendDetail',
    params: { stockCode: item.stockCode },
    query: recommendSummary.value.snapshotDate ? { snapshotDate: recommendSummary.value.snapshotDate } : {}
  })
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
  background: linear-gradient(135deg, #123353 0%, #1f517e 55%, #dbeaf5 55%, #dbeaf5 100%);
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
  grid-template-columns: repeat(5, minmax(0, 1fr));
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
