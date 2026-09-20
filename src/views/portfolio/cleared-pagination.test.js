import { describe, expect, it } from 'vitest'

import {
  applyClearedFilters,
  applyStockFilter,
  paginateCleared
} from './cleared-pagination'

const rows = [
  { stockCode: '1', reco: '大V推荐', stockType: '蓝筹', bigV: '老V' },
  { stockCode: '2', reco: '小V推荐', stockType: '成长', bigV: '' },
  { stockCode: '3', reco: '大V推荐,小V推荐', stockType: '题材', bigV: '新V' }
]

describe('applyClearedFilters', () => {
  it('returns all rows when no filters', () => {
    expect(applyClearedFilters(rows, {})).toHaveLength(3)
  })

  it('filters by reco part', () => {
    const out = applyClearedFilters(rows, { decision: ['reco:小V推荐'] })
    expect(out.map((r) => r.stockCode)).toEqual(['2', '3'])
  })

  it('filters by stockType', () => {
    const out = applyClearedFilters(rows, { decision: ['type:蓝筹'] })
    expect(out.map((r) => r.stockCode)).toEqual(['1'])
  })

  it('combines decision and bigV filters', () => {
    const out = applyClearedFilters(rows, {
      decision: ['reco:大V推荐'],
      bigV: ['新V']
    })
    expect(out.map((r) => r.stockCode)).toEqual(['3'])
  })
})

describe('paginateCleared', () => {
  it('slices by page', () => {
    expect(paginateCleared(rows, 1, 2).map((r) => r.stockCode)).toEqual([
      '1',
      '2'
    ])
    expect(paginateCleared(rows, 2, 2).map((r) => r.stockCode)).toEqual(['3'])
    expect(paginateCleared(rows, 3, 2)).toHaveLength(0)
  })
})

describe('applyStockFilter', () => {
  const stockRows = [
    { stockCode: '600745', market: 'A' },
    { stockCode: '00700', market: 'H' },
    { stockCode: '510300', market: 'A' }
  ]

  it('returns all rows when no stock selected', () => {
    expect(applyStockFilter(stockRows, null)).toHaveLength(3)
    expect(applyStockFilter(stockRows, {})).toHaveLength(3)
    expect(applyStockFilter(stockRows, { code: '' })).toHaveLength(3)
  })

  it('filters by stock code', () => {
    const out = applyStockFilter(stockRows, {
      market: 'A',
      code: '600745',
      name: '闻泰科技'
    })
    expect(out.map((r) => r.stockCode)).toEqual(['600745'])
  })

  it('matches code without market on row (backend list without market)', () => {
    const out = applyStockFilter(
      [{ stockCode: '600745' }, { stockCode: '00700' }],
      { market: 'A', code: '600745' }
    )
    expect(out.map((r) => r.stockCode)).toEqual(['600745'])
  })

  it('excludes same code in another market', () => {
    const out = applyStockFilter(stockRows, {
      market: 'H',
      code: '00700',
      name: '腾讯控股'
    })
    expect(out.map((r) => r.stockCode)).toEqual(['00700'])
  })
})
