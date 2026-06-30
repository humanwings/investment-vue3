<template>
  <section class="data-sources-page">
    <div class="page-actions">
      <el-button data-test="save-all-settings" type="primary" @click="saveSettings">
        保存全部设置
      </el-button>
    </div>

    <el-card>
      <template #header>股价数据接口</template>
      <el-form label-width="150px">
        <el-form-item label="数据源">
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
      <p class="description">选择 companylist 功能使用的最新股价数据源。</p>
      <el-button data-test="test-price" @click="runTest('PRICE')">
        测试股价接口
      </el-button>
      <provider-status
        data-test="price-test-result"
        :result="priceTestResult"
      />
    </el-card>

    <el-card>
      <template #header>公司数据接口</template>
      <el-form label-width="150px">
        <el-form-item label="数据源">
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
        <el-form-item v-if="lixingerSelected" label="理杏仁凭证">
          <el-input
            v-model="settings.lixingerCredential"
            data-test="lixinger-credential"
            placeholder="留空表示继续使用已保存的凭证"
            show-password
          />
        </el-form-item>
        <el-form-item v-if="lixingerSelected" label="清空凭证">
          <el-switch
            v-model="settings.clearLixingerCredential"
            data-test="clear-lixinger-credential"
          />
        </el-form-item>
      </el-form>
      <p class="description">
        已保存的凭证：
        {{ credentialState }}
      </p>
      <el-button data-test="test-company" @click="runTest('COMPANY_DATA')">
        测试公司数据接口
      </el-button>
      <provider-status
        data-test="company-test-result"
        :result="companyTestResult"
      />
    </el-card>

    <el-card>
      <template #header>数据一致性评估</template>
      <p class="description">
        随机抽取 3 只系统内股票，对东方财富与理杏仁返回的数据做一致性对比。
      </p>
      <el-button data-test="run-assessment" @click="runAssessment">
        开始评估
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
        <el-table-column label="股票" prop="company" />
        <el-table-column label="字段" prop="field" />
        <el-table-column label="东方财富" prop="eastmoneyValue" />
        <el-table-column label="理杏仁" prop="lixingerValue" />
        <el-table-column label="结论">
          <template #default="{ row }">
            <el-tag :type="conclusionTagTypes[row.conclusion] || 'info'">
              {{ row.conclusion }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="说明" prop="message" />
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
    return savedSettings.value.lixingerCredentialMasked || '已配置'
  }
  return '未配置'
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

.page-actions {
  display: flex;
  justify-content: flex-start;
}

.description {
  color: #606266;
  margin: 8px 0;
}
</style>
