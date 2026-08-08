import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getRecentBroadcast } from '../api/broadcast'

export const useBroadcastStore = defineStore('broadcast', () => {
  /** 广播消息列表 */
  const messages = ref([])
  /** 是否可见 */
  const visible = ref(true)
  /** 是否正在加载 */
  const loading = ref(false)
  /** 轮询定时器 */
  let pollTimer = null

  /**
   * 格式化广播消息文本
   */
  function formatMessage(log) {
    const opMap = {
      'CREATE': '填报了',
      'UPDATE': '更新了',
      'DELETE': '删除了',
      'BATCH_CREATE': '批量填报了',
      'BATCH_DELETE': '批量删除了'
    }
    const opText = opMap[log.operation] || log.operation
    return `${log.empName} ${opText} ${log.detail}`
  }

  /**
   * 拉取最近广播消息
   */
  async function fetchMessages() {
    if (loading.value) return
    loading.value = true
    try {
      const res = await getRecentBroadcast(10)
      if (res.data) {
        messages.value = res.data.map(log => ({
          id: log.id,
          text: formatMessage(log),
          time: log.createdAt,
          raw: log
        }))
      }
    } catch (e) {
      // 401 认证失败：静默停止轮询，不触发全局重定向
      if (e.response?.status === 401) {
        console.warn('广播轮询：未登录，停止轮询')
        stopPolling()
        visible.value = false
      } else {
        console.warn('广播消息拉取失败:', e)
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 隐藏广播条
   */
  function hide() {
    visible.value = false
  }

  /**
   * 显示广播条
   */
  function show() {
    visible.value = true
  }

  /**
   * 关闭广播条（同时停止轮询）
   */
  function close() {
    hide()
    stopPolling()
  }

  /**
   * 开始轮询（每10秒拉取一次）
   */
  function startPolling() {
    stopPolling()
    fetchMessages()
    pollTimer = setInterval(fetchMessages, 10000)
  }

  /**
   * 停止轮询
   */
  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  return { messages, visible, loading, fetchMessages, startPolling, stopPolling, hide, show, close }
})
