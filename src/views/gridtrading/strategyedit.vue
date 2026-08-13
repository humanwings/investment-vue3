<template>
  <section class="page-shell">
    <div class="page-card">
      <div class="page-head">
        <h2>{{ isEdit ? '编辑网格策略' : '新增网格策略' }}</h2>
        <el-button @click="router.back()">返回</el-button>
      </div>

      <el-alert
        v-if="form.status === 'RUNNING'"
        type="warning"
        :closable="false"
        title="修改结构参数（基准价、基准数量、间隔、档位数、保留底仓、最小数量、每档数量）保存时将按最新价重置当前档位与持仓；备注与估值区间可即时修改。"
        class="status-alert"
      />
      <el-alert
        v-else-if="form.status === 'ENDED'"
        type="info"
        :closable="false"
        title="保存后将转为未启用（草稿），可重新启用。"
        class="status-alert"
      />

      <el-form label-width="120px">
        <el-form-item label="选择标的" required>
          <StockSearchSelect v-model="selectedStock" :disabled="isEdit" />
        </el-form-item>
        <div class="form-grid">
          <el-form-item label="基准价格" required>
            <el-input-number
              v-model="form.basePrice"
              :min="0.01"
              :precision="2"
              :step="0.01"
            />
          </el-form-item>
          <el-form-item label="基准数量" required>
            <el-input-number
              v-model="form.baseQty"
              :min="100"
              :step="100"
              :precision="0"
            />
          </el-form-item>
          <el-form-item label="档位间隔 %" required>
            <el-input-number
              v-model="form.intervalPct"
              :min="0.1"
              :step="0.1"
              :precision="1"
            />
          </el-form-item>
          <el-form-item label="上方档位数" required>
            <el-input-number
              v-model="form.upTierCount"
              :min="0"
              :step="1"
              :precision="0"
            />
          </el-form-item>
          <el-form-item label="下方档位数" required>
            <el-input-number
              v-model="form.downTierCount"
              :min="0"
              :step="1"
              :precision="0"
            />
          </el-form-item>
          <el-form-item label="保留底仓" required>
            <el-input-number
              v-model="form.keepQty"
              :min="0"
              :step="100"
              :precision="0"
            />
          </el-form-item>
          <el-form-item label="最小加减仓数量" required>
            <el-input-number
              v-model="form.minUnitQty"
              :min="100"
              :step="100"
              :precision="0"
            />
          </el-form-item>
        </div>
        <el-form-item
          v-if="!isEdit || form.status !== 'ENDED'"
          label="当前档位（可选）"
          label-width="150px"
        >
          <el-select
            v-model="tierSelection"
            placeholder="未指定"
            clearable
            style="width: 260px"
            @change="onTierSelectChange"
          >
            <el-option label="未指定（启用时按现价推算）" value="not-set" />
            <el-option
              v-for="tier in form.tiers"
              :key="tier.level"
              :label="tierLabel(tier.level)"
              :value="tier.level"
            />
          </el-select>
          <span v-if="tierSelection === 'not-set'" class="tier-hint"
            >未指定：启用时按现价推算当前档位</span
          >
          <span v-else class="tier-hint"
            >持仓将变为
            {{ formatNumber(positionAt(tierSelection)) }}
            股（按该档位重算）</span
          >
        </el-form-item>
      </el-form>

      <div class="section">
        <h3>每档数量与估值区间</h3>
        <p class="hint">
          数量 ≥ 0 且为最小加减仓数量的整数倍（0 =
          该档不交易）；估值区间单选规则：基准档仅"合理"，上方档位可选
          高估/合理，下方档位可选 合理/低估。
        </p>
        <TierTableEditor
          v-if="tiersReady"
          v-model:tiers="form.tiers"
          :base-qty="form.baseQty"
          :base-price="form.basePrice"
          :keep-qty="form.keepQty"
          :min-unit-qty="form.minUnitQty"
        />
      </div>

      <div class="section">
        <h3>网格预览</h3>
        <GridLadder :tiers="form.tiers" />
      </div>

      <div class="section">
        <h3>策略备注（备考）</h3>
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="4"
          placeholder="记录策略的备考内容，例如：为什么选这个标的、估值依据、网格纪律提醒等。"
        />
      </div>

      <div class="footer-actions">
        <el-button @click="router.back()">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">
          保存策略
        </el-button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

