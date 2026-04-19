<template>
  <section class="page-shell">
    <div class="page-card">
      <div class="page-head">
        <div>
          <div class="eyebrow">Recommendation</div>
          <h2>大V管理</h2>
        </div>
      </div>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="大V列表" name="authors">
          <div class="toolbar">
            <el-button type="primary" @click="openAuthorDialog()">
              <el-icon><Plus /></el-icon>
              <span>新增大V</span>
            </el-button>
            <el-button type="success" @click="refreshAll">
              <el-icon><RefreshRight /></el-icon>
              <span>刷新榜单</span>
            </el-button>
            <el-tag type="info">大V总数 {{ authorTotal }}</el-tag>
          </div>

          <div class="table-shell">
            <el-table v-loading="authorLoading" :data="authors">
              <el-table-column prop="authorName" label="名称" min-width="140" />
              <el-table-column prop="sourceSite" label="来源" width="120" />
              <el-table-column prop="styleTags" label="标签" min-width="140" />
              <el-table-column label="启用" width="80" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.enabled ? 'success' : 'info'">{{
                    row.enabled ? '是' : '否'
                  }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column
                prop="defaultConfidence"
                label="默认可信度"
                width="110"
              />
              <el-table-column
                prop="manualAdjustWeight"
                label="调整权重"
                width="100"
              />
              <el-table-column prop="sampleCount" label="样本数" width="90" />
              <el-table-column label="30日收益" width="110">
                <template #default="{ row }">
                  {{ formatPercent(row.return30d) }}
                </template>
              </el-table-column>
              <el-table-column label="胜率" width="90">
                <template #default="{ row }">
                  {{ formatPercent(row.winRate) }}
                </template>
              </el-table-column>
              <el-table-column
                prop="finalWeight"
                label="当前权重"
                width="100"
              />
              <el-table-column
                prop="latestDataDate"
                label="最近数据日"
                width="120"
              />
              <el-table-column label="处理" width="100" fixed="right">
                <template #default="{ row }">
                  <el-button text type="primary" @click="openAuthorDialog(row)">
                    <el-icon><Edit /></el-icon>
                    <span>编辑</span>
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="推荐数据" name="raw">
          <div class="toolbar">
            <el-select
              v-model="rawQuery.authorId"
              clearable
              filterable
              placeholder="选择大V"
            >
              <el-option
                v-for="item in authors"
                :key="item.authorId"
                :label="item.authorName"
                :value="item.authorId"
              />
            </el-select>
            <el-date-picker
              v-model="rawQuery.tradeDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="推荐日期"
            />
            <el-button type="primary" @click="getRawList">
              <el-icon><Search /></el-icon>
              <span>查询</span>
            </el-button>
            <el-button class="btn-violet" @click="openRawDialog()">
              <el-icon><Plus /></el-icon>
              <span>新增推荐</span>
            </el-button>
            <el-tag type="info">数据总数 {{ rawTotal }}</el-tag>
          </div>

          <div class="table-shell">
            <el-table v-loading="rawLoading" :data="rawList">
              <el-table-column prop="authorName" label="大V" width="120" />
              <el-table-column prop="tradeDate" label="日期" width="120" />
              <el-table-column prop="stockCode" label="代码" width="100" />
              <el-table-column prop="stockName" label="名称" min-width="120" />
              <el-table-column prop="actionType" label="动作" width="90" />
              <el-table-column label="仓位" width="90">
                <template #default="{ row }">
                  {{ formatPercent(row.positionRatio) }}
                </template>
              </el-table-column>
              <el-table-column label="30日收益" width="100">
                <template #default="{ row }">
                  {{ formatPercent(row.resultReturn30d) }}
                </template>
              </el-table-column>
              <el-table-column label="有效" width="80" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.isValid ? 'success' : 'info'">{{
                    row.isValid ? '是' : '否'
                  }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="处理" width="120" fixed="right">
                <template #default="{ row }">
                  <el-button text type="primary" @click="openRawDialog(row)">
                    <el-icon><Edit /></el-icon>
                    <span>编辑</span>
                  </el-button>
                  <el-button text type="danger" @click="deleteRawItem(row)">
                    <el-icon><Delete /></el-icon>
                    <span>删除</span>
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog
      v-model="authorDialogVisible"
      :title="authorForm.authorId ? '编辑大V' : '新增大V'"
      width="520px"
    >
      <el-form :model="authorForm" label-width="110px">
        <el-form-item label="大V名称"
          ><el-input v-model="authorForm.authorName"
        /></el-form-item>
        <el-form-item label="来源站点"
          ><el-input v-model="authorForm.sourceSite"
        /></el-form-item>
        <el-form-item label="来源UID"
          ><el-input v-model="authorForm.sourceUid"
        /></el-form-item>
        <el-form-item label="风格标签"
          ><el-input v-model="authorForm.styleTags"
        /></el-form-item>
        <el-form-item label="默认可信度"
          ><el-input-number
            v-model="authorForm.defaultConfidence"
            :precision="2"
            :step="0.1"
            :min="0.1"
        /></el-form-item>
        <el-form-item label="调整权重"
          ><el-input-number
            v-model="authorForm.manualAdjustWeight"
            :precision="2"
            :step="0.1"
            :min="0"
        /></el-form-item>
        <el-form-item label="启用"
          ><el-switch
            v-model="authorForm.enabled"
            :active-value="1"
            :inactive-value="0"
        /></el-form-item>
        <el-form-item label="备注"
          ><el-input v-model="authorForm.remark" type="textarea" :rows="3"
        /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="authorDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAuthor">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="rawDialogVisible"
      :title="rawForm.recId ? '编辑推荐数据' : '新增推荐数据'"
      width="560px"
    >
      <el-form :model="rawForm" label-width="110px">
        <el-form-item label="大V">
          <el-select
            v-model="rawForm.authorId"
            filterable
            placeholder="选择大V"
          >
            <el-option
              v-for="item in authors"
              :key="item.authorId"
              :label="item.authorName"
              :value="item.authorId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="推荐日期"
          ><el-date-picker
            v-model="rawForm.tradeDate"
            type="date"
            value-format="YYYY-MM-DD"
        /></el-form-item>
        <el-form-item label="股票代码"
          ><el-input
            v-model.trim="rawForm.stockCode"
            @input="onStockCodeInput"
            @blur="fillStockNameByCode"
        /></el-form-item>
        <el-form-item label="股票名称"
          ><el-input v-model="rawForm.stockName"
        /></el-form-item>
        <el-form-item label="动作">
          <el-select v-model="rawForm.actionType">
            <el-option label="BUY" value="BUY" />
            <el-option label="ADD" value="ADD" />
            <el-option label="HOLD" value="HOLD" />
            <el-option label="REDUCE" value="REDUCE" />
            <el-option label="SELL" value="SELL" />
          </el-select>
        </el-form-item>
        <el-form-item label="仓位"
          ><el-input-number
            v-model="rawForm.positionRatio"
            :precision="2"
            :step="0.05"
            :min="0"
            :max="1"
        /></el-form-item>
        <el-form-item label="30日收益"
          ><el-input-number
            v-model="rawForm.resultReturn30d"
            :precision="3"
            :step="0.01"
        /></el-form-item>
        <el-form-item label="90日收益"
          ><el-input-number
            v-model="rawForm.resultReturn90d"
            :precision="3"
            :step="0.01"
        /></el-form-item>
        <el-form-item label="180日收益"
          ><el-input-number
            v-model="rawForm.resultReturn180d"
            :precision="3"
            :step="0.01"
        /></el-form-item>
        <el-form-item label="最大回撤"
          ><el-input-number
            v-model="rawForm.resultDrawdown"
            :precision="3"
            :step="0.01"
        /></el-form-item>
        <el-form-item label="来源链接"
          ><el-input v-model="rawForm.sourceUrl"
        /></el-form-item>
        <el-form-item label="有效"
          ><el-switch
            v-model="rawForm.isValid"
            :active-value="1"
            :inactive-value="0"
        /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rawDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRaw">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { onBeforeUnmount, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Delete,
  Edit,
  Plus,
  RefreshRight,
  Search
} from '@element-plus/icons-vue'

