import { shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AppSidebar from './AppSidebar.vue'

const { routeMock, appStoreMock } = vi.hoisted(() => ({
  routeMock: {
    name: 'CompanyDetail',
    path: '/companyvaluation/valuation/company/1',
    meta: {
      activeMenu: '/companyvaluation/valuation/company'
    },
    query: {
      tab: 'profit',
      from: 'profit-discount'
    }
  },
  appStoreMock: {
    showMobileSidebar: false,
    showDesktopLabel: true,
    isMobile: false,
    closeMobileSidebar: vi.fn(),
    toggleNavigation: vi.fn()
  }
}))

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')

  return {
    ...actual,
    useRoute: () => routeMock
  }
})

vi.mock('@/stores/app', () => ({
  useAppStore: () => appStoreMock
}))

describe('AppSidebar', () => {
  beforeEach(() => {
    routeMock.name = 'CompanyDetail'
    routeMock.path = '/companyvaluation/valuation/company/1'
    routeMock.meta = {
      activeMenu: '/companyvaluation/valuation/company'
    }
    routeMock.query = {
      tab: 'profit',
      from: 'profit-discount'
    }
  })

  it('keeps profit discount active when entering company overview from profit discount', () => {
    const wrapper = shallowMount(AppSidebar)

    expect(wrapper.vm.activeMenu).toBe(
      '/companyvaluation/valuation/profit-discount'
    )
  })
})
