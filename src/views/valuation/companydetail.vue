<template>
  <section v-loading="loading" class="detail-shell">
    <div class="detail-header">
      <div>
        <el-button text @click="router.push('/companyvaluation/valuation/company')">返回列表</el-button>
        <div class="eyebrow">Company Detail</div>
        <h2>{{ company.name || `公司 #${companyId}` }}</h2>
      </div>
      <el-tag type="success">companyId {{ companyId }}</el-tag>
    </div>

    <div class="detail-card">
      <h3>基本信息</h3>
      <el-descriptions :column="4" border>
        <el-descriptions-item label="证券代码">{{ company.stockCode }}</el-descriptions-item>
        <el-descriptions-item label="交易所">{{ company.exchange }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ company.fsTableType }}</el-descriptions-item>
        <el-descriptions-item label="IPO 时间">{{ company.ipoDate }}</el-descriptions-item>
        <el-descriptions-item label="省份">{{ company.province }}</el-descriptions-item>
        <el-descriptions-item label="实控人">{{ company.actualControllerTypes }}</el-descriptions-item>
        <el-descriptions-item label="一级行业">{{ company.firstIndustry }}</el-descriptions-item>
        <el-descriptions-item label="二级行业">{{ company.secondIndustry }}</el-descriptions-item>
        <el-descriptions-item label="三级行业">{{ company.thirdIndustry }}</el-descriptions-item>
        <el-descriptions-item :span="3" label="主营业务">{{ company.mainBusiness }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <div class="detail-card">
      <h3>估值信息</h3>
      <el-descriptions :column="4" border>
        <el-descriptions-item label="综合评分">{{ valuation.score }}</el-descriptions-item>
        <el-descriptions-item label="大V推荐得分">{{ valuation.recommendationScore }}</el-descriptions-item>
        <el-descriptions-item label="财务评价得分">{{ valuation.financialScore }}</el-descriptions-item>
        <el-descriptions-item label="估值">{{ valuation.valuation }}</el-descriptions-item>
        <el-descriptions-item label="预估/假定增长率">
          {{ valuation.growthRatePrediction }} / {{ valuation.growthRateAssumption }}
        </el-descriptions-item>
        <el-descriptions-item label="现价">{{ valuation.price }}</el-descriptions-item>
        <el-descriptions-item label="偏差">{{ formatPercent(valuation.deviation) }}</el-descriptions-item>
        <el-descriptions-item label="PE-TTM">{{ safeRound(valuation.pe) }}</el-descriptions-item>
        <el-descriptions-item label="PB(不含商誉)">{{ safeRound(valuation.pb) }}</el-descriptions-item>
        <el-descriptions-item label="市值">{{ formatYi(valuation.marketValue) }}</el-descriptions-item>
        <el-descriptions-item label="股本">{{ formatYi(valuation.capitalization) }}</el-descriptions-item>
        <el-descriptions-item label="分红率">{{ formatPercent(valuation.dividendRate) }}</el-descriptions-item>
        <el-descriptions-item label="连续分红年数">{{ valuation.dividendYears }}</el-descriptions-item>
        <el-descriptions-item label="上市以来持续分红">{{ valuation.dividendIsSure }}</el-descriptions-item>
        <el-descriptions-item label="股息率">{{ formatPercent(valuation.yield) }}</el-descriptions-item>
        <el-descriptions-item label="五年平均股息率">{{ formatPercent(valuation.yieldAverage) }}</el-descriptions-item>
        <el-descriptions-item label="前瞻股息率">{{ formatPercent(valuation.yieldPrediction) }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <div class="detail-card">
      <h3>最新财务信息</h3>
      <el-descriptions :column="4" border>
        <el-descriptions-item label="报告日期">{{ financialReport.date }}</el-descriptions-item>
        <el-descriptions-item label="加权 ROE">{{ formatPercent(financialReport.wroe) }}</el-descriptions-item>
        <el-descriptions-item label="加权扣非 ROE">{{ formatPercent(financialReport.wdroe) }}</el-descriptions-item>
        <el-descriptions-item label="每股净资产">{{ safeRound(financialReport.netAssetValuePer) }}</el-descriptions-item>
        <el-descriptions-item label="每股扣非净利润">{{ safeRound(financialReport.npadnrpatoshaopcPer) }}</el-descriptions-item>
        <el-descriptions-item label="每股经营现金流">{{ safeRound(financialReport.operatingCashFlowPer) }}</el-descriptions-item>
        <el-descriptions-item label="每股自由现金流">{{ safeRound(financialReport.freeCashFlowPer) }}</el-descriptions-item>
        <el-descriptions-item label="毛利率">{{ formatPercent(financialReport.grossMargin) }}</el-descriptions-item>
        <el-descriptions-item label="资产负债率">{{ formatPercent(financialReport.assetLiabilityRatio) }}</el-descriptions-item>
        <el-descriptions-item label="有息负债率">{{ formatPercent(financialReport.interestLiabilityRatio) }}</el-descriptions-item>
        <el-descriptions-item label="营业收入本季度增长率">{{ formatPercent(financialReport.incomeGrowthRateCurrent) }}</el-descriptions-item>
        <el-descriptions-item label="扣非利润本季度增长率">{{ formatPercent(financialReport.profitGrowthRateCurrent) }}</el-descriptions-item>
        <el-descriptions-item label="营业收入累积增长率">{{ formatPercent(financialReport.incomeGrowthRateTotal) }}</el-descriptions-item>
        <el-descriptions-item label="扣非利润累积增长率">{{ formatPercent(financialReport.profitGrowthRateTotal) }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <div class="detail-card">
      <h3>最近五年分红信息</h3>
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

    <div class="detail-card">
      <h3>估值参考信息</h3>
      <el-descriptions :column="4" border>
        <el-descriptions-item label="每股净资产">{{ safeRound(financialReport.netAssetValuePer) }}</el-descriptions-item>
        <el-descriptions-item label="净资产折价率">{{ valuationData.netAssetDiscount }}</el-descriptions-item>
        <el-descriptions-item label="净资产估值">{{ safeRound(valuationData.netAssetValuation) }}</el-descriptions-item>
        <el-descriptions-item label="分红稳定性">{{ formatPercent(valuationData.dividendStability) }}</el-descriptions-item>
        <el-descriptions-item label="预期分红率">{{ formatPercent(valuationData.dividendRatePrediction) }}</el-descriptions-item>
        <el-descriptions-item label="预期营收增速">{{ formatPercent(valuationData.incomeGrowthRatePrediction) }}</el-descriptions-item>
        <el-descriptions-item label="预期利润增速">{{ formatPercent(valuationData.profitGrowthRatePrediction) }}</el-descriptions-item>
        <el-descriptions-item label="次期增速推算">{{ formatPercent(valuationData.growthRatePrediction) }}</el-descriptions-item>
        <el-descriptions-item label="高增长年数">{{ valuationData.growthYears }}</el-descriptions-item>
        <el-descriptions-item label="折现率">{{ valuationData.discountRate }}</el-descriptions-item>
        <el-descriptions-item label="高增长折现系数累积">{{ valuationData.highGrowthDiscountCoefficientSum }}</el-descriptions-item>
        <el-descriptions-item label="高增长期估值">{{ valuationData.highGrowthValuation }}</el-descriptions-item>
        <el-descriptions-item label="永续期增速">{{ formatPercent(valuationData.perpetualGrowthRate) }}</el-descriptions-item>
        <el-descriptions-item label="永续期折现系数累积">{{ valuationData.perpetualDiscountCoefficientSum }}</el-descriptions-item>
        <el-descriptions-item label="永续期估值">{{ valuationData.perpetualValuation }}</el-descriptions-item>
        <el-descriptions-item label="市场风险">{{ valuationData.marketRisk }}</el-descriptions-item>
        <el-descriptions-item label="行业风险">{{ valuationData.industryRisk }}</el-descriptions-item>
        <el-descriptions-item label="最终估值">{{ totalValuation }}</el-descriptions-item>
      </el-descriptions>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getCompany } from '@/api/company'
import { formatPercent, formatYi, roundToDecimal } from '@/utils'

const route = useRoute()
const router = useRouter()
const companyId = route.params.id

const loading = ref(false)
const company = reactive({})
const valuation = reactive({})
const financialReport = reactive({})
const valuationData = reactive({})
const dividendList = ref([])

loadDetail()

const totalValuation = computed(() => {
  const total = (valuationData.netAssetValuation || 0) +
    (valuationData.highGrowthValuation || 0) +
    (valuationData.perpetualValuation || 0)
  return roundToDecimal(total * (valuationData.marketRisk || 0) * (valuationData.industryRisk || 0), 2)
})

async function loadDetail() {
  loading.value = true
  try {
    const { data } = await getCompany(companyId)
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
.detail-shell {
  display: grid;
  gap: 18px;
}

.detail-header,
.detail-card {
  padding: 24px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 18px 40px rgba(18, 51, 83, 0.06);
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.eyebrow {
  margin: 8px 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #688097;
}

h2,
h3 {
  margin: 0 0 12px;
  color: #102235;
}
</style>
