import request from '@/utils/request'

export function getDataSourceSettings() {
  return request({
    url: '/system-settings/data-sources',
    method: 'get'
  })
}

export function updateDataSourceSettings(data) {
  return request({
    url: '/system-settings/data-sources',
    method: 'put',
    data
  })
}

export function testDataSource(data) {
  return request({
    url: '/system-settings/data-sources/test',
    method: 'post',
    data
  })
}

export function assessDataSources() {
  return request({
    url: '/system-settings/data-sources/assess',
    method: 'post'
  })
}
