/**
 * 成就徽章系统 - 公共定义与工具
 * localStorage 存储：{ [id]: ISO 时间字符串 }
 */
export const ACHV_KEY = 'ts_achievements_v1'

/** 全部成就定义（id 顺序即展示顺序） */
export const ACHIEVEMENTS = {
  first_fill:   { id: 'first_fill',   icon: '🧱', name: '初次搬砖',   desc: '第一次填报工时记录' },
  streak7:      { id: 'streak7',      icon: '💪', name: '打工铁人',   desc: '连续 7 天填报完成', reward: '🌙 暗夜主题 · 切换开关' },
  month_green:  { id: 'month_green',  icon: '🏆', name: '月度劳模',   desc: '热力图全绿一个月' },
  quarter_green:{ id: 'quarter_green', icon: '👑', name: '天命打工人', desc: '热力图全绿一个季度' },
  ctrl_batch:   { id: 'ctrl_batch',   icon: '⚡', name: '高效搬砖人', desc: '使用 Ctrl 多选批量填报', reward: '🟡 金色悬浮小球皮肤' }
}

/** 展示顺序 */
export const ACHV_ORDER = ['first_fill', 'streak7', 'month_green', 'quarter_green', 'ctrl_batch']

/** 读取已解锁成就 map */
export function loadUnlocked() {
  try { return JSON.parse(localStorage.getItem(ACHV_KEY) || '{}') } catch { return {} }
}

/** 尝试解锁，已解锁返回 false（不重复弹窗） */
export function unlockAchievement(id) {
  const unlocked = loadUnlocked()
  if (unlocked[id]) return false
  unlocked[id] = new Date().toISOString()
  localStorage.setItem(ACHV_KEY, JSON.stringify(unlocked))
  // 广播解锁事件（供主题开关、皮肤等奖励联动刷新）
  try { window.dispatchEvent(new CustomEvent('ts-achv-unlocked', { detail: id })) } catch { /* 忽略 */ }
  return true
}

/** ISO 时间 → 本地展示格式 YYYY-MM-DD HH:mm */
export function formatUnlockTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
