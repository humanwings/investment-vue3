import request from '@/utils/request'
import { restfulFormat } from '@/utils'

export function getStrategyList(query) {
  return request({
    url: '/strategy',
    method: 'get',
    params: query
  })
}

export function getStrategy(id) {
  return request({
    url: restfulFormat('/strategy/{id}', { id }),
    method: 'get'
  })
}

export function createStrategy(data) {
  return request({
    url: '/strategy/add',
    method: 'post',
    data
  })
}

export function updateStrategy(data) {
  return request({
    url: '/strategy/update',
    method: 'post',
    data
  })
}

export function updateStrategyName(data) {
  return request({
    url: '/strategy/updateName',
    method: 'post',
    data
  })
}

export function deleteSelectedStrategies(data) {
  return request({
    url: '/strategy/deleteSelected',
    method: 'post',
    data
  })
}

export function deleteStrategy(id) {
  return request({
    url: restfulFormat('/strategy/{id}', { id }),
    method: 'delete'
  })
}

export function calculateStrategy(id) {
  return request({
    url: restfulFormat('/strategy/{id}', { id }),
    method: 'patch'
  })
}
