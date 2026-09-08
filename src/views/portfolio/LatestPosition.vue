<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="importVisible = true"
        >导入 Excel</el-button
      >
      <span v-if="summary.statsDate" class="summary">
        最新统计日期：{{ summary.statsDate }} ｜ 持仓
        {{ summary.positionCount }} 只 ｜ 总市值(含现金)
        {{ format(totalAll) }}
        <span
          v-if="weekDiff !== null"
          class="diff"
          :class="weekDiff >= 0 ? 'up' : 'down'"
        >
          {{ weekDiff >= 0 ? '▲' : '▼' }} 较上周{{
            weekDiff >= 0 ? '增加' : '减少'
          }}
          {{ format(Math.abs(weekDiff)) }}
        </span>
      </span>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="总持仓" name="total">
        <el-table
          :data="totalTable"
          border
          stripe
          :header-cell-style="headerStyle"
          :row-class-name="rowClassName"
        >
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="stockName" label="名称" width="120" />
          <el-table-column
            prop="industryL1"
            label="一级行业"
            width="120"
            :filters="industryOpts"
            :filter-method="(value, row) => row.industryL1 === value"
          />
          <el-table-column
            label="总市值"
            width="120"
            align="right"
            header-align="right"
          >
            <template #default="{ row }">{{
              format(row.stockCode ? mv(row) : row.totalMv)
            }}</template>
          </el-table-column>
          <el-table-column
            label="总盈亏"
            width="120"
            align="right"
            header-align="right"
          >
            <template #default="{ row }">
              <span v-if="row.stockCode">{{ format(pl(row)) }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column
            label="买入判定"
            min-width="170"
            :filters="decisionFilterOpts"
            :filter-method="filterDecision"
          >
            <template #default="{ row }">
              <span v-if="row.stockCode">{{ decisionText(row) }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column
            label="大V"
            width="110"
            :filters="bigVOpts"
            :filter-method="(value, row) => row.bigV === value"
          >
            <template #default="{ row }">
              <truncated-text :text="row.stockCode ? row.bigV : ''" />
            </template>
          </el-table-column>
          <el-table-column
            label="持股策略"
            width="110"
            :filters="strategyOpts"
            :filter-method="(value, row) => row.holdStrategy === value"
          >
            <template #default="{ row }">{{
              row.stockCode ? row.holdStrategy || '-' : '-'
            }}</template>
          </el-table-column>
          <el-table-column label="持股计划" min-width="140">
            <template #default="{ row }">
              <truncated-text :text="row.stockCode ? row.holdPlan : ''" />
            </template>
          </el-table-column>
          <el-table-column label="当期业绩" min-width="150">
            <template #default="{ row }">
              <truncated-text :text="row.stockCode ? row.earningsNote : ''" />
            </template>
          </el-table-column>
          <el-table-column label="备考" min-width="150">
            <template #default="{ row }">
              <truncated-text :text="row.stockCode ? row.archiveRemark : ''" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.stockCode"
                type="primary"
                link
                @click="openEdit(row)"
                >编辑</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="国泰海通" name="gt" lazy>
        <el-table
          :data="gtTable"
          border
          stripe
          :header-cell-style="headerStyle"
          :row-class-name="rowClassName"
        >
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="stockName" label="名称" width="120" />
          <el-table-column prop="stockCode" label="代码" width="100" />
          <el-table-column
            prop="gtQty"
            label="数量"
            width="90"
            align="right"
            header-align="right"
          />
          <el-table-column
            label="市值"
            width="110"
            align="right"
            header-align="right"
          >
            <template #default="{ row }">{{ format(row.gtMv) }}</template>
          </el-table-column>
          <el-table-column
            label="成本价"
            width="100"
            align="right"
            header-align="right"
          >
            <template #default="{ row }">{{ row.gtCost ?? '-' }}</template>
          </el-table-column>
          <el-table-column
            label="浮动盈亏"
            width="110"
            align="right"
            header-align="right"
          >
            <template #default="{ row }">{{ format(row.gtPl) }}</template>
          </el-table-column>
          <el-table-column label="当期业绩" min-width="180">
            <template #default="{ row }">
              <truncated-text :text="row.earningsNote" />
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="平安证券" name="pa" lazy>
        <el-table
          :data="paTable"
          border
          stripe
          :header-cell-style="headerStyle"
          :row-class-name="rowClassName"
        >
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="stockName" label="名称" width="120" />
          <el-table-column prop="stockCode" label="代码" width="100" />
          <el-table-column
            prop="paQty"
            label="数量"
            width="90"
            align="right"
            header-align="right"
          />
          <el-table-column
            label="市值"
            width="110"
            align="right"
            header-align="right"
          >
            <template #default="{ row }">{{ format(row.paMv) }}</template>
          </el-table-column>
          <el-table-column
            label="成本价"
            width="100"
            align="right"
            header-align="right"
          >
            <template #default="{ row }">{{ row.paCost ?? '-' }}</template>
          </el-table-column>
          <el-table-column
            label="浮动盈亏"
            width="110"
            align="right"
            header-align="right"
          >
            <template #default="{ row }">{{ format(row.paPl) }}</template>
          </el-table-column>
          <el-table-column label="当期业绩" min-width="180">
            <template #default="{ row }">
              <truncated-text :text="row.earningsNote" />
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <ImportDialog v-model:visible="importVisible" @success="load" />
    <PositionEditDialog
      v-model:visible="editVisible"
      :row="editingRow"
      @saved="load"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getPortfolioLatest, getPortfolioSnapshots } from '@/api/portfolio'
