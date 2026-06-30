import { afterEach, describe, expect, it } from 'vitest'

import {
  assessDataSources,
  getDataSourceSettings,
  testDataSource,
  updateDataSourceSettings
} from './data-sources'
import { createHttpMock, ok } from '@/test/mocks/http'

describe('data sources api', () => {
  const mock = createHttpMock()

  afterEach(() => {
    mock.reset()
  })

  it('requests data source settings endpoints with exact payloads', async () => {
    mock.onGet('/system-settings/data-sources').reply(ok({ settings: {} }))
    mock.onPut('/system-settings/data-sources').reply(ok({ settings: {} }))
    mock.onPost('/system-settings/data-sources/test').reply(ok({ result: {} }))
    mock
      .onPost('/system-settings/data-sources/assess')
      .reply(ok({ assessment: {} }))

    await getDataSourceSettings()
    await updateDataSourceSettings({ priceProvider: 'EASTMONEY' })
    await testDataSource({
      capability: 'PRICE',
      providerCode: 'EASTMONEY'
    })
    await assessDataSources()

    expect(mock.history.get[0].url).toBe('/system-settings/data-sources')
    expect(mock.history.put[0].url).toBe('/system-settings/data-sources')
    expect(JSON.parse(mock.history.put[0].data)).toEqual({
      priceProvider: 'EASTMONEY'
    })
    expect(mock.history.post[0].url).toBe('/system-settings/data-sources/test')
    expect(JSON.parse(mock.history.post[0].data)).toEqual({
      capability: 'PRICE',
      providerCode: 'EASTMONEY'
    })
    expect(mock.history.post[1].url).toBe(
      '/system-settings/data-sources/assess'
    )
    expect(mock.history.post[1].data).toBeUndefined()
    expect(mock.history.post[1].timeout).toBe(30000)
  })
})
