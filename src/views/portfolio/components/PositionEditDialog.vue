<template>
  <el-dialog
    :model-value="visible"
    :title="`编辑档案 ${form.stockName || form.stockCode || ''}`"
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
          :placeholder="stockTypeOptions.length ? '' : '—'"
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
      <el-form-item label="持股策略">
        <el-select v-model="form.holdStrategy" clearable style="width: 100%">
          <el-option
            v-for="s in holdStrategies"
            :key="s"
            :label="s"
            :value="s"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="持股计划">
        <el-input v-model="form.holdPlan" />
      </el-form-item>
      <el-form-item label="当期业绩">
        <el-input v-model="form.earningsNote" type="textarea" :rows="2" />
      </el-form-item>
      <el-form-item label="备考">
        <el-input v-model="form.archiveRemark" type="textarea" :rows="2" />
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
import { updatePortfolioArchive } from '@/api/portfolio'
import { useDecisionFields } from '../decision-fields'

const props = defineProps({
  visible: { type: Boolean, default: false },
  row: { type: Object, default: null }
})
const emit = defineEmits(['update:visible', 'saved'])

const holdStrategies = ['非卖品', '长期持有', '中期持有', '可卖品', '跟随大V']

const form = reactive({
  stockCode: '',
  stockName: '',
  buyReason: '',
  stockType: '',
  pricePosition: '',
  timing: '',
  decisionLevel: '',
  bigV: '',
  holdStrategy: '',
  holdPlan: '',
  earningsNote: '',
  archiveRemark: ''
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
      stockCode: row.stockCode || '',
      stockName: row.stockName || '',
      buyReason: row.buyReason || '',
      stockType: row.stockType || '',
      pricePosition: row.pricePosition || '',
      timing: row.timing || '',
      decisionLevel: row.decisionLevel || '',
      bigV: row.bigV || '',
      holdStrategy: row.holdStrategy || '',
      holdPlan: row.holdPlan || '',
      earningsNote: row.earningsNote || '',
      archiveRemark: row.archiveRemark || ''
    })
  },
  { immediate: true }
)

async function confirm() {
  saving.value = true
  try {
    await updatePortfolioArchive(form.stockCode, {
      buyReason: form.buyReason || null,
      stockType: form.stockType || null,
      pricePosition: form.pricePosition || null,
      timing: form.timing || null,
      decisionLevel: form.decisionLevel || null,
      bigV: form.bigV || null,
      holdStrategy: form.holdStrategy || null,
      holdPlan: form.holdPlan,
      remark: form.archiveRemark,
      earningsNote: form.earningsNote || null
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
