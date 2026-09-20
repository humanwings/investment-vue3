import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ElementPlus from 'element-plus'

import { createPortfolioCleared } from '@/api/portfolio'
import ClearedAddDialog from './ClearedAddDialog.vue'

vi.mock('@/api/portfolio', () => ({
  createPortfolioCleared: vi.fn(() => Promise.resolve({}))
}))

describe('ClearedAddDialog', () => {
  beforeEach(() => {
    vi.mocked(createPortfolioCleared).mockClear()
  })

  it('disables confirm until stock and cleared date are set', async () => {
    const wrapper = mount(ClearedAddDialog, {
      props: { visible: true },
      global: { plugins: [ElementPlus] }
    })
    await flushPromises()
    expect(
      wrapper.find('[data-test="confirm"]').attributes('disabled')
    ).toBeDefined()

    wrapper.vm.stock = { market: 'A', code: '600745', name: '闻泰科技' }
    wrapper.vm.clearedDate = '2026-09-19'
    await flushPromises()
    expect(
      wrapper.find('[data-test="confirm"]').attributes('disabled')
    ).toBeUndefined()
  })

  it('submits stock, cleared date and six-dim payload', async () => {
    const wrapper = mount(ClearedAddDialog, {
      props: { visible: true },
      global: { plugins: [ElementPlus] }
    })
    await flushPromises()

    wrapper.vm.stock = { market: 'A', code: '600745', name: '闻泰科技' }
    wrapper.vm.clearedDate = '2026-09-19'
    wrapper.vm.form.reco = ['大V推荐']
    wrapper.vm.form.bigV = '老V'
    wrapper.vm.form.clearReason = '止盈'
    wrapper.vm.form.realizedPl = 6740
    wrapper.vm.form.holdDays = 24
    await flushPromises()

    await wrapper.find('[data-test="confirm"]').trigger('click')
    await flushPromises()

    expect(createPortfolioCleared).toHaveBeenCalledWith({
      stockCode: '600745',
      stockName: '闻泰科技',
      market: 'A',
      clearedDate: '2026-09-19',
      reco: '大V推荐',
      factor: null,
      trend: null,
      fame: null,
      stockType: null,
      pricePosition: null,
      bigV: '老V',
      clearReason: '止盈',
      clearReasonRemark: '',
      realizedPl: 6740,
      holdDays: 24,
      clearedRemark: ''
    })
    expect(wrapper.emitted('saved')).toBeTruthy()
    expect(wrapper.emitted('update:visible')).toContainEqual([false])
  })
})
