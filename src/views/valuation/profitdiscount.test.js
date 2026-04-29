import { flushPromises, shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { profitValuationPayload } from '@/test/fixtures/company'
import { createHttpMock, ok } from '@/test/mocks/http'
import { elementPlusStubs } from '@/test/stubs/element-plus'
import ProfitDiscount from './profitdiscount.vue'

const { push, notifySuccess } = vi.hoisted(() => ({
  push: vi.fn(),
  notifySuccess: vi.fn()
}))

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')

  return {
    ...actual,
    useRouter: () => ({ push })
  }
})

vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')

  return {
    ...actual,
    ElNotification: {
      success: notifySuccess
    }
  }
})

describe('profit discount workbench', () => {
  const mock = createHttpMock()

  beforeEach(() => {
    push.mockReset()
    notifySuccess.mockReset()
  })

  afterEach(() => {
    mock.reset()
  })

  it('renders profit valuation rows returned by the backend', async () => {
    mock.onGet('/valuation/profit-discount').reply(ok(profitValuationPayload))

    const wrapper = shallowMount(ProfitDiscount, {
      global: {
        stubs: elementPlusStubs,
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('利润贴现一览')
    expect(wrapper.vm.rows).toHaveLength(1)
    expect(wrapper.vm.rows[0].name).toBe('贵州茅台')
    expect(wrapper.vm.filteredRows).toHaveLength(1)
    expect(wrapper.vm.draftGrowthRates[1]).toBe(15)
  })

  it('filters rows by industry', async () => {
    mock.onGet('/valuation/profit-discount').reply(ok(profitValuationPayload))

    const wrapper = shallowMount(ProfitDiscount, {
      global: {
        stubs: elementPlusStubs,
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()

    wrapper.vm.industryFilter = '白酒'
    expect(wrapper.vm.filteredRows).toHaveLength(1)

    wrapper.vm.industryFilter = '银行'
    expect(wrapper.vm.filteredRows).toHaveLength(0)
  })

  it('updates manual growth rate and replaces the row', async () => {
    mock.onGet('/valuation/profit-discount').reply(ok(profitValuationPayload))
    mock.onPatch('/valuation/profit-discount/1/growth-rate').reply(
      ok({
        item: {
          ...profitValuationPayload.list[0],
          growthRateManual: 12,
          growthRateApplied: 12,
          valuation: 1400
        }
      })
    )

    const wrapper = shallowMount(ProfitDiscount, {
      global: {
        stubs: elementPlusStubs,
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()

    wrapper.vm.draftGrowthRates[1] = 12
    await wrapper.vm.saveGrowthRate(wrapper.vm.rows[0])
    await flushPromises()

    expect(mock.history.patch[0].url).toBe(
      '/valuation/profit-discount/1/growth-rate'
    )
    expect(JSON.parse(mock.history.patch[0].data)).toEqual({
      growthRateManual: 12
    })
    expect(wrapper.vm.rows[0].growthRateApplied).toBe(12)
    expect(wrapper.vm.rows[0].valuation).toBe(1400)
    expect(notifySuccess).toHaveBeenCalled()
  })

  it('navigates to company overview from a profit valuation row', async () => {
    mock.onGet('/valuation/profit-discount').reply(ok(profitValuationPayload))

    const wrapper = shallowMount(ProfitDiscount, {
      global: {
        stubs: elementPlusStubs,
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()
    wrapper.vm.goOverview(wrapper.vm.rows[0])

    expect(push).toHaveBeenCalledWith({
      path: '/companyvaluation/valuation/company/1',
      query: {
        tab: 'profit',
        from: 'profit-discount'
      }
    })
  })
})
