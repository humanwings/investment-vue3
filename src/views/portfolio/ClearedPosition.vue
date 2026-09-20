<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openAdd">新增清仓记录</el-button>
      <StockSelect
        v-model="stockFilter"
        :manual="false"
        placeholder="按标的过滤：拼音简写 / 代码 / 名称"
        class="stock-filter"
      />
    </div>
    <el-table
      ref="tableRef"
      :data="pagedCleared"
      border
      stripe
      @filter-change="onFilterChange"
    >
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
        column-key="decision"
        label="买入原因"
        min-width="170"
        :filters="decisionFilterOpts"
        :filter-method="filterDecision"
      >
        <template #default="{ row }">{{ decisionText(row) }}</template>
      </el-table-column>
      <el-table-column
        column-key="bigV"
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
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[20, 50, 100]"
      :total="filteredCleared.length"
      layout="total, sizes, prev, pager, next, jumper"
      class="pagination"
      @size-change="currentPage = 1"
    />
    <ClearedEditDialog
      v-model:visible="editVisible"
      :row="editingRow"
      @saved="load"
    />
    <ClearedAddDialog v-model:visible="addVisible" @saved="load" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPortfolioCleared, deletePortfolioCleared } from '@/api/portfolio'
import StockSelect from '@/components/StockSelect.vue'
import ClearedEditDialog from './components/ClearedEditDialog.vue'
import ClearedAddDialog from './components/ClearedAddDialog.vue'
import TruncatedText from './components/TruncatedText.vue'
import { decisionText } from './decision-display'
import {
  applyClearedFilters,
  applyStockFilter,
  paginateCleared
} from './cleared-pagination'
import { DECISION_DIMENSIONS } from '@/views/decision/buyDecisionRules2'

const cleared = ref([])
const editVisible = ref(false)
const editingRow = ref(null)
const addVisible = ref(false)

const activeFilters = ref({})
const currentPage = ref(1)
const pageSize = ref(20)
const stockFilter = ref(null)
const tableRef = ref(null)

const filteredCleared = computed(() =>
  applyStockFilter(
    applyClearedFilters(cleared.value, activeFilters.value),
    stockFilter.value
  )
)
const pagedCleared = computed(() =>
  paginateCleared(filteredCleared.value, currentPage.value, pageSize.value)
)

function onFilterChange(filters) {
  activeFilters.value = { ...activeFilters.value, ...filters }
  currentPage.value = 1
}

watch(stockFilter, (stock) => {
  if (stock) {
    activeFilters.value = {}
    tableRef.value?.clearFilter()
  }
  currentPage.value = 1
})

function formatPl(v) {
  return v == null
    ? '-'
    : Number(v).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

const recoOptions = DECISION_DIMENSIONS.find(
  (d) => d.key === 'recommends'
).options
const typeOptions = DECISION_DIMENSIONS.find((d) => d.key === 'type').options
const decisionFilterOpts = computed(() => [
  ...recoOptions.map((v) => ({ text: `推荐：${v}`, value: `reco:${v}` })),
  ...typeOptions.map((v) => ({ text: `类型：${v}`, value: `type:${v}` }))
])
function filterDecision(value, row) {
  const idx = value.indexOf(':')
  const kind = value.slice(0, idx)
  const v = value.slice(idx + 1)
  if (kind === 'reco')
    return String(row.reco || '')
      .split(',')
      .includes(v)
  return row.stockType === v
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
      reco: c.reco || '',
      factor: c.factor || '',
      trend: c.trend || '',
      fame: c.fame || '',
      stockType: c.stockType || '',
      pricePosition: c.pricePosition || '',
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

function openAdd() {
  addVisible.value = true
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

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.stock-filter {
  width: 300px;
}
.pagination {
  margin-top: 12px;
  justify-content: flex-end;
}
</style>
