<template>
  <section class="page-shell list-page">
    <div class="page-card list-card">
      <div class="page-head">
        <div>
          <div class="eyebrow">Analyte</div>
          <h2>历史数据</h2>
        </div>
        <div class="actions">
          <el-tag type="info">数据总计 {{ total }}</el-tag>
          <el-button type="primary" @click="handleImport">
            <el-icon><Plus /></el-icon>
            <span>导入数据</span>
          </el-button>
        </div>
      </div>

      <div class="table-shell table-shell--fill">
        <el-table v-loading="listLoading" :data="list" height="100%">
          <el-table-column prop="analyteId" label="序号" width="70" />
          <el-table-column prop="name" label="名称" width="140" />
          <el-table-column prop="ndate" label="N日" width="120" />
          <el-table-column prop="stockCode" label="代码" width="120" />
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag
                :type="listingStatusType[row.listingStatus]"
                effect="dark"
                >{{ getListingStatus(row.listingStatus) }}</el-tag
              >
            </template>
          </el-table-column>
          <el-table-column label="PE-TTM" width="110">
            <template #default="{ row }">{{ formatAmount(row.pe) }}</template>
          </el-table-column>
          <el-table-column label="PB(不含商誉)" width="130">
            <template #default="{ row }">{{ formatAmount(row.pb) }}</template>
          </el-table-column>
          <el-table-column label="市值" width="120">
            <template #default="{ row }">{{ formatYi(row.mc) }}</template>
          </el-table-column>
          <el-table-column label="自由流通市值" width="140">
            <template #default="{ row }">{{ formatYi(row.ecmc) }}</template>
          </el-table-column>
          <el-table-column label="股东人数" width="100" prop="shn" />
          <el-table-column label="人均自由流通市值" width="150">
            <template #default="{ row }">{{
              formatWan(row.ecmc_psh)
            }}</template>
          </el-table-column>
          <el-table-column prop="plungeReason" label="暴跌原因" width="130" />
          <el-table-column prop="plungeDates" label="暴跌天数" width="110" />
          <el-table-column prop="plungeGap" label="暴跌缺口数" width="110" />
          <el-table-column
            prop="plungeTerrace"
            label="暴跌平台数"
            width="110"
          />
          <el-table-column label="暴跌最大幅度" width="130">
            <template #default="{ row }">{{
              formatPercent(row.plungeMax)
            }}</template>
          </el-table-column>
          <el-table-column fixed="right" label="处理" width="90">
            <template #default="{ row, $index }">
              <div class="row-actions">
                <el-button text type="danger" @click="confirmDel(row, $index)">
                  <el-icon><Delete /></el-icon>
                  <span>删除</span>
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pager">
        <el-pagination
          background
          :current-page="listQuery.page"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="listQuery.limit"
          layout="total, sizes, prev, pager, next"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <el-dialog v-model="importVisible" title="导入数据" width="520px">
      <el-form ref="formRef" :model="temp" :rules="rules" label-width="100px">
        <el-form-item label="StockCode" prop="stockCode"
          ><el-input v-model="temp.stockCode"
        /></el-form-item>
        <el-form-item label="Date" prop="ndate"
          ><el-date-picker
            v-model="temp.ndate"
            type="date"
            value-format="YYYY-MM-DD"
        /></el-form-item>
        <el-form-item label="关注度"
          ><el-rate v-model="temp.popularity" :max="3"
        /></el-form-item>
        <el-form-item label="走势">
          <el-select v-model="temp.trend" clearable>
            <el-option
              v-for="item in trendOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="原因">
          <el-select v-model="temp.plungeReason" clearable>
            <el-option
              v-for="item in reasonOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="importVisible = false">取消</el-button>
        <el-button type="primary" @click="importData">确认</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Plus } from '@element-plus/icons-vue'

import { createAnalyte, deleteAnalyte, getDonePage } from '@/api/analyte'
import { listingStatusOptions, reasonOptions, trendOptions } from '@/codebook'
import { formatPercent, formatWan, formatYi } from '@/utils'

const total = ref(0)
const list = ref([])
const listLoading = ref(false)
const importVisible = ref(false)
const formRef = ref()

const listQuery = reactive({
  page: 1,
  limit: 10
})

const listingStatusType = {
  normally_listed: 'success',
  special_treatment: 'warning',
  delisting_risk_warning: 'danger'
}

const temp = reactive({
  stockCode: '',
  ndate: '',
  plungeReason: '',
  trend: '',
  popularity: 0
})

const rules = {
  stockCode: [
    { required: true, message: 'stockCode is required', trigger: 'blur' }
  ],
  ndate: [{ required: true, message: 'date is required', trigger: 'change' }]
}

getList()

async function getList() {
  listLoading.value = true
  try {
    const { data } = await getDonePage(listQuery)
    total.value = data.sum || 0
    list.value = data.list || []
  } finally {
    listLoading.value = false
  }
}

function getListingStatus(status) {
  return (
    listingStatusOptions.find((item) => item.value === status)?.label || status
  )
}

function formatAmount(value) {
  return value === null || value === undefined ? '' : Number(value).toFixed(2)
}

function handleImport() {
  temp.stockCode = ''
  temp.ndate = ''
  temp.plungeReason = ''
  temp.trend = ''
  temp.popularity = 0
  importVisible.value = true
}

async function importData() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) {
    return
  }
  await createAnalyte(temp)
  importVisible.value = false
  listQuery.page = 1
  await getList()
  ElMessage.success('导入成功')
}

async function confirmDel(row) {
  await ElMessageBox.confirm('此操作将删除此数据，是否继续？', '提示', {
    type: 'warning'
  })
  await deleteAnalyte(row.analyteId)
  await getList()
  ElMessage.success('删除成功')
}

function handleSizeChange(limit) {
  listQuery.limit = limit
  getList()
}

function handleCurrentChange(page) {
  listQuery.page = page
  getList()
}
</script>

<style scoped lang="scss"></style>
