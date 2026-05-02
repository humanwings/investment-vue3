import request from '@/utils/request'
import { restfulFormat } from '@/utils'

export function getCompanyList(query) {
  return request({
    url: '/valuation/companies',
    method: 'get',
    params: query
  })
}

export function getCompanyOverview(id) {
  return request({
    url: restfulFormat('/company/{id}', { id }),
    method: 'get'
  })
}
