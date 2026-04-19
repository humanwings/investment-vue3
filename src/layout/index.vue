<template>
  <div class="app-shell">
    <AppSidebar />
    <div class="main">
      <AppTopbar />
      <PageContainer />
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted } from 'vue'

import AppSidebar from './components/AppSidebar.vue'
import AppTopbar from './components/AppTopbar.vue'
import PageContainer from './components/PageContainer.vue'
import { useAppStore } from '@/stores/app'
const appStore = useAppStore()

function syncViewport() {
  appStore.setViewport(window.innerWidth)
}

onMounted(() => {
  syncViewport()
  window.addEventListener('resize', syncViewport)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncViewport)
})
</script>

<style scoped lang="scss">
.app-shell {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(
      circle at top left,
      rgba(140, 196, 255, 0.18),
      transparent 28%
    ),
    linear-gradient(180deg, #f6f8fb 0%, #ecf1f6 100%);
}

.main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 960px) {
  .app-shell {
    grid-template-columns: 1fr;
  }
}
</style>
