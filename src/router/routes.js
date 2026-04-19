import { Coin, TrendCharts } from '@element-plus/icons-vue'

import Layout from '@/layout/index.vue'

export const appRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: {
      hidden: true,
      title: '登录'
    }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    meta: {
      title: '首页'
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
          title: '数据分析'
        },
        children: [
          {
            path: 'waitlist',
            name: 'AnalyteWaitList',
            component: () => import('@/views/analyte/waitlist.vue'),
            meta: {
              title: '新数据'
            }
          },
          {
            path: 'donelist',
            name: 'AnalyteDoneList',
            component: () => import('@/views/analyte/donelist.vue'),
            meta: {
              title: '历史数据'
            }
          },
          {
            path: 'verification/:id',
            name: 'VerificationById',
            component: () => import('@/views/analyte/verification.vue'),
            meta: {
              hidden: true,
              title: '数据验证',
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
              title: '验证结果比较',
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
          title: '策略设置'
        },
        children: [
          {
            path: 'strategylist',
            name: 'StrategyList',
            component: () => import('@/views/strategy/strategylist.vue'),
            meta: {
              title: '策略一览'
            }
          },
          {
            path: 'strategyadd',
            name: 'StrategyAdd',
            component: () => import('@/views/strategy/strategyedit.vue'),
            meta: {
              title: '策略建立'
            }
          },
          {
            path: 'strategyedit/:id',
            name: 'StrategyEdit',
            component: () => import('@/views/strategy/strategyedit.vue'),
            meta: {
              hidden: true,
              title: '策略编辑',
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
          title: '公司估值'
        },
        children: [
          {
            path: 'company',
            name: 'CompanyList',
            component: () => import('@/views/valuation/companylist.vue'),
            meta: {
              title: '公司估值'
            }
          },
          {
            path: 'company/:id',
            name: 'CompanyDetail',
            component: () => import('@/views/valuation/companydetail.vue'),
            meta: {
              hidden: true,
              title: '公司详情',
              activeMenu: '/companyvaluation/valuation/company'
            }
          },
          {
            path: 'recommend',
            name: 'RecommendRank',
            component: () => import('@/views/recommend/rank.vue'),
            meta: {
              title: '大V推荐'
            }
          },
          {
            path: 'recommend/:stockCode',
            name: 'RecommendDetail',
            component: () => import('@/views/recommend/detail.vue'),
            meta: {
              hidden: true,
              title: '推荐详情',
              activeMenu: '/companyvaluation/valuation/recommend'
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
          title: '参数设置'
        },
        children: [
          {
            path: 'macrosettings',
            name: 'MacroSettings',
            component: () => import('@/views/valuation/macrosettings.vue'),
            meta: {
              title: '宏观参数'
            }
          },
          {
            path: 'industrysettings',
            name: 'IndustrySettings',
            component: () => import('@/views/valuation/industrysettings.vue'),
            meta: {
              title: '行业参数'
            }
          },
          {
            path: 'recommendauthors',
            name: 'RecommendAuthors',
            component: () => import('@/views/settings/kvmanage.vue'),
            meta: {
              title: '大V管理'
            }
          },
          {
            path: 'recommendrules',
            name: 'RecommendRules',
            component: () => import('@/views/settings/kvrules.vue'),
            meta: {
              title: '推荐权重规则'
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
