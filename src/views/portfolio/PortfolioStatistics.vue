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
        <div class="chart-title">推荐来源</div>
        <div id="chart-reco" class="chart"></div>
      </div>
      <div class="chart-box">
        <div class="chart-title">因素</div>
        <div id="chart-factor" class="chart"></div>
      </div>
      <div class="chart-box">
        <div class="chart-title">走势</div>
        <div id="chart-trend" class="chart"></div>
      </div>
      <div class="chart-box">
        <div class="chart-title">知名度</div>
        <div id="chart-fame" class="chart"></div>
      </div>
      <div class="chart-box">
        <div class="chart-title">类型</div>
        <div id="chart-stockType" class="chart"></div>
      </div>
      <div class="chart-box">
        <div class="chart-title">股价位置</div>
        <div id="chart-position" class="chart"></div>
      </div>
      <div class="chart-box">
        <div class="chart-title">持股策略</div>
        <div id="chart-holdStrategy" class="chart"></div>
      </div>
    </div>

    <div class="chart-box cleared-box">
      <div class="chart-title">已清仓分析</div>
      <div class="stat-cards">
        <div class="stat-card">
          <span class="stat-label">清仓笔数</span>
          <span class="stat-value">{{ clearedSummary.count }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">总实现盈亏</span>
          <span
            class="stat-value"
            :class="clearedSummary.realizedTotal >= 0 ? 'up' : 'down'"
            >{{ formatMoney(clearedSummary.realizedTotal) }}</span
          >
        </div>
        <div class="stat-card">
          <span class="stat-label"
            >胜率(已填盈亏 {{ clearedSummary.decided }} 笔)</span
          >
          <span class="stat-value">{{
            formatPercent(clearedSummary.winRate)
          }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">平均持股天数</span>
          <span class="stat-value">{{
            clearedSummary.avgHoldDays == null
              ? '-'
              : clearedSummary.avgHoldDays.toFixed(1)
          }}</span>
        </div>
      </div>
      <div class="cleared-grid">
        <div>
          <div class="chart-subtitle">清仓原因分布</div>
          <div id="chart-clearedReason" class="chart"></div>
        </div>
        <div>
          <div class="chart-subtitle">推荐来源分布</div>
          <div id="chart-clearedReco" class="chart"></div>
        </div>
        <div>
          <div class="chart-subtitle">因素分布</div>
          <div id="chart-clearedFactor" class="chart"></div>
        </div>
        <div>
          <div class="chart-subtitle">走势分布</div>
          <div id="chart-clearedTrend" class="chart"></div>
        </div>
        <div>
          <div class="chart-subtitle">知名度分布</div>
          <div id="chart-clearedFame" class="chart"></div>
        </div>
        <div>
          <div class="chart-subtitle">类型分布</div>
          <div id="chart-clearedStockType" class="chart"></div>
        </div>
        <div>
          <div class="chart-subtitle">股价位置分布</div>
          <div id="chart-clearedPosition" class="chart"></div>
        </div>
        <div>
          <div class="chart-subtitle">实现盈亏（按清仓日期）</div>
          <div id="chart-clearedPl" class="chart"></div>
        </div>
      </div>

      <div class="dim-grid">
        <dimension-table title="按清仓原因" :rows="clearedSummary.byReason" />
        <dimension-table title="按类型" :rows="clearedSummary.byStockType" />
        <dimension-table title="按持股天数" :rows="clearedSummary.byHoldDays" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import {
  getPortfolioCleared,
  getPortfolioStats,
  getPortfolioSnapshots
} from '@/api/portfolio'
import { summarizeCleared } from './cleared-analysis'
import DimensionTable from './components/DimensionTable.vue'

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
  CanvasRenderer
])

const scope = ref('all')
const week = ref('')
const range = ref(null)
const metric = ref('value')
const weeks = ref([])
const stats = ref(null)
const clearedSummary = ref({
  count: 0,
  decided: 0,
  realizedTotal: 0,
  winRate: null,
  avgHoldDays: null
})
const allClearedRows = ref([])

const chartInstances = {}

