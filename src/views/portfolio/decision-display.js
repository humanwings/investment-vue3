/**
 * "买入判定"合并列展示：买入原因-股票种类-位置/时机-判定档位，
 * 非空段以 - 连接，全空显示 -。
 */
export function decisionText(row) {
  if (!row) return '-'
  const third = row.timing || row.pricePosition || ''
  const text = [row.buyReason, row.stockType, third, row.decisionLevel]
    .filter(Boolean)
    .join('-')
  return text || '-'
}
