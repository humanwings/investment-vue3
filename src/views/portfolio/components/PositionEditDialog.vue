<template>
  <el-dialog
    :model-value="visible"
    :title="`编辑档案 ${form.stockName || form.stockCode || ''}`"
    width="500px"
    @update:model-value="(v) => emit('update:visible', v)"
  >
    <el-form label-width="90px">
      <DecisionSixFields :form="form" />
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
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { updatePortfolioArchive } from '@/api/portfolio'
import { useDecisionFields } from '../decision-fields'
import DecisionSixFields from './DecisionSixFields.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  row: { type: Object, default: null }
})
const emit = defineEmits(['update:visible', 'saved'])

const holdStrategies = ['非卖品', '长期持有', '中期持有', '可卖品', '跟随大V']

const form = reactive({
  stockCode: '',
  stockName: '',
  reco: [],
  factor: '',
  trend: '',
  fame: '',
  stockType: '',
  pricePosition: '',
  bigV: '',
  holdStrategy: '',
  holdPlan: '',
  earningsNote: '',
  archiveRemark: ''
})
const saving = ref(false)

const { showBigV } = useDecisionFields(form)

watch(
  () => [props.visible, props.row],
  ([visible, row]) => {
    if (!visible || !row) return
    Object.assign(form, {
      stockCode: row.stockCode || '',
      stockName: row.stockName || '',
      reco: row.reco ? String(row.reco).split(',') : [],
      factor: row.factor || '',
      trend: row.trend || '',
      fame: row.fame || '',
      stockType: row.stockType || '',
      pricePosition: row.pricePosition || '',
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
      reco: form.reco.length ? form.reco.join(',') : null,
      factor: form.factor || null,
      trend: form.trend || null,
      fame: form.fame || null,
      stockType: form.stockType || null,
      pricePosition: form.pricePosition || null,
      bigV: showBigV.value ? form.bigV || null : null,
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

defineExpose({ form, showBigV })
</script>
