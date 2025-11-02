<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { InfoCircleOutlined, FullscreenOutlined, FullscreenExitOutlined, CloseOutlined } from '@ant-design/icons-vue';
import { $t } from '@/locales';
import { tagColor } from '@/utils/common';
import {
  DelayLevel,
  backOffRecord,
  blockStrategyRecord,
  enableStatusNumberRecord,
  routeKeyRecord,
  cbTriggerTypeRecord
} from '@/constants/business';

// 创建带颜色的枚举映射
const backOffRecordWithColor = {
  4: { label: 'page.retryScene.backOffItem.random', color: 'orange' },
  3: { label: 'page.retryScene.backOffItem.cron', color: 'purple' },
  2: { label: 'page.retryScene.backOffItem.fixed', color: 'blue' },
  1: { label: 'page.retryScene.backOffItem.delayLevel', color: 'green' }
};

const routeKeyRecordWithColor = {
  1: { label: 'common.routeKey.items.last', color: 'red' },
  2: { label: 'common.routeKey.items.first', color: 'blue' },
  3: { label: 'common.routeKey.items.round', color: 'green' },
  4: { label: 'common.routeKey.items.lru', color: 'orange' },
  5: { label: 'common.routeKey.items.random', color: 'purple' },
  6: { label: 'common.routeKey.items.consistentHash', color: 'cyan' }
};

const blockStrategyRecordWithColor = {
  1: { label: 'common.blockStrategy.items.discard', color: 'red' },
  2: { label: 'common.blockStrategy.items.overwrite', color: 'orange' },
  3: { label: 'common.blockStrategy.items.parallel', color: 'green' },
  4: { label: 'common.blockStrategy.items.recovery', color: 'blue' }
};

const enableStatusNumberRecordWithColor = {
  0: { label: 'common.status.disable', color: 'red' },
  1: { label: 'common.status.enable', color: 'green' },
  false: { label: 'common.status.disable', color: 'red' },
  true: { label: 'common.status.enable', color: 'green' }
};
import {
  fetchBatchDeleteRetryScene,
  fetchDeleteRetryScene,
  fetchGetRetryScenePageList,
  fetchUpdateSceneStatus,
  fetchAddRetryScene,
  fetchEditRetryScene
} from '@/api/job/retry-scene';
import { getAllGroupConfigs } from '@/api/job/group';
import { fetchGetNotifyConfigSystemTaskTypeList } from '@/api/job/notify';
import SearchPanel from '@/components/SearchPanel.vue';
import CommonPagination from '@/components/CommonPagination.vue';
import ColumnSettings from '@/components/ColumnSettings.vue';
import DetailDrawer from '@/components/DetailDrawer.vue';


// 定义类型
interface Scene {
  id: string;
  groupName: string;
  sceneName: string;
  sceneStatus: boolean;
  routeKey: number;
  backOff: number;
  blockStrategy: number;
  maxRetryCount: number;
  triggerInterval: string;
  deadlineRequest: number;
  executorTimeout: number;
  description: string;
  notifyIds: number[];
  cbStatus: boolean;
  cbTriggerType: number;
  cbTriggerInterval: string;
  cbMaxCount: number;
  createdDate?: string;
  updatedDate?: string;
}

interface SearchParams {
  groupName?: string;
  sceneName?: string;
  sceneStatus?: boolean;
}

