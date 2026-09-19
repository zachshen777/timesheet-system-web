import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    redirect: '/attendance'
  },
  {
    path: '/attendance',
    name: 'Attendance',
    component: () => import('../views/AttendanceView.vue'),
    meta: { title: '工时填报系统', requiresAuth: true }
  },
  {
    path: '/report',
    name: 'Report',
    component: () => import('../views/ReportView.vue'),
    meta: { title: '工时报表', requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { title: '个人中心', requiresAuth: true }
  },
  {
    path: '/admin/config',
    name: 'AdminConfig',
    component: () => import('../views/AdminConfigView.vue'),
    meta: { title: '系统配置', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/employees',
    name: 'AdminEmployees',
    component: () => import('../views/EmployeeManageView.vue'),
    meta: { title: '员工管理', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/history-query',
    name: 'AdminHistoryQuery',
    component: () => import('../views/HistoryQueryView.vue'),
    meta: { title: '历史查询', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/dept',
    name: 'AdminDept',
    component: () => import('../views/DeptManageView.vue'),
    meta: { title: '部门管理', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/job',
    name: 'AdminJob',
    component: () => import('../views/JobManageView.vue'),
    meta: { title: '定时任务', requiresAuth: true, requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置守卫
router.beforeEach(async (to) => {
  document.title = to.meta.title ? `${to.meta.title} - timesheet-system` : 'timesheet-system'

  if (!to.meta.requiresAuth) return true

  const userStore = useUserStore()

  // F5 刷新会重建 Pinia，store 变回空状态，必须先从后端恢复用户信息。
  // 这一步放在守卫里统一处理（而不是散落在某个页面里），
  // 否则只有工时填报页能恢复角色，刷新报表页等其它页面时
  // 侧边栏的 isAdmin 会一直是 false，「系统设置」菜单就会消失。
  if (!userStore.userInfo) {
    await userStore.fetchUserInfo()
  }

  if (!userStore.isLogin) {
    return { path: '/login', replace: true }
  }

  // 管理员页面守卫
  if (to.meta.requiresAdmin && !userStore.isAdmin) {
    return { path: '/attendance', replace: true }
  }

  return true
})

export default router
