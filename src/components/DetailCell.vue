<template>
    <span v-if="column && column.type === 'enum' && enums && column.enumMap">
      <a-tag :color="getEnumColor(value, column)">{{ getEnumLabel(value, column) }}</a-tag>
    </span>
    <span v-else-if="column && column.type === 'date'">
      {{ formatDate(value) }}
    </span>
    <span v-else-if="column && column.type === 'token'">
      <div class="token-display">
        <span class="token-value">{{ value ?? '-' }}</span>
        <a-button 
          v-if="value" 
          type="text" 
          size="small" 
          @click="copyToken" 
          class="copy-token-btn"
          title="复制Token"
        >
          <template #icon>
            <svg width="1em" height="1em" viewBox="0 0 1024 1024" fill="currentColor">
              <path d="M832 64H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-600 72h560v208H232V136zm560 480H232V408h560v208zm0 272H232V680h560v208z"></path>
            </svg>
          </template>
        </a-button>
      </div>
    </span>
    <span v-else-if="Array.isArray(value)">
      <div v-if="value.length > 0" class="array-display">
        <a-tag v-for="item in value" :key="item" color="green">
          {{ item }}
        </a-tag>
      </div>
      <span v-else>无</span>
    </span>
    <span v-else>
      {{ value ?? '-' }}
    </span>
  </template>
  
  <script setup lang="ts">
  import { Tag as ATag, message } from 'ant-design-vue';
  import type { PropType } from 'vue';
  import { $t } from '@/locales';

  type EnumMapValue = { label: string; color: string };
  
  interface ColumnType {
    type?: string;
    // enumMap 支持 string | number | boolean 作为键
    // 由于 TypeScript 的类型系统限制，使用 any 类型并在访问时进行类型检查
    enumMap?: Record<string | number, EnumMapValue> | any;
  }

  const props = defineProps({
    value: [String, Number, Boolean, Object] as PropType<string | number | boolean | object | undefined>,
    column: Object as PropType<ColumnType>,
    enums: Object
  });
  function getEnumLabel(val: unknown, col?: ColumnType) {
    const isKey = typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean';
    if (isKey && col && col.enumMap && (col.enumMap as any)[val as any]) {
      const label = (col.enumMap as any)[val as any].label;
      // 如果label看起来像国际化键（包含点号），则使用$t函数翻译
      if (typeof label === 'string' && label.includes('.')) {
        return $t(label);
      }
      return label;
    }
    return val as any;
  }
  function getEnumColor(val: unknown, col?: ColumnType) {
    const isKey = typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean';
    if (isKey && col && col.enumMap && (col.enumMap as any)[val as any]) return (col.enumMap as any)[val as any].color;
    return '';
  }
  function formatDate(val: unknown) {
    if (val === undefined || val === null) return '';
    if (typeof val !== 'string' && typeof val !== 'number') return String(val);
    const date = typeof val === 'number' ? new Date(val) : new Date(val);
    if (isNaN(date.getTime())) return String(val);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  
  async function copyToken() {
    if (props.value) {
      try {
        await navigator.clipboard.writeText(String(props.value));
        message.success('Token已复制到剪贴板');
      } catch (e) {
        message.error('复制失败');
      }
    }
  }
  </script>

  <style scoped>
  .token-display {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .token-value {
    font-family: 'Courier New', monospace;
    background-color: #f5f5f5;
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid #d9d9d9;
    flex: 1;
    word-break: break-all;
  }
  
  .copy-token-btn {
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .copy-token-btn:hover {
    background-color: #f0f0f0;
  }
  
  .array-display {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  </style>
  