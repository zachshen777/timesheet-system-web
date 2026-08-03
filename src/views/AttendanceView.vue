<template>
  <div class="page-wrapper">
    <!-- ==================== 顶部导航 ==================== -->
    <header class="top-bar">
      <div class="top-bar-left">
        <div class="logo-mark">
          <el-icon :size="20"><Timer /></el-icon>
        </div>
        <span class="top-title">工时填报中心</span>
      </div>
      <div class="top-bar-center">
        <div class="date-picker" @click="prevPeriod">
          <el-icon><ArrowLeft /></el-icon>
        </div>
        <div class="date-display">
          <template v-if="viewMode === 'week'">
            <span class="date-week-range">{{ weekRangeText }}</span>
          </template>
          <template v-else>
            <span class="date-year">{{ calYear }}年</span>
            <span class="date-month">{{ calMonth }}月</span>
          </template>
        </div>
        <div class="date-picker" @click="nextPeriod">
          <el-icon><ArrowRight /></el-icon>
        </div>
        <el-button text size="small" class="today-btn" @click="goToday">今天</el-button>
        <el-button-group class="view-switch">
          <el-button :type="viewMode==='month'?'primary':'default'" :class="{'btn-secondary': viewMode !== 'month'}" size="14px" @click="switchToMonth">月视图</el-button>
          <el-button :type="viewMode==='week'?'primary':'default'" :class="{'btn-secondary': viewMode !== 'week'}" size="14px" @click="switchToWeek">周视图</el-button>
        </el-button-group>
      </div>
      <div class="top-bar-right">
        <el-button class="btn-secondary" round size="small" :loading="exporting" @click="exportData">
          <el-icon><Download /></el-icon> 导出
        </el-button>
      </div>
    </header>

    <div class="main-layout">
      <AppSidebar />

      <!-- ==================== 主内容：横向双栏 ==================== -->
      <div class="content-area">
        <div class="content-grid">
          <!-- 左栏：日历卡片 -->
          <div class="panel calendar-panel">
            <div class="cal-header">
              <div class="cal-title">
                <template v-if="viewMode === 'week'">{{ weekRangeText }} 工时日历</template>
                <template v-else>{{ calYear }}年{{ calMonth }}月 工时日历</template>
              </div>
              <div class="cal-actions">
                <div class="cal-nav-btn" @click="prevMonth"><el-icon><ArrowLeft /></el-icon></div>
                <div class="cal-nav-btn" @click="nextMonth"><el-icon><ArrowRight /></el-icon></div>
              </div>
            </div>

            <div class="cal-legend">
              <span class="legend-tag lg-filled"><i class="dot"></i>已填报</span>
              <span class="legend-tag lg-overtime"><i class="dot"></i>有加班</span>
              <span class="legend-tag lg-pending"><i class="dot"></i>待填报</span>
              <span class="legend-divider"></span>
              <span class="legend-tag lg-today"><i class="dot ring"></i>今日</span>
              <span class="legend-tag lg-holiday"><i class="dot"></i>法定节假日</span>
              <span class="legend-tag lg-shift"><i class="dot"></i>调班日</span>
              <span class="legend-tag lg-weekend"><i class="dot"></i>休息日</span>
            </div>

            <div class="cal-grid">
              <div
                class="cal-weekday"
                v-for="(w, idx) in weekdays"
                :key="w"
                :class="['col-' + colTypeClass(idx), { 'col-rest': idx >= 5 }]"
              >{{ w }}</div>
              <div
                v-for="cell in calendarCells"
                :key="cell.key"
                class="cal-cell"
                :class="[...cellClass(cell), 'col-' + colTypeClass(cell.colIndex), { 'cell-just-clicked': cellClickAnim === cell.key, 'is-copy-source': copyMode && copyMode.sourceDate === cell.dateStr }]"
                @click="onCellClick($event, cell)"
              >
                <span class="cell-num">{{ cell.day || '' }}</span>
                <span v-if="cell.day" class="cell-info">
                  <span v-if="cell.hours" class="cell-hours">{{ cell.hours }}h</span>
                  <span v-if="cell.overtime" class="cell-overtime">+{{ cell.overtime }}h</span>
                  <span v-if="cell.project" class="cell-content">{{ cell.project }}</span>
                </span>
                <span v-if="cell.isHoliday" class="cell-holiday-badge" :title="cell.holidayName">{{ cell.holidayName }}</span>
                <span v-if="cell.isShift" class="cell-shift-badge" title="调班日">班</span>
                <span v-if="cell.dayType === 'saturday' || cell.dayType === 'sunday'" class="cell-rest-badge" title="休息日">休</span>
                <span v-if="cell.isToday" class="cell-today-dot"></span>
                <span v-if="cell.isSelected" class="cell-selected-ring"></span>
              </div>
            </div>

            <div v-if="selectedDates.length > 1" class="batch-hint">
              <el-icon><Select /></el-icon>
              已选择 <strong>{{ selectedDates.length }}</strong> 天，按住 Ctrl 多选日期可批量填报
            </div>
          </div>

          <!-- 右栏：工时填报表单卡片 -->
          <div class="panel ts-panel">
            <div class="panel-title-row">
              <div class="panel-title-left">
                <span class="title-bar"></span>
                <span>工时填报</span>
              </div>
              <div class="panel-date-badge" :class="{ multi: selectedDates.length > 1 }">
                <span v-if="selectedDates.length === 1" class="date-badge-main">{{ formatDateFull(selectedDates[0]) }}</span>
                <span v-else-if="selectedDates.length > 1" class="date-badge-main">{{ selectedDates.length }} 天已选</span>
                <span v-else class="date-badge-main muted">选择日期开始填报</span>
                <span
                  v-if="selectedDates.length === 1"
                  class="date-badge-type"
                  :class="'type-' + getDayType(selectedDates[0])"
                >{{ holidayNameMap.get(selectedDates[0]) || dayTypeLabel(getDayType(selectedDates[0])) }}</span>
              </div>
              <div class="panel-title-right">
                  <el-button link size="small" @click="copyLastDay">
                    <el-icon><CopyDocument /></el-icon> 复制上一天
                  </el-button>
                  <el-button v-if="!copyMode" link size="small" type="warning" @click="startCopyMode">
                    <el-icon><CopyDocument /></el-icon> 复制工时信息
                  </el-button>
                  <el-button v-else link size="small" type="danger" @click="exitCopyMode">
                    <el-icon><Close /></el-icon> 取消复制
                  </el-button>
                  <el-tooltip v-if="selectedDates.length" content="清除选择" placement="bottom">
                    <span class="ts-clear" @click="clearSelection"><el-icon><Close /></el-icon></span>
                  </el-tooltip>
              </div>
            </div>

            <transition name="form-switch" mode="out-in">
            <div class="ts-form-body" :key="formKey">
              <div class="ts-form-left">
                <div class="ts-hours-row">
                  <div class="ts-row">
                    <div class="ts-row-label">标准工时</div>
                    <el-input-number v-model="tsForm.workHours" :min="0" :max="24" :step="0.5" :precision="1" controls-position="right" class="ts-row-input" />
                    <span class="ts-row-unit">h</span>
                  </div>
                  <div class="ts-row">
                    <div class="ts-row-label">加班时长</div>
                    <el-input-number v-model="tsForm.overtimeHours" :min="0" :max="16" :step="0.5" :precision="1" controls-position="right" class="ts-row-input" />
                    <span class="ts-row-unit">h</span>
                  </div>
                </div>

                <div class="ts-block">
                  <div class="ts-block-label">项目名称</div>
                  <el-input v-model="tsForm.project" placeholder="例如：XX项目 / 日常维护" />
                </div>
                <div class="ts-block">
                  <div class="ts-block-label">任务描述</div>
                  <el-input v-model="tsForm.task" placeholder="例如：需求开发 / Bug修复 / 文档编写" />
                </div>
                <div class="ts-block">
                  <div class="ts-block-label">备注</div>
                  <el-input v-model="tsForm.remark" type="textarea" :rows="2" placeholder="可选填写备注信息" />
                </div>
              </div>

              <div class="ts-form-right">
                <div class="ts-quick">
                  <div class="ts-quick-label">快捷填报</div>
                  <div class="ts-quick-btns">
                    <el-button v-for="h in [4, 8, 1, 2]" :key="h" class="btn-quick" :class="{'btn-quick-active': tsForm.workHours === h}" round @click="quickFill(h)">{{ h }}h</el-button>
                  </div>
                </div>

                <transition name="form-switch">
                <div v-if="copyMode" class="copy-mode-banner">
                  <el-icon class="copy-spin-icon"><Loading /></el-icon>
                  <span>已复制 <strong>{{ copyMode.sourceLabel }}</strong> 的工时信息，请点击日历中要覆盖的日期</span>
                </div>
                </transition>

                <div class="ts-stats">
                  <div class="ts-stat">
                    <div class="ts-stat-value"><span class="ts-stat-num">{{ monthStats.standard }}</span><span class="ts-stat-unit">h</span></div>
                    <div class="ts-stat-label">本月标准出勤</div>
                  </div>
                  <div class="ts-stat">
                    <div class="ts-stat-value"><span class="ts-stat-num">{{ monthStats.overtime }}</span><span class="ts-stat-unit">h</span></div>
                    <div class="ts-stat-label">累计加班</div>
                  </div>
                  <div class="ts-stat stat-pending">
                    <div class="ts-stat-value"><span class="ts-stat-num">{{ monthStats.pending }}</span><span class="ts-stat-unit">天</span></div>
                    <div class="ts-stat-label">工作日待填报</div>
                  </div>
                </div>

                <div class="ts-actions">
                  <el-button type="primary" round :loading="saveLoading" @click="handleSave">
                    <el-icon><Check /></el-icon> 保存
                  </el-button>
                  <el-button class="btn-secondary" round size="small" @click="handleDeleteTs">
                    <el-icon><Delete /></el-icon> 删除记录
                  </el-button>
                </div>
              </div>
            </div>
            </transition>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Timer, ArrowLeft, ArrowRight, CopyDocument, Download,
  Delete, Close, Loading
} from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'
import { getMonthTimesheets, saveTimesheet, batchSaveTimesheet, deleteTimesheet, batchDeleteTimesheet } from '../api/timesheet'
import { exportTimesheet } from '../api/report'
import { getHolidays } from '../api/config'
import AppSidebar from '../components/AppSidebar.vue'

