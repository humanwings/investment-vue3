<template>
  <section class="page-shell list-page">
    <div class="page-header">
      <div>
        <div class="eyebrow">Company Valuation</div>
        <div class="title-row">
          <h2>公司列表</h2>
          <el-tag class="total-tag" type="info">数据总计 {{ total }}</el-tag>
        </div>
        <p>公司池摘要入口，聚合估值、财务和推荐信号，支持进入公司总览。</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="openAddDialog">
          <el-icon><Plus /></el-icon>
          <span>加入公司</span>
        </el-button>
        <el-button class="btn-violet" @click="confirmReValuateAll">
          <el-icon><Refresh /></el-icon>
          <span>全部重估</span>
        </el-button>
        <el-button @click="confirmUpdatePriceAll">
          <el-icon><RefreshRight /></el-icon>
          <span>股价更新</span>
        </el-button>
      </div>
    </div>

    <div class="table-card list-card">
      <div class="table-shell table-shell--fill">
        <el-table
          v-loading="listLoading"
          :data="list"
          row-key="companyId"
          :default-sort="{ prop: 'deviation', order: 'descending' }"
          height="100%"
          @row-dblclick="goDetail"
        >
          <el-table-column fixed align="center" label="序号" width="64">
            <template #default="{ $index }">
              {{ $index + 1 }}
            </template>
          </el-table-column>
          <el-table-column fixed label="公司" min-width="80">
            <template #default="{ row }">
              <div class="company-cell">
                <strong>{{ row.name }}</strong>
                <span>{{ row.stockCode }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="industryName"
            label="行业"
            min-width="100"
            sortable
            :filters="industryColumnFilters"
            :filter-method="filterIndustry"
          />
          <el-table-column
            prop="totalScore"
            label="综合评分"
            width="110"
            align="center"
            sortable
          />
          <el-table-column prop="price" label="当前价" width="80" align="right" />
          <el-table-column
            prop="profitValuation"
            label="利润贴现"
            width="100"
            align="right"
          />
          <el-table-column
            align="center"
            label="贴现偏离"
            width="100"
            :filters="deviationFilter"
            :filter-method="filterDeviationByProfit"
          >
            <template #default="{ row }">
              <span :class="deviationClass(row.profitDeviation)">{{
                formatPercent(row.profitDeviation)
              }}</span>
            </template>
          </el-table-column>
          <el-table-column label="DCF v1估值" width="110" align="right">
            <template #default="{ row }">
              {{ formatValuation(row.dcfV1Valuation) }}
            </template>
          </el-table-column>
          <el-table-column label="v1偏离率" width="105" align="center">
            <template #default="{ row }">
              <span :class="deviationClass(row.dcfV1Deviation)">
                {{ formatDeviation(row.dcfV1Deviation) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="DCF v2估值" width="110" align="right">
            <template #default="{ row }">
              {{ formatValuation(row.dcfV2Valuation) }}
            </template>
          </el-table-column>
          <el-table-column label="v2偏离率" width="105" align="center">
            <template #default="{ row }">
              <span :class="deviationClass(row.dcfV2Deviation)">
                {{ formatDeviation(row.dcfV2Deviation) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column
            prop="financialScore"
            label="财务评分"
            width="92"
            align="center"
          />
          <el-table-column label="结论" width="100">
            <template #default="{ row }">
              <el-tag :type="conclusionType(row.conclusion)">
                {{ row.conclusion }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column fixed="right" label="处理" width="280">
            <template #default="{ row }">
              <div class="row-actions">
                <el-button text type="primary" @click="goDetail(row)">
                  <el-icon><View /></el-icon>
                  <span>总览</span>
                </el-button>
                <el-button text type="warning" @click="confirmUpdatePrice(row)">
                  <el-icon><RefreshRight /></el-icon>
                  <span>股价更新</span>
                </el-button>
                <el-button
                  text
                  type="success"
                  @click="confirmUpdateReport(row)"
                >
                  <el-icon><DocumentChecked /></el-icon>
                  <span>财报更新</span>
                </el-button>
                <el-button text type="danger" @click="confirmDelete(row)">
                  <el-icon><Delete /></el-icon>
                  <span>删除公司</span>
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog v-model="addDialogVisible" title="加入公司" width="420px" @opened="onDialogOpened">
      <el-form label-position="top" @submit.prevent>
        <el-form-item label="Stock Code">
          <el-input
            ref="stockCodeInputRef"
            v-model="temp.stockCode"
            placeholder="输入6位股票代码，例如 600519"
            @keyup.enter="handleEnter"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="doAddCompany"
          >确认</el-button
        >
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElNotification } from 'element-plus'
import {
  Delete,
  DocumentChecked,
  Plus,
  Refresh,
  RefreshRight,
  View
} from '@element-plus/icons-vue'

import {
  addCompany,
  deleteCompany,
  reValuateAll,
  updatePrice,
  updatePriceAll,
  updateReport
} from '@/api/company-command'
import { getCompanyList } from '@/api/valuation-query'
import { formatPercent, roundToDecimal } from '@/utils'

const router = useRouter()

const deviationFilter = [
  { text: '>100%', value: '03' },
  { text: '>50%', value: '04' },
  { text: '>20%', value: '05' }
]

const total = ref(0)
const list = ref([])
const listLoading = ref(false)
const addDialogVisible = ref(false)
const submitting = ref(false)
const stockCodeInputRef = ref()
const temp = reactive({
  companyId: undefined,
  stockCode: ''
})

getList()

const industries = computed(() => [
  ...new Set(list.value.map((item) => item.industryName).filter(Boolean))
])

const industryColumnFilters = computed(() =>
  industries.value.map((industry) => ({
    text: industry,
    value: industry
  }))
)

async function getList() {
  listLoading.value = true
  try {
    const { data } = await getCompanyList()
    total.value = data.sum || 0
    list.value = normalizeSummaryList(data.list)
  } finally {
    listLoading.value = false
  }
}

function openAddDialog() {
  temp.stockCode = ''
  addDialogVisible.value = true
}

function onDialogOpened() {
  stockCodeInputRef.value?.focus()
}

function deviationClass(value) {
  if (value === null || value === undefined) {
    return ''
  }
  if (value >= 1) {
    return 'deviation-high'
  }
  if (value >= 0.5) {
    return 'deviation-mid'
  }
  return ''
}

function normalizeNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }
  const numberValue = Number(value)
  return Number.isNaN(numberValue) ? null : numberValue
}

function formatValuation(value) {
  const numberValue = normalizeNumber(value)
  return numberValue === null ? '-' : roundToDecimal(numberValue, 2)
}

function formatDeviation(value) {
  const numberValue = normalizeNumber(value)
  return numberValue === null ? '-' : formatPercent(numberValue)
}

function passesDeviationFilter(value, deviation) {
  if (deviation === null || deviation === undefined) {
    return false
  }
  if (value === '03') {
    return deviation >= 1
  }
  if (value === '04') {
    return deviation >= 0.5
  }
  if (value === '05') {
    return deviation >= 0.2
  }
  return true
}

function filterDeviationByProfit(value, row) {
  return passesDeviationFilter(value, row.profitDeviation)
}

function filterIndustry(value, row) {
  return row.industryName === value
}

function handleEnter() {
  const code = temp.stockCode.trim()
  if (/^\d{6}$/.test(code)) {
    doAddCompany()
  } else {
    ElNotification.warning({
      title: '输入错误',
      message: '请输入6位数字股票代码'
    })
  }
}

async function doAddCompany() {
  const code = temp.stockCode.trim()
  if (!code) {
    ElNotification.warning({
      title: '输入错误',
      message: '请输入股票代码'
    })
    return
  }
  if (!/^\d{6}$/.test(code)) {
    ElNotification.warning({
      title: '输入错误',
      message: '股票代码需为6位数字'
    })
    return
  }

  submitting.value = true
  try {
    const response = await addCompany(temp)
    list.value.unshift(normalizeSummary(response.data.companySummary))
    total.value += 1
    addDialogVisible.value = false
    ElNotification.success({
      title: 'Success',
      message: '加入公司成功'
    })
  } finally {
    submitting.value = false
  }
}

async function confirmReValuateAll() {
  await ElMessageBox.confirm(
    '此操作将对所有公司进行重新估值，是否继续？',
    '提示',
    {
      type: 'warning'
    }
  )
  listLoading.value = true
  try {
    const response = await reValuateAll()
    list.value = normalizeSummaryList(response.data.list)
    total.value = response.data.sum || 0
    ElNotification.success({
      title: 'Success',
      message: '全部重估完成'
    })
  } finally {
    listLoading.value = false
  }
}

async function confirmUpdatePriceAll() {
  await ElMessageBox.confirm(
    '此操作将重新获取所有公司的股价，是否继续？',
    '提示',
    {
      type: 'warning'
    }
  )
  listLoading.value = true
  try {
    const response = await updatePriceAll()
    list.value = normalizeSummaryList(response.data.list)
    total.value = response.data.sum || 0
    ElNotification.success({
      title: 'Success',
      message: '股价批量更新完成'
    })
  } finally {
    listLoading.value = false
  }
}

async function confirmUpdatePrice(row) {
  await ElMessageBox.confirm(
    '此操作将重新获取该公司的股价，是否继续？',
    '提示',
    {
      type: 'warning'
    }
  )
  const response = await updatePrice(row.companyId)
  replaceSummary(row.companyId, normalizeSummary(response.data.companySummary))
  ElNotification.success({
    title: 'Success',
    message: '股价更新成功'
  })
}

async function confirmUpdateReport(row) {
  await ElMessageBox.confirm('此操作将更新公司财报数据，是否继续？', '提示', {
    type: 'warning'
  })
  const response = await updateReport({ companyId: row.companyId })
  replaceSummary(row.companyId, normalizeSummary(response.data.companySummary))
  ElNotification.success({
    title: 'Success',
    message: '财报更新成功'
  })
}

async function confirmDelete(row) {
  await ElMessageBox.confirm('此操作将删除该公司，是否继续？', '提示', {
    type: 'warning'
  })
  await deleteCompany(row.companyId)
  removeSummary(row.companyId)
  total.value -= 1
  ElNotification.success({
    title: 'Success',
    message: '删除成功'
  })
}

function goDetail(row) {
  router.push(`/companyvaluation/valuation/company/${row.companyId}`)
}

function normalizeSummaryList(rows = []) {
  return rows.map((row) => normalizeSummary(row))
}

function normalizeSummary(row = {}) {
  const profitDeviation = row.profitDeviation
  const financialScore = row.financialScore
  return {
    companyId: row.companyId,
    stockCode: row.stockCode,
    name: row.name,
    industryName: row.industryName,
    price: row.price,
    profitValuation: row.profitValuation ?? '',
    profitDeviation,
    dcfV1Valuation: normalizeNumber(row.dcfV1Valuation),
    dcfV1Deviation: normalizeNumber(row.dcfV1Deviation),
    dcfV2Valuation: normalizeNumber(row.dcfV2Valuation),
    dcfV2Deviation: normalizeNumber(row.dcfV2Deviation),
    financialScore,
    totalScore: row.totalScore,
    conclusion:
      row.conclusion || buildConclusion(profitDeviation, financialScore)
  }
}

function replaceSummary(companyId, summary) {
  const index = list.value.findIndex((item) => item.companyId === companyId)
  if (index >= 0) {
    list.value.splice(index, 1, summary)
  }
}

function removeSummary(companyId) {
  const index = list.value.findIndex((item) => item.companyId === companyId)
  if (index >= 0) {
    list.value.splice(index, 1)
  }
}

function buildConclusion(profitDeviation, financialScore) {
  if (profitDeviation === null || profitDeviation === undefined) {
    return '待补数据'
  }
  if (profitDeviation >= 0.2 && financialScore >= 80) {
    return '重点关注'
  }
  if (profitDeviation >= 0) {
    return '可跟踪'
  }
  return '偏贵'
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
.list-page {
  grid-template-rows: auto minmax(0, 1fr);
}

.page-header {
  align-self: start;
}

.title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  min-width: 0;
}

.total-tag {
  height: 34px;
  padding: 0 14px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
}

p {
  margin: 0;
  color: #5d748b;
}

.deviation-high {
  color: #c42d2d;
  font-weight: 700;
}

.deviation-mid {
  color: #bb7b13;
  font-weight: 700;
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
</style>
