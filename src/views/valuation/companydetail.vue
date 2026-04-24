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
        <h2>{{ company.name || `公司 #${companyId}` }}</h2>
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
                :value="safeRound(valuation.price)"
              />
              <ValuationMetric
                label="利润贴现估值"
                :value="safeRound(valuation.valuation)"
              />
              <ValuationMetric
                label="价值偏离"
                :value="formatPercent(valuation.deviation)"
              />
              <ValuationMetric label="综合评分" :value="valuation.score" />
              <ValuationMetric
                label="财务评分"
                :value="valuation.financialScore"
              />
              <ValuationMetric
                label="大V评分"
                :value="valuation.recommendationScore"
              />
            </div>
          </div>

          <div class="page-card">
            <div class="section-head">
              <h3>基本信息</h3>
            </div>
            <el-descriptions :column="3" border>
              <el-descriptions-item label="证券代码">{{
                company.stockCode
              }}</el-descriptions-item>
              <el-descriptions-item label="交易所">{{
                company.exchange
              }}</el-descriptions-item>
              <el-descriptions-item label="报表类型">{{
                company.fsTableType
              }}</el-descriptions-item>
              <el-descriptions-item label="IPO 时间">{{
                company.ipoDate
              }}</el-descriptions-item>
              <el-descriptions-item label="省份">{{
                company.province
              }}</el-descriptions-item>
              <el-descriptions-item label="实控人">{{
                company.actualControllerTypes
              }}</el-descriptions-item>
              <el-descriptions-item label="一级行业">{{
                company.firstIndustry
              }}</el-descriptions-item>
              <el-descriptions-item label="二级行业">{{
                company.secondIndustry
              }}</el-descriptions-item>
              <el-descriptions-item label="三级行业">{{
                company.thirdIndustry
              }}</el-descriptions-item>
              <el-descriptions-item :span="3" label="主营业务">{{
                company.mainBusiness
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
              safeRound(valuation.valuation)
            }}</el-descriptions-item>
            <el-descriptions-item label="价值偏离">{{
              formatPercent(valuation.deviation)
            }}</el-descriptions-item>
            <el-descriptions-item label="高增长年数">{{
              valuationData.growthYears
            }}</el-descriptions-item>
            <el-descriptions-item label="折现率">{{
              valuationData.discountRate
            }}</el-descriptions-item>
            <el-descriptions-item label="高增长期估值">{{
              valuationData.highGrowthValuation
            }}</el-descriptions-item>
            <el-descriptions-item label="永续期增速">{{
              formatPercent(valuationData.perpetualGrowthRate)
            }}</el-descriptions-item>
            <el-descriptions-item label="永续期估值">{{
              valuationData.perpetualValuation
            }}</el-descriptions-item>
            <el-descriptions-item label="最终估值">{{
              totalValuation
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
              hint="第 10 步上线"
            />
            <ValuationMetric label="终值占比" value="-" hint="第 10 步上线" />
            <ValuationMetric
              label="与利润贴现差异"
              value="-"
              hint="第 10 步上线"
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
              financialReport.date
            }}</el-descriptions-item>
            <el-descriptions-item label="加权 ROE">{{
              formatPercent(financialReport.wroe)
            }}</el-descriptions-item>
            <el-descriptions-item label="加权扣非 ROE">{{
              formatPercent(financialReport.wdroe)
            }}</el-descriptions-item>
            <el-descriptions-item label="每股净资产">{{
              safeRound(financialReport.netAssetValuePer)
            }}</el-descriptions-item>
            <el-descriptions-item label="每股扣非净利润">{{
              safeRound(financialReport.npadnrpatoshaopcPer)
            }}</el-descriptions-item>
            <el-descriptions-item label="每股经营现金流">{{
              safeRound(financialReport.operatingCashFlowPer)
            }}</el-descriptions-item>
            <el-descriptions-item label="每股自由现金流">{{
              safeRound(financialReport.freeCashFlowPer)
            }}</el-descriptions-item>
            <el-descriptions-item label="毛利率">{{
              formatPercent(financialReport.grossMargin)
            }}</el-descriptions-item>
            <el-descriptions-item label="资产负债率">{{
              formatPercent(financialReport.assetLiabilityRatio)
            }}</el-descriptions-item>
            <el-descriptions-item label="有息负债率">{{
              formatPercent(financialReport.interestLiabilityRatio)
            }}</el-descriptions-item>
            <el-descriptions-item label="营业收入本季度增长率">{{
              formatPercent(financialReport.incomeGrowthRateCurrent)
            }}</el-descriptions-item>
            <el-descriptions-item label="扣非利润本季度增长率">{{
              formatPercent(financialReport.profitGrowthRateCurrent)
            }}</el-descriptions-item>
            <el-descriptions-item label="营业收入累积增长率">{{
              formatPercent(financialReport.incomeGrowthRateTotal)
            }}</el-descriptions-item>
            <el-descriptions-item label="扣非利润累积增长率">{{
              formatPercent(financialReport.profitGrowthRateTotal)
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
              :value="valuation.recommendationScore"
            />
            <ValuationMetric label="推荐人数" value="-" hint="后续接入明细" />
            <ValuationMetric label="最近推荐日" value="-" hint="后续接入明细" />
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

const activeTab = ref('overview')
const loading = ref(false)
const company = reactive({})
const valuation = reactive({})
const financialReport = reactive({})
const valuationData = reactive({})
const dividendList = ref([])

loadDetail()

const totalValuation = computed(() => {
  const total =
    (valuationData.netAssetValuation || 0) +
    (valuationData.highGrowthValuation || 0) +
    (valuationData.perpetualValuation || 0)
  return roundToDecimal(
    total * (valuationData.marketRisk || 0) * (valuationData.industryRisk || 0),
    2
  )
})

const profitAssumptions = computed(() => [
  {
    label: '系统增长率',
    value: formatPercent(valuation.growthRatePrediction),
    source: '模型预测'
  },
  {
    label: '手动增长率',
    value: formatPercent(valuation.growthRateAssumption),
    source: '研究覆盖'
  },
  {
    label: '采用增长率',
    value: formatPercent(
      valuation.growthRateAssumption ?? valuation.growthRatePrediction
    ),
    source: '当前计算'
  }
])

async function loadDetail() {
  loading.value = true
  try {
    const { data } = await getCompanyOverview(companyId)
    Object.assign(company, data.company || {})
    Object.assign(valuation, data.valuation || {})
    Object.assign(financialReport, data.financialReport || {})
    Object.assign(valuationData, data.valuationData || {})
    dividendList.value = data.dividendList || []
  } finally {
    loading.value = false
  }
}

function safeRound(value) {
  return value === null || value === undefined ? '' : roundToDecimal(value, 2)
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
</style>