const userStore = useUserStore()

const router = useRouter()
const route = useRoute()

// ===== 视图模式 =====
const viewMode = ref('month')
const weekOffset = ref(0)

// ===== 工时日历 =====
const calYear = ref(new Date().getFullYear())
const calMonth = ref(new Date().getMonth() + 1)
const timesheetMap = ref({})
const selectedDates = ref([])
const cellClickAnim = ref('')
const formKey = ref(0)
const weekdays = ['一', '二', '三', '四', '五', '六', '日']

// ===== 复制-粘贴模式 =====
const copyMode = ref(null) // { sourceDate, sourceLabel } 或 null

// ===== 自定义日期配置（从后端加载） =====
const holidaySet = ref(new Set())   // 法定节假日（休息）
const shiftSet = ref(new Set())     // 调班日（上班）
const holidayNameMap = ref(new Map()) // 日期 → 假期名称

async function loadHolidays() {
  try {
    const res = await getHolidays()
    const hSet = new Set()
    const sSet = new Set()
    const nameMap = new Map()
    const list = res || []
    list.forEach(h => {
      if (!h.startDate || !h.endDate) return
      const start = new Date(h.startDate + 'T00:00:00')
      const end = new Date(h.endDate + 'T00:00:00')
      const cur = new Date(start)
      while (cur <= end) {
        const ds = formatDate(cur)
        if (h.type === 'shift') {
          sSet.add(ds)
        } else {
          hSet.add(ds)
          nameMap.set(ds, h.name)
        }
        cur.setDate(cur.getDate() + 1)
      }
    })
    holidaySet.value = hSet
    shiftSet.value = sSet
    holidayNameMap.value = nameMap
  } catch (err) {
    console.error('加载节假日配置失败:', err)
  }
}

