export function tierLabel(level) {
  if (level === 0) return '基准档'
  return `${level > 0 ? '+' : ''}${level} 档`
}

export function defaultValuation(level) {
  if (level === 0 || Math.abs(level) <= 2) return '合理'
  return level < 0 ? '高估' : '低估'
}

export function valuationTagType(valuation) {
  if (valuation === '高估') return 'danger'
  if (valuation === '低估') return 'success'
  return 'primary'
}

export function valuationBarClass(valuation) {
  if (valuation === '高估') return 'bar-high'
  if (valuation === '低估') return 'bar-low'
  return 'bar-fair'
}

export function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—'
  }
  return Number(value).toLocaleString('zh-CN')
}

export function formatPrice(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—'
  }
  return Number(value).toFixed(2)
}

export function buildTierPreview(params) {
  const { basePrice, intervalPct, upTierCount, downTierCount } = params
  const rows = []
  for (let n = upTierCount; n >= 1; n -= 1) {
    const level = -n
    const price = round2(basePrice * (1 + intervalPct / 100) ** n)
    rows.push({ level, price, direction: 'SELL' })
  }
  rows.push({ level: 0, price: basePrice, direction: 'BASE' })
  for (let n = 1; n <= downTierCount; n += 1) {
    const level = n
    const price = round2(basePrice * (1 - (n * intervalPct) / 100))
    rows.push({ level, price, direction: 'BUY' })
  }
  return rows
}

/**
 * 上方档加仓数量 = 减仓序列镜像反转（非对称网格默认生成规则）。
 *
 * @param {number[]} sellQtys 上方档减仓数量，按离基准档由近到远排序（level -1、-2、…）
 * @returns {number[]} 同序的加仓数量：第 k 档加仓 = 第 m+1-k 档减仓（m 为最深一个减仓数量 > 0
 *   的档位序号），更深档为 0；保证减仓合计 = 加仓合计
 */
export function mirrorUpBuyQty(sellQtys) {
  let deepestActive = 0
  sellQtys.forEach((qty, index) => {
    if ((Number(qty) || 0) > 0) deepestActive = index + 1
  })
  return sellQtys.map((_, index) =>
    index < deepestActive ? sellQtys[deepestActive - 1 - index] : 0
  )
}

function round2(value) {
  return Math.round(value * 100) / 100
}