// 响应式数据
const loading = ref(false);
const data = ref<Scene[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(10);
const selectedRowKeys = ref<string[]>([]);
const searchParams = ref<SearchParams>({});

// 详情相关
const detailVisible = ref(false);
const detailData = ref<Scene | null>(null);

// 操作抽屉相关
const operateDrawerVisible = ref(false);
const operateType = ref<'add' | 'edit'>('add');
const editingData = ref<Scene | null>(null);

// 折叠面板状态
const activeCollapseKeys = ref(['basic', 'callback']);

// 抽屉大小控制
const drawerWidth = ref<number | string>(800);
const isDrawerMaximized = ref(false);

// 组选项
const groupOptions = ref<Array<{ label: string; value: string }>>([]);
// 告警通知选项
const notifyOptions = ref<Array<{ id: number; name: string }>>([]);

// CRON表达式弹窗
const showCronModal = ref(false);
const cronExpression = ref('');
const cronTabActiveKey = ref('second');

// CRON表达式各字段的值
const cronSecondValue = ref('every');
const cronSecondStart = ref(0);
const cronSecondEnd = ref(1);
const cronSecondIntervalStart = ref(0);
const cronSecondInterval = ref(1);

const cronMinuteValue = ref('every');
const cronMinuteStart = ref(0);
const cronMinuteEnd = ref(1);
const cronMinuteIntervalStart = ref(0);
const cronMinuteInterval = ref(1);

const cronHourValue = ref('every');
const cronHourStart = ref(0);
const cronHourEnd = ref(1);
const cronHourIntervalStart = ref(0);
const cronHourInterval = ref(1);

const cronDayValue = ref('every');
const cronDayStart = ref(1);
const cronDayEnd = ref(1);
const cronDayIntervalStart = ref(1);
const cronDayInterval = ref(1);

const cronMonthValue = ref('every');
const cronMonthStart = ref(1);
const cronMonthEnd = ref(1);
const cronMonthIntervalStart = ref(1);
const cronMonthInterval = ref(1);

const cronWeekValue = ref('every');
const cronWeekStart = ref(1);
const cronWeekEnd = ref(1);
const cronWeekIntervalStart = ref(1);
const cronWeekInterval = ref(1);

const cronYearValue = ref('every');
const cronYearStart = ref(2024);
const cronYearEnd = ref(2024);
const cronYearIntervalStart = ref(2024);
const cronYearInterval = ref(1);

// CRON预览时间
const cronPreviewTimes = ref([
  '2025-10-12 01:53:42',
  '2025-10-12 01:53:43',
  '2025-10-12 01:53:44',
  '2025-10-12 01:53:45',
  '2025-10-12 01:53:46'
]);

// 计算回调触发间隔的显示值
const cbTriggerIntervalDisplay = computed(() => {
  if (operateForm.value.cbTriggerType === 4 || !operateForm.value.cbTriggerType) {
    // 延迟等级时显示完整的延迟序列
    return '10s,15s,30s,35s,40s,50s,1m,2m,4m,6m,8m,10m,20m,40m,1h,2h';
  }
  return operateForm.value.cbTriggerInterval;
});

// 操作表单
const operateForm = ref({
  // 基础配置
  groupName: '',
  sceneName: '',
  sceneStatus: true,
  routeKey: 3, // 默认轮询
  blockStrategy: 1,
  backOff: 2, // 默认固定时间
  maxRetryCount: 1,
  triggerInterval: '60',
  deadlineRequest: 60000,
  executorTimeout: 60,
  notifyIds: [] as number[],
  description: '',
  // 回调配置
  cbStatus: false,
  cbTriggerType: 1, // 默认延迟等级
  cbTriggerInterval: '10',
  cbMaxCount: 16
});

const operateRules = {
  groupName: [{ required: true, message: '请输入组名', trigger: 'blur' }],
  sceneName: [{ required: true, message: '请输入场景名', trigger: 'blur' }],
  sceneStatus: [{ required: true, message: '请选择状态', trigger: 'change' }],
  routeKey: [{ required: true, message: '请选择路由策略', trigger: 'change' }],
  blockStrategy: [{ required: true, message: '请选择阻塞策略', trigger: 'change' }],
  backOff: [{ required: true, message: '请选择退避策略', trigger: 'change' }],
  maxRetryCount: [{ required: true, message: '请输入最大重试次数', trigger: 'blur' }],
  triggerInterval: [{ required: true, message: '请输入间隔时间', trigger: 'blur' }],
  deadlineRequest: [{ required: true, message: '请输入调用链超时时间', trigger: 'blur' }],
  executorTimeout: [{ required: true, message: '请输入超时时间', trigger: 'blur' }],
  description: [{ required: false, message: '请输入描述', trigger: 'blur' }]
};

// 列设置
const columnKeys = ref<string[]>([
  'sceneName',
  'groupName', 
  'routeKey',
  'backOff',
  'blockStrategy',
  'sceneStatus',
  'maxRetryCount',
  'triggerInterval',
  'executorTimeout',
  'deadlineRequest',
  'cbStatus',
  'description',
  'createdDate',
  'updatedDate',
  'operation'
]);
const columns = ref<any[]>([
    {
      key: 'sceneName',
    title: $t('page.retryScene.sceneName'),
    dataIndex: 'sceneName',
      width: 200,
    ellipsis: true,
    type: 'link'
    },
    {
      key: 'groupName',
    title: $t('page.retryScene.groupName'),
    dataIndex: 'groupName',
      width: 120
    },
    {
      key: 'routeKey',
    title: $t('page.retryScene.routeKey'),
    dataIndex: 'routeKey',
      width: 100,
    type: 'enum',
    enumMap: routeKeyRecordWithColor
    },
    {
      key: 'backOff',
    title: $t('page.retryScene.backOff'),
    dataIndex: 'backOff',
      width: 100,
    type: 'enum',
    enumMap: backOffRecordWithColor
    },
    {
      key: 'blockStrategy',
    title: $t('page.retryScene.blockStrategy'),
    dataIndex: 'blockStrategy',
      width: 100,
    type: 'enum',
    enumMap: blockStrategyRecordWithColor
    },
    {
      key: 'sceneStatus',
    title: $t('page.retryScene.sceneStatus'),
    dataIndex: 'sceneStatus',
      width: 100,
    type: 'switch'
    },
    {
      key: 'maxRetryCount',
    title: $t('page.retryScene.maxRetryCount'),
    dataIndex: 'maxRetryCount',
      width: 120,
    align: 'center' as const
    },
    {
      key: 'triggerInterval',
    title: $t('page.retryScene.triggerInterval'),
    dataIndex: 'triggerInterval',
      width: 120,
    align: 'center' as const
    },
    {
      key: 'executorTimeout',
    title: $t('page.retryScene.executorTimeout'),
    dataIndex: 'executorTimeout',
      width: 120,
    align: 'center' as const
    },
    {
      key: 'deadlineRequest',
    title: $t('page.retryScene.deadlineRequest'),
    dataIndex: 'deadlineRequest',
      width: 150,
    align: 'center' as const
    },
    {
      key: 'cbStatus',
    title: $t('page.retryScene.cbStatus'),
    dataIndex: 'cbStatus',
      width: 100,
    type: 'enum',
    enumMap: enableStatusNumberRecordWithColor
    },
    {
      key: 'description',
    title: $t('page.retryScene.description'),
    dataIndex: 'description',
      width: 200,
    ellipsis: true
    },
    {
      key: 'createdDate',
    title: $t('common.createdDate'),
    dataIndex: 'createdDate',
      width: 180,
    align: 'center' as const
    },
    {
      key: 'updatedDate',
    title: $t('common.updatedDate'),
    dataIndex: 'updatedDate',
      width: 180,
    align: 'center' as const
    },
    {
      key: 'operation',
      title: $t('common.operation'),
    dataIndex: 'operation',
      width: 200,
    align: 'center' as const,
    fixed: 'right' as const
  }
]);

// 搜索字段配置
const searchFields = [
  {
    key: 'groupName',
    label: $t('page.retryScene.groupName'),
    type: 'select' as const,
    placeholder: $t('page.retryScene.groupName'),
    options: async () => {
      try {
        const response = await getAllGroupConfigs();
        const groups = response.data || response;
        return groups;
      } catch (error) {
        console.error('搜索框加载组选项失败:', error);
        return [];
      }
    }
  },
  {
    key: 'sceneName',
    label: $t('page.retryScene.sceneName'),
    type: 'input' as const,
    placeholder: $t('page.retryScene.sceneName')
  },
  {
    key: 'sceneStatus',
    label: $t('page.retryScene.sceneStatus'),
    type: 'select' as const,
    placeholder: $t('page.jobTask.form.jobStatus'),
    options: [
      { label: '启用', value: 'true' },
      { label: '禁用', value: 'false' }
    ]
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
      sort: '-createdDate',
      ...searchParams.value
    };
    
    const response: any = await fetchGetRetryScenePageList(params);
    console.log('API响应:', response); // 添加调试日志
    
    // 处理不同的响应格式
    if (response && response.data) {
      // 如果返回的是分页数据格式
      if (response.data.list && Array.isArray(response.data.list)) {
        data.value = response.data.list;
        total.value = response.data.total || 0;
      }
      // 如果返回的是数组格式
      else if (Array.isArray(response.data)) {
        data.value = response.data;
        total.value = response.data.length;
      }
      // 如果返回的是其他格式
      else {
        data.value = [];
        total.value = 0;
      }
    } else {
      data.value = [];
      total.value = 0;
    }
  } catch (error) {
    console.error('获取数据失败:', error);
    message.error('获取数据失败');
    data.value = [];
    total.value = 0;
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
  searchParams.value = {};
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
        await fetchBatchDeleteRetryScene(selectedRowKeys.value);
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
async function handleDelete(record: Scene) {
  Modal.confirm({
    title: $t('common.deleteConfirm'),
    content: '确定要删除这条数据吗？',
    onOk: async () => {
      try {
        await fetchDeleteRetryScene(record.id);
        message.success('删除成功');
        getData();
      } catch (error) {
        console.error('删除失败:', error);
        message.error('删除失败');
      }
    }
  });
}

// 查看详情
function handleViewDetail(record: Scene) {
  detailData.value = record;
  detailVisible.value = true;
}

// 编辑
function handleEdit(record: Scene) {
  editingData.value = record;
  operateType.value = 'edit';
  operateForm.value = {
    // 基础配置
    groupName: record.groupName,
    sceneName: record.sceneName,
    sceneStatus: record.sceneStatus,
    routeKey: record.routeKey,
    blockStrategy: record.blockStrategy,
    backOff: record.backOff,
    maxRetryCount: record.maxRetryCount,
    triggerInterval: record.triggerInterval,
    deadlineRequest: record.deadlineRequest,
    executorTimeout: record.executorTimeout,
    notifyIds: record.notifyIds || [],
    description: record.description || '',
    // 回调配置
    cbStatus: record.cbStatus || false,
    cbTriggerType: record.cbTriggerType || 1,
    cbTriggerInterval: record.cbTriggerInterval || '10',
    cbMaxCount: record.cbMaxCount || 16
  };
  operateDrawerVisible.value = true;
}

// 添加
function handleAdd() {
  editingData.value = null;
  operateType.value = 'add';
  operateForm.value = {
    // 基础配置
    groupName: '',
    sceneName: '',
    sceneStatus: true,
    routeKey: 3, // 默认轮询
    blockStrategy: 1,
    backOff: 2, // 默认固定时间
    maxRetryCount: 1,
    triggerInterval: '60',
    deadlineRequest: 60000,
    executorTimeout: 60,
    notifyIds: [],
    description: '',
    // 回调配置
    cbStatus: false,
    cbTriggerType: 4, // 默认延迟等级
    cbTriggerInterval: '10',
    cbMaxCount: 16
  };
  operateDrawerVisible.value = true;
}

// 更新状态
async function handleUpdateStatus(status: boolean, record: Scene, column: any, done: () => void) {
  try {
    await fetchUpdateSceneStatus(record.id, status);
    message.success('状态更新成功');
    getData();
    done(); // 调用done回调来结束loading状态
  } catch (error) {
    console.error('状态更新失败:', error);
    message.error('状态更新失败');
    done(); // 即使失败也要调用done回调
  }
}

// 切换抽屉大小
function toggleDrawerSize() {
  if (isDrawerMaximized.value) {
    drawerWidth.value = 800;
    isDrawerMaximized.value = false;
  } else {
    drawerWidth.value = '100vw';
    isDrawerMaximized.value = true;
  }
}

// 获取标签颜色
function getTagColor(value: number | undefined): string {
  if (value === undefined) return 'default';
  return tagColor(value);
}

// 计算触发间隔描述
function maxRetryCountUpdate(maxRetryCount: number, backOff: number) {
  if (backOff !== 1) {
    return '';
  }

  let desc = '';
  for (let i = 1; i <= maxRetryCount; i += 1) {
    desc += `,${DelayLevel[i as keyof typeof DelayLevel]}`;
  }
  return desc.substring(1, desc.length);
}

// 操作表单提交
async function handleOperateSubmit() {
  try {
    if (operateType.value === 'add') {
      await fetchAddRetryScene(operateForm.value);
      message.success('添加成功');
    } else {
      await fetchEditRetryScene(editingData.value?.id || '', {
        ...operateForm.value,
      });
      message.success('编辑成功');
    }
    operateDrawerVisible.value = false;
    getData();
  } catch (error) {
    console.error('操作失败:', error);
    message.error('操作失败');
  }
}

// 初始化
onMounted(async () => {
  // 加载组选项
  try {
    const response = await getAllGroupConfigs();
    console.log('API返回的完整响应:', response);
    
    // API返回的数据结构是 {code, message, data}
    const groups = response.data || response;
    console.log('提取的组数据:', groups);
    
    // 确保groups是数组
    if (!Array.isArray(groups)) {
      console.error('组数据不是数组格式:', groups);
      return;
    }
    
    // API返回的数据已经是 {label, value} 格式，直接使用
    groupOptions.value = groups;
    console.log('最终的组选项列表:', groupOptions.value);
  } catch (error) {
    console.error('加载组选项失败:', error);
  }

  // 加载告警通知选项
  try {
    const notifyList = await fetchGetNotifyConfigSystemTaskTypeList(1);
    notifyOptions.value = notifyList.map((item: any) => ({
      id: item.id,
      name: item.name || item.notifyName
    }));
  } catch (error) {
    console.error('加载告警通知选项失败:', error);
  }
  
  getData();
});

// CRON表达式相关方法
function handleCronConfirm() {
  // 生成CRON表达式
  const expression = generateCronExpression();
  operateForm.value.cbTriggerInterval = expression;
  showCronModal.value = false;
}

function handleCronCancel() {
  showCronModal.value = false;
}

function generateCronExpression() {
  // 简化的CRON表达式生成逻辑
  // 这里可以根据实际的CRON字段值生成表达式
  // 暂时返回一个示例表达式
  return '0 0 0 * * ?';
}

// 监听回调触发类型变化
watch(() => operateForm.value.cbTriggerType, (newType: number, oldType: number) => {
  if (newType !== oldType) {
    // 清空回调触发间隔的值
    operateForm.value.cbTriggerInterval = '';
    
    // 根据类型设置默认值
    switch (newType) {
      case 4: // 随机等待
        operateForm.value.cbTriggerInterval = '10';
        break;
      case 3: // CRON表达式
        operateForm.value.cbTriggerInterval = '0 0 0 * * ?';
        break;
      case 2: // 固定时间
        operateForm.value.cbTriggerInterval = '10';
        break;
      case 1: // 延迟等级
        operateForm.value.cbTriggerInterval = '10';
        break;
      default:
        operateForm.value.cbTriggerInterval = '10';
        break;
    }
  }
});
</script>

<template>
  <div class="scene-view">
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
          @click="handleAdd"
        >
          添加场景
        </a-button>
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
          onChange: handleRowSelection
        },
        scroll: { x: 'max-content' }
      }"
      @change="handlePageChange"
      @switch-change="handleUpdateStatus"
    >
      <!-- 操作列插槽 -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'operation'">
          <div class="operation-buttons">
            <a-button 
              type="link" 
              @click="handleEdit(record)"
            >
              编辑
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
        <template v-else-if="column.key === 'sceneName'">
          <a-button 
            type="link" 
            @click="handleViewDetail(record)"
            style="padding: 0; height: auto;"
          >
            {{ record.sceneName }}
          </a-button>
        </template>
      </template>
    </CommonPagination>
    
    <!-- 详情抽屉 -->
    <DetailDrawer
      :visible="detailVisible"
      :record="detailData"
      :columns="columns"
      :enums="{
        routeKeyRecord: routeKeyRecordWithColor,
        backOffRecord: backOffRecordWithColor,
        blockStrategyRecord: blockStrategyRecordWithColor,
        enableStatusNumberRecord: enableStatusNumberRecordWithColor,
        cbTriggerTypeRecord
      }"
      title="场景详情"
      @update:visible="detailVisible = $event"
    />
    
    <!-- 操作抽屉 -->
    <a-drawer
      v-model:open="operateDrawerVisible"
      :width="drawerWidth"
      :footer="null"
      :closable="false"
    >
      <!-- 自定义头部 -->
      <template #title>
        <div class="drawer-header">
          <span class="drawer-title">{{ operateType === 'add' ? '新增场景' : '编辑场景' }}</span>
          <div class="drawer-actions">
            <a-button 
              type="text" 
              @click="toggleDrawerSize"
              :title="isDrawerMaximized ? '还原' : '最大化'"
            >
              <template #icon>
                <FullscreenOutlined v-if="!isDrawerMaximized" />
                <FullscreenExitOutlined v-else />
              </template>
            </a-button>
            <a-button 
              type="text" 
              @click="operateDrawerVisible = false"
              title="关闭"
            >
              <template #icon>
                <CloseOutlined />
              </template>
            </a-button>
          </div>
        </div>
      </template>
      <div class="operate-form">
        <a-form
          :model="operateForm"
          :rules="operateRules"
          ref="operateFormRef"
          layout="vertical"
        >
          <!-- 配置面板 -->
          <a-collapse v-model:activeKey="activeCollapseKeys" :bordered="false">
            <a-collapse-panel key="basic" header="基础配置">
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="场景名" name="sceneName">
                    <a-input v-model:value="operateForm.sceneName" :maxlength="64" show-count />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="组名" name="groupName">
                    <a-select 
                      v-model:value="operateForm.groupName" 
                      placeholder="请选择组名"
                      :options="groupOptions"
                      :field-names="{ label: 'label', value: 'label' }"
                    />
                  </a-form-item>
                </a-col>
              </a-row>
              
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="状态" name="sceneStatus">
                    <a-radio-group v-model:value="operateForm.sceneStatus">
                      <a-radio :value="true">启用</a-radio>
                      <a-radio :value="false">禁用</a-radio>
                    </a-radio-group>
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="路由策略" name="routeKey">
                    <a-select v-model:value="operateForm.routeKey" allowClear>
                      <a-select-option v-for="(label, value) in routeKeyRecord" :key="value" :value="Number(value)">
                        {{ $t(label) }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
              </a-row>
              
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="阻塞策略" name="blockStrategy">
                    <a-select v-model:value="operateForm.blockStrategy" allowClear>
                      <a-select-option v-for="(label, value) in blockStrategyRecord" :key="value" :value="Number(value)">
                        {{ $t(label) }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="退避策略" name="backOff">
                    <a-select v-model:value="operateForm.backOff" allowClear>
                      <a-select-option v-for="(label, value) in backOffRecord" :key="value" :value="Number(value)">
                        {{ $t(label) }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
              </a-row>
              
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="最大重试次数" name="maxRetryCount">
                    <a-input-number v-model:value="operateForm.maxRetryCount" :min="1" :max="100" style="width: 100%" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="间隔时间" name="triggerInterval">
                    <a-input-number v-model:value="operateForm.triggerInterval" :min="1" style="width: 100%">
                      <template #addonAfter>秒</template>
                    </a-input-number>
                  </a-form-item>
                </a-col>
              </a-row>
              
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="超时时间" name="executorTimeout">
                    <a-input-number v-model:value="operateForm.executorTimeout" :min="1" style="width: 100%">
                      <template #addonAfter>秒</template>
                    </a-input-number>
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="调用链超时时间" name="deadlineRequest">
                    <a-input-number v-model:value="operateForm.deadlineRequest" :min="1000" style="width: 100%">
                      <template #addonAfter>毫秒</template>
                    </a-input-number>
                  </a-form-item>
                </a-col>
              </a-row>
              
              <a-form-item label="告警通知" name="notifyIds">
                <a-select v-model:value="operateForm.notifyIds" mode="multiple" placeholder="请选择告警通知" allowClear>
                  <a-select-option v-for="option in notifyOptions" :key="option.id" :value="option.id">
                    {{ option.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
              
              <a-form-item label="描述" name="description">
                <a-textarea v-model:value="operateForm.description" :rows="3" :maxlength="256" show-count placeholder="请输入描述" />
              </a-form-item>
            </a-collapse-panel>
            
            <!-- 回调配置 -->
            <a-collapse-panel key="callback" header="回调配置">
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="回调开关" name="cbStatus">
                    <a-radio-group v-model:value="operateForm.cbStatus">
                      <a-radio :value="false">否</a-radio>
                      <a-radio :value="true">是</a-radio>
                    </a-radio-group>
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="回调触发类型" name="cbTriggerType">
                    <a-select v-model:value="operateForm.cbTriggerType" allowClear>
                      <a-select-option v-for="(label, value) in cbTriggerTypeRecord" :key="value" :value="Number(value)">
                        {{ $t(label) }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
              </a-row>
              
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="最大回调执行次数" name="cbMaxCount">
                    <a-input-number v-model:value="operateForm.cbMaxCount" :min="1" :max="100" style="width: 100%" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="回调触发间隔" name="cbTriggerInterval">
                    <!-- 延迟等级 (默认) -->
                    <div v-if="operateForm.cbTriggerType === 1 || !operateForm.cbTriggerType">
                      <a-input :value="cbTriggerIntervalDisplay" readonly>
                        <template #suffix>
                          <a-tooltip title="延迟等级是参考RocketMQ的messageDelayLevel设计实现, 具体延迟时间如下:【10s, 15s, 30s, 35s, 40s, 50s, 1m, 2m, 4m, 6m, 8m, 10m, 20m, 40m, 1h, 2h, 3h, 4h, 5h, 6h, 7h, 8h, 9h, 10h, 11h, 12h】执行逻辑: 第一次执行间隔10s, 第二次执行间隔15s, 第三次执行间隔30s, 依次类推">
                            <InfoCircleOutlined style="color: #1890ff; cursor: help;" />
                          </a-tooltip>
                        </template>
                      </a-input>
                    </div>
                    
                    <!-- 随机等待 -->
                    <div v-else-if="operateForm.cbTriggerType === 4">
                      <a-input-number 
                        v-model:value="operateForm.cbTriggerInterval" 
                        :min="1" 
                        :max="3600" 
                        style="width: 100%" 
                        addon-after="秒"
                      />
                    </div>
                    
                    <!-- CRON表达式 -->
                    <div v-else-if="operateForm.cbTriggerType === 3">
                      <a-input v-model:value="operateForm.cbTriggerInterval" readonly @click="showCronModal = true" style="cursor: pointer;" />
                      <a-button type="link" @click="showCronModal = true" style="margin-left: 8px;">设置</a-button>
                    </div>
                    
                    <!-- 固定时间 -->
                    <div v-else-if="operateForm.cbTriggerType === 2">
                      <a-input-number 
                        v-model:value="operateForm.cbTriggerInterval" 
                        :min="1" 
                        :max="3600" 
                        style="width: 100%" 
                        addon-after="秒"
                      />
                    </div>
                  </a-form-item>
                </a-col>
              </a-row>
            </a-collapse-panel>
          </a-collapse>
        </a-form>
        <div class="drawer-footer">
          <a-space>
            <a-button @click="operateDrawerVisible = false">取消</a-button>
            <a-button type="primary" @click="handleOperateSubmit">保存</a-button>
          </a-space>
        </div>
    </div>
    </a-drawer>

    <!-- CRON表达式设置弹窗 -->
    <a-modal
      v-model:open="showCronModal"
      title="设置CRON表达式"
      width="800px"
      @ok="handleCronConfirm"
      @cancel="handleCronCancel"
    >
      <div class="cron-modal-content">
        <a-tabs v-model:activeKey="cronTabActiveKey">
          <a-tab-pane key="second" tab="秒">
            <a-radio-group v-model:value="cronSecondValue">
              <a-radio value="every">每秒钟</a-radio>
              <a-radio value="range">从 <a-input-number v-model:value="cronSecondStart" :min="0" :max="59" size="small" style="width: 60px;" /> 秒到 <a-input-number v-model:value="cronSecondEnd" :min="0" :max="59" size="small" style="width: 60px;" /> 秒</a-radio>
              <a-radio value="interval">从 <a-input-number v-model:value="cronSecondIntervalStart" :min="0" :max="59" size="small" style="width: 60px;" /> 秒开始,每 <a-input-number v-model:value="cronSecondInterval" :min="1" :max="59" size="small" style="width: 60px;" /> 秒钟执行一次</a-radio>
              <a-radio value="specify">指定</a-radio>
            </a-radio-group>
            <div class="cron-preview">
              <h4>最近5次运行时间</h4>
              <div v-for="(time, index) in cronPreviewTimes" :key="index">
                {{ index + 1 }}: {{ time }}
              </div>
            </div>
          </a-tab-pane>
          <a-tab-pane key="minute" tab="分">
            <a-radio-group v-model:value="cronMinuteValue">
              <a-radio value="every">每分钟</a-radio>
              <a-radio value="range">从 <a-input-number v-model:value="cronMinuteStart" :min="0" :max="59" size="small" style="width: 60px;" /> 分到 <a-input-number v-model:value="cronMinuteEnd" :min="0" :max="59" size="small" style="width: 60px;" /> 分</a-radio>
              <a-radio value="interval">从 <a-input-number v-model:value="cronMinuteIntervalStart" :min="0" :max="59" size="small" style="width: 60px;" /> 分开始,每 <a-input-number v-model:value="cronMinuteInterval" :min="1" :max="59" size="small" style="width: 60px;" /> 分钟执行一次</a-radio>
              <a-radio value="specify">指定</a-radio>
            </a-radio-group>
          </a-tab-pane>
          <a-tab-pane key="hour" tab="时">
            <a-radio-group v-model:value="cronHourValue">
              <a-radio value="every">每小时</a-radio>
              <a-radio value="range">从 <a-input-number v-model:value="cronHourStart" :min="0" :max="23" size="small" style="width: 60px;" /> 时到 <a-input-number v-model:value="cronHourEnd" :min="0" :max="23" size="small" style="width: 60px;" /> 时</a-radio>
              <a-radio value="interval">从 <a-input-number v-model:value="cronHourIntervalStart" :min="0" :max="23" size="small" style="width: 60px;" /> 时开始,每 <a-input-number v-model:value="cronHourInterval" :min="1" :max="23" size="small" style="width: 60px;" /> 小时执行一次</a-radio>
              <a-radio value="specify">指定</a-radio>
            </a-radio-group>
          </a-tab-pane>
          <a-tab-pane key="day" tab="日">
            <a-radio-group v-model:value="cronDayValue">
              <a-radio value="every">每日</a-radio>
              <a-radio value="range">从 <a-input-number v-model:value="cronDayStart" :min="1" :max="31" size="small" style="width: 60px;" /> 日到 <a-input-number v-model:value="cronDayEnd" :min="1" :max="31" size="small" style="width: 60px;" /> 日</a-radio>
              <a-radio value="interval">从 <a-input-number v-model:value="cronDayIntervalStart" :min="1" :max="31" size="small" style="width: 60px;" /> 日开始,每 <a-input-number v-model:value="cronDayInterval" :min="1" :max="31" size="small" style="width: 60px;" /> 天执行一次</a-radio>
              <a-radio value="specify">指定</a-radio>
            </a-radio-group>
          </a-tab-pane>
          <a-tab-pane key="month" tab="月">
            <a-radio-group v-model:value="cronMonthValue">
              <a-radio value="every">每月</a-radio>
              <a-radio value="range">从 <a-input-number v-model:value="cronMonthStart" :min="1" :max="12" size="small" style="width: 60px;" /> 月到 <a-input-number v-model:value="cronMonthEnd" :min="1" :max="12" size="small" style="width: 60px;" /> 月</a-radio>
              <a-radio value="interval">从 <a-input-number v-model:value="cronMonthIntervalStart" :min="1" :max="12" size="small" style="width: 60px;" /> 月开始,每 <a-input-number v-model:value="cronMonthInterval" :min="1" :max="12" size="small" style="width: 60px;" /> 月执行一次</a-radio>
              <a-radio value="specify">指定</a-radio>
            </a-radio-group>
          </a-tab-pane>
          <a-tab-pane key="week" tab="周">
            <a-radio-group v-model:value="cronWeekValue">
              <a-radio value="every">每周</a-radio>
              <a-radio value="range">从 <a-input-number v-model:value="cronWeekStart" :min="1" :max="7" size="small" style="width: 60px;" /> 周到 <a-input-number v-model:value="cronWeekEnd" :min="1" :max="7" size="small" style="width: 60px;" /> 周</a-radio>
              <a-radio value="interval">从 <a-input-number v-model:value="cronWeekIntervalStart" :min="1" :max="7" size="small" style="width: 60px;" /> 周开始,每 <a-input-number v-model:value="cronWeekInterval" :min="1" :max="7" size="small" style="width: 60px;" /> 周执行一次</a-radio>
              <a-radio value="specify">指定</a-radio>
            </a-radio-group>
          </a-tab-pane>
          <a-tab-pane key="year" tab="年">
            <a-radio-group v-model:value="cronYearValue">
              <a-radio value="every">每年</a-radio>
              <a-radio value="range">从 <a-input-number v-model:value="cronYearStart" :min="2024" :max="2099" size="small" style="width: 80px;" /> 年到 <a-input-number v-model:value="cronYearEnd" :min="2024" :max="2099" size="small" style="width: 80px;" /> 年</a-radio>
              <a-radio value="interval">从 <a-input-number v-model:value="cronYearIntervalStart" :min="2024" :max="2099" size="small" style="width: 80px;" /> 年开始,每 <a-input-number v-model:value="cronYearInterval" :min="1" :max="10" size="small" style="width: 60px;" /> 年执行一次</a-radio>
              <a-radio value="specify">指定</a-radio>
            </a-radio-group>
          </a-tab-pane>
        </a-tabs>
        
        <div class="cron-expression-display">
          <h4>CRON表达式:</h4>
          <a-input v-model:value="cronExpression" readonly />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.scene-view {
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

.operate-form {
  padding: 16px 0 80px 0; /* 底部增加padding避免被footer遮挡 */
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.drawer-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.drawer-actions {
  display: flex;
  gap: 4px;
}

.drawer-actions .ant-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drawer-actions .ant-btn:hover {
  background-color: #f5f5f5;
}

.drawer-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  z-index: 10;
}

/* CRON弹窗样式 */
.cron-modal-content {
  padding: 16px 0;
}

.cron-preview {
  margin-top: 16px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 4px;
}

.cron-preview h4 {
  margin: 0 0 8px 0;
  color: #1890ff;
  font-size: 14px;
}

.cron-preview div {
  margin: 4px 0;
  font-size: 12px;
  color: #666;
}

.cron-expression-display {
  margin-top: 16px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
}

.cron-expression-display h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
}
</style>
