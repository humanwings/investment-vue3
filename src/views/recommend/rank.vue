<template>
  <section class="page-shell list-page">
    <div class="page-card list-card">
      <div class="page-head">
        <div>
          <div class="eyebrow">Recommendation</div>
          <h2>大V推荐榜</h2>
        </div>
        <div class="actions">
          <el-date-picker
            v-model="query.snapshotDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="榜单日期"
          />
          <el-button type="primary" @click="getList">
            <el-icon><Search /></el-icon>
            <span>查询</span>
          </el-button>
          <el-button type="success" @click="refreshRanking">
            <el-icon><RefreshRight /></el-icon>
            <span>刷新榜单</span>
          </el-button>
          <el-tag type="info">榜单日期 {{ displaySnapshotDate }}</el-tag>
          <el-tag type="info">股票数 {{ total }}</el-tag>
        </div>
      </div>

      <div class="table-shell table-shell--fill">
        <el-table
          v-loading="listLoading"
          :data="list"
          :default-sort="{ prop: 'rankNo', order: 'ascending' }"
          height="100%"
          @row-dblclick="goDetail"
        >
        <el-table-column prop="rankNo" label="排名" width="80" align="center" />
        <el-table-column prop="stockCode" label="代码" width="100" align="center" />
        <el-table-column prop="stockName" label="名称" min-width="140" />
        <el-table-column prop="recommendScore" label="综合推荐分" width="120" sortable />
        <el-table-column prop="authorCount" label="推荐人数" width="100" sortable />
        <el-table-column prop="weightedAuthorCount" label="加权人数" width="110" sortable />
        <el-table-column label="平均仓位" width="100" align="center">
          <template #default="{ row }">
            {{ formatPercent(row.avgPositionRatio) }}
          </template>
        </el-table-column>
        <el-table-column prop="topAuthorName" label="核心大V" width="130" />
        <el-table-column prop="lastRecommendDate" label="最近推荐日" width="120" />
        <el-table-column label="估值偏差" width="110" align="center">
          <template #default="{ row }">
            {{ formatPercent(row.deviation) }}
          </template>
        </el-table-column>
        <el-table-column prop="financialScore" label="财务评分" width="100" sortable />
        <el-table-column prop="valuationScore" label="综合评分" width="100" sortable />
        <el-table-column prop="industryName" label="行业" min-width="140" />
        <el-table-column label="处理" width="110" fixed="right" align="center">
          <template #default="{ row }">
            <el-button text type="primary" @click="goDetail(row)">
              <el-icon><View /></el-icon>
              <span>查看详情</span>
            </el-button>
          </template>
        </el-table-column>
        </el-table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { RefreshRight, Search, View } from '@element-plus/icons-vue'

import { getRecommendRank, refreshRecommendRank } from '@/api/recommend'
import { formatPercent } from '@/utils'

const router = useRouter()
const listLoading = ref(false)
const list = ref([])
const total = ref(0)
const snapshotDate = ref('')
const query = reactive({
  snapshotDate: ''
})

const displaySnapshotDate = computed(() => query.snapshotDate || snapshotDate.value || '-')

getList()

async function getList() {
  listLoading.value = true
  try {
    const { data } = await getRecommendRank(query)
    list.value = data.list || []
    total.value = data.sum || 0
    snapshotDate.value = data.snapshotDate
    if (!query.snapshotDate) {
      query.snapshotDate = data.snapshotDate
    }
  } finally {
    listLoading.value = false
  }
}

async function refreshRanking() {
  listLoading.value = true
  try {
    const { data } = await refreshRecommendRank({
      snapshotDate: query.snapshotDate
    })
    snapshotDate.value = data.refresh.snapshotDate
    query.snapshotDate = data.refresh.snapshotDate
  } finally {
    listLoading.value = false
  }
  await getList()
  ElMessage.success('榜单已刷新')
}

function goDetail(row) {
  router.push({
    name: 'RecommendDetail',
    params: { stockCode: row.stockCode },
    query: { snapshotDate: query.snapshotDate }
  })
}
</script>

<style scoped lang="scss"></style>
