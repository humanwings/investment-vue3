<template>
  <section class="page-shell list-page">
    <div class="page-card list-card settings-card">
      <div class="page-head">
        <div>
          <div class="eyebrow">Settings</div>
          <h2>行业参数</h2>
        </div>
        <div class="actions">
          <el-button type="primary" @click="saveAll">
            <el-icon><Select /></el-icon>
            <span>保存</span>
          </el-button>
          <el-button @click="resetAll">
            <el-icon><RefreshLeft /></el-icon>
            <span>重置</span>
          </el-button>
          <el-tag type="info">行业总计 {{ total }}</el-tag>
        </div>
      </div>

      <div class="table-shell table-shell--fill">
        <el-table
          v-loading="listLoading"
          :data="treeList"
          row-key="code"
          border
          height="100%"
          :expand-row-keys="expandedRowKeys"
          :tree-props="{ children: 'children' }"
        >
        <el-table-column label="行业名称" min-width="220">
          <template #default="{ row }">
            <span :class="getIndustryNameClass(row)">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="行业代码" width="150" align="center" />
        <el-table-column label="层级" width="100" align="center">
          <template #default="{ row }">
            {{ formatLevel(row.level) }}
          </template>
        </el-table-column>
        <el-table-column label="行业风险系数" width="220" align="center">
          <template #default="{ row }">
            <el-input
              :model-value="formatRisk(row.valuationRisk)"
              clearable
              @update:model-value="handleRiskChange(row, $event)"
              @clear="clearRisk(row)"
            />
          </template>
        </el-table-column>
        </el-table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { RefreshLeft, Select } from '@element-plus/icons-vue'

import { getIndustrySettings, saveAllIndustrySettings } from '@/api/industrysettings'

const total = ref(0)
const listLoading = ref(false)
const flatList = ref([])
const treeList = ref([])
const originalList = ref([])
const expandedRowKeys = ref([])

getList()

async function getList() {
  listLoading.value = true
  try {
    const { data } = await getIndustrySettings()
    total.value = data.sum || 0
    originalList.value = cloneList(data.list)
    setList(data.list)
  } finally {
    listLoading.value = false
  }
}

function cloneList(list) {
  return JSON.parse(JSON.stringify(list || []))
}

function setList(list) {
  flatList.value = cloneList(list)
  treeList.value = buildTree(flatList.value)
  expandedRowKeys.value = getExpandedRowKeys(flatList.value)
}

function buildTree(list) {
  const map = {}
  const roots = []
  list.forEach(item => {
    map[item.code] = { ...item, children: [] }
  })
  Object.values(map).forEach(item => {
    if (item.parent && map[item.parent]) {
      map[item.parent].children.push(item)
    } else {
      roots.push(item)
    }
  })
  return roots
}

function handleRiskChange(row, value) {
  row.valuationRisk = value === '' ? null : value
}

function clearRisk(row) {
  row.valuationRisk = null
}

function hasRisk(row) {
  return row.valuationRisk !== null && row.valuationRisk !== undefined && row.valuationRisk !== ''
}

function getIndustryNameClass(row) {
  if (!hasRisk(row)) {
    return ''
  }
  const risk = Number(row.valuationRisk)
  if (Number.isNaN(risk)) {
    return ''
  }
  if (risk > 1) {
    return 'industry-high'
  }
  if (risk < 1) {
    return 'industry-low'
  }
  return 'industry-equal'
}

function formatRisk(value) {
  return value === null || value === undefined ? '' : String(value)
}

function getExpandedRowKeys(list) {
  const expanded = new Set()
  const map = {}
  list.forEach(item => {
    map[item.code] = item
  })
  list.forEach(item => {
    if (!hasRisk(item)) {
      return
    }
    let current = item.parent
    while (current && map[current]) {
      expanded.add(current)
      current = map[current].parent
    }
  })
  return Array.from(expanded)
}

function formatLevel(level) {
  return ({ 1: '一级', 2: '二级', 3: '三级' })[level] || level
}

function resetAll() {
  setList(originalList.value)
  ElMessage.success('已重置为最近一次加载的数据')
}

async function saveAll() {
  const invalidItem = flatList.value.find(item => {
    if (item.valuationRisk === null || item.valuationRisk === undefined || item.valuationRisk === '') {
      return false
    }
    return Number.isNaN(Number(item.valuationRisk))
  })

  if (invalidItem) {
    ElMessage.error(`行业 ${invalidItem.name} 的风险系数不是有效数字`)
    return
  }

  listLoading.value = true
  try {
    const { data } = await saveAllIndustrySettings({
      list: flatList.value.map(item => ({
        code: item.code,
        valuationRisk:
          item.valuationRisk === null || item.valuationRisk === undefined || item.valuationRisk === ''
            ? null
            : Number(item.valuationRisk)
      }))
    })
    total.value = data.sum || 0
    originalList.value = cloneList(data.list)
    setList(data.list)
    ElMessage.success('保存成功')
  } finally {
    listLoading.value = false
  }
}
</script>

<style scoped lang="scss">
.settings-card {
  width: min(100%, 1080px);
  margin: 0 auto;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.industry-high {
  color: #409eff;
  font-weight: 700;
}

.industry-low {
  color: #f56c6c;
  font-weight: 700;
}

.industry-equal {
  color: #303133;
  font-weight: 700;
}
</style>
