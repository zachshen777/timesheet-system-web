<template>
  <div class="page-wrapper">
    <!-- ==================== 顶部导航 ==================== -->
    <header class="top-bar">
      <div class="top-bar-left">
        <div class="logo-mark">
          <el-icon :size="20"><Timer /></el-icon>
        </div>
        <span class="top-title">定时任务</span>
      </div>
      <div class="top-bar-center"></div>
      <div class="top-bar-right">
        <el-button size="small" :loading="loadingJobs" @click="loadJobs">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
        <el-button type="primary" size="small" @click="openAddDialog">
          <el-icon><Plus /></el-icon> 新增任务
        </el-button>
      </div>
    </header>

    <!-- ==================== 主体布局 ==================== -->
    <div class="main-layout">
      <AppSidebar />

      <div class="content-area">
        <!-- ==================== 任务列表 ==================== -->
        <el-card shadow="hover" class="job-card">
          <template #header>
            <div class="card-header">
              <el-icon :size="20" color="#6366f1"><Timer /></el-icon>
              <span>任务列表</span>
              <el-tag size="small" type="info" effect="plain" style="margin-left: 8px">
                共 {{ jobs.length }} 个
              </el-tag>
              <el-tag size="small" type="success" effect="plain">
                启用 {{ enabledCount }} 个
              </el-tag>
              <span class="auto-tip">每 20 秒自动刷新</span>
            </div>
          </template>

          <el-table
            v-loading="loadingJobs"
            :data="jobs"
            stripe
            border
            style="width: 100%"
            empty-text="暂无任务，点击右上角「新增任务」创建"
          >
            <el-table-column label="任务名称" min-width="200">
              <template #default="{ row }">
                <div class="job-name-row">
                  <span class="job-name">{{ row.jobName }}</span>
                  <el-tag v-if="row.running" size="small" type="warning" effect="dark">运行中</el-tag>
                </div>
                <div class="job-desc">{{ row.description || '无描述' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="调度规则" min-width="215">
              <template #default="{ row }">
                <el-tag size="small" :type="row.execType === 'CRON' ? 'primary' : 'success'" effect="plain">
                  {{ row.execType === 'CRON' ? 'CRON' : '固定间隔' }}
                </el-tag>
                <code class="code-inline">{{ ruleText(row) }}</code>
              </template>
            </el-table-column>
            <el-table-column label="执行类" min-width="250" show-overflow-tooltip>
              <template #default="{ row }">
                <code class="code-inline">{{ row.className }}</code>
              </template>
            </el-table-column>
            <el-table-column label="下次执行" width="180">
              <template #default="{ row }">
                <span v-if="row.nextRunTime" class="next-run">{{ fmtTime(row.nextRunTime) }}</span>
                <span v-else class="muted">
                  {{ row.status === 1 ? (row.scheduled ? '等待调度' : '注册失败，见日志') : '已禁用' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-switch
                  :model-value="row.status === 1"
                  :active-text="row.status === 1 ? '启用' : '禁用'"
                  inline-prompt
                  size="small"
                  @change="handleToggleStatus(row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="252" align="center" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openEditDialog(row)">
                  <el-icon><Edit /></el-icon> 编辑
                </el-button>
                <el-button link type="success" size="small" @click="handleRunOnce(row)">
                  <el-icon><VideoPlay /></el-icon> 执行一次
                </el-button>
                <el-button link type="info" size="small" @click="showJobLogs(row)">
                  <el-icon><Document /></el-icon> 日志
                </el-button>
                <el-button link type="danger" size="small" @click="handleDelete(row)">
                  <el-icon><Delete /></el-icon> 删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- ==================== 执行日志 ==================== -->
        <el-card ref="logCardRef" shadow="hover" class="job-card">
          <template #header>
            <div class="card-header log-header">
              <el-icon :size="20" color="#6366f1"><Document /></el-icon>
              <span>执行日志</span>
              <div class="log-filters">
                <el-select
                  v-model="logQuery.jobId"
                  placeholder="全部任务"
                  clearable
                  size="small"
                  style="width: 170px"
                >
                  <el-option
                    v-for="j in jobs"
                    :key="j.id"
                    :label="j.jobName"
                    :value="j.id"
                  />
                </el-select>
                <el-select v-model="logQuery.status" placeholder="全部状态" clearable size="small" style="width: 120px">
                  <el-option label="成功" value="SUCCESS" />
                  <el-option label="失败" value="FAILED" />
                  <el-option label="跳过" value="SKIPPED" />
                </el-select>
                <el-date-picker
                  v-model="logQuery.dateRange"
                  type="daterange"
                  unlink-panels
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                  size="small"
                  style="width: 240px"
                />
                <el-button size="small" type="primary" plain @click="searchLogs">
                  <el-icon><Search /></el-icon> 查询
                </el-button>
                <el-button size="small" @click="resetLogQuery">重置</el-button>
                <el-button size="small" type="danger" plain @click="handleClearLogs">
                  <el-icon><Delete /></el-icon> 清空日志
                </el-button>
              </div>
            </div>
          </template>

          <el-table
            v-loading="loadingLogs"
            :data="logs"
            stripe
            border
            style="width: 100%"
            empty-text="暂无执行记录（任务执行后会自动记录开始/结束时间、状态与异常信息）"
          >
            <el-table-column type="expand">
              <template #default="{ row }">
                <div class="log-detail">
                  <div class="log-detail-title">异常信息</div>
                  <pre v-if="row.errorMsg" class="log-error">{{ row.errorMsg }}</pre>
                  <div v-else class="muted">本次执行没有异常。</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="jobName" label="任务名称" min-width="170" show-overflow-tooltip />
            <el-table-column label="触发方式" width="110" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="triggerTagType(row.triggerType)" effect="plain">
                  {{ triggerText(row.triggerType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="开始时间" width="170">
              <template #default="{ row }">{{ fmtTime(row.startTime) }}</template>
            </el-table-column>
            <el-table-column label="结束时间" width="170">
              <template #default="{ row }">{{ fmtTime(row.endTime) }}</template>
            </el-table-column>
            <el-table-column label="耗时" width="100" align="right">
              <template #default="{ row }">{{ fmtCost(row.costMs) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="statusTagType(row.status)" effect="dark">
                  {{ statusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="执行类" min-width="220" show-overflow-tooltip>
              <template #default="{ row }">
                <code class="code-inline">{{ row.className }}</code>
              </template>
            </el-table-column>
          </el-table>

          <div class="pager-row">
            <el-pagination
              v-model:current-page="logQuery.page"
              v-model:page-size="logQuery.size"
              :page-sizes="[10, 20, 50, 100]"
              :total="logTotal"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="loadLogs"
              @current-change="loadLogs"
            />
          </div>
        </el-card>

        <!-- ==================== 使用说明 ==================== -->
        <div class="job-guide">
          <h3>使用说明</h3>
          <ul>
            <li><strong>执行类型</strong>：<code>CRON</code> 按 cron 表达式触发（6 位：秒 分 时 日 月 周，如 <code>0 0 20 * * ?</code> 表示每天 20:00）；<code>固定间隔</code> 按「每隔 N 秒」触发。</li>
            <li><strong>执行类</strong>：填写 Java 全限定类名（如 <code>com.zach.mytools.job.task.HeartbeatLogJob</code>）。类需要实现 <code>ScheduledJob</code> 或 <code>Runnable</code>，或提供一个无参的 <code>execute()</code> 方法。</li>
            <li><strong>依赖注入</strong>：任务类若是 Spring Bean（带 <code>@Component</code>），会直接复用容器实例，可以正常注入 Mapper / Service；否则调度器会反射新建实例。</li>
            <li><strong>实时生效</strong>：新增、编辑、启停保存后立即重新调度，<strong>无需重启服务</strong>。</li>
            <li><strong>执行日志</strong>：每次执行（含手动「执行一次」）都会记录开始/结束时间、耗时、状态与异常堆栈；点开行首箭头可看异常详情。</li>
            <li><strong>防重入</strong>：同一任务上一次还没跑完时，本轮会记一条「跳过」而不是并发堆积。</li>
            <li><strong>建议</strong>：新建任务默认是「禁用」状态，先用「执行一次」验证类能跑通、日志正常，再启用调度。</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- ==================== 新增/编辑弹窗 ==================== -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingJob ? '编辑定时任务' : '新增定时任务'"
      width="620px"
      destroy-on-close
      @closed="resetDialog"
    >
      <el-form ref="dialogFormRef" :model="dialogForm" :rules="dialogRules" label-width="96px">
        <el-form-item label="任务名称" prop="jobName">
          <el-input v-model="dialogForm.jobName" placeholder="如：每日草稿提醒" maxlength="100" show-word-limit />
        </el-form-item>

        <el-form-item label="任务描述" prop="description">
          <el-input
            v-model="dialogForm.description"
            type="textarea"
            :rows="2"
            placeholder="这个任务是做什么的（可选）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="执行类型" prop="execType">
          <el-radio-group v-model="dialogForm.execType" @change="onExecTypeChange">
            <el-radio-button value="CRON">CRON 表达式</el-radio-button>
            <el-radio-button value="FIXED_RATE">固定间隔</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="dialogForm.execType === 'CRON'" label="cron 表达式" prop="cronExpression">
          <el-input v-model="dialogForm.cronExpression" placeholder="秒 分 时 日 月 周，如 0 0 20 * * ?" />
          <div class="cron-presets">
            <el-tag
              v-for="p in CRON_PRESETS"
              :key="p.value"
              size="small"
              effect="plain"
              class="cron-preset"
              @click="dialogForm.cronExpression = p.value"
            >
              {{ p.label }}
            </el-tag>
          </div>
          <div class="form-hint">Spring cron 为 6 位（比 Linux crontab 多一位「秒」）；点上面的标签可快速填入</div>
        </el-form-item>

        <el-form-item v-else label="间隔时长" prop="fixedInterval">
          <el-input-number v-model="dialogForm.fixedInterval" :min="5" :max="2592000" :step="10" />
          <span class="unit-text">秒</span>
          <div class="form-hint">每隔多少秒执行一次（最小 5 秒，最大 30 天）</div>
        </el-form-item>

        <el-form-item label="执行类" prop="className">
          <el-select
            v-model="dialogForm.className"
            filterable
            allow-create
            default-first-option
            placeholder="选择内置任务，或直接输入全限定类名"
            style="width: 100%"
          >
            <el-option
              v-for="c in classOptions"
              :key="c.className"
              :label="c.label"
              :value="c.className"
            >
              <span class="class-option-label">{{ c.label }}</span>
              <span class="class-option-path">{{ c.className }}</span>
            </el-option>
          </el-select>
          <div class="form-hint">
            需实现 ScheduledJob / Runnable 或提供无参 execute()；示例：
            <code class="inline-code">com.zach.mytools.job.task.HeartbeatLogJob</code>
          </div>
        </el-form-item>

        <el-form-item label="任务状态">
          <el-switch
            v-model="dialogForm.status"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
            inline-prompt
          />
          <span class="form-hint" style="margin-left: 10px">保存后立即生效</span>
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="dialogForm.remark"
            type="textarea"
            :rows="2"
            placeholder="可选，任务备注信息"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="confirmDialog">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Timer, Plus, Edit, Delete, Refresh, Search, Document, VideoPlay
} from '@element-plus/icons-vue'
import AppSidebar from '../components/AppSidebar.vue'
import {
  getJobList, getJobClasses, createJob, updateJob,
  toggleJobStatus, runJobNow, deleteJob, getJobLogs, clearJobLogs
} from '../api/job'

// ==================== 常用 cron 预设 ====================
const CRON_PRESETS = [
  { label: '每天 02:00', value: '0 0 2 * * ?' },
  { label: '每天 20:00', value: '0 0 20 * * ?' },
  { label: '每 30 分钟', value: '0 0/30 * * * ?' },
  { label: '每 5 分钟', value: '0 0/5 * * * ?' },
  { label: '工作日 09:00', value: '0 0 9 * * MON-FRI' },
  { label: '每周一 08:30', value: '0 30 8 * * MON' },
  { label: '每月 1 号 00:00', value: '0 0 0 1 * ?' }
]

// ==================== 任务列表 ====================
const jobs = ref([])
const classOptions = ref([])
const loadingJobs = ref(false)
const enabledCount = computed(() => jobs.value.filter(j => j.status === 1).length)

async function loadJobs(silent = false) {
  if (!silent) loadingJobs.value = true
  try {
    const res = await getJobList()
    jobs.value = res.data || []
  } catch (err) {
    // 错误提示由请求拦截器统一处理
  } finally {
    loadingJobs.value = false
  }
}

async function loadClassOptions() {
  try {
    const res = await getJobClasses()
    classOptions.value = res.data || []
  } catch (err) {
    classOptions.value = []
  }
}

// ==================== 展示辅助 ====================
function ruleText(row) {
  if (row.execType === 'CRON') return row.cronExpression || '-'
  if (row.fixedInterval == null) return '-'
  const s = row.fixedInterval
  if (s % 3600 === 0) return `每 ${s / 3600} 小时`
  if (s % 60 === 0) return `每 ${s / 60} 分钟`
  return `每 ${s} 秒`
}

function fmtTime(v) {
  if (!v) return '-'
  return String(v).replace('T', ' ').slice(0, 19)
}

function fmtCost(ms) {
  if (ms == null) return '-'
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

function statusText(s) {
  return { SUCCESS: '成功', FAILED: '失败', SKIPPED: '跳过' }[s] || s || '-'
}

function statusTagType(s) {
  return { SUCCESS: 'success', FAILED: 'danger', SKIPPED: 'warning' }[s] || 'info'
}

function triggerText(t) {
  return { CRON: 'CRON', FIXED_RATE: '定时', MANUAL: '手动' }[t] || t || '-'
}

function triggerTagType(t) {
  return { CRON: 'primary', FIXED_RATE: 'success', MANUAL: 'warning' }[t] || 'info'
}

// ==================== 弹窗 ====================
const dialogVisible = ref(false)
const editingJob = ref(null)
const saving = ref(false)
const dialogFormRef = ref(null)

const dialogForm = reactive({
  jobName: '',
  description: '',
  execType: 'CRON',
  cronExpression: '',
  fixedInterval: 60,
  className: '',
  status: 0,
  remark: ''
})

const CLASS_NAME_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)+$/

const dialogRules = {
  jobName: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { max: 100, message: '任务名称不能超过 100 个字符', trigger: 'blur' }
  ],
  execType: [{ required: true, message: '请选择执行类型', trigger: 'change' }],
  cronExpression: [
    {
      validator: (rule, value, callback) => {
        if (dialogForm.execType !== 'CRON') return callback()
        if (!value || !value.trim()) return callback(new Error('请填写 cron 表达式'))
        const fields = value.trim().split(/\s+/)
        if (fields.length !== 6) {
          return callback(new Error('cron 表达式需要 6 段（秒 分 时 日 月 周），当前为 ' + fields.length + ' 段'))
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  fixedInterval: [
    {
      validator: (rule, value, callback) => {
        if (dialogForm.execType !== 'FIXED_RATE') return callback()
        if (value == null) return callback(new Error('请填写间隔秒数'))
        if (value < 5) return callback(new Error('间隔不能小于 5 秒'))
        callback()
      },
      trigger: 'change'
    }
  ],
  className: [
    { required: true, message: '请填写执行类的全限定名', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value || !value.trim()) return callback()
        if (!CLASS_NAME_RE.test(value.trim())) {
          return callback(new Error('请填写完整的全限定类名，如 com.zach.mytools.job.task.HeartbeatLogJob'))
        }
        callback()
      },
      trigger: 'blur'
    }
  ]
}

function onExecTypeChange() {
  dialogFormRef.value?.clearValidate(['cronExpression', 'fixedInterval'])
}

function openAddDialog() {
  editingJob.value = null
  dialogForm.jobName = ''
  dialogForm.description = ''
  dialogForm.execType = 'CRON'
  dialogForm.cronExpression = '0 0 20 * * ?'
  dialogForm.fixedInterval = 60
  dialogForm.className = ''
  dialogForm.status = 0
  dialogForm.remark = ''
  dialogVisible.value = true
}

function openEditDialog(row) {
  editingJob.value = row
  dialogForm.jobName = row.jobName
  dialogForm.description = row.description || ''
  dialogForm.execType = row.execType || 'CRON'
  dialogForm.cronExpression = row.cronExpression || ''
  dialogForm.fixedInterval = row.fixedInterval == null ? 60 : row.fixedInterval
  dialogForm.className = row.className || ''
  dialogForm.status = row.status === 1 ? 1 : 0
  dialogForm.remark = row.remark || ''
  dialogVisible.value = true
}

function resetDialog() {
  editingJob.value = null
  dialogFormRef.value?.resetFields()
}

async function confirmDialog() {
  if (!dialogFormRef.value) return
  try {
    await dialogFormRef.value.validate()
  } catch {
    return
  }
  saving.value = true
  try {
    const payload = {
      jobName: dialogForm.jobName.trim(),
      description: dialogForm.description?.trim() || null,
      execType: dialogForm.execType,
      cronExpression: dialogForm.execType === 'CRON' ? dialogForm.cronExpression.trim() : null,
      fixedInterval: dialogForm.execType === 'FIXED_RATE' ? dialogForm.fixedInterval : null,
      className: dialogForm.className.trim(),
      status: dialogForm.status,
      remark: dialogForm.remark?.trim() || null
    }
    if (editingJob.value) {
      const res = await updateJob(editingJob.value.id, payload)
      ElMessage.success(res.message || '任务更新成功')
    } else {
      const res = await createJob(payload)
      ElMessage.success(res.message || '任务创建成功')
    }
    dialogVisible.value = false
    await loadJobs()
    if (logQuery.jobId) await loadLogs()
  } catch (err) {
    // 错误提示由请求拦截器统一处理
  } finally {
    saving.value = false
  }
}

// ==================== 任务操作 ====================
async function handleToggleStatus(row) {
  try {
    const res = await toggleJobStatus(row.id)
    ElMessage.success(res.message || '操作成功')
    await loadJobs()
  } catch (err) {
    // 错误提示由请求拦截器统一处理
    await loadJobs()
  }
}

async function handleRunOnce(row) {
  try {
    const res = await runJobNow(row.id)
    ElMessage.success(res.message || '已触发执行')
    // 任务在后台异步执行，稍等片刻再刷新日志，让结果露出来
    setTimeout(async () => {
      await loadJobs(true)
      await loadLogs()
    }, 1500)
  } catch (err) {
    // 错误提示由请求拦截器统一处理
  }
}

function handleDelete(row) {
  ElMessageBox.confirm(
    `确定要删除任务「${row.jobName}」吗？\n\n删除后调度会立即停止（执行日志会保留，便于追溯）。`,
    '删除确认',
    { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      await deleteJob(row.id)
      ElMessage.success('任务已删除')
      if (logQuery.jobId === row.id) logQuery.jobId = null
      await loadJobs()
      await loadLogs()
    } catch (err) {
      // 错误提示由请求拦截器统一处理
    }
  }).catch(() => {})
}

// ==================== 执行日志 ====================
const logCardRef = ref(null)
const logs = ref([])
const logTotal = ref(0)
const loadingLogs = ref(false)

const logQuery = reactive({
  page: 1,
  size: 10,
  jobId: null,
  status: null,
  dateRange: null
})

async function loadLogs() {
  loadingLogs.value = true
  try {
    const params = {
      page: logQuery.page,
      size: logQuery.size
    }
    if (logQuery.jobId) params.jobId = logQuery.jobId
    if (logQuery.status) params.status = logQuery.status
    if (logQuery.dateRange && logQuery.dateRange.length === 2) {
      params.startDate = logQuery.dateRange[0]
      params.endDate = logQuery.dateRange[1]
    }
    const res = await getJobLogs(params)
    const data = res.data || {}
    logs.value = data.records || []
    logTotal.value = data.total || 0
  } catch (err) {
    logs.value = []
    logTotal.value = 0
  } finally {
    loadingLogs.value = false
  }
}

function searchLogs() {
  logQuery.page = 1
  loadLogs()
}

function resetLogQuery() {
  logQuery.jobId = null
  logQuery.status = null
  logQuery.dateRange = null
  logQuery.page = 1
  loadLogs()
}

function showJobLogs(row) {
  logQuery.jobId = row.id
  logQuery.page = 1
  loadLogs()
  logCardRef.value?.$el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function handleClearLogs() {
  const scope = logQuery.jobId
    ? `任务「${jobs.value.find(j => j.id === logQuery.jobId)?.jobName || logQuery.jobId}」的`
    : '全部'
  ElMessageBox.confirm(
    `确定要清空${scope}执行日志吗？\n\n日志清空后无法恢复（不影响任务本身的调度）。`,
    '清理确认',
    { confirmButtonText: '确定清空', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      const res = await clearJobLogs(logQuery.jobId || null)
      ElMessage.success(res.message || '已清理')
      logQuery.page = 1
      await loadLogs()
    } catch (err) {
      // 错误提示由请求拦截器统一处理
    }
  }).catch(() => {})
}

// ==================== 生命周期 ====================
let timer = null

onMounted(async () => {
  await loadJobs()
  await Promise.all([loadClassOptions(), loadLogs()])
  // 静默刷新，让「下次执行时间 / 运行中」保持新鲜
  timer = setInterval(() => loadJobs(true), 20000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
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
  background: var(--bg-card, #fff);
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

.job-card {
  border-radius: 6px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #333);
}

.auto-tip {
  margin-left: auto;
  font-size: 12px;
  font-weight: 400;
  color: var(--text-muted, #9ca3af);
}

.log-header {
  flex-wrap: wrap;
}

.log-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  flex-wrap: wrap;
}

/* 任务名称列 */
.job-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.job-name {
  font-weight: 600;
  color: var(--text-primary, #333);
}

.job-desc {
  font-size: 12px;
  color: var(--text-muted, #9ca3af);
  margin-top: 2px;
}

/* 代码样式 */
.code-inline {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  background: var(--bg-hover, #f0f0f5);
  padding: 2px 8px;
  border-radius: 4px;
  color: #6366f1;
  margin-left: 6px;
}

.next-run {
  font-size: 13px;
  color: var(--text-secondary, #666);
}

.muted {
  color: var(--text-muted, #9ca3af);
  font-size: 13px;
}

/* 日志展开区 */
.log-detail {
  padding: 8px 16px 4px 48px;
}

.log-detail-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary, #666);
  margin-bottom: 6px;
}

.log-error {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.07);
  border-left: 3px solid #ef4444;
  border-radius: 4px;
  padding: 10px 12px;
  margin: 0;
  max-height: 260px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.pager-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* 表单 */
.form-hint {
  font-size: 12px;
  color: var(--text-muted, #9ca3af);
  margin-top: 4px;
  line-height: 1.6;
}

.unit-text {
  margin-left: 8px;
  font-size: 13px;
  color: var(--text-secondary, #666);
}

.cron-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.cron-preset {
  cursor: pointer;
  transition: all 0.15s ease;
}

.cron-preset:hover {
  background: #6366f1;
  border-color: #6366f1;
  color: #fff;
}

.class-option-label {
  float: left;
}

.class-option-path {
  float: right;
  font-size: 12px;
  color: var(--text-muted, #9ca3af);
}

.inline-code {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  background: var(--bg-hover, #f0f0f5);
  padding: 1px 6px;
  border-radius: 3px;
  color: #6366f1;
}

/* 使用说明 */
.job-guide {
  padding: 8px 0 40px;
}

.job-guide h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #333);
  margin-bottom: 12px;
}

.job-guide ul {
  list-style: none;
  padding: 0;
}

.job-guide li {
  font-size: 13px;
  color: var(--text-secondary, #666);
  line-height: 2;
  padding-left: 16px;
  position: relative;
}

.job-guide li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6366f1;
}

.job-guide code {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  background: var(--bg-hover, #f0f0f5);
  padding: 1px 6px;
  border-radius: 3px;
  color: #6366f1;
}
</style>
