<template>
  <div class="tier-editor">
    <el-alert
      v-if="overLimit"
      type="error"
      :closable="false"
      :title="`向上减仓合计 ${formatNumber(totalUp)} 股超过上限（基准数量 − 保留底仓 = ${formatNumber(limit)}）`"
      class="limit-alert"
    />
    <el-table :data="sortedTiers" size="small">
      <el-table-column label="档位" width="110">
        <template #default="{ row }">{{ tierLabel(row.level) }}</template>
      </el-table-column>
      <el-table-column label="方向" width="90">
        <template #default="{ row }">
          <el-tag size="small" :type="tagType(row)">{{
            directionLabel(row)
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="price" label="档位价格" width="110">
        <template #default="{ row }">{{ formatPrice(row.price) }}</template>
      </el-table-column>
      <el-table-column label="数量（可改）" width="190">
        <template #default="{ row }">
          <el-input-number
            v-if="row.level !== 0"
            v-model="row.qty"
            :disabled="row.level === highestUpLevel"
            :min="0"
            :step="minUnitQty"
            :step-strictly="true"
            :precision="0"
            size="small"
            @change="(value) => onQtyChange(row, value)"
          />
          <span v-else>{{ formatNumber(row.qty) }} 股</span>
        </template>
      </el-table-column>
      <el-table-column label="估值区间" min-width="180">
        <template #default="{ row }">
          <el-radio-group
            v-if="row.level !== 0"
            :model-value="row.valuation"
            size="small"
            @change="(value) => changeValuation(row, value)"
          >
            <el-radio v-if="row.level < 0" :value="'高估'">高估</el-radio>
            <el-radio :value="'合理'">合理</el-radio>
            <el-radio v-if="row.level > 0" :value="'低估'">低估</el-radio>
          </el-radio-group>
          <el-tag v-else size="small" type="primary">合理</el-tag>
        </template>
      </el-table-column>
    </el-table>
    <div class="summary">
      共 {{ sortedTiers.length }} 档 · 向上减仓合计
      {{ formatNumber(totalUp) }} 股（剩余
      {{ formatNumber(remainingUp) }} 股，底仓
      {{ formatNumber(props.keepQty) }} 股） · 基准仓位
      {{ formatNumber(props.baseQty) }} 股（{{
        basePositionAmount
      }}
      万元），向下加仓合计 {{ formatNumber(totalBuy) }} 股（约
      {{ buyAmount }} 万元）
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'

import {
  formatNumber,
  formatPrice,
  tierLabel,
  valuationTagType
} from '@/utils/grid-trading'

const props = defineProps({
  tiers: {
    type: Array,
    default: () => []
  },
  baseQty: {
    type: Number,
    default: 0
  },
  basePrice: {
    type: Number,
    default: 0
  },
  keepQty: {
    type: Number,
    default: 0
  },
  minUnitQty: {
    type: Number,
    default: 100
  }
})

const emit = defineEmits(['update:tiers', 'change'])

const sortedTiers = computed(() =>
  [...props.tiers].sort((a, b) => a.level - b.level)
)

const totalUp = computed(() =>
  sortedTiers.value
    .filter((row) => row.level < 0)
    .reduce((sum, row) => sum + (Number(row.qty) || 0), 0)
)

const totalBuy = computed(() =>
  sortedTiers.value
    .filter((row) => row.level > 0)
    .reduce((sum, row) => sum + (Number(row.qty) || 0), 0)
)

const totalBuyAmount = computed(() =>
  sortedTiers.value
    .filter((row) => row.level > 0)
    .reduce(
      (sum, row) => sum + (Number(row.qty) || 0) * (Number(row.price) || 0),
      0
    )
)

const limit = computed(() => props.baseQty - props.keepQty)

const overLimit = computed(() => totalUp.value > limit.value)

const remainingUp = computed(() => Math.max(0, limit.value - totalUp.value))

const basePositionAmount = computed(() =>
  (
    ((Number(props.baseQty) || 0) * (Number(props.basePrice) || 0)) /
    10000
  ).toFixed(2)
)

const buyAmount = computed(() => (totalBuyAmount.value / 10000).toFixed(2))

const highestUpLevel = computed(() => {
  const upLevels = sortedTiers.value
    .filter((row) => row.level < 0)
    .map((row) => row.level)
  return upLevels.length ? Math.min(...upLevels) : null
})

const expectedHighestQty = computed(() => {
  if (highestUpLevel.value === null) return null
  const others = sortedTiers.value
    .filter((row) => row.level < 0 && row.level !== highestUpLevel.value)
    .reduce((sum, row) => sum + (Number(row.qty) || 0), 0)
  return Math.max(0, limit.value - others)
})

watch(
  () => props.tiers.map((tier) => `${tier.level}:${tier.qty}`).join('|'),
  syncHighestTier,
  { immediate: true }
)

function valuationOf(row) {
  return (
    row.valuation || (row.level < 0 ? '高估' : row.level > 0 ? '低估' : '合理')
  )
}

function tagType(row) {
  return valuationTagType(valuationOf(row))
}

function directionLabel(row) {
  if (row.level === 0) return '基准'
  return row.level < 0 ? '减仓' : '加仓'
}

function changeValuation(row, value) {
  row.valuation = value
  emitChange()
}

function onQtyChange(row, value) {
  row.qty = value === null || value === undefined ? 0 : value
  emitChange()
}

function syncHighestTier() {
  if (highestUpLevel.value === null || expectedHighestQty.value === null) {
    return
  }
  const highest = sortedTiers.value.find(
    (row) => row.level === highestUpLevel.value
  )
  if (highest && (Number(highest.qty) || 0) !== expectedHighestQty.value) {
    highest.qty = expectedHighestQty.value
    emitChange()
  }
}

function emitChange() {
  emit('update:tiers', props.tiers)
  emit('change', props.tiers)
}
</script>

<style scoped lang="scss">
.limit-alert {
  margin-bottom: 12px;
}

.summary {
  margin-top: 12px;
  color: #909399;
  font-size: 12px;
}
</style>
