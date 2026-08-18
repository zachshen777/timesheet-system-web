<template>
  <div class="page-wrapper">
    <!-- ==================== 顶部导航 ==================== -->
    <header class="top-bar">
      <div class="top-bar-left">
        <div class="logo-mark">
          <el-icon :size="20"><Medal /></el-icon>
        </div>
        <span class="top-title">个人中心</span>
      </div>
    </header>

    <div class="main-layout">
      <AppSidebar />

      <!-- ==================== 主内容 ==================== -->
      <div class="content-area">
        <!-- 用户信息 + 成就统计横幅 -->
        <div class="profile-hero">
          <div class="hero-left">
            <el-avatar :size="72" class="hero-avatar">
              {{ (userStore.userInfo?.name || userStore.userInfo?.username || 'U')[0] }}
            </el-avatar>
            <div class="hero-user">
              <h2 class="hero-name">{{ userStore.userInfo?.name || '用户' }}</h2>
              <div class="hero-meta">
                <span>工号 {{ userStore.userInfo?.workNo || '-' }}</span>
                <span class="dot">·</span>
                <span>{{ deptDisplayName }}</span>
                <span class="dot">·</span>
                <span>{{ userStore.userInfo?.phone || '-' }}</span>
              </div>
            </div>
          </div>
          <div class="hero-right">
            <div class="hero-count">
              <span class="hero-num">{{ unlockedCount }}</span>
              <span class="hero-total">/ {{ ACHV_ORDER.length }}</span>
            </div>
            <div class="hero-count-label">成就已解锁</div>
            <div class="hero-progress">
              <div class="hero-progress-bar" :style="{ width: progressPct + '%' }"></div>
            </div>
            <div class="hero-progress-text">{{ progressPct }}% 完成</div>
          </div>
        </div>

        <!-- 成就列表 -->
        <div class="achv-section">
          <div class="achv-section-title">
            <el-icon :size="16"><Trophy /></el-icon>
            成就徽章
            <span class="achv-section-sub">已解锁 {{ unlockedCount }} / {{ ACHV_ORDER.length }}</span>
          </div>

          <div class="achv-list">
            <div
              v-for="achv in achvList"
              :key="achv.id"
              class="achv-row"
              :class="{ locked: !achv.unlockedAt }"
            >
              <!-- 图标方块 -->
              <div class="achv-icon-box" :class="{ locked: !achv.unlockedAt }">
                <span class="achv-icon">{{ achv.icon }}</span>
              </div>

              <!-- 名称 + 触发条件 + 奖励 -->
              <div class="achv-info">
                <div class="achv-name">{{ achv.name }}</div>
                <div class="achv-desc">{{ achv.desc }}</div>
                <div class="achv-condition">
                  <el-icon :size="12"><Flag /></el-icon>
                  触发条件：{{ achv.desc }}
                </div>
                <div v-if="achv.reward" class="achv-reward" :class="{ locked: !achv.unlockedAt }">
                  <span class="achv-reward-icon">{{ achv.unlockedAt ? '🎁' : '🔒' }}</span>
                  <span>解锁奖励：{{ achv.reward }}</span>
                </div>
              </div>

              <!-- 状态 / 获取时间 -->
              <div class="achv-status">
                <template v-if="achv.unlockedAt">
                  <div class="achv-time-label">🔓 获得于</div>
                  <div class="achv-time">{{ achv.unlockedAt }}</div>
                </template>
                <template v-else>
                  <div class="achv-locked-label">🔒 尚未解锁</div>
                  <div class="achv-locked-hint">继续搬砖以解锁</div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { getDeptOptions } from '../api/dept'
import AppSidebar from '../components/AppSidebar.vue'
import { ACHV_ORDER, ACHIEVEMENTS, loadUnlocked, formatUnlockTime } from '../utils/achievements'
import { Medal, Trophy, Flag } from '@element-plus/icons-vue'

const userStore = useUserStore()

const deptLabelMap = ref({})
const unlockedMap = ref({})

const deptDisplayName = computed(() => {
  const code = userStore.userInfo?.department
  if (!code) return '-'
  return deptLabelMap.value[code] || '未知部门'
})

const unlockedCount = computed(() => ACHV_ORDER.filter(id => unlockedMap.value[id]).length)

const progressPct = computed(() => {
  const total = ACHV_ORDER.length
  return total ? Math.round((unlockedCount.value / total) * 100) : 0
})

/** 成就列表：按固定顺序，附带解锁时间 */
const achvList = computed(() =>
  ACHV_ORDER.map(id => ({
    ...ACHIEVEMENTS[id],
    unlockedAt: unlockedMap.value[id] ? formatUnlockTime(unlockedMap.value[id]) : ''
  }))
)

onMounted(async () => {
  unlockedMap.value = loadUnlocked()
  try {
    const res = await getDeptOptions()
    const options = res.data || res || []
    options.forEach(d => { deptLabelMap.value[d.value] = d.label })
  } catch (e) {
    console.error('加载部门选项失败:', e)
  }
})
</script>

<style scoped>
.page-wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-main, #f5f6fa);
  overflow: hidden;
}

