<template>
  <div class="dim-table">
    <div class="dim-title">{{ title }}</div>
    <el-table :data="rows" size="small" border stripe empty-text="暂无数据">
      <el-table-column prop="name" label="分组" min-width="90" />
      <el-table-column label="笔数" width="60" align="right">
        <template #default="{ row }">{{ row.count }}</template>
      </el-table-column>
      <el-table-column label="胜率" width="70" align="right">
        <template #default="{ row }">
          <span :class="winRateClass(row)">{{
            formatWinRate(row.winRate)
          }}</span>
        </template>
      </el-table-column>
      <el-table-column label="平均盈亏" width="100" align="right">
        <template #default="{ row }">
          <span :class="plClass(row.avgPl)">{{ formatPl(row.avgPl) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="总盈亏" width="100" align="right">
        <template #default="{ row }">
          <span :class="plClass(row.totalPl)">{{ formatPl(row.totalPl) }}</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  rows: { type: Array, default: () => [] }
})

function formatPl(v) {
  if (v == null) return '-'
  const n = Number(v)
  return n > 0 ? '+' + n.toLocaleString('zh-CN') : n.toLocaleString('zh-CN')
}

function formatWinRate(v) {
  return v == null ? '-' : (v * 100).toFixed(0) + '%'
}

function plClass(v) {
  if (v == null || v === 0) return ''
  return v > 0 ? 'up' : 'down'
}

function winRateClass(row) {
  if (row.winRate == null) return ''
  if (row.winRate >= 0.5) return 'up'
  if (row.winRate > 0) return 'down'
  return ''
}
</script>

<style scoped>
.dim-title {
  font-weight: 600;
  margin-bottom: 6px;
  color: #303133;
}
.up {
  color: #f56c6c;
}
.down {
  color: #67c23a;
}
</style>
