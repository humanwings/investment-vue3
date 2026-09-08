/**
 * 已清仓一览的纯统计分析：汇总卡片 + 分布图数据 + 维度胜率/盈亏分析。
 * realizedPl 为空的记录不计入实现盈亏与胜率，但计入笔数与原因/买入原因分布。
 */
export const HOLD_DAY_BUCKETS = [
  { name: '≤10天', max: 10 },
  { name: '11~30天', max: 30 },
  { name: '31~90天', max: 90 },
  { name: '90天以上', max: Infinity }
]

export function summarizeCleared(rows, range) {
  const filtered = (rows || []).filter((r) => {
    if (!range || (!range[0] && !range[1])) return true
    const d = r.clearedDate || ''
    return (!range[0] || d >= range[0]) && (!range[1] || d <= range[1])
  })

  let realizedTotal = 0
  let decided = 0
  let wins = 0
  let holdDaysSum = 0
  let holdDaysCount = 0
  const reasonAcc = new Map()
  const buyReasonAcc = new Map()
  const plAcc = new Map()

  for (const r of filtered) {
    const reason = r.clearReason || ''
    if (reason) reasonAcc.set(reason, (reasonAcc.get(reason) || 0) + 1)
    const buyReason = r.buyReason || ''
    if (buyReason)
      buyReasonAcc.set(buyReason, (buyReasonAcc.get(buyReason) || 0) + 1)
    if (r.realizedPl != null) {
      realizedTotal += r.realizedPl
      decided += 1
      if (r.realizedPl > 0) wins += 1
      const date = r.clearedDate || ''
      plAcc.set(date, (plAcc.get(date) || 0) + r.realizedPl)
    }
    if (r.holdDays != null) {
      holdDaysSum += r.holdDays
      holdDaysCount += 1
    }
  }

  const pie = (acc) =>
    [...acc.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

  const byReason = breakdown(filtered, (r) => r.clearReason || '')
  const byBuyReason = breakdown(filtered, (r) => r.buyReason || '')
  const byStockType = breakdown(filtered, (r) => r.stockType || '')
  const byHoldDays = HOLD_DAY_BUCKETS.map((bucket) => {
    const bucketRows = filtered.filter((r) => inBucket(r.holdDays, bucket))
    return { name: bucket.name, ...aggregate(bucketRows) }
  }).filter((b) => b.count > 0)

  return {
    count: filtered.length,
    decided,
    realizedTotal: round(realizedTotal),
    winRate: decided > 0 ? wins / decided : null,
    avgHoldDays: holdDaysCount > 0 ? holdDaysSum / holdDaysCount : null,
    reasonPie: pie(reasonAcc),
    buyReasonPie: pie(buyReasonAcc),
    plByDate: [...plAcc.entries()]
      .map(([date, pl]) => ({ date, pl: round(pl) }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    byReason,
    byBuyReason,
    byStockType,
    byHoldDays
  }
}

function inBucket(days, bucket) {
  return days != null && days >= 0 && days <= bucket.max
}

/**
 * 按 keyOf 维度分组：每组统计笔数、已定盈亏笔数、胜率、平均/总实现盈亏。
 * 仅统计 realizedPl 非空的记录；组按总盈亏降序（盈利在前）。
 */
function breakdown(rows, keyOf) {
  const acc = new Map()
  for (const r of rows) {
    const key = keyOf(r)
    if (!key) continue
    if (!acc.has(key)) {
      acc.set(key, { name: key, count: 0, decided: 0, wins: 0, totalPl: 0 })
    }
    const g = acc.get(key)
    g.count += 1
    if (r.realizedPl != null) {
      g.decided += 1
      g.totalPl += r.realizedPl
      if (r.realizedPl > 0) g.wins += 1
    }
  }
  return [...acc.values()]
    .map((g) => ({
      ...g,
      totalPl: round(g.totalPl),
      winRate: g.decided > 0 ? g.wins / g.decided : null,
      avgPl: g.decided > 0 ? round(g.totalPl / g.decided) : null
    }))
    .sort((a, b) => b.totalPl - a.totalPl)
}

function aggregate(rows) {
  let decided = 0
  let wins = 0
  let totalPl = 0
  for (const r of rows) {
    if (r.realizedPl != null) {
      decided += 1
      totalPl += r.realizedPl
      if (r.realizedPl > 0) wins += 1
    }
  }
  return {
    count: rows.length,
    decided,
    wins,
    totalPl: round(totalPl),
    winRate: decided > 0 ? wins / decided : null,
    avgPl: decided > 0 ? round(totalPl / decided) : null
  }
}

function round(v) {
  return Math.round(v * 100) / 100
}
