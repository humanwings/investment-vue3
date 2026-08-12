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

      <el-table
        v-loading="loading"
        :data="list"
        row-key="strategyId"
        @row-click="handleRowClick"
      >
        <el-table-column label="标的" min-width="160">
          <template #default="{ row }">
            <div class="stock-cell">
              <b>{{ row.stockName }}</b>
              <el-tag size="small" type="info">{{ row.stockCode }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="市场" width="80">
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="row.market === 'H' ? 'warning' : 'primary'"
            >
              {{ row.market === 'H' ? '港股' : 'A股' }}
            </el-tag>
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
        <el-table-column label="持仓市值" width="120">
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
        <el-table-column label="待确认" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.pendingCount > 0" size="small" type="danger">
              {{ row.pendingCount }} 条
            </el-tag>
            <span v-else>0</span>
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
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

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

onMounted(getList)

async function getList() {
  loading.value = true
  try {
    const { data } = await getGridStrategyList()
    list.value = data.strategyList || []
  } finally {
    loading.value = false
  }
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

.stock-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}
</style>
