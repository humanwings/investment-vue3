import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ElementPlus from 'element-plus'
import { reactive } from 'vue'

import DecisionSixFields from './DecisionSixFields.vue'

describe('DecisionSixFields', () => {
  function mountWith(form) {
    return mount(DecisionSixFields, {
      props: { form },
      global: { plugins: [ElementPlus] }
    })
  }

  it('renders six dimension inputs in II card order', () => {
    const wrapper = mountWith(
      reactive({
        reco: [],
        factor: '',
        trend: '',
        fame: '',
        stockType: '',
        pricePosition: '',
        bigV: ''
      })
    )
    const labels = wrapper.findAll('.el-form-item__label').map((n) => n.text())
    expect(labels).toEqual([
      '推荐来源',
      '因素',
      '走势',
      '知名度',
      '类型',
      '股价位置'
    ])
  })

  it('hides bigV input when reco empty and shows it when reco set', async () => {
    const form = reactive({
      reco: [],
      factor: '',
      trend: '',
      fame: '',
      stockType: '',
      pricePosition: '',
      bigV: ''
    })
    const wrapper = mountWith(form)
    expect(wrapper.text()).not.toContain('大V姓名')

    form.reco = ['小V推荐']
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('大V姓名')
  })
})
