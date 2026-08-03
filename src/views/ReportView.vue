<template>
  <div class="page-wrapper">
    <!-- ==================== 顶部导航 ==================== -->
    <header class="top-bar">
      <div class="top-bar-left">
        <div class="logo-mark">
          <el-icon :size="20"><DataAnalysis /></el-icon>
        </div>
        <span class="top-title">工时报表</span>
      </div>
      <div class="top-bar-center">
        <div class="date-picker" @click="prevMonth">
          <el-icon><ArrowLeft /></el-icon>
        </div>
        <div class="date-display">
          <span class="date-year">{{ reportYear }}年</span>
          <span class="date-month">{{ reportMonth }}月</span>
        </div>
        <div class="date-picker" @click="nextMonth">
          <el-icon><ArrowRight /></el-icon>
        </div>
        <el-button text size="small" class="today-btn" @click="goCurrentMonth">本月</el-button>
      </div>
      <div class="top-bar-right">
        <el-button class="btn-secondary" round size="small" :loading="exporting" @click="handleExport">
          <el-icon><Download /></el-icon> 导出
        </el-button>
      </div>
    </header>

    <!-- ==================== 主体布局 ==================== -->
    <div class="main-layout">
      <AppSidebar />

      <!-- 内容区 -->
      <div class="content-area">
        <!-- 上半部分：饼图 + 汇总表 -->
        <div class="report-top">
          <!-- 左：饼图 -->
          <div class="report-chart-card">
            <div class="card-title">本月个人工时项目分布</div>
            <div v-if="projectSummaries.length === 0" class="chart-empty">
              <el-empty description="本月暂无工时记录" :image-size="120" />
            </div>
            <div v-else ref="chartRef" class="chart-container"></div>
          </div>

          <!-- 右：项目汇总表格 -->
          <div class="report-summary-card">
            <div class="card-title">项目工时汇总</div>
            <div class="summary-stats">
              <div class="stat-item">
                <span class="stat-value">{{ totalHours }}</span>
                <span class="stat-label">总工时 (h)</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ filledDays }}</span>
                <span class="stat-label">已填报天数</span>
              </div>
            </div>
            <el-table :data="projectSummaries" border stripe size="small" style="width: 100%; flex: 1">
              <el-table-column prop="project" label="项目名称" align="center" />
              <el-table-column prop="totalHours" label="累计工时 (h)" align="center" width="120">
                <template #default="{ row }">
                  <span class="hours-val">{{ row.totalHours }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="percentage" label="占比" align="center" width="100">
                <template #default="{ row }">
                  <div class="pct-cell">
                    <div class="pct-bar-bg">
                      <div class="pct-bar-fill" :style="{ width: row.percentage + '%' }"></div>
                    </div>
                    <span class="pct-num">{{ row.percentage }}%</span>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- 下半部分：明细大表格 -->
        <div class="report-detail-card">
          <div class="card-title">
            工时明细
            <span class="card-subtitle">共 {{ detailList.length }} 条记录</span>
          </div>
          <el-table :data="detailList" border stripe size="small" style="width: 100%" max-height="400">
            <el-table-column prop="date" label="日期" align="center" width="120" />
            <el-table-column prop="project" label="项目" align="center" min-width="120">
              <template #default="{ row }">
                <span>{{ row.project || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="task" label="任务" align="center" min-width="150">
              <template #default="{ row }">
                <span>{{ row.task || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="workHours" label="工时 (h)" align="center" width="110">
              <template #default="{ row }">
                <span class="hours-val">{{ row.workHours ?? '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" align="center" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'SUBMITTED' ? 'success' : 'info'" size="small" effect="light">
                  {{ row.status === 'SUBMITTED' ? '已提交' : '草稿' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="100">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="goToDate(row.date)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { DataAnalysis, ArrowLeft, ArrowRight, Download } from '@element-plus/icons-vue'
import AppSidebar from '../components/AppSidebar.vue'
import { getMonthlyReport, exportTimesheet } from '../api/report'

const router = useRouter()

// ===== 月份控制 =====
const now = new Date()
const reportYear = ref(now.getFullYear())
const reportMonth = ref(now.getMonth() + 1)

function prevMonth() {
  if (reportMonth.value === 1) {
    reportYear.value--
    reportMonth.value = 12
  } else {
    reportMonth.value--
  }
}
function nextMonth() {
  if (reportMonth.value === 12) {
    reportYear.value++
    reportMonth.value = 1
  } else {
    reportMonth.value++
  }
}
function goCurrentMonth() {
  const n = new Date()
  reportYear.value = n.getFullYear()
  reportMonth.value = n.getMonth() + 1
}

// ===== 报表数据 =====
const projectSummaries = ref([])
const detailList = ref([])
const totalHours = ref(0)
const filledDays = ref(0)
const exporting = ref(false)

// ===== 导出 Excel =====
async function handleExport() {
  if (exporting.value) return
  exporting.value = true
  try {
    const blob = await exportTimesheet(reportYear.value, reportMonth.value)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${reportYear.value}年${reportMonth.value}月出勤表.xlsx`
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

// ===== ECharts 饼图 =====
const chartRef = ref(null)
let chartInstance = null

function buildChart() {
  if (!chartRef.value) return
  if (chartInstance) chartInstance.dispose()

  chartInstance = echarts.init(chartRef.value)
  const data = projectSummaries.value.map(item => ({
    name: item.project,
    value: parseFloat(item.totalHours)
  }))

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151', fontSize: 13 },
      formatter: function (params) {
        return `<div style="font-weight:600;margin-bottom:4px;color:#1f2937">${params.name}</div>
                <div style="color:#6b7280">工时数：<span style="color:#3b82f6;font-weight:600">${params.value}h</span></div>
                <div style="color:#6b7280">占比：<span style="color:#8b5cf6;font-weight:600">${params.percent}%</span></div>`
      }
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      left: 'center',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { fontSize: 12, color: '#6b7280' },
      itemGap: 16
    },
    series: [
      {
        name: '工时分布',
        type: 'pie',
        radius: ['50%', '78%'],
        center: ['50%', '46%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{d}%',
          fontSize: 11,
          color: '#6b7280',
          lineHeight: 16
        },
        labelLine: {
          length: 20,
          length2: 30,
          lineStyle: { color: '#d1d5db' }
        },
        emphasis: {
          label: { fontSize: 14, fontWeight: 'bold' },
          scaleSize: 8
        },
        data: data,
        color: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#6366f1', '#84cc16', '#14b8a6']
      }
    ]
  }

  chartInstance.setOption(option)
}

// ===== 数据加载 =====
async function loadReport() {
  try {
    const res = await getMonthlyReport(reportYear.value, reportMonth.value)
    const data = res.data
    projectSummaries.value = data.projectSummaries || []
    detailList.value = data.details || []
    totalHours.value = data.totalHours || 0
    filledDays.value = data.filledDays || 0

    await nextTick()
    buildChart()
  } catch (e) {
    ElMessage.error('加载报表数据失败')
    console.error(e)
  }
}

function goToDate(dateStr) {
  router.push({ path: '/attendance' })
  sessionStorage.setItem('reportTargetDate', dateStr)
}

// 监控月份变化
watch([reportYear, reportMonth], () => {
  loadReport()
})

// 窗口大小变化时重绘图表
function handleResize() {
  chartInstance?.resize()
}

onMounted(() => {
  loadReport()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<style scoped>
/* ===== 整体布局 ===== */
.page-wrapper {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #f9fafb;
  flex-direction: column;
}

/* ===== 顶部栏 ===== */
.top-bar {
  height: 60px;
  background: #ffffff;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 220px;
}

.logo-mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.top-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  letter-spacing: 0.5px;
}

.top-bar-center {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-picker {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s ease;
}

.date-picker:hover {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  transform: scale(1.08);
}

.date-display {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-weight: 600;
  color: #1f2937;
  min-width: 100px;
  justify-content: center;
}

.date-year {
  font-size: 14px;
  color: #6b7280;
  font-family: 'Segoe UI', 'Helvetica Neue', 'Roboto', Arial, sans-serif;
  font-variant-numeric: tabular-nums;
}

.date-month {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  font-family: 'Segoe UI', 'Helvetica Neue', 'DIN Alternate', 'Roboto', Arial, sans-serif;
  font-variant-numeric: tabular-nums;
}

.today-btn {
  margin-left: 4px;
  color: var(--el-color-primary);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ===== 主布局 ===== */
.main-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

/* ===== 内容区 ===== */
.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
  max-width: 1180px;
  margin: 0 auto;
}

/* 上半部分 */
.report-top {
  display: flex;
  gap: 20px;
  min-height: 420px;
}

.report-chart-card {
  flex: 1;
  background: #fff;
  border-radius: 6px;
  padding: 20px;
  box-shadow: 0 1px 3px #00000008;
  display: flex;
  flex-direction: column;
  min-width: 0;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.report-chart-card:hover {
  box-shadow: 0 4px 12px #00000012;
}

.card-title {
  font-size: var(--font-md);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-subtitle {
  font-size: var(--font-xs);
  font-weight: 400;
  color: var(--text-tertiary);
  margin-left: auto;
}

.chart-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-container {
  flex: 1;
  min-height: 320px;
}

.report-summary-card {
  width: 400px;
  min-width: 360px;
  background: #fff;
  border-radius: 6px;
  padding: 20px;
  box-shadow: 0 1px 3px #00000008;
  display: flex;
  flex-direction: column;
}

.summary-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.stat-item {
  flex: 1;
  background: var(--bg-main);
  border-radius: 6px;
  padding: 14px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: var(--font-2xl);
  font-weight: 600;
  color: var(--color-primary, #3b82f6);
  font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', 'DIN Alternate', 'Roboto', Arial, sans-serif;
  font-variant-numeric: tabular-nums lining-nums;
  font-feature-settings: 'tnum' 1, 'lnum' 1;
  letter-spacing: 0.5px;
}

.stat-label {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
}

/* 占比进度条 */
.pct-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pct-bar-bg {
  flex: 1;
  height: 6px;
  background: var(--bg-hover);
  border-radius: 3px;
  overflow: hidden;
}

.pct-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 3px;
  transition: width 0.6s ease;
}

.pct-num {
  font-size: var(--font-xs);
  font-weight: 600;
  color: var(--text-secondary);
  width: 42px;
  text-align: right;
  font-family: 'Segoe UI', 'Helvetica Neue', 'DIN Alternate', 'Roboto', Arial, sans-serif;
  font-variant-numeric: tabular-nums;
}

.hours-val {
  font-weight: 600;
  color: var(--text-primary);
  font-family: 'Segoe UI', 'Helvetica Neue', 'DIN Alternate', 'Roboto', Arial, sans-serif;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
}

/* 下半部分 */
.report-detail-card {
  background: #fff;
  border-radius: 6px;
  padding: 20px;
  box-shadow: 0 1px 3px #00000008;
}
</style>
