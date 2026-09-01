<template>
  <section class="page-shell">
    <div class="page-card">
      <div class="page-head">
        <div>
          <h2>统计分析</h2>
          <p>网格策略成交记录的统计图表；数据随下方筛选联动。</p>
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

      <div class="stat-bar">
        <div class="stat-item">
          <span class="stat-label">成交笔数</span>
          <span class="stat-value">{{ stats.count }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">买入 / 卖出</span>
          <span class="stat-value"
            >{{ stats.buyCount }} / {{ stats.sellCount }} 笔</span
          >
        </div>
        <div class="stat-item">
          <span class="stat-label">买入量</span>
          <span class="stat-value">{{ formatUnits(stats.buyQty) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">卖出量</span>
          <span class="stat-value">{{ formatUnits(stats.sellQty) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">买入金额</span>
          <span class="stat-value">{{ formatNumber(stats.buyAmount) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">卖出金额</span>
          <span class="stat-value">{{ formatNumber(stats.sellAmount) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">净卖出额</span>
          <span class="stat-value" :class="netClass">{{
            formatSigned(stats.netAmount)
          }}</span>
        </div>
      </div>

      <div class="chart-box trend-box">
        <div class="chart-title">
          成交笔数与金额每日推移（买 / 卖 / 合计，交易日）
        </div>
        <div id="chart-trend" class="chart trend-chart"></div>
      </div>

      <div class="chart-grid">
        <div class="chart-box">
          <div class="chart-title">月度买卖金额</div>
          <div id="chart-month" class="chart month-chart"></div>
        </div>
        <div class="chart-box">
          <div class="chart-title">标的方向分布</div>
          <div id="chart-stock" class="chart"></div>
        </div>
        <div class="chart-box">
          <div class="chart-title">买卖占比</div>
          <div id="chart-direction" class="chart"></div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getGridTradeRecords } from '@/api/grid-trading'
import { formatNumber } from '@/utils/grid-trading'

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer
])

const loading = ref(false)
const records = ref([])
const filterStock = ref('')
const filterAction = ref('')
const filterRange = ref(null)

const chartInstances = {}

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

const stats = computed(() => {
  let count = 0
  let buyCount = 0
  let sellCount = 0
  let buyQty = 0
  let sellQty = 0
  let buyAmount = 0
  let sellAmount = 0
  filteredRecords.value.forEach((r) => {
    count += 1
    const qty = Number(r.qty) || 0
    const amount = qty * (Number(r.tradePrice) || 0)
    if (r.action === 'SELL') {
      sellCount += 1
      sellQty += qty
      sellAmount += amount
    } else {
      buyCount += 1
      buyQty += qty
      buyAmount += amount
    }
  })
  return {
    count,
    buyCount,
    sellCount,
    buyQty,
    sellQty,
    buyAmount: round2(buyAmount),
    sellAmount: round2(sellAmount),
    netAmount: round2(sellAmount - buyAmount)
  }
})

const netClass = computed(() => (stats.value.netAmount >= 0 ? 'up' : 'down'))

function aggregateBy(list, keyFn) {
  const map = new Map()
  list.forEach((r) => {
    const key = keyFn(r)
    if (!map.has(key)) {
      map.set(key, {
        key,
        buyCount: 0,
        sellCount: 0,
        buyAmount: 0,
        sellAmount: 0
      })
    }
    const entry = map.get(key)
    const qty = Number(r.qty) || 0
    const amount = qty * (Number(r.tradePrice) || 0)
    if (r.action === 'SELL') {
      entry.sellCount += 1
      entry.sellAmount += amount
    } else {
      entry.buyCount += 1
      entry.buyAmount += amount
    }
  })
  return [...map.values()]
    .map((e) => ({
      ...e,
      buyAmount: round2(e.buyAmount),
      sellAmount: round2(e.sellAmount)
    }))
    .sort((a, b) => String(a.key).localeCompare(String(b.key)))
}

const monthRows = computed(() =>
  aggregateBy(filteredRecords.value, (r) => (r.tradedAt || '').slice(0, 7))
)

const stockRows = computed(() =>
  aggregateBy(filteredRecords.value, (r) => r.stockCode || '?')
)

const trendRows = computed(() => buildDailyTrend(filteredRecords.value))

// 交易日推移：以自然周的工作日（周一~周五）作为交易日，
// 覆盖数据区间内的每一天；无成交的交易日以 0 补齐，周末（非交易日）不显示。
function buildDailyTrend(list) {
  if (!list.length) return []
  const byDate = new Map()
  const rawDates = []
  list.forEach((r) => {
    const date = (r.tradedAt || '').slice(0, 10)
    if (!date) return
    rawDates.push(date)
    if (!byDate.has(date)) {
      byDate.set(date, {
        key: date,
        buyCount: 0,
        sellCount: 0,
        buyAmount: 0,
        sellAmount: 0
      })
    }
    const entry = byDate.get(date)
    const qty = Number(r.qty) || 0
    const amount = qty * (Number(r.tradePrice) || 0)
    if (r.action === 'SELL') {
      entry.sellCount += 1
      entry.sellAmount += amount
    } else {
      entry.buyCount += 1
      entry.buyAmount += amount
    }
  })
  rawDates.sort()
  const cursor = new Date(rawDates[0] + 'T00:00:00')
  const end = new Date(rawDates[rawDates.length - 1] + 'T00:00:00')
  const rows = []
  while (cursor <= end) {
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) {
      const key = toLocalISODate(cursor)
      const entry = byDate.get(key) || {
        key,
        buyCount: 0,
        sellCount: 0,
        buyAmount: 0,
        sellAmount: 0
      }
      rows.push({
        ...entry,
        buyAmount: round2(entry.buyAmount),
        sellAmount: round2(entry.sellAmount),
        totalCount: entry.buyCount + entry.sellCount,
        totalAmount: round2(entry.buyAmount + entry.sellAmount)
      })
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return rows
}

function toLocalISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return y + '-' + m + '-' + d
}

function initCharts() {
  ;['chart-trend', 'chart-month', 'chart-stock', 'chart-direction'].forEach(
    (id) => {
      const el = document.getElementById(id)
      if (el && !chartInstances[id]) {
        chartInstances[id] = echarts.init(el)
      }
    }
  )
}

function renderCharts() {
  renderTrend(trendRows.value)
  renderMonth(monthRows.value)
  renderStock(stockRows.value)
  renderDirection(stats.value)
}

function renderTrend(rows) {
  const chart = chartInstances['chart-trend']
  if (!chart) return
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0 },
    grid: { left: 70, right: 80, top: 40, bottom: 80 },
    xAxis: {
      type: 'category',
      data: rows.map((r) => r.key),
      axisLabel: {
        formatter: (value) => (value ? value.slice(5) : ''),
        showMaxLabel: true
      }
    },
    yAxis: [
      { type: 'value', name: '金额', position: 'left' },
      { type: 'value', name: '笔数', position: 'right' }
    ],
    series: [
      { name: '合计金额', type: 'bar', data: rows.map((r) => r.totalAmount) },
      { name: '买入金额', type: 'bar', data: rows.map((r) => r.buyAmount) },
      { name: '卖出金额', type: 'bar', data: rows.map((r) => r.sellAmount) },
      {
        name: '合计笔数',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: rows.map((r) => r.totalCount)
      },
      {
        name: '买入笔数',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: rows.map((r) => r.buyCount)
      },
      {
        name: '卖出笔数',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: rows.map((r) => r.sellCount)
      }
    ]
  })
}

function renderMonth(rows) {
  const chart = chartInstances['chart-month']
  if (!chart) return
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0 },
    grid: { left: 70, right: 40, top: 40, bottom: 50 },
    xAxis: { type: 'category', data: rows.map((r) => r.key) },
    yAxis: { type: 'value' },
    series: [
      { name: '买入金额', type: 'bar', data: rows.map((r) => r.buyAmount) },
      { name: '卖出金额', type: 'bar', data: rows.map((r) => r.sellAmount) }
    ]
  })
}

