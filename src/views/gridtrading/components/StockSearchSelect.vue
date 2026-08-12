<template>
  <div class="stock-search">
    <div v-if="disabled && modelValue" class="stock-display">
      <b>{{ modelValue.stockName }}</b>
      <span class="stock-code">{{ modelValue.stockCode }}</span>
      <el-tag
        size="small"
        :type="modelValue.market === 'H' ? 'warning' : 'primary'"
      >
        {{ modelValue.market === 'H' ? '港股' : 'A股' }}
      </el-tag>
    </div>
    <el-select
      v-else
      v-model="selected"
      filterable
      remote
      clearable
      value-key="stockCode"
      :remote-method="doSearch"
      :loading="loading"
      :disabled="disabled"
      placeholder="输入拼音简写 / 代码 / 名称，如 albb、zgpa"
      style="width: 100%"
      @change="emitSelected"
    >
      <el-option
        v-for="item in options"
        :key="`${item.market}-${item.stockCode}`"
        :label="optionLabel(item)"
        :value="item"
      />
      <template #empty>
        <div class="search-empty">无匹配结果，可在下方手动输入代码</div>
      </template>
    </el-select>
    <div v-if="!disabled" class="manual-row">
      <el-input
        v-model="manualCode"
        placeholder="手动输入 5/6 位代码（兜底）"
        :disabled="disabled"
        style="width: 220px"
      />
      <el-button :disabled="disabled" @click="addManual">手动添加</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

import { searchStocks } from '@/api/grid-trading'

const props = defineProps({
  modelValue: {
    type: Object,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const selected = ref(props.modelValue)
const options = ref([])
const loading = ref(false)
const manualCode = ref('')

function optionLabel(item) {
  const market = item.market === 'H' ? '港股' : 'A股'
  return `${item.stockName}（${item.stockCode} · ${market}）`
}

async function doSearch(keyword) {
  if (!keyword) {
    options.value = []
    return
  }
  loading.value = true
  try {
    const { data } = await searchStocks(keyword)
    options.value = data.results || []
  } finally {
    loading.value = false
  }
}

function emitSelected() {
  emit('update:modelValue', selected.value)
  emit('change', selected.value)
}

function addManual() {
  const code = manualCode.value.trim()
  if (!/^\d{5,6}$/.test(code)) {
    return
  }
  const item = {
    stockCode: code,
    stockName: code,
    market: code.length === 5 ? 'H' : 'A'
  }
  selected.value = item
  options.value = [item]
  emitSelected()
}
</script>

<style scoped lang="scss">
.stock-search {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 520px;
}

.stock-display {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fafafa;
  color: #303133;

  .stock-code {
    color: #909399;
    font-size: 13px;
  }
}

.manual-row {
  display: flex;
  gap: 10px;
}

.search-empty {
  color: #909399;
  font-size: 12px;
  padding: 8px;
}
</style>
