import { LEVELS, mapScoreToLevel } from './buyDecisionRules'

export const DECISION_DIMENSIONS = [
  {
    key: 'recommends',
    label: '推荐',
    multiple: true,
    options: ['大V推荐', '小V推荐']
  },
  {
    key: 'factor',
    label: '因素',
    multiple: false,
    options: ['热点', '潜伏', '低估']
  },
  {
    key: 'trend',
    label: '走势',
    multiple: false,
    options: ['暴跌', '回调']
  },
  {
    key: 'fame',
    label: '知名度',
    multiple: false,
    options: ['龙头', '二线', '杂毛']
  },
  {
    key: 'type',
    label: '类型',
    multiple: false,
    options: ['蓝筹', '成长', '周期', '题材']
  },
  {
    key: 'position',
    label: '位置',
    multiple: false,
    options: ['高位', '中位', '低位']
  }
]

const RECOMMEND_SCORE = {
  大V推荐: 4,
  小V推荐: 2
}

const SINGLE_SCORES = {
  factor: { 热点: 0, 潜伏: 0, 低估: 0 },
  trend: { 暴跌: 0, 回调: 2 },
  fame: { 龙头: 2, 二线: -1, 杂毛: -3 },
  type: { 蓝筹: 2, 成长: 0, 周期: 0, 题材: -2 },
  position: { 高位: -2, 中位: 0, 低位: 2 }
}

const VETO_DESCRIPTION = '高位追热点/抢回调，接盘风险大，不碰。'

export function createEmptySelection() {
  const selection = { recommends: [] }

  for (const { key, multiple } of DECISION_DIMENSIONS) {
    if (!multiple) {
      selection[key] = ''
    }
  }

  return selection
}

function hasSelection(selection) {
  return DECISION_DIMENSIONS.some(({ key, multiple }) =>
    multiple ? selection[key].length > 0 : Boolean(selection[key])
  )
}

function computeScore(selection) {
  let score = selection.recommends.reduce(
    (sum, value) => sum + (RECOMMEND_SCORE[value] ?? 0),
    0
  )

  for (const [key, scoreMap] of Object.entries(SINGLE_SCORES)) {
    score += scoreMap[selection[key]] ?? 0
  }

  return score
}

function isHighPositionVeto(selection) {
  return (
    selection.position === '高位' &&
    (selection.factor === '热点' || selection.trend === '回调')
  )
}

function describeSelection(selection) {
  return DECISION_DIMENSIONS.flatMap(({ key, multiple }) => {
    if (multiple) {
      return selection[key].length ? [selection[key].join('、')] : []
    }

    return selection[key] ? [selection[key]] : []
  }).join(' + ')
}

export function evaluateDecision2(selection) {
  const normalized = { ...createEmptySelection(), ...selection }

  if (!hasSelection(normalized)) {
    return null
  }

  if (isHighPositionVeto(normalized)) {
    return {
      level: '别买',
      units: LEVELS.别买,
      score: null,
      description: VETO_DESCRIPTION
    }
  }

  const score = computeScore(normalized)
  const level = mapScoreToLevel(score)
  const prefix = describeSelection(normalized)

  return {
    level,
    units: LEVELS[level],
    score,
    description:
      level === '别买'
        ? `${prefix}：这笔不划算，先不动。`
        : `${prefix}：建议${level}。`
  }
}
