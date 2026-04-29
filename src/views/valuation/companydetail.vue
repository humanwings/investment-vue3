<template>
  <section v-loading="loading" class="page-shell company-overview">
    <div class="page-header">
      <div>
        <el-button
          text
          @click="router.push('/companyvaluation/valuation/company')"
          >返回列表</el-button
        >
        <div class="eyebrow">Company Overview</div>
        <h2>{{ overview.name || `公司 #${companyId}` }}</h2>
      </div>
      <div class="header-actions">
        <el-tag type="success">companyId {{ companyId }}</el-tag>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="overview-tabs">
      <el-tab-pane label="总览" name="overview">
        <div class="overview-grid">
          <div class="page-card">
            <div class="section-head">
              <h3>核心摘要</h3>
            </div>
            <div class="metric-grid">
              <ValuationMetric
                label="现价"
                :value="safeRound(overview.price)"
              />
              <ValuationMetric
                label="利润贴现估值"
                :value="safeRound(overview.profitValuation)"
              />
              <ValuationMetric
                label="价值偏离"
                :value="formatPercent(overview.profitDeviation)"
              />
              <ValuationMetric label="综合评分" :value="overview.totalScore" />
              <ValuationMetric
                label="财务评分"
                :value="overview.financialScore"
              />
              <ValuationMetric
                label="大V评分"
                :value="overview.recommendationScore"
              />
            </div>
          </div>

          <div class="page-card overview-focus">
            <div class="section-head">
              <h3>当前结论</h3>
            </div>
            <el-tag :type="conclusionType(overview.conclusion)">
              {{ overview.conclusion || '待补数据' }}
            </el-tag>
            <ul class="highlight-list">
              <li v-for="item in overview.highlights || []" :key="item">
                {{ item }}
              </li>
            </ul>
          </div>

          <div class="page-card nav-grid">
            <button
              v-for="item in researchNavItems"
              :key="item.name"
              type="button"
              class="nav-card"
              @click="activeTab = item.name"
            >
              <strong>{{ item.label }}</strong>
              <span>{{ item.summary }}</span>
            </button>
          </div>

          <div class="page-card">
            <div class="section-head">
              <h3>基本信息</h3>
            </div>
            <el-descriptions :column="3" border>
              <el-descriptions-item label="证券代码">{{
                overview.stockCode
              }}</el-descriptions-item>
              <el-descriptions-item label="交易所">{{
                overview.exchange
              }}</el-descriptions-item>
              <el-descriptions-item label="报表类型">{{
                overview.fsTableType
              }}</el-descriptions-item>
              <el-descriptions-item label="IPO 时间">{{
                overview.ipoDate
              }}</el-descriptions-item>
              <el-descriptions-item label="省份">{{
                overview.province
              }}</el-descriptions-item>
              <el-descriptions-item label="实控人">{{
                overview.actualControllerTypes
              }}</el-descriptions-item>
              <el-descriptions-item label="一级行业">{{
                overview.firstIndustry
              }}</el-descriptions-item>
              <el-descriptions-item label="二级行业">{{
                overview.secondIndustry
              }}</el-descriptions-item>
              <el-descriptions-item label="三级行业">{{
                overview.thirdIndustry
              }}</el-descriptions-item>
              <el-descriptions-item :span="3" label="主营业务">{{
                overview.mainBusiness
              }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="利润贴现" name="profit">
        <div class="page-card">
          <div class="section-head">
            <h3>利润贴现模型</h3>
          </div>
          <AssumptionStrip :items="profitAssumptions" />
          <el-descriptions :column="4" border class="section-block">
            <el-descriptions-item label="利润贴现估值">{{
              safeRound(profitValuation.valuation)
            }}</el-descriptions-item>
            <el-descriptions-item label="价值偏离">{{
              formatPercent(profitValuation.deviation)
            }}</el-descriptions-item>
            <el-descriptions-item label="高增长年数">{{
              profitValuation.growthYears
            }}</el-descriptions-item>
            <el-descriptions-item label="折现率">{{
              profitValuation.discountRate
            }}</el-descriptions-item>
            <el-descriptions-item label="高增长期估值">{{
              profitValuation.highGrowthValuation
            }}</el-descriptions-item>
            <el-descriptions-item label="永续期增速">{{
              formatPercent(profitValuation.perpetualGrowthRate)
            }}</el-descriptions-item>
            <el-descriptions-item label="永续期估值">{{
              profitValuation.perpetualValuation
            }}</el-descriptions-item>
            <el-descriptions-item label="最终估值">{{
              safeRound(profitValuation.finalValuation)
            }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-tab-pane>

      <el-tab-pane label="DCF" name="dcf">
        <div class="page-card placeholder-panel">
          <div class="section-head">
            <h3>DCF模型</h3>
          </div>
          <div class="metric-grid">
            <ValuationMetric
              label="DCF 每股估值"
              value="-"
              :hint="dcfValuation.message"
            />
            <ValuationMetric
              label="终值占比"
              value="-"
              :hint="dcfValuation.status"
            />
            <ValuationMetric
              label="与利润贴现差异"
              value="-"
              :hint="dcfValuation.message"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="财务评价" name="financial">
        <div class="page-card">
          <div class="section-head">
            <h3>最新财务信息</h3>
          </div>
          <el-descriptions :column="4" border>
            <el-descriptions-item label="报告日期">{{
              latestReport.date
            }}</el-descriptions-item>
            <el-descriptions-item label="加权 ROE">{{
              formatPercent(latestReport.wroe)
            }}</el-descriptions-item>
            <el-descriptions-item label="加权扣非 ROE">{{
              formatPercent(latestReport.wdroe)
            }}</el-descriptions-item>
            <el-descriptions-item label="每股净资产">{{
              safeRound(latestReport.netAssetValuePer)
            }}</el-descriptions-item>
            <el-descriptions-item label="每股扣非净利润">{{
              safeRound(latestReport.npadnrpatoshaopcPer)
            }}</el-descriptions-item>
            <el-descriptions-item label="每股经营现金流">{{
              safeRound(latestReport.operatingCashFlowPer)
            }}</el-descriptions-item>
            <el-descriptions-item label="每股自由现金流">{{
              safeRound(latestReport.freeCashFlowPer)
            }}</el-descriptions-item>
            <el-descriptions-item label="毛利率">{{
              formatPercent(latestReport.grossMargin)
            }}</el-descriptions-item>
            <el-descriptions-item label="资产负债率">{{
              formatPercent(latestReport.assetLiabilityRatio)
            }}</el-descriptions-item>
            <el-descriptions-item label="有息负债率">{{
              formatPercent(latestReport.interestLiabilityRatio)
            }}</el-descriptions-item>
            <el-descriptions-item label="营业收入本季度增长率">{{
              formatPercent(latestReport.incomeGrowthRateCurrent)
            }}</el-descriptions-item>
            <el-descriptions-item label="扣非利润本季度增长率">{{
              formatPercent(latestReport.profitGrowthRateCurrent)
            }}</el-descriptions-item>
            <el-descriptions-item label="营业收入累积增长率">{{
              formatPercent(latestReport.incomeGrowthRateTotal)
            }}</el-descriptions-item>
            <el-descriptions-item label="扣非利润累积增长率">{{
              formatPercent(latestReport.profitGrowthRateTotal)
            }}</el-descriptions-item>
          </el-descriptions>

          <div class="section-head section-block">
            <h3>最近五年分红信息</h3>
          </div>
          <div class="table-shell">
            <el-table :data="dividendList" size="small">
              <el-table-column prop="dividendYear" label="年份" width="100" />
              <el-table-column label="分红金额">
                <template #default="{ row }">
                  {{ formatYi(row.dividendAmount) }}
                </template>
              </el-table-column>
              <el-table-column label="自由现金流">
                <template #default="{ row }">
                  {{ formatYi(row.freeCashFlow) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="大V推荐" name="recommend">
        <div class="page-card placeholder-panel">
          <div class="section-head">
            <h3>大V推荐摘要</h3>
          </div>
          <div class="metric-grid">
            <ValuationMetric
              label="大V评分"
              :value="recommendationSummary.score"
            />
            <ValuationMetric
              label="推荐人数"
              value="-"
              :hint="recommendationSummary.message"
            />
            <ValuationMetric
              label="最近推荐日"
              value="-"
              :hint="recommendationSummary.status"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getCompanyOverview } from '@/api/valuation-query'
import { formatPercent, formatYi, roundToDecimal } from '@/utils'
import AssumptionStrip from './components/AssumptionStrip.vue'
import ValuationMetric from './components/ValuationMetric.vue'

const route = useRoute()
const router = useRouter()
const companyId = route.params.id

const activeTab = ref(resolveInitialTab(route.query?.tab))
const loading = ref(false)
const overview = reactive({})
const profitValuation = reactive({})
const dcfValuation = reactive({})
const latestReport = reactive({})
const recommendationSummary = reactive({})
const dividendList = ref([])

loadDetail()

const researchNavItems = computed(() => [
  {
    name: 'profit',
    label: '利润贴现',
    summary: `估值 ${safeRound(profitValuation.valuation) || '-'}`
  },
  {
    name: 'dcf',
    label: 'DCF',
    summary: dcfValuation.message || '后续接入'
  },
  {
    name: 'financial',
    label: '财务评价',
    summary: latestReport.date || '等待财报'
  },
  {
    name: 'recommend',
    label: '大V推荐',
    summary: `评分 ${recommendationSummary.score ?? '-'}`
  }
])

const profitAssumptions = computed(() => [
  {
    label: '系统增长率',
    value: formatPercentRatePoint(profitValuation.growthRatePrediction),
    source: '模型预测'
  },
  {
    label: '手动增长率',
    value: formatPercentRatePoint(profitValuation.growthRateAssumption),
    source: '研究覆盖'
  },
  {
    label: '采用增长率',
    value: formatPercentRatePoint(profitValuation.growthRateApplied),
    source: '当前计算'
  }
])

function resolveInitialTab(tab) {
  return ['overview', 'profit', 'dcf', 'financial', 'recommend'].includes(tab)
    ? tab
    : 'overview'
}

async function loadDetail() {
  loading.value = true
  try {
    const { data } = await getCompanyOverview(companyId)
    Object.assign(overview, data.overview || {})
    Object.assign(profitValuation, data.profitValuation || {})
    Object.assign(dcfValuation, data.dcfValuation || {})
    Object.assign(latestReport, data.financialReview?.latestReport || {})
    Object.assign(recommendationSummary, data.recommendationSummary || {})
    dividendList.value = data.financialReview?.dividendList || []
  } finally {
    loading.value = false
  }
}

function safeRound(value) {
  return value === null || value === undefined ? '' : roundToDecimal(value, 2)
}

function formatPercentRatePoint(value) {
  if (value === null || value === undefined || value === '') {
    return ''
  }
  return `${Number(value).toFixed(2)}%`
}

function conclusionType(conclusion) {
  if (conclusion === '重点关注') {
    return 'success'
  }
  if (conclusion === '偏贵') {
    return 'warning'
  }
  if (conclusion === '待补数据') {
    return 'info'
  }
  return ''
}
</script>

<style scoped lang="scss">
.company-overview {
  min-width: 0;
}

.overview-tabs {
  min-width: 0;
}

.overview-grid {
  display: grid;
  gap: var(--app-page-gap);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.section-head {
  margin-bottom: 14px;
}

.section-block {
  margin-top: 18px;
}

.placeholder-panel {
  display: grid;
  gap: 12px;
}

.overview-focus {
  display: grid;
  gap: 12px;
}

.highlight-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 18px;
  color: var(--app-text);
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.nav-card {
  display: grid;
  gap: 6px;
  min-width: 0;
  padding: 14px 16px;
  border: 1px solid rgba(16, 34, 53, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
  color: var(--app-text);
  text-align: left;
  cursor: pointer;
}

.nav-card strong,
.nav-card span {
  overflow-wrap: anywhere;
}

.nav-card span {
  color: var(--app-text-muted);
  font-size: 12px;
}
</style>
