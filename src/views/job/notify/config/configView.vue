<template>
  <div class="notify-config-page">
    <a-card :bordered="false">
      <!-- 搜索面板 -->
      <SearchPanel
        v-model="searchForm"
        :fields="searchFields"
        @search="handleSearch"
        @reset="handleReset"
      />
      
      <!-- 操作工具栏 -->
      <div class="table-toolbar">
        <a-button type="primary" style="margin-right: 8px;" @click="handleAdd">
          {{ $t('common.add') }}
        </a-button>
        <a-button 
          danger 
          style="margin-right: 8px;"
          :disabled="selectedRowKeys.length === 0"
          @click="handleBatchDelete"
          v-if="hasAuth('R_ADMIN')"
        >
          {{ $t('common.batchDelete') }}
        </a-button>
        <a-button style="margin-right: 8px;" @click="getData">
          {{ $t('common.refresh') }}
        </a-button>
      </div>
      
      <!-- 表格 -->
      <CommonPagination
        title="通知配置列表"
        :columns="tableColumns"
        :data-source="data"
        :loading="loading"
        row-key="id"
        :row-selection="{ selectedRowKeys, onChange: (keys: string[]) => selectedRowKeys = keys }"
        :page-no="pagination.current"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        @update:pageNo="val => { pagination.current = val; getData(); }"
        @update:pageSize="val => { pagination.pageSize = val; pagination.current = 1; getData(); }"
        @change="handlePageChange"
        @cell-click="handleCellClick"
        @switch-change="handleSwitchChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'operation'">
            <a-space>
              <a-button type="link" @click="handleEdit(record.id)">
                {{ $t('common.edit') }}
              </a-button>
              <a-divider type="vertical" v-if="hasAuth('R_ADMIN')" />
              <a-popconfirm
                v-if="hasAuth('R_ADMIN')"
                :title="$t('common.deleteConfirm')"
                @confirm="handleDelete(record.id)"
              >
                <a-button type="link" danger>
                  {{ $t('common.delete') }}
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </CommonPagination>
      
      <!-- 操作抽屉 -->
      <a-drawer
        v-model:open="drawerVisible"
        :title="operateType === 'add' ? $t('page.notifyConfig.addNotifyConfig') : $t('page.notifyConfig.editNotifyConfig')"
        width="480"
        @close="drawerVisible = false"
      >
        <a-form
          :model="formModel"
          :rules="formRules"
          layout="vertical"
        >
          <a-form-item :label="$t('page.notifyConfig.groupName')" name="groupName">
            <a-select
              v-model:value="formModel.groupName"
              :placeholder="$t('page.notifyConfig.form.groupName')"
              :options="groupOptions"
              :filter-option="(input: string, option: any) => (option?.label as string).toLowerCase().includes(input.toLowerCase())"
              allow-clear
              show-search
              @change="groupNameUpdate"
            />
          </a-form-item>
          
          <a-form-item :label="$t('page.notifyConfig.systemTaskType')" name="systemTaskType">
            <a-select
              v-model:value="formModel.systemTaskType"
              :placeholder="$t('page.notifyConfig.form.systemTaskType')"
              :options="translateOptions(systemTaskTypeOptions)"
              @change="systemTaskTypeChange"
            />
          </a-form-item>
          
          <a-form-item :label="$t('page.notifyConfig.notifyScene')" name="notifyScene">
            <a-select
              v-model:value="formModel.notifyScene"
              :placeholder="$t('page.notifyConfig.form.notifyScene')"
              :options="notifySceneOptions"
              @change="retrySceneChange"
            />
          </a-form-item>
          
          <a-form-item :label="$t('page.notifyConfig.notifyRecipient')" name="recipientIds">
            <a-select
              v-model:value="formModel.recipientIds"
              :placeholder="$t('page.notifyConfig.form.notifyRecipient')"
              :options="notifyRecipientList"
              mode="multiple"
              allow-clear
              show-search
            />
          </a-form-item>
          
          <a-form-item :label="$t('page.notifyConfig.notifyName')" name="notifyName">
            <a-input
              v-model:value="formModel.notifyName"
              :placeholder="$t('page.notifyConfig.form.notifyName')"
              :maxlength="32"
            />
          </a-form-item>
          
          <a-row :gutter="20">
            <a-col :span="12">
              <a-form-item :label="$t('page.notifyConfig.notifyStatus')" name="notifyStatus">
                <a-radio-group v-model:value="formModel.notifyStatus">
                  <a-space>
                    <a-radio
                      v-for="item in enableStatusNumberOptions"
                      :key="item.value"
                      :value="item.value"
                    >
                      {{ $t(item.label) }}
                    </a-radio>
                  </a-space>
                </a-radio-group>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item :label="$t('page.notifyConfig.notifyThreshold')" name="notifyThreshold">
                <a-input-number
                  v-model:value="formModel.notifyThreshold"
                  :min="1"
                  :placeholder="$t('page.notifyConfig.form.notifyThreshold')"
                  :disabled="retrySceneDisable"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
          </a-row>
          
          <a-row :gutter="20">
            <a-col :span="12">
              <a-form-item :label="$t('page.notifyConfig.rateLimiterStatus')" name="rateLimiterStatus">
                <a-radio-group v-model:value="formModel.rateLimiterStatus" :disabled="retrySceneDisable">
                  <a-space>
                    <a-radio
                      v-for="item in enableStatusNumberOptions"
                      :key="item.value"
                      :value="item.value"
                    >
                      {{ $t(item.label) }}
                    </a-radio>
                  </a-space>
                </a-radio-group>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item :label="$t('page.notifyConfig.rateLimiterThreshold')" name="rateLimiterThreshold">
                <a-input-number
                  v-model:value="formModel.rateLimiterThreshold"
                  :min="1"
                  :placeholder="$t('page.notifyConfig.form.rateLimiterThreshold')"
                  :disabled="retrySceneDisable"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
          </a-row>
          
          <a-form-item :label="$t('page.notifyConfig.description')" name="description">
            <a-textarea
              v-model:value="formModel.description"
              :placeholder="$t('page.notifyConfig.form.description')"
              :rows="3"
            />
          </a-form-item>
        </a-form>
        
        <template #footer>
          <a-space :size="16">
            <a-button @click="drawerVisible = false">{{ $t('common.cancel') }}</a-button>
            <a-button type="primary" @click="handleSubmit">{{ $t('common.save') }}</a-button>
          </a-space>
        </template>
      </a-drawer>
      
      <!-- 详情抽屉 -->
      <a-drawer
        v-model:open="detailVisible"
        :title="$t('page.groupConfig.detail')"
        width="480"
        @close="detailVisible = false"
      >
        <a-descriptions :column="2" bordered>
          <a-descriptions-item :label="$t('page.notifyConfig.notifyName')" :span="2">
            {{ detailData?.notifyName }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('page.groupConfig.groupName')" :span="2">
            {{ detailData?.groupName }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('page.notifyConfig.systemTaskType')" :span="1">
            <a-tag :color="tagColor(detailData?.systemTaskType!)">
              {{ $t(systemTaskType[detailData?.systemTaskType!]) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('page.notifyConfig.notifyStatus')" :span="1">
            <a-tag :color="tagColor(detailData?.notifyStatus!)">
              {{ $t(enableStatusNumberRecord[detailData?.notifyStatus!]) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item 
            v-if="detailData?.systemTaskType === 1" 
            :label="$t('page.notifyConfig.notifyScene')" 
            :span="1"
          >
            <a-tag :color="tagColor(detailData?.notifyScene!)">
              {{ $t(retryNotifyScene[detailData?.notifyScene!]) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item 
            v-if="detailData?.systemTaskType === 3" 
            :label="$t('page.notifyConfig.notifyScene')" 
            :span="1"
          >
            <a-tag :color="tagColor(detailData?.notifyScene!)">
              {{ $t(jobNotifyScene[detailData?.notifyScene!]) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('page.notifyConfig.notifyThreshold')" :span="1">
            <a-tag :color="tagColor(detailData?.notifyThreshold!)">
              {{ detailData?.notifyThreshold }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('common.createdDate')" :span="2">
            {{ detailData?.createDt }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('page.notifyConfig.description')" :span="2">
            {{ detailData?.description }}
          </a-descriptions-item>
        </a-descriptions>
      </a-drawer>
    </a-card>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, h, reactive } from 'vue';
import { 
  Tag, 
  message
} from 'ant-design-vue';
import { 
  fetchBatchDeleteNotify, 
  fetchGetNotifyConfigList, 
  fetchUpdateNotifyStatus,
  fetchAddNotify,
  fetchEditNotify,
} from '@/api/job/notify';
import { fetchGetNotifyRecipientList } from '@/api/job/notify-recipients';
import { getJobList, getJobPage } from '@/api/job/job';
import { fetchGetRetrySceneList } from '@/api/job/retry-scene';
import { fetchGetWorkflowNameList } from '@/api/job/workflow';
import { getAllGroupNameList } from '@/api/job/group';
import { $t } from '@/locales';
import { 
  jobNotifyScene, 
  retryNotifyScene, 
  systemTaskType, 
  workflowNotifyScene,
  enableStatusNumberOptions,
  jobNotifySceneOptions,
  retryNotifySceneOptions,
  systemTaskTypeOptions,
  workflowNotifySceneOptions,
  enableStatusNumberRecord
} from '@/constants/business';
import { tagColor, translateOptions } from '@/utils/common';
import { useAppStore } from '@/stores/app';
import SearchPanel from '@/components/SearchPanel.vue';
import CommonPagination from '@/components/CommonPagination.vue';

// 定义类型接口
interface NotifyConfig {
  id: string;
  notifyName: string;
  groupName: string;
  systemTaskType: number | null;
  notifyStatus: number;
  notifyScene: number | null;
  notifyThreshold: number;
  createDt: string;
  description: string;
}

interface NotifySearchParams {
  pageNo: number;
  pageSize: number;
  sort: string;
  groupName: string | null;
  notifyStatus: number | null;
  notifyScene: number | null;
  notifyName: string | null;
  systemTaskType: number | null;
}

const appStore = useAppStore();

// 权限检查函数（简化版本）
const hasAuth = (permission: string): boolean => {
  // 这里应该根据实际的权限系统来实现
  return true;
};

// 布尔状态管理（简化版本）
const useBoolean = (initialValue: boolean) => {
  const bool = ref(initialValue);
  const setTrue = () => { bool.value = true; };
  const setFalse = () => { bool.value = false; };
  return { bool, setTrue, setFalse };
};

// 搜索表单配置
const searchForm = ref<NotifySearchParams>({
  pageNo: 1,
  pageSize: 10,
  sort: '-createdDate',
  groupName: null,
  notifyStatus: null,
  notifyScene: null,
  notifyName: null,
  systemTaskType: null
});

// 组名下拉选项
const groupOptions = ref<{ label: string; value: string }[]>([]);

// 搜索字段配置
const searchFields = [
  { 
    key: 'notifyName', 
    type: 'input' as const, 
    label: $t('page.notifyConfig.notifyName'), 
    placeholder: $t('page.notifyConfig.form.notifyName') 
  },
  { 
    key: 'groupName', 
    type: 'select' as const, 
    label: $t('page.notifyConfig.groupName'), 
    placeholder: $t('page.notifyConfig.form.groupName'),
    // SearchPanel 的异步 options 需要 Promise
    options: async () => groupOptions.value
  },
  { 
    key: 'systemTaskType', 
    type: 'select' as const, 
    label: $t('page.notifyConfig.systemTaskType'), 
    placeholder: $t('page.notifyConfig.form.systemTaskType'),
    options: [
      { label: $t(systemTaskType[1]), value: '1' },
      { label: $t(systemTaskType[3]), value: '3' },
      { label: $t(systemTaskType[4]), value: '4' }
    ]
  },
  { 
    key: 'notifyStatus', 
    type: 'select' as const, 
    label: $t('page.notifyConfig.notifyStatus'), 
    placeholder: $t('page.notifyConfig.notifyStatus'),
    options: [
      { label: $t('common.enabled'), value: '1' },
      { label: $t('common.disabled'), value: '0' }
    ]
  }
];

// 表格列配置
const tableColumns = [
  { title: $t('common.index'), dataIndex: 'id', key: 'id', width: 64, align: 'center' },
  { 
    title: $t('page.notifyConfig.notifyName'), 
    dataIndex: 'notifyName', 
    key: 'notifyName', 
    width: 120,
    clickable: true
  },
  { title: $t('page.notifyConfig.groupName'), dataIndex: 'groupName', key: 'groupName', width: 120 },
  { 
    title: $t('page.notifyConfig.systemTaskType'), 
    dataIndex: 'systemTaskType', 
    key: 'systemTaskType', 
    width: 120,
    type: 'enum',
    enumMap: {
      1: { label: $t(systemTaskType[1]), color: 'blue' },
      3: { label: $t(systemTaskType[3]), color: 'green' },
      4: { label: $t(systemTaskType[4]), color: 'orange' }
    }
  },
  { 
    title: $t('page.notifyConfig.notifyStatus'), 
    dataIndex: 'notifyStatus', 
    key: 'notifyStatus', 
    width: 120,
    type: 'switch'
  },
  { 
    title: $t('page.notifyConfig.notifyScene'), 
    dataIndex: 'notifyScene', 
    key: 'notifyScene', 
    width: 160,
    customRender: ({ text, record }: { text: any; record: NotifyConfig }) => {
      if (text === null) return null;
      
      let label = '';
      if (record.systemTaskType === 1) {
        label = $t(retryNotifyScene[text]);
      } else if (record.systemTaskType === 3) {
        label = $t(jobNotifyScene[text]);
      } else if (record.systemTaskType === 4) {
        label = $t(workflowNotifyScene[text]);
      }
      
      return label ? h(Tag, { color: tagColor(text) }, () => label) : null;
    }
  },
  { title: $t('page.notifyConfig.notifyThreshold'), dataIndex: 'notifyThreshold', key: 'notifyThreshold', width: 120 },
  { title: $t('common.createDt'), dataIndex: 'createDt', key: 'createDt', width: 120, type: 'date' },
  { title: $t('page.notifyConfig.description'), dataIndex: 'description', key: 'description', width: 120 },
  { title: $t('common.operation'), key: 'operation', width: 130, fixed: 'right', align: 'center' }
];

// 数据管理
const data = ref<NotifyConfig[]>([]);
const loading = ref(false);
const pagination = reactive({ current: 1, pageSize: 10, total: 0 });
const selectedRowKeys = ref<string[]>([]);

const getData = async () => {
  loading.value = true;
  try {
    const params: any = {
      pageNo: pagination.current,
      pageSize: pagination.pageSize,
      sort: '-createdDate',
      groupName: searchForm.value.groupName,
      notifyStatus: searchForm.value.notifyStatus,
      notifyScene: searchForm.value.notifyScene,
      notifyName: searchForm.value.notifyName,
      systemTaskType: searchForm.value.systemTaskType
    };
    const response: any = await fetchGetNotifyConfigList(params);
    data.value = response?.data || [];
    pagination.total = response?.total || 0;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    data.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

const resetSearchParams = () => {
  searchForm.value = {
    pageNo: 1,
    pageSize: 10,
    sort: '-createdDate',
    groupName: null,
    notifyStatus: null,
    notifyScene: null,
    notifyName: null,
    systemTaskType: null
  };
};

/** 详情页属性数据 */
const detailData = ref<NotifyConfig | null>(null);
/** 详情页可见状态 */
const { bool: detailVisible, setTrue: openDetail } = useBoolean(false);

// 事件处理函数
const handleSearch = () => {
  pagination.current = 1;
  getData();
};

const handleReset = () => {
  resetSearchParams();
  handleSearch();
};

const handlePageChange = (pageNo: number, pageSize: number) => {
  pagination.current = pageNo;
  pagination.pageSize = pageSize;
  getData();
};

const handleCellClick = (record: NotifyConfig, column: any) => {
  if (column.key === 'notifyName') {
    detailData.value = record;
    openDetail();
  }
};

const handleSwitchChange = async (checked: boolean, record: NotifyConfig, column: any, done: () => void) => {
  try {
    const notifyStatus = checked ? 1 : 0;
    await fetchUpdateNotifyStatus(record.id, notifyStatus);
    record.notifyStatus = notifyStatus;
    message.success($t('common.updateSuccess'));
  } catch (error) {
    console.error('Failed to update status:', error);
    message.error($t('common.updateFailed'));
  } finally {
    done();
  }
};

// 表格操作相关状态
const drawerVisible = ref(false);
const operateType = ref<'add' | 'edit'>('add');
const editingData = ref<NotifyConfig | null>(null);

// 操作抽屉相关数据
const notifyRecipientList = ref<{ label: string; value: number | string }[]>([]);
const retryScenes = ref<any[]>([]);
const jobs = ref<any[]>([]);
const workflows = ref<any[]>([]);
const retryNotifyStatusDisable = ref(true);
const retrySceneDisable = ref(true);
const notifySceneOptions = ref<any[]>([]);

// 表单数据
const formModel = reactive({
  id: '',
  groupName: null as string | null,
  recipientIds: [] as any[],
  systemTaskType: null as number | null,
  notifyName: '',
  notifyStatus: 1,
  notifyScene: null as number | null,
  notifyThreshold: 16,
  rateLimiterStatus: 1,
  rateLimiterThreshold: 100,
  description: ''
});

// 表单验证规则
const formRules = {
  groupName: [{ required: true, message: $t('common.pleaseInput'), trigger: 'change' }],
  systemTaskType: [{ required: true, message: $t('common.pleaseSelect'), trigger: 'change' }],
  notifyName: [{ required: true, message: $t('common.pleaseInput'), trigger: 'blur' }],
  notifyStatus: [{ required: true, message: $t('common.pleaseSelect'), trigger: 'change' }],
  notifyScene: [{ required: true, message: $t('common.pleaseSelect'), trigger: 'change' }],
  recipientIds: [{ required: true, message: $t('common.pleaseSelect'), trigger: 'change' }],
  rateLimiterStatus: [{ required: true, message: $t('common.pleaseSelect'), trigger: 'change' }],
  notifyThreshold: [{ required: true, message: $t('common.pleaseInput'), trigger: 'blur' }]
};

// 获取通知接收者列表
const getNotifyRecipientList = async () => {
  try {
    const res: any = await fetchGetNotifyRecipientList();
    // 兼容后端返回 {label, value}
    notifyRecipientList.value = (res?.data || res || []).map((it: any) => ({
      label: it.label ?? it.name ?? String(it.value ?? it.id),
      value: it.value ?? it.id
    }));
  } catch (error) {
    console.error('Failed to fetch notify recipient list:', error);
  }
};

// 系统任务类型变化处理
const systemTaskTypeChange = async (value: number | null) => {
  
  if (value === 1) {
    const res = await fetchGetRetrySceneList({ groupName: formModel.groupName });
    retryScenes.value = res || [];
    const translatedOptions = translateOptions(retryNotifySceneOptions);
    console.log('translated retry options:', translatedOptions);
    notifySceneOptions.value = translatedOptions;
  } else if (value === 3) {
    const res = await getJobPage({ 
      groupName: formModel.groupName || '',
      pageNo: 1,
      pageSize: 1000,
      sort: '-createdDate',
      jobName: '',
      jobStatus: '',
      ownerId: '',
      executorInfo: ''
    });
    jobs.value = (res.data || []).map((i: any) => {
      i.id = String(i.id);
      return i;
    });
    const translatedOptions = translateOptions(jobNotifySceneOptions);
    console.log('translated job options:', translatedOptions);
    notifySceneOptions.value = translatedOptions;
  } else if (value === 4) {
    const res = await fetchGetWorkflowNameList({ groupName: formModel.groupName });
    workflows.value = (res || []).map((i: any) => {
      i.id = String(i.id);
      return i;
    });
    const translatedOptions = translateOptions(workflowNotifySceneOptions);
    console.log('translated workflow options:', translatedOptions);
    notifySceneOptions.value = translatedOptions;
  }
  
  console.log('Final notifySceneOptions.value:', notifySceneOptions.value);
  
  await retrySceneChange(formModel.notifyScene);
  let notifySceneEmpty = false;
  notifySceneOptions.value.forEach((i: any) => {
    if (i.value === formModel.notifyScene) {
      notifySceneEmpty = true;
    }
  });
  if (!notifySceneEmpty) {
    formModel.notifyScene = null;
  }
};

// 重试场景变化处理
const retrySceneChange = (value: any) => {
  retrySceneDisable.value = !(formModel.systemTaskType === 1 && (value === 1 || value === 2 || value === 5 || value === 6));
  if (value === 7) {
    formModel.notifyThreshold = 0;
  }
};

// 组名更新处理
// 当 label-in-value 生效时，回调参数为 { label, value }
const groupNameUpdate = (val: any) => {
  handleUpdateModelWhenEdit();
  // val 即选中的 value（后端返回的 value: '1' | '2'），需要找到 label 展示
  const selected = groupOptions.value.find(opt => opt.value === val);
  formModel.groupName = selected ? selected.label : (val || null);
  if (formModel.groupName) {
    systemTaskTypeChange(1);
    retrySceneChange(1);
  }
};

// 更新表单数据（编辑时）
const handleUpdateModelWhenEdit = () => {
  if (operateType.value === 'add') {
    Object.assign(formModel, {
      id: '',
      groupName: null,
      recipientIds: [],
      systemTaskType: null,
      notifyName: '',
      notifyStatus: 1,
      notifyScene: null,
      notifyThreshold: 16,
      rateLimiterStatus: 1,
      rateLimiterThreshold: 100,
      description: ''
    });
    retrySceneDisable.value = true;
    retryNotifyStatusDisable.value = true;
    notifySceneOptions.value = [];
    return;
  }

  if (operateType.value === 'edit' && editingData.value) {
    Object.assign(formModel, editingData.value);
    systemTaskTypeChange(formModel.systemTaskType);
    retrySceneChange(formModel.notifyScene);
  }
};

// 提交表单
const handleSubmit = async () => {
  try {
    if (operateType.value === 'add') {
      const {
        groupName,
        recipientIds,
        systemTaskType,
        notifyName,
        notifyStatus,
        notifyScene,
        notifyThreshold,
        rateLimiterStatus,
        rateLimiterThreshold,
        description
      } = formModel;
      await fetchAddNotify({
        groupName,
        recipientIds,
        systemTaskType,
        notifyName,
        notifyStatus,
        notifyScene,
        notifyThreshold,
        rateLimiterStatus,
        rateLimiterThreshold,
        description
      });
    } else {
      const {
        id,
        groupName,
        recipientIds,
        notifyStatus,
        notifyName,
        systemTaskType,
        notifyScene,
        notifyThreshold,
        rateLimiterStatus,
        rateLimiterThreshold,
        description
      } = formModel;
      await fetchEditNotify({
        id,
        groupName,
        recipientIds,
        systemTaskType,
        notifyName,
        notifyStatus,
        notifyScene,
        notifyThreshold,
        rateLimiterStatus,
        rateLimiterThreshold,
        description
      });
    }
    
    message.success($t('common.updateSuccess'));
    drawerVisible.value = false;
    getData();
  } catch (error) {
    console.error('Failed to submit:', error);
    message.error($t('common.updateFailed'));
  }
};

// 表格操作函数
const handleAdd = () => {
  operateType.value = 'add';
  editingData.value = null;
  handleUpdateModelWhenEdit();
  getNotifyRecipientList();
  drawerVisible.value = true;
};

const handleEdit = (id: string) => {
  operateType.value = 'edit';
  editingData.value = data.value.find((item: NotifyConfig) => item.id === id) || null;
  handleUpdateModelWhenEdit();
  getNotifyRecipientList();
  drawerVisible.value = true;
};

const handleBatchDelete = async () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning($t('common.pleaseSelectData'));
    return;
  }
  
  try {
    await fetchBatchDeleteNotify(selectedRowKeys.value);
    selectedRowKeys.value = [];
    message.success($t('common.deleteSuccess'));
    getData();
  } catch (error) {
    console.error('Failed to batch delete:', error);
    message.error($t('common.deleteFailed'));
  }
};

const handleDelete = async (id: string) => {
  try {
    await fetchBatchDeleteNotify([id]);
    message.success($t('common.deleteSuccess'));
    getData();
  } catch (error) {
    console.error('Failed to delete:', error);
    message.error($t('common.deleteFailed'));
  }
};

// 初始化数据
getData();

// 加载组名下拉
async function loadGroupOptions() {
  try {
    const res: any = await getAllGroupNameList({ pageNo: 1, pageSize: 1000 } as any);
    const raw = res?.data || res || [];
    const list = raw.map((item: any) => ({
      label: item.label ?? item.groupName ?? item.name ?? String(item.value ?? item.id ?? item),
      value: item.value ?? item.id ?? item.groupName ?? item.name ?? String(item)
    }));
    groupOptions.value = list;
  } catch (e) {
    groupOptions.value = [];
  }
}
loadGroupOptions();
</script>

<style scoped>
.notify-config-page {
  padding: 16px;
}

.table-toolbar {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}
</style>
