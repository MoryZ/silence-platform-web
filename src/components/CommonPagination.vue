<template>
  <div class="common-pagination-table">
    <a-table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :row-key="rowKey"
      v-bind="tableProps"
      :pagination="false"
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
import { computed } from 'vue';

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
}

interface Emits {
  (e: 'update:pageNo', value: number): void;
  (e: 'update:pageSize', value: number): void;
  (e: 'change', pageNo: number, pageSize: number): void;
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
</script>

<style lang="scss" scoped>
.common-pagination-table {
  width: 100%;
}
.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style> 