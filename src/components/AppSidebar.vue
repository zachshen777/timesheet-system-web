<template>
  <aside class="app-sidebar">
    <!-- ==================== 用户卡片 ==================== -->
    <div class="user-card">
      <el-tooltip content="查看个人成就" placement="top" effect="dark">
        <el-avatar :size="64" class="user-avatar" @click="goProfile">
          {{ (userStore.userInfo?.name || userStore.userInfo?.username || 'U')[0] }}
        </el-avatar>
      </el-tooltip>
      <h3 class="user-name">{{ userStore.userInfo?.name || '用户' }}</h3>
      <p class="user-subtitle">工时管理系统</p>
      <el-button class="logout-btn" type="danger" plain @click="handleLogout">
        <el-icon><SwitchButton /></el-icon>
        退出登录
      </el-button>
    </div>

    <!-- ==================== 可滚动导航区域（内容顶部对齐，溢出时内部滚动） ==================== -->
    <div class="sidebar-body">
      <div class="sidebar-body-inner">
        <!-- 工时业务导航 -->
        <div class="nav-section-title">工时业务</div>
        <nav class="side-nav">
          <a
            v-for="item in navItems"
            :key="item.label"
            class="nav-item"
            :class="{ active: isActive(item.path) }"
            @click="navTo(item.path)"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </a>
        </nav>

        <!-- 系统设置导航（仅管理员） -->
        <template v-if="userStore.isAdmin">
          <div class="nav-section-title">系统设置</div>
          <nav class="side-nav admin-nav">
            <a
              v-for="item in adminNavItems"
              :key="item.label"
              class="nav-item"
              :class="{ active: isActive(item.path) }"
              @click="navTo(item.path)"
            >
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.label }}</span>
            </a>
          </nav>
        </template>
      </div>
    </div>

    <!-- ==================== 暗夜主题切换（打工铁人成就解锁后显示） ==================== -->
    <div v-if="themeUnlocked" class="theme-toggle">
      <span class="theme-toggle-icon">{{ isDark ? '🌙' : '☀️' }}</span>
      <span class="theme-toggle-label">暗夜主题</span>
      <span class="theme-toggle-lock" title="由「打工铁人」成就解锁">💪</span>
      <el-switch v-model="isDark" size="small" @change="handleThemeToggle" />
    </div>

    <!-- ==================== 个人信息卡片（固定底部） ==================== -->
    <div class="info-card">
      <div class="info-row">
        <el-icon :size="14"><Postcard /></el-icon>
        <span class="info-label">工号</span>
        <span class="info-value">{{ userStore.userInfo?.workNo || '-' }}</span>
      </div>
      <div class="info-row">
        <el-icon :size="14"><OfficeBuilding /></el-icon>
        <span class="info-label">部门</span>
        <span class="info-value">{{ deptDisplayName }}</span>
      </div>
      <div class="info-row">
        <el-icon :size="14"><Phone /></el-icon>
        <span class="info-label">电话</span>
        <span class="info-value">{{ userStore.userInfo?.phone || '-' }}</span>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessageBox } from 'element-plus'
import { getDeptOptions } from '../api/dept'
import { isDarkThemeUnlocked, loadTheme, toggleTheme } from '../utils/theme'
import {
  Document, PieChart, UserFilled, Setting, SwitchButton,
  Postcard, OfficeBuilding, Phone, Search
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// ===== 暗夜主题切换（打工铁人成就解锁后可用） =====
const themeUnlocked = ref(isDarkThemeUnlocked())
const isDark = ref(themeUnlocked.value && loadTheme() === 'dark')

function handleThemeToggle() {
  isDark.value = toggleTheme() === 'dark'
}

const deptLabelMap = ref({})

const deptDisplayName = computed(() => {
  const code = userStore.userInfo?.department
  if (!code) return '-'
  return deptLabelMap.value[code] || '未知部门'
})

const navItems = [
  { label: '工时管理', icon: Document, path: '/attendance' },
  { label: '报表', icon: PieChart, path: '/report' },
]

const adminNavItems = [
  { label: '员工管理', icon: UserFilled, path: '/admin/employees' },
  { label: '部门管理', icon: OfficeBuilding, path: '/admin/dept' },
  { label: '历史查询', icon: Search, path: '/admin/history-query' },
  { label: '系统配置', icon: Setting, path: '/admin/config' },
]

function isActive(path) {
  return route.path === path
}

function navTo(path) {
  if (path !== route.path) router.push(path)
}

function goProfile() {
  if (route.path !== '/profile') router.push('/profile')
}

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' })
  } catch { return }
  userStore.logout()
  router.push('/login')
}

