<script setup lang="tsx">
import { ref, computed, onMounted } from 'vue';
import { Select, Table, Tag, Popover, Button, Pagination, Input } from 'ant-design-vue';

// 模拟数据和 API
const groupOptions = ref([
  { label: 'snail_job_demo_group', value: 'snail_job_demo_group' },
  { label: 'DEFAULT_SERVER', value: 'DEFAULT_SERVER' }
]);
const searchGroup = ref();
const loading = ref(false);
const dataSource = ref([
  {
    hostId: '1919412684496551936',
    nodeType: 1,
    groupName: 'DEFAULT_SERVER',
    hostIp: '172.18.0.3',
    hostPort: 17888,
    consumerBuckets: [0,1,2,3,4,5,6,7,8,9,10,11],
    contextPath: '/',
    updateDt: '2025-05-09 13:37:40'
  },
  {
    hostId: '1910581488086872064',
    nodeType: 2,
    groupName: 'snail_job_demo_group',
    hostIp: 'client9090',
    hostPort: 17889,
    consumerBuckets: [],
    contextPath: '/',
    updateDt: '2025-05-09 13:37:54'
  }
]);
const pagination = ref({ current: 1, pageSize: 10, total: 2 });

const columns = [
  { title: 'Pod ID', dataIndex: 'hostId', key: 'hostId', width: 180 },
  { title: '类型', dataIndex: 'nodeType', key: 'nodeType', width: 100, customRender: ({ record }) => {
    const color = record.nodeType === 1 ? 'blue' : 'green';
    const label = record.nodeType === 1 ? '服务端' : '客户端';
    return <Tag color={color}>{label}</Tag>;
  }},
  { title: '组名称', dataIndex: 'groupName', key: 'groupName', width: 180 },
  { title: 'IP', dataIndex: 'hostIp', key: 'hostIp', width: 120 },
  { title: 'Port', dataIndex: 'hostPort', key: 'hostPort', width: 100 },
  { title: '路径/桶', dataIndex: 'consumerBuckets', key: 'consumerBuckets', width: 350, customRender: ({ record }) => {
    if (record.nodeType === 1) {
      // 服务端
      return <span>Path: <Tag color="blue">{record.contextPath || '/'}</Tag></span>;
    } else {
      // 客户端
      const buckets = record.consumerBuckets || [];
      const showBuckets = buckets.slice(0, 10);
      return <span>Bucket: {showBuckets.map(b => <Tag color="red" key={b}>{b}</Tag>)}
        {buckets.length > 10 && (
          <Popover content={() => <div style="max-width:300px;display:flex;flex-wrap:wrap;">{buckets.map(b => <Tag color="red" key={b}>{b}</Tag>)}</div>}>
            <Tag color="red">...</Tag>
          </Popover>
        )}
      </span>;
    }
  }},
  { title: '更新时间', dataIndex: 'updateDt', key: 'updateDt', width: 180 }
];

function handleSearch() {
  // 这里应调用后端API，带上 searchGroup.value 作为 groupName 参数
  // 这里只做静态过滤演示
  if (!searchGroup.value) {
    pagination.value.total = dataSource.value.length;
    return dataSource.value;
  }
  const filtered = dataSource.value.filter(item => item.groupName === searchGroup.value);
  pagination.value.total = filtered.length;
  return filtered;
}

const filteredData = computed(() => handleSearch());

function handleRefresh() {
  // 这里应重新拉取数据
}

function handlePageChange(page: number, pageSize: number) {
  pagination.value.current = page;
  pagination.value.pageSize = pageSize;
}
</script>

<template>
  <div style="padding: 24px; background: #fafbfc; min-height: 100vh;">
    <div style="display: flex; align-items: center; margin-bottom: 16px;">
      <span style="font-weight: bold; margin-right: 12px;">组合名称</span>
      <a-select
        v-model:value="searchGroup"
        show-search
        allow-clear
        placeholder="请输入组名称"
        style="width: 300px"
        :options="groupOptions"
        @change="handleSearch"
      />
      <Button style="margin-left: 16px;" @click="handleRefresh">刷新</Button>
    </div>
    <a-table
      :columns="columns"
      :data-source="filteredData"
      :pagination="false"
      :loading="loading"
      row-key="hostId"
      bordered
      style="background: #fff;"
    />
    <div style="margin-top: 16px; text-align: right;">
      <a-pagination
        v-model:current="pagination.current"
        :total="pagination.total"
        :page-size="pagination.pageSize"
        show-size-changer
        @change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
</style>
