<template>
  <!-- 弹跳 GIF：初始居中，随机方向直线移动，碰到视口边界反弹（DVD 屏保效果） -->
  <div ref="bouncerRef" class="bouncing-gif" :style="{ left: pos.x + 'px', top: pos.y + 'px' }">
    <img src="/bounce.gif" alt="bounce" draggable="false" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'

const bouncerRef = ref(null)
const pos = reactive({ x: 0, y: 0 })

// ===== 可调参数 =====
const SPEED = 2.5          // 每帧移动像素
const SIZE = 96            // GIF 显示宽度(px)

// 随机初始方向：20°~70° 随机角 + 随机象限，避免近水平/垂直的呆板轨迹
const angle = (20 + Math.random() * 50) * (Math.PI / 180)
            * (Math.random() < 0.5 ? 1 : -1)
            + (Math.random() < 0.5 ? 0 : Math.PI)
let dx = Math.cos(angle) * SPEED
let dy = Math.sin(angle) * SPEED

let rafId = null
let initialized = false

function tick() {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const w = bouncerRef.value?.offsetWidth || SIZE
  const h = bouncerRef.value?.offsetHeight || SIZE

  pos.x += dx
  pos.y += dy

  // 边界反弹（镜面反射）
  if (pos.x <= 0)            { pos.x = 0;      dx = Math.abs(dx) }
  if (pos.x + w >= vw)       { pos.x = vw - w; dx = -Math.abs(dx) }
  if (pos.y <= 0)            { pos.y = 0;      dy = Math.abs(dy) }
  if (pos.y + h >= vh)       { pos.y = vh - h; dy = -Math.abs(dy) }

  rafId = requestAnimationFrame(tick)
}

function onResize() {
  // 窗口缩小时把 GIF 拉回视口内，防止卡在屏幕外
  const vw = window.innerWidth
  const vh = window.innerHeight
  const w = bouncerRef.value?.offsetWidth || SIZE
  const h = bouncerRef.value?.offsetHeight || SIZE
  if (pos.x + w > vw) pos.x = Math.max(0, vw - w)
  if (pos.y + h > vh) pos.y = Math.max(0, vh - h)
}

onMounted(() => {
  // 首帧：居中
  pos.x = (window.innerWidth - (bouncerRef.value?.offsetWidth || SIZE)) / 2
  pos.y = (window.innerHeight - (bouncerRef.value?.offsetHeight || SIZE)) / 2
  initialized = true
  rafId = requestAnimationFrame(tick)
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.bouncing-gif {
  position: fixed;
  z-index: 1999;          /* 高于内容但低于消息提示 */
  pointer-events: none;   /* 不阻挡任何点击 */
  width: 96px;
  will-change: left, top;
  user-select: none;
  line-height: 0;
}

.bouncing-gif img {
  width: 100%;
  height: auto;
  opacity: 0.92;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.25));
}
</style>
