import { flushPromises, shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { companyDetailPayload } from '@/test/fixtures/company'
import { createHttpMock, ok } from '@/test/mocks/http'
import { elementPlusStubs } from '@/test/stubs/element-plus'
import CompanyDetail from './companydetail.vue'

const { push } = vi.hoisted(() => ({
  push: vi.fn()
}))

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')

  return {
    ...actual,
    useRoute: () => ({
      params: {
        id: '1'
      }
    }),
    useRouter: () => ({ push })
  }
})

describe('companydetail page', () => {
  const mock = createHttpMock()

  beforeEach(() => {
    push.mockReset()
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

    expect(wrapper.vm.company.name).toBe('贵州茅台')
    expect(wrapper.vm.company.stockCode).toBe('600519')
    expect(wrapper.vm.dividendList).toHaveLength(1)
    expect(wrapper.vm.totalValuation).toBe(1111.5)
    expect(wrapper.vm.activeTab).toBe('overview')
    expect(wrapper.vm.profitAssumptions[0].label).toBe('系统增长率')
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
