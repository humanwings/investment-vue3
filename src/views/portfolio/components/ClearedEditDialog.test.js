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
    buyReason: '暴跌抄底',
    stockType: '成长',
    timing: '次日及以后',
    decisionLevel: '轻仓',
    clearReason: '止盈',
    clearReasonRemark: '达到目标价',
    realizedPl: 6740,
    holdDays: 24,
    clearedRemark: '按计划离场'
  }

  beforeEach(() => {
    vi.mocked(updatePortfolioCleared).mockClear()
  })

  it('submits all ten editable fields', async () => {
    const wrapper = mount(ClearedEditDialog, {
      props: { visible: true, row },
      global: { plugins: [ElementPlus] }
    })
    await flushPromises()

    wrapper.vm.form.decisionLevel = '正常'
    await wrapper.find('[data-test="confirm"]').trigger('click')
    await flushPromises()

    expect(updatePortfolioCleared).toHaveBeenCalledWith(9, {
      buyReason: '暴跌抄底',
      stockType: '成长',
      pricePosition: null,
      timing: '次日及以后',
      decisionLevel: '正常',
      bigV: null,
      clearReason: '止盈',
      clearReasonRemark: '达到目标价',
      realizedPl: 6740,
      holdDays: 24,
      clearedRemark: '按计划离场'
    })
  })
})
