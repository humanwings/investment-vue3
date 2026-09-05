<template>
  <section v-loading="loading" class="page-shell report-detail">
    <div class="page-header">
      <div>
        <el-button text @click="goBack">返回上一级</el-button>
        <div class="eyebrow">Research Report</div>
        <h2>{{ report.title || '报告详情' }}</h2>
      </div>
    </div>

    <template v-if="report.reportId">
      <div class="page-card summary-card">
        <el-descriptions :column="4" border>
          <el-descriptions-item label="公司">
            {{ report.stockName }}（{{ report.stockCode }}.{{
              report.exchange
            }}）
          </el-descriptions-item>
          <el-descriptions-item label="结论">
            <el-tag :type="verdictTagType(report.verdict)">
              {{ report.verdict || '未解析' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="完整性得分">
            {{ formatScore(report.completenessScore) }}
          </el-descriptions-item>
          <el-descriptions-item label="分析日期">
            {{ report.analysisDate || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="能力圈">
            {{ report.circleOfCompetence || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="护城河">
            {{ formatMoat(report) }}
          </el-descriptions-item>
          <el-descriptions-item label="内在价值区间">
            {{ formatValueRange(report) }}
          </el-descriptions-item>
          <el-descriptions-item label="推荐买入价">
            {{ report.buyPrice ?? '—' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="page-card content-card">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="markdown-body" v-html="renderedContent" />
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import { getResearchReport } from '@/api/researchreport'
import { renderMarkdown } from '@/utils/markdown'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const report = ref({})

loadReport()

const renderedContent = computed(() => renderMarkdown(report.value.content))

async function loadReport() {
  loading.value = true
  try {
    const { data } = await getResearchReport(route.params.id)
    report.value = data.report || {}
  } catch (error) {
    console.error(error)
    ElMessage.error('报告加载失败')
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push({ name: 'ResearchReportList' })
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

function formatMoat(report) {
  const parts = []
  if (report.moatType) parts.push(report.moatType)
  if (report.moatStrength) parts.push(`强度：${report.moatStrength}`)
  if (report.moatTrend) parts.push(`趋势：${report.moatTrend}`)
  return parts.join('；') || '—'
}

function formatValueRange(report) {
  if (
    report.intrinsicValueLow === null ||
    report.intrinsicValueLow === undefined
  ) {
    return '—'
  }
  if (
    report.intrinsicValueHigh === null ||
    report.intrinsicValueHigh === undefined
  ) {
    return `${report.intrinsicValueLow}`
  }
  return `${report.intrinsicValueLow} ~ ${report.intrinsicValueHigh}`
}
</script>

<style scoped>
.report-detail .summary-card {
  padding: 16px 20px;
}

.content-card {
  padding: 20px 28px;
}

.markdown-body {
  line-height: 1.75;
  font-size: 14px;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.markdown-body :deep(h1) {
  font-size: 22px;
  margin: 24px 0 14px;
}

.markdown-body :deep(h2) {
  font-size: 19px;
  margin: 26px 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.markdown-body :deep(h3) {
  font-size: 16px;
  margin: 20px 0 10px;
}

.markdown-body :deep(h4) {
  font-size: 15px;
  margin: 16px 0 8px;
}

.markdown-body :deep(p) {
  margin: 10px 0;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 24px;
  margin: 10px 0;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  margin: 14px 0;
  width: 100%;
  font-size: 13px;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid var(--el-border-color-lighter);
  padding: 7px 10px;
  text-align: left;
}

.markdown-body :deep(th) {
  background: var(--el-fill-color-light);
}

.markdown-body :deep(blockquote) {
  margin: 12px 0;
  padding: 8px 16px;
  border-left: 3px solid var(--el-color-primary-light-5);
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
}

.markdown-body :deep(code) {
  background: var(--el-fill-color);
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 13px;
}

.markdown-body :deep(pre) {
  background: var(--el-fill-color);
  padding: 12px 16px;
  border-radius: 6px;
  overflow-x: auto;
}

.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--el-border-color-lighter);
  margin: 20px 0;
}
</style>
