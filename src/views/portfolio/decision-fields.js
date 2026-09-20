import { computed } from 'vue'

/**
 * 买入原因六维共享逻辑（持仓/已清仓编辑弹窗共用）。
 * 六维互相独立、互不联动；推荐含大V推荐/小V推荐时显示姓名输入。
 * form 须为 reactive 对象，含 reco/factor/trend/fame/stockType/pricePosition。
 */
export function useDecisionFields(form) {
  const showBigV = computed(() => {
    const reco = Array.isArray(form.reco)
      ? form.reco
      : String(form.reco || '').split(',')
    return reco.includes('大V推荐') || reco.includes('小V推荐')
  })

  return { showBigV }
}
