import request from './request'

/** 登录 */
export function login(data) {
  return request.post('/auth/login', data, { skipErrorMessage: true, skipAuthRedirect: true })
}

/** 退出登录 */
export function logout() {
  return request.post('/auth/logout')
}

/** 获取当前登录用户 */
export function getCurrentUser() {
  return request.get('/auth/me')
}
