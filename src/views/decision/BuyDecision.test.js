import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ElementPlus from 'element-plus'

import BuyDecision from './BuyDecision.vue'

describe('BuyDecision', () => {
  it('shows the scored result after completing three selections', async () => {
    const wrapper = mount(BuyDecision, {
      global: {
        plugins: [ElementPlus]
      }
    })

    await wrapper.find('[data-test="reason-bigV"]').trigger('click')
    await wrapper.find('[data-test="type-成长"]').trigger('click')
    await wrapper.find('[data-test="position-低位"]').trigger('click')

    expect(wrapper.find('[data-test="decision-result"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="result-level"]').text()).toBe('重仓')
    expect(wrapper.find('[data-test="result-units"]').text()).toContain('6')
    expect(wrapper.find('[data-test="result-tier"]').text()).toBe('第 5 / 6 档')
    expect(wrapper.find('[data-test="tier-row-重仓"]').classes()).toContain(
      'active'
    )
  })

  it('keeps the reason and clears later selections on reset', async () => {
    const wrapper = mount(BuyDecision, {
      global: {
        plugins: [ElementPlus]
      }
    })

    await wrapper.find('[data-test="reason-bigV"]').trigger('click')
    await wrapper.find('[data-test="type-成长"]').trigger('click')
    await wrapper.find('[data-test="position-低位"]').trigger('click')

    expect(wrapper.find('[data-test="decision-result"]').exists()).toBe(true)

    await wrapper.find('[data-test="reset"]').trigger('click')

    expect(wrapper.find('[data-test="decision-result"]').exists()).toBe(false)

    await wrapper.find('[data-test="position-低位"]').trigger('click')

    expect(wrapper.find('[data-test="decision-result"]').exists()).toBe(false)
  })
})
