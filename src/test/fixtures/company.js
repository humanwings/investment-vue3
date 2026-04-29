export const companyListPayload = {
  sum: 1,
  list: [
    {
      companyId: 1,
      stockCode: '600519',
      name: '贵州茅台',
      score: 92,
      totalScore: 92,
      price: 1234,
      growthRateAssumption: 0.15,
      growthRatePrediction: 0.18,
      valuation: 1500,
      profitValuation: 1500,
      deviation: 0.22,
      profitDeviation: 0.22,
      dcfValuationSummary: '-',
      freeCashFlowPer: 180,
      recommendationScore: 88,
      financialScore: 90,
      industryName: '白酒',
      conclusion: '重点关注',
      marketValue: 2500000000000,
      cfDate: '2025-12-31',
      cvUpdateTime: '2026-04-01',
      cfUpdateTime: '2026-04-02'
    }
  ]
}

export const companyDetailPayload = {
  overview: {
    companyId: 1,
    name: '贵州茅台',
    stockCode: '600519',
    exchange: 'SH',
    fsTableType: 'A股',
    ipoDate: '2001-08-27',
    province: '贵州',
    actualControllerTypes: '国资',
    firstIndustry: '消费',
    secondIndustry: '白酒',
    thirdIndustry: '高端白酒',
    mainBusiness: '高端白酒生产和销售',
    price: 1234,
    profitValuation: 1500,
    profitDeviation: 0.22,
    totalScore: 92,
    recommendationScore: 88,
    financialScore: 90,
    conclusion: '重点关注',
    highlights: ['利润贴现估值高于当前价格', 'ROE 表现较强']
  },
  profitValuation: {
    growthRatePrediction: 18,
    growthRateAssumption: 15,
    growthRateApplied: 15,
    valuation: 1500,
    deviation: 0.22,
    growthYears: 8,
    discountRate: 0.1,
    highGrowthValuation: 500,
    perpetualGrowthRate: 0.03,
    perpetualValuation: 700,
    finalValuation: 1111.5
  },
  dcfValuation: {
    status: 'pending',
    message: 'DCF 模型将在后续步骤接入'
  },
  financialReview: {
    latestReport: {
      date: '2025-12-31',
      wroe: 0.31,
      wdroe: 0.29,
      netAssetValuePer: 120.5,
      npadnrpatoshaopcPer: 55.4,
      operatingCashFlowPer: 62.1,
      freeCashFlowPer: 58.8,
      grossMargin: 0.91,
      assetLiabilityRatio: 0.18,
      interestLiabilityRatio: 0.02,
      incomeGrowthRateCurrent: 0.11,
      profitGrowthRateCurrent: 0.12,
      incomeGrowthRateTotal: 0.13,
      profitGrowthRateTotal: 0.14
    },
    dividendList: [
      {
        dividendYear: '2025',
        dividendAmount: 20000000000,
        freeCashFlow: 25000000000
      }
    ],
    profitability: [
      {
        label: '加权 ROE',
        value: '31.00%',
        status: 'good',
        description: '股东权益创造利润的能力'
      }
    ],
    cashFlowQuality: [
      {
        label: '经营现金流/扣非利润',
        value: '1.12x',
        status: 'good',
        description: '利润现金含量'
      }
    ],
    dividendStability: [
      {
        label: '连续分红年数',
        value: '5 年',
        status: 'good',
        description: '最近连续分红记录'
      }
    ],
    solvency: [
      {
        label: '资产负债率',
        value: '18.00%',
        status: 'good',
        description: '总负债相对总资产的比例'
      }
    ],
    assetStructure: [
      {
        label: 'PB',
        value: '4.20',
        status: 'neutral',
        description: '价格相对净资产的估值水平'
      }
    ],
    riskWarnings: ['暂无突出财务风险，继续跟踪财报变化'],
    highlights: ['ROE 表现较强', '自由现金流为正']
  },
  recommendationSummary: {
    score: 88,
    status: 'summary',
    message: '推荐明细将在公司总览后续步骤接入'
  }
}

export const profitValuationPayload = {
  sum: 1,
  list: [
    {
      companyId: 1,
      stockCode: '600519',
      name: '贵州茅台',
      industryName: '白酒',
      price: 1234,
      growthRatePrediction: 18,
      growthRateManual: 15,
      growthRateApplied: 15,
      manualOverrideFlag: true,
      valuation: 1500,
      deviation: 0.22,
      financialScore: 90,
      recommendationScore: 88,
      signal: '低估',
      updatedAt: '2026-04-28 10:00:00'
    }
  ]
}
