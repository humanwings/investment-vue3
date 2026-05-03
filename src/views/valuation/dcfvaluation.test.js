import { flushPromises, shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  dcfV2ValuationPayload,
  dcfValuationPayload
} from '@/test/fixtures/company'
import { createHttpMock, ok } from '@/test/mocks/http'
import { elementPlusStubs } from '@/test/stubs/element-plus'
import DcfValuation from './dcfvaluation.vue'

const { confirm, push, notifySuccess } = vi.hoisted(() => ({
  confirm: vi.fn(() => Promise.resolve()),
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
    ElMessageBox: {
      confirm
    },
    ElNotification: {
      success: notifySuccess
    }
  }
})

describe('dcf valuation workbench', () => {
  const mock = createHttpMock()

  beforeEach(() => {
    confirm.mockReset()
    confirm.mockResolvedValue()
    push.mockReset()
    notifySuccess.mockReset()
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
    expect(wrapper.text()).toContain(
      '跟踪 DCF 模型估值、关键假设与模型差异，支持按行业统一手动假设。'
    )
    expect(wrapper.find('.title-row').text()).toContain('数据总计 1')
    expect(wrapper.find('.header-actions').text()).not.toContain('数据总计')
    expect(wrapper.vm.rows).toHaveLength(1)
    expect(wrapper.vm.rows[0].name).toBe('贵州茅台')
    expect(wrapper.vm.filteredRows).toHaveLength(1)
    expect(wrapper.vm.draftRevenueGrowthRates[1]).toBe(10)
    expect(wrapper.vm.draftDiscountRates[1]).toBe(11)
    expect(wrapper.vm.draftTerminalGrowthRates[1]).toBe(3)
    expect(wrapper.vm.hasManualOverride(wrapper.vm.rows[0])).toBe(true)
    expect(wrapper.vm.statusLabel(wrapper.vm.rows[0].status)).toBe('已计算')
    expect(mock.history.get[0].params).toEqual({
      modelVersion: 'DCF_V1_SIMPLE_FCFF',
      scenarioKey: 'BASE'
    })
  })

  it('opens the DCF v1 valuation help dialog from the title row', async () => {
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

    expect(wrapper.text()).toContain('估值说明')
    expect(wrapper.text()).toContain('DCF v1：简化 FCFF')
    expect(wrapper.text()).toContain(
      '每股估值 = (未来现金流现值 + 终值现值 - 净债务) ÷ 总股本'
    )
    expect(wrapper.vm.helpDialogVisible).toBe(false)

    await wrapper.find('.help-button').trigger('click')

    expect(wrapper.vm.helpDialogVisible).toBe(true)
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
    expect(wrapper.text()).toContain(
      '跟踪标准 DCF 估值、阶段假设、敏感性区间与模型差异。'
    )
    expect(wrapper.find('.title-row').text()).toContain('数据总计 1')
    expect(wrapper.vm.rows[0].modelVersion).toBe('DCF_V2_STANDARD_FCFF')
    expect(wrapper.vm.isV1).toBe(false)
    expect(wrapper.vm.isV2).toBe(true)
    expect(wrapper.vm.canApplyBatch).toBe(false)
    expect(wrapper.vm.statusLabel(wrapper.vm.rows[0].status)).toBe('已计算')
    expect(wrapper.vm.rows[0].averageOperatingMargin).toBe(0.28)
    expect(wrapper.vm.averageSensitivityRange).toBe('980 / 1280')
    expect(wrapper.vm.formatBridge(wrapper.vm.rows[0])).toBe('112500 / 110000')
    expect(wrapper.vm.formatSensitivityRange(wrapper.vm.rows[0])).toBe(
      '980 / 1280'
    )
    expect(mock.history.get[0].params).toEqual({
      modelVersion: 'DCF_V2_STANDARD_FCFF',
      scenarioKey: 'BASE'
    })
  })

  it('opens the DCF v2 valuation help dialog with standard FCFF guidance', async () => {
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

    expect(wrapper.text()).toContain('DCF v2：标准 FCFF')
    expect(wrapper.text()).toContain(
      'FCFF = NOPAT + 折旧摊销 - 资本开支 - 营运资本增加'
    )
    expect(wrapper.text()).toContain('敏感性区间')
    expect(wrapper.vm.helpDialogVisible).toBe(false)

    await wrapper.find('.help-button').trigger('click')

    expect(wrapper.vm.helpDialogVisible).toBe(true)
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

  it('updates DCF v1 manual assumptions and replaces the row', async () => {
    mock.onGet('/valuation/dcf').reply(ok(dcfValuationPayload))
    mock.onPatch('/valuation/dcf/v1/1/manual-assumptions').reply(
      ok({
        item: {
          ...dcfValuationPayload.list[0],
          revenueGrowthRateManual: 0.12,
          revenueGrowthRateApplied: 0.12,
          discountRateManual: 0.1,
          discountRateApplied: 0.1,
          terminalGrowthRateManual: 0.035,
          terminalGrowthRateApplied: 0.035,
          perShareValue: 880,
          manualOverrideFlag: true
        }
      })
    )

    const wrapper = shallowMount(DcfValuation, {
      global: {
        stubs: elementPlusStubs,
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()
    wrapper.vm.draftRevenueGrowthRates[1] = 12
    wrapper.vm.draftDiscountRates[1] = 10
    wrapper.vm.draftTerminalGrowthRates[1] = 3.5
    await wrapper.vm.saveManualAssumptions(wrapper.vm.rows[0])
    await flushPromises()

    expect(mock.history.patch[0].url).toBe(
      '/valuation/dcf/v1/1/manual-assumptions'
    )
    expect(JSON.parse(mock.history.patch[0].data)).toEqual({
      revenueGrowthRateManual: 12,
      discountRateManual: 10,
      terminalGrowthRateManual: 3.5,
      changeReason: 'company DCF v1 manual assumptions'
    })
    expect(wrapper.vm.rows[0].revenueGrowthRateApplied).toBe(0.12)
    expect(wrapper.vm.rows[0].perShareValue).toBe(880)
    expect(wrapper.vm.draftRevenueGrowthRates[1]).toBe(12)
    expect(notifySuccess).toHaveBeenCalled()
  })

  it('resets DCF v1 manual assumptions to the system defaults', async () => {
    mock.onGet('/valuation/dcf').reply(ok(dcfValuationPayload))
    mock.onDelete('/valuation/dcf/v1/1/manual-assumptions').reply(
      ok({
        item: {
          ...dcfValuationPayload.list[0],
          revenueGrowthRateManual: null,
          revenueGrowthRateApplied: 0.08,
          discountRateManual: null,
          discountRateApplied: 0.09,
          terminalGrowthRateManual: null,
          terminalGrowthRateApplied: 0.025,
          manualOverrideFlag: false
        }
      })
    )

    const wrapper = shallowMount(DcfValuation, {
      global: {
        stubs: elementPlusStubs,
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()
    await wrapper.vm.resetManualAssumptions(wrapper.vm.rows[0])
    await flushPromises()

    expect(mock.history.delete[0].url).toBe(
      '/valuation/dcf/v1/1/manual-assumptions'
    )
    expect(JSON.parse(mock.history.delete[0].data)).toEqual({
      changeReason: 'restore DCF v1 default assumptions'
    })
    expect(wrapper.vm.rows[0].revenueGrowthRateManual).toBe(null)
    expect(wrapper.vm.rows[0].revenueGrowthRateApplied).toBe(0.08)
    expect(wrapper.vm.hasManualOverride(wrapper.vm.rows[0])).toBe(false)
    expect(wrapper.vm.draftRevenueGrowthRates[1]).toBe(8)
    expect(notifySuccess).toHaveBeenCalled()
  })

  it('applies DCF v1 manual assumptions to the selected industry', async () => {
    mock.onGet('/valuation/dcf').reply(ok(dcfValuationPayload))
    mock.onPost('/valuation/dcf/v1/industry-manual-assumptions').reply(
      ok({
        list: [
          {
            ...dcfValuationPayload.list[0],
            revenueGrowthRateManual: 0.11,
            revenueGrowthRateApplied: 0.11,
            discountRateManual: 0.1,
            discountRateApplied: 0.1,
            terminalGrowthRateManual: 0.025,
            terminalGrowthRateApplied: 0.025,
            perShareValue: 860,
            manualOverrideFlag: true
          }
        ],
        sum: 1
      })
    )

    const wrapper = shallowMount(DcfValuation, {
      global: {
        stubs: elementPlusStubs,
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()
    wrapper.vm.industryFilter = wrapper.vm.rows[0].industryName
    wrapper.vm.batchRevenueGrowthRate = 11
    wrapper.vm.batchDiscountRate = 10
    wrapper.vm.batchTerminalGrowthRate = 2.5
    await wrapper.vm.applyIndustryManualAssumptions()
    await flushPromises()

    expect(confirm).toHaveBeenCalled()
    expect(mock.history.post[0].url).toBe(
      '/valuation/dcf/v1/industry-manual-assumptions'
    )
    expect(JSON.parse(mock.history.post[0].data)).toEqual({
      industryName: wrapper.vm.rows[0].industryName,
      revenueGrowthRateManual: 11,
      discountRateManual: 10,
      terminalGrowthRateManual: 2.5,
      changeReason: 'industry batch DCF v1 manual assumptions'
    })
    expect(wrapper.vm.rows[0].perShareValue).toBe(860)
    expect(wrapper.vm.draftRevenueGrowthRates[1]).toBe(11)
    expect(notifySuccess).toHaveBeenCalled()
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