import {
  deleteRecommendRaw,
  getRecommendAuthors,
  getRecommendRawList,
  getRecommendStockByCode,
  refreshRecommendRank,
  saveRecommendAuthor,
  saveRecommendRaw
} from '@/api/recommend'
import { formatPercent } from '@/utils'

function defaultAuthorForm() {
  return {
    authorId: null,
    authorName: '',
    sourceSite: '',
    sourceUid: '',
    styleTags: '',
    enabled: 1,
    defaultConfidence: 1,
    manualAdjustWeight: null,
    remark: ''
  }
}

function defaultRawForm() {
  return {
    recId: null,
    authorId: null,
    tradeDate: '',
    stockCode: '',
    stockName: '',
    actionType: 'BUY',
    positionRatio: 0.5,
    resultReturn30d: 0,
    resultReturn90d: 0,
    resultReturn180d: 0,
    resultDrawdown: 0,
    sourceUrl: '',
    isValid: 1
  }
}

const activeTab = ref('authors')
const authorLoading = ref(false)
const rawLoading = ref(false)
const authors = ref([])
const authorTotal = ref(0)
const rawList = ref([])
const rawTotal = ref(0)
const authorDialogVisible = ref(false)
const rawDialogVisible = ref(false)
const authorForm = reactive(defaultAuthorForm())
const rawForm = reactive(defaultRawForm())
const rawQuery = reactive({
  authorId: null,
  tradeDate: ''
})