onMounted(async () => {
  // 成就解锁事件：打工铁人解锁后立即显示暗夜主题开关
  window.addEventListener('ts-achv-unlocked', onAchvUnlocked)
  try {
    const res = await getDeptOptions()
    const options = res.data || res || []
    options.forEach(d => { deptLabelMap.value[d.value] = d.label })
  } catch (e) {
    console.error('加载部门选项失败:', e)
  }
})

onUnmounted(() => {
  window.removeEventListener('ts-achv-unlocked', onAchvUnlocked)
})

function onAchvUnlocked(e) {
  if (e.detail === 'streak7') {
    themeUnlocked.value = true
  }
}
</script>

<style scoped>
.app-sidebar {
  width: 240px;
  min-width: 240px;
  height: 100%;
  background: var(--bg-main, #f7f8fa);
  border-right: 1px solid var(--border, #e5e7eb);
  display: flex;
  flex-direction: column;
  padding: 20px 0;
  flex-shrink: 0;
  overflow: hidden;
}

/* 导航区域：占满中间空间，内容顶部对齐；溢出时内部滚动 */
.sidebar-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.sidebar-body-inner {
  margin: 0;
}

/* ==================== 用户卡片 ==================== */
.user-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 20px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.user-avatar {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-weight: 600;
  font-size: var(--font-2xl);
  margin-bottom: 8px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.user-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.45);
}

.user-name {
  font-size: var(--font-md);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.user-subtitle {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
  margin: 0 0 14px;
}

.logout-btn {
  width: 100%;
  font-size: var(--font-xs);
  border-radius: 8px;
}

/* ==================== 导航分组标题 ==================== */
.nav-section-title {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
  padding: 16px 16px 6px 20px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ==================== 导航项 ==================== */
.side-nav {
  padding: 0 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 44px;
  padding: 0 16px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 14px;
  transition: all 0.2s ease;
  text-decoration: none;
  margin-bottom: 2px;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.nav-item.active {
  background: var(--color-primary-light, #eef2ff);
  color: var(--primary-color, #4f46e5);
  font-weight: 600;
  border-left-color: #6366f1;
}

.nav-item .el-icon {
  font-size: 18px;
}

/* ==================== 管理员导航配色 ==================== */
.admin-nav .nav-item.active {
  background: rgba(245, 158, 11, 0.13);
  color: #d97706;
  border-left-color: #f59e0b;
}

.admin-nav .nav-item:hover {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

/* ==================== 暗夜主题切换开关 ==================== */
.theme-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 12px 8px;
  padding: 10px 14px;
  background: var(--bg-hover, #f3f4f6);
  border-radius: 10px;
  flex-shrink: 0;
  border: 1px solid var(--border, #e5e7eb);
}
.theme-toggle-icon {
  font-size: 15px;
  flex-shrink: 0;
}
.theme-toggle-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #6b7280);
  flex: 1;
}
.theme-toggle-lock {
  font-size: 11px;
  opacity: 0.7;
  cursor: help;
}
.theme-toggle :deep(.el-switch) {
  --el-switch-on-color: #6d76f5;
}

/* ==================== 底部信息卡片（固定底部，始终可见） ==================== */
.info-card {
  margin: 8px 12px 8px;
  padding: 12px 14px;
  background: var(--bg-hover, #f3f4f6);
  border-radius: 10px;
  flex-shrink: 0;
  border: 1px solid transparent;
  transition: border-color 0.2s;
}
html[data-theme='dark'] .info-card {
  border-color: var(--border, #262c3a);
}

.info-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-xs);
  color: var(--text-tertiary);
  margin-bottom: 5px;
}
.info-row:last-child {
  margin-bottom: 0;
}

.info-row .el-icon {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.info-label {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.info-value {
  color: var(--text-secondary);
  margin-left: auto;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
