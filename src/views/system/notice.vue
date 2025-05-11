<!-- 通知管理页面 -->
<template>
  <div class="notification-page">
    <div class="notification-card">
      <div class="card-header">
        <h2 class="card-title">通知管理</h2>
        <div class="header-actions">
          <a-button type="primary" class="action-button" @click="showCreateModal = true">
            <plus-outlined />
            新增通知
          </a-button>
          <a-button type="primary" class="action-button" @click="handleMarkAllAsRead">全部标记已读</a-button>
          <a-button danger class="action-button" @click="handleClearAll">清空通知</a-button>
        </div>
      </div>

      <!-- 通用搜索面板 -->
      <SearchPanel
        v-model="searchParams"
        :fields="searchFields"
        @search="handleSearch"
        @reset="resetSearch"
      />

      <div class="table-container">
        <CommonPagination
          :columns="columns"
          :dataSource="notifications"
          :loading="loading"
          rowKey="id"
          v-model:pageNo="pagination.current"
          v-model:pageSize="pagination.pageSize"
          :total="pagination.total"
          @change="handlePaginationChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action' && record.status === 0">
              <a @click="handleMarkAsRead(record)">标记已读</a>
            </template>
          </template>
        </CommonPagination>
      </div>
    </div>

    <!-- 新增通知弹窗 -->
    <a-modal
      v-model:open="showCreateModal"
      title="新增通知"
      @ok="handleCreateNotice"
      :confirmLoading="createLoading"
      @cancel="resetCreateForm"
    >
      <a-form :model="createForm" :rules="rules" ref="createFormRef">
        <a-form-item label="通知标题" name="title">
          <a-input v-model:value="createForm.title" placeholder="请输入通知标题" />
        </a-form-item>
        <a-form-item label="通知内容" name="content">
          <a-textarea 
            v-model:value="createForm.content" 
            placeholder="请输入通知内容" 
            :rows="4" 
            :auto-size="{ minRows: 4, maxRows: 8 }" 
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, reactive, computed } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import type { FormInstance } from 'ant-design-vue';
import CommonPagination from '../../components/CommonPagination.vue';
import {
  getNotices,
  createNotice,
  markNoticeAsRead,
  markAllNoticeAsRead,
  clearNotice,
  type Notice,
  type NoticeParams
} from '../../api/notice';
import dayjs from 'dayjs';
import SearchPanel from '../../components/SearchPanel.vue';

// 搜索参数
const searchParams = reactive({
  status: null as number | null,  // 默认无选中条件 (status: 0=未读, 1=已读)
  title: '',
  content: ''
});

// 状态定义
const notifications = ref<Notice[]>([]);
const loading = ref(false);
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: (total: number) => `共 ${total} 条`
});

// 新增通知相关状态
const showCreateModal = ref(false);
const createLoading = ref(false);
const createFormRef = ref<FormInstance>();
const createForm = ref({
  title: '',
  content: ''
});

// 表单校验规则
const rules = {
  title: [
    { required: true, message: '请输入通知标题', trigger: 'blur' },
    { max: 100, message: '标题长度不能超过100个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入通知内容', trigger: 'blur' },
    { max: 500, message: '内容长度不能超过500个字符', trigger: 'blur' }
  ]
};

// 表格列定义
const columns = [
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title',
    width: '20%'
  },
  {
    title: '内容',
    dataIndex: 'content',
    key: 'content',
    width: '20%'
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: '10%'
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
    width: '15%',
    customRender: ({ text }: { text: string }) => dayjs(text).format('YYYY-MM-DD HH:mm:ss')
  },
  {
    title: '操作',
    key: 'action',
    width: '10%'
  }
];

// 获取通知列表
const fetchNotifications = async () => {
  loading.value = true;
  try {
    const params: Partial<NoticeParams> & { title?: string; content?: string } = {
      pageNo: pagination.value.current,
      pageSize: pagination.value.pageSize,
    };

    // 只有当status不为null时才添加到参数中
    if (searchParams.status !== null) {
      params.status = searchParams.status;
    }

    // 添加搜索条件
    if (searchParams.title) {
      params.title = searchParams.title;
    }
    
    if (searchParams.content) {
      params.content = searchParams.content;
    }

    console.log('Fetching notifications with params:', params);
    const response = await getNotices(params as NoticeParams);
    console.log('API response:', response);
    
    if (response?.data) {
      notifications.value = response.data;
      pagination.value.total = response.total || response.data.length;
    } else {
      notifications.value = [];
      pagination.value.total = 0;
    }
  } catch (error) {
    console.error('获取通知列表失败:', error);
    message.error('获取通知列表失败');
    notifications.value = [];
  } finally {
    loading.value = false;
  }
};

