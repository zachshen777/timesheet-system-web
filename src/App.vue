<template>
  <BroadcastBanner v-if="showBanner" />
  <router-view />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BroadcastBanner from './components/BroadcastBanner.vue'
import { initTheme } from './utils/theme'

const route = useRoute()
const showBanner = computed(() => route.path !== '/login')

// 应用启动时初始化主题（未解锁暗夜主题则强制亮色）
initTheme()
</script>

<style scoped>
</style>
