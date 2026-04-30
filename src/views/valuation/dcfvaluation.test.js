import { flushPromises, shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  dcfV2ValuationPayload,
  dcfValuationPayload
} from '@/test/fixtures/company'
import { createHttpMock, ok } from '@/test/mocks/http'
import { elementPlusStubs } from '@/test/stubs/element-plus'
import DcfValuation from './dcfvaluation.vue'

const { push } = vi.hoisted(() => ({
  push: vi.fn()
}))

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')

  return {
    ...actual,
    useRouter: () => ({ push })
  }
})

describe('dcf valuation workbench', () => {
  const mock = createHttpMock()

  beforeEach(() => {
    push.mockReset()
  })

  afterEach(() => {
    mock.reset()
  })

  it('renders DCF skeleton rows returned by the backend', async () => {
    mock.onGet('/valuation/dcf').reply(ok(dcfValuationPayload))

    const wrapper = shallowMount(DcfValuation, {
      global: {
        stubs: elementPlusStubs,
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('DCF v1一览')
    expect(wrapper.vm.rows).toHaveLength(1)
    expect(wrapper.vm.rows[0].name).toBe('贵州茅台')
    expect(wrapper.vm.filteredRows).toHaveLength(1)
    expect(wrapper.vm.statusLabel(wrapper.vm.rows[0].status)).toBe('已计算')
    expect(mock.history.get[0].params).toEqual({
      modelVersion: 'DCF_V1_SIMPLE_FCFF',
      scenarioKey: 'BASE'
    })
  })

  it('renders the DCF v2 skeleton entrance with v2 query params', async () => {
    mock.onGet('/valuation/dcf').reply(ok(dcfV2ValuationPayload))

    const wrapper = shallowMount(DcfValuation, {
      props: {
        pageTitle: 'DCF v2一览',
        modelVersion: 'DCF_V2_STANDARD_FCFF',
        versionKey: 'v2',
        pendingStatusLabel: '等待 DCF v2',
        overviewSource: 'dcf-v2'
      },
      global: {
        stubs: elementPlusStubs,
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('DCF v2一览')
    expect(wrapper.vm.rows[0].modelVersion).toBe('DCF_V2_STANDARD_FCFF')
    expect(wrapper.vm.statusLabel(wrapper.vm.rows[0].status)).toBe(
      '等待 DCF v2'
    )
    expect(mock.history.get[0].params).toEqual({
      modelVersion: 'DCF_V2_STANDARD_FCFF',
      scenarioKey: 'BASE'
    })
  })

  it('filters rows by industry', async () => {
    mock.onGet('/valuation/dcf').reply(ok(dcfValuationPayload))

    const wrapper = shallowMount(DcfValuation, {
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

  it('navigates to the DCF tab in company overview', async () => {
    mock.onGet('/valuation/dcf').reply(ok(dcfValuationPayload))

    const wrapper = shallowMount(DcfValuation, {
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
        tab: 'dcf',
        dcfVersion: 'v1',
        from: 'dcf-v1'
      }
    })
  })
})
