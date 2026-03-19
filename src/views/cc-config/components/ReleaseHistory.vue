<template>
  <a-modal
    v-model:open="visible"
    title="发布历史"
    :width="1400"
    :footer="null"
    @cancel="handleClose"
  >
    <div class="release-history-container">
      <!-- 顶部搜索栏 -->
      <div class="search-bar">
        <div class="search-controls">
          <a-select
            v-model:value="selectedConfigItemId"
            style="width: 200px"
            placeholder="选择配置项"
            @change="handleConfigItemChange"
          >
            <a-select-option
              v-for="item in props.dataSource"
              :key="item.id"
              :value="item.id"
            >
              {{ item.namespaceId }}
            </a-select-option>
          </a-select>
          
          <a-range-picker
            v-model:value="dateRange"
            :show-time="{ format: 'HH:mm' }"
            format="YYYY-MM-DD HH:mm"
            style="width: 300px"
            @change="handleDateChange"
          />
          
          <a-input-group compact style="width: 200px">
            <a-input
              v-model:value="searchKeyword"
              placeholder="搜索发布记录"
              style="width: 160px"
              @pressEnter="handleSearch"
            />
            <a-button type="primary" @click="handleSearch">
              <template #icon>
                <SearchOutlined />
              </template>
            </a-button>
          </a-input-group>
          
          <a-button @click="handleResetSearch">重置</a-button>
        </div>
      </div>

      <div class="content-area">
        <!-- 左侧：发布历史列表 -->
        <div class="left-panel">
          <div class="history-table">
            <a-table
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
  </a-modal>
</template>

<script lang="ts" setup>
import { ref, watch, onUnmounted, nextTick, shallowRef, computed } from 'vue';
import { message } from 'ant-design-vue';
import { SearchOutlined } from '@ant-design/icons-vue';
import monaco from '../../../utils/monaco';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { getConfigItemReleaseHistories } from '../../../api/config/configItemReleaseHistory';
import type { ConfigItem, ConfigItemReleaseHistory } from '@/types/config';

// 扩展 dayjs 插件
dayjs.extend(utc);
dayjs.extend(timezone);


interface Props {
  dataSource: ConfigItem[];
  open: boolean;
  selectedConfigItem?: ConfigItem | null;
}

interface Emits {
  (e: 'refresh-data'): void;
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visible = ref(false);
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
const searchKeyword = ref('');

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
  let filtered = releaseHistoryList.value;
  
  // 按关键词搜索（前端过滤）
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    filtered = filtered.filter(item => 
      item.releaseName.toLowerCase().includes(keyword) ||
      item.createdBy.toLowerCase().includes(keyword)
    );
  }
  
  // 日期范围已通过后端API查询，这里不再进行前端过滤
  
  return filtered;
});

// 监听弹窗打开
watch(() => props.open, (isOpen) => {
  // 确保状态同步
  visible.value = isOpen;
  
  if (isOpen) {
    // 重置状态
    loading.value = false;
    selectedHistory.value = null;
    releaseHistoryList.value = [];
    searchKeyword.value = '';
    dateRange.value = null;
    pagination.value.current = 1;
    
    // 清理编辑器
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
    
    // 如果有选中的配置项，加载数据
    if (props.selectedConfigItem) {
      selectedConfigItemId.value = props.selectedConfigItem.id;
      fetchReleaseHistories(props.selectedConfigItem.id);
    }
  }
}, { immediate: true });

// 监听 visible 变化，同步到父组件
watch(visible, (val) => {
  if (!val) {
    emit('close');
  }
});

// 获取发布历史
const fetchReleaseHistories = async (configItemId: number) => {
  loading.value = true;
  try {
    // 处理日期范围，转换为 UTC 时间
    let createdDateStart = '';
    let createdDateEnd = '';
    if (dateRange.value && dateRange.value.length === 2) {
      const [start, end] = dateRange.value;
      // 转换为 UTC 时间格式
      createdDateStart = start.utc().format('YYYY-MM-DD HH:mm:ss');
      createdDateEnd = end.utc().format('YYYY-MM-DD HH:mm:ss');
    }

    const requestParams = {
      configItemId: configItemId,
      pageNo: pagination.value.current,
      pageSize: pagination.value.pageSize,
      createdDateStart: createdDateStart,
      createdDateEnd: createdDateEnd
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



// 处理配置项变化
const handleConfigItemChange = (value: number) => {
  selectedConfigItemId.value = value;
  fetchReleaseHistories(value);
};

// 处理日期变化
const handleDateChange = () => {
  // 日期变化时重新获取数据
  if (selectedConfigItemId.value) {
    pagination.value.current = 1; // 重置到第一页
    fetchReleaseHistories(selectedConfigItemId.value);
  }
};

// 处理搜索
const handleSearch = () => {
  // 搜索时重新获取数据
  if (selectedConfigItemId.value) {
    pagination.value.current = 1; // 重置到第一页
    fetchReleaseHistories(selectedConfigItemId.value);
  }
};

// 重置搜索
const handleResetSearch = () => {
  searchKeyword.value = '';
  dateRange.value = null;
  selectedConfigItemId.value = null;
};

// 处理表格变化
const handleTableChange = (pag: any) => {
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
  if (selectedConfigItemId.value) {
    fetchReleaseHistories(selectedConfigItemId.value);
  }
};

// 关闭弹窗
const handleClose = () => {
  try {
    visible.value = false;
    loading.value = false;
    selectedHistory.value = null;
    releaseHistoryList.value = [];
    searchKeyword.value = '';
    dateRange.value = null;
    selectedConfigItemId.value = null;
    pagination.value.current = 1;
    
    // 清理编辑器
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
  } catch (error) {
    console.error('关闭弹窗时出现异常:', error);
    // 确保 visible 状态被重置
    visible.value = false;
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
.release-history-container {
  display: flex;
  flex-direction: column;
  height: 600px;
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
  width: 500px;
  border-right: 1px solid #f0f0f0;
  overflow: hidden;

  .history-table {
    height: 100%;

    :deep(.ant-table-tbody > tr) {
      transition: all 0.3s;

      &:hover {
        background-color: #f5f5f5;
      }

      &.selected-row {
        background-color: #e6f7ff !important;
        border-color: #1890ff;
      }

      &.selected-row:hover {
        background-color: #bae7ff !important;
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
      height: 400px;

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