<template>
  <div class="page-wrapper">
    <!-- ==================== 顶部导航 ==================== -->
    <header class="top-bar">
      <div class="top-bar-left">
        <div class="logo-mark">
          <el-icon :size="20"><Search /></el-icon>
        </div>
        <span class="top-title">历史查询</span>
      </div>
      <div class="top-bar-center"></div>
      <div class="top-bar-right">
        <el-button
          size="small"
          :disabled="results.length === 0"
          :loading="exporting"
          @click="handleExport"
        >
          <el-icon><Download /></el-icon> 导出
        </el-button>
      </div>
    </header>

    <!-- ==================== 主体布局 ==================== -->
    <div class="main-layout">
      <AppSidebar />

      <div class="content-area">
        <!-- 筛选卡片 -->
        <el-card shadow="hover" class="filter-card">
          <template #header>
            <div class="card-header">
              <el-icon :size="20" color="#6366f1"><Search /></el-icon>
              <span>筛选条件</span>
            </div>
          </template>
          <div class="filter-row">
            <el-select v-model="queryYear" class="filter-item" size="small">
              <el-option v-for="y in yearOptions" :key="y" :label="y + '年'" :value="y" />
            </el-select>
            <el-select v-model="queryMonth" class="filter-item" size="small">
              <el-option v-for="m in 12" :key="m" :label="m + '月'" :value="m" />
            </el-select>
            <el-select
              v-model="queryDept"
              class="filter-dept"
              size="small"
              placeholder="部门（可选）"
              clearable
              @change="handleQuery"
            >
              <el-option v-for="d in deptOptions" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
            <el-input
              v-model="queryName"
              class="filter-name"
              size="small"
              placeholder="员工姓名（可选）"
              clearable
              @clear="handleQuery"
              @keyup.enter="handleQuery"
            />
            <el-button type="primary" size="small" @click="handleQuery" :loading="loading">
              <el-icon><Search /></el-icon> 查询
            </el-button>
            <el-button size="small" @click="handleReset">
              <el-icon><RefreshRight /></el-icon> 重置
            </el-button>
          </div>
        </el-card>

        <!-- 统计卡片 -->
        <div class="stats-grid" v-if="results.length > 0">
          <div class="stat-card stat-records">
            <div class="stat-icon"><el-icon :size="18"><Document /></el-icon></div>
            <div class="stat-body">
              <span class="stat-num">{{ results.length }}</span>
              <span class="stat-tag">条记录</span>
            </div>
          </div>
          <div class="stat-card stat-employees">
            <div class="stat-icon"><el-icon :size="18"><User /></el-icon></div>
            <div class="stat-body">
              <span class="stat-num">{{ uniqueEmployees.length }}</span>
              <span class="stat-tag">人</span>
            </div>
          </div>
          <div class="stat-card stat-hours">
            <div class="stat-icon"><el-icon :size="18"><Clock /></el-icon></div>
            <div class="stat-body">
              <span class="stat-num">{{ totalWorkHours }}</span>
              <span class="stat-tag">总工时 (h)</span>
            </div>
          </div>
          <div class="stat-card stat-overtime">
            <div class="stat-icon"><el-icon :size="18"><WarningFilled /></el-icon></div>
            <div class="stat-body">
              <span class="stat-num">{{ totalOvertimeHours }}</span>
              <span class="stat-tag">总加班 (h)</span>
            </div>
          </div>
        </div>

        <!-- 查询结果表格 -->
        <el-card shadow="hover" class="table-card">
          <el-table
            :data="pagedResults"
            v-loading="loading"
            border
            stripe
            highlight-current-row
            size="small"
            style="width: 100%"
            max-height="calc(100vh - 310px)"
          >
            <template #empty>
              <el-empty description="暂无工时记录，请调整筛选条件后重试" :image-size="80" />
            </template>

            <el-table-column prop="employee_name" label="姓名" width="90" align="center" fixed />
            <el-table-column label="部门" width="100" align="center">
              <template #default="{ row }">
                {{ deptLabelMap[row.department] || row.department || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="日期" width="130" align="center">
              <template #default="{ row }">
                <span :class="{ 'weekend-text': isWeekend(row.date) }">
                  {{ formatDateWithWeekday(row.date) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="project" label="项目" min-width="130" show-overflow-tooltip />
            <el-table-column prop="task" label="任务" min-width="150" show-overflow-tooltip />
            <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
            <el-table-column prop="work_hours" label="工时 (h)" width="90" align="center">
              <template #default="{ row }">
                <span class="hours-val">{{ formatNum(row.work_hours) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="overtime_hours" label="加班 (h)" width="90" align="center">
              <template #default="{ row }">
                <span class="overtime-val">{{ formatNum(row.overtime_hours) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="statusTagType(row.status)"
                  size="small"
                  effect="plain"
                >
                  {{ statusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openDetail(row)">
                  <el-icon><View /></el-icon> 查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-wrap" v-if="results.length > 0">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="results.length"
              layout="total, sizes, prev, pager, next, jumper"
              background
              small
            />
          </div>
        </el-card>
      </div>
    </div>

    <!-- ==================== 详情弹窗 ==================== -->
    <el-dialog v-model="detailVisible" title="工时详情" width="500px" destroy-on-close>
      <template v-if="detailRow">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="姓名">{{ detailRow.employee_name }}</el-descriptions-item>
          <el-descriptions-item label="部门">{{ deptLabelMap[detailRow.department] || detailRow.department || '-' }}</el-descriptions-item>
          <el-descriptions-item label="日期">{{ formatDate(detailRow.date) }}</el-descriptions-item>
          <el-descriptions-item label="星期">
            <span :class="{ 'weekend-text': isWeekend(detailRow.date) }">{{ getWeekday(detailRow.date) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="项目">{{ detailRow.project || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(detailRow.status)" size="small" effect="plain">
              {{ statusLabel(detailRow.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="任务" :span="2">{{ detailRow.task || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ detailRow.remark || '-' }}</el-descriptions-item>
          <el-descriptions-item label="工时">{{ formatNum(detailRow.work_hours) }} h</el-descriptions-item>
          <el-descriptions-item label="加班">{{ formatNum(detailRow.overtime_hours) }} h</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Download, RefreshRight, Document, User, Clock, WarningFilled, View } from '@element-plus/icons-vue'
import AppSidebar from '../components/AppSidebar.vue'
import { adminQueryTimesheet, adminExportTimesheet } from '../api/timesheet'
import { getDeptOptions } from '../api/dept'

const now = new Date()
const queryYear = ref(now.getFullYear())
const queryMonth = ref(now.getMonth() + 1)
const queryName = ref('')
const queryDept = ref('')
const deptOptions = ref([])
const deptLabelMap = ref({})
const results = ref([])
const loading = ref(false)
const exporting = ref(false)

// 分页
const currentPage = ref(1)
const pageSize = ref(20)

// 详情弹窗
const detailVisible = ref(false)
const detailRow = ref(null)

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let y = currentYear; y >= currentYear - 5; y--) {
    years.push(y)
  }
  return years
})

const uniqueEmployees = computed(() => {
  const names = new Set(results.value.map(r => r.employee_name))
  return [...names]
})

const totalWorkHours = computed(() => {
  return results.value.reduce((sum, r) => {
    return sum + (parseFloat(r.work_hours) || 0)
  }, 0).toFixed(1)
})

const totalOvertimeHours = computed(() => {
  return results.value.reduce((sum, r) => {
    return sum + (parseFloat(r.overtime_hours) || 0)
  }, 0).toFixed(1)
})

const pagedResults = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return results.value.slice(start, start + pageSize.value)
})

// ==================== 查询 & 重置 ====================
async function handleQuery() {
  loading.value = true
  currentPage.value = 1
  try {
    const res = await adminQueryTimesheet(
      queryYear.value, queryMonth.value,
      queryName.value || undefined,
      queryDept.value || undefined
    )
    results.value = res.data || []
    if (results.value.length === 0) {
      ElMessage.info('未查询到工时记录')
    }
  } catch {
    results.value = []
  } finally {
    loading.value = false
  }
}

function handleReset() {
  queryYear.value = now.getFullYear()
  queryMonth.value = now.getMonth() + 1
  queryName.value = ''
  queryDept.value = ''
  handleQuery()
}

// ==================== 导出 ====================
async function handleExport() {
  if (exporting.value) return
  if (results.value.length === 0) {
    ElMessage.warning('暂无数据可导出，请先查询')
    return
  }
  exporting.value = true
  try {
    const blob = await adminExportTimesheet(
      queryYear.value, queryMonth.value,
      queryName.value || undefined,
      queryDept.value || undefined
    )
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const deptPart = queryDept.value ? (deptLabelMap.value[queryDept.value] || queryDept.value) : ''
    link.download = `${queryYear.value}年${queryMonth.value}月${deptPart}出勤表.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (e) {
    ElMessage.error('导出失败，请重试')
    console.error(e)
  } finally {
    exporting.value = false
  }
}

// ==================== 详情 ====================
function openDetail(row) {
  detailRow.value = row
  detailVisible.value = true
}

// ==================== 格式化工具 ====================
function formatDate(val) {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (val instanceof Date) return val.toISOString().slice(0, 10)
  return String(val).slice(0, 10)
}

function isWeekend(val) {
  const dateStr = formatDate(val)
  if (!dateStr) return false
  const d = new Date(dateStr)
  return d.getDay() === 0 || d.getDay() === 6
}

function getWeekday(val) {
  const dateStr = formatDate(val)
  if (!dateStr) return ''
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[new Date(dateStr).getDay()]
}

function formatDateWithWeekday(val) {
  const dateStr = formatDate(val)
  if (!dateStr) return ''
  return dateStr + ' ' + getWeekday(val)
}

function formatNum(val) {
  if (val === null || val === undefined || val === '') return '-'
  const num = parseFloat(val)
  if (isNaN(num)) return '-'
  return num % 1 === 0 ? num.toFixed(0) : num.toFixed(1)
}

function statusTagType(status) {
  const map = { SUBMITTED: 'success', APPROVED: '', DRAFT: 'info' }
  return map[status] || 'info'
}

function statusLabel(status) {
  const map = { SUBMITTED: '已提交', APPROVED: '已审核', DRAFT: '草稿' }
  return map[status] || '草稿'
}

// ==================== 初始化 ====================
onMounted(() => {
  loadDeptOptions()
  handleQuery()
})

async function loadDeptOptions() {
  try {
    const res = await getDeptOptions()
    const options = res.data || res || []
    deptOptions.value = options
    options.forEach(d => { deptLabelMap.value[d.value] = d.label })
  } catch (err) {
    console.error('加载部门选项失败:', err)
  }
}
</script>

<style scoped>
.page-wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-main);
}

/* ==================== 顶部栏 ==================== */
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

/* ==================== 筛选卡片 ==================== */
.filter-card {
  border-radius: 6px;
  margin-bottom: 16px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-item { width: 100px; }
.filter-dept { width: 130px; }
.filter-name { width: 160px; }

/* ==================== 主体布局 ==================== */
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

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

/* ==================== 统计卡片 ==================== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 12px;
  border: 1px solid transparent;
}

.stat-records {
  background: #eff6ff;
  border-color: #bfdbfe;
}
.stat-employees {
  background: #f0fdf4;
  border-color: #bbf7d0;
}
.stat-hours {
  background: #faf5ff;
  border-color: #e9d5ff;
}
.stat-overtime {
  background: #fff7ed;
  border-color: #fed7aa;
}

.stat-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-records .stat-icon { background: #dbeafe; color: #3b82f6; }
.stat-employees .stat-icon { background: #dcfce7; color: #22c55e; }
.stat-hours .stat-icon { background: #f3e8ff; color: #a855f7; }
.stat-overtime .stat-icon { background: #ffedd5; color: #f97316; }

.stat-body {
  display: flex;
  flex-direction: column;
}

.stat-num {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: 'Inter', 'Segoe UI', sans-serif;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.stat-tag {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
  margin-top: 2px;
}

/* ==================== 表格卡片 ==================== */
.table-card {
  border-radius: 6px;
  margin-bottom: 20px;
}

.table-card :deep(.el-table) {
  border-radius: 8px;
}

.table-card :deep(.el-table th) {
  background: #f8fafc;
  font-weight: 600;
  color: var(--text-primary);
}

.table-card :deep(.el-table__row:hover > td) {
  background: #f0f4ff !important;
}

.table-card :deep(.el-table__body tr.current-row > td) {
  background: #eef2ff !important;
}

.hours-val {
  font-weight: 600;
  color: #3b82f6;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  font-variant-numeric: tabular-nums;
}

.overtime-val {
  font-weight: 600;
  color: #f59e0b;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  font-variant-numeric: tabular-nums;
}

.weekend-text {
  color: #ef4444;
  font-weight: 600;
}

/* ==================== 分页 ==================== */
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  padding: 12px 0 4px;
  flex-shrink: 0;
}
</style>
