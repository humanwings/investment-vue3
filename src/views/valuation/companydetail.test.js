import { flushPromises, shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { companyDetailPayload } from '@/test/fixtures/company'
import { createHttpMock, ok } from '@/test/mocks/http'
import { elementPlusStubs } from '@/test/stubs/element-plus'
import CompanyDetail from './companydetail.vue'

const { confirm, notifySuccess, push, routeMock } = vi.hoisted(() => ({
  confirm: vi.fn(),
  notifySuccess: vi.fn(),
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

describe('companydetail page', () => {
  const mock = createHttpMock()

  beforeEach(() => {
    confirm.mockReset()
    confirm.mockResolvedValue(undefined)
    notifySuccess.mockReset()
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
    expect(wrapper.text()).not.toContain('companyId')
    expect(wrapper.text()).toContain('删除本公司')
    expect(wrapper.vm.overview.stockCode).toBe('600519')
    expect(wrapper.vm.dividendList).toHaveLength(1)
    expect(wrapper.vm.profitValuation.finalValuation).toBe(1111.5)
    expect(wrapper.vm.financialReview.profitability[0].label).toBe('加权 ROE')
    expect(wrapper.vm.financialMetricGroups).toHaveLength(5)
    expect(wrapper.vm.financialHighlightItems[0].value).toBe('ROE 表现较强')
    expect(wrapper.vm.activeTab).toBe('overview')
    expect(wrapper.vm.dcfValuation.formulaVersion).toBe('DCF_V1_SIMPLE_FCFF')
    expect(wrapper.vm.dcfValuationV1.modelVersion).toBe('DCF_V1_SIMPLE_FCFF')
    expect(wrapper.vm.hasDcfManualOverride(wrapper.vm.dcfValuationV1)).toBe(
      true
    )
    expect(wrapper.vm.dcfValuationV2.modelVersion).toBe('DCF_V2_STANDARD_FCFF')
    expect(wrapper.vm.dcfValuationV2.status).toBe('ready')
    expect(wrapper.vm.dcfV2StageDetails).toHaveLength(2)
    expect(wrapper.vm.dcfV2SensitivitySnapshots).toHaveLength(3)
    expect(wrapper.vm.formatSensitivityRange(wrapper.vm.dcfValuationV2)).toBe(
      '980 / 1280'
    )
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

  it('opens the DCF v2 child tab when entered from the DCF v2 list', async () => {
    routeMock.query = {
      tab: 'dcf-v2',
      dcfVersion: 'v2',
      from: 'dcf-v2'
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

    expect(wrapper.vm.activeTab).toBe('dcf-v2')
  })

  it('navigates back to the breadcrumb parent', async () => {
    routeMock.query = {
      tab: 'dcf',
      dcfVersion: 'v2',
      from: 'dcf-v2'
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

    const backButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('返回上一级'))

    await backButton.trigger('click')

    expect(push).toHaveBeenCalledWith('/companyvaluation/valuation/dcf-v2')
  })

  it('deletes the company and returns to the breadcrumb parent', async () => {
    routeMock.query = {
      tab: 'profit',
      from: 'profit-discount'
    }
    mock.onGet('/company/1').reply(ok(companyDetailPayload))
    mock.onDelete('/company/1').reply(ok({}))

    const wrapper = shallowMount(CompanyDetail, {
      global: {
        stubs: elementPlusStubs,
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()
    await wrapper.vm.confirmDeleteCompany()
    await flushPromises()

    expect(confirm).toHaveBeenCalledWith('此操作将删除本公司，是否继续？', '提示', {
      type: 'warning'
    })
    expect(mock.history.delete[0].url).toBe('/company/1')
    expect(notifySuccess).toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith('/companyvaluation/valuation/profit-discount')
  })
})
