<template>
  <section class="page-shell valuation-workbench">
    <div class="page-header">
      <div>
        <div class="eyebrow">Profit Discount</div>
        <h2>利润贴现一览</h2>
        <p>横向比较利润贴现模型结果，后续接入调参与批量覆盖能力。</p>
      </div>
      <div class="header-actions">
        <IndustryFilter v-model="industryFilter" :industries="industries" />
        <el-tag type="info">骨架页</el-tag>
      </div>
    </div>

    <div class="page-card">
      <AssumptionStrip :items="assumptionItems" />
    </div>

    <div class="table-card list-card">
      <div class="table-shell table-shell--fill">
        <el-table :data="filteredRows" height="100%">
          <el-table-column prop="name" label="公司名称" min-width="130" />
          <el-table-column prop="industryName" label="行业" min-width="120" />
          <el-table-column prop="price" label="当前价" width="100" />
          <el-table-column
            prop="growthRatePrediction"
            label="系统增长率"
            width="120"
          />
          <el-table-column
            prop="growthRateAssumption"
            label="手动增长率"
            width="120"
          />
          <el-table-column
            prop="growthRateApplied"
            label="采用增长率"
            width="120"
          />
          <el-table-column prop="valuation" label="利润贴现估值" width="140" />
          <el-table-column prop="deviation" label="偏离率" width="110" />
          <el-table-column prop="signal" label="辅助判断" min-width="140" />
        </el-table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'

import AssumptionStrip from './components/AssumptionStrip.vue'
import IndustryFilter from './components/IndustryFilter.vue'

const industryFilter = ref('')

const rows = ref([
  {
    name: '示例公司',
    industryName: '示例行业',
    price: '-',
    growthRatePrediction: '-',
    growthRateAssumption: '-',
    growthRateApplied: '-',
    valuation: '-',
    deviation: '-',
    signal: '等待第 6 步接入接口'
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

const assumptionItems = [
  {
    label: '系统值',
    value: 'growth_rate_prediction',
    source: '模型预测'
  },
  {
    label: '手动值',
    value: 'growth_rate_manual',
    source: '研究覆盖'
  },
  {
    label: '采用值',
    value: 'growth_rate_applied',
    source: '估值计算'
  }
]
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
</style>
