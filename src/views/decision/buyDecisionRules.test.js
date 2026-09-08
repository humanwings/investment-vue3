import { describe, expect, it } from 'vitest'

import {
  evaluateDecision,
  getBuyReasonOptions,
  getDecisionLevel,
  getStockTypeOptions,
  getThirdStep,
  mapScoreToLevel
} from './buyDecisionRules'

describe('buy decision rules', () => {
  it('exposes ordered buy reason options', () => {
    expect(getBuyReasonOptions().map((item) => item.value)).toEqual([
      'blueLong',
      'hotFollow',
      'pullback',
      'ambush',
      'bigV',
      'smallV',
      'tryIt',
      'crash'
    ])
  })

  it('filters stock type options by reason', () => {
    expect(getStockTypeOptions('hotFollow')).toEqual(['龙头', '二线杂毛'])
    expect(getStockTypeOptions('blueLong')).toEqual([])
  })

  it('switches the third step for crash timing', () => {
    expect(getThirdStep('crash')).toEqual({
      label: '时机',
      options: ['当日', '次日及以后']
    })
    expect(getThirdStep('bigV')).toEqual({
      label: '股价位置',
      options: ['高位', '中位', '低位']
    })
  })

  it('maps scores to levels', () => {
    expect(mapScoreToLevel(-2)).toBe('别买')
    expect(mapScoreToLevel(0)).toBe('别买')
    expect(mapScoreToLevel(1)).toBe('观察')
    expect(mapScoreToLevel(2)).toBe('轻仓')
    expect(mapScoreToLevel(4)).toBe('正常')
    expect(mapScoreToLevel(6)).toBe('重仓')
    expect(mapScoreToLevel(8)).toBe('超重仓')
  })

  it('scores normal reasons with position and stock type', () => {
    expect(
      evaluateDecision({ reason: 'bigV', stockType: '成长', position: '低位' })
    ).toMatchObject({ level: '重仓', units: 6 })

    expect(
      evaluateDecision({
        reason: 'smallV',
        stockType: '二线杂毛',
        position: '高位'
      })
    ).toMatchObject({ level: '别买', units: 0 })

    expect(
      evaluateDecision({
        reason: 'blueLong',
        stockType: null,
        position: '中位'
      })
    ).toMatchObject({ level: '轻仓', units: 2 })
  })

  it('blocks unsupported high positions', () => {
    expect(
      evaluateDecision({
        reason: 'pullback',
        stockType: '蓝筹',
        position: '高位'
      }).level
    ).toBe('别买')

    expect(
      evaluateDecision({
        reason: 'hotFollow',
        stockType: '龙头',
        position: '高位'
      }).level
    ).toBe('别买')
  })

  it('uses the crash timing table', () => {
    expect(
      evaluateDecision({ reason: 'crash', stockType: '蓝筹', position: '当日' })
        .level
    ).toBe('别买')

    expect(
      evaluateDecision({
        reason: 'crash',
        stockType: '蓝筹',
        position: '次日及以后'
      }).level
    ).toBe('正常')

    expect(
      evaluateDecision({
        reason: 'crash',
        stockType: '概念',
        position: '次日及以后'
      }).level
    ).toBe('别买')
  })

  it('uses the try-it position table', () => {
    expect(
      evaluateDecision({ reason: 'tryIt', stockType: '蓝筹', position: '高位' })
        .level
    ).toBe('别买')

    expect(
      evaluateDecision({ reason: 'tryIt', stockType: '成长', position: '中位' })
        .level
    ).toBe('观察')

    expect(
      evaluateDecision({ reason: 'tryIt', stockType: '概念', position: '低位' })
        .level
    ).toBe('轻仓')
  })

  it('uses the ambush table', () => {
    expect(
      evaluateDecision({
        reason: 'ambush',
        stockType: '蓝筹',
        position: '低位'
      }).level
    ).toBe('正常')

    expect(
      evaluateDecision({
        reason: 'ambush',
        stockType: '概念',
        position: '低位'
      }).level
    ).toBe('轻仓')

    expect(
      evaluateDecision({
        reason: 'ambush',
        stockType: '蓝筹',
        position: '中位'
      }).level
    ).toBe('轻仓')

    expect(
      evaluateDecision({
        reason: 'ambush',
        stockType: '成长',
        position: '中位'
      }).level
    ).toBe('观察')
  })
})

describe('getDecisionLevel', () => {
  it('computes level from full decision inputs', () => {
    expect(
      getDecisionLevel({ reason: 'bigV', stockType: '成长', position: '低位' })
    ).toBe('重仓')
    expect(getDecisionLevel({ reason: 'blueLong', position: '低位' })).toBe(
      '正常'
    )
    expect(
      getDecisionLevel({
        reason: 'crash',
        stockType: '蓝筹',
        timing: '次日及以后'
      })
    ).toBe('正常')
    expect(
      getDecisionLevel({ reason: 'crash', stockType: '蓝筹', timing: '当日' })
    ).toBe('别买')
  })

  it('returns null when required inputs are missing', () => {
    expect(getDecisionLevel({ reason: 'bigV', position: '低位' })).toBeNull()
    expect(getDecisionLevel({ reason: 'crash', stockType: '蓝筹' })).toBeNull()
    expect(getDecisionLevel({ reason: 'unknown' })).toBeNull()
    expect(getDecisionLevel({})).toBeNull()
  })
})
