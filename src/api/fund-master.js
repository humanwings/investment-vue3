import request from '@/utils/request'

export function getFundMasterList(params) {
  return request({
    url: '/fund-master',
    method: 'get',
    params
  })
}

export function createFundMaster(data) {
  return request({
    url: '/fund-master',
    method: 'post',
    data
  })
}

export function updateFundMaster(code, data) {
  return request({
    url: `/fund-master/${code}`,
    method: 'put',
    data
  })
}

export function disableFundMaster(code) {
  return request({
    url: `/fund-master/${code}/disable`,
    method: 'post'
  })
}

export function enableFundMaster(code) {
  return request({
    url: `/fund-master/${code}/enable`,
    method: 'post'
  })
}

export function getFundSize(code) {
  return request({
    url: `/fund-master/size/${code}`,
    method: 'get'
  })
}
