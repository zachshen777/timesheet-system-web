import request from './request'

/** 查询当月工时记录（返回 { "2026-07-01": {...}, ... } 的 Map） */
export function getMonthTimesheets(year, month) {
  return request.get('/timesheet/month', { params: { year, month } })
}

/** 查询当年工时记录（用于热力图，返回 { "2026-01-01": {...}, ... } 的 Map） */
export function getYearTimesheets(year) {
  return request.get('/timesheet/year', { params: { year } })
}

/** 查询指定日期的工时记录 */
export function getTimesheetByDate(date) {
  return request.get(`/timesheet/date/${date}`)
}

/** 保存（新增或更新）工时记录 */
export function saveTimesheet(data) {
  return request.post('/timesheet/save', data)
}

/** 批量保存工时记录 */
export function batchSaveTimesheet(data) {
  return request.post('/timesheet/batch', data)
}

/** 删除指定日期的工时记录 */
export function deleteTimesheet(date) {
  return request.delete(`/timesheet/delete/${date}`)
}

/** 批量删除工时记录 */
export function batchDeleteTimesheet(dates) {
  return request.delete('/timesheet/batch-delete', { data: { dates } })
}

// ==================== 管理员历史查询 ====================

/** 管理员查询指定月份所有员工的工时记录 */
export function adminQueryTimesheet(year, month, name, dept) {
  return request.get('/admin/timesheet/query', { params: { year, month, name, dept } })
}

/** 管理员导出指定月份工时 Excel */
export function adminExportTimesheet(year, month, name, dept) {
  return request.get('/admin/timesheet/export', {
    params: { year, month, name, dept },
    responseType: 'blob'
  })
}
