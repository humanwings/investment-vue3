<template>
  <section class="dash-panel asset-panel">
    <div class="section-title">资产概况</div>

    <div class="kpi-grid">
      <div
        v-for="card in assets"
        :key="card.key"
        class="kpi-card"
        :class="{ 'is-broker': card.broker }"
      >
        <span class="kpi-label">{{ card.label }}</span>
        <div v-if="card.broker" class="broker-values">
          <span v-for="v in card.values" :key="v.tag" class="broker-item">
            <em>{{ v.tag }}</em>
            <strong>{{ v.value }}</strong>
          </span>
        </div>
        <template v-else>
          <strong class="kpi-value">{{ card.value }}</strong>
          <small class="kpi-helper">{{ card.helper }}</small>
        </template>
      </div>
    </div>

    <div class="trend-block">
      <div class="trend-head">
        <span class="trend-label">总资产 · 近 12 个快照点</span>
      </div>
      <div v-if="trend.length" ref="chartEl" class="trend-chart"></div>
      <div v-else class="dash-empty">暂无资产趋势数据</div>
    </div>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

const props = defineProps({
  assets: { type: Array, default: () => [] },
  trend: { type: Array, default: () => [] }
})

const chartEl = ref(null)
const chart = shallowRef(null)

function ensureChart() {
  if (chart.value) return
  if (chartEl.value) {
    chart.value = echarts.init(chartEl.value)
  }
}

function render() {
  if (!chart.value) return
  const rows = props.trend || []
  chart.value.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const p = params && params[0]
        if (!p) return ''
        return p.axisValue + ' · ' + Number(p.value).toLocaleString('zh-CN')
      }
    },
    grid: { left: 44, right: 16, top: 16, bottom: 24 },
    xAxis: {
      type: 'category',
      data: rows.map((r) => r.date),
      boundaryGap: false,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: { show: false },
      splitLine: { show: false }
    },
    series: [
      {
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: rows.map((r) => r.asset),
        lineStyle: { width: 3, color: '#d99a4d' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(217,154,77,0.28)' },
              { offset: 1, color: 'rgba(217,154,77,0)' }
            ]
          }
        }
      }
    ]
  })
}

function resize() {
  if (chart.value) chart.value.resize()
}

watch(
  () => props.trend,
  () => {
    if (props.trend && props.trend.length) {
      ensureChart()
      render()
    }
  },
  { immediate: true, flush: 'post' }
)

onMounted(() => {
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  if (chart.value) {
    chart.value.dispose()
    chart.value = null
  }
})
</script>

<style scoped lang="scss">
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.kpi-card {
  display: grid;
  gap: 8px;
  padding: 18px;
  border-radius: 16px;
  border: 1px solid var(--dash-border);
  background: var(--dash-surface);
  min-width: 0;
}

.kpi-label {
  color: var(--dash-muted);
  font-size: 13px;
}

.kpi-value {
  font-size: 28px;
  line-height: 1.1;
  color: var(--dash-text);
}

.kpi-helper {
  color: var(--dash-muted);
  font-size: 12px;
}

.broker-values {
  display: grid;
  gap: 10px;
  padding-top: 4px;
}

.broker-item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.broker-item em {
  color: var(--dash-muted);
  font-style: normal;
  font-size: 13px;
}

.broker-item strong {
  color: var(--dash-text);
  font-size: 16px;
}

.trend-block {
  padding-top: 6px;
}

.trend-head {
  margin-bottom: 8px;
}

.trend-label {
  color: var(--dash-muted);
  font-size: 13px;
  font-weight: 600;
}

.trend-chart {
  width: 100%;
  height: 130px;
}

@media (max-width: 1100px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
