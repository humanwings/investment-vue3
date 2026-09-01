import { computed, ref } from 'vue'

import { getWaitList } from '@/api/analyte'
import { getGridStrategyList, getGridTradeRecords } from '@/api/grid-trading'
import { getPortfolioLatest, getPortfolioSnapshots } from '@/api/portfolio'
import { getStrategyList } from '@/api/strategy'
import { getCompanyList } from '@/api/valuation-query'
import { fmtInt, fmtMoney } from '../utils'

export function useDashboard() {
  const loading = ref(false)
  const summary = ref(null)
  const snapshots = ref([])
  const gridStrategies = ref([])
  const records = ref([])
  const companies = ref([])
  const waitList = ref([])
  const waitTotal = ref(0)
  const strategyTotal = ref(0)

  const runningStrategies = computed(() =>
    gridStrategies.value.filter((s) => s.status === 'RUNNING')
  )

  const imminentCount = computed(
    () => runningStrategies.value.filter((s) => s.imminentAction).length
  )

  const pendingCount = computed(() =>
    runningStrategies.value.reduce(
      (sum, s) => sum + (Number(s.pendingCount) || 0),
      0
    )
  )

  const focusCount = computed(
    () => companies.value.filter((c) => c.conclusion === '重点关注').length
  )

  // 资产区：4 张 KPI 卡
  const assetCards = computed(() => {
    const s = summary.value || {}
    const mv = Number(s.totalMv) || 0
    const cash = Number(s.totalCash) || 0
    return [
      {
        key: 'totalAsset',
        label: '总资产',
        value: fmtMoney(mv + cash),
        helper: '总市值 + 现金'
      },
      {
        key: 'mv',
        label: '总市值',
        value: fmtMoney(mv),
        helper: '国泰 + 平安 合计'
      },
      {
        key: 'count',
        label: '持仓数',
        value: fmtInt(s.positionCount),
        helper: '最新统计口径'
      },
      {
        key: 'broker',
        label: '各券商市值',
        broker: true,
        values: [
          { tag: '国泰', value: fmtMoney(s.gtTotalMv) },
          { tag: '平安', value: fmtMoney(s.paTotalMv) }
        ]
      }
    ]
  })

  // 资产趋势：最近 12 个快照点，总资产（市值 + 现金）
  const assetTrend = computed(() =>
    snapshots.value
      .slice()
      .sort((a, b) => String(a.statsDate).localeCompare(String(b.statsDate)))
      .slice(-12)
      .map((s) => ({
        date: s.statsDate,
        asset: (Number(s.totalMv) || 0) + (Number(s.totalCash) || 0)
      }))
  )

  // 告警层：4 张卡
  const alerts = computed(() => [
    {
      key: 'imminent',
      label: '网格即将触发',
      value: fmtInt(imminentCount.value),
      type: imminentCount.value > 0 ? 'danger' : 'flat',
      helper: '接近下一档交易',
      to: '/grid-trading/strategy'
    },
    {
      key: 'pending',
      label: '网格待处理',
      value: fmtInt(pendingCount.value),
      type: pendingCount.value > 0 ? 'warn' : 'flat',
      helper: '已触发提示待确认',
      to: '/grid-trading/strategy'
    },
    {
      key: 'wait',
      label: '待分析标的',
      value: fmtInt(waitTotal.value),
      type: waitTotal.value > 0 ? 'warn' : 'flat',
      helper: '捡漏分析 · 待办',
      to: '/barginhunting/analyte/waitlist'
    },
    {
      key: 'focus',
      label: '估值机会',
      value: fmtInt(focusCount.value),
      type: focusCount.value > 0 ? 'up' : 'flat',
      helper: '重点关注标的',
      to: '/companyvaluation/valuation/company'
    }
  ])

  // 快捷入口：带数字角标
  const quickEntry = computed(() => [
    {
      key: 'portfolio',
      label: '持仓管理',
      to: '/portfolio/latest',
      badge: fmtInt((summary.value && summary.value.positionCount) || 0)
    },
    {
      key: 'records',
      label: '成交记录',
      to: '/grid-trading/records',
      badge: fmtInt(records.value.length)
    },
    {
      key: 'stats',
      label: '统计分析',
      to: '/grid-trading/statistics',
      badge: ''
    },
    {
      key: 'wait',
      label: '待分析',
      to: '/barginhunting/analyte/waitlist',
      badge: fmtInt(waitTotal.value)
    },
    {
      key: 'strategy',
      label: '研究策略',
      to: '/barginhunting/strategy/strategylist',
      badge: fmtInt(strategyTotal.value)
    },
    {
      key: 'datasource',
      label: '数据接口',
      to: '/system-settings/data-sources',
      badge: ''
    }
  ])

  async function refresh() {
    loading.value = true
    try {
      const [rPortfolio, rSnap, rGrid, rTrades, rCompany, rWait, rStrategy] =
        await Promise.allSettled([
          getPortfolioLatest(),
          getPortfolioSnapshots(),
          getGridStrategyList(),
          getGridTradeRecords(),
          getCompanyList(),
          getWaitList(),
          getStrategyList()
        ])

      if (rPortfolio.status === 'fulfilled') {
        summary.value =
          (rPortfolio.value.data && rPortfolio.value.data.summary) || null
      }
      if (rSnap.status === 'fulfilled') {
        snapshots.value = (rSnap.value.data && rSnap.value.data.snapshots) || []
      }
      if (rGrid.status === 'fulfilled') {
        gridStrategies.value =
          (rGrid.value.data && rGrid.value.data.strategyList) || []
      }
      if (rTrades.status === 'fulfilled') {
        records.value = (rTrades.value.data && rTrades.value.data.records) || []
      }
      if (rCompany.status === 'fulfilled') {
        const d = rCompany.value.data || {}
        companies.value = d.list || []
      }
      if (rWait.status === 'fulfilled') {
        const d = rWait.value.data || {}
        waitTotal.value = d.sum || 0
        waitList.value = d.list || []
      }
      if (rStrategy.status === 'fulfilled') {
        strategyTotal.value = (
          (rStrategy.value.data && rStrategy.value.data.strategyList) ||
          []
        ).length
      }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    refresh,
    assetCards,
    assetTrend,
    alerts,
    quickEntry,
    waitList
  }
}
