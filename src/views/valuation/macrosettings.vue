<template>
  <section class="page-shell list-page">
    <div class="page-card list-card settings-card settings-card--macro">
      <div class="page-head">
        <div>
          <div class="eyebrow">Settings</div>
          <h2>宏观参数</h2>
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
          <el-tag type="info">参数总计 {{ total }}</el-tag>
        </div>
      </div>

      <div class="table-shell table-shell--fill">
        <el-table v-loading="listLoading" :data="list" border height="100%">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column label="参数名" min-width="220">
          <template #default="{ row }">
            {{ getSettingName(row.id) }}
          </template>
        </el-table-column>
        <el-table-column prop="comment" label="备注" min-width="240" />
        <el-table-column label="参数值" width="220" align="center">
          <template #default="{ row }">
            <el-input-number
              v-model="row.value"
              :precision="getPrecision(row.id)"
              :step="getStep(row.id)"
              controls-position="right"
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

import { getMacroSettings, updateMacroSetting } from '@/api/macrosettings'

const total = ref(0)
const list = ref([])
const listLoading = ref(false)
const originalList = ref([])

getList()

async function getList() {
  listLoading.value = true
  try {
    const { data } = await getMacroSettings()
    originalList.value = cloneList(data.list)
    list.value = cloneList(data.list)
    total.value = data.sum || 0
  } finally {
    listLoading.value = false
  }
}

function cloneList(data) {
  return JSON.parse(JSON.stringify(data || []))
}

function resetAll() {
  list.value = cloneList(originalList.value)
  ElMessage.success('已重置为最近一次加载的数据')
}

async function saveAll() {
  const invalidItem = list.value.find(item => item.value === null || item.value === undefined || item.value === '')
  if (invalidItem) {
    ElMessage.error(`参数 ${getSettingName(invalidItem.id)} 的值不能为空`)
    return
  }

  listLoading.value = true
  try {
    const updatedList = []
    for (const item of list.value) {
      const { data } = await updateMacroSetting({
        id: item.id,
        value: Number(item.value),
        comment: item.comment
      })
      updatedList.push(data.macroSetting || { ...item, value: Number(item.value) })
    }
    originalList.value = cloneList(updatedList)
    list.value = cloneList(updatedList)
    total.value = updatedList.length
    ElMessage.success('保存成功')
  } finally {
    listLoading.value = false
  }
}

function getStep(id) {
  return id <= 2 ? 0.01 : 0.001
}

function getPrecision(id) {
  return id <= 2 ? 2 : 3
}

function getSettingName(id) {
  const nameMap = {
    1: '美元 -> 人民币',
    2: '港币 -> 人民币',
    3: '市场风偏系数',
    4: '贴现率(个人期望收益率)',
    5: '永续增长率',
    6: '净资产折算',
    7: '港股折价率'
  }
  return nameMap[id] || `参数${id}`
}
</script>

<style scoped lang="scss">
.settings-card {
  width: min(100%, 980px);
  margin: 0 auto;
}

.settings-card--macro {
  width: min(100%, 900px);
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
