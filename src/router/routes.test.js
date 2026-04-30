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
    ['/companyvaluation/valuation/recommend', 'RecommendRank'],
    ['/404', 'NotFound']
  ])('resolves %s to %s', async (path, expectedName) => {
    const resolved = router.resolve(path)

    expect(resolved.name).toBe(expectedName)

    const componentLoader = resolved.matched.at(-1)?.components?.default

    expect(componentLoader).toBeTypeOf('function')

    const componentModule = await componentLoader()

    expect(componentModule.default).toBeTruthy()
  })
})
