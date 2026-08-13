<template>
  <section class="page-shell">
    <div v-loading="loading" class="page-card">
      <div class="page-head">
        <div>
          <h2>
            {{ strategy?.stockName || '策略详情' }}
            <el-tag size="small" type="info">{{ strategy?.stockCode }}</el-tag>
            <el-tag
              size="small"
              :type="strategy?.market === 'H' ? 'warning' : 'primary'"
            >
              {{ strategy?.market === 'H' ? '港股' : 'A股' }}
            </el-tag>
            <el-tag size="small" :type="statusType(strategy?.status)">
              {{ statusLabel(strategy?.status) }}
            </el-tag>
          </h2>
          <p>
            启用时间：{{ strategy?.activatedAt || '—' }} · 基准价
            {{ formatPrice(strategy?.basePrice) }} · 基准数量
            {{ formatNumber(strategy?.baseQty) }} 股 · 间隔
            {{ strategy?.intervalPct }}% · 保留底仓
            {{ formatNumber(strategy?.keepQty) }}
          </p>
        </div>
        <div class="actions">
          <el-button @click="router.push('/grid-trading/strategy')"
            >返回列表</el-button
          >
          <el-button @click="goEdit">编辑</el-button>
          <el-button
            v-if="strategy?.status === 'RUNNING'"
            type="primary"
            :loading="refreshing"
            @click="refresh"
          >
            刷新股价
          </el-button>
          <el-button
            v-if="strategy?.status === 'RUNNING'"
            @click="openManualPrice"
            >手动设价</el-button
          >
          <el-button
            v-if="strategy?.status === 'RUNNING'"
            @click="openManualTrade"
            >手动记录成交</el-button
          >
          <el-button
            v-if="strategy?.status === 'RUNNING'"
            type="warning"
            @click="togglePause"
          >
            暂停
          </el-button>
          <el-button
            v-if="strategy?.status === 'PAUSED'"
            type="success"
            @click="toggleResume"
          >
            恢复
          </el-button>
          <el-button
            v-if="
              strategy?.status === 'RUNNING' || strategy?.status === 'PAUSED'
            "
            type="danger"
            @click="end"
          >
            结束
          </el-button>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">现价（手动刷新）</div>
          <div class="stat-value">{{ formatPrice(strategy?.lastPrice) }}</div>
          <div class="stat-hint">
            最后刷新：{{ strategy?.lastRefreshAt || '—' }}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">当前档位（已确认）</div>
          <div class="stat-value small">
            {{ tierLabelOf(strategy?.currentTierLevel) }}
          </div>
          <div class="stat-hint">只随"确认执行"变化</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">当前持仓</div>
          <div class="stat-value small">
            {{
              strategy?.positionQty
                ? `${formatNumber(strategy.positionQty)} 股`
                : '—'
            }}
          </div>
          <div class="stat-hint">
            基准 {{ formatNumber(strategy?.baseQty) }} 股
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">持仓市值</div>
          <div class="stat-value small">{{ marketValue }}</div>
          <div class="stat-hint">现价 × 当前持仓</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">待确认提示</div>
          <div v-if="pendingHints.length" class="stat-value small">
            {{ pendingHints.length }} 条
          </div>
          <div v-else class="stat-value small">—</div>
          <div class="stat-hint">系统只提示，不自动成交</div>
        </div>
      </div>

      <div class="two-col">
        <div class="section">
          <h3>待确认提示</h3>
          <div v-if="!pendingHints.length" class="empty">
            当前无待确认提示。刷新股价后，系统会在这里生成跨档提示。
          </div>
          <div
            v-for="hint in pendingHints"
            :key="hint.hintId"
            class="hint-item"
          >
            <el-tag
              size="small"
              :type="hint.action === 'SELL' ? 'danger' : 'success'"
            >
              {{ hint.action === 'SELL' ? '卖出' : '买入' }}
            </el-tag>
            <span class="hint-text">
              现价 {{ formatPrice(strategy?.lastPrice) }} 已{{
                hint.action === 'SELL' ? '升破' : '跌破'
              }}
              {{ tierLabel(hint.tierLevel) }}（档位价
              {{ formatPrice(hint.tierPrice) }}）→ 建议
              {{ hint.action === 'SELL' ? '卖出' : '买入' }}
              <b>{{ formatNumber(hint.qty) }}</b> 股
            </span>
            <el-button size="small" type="primary" @click="openConfirm(hint)">
              确认执行
            </el-button>
            <el-button size="small" @click="ignore(hint)">忽略</el-button>
          </div>
        </div>
        <div class="section">
          <h3>策略备注（备考）</h3>
          <div class="remark-box">{{ strategy?.remark || '暂无备注' }}</div>
        </div>
      </div>

      <div class="two-col">
        <div class="section">
          <h3>网格档位表</h3>
          <el-table :data="sortedTiers" size="small">
            <el-table-column label="档位" width="110">
              <template #default="{ row }">{{ tierLabel(row.level) }}</template>
            </el-table-column>
            <el-table-column label="方向" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="tagType(row)">
                  {{
                    row.level === 0 ? '基准' : row.level < 0 ? '减仓' : '加仓'
                  }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="档位价格" width="110">
              <template #default="{ row }">{{
                formatPrice(row.price)
              }}</template>
            </el-table-column>
            <el-table-column label="数量" width="110">
              <template #default="{ row }"
                >{{ formatNumber(row.qty) }} 股</template
              >
            </el-table-column>
            <el-table-column label="状态">
              <template #default="{ row }">
                <el-tag
                  v-if="row.level === strategy?.imminentLevel"
                  type="warning"
                  style="margin-right: 4px"
                >
                  {{
                    strategy?.imminentAction === 'SELL'
                      ? '即将升破'
                      : '即将跌破'
                  }}
                </el-tag>
                <el-tag
                  v-if="row.level === strategy?.currentTierLevel"
                  type="primary"
                >
                  当前档位 · 持仓
                  {{ formatNumber(strategy?.positionQty) }} 股
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div class="section">
          <h3>成交记录</h3>
          <el-table :data="records" size="small">
            <el-table-column prop="tradedAt" label="时间" width="160" />
            <el-table-column label="方向" width="80">
              <template #default="{ row }">
                <el-tag
                  size="small"
                  :type="row.action === 'SELL' ? 'danger' : 'success'"
                >
                  {{ row.action === 'SELL' ? '卖出' : '买入' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="档位" width="100">
              <template #default="{ row }">{{
                tierLabel(row.tierLevel)
              }}</template>
            </el-table-column>
            <el-table-column label="成交价" width="100">
              <template #default="{ row }">{{
                formatPrice(row.tradePrice)
              }}</template>
            </el-table-column>
            <el-table-column label="数量" width="100">
              <template #default="{ row }">{{
                formatNumber(row.qty)
              }}</template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" />
          </el-table>
          <p class="hint">
            v1 不计算交易费用；成交价与数量在确认弹窗中手动录入/修改。
          </p>
        </div>
      </div>
    </div>

    <HintConfirmDialog
      v-model:visible="confirmVisible"
      :hint="activeHint"
      :current-price="Number(strategy?.lastPrice) || 0"
      :min-unit-qty="Number(strategy?.minUnitQty) || 100"
      @confirm="confirmExecuted"
    />

    <el-dialog v-model="manualPriceVisible" title="手动设置股价" width="380px">
      <div class="manual-price-desc">
        当前档位
        {{
          tierLabelOf(strategy?.currentTierLevel)
        }}；填入股价后，系统会像"刷新股价"一样重新检测跨档并生成待确认提示（不依赖网络）。
      </div>
      <el-form label-width="60px">
        <el-form-item label="股价">
          <el-input-number
            v-model="manualPriceValue"
            :min="0.01"
            :precision="2"
            :step="0.01"
            style="width: 200px"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="manualPriceVisible = false">取消</el-button>
        <el-button type="primary" :loading="refreshing" @click="setManualPrice">
          确定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="manualTradeVisible" title="手动记录成交" width="460px">
      <div class="manual-price-desc">
        用于补录系统外已完成的成交（例如价格瞬时穿越未被刷新捕捉）。填写方向、成交价与数量后，系统按网格规则自动推导成交档位并更新状态。
      </div>
      <el-form label-width="70px">
        <el-form-item label="方向">
          <el-radio-group v-model="manualTradeForm.action">
            <el-radio-button value="SELL">卖出</el-radio-button>
            <el-radio-button value="BUY">买入</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="成交价">
          <el-input-number
            v-model="manualTradeForm.tradePrice"
            :min="0.01"
            :precision="2"
            :step="0.01"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number
            v-model="manualTradeForm.qty"
            :min="0"
            :step="Number(strategy?.minUnitQty) || 100"
            :step-strictly="true"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="manualTradeForm.remark"
            type="textarea"
            :rows="2"
            placeholder="可选，例如：场外成交补录"
          />
        </el-form-item>
      </el-form>
      <div class="manual-trade-preview">
        <template v-if="manualTradeSim">
          <template v-if="manualTradeSim.hints.length === 1">
            推导成交档位：{{
              tierLabelOf(manualTradeSim.hints[0].tierLevel)
            }}
            （{{ formatPrice(manualTradeSim.hints[0].tierPrice) }}）→ 保存后：
            当前档位 {{ tierLabelOf(manualTradeSim.hints[0].toLevel) }} · 持仓
            {{
              formatNumber(
                Number(strategy?.positionQty || 0) +
                  (manualTradeForm.action === 'SELL'
                    ? -Number(manualTradeForm.qty || 0)
                    : Number(manualTradeForm.qty || 0))
              )
            }}
            股
          </template>
          <template v-else>{{ manualTradeSim.error }}</template>
        </template>
        <template v-else
          >请输入有效的成交价后，系统将自动推导成交档位。</template
        >
      </div>
      <template #footer>
        <el-button @click="manualTradeVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="!canSubmitManualTrade"
          :loading="manualTradeSubmitting"
          @click="submitManualTrade"
        >
          确认记录
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import {
  confirmHint,
  endGridStrategy,
  getGridStrategy,
  ignoreHint,
  pauseGridStrategy,
  recordManualTrade as recordManualTradeApi,
  refreshGridPrice,
  resumeGridStrategy,
  setManualPrice as setManualPriceApi
} from '@/api/grid-trading'
import {
  formatNumber,
  formatPrice,
  tierLabel,
  valuationTagType
} from '@/utils/grid-trading'
import HintConfirmDialog from './components/HintConfirmDialog.vue'

