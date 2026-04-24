import request from '@/utils/request'
import { restfulFormat } from '@/utils'

export function getCompanyList(query) {
  return request({
    url: '/company/all',
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
