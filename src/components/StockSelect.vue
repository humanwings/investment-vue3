<template>
  <div class="stock-select">
    <div v-if="disabled && modelValue" class="stock-display">
      <b>{{ modelValue.name }}</b>
      <span class="stock-code">{{ modelValue.code }}</span>
      <el-tag
        size="small"
        :type="modelValue.market === 'H' ? 'warning' : 'primary'"
      >
        {{ stockMarketMap.get(modelValue.market) || modelValue.market }}
      </el-tag>
    </div>
    <el-select
      v-else
      v-model="selected"
      filterable
      remote
      clearable
      value-key="code"
      :remote-method="doSearch"
      :loading="loading"
      :disabled="disabled"
      :placeholder="placeholder"
      style="width: 100%"
      @change="emitSelected"
    >
      <el-option
        v-for="item in options"
        :key="`${item.market}-${item.code}`"
        :label="optionLabel(item)"
        :value="item"
      />
      <template #empty>
        <div class="search-empty">无匹配结果，可手动输入代码</div>
      </template>
    </el-select>
    <div v-if="manual && !disabled" class="manual-row">
      <el-input
        v-model="manualCode"
        placeholder="手动输入 5/6 位代码（兜底）"
        style="width: 220px"
      />
      <el-button @click="addManual">手动添加</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

import { searchMasterData } from '@/api/master-data'
import { marketOfCode, stockMarketMap } from '@/codebook'

const props = defineProps({
  modelValue: {
    type: Object,
    default: null
  },
  type: {
    type: String,
    default: 'stock'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  manual: {
    type: Boolean,
    default: true
  },
  placeholder: {
    type: String,
    default: '输入拼音简写 / 代码 / 名称，如 albb、zgpa'
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const selected = ref(props.modelValue)

watch(
  () => props.modelValue,
  (value) => {
    selected.value = value
  }
)

const options = ref([])
const loading = ref(false)
const manualCode = ref('')

function optionLabel(item) {
  const market = stockMarketMap.get(item.market) || item.market
  return `${item.name}（${item.code} · ${market}）`
}

async function doSearch(keyword) {
  if (!keyword) {
    options.value = []
    return
  }
  loading.value = true
  try {
    const { data } = await searchMasterData(keyword)
    options.value = (data.results || []).map((item) => ({
      market: item.market,
      code: String(item.code),
      name: item.name
    }))
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
  const market = marketOfCode(code)
  if (!market) {
    return
  }
  const item = { market, code, name: code }
  selected.value = item
  options.value = [item]
  emitSelected()
}

defineExpose({ selected, doSearch, addManual, manualCode, options })
</script>

<style scoped lang="scss">
.stock-select {
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
