<template>
  <div class="pagination-wrapper">
    <a-pagination
      v-model:pageNo="currentPage"
      v-model:pageSize="pageSize"
      :total="total"
      :show-total="(total: number) => `共 ${total} 条记录`"
      :page-size-options="['10', '20', '40']"
      show-size-changer
      show-quick-jumper
      @change="handleChange"
      @showSizeChange="handleShowSizeChange"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface Props {
  pageNo: number;
  pageSize: number;
  total: number;
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
});

const emit = defineEmits<Emits>();

const currentPage = computed({
  get: () => props.pageNo,
  set: (value) => emit('update:pageNo', value),
});

const pageSize = computed({
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
.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style> 