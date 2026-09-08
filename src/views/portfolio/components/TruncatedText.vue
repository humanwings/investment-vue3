<template>
  <span v-if="!text">-</span>
  <el-tooltip v-else-if="text.length > max" :content="text" placement="top">
    <span>{{ truncateText(text, max) }}</span>
  </el-tooltip>
  <span v-else>{{ text }}</span>
</template>

<script setup>
import { truncateText } from '@/utils/text'

defineProps({
  text: { type: String, default: '' },
  max: { type: Number, default: 10 }
})
</script>
