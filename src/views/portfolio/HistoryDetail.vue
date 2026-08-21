<template>
  <div>
    <el-button class="back-btn" @click="$router.back()">返回</el-button>
    <h3>统计日期：{{ statsDate }}</h3>

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
            prop="earningsNote"
            label="当期业绩"
            min-width="220"
          />
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
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getPortfolioSnapshot } from '@/api/portfolio'

const route = useRoute()
const statsDate = route.params.statsDate
const activeTab = ref('total')
const positions = ref([])
const cash = ref({})

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

const industryOpts = computed(() => {
  const seen = []
  positions.value.forEach((p) => {
    if (p.industryL1 && !seen.includes(p.industryL1)) seen.push(p.industryL1)
  })
  return seen.map((v) => ({ text: v, value: v }))
})

const totalTable = computed(() => {
  const rows = [...positions.value]
  rows.push({ stockName: '现金', totalMv: cash.value.totalCash })
  return rows
})
const gtTable = computed(() => {
  const held = positions.value
    .filter(hasGt)
    .sort((a, b) => (b.gtMv || 0) - (a.gtMv || 0))
  held.push({ stockName: '现金', gtMv: cash.value.gtCash })
  return held
})
const paTable = computed(() => {
  const held = positions.value
    .filter(hasPa)
    .sort((a, b) => (b.paMv || 0) - (a.paMv || 0))
  held.push({ stockName: '现金', paMv: cash.value.paCash })
  return held
})

async function load() {
  try {
    const res = await getPortfolioSnapshot(statsDate)
    positions.value = res.data.positions || []
    cash.value = res.data.cash || {}
  } catch {
    // interceptor 已提示
  }
}

onMounted(load)
</script>

<style scoped>
.back-btn {
  margin-bottom: 10px;
}
</style>
