<template>
  <section class="page-shell">
    <div class="page-card">
      <div class="page-head">
        <div>
          <h2>成交记录</h2>
          <p>网格策略的模拟成交一览；数据随下方筛选联动。</p>
        </div>
      </div>

      <div class="controls">
        <span class="ctrl-label">标的：</span>
        <el-select
          v-model="filterStock"
          placeholder="全部标的"
          clearable
          filterable
          style="width: 220px"
        >
          <el-option
            v-for="s in stockOptions"
            :key="s.key"
            :label="s.label"
            :value="s.key"
          />
        </el-select>

        <span class="ctrl-label">方向：</span>
        <el-radio-group v-model="filterAction">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button label="BUY">买入</el-radio-button>
          <el-radio-button label="SELL">卖出</el-radio-button>
        </el-radio-group>

        <span class="ctrl-label">区间：</span>
        <el-date-picker
          v-model="filterRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="~"
          start-placeholder="开始"
          end-placeholder="结束"
          clearable
        />
      </div>

      <el-table
        v-loading="loading"
        :data="pagedRecords"
        stripe
        :max-height="'calc(100vh - 360px)'"
      >
        <el-table-column prop="tradedAt" label="时间" width="160" />
        <el-table-column label="标的" min-width="170">
          <template #default="{ row }">
            <div class="stock-cell">
              <b>{{ row.stockName }}</b>
              <el-tag size="small" type="info">{{ row.stockCode }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="方向" width="80">
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="row.action === 'SELL' ? 'danger' : 'success'"
            >
              {{ row.action === 'SELL' ? '卖出' : '买入' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="档位" width="90">
          <template #default="{ row }">{{ tierLabel(row.tierLevel) }}</template>
        </el-table-column>
        <el-table-column label="档位价" width="90">
          <template #default="{ row }">{{
            formatPrice(row.tierPrice)
          }}</template>
        </el-table-column>
        <el-table-column label="成交价" width="90">
          <template #default="{ row }">{{
            formatPrice(row.tradePrice)
          }}</template>
        </el-table-column>
        <el-table-column label="数量" width="100">
          <template #default="{ row }">{{ formatUnits(row.qty) }}</template>
        </el-table-column>
        <el-table-column label="金额" width="110">
          <template #default="{ row }">{{
            formatNumber(rowAmount(row))
          }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" />
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="filteredRecords.length"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { getGridTradeRecords } from '@/api/grid-trading'
import { formatNumber, formatPrice, tierLabel } from '@/utils/grid-trading'

const loading = ref(false)
const records = ref([])
const filterStock = ref('')
const filterAction = ref('')
const filterRange = ref(null)
const page = ref(1)
const pageSize = ref(20)

const stockOptions = computed(() => {
  const map = new Map()
  records.value.forEach((r) => {
    const key = r.stockCode
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: `${r.stockName}（${r.stockCode}）`
      })
    }
  })
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label))
})

const filteredRecords = computed(() => {
  return records.value.filter((r) => {
    if (filterStock.value && r.stockCode !== filterStock.value) return false
    if (filterAction.value && r.action !== filterAction.value) return false
    if (filterRange.value && filterRange.value.length === 2) {
      const date = (r.tradedAt || '').slice(0, 10)
      if (date < filterRange.value[0] || date > filterRange.value[1]) {
        return false
      }
    }
    return true
  })
})

const pagedRecords = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRecords.value.slice(start, start + pageSize.value)
})

watch([filterStock, filterAction, filterRange], () => {
  page.value = 1
})

function rowAmount(row) {
  return round2((Number(row.qty) || 0) * (Number(row.tradePrice) || 0))
}

function formatUnits(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—'
  }
  return `${Number(value).toLocaleString('zh-CN')} 股`
}

function round2(value) {
  return Math.round(Number(value) * 100) / 100
}

async function load() {
  loading.value = true
  try {
    const { data } = await getGridTradeRecords()
    records.value = data.records || []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped lang="scss">
.page-head {
  margin-bottom: 16px;

  h2 {
    margin: 0;
  }

  p {
    margin: 6px 0 0;
    color: #5d748b;
  }
}

.controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.ctrl-label {
  color: #606266;
}

.stock-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