let stockLookupTimer = null

getAuthors()
getRawList()

onBeforeUnmount(() => {
  if (stockLookupTimer) {
    clearTimeout(stockLookupTimer)
  }
})

async function getAuthors() {
  authorLoading.value = true
  try {
    const { data } = await getRecommendAuthors()
    authors.value = data.list || []
    authorTotal.value = data.sum || 0
  } finally {
    authorLoading.value = false
  }
}

async function getRawList() {
  rawLoading.value = true
  try {
    const { data } = await getRecommendRawList(rawQuery)
    rawList.value = data.list || []
    rawTotal.value = data.sum || 0
  } finally {
    rawLoading.value = false
  }
}

function openAuthorDialog(row) {
  Object.assign(authorForm, defaultAuthorForm(), row || {})
  authorDialogVisible.value = true
}

async function saveAuthor() {
  await saveRecommendAuthor(authorForm)
  authorDialogVisible.value = false
  await getAuthors()
  ElMessage.success('保存成功')
}

function openRawDialog(row) {
  Object.assign(rawForm, defaultRawForm(), row || {})
  rawDialogVisible.value = true
}

async function saveRaw() {
  await fillStockNameByCode()
  await saveRecommendRaw(rawForm)
  rawDialogVisible.value = false
  await getRawList()
  await getAuthors()
  ElMessage.success('保存成功')
}

async function deleteRawItem(row) {
  await ElMessageBox.confirm(
    `确认删除 ${row.stockCode} 这条推荐数据吗？`,
    '提示',
    {
      type: 'warning'
    }
  )
  await deleteRecommendRaw(row.recId)
  await getRawList()
  ElMessage.success('删除成功')
}

async function refreshAll() {
  await refreshRecommendRank({})
  ElMessage.success('榜单已刷新')
}

function onStockCodeInput() {
  if (stockLookupTimer) {
    clearTimeout(stockLookupTimer)
  }
  stockLookupTimer = setTimeout(() => {
    fillStockNameByCode()
  }, 300)
}

async function fillStockNameByCode() {
  const stockCode = (rawForm.stockCode || '').trim()
  if (!stockCode) {
    return
  }
  const { data } = await getRecommendStockByCode(stockCode)
  const company = data.company || {}
  if (company.name) {
    rawForm.stockCode = company.stockCode || stockCode
    rawForm.stockName = company.name
  }
}
</script>

<style scoped lang="scss">
.toolbar {
  margin-bottom: 16px;
}
</style>
