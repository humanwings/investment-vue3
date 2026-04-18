import router from '@/router'
import pinia from '@/stores'
import { useUserStore } from '@/stores/user'
import { getToken } from '@/utils/auth'
import getPageTitle from '@/utils/get-page-title'

const whiteList = ['/login']

router.beforeEach(async to => {
  document.title = getPageTitle(to.meta?.title)

  const hasToken = getToken()
  const userStore = useUserStore(pinia)

  if (hasToken) {
    if (to.path === '/login') {
      return '/'
    }

    if (userStore.loaded || userStore.name) {
      return true
    }

    try {
      await userStore.fetchUserInfo()
      return true
    } catch {
      userStore.resetAuth()
      return `/login?redirect=${encodeURIComponent(to.fullPath)}`
    }
  }

  if (whiteList.includes(to.path)) {
    return true
  }

  return `/login?redirect=${encodeURIComponent(to.fullPath)}`
})
