<template>
    <a-popover v-model:open="visible" trigger="click" placement="bottomRight" :overlay-style="{ width: '300px' }">
      <template #content>
        <div class="search-popup">
          <a-input-search
            v-model:value="searchValue"
            placeholder="搜索..."
            @search="onSearch"
            @pressEnter="onSearch(searchValue)"
          />
          <div v-if="history.length > 0" class="search-history">
            <div class="history-header">
              <span>搜索历史</span>
              <a-button type="link" @click="clearHistory">清空历史</a-button>
            </div>
            <div class="history-list">
              <div v-for="(item, idx) in history" :key="idx" class="history-item">
                <clock-circle-outlined />
                <span class="history-text" @click="onHistoryItemClick(item)">{{ item }}</span>
                <close-outlined class="delete-icon" @click="removeHistory(idx)" />
              </div>
            </div>
          </div>
          <div v-else class="empty-history">暂无搜索历史</div>
        </div>
      </template>
      <a-tooltip title="搜索">
        <search-outlined class="action-icon" />
      </a-tooltip>
    </a-popover>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  import { SearchOutlined, ClockCircleOutlined, CloseOutlined } from '@ant-design/icons-vue'
  
  const visible = ref(false)
  const searchValue = ref('')
  const history = ref<string[]>([])
  
  function onSearch(val: string) {
    if (!val.trim()) return
    if (!history.value.includes(val)) history.value.unshift(val)
    visible.value = false
    searchValue.value = ''
  }
  function clearHistory() {
    history.value = []
  }
  function removeHistory(idx: number) {
    history.value.splice(idx, 1)
  }
  function onHistoryItemClick(item: string) {
    searchValue.value = item
    onSearch(item)
  }
  </script>
  
  <style scoped>
  .search-popup { padding: 12px; }
  .history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .history-list .history-item { display: flex; align-items: center; padding: 8px; cursor: pointer; }
  .history-text { flex: 1; margin: 0 12px; }
  .delete-icon { opacity: 0.5; cursor: pointer; }
  .empty-history { text-align: center; opacity: 0.45; padding: 16px 0; }
  </style>