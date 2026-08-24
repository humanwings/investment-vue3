<template>
  <div>
    <el-table :data="cleared" border stripe>
      <el-table-column type="expand">
        <template #default="{ row }">
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="来源">{{
              row.sourceType || '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="大V">{{
              row.bigV || '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="买入原因">{{
              row.buyReason || '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="持股策略">{{
              row.holdStrategy || '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="持股计划">{{
              row.holdPlan || '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="备考">{{
              row.archiveRemark || '-'
            }}</el-descriptions-item>
          </el-descriptions>
        </template>
      </el-table-column>
      <el-table-column prop="stockCode" label="代码" width="100" />
      <el-table-column prop="stockName" label="名称" width="110" />
      <el-table-column prop="clearedDate" label="清仓日期" width="110" />
      <el-table-column prop="lastStatsDate" label="最后持仓周" width="110" />
      <el-table-column label="参考盈亏(只读)" width="120">
        <template #default="{ row }">{{ formatPl(row.refTotalPl) }}</template>
      </el-table-column>
      <el-table-column label="实现盈亏" width="130">
        <template #default="{ row }">
          <el-input-number
            v-model="row.realizedPl"
            :precision="2"
            size="small"
            controls-position="right"
          />
        </template>
      </el-table-column>
      <el-table-column label="持股天数" width="110">
        <template #default="{ row }">
          <el-input-number
            v-model="row.holdDays"
            :min="0"
            size="small"
            controls-position="right"
          />
        </template>
      </el-table-column>
      <el-table-column label="清仓原因" width="120">
        <template #default="{ row }">
          <el-select v-model="row.clearReason" size="small" clearable>
            <el-option
              v-for="r in clearReasons"
              :key="r"
              :label="r"
              :value="r"
            />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="清仓原因备注" width="150">
        <template #default="{ row }">
          <el-input v-model="row.clearReasonRemark" size="small" />
        </template>
      </el-table-column>
      <el-table-column label="备注" width="160">
        <template #default="{ row }">
          <el-input v-model="row.clearedRemark" size="small" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="130" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="saveRow(row)">保存</el-button>
          <el-button type="danger" link @click="removeRow(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getPortfolioCleared,
  updatePortfolioCleared,
  deletePortfolioCleared
} from '@/api/portfolio'

const clearReasons = [
  '止损',
  '止盈',
  '消息利空',
  '财报不佳',
  '跟随大V',
  '信心不足',
  '其他'
]
const cleared = ref([])

function formatPl(v) {
  return v == null
    ? '-'
    : Number(v).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

async function load() {
  try {
    const res = await getPortfolioCleared()
    cleared.value = (res.data.cleared || []).map((c) => ({
      ...c,
      clearReason: c.clearReason || '',
      clearReasonRemark: c.clearReasonRemark || '',
      realizedPl: c.realizedPl ?? null,
      holdDays: c.holdDays ?? null,
      clearedRemark: c.clearedRemark || ''
    }))
  } catch {
    // interceptor 已提示
  }
}

async function saveRow(row) {
  try {
    await updatePortfolioCleared(row.clearedId, {
      clearReason: row.clearReason,
      clearReasonRemark: row.clearReasonRemark,
      realizedPl: row.realizedPl,
      holdDays: row.holdDays,
      clearedRemark: row.clearedRemark
    })
    ElMessage.success('保存成功')
  } catch {
    // interceptor 已提示
  }
}

async function removeRow(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除 ${row.stockName}(${row.stockCode}) 这条清仓记录吗？`,
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      }
    )
  } catch {
    return
  }
  try {
    await deletePortfolioCleared(row.clearedId)
    ElMessage.success('删除成功')
    await load()
  } catch {
    // interceptor 已提示
  }
}

onMounted(load)
</script>
