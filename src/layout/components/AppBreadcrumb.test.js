import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AppBreadcrumb from './AppBreadcrumb.vue'

const { routeMock } = vi.hoisted(() => ({
  routeMock: {
    name: 'CompanyDetail',
    path: '/companyvaluation/valuation/company/1',
    fullPath:
      '/companyvaluation/valuation/company/1?tab=profit&from=profit-discount',
    params: {
      id: '1'
    },
    query: {
      tab: 'profit',
      from: 'profit-discount'
    },
    matched: [
      {
        path: '/companyvaluation',
        meta: {
          title: 'Company Valuation'
        }
      },
      {
        path: '/companyvaluation/valuation',
        meta: {
          title: '公司估值'
        }
      },
      {
        path: '/companyvaluation/valuation/company/:id',
        meta: {
          title: '公司总览',
          hidden: true
        }
      }
    ]
  }
}))

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')

  return {
    ...actual,
    useRoute: () => routeMock
  }
})

describe('AppBreadcrumb', () => {
  beforeEach(() => {
    routeMock.name = 'CompanyDetail'
    routeMock.fullPath =
      '/companyvaluation/valuation/company/1?tab=profit&from=profit-discount'
    routeMock.query = {
      tab: 'profit',
      from: 'profit-discount'
    }
  })

  it('keeps profit discount in the breadcrumb when entering company overview from profit discount', () => {
    const wrapper = mount(AppBreadcrumb, {
      global: {
        stubs: {
          'router-link': {
            props: ['to'],
            template: '<a><slot /></a>'
          }
        }
      }
    })

    const crumbs = wrapper.findAll('.crumb').map((item) => item.text())

    expect(crumbs).toEqual([
      'Company Valuation',
      '公司估值',
      '利润贴现一览',
      '公司总览'
    ])
  })

  it('keeps company list in the breadcrumb when entering company overview from company list', () => {
    routeMock.fullPath = '/companyvaluation/valuation/company/1'
    routeMock.query = {}

    const wrapper = mount(AppBreadcrumb, {
      global: {
        stubs: {
          'router-link': {
            props: ['to'],
            template: '<a><slot /></a>'
          }
        }
      }
    })

    const crumbs = wrapper.findAll('.crumb').map((item) => item.text())

    expect(crumbs).toEqual([
      'Company Valuation',
      '公司估值',
      '公司列表',
      '公司总览'
    ])
  })
})
