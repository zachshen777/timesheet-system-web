import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as loginApi, logout as logoutApi, getCurrentUser } from '../api/auth'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref(null)
  const isLogin = ref(false)
  const isAdmin = ref(false)

  /** 登录 */
  async function login(username, password) {
    const res = await loginApi({ username, password })
    userInfo.value = res.data
    isLogin.value = true
    isAdmin.value = res.data?.role === 'ADMIN'
    // 持久化角色信息供路由守卫使用
    sessionStorage.setItem('role', res.data?.role || 'EMPLOYEE')
    return res
  }

  /** 退出登录 */
  async function logout() {
    try {
      await logoutApi()
    } finally {
      userInfo.value = null
      isLogin.value = false
      isAdmin.value = false
      sessionStorage.removeItem('role')
    }
  }

  /** 从后端恢复登录状态 */
  async function fetchUserInfo() {
    try {
      const res = await getCurrentUser()
      userInfo.value = res.data
      isLogin.value = true
      isAdmin.value = res.data?.role === 'ADMIN'
      sessionStorage.setItem('role', res.data?.role || 'EMPLOYEE')
      return res.data
    } catch {
      userInfo.value = null
      isLogin.value = false
      isAdmin.value = false
      sessionStorage.removeItem('role')
      return null
    }
  }

  return { userInfo, isLogin, isAdmin, login, logout, fetchUserInfo }
})
