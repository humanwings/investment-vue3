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

  it('keeps DCF v2 active when entering company overview from DCF v2', () => {
    routeMock.query = {
      tab: 'dcf',
      dcfVersion: 'v2',
      from: 'dcf-v2'
    }

    const wrapper = shallowMount(AppSidebar)

    expect(wrapper.vm.activeMenu).toBe('/companyvaluation/valuation/dcf-v2')
  })

  it('includes the system settings data sources navigation item', () => {
    const wrapper = shallowMount(AppSidebar)
    const systemSettings = wrapper.vm.sidebarRoutes.find(
      (route) => route.path === '/system-settings'
    )
    const dataSources = systemSettings?.children?.find(
      (route) => route.path === 'data-sources'
    )

    expect(systemSettings?.meta.title).toBe('系统设置')
    expect(dataSources?.meta.title).toBe('数据接口设置')
  })

  it('renders system settings as a grouped menu with a visible child item', () => {
    const wrapper = shallowMount(AppSidebar)
    const systemSettings = wrapper.vm.sidebarRoutes.find(
      (route) => route.path === '/system-settings'
    )

    expect(wrapper.vm.hasVisibleSectionChildren(systemSettings)).toBe(true)
    expect(wrapper.vm.visibleSections(systemSettings)).toHaveLength(1)
    expect(wrapper.vm.visibleSections(systemSettings)[0].meta.title).toBe(
      '数据接口设置'
    )
  })
})
