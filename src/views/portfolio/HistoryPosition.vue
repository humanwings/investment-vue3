<template>
  <div>
    <div class="toolbar">
      <span>统计日期：</span>
      <el-select
        v-model="selectedDate"
        placeholder="选择周"
        clearable
        style="width: 180px"
        @change="goDetail"
      >
        <el-option
          v-for="s in snapshots"
          :key="s.statsDate"
          :label="s.statsDate"
          :value="s.statsDate"
        />
      </el-select>
    </div>

    <el-table :data="snapshots" border stripe @row-click="rowClick">
      <el-table-column label="统计日期" prop="statsDate" width="140" />
      <el-table-column label="持仓数" prop="positionCount" width="90" />
      <el-table-column label="总市值(含现金)" width="140">
        <template #default="{ row }">{{
          format((row.totalMv || 0) + (row.totalCash || 0))
        }}</template>
      </el-table-column>
      <el-table-column label="国泰市值(含现金)" width="140">
        <template #default="{ row }">{{
          format((row.gtTotalMv || 0) + (row.gtCash || 0))
        }}</template>
      </el-table-column>
      <el-table-column label="平安市值(含现金)" width="140">
        <template #default="{ row }">{{
          format((row.paTotalMv || 0) + (row.paCash || 0))
        }}</template>
      </el-table-column>
      <el-table-column label="总浮动盈亏" width="130">
        <template #default="{ row }">{{ format(row.totalPl) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button type="primary" link @click.stop="goDetail(row.statsDate)"
            >查看明细</el-button
          >
          <el-button type="danger" link @click.stop="removeRow(row.statsDate)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPortfolioSnapshots, deletePortfolioSnapshot } from '@/api/portfolio'

const router = useRouter()
const snapshots = ref([])
const selectedDate = ref('')

function format(v) {
  return v == null
    ? '-'
    : Number(v).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

function rowClick(row) {
  goDetail(row.statsDate)
}

function goDetail(date) {
  if (date) router.push(`/portfolio/history/${date}`)
}

async function removeRow(date) {
  try {
    await ElMessageBox.confirm(
      `确定删除 ${date} 这一周的数据吗？删除后不可恢复。`,
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      }
    )
  } catch {
    return
  }
  try {
    await deletePortfolioSnapshot(date)
    ElMessage.success('删除成功')
    if (selectedDate.value === date) selectedDate.value = ''
    await load()
  } catch {
    // interceptor 已提示
  }
}

async function load() {
  try {
    const res = await getPortfolioSnapshots()
    snapshots.value = res.data.snapshots || []
  } catch {
    // interceptor
  }
}

onMounted(load)
</script>

<style scoped>
.toolbar {
  margin-bottom: 12px;
}
</style>
