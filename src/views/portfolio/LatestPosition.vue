<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="importVisible = true"
        >导入 Excel</el-button
      >
      <el-button
        type="success"
        :loading="saving"
        :disabled="saving"
        @click="saveAll"
        >保存</el-button
      >
      <el-button @click="reset">重置</el-button>
      <span v-if="summary.statsDate" class="summary">
        最新统计日期：{{ summary.statsDate }} ｜ 持仓
        {{ summary.positionCount }} 只 ｜ 总市值(含现金)
        {{ format(totalAll) }}
        <span
          v-if="weekDiff !== null"
          class="diff"
          :class="weekDiff >= 0 ? 'up' : 'down'"
        >
          {{ weekDiff >= 0 ? '▲' : '▼' }} 较上周{{
            weekDiff >= 0 ? '增加' : '减少'
          }}
          {{ format(Math.abs(weekDiff)) }}
        </span>
      </span>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="总持仓" name="total">
        <el-table
          :data="totalTable"
          border
          stripe
          :header-cell-style="headerStyle"
          :row-class-name="rowClassName"
        >
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="stockName" label="名称" width="120" />
          <el-table-column
            prop="industryL1"
            label="一级行业"
            width="120"
            :filters="industryOpts"
            :filter-method="(value, row) => row.industryL1 === value"
          />
          <el-table-column
            label="总市值"
            width="120"
            align="right"
            header-align="right"
          >
            <template #default="{ row }">{{
              format(row.stockCode ? mv(row) : row.totalMv)
            }}</template>
          </el-table-column>
          <el-table-column
            label="总盈亏"
            width="120"
            align="right"
            header-align="right"
          >
            <template #default="{ row }">
              <span v-if="row.stockCode">{{ format(pl(row)) }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column
            label="来源"
            width="120"
            :filters="sourceOpts"
            :filter-method="(value, row) => row.sourceType === value"
          >
            <template #default="{ row }">
              <el-select
                v-if="editReady && row.stockCode"
                v-model="row.sourceType"
                size="small"
                clearable
                :persistent="false"
                @change="onSourceChange(row)"
              >
                <el-option
                  v-for="v in sources"
                  :key="v"
                  :label="v"
                  :value="v"
                />
              </el-select>
              <span v-else-if="row.stockCode">{{ row.sourceType }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column
            label="买入原因"
            width="110"
            :filters="reasonOpts"
            :filter-method="(value, row) => row.buyReason === value"
          >
            <template #default="{ row }">
              <el-select
                v-if="editReady && row.stockCode"
                v-model="row.buyReason"
                size="small"
                clearable
                :persistent="false"
                :disabled="row.sourceType === '大V推荐'"
              >
                <el-option
                  v-for="v in buyReasons"
                  :key="v"
                  :label="v"
                  :value="v"
                />
              </el-select>
              <span v-else-if="row.stockCode">{{ row.buyReason }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column
            label="持股策略"
            width="110"
            :filters="strategyOpts"
            :filter-method="(value, row) => row.holdStrategy === value"
          >
            <template #default="{ row }">
              <el-select
                v-if="editReady && row.stockCode"
                v-model="row.holdStrategy"
                size="small"
                clearable
                :persistent="false"
              >
                <el-option
                  v-for="v in holdStrategies"
                  :key="v"
                  :label="v"
                  :value="v"
                />
              </el-select>
              <span v-else-if="row.stockCode">{{ row.holdStrategy }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="持股计划" width="150">
            <template #default="{ row }">
              <el-input
                v-if="editReady && row.stockCode"
                v-model="row.holdPlan"
                size="small"
              />
              <span v-else-if="row.stockCode">{{ row.holdPlan }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="当期业绩" min-width="180">
            <template #default="{ row }">
              <el-input
                v-if="editReady && row.stockCode"
                v-model="row.earningsNote"
                type="textarea"
                :rows="1"
                :autosize="{ minRows: 1, maxRows: 10 }"
                class="note-input"
              />
              <span v-else-if="row.stockCode">{{ row.earningsNote }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="备考" min-width="220">
            <template #default="{ row }">
              <el-input
                v-if="editReady && row.stockCode"
                v-model="row.archiveRemark"
                type="textarea"
                :rows="1"
                :autosize="{ minRows: 1, maxRows: 10 }"
                class="note-input"
              />
              <span v-else-if="row.stockCode">{{ row.archiveRemark }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="国泰海通" name="gt" lazy>
        <el-table
          :data="gtTable"
          border
          stripe
          :header-cell-style="headerStyle"
          :row-class-name="rowClassName"
        >
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="stockName" label="名称" width="120" />
          <el-table-column prop="stockCode" label="代码" width="100" />
          <el-table-column
            prop="gtQty"
            label="数量"
            width="90"
            align="right"
            header-align="right"
          />
          <el-table-column
            label="市值"
            width="110"
            align="right"
            header-align="right"
          >
            <template #default="{ row }">{{ format(row.gtMv) }}</template>
          </el-table-column>
          <el-table-column
            label="成本价"
            width="100"
            align="right"
            header-align="right"
          >
            <template #default="{ row }">{{ row.gtCost ?? '-' }}</template>
          </el-table-column>
          <el-table-column
            label="浮动盈亏"
            width="110"
            align="right"
            header-align="right"
          >
            <template #default="{ row }">{{ format(row.gtPl) }}</template>
          </el-table-column>
          <el-table-column
            prop="earningsNote"
            label="当期业绩"
            min-width="220"
          />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="平安证券" name="pa" lazy>
        <el-table
          :data="paTable"
          border
          stripe
          :header-cell-style="headerStyle"
          :row-class-name="rowClassName"
        >
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="stockName" label="名称" width="120" />
          <el-table-column prop="stockCode" label="代码" width="100" />
          <el-table-column
            prop="paQty"
            label="数量"
            width="90"
            align="right"
            header-align="right"
          />
          <el-table-column
            label="市值"
            width="110"
            align="right"
            header-align="right"
          >
            <template #default="{ row }">{{ format(row.paMv) }}</template>
          </el-table-column>
          <el-table-column
            label="成本价"
            width="100"
            align="right"
            header-align="right"
          >
            <template #default="{ row }">{{ row.paCost ?? '-' }}</template>
          </el-table-column>
          <el-table-column
            label="浮动盈亏"
            width="110"
            align="right"
            header-align="right"
          >
            <template #default="{ row }">{{ format(row.paPl) }}</template>
          </el-table-column>
          <el-table-column
            prop="earningsNote"
            label="当期业绩"
            min-width="220"
          />
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <ImportDialog v-model:visible="importVisible" @success="load" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getPortfolioLatest,
  getPortfolioSnapshots,
  saveAllPortfolio
} from '@/api/portfolio'
import ImportDialog from './components/ImportDialog.vue'

const sources = ['大V推荐', '自选']
const buyReasons = ['蓝筹', '反转', '短线', '其他']
const holdStrategies = ['非卖品', '长期持有', '中期持有', '可卖品', '跟随大V']

const activeTab = ref('total')
const importVisible = ref(false)
const summary = ref({})
const positions = ref([])
const prevAll = ref(null)
const saving = ref(false)
// 首屏先渲染纯文本表格，下一帧再挂载行内编辑组件（el-select/textarea），
// 避免一次性挂载大量表单组件长时间阻塞主线程
const editReady = ref(false)

const totalAll = computed(
  () => (summary.value.totalMv || 0) + (summary.value.totalCash || 0)
)
const weekDiff = computed(() =>
  prevAll.value == null ? null : totalAll.value - prevAll.value
)

const headerStyle = { background: '#16305a', color: '#fff', fontWeight: '700' }
function rowClassName({ row }) {
  return row.stockCode ? '' : 'cash-row'
}

function format(v) {
  return v == null
    ? '-'
    : Number(v).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}
function mv(row) {
  return (row.gtMv || 0) + (row.paMv || 0)
}
function pl(row) {
  return (row.gtPl || 0) + (row.paPl || 0)
}
function hasGt(p) {
  return p.gtQty != null || p.gtMv != null || p.gtCost != null || p.gtPl != null
}
function hasPa(p) {
  return p.paQty != null || p.paMv != null || p.paCost != null || p.paPl != null
}

function opts(key) {
  const seen = []
  positions.value.forEach((p) => {
    const v = p[key]
    if (v && !seen.includes(v)) seen.push(v)
  })
  return seen.map((v) => ({ text: v, value: v }))
}
const industryOpts = computed(() => opts('industryL1'))
const sourceOpts = computed(() => opts('sourceType'))
const reasonOpts = computed(() => opts('buyReason'))
const strategyOpts = computed(() => opts('holdStrategy'))

const totalTable = computed(() => {
  const rows = [...positions.value]
  rows.push({ stockName: '现金', totalMv: summary.value.totalCash })
  return rows
})
const gtTable = computed(() => {
  const held = positions.value
    .filter(hasGt)
    .sort((a, b) => (b.gtMv || 0) - (a.gtMv || 0))
  held.push({ stockName: '现金', gtMv: summary.value.gtCash })
  return held
})
const paTable = computed(() => {
  const held = positions.value
    .filter(hasPa)
    .sort((a, b) => (b.paMv || 0) - (a.paMv || 0))
  held.push({ stockName: '现金', paMv: summary.value.paCash })
  return held
})

async function load() {
  try {
    editReady.value = false
    const [res, sres] = await Promise.all([
      getPortfolioLatest(),
      getPortfolioSnapshots()
    ])
    summary.value = res.data.summary || {}
    positions.value = (res.data.positions || []).map((p) => ({
      ...p,
      sourceType: p.sourceType || '',
      bigV: p.bigV || '',
      buyReason: p.buyReason || '',
      holdStrategy: p.holdStrategy || '',
      holdPlan: p.holdPlan || '',
      archiveRemark: p.archiveRemark || ''
    }))
    const snaps = sres.data.snapshots || []
    const idx = snaps.findIndex((s) => s.statsDate === summary.value.statsDate)
    const prevRow = idx >= 0 && idx + 1 < snaps.length ? snaps[idx + 1] : null
    prevAll.value = prevRow
      ? (prevRow.totalMv || 0) + (prevRow.totalCash || 0)
      : null
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        editReady.value = true
      })
    })
  } catch {
    // interceptor 已提示
  }
}

function onSourceChange(row) {
  if (row.sourceType === '大V推荐') row.buyReason = ''
}

async function saveAll() {
  if (saving.value) return
  saving.value = true
  try {
    await saveAllWithRetry(3)
    ElMessage.success('保存成功')
  } catch (e) {
    const msg = String(e?.message || '').toLowerCase()
    const busy =
      msg.includes('sqlite_busy') || msg.includes('database is locked')
    if (busy) {
      ElMessage.error('保存失败：数据库正忙，请稍后重试')
    }
    // 其它错误已由 request 拦截器提示
  } finally {
    saving.value = false
  }
}

async function saveAllWithRetry(maxAttempts) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await persistAll()
      return
    } catch (e) {
      const msg = String(e?.message || '').toLowerCase()
      const busy =
        msg.includes('sqlite_busy') || msg.includes('database is locked')
      if (!busy || attempt === maxAttempts) {
        throw e
      }
      await sleep(300 * attempt)
    }
  }
}

