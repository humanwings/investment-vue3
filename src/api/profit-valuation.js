import request from '@/utils/request'

export function getProfitValuationList(query) {
  return request({
    url: '/valuation/profit-discount',
    method: 'get',
    params: query
  })
}

export function updateProfitGrowthRate(data) {
  return request({
    url: '/company/updateGrowthRate',
    method: 'post',
    data
  })
}
