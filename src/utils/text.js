export function truncateText(str, max = 10) {
  const s = str == null ? '' : String(str)
  return s.length > max ? s.slice(0, max) + '...' : s
}
