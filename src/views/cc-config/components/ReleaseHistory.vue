<template>
  <div class="release-history">
    <!-- 发布历史弹窗 -->
    <a-modal
      v-model:open="showReleaseHistoryModal"
      title="发布历史"
      :width="1200"
      :footer="null"
    >
      <div class="release-history-container">
        <!-- 左侧区域 -->
        <div class="left-section">
          <!-- 筛选区域 -->
          <div class="filter-section">
            <div class="config-items">
              <h4>配置项列表</h4>
              <a-select
                v-model:value="selectedConfigItemId"
                style="width: 100%"
                placeholder="请选择配置项"
                @change="handleConfigItemChange"
              >
                <a-select-option
                  v-for="item in dataSource"
                  :key="item.id"
                  :value="item.id"
                >
                  {{ item.namespaceId }}
                </a-select-option>
              </a-select>
            </div>
            <div class="time-filter">
              <h4>时间筛选</h4>
              <div class="filter-controls">
                <a-select
                  v-model:value="timeRangeType"
                  style="width: 100%"
                  placeholder="请选择时间范围"
                  @change="handleTimeRangeTypeChange"
                >
                  <a-select-option value="1">最近一天</a-select-option>
                  <a-select-option value="2">最近两天</a-select-option>
                  <a-select-option value="7">最近一周</a-select-option>
                  <a-select-option value="30">最近一月</a-select-option>
                  <a-select-option value="90">最近三月</a-select-option>
                  <a-select-option value="custom">自定义时间</a-select-option>
                </a-select>
                <div class="date-pickers">
                  <a-date-picker
                    v-model:value="startDate"
                    style="width: 100%"
                    :show-time="{ format: 'HH:mm' }"
                    format="YYYY-MM-DD HH:mm"
                    placeholder="开始时间"
                    @change="handleDateChange"
                  />
                  <a-date-picker
                    v-model:value="endDate"
                    style="width: 100%"
                    :show-time="{ format: 'HH:mm' }"
                    placeholder="结束时间"
                    @change="handleDateChange"
                  />
                </div>
                <a-button type="primary" @click="handleSearch" style="width: 100%">搜索</a-button>
              </div>
            </div>
          </div>

          <!-- 发布历史时间线 -->
          <div class="history-timeline">
            <h4>发布历史</h4>
            <a-timeline>
              <a-timeline-item
                v-for="(history, index) in releaseHistoryList"
                :key="index"
                :color="history.id === selectedReleaseHistory?.id ? 'blue' : 'gray'"
              >
                <template #dot>
                  <ClockCircleOutlined v-if="history.id === selectedReleaseHistory?.id" />
                </template>
                <div 
                  class="history-item" 
                  :class="{ active: history.id === selectedReleaseHistory?.id }"
                  @click="handleReleaseHistoryClick(history)"
                >
                  <div class="history-header">
                    <span class="release-name">{{ history.releaseName }}</span>
                    <span class="release-type">{{ releaseTypeMap[history.releaseType] }}</span>
                  </div>
                  <div class="history-info">
                    <span class="history-time">{{ formatDate(history.createdDate) }}</span>
                    <span class="history-user">发布人：{{ history.createdBy }}</span>
                  </div>
                </div>
              </a-timeline-item>
            </a-timeline>
            <!-- 分页 -->
            <div class="pagination-container">
              <a-pagination
                v-model:pageNo="historyPagination.pageNo"
                :total="historyPagination.total"
                :pageSize="historyPagination.pageSize"
                @change="handleHistoryPageChange"
                size="small"
                :showTotal="total => `共 ${total} 条`"
              />
            </div>
          </div>
        </div>

        <!-- 右侧差异对比区域 -->
        <div class="diff-content">
          <div class="diff-header">
            <h3 v-if="selectedReleaseHistory">{{ selectedReleaseHistory.releaseName }}</h3>
            <h3 v-else>暂无发布历史信息</h3>
            <div class="diff-info">
              <span>发布类型：{{ selectedReleaseHistory?.releaseType ? releaseTypeMap[selectedReleaseHistory.releaseType] : '' }}</span>
              <span>发布人：{{ selectedReleaseHistory?.createdBy || '' }}</span>
              <span>发布时间：{{ formatDate(selectedReleaseHistory?.createdDate) }}</span>
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
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, nextTick, onUnmounted } from 'vue';
import { message } from 'ant-design-vue';
import { getConfigItemReleaseHistories, type ConfigItemReleaseHistory } from '../../../api/config/configItemReleaseHistory';
import type { ConfigItem } from '../../../api/config/configItem';
import { ClockCircleOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import * as monaco from 'monaco-editor';

interface Props {
  dataSource: ConfigItem[];
}

interface Emits {
  (e: 'refresh-data'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 发布历史相关
const showReleaseHistoryModal = ref(false);
const releaseHistoryList = ref<ConfigItemReleaseHistory[]>([]);
interface ReleaseHistory {
  id: number;
  releaseType: number;
  releaseName: string;
  content: string;
  oldContent: string;
  createdBy: string;
  createdDate: string;
}

const selectedReleaseHistory = ref<ReleaseHistory | null>(null);
const selectedConfigItemId = ref<number | null>(null);
const timeRangeType = ref('7'); // 默认选择最近一周
const startDate = ref<dayjs.Dayjs | null>(null);
const endDate = ref<dayjs.Dayjs | null>(null);

// 发布类型映射
const releaseTypeMap: Record<number, string> = {
  1: '普通发布',
  2: '灰度发布'
};

// 发布历史分页
const historyPagination = ref({
  pageNo: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true
});

// 编辑器引用
const oldContentEditor = ref<HTMLElement | null>(null);
const newContentEditor = ref<HTMLElement | null>(null);
let oldEditor: any = null;
let newEditor: any = null;

// 打开发布历史弹窗
const openReleaseHistoryModal = (record: ConfigItem) => {
  selectedConfigItemId.value = record.id;
  showReleaseHistoryModal.value = true;
  fetchReleaseHistories(record.id);
};

// 获取发布历史
const fetchReleaseHistories = async (configItemId: number, params?: { startDate?: string; endDate?: string }) => {
  try {
    const requestParams = {
      configItemId: configItemId,
      pageNo: historyPagination.value.pageNo,
      pageSize: historyPagination.value.pageSize,
      createdDateStart: params?.startDate || '',
      createdDateEnd: params?.endDate || ''
    };

    console.log('Request params:', requestParams);
    
    const response = await getConfigItemReleaseHistories(requestParams);
    if (response?.data?.data && response.data.data.length > 0) {
      releaseHistoryList.value = response.data.data;
      handleReleaseHistoryClick(releaseHistoryList.value[0]);
    } else {
      releaseHistoryList.value = [];
      selectedReleaseHistory.value = null;
      // 清除差异对比区域
      if (oldEditor) {
        oldEditor.setValue('');
      }
      if (newEditor) {
        newEditor.setModel({
          original: monaco.editor.createModel('', 'yaml'),
          modified: monaco.editor.createModel('', 'yaml')
        });
      }
      historyPagination.value.total = 0;
    }
    
  } catch (error) {
    message.error('获取发布历史失败');
    console.error('获取发布历史失败:', error);
    // 发生错误时也清除数据
    releaseHistoryList.value = [];
    selectedReleaseHistory.value = null;
    if (oldEditor) {
      oldEditor.setValue('');
    }
    if (newEditor) {
      newEditor.setModel({
        original: monaco.editor.createModel('', 'yaml'),
        modified: monaco.editor.createModel('', 'yaml')
      });
    }
  }
};

// 处理发布历史点击
const handleReleaseHistoryClick = (history: any) => {
  if (!history) {
    selectedReleaseHistory.value = null;
    // 清除差异对比区域
    if (oldEditor) {
      oldEditor.setValue('');
    }
    if (newEditor) {
      newEditor.setModel({
        original: monaco.editor.createModel('', 'yaml'),
        modified: monaco.editor.createModel('', 'yaml')
      });
    }
    return;
  }
  
  selectedReleaseHistory.value = history;
  nextTick(() => {
    initDiffEditors(history.oldContent, history.content);
  });
};

// 初始化差异编辑器
const initDiffEditors = async (oldContent: string, newContent: string) => {
  if (!oldContentEditor.value || !newContentEditor.value) return;

  if (oldEditor) {
    oldEditor.dispose();
  }
  if (newEditor) {
    newEditor.dispose();
  }

  // 初始化旧值编辑器
  oldEditor = monaco.editor.create(oldContentEditor.value, {
    value: oldContent || '',
    language: 'yaml',
    theme: 'vs-dark',
    readOnly: true,
    minimap: { enabled: false },
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    fontSize: 14
  });

  // 初始化新值编辑器，使用 diffEditor
  newEditor = monaco.editor.createDiffEditor(newContentEditor.value, {
    originalEditable: false,
    readOnly: true,
    renderSideBySide: true,
    minimap: { enabled: false },
    fontSize: 14
  });

  // 设置差异编辑器的内容
  newEditor.setModel({
    original: monaco.editor.createModel(oldContent || '', 'yaml'),
    modified: monaco.editor.createModel(newContent || '', 'yaml')
  });
};

// 处理时间范围类型变化
const handleTimeRangeTypeChange = (value: string) => {
  if (value === 'custom') {
    // 如果选择自定义时间，清空日期
    startDate.value = null;
    endDate.value = null;
    return;
  }
  
  const days = parseInt(value);
  const end = dayjs();
  const start = end.subtract(days, 'day');
  startDate.value = start;
  endDate.value = end;
  
  // 自动触发搜索
  handleSearch();
};

// 处理日期选择变化
const handleDateChange = () => {
  // 当选择日期时，将时间范围类型设置为自定义
  timeRangeType.value = 'custom';
};

// 处理搜索按钮点击
const handleSearch = () => {
  if (!selectedConfigItemId.value) {
    message.warning('请选择配置项');
    return;
  }

  if (!startDate.value || !endDate.value) {
    message.warning('请选择时间范围');
    return;
  }

  historyPagination.value.pageNo = 1; // 重置分页到第一页
  
  // 确保开始时间和结束时间都存在且格式正确
  const start = startDate.value ? dayjs(startDate.value).utc().format() : '';
  const end = endDate.value ? dayjs(endDate.value).utc().format() : '';
  
  if (!start || !end) {
    message.warning('时间格式不正确');
    return;
  }

  fetchReleaseHistories(selectedConfigItemId.value, {
    startDate: start,
    endDate: end
  });
};

// 更新配置项变化处理函数
const handleConfigItemChange = async (value: number) => {
  selectedConfigItemId.value = value;
  historyPagination.value.pageNo = 1; // 重置分页到第一页
  
  // 如果已经选择了时间范围，自动触发搜索
  if (startDate.value && endDate.value) {
    handleSearch();
  } else {
    // 否则使用默认时间范围
    handleTimeRangeTypeChange(timeRangeType.value);
  }
};

// 处理历史分页变化
const handleHistoryPageChange = (page: number) => {
  historyPagination.value.pageNo = page;
  if (selectedConfigItemId.value) {
    fetchReleaseHistories(selectedConfigItemId.value);
  }
};

// 格式化日期
const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

// 暴露方法给父组件
defineExpose({
  openReleaseHistoryModal
});

// 在组件卸载时清理编辑器实例
onUnmounted(() => {
  if (oldEditor) {
    oldEditor.dispose();
  }
  if (newEditor) {
    newEditor.dispose();
  }
});
</script>

<style lang="scss" scoped>
.release-history {
  .release-history-container {
    display: flex;
    gap: 24px;
    height: 600px;

    .left-section {
      width: 300px;
      display: flex;
      flex-direction: column;
      gap: 24px;

      .filter-section {
        border: 1px solid var(--border-color);
        border-radius: 4px;
        padding: 16px;
      }

      .history-timeline {
        flex: 1;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        overflow: hidden;

        h4 {
          margin: 0 0 12px 0;
          color: var(--text-color);
        }

        :deep(.ant-timeline) {
          flex: 1;
          overflow-y: auto;
          padding-right: 8px;
        }

        .history-item {
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;
          transition: all 0.3s;

          &:hover {
            background-color: rgba(var(--primary-6), 0.1);
          }

          &.active {
            background-color: rgba(var(--primary-6), 0.15);
          }

          .history-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;

            .release-name {
              font-weight: 500;
              color: var(--text-color);
            }

            .release-type {
              font-size: 12px;
              padding: 2px 6px;
              border-radius: 10px;
              background-color: var(--primary-1);
              color: var(--primary-6);
            }
          }

          .history-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
            font-size: 12px;
            color: var(--text-color-secondary);
          }
        }

        .pagination-container {
          margin-top: 16px;
          display: flex;
          justify-content: center;
        }
      }
    }

    .diff-content {
      flex: 1;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 16px;
      display: flex;
      flex-direction: column;

      .diff-header {
        margin-bottom: 16px;

        h3 {
          margin: 0 0 8px 0;
          color: var(--text-color);
        }

        .diff-info {
          display: flex;
          gap: 16px;
          color: var(--text-color-secondary);
          font-size: 13px;
        }
      }

      .diff-editors {
        flex: 1;
        display: flex;
        gap: 16px;

        .editor-section {
          flex: 1;
          display: flex;
          flex-direction: column;

          h4 {
            margin: 0 0 8px 0;
            color: var(--text-color);
          }

          .monaco-editor {
            flex: 1;
            border: 1px solid var(--border-color);
            border-radius: 2px;
            height: 400px; // 设置固定高度
          }
        }
      }
    }
  }
}

:deep(.diff-line-deleted) {
  background-color: rgba(255, 0, 0, 0.2);
}

:deep(.diff-line-added) {
  background-color: rgba(0, 255, 0, 0.2);
}

:deep(.diff-line-indicator-deleted) {
  border-left: 3px solid #ff4d4f;
}

:deep(.diff-line-indicator-added) {
  border-left: 3px solid #52c41a;
}
</style>
