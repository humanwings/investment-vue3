<template>
  <section class="page-shell">
    <div class="page-card">
      <div class="page-head">
        <div>
          <div class="eyebrow">Strategy</div>
          <h2>{{ label }}策略</h2>
        </div>
        <div class="actions">
          <el-button @click="resetLocal">
            <el-icon><RefreshLeft /></el-icon>
            <span>重置</span>
          </el-button>
          <el-button type="success" @click="confirmCreate">
            <el-icon><Plus /></el-icon>
            <span>新建策略</span>
          </el-button>
          <el-button v-if="isEdit" type="warning" @click="confirmUpdate">
            <el-icon><Edit /></el-icon>
            <span>修改策略</span>
          </el-button>
        </div>
      </div>

      <div class="name-row">
        <span>策略名：</span>
        <el-input v-model="name" class="name-input" maxlength="20" clearable />
        <el-button v-if="isEdit" type="primary" @click="updateName">
          <el-icon><EditPen /></el-icon>
          <span>修改策略名</span>
        </el-button>
      </div>

      <div class="table-shell">
        <el-table v-loading="listLoading" :data="list">
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row, $index }">
            <el-button
              v-if="row.tacticsId === -1"
              type="success"
              size="small"
              round
              @click="addItem(row)"
            >
              追加
            </el-button>
            <el-button
              v-else
              type="danger"
              size="small"
              round
              @click="delItem($index)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>

        <el-table-column label="分类" width="300" align="center">
          <template #default="{ row }">
            <el-cascader
              v-if="row.tacticsId !== -1"
              v-model="row.option"
              :options="tacticsOptions"
              @change="setOption(row)"
            />
          </template>
        </el-table-column>

        <el-table-column label="子策略设定" min-width="760" align="center">
          <template #default="{ row }">
            <TacticsItem v-if="row.tacticsId !== -1" :item="row" />
          </template>
        </el-table-column>

        <el-table-column prop="category" label="category" width="100" />
        <el-table-column prop="kind" label="kind" width="140" />
        </el-table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, EditPen, Plus, RefreshLeft } from '@element-plus/icons-vue'

import { createStrategy, getStrategy, updateStrategy, updateStrategyName } from '@/api/strategy'
import { tacticsOptions } from '@/codebook'
import TacticsItem from './TacticsItem.vue'

const route = useRoute()
const router = useRouter()

const strategyId = route.params.id
const isEdit = computed(() => Boolean(strategyId))
const label = computed(() => (isEdit.value ? '修改' : '新建'))
const name = ref('')
const list = ref([])
const listLoading = ref(false)

if (isEdit.value) {
  getDetail()
} else {
  addItem()
}

async function getDetail() {
  listLoading.value = true
  try {
    const { data } = await getStrategy(strategyId)
    name.value = data.strategy.name
    list.value = (data.strategy.list || []).map(item => ({
      ...item,
      option: [item.category, item.kind],
      param3: item.param3 ?? undefined,
      param4: item.param4 ?? undefined
    }))
    addItem()
  } finally {
    listLoading.value = false
  }
}

function setOption(row) {
  row.category = row.option?.[0]
  row.kind = row.option?.[1]
}

function delItem(index) {
  list.value.splice(index, 1)
  ElMessage.success('删除成功')
}

function addItem(row) {
  if (row) {
    row.tacticsId = 0
  }
  list.value.push({
    tacticsId: -1,
    category: undefined,
    kind: undefined,
    param1: undefined,
    param2: undefined,
    param3: undefined,
    param4: undefined,
    option: undefined
  })
}

function resetLocal() {
  if (isEdit.value) {
    getDetail()
  } else {
    name.value = ''
    list.value = []
    addItem()
  }
}

function normalizedList() {
  return list.value
    .filter(item => item.tacticsId !== -1)
    .map(item => ({
      tacticsId: item.tacticsId > 0 ? item.tacticsId : 0,
      category: item.category,
      kind: item.kind,
      param1: item.param1 ?? null,
      param2: item.param2 ?? null,
      param3: item.param3 ?? null,
      param4: item.param4 ?? null
    }))
}

async function confirmCreate() {
  await ElMessageBox.confirm(`此操作将${label.value}此策略，是否继续？`, '提示', { type: 'success' })
  await create()
}

async function create() {
  await createStrategy({
    name: name.value,
    list: normalizedList()
  })
  ElMessage.success('创建成功')
  router.push('/barginhunting/strategy/strategylist')
}

async function confirmUpdate() {
  await ElMessageBox.confirm(`此操作将${label.value}此策略，是否继续？`, '提示', { type: 'warning' })
  await update()
}

async function update() {
  await updateStrategy({
    strategyId,
    name: name.value,
    list: normalizedList()
  })
  ElMessage.success('更新成功')
  router.push('/barginhunting/strategy/strategylist')
}

async function updateName() {
  await updateStrategyName({
    strategyId,
    name: name.value
  })
  ElMessage.success('策略名更新成功')
}
</script>

<style scoped lang="scss">
.name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.name-input {
  width: 280px;
}
</style>
