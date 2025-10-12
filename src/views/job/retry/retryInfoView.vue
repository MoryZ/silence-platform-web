<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { FullscreenOutlined, FullscreenExitOutlined, CloseOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import { $t } from '@/locales';
import { tagColor } from '@/utils/common';
import { retryStatusTypeRecord, retryTaskTypeRecord } from '@/constants/business';
import {
  fetchBatchDeleteRetry,
  fetchExecuteRetry,
  fetchGetRetryById,
  fetchGetRetryList,
  fetchUpdateRetryStatus,
  fetchAddRetry,
  fetchBatchAddRetry,
  fetchIdempotentIdGenerate,
  fetchEditRetryTask
} from '@/api/job/retry';
import { getAllGroupConfigs } from '@/api/job/group';
import { fetchGetRetrySceneList } from '@/api/job/retry-scene';
import SearchPanel from '@/components/SearchPanel.vue';
import CommonPagination from '@/components/CommonPagination.vue';
import ColumnSettings from '@/components/ColumnSettings.vue';

// 定义类型
interface Retry {
  id: string;
  groupName: string;
  sceneName: string;
  nextTriggerAt: string;
  retryCount: number;
  retryStatus: number;
  taskType: number;
  idempotentId: string;
  bizNo: string;
  executorName: string;
  argsStr: string;
  createdDate: string;
  updatedDate: string;
}

interface SearchParams {
  groupName?: string;
  sceneName?: string;
  idempotentId?: string;
  bizNo?: string;
  retryStatus?: number;
}

// 响应式数据
const loading = ref(false);
const data = ref<Retry[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(10);
const selectedRowKeys = ref<string[]>([]);
const searchParams = ref<SearchParams>({
  retryStatus: history.state.retryStatus
});

// 详情相关
const detailVisible = ref(false);
const detailData = ref<Retry | null>(null);

// 操作抽屉相关
const operateDrawerVisible = ref(false);
const operateType = ref<'add' | 'edit'>('add');
const editingData = ref<Retry | null>(null);
const operateDrawerWidth = ref<number | string>(600);
const isOperateDrawerMaximized = ref(false);

// 批量添加抽屉相关
const batchAddDrawerVisible = ref(false);

// 组名称选项
const groupOptions = ref<Array<{ label: string; value: string }>>([]);

// 场景名称选项
const sceneOptions = ref<Array<{ label: string; value: string }>>([]);

// 操作表单
const operateForm = ref({
  groupName: '',
  sceneName: '',
  bizNo: '',
  executorName: '',
  idempotentId: '',
  retryStatus: 0,
  methodParams: [] as Array<{ key: string; value: string }>
});

const operateRules = {
  groupName: [{ required: true, message: '请输入组名', trigger: 'blur' }],
  sceneName: [{ required: true, message: '请输入场景名', trigger: 'blur' }],
  bizNo: [{ required: true, message: '请输入业务号', trigger: 'blur' }],
  executorName: [{ required: true, message: '请输入执行器名称', trigger: 'blur' }],
  idempotentId: [{ required: true, message: '请输入幂等ID', trigger: 'blur' }],
  retryStatus: [{ required: true, message: '请选择重试状态', trigger: 'change' }]
};

// 批量添加表单
const batchAddForm = ref({
  groupName: '',
  retryStatus: 0,
  logStr: ''
});

const batchAddRules = {
  groupName: [{ required: true, message: '请输入组名', trigger: 'blur' }],
  retryStatus: [{ required: true, message: '请选择重试状态', trigger: 'change' }],
  logStr: [{ required: true, message: '请输入日志字符串', trigger: 'blur' }]
};

// 列设置
const columnKeys = ref<string[]>([]);
const columns = ref([
  {
    key: 'id',
    title: $t('page.jobBatch.jobTask.id'),
    dataIndex: 'id',
    width: 128,
    fixed: 'left' as const,
    align: 'center' as const,
    clickable: true
  },
  {
    key: 'groupName',
    title: $t('page.retry.groupName'),
    dataIndex: 'groupName',
    width: 180,
    align: 'center' as const
  },
  {
    key: 'sceneName',
    title: $t('page.retry.sceneName'),
    dataIndex: 'sceneName',
    width: 180,
    align: 'center' as const
  },
  {
    key: 'nextTriggerAt',
    title: $t('page.retry.nextTriggerAt'),
    dataIndex: 'nextTriggerAt',
    width: 120,
    align: 'center' as const
  },
  {
    key: 'retryCount',
    title: $t('page.retry.retryCount'),
    dataIndex: 'retryCount',
    width: 100,
    align: 'center' as const
  },
  {
    key: 'retryStatus',
    title: $t('page.retry.retryStatus'),
    dataIndex: 'retryStatus',
    width: 120,
    align: 'center' as const,
    type: 'enum',
    enumMap: retryStatusTypeRecord
  },
  {
    key: 'taskType',
    title: $t('page.retry.taskType'),
    dataIndex: 'taskType',
    width: 120,
    align: 'center' as const,
    type: 'enum',
    enumMap: retryTaskTypeRecord
  },
  {
    key: 'idempotentId',
    title: $t('page.retry.idempotentId'),
    dataIndex: 'idempotentId',
    width: 120,
    align: 'center' as const
  },
  {
    key: 'bizNo',
    title: $t('page.retry.bizNo'),
    dataIndex: 'bizNo',
    width: 120,
    align: 'center' as const
  },
  {
    key: 'createdDate',
    title: $t('common.createdDate'),
    dataIndex: 'createdDate',
    width: 120,
    align: 'center' as const,
    type: 'date'
  },
  {
    key: 'updatedDate',
    title: $t('common.updatedDate'),
    dataIndex: 'updatedDate',
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
    label: $t('page.retry.groupName'),
    type: 'select' as const,
    placeholder: $t('page.retry.groupName'),
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
    label: $t('page.retry.sceneName'),
    type: 'select' as const,
    placeholder: $t('page.retry.sceneName'),
    options: async () => {
      try {
        const response: any = await fetchGetRetrySceneList({pageNo: 1, pageSize: 100});
        const scenes = response.data || response || [];
        // 提取场景名称并去重
        const uniqueScenes = [...new Set(scenes.map((scene: any) => scene.sceneName))];
        return uniqueScenes.map(sceneName => ({
          label: sceneName,
          value: sceneName
        }));
      } catch (error) {
        console.error('搜索框加载场景选项失败:', error);
        return [];
      }
    }
  },
  {
    key: 'idempotentId',
    label: $t('page.retry.idempotentId'),
    type: 'input' as const,
    placeholder: $t('page.retry.form.idempotentId')
  },
  {
    key: 'bizNo',
    label: $t('page.retry.bizNo'),
    type: 'input' as const,
    placeholder: $t('page.retry.form.bizNo')
  },
  {
    key: 'retryStatus',
    label: $t('page.retry.retryStatus'),
    type: 'select' as const,
    placeholder: $t('page.retry.form.retryStatus'),
    options: Object.entries(retryStatusTypeRecord).map(([value, label]) => ({
      label: $t(label),
      value: value
    }))
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
    
    const response = await fetchGetRetryList(params);
    
    if (response) {
      data.value = response.data || [];
      total.value = response.total || 0;
    }
  } catch (error) {
    console.error('获取数据失败:', error);
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
    retryStatus: history.state.retryStatus
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
        const groupName = data.value[0]?.groupName;
        if (!groupName) {
          message.error('无法获取组名');
          return;
        }
        await fetchBatchDeleteRetry({ 
          groupName, 
          ids: selectedRowKeys.value 
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

// 单个删除
async function handleDelete(record: Retry) {
  Modal.confirm({
    title: $t('common.deleteConfirm'),
    content: '确定要删除这条数据吗？',
    onOk: async () => {
      try {
        await fetchBatchDeleteRetry({ 
          groupName: record.groupName, 
          ids: [record.id] 
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

// 执行重试
async function handleExecute(record: Retry) {
  try {
    await fetchExecuteRetry({ 
      groupName: record.groupName, 
      retryIds: [parseInt(record.id)] 
    });
    message.success('执行成功');
    getData();
  } catch (error) {
    console.error('执行失败:', error);
    message.error('执行失败');
  }
}

// 查看详情
async function handleViewDetail(record: Retry) {
  try {
    const response = await fetchGetRetryById(record.id, record.groupName);
    
    // 检查响应数据结构
    if (response && response.data) {
      detailData.value = response.data;
    } else if (response && !response.data) {
      // 如果响应直接是数据，而不是包装在data字段中
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

// 编辑
async function handleEdit(record: Retry) {
  editingData.value = record;
  operateType.value = 'edit';
  
  // 解析方法参数
  let methodParams: Array<{ key: string; value: string }> = [];
  try {
    if (record.argsStr && record.argsStr !== '[]') {
      const parsedArgs = JSON.parse(record.argsStr);
      if (typeof parsedArgs === 'object' && parsedArgs !== null) {
        methodParams = Object.entries(parsedArgs).map(([key, value]) => ({
          key,
          value: String(value)
        }));
      }
    }
  } catch (error) {
    console.warn('解析方法参数失败:', error);
    methodParams = [];
  }
  
  // 填充表单数据
  operateForm.value = {
    groupName: record.groupName,
    sceneName: record.sceneName,
    bizNo: record.bizNo,
    executorName: record.executorName,
    idempotentId: record.idempotentId,
    retryStatus: record.retryStatus,
    methodParams
  };
  
  // 加载选项数据
  await Promise.all([loadGroupOptions(), loadSceneOptions()]);
  operateDrawerVisible.value = true;
}

// 加载组名称选项
async function loadGroupOptions() {
  try {
    const response = await getAllGroupConfigs();
    const groups = response.data || response;
    groupOptions.value = groups.map((group: any) => ({
      label: group.label || group.groupName,
      value: group.label || group.groupName
    }));
  } catch (error) {
    console.error('加载组选项失败:', error);
  }
}

// 加载场景名称选项
async function loadSceneOptions() {
  try {
    const response: any = await fetchGetRetrySceneList({pageNo: 1, pageSize: 100});
    const scenes = response.data || response || [];
    const uniqueScenes = [...new Set(scenes.map((scene: any) => scene.sceneName))];
    sceneOptions.value = uniqueScenes.map((sceneName: any) => ({
      label: String(sceneName),
      value: String(sceneName)
    }));
  } catch (error) {
    console.error('加载场景选项失败:', error);
  }
}

// 添加
async function handleAdd() {
  editingData.value = null;
  operateType.value = 'add';
  // 重置表单
  operateForm.value = {
    groupName: '',
    sceneName: '',
    bizNo: '',
    executorName: '',
    idempotentId: '',
    retryStatus: 0,
    methodParams: []
  };
  // 加载选项数据
  await Promise.all([loadGroupOptions(), loadSceneOptions()]);
  operateDrawerVisible.value = true;
}

// 生成幂等ID
async function generateIdempotentId() {
  try {
    // 处理方法参数
    const methodParams = operateForm.value.methodParams
      .filter(param => param.key && param.value)
      .reduce((acc, param) => {
        acc[param.key] = param.value;
        return acc;
      }, {} as Record<string, string>);
    
    const response: any = await fetchIdempotentIdGenerate({
      groupName: operateForm.value.groupName,
      sceneName: operateForm.value.sceneName,
      executorName: operateForm.value.executorName,
      argsStr: JSON.stringify(methodParams)
    });
    operateForm.value.idempotentId = response.data || response;
  } catch (error) {
    console.error('生成幂等ID失败:', error);
    message.error('生成幂等ID失败');
  }
}

// 添加方法参数
function addMethodParam() {
  operateForm.value.methodParams.push({ key: '', value: '' });
}

// 删除方法参数
function removeMethodParam(index: number) {
  operateForm.value.methodParams.splice(index, 1);
}

// 切换操作抽屉大小
function toggleOperateDrawerSize() {
  if (isOperateDrawerMaximized.value) {
    operateDrawerWidth.value = 600;
    isOperateDrawerMaximized.value = false;
  } else {
    operateDrawerWidth.value = '100vw';
    isOperateDrawerMaximized.value = true;
  }
}

// 批量添加
function handleBatchAdd() {
  batchAddDrawerVisible.value = true;
}

// 更新重试状态
async function updateRetryTaskStatus(id: number, status: number) {
  try {
    await fetchUpdateRetryStatus({ id, retryStatus: status });
    message.success($t('common.updateSuccess'));
    getData();
  } catch (error) {
    console.error('更新状态失败:', error);
    message.error('更新状态失败');
  }
}

// 获取标签颜色
function getTagColor(value: number | undefined): string {
  if (value === undefined) return 'default';
  return tagColor(value);
}

// 操作表单提交
async function handleOperateSubmit() {
  try {
    if (operateType.value === 'add') {
      // 处理方法参数
      const methodParams = operateForm.value.methodParams
        .filter(param => param.key && param.value)
        .reduce((acc, param) => {
          acc[param.key] = param.value;
          return acc;
        }, {} as Record<string, string>);
      
      await fetchAddRetry({
        ...operateForm.value,
        argsStr: JSON.stringify(methodParams)
      });
      message.success($t('common.addSuccess'));
    } else {
      // 处理方法参数
      const methodParams = operateForm.value.methodParams
        .filter(param => param.key && param.value)
        .reduce((acc, param) => {
          acc[param.key] = param.value;
          return acc;
        }, {} as Record<string, string>);
      
      await fetchEditRetryTask({
        id: editingData.value?.id,
        ...operateForm.value,
        argsStr: JSON.stringify(methodParams)
      });
      message.success($t('common.editSuccess'));
    }
    operateDrawerVisible.value = false;
    getData();
  } catch (error) {
    console.error('操作失败:', error);
    message.error('操作失败');
  }
}

// 批量添加表单提交
async function handleBatchAddSubmit() {
  try {
    await fetchBatchAddRetry(batchAddForm.value);
    message.success('批量添加成功');
    batchAddDrawerVisible.value = false;
    getData();
  } catch (error) {
    console.error('批量添加失败:', error);
    message.error('批量添加失败');
  }
}

// 初始化
onMounted(async () => {
  getData();
});
</script>

<template>
  <div class="retry-info-view">
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
          添加重试
        </a-button>
        <a-button 
          type="primary" 
          ghost 
          @click="handleBatchAdd"
        >
          批量添加
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
          onChange: handleRowSelection,
          getCheckboxProps: (record: Retry) => ({
            disabled: record.retryStatus === 0
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
              type="link" 
              @click="handleEdit(record)"
            >
              编辑
            </a-button>
            <a-button 
              v-if="record.retryStatus !== 1 && record.retryStatus !== 2"
              type="link" 
              @click="handleExecute(record)"
            >
              执行
            </a-button>
            <a-button 
              v-if="record.retryStatus !== 1 && record.retryStatus !== 2"
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
      width="700"
      :footer="null"
      :z-index="1001"
      :closable="false"
      @after-close="detailData = null"
    >
      <template #title>
        <div class="drawer-header">
          <span class="drawer-title">重试详情</span>
          <div class="drawer-actions">
            <a-button @click="detailVisible = false" type="text" size="small">
              <CloseOutlined />
            </a-button>
          </div>
        </div>
      </template>
      <div v-if="detailData" class="detail-content">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item :label="$t('page.retry.groupName')" :span="2">
            {{ detailData.groupName }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('page.retry.sceneName')" :span="2">
            {{ detailData.sceneName }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('page.retry.nextTriggerAt')" :span="1">
            {{ detailData.nextTriggerAt }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('page.retry.retryCount')" :span="1">
            {{ detailData.retryCount }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('page.retry.retryStatus')" :span="1">
            <a-tag :color="getTagColor(detailData.retryStatus)">
              {{ $t(retryStatusTypeRecord[detailData.retryStatus]) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('page.retry.taskType')" :span="1">
            <a-tag :color="getTagColor(detailData.taskType)">
              {{ $t(retryTaskTypeRecord[detailData.taskType]) }}
            </a-tag>
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
          <a-descriptions-item :label="$t('common.createdDate')" :span="1">
            {{ detailData.createdDate }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('common.updatedDate')" :span="1">
            {{ detailData.updatedDate }}
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-drawer>
    
    <!-- 操作抽屉 -->
    <a-drawer
      v-model:open="operateDrawerVisible"
      :width="operateDrawerWidth"
      :footer="null"
      :closable="false"
    >
      <template #title>
        <div class="drawer-header">
          <span class="drawer-title">{{ operateType === 'add' ? $t('page.retry.addRetry') : $t('page.retry.editRetry') }}</span>
          <div class="drawer-actions">
            <a-button @click="toggleOperateDrawerSize" type="text" size="small">
              <FullscreenOutlined v-if="!isOperateDrawerMaximized" />
              <FullscreenExitOutlined v-else />
            </a-button>
            <a-button @click="operateDrawerVisible = false" type="text" size="small">
              <CloseOutlined />
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
          <a-form-item :label="$t('page.retry.groupName')" name="groupName">
            <a-select 
              v-model:value="operateForm.groupName" 
              :disabled="operateType === 'edit'"
              :options="groupOptions"
              :field-names="{ label: 'label', value: 'value' }"
              :placeholder="$t('page.retry.form.groupName')"
            />
          </a-form-item>
          <a-form-item :label="$t('page.retry.sceneName')" name="sceneName">
            <a-select 
              v-model:value="operateForm.sceneName" 
              :disabled="operateType === 'edit'"
              :options="sceneOptions"
              :field-names="{ label: 'label', value: 'value' }"
              :placeholder="$t('page.retry.form.sceneName')"
            />
          </a-form-item>
          <a-form-item :label="$t('page.retry.bizNo')" name="bizNo">
            <a-input 
              v-model:value="operateForm.bizNo" 
              :disabled="operateType === 'edit'"
              :placeholder="$t('page.retry.form.bizNo')"
            />
          </a-form-item>
          <a-form-item :label="$t('page.retry.executorName')" name="executorName">
            <a-input 
              v-model:value="operateForm.executorName"
              :placeholder="$t('page.retry.form.executorName')"
            />
          </a-form-item>
          <a-form-item :label="$t('page.retry.methodParams')" name="methodParams">
            <div class="method-params-container">
              <div 
                v-for="(param, index) in operateForm.methodParams" 
                :key="index" 
                class="method-param-item"
              >
                <a-input 
                  v-model:value="param.key" 
                  :placeholder="$t('page.retry.paramName')"
                  style="width: 40%; margin-right: 8px;"
                />
                <a-input 
                  v-model:value="param.value" 
                  placeholder="参数值"
                  style="width: 40%; margin-right: 8px;"
                />
                <a-button 
                  @click="removeMethodParam(index)" 
                  type="text" 
                  danger
                  :icon="h(DeleteOutlined)"
                />
              </div>
              <a-button 
                @click="addMethodParam" 
                type="dashed" 
                :icon="h(PlusOutlined)"
                style="width: 100%; margin-top: 8px;"
              >
                {{ $t('page.retry.addParam') }}
              </a-button>
            </div>
          </a-form-item>
          <a-form-item :label="$t('page.retry.idempotentId')" name="idempotentId">
            <a-input-group compact>
              <a-input 
                v-model:value="operateForm.idempotentId" 
                :disabled="operateType === 'edit'"
                :placeholder="$t('page.retry.form.idempotentId')"
                style="width: calc(100% - 40px);"
              />
              <a-tooltip :title="$t('page.retry.generateIdempotentIdTooltip')">
                <a-button 
                  @click="generateIdempotentId" 
                  :disabled="operateType === 'edit'"
                  style="width: 40px;"
                >
                  <template #icon>
                    <svg viewBox="0 0 1024 1024" width="16" height="16">
                      <path d="M832 64H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-600 72h560v208H232V136zm560 480H232V408h560v208zm0 272H232V680h560v208z" fill="currentColor"/>
                    </svg>
                  </template>
                </a-button>
              </a-tooltip>
            </a-input-group>
          </a-form-item>
          <a-form-item :label="$t('page.retry.retryStatus')" name="retryStatus">
            <a-select v-model:value="operateForm.retryStatus" :placeholder="$t('page.retry.form.retryStatus')">
              <a-select-option 
                v-for="key in Object.keys(retryStatusTypeRecord)" 
                :key="key" 
                :value="Number(key)"
              >
                {{ $t(retryStatusTypeRecord[Number(key)]) }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-form>
        <div class="drawer-footer">
          <a-button @click="operateDrawerVisible = false">{{ $t('common.cancel') }}</a-button>
          <a-button type="primary" @click="handleOperateSubmit">{{ $t('common.save') }}</a-button>
        </div>
      </div>
    </a-drawer>
    
    <!-- 批量添加抽屉 -->
    <a-drawer
      v-model:open="batchAddDrawerVisible"
      title="批量添加重试"
      width="600"
      :footer="null"
    >
      <div class="batch-add-form">
        <a-form
          :model="batchAddForm"
          :rules="batchAddRules"
          ref="batchAddFormRef"
          layout="vertical"
        >
          <a-form-item label="组名" name="groupName">
            <a-input v-model:value="batchAddForm.groupName" />
          </a-form-item>
          <a-form-item label="重试状态" name="retryStatus">
            <a-select v-model:value="batchAddForm.retryStatus">
              <a-select-option 
                v-for="key in Object.keys(retryStatusTypeRecord)" 
                :key="key" 
                :value="Number(key)"
              >
                {{ $t(retryStatusTypeRecord[Number(key)]) }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="日志字符串" name="logStr">
            <a-textarea v-model:value="batchAddForm.logStr" :rows="6" />
          </a-form-item>
        </a-form>
        <div class="drawer-footer">
          <a-button @click="batchAddDrawerVisible = false">取消</a-button>
          <a-button type="primary" @click="handleBatchAddSubmit">保存</a-button>
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<style scoped>
.retry-info-view {
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

.batch-add-form {
  padding: 16px 0;
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
  gap: 8px;
  z-index: 10;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.drawer-title {
  font-size: 16px;
  font-weight: 500;
}

.drawer-actions {
  display: flex;
  gap: 4px;
}

.operate-form {
  padding: 16px 0 80px 0; /* 底部增加padding避免被footer遮挡 */
}

.method-params-container {
  width: 100%;
}

.method-param-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.detail-content {
  padding: 16px 0;
  min-height: 200px;
}

.detail-content .ant-descriptions {
  background: #fff;
}
</style>
