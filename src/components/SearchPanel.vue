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
          <a-form-item v-if="field.type === 'input'" :label="field.label">
            <a-input
              v-model:value="localForm[field.key]"
              :allow-clear="true"
              :style="field.style || 'width: 200px'"
              :placeholder="field.placeholder"
            />
          </a-form-item>
          <a-form-item v-else-if="field.type === 'select'" :label="field.label">
            <a-select
              v-model:value="localForm[field.key]"
              :options="fieldOptions[field.key] || field._options"
              :allow-clear="true"
              :style="field.style || 'width: 160px'"
              :placeholder="field.placeholder"
              @change="handleFieldChange"
            />
          </a-form-item>
          <a-form-item v-else-if="field.type === 'tree'" :label="field.label">
            <a-tree-select
              v-model:value="localForm[field.key]"
              :tree-data="field._treeData"
              :allow-clear="true"
              :style="field.style || 'width: 200px'"
              :placeholder="field.placeholder"
              tree-default-expand-all
            />
          </a-form-item>
          <a-form-item v-else-if="field.type === 'date-picker'" :label="field.label">
            <a-range-picker
              v-model:value="localForm[field.key]"
              :show-time="field.dateConfig?.showTime"
              :format="field.dateConfig?.format || 'YYYY-MM-DD HH:mm:ss'"
              :style="field.style || 'width: 360px'"
              :placeholder="[field.placeholder || '开始时间', field.placeholder || '结束时间']"
              @change="handleDateChange(field)"
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
  import { ref, watch, onMounted } from 'vue';
  import dayjs from 'dayjs';
  // @ts-ignore
  import { TreeSelect } from 'ant-design-vue';
  
  interface FieldConfig {
    key: string;
    label: string;
    type: 'input' | 'select' | 'tree' | 'date-picker';
    placeholder?: string;
    options?: Array<{ label: string; value: string }> | (() => Promise<Array<{ label: string; value: string }>>);
    treeData?: Array<any> | (() => Promise<Array<any>>);
    style?: string;
    // 日期选择器配置
    dateConfig?: {
      showTime?: boolean;
      format?: string;
      defaultRange?: [number, number]; // 默认时间间距（小时）
      // 转换后的起止时间字段名，如 { startKey: 'createdDateStart', endKey: 'createdDateEnd' }
      rangeKeys?: { startKey: string; endKey: string };
    };
    // 内部扩展属性
    _options?: Array<{ label: string; value: string }>;
    _treeData?: Array<any>;
  }
  
  const props = defineProps<{
    modelValue: Record<string, any>,
    fields: FieldConfig[]
  }>();
  const emit = defineEmits(['update:modelValue', 'search', 'reset', 'ready']);
  
  const collapsed = ref(false);
  const localForm = ref({ ...props.modelValue });
  const fieldOptions = ref<Record<string, Array<{ label: string; value: string }>>>({});
  
  // 处理异步 options/treeData
  async function initFieldData() {
    for (const field of props.fields) {
      if (field.type === 'select') {
        if (typeof field.options === 'function') {
          const options = await field.options();
          // 使用响应式数据来存储选项
          fieldOptions.value[field.key] = options;
          field._options = options;
          console.log('SearchPanel设置选项:', field.key, options);
        } else {
          fieldOptions.value[field.key] = field.options || [];
          field._options = field.options || [];
        }
      } else if (field.type === 'tree') {
        if (typeof field.treeData === 'function') {
          const treeData = await field.treeData();
          field._treeData = treeData;
        } else {
          field._treeData = field.treeData || [];
        }
      }
    }
  }
  
  // 处理日期变化
  function handleDateChange(field: FieldConfig) {
    if (field.dateConfig?.defaultRange && !localForm.value[field.key]) {
      const [start, end] = field.dateConfig.defaultRange;
      const now = dayjs();
      localForm.value[field.key] = [now.subtract(start, 'hour'), now.add(end, 'hour')];
    }
  }

  // 处理日期范围转换，将 {key}: [dayjs, dayjs] 转换为 {key}Start: ISOString, {key}End: ISOString
  // 只发送转换后的值，不发送原始数组
  function transformDateRange(formData: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    
    // 复制非日期范围的字段
    for (const key in formData) {
      if (!props.fields.some(f => f.type === 'date-picker' && f.key === key)) {
        result[key] = formData[key];
      }
    }
    
    // 转换日期范围字段
    for (const field of props.fields) {
      if (field.type === 'date-picker') {
        const rangeKey = field.key;
        const rangeValue = formData[rangeKey];
        
        // 使用配置的 rangeKeys 或默认的 key + Start/End
        const startKey = field.dateConfig?.rangeKeys?.startKey || `${rangeKey}Start`;
        const endKey = field.dateConfig?.rangeKeys?.endKey || `${rangeKey}End`;
        
        if (Array.isArray(rangeValue) && rangeValue.length === 2) {
          const [start, end] = rangeValue;
          // 转换为 ISO 字符串
          result[startKey] = start ? dayjs(start).toISOString() : null;
          result[endKey] = end ? dayjs(end).toISOString() : null;
        } else {
          result[startKey] = null;
          result[endKey] = null;
        }
      }
    }
    
    return result;
  }

  // 初始化时设置默认日期范围
  onMounted(async () => {
    await initFieldData();
    // 设置默认日期范围
    props.fields.forEach(field => {
      if (field.type === 'date-picker' && field.dateConfig?.defaultRange && !localForm.value[field.key]) {
        handleDateChange(field);
      }
    });
    // 初始化完成后通知父组件
    const transformedForm = transformDateRange(localForm.value);
    // 同时发送原始数据用于日期选择器显示
    emit('ready', { ...localForm.value, ...transformedForm });
  });

  // 监听 fields 变化，重新初始化 options/treeData
  watch(() => props.fields, () => {
    initFieldData();
  }, { deep: true });

  watch(() => props.modelValue, (val) => {
    localForm.value = { ...val };
  });

  
  function emitSearch() {
    const transformedForm = transformDateRange(localForm.value);
    emit('update:modelValue', { ...transformedForm });
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
  
  function handleFieldChange() {
    emit('update:modelValue', { ...localForm.value });
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