import {
  createGridStrategy,
  getGridStrategy,
  updateGridStrategy
} from '@/api/grid-trading'
import { defaultValuation, formatNumber, tierLabel } from '@/utils/grid-trading'
import GridLadder from './components/GridLadder.vue'
import StockSearchSelect from './components/StockSearchSelect.vue'
import TierTableEditor from './components/TierTableEditor.vue'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => Boolean(route.params.id))
const strategyId = computed(() => Number(route.params.id))

const selectedStock = ref(null)
const saving = ref(false)
const tiersReady = ref(false)
const originalParams = ref(null)
const originalQtys = ref({})
const tierSelection = ref('not-set')
let loadingExisting = false

const form = reactive({
  stockCode: '',
  stockName: '',
  market: '',
  basePrice: 100,
  baseQty: 2000,
  intervalPct: 10,
  upTierCount: 5,
  downTierCount: 5,
  keepQty: 0,
  minUnitQty: 100,
  remark: '',
  status: 'DRAFT',
  currentTierLevel: null,
  tiers: []
})

watch(tierSelection, (value) => {
  form.currentTierLevel = value === 'not-set' ? null : value
})

watch(
  () => [
    form.basePrice,
    form.intervalPct,
    form.upTierCount,
    form.downTierCount,
    form.baseQty,
    form.keepQty,
    form.minUnitQty
  ],
  regenerateTiers
)

if (isEdit.value) {
  loadExisting()
} else {
  regenerateTiers()
}

async function loadExisting() {
  loadingExisting = true
  const { data } = await getGridStrategy(strategyId.value)
  const strategy = data.strategy
  Object.assign(form, {
    stockCode: strategy.stockCode,
    stockName: strategy.stockName,
    market: strategy.market,
    basePrice: strategy.basePrice,
    baseQty: strategy.baseQty,
    intervalPct: strategy.intervalPct,
    upTierCount: strategy.upTierCount,
    downTierCount: strategy.downTierCount,
    keepQty: strategy.keepQty,
    minUnitQty: strategy.minUnitQty,
    remark: strategy.remark || '',
    status: strategy.status,
    currentTierLevel: strategy.currentTierLevel ?? null,
    tiers: (strategy.tiers || []).map((tier) => ({ ...tier }))
  })
  tierSelection.value = strategy.currentTierLevel ?? 'not-set'
  selectedStock.value = {
    stockCode: strategy.stockCode,
    stockName: strategy.stockName,
    market: strategy.market
  }
  originalParams.value = {
    basePrice: strategy.basePrice,
    baseQty: strategy.baseQty,
    intervalPct: strategy.intervalPct,
    upTierCount: strategy.upTierCount,
    downTierCount: strategy.downTierCount,
    keepQty: strategy.keepQty,
    minUnitQty: strategy.minUnitQty
  }
  originalQtys.value = (strategy.tiers || []).reduce((map, tier) => {
    map[tier.level] = tier.qty
    return map
  }, {})
  // 等待参数 watcher 执行完（此时仍处于 loadingExisting 保护内），
  // 避免"自动生成"覆盖已保存的每档数量与估值区间
  await nextTick()
  form.tiers = (strategy.tiers || []).map((tier) => ({ ...tier }))
  loadingExisting = false
  tiersReady.value = true
}

function regenerateTiers() {
  if (loadingExisting) {
    return
  }
  form.tiers = buildTiers(form)
  const levels = form.tiers.map((tier) => tier.level)
  if (
    form.currentTierLevel !== null &&
    !levels.includes(form.currentTierLevel)
  ) {
    form.currentTierLevel = null
    tierSelection.value = 'not-set'
  }
  tiersReady.value = true
}

