<template>
  <div class="decision-page">
    <header class="page-head">
      <h2>买入判定</h2>
      <p>买不买、买多少 · 纯本地判断，不联网不查行情</p>
    </header>

    <div class="selection-grid">
      <el-card class="step-card" shadow="never">
        <template #header>
          <span class="step-title">
            <span class="step-num">1</span>
            买入原因
          </span>
        </template>
        <div class="option-row">
          <el-button
            v-for="option in reasonOptions"
            :key="option.value"
            :type="selectedReason === option.value ? 'primary' : 'default'"
            :data-test="`reason-${option.value}`"
            @click="onReasonSelect(option.value)"
          >
            {{ option.label }}
          </el-button>
        </div>
      </el-card>

      <el-card v-if="stockTypeOptions.length" class="step-card" shadow="never">
        <template #header>
          <span class="step-title">
            <span class="step-num">2</span>
            股票种类
          </span>
        </template>
        <div class="option-row">
          <el-button
            v-for="option in stockTypeOptions"
            :key="option"
            :type="selectedType === option ? 'primary' : 'default'"
            :data-test="`type-${option}`"
            @click="selectedType = option"
          >
            {{ option }}
          </el-button>
        </div>
      </el-card>

      <el-card v-if="thirdStep.options.length" class="step-card" shadow="never">
        <template #header>
          <span class="step-title">
            <span class="step-num">3</span>
            {{ thirdStep.label }}
          </span>
        </template>
        <div class="option-row">
          <el-button
            v-for="option in thirdStep.options"
            :key="option"
            :type="selectedPosition === option ? 'primary' : 'default'"
            :data-test="`position-${option}`"
            @click="selectedPosition = option"
          >
            {{ option }}
          </el-button>
        </div>
      </el-card>
    </div>

    <div class="summary-grid">
      <el-card class="tier-card" shadow="never">
        <template #header>
          <span class="step-title">档位对照</span>
        </template>
        <table class="tier-table">
          <thead>
            <tr>
              <th>档位</th>
              <th>基本单位（万元）</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(level, index) in levelOrder"
              :key="level"
              :class="{ active: decision?.level === level }"
              :data-test="`tier-row-${level}`"
            >
              <td>
                <span class="tier-index">{{ index + 1 }}</span>
                {{ level }}
                <span v-if="decision?.level === level" class="tier-current">
                  当前
                </span>
              </td>
              <td>{{ LEVELS[level] }}</td>
            </tr>
          </tbody>
        </table>
      </el-card>

      <el-card class="result-card" shadow="never">
        <template #header>
          <span class="step-title">判定结果</span>
        </template>
        <div v-if="decision" class="result-body" data-test="decision-result">
          <div class="result-tier" data-test="result-tier">
            第 {{ resultTier }} / {{ levelOrder.length }} 档
          </div>
          <div
            class="result-level"
            :class="resultClass"
            data-test="result-level"
          >
            {{ decision.level }}
          </div>
          <div class="result-units" data-test="result-units">
            建议投入 约 <b>{{ decision.units }}</b> 万元
          </div>
          <el-progress
            class="result-bar"
            :percentage="resultPercent"
            :show-text="false"
            :stroke-width="10"
          />
          <p class="result-note">{{ decision.description }}</p>
          <div class="result-actions">
            <el-button
              type="primary"
              data-test="reset"
              @click="resetFromReason"
            >
              重新选择
            </el-button>
          </div>
        </div>
        <div v-else class="result-placeholder">完成上方选择后显示判定结果</div>
      </el-card>
    </div>

    <el-collapse class="basis-collapse">
      <el-collapse-item title="这套判断的依据（可展开）" name="basis">
        <p>
          大V/小V/回调/追热点/蓝筹长期用打分：分数 = 原因基础分 + 股价位置分 +
          股票种类分。潜伏、暴跌抄底、试试用专门规则。
        </p>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

