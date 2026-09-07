<template>
  <section class="fund-master-page">
    <div class="page-actions">
      <el-button type="primary" @click="openCreate">新增基金</el-button>
    </div>

    <el-card>
      <div class="filter-bar">
        <el-select
          v-model="filters.enabled"
          clearable
          placeholder="全部状态"
          style="width: 120px"
        >
          <el-option label="启用" :value="1" />
          <el-option label="停用" :value="0" />
        </el-select>
        <el-select
          v-model="filters.swL1Code"
          clearable
          placeholder="一级行业"
          style="width: 150px"
          @change="onFilterL1"
        >
          <el-option
            v-for="opt in l1Options"
            :key="opt.code"
            :label="opt.name"
            :value="opt.code"
          />
        </el-select>
        <el-select
          v-model="filters.swL2Code"
          clearable
          placeholder="二级行业"
          style="width: 150px"
          @change="onFilterL2"
        >
          <el-option
            v-for="opt in filterL2Options"
            :key="opt.code"
            :label="opt.name"
            :value="opt.code"
          />
        </el-select>
        <el-select
          v-model="filters.swL3Code"
          clearable
          placeholder="三级行业"
          style="width: 150px"
        >
          <el-option
            v-for="opt in filterL3Options"
            :key="opt.code"
            :label="opt.name"
            :value="opt.code"
          />
        </el-select>
        <el-input
          v-model="filters.keyword"
          placeholder="按代码或名称搜索"
          clearable
          style="width: 220px"
          @keyup.enter="resetAndSearch"
          @clear="loadList"
        />
        <el-button type="primary" @click="resetAndSearch">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <div class="pagination-bar">
        <el-pagination
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[20, 50, 100, 200]"
          @current-change="onPageChange"
          @size-change="onSizeChange"
        />
      </div>

      <el-table v-loading="loading" :data="list" border stripe size="small">
        <el-table-column prop="code" label="代码" width="100" />
        <el-table-column
          prop="name"
          label="名称"
          min-width="160"
          show-overflow-tooltip
        />
        <el-table-column label="规模(亿元)" width="110">
          <template #default="{ row }">{{ sizeText(row.size) }}</template>
        </el-table-column>
        <el-table-column label="申万一级" min-width="110">
          <template #default="{ row }">{{ swName(row.swL1Code) }}</template>
        </el-table-column>
        <el-table-column label="申万二级" min-width="120">
          <template #default="{ row }">{{ swName(row.swL2Code) }}</template>
        </el-table-column>
        <el-table-column label="申万三级" min-width="120">
          <template #default="{ row }">{{ swName(row.swL3Code) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.enabled === 1 ? 'success' : 'info'" size="small">
              {{ row.enabled === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button
              v-if="row.enabled === 1"
              size="small"
              type="warning"
              @click="toggle(row, false)"
              >停用</el-button
            >
            <el-button
              v-else
              size="small"
              type="success"
              @click="toggle(row, true)"
              >启用</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="editing ? '编辑基金' : '新增基金'"
      width="680px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="搜索基金">
          <StockSelect
            v-model="selectedFund"
            type="fund"
            @change="onFundSelected"
          />
        </el-form-item>
        <el-form-item label="代码" prop="code" required>
          <el-input
            v-model="form.code"
            :disabled="editing"
            placeholder="输入代码后自动带出名称"
            @blur="autoFillName"
          />
        </el-form-item>
        <el-form-item label="名称" prop="name" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="规模(亿元)">
          <el-input-number
            v-model="form.size"
            :min="0"
            :precision="2"
            style="width: 220px"
          />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="一级行业">
              <el-select
                v-model="form.swL1Code"
                clearable
                style="width: 100%"
                @change="onL1Change"
              >
                <el-option
                  v-for="opt in l1Options"
                  :key="opt.code"
                  :label="opt.name"
                  :value="opt.code"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="二级行业">
              <el-select
                v-model="form.swL2Code"
                clearable
                style="width: 100%"
                @change="onL2Change"
              >
                <el-option
                  v-for="opt in formL2Options"
                  :key="opt.code"
                  :label="opt.name"
                  :value="opt.code"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="三级行业">
              <el-select v-model="form.swL3Code" clearable style="width: 100%">
                <el-option
                  v-for="opt in formL3Options"
                  :key="opt.code"
                  :label="opt.name"
                  :value="opt.code"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="2"
            placeholder="宽基/货币等无行业基金可在此注明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import {
  createFundMaster,
  disableFundMaster,
  enableFundMaster,
  getFundMasterList,
  getFundSize,
  updateFundMaster
} from '@/api/fund-master'
import { getMasterSwIndustries, searchMasterData } from '@/api/master-data'
import StockSelect from '@/components/StockSelect.vue'

const loading = ref(false)
const list = ref([])
const industries = ref([])
const dialogVisible = ref(false)
const editing = ref(false)
const formRef = ref(null)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const selectedFund = ref(null)

const filters = reactive({
  keyword: '',
  enabled: undefined,
  swL1Code: '',
  swL2Code: '',
  swL3Code: ''
})

const emptyForm = () => ({
  code: '',
  name: '',
  size: null,
  swL1Code: '',
  swL2Code: '',
  swL3Code: '',
  remark: ''
})
const form = reactive(emptyForm())

const rules = {
  code: [{ required: true, message: '请输入基金代码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入基金名称', trigger: 'blur' }]
}

const l1Options = computed(() => industries.value.filter((i) => i.level === 1))
const formL2Options = computed(() =>
  industries.value.filter((i) => i.level === 2 && i.parent === form.swL1Code)
)
const formL3Options = computed(() =>
  industries.value.filter((i) => i.level === 3 && i.parent === form.swL2Code)
)
const filterL2Options = computed(() =>
  industries.value.filter((i) => i.level === 2 && i.parent === filters.swL1Code)
)
const filterL3Options = computed(() =>
  industries.value.filter((i) => i.level === 3 && i.parent === filters.swL2Code)
)

const nameByCode = computed(() => {
  const map = {}
  industries.value.forEach((i) => {
    map[i.code] = i.name
  })
  return map
})

onMounted(() => {
  loadIndustries()
  loadList()
})

function swName(code) {
  return code ? nameByCode.value[code] || code : '-'
}

function sizeText(size) {
  return size === null || size === undefined ? '-' : String(size)
}

async function loadList() {
  loading.value = true
  try {
    const params = {
      pageNum: currentPage.value,
      pageSize: pageSize.value
    }
    if (filters.keyword) params.keyword = filters.keyword
    if (filters.enabled !== undefined && filters.enabled !== '') {
      params.enabled = filters.enabled
    }
    if (filters.swL1Code) params.swL1Code = filters.swL1Code
    if (filters.swL2Code) params.swL2Code = filters.swL2Code
    if (filters.swL3Code) params.swL3Code = filters.swL3Code
    const { data } = await getFundMasterList(params)
    list.value = data.list || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

async function loadIndustries() {
  const { data } = await getMasterSwIndustries()
  industries.value = data.list || []
}

function onFundSelected() {
  if (!selectedFund.value) {
    return
  }
  const item = selectedFund.value
  form.code = String(item.code)
  form.name = item.name
  fetchSize(form.code)
}

async function fetchSize(code) {
  try {
    const { data } = await getFundSize(code)
    if (data.size !== null && data.size !== undefined) {
      form.size = Number(data.size)
    }
  } catch {
    // 取不到规模就留空，手动填
  }
}

async function autoFillName() {
  if (!form.code || editing.value || form.name) {
    return
  }
  const { data } = await searchMasterData(form.code)
  const hit = (data.results || []).find(
    (item) => String(item.code) === String(form.code)
  )
  if (hit) {
    form.name = hit.name
  }
}

function onPageChange(page) {
  currentPage.value = page
  loadList()
}

function onSizeChange(size) {
  pageSize.value = size
  currentPage.value = 1
  loadList()
}

function resetAndSearch() {
  currentPage.value = 1
  loadList()
}

function resetFilters() {
  filters.keyword = ''
  filters.enabled = undefined
  filters.swL1Code = ''
  filters.swL2Code = ''
  filters.swL3Code = ''
  currentPage.value = 1
  loadList()
}

function onFilterL1() {
  filters.swL2Code = ''
  filters.swL3Code = ''
}

function onFilterL2() {
  filters.swL3Code = ''
}

function onL1Change() {
  form.swL2Code = ''
  form.swL3Code = ''
}

function onL2Change() {
  form.swL3Code = ''
}

function openCreate() {
  editing.value = false
  selectedFund.value = null
  Object.assign(form, emptyForm())
  dialogVisible.value = true
}

function openEdit(row) {
  editing.value = true
  selectedFund.value = null
  Object.assign(form, {
    code: row.code,
    name: row.name,
    size: row.size,
    swL1Code: row.swL1Code,
    swL2Code: row.swL2Code,
    swL3Code: row.swL3Code,
    remark: row.remark
  })
  dialogVisible.value = true
}

async function submit() {
  await formRef.value.validate()
  const payload = {
    name: form.name,
    size:
      form.size === null || form.size === undefined ? null : Number(form.size),
    swL1Code: form.swL1Code,
    swL2Code: form.swL2Code,
    swL3Code: form.swL3Code,
    remark: form.remark
  }
  if (editing.value) {
    await updateFundMaster(form.code, payload)
    ElMessage.success('已保存')
  } else {
    payload.code = form.code
    await createFundMaster(payload)
    ElMessage.success('已新增')
  }
  dialogVisible.value = false
  loadList()
}

async function toggle(row, enable) {
  const action = enable ? '启用' : '停用'
  await ElMessageBox.confirm(
    `确定要${action} ${row.code} ${row.name} 吗？`,
    '提示',
    { type: 'warning' }
  )
  if (enable) {
    await enableFundMaster(row.code)
  } else {
    await disableFundMaster(row.code)
  }
  ElMessage.success(`已${action}`)
  loadList()
}
</script>

<style scoped>
.fund-master-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-actions {
  display: flex;
  justify-content: flex-start;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}
</style>
