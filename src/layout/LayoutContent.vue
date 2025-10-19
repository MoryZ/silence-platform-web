<template>
    <a-layout-content class="layout-content">
      <div class="content-container">
        <router-view v-slot="{ Component, route }">
          <transition name="fade" mode="out-in">
            <keep-alive :include="cachedViews">
              <component :is="Component" :key="route.name || route.path" />
            </keep-alive>
          </transition>
        </router-view>
      </div>
    </a-layout-content>
  </template>
  
  <script setup lang="ts">
  // 允许父组件传递 keep-alive 缓存页面名数组
  defineProps<{
    cachedViews?: string[]
  }>()
  </script>
  
  <style scoped>
  .layout-content {
    flex: 1;
    padding: 24px;
    background: #fff;
    min-height: 280px;
  }
  .content-container {
    height: 100%;
  }
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.2s;
  }
  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }
  </style>