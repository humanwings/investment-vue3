<template>
  <section class="page-shell">
    <div class="page-card">
      <div class="page-head">
        <div>
          <h2>网格策略</h2>
          <p>
            网格策略管理 +
            模拟信号跟踪；股价需手动刷新，系统检测跨档后生成待确认提示。
          </p>
        </div>
        <div class="actions">
          <el-button :loading="refreshing" @click="refreshAll">
            刷新全部股价
          </el-button>
          <el-button
            type="primary"
            @click="router.push('/grid-trading/strategy/add')"
          >
            新增策略
          </el-button>
        </div>
      </div>

      <div class="stat-bar">
        <div class="stat-item">
          <span class="stat-label">总标的数</span>
          <span class="stat-value">{{ list.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">总市值</span>
          <span class="stat-value">{{ formatNumber(totalMarketValue) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">待确认</span>
          <span class="stat-value pending">{{ totalPending }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">即将触发</span>
          <span class="stat-value imminent">{{ totalImminent }}</span>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="sortedRows"
        :max-height="'calc(100vh - 300px)'"
        row-key="strategyId"
        @sort-change="handleSortChange"
        @row-click="handleRowClick"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="标的" min-width="160">
          <template #default="{ row }">
            <div class="stock-cell">
              <b>{{ row.stockName }}</b>
              <el-tag size="small" type="info">{{ row.stockCode }}</el-tag>
              <span
                :class="row.market === 'H' ? 'market-h' : 'market-a'"
                class="market-badge"
                >{{ row.market }}</span
              >
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="pendingCount"
          label="待确认"
          width="90"
          sortable="custom"
        >
          <template #default="{ row }">
            <span v-if="row.pendingCount > 0" class="pending-badge">
              <el-icon class="pending-icon"><Bell /></el-icon>
              {{ row.pendingCount }}
            </span>
            <span v-else />
          </template>
        </el-table-column>
        <el-table-column
          prop="imminent"
          label="即将触发"
          width="120"
          sortable="custom"
          align="center"
        >
          <template #default="{ row }">
            <span
              v-if="row.imminentAction"
              :title="imminentTitle(row)"
              :class="
                row.imminentAction === 'SELL' ? 'imminent-up' : 'imminent-down'
              "
              class="imminent-badge"
            >
              <el-icon>
                <ArrowUpBold v-if="row.imminentAction === 'SELL'" />
                <ArrowDownBold v-else />
              </el-icon>
            </span>
            <span v-else />
          </template>
        </el-table-column>
        <el-table-column prop="basePrice" label="基准价" width="90">
          <template #default="{ row }">{{
            formatPrice(row.basePrice)
          }}</template>
        </el-table-column>
        <el-table-column label="现价" width="90">
          <template #default="{ row }">{{
            formatPrice(row.lastPrice)
          }}</template>
        </el-table-column>
        <el-table-column label="当前档位" width="100">
          <template #default="{ row }">
            {{
              row.currentTierLevel === null ||
              row.currentTierLevel === undefined
                ? '—'
                : tierLabel(row.currentTierLevel)
            }}
          </template>
        </el-table-column>
        <el-table-column label="当前持仓" width="110">
          <template #default="{ row }">
            {{ row.positionQty ? `${formatNumber(row.positionQty)} 股` : '—' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="marketValue"
          label="持仓市值"
          width="120"
          sortable="custom"
        >
          <template #default="{ row }">
            {{ marketValue(row) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)">{{
              statusLabel(row.status)
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="290" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button
                v-if="row.status === 'RUNNING'"
                text
                type="primary"
                :loading="refreshingId === row.strategyId"
                @click="refreshOne(row)"
              >
                刷新股价
              </el-button>
              <el-button text type="primary" @click="goEdit(row)"
                >编辑</el-button
              >
              <el-button text type="primary" @click="goDetail(row)"
                >详情</el-button
              >
              <el-button
                v-if="row.status === 'DRAFT'"
                text
                type="success"
                @click="activate(row)"
              >
                启用
              </el-button>
              <el-button
                v-if="row.status === 'RUNNING'"
                text
                type="warning"
                @click="pause(row)"
              >
                暂停
              </el-button>
              <el-button
                v-if="row.status === 'PAUSED'"
                text
                type="success"
                @click="resume(row)"
              >
                恢复
              </el-button>
              <el-button text type="danger" @click="remove(row)"
                >删除</el-button
              >
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDownBold, ArrowUpBold, Bell } from '@element-plus/icons-vue'

import {
  activateGridStrategy,
  deleteGridStrategy,
  getGridStrategyList,
  pauseGridStrategy,
  refreshAllPrices,
  refreshGridPrice,
  resumeGridStrategy
} from '@/api/grid-trading'
import { formatNumber, formatPrice, tierLabel } from '@/utils/grid-trading'

const router = useRouter()

const list = ref([])
const loading = ref(false)
const refreshing = ref(false)
const refreshingId = ref(null)
const sortState = ref(null)

onMounted(getList)

async function getList() {
  loading.value = true
  try {
    const { data } = await getGridStrategyList()
    list.value = data.strategyList || []
    sortState.value = null
  } finally {
    loading.value = false
  }
}

const sortedRows = computed(() => {
  const rows = [...list.value]
  const { prop, order } = sortState.value || {}
  if (prop === 'marketValue') {
    const dir = order === 'ascending' ? 1 : -1
    rows.sort((a, b) => (marketValueNumber(a) - marketValueNumber(b)) * dir)
  } else if (prop === 'pendingCount') {
    const dir = order === 'ascending' ? 1 : -1
    rows.sort((a, b) => ((a.pendingCount || 0) - (b.pendingCount || 0)) * dir)
  } else if (prop === 'imminent') {
    const dir = order === 'ascending' ? 1 : -1
    rows.sort((a, b) => (imminentRank(b) - imminentRank(a)) * dir)
  } else {
    // 缺省：待确认多 → 即将触发 → 市值大，依次优先
    rows.sort((a, b) => {
      const pendingDiff = (b.pendingCount || 0) - (a.pendingCount || 0)
      if (pendingDiff !== 0) return pendingDiff
      const imminentDiff = imminentRank(b) - imminentRank(a)
      if (imminentDiff !== 0) return imminentDiff
      return marketValueNumber(b) - marketValueNumber(a)
    })
  }
  return rows
})

const totalMarketValue = computed(() =>
  list.value.reduce((sum, row) => sum + marketValueNumber(row), 0)
)

const totalPending = computed(() =>
  list.value.reduce((sum, row) => sum + (row.pendingCount || 0), 0)
)

const totalImminent = computed(
  () => list.value.filter((row) => row.imminentAction).length
)

function handleSortChange({ prop, order }) {
  sortState.value = order ? { prop, order } : null
}

function imminentRank(row) {
  return row.imminentAction ? 1 : 0
}

function marketValueNumber(row) {
  if (!row.lastPrice || !row.positionQty) return 0
  return Number(row.lastPrice) * Number(row.positionQty)
}

function imminentTitle(row) {
  return `即将${row.imminentAction === 'SELL' ? '升破' : '跌破'} ${tierLabel(
    row.imminentLevel
  )} ${formatPrice(row.imminentPrice)}`
}

async function refreshAll() {
  refreshing.value = true
  try {
    const { data } = await refreshAllPrices()
    ElMessage.success(
      `已刷新 ${data.result.success} 条，失败 ${data.result.failed} 条`
    )
    await getList()
  } finally {
    refreshing.value = false
  }
}

async function refreshOne(row) {
  refreshingId.value = row.strategyId
  try {
    await refreshGridPrice(row.strategyId)
    await getList()
  } finally {
    refreshingId.value = null
  }
}

async function activate(row) {
  await activateGridStrategy(row.strategyId)
  ElMessage.success('已启用')
  await getList()
}

async function pause(row) {
  await pauseGridStrategy(row.strategyId)
  ElMessage.success('已暂停')
  await getList()
}

async function resume(row) {
  await resumeGridStrategy(row.strategyId)
  ElMessage.success('已恢复')
  await getList()
}

async function remove(row) {
  await ElMessageBox.confirm(
    `确定删除策略「${row.stockName}」吗？删除后不可恢复。`,
    '提示',
    {
      type: 'warning'
    }
  )
  await deleteGridStrategy(row.strategyId)
  ElMessage.success('删除成功')
  await getList()
}

function goDetail(row) {
  router.push(`/grid-trading/strategy/${row.strategyId}`)
}

function handleRowClick(row, column, event) {
  if (event?.target?.closest?.('button')) {
    return
  }
  goDetail(row)
}

function goEdit(row) {
  router.push(`/grid-trading/strategy/edit/${row.strategyId}`)
}

function marketValue(row) {
  if (!row.lastPrice || !row.positionQty) return '—'
  return formatNumber(Number(row.lastPrice) * Number(row.positionQty))
}

function statusLabel(status) {
  return (
    {
      DRAFT: '未启用',
      RUNNING: '运行中',
      PAUSED: '暂停',
      ENDED: '已结束'
    }[status] || status
  )
}

function statusType(status) {
  return (
    {
      DRAFT: 'info',
      RUNNING: 'success',
      PAUSED: 'warning',
      ENDED: 'info'
    }[status] || 'info'
  )
}
</script>

<style scoped lang="scss">
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;

  h2 {
    margin: 0;
  }

  p {
    margin: 6px 0 0;
    color: #5d748b;
  }
}

.stat-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 10px 18px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;

  .stat-label {
    color: #909399;
    font-size: 13px;
  }

  .stat-value {
    font-size: 18px;
    font-weight: 600;
    color: #303133;

    &.pending {
      color: #f56c6c;
    }

    &.imminent {
      color: #e6a23c;
    }
  }
}

.stock-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.market-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  flex-shrink: 0;

  &.market-a {
    background: #409eff;
  }

  &.market-h {
    background: #e6a23c;
  }
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.pending-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 12px;
  background: #f56c6c;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(245, 108, 108, 0.4);

  .pending-icon {
    font-size: 13px;
  }
}

.imminent-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  color: #fff;
  font-size: 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  cursor: default;

  &.imminent-up {
    background: #f56c6c;
  }

  &.imminent-down {
    background: #67c23a;
  }
}
</style>
