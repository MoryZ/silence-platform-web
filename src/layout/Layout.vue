<template>
  <a-layout class="layout">
    <a-layout-header>
      <div class="logo" />
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="horizontal"
        :style="{ lineHeight: '64px' }"
      >
        <a-menu-item key="1">nav 1</a-menu-item>
        <a-menu-item key="2">nav 2</a-menu-item>
        <a-menu-item key="3">nav 3</a-menu-item>
      </a-menu>
    </a-layout-header>
    <a-layout-content style="padding: 0 50px">
      <router-view></router-view>
    </a-layout-content>
    <a-layout-footer style="text-align: center">
      ©2024 Created by Your Company
    </a-layout-footer>
  </a-layout>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const selectedKeys = ref<string[]>(['1']);
</script>

<style scoped>
.layout {
  min-height: 100vh;
}
.logo {
  float: left;
  width: 120px;
  height: 31px;
  margin: 16px 24px 16px 0;
  background: rgba(255, 255, 255, 0.3);
}
</style> 