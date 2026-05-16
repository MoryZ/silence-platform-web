<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { $t } from '@/locales';
import { enableStatusNumberRecord, triggerTypeRecord } from '@/constants/business';
import { fetchGetWorkflowPageList, fetchBatchDeleteWorkflow } from '@/api/job/workflow';
import { formatDate } from '@/utils/common';
import WorkflowSearch from './modules/workflow-search.vue';
import WorkflowTriggerModal from './modules/workflow-trigger-modal.vue';
import WorkflowFormModal from './modules/workflow-form-modal.vue';

const router = useRouter();
type FormMode = 'add' | 'edit' | 'detail' | 'copy';

// 数据状态
const data = ref<any[]>([]);
const loading = ref(false);
const checkedRowKeys = ref<string[]>([]);
const searchParams = ref({
  pageNo: 1,
  pageSize: 10,
  workflowName: null,
  groupName: null,
  workflowStatus: null
});

// 触发模态框状态
const triggerVisible = ref(false);
const triggerData = ref<any>(null);

const formModalState = reactive<{
  visible: boolean;
  mode: FormMode;
  recordId: string | null;
}>({
  visible: false,
  mode: 'add',
  recordId: null
});

// 分页配置
const mobilePagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true
});

// 列配置
const columns = ref([
  {
    type: 'selection',
    align: 'center',
    width: 48
  },
  {
    key: 'id',
    dataIndex: 'id',
    title: $t('common.index'),
    width: 120,
    align: 'center'
  },
  {
    key: 'workflowName',
    dataIndex: 'workflowName',
    title: $t('page.workflow.workflowName'),
    width: 200,
    ellipsis: {
      tooltip: true
    }
  },
  {
    key: 'groupName',
    dataIndex: 'groupName',
    title: $t('page.workflow.groupName'),
    width: 120
  },
  {
    key: 'nextTriggerAt',
    dataIndex: 'nextTriggerAt',
    title: $t('page.workflow.nextTriggerAt'),
    width: 120
  },
  {
    key: 'workflowStatus',
    dataIndex: 'workflowStatus',
    title: $t('page.workflow.workflowStatus'),
    width: 120
  },
  {
    key: 'triggerType',
    dataIndex: 'triggerType',
    title: $t('page.workflow.triggerType'),
    width: 120
  },
  {
    key: 'triggerInterval',
    dataIndex: 'triggerInterval',
    title: $t('page.workflow.triggerInterval'),
    width: 120
  },
  {
    key: 'executorTimeout',
    dataIndex: 'executorTimeout',
    title: $t('page.workflow.executorTimeout'),
    width: 120
  },
  {
    key: 'updatedDate',
    dataIndex: 'updatedDate',
    title: $t('page.workflow.updateDt'),
    width: 120
  },
  {
    key: 'operation',
    title: $t('common.operation'),
    width: 260,
    align: 'center'
  }
]);

// 获取数据
async function getData() {
  loading.value = true;
  try {
    const response = await fetchGetWorkflowPageList(searchParams.value);
    // request 拦截器已返回 payload.data，这里直接按分页对象解析
    const pageData = response ?? {};
    const list = pageData?.items ?? pageData?.data ?? [];
    data.value = Array.isArray(list) ? list : [];
    mobilePagination.value.total = Number(pageData?.total ?? data.value.length ?? 0);
  } catch (error) {
    console.error('获取数据失败:', error);
    data.value = [];
    mobilePagination.value.total = 0;
  } finally {
    loading.value = false;
  }
}

// 重置搜索参数
function resetSearchParams() {
  searchParams.value = {
    pageNo: 1,
    pageSize: 10,
    workflowName: null,
    groupName: null,
    workflowStatus: null
  };
  getData();
}

async function handleBatchDelete() {
  const { error } = await fetchBatchDeleteWorkflow(checkedRowKeys.value);
  if (error) return;
  message.success('删除成功');
  getData();
}

async function handleDelete(id: string) {
  const { error } = await fetchBatchDeleteWorkflow([id]);
  if (error) return;
  message.success('删除成功');
  getData();
}

function openForm(mode: FormMode, id?: string) {
  formModalState.mode = mode;
  formModalState.recordId = id ?? null;
  formModalState.visible = true;
}

const edit = (id: string) => openForm('edit', id);
const handleAdd = () => openForm('add');
const detail = (id: string) => openForm('detail', id);
const copy = (id: string) => openForm('copy', id);

async function execute(row: any) {
  triggerData.value = row;
  triggerVisible.value = true;
}

