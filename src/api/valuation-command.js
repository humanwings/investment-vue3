import request from '@/utils/request'

export function rebuildValuation(data) {
  return request({
    url: '/valuation/rebuild',
    method: 'post',
    data
  })
}

export function rebuildAllValuations(data = {}) {
  return request({
    url: '/valuation/rebuild-all',
    method: 'post',
    data
  })
}
