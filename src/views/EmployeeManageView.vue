<template>
  <div class="page-wrapper">
    <!-- ==================== 顶部导航 ==================== -->
    <header class="top-bar">
      <div class="top-bar-left">
        <div class="logo-mark">
          <el-icon :size="20"><UserFilled /></el-icon>
        </div>
        <span class="top-title">员工管理</span>
      </div>
      <div class="top-bar-center"></div>
      <div class="top-bar-right">
        <el-button type="primary" size="small" @click="openAddDialog">
          <el-icon><Plus /></el-icon>
          新增员工
        </el-button>
      </div>
    </header>

    <!-- ==================== 主体布局 ==================== -->
    <div class="main-layout">
      <AppSidebar />

      <div class="content-area">

        <!-- 筛选区域 -->
        <el-card shadow="hover" class="filter-card">
          <template #header>
            <div class="card-header">
              <el-icon :size="18" color="#6366f1"><Search /></el-icon>
              <span>筛选条件</span>
            </div>
          </template>
          <div class="filter-row">
            <div class="filter-item">
              <label>部门</label>
              <el-select v-model="filter.dept" placeholder="全部" clearable size="small">
                <el-option
                  v-for="d in deptOptions"
                  :key="d.value"
                  :label="d.label"
                  :value="d.value"
                />
              </el-select>
            </div>
            <div class="filter-item">
              <label>用户名</label>
              <el-input v-model="filter.username" placeholder="模糊搜索" clearable size="small" />
            </div>
            <div class="filter-item">
              <label>姓名</label>
              <el-input v-model="filter.name" placeholder="模糊搜索" clearable size="small" />
            </div>
            <div class="filter-item">
              <label>状态</label>
              <el-select v-model="filter.status" placeholder="全部" clearable size="small">
                <el-option label="启用" :value="1" />
                <el-option label="禁用" :value="0" />
              </el-select>
            </div>
            <div class="filter-actions">
              <el-button type="primary" size="small" @click="handleQuery">
                <el-icon><Search /></el-icon> 查询
              </el-button>
              <el-button size="small" @click="handleReset">
                <el-icon><RefreshRight /></el-icon> 重置
              </el-button>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="employee-card">
          <template #header>
            <div class="card-header">
              <el-icon :size="20" color="#6366f1"><List /></el-icon>
              <span>员工列表</span>
              <el-tag size="small" type="info" effect="plain" style="margin-left: 8px">
                共 {{ total }} 人
              </el-tag>
            </div>
          </template>

          <el-table :data="employees" stripe border style="width: 100%" v-loading="loading" :header-cell-style="{ textAlign: 'center' }">
            <el-table-column label="序号" width="60" align="center">
              <template #default="{ $index }">{{ (currentPage - 1) * pageSize + $index + 1 }}</template>
            </el-table-column>
            <el-table-column prop="name" label="姓名" width="80" align="center" />
            <el-table-column prop="username" label="用户名" min-width="110" align="center" />
            <el-table-column prop="workNo" label="工号" min-width="100" align="center" />
            <el-table-column label="部门" min-width="120" align="center">
              <template #default="{ row }">
                {{ deptLabelMap[row.department] || row.department }}
              </template>
            </el-table-column>
            <el-table-column prop="phone" label="手机" min-width="130" align="center" />
            <el-table-column prop="email" label="邮箱" min-width="200" align="center" />
            <el-table-column prop="role" label="角色" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.role === 'ADMIN' ? 'danger' : ''" size="small">
                  {{ row.role === 'ADMIN' ? '管理员' : '员工' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="70" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                  {{ row.status === 1 ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center">
              <template #default="{ row }">
                <span class="row-actions">
                  <el-button type="primary" link size="small" @click="openEditDialog(row)">
                    <el-icon><Edit /></el-icon> 编辑
                  </el-button>
                  <el-dropdown trigger="click" @command="(cmd) => handleRowAction(cmd, row)">
                    <el-button type="primary" link size="small">
                      更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="resetPwd">
                          <el-icon><Key /></el-icon> 重置密码
                        </el-dropdown-item>
                        <el-dropdown-item :command="row.status === 1 ? 'disable' : 'enable'" divided>
                          <el-icon><Switch /></el-icon>
                          {{ row.status === 1 ? '禁用' : '启用' }}
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </span>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="total"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </el-card>
      </div>
    </div>

    <!-- 新增/编辑员工弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑员工' : '新增员工'"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            :disabled="isEdit"
            maxlength="50"
          />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input
            v-model="form.password"
            placeholder="请输入初始密码"
            type="password"
            show-password
            maxlength="50"
          />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" maxlength="50" />
        </el-form-item>
        <el-form-item label="工号" prop="workNo">
          <el-input v-model="form.workNo" placeholder="请输入工号" maxlength="50" />
        </el-form-item>
        <el-form-item label="部门" prop="department">
          <el-select v-model="form.department" placeholder="请选择部门" clearable style="width: 100%">
            <el-option
              v-for="d in deptOptions"
              :key="d.value"
              :label="d.label"
              :value="d.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="手机" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="20" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="100" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="员工" value="EMPLOYEE" />
            <el-option label="管理员" value="ADMIN" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 重置密码弹窗 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="重置密码"
      width="420px"
      :close-on-click-modal="false"
    >
      <p style="margin-bottom: 16px; color: #666;">
        为 <strong>{{ resetTarget?.name }}</strong>（{{ resetTarget?.username }}）重置密码
      </p>
      <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="80px">
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="pwdForm.newPassword"
            placeholder="请输入新密码"
            type="password"
            show-password
            maxlength="50"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="resetting" @click="handleResetPassword">
          确认重置
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  UserFilled, List, Plus, Edit, Key, Switch, ArrowDown, Search, RefreshRight
} from '@element-plus/icons-vue'
import AppSidebar from '../components/AppSidebar.vue'
import {
  getEmployees, createEmployee, updateEmployee,
  toggleEmployeeStatus, resetPassword
} from '../api/employee'
import { getDeptOptions } from '../api/dept'

const employees = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const deptOptions = ref([])
const deptLabelMap = ref({})

const filter = reactive({
  dept: '',
  username: '',
  name: '',
  status: null
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const formRef = ref(null)
const submitting = ref(false)

const form = reactive({
  username: '',
  password: '',
  name: '',
  workNo: '',
  department: '',
  phone: '',
  email: '',
  role: 'EMPLOYEE'
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }]
}

const passwordDialogVisible = ref(false)
const resetTarget = ref(null)
const pwdFormRef = ref(null)
const resetting = ref(false)
const pwdForm = reactive({ newPassword: '' })
const pwdRules = {
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }]
}

async function loadEmployees() {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value
    }
    if (filter.dept) params.dept = filter.dept
    if (filter.username) params.username = filter.username
    if (filter.name) params.name = filter.name
    if (filter.status !== null && filter.status !== '') params.status = filter.status

    const res = await getEmployees(params)
    const data = res.data || res
    if (data.records) {
      employees.value = data.records
      total.value = data.total
    } else {
      employees.value = Array.isArray(data) ? data : (data || [])
      total.value = employees.value.length
    }
  } catch (err) {
    console.error('加载员工列表失败:', err)
  } finally {
    loading.value = false
  }
}

