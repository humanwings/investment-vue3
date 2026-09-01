export function fmtMoney(value) {
  const n = Number(value)
  if (value === null || value === undefined || Number.isNaN(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 100000000) {
    return (n / 100000000).toFixed(2) + '亿'
  }
  if (abs >= 10000) {
    return (n / 10000).toFixed(2) + '万'
  }
  return n.toLocaleString('zh-CN')
}

export function fmtInt(value) {
  const n = Number(value)
  if (value === null || value === undefined || Number.isNaN(n)) return '—'
  return n.toLocaleString('zh-CN')
}