async function persistAll() {
  const items = positions.value
    .filter((p) => p.stockCode)
    .map((row) => ({
      stockCode: row.stockCode,
      stockName: row.stockName,
      sourceType: row.sourceType || null,
      bigV: row.sourceType === '大V推荐' ? row.bigV : null,
      buyReason: row.buyReason || null,
      holdStrategy: row.holdStrategy || null,
      holdPlan: row.holdPlan,
      remark: row.archiveRemark,
      positionId: row.positionId != null ? row.positionId : null,
      earningsNote: row.earningsNote || null
    }))
  await saveAllPortfolio(items)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function reset() {
  try {
    await ElMessageBox.confirm(
      '将放弃本次所有未保存的修改，确定重置吗？',
      '提示',
      {
        confirmButtonText: '重置',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await load()
  } catch {
    // 用户取消，不处理
  }
}

onMounted(load)
</script>

<style scoped>
.toolbar {
  margin-bottom: 12px;
}
.summary {
  margin-left: 14px;
  color: #606266;
}
.diff {
  margin-left: 12px;
  font-weight: 700;
}
:deep(.el-table th.el-table__cell) {
  background: #16305a;
  color: #fff;
  border-color: #2b4a78;
}
:deep(
  .el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell
) {
  background: #eef4fb;
}
.cash-row td.el-table__cell {
  background: #e5effc !important;
  font-weight: 700;
}
.up {
  color: #f56c6c;
}
.down {
  color: #67c23a;
}
:deep(.note-input .el-textarea__inner) {
  resize: vertical;
}
</style>
