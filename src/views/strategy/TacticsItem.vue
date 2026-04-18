<template>
  <div class="container">
    <template v-if="!item.option" />

    <template v-else-if="isObserveRange">
      {{ currentLabel?.slice(0, 3) }}：
      <el-select v-model="item.param1" class="ndate" placeholder="请选择">
        <el-option v-for="option in nDateOptions" :key="option.value" :label="option.label" :value="option.value" />
      </el-select>
      ~
      <el-select v-model="item.param2" class="ndate" placeholder="请选择">
        <el-option v-for="option in nDateOptions" :key="option.value" :label="option.label" :value="option.value" />
      </el-select>
      {{ currentLabel?.slice(-2) }}：
      <el-input-number v-model="item.param3" class="inputfloat" :precision="1" :step="0.1" :min="-5" :max="5" />
      %
      ~
      <el-input-number v-model="item.param4" class="inputfloat" :precision="1" :step="0.1" :min="-5" :max="5" />
      %
    </template>

    <template v-else-if="isGapOrTerrace">
      {{ currentLabel }}：
      <el-select v-model="item.param1" class="comparison" placeholder="请选择">
        <el-option v-for="option in comparisonOptions" :key="option.value" :label="option.label" :value="option.value" />
      </el-select>
      <el-input-number v-model="item.param3" class="inputnumer" :min="0" :max="10" />
      个
    </template>

    <template v-else-if="isPlungeDates">
      {{ currentLabel }}：
      <el-select v-model="item.param1" class="comparison" placeholder="请选择">
        <el-option v-for="option in comparisonOptions" :key="option.value" :label="option.label" :value="option.value" />
      </el-select>
      <el-input-number v-model="item.param3" class="inputnumer" :min="0" :max="10" />
      天
    </template>

    <template v-else-if="isPlungeReason">
      {{ currentLabel }}：
      <el-select v-model="item.param1" class="bool" placeholder="请选择">
        <el-option v-for="option in boolOptions" :key="option.value" :label="option.label" :value="option.value" />
      </el-select>
      <el-select v-model="item.param2" class="reason" placeholder="请选择">
        <el-option v-for="option in reasonOptions" :key="option.value" :label="option.label" :value="option.value" />
      </el-select>
    </template>

    <template v-else-if="isPlungeRange">
      {{ currentLabel }}：
      <el-input-number v-model="item.param3" class="inputfloat" :precision="1" :step="0.1" :min="5" :max="50" />
      %
      ~
      <el-input-number v-model="item.param4" class="inputfloat" :precision="1" :step="0.1" :min="5" :max="50" />
      %
    </template>

    <template v-else-if="isPeOrPb">
      {{ currentLabel }}：
      <el-input-number v-model="item.param3" class="inputfloat" :precision="1" :step="1" :min="0" :max="100" />
      ~
      <el-input-number v-model="item.param4" class="inputfloat" :precision="1" :step="1" :min="0" :max="100" />
    </template>

    <template v-else-if="isShareholders">
      {{ currentLabel }}：
      <el-input-number v-model="item.param3" class="inputfloat" :precision="1" :step="1" :min="0" />
      千人
      ~
      <el-input-number v-model="item.param4" class="inputfloat" :precision="1" :step="1" :min="0" />
      千人
    </template>

    <template v-else-if="isMarketValue">
      {{ currentLabel }}：
      <el-input-number v-model="item.param3" class="inputfloat" :precision="1" :step="1" :min="0" />
      万元
      ~
      <el-input-number v-model="item.param4" class="inputfloat" :precision="1" :step="1" :min="0" />
      万元
    </template>

    <template v-else-if="isBasisType">
      {{ currentLabel }}：
      <el-select v-model="item.param1" class="bool" placeholder="请选择">
        <el-option v-for="option in boolOptions" :key="option.value" :label="option.label" :value="option.value" />
      </el-select>
      <el-select v-model="item.param2" class="reason" placeholder="请选择">
        <el-option v-for="option in listingStatusOptions" :key="option.value" :label="option.label" :value="option.value" />
      </el-select>
    </template>

    <template v-else-if="isBuyTime">
      买入时间：
      <el-select v-model="item.param1" placeholder="请选择">
        <el-option v-for="option in buyTimeOptions" :key="option.value" :label="option.label" :value="option.value" />
      </el-select>
      买入持续：
      <el-select v-model="item.param2" placeholder="请选择">
        <el-option v-for="option in buyDateOptions" :key="option.value" :label="option.label" :value="option.value" />
      </el-select>
    </template>

    <template v-else-if="isBuyFloat">
      {{ currentLabel }}：
      <el-input-number v-model="item.param3" class="inputfloat" :precision="1" :step="0.1" :min="-5" :max="5" />
      %
    </template>

    <template v-else-if="isBuyPosition">
      {{ currentLabel }}：
      <el-select v-model="item.param1" placeholder="请选择">
        <el-option v-for="option in buyPosOptions" :key="option.value" :label="option.label" :value="option.value" />
      </el-select>
    </template>

    <template v-else-if="isBuyDailyMax">
      {{ currentLabel }}：
      <el-input-number v-model="item.param3" class="inputnumer" :min="1" :max="10" />
      支
    </template>

    <template v-else-if="isHoldDates">
      {{ currentLabel }}：
      <el-input-number v-model="item.param3" class="inputnumer" :min="1" :max="5" />
      日
    </template>

    <template v-else-if="isSellTime">
      {{ currentLabel }}：
      <el-select v-model="item.param1" placeholder="请选择">
        <el-option v-for="option in sellTimeOptions" :key="option.value" :label="option.label" :value="option.value" />
      </el-select>
    </template>

    <template v-else-if="isSellFloat">
      {{ currentLabel }}：
      <el-input-number v-model="item.param3" class="inputfloat" :precision="1" :step="0.1" :min="-5" :max="5" />
      %
    </template>

    <template v-else-if="isSellStop">
      止盈：
      <el-select v-model="item.param1" class="sellstop" placeholder="请选择">
        <el-option v-for="option in sellStopOptions" :key="option.value" :label="option.label" :value="option.value" />
      </el-select>
      <el-input-number v-model="item.param3" class="inputfloat" :precision="1" :step="0.1" :min="0" :max="50" />
      %
      止损：
      <el-select v-model="item.param2" class="sellstop" placeholder="请选择">
        <el-option v-for="option in sellStopOptions" :key="option.value" :label="option.label" :value="option.value" />
      </el-select>
      <el-input-number v-model="item.param4" class="inputfloat" :precision="1" :step="0.1" :min="-20" :max="0" />
      %
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

