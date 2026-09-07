import {
  Coin,
  Grid,
  MagicStick,
  Setting,
  TrendCharts,
  PieChart
} from '@element-plus/icons-vue'

import Layout from '@/layout/index.vue'
import { VALUATION_MODEL_CONFIGS } from '@/views/valuation/valuation-model-config'

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
          title: '首页'
        }
      }
    ]
  },
  {
    path: '/portfolio',
    component: Layout,
    redirect: '/portfolio/latest',
    meta: { title: '持仓管理', icon: PieChart },
    children: [
      {
        path: 'latest',
        name: 'LatestPosition',
        component: () => import('@/views/portfolio/LatestPosition.vue'),
        meta: { title: '最新持仓' }
      },
      {
        path: 'history',
        name: 'HistoryPosition',
        component: () => import('@/views/portfolio/HistoryPosition.vue'),
        meta: { title: '历史明细' }
      },
      {
        path: 'history/:statsDate',
        name: 'HistoryDetail',
        component: () => import('@/views/portfolio/HistoryDetail.vue'),
        meta: {
          hidden: true,
          title: '历史详情',
          activeMenu: '/portfolio/history'
        }
      },
      {
        path: 'cleared',
        name: 'ClearedPosition',
        component: () => import('@/views/portfolio/ClearedPosition.vue'),
        meta: { title: '已清仓一览' }
      },
      {
        path: 'statistics',
        name: 'PortfolioStatistics',
        component: () => import('@/views/portfolio/PortfolioStatistics.vue'),
        meta: { title: '统计分析' }
      }
    ]
  },
  {
    path: '/decision',
    component: Layout,
    redirect: '/decision/buy-check',
    meta: {
      title: '决策判定',
      icon: MagicStick
    },
    children: [
      {
        path: 'buy-check',
        name: 'BuyDecision',
        component: () => import('@/views/decision/BuyDecision.vue'),
        meta: {
          title: '买入判定'
        }
      }
    ]
  },
  {
    path: '/companyvaluation',
    component: Layout,
    redirect: '/companyvaluation/valuation/company',
    meta: {
      title: '公司估值',
      icon: Coin
    },
    children: [
      {
        path: 'valuation',
        name: 'ValuationRoot',
        component: () => import('@/views/placeholder/section.vue'),
        redirect: '/companyvaluation/valuation/company',
        meta: {
          title: '估值'
        },
        children: [
          {
            path: 'company',
            name: 'CompanyList',
            component: () => import('@/views/valuation/companylist.vue'),
            meta: {
              title: '公司列表'
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
            path: 'profit-discount',
            name: 'ProfitDiscountList',
            component: () => import('@/views/valuation/profitdiscount.vue'),
            meta: {
              title: '利润折现'
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
        path: 'research',
        name: 'ResearchRoot',
        component: () => import('@/views/placeholder/section.vue'),
        redirect: '/companyvaluation/research/reports',
        meta: {
          title: '研究分析'
        },
        children: [
          {
            path: 'reports',
            name: 'ResearchReportList',
            component: () => import('@/views/research/reportlist.vue'),
            meta: {
              title: '公司分析'
            }
          },
          {
            path: 'reports/:id',
            name: 'ResearchReportDetail',
            component: () => import('@/views/research/reportdetail.vue'),
            meta: {
              hidden: true,
              title: '报告详情',
              activeMenu: '/companyvaluation/research/reports'
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
          title: '设置'
        },
        children: [
          {
            path: 'macrosettings',
            name: 'MacroSettings',
            component: () => import('@/views/valuation/macrosettings.vue'),
            meta: {
              title: '宏观设置'
            }
          },
          {
            path: 'industrysettings',
            name: 'IndustrySettings',
            component: () => import('@/views/valuation/industrysettings.vue'),
            meta: {
              title: '行业设置'
            }
          }
        ]
      }
    ]
  },
  {
    path: '/grid-trading',
    component: Layout,
    redirect: '/grid-trading/strategy',
    meta: {
      title: '网格交易',
      icon: Grid
    },
    children: [
      {
        path: 'strategy',
        name: 'GridStrategyList',
        component: () => import('@/views/gridtrading/strategylist.vue'),
        meta: {
          title: '策略列表'
        }
      },
      {
        path: 'records',
        name: 'GridTradeRecords',
        component: () => import('@/views/gridtrading/traderecords.vue'),
        meta: {
          title: '成交记录'
        }
      },
      {
        path: 'statistics',
        name: 'GridTradeStatistics',
        component: () => import('@/views/gridtrading/statistics.vue'),
        meta: {
          title: '统计分析'
        }
      },
      {
        path: 'strategy/add',
        name: 'GridStrategyAdd',
        component: () => import('@/views/gridtrading/strategyedit.vue'),
        meta: {
          hidden: true,
          title: '新增策略',
          activeMenu: '/grid-trading/strategy'
        }
      },
      {
        path: 'strategy/edit/:id',
        name: 'GridStrategyEdit',
        component: () => import('@/views/gridtrading/strategyedit.vue'),
        meta: {
          hidden: true,
          title: '编辑策略',
          activeMenu: '/grid-trading/strategy'
        }
      },
      {
        path: 'strategy/:id',
        name: 'GridStrategyDetail',
        component: () => import('@/views/gridtrading/strategydetail.vue'),
        meta: {
          hidden: true,
          title: '策略详情',
          activeMenu: '/grid-trading/strategy'
        }
      }
    ]
  },
  {
    path: '/barginhunting',
    component: Layout,
    redirect: '/barginhunting/analyte/waitlist',
    meta: {
      title: '捡漏分析',
      icon: TrendCharts
    },
    children: [
      {
        path: 'analyte',
        name: 'AnalyteRoot',
        component: () => import('@/views/placeholder/section.vue'),
        redirect: '/barginhunting/analyte/waitlist',
        meta: {
          title: '标的分析'
        },
        children: [
          {
            path: 'waitlist',
            name: 'AnalyteWaitList',
            component: () => import('@/views/analyte/waitlist.vue'),
            meta: {
              title: '待分析列表'
            }
          },
          {
            path: 'donelist',
            name: 'AnalyteDoneList',
            component: () => import('@/views/analyte/donelist.vue'),
            meta: {
              title: '已完成列表'
            }
          },
          {
            path: 'verification/:id',
            name: 'VerificationById',
            component: () => import('@/views/analyte/verification.vue'),
            meta: {
              hidden: true,
              title: '验证详情',
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
              title: '验证对比',
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
          title: '策略'
        },
        children: [
          {
            path: 'strategylist',
            name: 'StrategyList',
            component: () => import('@/views/strategy/strategylist.vue'),
            meta: {
              title: '策略列表'
            }
          },
          {
            path: 'strategyadd',
            name: 'StrategyAdd',
            component: () => import('@/views/strategy/strategyedit.vue'),
            meta: {
              title: '新增策略'
            }
          },
          {
            path: 'strategyedit/:id',
            name: 'StrategyEdit',
            component: () => import('@/views/strategy/strategyedit.vue'),
            meta: {
              hidden: true,
              title: '编辑策略',
              activeMenu: '/barginhunting/strategy/strategylist'
            }
          }
        ]
      }
    ]
  },
  {
    path: '/system-settings',
    component: Layout,
    redirect: '/system-settings/data-sources',
    meta: {
      title: '系统设置',
      icon: Setting
    },
    children: [
      {
        path: 'stock-master',
        name: 'StockMaster',
        component: () => import('@/views/stockmaster/stockmaster.vue'),
        meta: {
          title: '股票基本资料'
        }
      },
      {
        path: 'fund-master',
        name: 'FundMaster',
        component: () => import('@/views/fundmaster/fundmaster.vue'),
        meta: {
          title: '基金基本资料'
        }
      },
      {
        path: 'data-sources',
        name: 'DataSources',
        component: () => import('@/views/systemsettings/datasources.vue'),
        meta: {
          title: '数据接口设置'
        }
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
