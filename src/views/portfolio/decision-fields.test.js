import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'

import { useDecisionFields } from './decision-fields'

describe('useDecisionFields', () => {
  it('derives options and recalculates level from the reason label', () => {
    const form = reactive({
      buyReason: '回调抄底',
      stockType: '',
      pricePosition: '',
      timing: '',
      decisionLevel: ''
    })
    const d = useDecisionFields(form)
    expect(d.stockTypeOptions.value).toEqual(['蓝筹', '成长', '概念'])
    expect(d.isTiming.value).toBe(false)
    expect(d.thirdLabel.value).toBe('股价位置')

    form.stockType = '蓝筹'
    form.pricePosition = '低位'
    d.recalcLevel()
    expect(form.decisionLevel).toBe('重仓')
  })

  it('clears the level when inputs become incomplete', () => {
    const form = reactive({
      buyReason: '回调抄底',
      stockType: '蓝筹',
      pricePosition: '低位',
      timing: '',
      decisionLevel: '重仓'
    })
    const d = useDecisionFields(form)
    d.recalcLevel()
    expect(form.decisionLevel).toBe('重仓')

    form.stockType = ''
    d.recalcLevel()
    expect(form.decisionLevel).toBe('')
  })

  it('uses timing for crash and resets fields on reason change', () => {
    const form = reactive({
      buyReason: '暴跌抄底',
      stockType: '成长',
      pricePosition: '',
      timing: '',
      decisionLevel: ''
    })
    const d = useDecisionFields(form)
    expect(d.isTiming.value).toBe(true)
    expect(d.thirdOptions.value).toEqual(['当日', '次日及以后'])
    form.timing = '次日及以后'
    d.recalcLevel()
    expect(form.decisionLevel).toBe('别买')

    form.buyReason = '大V推荐'
    d.onReasonChange()
    expect(form.stockType).toBe('')
    expect(form.pricePosition).toBe('')
    expect(form.timing).toBe('')
    expect(form.decisionLevel).toBe('')
  })
})
