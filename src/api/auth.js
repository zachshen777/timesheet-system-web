import request from './request'

/** 登录 */
export function login(data) {
  return request.post('/auth/login', data, { skipErrorMessage: true, skipAuthRedirect: true })
}

/** 退出登录 */
export function logout() {
  return request.post('/auth/logout')
}

/** 获取当前登录用户（静默探测：失败由调用方决定跳转，避免拦截器再抛提示 + 整页跳转） */
export function getCurrentUser() {
  return request.get('/auth/me', { skipErrorMessage: true, skipAuthRedirect: true })
}
