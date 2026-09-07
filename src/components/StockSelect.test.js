import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import StockSelect from './StockSelect.vue'
import { createHttpMock, ok } from '@/test/mocks/http'
import { elementPlusStubs } from '@/test/stubs/element-plus'

describe('StockSelect', () => {
  const mock = createHttpMock()

  afterEach(() => {
    mock.reset()
  })

  it('maps search results into unified options', async () => {
    mock.onGet('/master-data/search').reply(
      ok({
        results: [
          { market: 'A', code: '601318', name: '中国平安' },
          { market: 'H', code: '00700', name: '腾讯控股' }
        ]
      })
    )

    const wrapper = mount(StockSelect, {
      global: { stubs: elementPlusStubs }
    })
    await wrapper.vm.doSearch('zgpa')
    await flushPromises()

    expect(wrapper.vm.options).toEqual([
      { market: 'A', code: '601318', name: '中国平安' },
      { market: 'H', code: '00700', name: '腾讯控股' }
    ])
  })

  it('emits a normalized manual stock for 6-digit codes', () => {
    const wrapper = mount(StockSelect, {
      global: { stubs: elementPlusStubs }
    })
    wrapper.vm.manualCode = '600519'
    wrapper.vm.addManual()

    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual({
      market: 'A',
      code: '600519',
      name: '600519'
    })
  })

  it('judges 5-digit codes as HK market', () => {
    const wrapper = mount(StockSelect, {
      global: { stubs: elementPlusStubs }
    })
    wrapper.vm.manualCode = '00700'
    wrapper.vm.addManual()

    expect(wrapper.emitted('update:modelValue')[0][0].market).toBe('H')
  })

  it('ignores invalid manual codes', () => {
    const wrapper = mount(StockSelect, {
      global: { stubs: elementPlusStubs }
    })
    wrapper.vm.manualCode = 'abc'
    wrapper.vm.addManual()

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('follows external modelValue resets', async () => {
    const wrapper = mount(StockSelect, {
      global: { stubs: elementPlusStubs }
    })
    await wrapper.setProps({
      modelValue: { market: 'A', code: '600519', name: '贵州茅台' }
    })

    expect(wrapper.vm.selected).toEqual({
      market: 'A',
      code: '600519',
      name: '贵州茅台'
    })
  })
})
