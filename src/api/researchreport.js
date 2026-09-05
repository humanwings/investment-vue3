import request from '@/utils/request'

export function getResearchReportList(query) {
  return request({
    url: '/research/reports',
    method: 'get',
    params: query
  })
}

export function getResearchReport(id) {
  return request({
    url: `/research/reports/${id}`,
    method: 'get'
  })
}

export function getResearchReportByStock(stockCode) {
  return request({
    url: `/research/reports/by-stock/${stockCode}`,
    method: 'get'
  })
}

export function importResearchReports(directory) {
  return request({
    url: '/research/reports/import',
    method: 'post',
    data: { directory }
  })
}

export function deleteResearchReport(id) {
  return request({
    url: `/research/reports/${id}`,
    method: 'delete'
  })
}
