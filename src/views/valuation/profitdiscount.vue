<template>
  <section class="page-shell valuation-workbench">
    <div class="page-header">
      <div>
        <div class="eyebrow">Profit Discount</div>
        <h2>利润贴现一览</h2>
      </div>
      <div class="header-actions">
        <IndustryFilter v-model="industryFilter" :industries="industries" />
        <el-tag type="info">数据总计 {{ filteredRows.length }}</el-tag>
      </div>
    </div>

    <div class="page-card">
      <AssumptionStrip :items="assumptionItems" />
      <div class="batch-toolbar">
        <div class="batch-copy">
          <strong>行业批量假设</strong>
          <span>{{ industryFilter || '全部行业' }}</span>
        </div>
        <div class="batch-controls">
          <el-input-number
            v-model="batchGrowthRate"
            class="batch-input"
            :step="1"
            :min="-100"
            :max="100"
            size="small"
            controls-position="right"
          />
          <el-button
            type="primary"
            :disabled="!canApplyBatch"
            :loading="batchLoading"
            @click="applyIndustryGrowthRate"
          >
            <el-icon><Check /></el-icon>
            <span>应用到行业</span>
          </el-button>
        </div>
      </div>
    </div>

    <div class="table-card list-card">
      <div class="table-shell table-shell--fill">
        <el-table
          v-loading="loading"
          :data="filteredRows"
          row-key="companyId"
          height="100%"
        >
          <el-table-column fixed label="公司" min-width="150">
            <template #default="{ row }">
              <div class="company-cell">
                <strong>{{ row.name }}</strong>
                <span>{{ row.stockCode }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="industryName" label="行业" min-width="120" />
          <el-table-column label="当前价" width="100">
            <template #default="{ row }">
              {{ safeRound(row.price) }}
            </template>
          </el-table-column>
          <el-table-column label="系统增长率" width="120">
            <template #default="{ row }">
              {{ formatRatePoint(row.growthRatePrediction) }}
            </template>
          </el-table-column>
          <el-table-column label="手动增长率" width="150">
            <template #default="{ row }">
              <el-input-number
                v-model="draftGrowthRates[row.companyId]"
                :step="1"
                :min="-100"
                :max="100"
                size="small"
                controls-position="right"
              />
            </template>
          </el-table-column>
          <el-table-column label="采用增长率" width="120">
            <template #default="{ row }">
              {{ formatRatePoint(row.growthRateApplied) }}
            </template>
          </el-table-column>
          <el-table-column label="覆盖状态" width="110">
            <template #default="{ row }">
              <el-tag :type="hasManualOverride(row) ? 'warning' : 'info'">
                {{ hasManualOverride(row) ? '人工覆盖' : '系统预测' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="利润贴现估值" width="140">
            <template #default="{ row }">
              {{ safeRound(row.valuation) }}
            </template>
          </el-table-column>
          <el-table-column label="偏离率" width="110">
            <template #default="{ row }">
              <span :class="deviationClass(row.deviation)">
                {{ formatPercent(row.deviation) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="financialScore" label="财务评分" width="100" />
          <el-table-column
            prop="recommendationScore"
            label="大V评分"
            width="100"
          />
          <el-table-column prop="signal" label="辅助判断" min-width="110" />
          <el-table-column fixed="right" label="处理" width="240">
            <template #default="{ row }">
              <div class="row-actions">
                <el-button text type="primary" @click="goOverview(row)">
                  <el-icon><View /></el-icon>
                  <span>总览</span>
                </el-button>
                <el-button
                  text
                  type="success"
                  :loading="savingCompanyId === row.companyId"
                  @click="saveGrowthRate(row)"
                >
                  <el-icon><Check /></el-icon>
                  <span>保存</span>
                </el-button>
                <el-button
                  text
                  type="warning"
                  :disabled="!hasManualOverride(row)"
                  :loading="savingCompanyId === row.companyId"
                  @click="resetGrowthRate(row)"
                >
                  <el-icon><RefreshRight /></el-icon>
                  <span>恢复</span>
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElNotification } from 'element-plus'
import { Check, RefreshRight, View } from '@element-plus/icons-vue'

import {
  clearProfitGrowthRate,
  getProfitValuationList,
  updateIndustryProfitGrowthRate,
  updateProfitGrowthRate
} from '@/api/profit-valuation'
import { formatPercent, roundToDecimal } from '@/utils'
import AssumptionStrip from './components/AssumptionStrip.vue'
import IndustryFilter from './components/IndustryFilter.vue'

const router = useRouter()
const industryFilter = ref('')
const loading = ref(false)
const savingCompanyId = ref()
const batchLoading = ref(false)
const batchGrowthRate = ref()
const rows = ref([])
const draftGrowthRates = reactive({})

loadProfitValuations()

const industries = computed(() => [
  ...new Set(rows.value.map((item) => item.industryName).filter(Boolean))
])

const filteredRows = computed(() => {
  if (!industryFilter.value) {
    return rows.value
  }
  return rows.value.filter((item) => item.industryName === industryFilter.value)
})

const assumptionItems = computed(() => [
  {
    label: '覆盖公司',
    value: `${rows.value.length}`,
    source: '当前列表'
  },
  {
    label: '人工覆盖',
    value: `${manualOverrideCount.value}`,
    source: '手动增长率'
  },
  {
    label: '平均偏离',
    value: formatPercent(averageDeviation.value),
    source: '利润贴现'
  }
])

const manualOverrideCount = computed(
  () => rows.value.filter((row) => hasManualOverride(row)).length
)

const canApplyBatch = computed(
  () =>
    Boolean(industryFilter.value) &&
    batchGrowthRate.value !== null &&
    batchGrowthRate.value !== undefined &&
    batchGrowthRate.value !== ''
)

const averageDeviation = computed(() => {
  const values = rows.value
    .map((row) => row.deviation)
    .filter((value) => value !== null && value !== undefined)
  if (!values.length) {
    return null
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length
})

async function loadProfitValuations() {
  loading.value = true
  try {
    const { data } = await getProfitValuationList()
    rows.value = data.list || []
    syncDraftGrowthRates(rows.value)
  } finally {
    loading.value = false
  }
}

function syncDraftGrowthRates(list) {
  list.forEach((row) => {
    draftGrowthRates[row.companyId] =
      row.growthRateManual ?? row.growthRateApplied ?? row.growthRatePrediction
  })
}

async function saveGrowthRate(row) {
  savingCompanyId.value = row.companyId
  try {
    const response = await updateProfitGrowthRate(row.companyId, {
      growthRateManual: draftGrowthRates[row.companyId]
    })
    replaceRow(response.data.item)
    ElNotification.success({
      title: 'Success',
      message: '增长率已更新'
    })
  } finally {
    savingCompanyId.value = undefined
  }
}

async function resetGrowthRate(row) {
  savingCompanyId.value = row.companyId
  try {
    const response = await clearProfitGrowthRate(row.companyId)
    replaceRow(response.data.item)
    ElNotification.success({
      title: 'Success',
      message: '已恢复系统预测值'
    })
  } finally {
    savingCompanyId.value = undefined
  }
}

async function applyIndustryGrowthRate() {
  if (!canApplyBatch.value) {
    return
  }

  await ElMessageBox.confirm(
    `将 ${industryFilter.value} 行业的手动增长率统一设置为 ${batchGrowthRate.value}%，是否继续？`,
    '提示',
    {
      type: 'warning'
    }
  )

  batchLoading.value = true
  try {
    const response = await updateIndustryProfitGrowthRate({
      industryName: industryFilter.value,
      growthRateManual: batchGrowthRate.value,
      changeReason: 'industry batch profit growth override'
    })
    replaceRows(response.data.list || [])
    ElNotification.success({
      title: 'Success',
      message: '行业增长率已更新'
    })
  } finally {
    batchLoading.value = false
  }
}

function replaceRow(item) {
  const index = rows.value.findIndex((row) => row.companyId === item.companyId)
  if (index >= 0) {
    rows.value.splice(index, 1, item)
  }
  draftGrowthRates[item.companyId] =
    item.growthRateManual ?? item.growthRateApplied ?? item.growthRatePrediction
}

function replaceRows(items) {
  items.forEach((item) => replaceRow(item))
}

function goOverview(row) {
  router.push({
    path: `/companyvaluation/valuation/company/${row.companyId}`,
    query: {
      tab: 'profit',
      from: 'profit-discount'
    }
  })
}

function hasManualOverride(row) {
  return (
    Boolean(row.manualOverrideFlag) ||
    (row.growthRateManual !== null && row.growthRateManual !== undefined)
  )
}

function safeRound(value) {
  return value === null || value === undefined ? '' : roundToDecimal(value, 2)
}

function formatRatePoint(value) {
  if (value === null || value === undefined || value === '') {
    return ''
  }
  return `${Number(value).toFixed(2)}%`
}

function deviationClass(value) {
  if (value === null || value === undefined) {
    return ''
  }
  if (value >= 0.2) {
    return 'deviation-high'
  }
  if (value < 0) {
    return 'deviation-low'
  }
  return ''
}
</script>

<style scoped lang="scss">
.valuation-workbench {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.company-cell {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.company-cell strong {
  overflow-wrap: anywhere;
  color: var(--app-text);
  line-height: 1.25;
}

.company-cell span {
  color: var(--app-text-muted);
  font-size: 12px;
}

.batch-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.batch-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.batch-copy strong {
  color: var(--app-text);
  font-size: 14px;
}

.batch-copy span {
  color: var(--app-text-muted);
  font-size: 12px;
}

.batch-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.batch-input {
  width: 150px;
}

.deviation-high {
  color: #c43c2d;
  font-weight: 700;
}

.deviation-low {
  color: #1d7f58;
  font-weight: 700;
}
</style>
