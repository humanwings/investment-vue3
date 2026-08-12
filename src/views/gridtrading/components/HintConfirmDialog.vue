<template>
  <el-dialog
    :model-value="visible"
    title="确认执行"
    width="440px"
    @update:model-value="(value) => emit('update:visible', value)"
  >
    <div class="hint-desc">
      操作：{{ hint?.action === 'SELL' ? '卖出' : '买入' }}
      <b>{{ formatNumber(hint?.qty) }}</b>
      股（{{ tierLabel(hint?.tierLevel) }} · 档位价
      {{ formatPrice(hint?.tierPrice) }}）
      <br />
      当前现价
      {{
        formatPrice(currentPrice)
      }}。请在券商完成真实操作后，回来填写实际成交信息。
    </div>
    <el-form label-width="80px" class="confirm-form">
      <el-form-item label="成交价">
        <el-input-number
          v-model="tradePrice"
          :min="0.01"
          :precision="2"
          :step="0.01"
          style="width: 200px"
        />
      </el-form-item>
      <el-form-item label="数量">
        <el-input-number
          v-model="qty"
          :min="0"
          :step="minUnitQty"
          :step-strictly="true"
          :precision="0"
          style="width: 200px"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :disabled="!valid" @click="confirm">
        确认已执行
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

import { formatNumber, formatPrice, tierLabel } from '@/utils/grid-trading'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  hint: {
    type: Object,
    default: null
  },
  currentPrice: {
    type: Number,
    default: 0
  },
  minUnitQty: {
    type: Number,
    default: 100
  }
})

const emit = defineEmits(['update:visible', 'confirm'])

const tradePrice = ref(0)
const qty = ref(0)

watch(
  () => [props.visible, props.hint],
  () => {
    if (props.visible && props.hint) {
      tradePrice.value = props.currentPrice
      qty.value = props.hint.qty
    }
  },
  { immediate: true }
)

const valid = computed(
  () =>
    tradePrice.value > 0 && qty.value > 0 && qty.value % props.minUnitQty === 0
)

function confirm() {
  emit('confirm', { tradePrice: tradePrice.value, qty: qty.value })
}
</script>

<style scoped lang="scss">
.hint-desc {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 13px;
  color: #606266;
  line-height: 1.8;
  margin-bottom: 16px;
}
</style>
