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
    mock.onGet('/valuation/companies').reply(ok(companyListPayload))

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
    expect(wrapper.vm.list[0].name).toBe('贵州茅台')
    expect(wrapper.vm.list[0].profitValuation).toBe(1500)
    expect(wrapper.vm.list[0].dcfV1Valuation).toBe(900)
    expect(wrapper.vm.list[0].dcfV1Deviation).toBe(-0.27)
    expect(wrapper.vm.list[0].dcfV2Valuation).toBe(1100)
    expect(wrapper.vm.list[0].dcfV2Deviation).toBe(-0.11)
    expect(wrapper.vm.list[0].conclusion).toBe('重点关注')
    expect(wrapper.vm.total).toBe(1)
    expect(wrapper.find('.title-row').text()).toContain('数据总计 1')
    expect(wrapper.find('.header-actions').text()).not.toContain('数据总计')
    expect(wrapper.text()).not.toContain('假定增速')
  })

  it('configures industry filtering on the table column', async () => {
    mock.onGet('/valuation/companies').reply(ok(companyListPayload))

    const wrapper = shallowMount(CompanyList, {
      global: {
        stubs: elementPlusStubs,
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()

    expect(wrapper.findComponent({ name: 'IndustryFilter' }).exists()).toBe(
      false
    )
    expect(wrapper.vm.industryColumnFilters).toEqual([
      { text: '白酒', value: '白酒' }
    ])
    expect(wrapper.vm.filterIndustry('白酒', companyListPayload.list[0])).toBe(
      true
    )
    expect(wrapper.vm.filterIndustry('银行', companyListPayload.list[0])).toBe(
      false
    )
  })

  it('sorts by industry and renders DCF valuation columns with compact widths', async () => {
    mock.onGet('/valuation/companies').reply(ok(companyListPayload))

    const wrapper = shallowMount(CompanyList, {
      global: {
        stubs: elementPlusStubs,
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()

    const columns = wrapper.findAllComponents({ name: 'ElTableColumn' })
    const findColumn = (label) =>
      columns.find((column) => column.vm.$attrs.label === label)

    expect(findColumn('行业').vm.$attrs).toHaveProperty('sortable')
    expect(findColumn('当前价').vm.$attrs).not.toHaveProperty('sortable')
    expect(findColumn('利润贴现').vm.$attrs).not.toHaveProperty('sortable')
    expect(findColumn('DCF摘要')).toBeUndefined()
    expect(findColumn('DCF v1估值').vm.$attrs.width).toBe('110')
    expect(findColumn('v1偏离率').vm.$attrs.width).toBe('105')
    expect(findColumn('DCF v2估值').vm.$attrs.width).toBe('110')
    expect(findColumn('v2偏离率').vm.$attrs.width).toBe('105')
    expect(findColumn('处理').vm.$attrs.width).toBe('280')
    expect(wrapper.vm.formatValuation(900.126)).toBe(900.13)
    expect(wrapper.vm.formatDeviation(-0.27)).toBe('-27.00%')
    expect(wrapper.vm.formatValuation(null)).toBe('-')
  })

  it('navigates to the detail page when clicking the detail action', async () => {
    mock.onGet('/valuation/companies').reply(ok(companyListPayload))

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
    mock.onGet('/valuation/companies').reply(ok(companyListPayload))
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
    expect(mock.history.delete[0].url).toBe('/company/1')
    expect(notifySuccess).toHaveBeenCalled()
    expect(wrapper.vm.total).toBe(0)
    expect(wrapper.vm.list).toHaveLength(0)
  })

  it('uses company summary returned by refresh actions', async () => {
    mock.onGet('/valuation/companies').reply(ok(companyListPayload))
    mock.onPatch('/company/1').reply(
      ok({
        companySummary: {
          ...companyListPayload.list[0],
          price: 1300,
          profitDeviation: 0.16,
          conclusion: '可跟踪'
        }
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
    await wrapper.vm.confirmUpdatePrice({ companyId: 1 })
    await flushPromises()

    expect(wrapper.vm.list[0].price).toBe(1300)
    expect(wrapper.vm.list[0].profitDeviation).toBe(0.16)
    expect(wrapper.vm.list[0].conclusion).toBe('可跟踪')
  })
})
