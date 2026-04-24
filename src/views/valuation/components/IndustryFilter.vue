<template>
  <el-select
    :model-value="modelValue"
    clearable
    filterable
    placeholder="行业筛选"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-option label="全部行业" value="" />
    <el-option
      v-for="industry in industries"
      :key="industry"
      :label="industry"
      :value="industry"
    />
  </el-select>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  industries: {
    type: Array,
    default: () => []
  }
})

defineEmits(['update:modelValue'])
</script>
