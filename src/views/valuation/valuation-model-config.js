export const VALUATION_MODEL_CONFIGS = {
  profitDiscount: {
    modelCode: 'PROFIT_DISCOUNT',
    modelVersion: 'PROFIT_DISCOUNT_V1',
    scenarioKey: 'BASE'
  },
  dcfV1: {
    modelCode: 'DCF_V1',
    modelVersion: 'DCF_V1_SIMPLE_FCFF',
    scenarioKey: 'BASE',
    supportsManualAssumptions: true,
    supportsSensitivity: false,
    versionKey: 'v1',
    pageTitle: 'DCF v1',
    pendingStatusLabel: 'Pending DCF v1',
    overviewSource: 'dcf-v1'
  },
  dcfV2: {
    modelCode: 'DCF_V2',
    modelVersion: 'DCF_V2_STANDARD_FCFF',
    scenarioKey: 'BASE',
    supportsManualAssumptions: false,
    supportsSensitivity: true,
    versionKey: 'v2',
    pageTitle: 'DCF v2',
    pendingStatusLabel: 'Pending DCF v2',
    overviewSource: 'dcf-v2'
  }
}
