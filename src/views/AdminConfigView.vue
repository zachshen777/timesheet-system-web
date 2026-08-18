<template>
  <div class="page-wrapper">
    <!-- ==================== 顶部导航 ==================== -->
    <header class="top-bar">
      <div class="top-bar-left">
        <div class="logo-mark">
          <el-icon :size="20"><Setting /></el-icon>
        </div>
        <span class="top-title">系统配置</span>
      </div>
      <div class="top-bar-center"></div>
      <div class="top-bar-right">
        <el-button size="small" @click="loadAll">
          <el-icon><Refresh /></el-icon> 重置
        </el-button>
        <el-button type="primary" size="small" :loading="saving" @click="handleSave">
          <el-icon><Check /></el-icon> 保存配置
        </el-button>
      </div>
    </header>

    <!-- ==================== 主体布局 ==================== -->
    <div class="main-layout">
      <AppSidebar />

      <div class="content-area">
        <!-- 双栏卡片布局 -->
        <div class="cards-grid">
          <!-- 法定节假日配置 -->
          <el-card shadow="hover" class="config-card">
            <template #header>
              <div class="card-header">
                <el-icon :size="20" color="#f59e0b"><Sunny /></el-icon>
                <span>法定节假日配置</span>
                <el-tag size="small" type="warning" effect="plain">休息日 · 带薪假日</el-tag>
              </div>
            </template>

            <div class="holiday-toolbar">
              <el-button type="warning" @click="openAddDialog('holiday')">
                <el-icon><Plus /></el-icon> 添加节假日
              </el-button>
              <span class="holiday-count">共 {{ holidayList.length }} 个节假日</span>
            </div>

            <el-table
              :data="holidayList"
              stripe
              border
              style="width: 100%"
              empty-text="暂未配置节假日"
            >
              <el-table-column prop="name" label="名称" min-width="120">
                <template #default="{ row }">
                  <span class="item-name-tag holiday-name">{{ row.name }}</span>
                </template>
              </el-table-column>
              <el-table-column label="类型" width="110" align="center">
                <template #default>
                  <el-tag size="small" type="warning" effect="dark">节假日</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="startDate" label="开始日期" width="130" />
              <el-table-column prop="endDate" label="结束日期" width="130" />
              <el-table-column label="天数" width="80" align="center">
                <template #default="{ row }">
                  <el-tag size="small" type="warning">{{ row.days }} 天</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="160" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="openEditDialog(row)">
                    <el-icon><Edit /></el-icon> 编辑
                  </el-button>
                  <el-button link type="danger" size="small" @click="handleDelete(row)">
                    <el-icon><Delete /></el-icon> 删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <!-- 调班日配置 -->
          <el-card shadow="hover" class="config-card shift-card">
            <template #header>
              <div class="card-header">
                <el-icon :size="20" color="#6366f1"><Switch /></el-icon>
                <span>调班日配置</span>
                <el-tag size="small" type="primary" effect="plain">工作日 · 补班</el-tag>
              </div>
            </template>

            <div class="holiday-toolbar">
              <el-button type="primary" @click="openAddDialog('shift')">
                <el-icon><Plus /></el-icon> 添加调班日
              </el-button>
              <span class="holiday-count">共 {{ shiftList.length }} 个调班日</span>
            </div>

            <el-table
              :data="shiftList"
              stripe
              border
              style="width: 100%"
              empty-text="暂未配置调班日"
            >
              <el-table-column prop="name" label="名称" min-width="140">
                <template #default="{ row }">
                  <span class="item-name-tag shift-name">{{ row.name }}</span>
                </template>
              </el-table-column>
              <el-table-column label="类型" width="110" align="center">
                <template #default>
                  <el-tag size="small" type="primary" effect="dark">调班日</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="startDate" label="开始日期" width="130" />
              <el-table-column prop="endDate" label="结束日期" width="130" />
              <el-table-column label="天数" width="80" align="center">
                <template #default="{ row }">
                  <el-tag size="small" type="primary">{{ row.days }} 天</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="160" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="openEditDialog(row)">
                    <el-icon><Edit /></el-icon> 编辑
                  </el-button>
                  <el-button link type="danger" size="small" @click="handleDelete(row)">
                    <el-icon><Delete /></el-icon> 删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>

        <!-- 配置说明 -->
        <div class="config-info">
          <h3>配置说明</h3>
          <ul>
            <li><strong>法定节假日</strong>：设为休息日，日历以<span class="info-badge holiday">金色</span>底色显示「<strong>休</strong>」角标；不占用标准出勤统计，不产生待填报提醒。</li>
            <li><strong>调班日</strong>：原本周末需<strong>补班上班</strong>，日历以<span class="info-badge shift">紫色</span>底色显示「<strong>班</strong>」角标；视为工作日，计入出勤统计。</li>
            <li><strong>优先级规则</strong>：调班日 > 法定节假日 > 默认周末规则。例如五一调班（周日上班）配置后，该周日判定为工作日而非休息日。</li>
            <li>修改后点击「保存配置」立即生效，所有用户刷新页面后即可看到最新配置。</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 添加/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingItem ? '编辑' : '添加' + (dialogType === 'holiday' ? '节假日' : '调班日')"
      width="480px"
      destroy-on-close
    >
      <el-form
        ref="dialogFormRef"
        :model="dialogForm"
        :rules="dialogRules"
        label-width="80px"
      >
        <el-form-item label="类型">
          <el-tag v-if="dialogType === 'holiday'" type="warning" effect="dark">法定节假日</el-tag>
          <el-tag v-else type="primary" effect="dark">调班日</el-tag>
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="dialogForm.name" :placeholder="dialogType === 'holiday' ? '例如：春节、国庆节' : '例如：五一调班、国庆补班'" />
        </el-form-item>
        <el-form-item label="日期范围" prop="dateRange">
          <el-date-picker
            v-model="dialogForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item v-if="dialogForm.dateRange?.length === 2">
          <span class="form-tip">
            共 <strong>{{ computeDays(dialogForm.dateRange[0], dialogForm.dateRange[1]) }}</strong> 天
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmDialog">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Setting, Plus, Edit, Delete, Sunny, Switch, Refresh, Check
} from '@element-plus/icons-vue'
import AppSidebar from '../components/AppSidebar.vue'
import { getHolidays, saveHolidays } from '../api/config'

