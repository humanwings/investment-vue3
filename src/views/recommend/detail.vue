<template>
  <section class="page-shell">
    <div class="page-card">
      <div class="page-head">
        <div>
          <el-button text @click="router.back()">返回</el-button>
          <div class="eyebrow">Recommendation</div>
          <h2>推荐详情</h2>
        </div>
        <div class="actions">
          <el-tag type="info"
            >股票 {{ summary.stockName || '-' }} ({{
              summary.stockCode || '-'
            }})</el-tag
          >
          <el-tag type="info">榜单日期 {{ snapshotDate || '-' }}</el-tag>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-label">榜单排名</div>
          <div class="summary-value">{{ summary.rankNo || '-' }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">综合推荐分</div>
          <div class="summary-value">{{ summary.recommendScore || '-' }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">推荐人数</div>
          <div class="summary-value">{{ summary.authorCount || '-' }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">估值偏差</div>
          <div class="summary-value">
            {{ formatPercent(summary.deviation) }}
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-label">财务评分</div>
          <div class="summary-value">{{ summary.financialScore || '-' }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">行业</div>
          <div class="summary-value">{{ summary.industryName || '-' }}</div>
        </div>
      </div>

      <div class="table-shell">
        <el-table v-loading="listLoading" :data="list" class="detail-table">
          <el-table-column prop="authorName" label="大V" width="140" />
          <el-table-column prop="sourceSite" label="来源" width="120" />
          <el-table-column prop="tradeDate" label="推荐日" width="120" />
          <el-table-column prop="actionType" label="动作" width="90" />
          <el-table-column label="仓位" width="90">
            <template #default="{ row }">
              {{ formatPercent(row.positionRatio) }}
            </template>
          </el-table-column>
          <el-table-column prop="authorWeight" label="大V权重" width="100" />
          <el-table-column prop="positionWeight" label="仓位权重" width="100" />
          <el-table-column prop="decayWeight" label="时效权重" width="100" />
          <el-table-column
            prop="contributionScore"
            label="贡献分"
            width="100"
            sortable
          />
          <el-table-column label="链接" min-width="180">
            <template #default="{ row }">
              <el-link
                v-if="row.sourceUrl"
                :href="row.sourceUrl"
                target="_blank"
                type="primary"
                >源地址</el-link
              >
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getRecommendDetail } from '@/api/recommend'
import { formatPercent } from '@/utils'

const route = useRoute()
const router = useRouter()
const listLoading = ref(false)
const summary = ref({})
const list = ref([])

const stockCode = route.params.stockCode
const snapshotDate = route.query.snapshotDate || ''

getDetail()

async function getDetail() {
  listLoading.value = true
  try {
    const { data } = await getRecommendDetail(stockCode, { snapshotDate })
    summary.value = data.summary || {}
    list.value = data.list || []
  } finally {
    listLoading.value = false
  }
}
</script>

<style scoped lang="scss">
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.summary-item {
  padding: 12px;
  border-radius: 16px;
  background: #f5f7fa;
}

.summary-label {
  color: #909399;
  font-size: 12px;
}

.summary-value {
  margin-top: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
</style>
