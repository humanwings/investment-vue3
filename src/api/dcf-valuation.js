import request from '@/utils/request'
import { restfulFormat } from '@/utils'

export function getDcfValuationList(query) {
  return request({
    url: '/valuation/dcf',
    method: 'get',
    params: query
  })
}

export function updateDcfV1ManualAssumptions(companyId, data) {
  return request({
    url: restfulFormat('/valuation/dcf/v1/{id}/manual-assumptions', {
      id: companyId
    }),
    method: 'patch',
    data
  })
}

export function clearDcfV1ManualAssumptions(companyId, data) {
  return request({
    url: restfulFormat('/valuation/dcf/v1/{id}/manual-assumptions', {
      id: companyId
    }),
    method: 'delete',
    data
  })
}

export function updateIndustryDcfV1ManualAssumptions(data) {
  return request({
    url: '/valuation/dcf/v1/industry-manual-assumptions',
    method: 'post',
    data
  })
}
