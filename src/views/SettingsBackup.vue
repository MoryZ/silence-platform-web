<template>
  <div class="settings-backup">
    <a-card :bordered="false" title="备份设置">
      <a-form
        :model="formState"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 14 }"
        layout="horizontal"
        @finish="onFinish"
      >
        <a-form-item
          label="自动备份"
          name="autoBackup"
        >
          <a-switch v-model:checked="formState.autoBackup" />
        </a-form-item>

        <template v-if="formState.autoBackup">
          <a-form-item
            label="备份周期"
            name="backupInterval"
            :rules="[{ required: true, message: '请选择备份周期' }]"
          >
            <a-select v-model:value="formState.backupInterval" placeholder="请选择备份周期">
              <a-select-option value="daily">每天</a-select-option>
              <a-select-option value="weekly">每周</a-select-option>
              <a-select-option value="monthly">每月</a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item
            label="备份时间"
            name="backupTime"
            :rules="[{ required: true, message: '请选择备份时间' }]"
          >
            <a-time-picker v-model:value="formState.backupTime" format="HH:mm" />
          </a-form-item>

          <a-form-item
            label="保留备份数"
            name="backupRetention"
            :rules="[{ required: true, message: '请输入保留备份数量' }]"
          >
            <a-input-number
              v-model:value="formState.backupRetention"
              :min="1"
              :max="30"
              style="width: 120px"
            />
          </a-form-item>
        </template>

        <a-form-item
          label="备份内容"
          name="backupContent"
        >
          <a-checkbox-group v-model:value="formState.backupContent">
            <a-checkbox value="config">系统配置</a-checkbox>
            <a-checkbox value="data">业务数据</a-checkbox>
            <a-checkbox value="logs">系统日志</a-checkbox>
            <a-checkbox value="files">文件资源</a-checkbox>
          </a-checkbox-group>
        </a-form-item>

        <a-form-item
          label="备份存储"
          name="backupStorage"
          :rules="[{ required: true, message: '请选择备份存储位置' }]"
        >
          <a-select v-model:value="formState.backupStorage" placeholder="请选择备份存储位置">
            <a-select-option value="local">本地存储</a-select-option>
            <a-select-option value="ftp">FTP服务器</a-select-option>
            <a-select-option value="s3">S3存储</a-select-option>
            <a-select-option value="oss">阿里云OSS</a-select-option>
          </a-select>
        </a-form-item>

        <template v-if="formState.backupStorage !== 'local'">
          <a-form-item
            label="存储地址"
            name="storageUrl"
            :rules="[{ required: true, message: '请输入存储地址' }]"
          >
            <a-input v-model:value="formState.storageUrl" placeholder="请输入存储地址" />
          </a-form-item>

          <a-form-item
            label="访问密钥"
            name="accessKey"
            :rules="[{ required: true, message: '请输入访问密钥' }]"
          >
            <a-input-password v-model:value="formState.accessKey" placeholder="请输入访问密钥" />
          </a-form-item>

          <a-form-item
            label="访问密码"
            name="accessSecret"
            :rules="[{ required: true, message: '请输入访问密码' }]"
          >
            <a-input-password v-model:value="formState.accessSecret" placeholder="请输入访问密码" />
          </a-form-item>
        </template>

        <a-form-item
          label="备份通知"
          name="backupNotification"
        >
          <a-checkbox-group v-model:value="formState.backupNotification">
            <a-checkbox value="email">邮件通知</a-checkbox>
            <a-checkbox value="sms">短信通知</a-checkbox>
            <a-checkbox value="webhook">Webhook通知</a-checkbox>
          </a-checkbox-group>
        </a-form-item>

        <template v-if="formState.backupNotification.includes('email')">
          <a-form-item
            label="通知邮箱"
            name="notificationEmail"
            :rules="[{ required: true, message: '请输入通知邮箱' }]"
          >
            <a-input v-model:value="formState.notificationEmail" placeholder="请输入通知邮箱" />
          </a-form-item>
        </template>

        <template v-if="formState.backupNotification.includes('webhook')">
          <a-form-item
            label="Webhook地址"
            name="webhookUrl"
            :rules="[{ required: true, message: '请输入Webhook地址' }]"
          >
            <a-input v-model:value="formState.webhookUrl" placeholder="请输入Webhook地址" />
          </a-form-item>
        </template>

        <a-form-item :wrapper-col="{ offset: 4, span: 14 }">
          <a-button type="primary" html-type="submit">保存</a-button>
          <a-button style="margin-left: 10px" @click="onReset">重置</a-button>
          <a-button style="margin-left: 10px" @click="handleBackupNow">立即备份</a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <a-card :bordered="false" title="备份历史" style="margin-top: 24px">
      <a-table
        :columns="columns"
        :data-source="backupHistory"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #status="{ text }">
          <a-tag :color="getStatusColor(text)">{{ getStatusText(text) }}</a-tag>
        </template>
        <template #action="{ record }">
          <a-space>
            <a @click="downloadBackup(record)">下载</a>
            <a @click="restoreBackup(record)">恢复</a>
            <a @click="deleteBackup(record)" class="danger">删除</a>
          </a-space>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { message, Modal } from 'ant-design-vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import dayjs from 'dayjs';

