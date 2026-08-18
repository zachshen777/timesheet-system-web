/**
 * 暗夜主题管理
 * - 主题偏好持久化：localStorage `ts_theme`
 * - 仅"打工铁人"（连续 7 天填报）成就解锁后才可用暗色主题
 * - 通过 <html data-theme="dark|light"> 切换全局 CSS 变量
 */
import { loadUnlocked } from './achievements'

export const THEME_KEY = 'ts_theme'

/** 暗夜主题是否已解锁（打工铁人成就） */
export function isDarkThemeUnlocked() {
  return !!loadUnlocked().streak7
}

/** 读取当前主题偏好（默认 light） */
export function loadTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || 'light'
  } catch { return 'light' }
}

/** 应用主题到 <html>，可选持久化 */
export function applyTheme(theme, { persist = true } = {}) {
  const t = theme === 'dark' ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', t)
  if (persist) {
    try { localStorage.setItem(THEME_KEY, t) } catch { /* 忽略 */ }
  }
  return t
}

/** 初始化主题：读取偏好并应用（未解锁时强制亮色） */
export function initTheme() {
  if (isDarkThemeUnlocked()) {
    applyTheme(loadTheme())
  } else {
    applyTheme('light')
  }
  return document.documentElement.getAttribute('data-theme') || 'light'
}

/** 切换主题，返回切换后的主题 */
export function toggleTheme() {
  const next = loadTheme() === 'dark' ? 'light' : 'dark'
  return applyTheme(next)
}
