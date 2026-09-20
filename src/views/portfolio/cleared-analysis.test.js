import { describe, expect, it } from 'vitest'

import { summarizeCleared } from './cleared-analysis'

describe('summarizeCleared', () => {
  const rows = [
    {
      stockCode: '000725.SZ',
      clearedDate: '2026-09-05',
      clearReason: '信心不足',
      reco: '',
      factor: '',
      trend: '',
      fame: '',
      stockType: '',
      pricePosition: '',
      realizedPl: null,
      holdDays: 14
    },
    {
      stockCode: '600745.SH',
      clearedDate: '2026-08-29',
      clearReason: '止盈',
      reco: '小V推荐',
      factor: '潜伏',
      trend: '',
      fame: '二线',
      stockType: '成长',
      pricePosition: '中位',
      realizedPl: 6740.0,
      holdDays: 24
    },
    {
      stockCode: '01024.HK',
      clearedDate: '2026-08-22',
      clearReason: '止损',
      reco: '',
      factor: '',
      trend: '',
      fame: '',
      stockType: '蓝筹',
      pricePosition: '低位',
      realizedPl: -9672.0,
      holdDays: 34
    },
    {
      stockCode: '601101.SH',
      clearedDate: '2026-08-22',
      clearReason: '止盈',
      reco: '大V推荐,小V推荐',
      factor: '',
      trend: '',
      fame: '',
      stockType: '蓝筹',
      pricePosition: '低位',
      realizedPl: 1881.0,
      holdDays: 10
    }
  ]

  it('counts rows and sums non-null realized P&L', () => {
    const s = summarizeCleared(rows, null)
    expect(s.count).toBe(4)
    expect(s.realizedTotal).toBeCloseTo(6740 - 9672 + 1881)
  })

  it('computes win rate over rows with realized P&L only', () => {
    const s = summarizeCleared(rows, null)
    expect(s.decided).toBe(3)
    expect(s.winRate).toBeCloseTo(2 / 3)
  })

  it('groups clear reason and six-dim pies by row count', () => {
    const s = summarizeCleared(rows, null)
    expect(s.reasonPie).toEqual([
      { name: '止盈', count: 2 },
      { name: '信心不足', count: 1 },
      { name: '止损', count: 1 }
    ])
    expect(s.recoPie).toEqual([
      { name: '小V推荐', count: 2 },
      { name: '大V推荐', count: 1 }
    ])
    expect(s.factorPie).toEqual([{ name: '潜伏', count: 1 }])
    expect(s.trendPie).toEqual([])
    expect(s.famePie).toEqual([{ name: '二线', count: 1 }])
    expect(s.stockTypePie).toEqual([
      { name: '蓝筹', count: 2 },
      { name: '成长', count: 1 }
    ])
    expect(s.positionPie).toEqual([
      { name: '低位', count: 2 },
      { name: '中位', count: 1 }
    ])
  })

  it('aggregates realized P&L by cleared date ascending, skipping unfilled rows', () => {
    const s = summarizeCleared(rows, null)
    expect(s.plByDate).toEqual([
      { date: '2026-08-22', pl: -9672 + 1881 },
      { date: '2026-08-29', pl: 6740 }
    ])
  })

  it('filters rows by date range', () => {
    const s = summarizeCleared(rows, ['2026-08-22', '2026-08-29'])
    expect(s.count).toBe(3)
    expect(s.realizedTotal).toBeCloseTo(6740 - 9672 + 1881)
  })

  it('handles empty rows', () => {
    const s = summarizeCleared([], null)
    expect(s.count).toBe(0)
    expect(s.realizedTotal).toBe(0)
    expect(s.winRate).toBeNull()
    expect(s.avgHoldDays).toBeNull()
    expect(s.reasonPie).toEqual([])
    expect(s.recoPie).toEqual([])
    expect(s.stockTypePie).toEqual([])
    expect(s.plByDate).toEqual([])
  })

  it('breaks down win rate and avg pl by dimension, skipping unfilled P&L', () => {
    const s = summarizeCleared(rows, null)
    expect(s.byReason).toEqual([
      {
        name: '止盈',
        count: 2,
        decided: 2,
        wins: 2,
        winRate: 1,
        avgPl: (6740 + 1881) / 2,
        totalPl: 8621
      },
      {
        name: '信心不足',
        count: 1,
        decided: 0,
        wins: 0,
        winRate: null,
        avgPl: null,
        totalPl: 0
      },
      {
        name: '止损',
        count: 1,
        decided: 1,
        wins: 0,
        winRate: 0,
        avgPl: -9672,
        totalPl: -9672
      }
    ])
    // 按类型（原"按股票种类"）胜率表
    expect(s.byStockType).toEqual([
      {
        name: '成长',
        count: 1,
        decided: 1,
        wins: 1,
        winRate: 1,
        avgPl: 6740,
        totalPl: 6740
      },
      {
        name: '蓝筹',
        count: 2,
        decided: 2,
        wins: 1,
        winRate: 0.5,
        avgPl: (1881 - 9672) / 2,
        totalPl: -7791
      }
    ])
    expect(s.byBuyReason).toBeUndefined()
  })

  it('groups by hold days buckets sorted by bucket order', () => {
    const s = summarizeCleared(rows, null)
    expect(s.byHoldDays.map((b) => b.name)).toEqual([
      '≤10天',
      '11~30天',
      '31~90天'
    ])
    const short = s.byHoldDays.find((b) => b.name === '≤10天')
    expect(short.count).toBe(1)
    expect(short.avgPl).toBe(1881)
    const mid = s.byHoldDays.find((b) => b.name === '11~30天')
    expect(mid.count).toBe(2)
    expect(mid.decided).toBe(1)
    expect(mid.wins).toBe(1)
    expect(mid.winRate).toBe(1)
    expect(mid.avgPl).toBe(6740)
    const long = s.byHoldDays.find((b) => b.name === '31~90天')
    expect(long.count).toBe(1)
    expect(s.byHoldDays.find((b) => b.name === '90天以上')).toBeUndefined()
  })

  it('breakdowns sort by totalPl desc', () => {
    const s = summarizeCleared(rows, null)
    const totals = s.byReason.map((r) => r.totalPl)
    expect(totals).toEqual([...totals].sort((a, b) => b - a))
  })
})