import {
  boolOptions,
  buyDateOptions,
  buyPosOptions,
  buyTimeOptions,
  comparisonOptions,
  listingStatusOptions,
  nDateOptions,
  reasonOptions,
  sellStopOptions,
  sellTimeOptions,
  tacticsArray,
  tacticsMap
} from '@/codebook'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const category = computed(() => props.item.option?.[0])
const kind = computed(() => props.item.option?.[1])
const currentLabel = computed(() => tacticsMap.get(`${category.value}${kind.value}`))

const isObserveRange = computed(() =>
  category.value === tacticsArray[0][0] &&
  [tacticsArray[0][2][0][0], tacticsArray[0][2][1][0]].includes(kind.value)
)
const isGapOrTerrace = computed(() =>
  category.value === tacticsArray[0][0] &&
  [tacticsArray[0][2][2][0], tacticsArray[0][2][4][0]].includes(kind.value)
)
const isPlungeDates = computed(() => category.value === tacticsArray[0][0] && kind.value === tacticsArray[0][2][3][0])
const isPlungeReason = computed(() => category.value === tacticsArray[0][0] && kind.value === tacticsArray[0][2][5][0])
const isPlungeRange = computed(() =>
  category.value === tacticsArray[0][0] &&
  [tacticsArray[0][2][6][0], tacticsArray[0][2][7][0]].includes(kind.value)
)
const isPeOrPb = computed(() =>
  category.value === tacticsArray[0][0] &&
  [tacticsArray[0][2][8][0], tacticsArray[0][2][9][0]].includes(kind.value)
)
const isShareholders = computed(() => category.value === tacticsArray[0][0] && kind.value === tacticsArray[0][2][10][0])
const isMarketValue = computed(() => category.value === tacticsArray[0][0] && kind.value === tacticsArray[0][2][11][0])
const isBasisType = computed(() => category.value === tacticsArray[0][0] && kind.value === tacticsArray[0][2][12][0])
const isBuyTime = computed(() => category.value === tacticsArray[1][0] && kind.value === tacticsArray[1][2][0][0])
const isBuyFloat = computed(() => category.value === tacticsArray[1][0] && kind.value === tacticsArray[1][2][1][0])
const isBuyPosition = computed(() => category.value === tacticsArray[1][0] && kind.value === tacticsArray[1][2][2][0])
const isBuyDailyMax = computed(() => category.value === tacticsArray[1][0] && kind.value === tacticsArray[1][2][3][0])
const isHoldDates = computed(() => category.value === tacticsArray[2][0] && kind.value === tacticsArray[2][2][0][0])
const isSellTime = computed(() => category.value === tacticsArray[2][0] && kind.value === tacticsArray[2][2][1][0])
const isSellFloat = computed(() => category.value === tacticsArray[2][0] && kind.value === tacticsArray[2][2][2][0])
const isSellStop = computed(() => category.value === tacticsArray[2][0] && kind.value === tacticsArray[2][2][3][0])
</script>

<style scoped lang="scss">
.container {
  text-align: left;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.comparison {
  width: 120px;
}

.ndate {
  width: 90px;
}

.reason {
  width: 150px;
}

.bool {
  width: 100px;
}

.inputnumer {
  width: 120px;
}

.inputfloat {
  width: 130px;
}

.sellstop {
  width: 180px;
}
</style>
