import request from '@/utils/request'

export function getStockMasterList(params) {
  return request({
    url: '/stock-master',
    method: 'get',
    params
  })
}

export function getStockMasterDetail(market, code) {
  return request({
    url: `/stock-master/${market}/${code}`,
    method: 'get'
  })
}

export function createStockMaster(data) {
  return request({
    url: '/stock-master',
    method: 'post',
    data
  })
}

export function updateStockMaster(market, code, data) {
  return request({
    url: `/stock-master/${market}/${code}`,
    method: 'put',
    data
  })
}

export function disableStockMaster(market, code) {
  return request({
    url: `/stock-master/${market}/${code}/disable`,
    method: 'post'
  })
}

export function enableStockMaster(market, code) {
  return request({
    url: `/stock-master/${market}/${code}/enable`,
    method: 'post'
  })
}