const route = useRoute()
const router = useRouter()

const strategyId = Number(route.params.id)

const strategy = ref(null)
const loading = ref(false)
const refreshing = ref(false)
const confirmVisible = ref(false)
const activeHint = ref(null)
const manualPriceValue = ref(null)
const manualPriceVisible = ref(false)
const manualTradeVisible = ref(false)
const manualTradeSubmitting = ref(false)
const manualTradeForm = reactive({
  action: 'SELL',
  tradePrice: null,
  qty: 0,
  remark: ''
})

onMounted(load)

async function load() {
  loading.value = true
  try {
    const { data } = await getGridStrategy(strategyId)
    strategy.value = data.strategy
    manualPriceValue.value = data.strategy.lastPrice ?? null
  } finally {
    loading.value = false
  }
}

const sortedTiers = computed(() =>
  [...(strategy.value?.tiers || [])].sort((a, b) => a.level - b.level)
)

const pendingHints = computed(() => strategy.value?.pendingHints || [])

const records = computed(() => strategy.value?.records || [])

const marketValue = computed(() => {
  if (!strategy.value?.lastPrice || !strategy.value?.positionQty) return '—'
  return formatNumber(
    Number(strategy.value.lastPrice) * Number(strategy.value.positionQty)
  )
})

async function refresh() {
  refreshing.value = true
  try {
    await refreshGridPrice(strategyId)
    ElMessage.success('股价已刷新')
    await load()
  } finally {
    refreshing.value = false
  }
}

