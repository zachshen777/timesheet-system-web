<template>
  <div class="page-wrapper">
    <!-- ==================== 顶部导航 ==================== -->
    <header class="top-bar">
      <div class="top-bar-left">
        <div class="logo-mark">
          <el-icon :size="20"><OfficeBuilding /></el-icon>
        </div>
        <span class="top-title">部门管理</span>
      </div>
      <div class="top-bar-center"></div>
      <div class="top-bar-right">
        <el-button type="primary" size="small" @click="openAddDialog">
          <el-icon><Plus /></el-icon> 新增部门
        </el-button>
      </div>
    </header>

    <!-- ==================== 主体布局 ==================== -->
    <div class="main-layout">
      <AppSidebar />

      <div class="content-area">
        <el-card shadow="hover" class="dept-card">
          <template #header>
            <div class="card-header">
              <el-icon :size="20" color="#6366f1"><List /></el-icon>
              <span>部门列表</span>
              <el-tag size="small" type="info" effect="plain" style="margin-left: 8px">
                共 {{ tableData.length }} 个部门
              </el-tag>
            </div>
          </template>

          <el-table
            :data="tableData"
            stripe
            border
            style="width: 100%"
            empty-text="暂无部门数据，请点击右上角「新增部门」添加"
          >
            <el-table-column label="序号" width="80" align="center">
              <template #default="{ $index }">{{ $index + 1 }}</template>
            </el-table-column>
            <el-table-column prop="dictValue" label="部门编码" min-width="140">
              <template #default="{ row }">
                <code class="dept-code">{{ row.dictValue }}</code>
              </template>
            </el-table-column>
            <el-table-column prop="dictLabel" label="部门名称" min-width="140" />
            <el-table-column prop="sort" label="排序" width="80" align="center" />
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
            <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
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

        <!-- 使用说明 -->
        <div class="dept-guide">
          <h3>使用说明</h3>
          <ul>
            <li><strong>部门编码</strong>：创建后不可修改，采用英文小写+下划线命名（如 <code>r_and_d</code>），业务数据通过该编码关联部门。</li>
            <li><strong>部门名称</strong>：可随时编辑，建议与公司组织架构保持一致。</li>
            <li><strong>禁用</strong>：禁用后该部门不在员工管理、填报等下拉框中出现，但历史数据关联不受影响。</li>
            <li><strong>删除</strong>：删除前会校验是否有在职员工关联，存在关联则禁止删除。</li>
            <li><strong>排序</strong>：数值越小越靠前，控制下拉框展示顺序。</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingItem ? '编辑部门' : '新增部门'"
      width="480px"
      destroy-on-close
      @closed="resetDialog"
    >
      <el-form
        ref="dialogFormRef"
        :model="dialogForm"
        :rules="dialogRules"
        label-width="80px"
      >
        <el-form-item v-if="!editingItem" label="部门编码" prop="dictValue">
          <el-input
            v-model="dialogForm.dictValue"
            placeholder="英文小写+下划线，如 r_and_d"
            :disabled="!!editingItem"
          />
          <div v-if="!editingItem" class="form-hint">创建后不可修改，请谨慎填写</div>
        </el-form-item>
        <el-form-item v-if="editingItem" label="部门编码">
          <code class="dept-code">{{ editingItem.dictValue }}</code>
          <div class="form-hint">编码创建后不可修改</div>
        </el-form-item>
        <el-form-item label="部门名称" prop="dictLabel">
          <el-input v-model="dialogForm.dictLabel" placeholder="如 技术部、市场部" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="dialogForm.sort" :min="0" :max="9999" placeholder="数值越小越靠前" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="dialogForm.remark"
            type="textarea"
            :rows="2"
            placeholder="可选，部门备注信息"
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  OfficeBuilding, Plus, Edit, Delete, List
} from '@element-plus/icons-vue'
import AppSidebar from '../components/AppSidebar.vue'
import { getDeptList, createDept, updateDept, toggleDeptStatus, deleteDept } from '../api/dept'

const tableData = ref([])
const dialogVisible = ref(false)
const editingItem = ref(null)
const saving = ref(false)
const dialogFormRef = ref(null)

const dialogForm = reactive({
  dictValue: '',
  dictLabel: '',
  sort: 0,
  remark: ''
})

const dialogRules = {
  dictValue: [
    { required: true, message: '请输入部门编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '仅允许英文字母、数字和下划线', trigger: 'blur' },
    { min: 2, max: 30, message: '编码长度为 2-30 个字符', trigger: 'blur' }
  ],
  dictLabel: [
    { required: true, message: '请输入部门名称', trigger: 'blur' },
    { min: 1, max: 20, message: '名称长度为 1-20 个字符', trigger: 'blur' }
  ]
}

async function loadData() {
  try {
    const res = await getDeptList()
    tableData.value = res.data || res || []
  } catch (err) {
    console.error('加载部门列表失败:', err)
  }
}

function openAddDialog() {
  editingItem.value = null
  dialogForm.dictValue = ''
  dialogForm.dictLabel = ''
  dialogForm.sort = 0
  dialogForm.remark = ''
  dialogVisible.value = true
}

function openEditDialog(row) {
  editingItem.value = row
  dialogForm.dictValue = row.dictValue
  dialogForm.dictLabel = row.dictLabel
  dialogForm.sort = row.sort
  dialogForm.remark = row.remark || ''
  dialogVisible.value = true
}

function resetDialog() {
  editingItem.value = null
  dialogFormRef.value?.resetFields()
}

async function confirmDialog() {
  if (!dialogFormRef.value) return
  await dialogFormRef.value.validate()
  saving.value = true
  try {
    const payload = {
      dictLabel: dialogForm.dictLabel.trim(),
      sort: dialogForm.sort,
      remark: dialogForm.remark?.trim() || null
    }
    if (editingItem.value) {
      await updateDept(editingItem.value.id, payload)
      ElMessage.success('部门更新成功')
    } else {
      payload.dictValue = dialogForm.dictValue.trim().toLowerCase()
      await createDept(payload)
      ElMessage.success('部门创建成功')
    }
    dialogVisible.value = false
    await loadData()
  } catch (err) {
    // error handled by request interceptor
  } finally {
    saving.value = false
  }
}

async function handleToggleStatus(row) {
  try {
    const res = await toggleDeptStatus(row.id)
    // backend returns updated item; refresh list
    await loadData()
    ElMessage.success(res.message || '操作成功')
  } catch (err) {
    // error handled by interceptor
  }
}

function handleDelete(row) {
  ElMessageBox.confirm(
    `确定要删除部门「${row.dictLabel}(${row.dictValue})」吗？\n\n删除前会自动校验是否存在关联数据，有关联则禁止删除。`,
    '删除确认',
    { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      await deleteDept(row.id)
      ElMessage.success('部门已删除')
      await loadData()
    } catch (err) {
      // error handled by interceptor (409/400 will show message)
    }
  }).catch(() => {})
}

onMounted(() => {
  loadData()
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

.dept-card {
  border-radius: 6px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.dept-code {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  background: #f0f0f5;
  padding: 2px 8px;
  border-radius: 4px;
  color: #6366f1;
}

.form-hint {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.dept-guide {
  padding: 8px 0;
}

.dept-guide h3 {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.dept-guide ul {
  list-style: none;
  padding: 0;
}

.dept-guide li {
  font-size: 13px;
  color: #666;
  line-height: 2;
  padding-left: 16px;
  position: relative;
}

.dept-guide li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6366f1;
}

.dept-guide code {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  background: #f0f0f5;
  padding: 1px 6px;
  border-radius: 3px;
  color: #6366f1;
}
</style>
