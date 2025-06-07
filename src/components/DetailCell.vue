<template>
    <span v-if="column && column.type === 'enum' && enums && column.enumMap">
      <a-tag :color="getEnumColor(value, column)">{{ getEnumLabel(value, column) }}</a-tag>
    </span>
    <span v-else-if="column && column.type === 'date'">
      {{ formatDate(value) }}
    </span>
    <span v-else>
      {{ value ?? '-' }}
    </span>
  </template>
  
  <script setup lang="ts">
  import { Tag as ATag } from 'ant-design-vue';
  import type { PropType } from 'vue';

  interface ColumnType {
    type?: string;
    enumMap?: Record<string | number, { label: string; color: string }>;
  }

  const props = defineProps({
    value: [String, Number, Boolean, Object] as PropType<string | number | boolean | object | undefined>,
    column: Object as PropType<ColumnType>,
    enums: Object
  });
  function getEnumLabel(val: unknown, col?: ColumnType) {
    if ((typeof val === 'string' || typeof val === 'number') && col && col.enumMap && col.enumMap[val]) return col.enumMap[val].label;
    return val;
  }
  function getEnumColor(val: unknown, col?: ColumnType) {
    if ((typeof val === 'string' || typeof val === 'number') && col && col.enumMap && col.enumMap[val]) return col.enumMap[val].color;
    return '';
  }
  function formatDate(val: unknown) {
    if (val === undefined || val === null) return '';
    if (typeof val !== 'string' && typeof val !== 'number') return String(val);
    const date = typeof val === 'number' ? new Date(val) : new Date(val);
    if (isNaN(date.getTime())) return String(val);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  </script>
  