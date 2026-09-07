import { describe, expect, it } from 'vitest'

import {
  buildTierPreview,
  defaultValuation,
  formatNumber,
  formatPrice,
  mirrorUpBuyQty,
  tierLabel,
  valuationBarClass,
  valuationTagType
} from './grid-trading'

describe('grid-trading utils', () => {
  it('labels tiers with base or signed names', () => {
    expect(tierLabel(0)).toBe('基准档')
    expect(tierLabel(-1)).toBe('-1 档')
    expect(tierLabel(2)).toBe('+2 档')
  })

  it('defaults valuation to fair for base and the two nearest tiers', () => {
    expect(defaultValuation(0)).toBe('合理')
    expect(defaultValuation(-1)).toBe('合理')
    expect(defaultValuation(-2)).toBe('合理')
    expect(defaultValuation(1)).toBe('合理')
    expect(defaultValuation(2)).toBe('合理')
    expect(defaultValuation(-3)).toBe('高估')
    expect(defaultValuation(3)).toBe('低估')
  })

  it('maps valuation to tag and bar classes', () => {
    expect(valuationTagType('高估')).toBe('danger')
    expect(valuationTagType('低估')).toBe('success')
    expect(valuationTagType('合理')).toBe('primary')
    expect(valuationBarClass('高估')).toBe('bar-high')
    expect(valuationBarClass('低估')).toBe('bar-low')
    expect(valuationBarClass('合理')).toBe('bar-fair')
  })

  it('formats numbers and prices with fallback', () => {
    expect(formatNumber(null)).toBe('—')
    expect(formatNumber(2000)).toBe('2,000')
    expect(formatPrice(115.3)).toBe('115.30')
    expect(formatPrice(undefined)).toBe('—')
  })

  it('builds the hybrid price ladder from params', () => {
    const rows = buildTierPreview({
      basePrice: 100,
      intervalPct: 10,
      upTierCount: 2,
      downTierCount: 2
    })

    expect(rows.map((row) => row.level)).toEqual([-2, -1, 0, 1, 2])
    expect(rows[0].price).toBe(121)
    expect(rows[1].price).toBe(110)
    expect(rows[3].price).toBe(90)
    expect(rows[4].price).toBe(80)
    expect(rows[2].direction).toBe('BASE')
  })

  it('mirrors up-side sell quantities into buy quantities', () => {
    // 华能水电 §3：减仓 -1..-5 = 0/1500/2000/3000/0 → 加仓 -1..-5 = 3000/2000/1500/0/0
    expect(mirrorUpBuyQty([0, 1500, 2000, 3000, 0])).toEqual([
      3000, 2000, 1500, 0, 0
    ])
    // 全 0 档位 → 全 0
    expect(mirrorUpBuyQty([0, 0, 0])).toEqual([0, 0, 0])
    // 镜像保持合计配平
    const sells = [200, 300, 500, 800, 200]
    const buys = mirrorUpBuyQty(sells)
    expect(buys.reduce((a, b) => a + b, 0)).toBe(
      sells.reduce((a, b) => a + b, 0)
    )
    expect(buys).toEqual([200, 800, 500, 300, 200])
  })
})
