import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ElementPlus from 'element-plus'

import BuyDecisionII from './BuyDecisionII.vue'

function mountPage() {
  return mount(BuyDecisionII, {
    global: {
      plugins: [ElementPlus]
    }
  })
}

describe('BuyDecisionII', () => {
  it('shows the placeholder when nothing is selected', () => {
    const wrapper = mountPage()

    expect(wrapper.find('[data-test="decision-result"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="result-placeholder"]').exists()).toBe(true)
  })

  it('stacks both recommendations and shows the scored result', async () => {
    const wrapper = mountPage()

    await wrapper.find('[data-test="recommends-大V推荐"]').trigger('click')
    await wrapper.find('[data-test="recommends-小V推荐"]').trigger('click')
    await wrapper.find('[data-test="type-蓝筹"]').trigger('click')
    await wrapper.find('[data-test="position-低位"]').trigger('click')

    expect(wrapper.find('[data-test="decision-result"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="result-level"]').text()).toBe('超重仓')
    expect(wrapper.find('[data-test="result-units"]').text()).toContain('8')
    expect(wrapper.find('[data-test="result-score"]').text()).toContain('10')
    expect(wrapper.find('[data-test="result-tier"]').text()).toBe('第 6 / 6 档')
    expect(wrapper.find('[data-test="tier-row-超重仓"]').classes()).toContain(
      'active'
    )
  })

  it('toggles a single-select dimension back to empty', async () => {
    const wrapper = mountPage()

    await wrapper.find('[data-test="position-低位"]').trigger('click')

    expect(wrapper.find('[data-test="decision-result"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="result-level"]').text()).toBe('轻仓')

    await wrapper.find('[data-test="position-低位"]').trigger('click')

    expect(wrapper.find('[data-test="decision-result"]').exists()).toBe(false)
  })

  it('vetoes hot factor at high position regardless of positives', async () => {
    const wrapper = mountPage()

    await wrapper.find('[data-test="recommends-大V推荐"]').trigger('click')
    await wrapper.find('[data-test="type-蓝筹"]').trigger('click')
    await wrapper.find('[data-test="factor-热点"]').trigger('click')
    await wrapper.find('[data-test="position-高位"]').trigger('click')

    expect(wrapper.find('[data-test="result-level"]').text()).toBe('别买')
    expect(wrapper.find('[data-test="result-units"]').text()).toContain('0')
    expect(wrapper.find('[data-test="result-score"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="result-note"]').text()).toContain('不碰')
  })

  it('clears all selections', async () => {
    const wrapper = mountPage()

    await wrapper.find('[data-test="recommends-大V推荐"]').trigger('click')
    await wrapper.find('[data-test="position-低位"]').trigger('click')

    expect(wrapper.find('[data-test="decision-result"]').exists()).toBe(true)

    await wrapper.find('[data-test="clear-all"]').trigger('click')

    expect(wrapper.find('[data-test="decision-result"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="result-placeholder"]').exists()).toBe(true)
  })
})
