import request from '@/utils/request'

export function getIndustrySettings() {
  return request({
    url: '/settings/industry/all',
    method: 'get'
  })
}

export function saveAllIndustrySettings(data) {
  return request({
    url: '/settings/industry/saveAll',
    method: 'post',
    data
  })
}
