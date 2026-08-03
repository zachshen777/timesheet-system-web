import request from './request'

/** 获取系统配置 */
export function getConfig() {
  return request.get('/admin/config')
}

/** 更新系统配置 */
export function updateConfig(data) {
  return request.put('/admin/config', data)
}

/** 获取节假日列表 — 公开接口，所有登录用户可访问 */
export async function getHolidays() {
  const res = await request.get('/holidays')
  return res.data || []
}

/** 保存节假日列表 */
export function saveHolidays(data) {
  return request.put('/admin/config', { holidays: data })
}
