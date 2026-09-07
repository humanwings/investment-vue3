import request from '@/utils/request'

export function searchMasterData(keyword) {
  return request({
    url: '/master-data/search',
    method: 'get',
    params: { keyword }
  })
}

export function getMasterReference(params) {
  return request({
    url: '/master-data/reference',
    method: 'get',
    params
  })
}

export function getMasterSwIndustries() {
  return request({
    url: '/master-data/sw-industries',
    method: 'get'
  })
}
