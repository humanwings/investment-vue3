import { flushPromises, shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { companyDetailPayload } from '@/test/fixtures/company'
import { createHttpMock, ok } from '@/test/mocks/http'
import { elementPlusStubs } from '@/test/stubs/element-plus'
import CompanyDetail from './companydetail.vue'

const { push, routeMock } = vi.hoisted(() => ({
  push: vi.fn(),
  routeMock: {
    params: {
      id: '1'
    },
    query: {}
  }
}))

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')

  return {
    ...actual,
    useRoute: () => routeMock,
    useRouter: () => ({ push })
  }
})

describe('companydetail page', () => {
  const mock = createHttpMock()

  beforeEach(() => {
    push.mockReset()
    routeMock.params = {
      id: '1'
    }
    routeMock.query = {}
  })

  afterEach(() => {
    mock.reset()
  })

  it('renders the company detail returned by the backend', async () => {
    mock.onGet('/company/1').reply(ok(companyDetailPayload))

    const wrapper = shallowMount(CompanyDetail, {
      global: {
        stubs: elementPlusStubs,
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()

    expect(wrapper.vm.overview.name).toBe('贵州茅台')
    expect(wrapper.vm.overview.stockCode).toBe('600519')
    expect(wrapper.vm.dividendList).toHaveLength(1)
    expect(wrapper.vm.profitValuation.finalValuation).toBe(1111.5)
    expect(wrapper.vm.financialReview.profitability[0].label).toBe('加权 ROE')
    expect(wrapper.vm.financialMetricGroups).toHaveLength(5)
    expect(wrapper.vm.financialHighlightItems[0].value).toBe('ROE 表现较强')
    expect(wrapper.vm.recommendationSummary.score).toBe(88)
    expect(wrapper.vm.activeTab).toBe('overview')
    expect(wrapper.vm.profitAssumptions[0].label).toBe('系统增长率')
    expect(wrapper.vm.dcfAssumptions[0].label).toBe('营收增长率')
    expect(wrapper.vm.dcfValuation.formulaVersion).toBe('DCF_V1_SIMPLE_FCFF')
    expect(wrapper.vm.researchNavItems).toHaveLength(4)
  })

  it('opens the profit valuation tab when entered from profit discount', async () => {
    routeMock.query = {
      tab: 'profit',
      from: 'profit-discount'
    }
    mock.onGet('/company/1').reply(ok(companyDetailPayload))

    const wrapper = shallowMount(CompanyDetail, {
      global: {
        stubs: elementPlusStubs,
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()

    expect(wrapper.vm.activeTab).toBe('profit')
  })

  it('navigates back to the company list', async () => {
    mock.onGet('/company/1').reply(ok(companyDetailPayload))

    const wrapper = shallowMount(CompanyDetail, {
      global: {
        stubs: elementPlusStubs,
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()

    const backButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('返回列表'))

    await backButton.trigger('click')

    expect(push).toHaveBeenCalledWith('/companyvaluation/valuation/company')
  })
})