function buildTiers(params) {
  const ramp = [0.1, 0.15, 0.25, 0.4, 0.6, 0.8, 1.0, 1.2]
  const unit = params.minUnitQty
  const calcQty = (distance) =>
    Math.max(
      unit,
      Math.round((params.baseQty * ramp[distance - 1]) / unit) * unit
    )

  const rows = []
  for (let n = 1; n <= params.downTierCount; n += 1) {
    rows.push({
      level: n,
      price: round2(params.basePrice * (1 - (n * params.intervalPct) / 100)),
      direction: 'BUY',
      qty: calcQty(n),
      valuation: defaultValuation(n)
    })
  }
  rows.push({
    level: 0,
    price: params.basePrice,
    direction: 'BASE',
    qty: params.baseQty,
    valuation: '合理'
  })
  for (let n = 1; n <= params.upTierCount; n += 1) {
    rows.push({
      level: -n,
      price: round2(params.basePrice * (1 + params.intervalPct / 100) ** n),
      direction: 'SELL',
      qty: calcQty(n),
      valuation: defaultValuation(-n)
    })
  }

  const limit = params.baseQty - params.keepQty
  const upRows = rows.filter((row) => row.level < 0)
  if (upRows.length) {
    const highest = upRows.reduce((a, b) => (a.level < b.level ? a : b))
    const othersSum = upRows
      .filter((row) => row !== highest)
      .reduce((sum, row) => sum + row.qty, 0)
    highest.qty = Math.max(0, limit - othersSum)
  }
  return rows.sort((a, b) => a.level - b.level)
}

function round2(value) {
  return Math.round(value * 100) / 100
}

function onTierSelectChange(value) {
  tierSelection.value = value === null ? 'not-set' : value
}

function positionAt(level) {
  let position = form.baseQty
  for (const tier of form.tiers) {
    if (tier.level > 0 && tier.level <= level) {
      position += Number(tier.qty) || 0
    } else if (tier.level < 0 && tier.level >= level) {
      position -= Number(tier.qty) || 0
    }
  }
  return position
}

function structuralChanged() {
  if (!originalParams.value) {
    return false
  }
  if (
    originalParams.value.basePrice !== form.basePrice ||
    originalParams.value.baseQty !== form.baseQty ||
    originalParams.value.intervalPct !== form.intervalPct ||
    originalParams.value.upTierCount !== form.upTierCount ||
    originalParams.value.downTierCount !== form.downTierCount ||
    originalParams.value.keepQty !== form.keepQty ||
    originalParams.value.minUnitQty !== form.minUnitQty
  ) {
    return true
  }
  return form.tiers.some((tier) => originalQtys.value[tier.level] !== tier.qty)
}

async function save() {
  if (!selectedStock.value) {
    ElMessage.warning('请先选择标的')
    return
  }
  if (
    isEdit.value &&
    (form.status === 'RUNNING' || form.status === 'PAUSED') &&
    structuralChanged()
  ) {
    try {
      await ElMessageBox.confirm(
        '参数变更将按最新价重置当前档位与持仓，确定保存吗？',
        '提示',
        {
          type: 'warning',
          confirmButtonText: '确定保存',
          cancelButtonText: '取消'
        }
      )
    } catch {
      return
    }
  }
  const payload = {
    ...form,
    stockCode: selectedStock.value.stockCode,
    stockName: selectedStock.value.stockName,
    market: selectedStock.value.market,
    tiers: form.tiers
  }
  saving.value = true
  try {
    let id = strategyId.value
    if (isEdit.value) {
      await updateGridStrategy(id, payload)
    } else {
      const { data } = await createGridStrategy(payload)
      id = data.strategy.strategyId
    }
    ElMessage.success('保存成功')
    router.push(`/grid-trading/strategy/${id}`)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  h2 {
    margin: 0;
  }
}

.status-alert {
  margin-bottom: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 4px 24px;
}

.section {
  margin-top: 24px;

  h3 {
    margin: 0 0 8px;
  }

  .hint {
    margin: 0 0 12px;
    color: #909399;
    font-size: 12px;
    line-height: 1.7;
  }
}

.footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

.tier-hint {
  margin-left: 12px;
  color: #909399;
  font-size: 12px;
}
</style>
