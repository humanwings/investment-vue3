<template>
  <div class="grid-ladder">
    <div
      v-for="row in sortedTiers"
      :key="row.level"
      class="ladder-row"
      :class="[barClass(row), row.level === 0 ? 'is-base' : '']"
    >
      <span class="level">{{ tierLabel(row.level) }}</span>
      <span class="price">{{ formatPrice(row.price) }}</span>
      <el-tag size="small" :type="tagType(row)">{{
        directionLabel(row)
      }}</el-tag>
      <span class="qty">{{ qtyLabel(row) }}</span>
      <div class="bar">
        <i :style="{ width: barWidth(row) }"></i>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

import {
  formatNumber,
  formatPrice,
  tierLabel,
  valuationBarClass,
  valuationTagType
} from '@/utils/grid-trading'

const props = defineProps({
  tiers: {
    type: Array,
    default: () => []
  }
})

const sortedTiers = computed(() =>
  [...props.tiers].sort((a, b) => a.level - b.level)
)

function valuationOf(row) {
  return (
    row.valuation || (row.level < 0 ? '高估' : row.level > 0 ? '低估' : '合理')
  )
}

function barClass(row) {
  return valuationBarClass(valuationOf(row))
}

function tagType(row) {
  return valuationTagType(valuationOf(row))
}

function directionLabel(row) {
  if (row.level === 0) return '基准'
  return row.level < 0 ? '减仓' : '加仓'
}

function qtyLabel(row) {
  if (row.level === 0) return `${formatNumber(row.qty)} 股`
  return `减 ${formatNumber(row.qty)} / 加 ${formatNumber(row.buyQty ?? row.qty)}`
}

function barWidth(row) {
  const maxQty = Math.max(
    1,
    ...sortedTiers.value.map((item) =>
      Math.max(Number(item.qty) || 0, Number(item.buyQty) || 0)
    )
  )
  return `${Math.round(((Number(row.qty) || 0) / maxQty) * 100)}%`
}
</script>

<style scoped lang="scss">
.grid-ladder {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ladder-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 10px;
  border-radius: 6px;
  background: #fafafa;
  border: 1px solid #e4e7ed;

  &.is-base {
    background: #ecf5ff;
    border-color: #b3d8ff;
  }
}

.level {
  width: 70px;
  color: #909399;
}

.price {
  width: 90px;
  font-weight: 600;
}

.qty {
  width: 120px;
  text-align: right;
}

.bar {
  flex: 1;
  height: 8px;
  background: #e4e7ed;
  border-radius: 4px;
  overflow: hidden;

  i {
    display: block;
    height: 100%;
    border-radius: 4px;
    background: #409eff;
  }
}

.bar-high i {
  background: #f56c6c;
}

.bar-low i {
  background: #67c23a;
}

.bar-fair i {
  background: #409eff;
}
</style>
