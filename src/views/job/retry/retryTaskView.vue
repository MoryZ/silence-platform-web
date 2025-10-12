<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { 
  retryOperationReasonRecord, 
  retryTaskTypeRecord,
  retryTaskStatusTypeRecord,
  retryStatusTypeRecord
} from '@/constants/business';
import {tagColor } from '@/utils/common';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { 
  fetchRetryTaskPageList, 
  fetchRetryTaskById, 
  fetchDeleteRetryTask, 
  fetchBatchDeleteRetryTask, 
  fetchStopRetryTask 
} from '@/api/job/retry-task';
import SearchPanel from '@/components/SearchPanel.vue';
import CommonPagination from '@/components/CommonPagination.vue';
import ColumnSettings from '@/components/ColumnSettings.vue';

// 定义类型
interface RetryTask {
  id: string;
  groupName: string;
  sceneName: string;
  retryId: string;
  taskType: number;
  taskStatus: number;
  operationReason: number;
  createdDate: string;
  responseVO?: {
    retryCount: number;
    retryStatus: number;
    bizNo: string;
    idempotentId: string;
    executorName: string;
    argsStr: string;
  };
}

interface SearchParams {
  groupName?: string;
  sceneName?: string;
  retryId?: string;
  taskStatus?: number;
  datetimeRange?: [dayjs.Dayjs, dayjs.Dayjs] | [string, string];
  createdDateStart?: string;
  createdDateEnd?: string;
}

