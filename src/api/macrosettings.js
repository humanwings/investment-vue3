import request from '@/utils/request'

export function getMacroSettings() {
  return request({
    url: '/settings/macro/all',
    method: 'get'
  })
}

export function updateMacroSetting(data) {
  return request({
    url: '/settings/macro/update',
    method: 'post',
    data
  })
}
