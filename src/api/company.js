import request from '@/utils/request'
import { restfulFormat } from '@/utils'

export function getCompanyList(query) {
  return request({
    url: '/company/all',
    method: 'get',
    params: query
  })
}

export function getCompany(id) {
  return request({
    url: restfulFormat('/company/{id}', { id }),
    method: 'get'
  })
}

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
  return request({
    url: '/company/reValuateAll',
    method: 'post'
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

export function updateGrowthRate(data) {
  return request({
    url: '/company/updateGrowthRate',
    method: 'post',
    data
  })
}