/**
 * 获取日期的 4 种状态
 * 优先级：调班日 > 法定节假日 > 默认周末规则
 */
function getDayType(dateStr) {
  if (!dateStr) return ''
  // 1. 调班日（覆盖周末为工作日）
  if (shiftSet.value.has(dateStr)) return 'shift'
  // 2. 法定节假日（休息日）
  if (holidaySet.value.has(dateStr)) return 'holiday'
  // 3. 默认周末规则
  const dow = new Date(dateStr + 'T00:00:00').getDay()
  if (dow === 0) return 'sunday'
  if (dow === 6) return 'saturday'
  return 'workday'
}

function colTypeClass(colIndex) {
  if (colIndex === undefined || colIndex === null || colIndex < 0) return ''
  const map = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  return map[colIndex % 7] || ''
}

function dayTypeLabel(type) {
  const labels = { workday: '工作日', saturday: '休息日', sunday: '休息日', holiday: '法定节假日', shift: '调班日' }
  return labels[type] || ''
}

const todayStr = computed(() => formatDate(new Date()))

// 当前视图的周范围（周一 ~ 周日）
const weekDays = computed(() => {
  const now = new Date()
  const currentMonday = new Date(now)
  const dayOfWeek = now.getDay() || 7
  currentMonday.setDate(now.getDate() - dayOfWeek + 1 + weekOffset.value * 7)
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(currentMonday)
    d.setDate(currentMonday.getDate() + i)
    days.push(d)
  }
  return days
})

const weekRangeText = computed(() => {
  const days = weekDays.value
  const fmt = (d) => `${d.getMonth() + 1}月${d.getDate()}日`
  return `${fmt(days[0])} - ${fmt(days[6])}`
})

// 生成周视图的日历格
function buildWeekCells() {
  const todayStrLocal = formatDate(new Date())
  return weekDays.value.map((d, i) => {
    const dateStr = formatDate(d)
    const ts = timesheetMap.value[dateStr]
    const dayType = getDayType(dateStr)
    return {
      key: dateStr,
      day: d.getDate(),
      dateStr,
      colIndex: i,
      dayType,
      isHoliday: dayType === 'holiday',
      isShift: dayType === 'shift',
      holidayName: holidayNameMap.value.get(dateStr) || '',
      hasTimesheet: ts && (Number(ts.workHours || 0) > 0 || Number(ts.overtimeHours || 0) > 0),
      hours: ts?.workHours ? formatHours(ts.workHours) : '',
      overtime: ts?.overtimeHours ? formatHours(ts.overtimeHours) : '',
      project: ts?.project || '',
      isToday: dateStr === todayStrLocal,
      isSelected: selectedDates.value.includes(dateStr)
    }
  })
}

// 生成月视图的日历格
function buildMonthCells() {
  const y = calYear.value
  const m = calMonth.value
  const firstDay = new Date(y, m - 1, 1)
  let startWeekday = firstDay.getDay()
  startWeekday = startWeekday === 0 ? 6 : startWeekday - 1
  const daysInMonth = new Date(y, m, 0).getDate()
  const todayStrLocal = formatDate(new Date())
  const cells = []

  for (let i = 0; i < startWeekday; i++) {
    cells.push({ key: `pad-${i}`, day: 0, dateStr: '', colIndex: i, dayType: '', isHoliday: false, isShift: false })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const ts = timesheetMap.value[dateStr]
    const colIndex = cells.length % 7
    const dayType = getDayType(dateStr)
    cells.push({
      key: dateStr,
      day: d,
      dateStr,
      colIndex,
      dayType,
      isHoliday: dayType === 'holiday',
      isShift: dayType === 'shift',
      holidayName: holidayNameMap.value.get(dateStr) || '',
      hasTimesheet: ts && (Number(ts.workHours || 0) > 0 || Number(ts.overtimeHours || 0) > 0),
      hours: ts?.workHours ? formatHours(ts.workHours) : '',
      overtime: ts?.overtimeHours ? formatHours(ts.overtimeHours) : '',
      project: ts?.project || '',
      isToday: dateStr === todayStrLocal,
      isSelected: selectedDates.value.includes(dateStr)
    })
  }

  while (cells.length % 7 !== 0) {
    cells.push({ key: `pad2-${cells.length}`, day: 0, dateStr: '', colIndex: cells.length % 7, dayType: '', isHoliday: false, isShift: false })
  }

  return cells
}

const calendarCells = computed(() => {
  return viewMode.value === 'week' ? buildWeekCells() : buildMonthCells()
})

function cellClass(cell) {
  if (!cell.day) return 'empty'
  return [
    'has-day',
    cell.hasTimesheet ? (cell.overtime ? 'st-overtime' : 'st-filled') : 'st-pending',
    cell.dayType ? 'daytype-' + cell.dayType : '',
    cell.isToday ? 'is-today' : '',
    cell.isSelected ? 'is-selected' : ''
  ]
}

