<template>
  <div class="cc-config-container">
    <!-- 环境标签页 -->
    <div class="environment-tabs">
      <a-tabs
        v-model:activeKey="activeTabKey"
        type="editable-card"
        @edit="handleTabEdit"
        :animated="{ tabPane: true }"
        :tabBarGutter="8"
      >
        <a-tab-pane
          v-for="env in environments"
          :key="env.id"
          :tab="env.name"
          :closable="environments.length > 1"
          :forceRender="true"
        >
          <!-- 表格内容 -->
          <div class="table-container">
            <div class="table-header">
              <div class="left-actions">
                <a-button type="primary" @click="handleCloneNamespace">克隆命名空间</a-button>
                <a-button 
                  type="primary" 
                  :disabled="!selectedRowKeys.length"
                  @click="handleBatchPublish"
                >
                  批量发布
                </a-button>
              </div>
              <div class="right-actions">
                <a-button type="primary" @click="handleAdd">新增配置</a-button>
              </div>
            </div>
            <a-table
              :columns="columns"
              :data-source="dataSource"
              :pagination="pagination"
              :row-key="record => record.id"
              :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
              @change="handleTableChange"
              :loading="loading"
            >
              <template #bodyCell="{ column, record }">
                <!-- 发布状态列 -->
                <template v-if="column.dataIndex === 'namespaceStatus'">
                  <a-tag :color="statusMap[record.namespaceStatus]?.color || 'default'">
                    {{ statusMap[record.namespaceStatus]?.text || '未知' }}
                  </a-tag>
                </template>

                <!-- 格式类型列 -->
                <template v-if="column.dataIndex === 'formatType'">
                  {{ formatMap[record.formatType] || '未知' }}
                </template>

                <!-- 类型列 -->
                <template v-if="column.dataIndex === 'type'">
                  {{ typeMap[record.type] || '未知' }}
                </template>

                <!-- 操作列 -->
                <template v-if="column.dataIndex === 'action'">
                  <div class="action-buttons">
                    <a-button type="link" @click="handleView(record)">查看</a-button>
                    <a-button type="link" @click="handleEdit(record)">编辑</a-button>
                    <a-button type="link" status="danger" @click="handleDelete(record)">删除</a-button>
                    <a-button type="link" @click="handleViewReleaseHistory(record)">发布历史</a-button>
                    <a-button type="link" @click="handlePublish(record)">发布</a-button>
                  </div>
                </template>
              </template>
            </a-table>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>

    <!-- 新增环境对话框 -->
    <a-modal
      v-model:visible="showAddModal"
      title="新增环境"
      @ok="handleAddEnvironment"
      @cancel="handleAddEnvironmentCancel"
      cancelText="取消"
      okText="确定"
    >
      <a-form :model="newEnvironment" :rules="rules" ref="formRef">
        <a-form-item label="环境名称" name="name">
          <a-input v-model:value="newEnvironment.name" placeholder="请输入环境名称" />
        </a-form-item>
        <a-form-item label="显示名称" name="displayName">
          <a-input v-model:value="newEnvironment.displayName" placeholder="请输入显示名称" />
        </a-form-item>
        <a-form-item label="环境类型" name="envType">
          <span class="env-type-text">{{ currentEnvTypeLabel }}</span>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 代码编辑器 -->
    <code-editor
      v-model:visible="showEditor"
      :title="editorTitle"
      :content="editorContent"
      :read-only="editorReadOnly"
      :env-name="environments.find(env => env.id === Number(activeTabKey))?.displayName"
      :history-list="modifyHistoryList"
      @save="handleSave"
    />

    <!-- 发布历史弹窗 -->
    <a-modal
      v-model:visible="showReleaseHistoryModal"
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
                    format="YYYY-MM-DD HH:mm"
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

    <!-- 发布弹窗 -->
    <a-modal
      v-model:visible="showPublishModal"
      title="发布配置"
      ok-text="确定"
      cancel-text="取消"
      @ok="handlePublishSubmit"
      @cancel="handlePublishCancel"
      :width="800"
    >
      <a-form :model="publishForm" :rules="publishRules" ref="publishFormRef">
        <a-form-item label="发布名称" name="releaseName">
          <a-input v-model:value="publishForm.releaseName" placeholder="请输入发布名称" />
        </a-form-item>
        
        <a-form-item label="发布类型" name="releaseType">
          <a-radio-group v-model:value="publishForm.releaseType">
            <a-radio :value="1">普通发布</a-radio>
            <a-radio :value="2">灰度发布</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item label="配置比对">
          <a-collapse>
            <a-collapse-panel key="1" header="展开配置比对">
              <div class="compare-section">
                <div class="compare-controls">
                  <a-form-item label="目标环境" name="targetEnvironmentId">
                    <a-select
                      v-model:value="publishForm.targetEnvironmentId"
                      placeholder="请选择环境"
                      @change="handleTargetEnvironmentChange"
                      style="width: 200px"
                    >
                      <a-select-option
                        v-for="env in targetEnvironments"
                        :key="env.id"
                        :value="env.id"
                      >
                        {{ env.displayName }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                  
                  <a-form-item label="命名空间" name="targetNamespaceId">
                    <a-select
                      v-model:value="publishForm.targetNamespaceId"
                      placeholder="请选择命名空间"
                      style="width: 200px"
                    >
                      <a-select-option
                        v-for="item in targetConfigItems"
                        :key="item.id"
                        :value="item.namespaceId"
                      >
                        {{ item.namespaceId }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>

                  <a-button type="primary" @click="handleCompare">比对</a-button>
                </div>

                <div v-if="showCompareResult" class="compare-result">
                  <div class="editor-container">
                    <h4>当前配置</h4>
                    <div ref="currentContentEditor" class="monaco-editor"></div>
                  </div>
                  <div class="editor-container">
                    <h4>目标配置</h4>
                    <div ref="targetContentEditor" class="monaco-editor"></div>
                  </div>
                </div>
              </div>
            </a-collapse-panel>
          </a-collapse>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 新增配置弹窗 -->
    <a-modal
      v-model:visible="showAddConfigModal"
      title="新增配置"
      ok-text="确定"
      cancel-text="取消"
      @ok="handleAddConfigSubmit"
      @cancel="handleAddConfigCancel"
      :width="800"
      :maskClosable="false"
    >
      <a-form :model="newConfigForm" :rules="configRules" ref="configFormRef">
        <a-form-item label="命名空间类型" name="type">
          <a-radio-group v-model:value="newConfigForm.type">
            <a-radio :value="1">私有</a-radio>
            <a-radio :value="2">公共</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item label="命名空间ID" name="namespaceId">
          <a-input v-model:value="newConfigForm.namespaceId" placeholder="请输入命名空间ID" />
        </a-form-item>

        <a-form-item label="格式类型" name="formatType">
          <a-select v-model:value="newConfigForm.formatType" placeholder="请选择格式类型">
            <a-select-option :value="1">YML</a-select-option>
            <a-select-option :value="2">Properties</a-select-option>
            <a-select-option :value="3">TXT</a-select-option>
            <a-select-option :value="4">JSON</a-select-option>
            <a-select-option :value="5">XML</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="配置内容" name="content">
          <div ref="addConfigEditor" class="config-editor"></div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 克隆命名空间弹窗 -->
    <a-modal
      v-model:visible="showCloneModal"
      title="克隆命名空间"
      ok-text="确定"
      cancel-text="取消"
      @ok="handleCloneSubmit"
      @cancel="showCloneModal = false"
      :confirmLoading="cloneLoading"
    >
      <a-form :model="cloneForm" ref="cloneFormRef">
        <a-form-item label="源环境" name="sourceEnvironmentId">
          <a-input :value="currentEnvironment?.name" disabled />
        </a-form-item>
        <a-form-item label="目标环境" name="targetEnvironmentId" :rules="[{ required: true, message: '请选择目标环境' }]">
          <a-select
            v-model:value="cloneForm.targetEnvironmentId"
            placeholder="请选择目标环境"
          >
            <a-select-option
              v-for="env in targetEnvironments"
              :key="env.id"
              :value="env.id"
            >
              {{ env.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="克隆模式" name="cloneMode" :rules="[{ required: true, message: '请选择克隆模式' }]">
          <a-radio-group v-model:value="cloneForm.cloneMode">
            <a-radio :value="1">覆盖文件</a-radio>
            <a-radio :value="2">跳过同名文件</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 批量发布弹窗 -->
    <a-modal
      v-model:visible="showBatchPublishModal"
      title="批量发布"
      ok-text="确定"
      cancel-text="取消"
      @ok="handleBatchPublishSubmit"
      @cancel="showBatchPublishModal = false"
      :confirmLoading="batchPublishLoading"
      :width="800"
    >
      <a-form :model="batchPublishForm" ref="batchPublishFormRef">
        <a-form-item label="发布名称" name="releaseName" :rules="[{ required: true, message: '请输入发布名称' }]">
          <a-input v-model:value="batchPublishForm.releaseName" placeholder="请输入发布名称" />
        </a-form-item>
        <a-form-item label="发布类型" name="releaseType" :rules="[{ required: true, message: '请选择发布类型' }]">
          <a-radio-group v-model:value="batchPublishForm.releaseType">
            <a-radio :value="1">普通发布</a-radio>
            <a-radio :value="2">灰度发布</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="选中的配置项">
          <a-table
            :columns="selectedItemColumns"
            :data-source="selectedItems"
            :pagination="false"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'namespaceStatus'">
                <a-tag :color="statusMap[record.namespaceStatus]?.color || 'default'">
                  {{ statusMap[record.namespaceStatus]?.text || '未知' }}
                </a-tag>
              </template>
            </template>
          </a-table>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 通知弹窗 -->
    <a-modal
      v-model:visible="notificationVisible"
      title="通知"
      :width="800"
      :footer="null"
    >
      <div class="notification-container">
        <a-tabs v-model:activeKey="activeNoticeTab">
          <a-tab-pane key="1" tab="未读">
            <a-table
              :columns="notificationColumns"
              :data-source="notifications"
              :pagination="false"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'title'">
                  <a @click="handleMarkAsRead(record)">{{ record.title }}</a>
                </template>
                <template v-if="column.dataIndex === 'content'">
                  {{ record.content }}
                </template>
                <template v-if="column.dataIndex === 'createdDate'">
                  {{ formatDate(record.createdDate) }}
                </template>
              </template>
            </a-table>
          </a-tab-pane>
          <a-tab-pane key="2" tab="已读">
            <!-- 已读通知表格内容 -->
          </a-tab-pane>
        </a-tabs>
        <div class="button-container">
          <a-button type="primary" @click="handleMarkAllAsRead">全部标记已读</a-button>
          <a-button type="primary" @click="handleClearAllNotifications">清空所有通知</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';
import { getConfigEnvironments, createConfigEnvironment, deleteConfigEnvironment } from '../../api/configEnvironment';
import type { ConfigEnvironment } from '../../api/configEnvironment';
import { getConfigItems, deleteConfigItem, updateConfigContent, createConfigItem } from '../../api/configItem';
import type { ConfigItem, ConfigItemParams } from '../../api/configItem';
import type { ConfigSubsystem } from '../../api/configSubsystem';
import type { ConfigComponent } from '../../api/configComponent';
import { getAllConfigSubsystem } from '../../api/configSubsystem';
import { getConfigComponents } from '../../api/configComponent';

import { getConfigItemReleaseHistories, type ConfigItemReleaseHistory } from '../../api/configItemReleaseHistory';
import CodeEditor from '../../components/CodeEditor.vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { ClockCircleOutlined } from '@ant-design/icons-vue';
import * as monaco from 'monaco-editor';
import { useConfigStore } from '../../stores/config';
import { useEnvStore } from '../../stores/env';
import { cloneNamespace } from '../../api/configNamespace';
import { batchPublishConfigs } from '../../api/configPublish';
import { ConfigItemHistory, getConfigItemHistories } from '../../api/configItemHistories';
import {
  getNotices,
  getNoticeByStatus,
  markNoticeAsRead,
  markAllNoticeAsRead,
  clearNotice,
  type Notice
} from '../../api/notice';

dayjs.extend(utc);

const route = useRoute();
const router = useRouter();

const configStore = useConfigStore();
const envStore = useEnvStore();

// 添加编辑器引用
const oldContentEditor = ref<HTMLElement | null>(null);
const newContentEditor = ref<HTMLElement | null>(null);
let oldEditor: any = null;
let newEditor: any = null;

// 添加loading状态
const loading = ref(false);

// 表格列定义
const columns = [
  {
    title: '命名空间',
    dataIndex: 'namespaceId',
    width: '20%',
  },
  {
    title: '发布状态',
    dataIndex: 'namespaceStatus',
    width: '10%',
  },
  {
    title: '格式类型',
    dataIndex: 'formatType',
    width: '10%',
  },
  {
    title: '类型',
    dataIndex: 'type',
    width: '10%',
  },
  {
    title: '操作人',
    dataIndex: 'updatedBy',
    width: '15%',
  },
  {
    title: '更新时间',
    dataIndex: 'updatedDate',
    width: '20%',
  },
  {
    title: '操作',
    dataIndex: 'action',
    width: '15%',
    fixed: 'right',
  },
];

// 状态映射
const statusMap = {
  1: { text: '已保存', color: 'warning' },
  2: { text: '已发布', color: 'success' },
};

// 格式类型映射
const formatMap = {
  1: 'YML',
  2: 'Properties',
  3: 'TXT',
  4: 'JSON',
  5: 'XML'
};

// 类型映射
const typeMap = {
  1: '私有',
  2: '公共',
};

// 表格数据和分页
const dataSource = ref<ConfigItem[]>([]);
const pagination = ref({
  total: 0,
  pageNo: 1,
  pageSize: 10,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

// 环境标签页相关
const activeTabKey = ref<string | number>('');
const environments = ref<ConfigEnvironment[]>([]);
const showAddModal = ref(false);
const formRef = ref<FormInstance>();
const newEnvironment = ref({
  name: '',
  displayName: '',
  envType: Number(envStore.currentEnv),
  configComponentId: 1,
  display: true
});

// 表单校验规则
const rules = {
  name: [{ required: true, message: '请输入环境名称', trigger: 'blur' }],
  displayName: [{ required: true, message: '请输入显示名称', trigger: 'blur' }],
  envType: [{ required: true, message: '请选择环境类型', trigger: 'blur' }],
};

// 添加编辑器相关的状态
const showEditor = ref(false);
const editorTitle = ref('');
const editorContent = ref('');
const editorReadOnly = ref(false);
const currentEditItem = ref<ConfigItem | null>(null);

// 修改历史相关
const modifyHistoryList = ref<ConfigItemHistory[]>([]); // 存储修改历史

// 发布历史相关
const showReleaseHistoryModal = ref(false);
const showReleaseDetailModal = ref(false);
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
const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
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

// 发布相关
const showPublishModal = ref(false);
const publishFormRef = ref<FormInstance>();
const currentPublishItem = ref<ConfigItem | null>(null);
const publishForm = ref({
  releaseName: '',
  releaseType: 1,
  targetEnvironmentId: undefined,
  targetNamespaceId: undefined
});

const publishRules = {
  releaseName: [{ required: true, message: '请输入发布名称', trigger: 'blur' }],
  releaseType: [{ required: true, message: '请选择发布类型', trigger: 'blur' }]
};

// 比对相关
const targetEnvironments = computed(() => 
  environments.value.filter(env => env.id !== Number(activeTabKey.value))
);
const targetConfigItems = ref<ConfigItem[]>([]);
const showCompareResult = ref(false);
const currentContentEditor = ref<HTMLElement | null>(null);
const targetContentEditor = ref<HTMLElement | null>(null);
let currentCompareEditor: any = null;
let targetCompareEditor: any = null;

// 新增配置相关
const showAddConfigModal = ref(false);
const configFormRef = ref<FormInstance>();
const addConfigEditor = ref<HTMLElement | null>(null);
let configMonacoEditor: any = null;

const newConfigForm = ref({
  type: 1,
  namespaceId: '',
  formatType: 1,
  content: '',
  configEnvironmentId: null as number | null
});

const configRules = {
  type: [{ required: true, message: '请选择命名空间类型', trigger: 'change' }],
  namespaceId: [{ required: true, message: '请输入命名空间ID', trigger: 'blur' }],
  formatType: [{ required: true, message: '请选择格式类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入配置内容', trigger: 'blur' }]
};

// 在 script 部分定义这些变量
const selectedComponents = ref<number[]>(configStore.selectedComponentIds);
const showComponentFilter = ref(false);
const selectedSystem = ref<number | null>(configStore.selectedSystemId);

// 状态定义
const activeFilterTab = ref('all');
const configItems = ref<ConfigItem[]>([]);

// 添加分页响应类型
interface PageResponse<T> {
  data: T[];
  total: number;
  pageNo: number;
  pageSize: number;
}

// 更新 ConfigItemResponse 类型
interface ConfigItemResponse {
  data: PageResponse<ConfigItem>;
  code: number;
  message?: string;
}

// 表格选择相关
const selectedRowKeys = ref<number[]>([]);
const selectedItems = ref<ConfigItem[]>([]);

const onSelectChange = (keys: number[], rows: ConfigItem[]) => {
  selectedRowKeys.value = keys;
  selectedItems.value = rows;
};

// 克隆命名空间相关
const showCloneModal = ref(false);
const cloneLoading = ref(false);
const cloneFormRef = ref<FormInstance>();
const cloneForm = ref({
  targetEnvironmentId: undefined as number | undefined,
  cloneMode: 1
});

// 获取当前环境
const currentEnvironment = computed(() => 
  environments.value.find(env => env.id === Number(activeTabKey.value))
);

// 处理克隆命名空间
const handleCloneNamespace = () => {
  if (!currentEnvironment.value) {
    message.error('请先选择环境');
    return;
  }
  showCloneModal.value = true;
};

// 处理克隆提交
const handleCloneSubmit = async () => {
  try {
    await cloneFormRef.value?.validate();
    cloneLoading.value = true;
    
    await cloneNamespace({
      sourceEnvironmentId: Number(activeTabKey.value),
      targetEnvironmentId: cloneForm.value.targetEnvironmentId!,
      cloneMode: cloneForm.value.cloneMode
    });
    
    message.success('克隆成功');
    showCloneModal.value = false;
    
    // 重置表单
    cloneForm.value = {
      targetEnvironmentId: undefined,
      cloneMode: 1
    };
    
    // 刷新数据
    await fetchEnvironments();
  } catch (error) {
    console.error('克隆失败:', error);
    message.error('克隆失败');
  } finally {
    cloneLoading.value = false;
  }
};

// 批量发布相关
const showBatchPublishModal = ref(false);
const batchPublishLoading = ref(false);
const batchPublishFormRef = ref<FormInstance>();
const batchPublishForm = ref({
  releaseName: dayjs().format('YYYYMMDDHHmm') + '-batch-release',
  releaseType: 1
});

// 选中项表格列定义
const selectedItemColumns = [
  {
    title: '命名空间',
    dataIndex: 'namespaceId',
    width: '40%',
  },
  {
    title: '发布状态',
    dataIndex: 'namespaceStatus',
    width: '30%',
  },
  {
    title: '更新时间',
    dataIndex: 'updatedDate',
    width: '30%',
  }
];

// 处理批量发布
const handleBatchPublish = () => {
  if (!selectedRowKeys.value.length) {
    message.warning('请先选择要发布的配置项');
    return;
  }
  showBatchPublishModal.value = true;
};

// 处理批量发布提交
const handleBatchPublishSubmit = async () => {
  try {
    await batchPublishFormRef.value?.validate();
    batchPublishLoading.value = true;
    
    await batchPublishConfigs({
      configItemIds: selectedRowKeys.value,
      releaseName: batchPublishForm.value.releaseName,
      releaseType: batchPublishForm.value.releaseType,
      environmentId: Number(activeTabKey.value)
    });
    
    message.success('发布成功');
    showBatchPublishModal.value = false;
    
    // 重置表单和选择
    batchPublishForm.value = {
      releaseName: dayjs().format('YYYYMMDDHHmm') + '-batch-release',
      releaseType: 1
    };
    selectedRowKeys.value = [];
    selectedItems.value = [];
    
    // 刷新数据
    await fetchConfigItems();
  } catch (error) {
    console.error('批量发布失败:', error);
    message.error('批量发布失败');
  } finally {
    batchPublishLoading.value = false;
  }
};

// 获取环境列表
const fetchEnvironments = async () => {
  if (!selectedComponents.value.length) {
    console.log('No component selected');
    return;
  }
  
  try {
    const componentId = selectedComponents.value[0];
    console.log('Fetching environments for component:', componentId, 'with env type:', Number(envStore.currentEnv));
    
    const response = await getConfigEnvironments({ 
      configComponentId: componentId, 
      envType: Number(envStore.currentEnv)
    });
    
    console.log('Environment API response:', response);
    
    // 处理不同格式的API响应
    if (response) {
      let envData = [];
      
      // 处理标准响应格式 { code, data, message }
      if (typeof response === 'object' && response !== null) {
        if ('data' in response && Array.isArray(response.data)) {
          envData = response.data;
          console.log('Standard response format with data array');
        } else if (Array.isArray(response)) {
          envData = response;
          console.log('Direct array response format');
        } else {
          console.warn('Unknown response format:', response);
        }
      } else {
        console.warn('Response is not an object:', typeof response);
      }
      
      // 确保环境数据为数组
      environments.value = Array.isArray(envData) ? envData : [];
      console.log('Parsed environments:', environments.value);
      
      // 如果有环境数据，设置默认选中第一个环境
      if (environments.value.length > 0) {
        // 重置 activeTabKey 为第一个环境的 id
        activeTabKey.value = environments.value[0].id;
        console.log('Selected first environment:', activeTabKey.value);
        // 重置分页
        pagination.value.pageNo = 1;
        // 立即获取配置项列表
        await fetchConfigItems();
      } else {
        console.warn('No environments found');
        activeTabKey.value = '';
        dataSource.value = [];
      }
    } else {
      console.warn('Empty response from environment API');
      environments.value = [];
      activeTabKey.value = '';
      dataSource.value = [];
    }
  } catch (error) {
    console.error('获取环境列表失败:', error);
    message.error('获取环境列表失败');
    environments.value = [];
    activeTabKey.value = '';
    dataSource.value = [];
  }
};

// 获取组件列表
const fetchComponents = async (subsystemId: number) => {
  try {
    console.log('Fetching components for subsystem:', subsystemId);
    const response = await getConfigComponents({ subsystemId });
    console.log('Components API response:', response);
    
    // 处理不同格式的API响应
    if (response) {
      let componentData = [];
      
      // 处理标准响应格式 { code, data, message }
      if (typeof response === 'object' && response !== null) {
        if ('data' in response && Array.isArray(response.data)) {
          componentData = response.data;
          console.log('Standard response format with data array');
        } else if (Array.isArray(response)) {
          componentData = response;
          console.log('Direct array response format');
        } else {
          console.warn('Unknown response format:', response);
        }
      } else if (Array.isArray(response)) {
        componentData = response;
        console.log('Response is directly an array');
      } else {
        console.warn('Response is not an object or array:', typeof response);
      }
      
      // 过滤掉无效项
      components.value = componentData.filter(item => item !== undefined);
      console.log('Parsed components:', components.value.length);
    } else {
      console.warn('Empty response from components API');
      components.value = [];
    }
  } catch (error) {
    console.error('获取组件列表失败:', error);
    message.error('获取组件列表失败');
    components.value = [];
  }
};

// 获取子系统列表
const fetchSubsystems = async () => {
  loading.value = true;
  try {
    console.log('Fetching subsystems');
    const response = await getAllConfigSubsystem();
    console.log('Subsystems API response:', response);
    
    // 处理不同格式的API响应
    if (response) {
      let subsystemData = [];
      
      // 处理标准响应格式 { code, data, message }
      if (typeof response === 'object' && response !== null) {
        if ('data' in response && Array.isArray(response.data)) {
          subsystemData = response.data;
          console.log('Standard response format with data array');
        } else if (Array.isArray(response)) {
          subsystemData = response;
          console.log('Direct array response format');
        } else {
          console.warn('Unknown response format:', response);
        }
      } else if (Array.isArray(response)) {
        subsystemData = response;
        console.log('Response is directly an array');
      } else {
        console.warn('Response is not an object or array:', typeof response);
      }
      
      // 过滤掉无效项
      subsystems.value = subsystemData.filter(item => item !== undefined);
      console.log('Parsed subsystems:', subsystems.value.length);
    } else {
      console.warn('Empty response from subsystems API');
      subsystems.value = [];
    }
  } catch (error) {
    console.error('获取子系统列表失败:', error);
    message.error('获取子系统列表失败');
    subsystems.value = [];
  } finally {
    loading.value = false;
  }
};

// 获取配置项列表
const fetchConfigItems = async () => {
  if (!activeTabKey.value) {
    console.log('No active environment tab');
    dataSource.value = [];
    return;
  }
  
  loading.value = true;
  try {
    const envId = Number(activeTabKey.value);
    console.log('Fetching config items for environment:', envId);
    
    const response = await getConfigItems({
      pageNo: pagination.value.pageNo,
      pageSize: pagination.value.pageSize,
      configEnvironmentId: envId
    });
    
    console.log('Config items API response:', response);
    
    // 处理不同格式的API响应
    if (response) {
      // 处理标准响应格式 { code, data: { data, total }, message }
      if (typeof response === 'object' && response !== null) {
        if ('data' in response) {
          if (typeof response.data === 'object' && response.data !== null) {
            // 标准分页响应
            if ('data' in response.data && Array.isArray(response.data.data)) {
              dataSource.value = response.data.data;
              pagination.value.total = response.data.total || 0;
              console.log('Standard pagination response format');
            }
            // 直接数据数组
            else if (Array.isArray(response.data)) {
              dataSource.value = response.data;
              pagination.value.total = response.data.length;
              console.log('Direct data array in response.data');
            }
            else {
              console.warn('Unknown data format in response.data:', response.data);
              dataSource.value = [];
              pagination.value.total = 0;
            }
          } else if (Array.isArray(response.data)) {
            dataSource.value = response.data;
            pagination.value.total = response.data.length;
            console.log('Array in response.data');
          } else {
            console.warn('response.data is not an object or array:', response.data);
            dataSource.value = [];
            pagination.value.total = 0;
          }
        } 
        // 直接是数组
        else if (Array.isArray(response)) {
          dataSource.value = response;
          pagination.value.total = response.length;
          console.log('Direct array response');
        } else {
          console.warn('Unknown response format:', response);
          dataSource.value = [];
          pagination.value.total = 0;
        }
      } else {
        console.warn('Response is not an object:', typeof response);
        dataSource.value = [];
        pagination.value.total = 0;
      }
    } else {
      console.warn('Empty response from config items API');
      dataSource.value = [];
      pagination.value.total = 0;
    }
    
    console.log('Loaded config items:', dataSource.value.length, 'Total:', pagination.value.total);
  } catch (error) {
    console.error('获取配置项列表失败:', error);
    message.error('获取配置项列表失败');
    dataSource.value = [];
    pagination.value.total = 0;
  } finally {
    loading.value = false;
  }
};

// 监听标签页切换和分页变化
watch(activeTabKey, async (newKey) => {
  if (newKey !== undefined && newKey !== '') {
    pagination.value.pageNo = 1;
    await fetchConfigItems();
  }
});

// 处理分页变化
const handleTableChange = (pag: any) => {
  pagination.value = {
    ...pagination.value,
    pageNo: pag.pageNo,
    pageSize: pag.pageSize
  };
  fetchConfigItems();
};

// 处理标签页编辑（新增/删除）
const handleTabEdit = async (targetKey: string | number, action: 'add' | 'remove') => {
  if (action === 'add') {
    // 检查是否有选中的组件
    if (!selectedComponents.value.length) {
      message.error('请先选择组件');
      return;
    }
    // 设置默认的组件ID和环境类型
    newEnvironment.value = {
      name: '',
      displayName: '',
      envType: Number(envStore.currentEnv),
      configComponentId: selectedComponents.value[0],
      display: true
    };
    showAddModal.value = true;
  } else if (action === 'remove' && targetKey) {
    try {
      await deleteConfigEnvironment(Number(targetKey));
      message.success('删除环境成功');
      await fetchEnvironments();
      // 如果删除的是当前激活的标签页，自动切换到第一个标签页
      if (targetKey === activeTabKey.value) {
        activeTabKey.value = environments.value.length > 0 ? environments.value[0].id : '';
        if (activeTabKey.value) {
          await fetchConfigItems();
        }
      }
    } catch (error) {
      console.error('删除环境失败:', error);
      message.error('删除环境失败');
    }
  }
};

// 处理新增环境
const handleAddEnvironment = async () => {
  try {
    // 先进行表单验证
    if (!formRef.value) {
      return;
    }
    await formRef.value.validate();

    // 检查组件选择
    if (!selectedComponents.value.length) {
      message.error('请先选择组件');
      return;
    }
    
    // 设置组件ID
    const componentId = selectedComponents.value[0];
    const params = {
      ...newEnvironment.value,
      configComponentId: componentId
    };
    
    const response = await createConfigEnvironment(params);
    if (response?.data) {
      // 先重置表单
      formRef.value.resetFields();
      newEnvironment.value = { 
        name: '', 
        displayName: '', 
        envType: Number(envStore.currentEnv), 
        configComponentId: componentId, 
        display: true 
      };
      
      // 关闭弹窗
      showAddModal.value = false;
      
      // 显示成功消息
      message.success('新增环境成功');
      
      // 重新获取环境列表
      await fetchEnvironments();
      
      // 如果有新环境，设置为当前激活的环境
      if (environments.value.length > 0) {
        const newEnv = environments.value.find(env => env.id === response.data.id);
        if (newEnv) {
          activeTabKey.value = newEnv.id;
          await fetchConfigItems();
        }
      }
    }
  } catch (error) {
    console.error('新增环境失败:', error);
    message.error('新增环境失败');
  }
};

// 添加取消处理函数
const handleAddEnvironmentCancel = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  newEnvironment.value = { 
    name: '', 
    displayName: '', 
    envType: Number(envStore.currentEnv),
    configComponentId: selectedComponents.value[0] || 1, 
    display: true 
  };
  showAddModal.value = false;
};

// 获取修改历史
const fetchModifyHistories = async (configItemId: number) => {
  try {
    const response = await getConfigItemHistories({
      configItemId: configItemId,
      pageNo: 1,
      pageSize: 100
    });

    if (response?.data?.data) {
      modifyHistoryList.value = response.data.data;
      pagination.value.total = response.data.total;
    } else {
      modifyHistoryList.value = [];
      pagination.value.total = 0;
    }

  } catch (error) {
    message.error('获取修改历史失败');
    console.error('获取修改历史失败:', error);
  }
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
      pagination.value.total = 0;
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
const handleReleaseHistoryClick = (history) => {
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

// 处理保存
const handleSave = async (content: string) => {
  if (!currentEditItem.value) {
    message.error('未找到要编辑的配置项');
    return;
  }

  try {
    await updateConfigContent(currentEditItem.value.id, content);
    message.success('保存成功');
    currentEditItem.value = null;
    await fetchConfigItems();
  } catch (error) {
    message.error('保存失败');
  }
};

const handleDelete = async (record: ConfigItem) => {
  try {
    await deleteConfigItem(record.id);
    message.success('删除成功');
    fetchConfigItems();
  } catch (error) {
    message.error('删除失败');
  }
};

const handleAdd = () => {
  newConfigForm.value.configEnvironmentId = Number(activeTabKey.value);
  showAddConfigModal.value = true;
  nextTick(() => {
    initConfigEditor();
  });
};

// 格式化日期
const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

// 处理历史分页变化
const handleHistoryPageChange = (page: number) => {
  historyPagination.value.pageNo = page;
  if (selectedConfigItemId.value) {
    fetchReleaseHistories(selectedConfigItemId.value);
  }
};

// 处理发布按钮点击
const handlePublish = async (record: ConfigItem) => {
  currentPublishItem.value = record;
  publishForm.value.releaseName = `${dayjs().format('YYYYMMDDHHmm')}-release`;
  publishForm.value.releaseType = 1;
  showPublishModal.value = true;
};

// 获取编辑器语言
const getLanguage = (formatType: number): string => {
  const languageMap: Record<number, string> = {
    1: 'yaml',
    2: 'properties',
    3: 'plaintext',
    4: 'json',
    5: 'xml'
  };
  return languageMap[formatType] || 'plaintext';
};

// 处理目标环境变化
const handleTargetEnvironmentChange = async (value: number) => {
  if (!value) return;
  publishForm.value.targetNamespaceId = undefined;
  targetConfigItems.value = [];
  
  try {
    const response = await getConfigItems({
      pageNo: 1,
      pageSize: 100,
      configEnvironmentId: value
    });
    targetConfigItems.value = response.data.data;
  } catch (error) {
    message.error('获取配置项列表失败');
  }
};

// 处理比对
const handleCompare = async () => {
  if (!publishForm.value.targetEnvironmentId || !publishForm.value.targetNamespaceId) {
    message.warning('请选择目标环境和命名空间');
    return;
  }

  // 初始化编辑器
  await nextTick();
  initCompareEditors();
  showCompareResult.value = true;
};

// 初始化比对编辑器
const initCompareEditors = () => {
  if (!currentContentEditor.value || !targetContentEditor.value) return;

  if (currentCompareEditor) {
    currentCompareEditor.dispose();
  }
  if (targetCompareEditor) {
    targetCompareEditor.dispose();
  }

  // 初始化当前配置编辑器
  currentCompareEditor = monaco.editor.create(currentContentEditor.value, {
    value: currentPublishItem.value?.content || '',
    language: 'yaml',
    theme: 'vs-dark',
    readOnly: true,
    minimap: { enabled: false },
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    fontSize: 14
  });

  // 初始化目标配置编辑器
  const targetContent = targetConfigItems.value.find(
    item => item.namespaceId === publishForm.value.targetNamespaceId
  )?.content || '';

  targetCompareEditor = monaco.editor.create(targetContentEditor.value, {
    value: targetContent,
    language: 'yaml',
    theme: 'vs-dark',
    readOnly: true,
    minimap: { enabled: false },
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    fontSize: 14
  });
};

// 处理发布提交
const handlePublishSubmit = async () => {
  try {
    await publishFormRef.value?.validate();
    // TODO: 调用发布接口
    message.success('发布成功');
    showPublishModal.value = false;
    resetPublishForm();
  } catch (error) {
    console.error('发布失败:', error);
  }
};

// 处理发布取消
const handlePublishCancel = () => {
  showPublishModal.value = false;
  resetPublishForm();
};

// 重置发布表单
const resetPublishForm = () => {
  publishForm.value = {
    releaseName: '',
    releaseType: 1,
    targetEnvironmentId: undefined,
    targetNamespaceId: undefined
  };
  showCompareResult.value = false;
  currentPublishItem.value = null;
  
  if (currentCompareEditor) {
    currentCompareEditor.dispose();
  }
  if (targetCompareEditor) {
    targetCompareEditor.dispose();
  }
};

// 初始化配置编辑器
const initConfigEditor = () => {
  if (!addConfigEditor.value) return;

  if (configMonacoEditor) {
    configMonacoEditor.dispose();
  }

  configMonacoEditor = monaco.editor.create(addConfigEditor.value, {
    value: newConfigForm.value.content,
    language: getLanguage(newConfigForm.value.formatType),
    theme: 'vs-dark',
    minimap: { enabled: false },
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    fontSize: 14
  });

  // 监听编辑器内容变化
  configMonacoEditor.onDidChangeModelContent(() => {
    newConfigForm.value.content = configMonacoEditor.getValue();
  });
};

// 监听格式类型变化
watch(() => newConfigForm.value.formatType, (newType) => {
  if (configMonacoEditor) {
    const model = configMonacoEditor.getModel();
    const language = getLanguage(newType);
    monaco.editor.setModelLanguage(model, language);
  }
});

// 处理新增配置提交
const handleAddConfigSubmit = async () => {
  try {
    await configFormRef.value?.validate();
    const params = {
      type: newConfigForm.value.type,
      namespaceId: newConfigForm.value.namespaceId,
      formatType: newConfigForm.value.formatType,
      content: configMonacoEditor.getValue(),
      configEnvironmentId: Number(activeTabKey.value),
      namespaceStatus: 1, // 默认为已保存状态
    };
    await createConfigItem(params);
    message.success('新增配置成功');
    showAddConfigModal.value = false;
    resetConfigForm();
    fetchConfigItems();
  } catch (error) {
    console.error('新增配置失败:', error);
    message.error('新增配置失败');
  }
};

// 处理新增配置取消
const handleAddConfigCancel = () => {
  showAddConfigModal.value = false;
  resetConfigForm();
};

// 重置新增配置表单
const resetConfigForm = () => {
  newConfigForm.value = {
    type: 1,
    namespaceId: '',
    formatType: 1,
    content: '',
    configEnvironmentId: null as number | null
  };
  if (configMonacoEditor) {
    configMonacoEditor.dispose();
  }
};

// 初始化加载
onMounted(async () => {
  console.log('Component mounted');
  console.log('Current route:', route.path);
  console.log('Store state - System ID:', configStore.selectedSystemId);
  console.log('Store state - Component IDs:', configStore.selectedComponentIds);
  console.log('Current env type:', envStore.currentEnv);
  
  try {
    if (route.path.includes('/config')) {
      // 首先加载子系统列表
      await fetchSubsystems();
      console.log('Loaded subsystems:', subsystems.value.length);
      
      // 如果有存储的选中状态，恢复它们
      if (configStore.selectedSystemId) {
        selectedSystem.value = configStore.selectedSystemId;
        console.log('Restoring saved system ID:', selectedSystem.value);
        
        // 加载该系统下的组件
        await fetchComponents(configStore.selectedSystemId);
        console.log('Loaded components for system:', components.value.length);
        
        // 如果有选中的组件，加载环境
        if (configStore.selectedComponentIds.length > 0) {
          selectedComponents.value = configStore.selectedComponentIds;
          console.log('Restoring saved component IDs:', selectedComponents.value);
          
          // 加载该组件的环境列表
          await fetchEnvironments();
          console.log('Loaded environments:', environments.value.length);
        } else {
          console.warn('No component selected in store');
        }
      } else {
        console.warn('No system selected in store');
      }
    } else {
      console.log('Not on config page, skipping data loading');
    }
  } catch (error) {
    console.error('Error during initial data loading:', error);
    message.error('加载数据失败，请刷新页面重试');
  }
});

// 在组件卸载时清理编辑器实例
onUnmounted(() => {
  if (oldEditor) {
    oldEditor.dispose();
  }
  if (newEditor) {
    newEditor.dispose();
  }
  if (currentCompareEditor) {
    currentCompareEditor.dispose();
  }
  if (targetCompareEditor) {
    targetCompareEditor.dispose();
  }
  if (configMonacoEditor) {
    configMonacoEditor.dispose();
  }
});

// 打开组件选择时设置默认选中
const handleComponentFilter = () => {
  showComponentFilter.value = true;
  // 使用 store 中保存的选中状态
  if (configStore.selectedSystemId) {
    selectedSystem.value = configStore.selectedSystemId;
    fetchComponents(configStore.selectedSystemId);
  }
  if (configStore.selectedComponentIds.length > 0) {
    selectedComponents.value = configStore.selectedComponentIds;
  }
};

// 处理系统选择
const handleSystemSelect = async (system: ConfigSubsystem) => {
  if (system?.id) {
    selectedSystem.value = system.id;
    configStore.setSelectedSystem(system.id);
    await fetchComponents(system.id);
    activeFilterTab.value = 'component';
  }
};

// 处理组件选择
const handleComponentSelect = async (component: ConfigComponent) => {
  if (component?.id) {
    console.log('Selected component:', component.name, 'ID:', component.id);
    selectedComponents.value = [component.id];
    configStore.setSelectedComponents([component.id]);
    await fetchEnvironments();
    showComponentFilter.value = false;
    
    // 确保 path 检查与 onMounted 中的检查一致
    const configPath = route.path.includes('/config');
    console.log('Current path includes /config:', configPath);
    
    if (configPath) {
      console.log('Refreshing current page');
      // 使用路由参数变化代替页面刷新
      const query = { ...route.query, _t: Date.now() };
      router.replace({ path: route.path, query });
    }
  }
};

// 组件相关的状态
const components = ref<ConfigComponent[]>([]);
const subsystems = ref<ConfigSubsystem[]>([]);

// 处理配置项列表获取
const handleConfigItems = async (configEnvironmentId: number) => {
  try {
    const response = await getConfigItems({
      configEnvironmentId,
      pageNo: 1,
      pageSize: 100
    });
    if (response?.data?.data) {
      configItems.value = response.data.data;
    } else {
      configItems.value = [];
    }
  } catch (error) {
    console.error('获取配置项列表失败:', error);
    message.error('获取配置项列表失败');
    configItems.value = [];
  }
};

// 添加环境变化监听
watch(() => envStore.currentEnv, async (newEnv) => {
  if (selectedComponents.value.length > 0) {
    await fetchEnvironments();
  }
});

// 添加环境类型的计算属性
const currentEnvTypeLabel = computed(() => {
  const envTypeMap = {
    '1': '开发环境',
    '2': '测试环境',
    '3': '生产环境'
  };
  return envTypeMap[envStore.currentEnv] || '未知环境';
});

// 更新查看函数
const handleView = async (record: ConfigItem) => {
  console.log('查看配置数据:', record);
  console.log('配置内容:', record.content);
  const currentEnv = environments.value.find(env => env.id === Number(activeTabKey.value));
  currentEditItem.value = null;
  editorTitle.value = `查看配置 - ${record.namespaceId}`;
  editorContent.value = record.content || '';
  editorReadOnly.value = true;
  showEditor.value = true;

  // 获取修改历史
  await fetchModifyHistories(record.id);
};

// 更新编辑函数
const handleEdit = async (record: ConfigItem) => {
  console.log('编辑配置数据:', record);
  console.log('配置内容:', record.content);
  const currentEnv = environments.value.find(env => env.id === Number(activeTabKey.value));
  currentEditItem.value = record;
  editorTitle.value = `编辑配置 - ${record.namespaceId}`;
  editorContent.value = record.content || '';
  editorReadOnly.value = false;
  showEditor.value = true;

  // 获取修改历史
  await fetchModifyHistories(record.id);
};

// 处理查看发布历史
const handleViewReleaseHistory = async (record: ConfigItem) => {
  selectedConfigItemId.value = record.id;
  showReleaseHistoryModal.value = true;
  await fetchReleaseHistories(record.id);
};

// 通知相关的状态
const notificationVisible = ref(false);
const notifications = ref<Notice[]>([]);
const notificationLoading = ref(false);
const activeNoticeTab = ref('1'); // 1: 未读, 2: 已读

// 获取通知列表
const fetchNotifications = async (status?: number) => {
  notificationLoading.value = true;
  try {
    let response;
    if (status !== undefined) {
      response = await getNoticeByStatus(status);
    } else {
      response = await getNotices({ pageNo: 1, pageSize: 10, status: 1 });
    }
    
    if (response?.data?.data) {
      notifications.value = response.data.data;
    }
  } catch (error) {
    console.error('获取通知列表失败:', error);
    message.error('获取通知列表失败');
  } finally {
    notificationLoading.value = false;
  }
};

// 标记单个通知为已读
const handleMarkAsRead = async (notice: Notice) => {
  try {
    await markNoticeAsRead(notice.id);
    message.success('标记已读成功');
    await fetchNotifications(Number(activeNoticeTab.value));
  } catch (error) {
    console.error('标记已读失败:', error);
    message.error('标记已读失败');
  }
};

// 标记所有通知为已读
const handleMarkAllAsRead = async () => {
  try {
    await markAllNoticeAsRead();
    message.success('全部标记已读成功');
    await fetchNotifications(Number(activeNoticeTab.value));
  } catch (error) {
    console.error('全部标记已读失败:', error);
    message.error('全部标记已读失败');
  }
};

// 清空所有通知
const handleClearAllNotifications = async () => {
  try {
    await clearNotice();
    message.success('清空通知成功');
    notifications.value = [];
  } catch (error) {
    console.error('清空通知失败:', error);
    message.error('清空通知失败');
  }
};

// 监听通知 tab 切换
watch(activeNoticeTab, (newValue) => {
  fetchNotifications(Number(newValue));
});

// 在组件挂载时获取通知列表
onMounted(() => {
  fetchNotifications(1); // 默认获取未读通知
});

// 通知表格列定义
const notificationColumns = [
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title',
    width: '30%'
  },
  {
    title: '内容',
    dataIndex: 'content',
    key: 'content',
    width: '40%'
  },
  {
    title: '发送人',
    dataIndex: 'senderName',
    key: 'senderName',
    width: '15%'
  },
  {
    title: '时间',
    dataIndex: 'createdDate',
    key: 'createdDate',
    width: '15%'
  }
];
</script>

<style lang="scss" scoped>
.cc-config-container {
  padding: 24px;
  background: var(--component-background);
  
  .environment-tabs {
    margin-bottom: 24px;
    
    :deep(.ant-tabs-nav) {
      margin-bottom: 16px;
      
      .ant-tabs-tab {
        margin: 0;
        padding: 8px 16px;
        transition: all 0.3s;
        
        &.ant-tabs-tab-active {
          background: var(--primary-1);
          border-color: var(--primary-color);
          
          .ant-tabs-tab-btn {
            color: var(--primary-color);
            font-weight: 500;
          }
        }
        
        &:hover {
          color: var(--primary-color);
        }
      }
    }
  }
  
  .table-container {
    background: var(--component-background);
    border-radius: 2px;
    
    :deep(.ant-table-wrapper) {
      .ant-table {
        background: var(--component-background);
      }
      
      .ant-table-thead > tr > th {
        background: var(--table-header-bg);
        color: var(--text-color);
        font-weight: 500;
        border-bottom: 1px solid var(--border-color);
      }
      
      .ant-table-tbody > tr > td {
        border-bottom: 1px solid var(--border-color);
        color: var(--text-color);
      }
      
      .ant-table-tbody > tr:hover > td {
        background: var(--item-hover-bg);
      }
    }
  }
  
  .action-buttons {
    display: flex;
    gap: 8px;
    
    .ant-btn {
      padding: 0 4px;
      height: 22px;
      line-height: 22px;
      
      &[status="danger"] {
        color: #ff4d4f;
        
        &:hover {
          color: #ff7875;
        }
      }
    }
  }
  
  .table-header {
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .left-actions {
      display: flex;
      gap: 8px;
    }

    .right-actions {
      display: flex;
      gap: 8px;
    }
  }
}

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

.compare-section {
  .compare-controls {
    display: flex;
    gap: 16px;
    align-items: flex-end;
    margin-bottom: 16px;
  }

  .compare-result {
    display: flex;
    gap: 16px;
    margin-top: 16px;

    .editor-container {
      flex: 1;
      display: flex;
      flex-direction: column;

      h4 {
        margin: 0 0 8px 0;
        color: var(--text-color);
      }

      .monaco-editor {
        height: 400px;
        border: 1px solid var(--border-color);
        border-radius: 2px;
      }
    }
  }
}

.config-editor {
  height: 400px;
  border: 1px solid var(--border-color);
  border-radius: 2px;
}

.env-type-text {
  display: inline-block;
  padding: 4px 8px;
  background-color: var(--primary-1);
  color: var(--primary-color);
  border-radius: 4px;
  font-size: 14px;
}

.notification-container {
  display: flex;
  flex-direction: column;
  gap: 24px;

  .button-container {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style> 