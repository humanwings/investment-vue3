import request from '@/utils/request'
import { restfulFormat } from '@/utils'

export function getProfitValuationList(query) {
  return request({
    url: '/valuation/profit-discount',
    method: 'get',
    params: query
  })
}

export function updateProfitGrowthRate(companyId, data) {
  if (typeof companyId === 'object') {
    return request({
      url: '/company/updateGrowthRate',
      method: 'post',
      data: companyId
    })
  }

  return request({
    url: restfulFormat('/valuation/profit-discount/{id}/growth-rate', {
      id: companyId
    }),
    method: 'patch',
    data
  })
}

export function clearProfitGrowthRate(companyId, data = {}) {
  return request({
    url: restfulFormat('/valuation/profit-discount/{id}/growth-rate', {
      id: companyId
    }),
    method: 'delete',
    data
  })
}

export function updateIndustryProfitGrowthRate(data) {
  return request({
    url: '/valuation/profit-discount/industry-growth-rate',
    method: 'post',
    data
  })
}
