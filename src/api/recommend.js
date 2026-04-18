import request from '@/utils/request'
import { restfulFormat } from '@/utils'

export function getRecommendRank(query) {
  return request({
    url: '/recommend/rank',
    method: 'get',
    params: query
  })
}

export function refreshRecommendRank(data) {
  return request({
    url: '/recommend/refresh',
    method: 'post',
    data
  })
}

export function getRecommendDetail(stockCode, query) {
  return request({
    url: restfulFormat('/recommend/rank/{stockCode}', { stockCode }),
    method: 'get',
    params: query
  })
}

export function getRecommendAuthors() {
  return request({
    url: '/recommend/author/all',
    method: 'get'
  })
}

export function saveRecommendAuthor(data) {
  return request({
    url: '/recommend/author/save',
    method: 'post',
    data
  })
}

export function getRecommendRawList(query) {
  return request({
    url: '/recommend/raw/all',
    method: 'get',
    params: query
  })
}

export function saveRecommendRaw(data) {
  return request({
    url: '/recommend/raw/save',
    method: 'post',
    data
  })
}

export function deleteRecommendRaw(recId) {
  return request({
    url: restfulFormat('/recommend/raw/{recId}', { recId }),
    method: 'delete'
  })
}

export function getRecommendRules() {
  return request({
    url: '/recommend/rule/all',
    method: 'get'
  })
}

export function getRecommendStockByCode(stockCode) {
  return request({
    url: restfulFormat('/recommend/stock/{stockCode}', { stockCode }),
    method: 'get'
  })
}

export function saveRecommendRule(data) {
  return request({
    url: '/recommend/rule/save',
    method: 'post',
    data
  })
}