const saving = ref(false)

const allItems = ref([])
const holidayList = computed(() => allItems.value.filter(h => h.type === 'holiday'))
const shiftList = computed(() => allItems.value.filter(h => h.type === 'shift'))

const dialogVisible = ref(false)
const dialogType = ref('holiday')
const editingItem = ref(null)
const dialogFormRef = ref(null)
const dialogForm = reactive({
  name: '',
  dateRange: []
})
const dialogRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  dateRange: [{ required: true, message: '请选择日期范围', trigger: 'change' }]
}

function computeDays(start, end) {
  if (!start || !end) return 0
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1
}

async function loadAll() {
  try {
    const res = await getHolidays()
    const list = (res || []).map(h => ({
      ...h,
      type: h.type || 'holiday',
      days: computeDays(h.startDate, h.endDate)
    }))
    list.sort((a, b) => a.startDate.localeCompare(b.startDate))
    allItems.value = list
  } catch (err) {
    console.error('加载���置失败:', err)
  }
}

function openAddDialog(type) {
  dialogType.value = type
  editingItem.value = null
  dialogForm.name = ''
  dialogForm.dateRange = []
  dialogVisible.value = true
}

function openEditDialog(row) {
  dialogType.value = row.type
  editingItem.value = row
  dialogForm.name = row.name
  dialogForm.dateRange = [row.startDate, row.endDate]
  dialogVisible.value = true
}

function confirmDialog() {
  if (!dialogFormRef.value) return
  dialogFormRef.value.validate(valid => {
    if (!valid) return
    if (!dialogForm.dateRange || dialogForm.dateRange.length !== 2) {
      ElMessage.warning('请选择日期范围')
      return
    }
    const item = {
      name: dialogForm.name.trim(),
      type: dialogType.value,
      startDate: dialogForm.dateRange[0],
      endDate: dialogForm.dateRange[1],
      days: computeDays(dialogForm.dateRange[0], dialogForm.dateRange[1])
    }
    if (editingItem.value) {
      const idx = allItems.value.indexOf(editingItem.value)
      if (idx >= 0) allItems.value.splice(idx, 1, item)
    } else {
      allItems.value.push(item)
    }
    allItems.value.sort((a, b) => a.startDate.localeCompare(b.startDate))
    dialogVisible.value = false
    ElMessage.success(editingItem.value ? '编辑成功，请点击保存生效' : '添加成功，请点击保存生效')
  })
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除「${row.name}」吗？`, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const idx = allItems.value.indexOf(row)
    if (idx >= 0) allItems.value.splice(idx, 1)
    ElMessage.success(`已删除「${row.name}」，请点击保存生效`)
  }).catch(() => {})
}

async function handleSave() {
  saving.value = true
  try {
    const payload = allItems.value.map(({ name, type, startDate, endDate }) => ({
      name, type, startDate, endDate
    }))
    await saveHolidays(payload)
    ElMessage.success('配置保存成功！')
  } catch (err) {
    console.error('保存失败:', err)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadAll()
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

/* 双栏卡片网格 */
.cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
  margin-bottom: 20px;
}

/* 宽屏时两个卡片等高 */
@media (min-width: 1400px) {
  .cards-grid {
    grid-template-columns: 1fr 1fr;
  }
}

/* 窄屏时回退为上下布局 */
@media (max-width: 1100px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }
}

.config-card {
  border-radius: 6px;
}

.shift-card {
  border-left: 3px solid #6366f1;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.holiday-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.holiday-count {
  font-size: 13px;
  color: var(--text-muted, #9ca3af);
}

.item-name-tag {
  font-weight: 600;
}
.item-name-tag.holiday-name { color: #b45309; }
.item-name-tag.shift-name { color: #4338ca; }

.form-tip {
  font-size: 13px;
  color: var(--text-secondary, #6b7280);
}
.form-tip strong {
  color: #6366f1;
  font-size: 16px;
}

.config-info {
  padding: 8px 0;
}

.config-info h3 {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.config-info ul {
  list-style: none;
  padding: 0;
}

.config-info li {
  font-size: 13px;
  color: var(--text-secondary, #666);
  line-height: 2;
  padding-left: 16px;
  position: relative;
}

.config-info li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6366f1;
}

.info-badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 600;
}
.info-badge.holiday {
  background: linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%);
  color: #b45309;
}
.info-badge.shift {
  background: linear-gradient(90deg, #eef2ff 0%, #f5f3ff 100%);
  color: #4338ca;
}
</style>