function formatHours(h) {
  const v = Number(h)
  if (!v || isNaN(v)) return ''
  return Number.isInteger(v) ? `${v}` : v.toFixed(1)
}

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function formatDateFull(d) {
  if (!d) return ''
  const parts = d.split('-')
  const dt = new Date(+parts[0], +parts[1] - 1, +parts[2])
  const weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${parts[0]}年${parts[1]}月${parts[2]}日 ${weekMap[dt.getDay()]}`
}

async function loadMonthTimesheets() {
  try {
    if (viewMode.value === 'week') {
      // 周视图：加载本周跨越的所有月份
      const days = weekDays.value
      const months = new Set()
      days.forEach(d => months.add(`${d.getFullYear()}-${d.getMonth() + 1}`))
      const merged = {}
      for (const mk of months) {
        const [y, m] = mk.split('-').map(Number)
        const res = await getMonthTimesheets(y, m)
        Object.assign(merged, res.data || {})
      }
      timesheetMap.value = merged
    } else {
      const res = await getMonthTimesheets(calYear.value, calMonth.value)
      timesheetMap.value = res.data || {}
    }
  } catch (err) {
    console.error('加载工时记录失败:', err)
  }
}

function onCellClick(event, cell) {
  if (!cell.day) return
  const dateStr = cell.dateStr

  // 粘贴模式：点击目标日期
  if (copyMode.value) {
    if (dateStr === copyMode.value.sourceDate) {
      exitCopyMode()
      return
    }
    handlePasteTo(dateStr)
    return
  }

  cellClickAnim.value = cell.key
  setTimeout(() => { cellClickAnim.value = '' }, 400)
  if (event.ctrlKey || event.metaKey) {
    const idx = selectedDates.value.indexOf(dateStr)
    if (idx >= 0) {
      selectedDates.value.splice(idx, 1)
    } else {
      selectedDates.value.push(dateStr)
      selectedDates.value.sort()
    }
  } else {
    selectedDates.value = [dateStr]
  }
  formKey.value++
  loadFormForSelection()
}

function loadFormForSelection() {
  if (selectedDates.value.length === 1) {
    const dateStr = selectedDates.value[0]
    const ts = timesheetMap.value[dateStr]
    if (ts) {
      tsForm.value = {
        project: ts.project || '',
        task: ts.task || '',
        remark: ts.remark || '',
        workHours: ts.workHours ?? 8,
        overtimeHours: ts.overtimeHours ?? 0
      }
    } else {
      tsForm.value = { project: '', task: '', remark: '', workHours: 8, overtimeHours: 0 }
    }
  } else if (selectedDates.value.length > 1) {
    tsForm.value = { project: '', task: '', remark: '', workHours: 8, overtimeHours: 0 }
  }
}

function clearSelection() {
  selectedDates.value = []
  formKey.value++
}

// ===== 导航 =====
function prevPeriod() {
  if (viewMode.value === 'week') {
    weekOffset.value--
  } else {
    prevMonth()
  }
}

function nextPeriod() {
  if (viewMode.value === 'week') {
    weekOffset.value++
  } else {
    nextMonth()
  }
}

function goToday() {
  if (viewMode.value === 'week') {
    weekOffset.value = 0
  } else {
    const now = new Date()
    calYear.value = now.getFullYear()
    calMonth.value = now.getMonth() + 1
  }
  selectedDates.value = []
}

function switchToMonth() {
  if (viewMode.value === 'week') {
    // 从周视图切到月视图，把当前周的月份同步过去
    const monday = weekDays.value[0]
    calYear.value = monday.getFullYear()
    calMonth.value = monday.getMonth() + 1
    weekOffset.value = 0
  }
  viewMode.value = 'month'
  selectedDates.value = []
}

function switchToWeek() {
  if (viewMode.value === 'month') {
    // 从月视图切到周视图，找当前日期所在的周
    const now = new Date()
    calYear.value = now.getFullYear()
    calMonth.value = now.getMonth() + 1
    weekOffset.value = 0
  }
  viewMode.value = 'week'
  selectedDates.value = []
}

function prevMonth() {
  if (calMonth.value === 1) { calYear.value--; calMonth.value = 12 }
  else calMonth.value--
  selectedDates.value = []
}

function nextMonth() {
  if (calMonth.value === 12) { calYear.value++; calMonth.value = 1 }
  else calMonth.value++
  selectedDates.value = []
}

// ===== 月度统计 =====
const monthStats = computed(() => {
  let standard = 0
  let overtime = 0
  let pending = 0
  const y = calYear.value
  const m = calMonth.value
  const daysInMonth = new Date(y, m, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const ts = timesheetMap.value[dateStr]
    // 只有实际填写了工时的记录才算"已填报"，空记录（删除后残留）不算
    const hasData = ts && (Number(ts.workHours || 0) > 0 || Number(ts.overtimeHours || 0) > 0)
    if (hasData) {
      standard += Number(ts.workHours || 0)
      overtime += Number(ts.overtimeHours || 0)
    } else {
      // 用 getDayType 统一判断：工作日/调班日需填报，休息日/法定节假日不需要
      const dt = getDayType(dateStr)
      if (dt === 'workday' || dt === 'shift') pending++
    }
  }
  return { standard, overtime, pending }
})

// ===== 工时表单 =====
const tsForm = ref({ project: '', task: '', remark: '', workHours: 8, overtimeHours: 0 })
const saveLoading = ref(false)

async function handleSave() {
  if (selectedDates.value.length === 0) {
    selectedDates.value = [todayStr.value]
  }
  saveLoading.value = true
  try {
    if (selectedDates.value.length === 1) {
      await saveTimesheet({
        date: selectedDates.value[0],
        project: tsForm.value.project || null,
        task: tsForm.value.task || null,
        remark: tsForm.value.remark || null,
        workHours: tsForm.value.workHours ?? null,
        overtimeHours: tsForm.value.overtimeHours ?? null,
        status: 'SUBMITTED'
      })
      ElMessage.success('工时保存成功')
    } else {
      await batchSaveTimesheet({
        dates: selectedDates.value,
        project: tsForm.value.project || null,
        task: tsForm.value.task || null,
        remark: tsForm.value.remark || null,
        workHours: tsForm.value.workHours ?? null,
        overtimeHours: tsForm.value.overtimeHours ?? null,
        status: 'SUBMITTED'
      })
      ElMessage.success(`批量保存成功（${selectedDates.value.length} 天）`)
    }
    await loadMonthTimesheets()
    loadFormForSelection()
  } catch (err) {
    console.error('保存工时失败:', err)
  } finally {
    saveLoading.value = false
  }
}

async function handleDeleteTs() {
  if (selectedDates.value.length === 0) {
    ElMessage.info('请先在日历中选择日期')
    return
  }
  try {
    const dateLabel = selectedDates.value.length === 1 ? selectedDates.value[0] : `${selectedDates.value.length} 天`
    await ElMessageBox.confirm(`确定要删除 ${dateLabel} 的工时记录吗？`, '删除确认', { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' })
    if (selectedDates.value.length === 1) {
      await deleteTimesheet(selectedDates.value[0])
    } else {
      await batchDeleteTimesheet(selectedDates.value)
    }
    ElMessage.success('删除成功')
    await loadMonthTimesheets()
    clearSelection()
  } catch (err) {
    if (err !== 'cancel') console.error('删除工时失败:', err)
  }
}

function quickFill(hours) {
  if (selectedDates.value.length === 0) {
    selectedDates.value = [todayStr.value]
  }
  tsForm.value.workHours = hours
  handleSave()
}

const exporting = ref(false)

async function exportData() {
  if (exporting.value) return
  exporting.value = true
  try {
    const blob = await exportTimesheet(calYear.value, calMonth.value)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${calYear.value}年${calMonth.value}月出勤表.xlsx`
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

function copyLastDay() {
  if (!selectedDates.value.length) {
    ElMessage.warning('请先选择一个日期')
    return
  }
  const curDate = selectedDates.value[0]
  const cur = new Date(curDate + 'T00:00:00')
  cur.setDate(cur.getDate() - 1)
  const prev = formatDate(cur)
  const prevTs = timesheetMap.value[prev]
  if (!prevTs || !(prevTs.project || prevTs.task)) {
    ElMessage.info(`前一天（${prev}）无记录可复制`)
    return
  }
  tsForm.value.project = prevTs.project || ''
  tsForm.value.task = prevTs.task || ''
  tsForm.value.remark = prevTs.remark || ''
  tsForm.value.workHours = prevTs.workHours ?? 8
  tsForm.value.overtimeHours = prevTs.overtimeHours ?? 0
  ElMessage.success(`已从 ${prev} 复制工时内容`)
}

// ===== 复制-粘贴模式 =====
function startCopyMode() {
  if (!selectedDates.value.length) {
    ElMessage.warning('请先在日历中选择一个来源日期')
    return
  }
  const dateStr = selectedDates.value[0]
  const ts = timesheetMap.value[dateStr]
  if (!ts || !(ts.project || ts.task || ts.workHours)) {
    ElMessage.info('所选日期无工时记录可复制')
    return
  }
  copyMode.value = { sourceDate: dateStr, sourceLabel: dateStr }
  ElMessage.success(`已复制 ${dateStr} 的工时信息，请点击日历中要覆盖的日期`)
}

function exitCopyMode() {
  copyMode.value = null
}

async function handlePasteTo(targetDate) {
  const sourceDate = copyMode.value.sourceDate
  try {
    await ElMessageBox.confirm(
      `确定要将 ${sourceDate} 的工时信息覆盖到 ${targetDate} 吗？`,
      '覆盖确认',
      { confirmButtonText: '确定覆盖', cancelButtonText: '取消', type: 'warning' }
    )
    const ts = timesheetMap.value[sourceDate]
    await saveTimesheet({
      date: targetDate,
      project: ts.project || null,
      task: ts.task || null,
      remark: ts.remark || null,
      workHours: ts.workHours ?? null,
      overtimeHours: ts.overtimeHours ?? null,
      status: 'SUBMITTED'
    })
    ElMessage.success(`已将 ${sourceDate} 的工时信息覆盖到 ${targetDate}`)
    exitCopyMode()
    selectedDates.value = [targetDate]
    formKey.value++
    await loadMonthTimesheets()
    loadFormForSelection()
  } catch {
    // 用户取消确认
    exitCopyMode()
  }
}

// ===== 加载全部 =====
async function loadAll() {
  await Promise.all([loadMonthTimesheets(), loadHolidays()])
}

// 日历状态变化时自动重新加载数据
watch([calYear, calMonth, weekOffset, viewMode], () => {
  loadMonthTimesheets()
  if (copyMode.value) exitCopyMode()
})

onMounted(async () => {
  if (!userStore.userInfo) {
    await userStore.fetchUserInfo()
    if (!userStore.isLogin) { router.push('/login'); return }
  }
  await loadAll()
})
</script>

<style scoped>
.page-wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f9fafb;
  overflow: hidden;
  color: #1f2937;
}