// 响应式数据
const loading = ref(false);
const data = ref<RetryTask[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(10);
const selectedRowKeys = ref<string[]>([]);
const searchParams = ref<SearchParams>({
  datetimeRange: [
    dayjs().subtract(1, 'month').startOf('day'),
    dayjs().endOf('day')
  ]
});

// 详情相关
const detailVisible = ref(false);
const detailData = ref<RetryTask | null>(null);

// 列设置
const columnKeys = ref<string[]>([]);
const columns = ref([
  {
    key: 'id',
    title: $t('page.jobBatch.jobTask.id'),
    dataIndex: 'id',
    width: 120,
    fixed: 'left' as const,
    align: 'center' as const,
    clickable: true
  },
  {
    key: 'groupName',
    title: $t('page.retryTask.groupName'),
    dataIndex: 'groupName',
    width: 120,
    align: 'center' as const
  },
  {
    key: 'sceneName',
    title: $t('page.retryTask.sceneName'),
    dataIndex: 'sceneName',
    width: 120,
    align: 'center' as const
  },
  {
    key: 'retryId',
    title: $t('page.retryTask.retryId'),
    dataIndex: 'retryId',
    width: 120,
    align: 'center' as const
  },
  {
    key: 'taskType',
    title: $t('page.retryTask.taskType'),
    dataIndex: 'taskType',
    width: 80,
    align: 'center' as const,
    type: 'enum',
    enumMap: retryTaskTypeRecord
  },
  {
    key: 'taskStatus',
    title: $t('page.retryTask.taskStatus'),
    dataIndex: 'taskStatus',
    width: 80,
    align: 'center' as const,
    type: 'enum',
    enumMap: retryTaskStatusTypeRecord
  },
  {
    key: 'operationReason',
    title: $t('page.retryTask.operationReason'),
    dataIndex: 'operationReason',
    width: 240,
    align: 'center' as const,
    type: 'enum',
    enumMap: retryOperationReasonRecord
  },
  {
    key: 'createDt',
    title: $t('page.retryTask.createDt'),
    dataIndex: 'createdDate',
    width: 120,
    align: 'center' as const,
    type: 'date'
  },
  {
    key: 'operation',
    title: $t('common.operation'),
    dataIndex: 'operation',
    width: 120,
    align: 'center' as const,
    fixed: 'right' as const
  }
]);

// 搜索字段配置
const searchFields = [
  {
    key: 'groupName',
    label: $t('page.retryTask.groupName'),
    type: 'input' as const,
    placeholder: $t('page.retryTask.groupName')
  },
  {
    key: 'sceneName',
    label: $t('page.retryTask.sceneName'),
    type: 'input' as const,
    placeholder: $t('page.retryTask.sceneName')
  },
  {
    key: 'retryId',
    label: $t('page.retryTask.retryId'),
    type: 'input' as const,
    placeholder: $t('page.retryTask.form.retryId')
  },
  {
    key: 'taskStatus',
    label: $t('page.retryTask.taskStatus'),
    type: 'select' as const,
    placeholder: $t('page.retry.form.retryStatus'),
    options: Object.entries(retryTaskStatusTypeRecord).map(([value, label]) => ({
      label: $t(label),
      value: value
    }))
  },
  {
    key: 'datetimeRange',
    label: $t('page.common.createTime'),
    type: 'date-picker' as const,
    dateConfig: {
      showTime: true,
      format: 'YYYY-MM-DD HH:mm:ss'
    }
  }
];

// 计算属性
const visibleColumns = computed(() => {
  if (columnKeys.value.length === 0) {
    return columns.value;
  }
  return columns.value.filter(col => columnKeys.value.includes(col.key));
});

// 获取数据
async function getData() {
  loading.value = true;
  try {
    const params = {
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      ...searchParams.value
    };
    
    // 处理日期范围参数，将dayjs对象转换为Instant格式并分别映射为createdDateStart和createdDateEnd
    if (params.datetimeRange && Array.isArray(params.datetimeRange)) {
      const [start, end] = params.datetimeRange;
      if (start && end && typeof start === 'object' && typeof end === 'object' && 'format' in start && 'format' in end) {
        // 转换为Instant格式 (ISO 8601 with timezone)
        params.createdDateStart = (start as any).toISOString();
        params.createdDateEnd = (end as any).toISOString();
        // 删除原来的datetimeRange参数
        delete params.datetimeRange;
      }
    }
    
    // 只有当retryId存在时才添加到参数中
    if (history.state && history.state.retryId) {
      params.retryId = history.state.retryId;
    }
    
    const response = await fetchRetryTaskPageList(params);
    
    if (response) {
      data.value = response.data || [];
      total.value = response.total || 0;
    } 
  } catch (error) {
    message.error('获取数据失败');
  } finally {
    loading.value = false;
  }
}

// 搜索
function handleSearch() {
  pageNo.value = 1;
  getData();
}

// 重置搜索
function handleReset() {
  searchParams.value = {
    datetimeRange: [
      dayjs().subtract(1, 'month').startOf('day'),
      dayjs().endOf('day')
    ]
  };
  pageNo.value = 1;
  getData();
}

// 分页变化
function handlePageChange(newPageNo: number, newPageSize: number) {
  pageNo.value = newPageNo;
  pageSize.value = newPageSize;
  getData();
}

// 行选择
function handleRowSelection(keys: string[]) {
  selectedRowKeys.value = keys;
}

// 批量删除
async function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要删除的数据');
    return;
  }
  
  Modal.confirm({
    title: $t('common.deleteConfirm'),
    content: `确定要删除选中的 ${selectedRowKeys.value.length} 条数据吗？`,
    onOk: async () => {
      try {
        await fetchBatchDeleteRetryTask(selectedRowKeys.value.map(id => parseInt(id)));
        message.success('删除成功');
        selectedRowKeys.value = [];
        getData();
      } catch (error) {
        console.error('删除失败:', error);
        message.error('删除失败');
      }
    }
  });
}

// 单个删除
async function handleDelete(id: string) {
  Modal.confirm({
    title: $t('common.deleteConfirm'),
    content: '确定要删除这条数据吗？',
    onOk: async () => {
      try {
        await fetchDeleteRetryTask(parseInt(id));
        message.success('删除成功');
        getData();
      } catch (error) {
        console.error('删除失败:', error);
        message.error('删除失败');
      }
    }
  });
}

// 停止重试
async function handleStopRetry(id: string) {
  Modal.confirm({
    title: '确认停止',
    content: '确定要停止这个重试任务吗？',
    onOk: async () => {
      try {
        await fetchStopRetryTask(parseInt(id));
        message.success('操作成功');
        getData();
      } catch (error) {
        console.error('停止失败:', error);
        message.error('停止失败');
      }
    }
  });
}

// 查看详情
async function handleViewDetail(record: RetryTask) {
  try {
    const response = await fetchRetryTaskById(record.id);
    
    // 检查响应数据结构
    if (response && response.data) {
      detailData.value = response.data;
    } else if (response && !response.data) {
      // 如果响应直接是数据
      detailData.value = response;
    } else {
      console.error('详情API响应格式异常:', response);
      message.error('获取详情失败：响应格式异常');
      return;
    }
    
    detailVisible.value = true;
  } catch (error) {
    console.error('获取详情失败:', error);
    message.error('获取详情失败');
  }
}