function renderStock(rows) {
  const chart = chartInstances['chart-stock']
  if (!chart) return
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0 },
    grid: { left: 70, right: 40, top: 40, bottom: 50 },
    xAxis: {
      type: 'category',
      data: rows.map((r) => r.key),
      axisLabel: { interval: 0 }
    },
    yAxis: { type: 'value' },
    series: [
      { name: '买入金额', type: 'bar', data: rows.map((r) => r.buyAmount) },
      { name: '卖出金额', type: 'bar', data: rows.map((r) => r.sellAmount) }
    ]
  })
}

function renderDirection(st) {
  const chart = chartInstances['chart-direction']
  if (!chart) return
  chart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [
      {
        name: '金额',
        type: 'pie',
        radius: ['40%', '68%'],
        data: [
          { name: '买入', value: st.buyAmount },
          { name: '卖出', value: st.sellAmount }
        ],
        label: { formatter: '{b}: {c}' }
      }
    ]
  })
}

function formatUnits(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—'
  }
  return `${Number(value).toLocaleString('zh-CN')} 股`
}

function formatSigned(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—'
  }
  const sign = value > 0 ? '+' : ''
  return `${sign}${Number(value).toLocaleString('zh-CN')}`
}

function round2(value) {
  return Math.round(Number(value) * 100) / 100
}

function resize() {
  Object.values(chartInstances).forEach((c) => c && c.resize())
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

watch(filteredRecords, () => renderCharts())

onMounted(async () => {
  initCharts()
  await load()
  renderCharts()
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  Object.values(chartInstances).forEach((c) => c && c.dispose())
})
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
    font-size: 16px;
    font-weight: 600;
    color: #303133;

    &.up {
      color: #f56c6c;
    }

    &.down {
      color: #67c23a;
    }
  }
}

.chart-box {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px;
}

.chart-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.chart {
  width: 100%;
  height: 280px;
}

.trend-box {
  margin-bottom: 14px;
}

.trend-chart {
  height: 340px;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 14px;
}

.month-chart {
  height: 280px;
}
</style>
