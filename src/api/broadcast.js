import request from './request'

/**
 * 获取最近N条广播消息
 * @param {number} limit - 条数，默认10
 */
export function getRecentBroadcast(limit = 10) {
  return request.get('/broadcast/recent', {
    params: { limit },
    skipAuthRedirect: true
  })
}
