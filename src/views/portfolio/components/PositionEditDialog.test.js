import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ElementPlus from 'element-plus'

import { updatePortfolioArchive } from '@/api/portfolio'
import PositionEditDialog from './PositionEditDialog.vue'

vi.mock('@/api/portfolio', () => ({
  updatePortfolioArchive: vi.fn(() => Promise.resolve({}))
}))

describe('PositionEditDialog', () => {
  const row = {
    stockCode: '00700.HK',
    stockName: '腾讯控股',
    buyReason: '回调抄底',
    stockType: '蓝筹',
    pricePosition: '低位',
    decisionLevel: '重仓',
    holdStrategy: '长期持有',
    holdPlan: '逢低加仓',
    earningsNote: '中报 ROE 15%',
    archiveRemark: '核心资产'
  }

  beforeEach(() => {
    vi.mocked(updatePortfolioArchive).mockClear()
  })

  async function openMount() {
    const wrapper = mount(PositionEditDialog, {
      props: { visible: true, row },
      global: { plugins: [ElementPlus] }
    })
    await flushPromises()
    return wrapper
  }

  it('submits full archive payload on confirm', async () => {
    const wrapper = await openMount()
    await wrapper.find('[data-test="confirm"]').trigger('click')
    await flushPromises()

    expect(updatePortfolioArchive).toHaveBeenCalledWith('00700.HK', {
      buyReason: '回调抄底',
      stockType: '蓝筹',
      pricePosition: '低位',
      timing: null,
      decisionLevel: '重仓',
      bigV: null,
      holdStrategy: '长期持有',
      holdPlan: '逢低加仓',
      remark: '核心资产',
      earningsNote: '中报 ROE 15%'
    })
  })

  it('sends null for cleared optional fields', async () => {
    const wrapper = await openMount()
    // 买入原因清空 -> 后续联动字段清空
    // 直接通过 vm 修改内部 form 更稳定：
    wrapper.vm.form.buyReason = ''
    wrapper.vm.form.stockType = ''
    wrapper.vm.form.pricePosition = ''
    wrapper.vm.form.decisionLevel = ''
    wrapper.vm.form.holdPlan = ''
    wrapper.vm.form.archiveRemark = ''
    await wrapper.find('[data-test="confirm"]').trigger('click')
    await flushPromises()

    expect(updatePortfolioArchive).toHaveBeenCalledWith('00700.HK', {
      buyReason: null,
      stockType: null,
      pricePosition: null,
      timing: null,
      decisionLevel: null,
      bigV: null,
      holdStrategy: '长期持有',
      holdPlan: '',
      remark: '',
      earningsNote: '中报 ROE 15%'
    })
  })

  it('recalculates level from inputs and resets fields on reason change', async () => {
    const wrapper = await openMount()
    // v-model 先更新 buyReason，再触发 @change
    wrapper.vm.form.buyReason = '暴跌抄底'
    wrapper.vm.handleReasonChange()
    expect(wrapper.vm.form.stockType).toBe('')
    expect(wrapper.vm.form.pricePosition).toBe('')
    expect(wrapper.vm.form.timing).toBe('')
    expect(wrapper.vm.form.decisionLevel).toBe('')
    expect(wrapper.vm.form.bigV).toBe('')

    wrapper.vm.form.stockType = '成长'
    wrapper.vm.form.timing = '次日及以后'
    wrapper.vm.recalcLevel()
    expect(wrapper.vm.form.decisionLevel).toBe('别买')
  })

  it('fills bigV only for bigV/smallV reasons', async () => {
    const wrapper = await openMount()
    wrapper.vm.form.buyReason = '大V推荐'
    wrapper.vm.handleReasonChange()
    expect(wrapper.vm.showBigV).toBe(true)
    wrapper.vm.form.bigV = '老V'
    wrapper.vm.form.stockType = '成长'
    wrapper.vm.form.pricePosition = '低位'
    await wrapper.find('[data-test="confirm"]').trigger('click')
    await flushPromises()

    expect(updatePortfolioArchive).toHaveBeenLastCalledWith(
      '00700.HK',
      expect.objectContaining({ bigV: '老V' })
    )
  })
})
