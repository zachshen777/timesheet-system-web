<template>
  <Transition name="banner-slide">
    <div v-if="store.visible && store.messages.length > 0" class="broadcast-banner">
      <div class="banner-icon">
        <el-icon :size="15"><Bell /></el-icon>
      </div>
      <div class="banner-marquee-track">
        <div class="banner-marquee-content" ref="marqueeRef">
          <template v-for="msg in store.messages" :key="msg.id">
            <span class="banner-item">{{ msg.text }}</span>
            <span class="banner-divider">|</span>
          </template>
          <!-- 复制一份实现无缝循环 -->
          <template v-for="msg in store.messages" :key="'dup-' + msg.id">
            <span class="banner-item">{{ msg.text }}</span>
            <span class="banner-divider">|</span>
          </template>
        </div>
      </div>
      <div class="banner-close" @click="store.close()">
        <el-icon :size="14"><Close /></el-icon>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { Bell, Close } from '@element-plus/icons-vue'
import { useBroadcastStore } from '../stores/broadcast'

const store = useBroadcastStore()

onMounted(() => {
  store.startPolling()
})

onUnmounted(() => {
  store.stopPolling()
})
</script>

<style scoped>
.broadcast-banner {
  display: flex;
  align-items: center;
  height: 36px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-bottom: 1px solid #bfdbfe;
  overflow: hidden;
  flex-shrink: 0;
  padding: 0 8px;
  gap: 10px;
}

.banner-icon {
  flex-shrink: 0;
  color: #3b82f6;
  display: flex;
  align-items: center;
}

.banner-marquee-track {
  flex: 1;
  overflow: hidden;
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
}

.banner-marquee-content {
  display: flex;
  align-items: center;
  gap: 0;
  white-space: nowrap;
  animation: marquee-scroll 40s linear infinite;
}

.banner-item {
  font-size: 13px;
  color: #1e40af;
  padding: 0 12px;
}

.banner-divider {
  color: #93c5fd;
  font-size: 12px;
}

.banner-close {
  flex-shrink: 0;
  color: #6b7280;
  cursor: pointer;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}
.banner-close:hover {
  background: #bfdbfe;
  color: #1e40af;
}

@keyframes marquee-scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

/* 过渡动画 */
.banner-slide-enter-active,
.banner-slide-leave-active {
  transition: all 0.35s ease;
}
.banner-slide-enter-from,
.banner-slide-leave-to {
  height: 0;
  opacity: 0;
  border-bottom-width: 0;
}
</style>
