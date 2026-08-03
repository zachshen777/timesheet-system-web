import request from './request'

/** 分页查询员工列表 */
export function getEmployees(params = {}) {
  return request.get('/admin/employees', { params })
}

/** 新增员工 */
export function createEmployee(data) {
  return request.post('/admin/employees', data)
}

/** 更新员工信息 */
export function updateEmployee(id, data) {
  return request.put(`/admin/employees/${id}`, data)
}

/** 切换状态（启用/禁用） */
export function toggleEmployeeStatus(id) {
  return request.put(`/admin/employees/${id}/status`)
}

/** 重置密码 */
export function resetPassword(id, newPassword) {
  return request.put(`/admin/employees/${id}/reset-password`, { newPassword })
}
