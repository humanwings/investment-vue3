import { describe, expect, it } from 'vitest'

import router from './index'

describe('router smoke test', () => {
  it.each([
    ['/login', 'Login'],
    ['/dashboard', 'Dashboard'],
    ['/companyvaluation/valuation/company', 'CompanyList'],
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
