import { describe, expect, it } from 'vitest'

import { decisionText } from './decision-display'

describe('decisionText', () => {
  it('joins non-empty dims in II card order with ·', () => {
    expect(
      decisionText({
        reco: '大V推荐',
        factor: '热点',
        trend: '回调',
        fame: '龙头',
        stockType: '蓝筹',
        pricePosition: '高位'
      })
    ).toBe('大V推荐·热点·回调·龙头·蓝筹·高位')
  })

  it('renders multi reco with 、 inside its segment', () => {
    expect(decisionText({ reco: '大V推荐,小V推荐', trend: '暴跌' })).toBe(
      '大V推荐、小V推荐·暴跌'
    )
  })

  it('skips empty dims and returns dash when empty', () => {
    expect(decisionText({ stockType: '蓝筹', pricePosition: '低位' })).toBe(
      '蓝筹·低位'
    )
    expect(decisionText({})).toBe('-')
    expect(decisionText(null)).toBe('-')
  })
})