// 处理分页变化
const handlePaginationChange = (pageNo: number, pageSize: number) => {
  pagination.value.current = pageNo;
  pagination.value.pageSize = pageSize;
  fetchNotifications();
};

// 处理状态变化
const handleStatusChange = () => {
  pagination.value.current = 1;
  fetchNotifications();
};

// 处理搜索
const handleSearch = () => {
  pagination.value.current = 1;
  fetchNotifications();
};

// 重置搜索
const resetSearch = () => {
  searchParams.status = null;
  searchParams.title = '';
  searchParams.content = '';
  pagination.value.current = 1;
  fetchNotifications();
};

// 新增通知
const handleCreateNotice = async () => {
  try {
    await createFormRef.value?.validate();
    createLoading.value = true;
    
    await createNotice({
      title: createForm.value.title,
      content: createForm.value.content
    });
    
    message.success('通知创建成功');
    showCreateModal.value = false;
    resetCreateForm();
    
    // 刷新通知列表
    fetchNotifications();
  } catch (error) {
    console.error('创建通知失败:', error);
    message.error('创建通知失败');
  } finally {
    createLoading.value = false;
  }
};

// 重置新增表单
const resetCreateForm = () => {
  createForm.value = {
    title: '',
    content: ''
  };
  createFormRef.value?.resetFields();
};

// 标记单个通知为已读
const handleMarkAsRead = async (notice: Notice) => {
  try {
    await markNoticeAsRead(notice.id);
    message.success('标记已读成功');
    fetchNotifications();
  } catch (error) {
    console.error('标记已读失败:', error);
    message.error('标记已读失败');
  }
};

// 标记所有为已读
const handleMarkAllAsRead = async () => {
  try {
    await markAllNoticeAsRead();
    message.success('全部标记已读成功');
    fetchNotifications();
  } catch (error) {
    console.error('全部标记已读失败:', error);
    message.error('全部标记已读失败');
  }
};

// 清空所有通知
const handleClearAll = async () => {
  try {
    await clearNotice();
    message.success('清空通知成功');
    fetchNotifications();
  } catch (error) {
    console.error('清空通知失败:', error);
    message.error('清空通知失败');
  }
};

// 在 <script setup> 中定义 searchFields
const searchFields = [
  {
    key: 'status',
    type: 'select',
    placeholder: '全部',
    options: [
      { label: '全部', value: null },
      { label: '未读通知', value: 0 },
      { label: '已读通知', value: 1 }
    ],
    style: 'width: 150px'
  },
  {
    key: 'title',
    type: 'input',
    placeholder: '请输入标题关键词',
    style: 'width: 200px'
  },
  {
    key: 'content',
    type: 'input',
    placeholder: '请输入内容关键词',
    style: 'width: 200px'
  }
]

// 初始加载
fetchNotifications();
</script>

<style lang="scss" scoped>
.notification-page {
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}
.notification-card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  margin: 32px 24px 0 24px;
  width: auto;
  max-width: none;
  padding-bottom: 32px;
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
}
.card-header {
  padding: 28px 40px 12px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: none;
}
.card-title {
  font-size: 22px;
  font-weight: 700;
  color: #222;
  margin: 0;
}
.header-actions {
  display: flex;
  gap: 18px;
}
.action-button {
  border-radius: 20px;
  font-size: 15px;
  padding: 0 22px;
  height: 38px;
}
.search-container {
  padding: 18px 40px 0 40px;
}
.search-row {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  align-items: center;
}
.search-item {
  display: flex;
  align-items: center;
}
.label {
  margin-right: 8px;
  color: #222;
  font-weight: 500;
}
.table-container {
  padding: 24px 40px 0 40px;
  flex: 1;
  display: flex;
  flex-direction: column;
}
:deep(.ant-table-thead > tr > th) {
  background: #f7faff;
  font-weight: 600;
  font-size: 15px;
}
:deep(.ant-tabs-nav) {
  margin-bottom: 0;
  padding-left: 40px;
}
:deep(.ant-tabs-tab) {
  font-size: 16px;
  font-weight: 600;
}
:deep(.ant-tabs-tab-active .ant-tabs-tab-btn) {
  color: #1677ff;
}
.layout-footer {
  width: 100%;
  text-align: center;
  color: #222;
  font-size: 14px;
  opacity: 0.7;
  padding: 16px 0 8px 0;
  background: transparent;
  letter-spacing: 0.5px;
  user-select: none;
  margin-top: auto;
}
</style> 