function goToBatch(workflowId: string) {
  router.push({ 
    path: '/workflow/batch', 
    state: { workflowId, workflowName: data.value.find(item => item.id === workflowId)?.workflowName } 
  });
}

function getTriggerTypeColor(triggerType: number): string {
  const colorMap: Record<number, string> = {
    2: 'blue',
    3: 'green',
    99: 'orange'
  };
  return colorMap[triggerType] || 'default';
}

function getTriggerTypeLabel(triggerType: number): string {
  const key = triggerTypeRecord[triggerType];
  return key ? $t(key) : '-';
}

function getWorkflowStatusLabel(status: number | boolean | null | undefined): string {
  const numeric = typeof status === 'boolean' ? Number(status) : Number(status);
  const key = enableStatusNumberRecord[numeric as 0 | 1];
  return key ? $t(key) : '-';
}

function formatDateTime(value: string | number | Date | null | undefined): string {
  if (!value) return '-';
  return formatDate(value, 'YYYY-MM-DD HH:mm:ss');
}

function handleMoreAction(action: string, id: string) {
  if (action === 'copy') {
    copy(id);
    return;
  }
  if (action === 'batchList') {
    goToBatch(id);
    return;
  }
  if (action === 'delete') {
    handleDelete(id);
  }
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <!-- 搜索组件 -->
    <WorkflowSearch v-model:model="searchParams" @reset="resetSearchParams" @search="getData" />
    
    <!-- 操作栏 -->
    <div class="action-bar">
      <div class="action-left">
        <a-button type="primary" @click="handleAdd">{{ $t('common.add') }}</a-button>
        <a-button 
          type="primary" 
          danger 
          :disabled="checkedRowKeys.length === 0"
          @click="handleBatchDelete"
        >
          {{ $t('common.batchDelete') }}
        </a-button>
        <a-button @click="getData">{{ $t('common.refresh') }}</a-button>
      </div>
    </div>
    
    <!-- 数据表格 -->
    <a-table
      v-model:selected-row-keys="checkedRowKeys"
      :columns="columns"
      :data-source="data"
      :loading="loading"
      :pagination="mobilePagination"
      row-key="id"
      :scroll="{ x: 1300 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'id'">
          {{ record.id }}
        </template>

        <template v-if="column.key === 'workflowName'">
          <a-button type="link" @click="detail(record.id)">
            {{ record.workflowName }}
          </a-button>
        </template>
        
        <template v-else-if="column.key === 'triggerType'">
          <a-tag v-if="record.triggerType" :color="getTriggerTypeColor(record.triggerType)">
            {{ getTriggerTypeLabel(record.triggerType) }}
          </a-tag>
        </template>

        <template v-else-if="column.key === 'workflowStatus'">
          <a-tag :color="Number(record.workflowStatus) === 1 ? 'green' : 'default'">
            {{ getWorkflowStatusLabel(record.workflowStatus) }}
          </a-tag>
        </template>

        <template v-else-if="column.key === 'updatedDate'">
          {{ formatDateTime(record.updatedDate || record.updateDt) }}
        </template>
        
        <template v-else-if="column.key === 'operation'">
          <div class="operation-actions">
            <a-button type="link" @click="edit(record.id)">
              {{ $t('common.edit') }}
            </a-button>
            <a-divider type="vertical" />
            <a-button type="link" danger @click="execute(record)">
              {{ $t('common.execute') }}
            </a-button>
            <a-divider type="vertical" />
            <a-dropdown :trigger="['click']" placement="bottomRight">
              <template #overlay>
                <a-menu @click="({ key }) => handleMoreAction(String(key), record.id)">
                  <a-menu-item key="copy">
                    {{ $t('common.copy') }}
                  </a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="batchList">
                    {{ $t('common.batchList') }}
                  </a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="delete">
                    {{ $t('common.delete') }}
                  </a-menu-item>
                </a-menu>
              </template>
              <a-button type="link">
                {{ $t('common.more') }}
              </a-button>
            </a-dropdown>
          </div>
        </template>
      </template>
    </a-table>
    
    <!-- 触发模态框 -->
    <WorkflowTriggerModal v-model:visible="triggerVisible" :row-data="triggerData" @submitted="getData" />
    <WorkflowFormModal
      v-model:visible="formModalState.visible"
      :mode="formModalState.mode"
      :record-id="formModalState.recordId"
      @submitted="getData"
    />
  </div>
</template>

<style scoped>
.search-panel {
  background: #fff;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 16px;
}

.action-left {
  display: flex;
  gap: 8px;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.gap-8px {
  gap: 8px;
}

.operation-actions {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}
</style>
