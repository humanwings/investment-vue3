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
    reco: '大V推荐',
    factor: '热点',
    trend: '',
    fame: '龙头',
    stockType: '蓝筹',
    pricePosition: '高位',
    bigV: '老V',
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

  it('splits stored reco into multi select and joins on save', async () => {
    const wrapper = await openMount()
    expect(wrapper.vm.form.reco).toEqual(['大V推荐'])
    expect(wrapper.vm.showBigV).toBe(true)

    wrapper.vm.form.reco = ['大V推荐', '小V推荐']
    await wrapper.find('[data-test="confirm"]').trigger('click')
    await flushPromises()

    expect(updatePortfolioArchive).toHaveBeenCalledWith('00700.HK', {
      reco: '大V推荐,小V推荐',
      factor: '热点',
      trend: null,
      fame: '龙头',
      stockType: '蓝筹',
      pricePosition: '高位',
      bigV: '老V',
      holdStrategy: '长期持有',
      holdPlan: '逢低加仓',
      remark: '核心资产',
      earningsNote: '中报 ROE 15%'
    })
  })

  it('sends null for all six dims when empty', async () => {
    const wrapper = await openMount()
    wrapper.vm.form.reco = []
    wrapper.vm.form.factor = ''
    wrapper.vm.form.fame = ''
    wrapper.vm.form.stockType = ''
    wrapper.vm.form.pricePosition = ''
    wrapper.vm.form.holdPlan = ''
    wrapper.vm.form.archiveRemark = ''
    await wrapper.find('[data-test="confirm"]').trigger('click')
    await flushPromises()

    expect(updatePortfolioArchive).toHaveBeenCalledWith('00700.HK', {
      reco: null,
      factor: null,
      trend: null,
      fame: null,
      stockType: null,
      pricePosition: null,
      bigV: null,
      holdStrategy: '长期持有',
      holdPlan: '',
      remark: '',
      earningsNote: '中报 ROE 15%'
    })
  })

  it('keeps dims independent when one changes', async () => {
    const wrapper = await openMount()
    wrapper.vm.form.trend = '回调'
    expect(wrapper.vm.form.stockType).toBe('蓝筹')
    expect(wrapper.vm.form.pricePosition).toBe('高位')
    expect(wrapper.vm.form.reco).toEqual(['大V推荐'])
  })
})