interface FormState {
  autoBackup: boolean;
  backupInterval: string;
  backupTime: dayjs.Dayjs;
  backupRetention: number;
  backupContent: string[];
  backupStorage: string;
  storageUrl: string;
  accessKey: string;
  accessSecret: string;
  backupNotification: string[];
  notificationEmail: string;
  webhookUrl: string;
}

interface BackupRecord {
  id: string;
  time: string;
  size: string;
  status: string;
  type: string;
  path: string;
}

const formState = reactive<FormState>({
  autoBackup: true,
  backupInterval: 'daily',
  backupTime: dayjs('02:00'),
  backupRetention: 7,
  backupContent: ['config', 'data', 'logs'],
  backupStorage: 'local',
  storageUrl: '',
  accessKey: '',
  accessSecret: '',
  backupNotification: ['email'],
  notificationEmail: '',
  webhookUrl: '',
});

const columns = [
  {
    title: '备份时间',
    dataIndex: 'time',
    key: 'time',
  },
  {
    title: '备份大小',
    dataIndex: 'size',
    key: 'size',
  },
  {
    title: '备份类型',
    dataIndex: 'type',
    key: 'type',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    slots: { customRender: 'status' },
  },
  {
    title: '操作',
    key: 'action',
    slots: { customRender: 'action' },
  },
];

const backupHistory = ref<BackupRecord[]>([
  {
    id: '1',
    time: '2024-03-20 02:00:00',
    size: '1.2GB',
    status: 'success',
    type: '自动备份',
    path: '/backup/20240320_020000.zip',
  },
  {
    id: '2',
    time: '2024-03-19 02:00:00',
    size: '1.1GB',
    status: 'success',
    type: '自动备份',
    path: '/backup/20240319_020000.zip',
  },
]);

const pagination = reactive<TablePaginationConfig>({
  total: 100,
  current: 1,
  pageSize: 10,
});

const getStatusColor = (status: string) => {
  const colors = {
    success: 'success',
    failed: 'error',
    running: 'processing',
  };
  return colors[status] || 'default';
};

const getStatusText = (status: string) => {
  const texts = {
    success: '成功',
    failed: '失败',
    running: '进行中',
  };
  return texts[status] || status;
};

const onFinish = (values: FormState) => {
  console.log('Success:', values);
  message.success('保存成功');
};

const onReset = () => {
  formState.autoBackup = true;
  formState.backupInterval = 'daily';
  formState.backupTime = dayjs('02:00');
  formState.backupRetention = 7;
  formState.backupContent = ['config', 'data', 'logs'];
  formState.backupStorage = 'local';
  formState.storageUrl = '';
  formState.accessKey = '';
  formState.accessSecret = '';
  formState.backupNotification = ['email'];
  formState.notificationEmail = '';
  formState.webhookUrl = '';
};

const handleBackupNow = () => {
  Modal.confirm({
    title: '确认备份',
    content: '确定要立即执行备份吗？',
    onOk: () => {
      message.success('开始执行备份');
      // TODO: 实现备份逻辑
    },
  });
};

const handleTableChange = (pag: TablePaginationConfig) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  // TODO: 实现分页逻辑
};

const downloadBackup = (record: BackupRecord) => {
  message.success(`开始下载备份: ${record.time}`);
  // TODO: 实现下载逻辑
};

const restoreBackup = (record: BackupRecord) => {
  Modal.confirm({
    title: '确认恢复',
    content: `确定要恢复备份 ${record.time} 吗？此操作将覆盖当前数据。`,
    onOk: () => {
      message.success(`开始恢复备份: ${record.time}`);
      // TODO: 实现恢复逻辑
    },
  });
};

const deleteBackup = (record: BackupRecord) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除备份 ${record.time} 吗？`,
    onOk: () => {
      message.success(`删除备份: ${record.time}`);
      // TODO: 实现删除逻辑
    },
  });
};
</script>

<style scoped>
.settings-backup {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100%;
}

.danger {
  color: #ff4d4f;
}
</style> 