<template>
    <a-button
      type="link"
      class="env-button"
      @click="showEnvModal = true"
    >
      <environment-outlined />
      {{ envStore.envDisplayName }}
      <down-outlined />
    </a-button>
    <a-modal
      v-model:open="showEnvModal"
      title="切换环境"
      width="400"
      :footer="null"
      :mask-closable="false"
    >
      <a-radio-group
        v-model:value="selectedEnv"
        style="width: 100%"
        @change="onEnvChange"
      >
        <a-radio-button v-for="env in envOptions" :key="env.value" :value="env.value">
          {{ env.label }}
        </a-radio-button>
      </a-radio-group>
      <div style="text-align: right; margin-top: 24px;">
        <a-button @click="showEnvModal = false">取消</a-button>
      </div>
    </a-modal>
  </template>
  
  <script setup lang="ts">
  import { ref, watch } from 'vue'
  import { EnvironmentOutlined, DownOutlined } from '@ant-design/icons-vue'
  import { useEnvStore } from '@/stores/env'
  
  const envStore = useEnvStore()
  const showEnvModal = ref(false)
  const envOptions = [
    { label: '开发环境', value: '1' },
    { label: '测试环境', value: '2' },
    { label: '生产环境', value: '3' }
  ]
  const selectedEnv = ref(envStore.currentEnv)
  
  // 监听 store 的 currentEnv，切换后同步 selectedEnv
  watch(() => envStore.currentEnv, (val) => {
    selectedEnv.value = val
  })
  
  function onEnvChange(e: any) {
    const value = e.target ? e.target.value : e
    envStore.setCurrentEnv(value)
    showEnvModal.value = false
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