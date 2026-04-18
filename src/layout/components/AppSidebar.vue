<template>
  <div>
    <transition name="sidebar-fade">
      <div v-if="appStore.showMobileSidebar" class="drawer-mask" @click="appStore.closeMobileSidebar()" />
    </transition>

    <aside :class="sidebarClasses">
      <div class="sidebar-head">
        <div class="brand-block">
          <div class="brand-mark">IF</div>
          <div v-if="appStore.showDesktopLabel" class="brand-copy">
            <strong>Investment</strong>
            <span>Decision Console</span>
          </div>
        </div>

        <el-button class="collapse-btn" text @click="appStore.toggleNavigation()">
          <el-icon><component :is="collapseIcon" /></el-icon>
        </el-button>
      </div>

      <el-scrollbar>
        <div class="sidebar-section-label">业务导航</div>
        <el-menu
          :default-active="activeMenu"
          :collapse="!appStore.showDesktopLabel && !appStore.isMobile"
          class="menu"
          router
          unique-opened
          @select="handleSelect"
        >
          <template v-for="group in sidebarRoutes" :key="group.path">
            <el-sub-menu v-if="hasVisibleSectionChildren(group)" :index="group.path">
              <template #title>
                <el-icon v-if="group.meta?.icon">
                  <component :is="group.meta.icon" />
                </el-icon>
                <span>{{ group.meta?.title }}</span>
              </template>

              <template v-for="section in visibleSections(group)" :key="section.path">
                <el-menu-item-group v-if="hasVisibleLeafChildren(section)">
                  <template #title>
                    <span class="menu-group-title">{{ section.meta?.title }}</span>
                  </template>
                  <el-menu-item
                    v-for="item in visibleLeafChildren(section)"
                    :key="resolveChildPath(group.path, section.path, item.path)"
                    :index="resolveChildPath(group.path, section.path, item.path)"
                    class="menu-leaf-item"
                  >
                    <span class="menu-leaf-label">{{ item.meta?.title }}</span>
                  </el-menu-item>
                </el-menu-item-group>
                <el-menu-item v-else :index="resolveSinglePath(group.path, section.path)">
                  {{ section.meta?.title }}
                </el-menu-item>
              </template>
            </el-sub-menu>

            <el-menu-item v-else :index="resolveSinglePath(group.path, group.children?.[0]?.path)">
              <el-icon v-if="group.meta?.icon">
                <component :is="group.meta.icon" />
              </el-icon>
              <span>{{ group.meta?.title || group.children?.[0]?.meta?.title }}</span>
            </el-menu-item>
          </template>
        </el-menu>
      </el-scrollbar>
    </aside>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Expand, Fold } from '@element-plus/icons-vue'

import { appRoutes } from '@/router/routes'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const appStore = useAppStore()

const sidebarRoutes = computed(() => appRoutes.filter(item => !item.meta?.hidden && item.children?.length))
const activeMenu = computed(() => route.meta?.activeMenu || route.path)
const collapseIcon = computed(() => {
  if (appStore.isMobile) {
    return appStore.showMobileSidebar ? Fold : Expand
  }
  return appStore.showDesktopLabel ? Fold : Expand
})

const sidebarClasses = computed(() => [
  'sidebar',
  {
    collapsed: !appStore.showDesktopLabel && !appStore.isMobile,
    mobile: appStore.isMobile,
    open: appStore.showMobileSidebar
  }
])

function resolveChildPath(groupPath, sectionPath, itemPath) {
  return `${groupPath}/${sectionPath}/${itemPath}`.replace(/\/+/g, '/')
}

function resolveSinglePath(groupPath, childPath = '') {
  return `${groupPath}/${childPath}`.replace(/\/+/g, '/')
}

function visibleSections(group) {
  return (group.children || []).filter(item => !item.meta?.hidden)
}

function visibleLeafChildren(section) {
  return (section.children || []).filter(item => !item.meta?.hidden)
}

function hasVisibleLeafChildren(section) {
  return visibleLeafChildren(section).length > 0
}

function hasVisibleSectionChildren(group) {
  return visibleSections(group).some(section => hasVisibleLeafChildren(section))
}

function handleSelect() {
  if (appStore.isMobile) {
    appStore.closeMobileSidebar()
  }
}
</script>

<style scoped lang="scss">
.drawer-mask {
  position: fixed;
  inset: 0;
  z-index: 19;
  background: rgba(8, 20, 34, 0.42);
}

.sidebar {
  position: relative;
  z-index: 20;
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 18px 14px;
  background: linear-gradient(180deg, #102235 0%, #142e48 100%);
  color: #f4f7fb;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  transition: width 0.2s ease, transform 0.2s ease;
}

.sidebar:not(.collapsed) {
  width: 280px;
}

.sidebar.collapsed {
  width: 86px;
}

.sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-mark {
  display: inline-grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(236, 243, 248, 0.16), rgba(236, 243, 248, 0.28));
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.brand-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.brand-copy strong {
  font-size: 18px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.brand-copy span {
  color: rgba(244, 247, 251, 0.62);
  font-size: 12px;
}

.collapse-btn {
  color: #e7eef5;
}

.sidebar-section-label {
  margin: 8px 10px 12px;
  color: rgba(244, 247, 251, 0.48);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.menu {
  border-right: none;
  background: transparent;
}

.menu :deep(.el-menu) {
  background: transparent;
}

.menu :deep(.el-sub-menu .el-menu) {
  padding: 8px 0 10px;
}

.menu :deep(.el-menu-item),
.menu :deep(.el-sub-menu__title) {
  border-radius: 12px;
  color: rgba(244, 247, 251, 0.8);
}

.menu :deep(.el-sub-menu__title) {
  padding-left: 16px !important;
  font-weight: 700;
}

.menu :deep(.el-menu-item:hover),
.menu :deep(.el-sub-menu__title:hover),
.menu :deep(.el-menu-item.is-active) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.menu-group-title {
  display: block;
  padding: 6px 16px 4px 38px;
  color: rgba(244, 247, 251, 0.52);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.menu :deep(.el-menu-item-group__title) {
  padding: 0 !important;
}

.menu :deep(.el-menu-item-group__wrap) {
  background: transparent;
}

.menu :deep(.menu-leaf-item) {
  margin-left: calc(34px + 2em);
  width: calc(100% - 34px - 2em);
  padding-left: 20px !important;
}

.menu-leaf-label {
  position: relative;
}

.menu-leaf-label::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 50%;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-50%);
}

.menu :deep(.menu-leaf-item.is-active .menu-leaf-label::before) {
  background: #f7c948;
}

.menu :deep(.el-sub-menu .el-menu-item:not(.el-menu-item-group__wrap .el-menu-item)) {
  margin-left: 34px;
  padding-left: 20px !important;
  width: calc(100% - 34px);
}

.sidebar.mobile {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: min(320px, 86vw);
  transform: translateX(-100%);
  box-shadow: 0 18px 60px rgba(10, 35, 58, 0.24);
}

.sidebar.mobile.open {
  transform: translateX(0);
}

.sidebar.mobile .brand-copy {
  display: flex;
}

.sidebar-fade-enter-active,
.sidebar-fade-leave-active {
  transition: opacity 0.2s ease;
}

.sidebar-fade-enter-from,
.sidebar-fade-leave-to {
  opacity: 0;
}
</style>
