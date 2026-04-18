<template>
  <section class="page-shell list-page">
    <div class="page-card list-card">
      <div class="page-head">
        <div>
          <div class="eyebrow">Strategy</div>
          <h2>策略一览</h2>
        </div>
        <div class="actions">
          <el-button type="primary" @click="router.push('/barginhunting/strategy/strategyadd')">
            <el-icon><Plus /></el-icon>
            <span>新建策略</span>
          </el-button>
          <el-button v-if="selectedId.length === 2" class="btn-violet" @click="compareSelected">
            <el-icon><Operation /></el-icon>
            <span>结果比较</span>
          </el-button>
          <el-button v-if="selectedId.length" type="danger" @click="confirmDelSelected">
            <el-icon><Delete /></el-icon>
            <span>批量删除</span>
          </el-button>
        </div>
      </div>

      <div class="table-shell table-shell--fill">
        <el-table v-loading="listLoading" :data="list" row-key="strategyId" height="100%">
        <el-table-column label="" width="48" align="center">
          <template #default="{ row }">
            <input v-model="selectedId" type="checkbox" :value="row.strategyId">
          </template>
        </el-table-column>
        <el-table-column prop="strategyId" label="序号" width="70" sortable />
        <el-table-column prop="name" label="策略名" width="160" />
        <el-table-column label="子策略数" align="center">
          <el-table-column prop="selectTacticsNum" label="选股" width="70" />
          <el-table-column prop="buyTacticsNum" label="买入" width="70" />
          <el-table-column prop="sellTacticsNum" label="卖出" width="70" />
        </el-table-column>
        <el-table-column label="选股结果" align="center">
          <el-table-column prop="totalNum" label="总数" width="80" />
          <el-table-column prop="selectedNum" label="中选数" width="80" />
          <el-table-column prop="notSelectedNum" label="落选数" width="80" />
          <el-table-column label="中选率" width="90">
            <template #default="{ row }">
              {{ ratio(row.selectedNum, row.totalNum) }}
            </template>
          </el-table-column>
          <el-table-column label="落选率" width="90">
            <template #default="{ row }">
              {{ ratio(row.notSelectedNum, row.totalNum) }}
            </template>
          </el-table-column>
          <el-table-column prop="errorNum" label="Error数" width="80" />
        </el-table-column>
        <el-table-column label="交易结果" align="center">
          <el-table-column label="盈亏总计" align="center">
            <el-table-column prop="tradeNum" label="次数" width="90" sortable />
            <el-table-column prop="balance" label="总金额" width="120" sortable />
            <el-table-column prop="average" label="平均金额" width="120" sortable />
          </el-table-column>
          <el-table-column label="盈利小计" align="center">
            <el-table-column prop="profitNum" label="个数" width="80" />
            <el-table-column label="比例" width="80">
              <template #default="{ row }">
                {{ ratio(row.profitNum, tradeBase(row)) }}
              </template>
            </el-table-column>
            <el-table-column label="金额" width="90">
              <template #default="{ row }">
                {{ formatAmount(row.profitSum) }}
              </template>
            </el-table-column>
            <el-table-column label="中位数" width="90">
              <template #default="{ row }">
                {{ formatAmount(row.profitMedian) }}
              </template>
            </el-table-column>
          </el-table-column>
          <el-table-column label="亏损小计" align="center">
            <el-table-column prop="lossNum" label="个数" width="80" />
            <el-table-column label="比例" width="80">
              <template #default="{ row }">
                {{ ratio(row.lossNum, tradeBase(row)) }}
              </template>
            </el-table-column>
            <el-table-column label="金额" width="90">
              <template #default="{ row }">
                {{ formatAmount(row.lossSum) }}
              </template>
            </el-table-column>
            <el-table-column label="中位数" width="90">
              <template #default="{ row }">
                {{ formatAmount(row.lossMedian) }}
              </template>
            </el-table-column>
          </el-table-column>
          <el-table-column label="其他" align="center">
            <el-table-column prop="breakEvenNum" label="盈亏平衡" width="90" />
            <el-table-column prop="noBuyNum" label="买入失败" width="90" />
            <el-table-column prop="noSellNum" label="尚未卖出" width="90" />
          </el-table-column>
        </el-table-column>
        <el-table-column label="处理" width="220" fixed="right">
          <template #default="{ row, $index }">
            <div class="row-actions">
              <el-button text type="primary" @click="confirmCal(row, $index)">
                <el-icon><DataAnalysis /></el-icon>
                <span>检证</span>
              </el-button>
              <el-button text type="warning" @click="showResult(row)">
                <el-icon><View /></el-icon>
                <span>结果</span>
              </el-button>
              <el-button text type="success" @click="editItem(row)">
                <el-icon><Edit /></el-icon>
                <span>编辑</span>
              </el-button>
              <el-button text type="danger" @click="confirmDel(row, $index)">
                <el-icon><Delete /></el-icon>
                <span>删除</span>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { DataAnalysis, Delete, Edit, Operation, Plus, View } from '@element-plus/icons-vue'

