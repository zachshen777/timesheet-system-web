import request from './request'

/** 获取部门下拉选项（仅启用） */
export function getDeptOptions() {
  return request.get('/common/dept/options')
}

/** 查询所有部门（含禁用） */
export function getDeptList() {
  return request.get('/admin/dept/list')
}

/** 新增部门 */
export function createDept(data) {
  return request.post('/admin/dept', data)
}

/** 编辑部门 */
export function updateDept(id, data) {
  return request.put(`/admin/dept/${id}`, data)
}

/** 启用/禁用部门 */
export function toggleDeptStatus(id) {
  return request.put(`/admin/dept/${id}/status`)
}

/** 删除部门 */
export function deleteDept(id) {
  return request.delete(`/admin/dept/${id}`)
}
