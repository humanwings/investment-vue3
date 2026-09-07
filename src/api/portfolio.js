import request from '@/utils/request'

export function previewPortfolio(file) {
  const form = new FormData()
  form.append('file', file)
  return request({
    url: '/portfolio/import/preview',
    method: 'post',
    data: form,
    timeout: 30000
  })
}

export function confirmImport(file, statsDate) {
  const form = new FormData()
  form.append('file', file)
  if (statsDate) form.append('statsDate', statsDate)
  return request({
    url: '/portfolio/import/confirm',
    method: 'post',
    data: form,
    timeout: 30000
  })
}

export function getPortfolioLatest() {
  return request({ url: '/portfolio/latest', method: 'get' })
}

export function getPortfolioSnapshots() {
  return request({ url: '/portfolio/snapshots', method: 'get' })
}

export function getPortfolioSnapshot(statsDate) {
  return request({ url: `/portfolio/snapshot/${statsDate}`, method: 'get' })
}

export function updatePortfolioArchive(stockCode, data) {
  return request({
    url: `/portfolio/archive/${stockCode}`,
    method: 'put',
    data
  })
}

export function getPortfolioCleared() {
  return request({ url: '/portfolio/cleared', method: 'get' })
}

export function updatePortfolioCleared(id, data) {
  return request({ url: `/portfolio/cleared/${id}`, method: 'put', data })
}

export function getPortfolioStats(params) {
  return request({ url: '/portfolio/stats', method: 'get', params })
}
export function saveAllPortfolio(items) {
  return request({
    url: '/portfolio/archive/save-all',
    method: 'post',
    data: items
  })
}

export function deletePortfolioSnapshot(statsDate) {
  return request({ url: `/portfolio/snapshot/${statsDate}`, method: 'delete' })
}

export function deletePortfolioCleared(id) {
  return request({ url: `/portfolio/cleared/${id}`, method: 'delete' })
}
