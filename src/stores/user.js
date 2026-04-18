import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { getInfo, login, logout } from '@/api/user'
import { getToken, removeToken, setToken } from '@/utils/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken() || '')
  const name = ref('')
  const avatar = ref('')
  const loaded = ref(false)
  const isLoggedIn = computed(() => Boolean(token.value))

  async function loginAction(form) {
    const response = await login({
      username: form.username?.trim(),
      password: form.password
    })
    token.value = response.data.token
    setToken(token.value)
  }

  async function fetchUserInfo() {
    const response = await getInfo(token.value)
    const userData = response.data || {}
    name.value = userData.name || ''
    avatar.value = normalizeAvatar(userData.avatar)
    loaded.value = true
    return userData
  }

  async function logoutAction() {
    if (token.value) {
      await logout()
    }
    resetAuth()
  }

  function resetAuth() {
    token.value = ''
    name.value = ''
    avatar.value = ''
    loaded.value = false
    removeToken()
  }

  function normalizeAvatar(value) {
    if (!value) {
      return ''
    }
    if (value.startsWith('/')) {
      return `${import.meta.env.VITE_APP_BASE_API || ''}${value}`
    }
    return value
  }

  return {
    token,
    name,
    avatar,
    loaded,
    isLoggedIn,
    loginAction,
    fetchUserInfo,
    logoutAction,
    resetAuth
  }
})
