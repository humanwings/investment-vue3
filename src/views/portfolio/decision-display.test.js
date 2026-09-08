import { describe, expect, it } from 'vitest'

import { decisionText } from './decision-display'

describe('decisionText', () => {
  it('joins non-empty parts with dash, leading with buy reason', () => {
    expect(
      decisionText({
        buyReason: '回调抄底',
        stockType: '蓝筹',
        pricePosition: '低位',
        decisionLevel: '重仓'
      })
    ).toBe('回调抄底-蓝筹-低位-重仓')
    expect(
      decisionText({
        buyReason: '暴跌抄底',
        stockType: '概念',
        timing: '当日',
        decisionLevel: '轻仓'
      })
    ).toBe('暴跌抄底-概念-当日-轻仓')
  })

  it('still renders rows without buy reason', () => {
    expect(
      decisionText({
        stockType: '蓝筹',
        pricePosition: '低位',
        decisionLevel: '重仓'
      })
    ).toBe('蓝筹-低位-重仓')
  })

  it('skips empty parts and returns dash when empty', () => {
    expect(decisionText({ decisionLevel: '轻仓' })).toBe('轻仓')
    expect(decisionText({})).toBe('-')
    expect(decisionText(null)).toBe('-')
  })
})
