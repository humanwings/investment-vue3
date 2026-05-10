import request from '@/utils/request'
import { restfulFormat } from '@/utils'
import { rebuildAllValuations } from './valuation-command'

export function addCompany(data) {
  return request({
    url: '/company/add',
    method: 'post',
    data
  })
}

export function deleteCompany(id) {
  return request({
    url: restfulFormat('/company/{id}', { id }),
    method: 'delete'
  })
}

export function updatePrice(id) {
  return request({
    url: restfulFormat('/company/{id}', { id }),
    method: 'patch'
  })
}

export function reValuateAll() {
  return rebuildAllValuations({
    modelCodes: ['PROFIT_DISCOUNT', 'DCF_V1', 'DCF_V2'],
    scenarioKey: 'BASE'
  })
}

export function updatePriceAll() {
  return request({
    url: '/company/updatePriceAll',
    method: 'post'
  })
}

export function updateReport(data) {
  return request({
    url: '/company/updateReport',
    method: 'post',
    data
  })
}
