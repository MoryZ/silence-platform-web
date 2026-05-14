<template>
  <div class="release-history-page">
    <div class="page-header">
      <div class="page-title-group">
        <h2>发布历史</h2>
        <p class="page-subtitle">按环境、命名空间与时间范围查询发布记录</p>
      </div>
    </div>

    <a-empty
      v-if="!selectedComponentId || !currentEnv"
      description="请先在配置管理中选择组件与环境类型"
    />

    <div v-else class="release-history-container">
      <div class="environment-selector">
        <div class="env-tabs-wrapper">
          <div class="env-tabs-container">
            <div
              v-for="env in environments"
              :key="env.id"
              :class="['env-tab', { active: Number(activeEnvironmentKey) === env.id }]"
              @click="handleEnvironmentChange(String(env.id))"
            >
              <span class="env-tab-name">{{ env.displayName || env.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 顶部搜索栏 -->
      <div class="search-bar">
        <div class="search-controls">
          <a-select
            v-model:value="selectedConfigItemId"
            :options="namespaceOptions"
            :field-names="{ label: 'label', value: 'value' }"
            placeholder="请选择命名空间"
            style="width: 280px"
            @change="handleNamespaceChange"
          />

          <a-range-picker
            v-model:value="dateRange"
            :show-time="{ format: 'HH:mm:ss' }"
            format="YYYY-MM-DD HH:mm:ss"
            style="width: 360px"
          />

          <a-button type="primary" @click="handleSearch">查询</a-button>
          
          <a-button @click="handleResetSearch">重置</a-button>
        </div>
      </div>

      <div class="content-area">
        <!-- 左侧：发布历史列表 -->
        <div class="left-panel">
          <div class="history-table">
            <a-empty
              v-if="!selectedConfigItemId && !loading"
              description="请先选择命名空间"
            />
            <a-table
              v-else
              :data-source="filteredHistoryList"
              :loading="loading"
              :pagination="pagination"
              :columns="columns"
              size="small"
              :scroll="{ y: 400 }"
              :row-selection="null"
              :custom-row="getRowProps"
              @change="handleTableChange"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'releaseType'">
                  <a-tag :color="getReleaseTypeColor(record.releaseType)">
                    {{ getReleaseTypeName(record.releaseType) }}
                  </a-tag>
                </template>
                <template v-else-if="column.key === 'createdDate'">
                  {{ formatDate(record.createdDate) }}
                </template>
              </template>
            </a-table>
          </div>
        </div>

        <!-- 右侧：差异对比 -->
        <div class="right-panel">
          <div v-if="selectedHistory" class="diff-container">
            <div class="diff-header">
              <h3>发布名称: {{ selectedHistory.releaseName }}</h3>
              <div class="diff-info">
                <span>发布人：{{ selectedHistory.createdBy }}</span>
                <span>发布时间：{{ formatDate(selectedHistory.createdDate) }}</span>
              </div>
            </div>
            <div class="diff-editors">
              <div class="editor-section">
                <h4>旧值</h4>
                <div ref="oldContentEditor" class="monaco-editor"></div>
              </div>
              <div class="editor-section">
                <h4>新值</h4>
                <div ref="newContentEditor" class="monaco-editor"></div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <a-empty description="请选择一个发布记录查看差异" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onUnmounted, nextTick, shallowRef, computed } from 'vue';
import { message } from 'ant-design-vue';
import monaco from '../../../utils/monaco';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { getConfigItemReleaseHistories } from '../../../api/config/configItemReleaseHistory';
import { getConfigEnvironments } from '../../../api/config/configEnvironment';
import { getConfigItems } from '../../../api/config/configItem';
import { useConfigStore } from '@/stores/config';
import { useEnvStore } from '@/stores/env';
import type { ConfigEnvironment, ConfigItem, ConfigItemReleaseHistory } from '@/types/config';

// 扩展 dayjs 插件
dayjs.extend(utc);
dayjs.extend(timezone);


interface Props {
  configItemId: number | null;
  namespaceId?: string;
  configEnvironmentId?: number | null;
}

const props = defineProps<Props>();
const configStore = useConfigStore();
const envStore = useEnvStore();

const selectedComponentId = computed(() => configStore.selectedComponentIds[0] || null);
const currentEnv = computed(() => envStore.currentEnv);

const environments = ref<ConfigEnvironment[]>([]);
const activeEnvironmentKey = ref('');
const namespaceItems = ref<ConfigItem[]>([]);

const namespaceOptions = computed(() => {
  return namespaceItems.value.map((item) => ({
    label: item.namespaceId,
    value: item.id,
  }));
});

const loading = ref(false);
const releaseHistoryList = shallowRef<ConfigItemReleaseHistory[]>([]);
const selectedHistory = shallowRef<ConfigItemReleaseHistory | null>(null);
const oldContentEditor = ref<HTMLElement | null>(null);
const newContentEditor = ref<HTMLElement | null>(null);
let oldEditor: monaco.editor.IStandaloneCodeEditor | null = null;
let newEditor: monaco.editor.IStandaloneCodeEditor | null = null;

// 搜索和筛选相关
const selectedConfigItemId = ref<number | null>(null);
const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

// 分页
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`
});

// 表格列定义
const columns = [
  {
    title: '发布时间',
    dataIndex: 'createdDate',
    key: 'createdDate',
    width: 150
  },
  {
    title: '版本号',
    dataIndex: 'releaseName',
    key: 'releaseName',
    width: 200
  },
  {
    title: '发布类型',
    dataIndex: 'releaseType',
    key: 'releaseType',
    width: 100
  },
  {
    title: '发布者',
    dataIndex: 'createdBy',
    key: 'createdBy',
    width: 100
  }
];

// 发布类型映射
const releaseTypeMap: Record<number, string> = {
  1: '新增',
  2: '修改',
  3: '删除'
};

// 格式化日期（从 UTC 转换为本地时间显示）
const formatDate = (date: string | undefined) => {
  if (!date) return '';
  // 如果后端返回的是 UTC 时间，转换为本地时间显示
  return dayjs.utc(date).local().format('YYYY-MM-DD HH:mm:ss');
};

// 获取发布类型名称
const getReleaseTypeName = (type: number) => {
  return releaseTypeMap[type] || '未知';
};

// 获取发布类型颜色
const getReleaseTypeColor = (type: number) => {
  const colorMap: Record<number, string> = {
    1: 'green',
    2: 'blue',
    3: 'red'
  };
  return colorMap[type] || 'default';
};

// 获取行属性（用于行点击和选中样式）
const getRowProps = (record: ConfigItemReleaseHistory) => {
  return {
    style: {
      cursor: 'pointer'
    },
    class: {
      'selected-row': selectedHistory.value?.id === record.id
    },
    onClick: () => {
      handleSelectHistory(record);
    }
  };
};

// 过滤后的历史列表（仅前端关键词搜索，日期范围通过后端API查询）
const filteredHistoryList = computed(() => {
  return releaseHistoryList.value;
});

const resetPageState = () => {
  loading.value = false;
  selectedHistory.value = null;
  releaseHistoryList.value = [];
  pagination.value.current = 1;

  if (oldEditor) {
    try {
      oldEditor.dispose();
    } catch (e) {
      console.error('清理旧编辑器失败:', e);
    }
    oldEditor = null;
  }
  if (newEditor) {
    try {
      newEditor.dispose();
    } catch (e) {
      console.error('清理新编辑器失败:', e);
    }
    newEditor = null;
  }
};

const fetchEnvironments = async () => {
  if (!selectedComponentId.value || !currentEnv.value) {
    environments.value = [];
    activeEnvironmentKey.value = '';
    namespaceItems.value = [];
    selectedConfigItemId.value = null;
    return;
  }

  try {
    const response = await getConfigEnvironments({
      configComponentId: Number(selectedComponentId.value),
      envType: Number(currentEnv.value),
    });

    let envData: ConfigEnvironment[] = [];
    if (Array.isArray(response)) {
      envData = response;
    } else if (response && typeof response === 'object' && Array.isArray((response as any).data)) {
      envData = (response as any).data;
    }

    environments.value = envData;

    if (!environments.value.length) {
      activeEnvironmentKey.value = '';
      namespaceItems.value = [];
      selectedConfigItemId.value = null;
      return;
    }

    const candidateEnvironmentId =
      props.configEnvironmentId && environments.value.some((env) => env.id === props.configEnvironmentId)
        ? props.configEnvironmentId
        : Number(activeEnvironmentKey.value) && environments.value.some((env) => env.id === Number(activeEnvironmentKey.value))
          ? Number(activeEnvironmentKey.value)
          : environments.value[0].id;

    activeEnvironmentKey.value = String(candidateEnvironmentId);
    await fetchNamespaceList(candidateEnvironmentId);
  } catch (error) {
    console.error('加载环境列表失败:', error);
    message.error('加载环境列表失败');
  }
};

const fetchNamespaceList = async (environmentId: number) => {
  try {
    const response = await getConfigItems({
      pageNo: 1,
      pageSize: 1000,
      configEnvironmentId: environmentId,
    });

    namespaceItems.value = response?.data || [];

    const matchedById = props.configItemId
      ? namespaceItems.value.find((item) => item.id === props.configItemId)
      : null;
    const matchedByNamespace = props.namespaceId
      ? namespaceItems.value.find((item) => item.namespaceId === props.namespaceId)
      : null;

    const keepSelected =
      selectedConfigItemId.value && namespaceItems.value.some((item) => item.id === selectedConfigItemId.value)
        ? selectedConfigItemId.value
        : null;

    selectedConfigItemId.value = keepSelected || matchedById?.id || matchedByNamespace?.id || namespaceItems.value[0]?.id || null;

    resetPageState();
    if (selectedConfigItemId.value) {
      await fetchReleaseHistories(selectedConfigItemId.value);
    }
  } catch (error) {
    console.error('加载命名空间列表失败:', error);
    message.error('加载命名空间列表失败');
    namespaceItems.value = [];
    selectedConfigItemId.value = null;
  }
};

watch(
  [selectedComponentId, currentEnv],
  () => {
    fetchEnvironments();
  },
  { immediate: true }
);

// 获取发布历史
const fetchReleaseHistories = async (configItemId: number) => {
  loading.value = true;
  try {
    const createdDateStart = dateRange.value?.[0]
      ? dateRange.value[0].utc().format('YYYY-MM-DDTHH:mm:ss[Z]')
      : undefined;
    const createdDateEnd = dateRange.value?.[1]
      ? dateRange.value[1].utc().format('YYYY-MM-DDTHH:mm:ss[Z]')
      : undefined;

    const requestParams = {
      configItemId: configItemId,
      pageNo: pagination.value.current,
      pageSize: pagination.value.pageSize,
      sort: '-createdDate',
      createdDateStart,
      createdDateEnd,
    };

    const response = await getConfigItemReleaseHistories(requestParams);
    
    await nextTick();
    
    if (response && Array.isArray(response)) {
      releaseHistoryList.value = response;
      pagination.value.total = response.length;
      // 默认选中第一条
      if (response.length > 0) {
        await nextTick();
        handleSelectHistory(response[0]);
      }
    } else if (response?.data && Array.isArray(response.data)) {
      releaseHistoryList.value = response.data;
      pagination.value.total = response.data.length;
      // 默认选中第一条
      if (response.data.length > 0) {
        await nextTick();
        handleSelectHistory(response.data[0]);
      }
    } else {
      releaseHistoryList.value = [];
      pagination.value.total = 0;
    }
  } catch (error) {
    console.error('获取发布历史失败:', error);
    message.error('获取发布历史失败');
    releaseHistoryList.value = [];
    pagination.value.total = 0;
    selectedHistory.value = null;
    // 确保即使出现异常，loading 状态也会被重置
  } finally {
    loading.value = false;
  }
};

// 选择历史记录
const handleSelectHistory = async (history: ConfigItemReleaseHistory) => {
  try {
    selectedHistory.value = history;
    await nextTick();
    initEditors(history.oldContent || '', history.content || '');
  } catch (error) {
    console.error('选择历史记录失败:', error);
    // 即使出现异常，也确保选中状态已设置
  }
};

// 初始化两个编辑器
const initEditors = (oldContent: string, newContent: string) => {
  if (!oldContentEditor.value || !newContentEditor.value) return;

  // 销毁旧的编辑器
  if (oldEditor) {
    oldEditor.dispose();
    oldEditor = null;
  }
  if (newEditor) {
    newEditor.dispose();
    newEditor = null;
  }

  // 等待DOM更新
  nextTick(() => {
    if (!oldContentEditor.value || !newContentEditor.value) return;

    try {
      // 创建旧值编辑器
      oldEditor = monaco.editor.create(oldContentEditor.value, {
        value: oldContent,
        language: 'json',
        readOnly: true,
        theme: 'vs',
        fontSize: 13,
        minimap: { enabled: false },
        automaticLayout: true,
        scrollBeyondLastLine: false,
        wordWrap: 'on'
      });

      // 创建新值编辑器
      newEditor = monaco.editor.create(newContentEditor.value, {
        value: newContent,
        language: 'json',
        readOnly: true,
        theme: 'vs',
        fontSize: 13,
        minimap: { enabled: false },
        automaticLayout: true,
        scrollBeyondLastLine: false,
        wordWrap: 'on'
      });

      // 同步滚动
      if (oldEditor && newEditor) {
        oldEditor.onDidScrollChange(() => {
          if (newEditor) {
            newEditor.setScrollTop(oldEditor!.getScrollTop());
          }
        });
        
        newEditor.onDidScrollChange(() => {
          if (oldEditor) {
            oldEditor.setScrollTop(newEditor!.getScrollTop());
          }
        });
      }
    } catch (error) {
      console.error('初始化编辑器失败:', error);
    }
  });
};


// 处理搜索
const handleSearch = () => {
  if (!selectedConfigItemId.value) {
    message.warning('请先选择命名空间');
    return;
  }

  pagination.value.current = 1;
  fetchReleaseHistories(selectedConfigItemId.value);
};

const handleNamespaceChange = () => {
  selectedHistory.value = null;
  releaseHistoryList.value = [];

  if (selectedConfigItemId.value) {
    pagination.value.current = 1;
    fetchReleaseHistories(selectedConfigItemId.value);
  }
};

const handleEnvironmentChange = (key: string) => {
  activeEnvironmentKey.value = key;
  selectedHistory.value = null;
  releaseHistoryList.value = [];
  selectedConfigItemId.value = null;
  fetchNamespaceList(Number(key));
};

// 重置搜索
const handleResetSearch = () => {
  dateRange.value = null;
  if (selectedConfigItemId.value) {
    fetchReleaseHistories(selectedConfigItemId.value);
  }
};

// 处理表格变化
const handleTableChange = (pag: any) => {
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
  if (selectedConfigItemId.value) {
    fetchReleaseHistories(selectedConfigItemId.value);
  }
};

// 组件卸载时清理
onUnmounted(() => {
  if (oldEditor) {
    oldEditor.dispose();
  }
  if (newEditor) {
    newEditor.dispose();
  }
});
</script>

<style scoped lang="scss">
.release-history-page {
  width: 100%;
}

.page-header {
  margin-bottom: 12px;

  .page-title-group {
    h2 {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
    }

    .page-subtitle {
      margin: 6px 0 0;
      color: #666;
      font-size: 14px;
    }
  }
}

.release-history-container {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 220px);
}

.environment-selector {
  margin-bottom: 16px;

  .env-tabs-wrapper {
    background: #fff;
    border-radius: 8px;
    padding: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    border: 1px solid #f0f0f0;
  }

  .env-tabs-container {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .env-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    border-radius: 8px;
    background: #fafafa;
    border: 1px solid #e8e8e8;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    user-select: none;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);

    &:hover:not(.active) {
      background: linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 100%);
      border-color: #bfd4f2;
      box-shadow: 0 2px 8px rgba(22, 119, 255, 0.12);
      transform: translateY(-1px);

      .env-tab-name {
        color: #1677ff;
        font-weight: 500;
      }
    }

    &.active {
      background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
      border-color: #1677ff;
      box-shadow: 0 4px 12px rgba(22, 119, 255, 0.3);
      transform: translateY(-2px);

      .env-tab-name {
        color: #fff;
        font-weight: 600;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }

      &:hover {
        box-shadow: 0 6px 16px rgba(22, 119, 255, 0.4);
        transform: translateY(-2px) scale(1.02);
      }
    }

    .env-tab-name {
      font-size: 14px;
      color: #333;
      line-height: 1.5;
    }
  }
}

.search-bar {
  margin-bottom: 16px;
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;

  .search-controls {
    display: flex;
    gap: 12px;
    align-items: center;
  }
}

.content-area {
  display: flex;
  flex: 1;
  gap: 16px;
}

.left-panel {
  width: 45%;
  min-width: 520px;
  border-right: 1px solid #f0f0f0;
  padding-right: 8px;
  overflow: auto;

  .history-table {
    height: 100%;

    :deep(.ant-table-tbody > tr) {
      transition: all 0.3s;

      &:hover {
        background-color: #f5f5f5;
      }

      &.selected-row {
        box-shadow: inset 4px 0 0 #1677ff;

        > td {
          background: #d7ebff !important;
          color: #0f2f57;
          font-weight: 600;
          border-bottom-color: #91caff;
        }
      }

      &.selected-row:hover {
        > td {
          background: #c2e0ff !important;
        }
      }

      &.selected-row > td:first-child {
        border-top-left-radius: 8px;
        border-bottom-left-radius: 8px;
      }

      &.selected-row > td:last-child {
        border-top-right-radius: 8px;
        border-bottom-right-radius: 8px;
      }
    }
  }
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;

  .diff-container {
    display: flex;
    flex-direction: column;
    height: 100%;

    .diff-header {
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #f0f0f0;

      :is(h3) {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 500;
      }

      .diff-info {
        display: flex;
        gap: 24px;
        font-size: 13px;
        color: #666;
      }
    }

    .diff-editors {
      display: flex;
      gap: 8px;
      height: 540px;

      .editor-section {
        flex: 1;
        display: flex;
        flex-direction: column;

        h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 500;
          color: #666;
          text-align: center;
          padding: 8px;
          background: #f5f5f5;
          border-radius: 4px 4px 0 0;
        }

        .monaco-editor {
          flex: 1;
          border: 1px solid #d9d9d9;
          border-radius: 0 0 4px 4px;
          overflow: hidden;
        }
      }
    }
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
}
</style>