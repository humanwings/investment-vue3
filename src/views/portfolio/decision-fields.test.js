import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'

import { useDecisionFields } from './decision-fields'

describe('useDecisionFields', () => {
  it('shows bigV input only when reco contains a recommendation', () => {
    const form = reactive({ reco: [] })
    const d = useDecisionFields(form)
    expect(d.showBigV.value).toBe(false)

    form.reco = ['大V推荐']
    expect(d.showBigV.value).toBe(true)

    form.reco = ['小V推荐']
    expect(d.showBigV.value).toBe(true)

    form.reco = []
    expect(d.showBigV.value).toBe(false)
  })

  it('accepts comma-joined reco string as well', () => {
    const form = reactive({ reco: '大V推荐' })
    const d = useDecisionFields(form)
    expect(d.showBigV.value).toBe(true)
  })
})
