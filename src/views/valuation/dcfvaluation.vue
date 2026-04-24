<template>
  <section class="page-shell valuation-workbench">
    <div class="page-header">
      <div>
        <div class="eyebrow">Discounted Cash Flow</div>
        <h2>DCF一览</h2>
        <p>承载 DCF 横向比较、核心假设和与利润贴现差异的工作台骨架。</p>
      </div>
      <div class="header-actions">
        <IndustryFilter v-model="industryFilter" :industries="industries" />
        <el-tag type="info">第 9 步接入模型</el-tag>
      </div>
    </div>

    <div class="page-card metric-grid">
      <ValuationMetric label="DCF 每股估值" value="-" hint="第 10 步上线" />
      <ValuationMetric label="终值占比" value="-" hint="用于识别假设敏感度" />
      <ValuationMetric label="与利润贴现差异" value="-" hint="跨模型比较" />
    </div>

    <div class="table-card list-card">
      <div class="table-shell table-shell--fill">
        <el-table :data="filteredRows" height="100%">
          <el-table-column prop="name" label="公司名称" min-width="130" />
          <el-table-column prop="industryName" label="行业" min-width="120" />
          <el-table-column prop="price" label="当前价" width="100" />
          <el-table-column prop="growthRate" label="采用增长率" width="120" />
          <el-table-column prop="discountRate" label="采用折现率" width="120" />
          <el-table-column
            prop="perpetualGrowthRate"
            label="永续增长率"
            width="120"
          />
          <el-table-column prop="dcfValue" label="DCF 每股估值" width="140" />
          <el-table-column prop="deviation" label="偏离率" width="110" />
          <el-table-column
            prop="terminalValueRatio"
            label="终值占比"
            width="110"
          />
          <el-table-column prop="modelGap" label="模型差异" min-width="130" />
        </el-table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'

import IndustryFilter from './components/IndustryFilter.vue'
import ValuationMetric from './components/ValuationMetric.vue'

const industryFilter = ref('')

const rows = ref([
  {
    name: '示例公司',
    industryName: '示例行业',
    price: '-',
    growthRate: '-',
    discountRate: '-',
    perpetualGrowthRate: '-',
    dcfValue: '-',
    deviation: '-',
    terminalValueRatio: '-',
    modelGap: '等待 DCF 存储结构'
  }
])

const industries = computed(() => [
  ...new Set(rows.value.map((item) => item.industryName).filter(Boolean))
])

const filteredRows = computed(() => {
  if (!industryFilter.value) {
    return rows.value
  }
  return rows.value.filter((item) => item.industryName === industryFilter.value)
})
</script>

<style scoped lang="scss">
p {
  margin: 0;
  color: var(--app-text-muted);
}

.valuation-workbench {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
</style>
