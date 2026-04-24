import { flushPromises, shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { companyListPayload } from '@/test/fixtures/company'
import { createHttpMock, ok } from '@/test/mocks/http'
import { elementPlusStubs } from '@/test/stubs/element-plus'
import CompanyList from './companylist.vue'

const { push, confirm, notifySuccess } = vi.hoisted(() => ({
  push: vi.fn(),
  confirm: vi.fn(),
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
    ElMessageBox: {
      confirm
    },
    ElNotification: {
      success: notifySuccess
    }
  }
})

describe('companylist page', () => {
  const mock = createHttpMock()

  beforeEach(() => {
    push.mockReset()
    confirm.mockReset()
    notifySuccess.mockReset()
    confirm.mockResolvedValue(undefined)
  })

  afterEach(() => {
    mock.reset()
  })

  it('renders the company list returned by the backend', async () => {
    mock.onGet('/company/all').reply(ok(companyListPayload))

    const wrapper = shallowMount(CompanyList, {
      global: {
        stubs: elementPlusStubs,
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('公司列表')
    expect(wrapper.vm.list).toHaveLength(1)
    expect(wrapper.vm.filteredList).toHaveLength(1)
    expect(wrapper.vm.list[0].name).toBe('贵州茅台')
    expect(wrapper.vm.list[0].profitValuation).toBe(1500)
    expect(wrapper.vm.list[0].conclusion).toBe('重点关注')
    expect(wrapper.vm.total).toBe(1)
    expect(wrapper.text()).not.toContain('假定增速')
  })

  it('normalizes legacy company info into list summary rows', async () => {
    mock.onGet('/company/all').reply(
      ok({
        sum: 1,
        list: [
          {
            companyId: 2,
            stockCode: '000001',
            name: '平安银行',
            industryName: '银行',
            valuation: 12,
            deviation: -0.1,
            financialScore: 70,
            score: 65
          }
        ]
      })
    )

    const wrapper = shallowMount(CompanyList, {
      global: {
        stubs: elementPlusStubs,
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()

    expect(wrapper.vm.list[0].profitValuation).toBe(12)
    expect(wrapper.vm.list[0].profitDeviation).toBe(-0.1)
    expect(wrapper.vm.list[0].totalScore).toBe(65)
    expect(wrapper.vm.list[0].conclusion).toBe('偏贵')
  })

  it('filters companies by industry', async () => {
    mock.onGet('/company/all').reply(ok(companyListPayload))

    const wrapper = shallowMount(CompanyList, {
      global: {
        stubs: elementPlusStubs,
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()

    wrapper.vm.industryFilter = '白酒'
    expect(wrapper.vm.filteredList).toHaveLength(1)

    wrapper.vm.industryFilter = '银行'
    expect(wrapper.vm.filteredList).toHaveLength(0)
  })

  it('navigates to the detail page when clicking the detail action', async () => {
    mock.onGet('/company/all').reply(ok(companyListPayload))

    const wrapper = shallowMount(CompanyList, {
      global: {
        stubs: elementPlusStubs,
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()
    wrapper.vm.goDetail({ companyId: 1 })

    expect(push).toHaveBeenCalledWith('/companyvaluation/valuation/company/1')
  })

  it('updates the list after deleting a company', async () => {
    mock.onGet('/company/all').reply(ok(companyListPayload))
    mock.onDelete('/company/1').reply(ok({}))

    const wrapper = shallowMount(CompanyList, {
      global: {
        stubs: elementPlusStubs,
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()

    await wrapper.vm.confirmDelete({ companyId: 1 }, 0)

    expect(confirm).toHaveBeenCalled()
    expect(notifySuccess).toHaveBeenCalled()
    expect(wrapper.vm.total).toBe(0)
    expect(wrapper.vm.list).toHaveLength(0)
  })
})
