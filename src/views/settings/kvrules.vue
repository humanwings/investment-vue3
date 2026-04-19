<template>
  <section class="page-shell list-page">
    <div class="page-card list-card">
      <div class="page-head">
        <div>
          <div class="eyebrow">Recommendation</div>
          <h2>推荐权重规则</h2>
        </div>
        <div class="actions">
          <el-button type="primary" @click="openDialog()">
            <el-icon><Plus /></el-icon>
            <span>新增规则</span>
          </el-button>
          <el-button type="success" @click="refreshAll">
            <el-icon><RefreshRight /></el-icon>
            <span>按当前规则刷新榜单</span>
          </el-button>
          <el-tag type="info">规则数 {{ total }}</el-tag>
        </div>
      </div>

      <div class="table-shell table-shell--fill">
        <el-table v-loading="listLoading" :data="list" height="100%">
          <el-table-column label="启用" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.enabled ? 'success' : 'info'">{{
                row.enabled ? '是' : '否'
              }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="ruleName" label="规则名称" min-width="140" />
          <el-table-column prop="returnWeight" label="收益权重" width="100" />
          <el-table-column prop="winRateWeight" label="胜率权重" width="100" />
          <el-table-column prop="drawdownWeight" label="回撤惩罚" width="100" />
          <el-table-column
            prop="activityWeight"
            label="活跃度权重"
            width="100"
          />
          <el-table-column
            prop="sampleSizeWeight"
            label="样本权重"
            width="100"
          />
          <el-table-column
            prop="positionWeightMode"
            label="仓位模式"
            width="100"
          />
          <el-table-column prop="decayDays" label="衰减天数" width="100" />
          <el-table-column prop="maxAuthorWeight" label="大V上限" width="100" />
          <el-table-column prop="minSampleCount" label="最小样本" width="100" />
          <el-table-column label="处理" width="100" fixed="right">
            <template #default="{ row }">
              <el-button text type="primary" @click="openDialog(row)">
                <el-icon><Edit /></el-icon>
                <span>编辑</span>
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="form.ruleId ? '编辑规则' : '新增规则'"
      width="560px"
    >
      <el-form :model="form" label-width="120px">
        <el-form-item label="规则名称"
          ><el-input v-model="form.ruleName"
        /></el-form-item>
        <el-form-item label="收益权重"
          ><el-input-number
            v-model="form.returnWeight"
            :precision="2"
            :step="0.05"
            :min="0"
        /></el-form-item>
        <el-form-item label="胜率权重"
          ><el-input-number
            v-model="form.winRateWeight"
            :precision="2"
            :step="0.05"
            :min="0"
        /></el-form-item>
        <el-form-item label="回撤惩罚"
          ><el-input-number
            v-model="form.drawdownWeight"
            :precision="2"
            :step="0.05"
            :min="0"
        /></el-form-item>
        <el-form-item label="活跃度权重"
          ><el-input-number
            v-model="form.activityWeight"
            :precision="2"
            :step="0.05"
            :min="0"
        /></el-form-item>
        <el-form-item label="样本数权重"
          ><el-input-number
            v-model="form.sampleSizeWeight"
            :precision="2"
            :step="0.05"
            :min="0"
        /></el-form-item>
        <el-form-item label="仓位模式">
          <el-select v-model="form.positionWeightMode">
            <el-option label="DIRECT" value="DIRECT" />
            <el-option label="LOG" value="LOG" />
          </el-select>
        </el-form-item>
        <el-form-item label="衰减天数"
          ><el-input-number v-model="form.decayDays" :min="1"
        /></el-form-item>
        <el-form-item label="大V权重上限"
          ><el-input-number
            v-model="form.maxAuthorWeight"
            :precision="2"
            :step="0.1"
            :min="0.1"
        /></el-form-item>
        <el-form-item label="最小样本数"
          ><el-input-number v-model="form.minSampleCount" :min="1"
        /></el-form-item>
        <el-form-item label="启用"
          ><el-switch
            v-model="form.enabled"
            :active-value="1"
            :inactive-value="0"
        /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRule">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Edit, Plus, RefreshRight } from '@element-plus/icons-vue'

import {
  getRecommendRules,
  refreshRecommendRank,
  saveRecommendRule
} from '@/api/recommend'

function defaultForm() {
  return {
    ruleId: null,
    ruleName: '',
    returnWeight: 0.4,
    winRateWeight: 0.2,
    drawdownWeight: 0.1,
    activityWeight: 0.1,
    sampleSizeWeight: 0.2,
    positionWeightMode: 'DIRECT',
    decayDays: 30,
    maxAuthorWeight: 3,
    minSampleCount: 5,
    enabled: 1
  }
}

const listLoading = ref(false)
const list = ref([])
const total = ref(0)
const dialogVisible = ref(false)
const form = reactive(defaultForm())

getList()

async function getList() {
  listLoading.value = true
  try {
    const { data } = await getRecommendRules()
    list.value = data.list || []
    total.value = data.sum || 0
  } finally {
    listLoading.value = false
  }
}

function openDialog(row) {
  Object.assign(form, defaultForm(), row || {})
  dialogVisible.value = true
}

async function saveRule() {
  await saveRecommendRule(form)
  dialogVisible.value = false
  await getList()
  ElMessage.success('保存成功')
}

async function refreshAll() {
  await refreshRecommendRank({})
  ElMessage.success('榜单已按当前规则刷新')
}
</script>

<style scoped lang="scss"></style>
