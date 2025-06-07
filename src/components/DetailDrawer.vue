<template>
  <a-drawer
    :open="visible"
    :title="title || '详情'"
    width="700"
    :footer="null"
    @close="$emit('update:visible', false)"
    class="detail-drawer"
  >
    <div class="detail-table">
      <div v-for="(row, idx) in rows" :key="idx" class="detail-row">
        <div v-if="row[0]" class="detail-col">
          <div class="detail-label">{{ row[0].label }}</div>
          <div class="detail-value">
            <DetailCell :value="row[0].value" :column="row[0].column" :enums="enums" />
          </div>
        </div>
        <div v-if="row[1]" class="detail-col">
          <div class="detail-label">{{ row[1].label }}</div>
          <div class="detail-value">
            <DetailCell :value="row[1].value" :column="row[1].column" :enums="enums" />
          </div>
        </div>
        <div class="detail-divider" />
      </div>
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
import { computed, PropType } from 'vue';
import DetailCell from './DetailCell.vue';

interface ColumnType {
  title: string;
  dataIndex: string;
  type?: string;
  enumMap?: Record<string | number, { label: string; color: string }>;
}

const props = defineProps({
  visible: Boolean,
  record: {
    type: Object as PropType<Record<string, any> | null>,
    default: null
  },
  columns: {
    type: Array as PropType<ColumnType[]>,
    default: () => []
  },
  enums: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({})
  },
  title: String
});

const showColumns = computed(() => (props.columns || []).filter(col => col.dataIndex && col.dataIndex !== 'operation'));
const rows = computed(() => {
  const arr: Array<any[]> = [];
  for (let i = 0; i < showColumns.value.length; i += 2) {
    const col1 = showColumns.value[i];
    const col2 = showColumns.value[i + 1];
    arr.push([
      col1
        ? {
            label: col1.title,
            value: props.record ? props.record[col1.dataIndex] : undefined,
            column: col1
          }
        : null,
      col2
        ? {
            label: col2.title,
            value: props.record ? props.record[col2.dataIndex] : undefined,
            column: col2
          }
        : null
    ]);
  }
  return arr;
});
</script>

<style scoped>
.detail-drawer >>> .ant-drawer-body {
  padding: 24px 32px 24px 32px;
}
.detail-table {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.detail-row {
  display: flex;
  flex-direction: row;
  margin-bottom: 0;
  align-items: stretch;
  position: relative;
}
.detail-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 14px 0 14px 0;
}
.detail-label {
  width: 110px;
  min-width: 110px;
  color: #222;
  font-weight: 600;
  text-align: left;
  padding-right: 12px;
  line-height: 22px;
}
.detail-value {
  flex: 1;
  color: #666;
  word-break: break-all;
  line-height: 22px;
}
.detail-divider {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: #f0f0f0;
  content: '';
}
</style>