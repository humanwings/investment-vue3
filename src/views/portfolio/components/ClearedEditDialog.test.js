import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ElementPlus from 'element-plus'

import { updatePortfolioCleared } from '@/api/portfolio'
import ClearedEditDialog from './ClearedEditDialog.vue'

vi.mock('@/api/portfolio', () => ({
  updatePortfolioCleared: vi.fn(() => Promise.resolve({}))
}))

describe('ClearedEditDialog', () => {
  const row = {
    clearedId: 9,
    stockCode: '600745.SH',
    stockName: '闻泰科技',
    reco: '小V推荐',
    factor: '潜伏',
    trend: '',
    fame: '二线',
    stockType: '成长',
    pricePosition: '中位',
    bigV: '老V',
    clearReason: '止盈',
    clearReasonRemark: '达到目标价',
    realizedPl: 6740,
    holdDays: 24,
    clearedRemark: '按计划离场'
  }

  beforeEach(() => {
    vi.mocked(updatePortfolioCleared).mockClear()
  })

  it('submits six-dim payload plus cleared fields', async () => {
    const wrapper = mount(ClearedEditDialog, {
      props: { visible: true, row },
      global: { plugins: [ElementPlus] }
    })
    await flushPromises()

    await wrapper.find('[data-test="confirm"]').trigger('click')
    await flushPromises()

    expect(updatePortfolioCleared).toHaveBeenCalledWith(9, {
      reco: '小V推荐',
      factor: '潜伏',
      trend: null,
      fame: '二线',
      stockType: '成长',
      pricePosition: '中位',
      bigV: '老V',
      clearReason: '止盈',
      clearReasonRemark: '达到目标价',
      realizedPl: 6740,
      holdDays: 24,
      clearedRemark: '按计划离场'
    })
  })
})
