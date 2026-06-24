<template>
  <section data-test="assessment-summary" class="assessment-summary">
    <el-alert
      v-if="assessment?.message"
      :title="assessment.message"
      type="info"
      show-icon
      :closable="false"
    />

    <div class="summary-row">
      <span>Match Rate {{ formatPercent(assessment?.matchRate) }}</span>
      <span>Comparable {{ assessment?.comparableCount || 0 }}</span>
      <span>Matches {{ assessment?.matchCount || 0 }}</span>
      <span>Minor {{ assessment?.minorDifferenceCount || 0 }}</span>
      <span>Major {{ assessment?.majorDifferenceCount || 0 }}</span>
      <span>Missing {{ assessment?.missingCount || 0 }}</span>
      <span>Unavailable {{ assessment?.providerUnavailableCount || 0 }}</span>
    </div>

    <el-progress :percentage="progressPercent" />

    <div class="sample-row">
      <template v-if="samples.length">
        <el-tag
          v-for="sample in samples"
          :key="sample.companyId || sample.stockCode"
          data-test="sample-company"
          type="info"
        >
          {{ sample.stockCode }} {{ sample.name }}
        </el-tag>
      </template>
      <span v-else>No sampled companies</span>
    </div>

    <div class="provider-row">
      <el-tag
        v-for="(status, provider) in assessment?.providerAvailability || {}"
        :key="provider"
        :type="status === 'AVAILABLE' ? 'success' : 'danger'"
      >
        {{ provider }} {{ status }}
      </el-tag>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  assessment: {
    type: Object,
    default: null
  }
})

const samples = computed(() => props.assessment?.samples || [])
const progressPercent = computed(() =>
  Math.round((props.assessment?.matchRate || 0) * 100)
)

function formatPercent(value) {
  return `${((value || 0) * 100).toFixed(2)}%`
}
</script>
