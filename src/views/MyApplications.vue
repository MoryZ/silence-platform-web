<template>
  <div class="my-applications">
    <a-card title="我的申请" :loading="loading">
      <template #extra>
        <a-button @click="loadData" :loading="loading">刷新</a-button>
      </template>

      <!-- 按权限类型筛选 -->
      <a-tabs v-model:activeKey="activeTab" @change="handleTabChange" style="margin-bottom: 16px;">
        <a-tab-pane key="" tab="全部" />
        <a-tab-pane key="CREATE_TOPIC" tab="创建Topic" />
        <a-tab-pane key="PRODUCE" tab="生产权限" />
        <a-tab-pane key="CONSUME" tab="消费权限" />
      </a-tabs>

      <a-table
        :dataSource="list"
        :columns="columns"
        :rowKey="(record: PermissionRequest) => record.id"
        :pagination="{ pageSize: 10 }"
        :expandable="expandableConfig"
        bordered
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'permissionCode'">
            {{ permissionCodeLabel(record.permissionCode) }}
          </template>
          <template v-if="column.key === 'topicName'">
            {{ record.permissionCode === 'CREATE_TOPIC' ? (record.topicName || '-') : '—' }}
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="statusColor(record.status)">{{ requestStatusLabel(record.status) }}</a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="openDetail(record)">详情</a-button>
              <a-button
                v-if="record.permissionCode === 'CREATE_TOPIC' && record.status === 'APPROVED'"
                type="link"
                size="small"
                @click="goTopicList"
              >
                去 Topic 列表查看
              </a-button>
            </a-space>
          </template>
        </template>

        <template #expandedRowRender="{ record }">
          <a-descriptions
            v-if="record.permissionCode === 'CREATE_TOPIC'"
            :column="2"
            size="small"
            bordered
          >
            <a-descriptions-item label="Topic 名称">{{ record.topicName || '-' }}</a-descriptions-item>
            <a-descriptions-item label="消息类型">{{ record.messageType || '-' }}</a-descriptions-item>
            <a-descriptions-item label="读队列数">{{ record.readQueueNums ?? '-' }}</a-descriptions-item>
            <a-descriptions-item label="写队列数">{{ record.writeQueueNums ?? '-' }}</a-descriptions-item>
            <a-descriptions-item label="申请理由" :span="2">{{ record.requestReason || '-' }}</a-descriptions-item>
          </a-descriptions>
          <span v-else>该类型申请无配置快照</span>
        </template>
      </a-table>
    </a-card>

    <!-- 详情抽屉 -->
    <a-drawer
      v-model:open="detailVisible"
      title="申请详情"
      :width="520"
      @close="detailVisible = false"
    >
      <a-descriptions :column="1" bordered size="small" v-if="detail">
        <a-descriptions-item label="申请单ID">{{ detail.id }}</a-descriptions-item>
        <a-descriptions-item label="申请人">{{ detail.applyName }}</a-descriptions-item>
        <a-descriptions-item label="权限类型">{{ permissionCodeLabel(detail.permissionCode) }}</a-descriptions-item>
        <a-descriptions-item label="申请理由">{{ detail.requestReason || '-' }}</a-descriptions-item>
        <a-descriptions-item label="状态">{{ requestStatusLabel(detail.status) }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ detail.createdDate || '-' }}</a-descriptions-item>

        <a-descriptions-item v-if="detail.permissionCode === 'CREATE_TOPIC'" label="Topic 配置快照">
          <a-descriptions :column="1" size="small" style="margin-top: 4px;">
            <a-descriptions-item label="Topic 名称">{{ detail.topicName || '-' }}</a-descriptions-item>
            <a-descriptions-item label="读队列数">{{ detail.readQueueNums ?? '-' }}</a-descriptions-item>
            <a-descriptions-item label="写队列数">{{ detail.writeQueueNums ?? '-' }}</a-descriptions-item>
            <a-descriptions-item label="消息类型">{{ detail.messageType || '-' }}</a-descriptions-item>
          </a-descriptions>
        </a-descriptions-item>
      </a-descriptions>
      <a-empty v-else description="加载中或暂无数据" />
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { getMyPermissionRequests, getPermissionRequestDetail } from '@/api/mq/permission';
import {
  PERMISSION_CODE_LABEL,
  REQUEST_STATUS_LABEL,
  type PermissionRequest
} from '@/types/mq/permission';

const router = useRouter();

const loading = ref(false);
const list = ref<PermissionRequest[]>([]);
const activeTab = ref<string>('');

const detailVisible = ref(false);
const detail = ref<PermissionRequest | null>(null);

// 动态查找 Topic 列表路由（路由由后端菜单生成，运行时定位）
const topicRoutePath = ref<string>('/mq/topic');
const resolveTopicRoute = () => {
  const route = router
    .getRoutes()
    .find((r) => typeof r.name === 'string' && r.name.toLowerCase().includes('topic'));
  if (route && route.path) {
    topicRoutePath.value = route.path;
  }
};

const columns = [
  { title: '申请单ID', dataIndex: 'id', key: 'id', width: 100 },
  { title: '申请人', dataIndex: 'applyName', key: 'applyName', width: 120 },
  { title: '类型', dataIndex: 'permissionCode', key: 'permissionCode', width: 120 },
  { title: 'Topic', dataIndex: 'topicName', key: 'topicName', width: 140 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdDate', key: 'createdDate', width: 180 },
  { title: '操作', key: 'action', width: 160 }
];

const expandableConfig = {
  expandedRowKeys: [] as (number | string)[],
  onExpand: (expanded: boolean, record: PermissionRequest) => {
    expandableConfig.expandedRowKeys = expanded
      ? [record.id]
      : expandableConfig.expandedRowKeys.filter((k) => k !== record.id);
  }
};

const permissionCodeLabel = (code?: string) =>
  (code && (PERMISSION_CODE_LABEL as Record<string, string>)[code]) || code || '-';
const requestStatusLabel = (s?: string) =>
  (s && (REQUEST_STATUS_LABEL as Record<string, string>)[s]) || s || '-';
const statusColor = (s?: string) => {
  if (s === 'APPROVED') return 'success';
  if (s === 'REJECTED') return 'error';
  return 'processing';
};

const loadData = async () => {
  loading.value = true;
  try {
    const res = await getMyPermissionRequests({ pageNo: 1, pageSize: 100 });
    let rows: PermissionRequest[] = [];
    if (Array.isArray(res)) {
      rows = res;
    } else if (res && Array.isArray((res as any).data)) {
      rows = (res as any).data;
    } else if (res && Array.isArray((res as any).records)) {
      rows = (res as any).records;
    }
    // 前端按 permissionCode 筛选（后端接口未提供该筛选参数）
    list.value = activeTab.value
      ? rows.filter((r) => r.permissionCode === activeTab.value)
      : rows;
  } catch (error: any) {
    console.error('获取我的申请失败:', error);
    message.error(error.message || '获取我的申请失败');
  } finally {
    loading.value = false;
  }
};

const handleTabChange = () => {
  loadData();
};

const openDetail = async (record: PermissionRequest) => {
  detailVisible.value = true;
  detail.value = null;
  try {
    const res = await getPermissionRequestDetail(record.id);
    detail.value = res;
  } catch (error: any) {
    console.error('获取申请详情失败:', error);
    message.error(error.message || '获取申请详情失败');
  }
};

const goTopicList = () => {
  router.push(topicRoutePath.value);
};

onMounted(() => {
  resolveTopicRoute();
  loadData();
});
</script>

<style scoped>
.my-applications {
  padding: 20px;
}
</style>