function handlePageChange(page) {
  currentPage.value = page
  loadEmployees()
}

function handleSizeChange(size) {
  pageSize.value = size
  currentPage.value = 1
  loadEmployees()
}

function openAddDialog() {
  isEdit.value = false
  editId.value = null
  form.username = ''
  form.password = ''
  form.name = ''
  form.workNo = ''
  form.department = ''
  form.phone = ''
  form.email = ''
  form.role = 'EMPLOYEE'
  dialogVisible.value = true
  setTimeout(() => formRef.value?.resetFields(), 0)
}

function openEditDialog(row) {
  isEdit.value = true
  editId.value = row.id
  form.username = row.username
  form.name = row.name
  form.workNo = row.workNo || ''
  form.department = row.department || ''
  form.phone = row.phone || ''
  form.email = row.email || ''
  form.role = row.role || 'EMPLOYEE'
  dialogVisible.value = true
  setTimeout(() => formRef.value?.clearValidate(), 0)
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (isEdit.value) {
        await updateEmployee(editId.value, {
          name: form.name,
          workNo: form.workNo,
          department: form.department,
          phone: form.phone,
          email: form.email,
          role: form.role
        })
        ElMessage.success('员工信息更新成功')
      } else {
        await createEmployee({
          username: form.username,
          password: form.password,
          name: form.name,
          workNo: form.workNo,
          department: form.department,
          phone: form.phone,
          email: form.email,
          role: form.role
        })
        ElMessage.success('员工创建成功')
      }
      dialogVisible.value = false
      currentPage.value = 1
      await loadEmployees()
    } catch (err) {
      console.error('提交失败:', err)
    } finally {
      submitting.value = false
    }
  })
}

