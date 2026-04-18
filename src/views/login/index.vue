<template>
  <div class="login-page">
    <div class="login-card">
      <div class="eyebrow">investment-front-vue3</div>
      <h1>登录</h1>
      <p class="intro">登录后可进入投资分析工作台，查看待处理数据、策略表现和估值结果。</p>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @keyup.enter="handleSubmit"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
        <el-button type="primary" :loading="loading" class="submit" @click="handleSubmit">
          登录
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)
const form = reactive({
  username: 'admin',
  password: '111111'
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) {
    return
  }

  loading.value = true
  try {
    await userStore.loginAction(form)
    await userStore.fetchUserInfo()
    router.push(route.query.redirect || '/')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 24px;
  background:
    radial-gradient(circle at 20% 20%, rgba(17, 108, 190, 0.34), transparent 0 25%),
    radial-gradient(circle at 80% 15%, rgba(238, 184, 62, 0.26), transparent 0 18%),
    linear-gradient(135deg, #091a2b 0%, #163657 52%, #edf3f8 52%, #edf3f8 100%);
}

.login-card {
  width: min(460px, 100%);
  padding: 36px 32px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 24px 60px rgba(10, 35, 58, 0.16);
}

.eyebrow {
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: #6e8aa4;
  text-transform: uppercase;
}

h1 {
  margin: 0 0 10px;
  font-size: 34px;
  color: #102235;
}

.intro {
  margin: 0 0 28px;
  color: #5d748b;
  line-height: 1.6;
}

.submit {
  width: 100%;
  margin-top: 8px;
}
</style>
