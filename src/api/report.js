import request from './request'

/** 获取当月工时报表（项目汇总 + 明细列表） */
export function getMonthlyReport(year, month) {
  return request.get('/report/monthly', { params: { year, month } })
}

/** 导出当月工时 Excel（返回 Blob） */
export function exportTimesheet(year, month) {
  return request.get('/report/export', {
    params: { year, month },
    responseType: 'blob'
  })
}
