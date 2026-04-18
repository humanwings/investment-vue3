const stockArray = [
  ['OBSERVE_DECREASE', '观察期跌幅'],
  ['OBSERVE_AMPLITUDE', '观察期振幅'],
  ['PLUNGE_GAP', '暴跌期缺口数'],
  ['PLUNGE_DATES', '暴跌期天数'],
  ['PLUNGE_TERRACE', '暴跌期平台数'],
  ['PLUNGE_REASON', '暴跌原因'],
  ['PLUNGE_MAX', '暴跌期最大跌幅'],
  ['PLUNGE_SUM', '暴跌期总跌幅'],
  ['BASIS_PETTM', 'PE-TTM'],
  ['BASIS_PBWO', 'PB(不含上商誉)'],
  ['BASIS_SHAREHOLDERS', '股东人数'],
  ['BASIS_ECMCPSH', '股东平均自由流通市值'],
  ['BASIS_TYPE', '标的类型']
]

const buyArray = [
  ['BUY_TIME', '买入时机'],
  ['BUY_FLOAT', '买入价位浮动'],
  ['BUY_POSITION', '买入仓位'],
  ['BUY_DAILYMAX', '每日最大买入数']
]

const sellArray = [
  ['HOLD_DATES', '持股日数'],
  ['SELL_TIME', '卖出时机'],
  ['SELL_FLOAT', '卖出价位浮动'],
  ['SELL_STOP', '止盈止损']
]

export const tacticsArray = [
  ['SELECT', '选股策略', stockArray],
  ['BUY', '买入策略', buyArray],
  ['SELL', '卖出策略', sellArray]
]

export const tacticsOptions = [
  {
    value: tacticsArray[0][0],
    label: tacticsArray[0][1],
    children: stockArray.map(v => ({ value: v[0], label: v[1] }))
  },
  {
    value: tacticsArray[1][0],
    label: tacticsArray[1][1],
    children: buyArray.map(v => ({ value: v[0], label: v[1] }))
  },
  {
    value: tacticsArray[2][0],
    label: tacticsArray[2][1],
    children: sellArray.map(v => ({ value: v[0], label: v[1] }))
  }
]

export const tacticsMap = new Map([
  ...stockArray.map(v => [tacticsOptions[0].value + v[0], v[1]]),
  ...buyArray.map(v => [tacticsOptions[1].value + v[0], v[1]]),
  ...sellArray.map(v => [tacticsOptions[2].value + v[0], v[1]])
])

export const comparisonOptions = [
  { value: 'EQUAL', label: '= 等于' },
  { value: 'LESS', label: '< 小于' },
  { value: 'EQUAL_OR_LESS', label: '≤ 小于等于' },
  { value: 'GREATER', label: '> 大于' },
  { value: 'EQUAL_OR_GREATER', label: '≥ 大于等于' }
]

export const reasonOptions = [
  { value: 'REPORT', label: '财报不及预期' },
  { value: 'MORAL', label: '道德问题' },
  { value: 'ALL_SHORT', label: '行业短期利空' },
  { value: 'ALL_LONG', label: '行业长期利空' },
  { value: 'SELF_SHORT', label: '公司短期利空' },
  { value: 'SELF_LONG', label: '公司长期利空' },
  { value: 'MARKET', label: '大盘影响' },
  { value: 'UNKNOWN', label: '不明原因' }
]

export const nDateOptions = [
  { value: 'N', label: 'N日' },
  { value: 'N_1', label: 'N-1日' }
]

export const boolOptions = [
  { value: 'IS', label: '属于' },
  { value: 'IS_NOT', label: '不属于' }
]

export const buyTimeOptions = [
  { value: 'N1_START', label: 'N+1日早盘集合竞价' },
  { value: 'N_END', label: 'N日尾盘集合竞价' }
]

export const buyDateOptions = [
  { value: 'N1', label: '仅N+1日' },
  { value: 'N2', label: '持续两日' },
  { value: 'NM', label: '持续到判定期末' }
]

export const buyPosOptions = [
  { value: 'AVG', label: '固定金额' },
  { value: 'WEIGHT', label: '固定总额' }
]

export const sellTimeOptions = [
  { value: 'M1_START', label: '判定期次日早盘集合竞价' },
  { value: 'M_END', label: '判定期尾日尾盘集合竞价' }
]

export const sellStopOptions = [
  { value: 'IMMEDIATELY', label: '盘中即时' },
  { value: 'MORROW', label: '次日早盘集合竞价' }
]

export const listingStatusOptions = [
  { value: 'normally_listed', label: '正常' },
  { value: 'special_treatment', label: 'ST' },
  { value: 'delisting_risk_warning', label: '*ST' }
]

export const popularityOptions = [
  { value: 'HIGH', label: '高' },
  { value: 'MIDDLE', label: '中' },
  { value: 'LOW', label: '低' }
]

export const trendOptions = [
  { value: '㇈', label: '㇈' },
  { value: 'ɻ', label: 'ɻ' },
  { value: 'ɳ', label: 'ɳ' },
  { value: '⺇', label: '⺇' },
  { value: '⋀', label: '⋀' },
  { value: '⇲', label: '⇲' },
  { value: 'OTHERS', label: 'OTHERS' }
]