function initCharts() {
  const ids = [
    'chart-line',
    'chart-industry',
    'chart-reco',
    'chart-factor',
    'chart-trend',
    'chart-fame',
    'chart-stockType',
    'chart-position',
    'chart-holdStrategy',
    'chart-clearedReason',
    'chart-clearedReco',
    'chart-clearedFactor',
    'chart-clearedTrend',
    'chart-clearedFame',
    'chart-clearedStockType',
    'chart-clearedPosition',
    'chart-clearedPl'
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
    const labels = s.trendLabels || []
    if (!labels.length) {
      line.clear()
      line.setOption({
        title: {
          text: '暂无数据',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#909399', fontSize: 14, fontWeight: 'normal' }
        }
      })
    } else {
      const many = labels.length > 15
      line.setOption(
        {
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter(params) {
              const rows = [params[0].axisValue]
              params.forEach((p) => {
                const v =
                  p.seriesType === 'bar'
                    ? `${p.value} 只`
                    : `${formatMoney(p.value)} 元`
                rows.push(`${p.marker}${p.seriesName}：${v}`)
              })
              return rows.join('<br/>')
            }
          },
          legend: { data: ['持仓市值(含现金)', '持股个数'], top: 0 },
          grid: { left: 80, right: 60, top: 50, bottom: many ? 64 : 40 },
          xAxis: {
            type: 'category',
            data: labels,
            axisLabel: {
              rotate: labels.length > 8 ? 40 : 0,
              hideOverlap: true
            }
          },
          yAxis: [
            {
              type: 'value',
              name: '市值(元)',
              min: (v) => Math.round(Math.min(v.min, mvBaseline()) * 0.9),
              max: (v) => Math.round(Math.max(v.max, mvBaseline()) * 1.05),
              axisLabel: { formatter: (v) => formatAxisNumber(v) }
            },
            {
              type: 'value',
              name: '只',
              min: (v) => Math.floor(v.min * 0.8),
              max: (v) => Math.ceil(v.max * 1.1),
              minInterval: 1,
              splitLine: { show: false }
            }
          ],
          dataZoom: many
            ? [{ type: 'inside' }, { type: 'slider', height: 18, bottom: 10 }]
            : [{ type: 'inside' }],
          series: [
            {
              name: '持股个数',
              type: 'bar',
              yAxisIndex: 1,
              z: 1,
              barMaxWidth: 28,
              itemStyle: { color: '#8ea9d6', opacity: 0.7 },
              data: s.trendCount
            },
            {
              name: '持仓市值(含现金)',
              type: 'line',
              z: 3,
              smooth: false,
              lineStyle: { color: '#e6a23c', width: 3 },
              itemStyle: { color: '#e6a23c' },
              data: s.trendMv,
              markLine: {
                silent: true,
                symbol: 'none',
                lineStyle: { color: '#f56c6c', type: 'dashed', width: 1.5 },
                label: {
                  position: 'insideEndTop',
                  formatter: `基准 ${formatAxisNumber(mvBaseline())}`
                },
                data: [{ yAxis: mvBaseline() }]
              }
            }
          ]
        },
        true
      )
    }
  }
  renderPie('chart-industry', s.industryPie, '行业')
  renderPie('chart-reco', s.recoPie, '推荐来源')
  renderPie('chart-factor', s.factorPie, '因素')
  renderPie('chart-trend', s.trendPie, '走势')
  renderPie('chart-fame', s.famePie, '知名度')
  renderPie('chart-stockType', s.stockTypePie, '类型')
  renderPie('chart-position', s.positionPie, '股价位置')
  renderPie('chart-holdStrategy', s.holdStrategyPie, '持股策略')
}

const MV_BASELINES = { all: 2894060, gt: 1123230, pa: 1770830 }

function mvBaseline() {
  return MV_BASELINES[scope.value] ?? MV_BASELINES.all
}

function formatAxisNumber(v) {
  if (Math.abs(v) >= 100000000) return trimAxisNumber(v / 100000000) + '亿'
  if (Math.abs(v) >= 10000) return trimAxisNumber(v / 10000) + '万'
  return v
}

function trimAxisNumber(n) {
  return Number(n.toFixed(1)).toString()
}

function renderCleared() {
  const s = clearedSummary.value
  renderPie('chart-clearedReason', s.reasonPie, '清仓原因', 'count')
  renderPie('chart-clearedReco', s.recoPie, '推荐来源', 'count')
  renderPie('chart-clearedFactor', s.factorPie, '因素', 'count')
  renderPie('chart-clearedTrend', s.trendPie, '走势', 'count')
  renderPie('chart-clearedFame', s.famePie, '知名度', 'count')
  renderPie('chart-clearedStockType', s.stockTypePie, '类型', 'count')
  renderPie('chart-clearedPosition', s.positionPie, '股价位置', 'count')

  const bar = chartInstances['chart-clearedPl']
  if (bar) {
    bar.setOption(
      {
        tooltip: { trigger: 'axis' },
        grid: { left: 70, right: 30, top: 30, bottom: 40 },
        xAxis: { type: 'category', data: s.plByDate.map((d) => d.date) },
        yAxis: { type: 'value', scale: true },
        series: [
          {
            name: '实现盈亏',
            type: 'bar',
            barMaxWidth: 40,
            data: s.plByDate.map((d) => ({
              value: d.pl,
              itemStyle: { color: d.pl >= 0 ? '#f56c6c' : '#67c23a' }
            }))
          }
        ]
      },
      true
    )
  }
}

function formatMoney(v) {
  return v == null
    ? '-'
    : Number(v).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

function formatPercent(v) {
  return v == null ? '-' : (v * 100).toFixed(1) + '%'
}

async function loadCleared() {
  try {
    const res = await getPortfolioCleared()
    allClearedRows.value = res.data.cleared || []
    reloadCleared()
  } catch {
    // interceptor 已提示
  }
}

function reloadCleared() {
  clearedSummary.value = summarizeCleared(
    allClearedRows.value,
    range.value || null
  )
  renderCleared()
}

function renderPie(id, data, name, countKey) {
  const chart = chartInstances[id]
  if (!chart) return
  const key = countKey || (metric.value === 'value' ? 'value' : 'count')
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
    // interceptor 已提示
  }
  reloadCleared()
}

function resize() {
  Object.values(chartInstances).forEach((c) => c && c.resize())
}

onMounted(async () => {
  initCharts()
  await loadWeeks()
  await Promise.all([reload(), loadCleared()])
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
.cleared-box .cleared-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 14px;
}
.cleared-grid .chart {
  height: 280px;
}
.dim-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 14px;
  margin-top: 14px;
}
.chart-subtitle {
  color: #606266;
  margin-bottom: 4px;
}
.stat-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 12px;
}
.stat-card {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px 18px;
  min-width: 150px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-label {
  color: #909399;
  font-size: 12px;
}
.stat-value {
  font-size: 20px;
  font-weight: 700;
}
.up {
  color: #f56c6c;
}
.down {
  color: #67c23a;
}
</style>
