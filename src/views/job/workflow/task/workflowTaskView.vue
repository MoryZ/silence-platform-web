<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { $t } from '@/locales';
import { triggerTypeRecord } from '@/constants/business';
import { fetchGetWorkflowPageList, fetchBatchDeleteWorkflow } from '@/api/job/workflow';
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
    title: $t('common.index'),
    width: 120,
    align: 'center'
  },
  {
    key: 'workflowName',
    title: $t('page.workflow.workflowName'),
    width: 200,
    ellipsis: {
      tooltip: true
    }
  },
  {
    key: 'groupName',
    title: $t('page.workflow.groupName'),
    width: 120
  },
  {
    key: 'nextTriggerAt',
    title: $t('page.workflow.nextTriggerAt'),
    width: 120
  },
  {
    key: 'workflowStatus',
    title: $t('page.workflow.workflowStatus'),
    width: 120
  },
  {
    key: 'triggerType',
    title: $t('page.workflow.triggerType'),
    width: 120
  },
  {
    key: 'triggerInterval',
    title: $t('page.workflow.triggerInterval'),
    width: 120
  },
  {
    key: 'executorTimeout',
    title: $t('page.workflow.executorTimeout'),
    width: 120
  },
  {
    key: 'updateDt',
    title: $t('page.workflow.updateDt'),
    width: 120
  },
  {
    key: 'operation',
    title: $t('common.operation'),
    width: 200,
    align: 'center'
  }
]);

// 获取数据
async function getData() {
  loading.value = true;
  try {
    const response = await fetchGetWorkflowPageList(searchParams.value);
    if (response && response.data) {
      data.value = response.data.items || response.data || [];
      mobilePagination.value.total = response.data.total || 0;
    }
  } catch (error) {
    console.error('获取数据失败:', error);
  } finally {
    loading.value = false;
  }
}

// 重置搜索参数
function resetSearchParams() {
  searchParams.value = {
    page: 1,
    size: 10,
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
  return triggerTypeRecord[triggerType] || '';
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
        
        <template v-else-if="column.key === 'operation'">
          <div class="flex-center gap-8px">
            <a-button type="link" @click="edit(record.id)">
              {{ $t('common.edit') }}
            </a-button>
            <a-divider type="vertical" />
            <a-button type="link" danger @click="execute(record)">
              {{ $t('common.execute') }}
            </a-button>
            <a-divider type="vertical" />
            <a-dropdown>
              <template #overlay>
                <a-menu>
                  <a-menu-item key="copy" @click="copy(record.id)">
                    {{ $t('common.copy') }}
                  </a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="batchList" @click="goToBatch(record.id)">
                    {{ $t('common.batchList') }}
                  </a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="delete" @click="handleDelete(record.id)">
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
</style>
