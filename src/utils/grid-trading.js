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

export function formatPrice(value, minDecimals = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—'
  }
  const num = Number(value)
  return num.toFixed(Math.max(minDecimals, priceDecimalsOf(num)))
}

export function priceDecimalsOf(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return 0
  }
  const text = String(num)
  const dotIndex = text.indexOf('.')
  if (dotIndex === -1) {
    return 0
  }
  return Math.min(text.length - dotIndex - 1, 6)
}

/**
 * 档位价格小数位数：跟随基准价，至少保留 2 位（与后端
 * GridTierCalculator.priceScale 保持一致）。
 */
export function tierPriceDecimals(basePrice) {
  return Math.max(2, priceDecimalsOf(basePrice))
}

/**
 * 十进制四舍五入（HALF_UP），与后端
 * BigDecimal.valueOf(value).setScale(n, HALF_UP) 保持一致。
 */
export function roundTo(value, decimals) {
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return num
  }
  const text = String(num)
  if (/[eE]/.test(text)) {
    return Number(num.toFixed(decimals))
  }
  const dotIndex = text.indexOf('.')
  const fracLen = dotIndex === -1 ? 0 : text.length - dotIndex - 1
  if (fracLen <= decimals) {
    return num
  }
  const digits = text.replace('.', '')
  const scaled = Math.round(Number(`${digits}e${decimals - fracLen}`))
  return Number(`${scaled}e${-decimals}`)
}

export function buildTierPreview(params) {
  const { basePrice, intervalPct, upTierCount, downTierCount } = params
  const decimals = tierPriceDecimals(basePrice)
  const rows = []
  for (let n = upTierCount; n >= 1; n -= 1) {
    const level = -n
    const price = roundTo(basePrice * (1 + intervalPct / 100) ** n, decimals)
    rows.push({ level, price, direction: 'SELL' })
  }
  rows.push({ level: 0, price: basePrice, direction: 'BASE' })
  for (let n = 1; n <= downTierCount; n += 1) {
    const level = n
    const price = roundTo(basePrice * (1 - (n * intervalPct) / 100), decimals)
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
