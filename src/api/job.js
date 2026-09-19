import request from './request'

/** 任务列表（含下次执行时间、是否运行中等运行时状态） */
export function getJobList() {
  return request.get('/admin/job/list')
}

/** 候选执行类（容器中的 ScheduledJob 实现） */
export function getJobClasses() {
  return request.get('/admin/job/classes')
}

/** 新增任务 */
export function createJob(data) {
  return request.post('/admin/job', data)
}

/** 编辑任务 */
export function updateJob(id, data) {
  return request.put(`/admin/job/${id}`, data)
}

/** 启用/禁用任务 */
export function toggleJobStatus(id) {
  return request.put(`/admin/job/${id}/status`)
}

/** 立即执行一次 */
export function runJobNow(id) {
  return request.post(`/admin/job/${id}/run`)
}

/** 删除任务 */
export function deleteJob(id) {
  return request.delete(`/admin/job/${id}`)
}

/** 执行日志分页查询 */
export function getJobLogs(params) {
  return request.get('/admin/job/logs', { params })
}

/** 清理执行日志（不传 jobId 表示清空全部） */
export function clearJobLogs(jobId) {
  return request.delete('/admin/job/logs', { params: jobId ? { jobId } : {} })
}