async function setManualPrice() {
  const price = Number(manualPriceValue.value)
  if (!price || price <= 0) {
    ElMessage.warning('请输入有效的股价')
    return
  }
  refreshing.value = true
  try {
    await setManualPriceApi(strategyId, price)
    ElMessage.success('已设置手动股价')
    manualPriceVisible.value = false
    await load()
  } finally {
    refreshing.value = false
  }
}

function openManualPrice() {
  manualPriceValue.value = strategy.value?.lastPrice ?? null
  manualPriceVisible.value = true
}

function openManualTrade() {
  manualTradeForm.action = 'SELL'
  manualTradeForm.tradePrice = strategy.value?.lastPrice ?? null
  manualTradeForm.qty = 0
  manualTradeForm.remark = ''
  manualTradeVisible.value = true
  const hints = manualTradeSim.value?.hints || []
  if (hints.length === 1) manualTradeForm.qty = hints[0].qty || 0
}

function simulateManualTrade(tiers, currentLevel, price, action) {
  const sorted = [...(tiers || [])].sort((a, b) => a.level - b.level)
  let idx = sorted.findIndex((tier) => tier.level === currentLevel)
  if (idx < 0) return { hints: [], error: '当前档位不在档位范围内' }
  const hints = []
  let cur = sorted[idx]
  if (action === 'SELL') {
    while (idx > 0 && price > cur.price) {
      const next = sorted[idx - 1]
      if (price > next.price) {
        const traded = Math.abs(cur.level) > Math.abs(next.level) ? cur : next
        hints.push({
          tierLevel: traded.level,
          tierPrice: traded.price,
          qty: traded.qty || 0,
          toLevel: next.level
        })
        cur = next
        idx -= 1
      } else break
    }
  } else {
    while (idx < sorted.length - 1 && price < cur.price) {
      const next = sorted[idx + 1]
      if (price < next.price) {
        const traded = Math.abs(cur.level) > Math.abs(next.level) ? cur : next
        hints.push({
          tierLevel: traded.level,
          tierPrice: traded.price,
          qty: traded.qty || 0,
          toLevel: next.level
        })
        cur = next
        idx += 1
      } else break
    }
  }
  let error = ''
  if (hints.length === 0) {
    error =
      action === 'SELL'
        ? '成交价未升破相邻更高档位价，无法推导卖出档位'
        : '成交价未跌破相邻更低档位价，无法推导买入档位'
  } else if (hints.length > 1) {
    error = `成交价一次跨越 ${hints.length} 个档位，无法确定成交档，请按每档分别补录`
  }
  return { hints, error }
}