/* ==================== 顶部导航 ==================== */
.top-bar {
  height: 60px;
  background: #ffffff;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
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
  box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
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
  font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', 'Roboto', Arial, sans-serif;
  font-variant-numeric: tabular-nums;
}
.date-month {
  font-size: 18px;
  font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', 'DIN Alternate', 'Roboto', Arial, sans-serif;
  font-variant-numeric: tabular-nums;
}
.date-week-range {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
  font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', 'Roboto', Arial, sans-serif;
  font-variant-numeric: tabular-nums;
}
.today-btn {
  margin-left: 4px;
  color: var(--el-color-primary);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}
.today-btn:hover {
  background: var(--el-color-primary-light-9);
}

.view-switch {
  margin-left: 16px;
}
.view-switch .el-button {
  transition: all 0.2s ease;
}
.view-switch .el-button:active {
  transform: scale(0.95);
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ==================== 主布局 ==================== */
.main-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

/* ==================== 内容区 ==================== */
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
  min-width: 0;
  max-width: 1600px;
  margin: 0 auto;
}

/* ==================== 横向双栏布局 ==================== */
.content-grid {
  display: grid;
  grid-template-columns: minmax(636px, 1fr) 1.4fr;
  gap: 24px;
  flex: 1;
  min-height: 0;
  align-items: start;
}

