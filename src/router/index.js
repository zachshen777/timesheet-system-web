import { createRouter, createWebHistory } from 'vue-router'

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
    meta: { title: '考勤打卡', requiresAuth: true }
  },
  {
    path: '/report',
    name: 'Report',
    component: () => import('../views/ReportView.vue'),
    meta: { title: '工时报表', requiresAuth: true }
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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置守卫
router.beforeEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} - MyTools` : 'MyTools'
  if (to.meta.requiresAuth) {
    const isLoggedIn = sessionStorage.getItem('isLogin') === 'true'
    if (!isLoggedIn) {
      return '/login'
    }
  }
  // 管理员页面守卫
  if (to.meta.requiresAdmin) {
    const role = sessionStorage.getItem('role')
    if (role !== 'ADMIN') {
      return '/attendance'
    }
  }
  return true
})

export default router
