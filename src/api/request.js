import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true
})

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code && res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // 如果请求标记了跳过认证重定向（如广播轮询），静默失败
      if (error.config?.skipAuthRedirect) {
        return Promise.reject(error)
      }
      // 清除登录状态，防止重定向循环
      sessionStorage.removeItem('isLogin')
      sessionStorage.removeItem('role')
      ElMessage.error('未登录或登录已过期，请重新登录')
      window.location.href = '/login'
    } else {
      ElMessage.error(error.response?.data?.message || '网络异常')
    }
    return Promise.reject(error)
  }
)

export default request
