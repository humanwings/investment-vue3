import { afterEach, describe, expect, it } from 'vitest'

import {
  deleteResearchReport,
  getResearchReport,
  getResearchReportByStock,
  getResearchReportList,
  importResearchReports
} from './researchreport'
import { createHttpMock, ok } from '@/test/mocks/http'

describe('research report api', () => {
  const mock = createHttpMock()

  afterEach(() => {
    mock.reset()
  })

  it('requests the report list with query params', async () => {
    mock.onGet('/research/reports').reply(ok({ sum: 1, list: [], stats: {} }))

    const result = await getResearchReportList({
      keyword: '伊利',
      verdict: '买'
    })

    expect(result.data.sum).toBe(1)
    expect(mock.history.get[0].url).toBe('/research/reports')
    expect(mock.history.get[0].params).toEqual({
      keyword: '伊利',
      verdict: '买'
    })
  })

  it('requests a report detail by id', async () => {
    mock.onGet('/research/reports/3').reply(ok({ report: { reportId: 3 } }))

    const result = await getResearchReport(3)

    expect(result.data.report.reportId).toBe(3)
    expect(mock.history.get[0].url).toBe('/research/reports/3')
  })

  it('requests a report by stock code', async () => {
    mock
      .onGet('/research/reports/by-stock/600887')
      .reply(ok({ report: { stockCode: '600887' } }))

    const result = await getResearchReportByStock('600887')

    expect(result.data.report.stockCode).toBe('600887')
    expect(mock.history.get[0].url).toBe('/research/reports/by-stock/600887')
  })

  it('posts the import command with a directory', async () => {
    mock
      .onPost('/research/reports/import')
      .reply(ok({ result: { inserted: 1, updated: 0, skipped: 0 } }))

    const result = await importResearchReports('E:/finance/securities')

    expect(result.data.result.inserted).toBe(1)
    expect(mock.history.post[0].url).toBe('/research/reports/import')
    expect(JSON.parse(mock.history.post[0].data)).toEqual({
      directory: 'E:/finance/securities'
    })
  })

  it('deletes a report by id', async () => {
    mock.onDelete('/research/reports/5').reply(ok({}))

    await deleteResearchReport(5)

    expect(mock.history.delete[0].url).toBe('/research/reports/5')
  })
})