const manualTradeSim = computed(() => {
  const price = Number(manualTradeForm.tradePrice)
  if (!price || price <= 0 || !strategy.value) return null
  return simulateManualTrade(
    sortedTiers.value,
    strategy.value.currentTierLevel,
    price,
    manualTradeForm.action
  )
})

const canSubmitManualTrade = computed(
  () => manualTradeSim.value?.hints.length === 1
)

watch(
  () => [
    manualTradeForm.action,
    manualTradeForm.tradePrice,
    strategy.value?.currentTierLevel
  ],
  () => {
    const hints = manualTradeSim.value?.hints || []
    if (hints.length === 1) manualTradeForm.qty = hints[0].qty || 0
  }
)

async function submitManualTrade() {
  const hints = manualTradeSim.value?.hints || []
  if (hints.length !== 1) {
    ElMessage.warning(manualTradeSim.value?.error || '无法推导成交档位')
    return
  }
  const price = Number(manualTradeForm.tradePrice)
  const qty = Number(manualTradeForm.qty)
  if (!price || price <= 0) {
    ElMessage.warning('请输入有效的成交价')
    return
  }
  if (!qty || qty <= 0) {
    ElMessage.warning('请输入成交数量')
    return
  }
  manualTradeSubmitting.value = true
  try {
    await recordManualTradeApi(strategyId, {
      action: manualTradeForm.action,
      tradePrice: price,
      qty,
      remark: manualTradeForm.remark
    })
    ElMessage.success('已记录成交')
    manualTradeVisible.value = false
    await load()
  } catch (error) {
    ElMessage.error(error.message || '记录失败')
  } finally {
    manualTradeSubmitting.value = false
  }
}

