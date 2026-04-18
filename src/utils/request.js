import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

import { getToken } from '@/utils/auth'

const request = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 5000
})

request.interceptors.request.use(
  config => {
    const token = getToken()
    if (token) {
      config.headers['X-Token'] = token
    }
    return config
  },
  error => Promise.reject(error)
)

request.interceptors.response.use(
  response => {
    const responseData = response.data
    if (responseData.code !== 20000) {
      ElMessage.error(responseData.message || 'Error')

      if ([50008, 50012, 50014].includes(responseData.code)) {
        ElMessageBox.confirm('登录状态已失效，请重新登录。', '提示', {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning'
        }).catch(() => {})
      }

      return Promise.reject(new Error(responseData.message || 'Error'))
    }

    return responseData
  },
  error => {
    const responseMessage = error?.response?.data?.message
    ElMessage.error(responseMessage || error.message || 'Request Error')
    if (responseMessage) {
      error.message = responseMessage
    }
    return Promise.reject(error)
  }
)

export default request
