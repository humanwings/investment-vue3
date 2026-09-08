<template>
  <el-dialog
    :model-value="visible"
    :title="`编辑清仓 ${row?.stockName || row?.stockCode || ''}`"
    width="500px"
    @update:model-value="(v) => emit('update:visible', v)"
  >
    <el-form label-width="90px">
      <el-form-item label="买入原因">
        <el-select
          v-model="form.buyReason"
          clearable
          style="width: 100%"
          @change="handleReasonChange"
        >
          <el-option
            v-for="r in decisionBuyReasons"
            :key="r.key"
            :label="r.label"
            :value="r.label"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="股票种类">
        <el-select
          v-model="form.stockType"
          clearable
          :disabled="!stockTypeOptions.length"
          style="width: 100%"
          @change="recalcLevel"
        >
          <el-option
            v-for="t in stockTypeOptions"
            :key="t"
            :label="t"
            :value="t"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="thirdLabel">
        <el-select
          v-model="thirdValue"
          clearable
          style="width: 100%"
          @change="recalcLevel"
        >
          <el-option v-for="o in thirdOptions" :key="o" :label="o" :value="o" />
        </el-select>
      </el-form-item>
      <el-form-item label="判定档位">
        <el-select
          v-model="form.decisionLevel"
          disabled
          placeholder="自动计算"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item v-if="showBigV" label="大V姓名">
        <el-input v-model="form.bigV" placeholder="大V/小V推荐时填写" />
      </el-form-item>
      <el-form-item label="清仓原因">
        <el-select v-model="form.clearReason" clearable style="width: 100%">
          <el-option v-for="r in clearReasons" :key="r" :label="r" :value="r" />
        </el-select>
      </el-form-item>
      <el-form-item label="清仓原因备注">
        <el-input v-model="form.clearReasonRemark" />
      </el-form-item>
      <el-form-item label="实现盈亏">
        <el-input-number
          v-model="form.realizedPl"
          :precision="2"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="持股天数">
        <el-input-number
          v-model="form.holdDays"
          :min="0"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="清仓备注">
        <el-input v-model="form.clearedRemark" type="textarea" :rows="2" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button
        type="primary"
        :loading="saving"
        data-test="confirm"
        @click="confirm"
      >
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { decisionBuyReasons } from '@/codebook'
import { updatePortfolioCleared } from '@/api/portfolio'
import { useDecisionFields } from '../decision-fields'

const props = defineProps({
  visible: { type: Boolean, default: false },
  row: { type: Object, default: null }
})
const emit = defineEmits(['update:visible', 'saved'])

const clearReasons = [
  '止损',
  '止盈',
  '消息利空',
  '财报不佳',
  '跟随大V',
  '信心不足',
  '其他'
]

const form = reactive({
  clearedId: null,
  buyReason: '',
  stockType: '',
  pricePosition: '',
  timing: '',
  decisionLevel: '',
  bigV: '',
  clearReason: '',
  clearReasonRemark: '',
  realizedPl: null,
  holdDays: null,
  clearedRemark: ''
})
const saving = ref(false)

const {
  reasonConfig,
  stockTypeOptions,
  thirdLabel,
  thirdOptions,
  thirdValue,
  onReasonChange,
  recalcLevel
} = useDecisionFields(form)

const showBigV = computed(
  () =>
    reasonConfig.value?.key === 'bigV' || reasonConfig.value?.key === 'smallV'
)

function handleReasonChange() {
  onReasonChange()
  form.bigV = ''
}

watch(
  () => [props.visible, props.row],
  ([visible, row]) => {
    if (!visible || !row) return
    Object.assign(form, {
      clearedId: row.clearedId ?? null,
      buyReason: row.buyReason || '',
      stockType: row.stockType || '',
      pricePosition: row.pricePosition || '',
      timing: row.timing || '',
      decisionLevel: row.decisionLevel || '',
      bigV: row.bigV || '',
      clearReason: row.clearReason || '',
      clearReasonRemark: row.clearReasonRemark || '',
      realizedPl: row.realizedPl ?? null,
      holdDays: row.holdDays ?? null,
      clearedRemark: row.clearedRemark || ''
    })
  },
  { immediate: true }
)

async function confirm() {
  saving.value = true
  try {
    await updatePortfolioCleared(form.clearedId, {
      buyReason: form.buyReason || null,
      stockType: form.stockType || null,
      pricePosition: form.pricePosition || null,
      timing: form.timing || null,
      decisionLevel: form.decisionLevel || null,
      bigV: form.bigV || null,
      clearReason: form.clearReason || null,
      clearReasonRemark: form.clearReasonRemark,
      realizedPl: form.realizedPl,
      holdDays: form.holdDays,
      clearedRemark: form.clearedRemark
    })
    ElMessage.success('保存成功')
    emit('saved')
    emit('update:visible', false)
  } catch {
    // interceptor 已提示
  } finally {
    saving.value = false
  }
}

defineExpose({
  form,
  onReasonChange,
  recalcLevel,
  handleReasonChange,
  showBigV
})
</script>
