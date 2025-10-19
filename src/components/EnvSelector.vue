<template>
    <a-dropdown
      v-model:open="showDropdown"
      placement="bottomRight"
      :trigger="['click']"
    >
      <a-button
        type="link"
        class="env-button"
      >
        <environment-outlined />
        {{ envStore.envDisplayName }}
        <down-outlined />
      </a-button>
      <template #overlay>
        <a-menu
          v-model:selectedKeys="selectedKeys"
          @click="handleMenuClick"
        >
          <a-menu-item v-for="env in envOptions" :key="env.value">
            {{ env.label }}
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </template>
  
  <script setup lang="ts">
  import { ref, watch } from 'vue'
  import { EnvironmentOutlined, DownOutlined } from '@ant-design/icons-vue'
  import { useEnvStore } from '@/stores/env'
  
  const envStore = useEnvStore()
  const showDropdown = ref(false)
  const envOptions = [
    { label: '开发环境', value: '1' },
    { label: '测试环境', value: '2' },
    { label: '生产环境', value: '3' }
  ]
  const selectedKeys = ref([envStore.currentEnv])
  
  // 监听 store 的 currentEnv，切换后同步 selectedKeys
  watch(() => envStore.currentEnv, (val) => {
    selectedKeys.value = [val]
  })
  
  // 菜单点击处理
  const handleMenuClick = ({ key }: { key: string }) => {
    envStore.setCurrentEnv(key as any)
    showDropdown.value = false
  }
  </script>

  <style scoped>
  .env-button {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 32px;
    padding: 4px 8px;
  }
  </style>