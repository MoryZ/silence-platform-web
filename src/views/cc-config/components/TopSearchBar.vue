<template>
  <div class="topbar">
    <div class="filters">
      <a-input
        v-model:value="localSearchForm.namespaceId"
        placeholder="请输入命名空间关键字"
        style="width: 220px"
        @pressEnter="handleSearch"
      />
      <a-input
        v-model:value="localSearchForm.content"
        placeholder="请输入配置项关键字"
        style="width: 220px; margin-left: 12px"
        @pressEnter="handleSearch"
      />
      <a-button type="primary" style="margin-left: 12px" @click="handleSearch">搜索</a-button>
      <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
    </div>
    <div class="actions">
      <a-button type="primary" @click="handleCreate">创建配置</a-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';

interface Props {
  initialSearch?: { namespaceId?: string; content?: string };
}

interface Emits {
  (e: 'search', payload: { namespaceId?: string; content?: string }): void;
  (e: 'reset'): void;
  (e: 'create'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localSearchForm = ref({
  namespaceId: props.initialSearch?.namespaceId || '',
  content: props.initialSearch?.content || '',
});

watch(() => props.initialSearch, (newVal) => {
  if (newVal) {
    localSearchForm.value = {
      namespaceId: newVal.namespaceId || '',
      content: newVal.content || '',
    };
  }
}, { deep: true });

const handleSearch = () => {
  emit('search', {
    namespaceId: localSearchForm.value.namespaceId,
    content: localSearchForm.value.content,
  });
};

const handleReset = () => {
  localSearchForm.value = {
    namespaceId: '',
    content: '',
  };
  emit('reset');
};

const handleCreate = () => {
  emit('create');
};
</script>

<style lang="scss" scoped>
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 8px 0 16px 0;
  
  .filters {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
</style>
