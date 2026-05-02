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
import {
  clearDcfV1ManualAssumptions,
  getDcfValuationList,
  refreshAllDcfV2,
  refreshDcfV2,
  updateDcfV1ManualAssumptions,
  updateIndustryDcfV1ManualAssumptions
} from './dcf-valuation'
import {
  clearProfitGrowthRate,
  getProfitValuationList,
  updateIndustryProfitGrowthRate,
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
      .onPatch('/valuation/profit-discount/1/growth-rate')
      .reply(ok({ item: { companyId: 1 } }))
    mock
      .onDelete('/valuation/profit-discount/1/growth-rate')
      .reply(ok({ item: { companyId: 1 } }))
    mock
      .onPost('/valuation/profit-discount/industry-growth-rate')
      .reply(ok({ list: [], sum: 0 }))
    mock
      .onPatch('/valuation/dcf/v1/1/manual-assumptions')
      .reply(ok({ item: { companyId: 1 } }))
    mock
      .onDelete('/valuation/dcf/v1/1/manual-assumptions')
      .reply(ok({ item: { companyId: 1 } }))
    mock
      .onPost('/valuation/dcf/v1/industry-manual-assumptions')
      .reply(ok({ list: [], sum: 0 }))
    mock.onPost('/valuation/dcf/v2/1/refresh').reply(
      ok({
        item: {
          companyId: 1,
          modelVersion: 'DCF_V2_STANDARD_FCFF'
        }
      })
    )
    mock.onPost('/valuation/dcf/v2/refresh-all').reply(ok({ list: [], sum: 0 }))

    await getProfitValuationList({ industryName: '白酒' })
    await getDcfValuationList({ industry: '白酒' })
    await updateProfitGrowthRate(1, {
      growthRateManual: 12
    })
    await clearProfitGrowthRate(1)
    await updateIndustryProfitGrowthRate({
      industryName: '白酒',
      growthRateManual: 11
    })
    await updateDcfV1ManualAssumptions(1, {
      revenueGrowthRateManual: 12,
      discountRateManual: 10,
      terminalGrowthRateManual: 3
    })
    await clearDcfV1ManualAssumptions(1, {
      changeReason: 'reset'
    })
    await updateIndustryDcfV1ManualAssumptions({
      industryName: '白酒',
      revenueGrowthRateManual: 11,
      discountRateManual: 9,
      terminalGrowthRateManual: 2.5
    })
    await refreshDcfV2(1)
    await refreshAllDcfV2()

    expect(mock.history.get[0].url).toBe('/valuation/profit-discount')
    expect(mock.history.get[0].params).toEqual({ industryName: '白酒' })
    expect(mock.history.get[1].url).toBe('/valuation/dcf')
    expect(mock.history.get[1].params).toEqual({ industry: '白酒' })
    expect(mock.history.patch[0].url).toBe(
      '/valuation/profit-discount/1/growth-rate'
    )
    expect(JSON.parse(mock.history.patch[0].data)).toEqual({
      growthRateManual: 12
    })
    expect(mock.history.delete[0].url).toBe(
      '/valuation/profit-discount/1/growth-rate'
    )
    expect(mock.history.post[0].url).toBe(
      '/valuation/profit-discount/industry-growth-rate'
    )
    expect(JSON.parse(mock.history.post[0].data)).toEqual({
      industryName: '白酒',
      growthRateManual: 11
    })
    expect(mock.history.patch[1].url).toBe(
      '/valuation/dcf/v1/1/manual-assumptions'
    )
    expect(JSON.parse(mock.history.patch[1].data)).toEqual({
      revenueGrowthRateManual: 12,
      discountRateManual: 10,
      terminalGrowthRateManual: 3
    })
    expect(mock.history.delete[1].url).toBe(
      '/valuation/dcf/v1/1/manual-assumptions'
    )
    expect(JSON.parse(mock.history.delete[1].data)).toEqual({
      changeReason: 'reset'
    })
    expect(mock.history.post[1].url).toBe(
      '/valuation/dcf/v1/industry-manual-assumptions'
    )
    expect(JSON.parse(mock.history.post[1].data)).toEqual({
      industryName: '白酒',
      revenueGrowthRateManual: 11,
      discountRateManual: 9,
      terminalGrowthRateManual: 2.5
    })
    expect(mock.history.post[2].url).toBe('/valuation/dcf/v2/1/refresh')
    expect(mock.history.post[3].url).toBe('/valuation/dcf/v2/refresh-all')
  })
})