/* Panel 通用 */
.panel {
  background: #ffffff;
  border-radius: 6px;
  box-shadow: 0 1px 3px #00000008;
  border: 1px solid #f0f1f5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.panel:hover {
  box-shadow: 0 4px 12px #00000012;
}
.panel-date-badge {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.date-badge-main {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-color-primary);
  background: linear-gradient(90deg, var(--el-color-primary-light-9) 0%, #dbeafe 100%);
  padding: 6px 18px;
  border-radius: 20px;
  letter-spacing: 0.5px;
  white-space: nowrap;
  transition: all 0.3s ease;
  position: relative;
}
.date-badge-main::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 24px;
  border: 2px solid transparent;
  transition: border-color 0.3s ease;
}
.panel-date-badge:not(.multi) .date-badge-main::after {
  animation: badge-pulse 2s ease-in-out infinite;
}
@keyframes badge-pulse {
  0%, 100% { border-color: rgba(59, 130, 246, 0.15); }
  50% { border-color: rgba(59, 130, 246, 0.4); }
}
.date-badge-main.muted {
  color: #9ca3af;
  background: #f3f4f6;
  font-weight: 500;
  font-size: 13px;
}
.panel-date-badge.multi .date-badge-main {
  color: #f59e0b;
  background: linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%);
}

/* 日期类型标签 */
.date-badge-type {
  margin-left: 8px;
  font-size: 14px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
  white-space: nowrap;
}
.date-badge-type.type-workday {
  color: #4b5563;
  background: #f1f5f9;
}
.date-badge-type.type-saturday {
  color: #16a34a;
  background: #f0fdf4;
}
.date-badge-type.type-sunday {
  color: #16a34a;
  background: #f0fdf4;
}
.date-badge-type.type-holiday {
  color: #b45309;
  background: linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%);
}
.date-badge-type.type-shift {
  color: #6d28d9;
  background: linear-gradient(90deg, #f5f3ff 0%, #ede9fe 100%);
}
.panel-title-row {
  display: flex;
  align-items: center;
  padding: 0 0 12px 0;
  margin-bottom: 12px;
  border-bottom: 1px solid #f5f6fa;
  gap: 16px;
}
.panel-title-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}
.panel-title-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
}
.title-bar {
  width: 3px;
  height: 18px;
  border-radius: 2px;
  background: var(--el-color-primary);
}

/* ==================== 工时填报表单 ==================== */
.ts-panel {
  display: flex;
  flex-direction: column;
}

/* 表单切换过渡动画 */
.form-switch-enter-active {
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.form-switch-leave-active {
  transition: all 0.15s ease-in;
}
.form-switch-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.form-switch-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.ts-clear {
  font-size: 14px;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
}
.ts-clear:hover { color: #ef4444; background: #fef2f2; }

.ts-form-body {
  display: grid;
  grid-template-columns: 7fr 3fr;
  gap: 0;
  padding: 0;
}

.ts-form-left {
  padding-right: 16px;
  border-right: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
}

.ts-form-right {
  padding-left: 16px;
  display: flex;
  flex-direction: column;
}

.ts-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0;
}
.ts-row-label {
  width: 60px;
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
  text-align: left;
  white-space: nowrap;
}
.ts-row-input {
  flex: 1;
  max-width: 130px;
}
.ts-row-input :deep(.el-input-number) { width: 100%; }
.ts-row-input :deep(.el-input__inner) {
  height: 30px;
  line-height: 30px;
}
.ts-row-unit {
  font-size: 12px;
  color: #9ca3af;
}

.ts-hours-row {
  display: flex;
  gap: 20px;
  padding: 10px 0;
  border-bottom: 1px solid #f3f4f6;
}

.ts-block {
  padding: 10px 0;
}
.ts-block-label {
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 4px;
}

.ts-quick {
  padding: 8px 0 10px;
  border-bottom: 1px solid #f3f4f6;
}
.ts-quick-label {
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 8px;
}
.ts-quick-btns {
  display: flex;
  gap: 8px;
}

.ts-stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}
.ts-stat {
  text-align: center;
  border-right: 1px solid #f3f4f6;
  padding: 6px 0;
}
.ts-stat:last-child { border-right: none; }
.ts-stat-value {
  margin-bottom: 4px;
  line-height: 1.2;
}
.ts-stat-label {
  font-size: 12px;
  color: #9ca3af;
}
.ts-stat-num {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-color-primary);
  font-variant-numeric: tabular-nums lining-nums;
  font-feature-settings: 'tnum' 1, 'lnum' 1;
  font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', 'DIN Alternate', 'Roboto', Arial, sans-serif;
  letter-spacing: 0.5px;
}
.ts-stat-unit {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-color-primary);
  margin-left: 2px;
}
/* 待填报卡片：橙色预警 */
.ts-stat.stat-pending .ts-stat-num,
.ts-stat.stat-pending .ts-stat-unit {
  color: #f59e0b;
}