import {
  LEVELS,
  evaluateDecision,
  getBuyReasonOptions,
  getStockTypeOptions,
  getThirdStep
} from './buyDecisionRules'

const reasonOptions = getBuyReasonOptions()
const levelOrder = Object.keys(LEVELS)
const selectedReason = ref(null)
const selectedType = ref(null)
const selectedPosition = ref(null)

const stockTypeOptions = computed(() =>
  getStockTypeOptions(selectedReason.value)
)
const thirdStep = computed(() => getThirdStep(selectedReason.value))
const decision = computed(() => {
  if (!selectedReason.value || !selectedPosition.value) {
    return null
  }

  if (stockTypeOptions.value.length && !selectedType.value) {
    return null
  }

  return evaluateDecision({
    reason: selectedReason.value,
    stockType: selectedType.value,
    position: selectedPosition.value
  })
})

const resultTier = computed(() => {
  if (!decision.value) {
    return 0
  }

  return levelOrder.indexOf(decision.value.level) + 1
})

const resultPercent = computed(() =>
  decision.value ? (decision.value.units / 8) * 100 : 0
)

const resultClass = computed(() => {
  const level = decision.value?.level

  return {
    bad: level === '别买',
    warn: level === '观察' || level === '轻仓',
    normal: level === '正常',
    good: level === '重仓' || level === '超重仓'
  }
})

function onReasonSelect(value) {
  selectedReason.value = value
  selectedType.value = null
  selectedPosition.value = null
}

function resetFromReason() {
  selectedType.value = null
  selectedPosition.value = null
}
</script>

<style scoped>
.decision-page {
  max-width: 980px;
  margin: 0 auto;
}

.page-head {
  margin-bottom: 18px;
  text-align: center;
}

.page-head h2 {
  margin: 0;
  font-size: 24px;
}

.page-head p {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.selection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.step-card {
  height: 100%;
}

.step-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.step-num {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #2563eb;
  color: #fff;
  font-size: 13px;
}

.option-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.summary-grid {
  display: grid;
  grid-template-columns: minmax(260px, 0.8fr) minmax(320px, 1fr);
  align-items: stretch;
  gap: 16px;
  margin-bottom: 12px;
}

.tier-card,
.result-card {
  height: 100%;
}

.tier-table {
  width: 100%;
  border-collapse: collapse;
}

.tier-table th,
.tier-table td {
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  text-align: left;
}

.tier-table th {
  background: #f8fafc;
  font-weight: 600;
}

.tier-table tr.active td {
  background: #eff6ff;
  border-color: #93c5fd;
}

.tier-index {
  display: inline-grid;
  place-items: center;
  width: 20px;
  height: 20px;
  margin-right: 6px;
  border-radius: 999px;
  background: #e5e7eb;
  color: #4b5563;
  font-size: 12px;
}

.tier-table tr.active .tier-index {
  background: #2563eb;
  color: #fff;
}

.tier-current {
  margin-left: 6px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
}

.result-card {
  border-top: 3px solid #2563eb;
}

.result-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 250px;
  text-align: center;
}

.result-placeholder {
  display: grid;
  min-height: 250px;
  place-items: center;
  color: #9ca3af;
}

.result-tier {
  color: #6b7280;
  font-size: 14px;
}

.result-level {
  margin-top: 4px;
  font-size: 44px;
  font-weight: 800;
  line-height: 1.1;
}

.result-level.good {
  color: #16a34a;
}

.result-level.warn {
  color: #d97706;
}

.result-level.normal {
  color: #2563eb;
}

.result-level.bad {
  color: #dc2626;
}

.result-units {
  margin-top: 6px;
  color: #6b7280;
}

.result-units b {
  color: #1f2937;
}

.result-bar {
  margin-top: 16px;
  width: 100%;
}

.result-note {
  margin-top: 12px;
  color: #6b7280;
}

.result-actions {
  margin-top: 18px;
}

.basis-collapse {
  margin-top: 8px;
}

.basis-collapse p {
  color: #6b7280;
}

@media (max-width: 860px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