async function handleToggleStatus(row) {
  try {
    await toggleEmployeeStatus(row.id)
    ElMessage.success(row.status === 1 ? '已禁用' : '已启用')
    currentPage.value = 1
    await loadEmployees()
  } catch (err) {
    console.error('状态切换失败:', err)
  }
}

async function handleRowAction(command, row) {
  if (command === 'resetPwd') {
    openResetPassword(row)
  } else if (command === 'enable' || command === 'disable') {
    try {
      await ElMessageBox.confirm(
        command === 'disable' ? '确定要禁用该员工吗？' : '确定要启用该员工吗？',
        '提示',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
      )
      await handleToggleStatus(row)
    } catch {
      // 用户取消
    }
  }
}

function openResetPassword(row) {
  resetTarget.value = row
  pwdForm.newPassword = ''
  passwordDialogVisible.value = true
  setTimeout(() => pwdFormRef.value?.resetFields(), 0)
}

async function handleResetPassword() {
  if (!pwdFormRef.value) return
  await pwdFormRef.value.validate(async (valid) => {
    if (!valid) return
    resetting.value = true
    try {
      await resetPassword(resetTarget.value.id, pwdForm.newPassword)
      ElMessage.success('密码重置成功')
      passwordDialogVisible.value = false
    } catch (err) {
      console.error('密码重置失败:', err)
    } finally {
      resetting.value = false
    }
  })
}

function handleQuery() {
  currentPage.value = 1
  loadEmployees()
}

function handleReset() {
  filter.dept = ''
  filter.username = ''
  filter.name = ''
  filter.status = null
  currentPage.value = 1
  loadEmployees()
}

async function loadDeptOptions() {
  try {
    const res = await getDeptOptions()
    const options = res.data || res || []
    deptOptions.value = options
    deptLabelMap.value = {}
    ;options.forEach(d => { deptLabelMap.value[d.value] = d.label })
  } catch (err) {
    console.error('加载部门选项失败:', err)
  }
}

onMounted(() => {
  loadEmployees()
  loadDeptOptions()
})
</script>

<style scoped>
.page-wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-main);
}

/* 顶部栏 */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  height: 60px;
  background: #fff;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  gap: 16px;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 150px;
}

.logo-mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.top-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.top-bar-center {
  flex: 1;
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 150px;
  justify-content: flex-end;
}

/* 主体布局 */
.main-layout {
  display: flex;
  flex: 1;
  min-height: 0;
}

.content-area {
  flex: 1;
  padding: 20px 28px;
  overflow-y: auto;
}

.employee-card {
  border-radius: 6px;
}

.filter-card {
  border-radius: 6px;
}

.filter-card .card-header {
  font-size: 15px;
}

.filter-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-item label {
  font-size: 12px;
  color: var(--text-secondary);
}

.filter-item .el-select,
.filter-item .el-input {
  width: 140px;
}

.filter-actions {
  display: flex;
  gap: 8px;
  padding-bottom: 1px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.row-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
