import { Coin, TrendCharts } from '@element-plus/icons-vue'

import Layout from '@/layout/index.vue'
import { VALUATION_MODEL_CONFIGS } from '@/views/valuation/valuation-model-config'

export const appRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: {
      hidden: true,
      title: 'Login'
    }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    meta: {
      title: 'Dashboard'
    },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: {
          title: 'Dashboard'
        }
      }
    ]
  },
  {
    path: '/barginhunting',
    component: Layout,
    redirect: '/barginhunting/analyte/waitlist',
    meta: {
      title: 'Bargin Hunting',
      icon: TrendCharts
    },
    children: [
      {
        path: 'analyte',
        name: 'AnalyteRoot',
        component: () => import('@/views/placeholder/section.vue'),
        redirect: '/barginhunting/analyte/waitlist',
        meta: {
          title: 'Analyte'
        },
        children: [
          {
            path: 'waitlist',
            name: 'AnalyteWaitList',
            component: () => import('@/views/analyte/waitlist.vue'),
            meta: {
              title: 'Wait List'
            }
          },
          {
            path: 'donelist',
            name: 'AnalyteDoneList',
            component: () => import('@/views/analyte/donelist.vue'),
            meta: {
              title: 'Done List'
            }
          },
          {
            path: 'verification/:id',
            name: 'VerificationById',
            component: () => import('@/views/analyte/verification.vue'),
            meta: {
              hidden: true,
              title: 'Verification Detail',
              activeMenu: '/barginhunting/analyte/waitlist'
            }
          },
          {
            path: 'verification/compare/:idOne/:idTwo',
            name: 'VerificationCompare',
            component: () =>
              import('@/views/analyte/verificationcomparison.vue'),
            meta: {
              hidden: true,
              title: 'Verification Compare',
              activeMenu: '/barginhunting/analyte/waitlist'
            }
          }
        ]
      },
      {
        path: 'strategy',
        name: 'StrategyRoot',
        component: () => import('@/views/placeholder/section.vue'),
        redirect: '/barginhunting/strategy/strategylist',
        meta: {
          title: 'Strategy'
        },
        children: [
          {
            path: 'strategylist',
            name: 'StrategyList',
            component: () => import('@/views/strategy/strategylist.vue'),
            meta: {
              title: 'Strategy List'
            }
          },
          {
            path: 'strategyadd',
            name: 'StrategyAdd',
            component: () => import('@/views/strategy/strategyedit.vue'),
            meta: {
              title: 'Add Strategy'
            }
          },
          {
            path: 'strategyedit/:id',
            name: 'StrategyEdit',
            component: () => import('@/views/strategy/strategyedit.vue'),
            meta: {
              hidden: true,
              title: 'Edit Strategy',
              activeMenu: '/barginhunting/strategy/strategylist'
            }
          }
        ]
      }
    ]
  },
  {
    path: '/companyvaluation',
    component: Layout,
    redirect: '/companyvaluation/valuation/company',
    meta: {
      title: 'Company Valuation',
      icon: Coin
    },
    children: [
      {
        path: 'valuation',
        name: 'ValuationRoot',
        component: () => import('@/views/placeholder/section.vue'),
        redirect: '/companyvaluation/valuation/company',
        meta: {
          title: 'Valuation'
        },
        children: [
          {
            path: 'company',
            name: 'CompanyList',
            component: () => import('@/views/valuation/companylist.vue'),
            meta: {
              title: 'Company List'
            }
          },
          {
            path: 'company/:id',
            name: 'CompanyDetail',
            component: () => import('@/views/valuation/companydetail.vue'),
            meta: {
              hidden: true,
              title: 'Company Detail',
              activeMenu: '/companyvaluation/valuation/company'
            }
          },
          {
            path: 'profit-discount',
            name: 'ProfitDiscountList',
            component: () => import('@/views/valuation/profitdiscount.vue'),
            meta: {
              title: 'Profit Discount'
            }
          },
          {
            path: 'dcf',
            redirect: '/companyvaluation/valuation/dcf-v1',
            meta: {
              hidden: true,
              title: 'DCF'
            }
          },
          {
            path: 'dcf-v1',
            name: 'DcfValuationV1List',
            component: () => import('@/views/valuation/dcfvaluation.vue'),
            props: VALUATION_MODEL_CONFIGS.dcfV1,
            meta: {
              title: 'DCF v1'
            }
          },
          {
            path: 'dcf-v2',
            name: 'DcfValuationV2List',
            component: () => import('@/views/valuation/dcfvaluation.vue'),
            props: VALUATION_MODEL_CONFIGS.dcfV2,
            meta: {
              title: 'DCF v2'
            }
          }
        ]
      },
      {
        path: 'settings',
        name: 'SettingsRoot',
        component: () => import('@/views/placeholder/section.vue'),
        redirect: '/companyvaluation/settings/macrosettings',
        meta: {
          title: 'Settings'
        },
        children: [
          {
            path: 'macrosettings',
            name: 'MacroSettings',
            component: () => import('@/views/valuation/macrosettings.vue'),
            meta: {
              title: 'Macro Settings'
            }
          },
          {
            path: 'industrysettings',
            name: 'IndustrySettings',
            component: () => import('@/views/valuation/industrysettings.vue'),
            meta: {
              title: 'Industry Settings'
            }
          }
        ]
      }
    ]
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: {
      hidden: true,
      title: '404'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
    meta: {
      hidden: true
    }
  }
]
