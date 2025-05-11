<template>
    <div class="search-panel">
      <div class="search-header" @click="toggle">
        <span class="search-title">
          <svg
            class="collapse-arrow"
            :class="{ collapsed }"
            width="16"
            height="16"
            viewBox="0 0 1024 1024"
            fill="currentColor"
            style="margin-right: 8px;"
          >
            <path d="M384 192l256 320-256 320z" />
          </svg>
          搜索
        </span>
      </div>
      <a-form
        v-show="!collapsed"
        layout="inline"
        @submit.prevent="emitSearch"
        class="search-form"
      >
        <template v-for="field in fields" :key="field.key">
          <a-form-item v-if="field.type === 'input'">
            <a-input
              v-model:value="localForm[field.key]"
              :allow-clear="true"
              :placeholder="field.placeholder"
              :style="field.style || 'width: 200px'"
            />
          </a-form-item>
          <a-form-item v-else-if="field.type === 'select'">
            <a-select
              v-model:value="localForm[field.key]"
              :options="field.options"
              :allow-clear="true"
              :placeholder="field.placeholder"
              :style="field.style || 'width: 160px'"
            />
          </a-form-item>
        </template>
        <a-form-item>
          <a-button type="primary" @click="emitSearch">搜索</a-button>
          <a-button style="margin-left: 8px" @click="emitReset">重置</a-button>
        </a-form-item>
      </a-form>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, watch } from 'vue';
  
  interface FieldConfig {
    key: string;
    type: 'input' | 'select';
    placeholder?: string;
    options?: Array<{ label: string; value: string }>;
    style?: string;
  }
  
  const props = defineProps<{
    modelValue: Record<string, any>,
    fields: FieldConfig[]
  }>();
  const emit = defineEmits(['update:modelValue', 'search', 'reset']);
  
  const collapsed = ref(false);
  const localForm = ref({ ...props.modelValue });
  
  watch(() => props.modelValue, (val) => {
    localForm.value = { ...val };
  });
  
  function emitSearch() {
    emit('update:modelValue', { ...localForm.value });
    emit('search');
  }
  function emitReset() {
    localForm.value = {};
    emit('update:modelValue', {});
    emit('reset');
  }
  function toggle() {
    collapsed.value = !collapsed.value;
  }
  </script>
  

  <style scoped>
  .search-panel {
    background: #fff;
    border-radius: 4px;
    margin-bottom: 12px;
    padding: 0 16px 4px 16px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.03);
  }
  .search-header {
    font-weight: 500;
    cursor: pointer;
    user-select: none;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    padding: 16px 0 0 0;
    background: #fff;
    border-radius: 4px 4px 0 0;
  }
  .search-title {
    color: #222;
    font-size: 16px;
    display: flex;
    align-items: center;
  }
  .search-title .anticon {
    margin-right: 8px;
    color: #222;
    font-size: 16px;
  }
  .search-form {
    margin-bottom: 0;
    padding-bottom: 8px;
  }
  .collapse-arrow {
    transition: transform 0.2s;
    color: #666;
    vertical-align: middle;
  }
  .collapse-arrow.collapsed {
    transform: rotate(-90deg);
  }
  </style>