<template>
  <div class="login-container" :class="{ 'is-formal': isFormal }">
    <!-- 背景视频（氛围装饰，不抢表单焦点）：仅轻松版显示 -->
    <template v-if="!isFormal">
      <video
        ref="videoRef"
        class="login-video"
        loop
        playsinline
        preload="auto"
        :key="currentBg.src"
        @canplay="tryPlay"
      >
        <source :src="currentBg.src" type="video/webm" />
      </video>
      <!-- 半透明遮罩，压暗视频、增强卡片对比 -->
      <div class="login-overlay"></div>
    </template>

    <div class="login-card" :class="{ 'is-formal': isFormal }">
      <div class="login-header">
        <div class="logo-circle">
          <el-icon :size="26" color="#fff"><Clock /></el-icon>
        </div>
        <h1>{{ cardTitle }}</h1>
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
            :placeholder="passwordPlaceholder"
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
            {{ submitText }}
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 账号提示：姓名拼音 + 默认密码 -->
      <div class="login-tip">
        <el-icon class="tip-icon"><InfoFilled /></el-icon>
        <span>
          账号提示：用户名为<b>姓名拼音</b>（如 zhangsan），密码默认
          <b>123456</b>
        </span>
      </div>

      <div class="login-footer">
        <span class="version">{{ footerText }}</span>
      </div>
    </div>

    <!-- 皮肤切换（右上角浮动）：轻松版 / 正式版 -->
    <div class="mode-switch" :class="{ 'is-formal': isFormal }">
      <span class="mode-switch-label">皮肤</span>
      <button
        v-for="m in modes"
        :key="m.value"
        type="button"
        class="mode-btn"
        :class="{ active: mode === m.value }"
        @click="setMode(m.value)"
      >
        {{ m.label }}
      </button>
    </div>

    <!-- 背景选择器（左下角浮动）：仅轻松版显示 -->
    <div v-if="!isFormal" class="bg-selector">
      <span class="bg-selector-label">背景</span>
      <div
        v-for="bg in backgrounds"
        :key="bg.src"
        class="bg-thumb"
        :class="{ active: currentBg.src === bg.src }"
        @click="switchBg(bg)"
      >
        <video :src="bg.src" muted preload="metadata" class="bg-thumb-video"></video>
        <span class="bg-thumb-name">{{ bg.name }}</span>
      </div>
    </div>

    <!-- 弹跳 GIF：仅轻松版 + 选择"鸡你太美"背景时显示 -->
    <BouncingGif v-if="showGif" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Clock, InfoFilled } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'
import BouncingGif from '../components/BouncingGif.vue'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)
const videoRef = ref(null)

// ===== 皮肤模式：formal（正式版，默认）/ fun（轻松版） =====
const MODE_KEY = 'ts-login-mode'
const modes = [
  { value: 'formal', label: '正式版' },
  { value: 'fun', label: '轻松版' }
]
const mode = ref(localStorage.getItem(MODE_KEY) === 'fun' ? 'fun' : 'formal')
const isFormal = computed(() => mode.value === 'formal')

const cardTitle = computed(() =>
  isFormal.value ? '工时填报系统' : '工时填报系统牛马专用'
)
const passwordPlaceholder = computed(() =>
  isFormal.value ? '请输入密码' : '请输入精神内耗密码'
)
const submitText = computed(() => (isFormal.value ? '登 录' : '打工上岗'))
const footerText = computed(() =>
  isFormal.value ? '工时填报系统' : '本系统仅供搬砖记录，不保证准时下班'
)

function setMode(m) {
  if (mode.value === m) return
  mode.value = m
  localStorage.setItem(MODE_KEY, m)
  // 从正式版切回轻松版：视频元素重新挂载，等 DOM 就绪后拉起播放
  if (m === 'fun') nextTick(() => tryPlay())
}

// ===== 可选动态背景列表（仅轻松版使用） =====
const backgrounds = [
  { name: '鸡你太美', src: '/heizi.webm' },
  { name: 'Spring', src: '/login-bg.webm' },
  { name: '2024冬季', src: '/winter.webm' },
  { name: '2024冬季2', src: '/winter2.webm' },
  { name: '少女', src: '/login-bg2.webm' },
]

const BG_KEY = 'ts-login-bg'

const savedSrc = localStorage.getItem(BG_KEY)
const currentBg = ref(
  backgrounds.find(b => b.src === savedSrc) || backgrounds[0]
)

// 弹跳 GIF 仅在选择"鸡你太美"背景时显示（正式版不显示）
const showGif = computed(() => !isFormal.value && currentBg.value.name === '鸡你太美')

