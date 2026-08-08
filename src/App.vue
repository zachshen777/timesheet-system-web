<template>
  <BroadcastBanner v-if="showBanner" />
  <router-view />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BroadcastBanner from './components/BroadcastBanner.vue'

const route = useRoute()
const showBanner = computed(() => route.path !== '/login')
</script>

<style scoped>
</style>
