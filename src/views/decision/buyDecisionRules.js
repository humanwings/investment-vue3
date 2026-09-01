export const BUY_REASONS = {
  blueLong: {
    label: '蓝筹(长期持有)',
    base: 2,
    types: null,
    positions: ['高位', '中位', '低位'],
    noType: true
  },
  hotFollow: {
    label: '追热点 / 跟风',
    base: 0,
    types: ['龙头', '二线杂毛'],
    positions: ['高位', '中位'],
    denyHigh: true
  },
  pullback: {
    label: '回调抄底',
    base: 2,
    types: ['蓝筹', '成长', '概念'],
    positions: ['高位', '中位', '低位'],
    denyHigh: true
  },
  ambush: {
    label: '潜伏(中期)',
    base: 0,
    types: ['蓝筹', '成长', '概念'],
    positions: ['高位', '中位', '低位'],
    special: true
  },
  bigV: {
    label: '大V推荐',
    base: 4,
    types: ['蓝筹', '成长', '概念'],
    positions: ['高位', '中位', '低位']
  },
  smallV: {
    label: '小V推荐',
    base: 2,
    types: ['蓝筹', '成长', '概念'],
    positions: ['高位', '中位', '低位']
  },
  tryIt: {
    label: '就是想买点试试',
    base: -2,
    types: ['蓝筹', '成长', '概念'],
    positions: ['高位', '中位', '低位'],
    special: true
  },
  crash: {
    label: '暴跌抄底',
    base: 0,
    types: ['蓝筹', '成长', '概念'],
    timing: true
  }
}

export const POSITION_SCORE = {
  高位: -2,
  中位: 0,
  低位: 2
}

export const TYPE_SCORE = {
  蓝筹: 2,
  龙头: 2,
  成长: 0,
  概念: -2,
  二线杂毛: -3
}

export const LEVELS = {
  别买: 0,
  观察: 1,
  轻仓: 2,
  正常: 4,
  重仓: 6,
  超重仓: 8
}

const REASON_KEYS = Object.keys(BUY_REASONS)

export function getBuyReasonOptions() {
  return REASON_KEYS.map((value) => ({
    value,
    label: BUY_REASONS[value].label
  }))
}

export function getStockTypeOptions(reasonKey) {
  const reason = BUY_REASONS[reasonKey]

  if (!reason || reason.noType) {
    return []
  }

  return reason.types || []
}

export function getThirdStep(reasonKey) {
  const reason = BUY_REASONS[reasonKey]

  if (!reason) {
    return { label: '股价位置', options: [] }
  }

  if (reason.timing) {
    return { label: '时机', options: ['当日', '次日及以后'] }
  }

  return { label: '股价位置', options: reason.positions || [] }
}

export function mapScoreToLevel(score) {
  if (score <= 0) return '别买'
  if (score === 1) return '观察'
  if (score === 2) return '轻仓'
  if (score <= 4) return '正常'
  if (score <= 6) return '重仓'

  return '超重仓'
}

export function evaluateDecision({ reason, stockType, position }) {
  const reasonConfig = BUY_REASONS[reason]

  if (!reasonConfig) {
    throw new Error(`未知买入原因: ${reason}`)
  }

  if (reasonConfig.timing) {
    if (position === '当日') {
      return buildResult('别买', '暴跌当天先看戏，别急着伸手接。')
    }

    if (stockType === '蓝筹') {
      return buildResult('正常', '暴跌后次日补跌概率下降，蓝筹可分批进入。')
    }

    return buildResult('别买', '暴跌后接成长/概念风险仍高，先别买。')
  }

  if (reason === 'tryIt') {
    if (position === '高位') {
      return buildResult('别买', '高位试水，容易站岗，先别买。')
    }

    if (position === '中位') {
      return buildResult('观察', '中位，买 1 万观察试试。')
    }

    return buildResult('轻仓', '低位，轻仓 2 万试试。')
  }

  if (reason === 'ambush') {
    if (position === '高位') {
      return buildResult('别买', '潜伏在高位，等回调再说。')
    }

    if (position === '低位') {
      if (stockType === '蓝筹') {
        return buildResult('正常', '低位蓝筹适合中期潜伏。')
      }

      return buildResult('轻仓', '低位成长/概念，轻仓潜伏。')
    }

    if (stockType === '蓝筹') {
      return buildResult('轻仓', '中位蓝筹，轻仓试水。')
    }

    return buildResult('观察', '中位成长/概念，先观察。')
  }

  if (reasonConfig.denyHigh && position === '高位') {
    return buildResult(
      '别买',
      reason === 'pullback'
        ? '高位回调最容易接到半空中，不碰。'
        : '热点追在高位，别当接盘侠。'
    )
  }

  const typeScore = reasonConfig.noType ? 0 : (TYPE_SCORE[stockType] ?? 0)
  const score = reasonConfig.base + POSITION_SCORE[position] + typeScore
  const level = mapScoreToLevel(score)

  return buildResult(
    level,
    describeDecision(reason, stockType, position, level)
  )
}

function buildResult(level, description) {
  return {
    level,
    units: LEVELS[level],
    description
  }
}

function describeDecision(reasonKey, stockType, position, level) {
  const reason = BUY_REASONS[reasonKey]
  const typePart = reason.noType ? '' : ` + ${stockType}`
  const prefix = `${reason.label}${typePart} + ${position}`

  if (level === '别买') {
    return `${prefix}：这笔不划算，先不动。`
  }

  return `${prefix}：建议${level}。`
}
