<template>
  <div>
    <a-button
      type="link"
      class="env-button"
      @click="showModal = true"
    >
      <environment-outlined />
      {{ envStore.envDisplayName }}
      <down-outlined />
    </a-button>

    <a-modal
      v-model:open="showModal"
      :footer="null"
      :closable="false"
      :mask-closable="true"
      :width="480"
      class="env-selector-modal"
    >
      <template #title>
        <div class="modal-header">
          <span class="modal-title">切换环境</span>
          <close-outlined class="close-icon" @click="showModal = false" />
        </div>
      </template>
      
      <div class="env-options">
        <div
          v-for="env in envOptions"
          :key="env.value"
          class="env-option"
          :class="{ active: envStore.currentEnv === env.value }"
          @click="handleEnvSelect(env.value)"
        >
          {{ env.label }}
        </div>
      </div>
    </a-modal>
  </div>
</template>
  
<script setup lang="ts">
import { ref } from 'vue'
import { EnvironmentOutlined, DownOutlined, CloseOutlined } from '@ant-design/icons-vue'
import { useEnvStore } from '@/stores/env'

const envStore = useEnvStore()
const showModal = ref(false)
const envOptions = [
  { label: '开发环境', value: '1' },
  { label: '测试环境', value: '2' },
  { label: '生产环境', value: '3' }
]

// 环境选择处理
const handleEnvSelect = (envValue: string) => {
  envStore.setCurrentEnv(envValue as any)
  showModal.value = false
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

:deep(.env-selector-modal .ant-modal-content) {
  padding: 0;
  border-radius: 8px;
  overflow: hidden;
}

:deep(.env-selector-modal .ant-modal-header) {
  background: #f0f5ff;
  padding: 16px 48px 16px 20px;
  margin: 0;
  border-bottom: 1px solid #e6ebf1;
  position: relative;
}

:deep(.env-selector-modal .ant-modal-title) {
  margin: 0;
  width: 100%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  position: relative;
}

.modal-title {
  color: #333;
  font-size: 16px;
  font-weight: 500;
}

.close-icon {
  color: #666;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
}

.close-icon:hover {
  color: #333;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 4px;
}

.env-options {
  display: flex;
  gap: 16px;
  padding: 24px 20px;
  background: #fff;
}

.env-option {
  flex: 1;
  padding: 16px;
  text-align: center;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  color: #333;
  background: #fff;
}

.env-option:hover {
  border-color: #722ed1;
  color: #722ed1;
}

.env-option.active {
  border-color: #722ed1;
  background: #f9f0ff;
  color: #722ed1;
  font-weight: 500;
}
</style>