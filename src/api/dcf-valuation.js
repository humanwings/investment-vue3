import request from '@/utils/request'
import { restfulFormat } from '@/utils'

export function getDcfValuationList(query) {
  return request({
    url: '/valuation/dcf',
    method: 'get',
    params: query
  })
}

export function refreshDcfV2(companyId) {
  return request({
    url: '/valuation/rebuild',
    method: 'post',
    data: {
      companyId,
      modelCodes: ['DCF_V2'],
      scenarioKey: 'BASE'
    }
  })
}

export function refreshAllDcfV2() {
  return request({
    url: '/valuation/rebuild-all',
    method: 'post',
    data: {
      modelCodes: ['DCF_V2'],
      scenarioKey: 'BASE'
    }
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
