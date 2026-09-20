import { describe, expect, it } from 'vitest'

import {
  DECISION_DIMENSIONS,
  createEmptySelection,
  evaluateDecision2
} from './buyDecisionRules2'

describe('buy decision rules 2', () => {
  it('exposes six independent dimensions', () => {
    expect(DECISION_DIMENSIONS.map((dimension) => dimension.label)).toEqual([
      '推荐',
      '因素',
      '走势',
      '知名度',
      '类型',
      '位置'
    ])

    const multiDimensions = DECISION_DIMENSIONS.filter(
      (dimension) => dimension.multiple
    )

    expect(multiDimensions).toHaveLength(1)
    expect(multiDimensions[0].key).toBe('recommends')
    expect(multiDimensions[0].options).toEqual(['大V推荐', '小V推荐'])
  })

  it('returns null when nothing is selected', () => {
    expect(evaluateDecision2(createEmptySelection())).toBeNull()
    expect(evaluateDecision2({})).toBeNull()
  })

  it('judges from a single factor', () => {
    expect(
      evaluateDecision2({ ...createEmptySelection(), position: '低位' })
    ).toMatchObject({ level: '轻仓', units: 2, score: 2 })

    expect(
      evaluateDecision2({ ...createEmptySelection(), factor: '热点' })
    ).toMatchObject({ level: '别买', units: 0, score: 0 })
  })

  it('stacks both recommendations', () => {
    const result = evaluateDecision2({
      ...createEmptySelection(),
      recommends: ['大V推荐', '小V推荐'],
      type: '蓝筹',
      position: '低位'
    })

    expect(result).toMatchObject({ level: '超重仓', units: 8, score: 10 })
    expect(result.description).toBe(
      '大V推荐、小V推荐 + 蓝筹 + 低位：建议超重仓。'
    )
  })

  it('scores cycle the same as growth', () => {
    const growth = evaluateDecision2({
      ...createEmptySelection(),
      type: '成长',
      position: '低位'
    })
    const cycle = evaluateDecision2({
      ...createEmptySelection(),
      type: '周期',
      position: '低位'
    })

    expect(cycle.score).toBe(growth.score)
    expect(cycle.score).toBe(2)
    expect(cycle.level).toBe('轻仓')
  })

  it('denies high position with hot factor or pullback trend', () => {
    const hot = evaluateDecision2({
      ...createEmptySelection(),
      recommends: ['大V推荐'],
      factor: '热点',
      type: '蓝筹',
      position: '高位'
    })

    expect(hot).toMatchObject({ level: '别买', units: 0, score: null })
    expect(hot.description).toBe('高位追热点/抢回调，接盘风险大，不碰。')

    expect(
      evaluateDecision2({
        ...createEmptySelection(),
        trend: '回调',
        position: '高位'
      })
    ).toMatchObject({ level: '别买', units: 0, score: null })

    expect(
      evaluateDecision2({
        ...createEmptySelection(),
        factor: '热点',
        trend: '回调',
        position: '高位'
      })
    ).toMatchObject({ level: '别买', units: 0, score: null })
  })

  it('does not veto when high position is not selected', () => {
    const result = evaluateDecision2({
      ...createEmptySelection(),
      factor: '热点',
      trend: '回调'
    })

    expect(result.score).toBe(2)
    expect(result.level).toBe('轻仓')
  })

  it('covers score boundaries', () => {
    const select = (patch) =>
      evaluateDecision2({
        ...createEmptySelection(),
        ...patch
      })

    expect(select({ type: '成长' }).level).toBe('别买')
    expect(
      select({ recommends: ['大V推荐'], fame: '二线', position: '高位' }).level
    ).toBe('观察')
    expect(select({ position: '低位' }).level).toBe('轻仓')
    expect(select({ recommends: ['大V推荐'] }).level).toBe('正常')
    expect(select({ recommends: ['大V推荐'], position: '低位' }).level).toBe(
      '重仓'
    )
    expect(
      select({ recommends: ['大V推荐'], fame: '龙头', position: '低位' }).level
    ).toBe('超重仓')
  })

  it('covers score 7 boundary', () => {
    const result = evaluateDecision2({
      ...createEmptySelection(),
      recommends: ['大V推荐'],
      fame: '二线',
      type: '蓝筹',
      position: '低位'
    })

    expect(result.score).toBe(7)
    expect(result.level).toBe('超重仓')
  })

  it('uses the fixed no-buy description when score says so', () => {
    const result = evaluateDecision2({
      ...createEmptySelection(),
      factor: '热点'
    })

    expect(result.description).toBe('热点：这笔不划算，先不动。')
  })

  it('scores 低估 zero and never triggers the high-position veto', () => {
    const factorOptions = DECISION_DIMENSIONS.find(
      (dimension) => dimension.key === 'factor'
    ).options
    expect(factorOptions).toEqual(['热点', '潜伏', '低估'])

    const alone = evaluateDecision2({
      ...createEmptySelection(),
      factor: '低估'
    })
    expect(alone).toMatchObject({ level: '别买', units: 0, score: 0 })
    expect(alone.description).toBe('低估：这笔不划算，先不动。')

    const highUndervalued = evaluateDecision2({
      ...createEmptySelection(),
      factor: '低估',
      position: '高位'
    })
    expect(highUndervalued).toMatchObject({
      level: '别买',
      units: 0,
      score: -2
    })
  })
})
