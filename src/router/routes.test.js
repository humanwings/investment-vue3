import { describe, expect, it } from 'vitest'

import router from './index'
import { appRoutes } from './routes'

describe('router smoke test', () => {
  it.each([
    ['/login', 'Login'],
    ['/dashboard', 'Dashboard'],
    ['/companyvaluation/valuation/company', 'CompanyList'],
    ['/companyvaluation/valuation/company/1', 'CompanyDetail'],
    ['/companyvaluation/valuation/profit-discount', 'ProfitDiscountList'],
    ['/companyvaluation/valuation/dcf-v1', 'DcfValuationV1List'],
    ['/companyvaluation/valuation/dcf-v2', 'DcfValuationV2List'],
    ['/system-settings/data-sources', 'DataSources'],
    ['/grid-trading/strategy', 'GridStrategyList'],
    ['/grid-trading/records', 'GridTradeRecords'],
    ['/grid-trading/statistics', 'GridTradeStatistics'],
    ['/404', 'NotFound']
  ])(
    'resolves %s to %s',
    async (path, expectedName) => {
      const resolved = router.resolve(path)

      expect(resolved.name).toBe(expectedName)

      const componentLoader = resolved.matched.at(-1)?.components?.default

      expect(componentLoader).toBeTypeOf('function')

      const componentModule = await componentLoader()

      expect(componentModule.default).toBeTruthy()
    },
    15000
  )

  it('wires DCF routes through the shared valuation model config', () => {
    const dcfV1 = router.resolve('/companyvaluation/valuation/dcf-v1')
    const dcfV2 = router.resolve('/companyvaluation/valuation/dcf-v2')

    expect(dcfV1.matched.at(-1)?.props?.default).toMatchObject({
      modelCode: 'DCF_V1',
      modelVersion: 'DCF_V1_SIMPLE_FCFF',
      versionKey: 'v1'
    })
    expect(dcfV2.matched.at(-1)?.props?.default).toMatchObject({
      modelCode: 'DCF_V2',
      modelVersion: 'DCF_V2_STANDARD_FCFF',
      versionKey: 'v2'
    })
  })

  it('wires system settings data sources metadata', () => {
    const systemSettings = appRoutes.find(
      (route) => route.path === '/system-settings'
    )
    const dataSources = systemSettings?.children?.find(
      (route) => route.path === 'data-sources'
    )

    expect(systemSettings?.meta.title).toBe('系统设置')
    expect(dataSources?.meta.title).toBe('数据接口设置')
  })

  it('hides the add-strategy menu item but keeps the route reachable', () => {
    const gridTrading = appRoutes.find(
      (route) => route.path === '/grid-trading'
    )
    const addRoute = gridTrading?.children?.find(
      (route) => route.path === 'strategy/add'
    )

    expect(addRoute?.name).toBe('GridStrategyAdd')
    expect(addRoute?.meta?.hidden).toBe(true)
  })

  it('registers the decision buy check page', () => {
    const resolved = router.resolve('/decision/buy-check')

    expect(resolved.name).toBe('BuyDecision')

    const decisionGroup = appRoutes.find((route) => route.path === '/decision')

    expect(decisionGroup?.meta?.title).toBe('决策判定')
    expect(decisionGroup?.children?.[0]?.meta?.title).toBe('买入判定')
  })
})
