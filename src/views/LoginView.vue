<template>
  <div class="login-container">
    <!-- 背景视频（氛围装饰，不抢表单焦点） -->
    <video
      ref="videoRef"
      class="login-video"
      loop
      playsinline
      preload="auto"
      @canplay="tryPlay"
    >
      <source src="/login-bg.webm" type="video/webm" />
    </video>
    <!-- 半透明遮罩，压暗视频、增强卡片对比 -->
    <div class="login-overlay"></div>

    <div class="login-card">
      <div class="login-header">
        <div class="logo-circle">
          <el-icon :size="26" color="#fff"><Clock /></el-icon>
        </div>
        <h1>工时填报系统牛马专用</h1>
        <p class="login-subtitle">TIMESHEET SYSTEM</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            size="large"
            placeholder="请输入用户名"
            :prefix-icon="User"
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            size="large"
            placeholder="请输入精神内耗密码"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            打工上岗
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <span class="version">本系统仅供搬砖记录，不保证准时下班</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Clock } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)
const videoRef = ref(null)

// 显式设置 muted 并尝试播放（解决浏览器自动播放策略阻止问题）
function tryPlay() {
  const v = videoRef.value
  if (!v) return
  v.muted = true
  v.play().catch(() => {
    // 自动播放被阻止，注册一次性交互监听，用户点击页面任意位置后播放
    const resume = () => {
      v.muted = true
      v.play().catch(() => {})
      document.removeEventListener('click', resume)
      document.removeEventListener('touchstart', resume)
      document.removeEventListener('keydown', resume)
    }
    document.addEventListener('click', resume, { once: true })
    document.addEventListener('touchstart', resume, { once: true })
    document.addEventListener('keydown', resume, { once: true })
  })
}

onMounted(() => {
  tryPlay()
})

onUnmounted(() => {
  const v = videoRef.value
  if (v) v.pause()
})

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入精神内耗密码', trigger: 'blur' }]
}

async function handleLogin() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      await userStore.login(form.username, form.password)
      sessionStorage.setItem('isLogin', 'true')
      sessionStorage.setItem('role', userStore.userInfo?.role || 'EMPLOYEE')
      ElMessage.success('登录成功')
      router.push('/attendance')
    } catch (err) {
      // 登录失败：自定义提示（拦截器已跳过自动提示）
      ElMessage.error('🚫上岗失败，工号 / 密码不对，禁止上岗搬砖')
      console.error('登录失败:', err)
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-container {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  /* 兜底蓝紫色渐变，防止视频/图片未加载时白屏 */
  background: linear-gradient(135deg, #4f63e8 0%, #7a5ce6 100%);
  padding: 20px;
}

/* 背景视频：铺满容器，作为氛围装饰 */
.login-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}

/* 遮罩层：柔和的深色渐变，压暗背景、突出表单卡片 */
.login-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(25, 30, 55, 0.42) 0%,
    rgba(35, 40, 75, 0.3) 50%,
    rgba(45, 35, 70, 0.35) 100%
  );
  z-index: 1;
}

/* 毛玻璃拟态卡片：半透明白兜底 + backdrop blur + 柔和阴影 */
.login-card {
  position: relative;
  z-index: 2;
  width: 420px;
  max-width: 100%;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(24px) saturate(1.5);
  -webkit-backdrop-filter: blur(24px) saturate(1.5);
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 8px;
  box-shadow:
    0 8px 32px rgba(25, 30, 55, 0.18),
    0 2px 8px rgba(25, 30, 55, 0.08);
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-circle {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6a78e8 0%, #8f6ee8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 6px 16px rgba(106, 120, 232, 0.35);
}

/* 页面标题突出，英文副标题弱化 */
.login-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 6px;
  letter-spacing: 1px;
}

.login-subtitle {
  font-size: 11px;
  color: rgba(107, 114, 128, 0.55);
  letter-spacing: 4px;
  text-transform: uppercase;
  margin: 0;
}

.login-form {
  margin-top: 8px;
}

/* 输入框：浅色背景、柔和描边 */
.login-form :deep(.el-input__wrapper) {
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 0 0 1px rgba(31, 41, 55, 0.1) inset;
  transition: box-shadow 0.2s ease;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px rgba(106, 120, 232, 0.7) inset;
}

.login-form :deep(.el-input__inner) {
  color: #1f2937;
}

.login-form :deep(.el-input__inner::placeholder) {
  color: #9ca3af;
}

/* 错误提示：柔和的低饱和红色，位于输入框下方 */
.login-form :deep(.el-form-item__error) {
  color: rgba(214, 69, 89, 0.85);
  font-size: 12px;
  padding-top: 4px;
}

.login-form :deep(.el-form-item.is-error .el-input__wrapper) {
  box-shadow: 0 0 0 1px rgba(214, 69, 89, 0.55) inset;
}

/* 登录按钮：降低渐变饱和度，克制的品牌色 */
.login-btn {
  width: 100%;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 2px;
  height: 44px;
  background: linear-gradient(135deg, #6677e8 0%, #8a6ee6 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(102, 119, 232, 0.28);
}

.login-btn:hover {
  background: linear-gradient(135deg, #5d6de0 0%, #8165de 100%);
  opacity: 1;
}

.login-btn:active {
  transform: translateY(1px);
}

/* 右下角淡灰色版本号 */
.login-footer {
  margin-top: 28px;
  text-align: center;
}

.version {
  font-size: 11px;
  color: rgba(107, 114, 128, 0.5);
  letter-spacing: 0.5px;
}
</style>