// 获取标签颜色
function getTagColor(value: number | undefined): string {
  if (value === undefined) return 'default';
  return tagColor(value);
}

// 初始化
onMounted(() => {
  getData();
});
</script>

<template>
  <div class="retry-task-view">
    <!-- 搜索面板 -->
    <SearchPanel 
      v-model="searchParams" 
      :fields="searchFields"
      @search="handleSearch"
      @reset="handleReset"
    />
    
    <!-- 操作栏 -->
    <div class="action-bar">
      <div class="action-left">
        <a-button 
          type="primary" 
          danger 
          :disabled="selectedRowKeys.length === 0"
          @click="handleBatchDelete"
        >
          批量删除
        </a-button>
      </div>
      <div class="action-right">
        <ColumnSettings 
          v-model="columnKeys"
          :columns="columns"
          :default-keys="columns.map(col => col.key)"
        />
      </div>
    </div>
    
    <!-- 表格 -->
    <CommonPagination
      :columns="visibleColumns"
      :data-source="data"
      :loading="loading"
      :page-no="pageNo"
      :page-size="pageSize"
      :total="total"
      row-key="id"
      :table-props="{
        rowSelection: {
          selectedRowKeys: selectedRowKeys,
          onChange: handleRowSelection,
          getCheckboxProps: (record: RetryTask) => ({
            disabled: record.taskStatus === 1
          })
        },
        scroll: { x: 'max-content' }
      }"
      @change="handlePageChange"
      @cell-click="handleViewDetail"
    >
      <!-- 操作列插槽 -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'operation'">
          <div class="operation-buttons">
            <a-button 
              v-if="record.taskStatus === 1 || record.taskStatus === 2"
              type="link" 
              danger 
              @click="handleStopRetry(record.id)"
            >
              停止
            </a-button>
            <a-button 
              v-if="record.taskStatus !== 1 && record.taskStatus !== 2"
              type="link" 
              danger 
              @click="handleDelete(record.id)"
            >
              删除
            </a-button>
          </div>
        </template>
      </template>
    </CommonPagination>
    
    <!-- 详情抽屉 -->
    <a-drawer
      v-model:open="detailVisible"
      title="重试任务详情"
      width="700"
      :footer="null"
      @after-close="detailData = null"
    >
      <div v-if="detailData" class="detail-content">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item :label="$t('page.retryTask.groupName')" :span="2">
            {{ detailData.groupName }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('page.retryTask.sceneName')" :span="2">
            {{ detailData.sceneName }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('page.retryTask.taskStatus')" :span="1">
            <a-tag :color="getTagColor(detailData.taskStatus)">
              {{ $t(retryTaskStatusTypeRecord[detailData.taskStatus]) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('page.retryTask.taskType')" :span="1">
            <a-tag :color="getTagColor(detailData.taskType)">
              {{ $t(retryTaskTypeRecord[detailData.taskType]) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('page.retry.retryCount')" :span="1">
            {{ detailData.responseVO?.retryCount ?? '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('page.retry.retryStatus')" :span="1">
            <a-tag v-if="detailData.responseVO?.retryStatus !== undefined && detailData.responseVO?.retryStatus !== null" :color="getTagColor(detailData.responseVO.retryStatus)">
              {{ $t(retryStatusTypeRecord[detailData.responseVO.retryStatus]) }}
            </a-tag>
            <span v-else>-</span>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('page.retry.bizNo')" :span="2">
            {{ detailData.responseVO?.bizNo ?? '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('page.retry.idempotentId')" :span="2">
            {{ detailData.responseVO?.idempotentId ?? '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('page.retry.executorName')" :span="2">
            {{ detailData.responseVO?.executorName ?? '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('page.retry.argsStr')" :span="2">
            {{ detailData.responseVO?.argsStr ?? '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('page.common.createTime')">
            {{ detailData.createdDate }}
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-drawer>
  </div>
</template>

<style scoped>
.retry-task-view {
  padding: 16px;
  background: #f5f5f5;
  min-height: 100vh;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
}

.action-left {
  display: flex;
  gap: 8px;
}

.action-right {
  display: flex;
  gap: 8px;
}

.operation-buttons {
  display: flex;
  gap: 8px;
}
</style>
