<template>
  <el-dialog
    :model-value="visible"
    title="新增清仓记录"
    width="500px"
    @update:model-value="(v) => emit('update:visible', v)"
  >
    <el-form label-width="90px">
      <el-form-item label="标的" required>
        <StockSelect v-model="stock" :manual="false" />
      </el-form-item>
      <el-form-item label="清仓日期" required>
        <el-date-picker
          v-model="clearedDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="选择清仓日期"
          style="width: 100%"
        />
      </el-form-item>
      <DecisionSixFields :form="form" />
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
        :disabled="!canConfirm"
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
import { createPortfolioCleared } from '@/api/portfolio'
import { useDecisionFields } from '../decision-fields'
import DecisionSixFields from './DecisionSixFields.vue'
import StockSelect from '@/components/StockSelect.vue'

const props = defineProps({
  visible: { type: Boolean, default: false }
})
const emit = defineEmits(['update:visible', 'saved'])

const clearReasons = [
  '止损',
  '止盈',
  '消息利空',
  '财报不佳',
  '跟随大V',
  '信心不足',
  '降仓避险',
  '其他'
]

const stock = ref(null)
const clearedDate = ref('')
const form = reactive({
  reco: [],
  factor: '',
  trend: '',
  fame: '',
  stockType: '',
  pricePosition: '',
  bigV: '',
  clearReason: '',
  clearReasonRemark: '',
  realizedPl: null,
  holdDays: null,
  clearedRemark: ''
})
const saving = ref(false)

const canConfirm = computed(
  () => !!(stock.value && stock.value.code && clearedDate.value)
)

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    stock.value = null
    clearedDate.value = ''
    Object.assign(form, {
      reco: [],
      factor: '',
      trend: '',
      fame: '',
      stockType: '',
      pricePosition: '',
      bigV: '',
      clearReason: '',
      clearReasonRemark: '',
      realizedPl: null,
      holdDays: null,
      clearedRemark: ''
    })
  }
)

const { showBigV } = useDecisionFields(form)

async function confirm() {
  saving.value = true
  try {
    await createPortfolioCleared({
      stockCode: stock.value.code,
      stockName: stock.value.name,
      market: stock.value.market,
      clearedDate: clearedDate.value,
      reco: form.reco.length ? form.reco.join(',') : null,
      factor: form.factor || null,
      trend: form.trend || null,
      fame: form.fame || null,
      stockType: form.stockType || null,
      pricePosition: form.pricePosition || null,
      bigV: showBigV.value ? form.bigV || null : null,
      clearReason: form.clearReason || null,
      clearReasonRemark: form.clearReasonRemark,
      realizedPl: form.realizedPl,
      holdDays: form.holdDays,
      clearedRemark: form.clearedRemark
    })
    ElMessage.success('添加成功')
    emit('saved')
    emit('update:visible', false)
  } catch {
    // interceptor 已提示
  } finally {
    saving.value = false
  }
}

defineExpose({ stock, clearedDate, form })
</script>
