<template>
  <div class="common-pagination-table">
    <template v-if="title">
      <div class="table-title">{{ title }}</div>
    </template>
    <a-table
      :columns="computedColumns"
      :data-source="dataSource"
      :loading="loading"
      :row-key="rowKey"
      v-bind="tableProps"
      :pagination="false"
      :scroll="{ x: 1500 }"
    >
      <template v-for="(_, name) in $slots" #[name]="slotProps">
        <slot :name="name" v-bind="slotProps" />
      </template>
    </a-table>
    <div class="pagination-wrapper">
      <a-pagination
        v-model:current="currentPage"
        v-model:pageSize="currentPageSize"
        :total="total"
        :show-total="(total: number) => `共 ${total} 条记录`"
        :page-size-options="['10', '20', '40']"
        show-size-changer
        show-quick-jumper
        @change="handleChange"
        @showSizeChange="handleShowSizeChange"
        v-bind="paginationProps"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, h, ref } from 'vue';
import { Tag, Switch } from 'ant-design-vue';

interface Props {
  columns: any[];
  dataSource: any[];
  loading?: boolean;
  rowKey?: string;
  pageNo: number;
  pageSize: number;
  total: number;
  tableProps?: Record<string, any>;
  paginationProps?: Record<string, any>;
  title?: string;
}

interface Emits {
  (e: 'update:pageNo', value: number): void;
  (e: 'update:pageSize', value: number): void;
  (e: 'change', pageNo: number, pageSize: number): void;
  (e: 'cell-click', record: any, column: any): void;
  (e: 'switch-change', value: any, record: any, column: any, done: () => void): void;
}

const props = withDefaults(defineProps<Props>(), {
  pageNo: 1,
  pageSize: 10,
  total: 0,
  columns: () => [],
  dataSource: () => [],
  loading: false,
  rowKey: 'id',
  tableProps: () => ({}),
  paginationProps: () => ({}),
  title: ''
});

const emit = defineEmits<Emits>();

const currentPage = computed({
  get: () => props.pageNo,
  set: (value) => emit('update:pageNo', value),
});

const currentPageSize = computed({
  get: () => props.pageSize,
  set: (value) => emit('update:pageSize', value),
});

const handleChange = (pageNo: number, pageSize: number) => {
  emit('change', pageNo, pageSize);
};

const handleShowSizeChange = (pageNo: number, pageSize: number) => {
  emit('update:pageSize', pageSize);
  emit('change', 1, pageSize); // 切换每页条数时，重置为第一页
};

function formatDate(val: string | number) {
  if (!val) return '';
  const date = typeof val === 'number' ? new Date(val) : new Date(val);
  if (isNaN(date.getTime())) return val;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

const switchLoadingMap = ref<Record<string, boolean>>({});

const computedColumns = computed(() => {
  return props.columns.map(col => {
    // clickable 字段
    if (col.clickable) {
      return {
        ...col,
        customRender: ({ text, record }: { text: any; record: any }) =>
          h('a', {
            style: 'color: #1677ff; cursor: pointer;',
            onClick: () => emit('cell-click', record, col)
          }, text)
      };
    }
    // switch 字段
    if (col.type === 'switch') {
      return {
        ...col,
        customRender: ({ text, record }: { text: any; record: any }) =>
          h(Switch, {
            checked: text === 1 || text === '1' || text === true,
            loading: switchLoadingMap.value[record[props.rowKey] || ''],
            onChange: async (checked: boolean) => {
              switchLoadingMap.value[record[props.rowKey] || ''] = true;
              await new Promise<void>(resolve => {
                emit('switch-change', checked, record, col, () => resolve());
              });
              switchLoadingMap.value[record[props.rowKey] || ''] = false;
            }
          })
      };
    }
    // enum 字段
    if (col.type === 'enum' && col.enumMap) {
      return {
        ...col,
        customRender: ({ text }: { text: any }) => {
          const item = col.enumMap[text];
          if (!item) return text;
          return h(Tag, { color: item.color }, () => item.label);
        }
      };
    }
    // date 字段
    if (col.type === 'date') {
      return {
        ...col,
        customRender: ({ text }: { text: string | number }) => formatDate(text)
      };
    }
    return col;
  });
});
</script>

<style lang="scss" scoped>
.common-pagination-table {
  width: 100%;
}
.table-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
}
.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style> 