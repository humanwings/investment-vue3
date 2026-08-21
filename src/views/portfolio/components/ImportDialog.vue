<template>
  <el-dialog
    :model-value="visible"
    title="导入持仓 Excel"
    width="720px"
    @update:model-value="$emit('update:visible', $event)"
    @open="reset"
  >
    <el-upload
      :auto-upload="false"
      :limit="1"
      accept=".xlsx"
      :on-change="onFileChange"
      :on-remove="reset"
      drag
    >
      <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
      <div class="el-upload__text">
        将 Excel 文件拖拽到此处，或<em>点击选择文件</em>
      </div>
      <div class="el-upload__tip">支持 .xlsx 格式</div>
    </el-upload>

    <div v-if="preview" class="preview-box">
      <el-form label-width="96px">
        <el-form-item label="统计日期">
          <el-date-picker
            v-model="selectedDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="解析失败时手动选择"
          />
          <span v-if="preview.statsDate" class="auto-date"
            >（已从文件识别）</span
          >
        </el-form-item>
      </el-form>

      <el-alert
        v-for="w in preview.warnings"
        :key="w.message"
        :type="w.level === 'FATAL' ? 'error' : 'warning'"
        :title="w.message"
        :closable="false"
        show-icon
        class="margin-t"
      />
      <el-alert
        v-if="preview.newCodes && preview.newCodes.length"
        type="info"
        title="新标的（尚未配置档案信息）"
        :description="preview.newCodes.join('、')"
        :closable="false"
        show-icon
        class="margin-t"
      />
      <el-alert
        v-if="preview.clearedCandidates && preview.clearedCandidates.length"
        type="warning"
        title="上期有、本期无（导入后将视为清仓）"
        :description="preview.clearedCandidates.join('、')"
        :closable="false"
        show-icon
        class="margin-t"
      />
      <p class="summary-line">待导入持仓：{{ preview.rows.length }} 只</p>
    </div>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button
        type="primary"
        :loading="loading"
        :disabled="!canConfirm"
        @click="doConfirm"
      >
        确认导入
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { previewPortfolio, confirmImport } from '@/api/portfolio'

defineProps({ visible: { type: Boolean, default: false } })
const emit = defineEmits(['update:visible', 'success'])

const file = ref(null)
const preview = ref(null)
const selectedDate = ref('')
const loading = ref(false)

const canConfirm = computed(() => {
  if (!file.value || !preview.value) return false
  if (preview.value.fatal || !preview.value.rows || !preview.value.rows.length)
    return false
  return !!selectedDate.value
})

async function onFileChange(uploadFile) {
  file.value = uploadFile.raw
  preview.value = null
  selectedDate.value = ''
  try {
    const res = await previewPortfolio(uploadFile.raw)
    preview.value = res.data
    selectedDate.value = res.data.statsDate || ''
  } catch {
    preview.value = null
  }
}

function reset() {
  file.value = null
  preview.value = null
  selectedDate.value = ''
  loading.value = false
}

async function doConfirm() {
  loading.value = true
  try {
    await confirmImport(file.value, selectedDate.value)
    ElMessage.success('导入成功')
    emit('success')
    emit('update:visible', false)
  } catch {
    // request 拦截器已展示 message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.preview-box {
  margin-top: 14px;
}
.margin-t {
  margin-bottom: 6px;
}
.auto-date {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
.summary-line {
  margin-top: 8px;
  color: #606266;
}
</style>
