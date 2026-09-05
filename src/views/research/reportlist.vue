<template>
  <section class="page-shell research-workbench">
    <div class="page-header">
      <div>
        <div class="eyebrow">Research Reports</div>
        <div class="title-row">
          <h2>公司分析报告</h2>
          <el-tag class="total-tag" type="info">
            报告总数 {{ stats.total }}
          </el-tag>
        </div>
        <p>
          管理 Buffett
          框架深度分析报告，从本地证券分析工作区导入，与公司估值档案关联。
        </p>
      </div>
      <div class="header-actions">
        <el-button
          type="primary"
          :loading="importing"
          @click="openImportDialog"
        >
          <el-icon><Upload /></el-icon>
          <span>导入/刷新报告</span>
        </el-button>
      </div>
    </div>

    <div class="page-card stat-card">
      <div class="stat-row">
        <div
          v-for="item in verdictStatItems"
          :key="item.verdict"
          class="stat-item"
        >
          <span class="stat-label">{{ item.verdict || '未解析' }}</span>
          <strong class="stat-value">{{ item.cnt }}</strong>
        </div>
      </div>
    </div>

    <div class="page-card filter-card">
      <div class="filter-row">
        <el-input
          v-model="keyword"
          class="filter-input"
          placeholder="公司名称 / 代码 / 标题"
          clearable
          @keyup.enter="loadReports"
          @clear="loadReports"
        />
        <el-select
          v-model="verdictFilter"
          class="filter-select"
          placeholder="结论"
          clearable
          @change="loadReports"
        >
          <el-option
            v-for="item in verdictOptions"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>
        <el-button @click="loadReports">
          <el-icon><Search /></el-icon>
          <span>查询</span>
        </el-button>
      </div>
    </div>

    <div class="table-card list-card">
      <div class="table-shell">
        <el-table v-loading="loading" :data="rows" row-key="reportId">
          <el-table-column fixed label="公司" min-width="160">
            <template #default="{ row }">
              <div class="company-cell">
                <strong>{{ row.stockName }}</strong>
                <span>{{ row.stockCode }}.{{ row.exchange }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="结论" width="110">
            <template #default="{ row }">
              <el-tag :type="verdictTagType(row.verdict)">
                {{ row.verdict || '未解析' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="完整性得分" width="110">
            <template #default="{ row }">
              {{ formatScore(row.completenessScore) }}
            </template>
          </el-table-column>
          <el-table-column label="护城河" min-width="150">
            <template #default="{ row }">
              <span v-if="row.moatType">{{ row.moatType }}</span>
              <el-tag v-if="row.moatStrength" size="small" class="moat-tag">
                {{ row.moatStrength }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="内在价值区间" width="130">
            <template #default="{ row }">
              {{ formatValueRange(row) }}
            </template>
          </el-table-column>
          <el-table-column label="推荐买入价" width="110">
            <template #default="{ row }">
              {{ row.buyPrice ?? '—' }}
            </template>
          </el-table-column>
          <el-table-column prop="analysisDate" label="分析日期" width="110" />
          <el-table-column
            label="报告标题"
            min-width="220"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              {{ row.title }}
            </template>
          </el-table-column>
          <el-table-column prop="updatedAt" label="更新时间" width="160" />
          <el-table-column fixed="right" label="操作" width="140">
            <template #default="{ row }">
              <div class="row-actions">
                <el-button text type="primary" @click="goDetail(row)">
                  <el-icon><View /></el-icon>
                  <span>查看</span>
                </el-button>
                <el-button text type="danger" @click="confirmDelete(row)">
                  <el-icon><Delete /></el-icon>
                  <span>删除</span>
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog
      v-model="importDialogVisible"
      title="导入证券分析报告"
      width="560px"
    >
      <p class="import-hint">
        扫描目录下一级公司文件夹中的 *-buffett-analysis.md 报告并导入。
        内容未变化的报告会自动跳过。
      </p>
      <el-input v-model="importDirectory" placeholder="报告根目录" />
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="importing" @click="runImport">
          开始导入
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { Delete, Search, Upload, View } from '@element-plus/icons-vue'

import {
  deleteResearchReport,
  getResearchReportList,
  importResearchReports
} from '@/api/researchreport'

const DEFAULT_DIRECTORY = 'E:/finance/securities'

const router = useRouter()
const loading = ref(false)
const importing = ref(false)
const rows = ref([])
const stats = ref({ total: 0, verdicts: [] })
const keyword = ref('')
const verdictFilter = ref('')
const importDialogVisible = ref(false)
const importDirectory = ref(DEFAULT_DIRECTORY)

const verdictStatItems = computed(() => stats.value.verdicts || [])

const verdictOptions = computed(() =>
  (stats.value.verdicts || [])
    .map((item) => item.verdict)
    .filter((verdict) => verdict)
)

loadReports()

async function loadReports() {
  loading.value = true
  try {
    const { data } = await getResearchReportList({
      keyword: keyword.value || undefined,
      verdict: verdictFilter.value || undefined
    })
    rows.value = data.list || []
    stats.value = data.stats || { total: 0, verdicts: [] }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

function openImportDialog() {
  importDirectory.value = importDirectory.value || DEFAULT_DIRECTORY
  importDialogVisible.value = true
}

async function runImport() {
  importing.value = true
  try {
    const { data } = await importResearchReports(importDirectory.value)
    const result = data.result || {}
    importDialogVisible.value = false
    ElNotification.success({
      title: '导入完成',
      message: `新增 ${result.inserted ?? 0} 篇，更新 ${result.updated ?? 0} 篇，跳过 ${
        result.skipped ?? 0
      } 篇`
    })
    if ((result.warnings || []).length) {
      ElNotification.warning({
        title: '部分报告解析不完整',
        message: result.warnings.slice(0, 5).join('\n'),
        duration: 6000
      })
    }
    if ((result.failures || []).length) {
      ElNotification.error({
        title: '导入失败条目',
        message: result.failures.slice(0, 5).join('\n'),
        duration: 6000
      })
    }
    await loadReports()
  } catch {
    console.error('导入报告失败')
  } finally {
    importing.value = false
  }
}

async function confirmDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确认删除「${row.stockName}」的分析报告？`,
      '删除报告',
      { type: 'warning' }
    )
  } catch {
    return
  }
  try {
    await deleteResearchReport(row.reportId)
    ElMessage.success('报告已删除')
    await loadReports()
  } catch (error) {
    console.error(error)
  }
}

function goDetail(row) {
  router.push({
    name: 'ResearchReportDetail',
    params: { id: row.reportId }
  })
}

function verdictTagType(verdict) {
  if (!verdict) return 'info'
  if (verdict.includes('买')) return 'success'
  if (verdict === '不买' || verdict === '卖出') return 'danger'
  if (verdict === '继续观察') return 'warning'
  return 'primary'
}

function formatScore(score) {
  return score === null || score === undefined ? '—' : `${score} / 21`
}

function formatValueRange(row) {
  if (row.intrinsicValueLow === null || row.intrinsicValueLow === undefined) {
    return '—'
  }
  if (row.intrinsicValueHigh === null || row.intrinsicValueHigh === undefined) {
    return `${row.intrinsicValueLow}`
  }
  return `${row.intrinsicValueLow} ~ ${row.intrinsicValueHigh}`
}
</script>

<style scoped>
.research-workbench .stat-card {
  padding: 16px 20px;
}

.stat-row {
  display: flex;
  flex-wrap: wrap;
  gap: 28px;
}

.stat-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.stat-label {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
}

.filter-card {
  padding: 14px 16px;
}

.filter-row {
  display: flex;
  gap: 10px;
}

.filter-input {
  width: 260px;
}

.filter-select {
  width: 150px;
}

.table-shell {
  min-height: 320px;
}

.company-cell {
  display: flex;
  flex-direction: column;
  line-height: 1.4;
}

.company-cell span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.moat-tag {
  margin-left: 6px;
}

.row-actions {
  display: flex;
  gap: 4px;
}

.import-hint {
  margin: 0 0 12px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.6;
}
</style>
