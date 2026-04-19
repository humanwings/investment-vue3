import { describe, expect, it } from 'vitest'

import getPageTitle from './get-page-title'

describe('getPageTitle', () => {
  it('returns the default title when page title is empty', () => {
    expect(getPageTitle()).toBe('investment-front-vue3')
  })

  it('prefixes the page title with the app title', () => {
    expect(getPageTitle('Dashboard')).toBe('Dashboard - investment-front-vue3')
  })
})
