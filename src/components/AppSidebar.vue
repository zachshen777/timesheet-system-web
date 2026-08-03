<template>
  <aside class="app-sidebar">
    <!-- ==================== 用户卡片 ==================== -->
    <div class="user-card">
      <el-avatar :size="64" class="user-avatar">
        {{ (userStore.userInfo?.name || userStore.userInfo?.username || 'U')[0] }}
      </el-avatar>
      <h3 class="user-name">{{ userStore.userInfo?.name || '用户' }}</h3>
      <p class="user-subtitle">工时管理系统</p>
      <el-button class="logout-btn" type="danger" plain @click="handleLogout">
        <el-icon><SwitchButton /></el-icon>
        退出登录
      </el-button>
    </div>

    <!-- ==================== 工时业务导航 ==================== -->
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

    <!-- ==================== 系统设置导航（仅管理员） ==================== -->
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

    <!-- ==================== 个人信息卡片 ==================== -->
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
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessageBox } from 'element-plus'
import { getDeptOptions } from '../api/dept'
import {
  Document, PieChart, UserFilled, Setting, SwitchButton,
  Postcard, OfficeBuilding, Phone, Search
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

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

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' })
  } catch { return }
  userStore.logout()
  router.push('/login')
}

onMounted(async () => {
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
.app-sidebar {
  width: 240px;
  min-width: 240px;
  height: 100%;
  background: #f7f8fa;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 20px 0;
  flex-shrink: 0;
  overflow-y: auto;
}

/* ==================== 用户卡片 ==================== */
.user-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 20px 20px;
  border-bottom: 1px solid var(--border);
}

.user-avatar {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-weight: 600;
  font-size: var(--font-2xl);
  margin-bottom: 8px;
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
  background: #eef2ff;
  color: #4f46e5;
  font-weight: 600;
  border-left-color: #6366f1;
}

.nav-item .el-icon {
  font-size: 18px;
}

/* ==================== 管理员导航配色 ==================== */
.admin-nav .nav-item.active {
  background: #fffbeb;
  color: #d97706;
  border-left-color: #f59e0b;
}

.admin-nav .nav-item:hover {
  background: #fffbeb;
  color: #d97706;
}

/* ==================== 底部信息卡片 ==================== */
.info-card {
  margin: auto 12px 8px;
  padding: 12px 14px;
  background: #f3f4f6;
  border-radius: 10px;
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
