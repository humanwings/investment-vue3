<template>
  <header class="topbar">
    <div class="leading">
      <el-button class="menu-btn" text @click="appStore.toggleNavigation()">
        <el-icon><Operation /></el-icon>
      </el-button>
      <AppBreadcrumb />
    </div>

    <div class="actions">
      <div class="status-chip">已连接业务后台</div>

      <el-dropdown trigger="click">
        <button class="profile-btn" type="button">
          <span class="avatar">
            <img v-if="avatarUrl" :src="avatarUrl" alt="avatar" />
            <span v-else>{{ initials }}</span>
          </span>
          <span class="profile-text">
            <strong>{{ userStore.name || 'admin' }}</strong>
          </span>
          <el-icon><ArrowDown /></el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="router.push('/')">首页</el-dropdown-item>
            <el-dropdown-item divided @click="handleLogout"
              >退出登录</el-dropdown-item
            >
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowDown, Operation } from '@element-plus/icons-vue'

import AppBreadcrumb from './AppBreadcrumb.vue'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

const avatarUrl = computed(() => userStore.avatar || '')
const initials = computed(() =>
  (userStore.name || 'A').slice(0, 1).toUpperCase()
)

async function handleLogout() {
  await userStore.logoutAction()
  router.push('/login')
}
</script>

<style scoped lang="scss">
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 78px;
  padding: 18px 28px;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(16, 34, 53, 0.08);
}

.leading {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.menu-btn {
  display: inline-flex;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  color: #17324a;
  background: rgba(20, 46, 72, 0.06);
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-chip {
  padding: 9px 12px;
  border-radius: 999px;
  background: rgba(24, 120, 76, 0.1);
  color: #18784c;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.profile-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px 6px 6px;
  border: none;
  border-radius: 14px;
  background: rgba(20, 46, 72, 0.06);
  color: #17324a;
  cursor: pointer;
}

.avatar {
  display: inline-grid;
  place-items: center;
  width: 34px;
  height: 34px;
  overflow: hidden;
  border-radius: 10px;
  background: linear-gradient(135deg, #183a5d 0%, #2b6ca3 100%);
  color: #fff;
  font-weight: 700;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-text {
  display: flex;
  min-width: 0;
}

.profile-text strong {
  color: #102235;
  font-size: 14px;
  font-weight: 600;
}

@media (max-width: 960px) {
  .topbar {
    padding: 16px 18px;
  }

  .status-chip {
    display: none;
  }
}
</style>
