<script setup lang="ts">
import { ref, computed, onMounted, watch, watchEffect, nextTick } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { $t } from '@/locales';
import dayjs from 'dayjs';
import {
  fetchDeleteRetryDeadLetter,
  fetchGetRetryDeadLetterById,
  fetchGetRetryDeadLetterPageList,
  fetchRollbackRetryDeadLetter
} from '@/api/job/retry-dead-letter';
import { getAllGroupNameList as fetchGetAllGroupNameList } from '@/api/job/group';
import { fetchGetRetrySceneList } from '@/api/job/retry-scene';
import SearchPanel from '@/components/SearchPanel.vue';
import CommonPagination from '@/components/CommonPagination.vue';
import ColumnSettings from '@/components/ColumnSettings.vue';

// 定义类型
interface DeadLetter {
  id: string;
  groupName: string;
  sceneName: string;
  idempotentId: string;
  bizNo: string;
  executorName: string;
  argsStr: string;
  createdDate: string;
  extAttrs?: string;
  taskType?: number | null;
  uniqueId?: string | null;
}

interface SearchParams {
  groupName?: string;
  sceneName?: string;
  bizNo?: string;
  idempotentId?: string;
  datetimeRange?: [dayjs.Dayjs, dayjs.Dayjs] | [string, string];
  createdDateStart?: string;
  createdDateEnd?: string;
}

// 响应式数据
const loading = ref(false);
const data = ref<DeadLetter[]>([]);
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
const detailData = ref<DeadLetter | null>(null);

// 组名称和场景名称选项
const groupNameOptions = ref<Array<{label: string, value: string}>>([]);
const sceneNameOptions = ref<Array<{label: string, value: string}>>([]);

// 列设置
const columnKeys = ref<string[]>([]);
const columns = ref([
  {
    key: 'id',
    title: $t('common.index'),
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
    key: 'idempotentId',
    title: $t('page.retryDeadLetter.idempotentId'),
    dataIndex: 'idempotentId',
    width: 120,
    align: 'center' as const
  },
  {
    key: 'bizNo',
    title: $t('page.retryDeadLetter.bizNo'),
    dataIndex: 'bizNo',
    width: 120,
    align: 'center' as const
  },
  {
    key: 'createDt',
    title: $t('page.retryDeadLetter.createDt'),
    dataIndex: 'createdDate',
    width: 120,
    align: 'center' as const,
    type: 'date'
  },
  {
    key: 'operation',
    title: $t('common.operation'),
    dataIndex: 'operation',
    width: 130,
    align: 'center' as const,
    fixed: 'right' as const
  }
]);

// 搜索字段配置
const searchFields = computed(() => [
  {
    key: 'groupName',
    label: $t('page.retryTask.groupName'),
    type: 'select' as const,
    placeholder: $t('page.retryTask.groupName'),
    options: groupNameOptions.value
  },
  {
    key: 'sceneName',
    label: $t('page.retryTask.sceneName'),
    type: 'select' as const,
    placeholder: $t('page.retryTask.sceneName'),
    options: sceneNameOptions.value
  },
  {
    key: 'bizNo',
    label: $t('page.retry.bizNo'),
    type: 'input' as const,
    placeholder: $t('page.retry.form.bizNo')
  },
  {
    key: 'idempotentId',
    label: $t('page.retry.idempotentId'),
    type: 'input' as const,
    placeholder: $t('page.retry.form.idempotentId')
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
]);

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
    
    console.log('发送API请求，参数:', params);
    const response = await fetchGetRetryDeadLetterPageList(params);
    console.log('API响应:', response);
    
    if (response) {
      data.value = response.data || [];
      total.value = response.total || 0;
      console.log('设置数据:', { data: data.value, total: total.value });
    }
  } catch (error) {
    console.error('获取数据失败:', error);
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
        await fetchDeleteRetryDeadLetter({
          ids: selectedRowKeys.value,
          groupName: searchParams.value.groupName!
        });
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

// 批量回滚
async function handleBatchRollback() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要回滚的数据');
    return;
  }
  
  Modal.confirm({
    title: $t('common.confirmRollback'),
    content: `确定要回滚选中的 ${selectedRowKeys.value.length} 条数据吗？`,
    onOk: async () => {
      try {
        await fetchRollbackRetryDeadLetter({
          ids: selectedRowKeys.value
        });
        message.success($t('common.rollbackSuccess'));
        selectedRowKeys.value = [];
        getData();
      } catch (error) {
        console.error('回滚失败:', error);
        message.error('回滚失败');
      }
    }
  });
}

