/**
 * 已清仓一览的分页/筛选纯逻辑：列头筛选在分页切片之前应用于全量数据，
 * 保证"筛选 + 分页"结果正确（el-table 内置筛选只作用于当前页数据）。
 */
export function applyClearedFilters(rows, filters) {
  const decision = (filters && filters.decision) || []
  const bigV = (filters && filters.bigV) || []
  if (!decision.length && !bigV.length) {
    return rows
  }
  return rows.filter((r) => {
    const okDecision =
      !decision.length ||
      decision.some((value) => {
        const idx = value.indexOf(':')
        const kind = value.slice(0, idx)
        const v = value.slice(idx + 1)
        if (kind === 'reco') {
          return String(r.reco || '')
            .split(',')
            .includes(v)
        }
        return r.stockType === v
      })
    const okBigV = !bigV.length || bigV.includes(r.bigV)
    return okDecision && okBigV
  })
}

export function applyStockFilter(rows, stock) {
  if (!stock || !stock.code) {
    return rows
  }
  const code = String(stock.code)
  return rows.filter(
    (r) =>
      r.stockCode === code &&
      (!stock.market || !r.market || r.market === stock.market)
  )
}

export function paginateCleared(rows, page, pageSize) {
  const start = (page - 1) * pageSize
  return rows.slice(start, start + pageSize)
}