/* ==================== 顶部栏 ==================== */
.top-bar {
  height: 56px;
  flex-shrink: 0;
  background: var(--bg-card, #fff);
  border-bottom: 1px solid var(--border, #eef0f4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}
.top-bar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.logo-mark {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.top-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #1f2329);
}

.main-layout {
  flex: 1;
  display: flex;
  min-height: 0;
}

/* ==================== 内容区 ==================== */
.content-area {
  flex: 1;
  padding: 28px 32px;
  overflow-y: auto;
  max-width: 1080px;
  margin: 0 auto;
}

/* ==================== 用户信息横幅 ==================== */
.profile-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 32px;
  border-radius: 16px;
  background: linear-gradient(120deg, #4f46e5 0%, #7c3aed 60%, #9333ea 100%);
  color: #fff;
  box-shadow: 0 12px 32px rgba(79, 70, 229, 0.25);
}
.hero-left {
  display: flex;
  align-items: center;
  gap: 20px;
}
.hero-avatar {
  background: rgba(255, 255, 255, 0.92);
  color: #4f46e5;
  font-size: 28px;
  font-weight: 700;
  border: 2px solid rgba(255, 255, 255, 0.5);
}
.hero-name {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 6px;
}
.hero-meta {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  gap: 6px;
}
.hero-meta .dot {
  opacity: 0.6;
}
.hero-right {
  min-width: 220px;
  text-align: right;
}
.hero-count {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 4px;
}
.hero-num {
  font-size: 40px;
  font-weight: 800;
  line-height: 1;
  color: #fde047;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
.hero-total {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
}
.hero-count-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
  margin-top: 2px;
  letter-spacing: 1px;
}
.hero-progress {
  height: 8px;
  background: rgba(255, 255, 255, 0.22);
  border-radius: 99px;
  overflow: hidden;
  margin-top: 12px;
}
.hero-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #fde047, #f59e0b);
  border-radius: 99px;
  transition: width 0.6s ease;
}
.hero-progress-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 6px;
}

/* ==================== 成就列表（Steam 风格） ==================== */
.achv-section {
  margin-top: 24px;
}
.achv-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #1f2329);
  margin-bottom: 14px;
}
.achv-section-sub {
  font-size: 13px;
  font-weight: 400;
  color: var(--text-tertiary, #9ca3af);
}

.achv-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 成就行卡片 */
.achv-row {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 16px 20px;
  background: var(--bg-card, #fff);
  border: 1px solid var(--border, #eef0f4);
  border-left: 4px solid #f59e0b;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.25s ease, transform 0.25s ease;
}
.achv-row:hover {
  box-shadow: 0 8px 24px rgba(79, 70, 229, 0.12);
  transform: translateY(-2px);
}

/* 未解锁：整体灰化 */
.achv-row.locked {
  border-left-color: #d1d5db;
  background: var(--bg-hover, #fafbfc);
}
.achv-row.locked:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  transform: none;
}

/* 图标方块 */
.achv-icon-box {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  background: linear-gradient(135deg, #fbbf24 0%, #f97316 100%);
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4), inset 0 0 0 2px rgba(255, 255, 255, 0.45);
}
.achv-icon-box.locked {
  background: var(--bg-hover, #e5e7eb);
  box-shadow: none;
}
.achv-icon-box.locked .achv-icon {
  filter: grayscale(1) opacity(0.4);
}

/* 名称 + 触发条件 */
.achv-info {
  flex: 1;
  min-width: 0;
}
.achv-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary, #1f2329);
  margin-bottom: 3px;
}
.achv-row.locked .achv-name {
  color: var(--text-muted, #9ca3af);
}
.achv-desc {
  font-size: 13px;
  color: var(--text-secondary, #6b7280);
}
.achv-row.locked .achv-desc {
  color: #b6bcc6;
}
.achv-condition {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  font-size: 12px;
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.08);
  border-radius: 6px;
  padding: 3px 8px;
  width: fit-content;
}
.achv-row.locked .achv-condition {
  color: #a3a9b4;
  background: rgba(0, 0, 0, 0.04);
}

/* 解锁奖励标签 */
.achv-reward {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #b45309;
  background: linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%);
  border: 1px solid #fde68a;
  border-radius: 6px;
  padding: 3px 10px;
  width: fit-content;
}
.achv-reward.locked {
  color: var(--text-muted, #9ca3af);
  background: rgba(0, 0, 0, 0.04);
  border-color: transparent;
  font-weight: 500;
}
.achv-reward-icon {
  font-size: 12px;
}

/* 状态 / 获取时间 */
.achv-status {
  flex-shrink: 0;
  text-align: right;
  min-width: 150px;
  padding-right: 4px;
}
.achv-time-label {
  font-size: 11px;
  color: var(--text-tertiary, #9ca3af);
  letter-spacing: 1px;
}
.achv-time {
  font-size: 15px;
  font-weight: 700;
  color: #16a34a;
  font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', 'DIN Alternate', 'Roboto', Arial, sans-serif;
  font-variant-numeric: tabular-nums;
  margin-top: 2px;
}
.achv-locked-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted, #9ca3af);
  letter-spacing: 1px;
}
.achv-locked-hint {
  font-size: 11px;
  color: #c0c6cf;
  margin-top: 2px;
}
</style>
