import { afterEach, describe, expect, it } from 'vitest'

import {
  addCompany,
  deleteCompany,
  getCompany,
  getCompanyList,
  reValuateAll,
  updateGrowthRate,
  updatePrice,
  updatePriceAll,
  updateReport
} from './company'
import { getDcfValuationList } from './dcf-valuation'
import {
  getProfitValuationList,
  updateProfitGrowthRate
} from './profit-valuation'
import { getCompanyOverview } from './valuation-query'
import { createHttpMock, ok } from '@/test/mocks/http'

describe('company api', () => {
  const mock = createHttpMock()

  afterEach(() => {
    mock.reset()
  })

  it('requests the company list with query params', async () => {
    mock.onGet('/company/all').reply(ok({ sum: 1, list: [] }))

    const result = await getCompanyList({ keyword: '茅台' })

    expect(result.data.sum).toBe(1)
    expect(mock.history.get[0].params).toEqual({ keyword: '茅台' })
  })

  it('requests the company detail by id', async () => {
    mock.onGet('/company/12').reply(ok({ company: { companyId: 12 } }))

    const result = await getCompany(12)

    expect(result.data.company.companyId).toBe(12)
    expect(mock.history.get[0].url).toBe('/company/12')
  })

  it('requests the company overview from the valuation query module', async () => {
    mock.onGet('/company/12').reply(ok({ company: { companyId: 12 } }))

    const result = await getCompanyOverview(12)

    expect(result.data.company.companyId).toBe(12)
    expect(mock.history.get[0].url).toBe('/company/12')
  })

  it('sends company mutations to the expected endpoints', async () => {
    mock.onPost('/company/add').reply(ok({ companyInfo: { companyId: 1 } }))
    mock.onDelete('/company/1').reply(ok({}))
    mock.onPatch('/company/1').reply(ok({ companyInfo: { companyId: 1 } }))
    mock.onPost('/company/reValuateAll').reply(ok({ list: [], sum: 0 }))
    mock.onPost('/company/updatePriceAll').reply(ok({ list: [], sum: 0 }))
    mock
      .onPost('/company/updateReport')
      .reply(ok({ companyInfo: { companyId: 1 } }))
    mock
      .onPost('/company/updateGrowthRate')
      .reply(ok({ companyInfo: { companyId: 1 } }))

    await addCompany({ stockCode: '600519' })
    await deleteCompany(1)
    await updatePrice(1)
    await reValuateAll()
    await updatePriceAll()
    await updateReport({ companyId: 1 })
    await updateGrowthRate({ companyId: 1, growthRateAssumption: 0.15 })

    expect(mock.history.post[0].url).toBe('/company/add')
    expect(JSON.parse(mock.history.post[0].data)).toEqual({
      stockCode: '600519'
    })
    expect(mock.history.delete[0].url).toBe('/company/1')
    expect(mock.history.patch[0].url).toBe('/company/1')
    expect(mock.history.post[1].url).toBe('/company/reValuateAll')
    expect(mock.history.post[2].url).toBe('/company/updatePriceAll')
    expect(mock.history.post[3].url).toBe('/company/updateReport')
    expect(JSON.parse(mock.history.post[3].data)).toEqual({ companyId: 1 })
    expect(mock.history.post[4].url).toBe('/company/updateGrowthRate')
    expect(JSON.parse(mock.history.post[4].data)).toEqual({
      companyId: 1,
      growthRateAssumption: 0.15
    })
  })

  it('requests split valuation workbench endpoints', async () => {
    mock.onGet('/valuation/profit-discount').reply(ok({ list: [] }))
    mock.onGet('/valuation/dcf').reply(ok({ list: [] }))
    mock
      .onPost('/company/updateGrowthRate')
      .reply(ok({ companyInfo: { companyId: 1 } }))

    await getProfitValuationList({ industry: '白酒' })
    await getDcfValuationList({ industry: '白酒' })
    await updateProfitGrowthRate({
      companyId: 1,
      growthRateAssumption: 0.12
    })

    expect(mock.history.get[0].url).toBe('/valuation/profit-discount')
    expect(mock.history.get[0].params).toEqual({ industry: '白酒' })
    expect(mock.history.get[1].url).toBe('/valuation/dcf')
    expect(mock.history.get[1].params).toEqual({ industry: '白酒' })
    expect(mock.history.post[0].url).toBe('/company/updateGrowthRate')
  })
})
