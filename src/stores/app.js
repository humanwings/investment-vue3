import Cookies from 'js-cookie'
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const SIDEBAR_KEY = 'investment_sidebar_opened'

export const useAppStore = defineStore('app', () => {
  const sidebarOpened = ref(Cookies.get(SIDEBAR_KEY) !== '0')
  const isMobile = ref(false)
  const mobileSidebarOpened = ref(false)

  const sidebarStatus = computed(() => ({
    opened: sidebarOpened.value
  }))
  const showDesktopLabel = computed(() => sidebarOpened.value)
  const showMobileSidebar = computed(() => isMobile.value && mobileSidebarOpened.value)

  function toggleSidebar() {
    sidebarOpened.value = !sidebarOpened.value
    Cookies.set(SIDEBAR_KEY, sidebarOpened.value ? '1' : '0')
  }

  function closeSidebar() {
    sidebarOpened.value = false
    Cookies.set(SIDEBAR_KEY, '0')
  }

  function setViewport(width) {
    const nextMobile = width < 960
    if (nextMobile !== isMobile.value) {
      isMobile.value = nextMobile
      mobileSidebarOpened.value = false
    }
  }

  function openMobileSidebar() {
    mobileSidebarOpened.value = true
  }

  function closeMobileSidebar() {
    mobileSidebarOpened.value = false
  }

  function toggleNavigation() {
    if (isMobile.value) {
      mobileSidebarOpened.value = !mobileSidebarOpened.value
      return
    }

    toggleSidebar()
  }

  return {
    sidebarOpened,
    isMobile,
    mobileSidebarOpened,
    sidebarStatus,
    showDesktopLabel,
    showMobileSidebar,
    toggleSidebar,
    closeSidebar,
    setViewport,
    openMobileSidebar,
    closeMobileSidebar,
    toggleNavigation
  }
})
