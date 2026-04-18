export function formatPercent(num) {
  return num !== null && num !== undefined && !Number.isNaN(num) ? `${(num * 100).toFixed(2)}%` : ''
}

export function formatYi(num) {
  return num ? `${(num / 100000000).toFixed(2)}亿` : ''
}

export function formatWan(num) {
  return num ? `${(num / 10000).toFixed(2)}万` : ''
}

export function roundToDecimal(number, decimalPlaces) {
  const factor = 10 ** decimalPlaces
  return Math.round(number * factor) / factor
}

export function restfulFormat(path, replacements = {}) {
  return path.replace(/\{(\w+)\}/g, (_, key) => replacements[key] ?? '')
}
