import request from '@/utils/request'

export function getDcfValuationList(query) {
  return request({
    url: '/valuation/dcf',
    method: 'get',
    params: query
  })
}
