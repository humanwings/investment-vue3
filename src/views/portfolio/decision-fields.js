import { computed } from 'vue'
import { decisionTimings, getDecisionReasonByLabel } from '@/codebook'
import { getDecisionLevel } from '@/views/decision/buyDecisionRules'

/**
 * 决策字段联动（持仓/已清仓编辑弹窗共用）：
 * 买入原因 -> 可选股票种类/位置或时机 -> 自动重算判定档位（可手动覆盖）。
 * form 须为 reactive 对象，含 buyReason/stockType/pricePosition/timing/decisionLevel。
 */
export function useDecisionFields(form) {
  const reasonConfig = computed(() => getDecisionReasonByLabel(form.buyReason))
  const stockTypeOptions = computed(() => reasonConfig.value?.types || [])
  const isTiming = computed(() => !!reasonConfig.value?.timing)
  const thirdLabel = computed(() => (isTiming.value ? '时机' : '股价位置'))
  const thirdOptions = computed(() =>
    isTiming.value
      ? [...decisionTimings]
      : [...(reasonConfig.value?.positions || [])]
  )
  const thirdValue = computed({
    get: () => (isTiming.value ? form.timing : form.pricePosition),
    set: (v) => {
      if (isTiming.value) {
        form.timing = v
      } else {
        form.pricePosition = v
      }
    }
  })

  function recalcLevel() {
    const key = reasonConfig.value?.key
    if (!key) return
    const level = getDecisionLevel({
      reason: key,
      stockType: form.stockType || null,
      position: form.pricePosition || null,
      timing: form.timing || null
    })
    form.decisionLevel = level || ''
  }

  function onReasonChange() {
    form.stockType = ''
    form.pricePosition = ''
    form.timing = ''
    form.decisionLevel = ''
    recalcLevel()
  }

  return {
    reasonConfig,
    stockTypeOptions,
    isTiming,
    thirdLabel,
    thirdOptions,
    thirdValue,
    onReasonChange,
    recalcLevel
  }
}
