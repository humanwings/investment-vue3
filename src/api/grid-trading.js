import request from '@/utils/request'
import { restfulFormat } from '@/utils'

export function getGridStrategyList() {
  return request({
    url: '/grid-trading/strategy',
    method: 'get'
  })
}

export function getGridStrategy(id) {
  return request({
    url: restfulFormat('/grid-trading/strategy/{id}', { id }),
    method: 'get'
  })
}

export function createGridStrategy(data) {
  return request({
    url: '/grid-trading/strategy',
    method: 'post',
    data
  })
}

export function updateGridStrategy(id, data) {
  return request({
    url: restfulFormat('/grid-trading/strategy/{id}', { id }),
    method: 'put',
    data
  })
}

export function deleteGridStrategy(id) {
  return request({
    url: restfulFormat('/grid-trading/strategy/{id}', { id }),
    method: 'delete'
  })
}

export function activateGridStrategy(id) {
  return request({
    url: restfulFormat('/grid-trading/strategy/{id}/activate', { id }),
    method: 'post'
  })
}

export function pauseGridStrategy(id) {
  return request({
    url: restfulFormat('/grid-trading/strategy/{id}/pause', { id }),
    method: 'post'
  })
}

export function resumeGridStrategy(id) {
  return request({
    url: restfulFormat('/grid-trading/strategy/{id}/resume', { id }),
    method: 'post'
  })
}

export function endGridStrategy(id) {
  return request({
    url: restfulFormat('/grid-trading/strategy/{id}/end', { id }),
    method: 'post'
  })
}

export function refreshGridPrice(id) {
  return request({
    url: restfulFormat('/grid-trading/strategy/{id}/refresh-price', { id }),
    method: 'post'
  })
}

export function refreshAllPrices() {
  return request({
    url: '/grid-trading/refresh-all-prices',
    method: 'post'
  })
}

export function setManualPrice(id, price) {
  return request({
    url: restfulFormat('/grid-trading/strategy/{id}/manual-price', { id }),
    method: 'post',
    data: { price }
  })
}

export function searchStocks(keyword) {
  return request({
    url: '/grid-trading/stock-search',
    method: 'get',
    params: { keyword }
  })
}

export function confirmHint(hintId, data) {
  return request({
    url: restfulFormat('/grid-trading/hint/{id}/confirm', { id: hintId }),
    method: 'post',
    data
  })
}

export function ignoreHint(hintId) {
  return request({
    url: restfulFormat('/grid-trading/hint/{id}/ignore', { id: hintId }),
    method: 'post'
  })
}

export function recordManualTrade(id, data) {
  return request({
    url: restfulFormat('/grid-trading/strategy/{id}/manual-trade', { id }),
    method: 'post',
    data
  })
}