function switchBg(bg) {
  if (currentBg.value.src === bg.src) return
  currentBg.value = bg
  localStorage.setItem(BG_KEY, bg.src)
  // :key 变化后 video 重新挂载，canplay 事件会自动触发 tryPlay
}

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

const rules = computed(() => ({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    {
      required: true,
      message: isFormal.value ? '请输入密码' : '请输入精神内耗密码',
      trigger: 'blur'
    }
  ]
}))

async function handleLogin() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      await userStore.login(form.username, form.password)
      ElMessage.success('登录成功')
      router.push('/attendance')
    } catch (err) {
      // 登录失败：自定义提示（拦截器已跳过自动提示）
      ElMessage.error(
        isFormal.value ? '用户名或密码错误，请重新输入' : '🚫上岗失败，工号 / 密码不对，禁止上岗搬砖'
      )
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
  transition: background 0.4s ease;
}

/* 正式版：干净的浅色底，去掉一切动态背景 */
.login-container.is-formal {
  background:
    radial-gradient(circle at 18% 18%, rgba(148, 168, 242, 0.22) 0%, transparent 55%),
    radial-gradient(circle at 82% 84%, rgba(170, 156, 236, 0.16) 0%, transparent 55%),
    linear-gradient(160deg, #f8fafc 0%, #eef1f7 100%);
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
  transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

/* 正式版：实心白卡 + 收敛的阴影，去掉毛玻璃 */
.login-card.is-formal {
  background: #ffffff;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border: 1px solid rgba(31, 41, 55, 0.08);
  border-radius: 12px;
  box-shadow:
    0 10px 30px rgba(31, 41, 55, 0.08),
    0 2px 8px rgba(31, 41, 55, 0.04);
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

/* 账号提示条：浅蓝底、虚线描边，低调不抢表单焦点 */
.login-tip {
  margin-top: 16px;
  padding: 10px 14px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: rgba(106, 120, 232, 0.08);
  border: 1px dashed rgba(106, 120, 232, 0.35);
  border-radius: 8px;
  font-size: 12px;
  color: #5b6472;
  line-height: 1.6;
}

.tip-icon {
  color: #6677e8;
  flex-shrink: 0;
  margin-top: 1px;
}

.login-tip b {
  color: #6677e8;
  font-weight: 600;
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

/* ==================== 皮肤切换（右上角浮动） ==================== */
.mode-switch {
  position: fixed;
  right: 24px;
  top: 24px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
}

.mode-switch.is-formal {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(31, 41, 55, 0.1);
  box-shadow: 0 2px 10px rgba(31, 41, 55, 0.06);
}

.mode-switch-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 1px;
  padding: 0 4px 0 6px;
  white-space: nowrap;
}

.mode-switch.is-formal .mode-switch-label {
  color: #9aa1ae;
}

.mode-btn {
  appearance: none;
  border: none;
  cursor: pointer;
  padding: 5px 12px;
  font-size: 12px;
  line-height: 1.4;
  border-radius: 7px;
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
  transition: all 0.2s ease;
  font-family: inherit;
  white-space: nowrap;
}

.mode-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
}

.mode-btn.active {
  color: #1f2937;
  background: rgba(255, 255, 255, 0.92);
  font-weight: 600;
}

.mode-switch.is-formal .mode-btn {
  color: #6b7280;
}

.mode-switch.is-formal .mode-btn:hover {
  color: #1f2937;
  background: rgba(31, 41, 55, 0.05);
}

.mode-switch.is-formal .mode-btn.active {
  color: #fff;
  background: linear-gradient(135deg, #6677e8 0%, #8a6ee6 100%);
  box-shadow: 0 2px 8px rgba(102, 119, 232, 0.3);
}

/* ==================== 背景选择器（左下角浮动） ==================== */
.bg-selector {
  position: fixed;
  left: 24px;
  bottom: 24px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.bg-selector-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 1px;
  margin-right: 4px;
  white-space: nowrap;
}

.bg-thumb {
  position: relative;
  width: 56px;
  height: 32px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.25s ease;
  flex-shrink: 0;
}

.bg-thumb-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.bg-thumb:hover {
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.bg-thumb.active {
  border-color: #fff;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.3), 0 4px 12px rgba(0, 0, 0, 0.4);
}

.bg-thumb-name {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  font-size: 10px;
  color: #fff;
  text-align: center;
  background: rgba(0, 0, 0, 0.5);
  line-height: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
