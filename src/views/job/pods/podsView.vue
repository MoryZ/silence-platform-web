<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { message, Tag } from 'ant-design-vue';
import SearchPanel from '@/components/SearchPanel.vue';
import CommonPagination from '@/components/CommonPagination.vue';
import { getJobPods } from '@/api/job/pods';
import type { JobPodParams } from '@/types/job';
import { getAllGroupConfigs } from '@/api/job/group';
import { formatDate } from '@/utils/common';

// 搜索与分页
const loading = ref(false);
const data = ref<Record<string, any>[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0 });

// 搜索面板表单（组名称改为下拉框，复用 taskView 的实现）
const searchForm = ref<{ groupName: string }>({ groupName: '' });
const fields = [
  { key: 'groupName', type: 'select' as const, label: '组名称', placeholder: '请选择组名称', options: async () => await getAllGroupConfigs() },
];

// 枚举：nodeType 1 客户端 2 服务端
const nodeTypeEnum: Record<number, { label: string; color: string }> = {
  1: { label: '客户端', color: 'green' },
  2: { label: '服务端', color: 'blue' }
};

// 列
const allColumns = ref([
  { title: '序号', dataIndex: 'index', key: 'index', width: 70 },
  { title: 'Pod ID', dataIndex: 'hostId', key: 'hostId', width: 220 },
  { title: '类型', dataIndex: 'nodeType', key: 'nodeType', type: 'enum', enumMap: nodeTypeEnum, width: 100 },
  { title: '组名称', dataIndex: 'groupName', key: 'groupName', width: 200 },
  { title: 'IP', dataIndex: 'ip', key: 'ip', width: 160 },
  { title: '路径/分区', dataIndex: 'consumerBuckets', key: 'consumerBuckets', width: 360 },
  { title: '更新时间', dataIndex: 'updatedDate', key: 'updatedDate', type: 'date', width: 180 }
]);

const tableColumns = computed(() => allColumns.value);

function abbreviateId(id: string | number, head = 4, tail = 4) {
  const s = String(id || '');
  if (s.length <= head + tail + 3) return s;
  return `${s.slice(0, head)}...${s.slice(-tail)}`;
}

// 数据加载
async function fetchData() {
  loading.value = true;
  try {
    const params: JobPodParams = {
      groupName: searchForm.value.groupName,
      pageNo: pagination.current,
      pageSize: pagination.pageSize,
      sort: ''
    };
    const res = await getJobPods(params);
    if (Array.isArray(res as any)) {
      const list = res as any as Record<string, any>[];
      data.value = list;
      pagination.total = list.length;
    } else {
      // 接口返回 { total, data }
      const page = (res as any) || {};
      data.value = page.data || [];
      pagination.total = page.total || (data.value?.length || 0);
    }
  } catch (e) {
    data.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.current = 1;
  fetchData();
}

const handleSearchFormUpdate = (newForm: any) => {
  searchForm.value = { ...newForm }
}

function handleReset() {
  searchForm.value = { groupName: '' };
  handleSearch();
}

function handlePageChange(page: number, pageSize: number) {
  pagination.current = page;
  pagination.pageSize = pageSize;
  fetchData();
}

// 初始化
fetchData();
</script>

<template>
  <div class="pods-page">
    <a-card :bordered="false">
      <SearchPanel
        :model-value="searchForm"
        :fields="fields"
        @search="handleSearch"
        @reset="handleReset"
        @update:model-value="handleSearchFormUpdate"
      />

      <CommonPagination
        :columns="tableColumns"
        :data-source="data"
        :loading="loading"
        row-key="hostId"
        :page-no="pagination.current"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        @update:pageNo="(val: number) => { pagination.current = val; fetchData(); }"
        @update:pageSize="(val: number) => { pagination.pageSize = val; pagination.current = 1; fetchData(); }"
        @change="handlePageChange"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            {{ index + 1 }}
          </template>
          <template v-else-if="column.key === 'hostId'">
            <a-tooltip :title="record.hostId">
              <span class="podid-ellipsis">{{ abbreviateId(record.hostId) }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.key === 'ip'">
            {{ record.hostIp }}:{{ record.hostPort }}
          </template>
          <template v-else-if="column.key === 'consumerBuckets'">
            <span v-if="Array.isArray(record.consumerBuckets) && record.consumerBuckets.length">
              <span>Bucket: </span>
              <template v-for="(b, i) in record.consumerBuckets.slice(0, 10)" :key="i">
                <a-tag color="green">{{ b }}</a-tag>
              </template>
              <a-popover v-if="record.consumerBuckets.length > 10">
                <template #content>
                  <div style="max-width:300px;display:flex;flex-wrap:wrap;gap:4px;">
                    <a-tag v-for="(b, idx) in record.consumerBuckets" :key="idx" color="green">{{ b }}</a-tag>
                  </div>
                </template>
                <a-tag color="green">...</a-tag>
              </a-popover>
            </span>
            <span v-else>-</span>
          </template>
        </template>
      </CommonPagination>
    </a-card>
  </div>
</template>

<style scoped>
.pods-page {
  padding: 24px;
  background: #fafbfc;
  min-height: 100vh;
}
.podid-ellipsis {
  max-width: 160px;
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
