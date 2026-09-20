/**
 * "买入原因"合并列展示：推荐-因素-走势-知名度-类型-位置（买入判定 II 六维）。
 * 多选推荐（逗号存储）在段内以顿号连接；非空段以 · 连接，全空显示 -。
 */
const DIM_FIELDS = [
  { key: 'reco', multi: true },
  { key: 'factor' },
  { key: 'trend' },
  { key: 'fame' },
  { key: 'stockType' },
  { key: 'pricePosition' }
]

export function decisionText(row) {
  if (!row) return '-'
  const parts = DIM_FIELDS.map(({ key, multi }) => {
    const v = row[key]
    if (!v) return ''
    return multi ? String(v).split(',').join('、') : v
  }).filter(Boolean)
  return parts.join('·') || '-'
}
