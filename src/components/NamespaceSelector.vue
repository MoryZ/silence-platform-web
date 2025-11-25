<template>
  <div>
    <a-button
      type="link"
      class="namespace-button"
      @click="showModal = true"
    >
      <span class="namespace-icon">{-}</span>
      {{ namespaceStore.namespaceDisplayName }}
      <down-outlined />
    </a-button>

    <a-modal
      v-model:open="showModal"
      :footer="null"
      :closable="false"
      :mask-closable="true"
      :width="480"
      class="namespace-selector-modal"
    >
      <template #title>
        <div class="modal-header">
          <span class="modal-title">切换命名空间</span>
          <close-outlined class="close-icon" @click="showModal = false" />
        </div>
      </template>
      
      <div class="namespace-options">
        <div
          v-for="namespace in namespaceList"
          :key="namespace.uniqueId"
          class="namespace-option"
          :class="{ active: namespaceStore.currentNamespace?.uniqueId === namespace.uniqueId }"
          @click="handleNamespaceSelect(namespace)"
        >
          <span class="namespace-name">{{ namespace.name }}</span>
          <check-outlined v-if="namespaceStore.currentNamespace?.uniqueId === namespace.uniqueId" class="check-icon" />
        </div>
        <div
          v-if="namespaceList.length === 0 && !loading"
          class="namespace-empty"
        >
          暂无命名空间
        </div>
        <div
          v-if="loading"
          class="namespace-loading"
        >
          <a-spin />
        </div>
      </div>
    </a-modal>
  </div>
</template>
  
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { DownOutlined, CloseOutlined, CheckOutlined } from '@ant-design/icons-vue'
import { useNamespaceStore } from '@/stores/namespace'
import { getAllNamespaces, type NameSpace } from '@/api/job/namespace'
import { message } from 'ant-design-vue'

const namespaceStore = useNamespaceStore()
const showModal = ref(false)
const namespaceList = ref<NameSpace[]>([])
const loading = ref(false)

// 获取命名空间列表
const fetchNamespaces = async () => {
  loading.value = true
  try {
    const response = await getAllNamespaces()
    // 处理响应数据
    let namespaces: NameSpace[] = []
    if (Array.isArray(response)) {
      namespaces = response
    } else if (response && typeof response === 'object' && 'data' in response) {
      const responseData = (response as { data?: NameSpace[] }).data
      namespaces = Array.isArray(responseData) ? responseData : []
    }
    
    namespaceList.value = namespaces
    
    // 如果已有选中的命名空间，检查它是否还在列表中
    if (namespaceStore.currentNamespace) {
      const exists = namespaces.some(ns => ns.uniqueId === namespaceStore.currentNamespace?.uniqueId)
      if (!exists) {
        // 如果保存的命名空间不在列表中，清空选择
        namespaceStore.clearCurrentNamespace()
      }
    }
    
    // 如果没有选中的命名空间，且列表不为空，默认选中第一个
    if (!namespaceStore.currentNamespace && namespaces.length > 0) {
      namespaceStore.setCurrentNamespace(namespaces[0])
    }
  } catch (error) {
    message.error('获取命名空间列表失败')
    console.error('获取命名空间列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 命名空间选择处理
const handleNamespaceSelect = (namespace: NameSpace) => {
  namespaceStore.setCurrentNamespace(namespace)
  showModal.value = false
  // 触发页面刷新，让所有使用命名空间的接口重新请求
  window.location.reload()
}

// 打开弹窗时重新获取列表
watch(showModal, (newVal) => {
  if (newVal) {
    fetchNamespaces()
  }
})

onMounted(() => {
  fetchNamespaces()
})
</script>

<style scoped>
.namespace-button {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding: 4px 8px;
}

.namespace-icon {
  font-size: 14px;
  font-weight: 500;
}

:deep(.namespace-selector-modal .ant-modal-content) {
  padding: 0;
  border-radius: 8px;
  overflow: hidden;
}

:deep(.namespace-selector-modal .ant-modal-header) {
  background: #f0f5ff;
  padding: 16px 48px 16px 20px;
  margin: 0;
  border-bottom: 1px solid #e6ebf1;
  position: relative;
}

:deep(.namespace-selector-modal .ant-modal-title) {
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

.namespace-options {
  padding: 24px 20px;
  background: #fff;
  max-height: 400px;
  overflow-y: auto;
}

.namespace-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  color: #333;
  background: #fff;
}

.namespace-option:hover {
  border-color: #722ed1;
  color: #722ed1;
}

.namespace-option.active {
  border-color: #722ed1;
  background: #f9f0ff;
  color: #722ed1;
  font-weight: 500;
}

.namespace-name {
  flex: 1;
}

.check-icon {
  color: #722ed1;
  font-size: 16px;
}

.namespace-empty {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;
}

.namespace-loading {
  text-align: center;
  padding: 40px 20px;
}
</style>

