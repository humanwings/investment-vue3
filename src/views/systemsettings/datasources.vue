<template>
  <section class="data-sources-page">
    <el-card>
      <template #header>Price Data Source</template>
      <el-form label-width="150px">
        <el-form-item label="Provider">
          <el-select
            v-model="settings.priceProvider"
            data-test="price-provider"
          >
            <el-option
              v-for="provider in priceProviders"
              :key="provider.code"
              :label="provider.displayName"
              :value="provider.code"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <p class="description">Choose the provider used for latest price data.</p>
      <el-button data-test="test-price" @click="runTest('PRICE')">
        Test price provider
      </el-button>
      <provider-status
        data-test="price-test-result"
        :result="priceTestResult"
      />
    </el-card>

    <el-card>
      <template #header>Company Data Source</template>
      <el-form label-width="150px">
        <el-form-item label="Provider">
          <el-select
            v-model="settings.companyProvider"
            data-test="company-provider"
          >
            <el-option
              v-for="provider in companyProviders"
              :key="provider.code"
              :label="provider.displayName"
              :value="provider.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="lixingerSelected" label="Lixinger credential">
          <el-input
            v-model="settings.lixingerCredential"
            data-test="lixinger-credential"
            placeholder="Leave blank to retain the saved credential"
            show-password
          />
        </el-form-item>
        <el-form-item v-if="lixingerSelected" label="Clear credential">
          <el-switch
            v-model="settings.clearLixingerCredential"
            data-test="clear-lixinger-credential"
          />
        </el-form-item>
      </el-form>
      <p class="description">
        Saved credential:
        {{ credentialState }}
      </p>
      <el-button data-test="test-company" @click="runTest('COMPANY_DATA')">
        Test company provider
      </el-button>
      <el-button data-test="save-settings" type="primary" @click="saveSettings">
        Save settings
      </el-button>
      <provider-status
        data-test="company-test-result"
        :result="companyTestResult"
      />
    </el-card>

    <el-card>
      <template #header>Data Consistency Assessment</template>
      <p class="description">
        Compare Eastmoney and Lixinger values across sampled companies.
      </p>
      <el-button data-test="run-assessment" @click="runAssessment">
        Run assessment
      </el-button>
      <assessment-summary v-if="assessment" :assessment="assessment" />
      <div
        v-for="row in comparisonRows"
        :key="`${row.company}-${row.field}`"
        class="comparison-summary"
      >
        {{ row.company }} {{ row.field }} {{ row.eastmoneyValue }}
        {{ row.lixingerValue }} {{ row.conclusion }} {{ row.message }}
      </div>
      <el-table :data="comparisonRows" size="small">
        <el-table-column label="Company" prop="company" />
        <el-table-column label="Field" prop="field" />
        <el-table-column label="Eastmoney" prop="eastmoneyValue" />
        <el-table-column label="Lixinger" prop="lixingerValue" />
        <el-table-column label="Conclusion">
          <template #default="{ row }">
            <el-tag :type="conclusionTagTypes[row.conclusion] || 'info'">
              {{ row.conclusion }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Message" prop="message" />
      </el-table>
    </el-card>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'

import {
  assessDataSources,
  getDataSourceSettings,
  testDataSource,
  updateDataSourceSettings
} from '@/api/data-sources'
import AssessmentSummary from './components/AssessmentSummary.vue'
import ProviderStatus from './components/ProviderStatus.vue'

const settings = reactive({
  priceProvider: 'EASTMONEY',
  companyProvider: 'EASTMONEY',
  lixingerCredential: '',
  clearLixingerCredential: false
})
const providers = ref([])
const savedSettings = ref({})
const priceTestResult = ref(null)
const companyTestResult = ref(null)
const assessment = ref(null)

const conclusionTagTypes = {
  MATCH: 'success',
  MINOR_DIFFERENCE: 'warning',
  MAJOR_DIFFERENCE: 'danger',
  MISSING: 'info',
  NOT_COMPARABLE: 'info',
  PROVIDER_UNAVAILABLE: 'danger'
}

const priceProviders = computed(() =>
  providers.value.filter((provider) => provider.supportsPrice)
)
const companyProviders = computed(() =>
  providers.value.filter((provider) => provider.supportsCompanyData)
)
const lixingerSelected = computed(
  () =>
    settings.priceProvider === 'LIXINGER' ||
    settings.companyProvider === 'LIXINGER'
)
const credentialState = computed(() => {
  if (savedSettings.value.lixingerCredentialConfigured) {
    return savedSettings.value.lixingerCredentialMasked || 'configured'
  }
  return 'not configured'
})
const comparisonRows = computed(() =>
  (assessment.value?.companies || []).flatMap((company) =>
    (company.fields || []).map((field) => ({
      company: `${company.stockCode} ${company.name}`,
      field: field.alignmentKey
        ? `${field.field} (${field.alignmentKey})`
        : field.field,
      eastmoneyValue: formatValue(field.eastmoneyValue),
      lixingerValue: formatValue(field.lixingerValue),
      conclusion: field.conclusion,
      message: field.message || ''
    }))
  )
)

onMounted(loadSettings)

async function loadSettings() {
  const { data } = await getDataSourceSettings()
  savedSettings.value = data.settings || {}
  providers.value = data.providers || []
  settings.priceProvider = savedSettings.value.priceProvider || 'EASTMONEY'
  settings.companyProvider = savedSettings.value.companyProvider || 'EASTMONEY'
  settings.lixingerCredential = ''
  settings.clearLixingerCredential = false
}

async function saveSettings() {
  const { data } = await updateDataSourceSettings({
    priceProvider: settings.priceProvider,
    companyProvider: settings.companyProvider,
    lixingerCredential: settings.lixingerCredential,
    clearLixingerCredential: settings.clearLixingerCredential
  })
  savedSettings.value = data.settings || savedSettings.value
  settings.priceProvider =
    savedSettings.value.priceProvider || settings.priceProvider
  settings.companyProvider =
    savedSettings.value.companyProvider || settings.companyProvider
  settings.lixingerCredential = ''
  settings.clearLixingerCredential = false
}

async function runTest(capability) {
  const providerCode =
    capability === 'PRICE' ? settings.priceProvider : settings.companyProvider
  const { data } = await testDataSource({
    capability,
    providerCode,
    lixingerCredential: settings.lixingerCredential
  })
  if (capability === 'PRICE') {
    priceTestResult.value = data.result
  } else {
    companyTestResult.value = data.result
  }
}

async function runAssessment() {
  const { data } = await assessDataSources()
  assessment.value = data.assessment
}

function formatValue(value) {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value)
}
</script>

<style scoped>
.data-sources-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.description {
  color: #606266;
  margin: 8px 0;
}
</style>
