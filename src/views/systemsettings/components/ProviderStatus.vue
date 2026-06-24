<template>
  <section v-if="result" class="provider-status">
    <div v-if="result.errorCode" class="status-error">
      {{ result.errorCode }} {{ result.message || '' }}
    </div>
    <div v-if="result.sample" class="status-sample">
      Sample: {{ result.sample.stockCode }} {{ result.sample.name }}
    </div>
    <div
      v-for="operation in result.operations || []"
      :key="operation.operation"
      class="operation-summary"
    >
      {{ operation.operation }} {{ operation.status }}
      {{ operation.summary || '' }} {{ operation.elapsedMs }}ms
    </div>
    <el-table :data="result.operations || []" size="small">
      <el-table-column label="Operation" prop="operation" />
      <el-table-column label="Status">
        <template #default="{ row }">
          <el-tag :type="row.status === 'SUCCESS' ? 'success' : 'danger'">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Result" prop="summary" />
      <el-table-column label="Duration">
        <template #default="{ row }">{{ row.elapsedMs }}ms</template>
      </el-table-column>
    </el-table>
  </section>
</template>

<script setup>
defineProps({
  result: {
    type: Object,
    default: null
  }
})
</script>