// 单个删除
async function handleDelete(record: DeadLetter) {
  Modal.confirm({
    title: $t('common.deleteConfirm'),
    content: '确定要删除这条数据吗？',
    onOk: async () => {
      try {
        await fetchDeleteRetryDeadLetter({ 
          ids: [record.id], 
          groupName: record.groupName 
        });
        message.success('删除成功');
        getData();
      } catch (error) {
        console.error('删除失败:', error);
        message.error('删除失败');
      }
    }
  });
}

// 单个回滚
async function handleRollback(record: DeadLetter) {
  Modal.confirm({
    title: $t('common.confirmRollback'),
    content: '确定要回滚这条数据吗？',
    onOk: async () => {
      try {
        await fetchRollbackRetryDeadLetter({ 
          ids: [record.id], 
          groupName: record.groupName 
        });
        message.success($t('common.rollbackSuccess'));
        getData();
      } catch (error) {
        message.error('回滚失败');
      }
    }
  });
}

// 查看详情
async function handleViewDetail(record: DeadLetter) {
  try {
    const response = await fetchGetRetryDeadLetterById(record.id, record.groupName);
    
    // 检查响应数据结构
    if (response && response.data) {
      detailData.value = response.data;
    } else if (response && !response.data) {
      // 如果响应直接是数据
      detailData.value = response;
    } else {
      message.error('获取详情失败：响应格式异常');
      return;
    }
    
    detailVisible.value = true;
  } catch (error) {
    message.error('获取详情失败');
  }
}


// 获取组名称选项
async function loadGroupNameOptions() {
  try {
    const response = await fetchGetAllGroupNameList();
    if (response && response.length > 0) {
      // 接口返回的数据已经是 {value, label} 格式，直接使用
      groupNameOptions.value = response;
    }
  } catch (error) {
    console.error('获取组名称选项失败:', error);
  }
}

// 获取场景名称选项
async function loadSceneNameOptions(groupName?: string) {
  try {
    if (!groupName) {
      sceneNameOptions.value = [];
      return;
    }
    
    // 根据 value 找到对应的 label
    const groupOption = groupNameOptions.value.find((item: any) => item.value === groupName);
    const groupLabel = groupOption ? groupOption.label : groupName;
    
    const response = await fetchGetRetrySceneList({groupName: groupLabel});
    
    if (response && response.length > 0) {
      // 将场景数据转换为 {value, label} 格式
      sceneNameOptions.value = response.map((item: any) => ({
        label: item.sceneName,
        value: item.sceneName
      }));
    } else {
      sceneNameOptions.value = [];
    }
  } catch (error) {
    sceneNameOptions.value = [];
  }
}


// 监听组名称变化
watch(
  () => searchParams.value.groupName,
  (newGroupName, oldGroupName) => {
    if (newGroupName && newGroupName !== oldGroupName) {
      loadSceneNameOptions(newGroupName);
    } else if (!newGroupName) {
      sceneNameOptions.value = [];
    }
  }
);

// 初始化
onMounted(async () => {
  try {
    await loadGroupNameOptions();
    getData();
  } catch (error) {
    console.error('初始化失败:', error);
  }
});
</script>

<template>
  <div class="dead-letter-view">
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
        <a-button 
          type="primary" 
          ghost 
          :disabled="selectedRowKeys.length === 0"
          @click="handleBatchRollback"
        >
          批量回滚
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
          onChange: handleRowSelection
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
              type="link" 
              @click="handleRollback(record)"
            >
              回滚
            </a-button>
            <a-button 
              type="link" 
              danger 
              @click="handleDelete(record)"
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
      title="死信队列详情"
      width="700"
      :footer="null"
      :z-index="1001"
      @after-close="detailData = null"
    >
      <div v-if="detailData" class="detail-content">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item :label="$t('page.retry.groupName')" :span="2">
            {{ detailData.groupName }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('page.retry.sceneName')" :span="2">
            {{ detailData.sceneName }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('page.retry.bizNo')" :span="2">
            {{ detailData.bizNo }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('page.retry.idempotentId')" :span="2">
            {{ detailData.idempotentId }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('page.retry.executorName')" :span="2">
            {{ detailData.executorName }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('page.retry.argsStr')" :span="2">
            {{ detailData.argsStr }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('page.common.createTime')" :span="2">
            {{ detailData.createdDate }}
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-drawer>
  </div>
</template>

<style scoped>
.dead-letter-view {
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

.detail-content {
  min-height: 200px;
  background: #fff;
}

.detail-content .ant-descriptions {
  background: #fff;
}
</style>
