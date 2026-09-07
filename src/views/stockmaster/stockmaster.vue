<template>
  <section class="stock-master-page">
    <div class="page-actions">
      <el-button type="primary" @click="openCreate">新增股票</el-button>
    </div>

    <el-card>
      <div class="filter-bar">
        <el-select
          v-model="filters.market"
          clearable
          placeholder="全部市场"
          style="width: 130px"
        >
          <el-option label="A股" value="A" />
          <el-option label="港股" value="H" />
        </el-select>
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
        <StockSelect
          v-model="stockFilter"
          :manual="false"
          placeholder="输入拼音简写/代码/名称"
          style="width: 260px"
          @change="onStockChange"
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
        <el-table-column label="市场" width="70">
          <template #default="{ row }">
            <el-tag
              :type="row.market === 'A' ? 'success' : 'warning'"
              size="small"
            >
              {{ row.market }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="代码" width="90" />
        <el-table-column
          prop="name"
          label="简称"
          min-width="120"
          show-overflow-tooltip
        />
        <el-table-column prop="board" label="板块" width="110" />
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
      :title="editing ? '编辑股票' : '新增股票'"
      width="720px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="市场" prop="market" required>
              <el-radio-group v-model="form.market" :disabled="editing">
                <el-radio-button label="A">A股</el-radio-button>
                <el-radio-button label="H">港股</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="股票代码" prop="code" required>
              <el-input
                v-model="form.code"
                :disabled="editing"
                placeholder="A股6位 / 港股5位"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="简称" prop="name" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="板块">
              <el-input v-model="form.board" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="注册地">
              <el-input v-model="form.registeredPlace" />
            </el-form-item>
          </el-col>
        </el-row>
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
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="上市日期">
              <el-date-picker
                v-model="form.listDate"
                type="date"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人">
              <el-input v-model="form.leader" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="主营业务">
          <el-input v-model="form.mainBusiness" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="2"
            placeholder="仅在编辑页可见，不显示在列表中"
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
  createStockMaster,
  disableStockMaster,
  enableStockMaster,
  getStockMasterList,
  updateStockMaster
} from '@/api/stock-master'
import { getMasterSwIndustries } from '@/api/master-data'
import StockSelect from '@/components/StockSelect.vue'

const loading = ref(false)
const list = ref([])
const industries = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const stockFilter = ref(null)
const dialogVisible = ref(false)
const editing = ref(false)
const formRef = ref(null)

const filters = reactive({
  market: '',
  keyword: '',
  enabled: undefined,
  swL1Code: '',
  swL2Code: '',
  swL3Code: ''
})

const emptyForm = () => ({
  market: 'A',
  code: '',
  name: '',
  board: '',
  registeredPlace: '',
  swL1Code: '',
  swL2Code: '',
  swL3Code: '',
  listDate: '',
  leader: '',
  mainBusiness: '',
  remark: ''
})
const form = reactive(emptyForm())

const rules = {
  market: [{ required: true, message: '请选择市场', trigger: 'change' }],
  code: [{ required: true, message: '请输入股票代码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入股票简称', trigger: 'blur' }]
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

async function loadList() {
  loading.value = true
  try {
    const params = {
      pageNum: currentPage.value,
      pageSize: pageSize.value
    }
    if (filters.market) params.market = filters.market
    if (stockFilter.value) {
      params.market = stockFilter.value.market
      params.keyword = stockFilter.value.code
    } else if (filters.keyword) {
      params.keyword = filters.keyword
    }
    if (filters.enabled !== undefined && filters.enabled !== '') {
      params.enabled = filters.enabled
    }
    if (filters.swL1Code) params.swL1Code = filters.swL1Code
    if (filters.swL2Code) params.swL2Code = filters.swL2Code
    if (filters.swL3Code) params.swL3Code = filters.swL3Code
    const { data } = await getStockMasterList(params)
    list.value = data.list || []
    total.value = data.total || 0
  } finally {
    loading.value = false
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

async function loadIndustries() {
  const { data } = await getMasterSwIndustries()
  industries.value = data.list || []
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

function onStockChange() {
  currentPage.value = 1
  loadList()
}

function resetAndSearch() {
  currentPage.value = 1
  loadList()
}

function resetFilters() {
  filters.market = ''
  filters.keyword = ''
  filters.enabled = undefined
  filters.swL1Code = ''
  filters.swL2Code = ''
  filters.swL3Code = ''
  stockFilter.value = null
  currentPage.value = 1
  loadList()
}

function openCreate() {
  editing.value = false
  Object.assign(form, emptyForm())
  dialogVisible.value = true
}

function openEdit(row) {
  editing.value = true
  Object.assign(form, {
    market: row.market,
    code: row.code,
    name: row.name,
    board: row.board,
    registeredPlace: row.registeredPlace,
    swL1Code: row.swL1Code,
    swL2Code: row.swL2Code,
    swL3Code: row.swL3Code,
    listDate: row.listDate,
    leader: row.leader,
    mainBusiness: row.mainBusiness,
    remark: row.remark
  })
  dialogVisible.value = true
}

async function submit() {
  await formRef.value.validate()
  const payload = {
    name: form.name,
    board: form.board,
    registeredPlace: form.registeredPlace,
    swL1Code: form.swL1Code,
    swL2Code: form.swL2Code,
    swL3Code: form.swL3Code,
    listDate: form.listDate,
    leader: form.leader,
    mainBusiness: form.mainBusiness,
    remark: form.remark
  }
  if (editing.value) {
    await updateStockMaster(form.market, form.code, payload)
    ElMessage.success('已保存')
  } else {
    payload.market = form.market
    payload.code = form.code
    await createStockMaster(payload)
    ElMessage.success('已新增')
  }
  dialogVisible.value = false
  loadList()
}

async function toggle(row, enable) {
  const action = enable ? '启用' : '停用'
  await ElMessageBox.confirm(
    `确定要${action} ${row.market}${row.code} ${row.name} 吗？`,
    '提示',
    { type: 'warning' }
  )
  if (enable) {
    await enableStockMaster(row.market, row.code)
  } else {
    await disableStockMaster(row.market, row.code)
  }
  ElMessage.success(`已${action}`)
  loadList()
}
</script>

<style scoped>
.stock-master-page {
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
  margin-top: 12px;
}
</style>
