<template>
  <div>
    <div class="controls">
      <el-radio-group v-model="scope" @change="reload">
        <el-radio-button label="all">全部</el-radio-button>
        <el-radio-button label="gt">国泰海通</el-radio-button>
        <el-radio-button label="pa">平安证券</el-radio-button>
      </el-radio-group>

      <span class="ctrl-label">饼图周：</span>
      <el-select
        v-model="week"
        placeholder="选择周"
        clearable
        style="width: 150px"
        @change="reload"
      >
        <el-option v-for="s in weeks" :key="s" :label="s" :value="s" />
      </el-select>

      <span class="ctrl-label">区间：</span>
      <el-date-picker
        v-model="range"
        type="daterange"
        value-format="YYYY-MM-DD"
        range-separator="~"
        start-placeholder="开始"
        end-placeholder="结束"
        @change="reload"
      />

      <span class="ctrl-label">统计口径：</span>
      <el-radio-group v-model="metric" @change="renderStats">
        <el-radio-button label="value">按金额</el-radio-button>
        <el-radio-button label="count">按数量</el-radio-button>
      </el-radio-group>
    </div>

    <div class="chart-box">
      <div class="chart-title">持仓市值推移</div>
      <div id="chart-line" class="chart line-chart"></div>
    </div>

    <div class="pie-grid">
      <div class="chart-box">
        <div class="chart-title">一级行业</div>
        <div id="chart-industry" class="chart"></div>
      </div>
      <div class="chart-box">
        <div class="chart-title">来源</div>
        <div id="chart-source" class="chart"></div>
      </div>
      <div class="chart-box">
        <div class="chart-title">买入原因</div>
        <div id="chart-buyReason" class="chart"></div>
      </div>
      <div class="chart-box">
        <div class="chart-title">持股策略</div>
        <div id="chart-holdStrategy" class="chart"></div>
      </div>
      <div v-if="showBigV" class="chart-box">
        <div class="chart-title">大V（大V推荐细分）</div>
        <div id="chart-bigV" class="chart"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getPortfolioStats, getPortfolioSnapshots } from '@/api/portfolio'

echarts.use([
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer
])

const scope = ref('all')
const week = ref('')
const range = ref(null)
const metric = ref('value')
const weeks = ref([])
const stats = ref(null)
const showBigV = ref(false)

const chartInstances = {}

function initCharts() {
  const ids = [
    'chart-line',
    'chart-industry',
    'chart-source',
    'chart-buyReason',
    'chart-holdStrategy',
    'chart-bigV'
  ]
  ids.forEach((id) => {
    const el = document.getElementById(id)
    if (el && !chartInstances[id]) {
      chartInstances[id] = echarts.init(el)
    }
  })
}

function renderStats() {
  if (!stats.value) return
  const s = stats.value
  const line = chartInstances['chart-line']
  if (line) {
    line.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 70, right: 30, top: 30, bottom: 40 },
      xAxis: { type: 'category', data: s.trendLabels },
      yAxis: { type: 'value' },
      series: [
        {
          name: '持仓市值',
          type: 'line',
          smooth: true,
          data: s.trendMv,
          areaStyle: {}
        },
        { name: '浮动盈亏', type: 'line', smooth: true, data: s.trendPl }
      ]
    })
  }
  renderPie('chart-industry', s.industryPie, '行业')
  renderPie('chart-source', s.sourcePie, '来源')
  renderPie('chart-buyReason', s.buyReasonPie, '买入原因')
  renderPie('chart-holdStrategy', s.holdStrategyPie, '持股策略')

  const empty = !s.bigVPie || s.bigVPie.length === 0
  showBigV.value = !empty
  renderPie('chart-bigV', s.bigVPie, '大V')
}

function renderPie(id, data, name) {
  const chart = chartInstances[id]
  if (!chart) return
  const key = metric.value === 'value' ? 'value' : 'count'
  const pieData = (data || []).map((d) => ({ name: d.name, value: d[key] }))
  chart.setOption({
    tooltip: { trigger: 'item' },
    legend: { type: 'scroll', bottom: 0 },
    series: [
      {
        name,
        type: 'pie',
        radius: ['40%', '68%'],
        data: pieData,
        label: { formatter: '{b}: {c}' }
      }
    ]
  })
}

async function loadWeeks() {
  try {
    const res = await getPortfolioSnapshots()
    weeks.value = (res.data.snapshots || []).map((s) => s.statsDate)
    if (!week.value && weeks.value.length) week.value = weeks.value[0]
  } catch {
    // interceptor
  }
}

async function reload() {
  const from = range.value && range.value[0] ? range.value[0] : undefined
  const to = range.value && range.value[1] ? range.value[1] : undefined
  try {
    const res = await getPortfolioStats({
      scope: scope.value,
      week: week.value,
      from,
      to
    })
    stats.value = res.data.stats
    renderStats()
  } catch {
    // interceptor
  }
}

function resize() {
  Object.values(chartInstances).forEach((c) => c && c.resize())
}

onMounted(async () => {
  initCharts()
  await loadWeeks()
  await reload()
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  Object.values(chartInstances).forEach((c) => c && c.dispose())
})
</script>

<style scoped>
.controls {
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.ctrl-label {
  margin-left: 14px;
  color: #606266;
}
.chart-box {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 14px;
}
.chart-title {
  font-weight: 600;
  margin-bottom: 6px;
}
.chart {
  width: 100%;
}
.line-chart {
  height: 320px;
}
.pie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 14px;
}
.pie-grid .chart {
  height: 300px;
}
</style>