.ts-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 14px;
  justify-content: flex-end;
}

/* ==================== 日历卡片 ==================== */
.calendar-panel {
  min-height: 0;
}
.cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  margin-bottom: 8px;
  border-bottom: 1px solid #f0f1f5;
  gap: 12px;
}
.cal-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
}
.cal-actions { display: flex; gap: 6px; flex-shrink: 0; }
.cal-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
  padding-bottom: 12px;
  margin-bottom: 4px;
  border-bottom: 1px solid #f5f6fa;
}
.legend-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
  font-size: 12px;
  white-space: nowrap;
}
.legend-tag .dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* 圆形悬浮分页按钮 */
.cal-nav-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  background: #f3f4f6;
  transition: all 0.2s;
  flex-shrink: 0;
}
.cal-nav-btn:hover {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.15);
}

/* 图例分组分隔线 */
.legend-divider {
  width: 1px;
  height: 14px;
  background: #e5e7eb;
  flex-shrink: 0;
  margin: 0 2px;
}

/* 已填报 — 蓝色（对应日历 st-filled 蓝色渐变） */
.lg-filled {
  color: #1d4ed8;
  background: #dbeafe;
}
.lg-filled .dot { background: #3b82f6; }

/* 有加班 — 橙色（对应日历 st-overtime 橙色渐变） */
.lg-overtime {
  color: #c2410c;
  background: #ffedd5;
}
.lg-overtime .dot { background: #f97316; }

/* 待填报 — 琥珀色（对应工作日待填报格子 #fffbeb） */
.lg-pending {
  color: #b45309;
  background: #fffbeb;
}
.lg-pending .dot { background: #f59e0b; }

/* 今日 — 蓝色环（对应日历今日蓝色描边） */
.lg-today {
  color: #1d4ed8;
  background: #eff6ff;
}
.lg-today .dot {
  background: #fff;
  border: 2px solid #3b82f6;
  width: 8px;
  height: 8px;
}

/* 法定节假日 — 金色（对应日历 daytype-holiday 金色渐变） */
.lg-holiday {
  color: #b45309;
  background: linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%);
}
.lg-holiday .dot { background: #f59e0b; box-shadow: 0 0 0 1px #d97706; }

/* 休息日 — 绿色（对应日历 daytype-sunday 绿色底） */
.lg-weekend {
  color: #16a34a;
  background: #f0fdf4;
}
.lg-weekend .dot { background: #4ade80; box-shadow: 0 0 0 1px #16a34a; }

/* 调班日 — 紫罗兰（区别于已填报的蓝色） */
.lg-shift {
  color: #6d28d9;
  background: #f5f3ff;
}
.lg-shift .dot { background: #7c3aed; box-shadow: 0 0 0 1px #6d28d9; }

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 80px);
  grid-auto-rows: 80px;
  align-content: start;
  justify-content: center;
  gap: 6px;
  flex: none;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}
.cal-grid::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

/* 星期表头：固定80px宽与格子对齐 */
.cal-weekday {
  width: 80px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  padding: 4px 0;
  border-radius: 4px;
  margin-bottom: 2px;
  color: #6b7280;
  background: #f3f4f6;
  transition: all 0.2s;
}
.cal-weekday.col-rest {
  color: #9ca3af;
}

.cal-cell {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 600;
  color: #4b5563;
  border: 2px solid transparent;
  background: #ffffff;
  gap: 3px;
  font-variant-numeric: tabular-nums lining-nums;
  font-feature-settings: 'tnum' 1, 'lnum' 1;
}
.cal-cell.empty { cursor: default; background: transparent; }
.cal-cell.has-day:hover {
  background: var(--el-color-primary-light-9);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.12);
  z-index: 2;
}

/* 工作日（周一-周五）：白色 */
.cal-cell.daytype-workday { background: #ffffff; }
/* 周六：浅绿底（休息日） */
.cal-cell.daytype-saturday { background: #f0fdf4; }
.cal-cell.daytype-saturday .cell-num { color: #16a34a; }
/* 周日：浅绿底（休息日） */
.cal-cell.daytype-sunday { background: #f0fdf4; }
.cal-cell.daytype-sunday .cell-num { color: #16a34a; }
/* 法定节假日：金色底 */
.cal-cell.daytype-holiday {
  background: linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%);
}
.cal-cell.daytype-holiday .cell-num { color: #b45309; font-weight: 700; }
/* 调班日：紫罗兰底（周末补班，视同工作日，区别于已填报蓝色） */
.cal-cell.daytype-shift {
  background: #f5f3ff;
}
.cal-cell.daytype-shift .cell-num { color: #6d28d9; font-weight: 700; }

/* 待填报状态与列底色合并 — 工作日待填报加轻微橙色预警 */
.cal-cell.st-pending { color: #9ca3af; }
.cal-cell.daytype-workday.st-pending { background: #fffbeb; }
.cal-cell.daytype-saturday.st-pending { background: #f0fdf4; }
.cal-cell.daytype-sunday.st-pending { background: #f0fdf4; }
.cal-cell.daytype-holiday.st-pending { background: linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%); }
.cal-cell.daytype-shift.st-pending { background: #f5f3ff; }

/* 已填报叠加日期类型底色 */
.cal-cell.daytype-saturday.st-filled,
.cal-cell.daytype-sunday.st-filled {
  background: linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%);
  color: #15803d;
  font-weight: 600;
}
.cal-cell.daytype-holiday.st-filled {
  background: linear-gradient(180deg, #fef3c7 0%, #dbeafe 100%);
  color: #1d4ed8;
  font-weight: 600;
}
.cal-cell.daytype-shift.st-filled {
  background: linear-gradient(180deg, #eef2ff 0%, #f5f3ff 100%);
  color: #6d28d9;
  font-weight: 600;
}

/* 已填报 — 蓝色（标准工时已填报） */
.cal-cell.st-filled {
  background: linear-gradient(180deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1d4ed8;
  font-weight: 600;
}
/* 有加班 — 橙色 */
.cal-cell.st-overtime {
  background: linear-gradient(180deg, #ffedd5 0%, #fed7aa 100%);
  color: #c2410c;
  font-weight: 600;
}
.cal-cell.daytype-saturday.st-overtime,
.cal-cell.daytype-sunday.st-overtime {
  background: linear-gradient(180deg, #ffedd5 0%, #fed7aa 100%);
}
.cal-cell.daytype-shift.st-overtime {
  background: linear-gradient(180deg, #ffedd5 0%, #f5f3ff 100%);
}
.cal-cell.is-today {
  border: 2px solid var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}
.cal-cell.is-today .cell-num {
  font-weight: 700;
}
/* 今日格保持原有 daytype 背景色，仅加描边和阴影 */
.cal-cell.is-today.st-pending,
.cal-cell.is-today.st-filled,
.cal-cell.is-today.st-overtime {
  border: 2px solid var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}
.cal-cell.is-selected {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.cell-num {
  font-size: 17px;
  font-weight: 600;
  font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', 'DIN Alternate', 'Roboto', Arial, sans-serif;
  font-variant-numeric: tabular-nums lining-nums;
  font-feature-settings: 'tnum' 1, 'lnum' 1;
}
.cell-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  font-size: 12px;
  color: inherit;
  opacity: 0.85;
}
.cell-hours {
  font-weight: 600;
  font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', 'DIN Alternate', 'Roboto', Arial, sans-serif;
  font-variant-numeric: tabular-nums;
}
.cell-overtime {
  font-size: 12px;
  font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', 'DIN Alternate', 'Roboto', Arial, sans-serif;
  font-variant-numeric: tabular-nums;
}
.cell-content { font-size: 12px; max-width: 72px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 点击动画 */
.cell-just-clicked {
  animation: cell-ripple 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 复制粘贴模式：源日期格子顺时针虚线旋转 */
.is-copy-source {
  border-style: dashed !important;
  border-color: var(--el-color-primary) !important;
  border-width: 2px !important;
  animation: dash-rotate 2s linear infinite;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2), 0 4px 12px rgba(59, 130, 246, 0.25) !important;
}
@keyframes dash-rotate {
  0%   { border-color: #3b82f6; }
  25%  { border-color: #62a8fa; }
  50%  { border-color: #93c5fd; }
  75%  { border-color: #62a8fa; }
  100% { border-color: #3b82f6; }
}

/* 复制模式提示横幅 */
.copy-mode-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 10px 14px;
  background: linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%);
  border: 1px solid #c4b5fd;
  border-radius: 8px;
  font-size: 13px;
  color: #4338ca;
}
.copy-spin-icon {
  animation: spin-icon 1s linear infinite;
  flex-shrink: 0;
}
@keyframes spin-icon {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes cell-ripple {
  0% { transform: scale(1); }
  30% { transform: scale(0.92); }
  60% { transform: scale(1.04); }
  100% { transform: scale(1); }
}

.cell-today-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-primary);
}

/* 节假日角标 */
.cell-holiday-badge {
  position: absolute;
  top: 3px;
  left: 3px;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  background: #f59e0b;
  border-radius: 4px;
  padding: 0 4px;
  line-height: 15px;
  white-space: nowrap;
  letter-spacing: 0;
  box-shadow: 0 1px 3px rgba(245, 158, 11, 0.4);
  z-index: 1;
}

/* 调班日角标 — 紫罗兰 */
.cell-shift-badge {
  position: absolute;
  top: 3px;
  left: 3px;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  background: #7c3aed;
  border-radius: 4px;
  padding: 0 4px;
  line-height: 15px;
  letter-spacing: 0;
  box-shadow: 0 1px 3px rgba(124, 58, 237, 0.4);
}

/* 休息日角标 — 弱化，小字灰色 */
.cell-rest-badge {
  position: absolute;
  top: 3px;
  left: 3px;
  font-size: 9px;
  font-weight: 500;
  color: #9ca3af;
  background: transparent;
  border-radius: 4px;
  padding: 0 2px;
  line-height: 14px;
  letter-spacing: 0;
  z-index: 1;
}
.cal-cell.is-today .cell-rest-badge {
  color: #6b7280;
}

.batch-hint {
  margin: 0 16px 16px;
  padding: 10px 14px;
  background: linear-gradient(90deg, #eef2ff 0%, #f5f3ff 100%);
  border-radius: 8px;
  font-size: 13px;
  color: #4f46e5;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px dashed #c7d2fe;
}
.batch-hint strong { color: #4338ca; font-weight: 700; }

/* ==================== 表单元素微调 ==================== */
:deep(.el-input-number .el-input__inner) {
  text-align: left;
  font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', 'DIN Alternate', 'Roboto', Arial, sans-serif;
  font-variant-numeric: tabular-nums lining-nums;
  font-feature-settings: 'tnum' 1, 'lnum' 1;
  font-weight: 600;
  letter-spacing: 0.5px;
}
:deep(.el-button.is-round) {
  border-radius: 20px;
}
</style>