import { calculateStrategy, deleteSelectedStrategies, deleteStrategy, getStrategyList } from '@/api/strategy'
import { formatPercent } from '@/utils'

const router = useRouter()
const list = ref([])
const listLoading = ref(false)
const selectedId = ref([])

getList()

async function getList() {
  listLoading.value = true
  try {
    const { data } = await getStrategyList()
    list.value = (data.strategyList || []).map(item => ({
      ...item,
      average: item.balance && item.tradeNum ? (item.balance / item.tradeNum).toFixed(2) : item.average
    }))
  } finally {
    listLoading.value = false
  }
}

function tradeBase(row) {
  return (row.selectedNum || 0) - (row.noBuyNum || 0) - (row.noSellNum || 0)
}

function ratio(a, b) {
  return b ? formatPercent(a / b) : ''
}

function formatAmount(value) {
  return value === null || value === undefined ? '' : Number(value).toFixed(2)
}

function showResult(row) {
  router.push(`/barginhunting/analyte/verification/${row.strategyId}`)
}

function editItem(row) {
  router.push(`/barginhunting/strategy/strategyedit/${row.strategyId}`)
}

async function confirmDel(row, index) {
  await ElMessageBox.confirm('此操作将删除此策略，是否继续？', '提示', { type: 'warning' })
  await deleteStrategy(row.strategyId)
  list.value.splice(index, 1)
  ElMessage.success('删除成功')
}

async function confirmCal(row, index) {
  await ElMessageBox.confirm('此操作将重新计算此策略的盈亏状况，是否继续？', '提示', { type: 'warning' })
  const response = await calculateStrategy(row.strategyId)
  const result = {
    ...response.data.calculate,
    name: row.name,
    buyTacticsNum: row.buyTacticsNum,
    selectTacticsNum: row.selectTacticsNum,
    sellTacticsNum: row.sellTacticsNum
  }
  list.value.splice(index, 1, result)
  ElMessage.success('计算成功')
}

async function confirmDelSelected() {
  if (!selectedId.value.length) {
    return
  }
  await ElMessageBox.confirm(`此操作将删除${selectedId.value.length}个策略，是否继续？`, '提示', { type: 'warning' })
  const formData = new FormData()
  selectedId.value.forEach(id => formData.append('strategiesId', id))
  await deleteSelectedStrategies(formData)
  list.value = list.value.filter(item => !selectedId.value.includes(item.strategyId))
  selectedId.value = []
  ElMessage.success('批量删除成功')
}

function compareSelected() {
  if (selectedId.value.length !== 2) {
    return
  }
  router.push(`/barginhunting/analyte/verification/compare/${selectedId.value[0]}/${selectedId.value[1]}`)
}
</script>

<style scoped lang="scss"></style>
