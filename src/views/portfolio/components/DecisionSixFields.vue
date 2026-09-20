<template>
  <el-form-item label="推荐来源">
    <el-select v-model="form.reco" multiple clearable style="width: 100%">
      <el-option v-for="o in recoOptions" :key="o" :label="o" :value="o" />
    </el-select>
  </el-form-item>
  <el-form-item v-for="d in singleFields" :key="d.field" :label="d.label">
    <el-select v-model="form[d.field]" clearable style="width: 100%">
      <el-option v-for="o in d.options" :key="o" :label="o" :value="o" />
    </el-select>
  </el-form-item>
  <el-form-item v-if="showBigV" label="大V姓名">
    <el-input v-model="form.bigV" placeholder="大V/小V推荐时填写" />
  </el-form-item>
</template>

<script setup>
import { DECISION_DIMENSIONS } from '@/views/decision/buyDecisionRules2'
import { useDecisionFields } from '../decision-fields'

const props = defineProps({
  form: { type: Object, required: true }
})

const form = props.form

function dim(key) {
  return DECISION_DIMENSIONS.find((d) => d.key === key)
}

const recoOptions = dim('recommends').options
const singleFields = [
  {
    field: 'factor',
    label: dim('factor').label,
    options: dim('factor').options
  },
  { field: 'trend', label: dim('trend').label, options: dim('trend').options },
  { field: 'fame', label: dim('fame').label, options: dim('fame').options },
  {
    field: 'stockType',
    label: dim('type').label,
    options: dim('type').options
  },
  {
    field: 'pricePosition',
    label: '股价位置',
    options: dim('position').options
  }
]

const { showBigV } = useDecisionFields(form)
</script>
