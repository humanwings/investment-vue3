<template>
  <section class="page-shell list-page">
    <div class="page-header">
      <div>
        <div class="eyebrow">Company Valuation</div>
        <h2>公司估值</h2>
        <p>
          列表已接入现有后端，可执行新增、重估、价格更新、财报更新和详情查看。
        </p>
      </div>
      <div class="header-actions">
        <el-tag type="info">数据总计 {{ total }}</el-tag>
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
          <el-table-column fixed align="center" label="序号" width="70">
            <template #default="{ $index }">
              {{ $index + 1 }}
            </template>
          </el-table-column>
          <el-table-column fixed prop="name" label="名称" min-width="120" />
          <el-table-column prop="score" label="综合评分" width="100" sortable />
          <el-table-column prop="price" label="现价" width="100" sortable />
          <el-table-column label="假定增速" width="130">
            <template #default="{ row, $index }">
              <el-input
                v-model="row.growthRateAssumption"
                size="small"
                @change="changeGrowthRate(row, $index)"
              />
            </template>
          </el-table-column>
          <el-table-column
            prop="growthRatePrediction"
            label="预估增速"
            width="110"
          />
          <el-table-column prop="valuation" label="估值" width="110" sortable />
          <el-table-column
            align="center"
            label="价值偏差1"
            width="120"
            :filters="deviationFilter"
            :filter-method="filterDeviationByProfit"
          >
            <template #default="{ row }">
              <span :class="deviationClass(row.deviation)">{{
                formatPercent(row.deviation)
              }}</span>
            </template>
          </el-table-column>
          <el-table-column label="FCF估值" width="110">
            <template #default="{ row }">
              {{ roundToDecimal((row.freeCashFlowPer || 0) * 10, 2) }}
            </template>
          </el-table-column>
          <el-table-column
            align="center"
            label="价值偏差2"
            width="120"
            :filters="deviationFilter"
            :filter-method="filterDeviationByFcf"
          >
            <template #default="{ row }">
              <span :class="deviationClass(fcfDeviation(row))">{{
                formatPercent(fcfDeviation(row))
              }}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="recommendationScore"
            label="大V评分"
            width="100"
          />
          <el-table-column prop="financialScore" label="财务评分" width="100" />
          <el-table-column
            prop="industryName"
            label="行业分类"
            min-width="120"
          />
          <el-table-column label="市值" width="120" sortable>
            <template #default="{ row }">
              {{ formatYi(row.marketValue) }}
            </template>
          </el-table-column>
          <el-table-column prop="cfDate" label="财报" width="110" />
          <el-table-column prop="cvUpdateTime" label="股价日" width="110" />
          <el-table-column prop="cfUpdateTime" label="更新日" width="110" />
          <el-table-column fixed="right" label="处理" width="320">
            <template #default="{ row, $index }">
              <div class="row-actions">
                <el-button text type="primary" @click="goDetail(row)">
                  <el-icon><View /></el-icon>
                  <span>详情</span>
                </el-button>
                <el-button
                  text
                  type="warning"
                  @click="confirmUpdatePrice(row, $index)"
                >
                  <el-icon><RefreshRight /></el-icon>
                  <span>股价更新</span>
                </el-button>
                <el-button
                  text
                  type="success"
                  @click="confirmUpdateReport(row, $index)"
                >
                  <el-icon><DocumentChecked /></el-icon>
                  <span>财报更新</span>
                </el-button>
                <el-button
                  text
                  type="danger"
                  @click="confirmDelete(row, $index)"
                >
                  <el-icon><Delete /></el-icon>
                  <span>删除</span>
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog v-model="addDialogVisible" title="加入公司" width="420px">
      <el-form ref="formRef" :model="temp" :rules="rules" label-position="top">
        <el-form-item label="Stock Code" prop="stockCode">
          <el-input v-model="temp.stockCode" placeholder="例如 600519" />
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
import { reactive, ref } from 'vue'
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
  getCompanyList,
  reValuateAll,
  updateGrowthRate,
  updatePrice,
  updatePriceAll,
  updateReport
} from '@/api/company'
import { formatPercent, formatYi, roundToDecimal } from '@/utils'

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
const formRef = ref()
const temp = reactive({
  companyId: undefined,
  stockCode: '',
  growthRateAssumption: undefined
})

const rules = {
  stockCode: [
    { required: true, message: 'stockCode is required', trigger: 'blur' }
  ]
}

getList()

async function getList() {
  listLoading.value = true
  try {
    const { data } = await getCompanyList()
    total.value = data.sum || 0
    list.value = data.list || []
  } finally {
    listLoading.value = false
  }
}

function openAddDialog() {
  temp.stockCode = ''
  addDialogVisible.value = true
}

function fcfDeviation(row) {
  if (!row?.price) {
    return null
  }
  return roundToDecimal((row.freeCashFlowPer || 0) * 10, 2) / row.price - 1
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
  return passesDeviationFilter(value, row.deviation)
}

function filterDeviationByFcf(value, row) {
  return passesDeviationFilter(value, fcfDeviation(row))
}

async function doAddCompany() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) {
    return
  }

  submitting.value = true
  try {
    const response = await addCompany(temp)
    list.value.unshift(response.data.companyInfo)
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
    list.value = response.data.list || []
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
    list.value = response.data.list || []
    total.value = response.data.sum || 0
    ElNotification.success({
      title: 'Success',
      message: '股价批量更新完成'
    })
  } finally {
    listLoading.value = false
  }
}

async function confirmUpdatePrice(row, index) {
  await ElMessageBox.confirm(
    '此操作将重新获取该公司的股价，是否继续？',
    '提示',
    {
      type: 'warning'
    }
  )
  const response = await updatePrice(row.companyId)
  list.value.splice(index, 1, response.data.companyInfo)
  ElNotification.success({
    title: 'Success',
    message: '股价更新成功'
  })
}

async function confirmUpdateReport(row, index) {
  await ElMessageBox.confirm('此操作将更新公司财报数据，是否继续？', '提示', {
    type: 'warning'
  })
  const response = await updateReport({ companyId: row.companyId })
  list.value.splice(index, 1, response.data.companyInfo)
  ElNotification.success({
    title: 'Success',
    message: '财报更新成功'
  })
}

async function confirmDelete(row, index) {
  await ElMessageBox.confirm('此操作将删除该公司，是否继续？', '提示', {
    type: 'warning'
  })
  await deleteCompany(row.companyId)
  list.value.splice(index, 1)
  total.value -= 1
  ElNotification.success({
    title: 'Success',
    message: '删除成功'
  })
}

async function changeGrowthRate(row, index) {
  const response = await updateGrowthRate({
    companyId: row.companyId,
    growthRateAssumption: row.growthRateAssumption
  })
  list.value.splice(index, 1, response.data.companyInfo)
  ElNotification.success({
    title: 'Success',
    message: '假定增速更新成功'
  })
}

function goDetail(row) {
  router.push(`/companyvaluation/valuation/company/${row.companyId}`)
}
</script>

<style scoped lang="scss">
p {
  margin: 0;
  color: #5d748b;
}

.deviation-high {
  color: #c43c2d;
  font-weight: 700;
}

.deviation-mid {
  color: #bb7b13;
  font-weight: 700;
}
</style>
