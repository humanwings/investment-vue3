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
          <el-tabs v-model="activeDcfVersion" class="dcf-version-tabs">
            <el-tab-pane label="DCF v1" name="v1">
              <AssumptionStrip :items="dcfV1Assumptions" />
              <div class="metric-grid">
                <ValuationMetric
                  label="DCF v1 每股估值"
                  :value="safeRound(dcfValuationV1.perShareValue) || '-'"
                  :hint="dcfValuationV1.message"
                />
                <ValuationMetric
                  label="终值占比"
                  :value="
                    formatPercent(dcfValuationV1.terminalValueRatio) || '-'
                  "
                  :hint="dcfValuationV1.status"
                />
                <ValuationMetric
                  label="与利润贴现差异"
                  :value="safeRound(dcfValuationV1.profitDcfGap) || '-'"
                  :hint="dcfValuationV1.formulaVersion"
                />
              </div>
              <el-descriptions :column="3" border class="section-block">
                <el-descriptions-item label="模型版本">{{
                  dcfValuationV1.modelVersion || '-'
                }}</el-descriptions-item>
                <el-descriptions-item label="场景">{{
                  dcfValuationV1.scenarioKey || '-'
                }}</el-descriptions-item>
                <el-descriptions-item label="公式版本">{{
                  dcfValuationV1.formulaVersion || '-'
                }}</el-descriptions-item>
                <el-descriptions-item label="现金流口径">{{
                  dcfValuationV1.cashFlowBasis || '-'
                }}</el-descriptions-item>
                <el-descriptions-item label="参数来源">{{
                  dcfValuationV1.defaultParameterSource || '-'
                }}</el-descriptions-item>
                <el-descriptions-item label="基准自由现金流">{{
                  safeRound(dcfValuationV1.baseFreeCashFlow) || '-'
                }}</el-descriptions-item>
                <el-descriptions-item label="DCF 企业价值">{{
                  safeRound(dcfValuationV1.enterpriseValue) || '-'
                }}</el-descriptions-item>
                <el-descriptions-item label="DCF 股权价值">{{
                  safeRound(dcfValuationV1.equityValue) || '-'
                }}</el-descriptions-item>
                <el-descriptions-item label="净债务">{{
                  safeRound(dcfValuationV1.netDebt) || '-'
                }}</el-descriptions-item>
                <el-descriptions-item label="偏离率">{{
                  formatPercent(dcfValuationV1.deviation) || '-'
                }}</el-descriptions-item>
                <el-descriptions-item label="更新时间">{{
                  dcfValuationV1.updatedAt || '-'
                }}</el-descriptions-item>
              </el-descriptions>
            </el-tab-pane>

            <el-tab-pane label="DCF v2" name="v2">
              <AssumptionStrip :items="dcfV2Assumptions" />
              <div class="metric-grid">
                <ValuationMetric
                  label="DCF v2 每股估值"
                  :value="safeRound(dcfValuationV2.perShareValue) || '-'"
                  :hint="dcfValuationV2.message"
                />
                <ValuationMetric
                  label="终值占比"
                  :value="
                    formatPercent(dcfValuationV2.terminalValueRatio) || '-'
                  "
                  :hint="dcfValuationV2.status"
                />
                <ValuationMetric
                  label="与利润贴现差异"
                  :value="safeRound(dcfValuationV2.profitDcfGap) || '-'"
                  :hint="dcfValuationV2.formulaVersion"
                />
              </div>
              <el-descriptions :column="3" border class="section-block">
                <el-descriptions-item label="模型版本">{{
                  dcfValuationV2.modelVersion || '-'
                }}</el-descriptions-item>
                <el-descriptions-item label="场景">{{
                  dcfValuationV2.scenarioKey || '-'
                }}</el-descriptions-item>
                <el-descriptions-item label="公式版本">{{
                  dcfValuationV2.formulaVersion || '-'
                }}</el-descriptions-item>
                <el-descriptions-item label="现金流口径">{{
                  dcfValuationV2.cashFlowBasis || '-'
                }}</el-descriptions-item>
                <el-descriptions-item label="参数来源">{{
                  dcfValuationV2.defaultParameterSource || '-'
                }}</el-descriptions-item>
                <el-descriptions-item label="DCF 企业价值">{{
                  safeRound(dcfValuationV2.enterpriseValue) || '-'
                }}</el-descriptions-item>
                <el-descriptions-item label="DCF 股权价值">{{
                  safeRound(dcfValuationV2.equityValue) || '-'
                }}</el-descriptions-item>
                <el-descriptions-item label="偏离率">{{
                  formatPercent(dcfValuationV2.deviation) || '-'
                }}</el-descriptions-item>
                <el-descriptions-item label="更新时间">{{
                  dcfValuationV2.updatedAt || '-'
                }}</el-descriptions-item>
              </el-descriptions>
            </el-tab-pane>

            <el-tab-pane label="v1/v2差异" name="compare">
              <div class="metric-grid">
                <ValuationMetric
                  label="v2 - v1 每股差异"
                  :value="safeRound(dcfComparison.perShareGap) || '-'"
                />
                <ValuationMetric
                  label="v2 - v1 偏离率差异"
                  :value="formatPercent(dcfComparison.deviationGap) || '-'"
                />
                <ValuationMetric
                  label="对比状态"
                  :value="dcfComparison.status"
                />
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-tab-pane>

      <el-tab-pane label="财务评价" name="financial">
        <div class="page-card">
          <div class="section-head">
            <h3>财务评价</h3>
          </div>

          <AssumptionStrip :items="financialHighlightItems" />

          <div class="financial-layout section-block">
            <section
              v-for="group in financialMetricGroups"
              :key="group.title"
              class="financial-section"
            >
              <div class="section-head">
                <h3>{{ group.title }}</h3>
              </div>
              <div class="financial-metric-grid">
                <div
                  v-for="item in group.items"
                  :key="`${group.title}-${item.label}`"
                  class="financial-metric"
                  :class="`financial-metric--${item.status || 'neutral'}`"
                >
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value || '-' }}</strong>
                  <small>{{ item.description }}</small>
                </div>
              </div>
            </section>

            <section class="financial-section">
              <div class="section-head">
                <h3>风险提示</h3>
              </div>
              <ul class="risk-list">
                <li
                  v-for="item in financialReview.riskWarnings || []"
                  :key="item"
                >
                  {{ item }}
                </li>
              </ul>
            </section>
          </div>

          <div class="section-head section-block">
            <h3>最新财务快照</h3>
          </div>
          <el-descriptions :column="4" border>
            <el-descriptions-item label="报告日期">{{
              latestReport.date
            }}</el-descriptions-item>
            <el-descriptions-item label="加权 ROE">{{
              formatPercent(latestReport.wroe)
            }}</el-descriptions-item>
            <el-descriptions-item label="每股经营现金流">{{
              safeRound(latestReport.operatingCashFlowPer)
            }}</el-descriptions-item>
            <el-descriptions-item label="资产负债率">{{
              formatPercent(latestReport.assetLiabilityRatio)
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
const activeDcfVersion = ref(resolveInitialDcfVersion(route.query?.dcfVersion))
const loading = ref(false)
const overview = reactive({})
const profitValuation = reactive({})
const dcfValuation = reactive({})
const dcfValuationV1 = reactive({})
const dcfValuationV2 = reactive({})
const financialReview = reactive({})
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
    summary:
      safeRound(dcfValuationV1.perShareValue) ||
      dcfValuationV1.message ||
      '后续接入'
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

const dcfV1Assumptions = computed(() => buildDcfAssumptions(dcfValuationV1))

const dcfV2Assumptions = computed(() => buildDcfAssumptions(dcfValuationV2))

const dcfComparison = computed(() => ({
  perShareGap: gap(dcfValuationV2.perShareValue, dcfValuationV1.perShareValue),
  deviationGap: gap(dcfValuationV2.deviation, dcfValuationV1.deviation),
  status:
    hasNumber(dcfValuationV1.perShareValue) &&
    hasNumber(dcfValuationV2.perShareValue)
      ? '可对比'
      : '等待 v2 结果'
}))

const financialMetricGroups = computed(() => [
  {
    title: '盈利能力',
    items: financialReview.profitability || []
  },
  {
    title: '现金流质量',
    items: financialReview.cashFlowQuality || []
  },
  {
    title: '分红稳定性',
    items: financialReview.dividendStability || []
  },
  {
    title: '偿债能力',
    items: financialReview.solvency || []
  },
  {
    title: '资产结构',
    items: financialReview.assetStructure || []
  }
])

const financialHighlightItems = computed(() => {
  const highlights = financialReview.highlights || []
  if (!highlights.length) {
    return [
      {
        label: '财务亮点',
        value: '-',
        source: '等待数据'
      }
    ]
  }
  return highlights.slice(0, 3).map((item, index) => ({
    label: `财务亮点 ${index + 1}`,
    value: item,
    source: latestReport.date || '最新财报'
  }))
})

function resolveInitialTab(tab) {
  return ['overview', 'profit', 'dcf', 'financial', 'recommend'].includes(tab)
    ? tab
    : 'overview'
}

function resolveInitialDcfVersion(version) {
  return ['v1', 'v2', 'compare'].includes(version) ? version : 'v1'
}

async function loadDetail() {
  loading.value = true
  try {
    const { data } = await getCompanyOverview(companyId)
    const dcfV1 = data.dcfValuationV1 || data.dcfValuation || {}
    const dcfV2 = data.dcfValuationV2 || {}
    Object.assign(overview, data.overview || {})
    Object.assign(profitValuation, data.profitValuation || {})
    Object.assign(dcfValuation, dcfV1)
    Object.assign(dcfValuationV1, dcfV1)
    Object.assign(dcfValuationV2, dcfV2)
    Object.assign(financialReview, data.financialReview || {})
    Object.assign(latestReport, financialReview.latestReport || {})
    Object.assign(recommendationSummary, data.recommendationSummary || {})
    dividendList.value = financialReview.dividendList || []
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

function appliedOrPrediction(applied, prediction) {
  return applied ?? prediction
}

function buildDcfAssumptions(valuation) {
  return [
    {
      label: '营收增长率',
      value: formatPercent(
        appliedOrPrediction(
          valuation.revenueGrowthRateApplied,
          valuation.revenueGrowthRatePrediction
        )
      ),
      source: hasValue(valuation.revenueGrowthRateApplied)
        ? '采用值'
        : '系统预测'
    },
    {
      label: '折现率',
      value: formatPercent(
        appliedOrPrediction(
          valuation.discountRateApplied,
          valuation.discountRatePrediction
        )
      ),
      source: hasValue(valuation.discountRateApplied) ? '采用值' : '系统预测'
    },
    {
      label: '永续增长率',
      value: formatPercent(
        appliedOrPrediction(
          valuation.terminalGrowthRateApplied,
          valuation.terminalGrowthRatePrediction
        )
      ),
      source: hasValue(valuation.terminalGrowthRateApplied)
        ? '采用值'
        : '系统预测'
    }
  ]
}

function gap(current, baseline) {
  if (!hasNumber(current) || !hasNumber(baseline)) {
    return null
  }
  return current - baseline
}

function hasNumber(value) {
  return typeof value === 'number' && !Number.isNaN(value)
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== ''
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

.dcf-version-tabs {
  min-width: 0;
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

.financial-layout {
  display: grid;
  gap: 18px;
}

.financial-section {
  min-width: 0;
}

.financial-metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.financial-metric {
  display: grid;
  gap: 5px;
  min-width: 0;
  padding: 12px 14px;
  border-left: 3px solid rgba(25, 58, 84, 0.18);
  background: rgba(255, 255, 255, 0.68);
}

.financial-metric--good {
  border-left-color: #1d7f58;
}

.financial-metric--warn {
  border-left-color: #c43c2d;
}

.financial-metric span,
.financial-metric small {
  overflow-wrap: anywhere;
  color: var(--app-text-muted);
  font-size: 12px;
}

.financial-metric strong {
  overflow-wrap: anywhere;
  color: var(--app-text);
  font-size: 17px;
  line-height: 1.25;
}

.risk-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 18px;
  color: var(--app-text);
}
</style>
