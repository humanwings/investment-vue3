<template>
  <section class="page-shell valuation-workbench">
    <div class="page-header">
      <div>
        <div class="eyebrow">Discounted Cash Flow</div>
        <h2>{{ pageTitle }}</h2>
      </div>
      <div class="header-actions">
        <IndustryFilter v-model="industryFilter" :industries="industries" />
        <el-tag type="info">数据总数 {{ filteredRows.length }}</el-tag>
      </div>
    </div>

    <div class="page-card metric-grid">
      <ValuationMetric
        :label="`${versionLabel} 每股估值`"
        :value="safeRound(averagePerShareValue) || '-'"
        hint="平均值"
      />
      <ValuationMetric
        label="终值占比"
        :value="formatPercent(averageTerminalValueRatio) || '-'"
        hint="平均值"
      />
      <ValuationMetric
        label="与利润贴现差异"
        :value="safeRound(averageProfitDcfGap) || '-'"
        hint="平均值"
      />
    </div>

    <div v-if="isV1" class="page-card batch-toolbar">
      <div class="batch-copy">
        <strong>行业批量假设</strong>
        <span>{{ industryFilter || '请先选择行业' }}</span>
      </div>
      <div class="batch-controls">
        <el-input-number
          v-model="batchRevenueGrowthRate"
          class="batch-input"
          :step="0.5"
          :min="-100"
          :max="100"
          size="small"
          controls-position="right"
        />
        <el-input-number
          v-model="batchDiscountRate"
          class="batch-input"
          :step="0.5"
          :min="0"
          :max="100"
          size="small"
          controls-position="right"
        />
        <el-input-number
          v-model="batchTerminalGrowthRate"
          class="batch-input"
          :step="0.25"
          :min="-100"
          :max="100"
          size="small"
          controls-position="right"
        />
        <el-button
          type="primary"
          :disabled="!canApplyBatch"
          :loading="batchLoading"
          @click="applyIndustryManualAssumptions"
        >
          <el-icon><Check /></el-icon>
          <span>应用到行业</span>
        </el-button>
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
          <el-table-column label="模型版本" width="170">
            <template #default="{ row }">
              {{ row.modelVersion || modelVersion }}
            </template>
          </el-table-column>
          <el-table-column prop="industryName" label="行业" min-width="120" />
          <el-table-column label="当前价" width="100">
            <template #default="{ row }">
              {{ safeRound(row.price) || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="系统营收增长率" width="130">
            <template #default="{ row }">
              {{ formatPercent(row.revenueGrowthRatePrediction) || '-' }}
            </template>
          </el-table-column>
          <el-table-column v-if="isV1" label="手动营收增长率" width="150">
            <template #default="{ row }">
              <el-input-number
                v-model="draftRevenueGrowthRates[row.companyId]"
                :step="0.5"
                :min="-100"
                :max="100"
                size="small"
                controls-position="right"
              />
            </template>
          </el-table-column>
          <el-table-column label="采用营收增长率" width="130">
            <template #default="{ row }">
              {{ formatPercent(row.revenueGrowthRateApplied) || '-' }}
            </template>
          </el-table-column>
          <el-table-column v-if="isV1" label="手动折现率" width="130">
            <template #default="{ row }">
              <el-input-number
                v-model="draftDiscountRates[row.companyId]"
                :step="0.5"
                :min="0"
                :max="100"
                size="small"
                controls-position="right"
              />
            </template>
          </el-table-column>
          <el-table-column label="采用折现率" width="120">
            <template #default="{ row }">
              {{ formatPercent(row.discountRateApplied) || '-' }}
            </template>
          </el-table-column>
          <el-table-column v-if="isV1" label="手动永续增长率" width="150">
            <template #default="{ row }">
              <el-input-number
                v-model="draftTerminalGrowthRates[row.companyId]"
                :step="0.25"
                :min="-100"
                :max="100"
                size="small"
                controls-position="right"
              />
            </template>
          </el-table-column>
          <el-table-column label="永续增长率" width="120">
            <template #default="{ row }">
              {{ formatPercent(row.terminalGrowthRateApplied) || '-' }}
            </template>
          </el-table-column>
          <el-table-column v-if="isV1" label="覆盖状态" width="110">
            <template #default="{ row }">
              <el-tag :type="hasManualOverride(row) ? 'warning' : 'info'">
                {{ hasManualOverride(row) ? '人工覆盖' : '系统默认' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="`${versionLabel} 每股估值`" width="140">
            <template #default="{ row }">
              {{ safeRound(row.perShareValue) || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="偏离率" width="110">
            <template #default="{ row }">
              <span :class="deviationClass(row.deviation)">
                {{ formatPercent(row.deviation) || '-' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="终值占比" width="110">
            <template #default="{ row }">
              {{ formatPercent(row.terminalValueRatio) || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="模型差异" width="120">
            <template #default="{ row }">
              {{ safeRound(row.profitDcfGap) || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="130">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)">
                {{ statusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column fixed="right" label="动作" :width="isV1 ? 250 : 100">
            <template #default="{ row }">
              <div class="row-actions">
                <el-button text type="primary" @click="goOverview(row)">
                  <el-icon><View /></el-icon>
                  <span>总览</span>
                </el-button>
                <el-button
                  v-if="isV1"
                  text
                  type="success"
                  :loading="savingCompanyId === row.companyId"
                  @click="saveManualAssumptions(row)"
                >
                  <el-icon><Check /></el-icon>
                  <span>保存</span>
                </el-button>
                <el-button
                  v-if="isV1"
                  text
                  type="warning"
                  :disabled="!hasManualOverride(row)"
                  :loading="savingCompanyId === row.companyId"
                  @click="resetManualAssumptions(row)"
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
  clearDcfV1ManualAssumptions,
  getDcfValuationList,
  updateDcfV1ManualAssumptions,
  updateIndustryDcfV1ManualAssumptions
} from '@/api/dcf-valuation'
import { formatPercent, roundToDecimal } from '@/utils'
import IndustryFilter from './components/IndustryFilter.vue'
import ValuationMetric from './components/ValuationMetric.vue'

const router = useRouter()
const props = defineProps({
  pageTitle: {
    type: String,
    default: 'DCF v1一览'
  },
  modelVersion: {
    type: String,
    default: 'DCF_V1_SIMPLE_FCFF'
  },
  scenarioKey: {
    type: String,
    default: 'BASE'
  },
  versionKey: {
    type: String,
    default: 'v1'
  },
  pendingStatusLabel: {
    type: String,
    default: '等待 DCF v1'
  },
  overviewSource: {
    type: String,
    default: 'dcf-v1'
  }
})
const industryFilter = ref('')
const loading = ref(false)
const savingCompanyId = ref()
const batchLoading = ref(false)
const batchRevenueGrowthRate = ref()
const batchDiscountRate = ref()
const batchTerminalGrowthRate = ref()
const rows = ref([])
const draftRevenueGrowthRates = reactive({})
const draftDiscountRates = reactive({})
const draftTerminalGrowthRates = reactive({})

loadDcfValuations()

const isV1 = computed(() => props.versionKey === 'v1')

const versionLabel = computed(() =>
  props.versionKey === 'v2' ? 'DCF v2' : 'DCF v1'
)

const industries = computed(() => [
  ...new Set(rows.value.map((item) => item.industryName).filter(Boolean))
])

const filteredRows = computed(() => {
  if (!industryFilter.value) {
    return rows.value
  }
  return rows.value.filter((item) => item.industryName === industryFilter.value)
})

const averagePerShareValue = computed(() => averageOf('perShareValue'))

const averageTerminalValueRatio = computed(() =>
  averageOf('terminalValueRatio')
)

const averageProfitDcfGap = computed(() => averageOf('profitDcfGap'))

const canApplyBatch = computed(
  () =>
    isV1.value &&
    Boolean(industryFilter.value) &&
    hasDraftValue(batchRevenueGrowthRate.value) &&
    hasDraftValue(batchDiscountRate.value) &&
    hasDraftValue(batchTerminalGrowthRate.value)
)

async function loadDcfValuations() {
  loading.value = true
  try {
    const { data } = await getDcfValuationList({
      modelVersion: props.modelVersion,
      scenarioKey: props.scenarioKey
    })
    rows.value = data.list || []
    syncDraftAssumptions(rows.value)
  } finally {
    loading.value = false
  }
}

function syncDraftAssumptions(list) {
  list.forEach((row) => syncDraftAssumption(row))
}

function syncDraftAssumption(row) {
  draftRevenueGrowthRates[row.companyId] = rateToPoint(
    row.revenueGrowthRateManual ??
      row.revenueGrowthRateApplied ??
      row.revenueGrowthRatePrediction
  )
  draftDiscountRates[row.companyId] = rateToPoint(
    row.discountRateManual ??
      row.discountRateApplied ??
      row.discountRatePrediction
  )
  draftTerminalGrowthRates[row.companyId] = rateToPoint(
    row.terminalGrowthRateManual ??
      row.terminalGrowthRateApplied ??
      row.terminalGrowthRatePrediction
  )
}

async function saveManualAssumptions(row) {
  if (!isV1.value) {
    return
  }
  savingCompanyId.value = row.companyId
  try {
    const response = await updateDcfV1ManualAssumptions(row.companyId, {
      revenueGrowthRateManual: draftRevenueGrowthRates[row.companyId],
      discountRateManual: draftDiscountRates[row.companyId],
      terminalGrowthRateManual: draftTerminalGrowthRates[row.companyId],
      changeReason: 'company DCF v1 manual assumptions'
    })
    replaceRow(response.data.item)
    ElNotification.success({
      title: 'Success',
      message: 'DCF v1 假设已更新'
    })
  } finally {
    savingCompanyId.value = undefined
  }
}

async function resetManualAssumptions(row) {
  savingCompanyId.value = row.companyId
  try {
    const response = await clearDcfV1ManualAssumptions(row.companyId, {
      changeReason: 'restore DCF v1 default assumptions'
    })
    replaceRow(response.data.item)
    ElNotification.success({
      title: 'Success',
      message: '已恢复 DCF v1 默认假设'
    })
  } finally {
    savingCompanyId.value = undefined
  }
}

async function applyIndustryManualAssumptions() {
  if (!canApplyBatch.value) {
    return
  }
  await ElMessageBox.confirm(
    `将 ${industryFilter.value} 行业的 DCF v1 假设统一设置为：营收增长率 ${formatRatePoint(
      batchRevenueGrowthRate.value
    )}，折现率 ${formatRatePoint(
      batchDiscountRate.value
    )}，永续增长率 ${formatRatePoint(batchTerminalGrowthRate.value)}，是否继续？`,
    '提示',
    {
      type: 'warning'
    }
  )

  batchLoading.value = true
  try {
    const response = await updateIndustryDcfV1ManualAssumptions({
      industryName: industryFilter.value,
      revenueGrowthRateManual: batchRevenueGrowthRate.value,
      discountRateManual: batchDiscountRate.value,
      terminalGrowthRateManual: batchTerminalGrowthRate.value,
      changeReason: 'industry batch DCF v1 manual assumptions'
    })
    replaceRows(response.data.list || [])
    ElNotification.success({
      title: 'Success',
      message: '行业 DCF v1 假设已更新'
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
  syncDraftAssumption(item)
}

function replaceRows(items) {
  items.forEach((item) => replaceRow(item))
}

function averageOf(key) {
  const values = filteredRows.value
    .map((row) => row[key])
    .filter((value) => value !== null && value !== undefined)
  if (!values.length) {
    return null
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function goOverview(row) {
  router.push({
    path: `/companyvaluation/valuation/company/${row.companyId}`,
    query: {
      tab: 'dcf',
      dcfVersion: props.versionKey,
      from: props.overviewSource
    }
  })
}

function safeRound(value) {
  return value === null || value === undefined ? '' : roundToDecimal(value, 2)
}

function rateToPoint(value) {
  if (value === null || value === undefined || value === '') {
    return undefined
  }
  const numberValue = Number(value)
  return Math.abs(numberValue) <= 1
    ? roundToDecimal(numberValue * 100, 2)
    : numberValue
}

function formatRatePoint(value) {
  if (!hasDraftValue(value)) {
    return '-'
  }
  return `${Number(value).toFixed(2)}%`
}

function hasDraftValue(value) {
  return value !== null && value !== undefined && value !== ''
}

function hasManualOverride(row) {
  return (
    Boolean(row.manualOverrideFlag) ||
    hasDraftValue(row.revenueGrowthRateManual) ||
    hasDraftValue(row.discountRateManual) ||
    hasDraftValue(row.terminalGrowthRateManual)
  )
}

function statusLabel(status) {
  if (status === 'ready') {
    return '已计算'
  }
  if (status === 'parameter_ready') {
    return '参数待计算'
  }
  return props.pendingStatusLabel
}

function statusType(status) {
  if (status === 'ready') {
    return 'success'
  }
  if (status === 'parameter_ready') {
    return 'warning'
  }
  return 'info'
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

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
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

.batch-controls,
.row-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.batch-input {
  width: 140px;
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
