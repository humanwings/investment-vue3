<template>
  <section class="page-shell">
    <div class="page-card">
      <div class="page-head">
        <div>
          <div class="eyebrow">Verification</div>
          <h2>数据验证</h2>
        </div>
        <el-tag type="info">strategyId {{ strategyId }}</el-tag>
      </div>

      <div class="table-shell">
        <el-table v-loading="listLoading" :data="list">
          <el-table-column prop="analyteId" label="序号" width="70" />
          <el-table-column prop="name" label="名称" width="140" />
          <el-table-column prop="stockCode" label="代码" width="120" />
          <el-table-column prop="ndate" label="N日" width="120" />
          <el-table-column label="买入价" width="100">
            <template #default="{ row }">{{
              formatAmount(row.buyPrice)
            }}</template>
          </el-table-column>
          <el-table-column prop="buyDateSeq" label="买入日序" width="100" />
          <el-table-column label="仓位" width="90">
            <template #default="{ row }">{{
              formatAmount(row.position)
            }}</template>
          </el-table-column>
          <el-table-column label="卖出价" width="100">
            <template #default="{ row }">{{
              formatAmount(row.sellPrice)
            }}</template>
          </el-table-column>
          <el-table-column prop="sellDateSeq" label="卖出日序" width="100" />
          <el-table-column label="盈亏" width="100">
            <template #default="{ row }">{{
              formatAmount(row.balance)
            }}</template>
          </el-table-column>
          <el-table-column prop="comment" label="备注" min-width="160" />
        </el-table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import { getVerification } from '@/api/verification'

const route = useRoute()
const strategyId = route.params.id
const list = ref([])
const listLoading = ref(false)

getList()

async function getList() {
  listLoading.value = true
  try {
    const { data } = await getVerification(strategyId || 8)
    list.value = data.list || []
  } finally {
    listLoading.value = false
  }
}

function formatAmount(value) {
  return value === null || value === undefined ? '' : Number(value).toFixed(2)
}
</script>

<style scoped lang="scss"></style>
