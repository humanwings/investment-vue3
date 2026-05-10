import { describe, expect, it } from 'vitest'

import router from './index'

describe('router smoke test', () => {
  it.each([
    ['/login', 'Login'],
    ['/dashboard', 'Dashboard'],
    ['/companyvaluation/valuation/company', 'CompanyList'],
    ['/companyvaluation/valuation/company/1', 'CompanyDetail'],
    ['/companyvaluation/valuation/profit-discount', 'ProfitDiscountList'],
    ['/companyvaluation/valuation/dcf-v1', 'DcfValuationV1List'],
    ['/companyvaluation/valuation/dcf-v2', 'DcfValuationV2List'],
    ['/404', 'NotFound']
  ])('resolves %s to %s', async (path, expectedName) => {
    const resolved = router.resolve(path)

    expect(resolved.name).toBe(expectedName)

    const componentLoader = resolved.matched.at(-1)?.components?.default

    expect(componentLoader).toBeTypeOf('function')

    const componentModule = await componentLoader()

    expect(componentModule.default).toBeTruthy()
  })

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
})
