<template>
  <div class="tier-editor">
    <el-alert
      v-if="overLimit"
      type="error"
      :closable="false"
      :title="`向上突破卖出合计 ${formatNumber(totalUp)} 股超过上限（基准数量 − 保留底仓 = ${formatNumber(limit)}）`"
      class="limit-alert"
    />
    <el-alert
      v-if="balanceMismatch"
      type="error"
      :closable="false"
      title="上方档位回归（买回）数量合计与突破（卖出）数量合计不相等，回到基准档时持仓无法配平"
      class="limit-alert"
    />
    <el-table :data="sortedTiers" size="small">
      <el-table-column label="档位" width="100">
        <template #default="{ row }">{{ tierLabel(row.level) }}</template>
      </el-table-column>
      <el-table-column label="方向" width="80">
        <template #default="{ row }">
          <el-tag size="small" :type="tagType(row)">{{
            valuationOf(row)
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="price" label="档位价格" width="100">
        <template #default="{ row }">{{ formatPrice(row.price) }}</template>
      </el-table-column>
      <el-table-column label="突破数量（上减下加）" width="170">
        <template #default="{ row }">
          <el-input-number
            v-if="row.level < 0"
            v-model="row.qty"
            :disabled="row.level === highestUpLevel"
            :min="0"
            :step="minUnitQty"
            :step-strictly="true"
            :precision="0"
            size="small"
            @change="(value) => onSellQtyChange(row, value)"
          />
          <el-input-number
            v-else-if="row.level > 0"
            v-model="row.buyQty"
            :min="0"
            :step="minUnitQty"
            :step-strictly="true"
            :precision="0"
            size="small"
            @change="(value) => onBuyQtyChange(row, value)"
          />
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="回归数量（上加下减）" width="170">
        <template #default="{ row }">
          <el-input-number
            v-if="row.level < 0"
            v-model="row.buyQty"
            :min="0"
            :step="minUnitQty"
            :step-strictly="true"
            :precision="0"
            size="small"
            @change="(value) => onBuyQtyChange(row, value)"
          />
          <el-input-number
            v-else-if="row.level > 0"
            v-model="row.qty"
            :min="0"
            :step="minUnitQty"
            :step-strictly="true"
            :precision="0"
            size="small"
            @change="(value) => onSellQtyChange(row, value)"
          />
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="估值区间" min-width="170">
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
      共 {{ sortedTiers.length }} 档 · 向上突破卖出合计
      {{ formatNumber(totalUp) }} 股（剩余
      {{ formatNumber(remainingUp) }} 股，底仓
      {{ formatNumber(props.keepQty) }} 股） · 向上回归买回合计
      {{ formatNumber(totalUpBuy) }} 股 · 基准仓位
      {{ formatNumber(props.baseQty) }} 股（{{
        basePositionAmount
      }}
      万元），向下突破买入合计 {{ formatNumber(totalBuy) }} 股（约
      {{ buyAmount }} 万元）
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'

import {
  formatNumber,
  formatPrice,
  mirrorUpBuyQty,
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

const upTiers = computed(() => sortedTiers.value.filter((row) => row.level < 0))

const totalUp = computed(() =>
  upTiers.value.reduce((sum, row) => sum + (Number(row.qty) || 0), 0)
)

const totalUpBuy = computed(() =>
  upTiers.value.reduce((sum, row) => sum + (Number(row.buyQty) || 0), 0)
)

const totalBuy = computed(() =>
  sortedTiers.value
    .filter((row) => row.level > 0)
    .reduce((sum, row) => sum + (Number(row.buyQty) || 0), 0)
)

const totalBuyAmount = computed(() =>
  sortedTiers.value
    .filter((row) => row.level > 0)
    .reduce(
      (sum, row) => sum + (Number(row.buyQty) || 0) * (Number(row.price) || 0),
      0
    )
)

const limit = computed(() => props.baseQty - props.keepQty)

const overLimit = computed(() => totalUp.value > limit.value)

const balanceMismatch = computed(
  () => upTiers.value.length > 0 && totalUpBuy.value !== totalUp.value
)

const remainingUp = computed(() => Math.max(0, limit.value - totalUp.value))

const basePositionAmount = computed(() =>
  (
    ((Number(props.baseQty) || 0) * (Number(props.basePrice) || 0)) /
    10000
  ).toFixed(2)
)

const buyAmount = computed(() => (totalBuyAmount.value / 10000).toFixed(2))

const highestUpLevel = computed(() => {
  const upLevels = upTiers.value.map((row) => row.level)
  return upLevels.length ? Math.min(...upLevels) : null
})

const expectedHighestQty = computed(() => {
  if (highestUpLevel.value === null) return null
  const others = upTiers.value
    .filter((row) => row.level !== highestUpLevel.value)
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

function changeValuation(row, value) {
  row.valuation = value
  emitChange()
}

function onSellQtyChange(row, value) {
  row.qty = value === null || value === undefined ? 0 : value
  if (row.level < 0) {
    fitHighestUpTier()
  }
  emitChange()
}

function onBuyQtyChange(row, value) {
  const qty = value === null || value === undefined ? 0 : value
  row.buyQty = qty
  // 下方档：突破（买入）变化时同档回归（卖出）同步更新；上方档回归可单独微调
  if (row.level > 0) {
    row.qty = qty
  }
  emitChange()
}

// 上方档突破（卖出）数量变化后：最高档自动补齐上限，各档回归（买回）数量按镜像原则重排
// （第 k 档回归 = 第 m+1-k 档突破，m 为最深一个突破数量 > 0 的档位），保持回到基准档配平
function fitHighestUpTier() {
  if (highestUpLevel.value === null || expectedHighestQty.value === null) {
    return
  }
  const highest = sortedTiers.value.find(
    (row) => row.level === highestUpLevel.value
  )
  if (highest && (Number(highest.qty) || 0) !== expectedHighestQty.value) {
    highest.qty = expectedHighestQty.value
  }
  const nearestFirst = [...upTiers.value].sort(
    (a, b) => Math.abs(a.level) - Math.abs(b.level)
  )
  const buys = mirrorUpBuyQty(nearestFirst.map((row) => Number(row.qty) || 0))
  nearestFirst.forEach((row, index) => {
    row.buyQty = buys[index]
  })
}

function syncHighestTier() {
  if (highestUpLevel.value === null || expectedHighestQty.value === null) {
    return
  }
  const highest = sortedTiers.value.find(
    (row) => row.level === highestUpLevel.value
  )
  if (highest && (Number(highest.qty) || 0) !== expectedHighestQty.value) {
    fitHighestUpTier()
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
