<template>
  <section class="page-shell valuation-workbench">
    <div class="page-header">
      <div>
        <div class="eyebrow">Discounted Cash Flow</div>
        <h2>DCF一览</h2>
      </div>
      <div class="header-actions">
        <IndustryFilter v-model="industryFilter" :industries="industries" />
        <el-tag type="info">数据总数 {{ filteredRows.length }}</el-tag>
      </div>
    </div>

    <div class="page-card metric-grid">
      <ValuationMetric
        label="DCF 每股估值"
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
              {{ safeRound(row.price) || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="系统营收增长率" width="130">
            <template #default="{ row }">
              {{ formatPercent(row.revenueGrowthRatePrediction) || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="采用营收增长率" width="130">
            <template #default="{ row }">
              {{ formatPercent(row.revenueGrowthRateApplied) || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="采用折现率" width="120">
            <template #default="{ row }">
              {{ formatPercent(row.discountRateApplied) || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="永续增长率" width="120">
            <template #default="{ row }">
              {{ formatPercent(row.terminalGrowthRateApplied) || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="DCF 每股估值" width="140">
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
          <el-table-column fixed="right" label="动作" width="100">
            <template #default="{ row }">
              <el-button text type="primary" @click="goOverview(row)">
                <el-icon><View /></el-icon>
                <span>总览</span>
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { View } from '@element-plus/icons-vue'

import { getDcfValuationList } from '@/api/dcf-valuation'
import { formatPercent, roundToDecimal } from '@/utils'
import IndustryFilter from './components/IndustryFilter.vue'
import ValuationMetric from './components/ValuationMetric.vue'

const router = useRouter()
const industryFilter = ref('')
const loading = ref(false)
const rows = ref([])

loadDcfValuations()

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

async function loadDcfValuations() {
  loading.value = true
  try {
    const { data } = await getDcfValuationList()
    rows.value = data.list || []
  } finally {
    loading.value = false
  }
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
      from: 'dcf'
    }
  })
}

function safeRound(value) {
  return value === null || value === undefined ? '' : roundToDecimal(value, 2)
}

function statusLabel(status) {
  if (status === 'ready') {
    return '已计算'
  }
  if (status === 'parameter_ready') {
    return '参数待计算'
  }
  return '等待 DCF v1'
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

.deviation-high {
  color: #c43c2d;
  font-weight: 700;
}

.deviation-low {
  color: #1d7f58;
  font-weight: 700;
}
</style>