import ImportDialog from './components/ImportDialog.vue'
import PositionEditDialog from './components/PositionEditDialog.vue'
import TruncatedText from './components/TruncatedText.vue'
import { decisionText } from './decision-display'

const activeTab = ref('total')
const importVisible = ref(false)
const editVisible = ref(false)
const editingRow = ref(null)
const summary = ref({})
const positions = ref([])
const prevAll = ref(null)

const totalAll = computed(
  () => (summary.value.totalMv || 0) + (summary.value.totalCash || 0)
)
const weekDiff = computed(() =>
  prevAll.value == null ? null : totalAll.value - prevAll.value
)

const headerStyle = { background: '#16305a', color: '#fff', fontWeight: '700' }
function rowClassName({ row }) {
  return row.stockCode ? '' : 'cash-row'
}

function format(v) {
  return v == null
    ? '-'
    : Number(v).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}
function mv(row) {
  return (row.gtMv || 0) + (row.paMv || 0)
}
function pl(row) {
  return (row.gtPl || 0) + (row.paPl || 0)
}
function hasGt(p) {
  return p.gtQty != null || p.gtMv != null || p.gtCost != null || p.gtPl != null
}
function hasPa(p) {
  return p.paQty != null || p.paMv != null || p.paCost != null || p.paPl != null
}

function opts(key) {
  const seen = []
  positions.value.forEach((p) => {
    const v = p[key]
    if (v && !seen.includes(v)) seen.push(v)
  })
  return seen.map((v) => ({ text: v, value: v }))
}
const industryOpts = computed(() => opts('industryL1'))
const strategyOpts = computed(() => opts('holdStrategy'))
const bigVOpts = computed(() => opts('bigV'))
const decisionFilterOpts = computed(() => {
  const seen = []
  positions.value.forEach((p) => {
    if (p.buyReason && !seen.includes(p.buyReason)) seen.push(p.buyReason)
    if (p.decisionLevel && !seen.includes(p.decisionLevel))
      seen.push(p.decisionLevel)
  })
  return seen.map((v) => ({ text: v, value: v }))
})
function filterDecision(value, row) {
  return row.buyReason === value || row.decisionLevel === value
}

const totalTable = computed(() => {
  const rows = [...positions.value]
  rows.push({ stockName: '现金', totalMv: summary.value.totalCash })
  return rows
})
const gtTable = computed(() => {
  const held = positions.value
    .filter(hasGt)
    .sort((a, b) => (b.gtMv || 0) - (a.gtMv || 0))
  held.push({ stockName: '现金', gtMv: summary.value.gtCash })
  return held
})
const paTable = computed(() => {
  const held = positions.value
    .filter(hasPa)
    .sort((a, b) => (b.paMv || 0) - (a.paMv || 0))
  held.push({ stockName: '现金', paMv: summary.value.paCash })
  return held
})

async function load() {
  try {
    const [res, sres] = await Promise.all([
      getPortfolioLatest(),
      getPortfolioSnapshots()
    ])
    summary.value = res.data.summary || {}
    positions.value = (res.data.positions || []).map((p) => ({
      ...p,
      bigV: p.bigV || '',
      buyReason: p.buyReason || '',
      stockType: p.stockType || '',
      pricePosition: p.pricePosition || '',
      timing: p.timing || '',
      decisionLevel: p.decisionLevel || '',
      holdStrategy: p.holdStrategy || '',
      holdPlan: p.holdPlan || '',
      archiveRemark: p.archiveRemark || '',
      earningsNote: p.earningsNote || ''
    }))
    const snaps = sres.data.snapshots || []
    const idx = snaps.findIndex((s) => s.statsDate === summary.value.statsDate)
    const prevRow = idx >= 0 && idx + 1 < snaps.length ? snaps[idx + 1] : null
    prevAll.value = prevRow
      ? (prevRow.totalMv || 0) + (prevRow.totalCash || 0)
      : null
  } catch {
    // interceptor 已提示
  }
}

function openEdit(row) {
  if (!row.stockCode) return
  editingRow.value = row
  editVisible.value = true
}

onMounted(load)
</script>

<style scoped>
.toolbar {
  margin-bottom: 12px;
}
.summary {
  margin-left: 14px;
  color: #606266;
}
.diff {
  margin-left: 12px;
  font-weight: 700;
}
:deep(.el-table th.el-table__cell) {
  background: #16305a;
  color: #fff;
  border-color: #2b4a78;
}
:deep(
  .el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell
) {
  background: #eef4fb;
}
.cash-row td.el-table__cell {
  background: #e5effc !important;
  font-weight: 700;
}
.up {
  color: #f56c6c;
}
.down {
  color: #67c23a;
}
</style>
