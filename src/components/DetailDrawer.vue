<template>
  <a-drawer
    :open="visible"
    :width="drawerWidth"
    :footer="null"
    :closable="false"
    @close="$emit('update:visible', false)"
    class="detail-drawer"
  >
    <!-- 自定义头部 -->
    <template #title>
      <div class="drawer-header">
        <span class="drawer-title">{{ title || '详情' }}</span>
        <div class="drawer-actions">
          <a-button 
            type="text" 
            @click="toggleDrawerSize"
            :title="isDrawerMaximized ? '还原' : '最大化'"
          >
            <template #icon>
              <FullscreenOutlined v-if="!isDrawerMaximized" />
              <FullscreenExitOutlined v-else />
            </template>
          </a-button>
          <a-button 
            type="text" 
            @click="$emit('update:visible', false)"
            title="关闭"
          >
            <template #icon>
              <CloseOutlined />
            </template>
          </a-button>
        </div>
      </div>
    </template>
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
import { computed, PropType, ref } from 'vue';
import { FullscreenOutlined, FullscreenExitOutlined, CloseOutlined } from '@ant-design/icons-vue';
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

// 抽屉大小控制
const drawerWidth = ref<number | string>(700);
const isDrawerMaximized = ref(false);

// 切换抽屉大小
function toggleDrawerSize() {
  if (isDrawerMaximized.value) {
    drawerWidth.value = 700;
    isDrawerMaximized.value = false;
  } else {
    drawerWidth.value = '100vw';
    isDrawerMaximized.value = true;
  }
}

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
.detail-drawer :deep(.ant-drawer-body) {
  padding: 24px 32px 24px 32px;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.drawer-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.drawer-actions {
  display: flex;
  gap: 4px;
}

.drawer-actions .ant-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drawer-actions .ant-btn:hover {
  background-color: #f5f5f5;
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