async function togglePause() {
  await pauseGridStrategy(strategyId)
  ElMessage.success('已暂停')
  await load()
}

async function toggleResume() {
  await resumeGridStrategy(strategyId)
  ElMessage.success('已恢复')
  await load()
}

async function end() {
  await endGridStrategy(strategyId)
  ElMessage.success('已结束')
  await load()
}

function openConfirm(hint) {
  activeHint.value = hint
  confirmVisible.value = true
}

function goEdit() {
  router.push(`/grid-trading/strategy/edit/${strategyId}`)
}

async function confirmExecuted(payload) {
  try {
    await confirmHint(activeHint.value.hintId, payload)
    ElMessage.success('已确认执行')
    confirmVisible.value = false
    await load()
  } catch (error) {
    ElMessage.error(error.message || '确认失败')
    confirmVisible.value = false
    await load()
  }
}

async function ignore(hint) {
  await ignoreHint(hint.hintId)
  ElMessage.success('已忽略')
  await load()
}

function tierLabelOf(level) {
  if (level === null || level === undefined) return '—'
  return tierLabel(level)
}

function tagType(row) {
  return valuationTagType(
    row.valuation || (row.level < 0 ? '高估' : row.level > 0 ? '低估' : '合理')
  )
}

function statusLabel(status) {
  return (
    {
      DRAFT: '未启用',
      RUNNING: '运行中',
      PAUSED: '暂停',
      ENDED: '已结束'
    }[status] || status
  )
}

function statusType(status) {
  return (
    {
      DRAFT: 'info',
      RUNNING: 'success',
      PAUSED: 'warning',
      ENDED: 'info'
    }[status] || 'info'
  )
}
</script>

<style scoped lang="scss">
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;

  h2 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  p {
    margin: 8px 0 0;
    color: #5d748b;
  }
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 12px;
}

.stat-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 14px 16px;
}

.stat-label {
  color: #909399;
  font-size: 12px;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;

  &.small {
    font-size: 15px;
  }
}

.stat-hint {
  color: #909399;
  font-size: 11px;
  margin-top: 4px;
}

.section {
  margin-top: 24px;

  h3 {
    margin: 0 0 12px;
  }

  .hint {
    margin: 10px 0 0;
    color: #909399;
    font-size: 12px;
  }
}

.two-col {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 24px;
  align-items: start;
  margin-top: 24px;

  .section {
    margin-top: 0;
  }
}

@media (max-width: 1100px) {
  .two-col {
    grid-template-columns: 1fr;
  }
}

.hint-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 10px;
}

.manual-price-desc {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 13px;
  color: #606266;
  line-height: 1.8;
  margin-bottom: 16px;
}

.manual-trade-preview {
  background: #fdf6ec;
  border: 1px solid #f3d19e;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 13px;
  color: #b88230;
  line-height: 1.6;
  margin-top: 4px;
}

.hint-text {
  flex: 1;
  color: #606266;
  line-height: 1.6;
}

.empty {
  color: #909399;
  text-align: center;
  padding: 24px 0;
  font-size: 13px;
  border: 1px dashed #e4e7ed;
  border-radius: 8px;
}

.remark-box {
  color: #606266;
  line-height: 1.9;
  white-space: pre-wrap;
  background: #fafafa;
  border-radius: 8px;
  padding: 12px 14px;
}
</style>
