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
    }
  }

  /**
   * 从后端恢复用户信息。
   * 这是登录态的唯一真相来源：F5 刷新后 Pinia 会重置，
   * 由路由守卫调用它来恢复，页面里不要再各自判断登录态。
   */
  async function fetchUserInfo() {
    try {
      const res = await getCurrentUser()
      userInfo.value = res.data
      isLogin.value = true
      isAdmin.value = res.data?.role === 'ADMIN'
      return res.data
    } catch {
      userInfo.value = null
      isLogin.value = false
      isAdmin.value = false
      return null
    }
  }

  return { userInfo, isLogin, isAdmin, login, logout, fetchUserInfo }
})
