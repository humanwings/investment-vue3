import { afterEach, describe, expect, it } from 'vitest'

import {
  activateGridStrategy,
  confirmHint,
  createGridStrategy,
  deleteGridStrategy,
  endGridStrategy,
  getGridStrategy,
  getGridStrategyList,
  ignoreHint,
  pauseGridStrategy,
  recordManualTrade,
  refreshAllPrices,
  refreshGridPrice,
  resumeGridStrategy,
  searchStocks,
  setManualPrice,
  updateGridStrategy
} from './grid-trading'
import { createHttpMock, ok } from '@/test/mocks/http'

describe('grid-trading api', () => {
  const mock = createHttpMock()

  afterEach(() => {
    mock.reset()
  })

  it('requests the strategy list', async () => {
    mock.onGet('/grid-trading/strategy').reply(ok({ strategyList: [] }))

    const result = await getGridStrategyList()

    expect(result.data.strategyList).toEqual([])
    expect(mock.history.get[0].url).toBe('/grid-trading/strategy')
  })

  it('requests the strategy detail by id', async () => {
    mock
      .onGet('/grid-trading/strategy/7')
      .reply(ok({ strategy: { strategyId: 7 } }))

    const result = await getGridStrategy(7)

    expect(result.data.strategy.strategyId).toBe(7)
    expect(mock.history.get[0].url).toBe('/grid-trading/strategy/7')
  })

  it('sends create and update mutations', async () => {
    mock
      .onPost('/grid-trading/strategy')
      .reply(ok({ strategy: { strategyId: 1 } }))
    mock
      .onPut('/grid-trading/strategy/1')
      .reply(ok({ strategy: { strategyId: 1 } }))

    await createGridStrategy({ stockCode: '09988' })
    await updateGridStrategy(1, { remark: '备注' })

    expect(mock.history.post[0].url).toBe('/grid-trading/strategy')
    expect(JSON.parse(mock.history.post[0].data)).toEqual({
      stockCode: '09988'
    })
    expect(mock.history.put[0].url).toBe('/grid-trading/strategy/1')
    expect(JSON.parse(mock.history.put[0].data)).toEqual({ remark: '备注' })
  })

  it('deletes and toggles strategy lifecycle', async () => {
    mock.onDelete('/grid-trading/strategy/1').reply(ok({}))
    mock.onPost('/grid-trading/strategy/1/activate').reply(ok({ strategy: {} }))
    mock.onPost('/grid-trading/strategy/1/pause').reply(ok({ strategy: {} }))
    mock.onPost('/grid-trading/strategy/1/resume').reply(ok({ strategy: {} }))
    mock.onPost('/grid-trading/strategy/1/end').reply(ok({ strategy: {} }))

    await deleteGridStrategy(1)
    await activateGridStrategy(1)
    await pauseGridStrategy(1)
    await resumeGridStrategy(1)
    await endGridStrategy(1)

    expect(mock.history.delete[0].url).toBe('/grid-trading/strategy/1')
    expect(mock.history.post.map((item) => item.url)).toEqual([
      '/grid-trading/strategy/1/activate',
      '/grid-trading/strategy/1/pause',
      '/grid-trading/strategy/1/resume',
      '/grid-trading/strategy/1/end'
    ])
  })

  it('refreshes prices for one or all strategies', async () => {
    mock
      .onPost('/grid-trading/strategy/1/refresh-price')
      .reply(ok({ strategy: { strategyId: 1 } }))
    mock
      .onPost('/grid-trading/refresh-all-prices')
      .reply(ok({ result: { success: 2, failed: 0 } }))

    await refreshGridPrice(1)
    const result = await refreshAllPrices()

    expect(mock.history.post[0].url).toBe(
      '/grid-trading/strategy/1/refresh-price'
    )
    expect(mock.history.post[1].url).toBe('/grid-trading/refresh-all-prices')
    expect(result.data.result.success).toBe(2)
  })

  it('searches stocks by keyword', async () => {
    mock
      .onGet('/grid-trading/stock-search')
      .reply(ok({ results: [{ stockCode: '601318' }] }))

    const result = await searchStocks('zgpa')

    expect(result.data.results[0].stockCode).toBe('601318')
    expect(mock.history.get[0].url).toBe('/grid-trading/stock-search')
    expect(mock.history.get[0].params).toEqual({ keyword: 'zgpa' })
  })

  it('sets manual price for a strategy', async () => {
    mock
      .onPost('/grid-trading/strategy/1/manual-price')
      .reply(ok({ strategy: { strategyId: 1 } }))

    await setManualPrice(1, 16.48)

    expect(mock.history.post[0].url).toBe(
      '/grid-trading/strategy/1/manual-price'
    )
    expect(JSON.parse(mock.history.post[0].data)).toEqual({ price: 16.48 })
  })

  it('records a manual trade for a strategy', async () => {
    mock
      .onPost('/grid-trading/strategy/12/manual-trade')
      .reply(ok({ strategy: { strategyId: 12 } }))

    await recordManualTrade(12, {
      action: 'SELL',
      tradePrice: 29.64,
      qty: 500
    })

    expect(mock.history.post[0].url).toBe(
      '/grid-trading/strategy/12/manual-trade'
    )
    expect(JSON.parse(mock.history.post[0].data)).toEqual({
      action: 'SELL',
      tradePrice: 29.64,
      qty: 500
    })
  })

  it('confirms and ignores hints', async () => {
    mock
      .onPost('/grid-trading/hint/99/confirm')
      .reply(ok({ strategy: { strategyId: 1 } }))
    mock
      .onPost('/grid-trading/hint/99/ignore')
      .reply(ok({ strategy: { strategyId: 1 } }))

    await confirmHint(99, { tradePrice: 114.8, qty: 200 })
    await ignoreHint(99)

    expect(mock.history.post[0].url).toBe('/grid-trading/hint/99/confirm')
    expect(JSON.parse(mock.history.post[0].data)).toEqual({
      tradePrice: 114.8,
      qty: 200
    })
    expect(mock.history.post[1].url).toBe('/grid-trading/hint/99/ignore')
  })
})
