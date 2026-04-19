<template>
  <section class="page-shell">
    <div class="page-card">
      <div class="page-head">
        <div>
          <div class="eyebrow">Verification</div>
          <h2>验证结果比较</h2>
        </div>
        <div class="actions">
          <el-tag type="info">{{ nameOne }} vs {{ nameTwo }}</el-tag>
          <el-tag type="info">数据总计 {{ total }}</el-tag>
        </div>
      </div>

      <div class="table-shell">
        <el-table v-loading="listLoading" :data="list">
          <el-table-column prop="analyteId" label="序号" width="70" />
          <el-table-column prop="name" label="名称" width="140" />
          <el-table-column prop="stockCode" label="代码" width="120" />
          <el-table-column prop="ndate" label="N日" width="120" />
          <el-table-column label="买入价1" width="100">
            <template #default="{ row }">{{
              formatAmount(row.buyPriceOne)
            }}</template>
          </el-table-column>
          <el-table-column label="买入价2" width="100">
            <template #default="{ row }">{{
              formatAmount(row.buyPriceTwo)
            }}</template>
          </el-table-column>
          <el-table-column label="卖出价1" width="100">
            <template #default="{ row }">{{
              formatAmount(row.sellPriceOne)
            }}</template>
          </el-table-column>
          <el-table-column label="卖出价2" width="100">
            <template #default="{ row }">{{
              formatAmount(row.sellPriceTwo)
            }}</template>
          </el-table-column>
          <el-table-column label="盈亏1" width="100">
            <template #default="{ row }">{{
              formatAmount(row.balanceOne)
            }}</template>
          </el-table-column>
          <el-table-column label="盈亏2" width="100">
            <template #default="{ row }">{{
              formatAmount(row.balanceTwo)
            }}</template>
          </el-table-column>
          <el-table-column prop="commentOne" label="备注1" min-width="140" />
          <el-table-column prop="commentTwo" label="备注2" min-width="140" />
        </el-table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import { getComparison } from '@/api/verification'

const route = useRoute()
const list = ref([])
const listLoading = ref(false)
const total = ref(0)
const nameOne = ref('')
const nameTwo = ref('')

getList()

async function getList() {
  listLoading.value = true
  try {
    const { data } = await getComparison({
      idOne: route.params.idOne,
      idTwo: route.params.idTwo
    })
    list.value = data.list || []
    total.value = data.sum || 0
    nameOne.value = data.nameOne || ''
    nameTwo.value = data.nameTwo || ''
  } finally {
    listLoading.value = false
  }
}

function formatAmount(value) {
  return value === null || value === undefined ? '' : Number(value).toFixed(2)
}
</script>

<style scoped lang="scss"></style>
