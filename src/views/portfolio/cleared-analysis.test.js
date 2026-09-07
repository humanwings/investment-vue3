import { describe, expect, it } from 'vitest'

import { summarizeCleared } from './cleared-analysis'

describe('summarizeCleared', () => {
  const rows = [
    {
      stockCode: '000725.SZ',
      clearedDate: '2026-09-05',
      refTotalPl: 426.6,
      sourceType: '自选',
      clearReason: '信心不足',
      realizedPl: null,
      holdDays: 14
    },
    {
      stockCode: '600745.SH',
      clearedDate: '2026-08-29',
      refTotalPl: -157.88,
      sourceType: '大V推荐',
      clearReason: '止盈',
      realizedPl: 6740.0,
      holdDays: 24
    },
    {
      stockCode: '01024.HK',
      clearedDate: '2026-08-22',
      refTotalPl: 3016.0,
      sourceType: '大V推荐',
      clearReason: '止损',
      realizedPl: -9672.0,
      holdDays: 34
    },
    {
      stockCode: '601101.SH',
      clearedDate: '2026-08-22',
      refTotalPl: 3528.7,
      sourceType: '自选',
      clearReason: '止盈',
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

  it('averages non-null hold days', () => {
    const s = summarizeCleared(rows, null)
    expect(s.avgHoldDays).toBe((14 + 24 + 34 + 10) / 4)
  })

  it('groups reason and source pie by row count', () => {
    const s = summarizeCleared(rows, null)
    expect(s.reasonPie).toEqual([
      { name: '止盈', count: 2 },
      { name: '信心不足', count: 1 },
      { name: '止损', count: 1 }
    ])
    expect(s.sourcePie).toEqual([
      { name: '自选', count: 2 },
      { name: '大V推荐', count: 2 }
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
    expect(s.sourcePie).toEqual([])
    expect(s.plByDate).toEqual([])
  })

  it('breaks down win rate and avg pl by dimension, skipping unfilled P&L', () => {
    const s = summarizeCleared(rows, null)
    // 止盈: 6740 + 1881 both wins -> 100%; 信心不足: only row has no realizedPl -> null
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
    expect(s.bySource).toEqual([
      {
        name: '自选',
        count: 2,
        decided: 1,
        wins: 1,
        winRate: 1,
        avgPl: 1881,
        totalPl: 1881
      },
      {
        name: '大V推荐',
        count: 2,
        decided: 2,
        wins: 1,
        winRate: 0.5,
        avgPl: -1466,
        totalPl: -2932
      }
    ])
  })

  it('groups by hold days buckets sorted by bucket order', () => {
    const s = summarizeCleared(rows, null)
    const names = s.byHoldDays.map((b) => b.name)
    expect(names).toEqual(['≤10天', '11~30天', '31~90天', '90天以上'])
    const short = s.byHoldDays.find((b) => b.name === '≤10天')
    expect(short.count).toBe(1)
    expect(short.avgPl).toBe(1881)
    const mid = s.byHoldDays.find((b) => b.name === '11~30天')
    expect(mid.count).toBe(3)
    expect(mid.winRate).toBe(1)
  })

  it('groups by strategy when present', () => {
    const s = summarizeCleared(rows, null)
    expect(s.byStrategy).toEqual([])
  })

  it('breakdowns sort by totalPl desc', () => {
    const s = summarizeCleared(rows, null)
    const totals = s.byReason.map((r) => r.totalPl)
    expect(totals).toEqual([...totals].sort((a, b) => b - a))
  })
})
