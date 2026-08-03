import request from './request'

/** 上班打卡 */
export function clockIn(data) {
  return request.post('/attendance/clock-in', data || {})
}

/** 下班打卡 */
export function clockOut(data) {
  return request.post('/attendance/clock-out', data || {})
}

/** 补录打卡 */
export function supplement(data) {
  return request.post('/attendance/supplement', data)
}

/** 修改打卡记录 */
export function updateRecord(data) {
  return request.put('/attendance/update', data)
}

/** 删除打卡记录 */
export function deleteRecord(id) {
  return request.delete(`/attendance/${id}`)
}

/** 查询当天打卡记录 */
export function getTodayRecord() {
  return request.get('/attendance/today')
}

/** 查询打卡历史 */
export function getHistory() {
  return request.get('/attendance/history')
}
