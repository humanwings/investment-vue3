import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import { createHttpMock, ok } from '@/test/mocks/http'
import { elementPlusStubs } from '@/test/stubs/element-plus'
import DataSources from './datasources.vue'

const settingsPayload = {
  settings: {
    priceProvider: 'EASTMONEY',
    companyProvider: 'EASTMONEY',
    lixingerCredentialConfigured: false,
    lixingerCredentialMasked: null
  },
  providers: [
    {
      code: 'EASTMONEY',
      displayName: 'Eastmoney',
      supportsPrice: true,
      supportsCompanyData: true,
      requiresCredential: false
    },
    {
      code: 'LIXINGER',
      displayName: 'Lixinger',
      supportsPrice: true,
      supportsCompanyData: true,
      requiresCredential: true
    }
  ]
}

function mountPage() {
  return mount(DataSources, {
    global: {
      stubs: elementPlusStubs,
      directives: {
        loading: {}
      }
    }
  })
}

describe('data sources page', () => {
  const mock = createHttpMock()

  afterEach(() => {
    mock.reset()
  })

  it('loads independent provider selectors and saves blank credentials as retain', async () => {
    mock.onGet('/system-settings/data-sources').reply(ok(settingsPayload))
    mock.onPut('/system-settings/data-sources').reply(
      ok({
        settings: {
          priceProvider: 'LIXINGER',
          companyProvider: 'EASTMONEY',
          lixingerCredentialConfigured: true,
          lixingerCredentialMasked: '********oken'
        }
      })
    )

    const wrapper = mountPage()
    await flushPromises()

    const priceSelector = wrapper.get('[data-test="price-provider"]')
    const companySelector = wrapper.get('[data-test="company-provider"]')
    expect(priceSelector.element.value).toBe('EASTMONEY')
    expect(companySelector.element.value).toBe('EASTMONEY')

    await priceSelector.setValue('LIXINGER')
    expect(companySelector.element.value).toBe('EASTMONEY')
    expect(wrapper.get('[data-test="lixinger-credential"]').exists()).toBe(true)
    expect(
      wrapper.get('[data-test="clear-lixinger-credential"]').exists()
    ).toBe(true)

    await wrapper.get('[data-test="save-settings"]').trigger('click')
    await flushPromises()

    expect(mock.history.put).toHaveLength(1)
    expect(JSON.parse(mock.history.put[0].data)).toEqual({
      priceProvider: 'LIXINGER',
      companyProvider: 'EASTMONEY',
      lixingerCredential: '',
      clearLixingerCredential: false
    })
    expect(mock.history.patch).toHaveLength(0)
    expect(mock.history.post.map((request) => request.url)).not.toContain(
      '/valuation/update-price-all'
    )
    expect(mock.history.post.map((request) => request.url)).not.toContain(
      '/valuation/rebuild-all'
    )
    expect(wrapper.text()).toContain('********oken')
  })

  it('renders separate connection test results for price and company providers', async () => {
    mock.onGet('/system-settings/data-sources').reply(ok(settingsPayload))
    mock.onPost('/system-settings/data-sources/test').reply((config) => {
      const request = JSON.parse(config.data)
      return ok({
        result: {
          providerCode: request.providerCode,
          sample: { companyId: 1, stockCode: '600519', name: '雍ｵ蟾櫁桁蜿ｰ' },
          operations: [
            {
              operation: request.capability,
              status: 'SUCCESS',
              elapsedMs: 123,
              summary: '2026-06-22 / 1241.41'
            }
          ]
        }
      })()
    })

    const wrapper = mountPage()
    await flushPromises()

    await wrapper.get('[data-test="test-price"]').trigger('click')
    await wrapper.get('[data-test="test-company"]').trigger('click')
    await flushPromises()

    expect(mock.history.post).toHaveLength(2)
    expect(JSON.parse(mock.history.post[0].data)).toMatchObject({
      capability: 'PRICE',
      providerCode: 'EASTMONEY'
    })
    expect(JSON.parse(mock.history.post[1].data)).toMatchObject({
      capability: 'COMPANY_DATA',
      providerCode: 'EASTMONEY'
    })
    expect(wrapper.get('[data-test="price-test-result"]').text()).toContain(
      '600519'
    )
    expect(wrapper.get('[data-test="price-test-result"]').text()).toContain(
      'SUCCESS'
    )
    expect(wrapper.get('[data-test="price-test-result"]').text()).toContain(
      '2026-06-22 / 1241.41'
    )
    expect(wrapper.get('[data-test="price-test-result"]').text()).toContain(
      '123ms'
    )
    expect(wrapper.get('[data-test="company-test-result"]').text()).toContain(
      '雍ｵ蟾櫁桁蜿ｰ'
    )
  })

  it('assesses data sources without stock code and renders samples, counts, and unavailable values', async () => {
    mock.onGet('/system-settings/data-sources').reply(ok(settingsPayload))
    mock.onPost('/system-settings/data-sources/assess').reply(
      ok({
        assessment: {
          samples: [
            { companyId: 1, stockCode: '600519', name: '雍ｵ蟾櫁桁蜿ｰ' },
            { companyId: 2, stockCode: '000001', name: 'Sample A' },
            { companyId: 3, stockCode: '000002', name: 'Sample B' }
          ],
          providerAvailability: {
            EASTMONEY: 'AVAILABLE',
            LIXINGER: 'UNAVAILABLE'
          },
          comparableCount: 3,
          matchCount: 2,
          minorDifferenceCount: 1,
          majorDifferenceCount: 0,
          missingCount: 1,
          notComparableCount: 0,
          providerUnavailableCount: 1,
          matchRate: 0.6667,
          companies: [
            {
              companyId: 1,
              stockCode: '600519',
              name: '雍ｵ蟾櫁桁蜿ｰ',
              fields: [
                {
                  field: 'price',
                  alignmentKey: null,
                  eastmoneyValue: 1241.41,
                  lixingerValue: null,
                  conclusion: 'PROVIDER_UNAVAILABLE',
                  message: 'Credential missing'
                },
                {
                  field: 'revenue',
                  alignmentKey: '2024',
                  eastmoneyValue: 100,
                  lixingerValue: 100,
                  conclusion: 'MATCH'
                }
              ]
            }
          ]
        }
      })
    )

    const wrapper = mountPage()
    await flushPromises()

    await wrapper.get('[data-test="run-assessment"]').trigger('click')
    await flushPromises()

    expect(mock.history.post).toHaveLength(1)
    expect(mock.history.post[0].url).toBe(
      '/system-settings/data-sources/assess'
    )
    expect(mock.history.post[0].data).toBeUndefined()
    expect(wrapper.findAll('[data-test="sample-company"]')).toHaveLength(3)
    expect(wrapper.get('[data-test="assessment-summary"]').text()).toContain(
      '66.67%'
    )
    expect(wrapper.get('[data-test="assessment-summary"]').text()).toContain(
      'Comparable 3'
    )
    expect(wrapper.get('[data-test="assessment-summary"]').text()).toContain(
      'Matches 2'
    )
    expect(wrapper.text()).toContain('PROVIDER_UNAVAILABLE')
    expect(wrapper.text()).toContain('1241.41')
    expect(wrapper.text()).toContain('Credential missing')
  })

  it('renders an empty assessment without throwing', async () => {
    mock.onGet('/system-settings/data-sources').reply(ok(settingsPayload))
    mock.onPost('/system-settings/data-sources/assess').reply(
      ok({
        assessment: {
          samples: [],
          providerAvailability: {},
          comparableCount: 0,
          matchCount: 0,
          minorDifferenceCount: 0,
          majorDifferenceCount: 0,
          missingCount: 0,
          notComparableCount: 0,
          providerUnavailableCount: 0,
          matchRate: 0,
          companies: [],
          errorCode: 'NO_SAMPLE_COMPANY',
          message: 'No companies available to sample'
        }
      })
    )

    const wrapper = mountPage()
    await flushPromises()

    await wrapper.get('[data-test="run-assessment"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-test="assessment-summary"]').text()).toContain(
      'No companies available to sample'
    )
    expect(wrapper.get('[data-test="assessment-summary"]').text()).toContain(
      'No sampled companies'
    )
  })
})
