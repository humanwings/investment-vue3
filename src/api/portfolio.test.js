import { afterEach, describe, expect, it } from 'vitest'

import {
  previewPortfolio,
  confirmImport,
  getPortfolioLatest,
  getPortfolioSnapshots,
  getPortfolioSnapshot,
  updatePortfolioArchive,
  getPortfolioCleared,
  updatePortfolioCleared,
  getPortfolioStats,
  saveAllPortfolio
} from './portfolio'
import { createHttpMock, ok } from '@/test/mocks/http'

describe('portfolio api', () => {
  const mock = createHttpMock()

  afterEach(() => {
    mock.reset()
  })

  it('uploads file to preview endpoint as FormData', async () => {
    mock.onPost('/portfolio/import/preview').reply(ok({}))
    const file = new File(['x'], '持仓组合汇总表_sample.xlsx')
    await previewPortfolio(file)
    const data = mock.history.post[0].data
    expect(data instanceof FormData).toBe(true)
    expect(data.get('file')).toBe(file)
    expect(mock.history.post[0].timeout).toBe(30000)
  })

  it('uploads file and statsDate to confirm endpoint', async () => {
    mock.onPost('/portfolio/import/confirm').reply(ok({}))
    await confirmImport('file-bytes', '2026-08-08')
    const data = mock.history.post[0].data
    expect(data instanceof FormData).toBe(true)
    expect(data.get('statsDate')).toBe('2026-08-08')
  })

  it('hits read and archive endpoints', async () => {
    mock.onGet('/portfolio/latest').reply(ok({ summary: {}, positions: [] }))
    mock.onGet('/portfolio/snapshots').reply(ok({ snapshots: [] }))
    mock.onGet('/portfolio/snapshot/2026-08-08').reply(ok({ positions: [] }))
    mock.onPut('/portfolio/archive/00700.HK').reply(ok())
    mock.onGet('/portfolio/cleared').reply(ok({ cleared: [] }))
    mock.onPut('/portfolio/cleared/1').reply(ok())
    mock.onGet('/portfolio/stats').reply(ok({ stats: {} }))

    await getPortfolioLatest()
    await getPortfolioSnapshots()
    await getPortfolioSnapshot('2026-08-08')
    await updatePortfolioArchive('00700.HK', { sourceType: '自选' })
    await getPortfolioCleared()
    await updatePortfolioCleared(1, { clearReason: '止损' })
    await getPortfolioStats({ scope: 'all', week: '2026-08-08' })

    const putUrls = mock.history.put.map((r) => r.url)
    expect(putUrls).toContain('/portfolio/archive/00700.HK')
    expect(putUrls).toContain('/portfolio/cleared/1')
    expect(JSON.parse(mock.history.put[1].data)).toEqual({
      clearReason: '止损'
    })
    expect(mock.history.get[1].url).toBe('/portfolio/snapshots')
    expect(mock.history.get[4].url).toBe('/portfolio/stats')
    expect(mock.history.get[4].params).toEqual({
      scope: 'all',
      week: '2026-08-08'
    })
  })

  it('posts all items to save-all endpoint', async () => {
    mock.onPost('/portfolio/archive/save-all').reply(ok({}))
    const items = [{ stockCode: '00700.HK', positionId: 1, earningsNote: 'x' }]
    await saveAllPortfolio(items)
    expect(mock.history.post[0].url).toBe('/portfolio/archive/save-all')
    expect(JSON.parse(mock.history.post[0].data)).toEqual(items)
  })
})
