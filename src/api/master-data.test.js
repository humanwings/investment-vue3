import { afterEach, describe, expect, it } from 'vitest'

import {
  getMasterReference,
  getMasterSwIndustries,
  searchMasterData
} from './master-data'
import { createHttpMock, ok } from '@/test/mocks/http'

describe('master-data api', () => {
  const mock = createHttpMock()

  afterEach(() => {
    mock.reset()
  })

  it('searches master data by keyword', async () => {
    mock
      .onGet('/master-data/search')
      .reply(
        ok({ results: [{ market: 'A', code: '601318', name: '中国平安' }] })
      )

    const result = await searchMasterData('zgpa')

    expect(result.data.results[0].code).toBe('601318')
    expect(mock.history.get[0].url).toBe('/master-data/search')
    expect(mock.history.get[0].params).toEqual({ keyword: 'zgpa' })
  })

  it('requests the stock reference list', async () => {
    mock.onGet('/master-data/reference').reply(ok({ list: [] }))

    const result = await getMasterReference({ type: 'stock', market: 'A' })

    expect(result.data.list).toEqual([])
    expect(mock.history.get[0].params).toEqual({ type: 'stock', market: 'A' })
  })

  it('requests sw industries', async () => {
    mock.onGet('/master-data/sw-industries').reply(ok({ list: [] }))

    const result = await getMasterSwIndustries()

    expect(mock.history.get[0].url).toBe('/master-data/sw-industries')
    expect(result.data.list).toEqual([])
  })
})
