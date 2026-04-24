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
  company: {
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
    mainBusiness: '高端白酒生产和销售'
  },
  valuation: {
    score: 92,
    recommendationScore: 88,
    financialScore: 90,
    valuation: 1500,
    growthRatePrediction: 0.18,
    growthRateAssumption: 0.15,
    price: 1234,
    deviation: 0.22,
    pe: 28.5,
    pb: 9.2,
    marketValue: 2500000000000,
    capitalization: 125000000000,
    dividendRate: 0.52,
    dividendYears: 10,
    dividendIsSure: '是',
    yield: 0.03,
    yieldAverage: 0.028,
    yieldPrediction: 0.031
  },
  financialReport: {
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
  valuationData: {
    netAssetDiscount: 0.85,
    netAssetValuation: 100,
    dividendStability: 0.9,
    dividendRatePrediction: 0.52,
    incomeGrowthRatePrediction: 0.11,
    profitGrowthRatePrediction: 0.12,
    growthRatePrediction: 0.13,
    growthYears: 8,
    discountRate: 0.1,
    highGrowthDiscountCoefficientSum: 4.2,
    highGrowthValuation: 500,
    perpetualGrowthRate: 0.03,
    perpetualDiscountCoefficientSum: 6.1,
    perpetualValuation: 700,
    marketRisk: 0.95,
    industryRisk: 0.9
  },
  dividendList: [
    {
      dividendYear: '2025',
      dividendAmount: 20000000000,
      freeCashFlow: 25000000000
    }
  ]
}
