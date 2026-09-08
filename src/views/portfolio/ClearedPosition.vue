<template>
  <div>
    <el-table :data="cleared" border stripe>
      <el-table-column type="expand">
        <template #default="{ row }">
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="持股策略">{{
              row.holdStrategy || '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="持股计划">{{
              row.holdPlan || '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="档案备考">{{
              row.archiveRemark || '-'
            }}</el-descriptions-item>
          </el-descriptions>
        </template>
      </el-table-column>
      <el-table-column prop="stockCode" label="代码" width="100" />
      <el-table-column prop="stockName" label="名称" width="110" />
      <el-table-column prop="clearedDate" label="清仓日期" width="110" />
      <el-table-column prop="lastStatsDate" label="最后持仓周" width="110" />
      <el-table-column
        label="买入判定"
        min-width="170"
        :filters="decisionFilterOpts"
        :filter-method="filterDecision"
      >
        <template #default="{ row }">{{ decisionText(row) }}</template>
      </el-table-column>
      <el-table-column
        label="大V"
        width="110"
        :filters="bigVOpts"
        :filter-method="(value, row) => row.bigV === value"
      >
        <template #default="{ row }">
          <truncated-text :text="row.bigV" />
        </template>
      </el-table-column>
      <el-table-column label="实现盈亏" width="120">
        <template #default="{ row }">{{ formatPl(row.realizedPl) }}</template>
      </el-table-column>
      <el-table-column label="持股天数" width="90">
        <template #default="{ row }">{{ row.holdDays ?? '-' }}</template>
      </el-table-column>
      <el-table-column prop="clearReason" label="清仓原因" width="100" />
      <el-table-column label="备注" min-width="140">
        <template #default="{ row }">
          <truncated-text :text="row.clearedRemark" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="130" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="removeRow(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <ClearedEditDialog
      v-model:visible="editVisible"
      :row="editingRow"
      @saved="load"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPortfolioCleared, deletePortfolioCleared } from '@/api/portfolio'
import ClearedEditDialog from './components/ClearedEditDialog.vue'
import TruncatedText from './components/TruncatedText.vue'
import { decisionText } from './decision-display'

const cleared = ref([])
const editVisible = ref(false)
const editingRow = ref(null)

function formatPl(v) {
  return v == null
    ? '-'
    : Number(v).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

const decisionFilterOpts = computed(() => {
  const seen = []
  cleared.value.forEach((r) => {
    if (r.buyReason && !seen.includes(r.buyReason)) seen.push(r.buyReason)
    if (r.decisionLevel && !seen.includes(r.decisionLevel))
      seen.push(r.decisionLevel)
  })
  return seen.map((v) => ({ text: v, value: v }))
})
function filterDecision(value, row) {
  return row.buyReason === value || row.decisionLevel === value
}

const bigVOpts = computed(() => {
  const seen = []
  cleared.value.forEach((r) => {
    if (r.bigV && !seen.includes(r.bigV)) seen.push(r.bigV)
  })
  return seen.map((v) => ({ text: v, value: v }))
})

async function load() {
  try {
    const res = await getPortfolioCleared()
    cleared.value = (res.data.cleared || []).map((c) => ({
      ...c,
      bigV: c.bigV || '',
      buyReason: c.buyReason || '',
      stockType: c.stockType || '',
      pricePosition: c.pricePosition || '',
      timing: c.timing || '',
      decisionLevel: c.decisionLevel || '',
      clearReason: c.clearReason || '',
      realizedPl: c.realizedPl ?? null,
      holdDays: c.holdDays ?? null,
      clearedRemark: c.clearedRemark || ''
    }))
  } catch {
    // interceptor 已提示
  }
}

function openEdit(row) {
  editingRow.value = row
  editVisible.value = true
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
