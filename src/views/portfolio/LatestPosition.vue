<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="importVisible = true"
        >导入 Excel</el-button
      >
      <span v-if="summary.statsDate" class="summary">
        最新统计日期：{{ summary.statsDate }} ｜ 持仓
        {{ summary.positionCount }} 只 ｜ 总市值
        {{ format(summary.totalMv) }} ｜ 总盈亏 {{ format(summary.totalPl) }}
      </span>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="总持仓" name="total">
        <el-table :data="totalTable" border stripe>
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="stockName" label="名称" width="120" />
          <el-table-column
            prop="industryL1"
            label="一级行业"
            width="120"
            :filters="industryOpts"
            :filter-method="(value, row) => row.industryL1 === value"
          />
          <el-table-column label="总市值" width="120">
            <template #default="{ row }">{{
              format(row.stockCode ? mv(row) : row.totalMv)
            }}</template>
          </el-table-column>
          <el-table-column label="总盈亏" width="120">
            <template #default="{ row }">{{
              format(row.stockCode ? pl(row) : '-')
            }}</template>
          </el-table-column>
          <el-table-column
            label="来源"
            width="120"
            :filters="sourceOpts"
            :filter-method="(value, row) => row.sourceType === value"
          >
            <template #default="{ row }">
              <el-select
                v-if="row.stockCode"
                v-model="row.sourceType"
                size="small"
                clearable
              >
                <el-option
                  v-for="v in sources"
                  :key="v"
                  :label="v"
                  :value="v"
                />
              </el-select>
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
                v-if="row.stockCode"
                v-model="row.buyReason"
                size="small"
                clearable
              >
                <el-option
                  v-for="v in buyReasons"
                  :key="v"
                  :label="v"
                  :value="v"
                />
              </el-select>
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
                v-if="row.stockCode"
                v-model="row.holdStrategy"
                size="small"
                clearable
              >
                <el-option
                  v-for="v in holdStrategies"
                  :key="v"
                  :label="v"
                  :value="v"
                />
              </el-select>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="持股计划" width="150">
            <template #default="{ row }">
              <el-input
                v-if="row.stockCode"
                v-model="row.holdPlan"
                size="small"
              />
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="当期业绩" min-width="180">
            <template #default="{ row }">
              <el-input
                v-if="row.stockCode"
                v-model="row.earningsNote"
                size="small"
                type="textarea"
                :rows="1"
              />
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="备考" min-width="220">
            <template #default="{ row }">
              <el-input
                v-if="row.stockCode"
                v-model="row.archiveRemark"
                size="small"
              />
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.stockCode"
                type="primary"
                link
                @click="saveRow(row)"
              >
                保存
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="国泰海通" name="gt">
        <el-table :data="gtTable" border stripe>
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="stockName" label="名称" width="120" />
          <el-table-column prop="stockCode" label="代码" width="100" />
          <el-table-column prop="gtQty" label="数量" width="90" />
          <el-table-column label="市值" width="110">
            <template #default="{ row }">{{ format(row.gtMv) }}</template>
          </el-table-column>
          <el-table-column label="成本价" width="100">
            <template #default="{ row }">{{ row.gtCost ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="浮动盈亏" width="110">
            <template #default="{ row }">{{ format(row.gtPl) }}</template>
          </el-table-column>
          <el-table-column
            prop="earningsNote"
            label="当期业绩"
            min-width="220"
          />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="平安证券" name="pa">
        <el-table :data="paTable" border stripe>
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="stockName" label="名称" width="120" />
          <el-table-column prop="stockCode" label="代码" width="100" />
          <el-table-column prop="paQty" label="数量" width="90" />
          <el-table-column label="市值" width="110">
            <template #default="{ row }">{{ format(row.paMv) }}</template>
          </el-table-column>
          <el-table-column label="成本价" width="100">
            <template #default="{ row }">{{ row.paCost ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="浮动盈亏" width="110">
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
import { ElMessage } from 'element-plus'
import {
  getPortfolioLatest,
  updatePortfolioArchive,
  updatePositionEarnings
} from '@/api/portfolio'
import ImportDialog from './components/ImportDialog.vue'

const sources = ['大V推荐', '自选']
const buyReasons = ['蓝筹', '反转', '短线', '其他']
const holdStrategies = ['非卖品', '长期持有', '中期持有', '可卖品', '跟随大V']

const activeTab = ref('total')
const importVisible = ref(false)
const summary = ref({})
const positions = ref([])

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
    const res = await getPortfolioLatest()
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
  } catch {
    // interceptor 已提示
  }
}

async function saveRow(row) {
  try {
    await updatePortfolioArchive(row.stockCode, {
      stockName: row.stockName,
      sourceType: row.sourceType || null,
      bigV: row.sourceType === '大V推荐' ? row.bigV : null,
      buyReason: row.buyReason || null,
      holdStrategy: row.holdStrategy || null,
      holdPlan: row.holdPlan,
      remark: row.archiveRemark
    })
    if (row.positionId != null) {
      await updatePositionEarnings(row.positionId, row.earningsNote || null)
    }
    ElMessage.success('保存成功')
    await load()
  } catch {
    // interceptor 已提示
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
</style>
