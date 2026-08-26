<template>
  <div class="approval-center">
    <a-card title="审批中心" :loading="loading">
      <template #extra>
        <a-button @click="loadTasks" :loading="loading">刷新</a-button>
      </template>

      <a-alert
        v-if="tasks.length === 0 && !loading"
        type="info"
        show-icon
        message="暂无待我审批的任务"
      />

      <a-table
        v-else
        :dataSource="tasks"
        :columns="columns"
        :rowKey="(record: PermissionAuditTask) => record.id"
        :pagination="{ pageSize: 10 }"
        bordered
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'operationType'">
            <a-tag :color="operationTypeColor(record.operationType)">
              {{ operationTypeLabel(record.operationType) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="openDetail(record)">查看</a-button>
              <a-button type="primary" size="small" @click="openApprove(record)">通过</a-button>
              <a-button danger size="small" @click="openReject(record)">拒绝</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 申请详情抽屉 -->
    <a-drawer
      v-model:open="detailVisible"
      title="申请详情"
      :width="520"
      @close="detailVisible = false"
    >
      <a-descriptions :column="1" bordered size="small" v-if="detail">
        <a-descriptions-item label="申请单ID">{{ detail.id }}</a-descriptions-item>
        <a-descriptions-item label="申请人">{{ detail.applyName }}</a-descriptions-item>
        <a-descriptions-item label="权限类型">
          {{ permissionCodeLabel(detail.permissionCode) }}
        </a-descriptions-item>
        <a-descriptions-item label="申请理由">{{ detail.requestReason || '-' }}</a-descriptions-item>
        <a-descriptions-item label="状态">{{ requestStatusLabel(detail.status) }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ detail.createdDate || '-' }}</a-descriptions-item>

        <a-descriptions-item v-if="detail.permissionCode === 'CREATE_TOPIC'" label="Topic 配置快照">
          <a-descriptions :column="1" size="small" style="margin-top: 4px;">
            <a-descriptions-item label="Topic 名称">{{ detail.topicName || '-' }}</a-descriptions-item>
            <a-descriptions-item label="读队列数">{{ detail.readQueueNums ?? '-' }}</a-descriptions-item>
            <a-descriptions-item label="写队列数">{{ detail.writeQueueNums ?? '-' }}</a-descriptions-item>
            <a-descriptions-item label="消息类型">{{ detail.messageType || '-' }}</a-descriptions-item>
          </a-descriptions>
        </a-descriptions-item>
      </a-descriptions>
      <a-empty v-else description="加载中或暂无数据" />
    </a-drawer>

    <!-- 通过 / 拒绝 弹框 -->
    <a-modal
      v-model:open="opinionVisible"
      :title="opinionMode === 'approve' ? '审批通过' : '审批拒绝'"
      :confirmLoading="submitting"
      :okText="opinionMode === 'approve' ? '通过' : '拒绝'"
      :okButtonProps="opinionMode === 'reject' ? { danger: true } : {}"
      @ok="submitOpinion"
      @cancel="opinionVisible = false"
    >
      <a-form layout="vertical">
        <a-form-item :label="opinionMode === 'approve' ? '审批意见（通过）' : '审批意见（拒绝）'" required>
          <a-textarea
            v-model:value="opinionReason"
            placeholder="请填写审批意见"
            :rows="4"
            :maxlength="200"
            show-count
          />
        </a-form-item>
        <a-alert
          type="info"
          show-icon
          message='审批意见会按后端要求包装为 JSON 字符串（{"reason":"..."}），无需手动输入 JSON'
        />
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import {
  getPendingAuditTasks,
  getPermissionRequestDetail,
  approveAuditTask,
  rejectAuditTask
} from '@/api/mq/permission';
import { useUserStore } from '@/stores/user';
import {
  PERMISSION_CODE_LABEL,
  REQUEST_STATUS_LABEL,
  type PermissionAuditTask,
  type PermissionRequest,
  type AuditOperationType
} from '@/types/mq/permission';

const userStore = useUserStore();

const loading = ref(false);
const tasks = ref<PermissionAuditTask[]>([]);

const detailVisible = ref(false);
const detail = ref<PermissionRequest | null>(null);
const detailRequestId = ref<number | null>(null);
const detailLoading = ref(false);

const opinionVisible = ref(false);
const opinionMode = ref<'approve' | 'reject'>('approve');
const opinionReason = ref('');
const submitting = ref(false);
const currentTaskId = ref<number | null>(null);

const columns = [
  { title: '任务ID', dataIndex: 'id', key: 'id', width: 90 },
  { title: '申请单ID', dataIndex: 'requestId', key: 'requestId', width: 110 },
  {
    title: '状态',
    dataIndex: 'operationType',
    key: 'operationType',
    width: 100
  },
  { title: '当前审批人', dataIndex: 'operatorName', key: 'operatorName', width: 120 },
  { title: '创建时间', dataIndex: 'createdDate', key: 'createdDate', width: 180 },
  { title: '操作', key: 'action', width: 200 }
];

const permissionCodeLabel = (code?: string) =>
  (code && (PERMISSION_CODE_LABEL as Record<string, string>)[code]) || code || '-';
const requestStatusLabel = (s?: string) =>
  (s && (REQUEST_STATUS_LABEL as Record<string, string>)[s]) || s || '-';
const operationTypeLabel = (t?: AuditOperationType) => {
  if (t === 'APPROVE') return '已通过';
  if (t === 'REJECT') return '已拒绝';
  return '待审批';
};
const operationTypeColor = (t?: AuditOperationType) => {
  if (t === 'APPROVE') return 'success';
  if (t === 'REJECT') return 'error';
  return 'processing';
};

const loadTasks = async () => {
  loading.value = true;
  try {
    const res = await getPendingAuditTasks();
    const list = Array.isArray(res) ? res : ((res as any)?.data ?? []);
    tasks.value = list as PermissionAuditTask[];
  } catch (error: any) {
    console.error('获取待审批任务失败:', error);
    message.error(error.message || '获取待审批任务失败');
  } finally {
    loading.value = false;
  }
};

const openDetail = async (task: PermissionAuditTask) => {
  detailVisible.value = true;
  detail.value = null;
  detailRequestId.value = task.requestId;
  detailLoading.value = true;
  try {
    const res = await getPermissionRequestDetail(task.requestId);
    detail.value = res;
  } catch (error: any) {
    console.error('获取申请详情失败:', error);
    message.error(error.message || '获取申请详情失败');
  } finally {
    detailLoading.value = false;
  }
};

const openApprove = (task: PermissionAuditTask) => {
  opinionMode.value = 'approve';
  currentTaskId.value = task.id;
  opinionReason.value = '';
  opinionVisible.value = true;
};

const openReject = (task: PermissionAuditTask) => {
  opinionMode.value = 'reject';
  currentTaskId.value = task.id;
  opinionReason.value = '';
  opinionVisible.value = true;
};

const submitOpinion = async () => {
  if (!opinionReason.value.trim()) {
    message.warning('请填写审批意见');
    return;
  }
  if (currentTaskId.value == null) return;

  submitting.value = true;
  const approverName = userStore.getUserInfo()?.username || 'admin';
  // 审批意见必须包装为 JSON 字符串（后端已知缺陷，见 spec 5.5）
  const reasonJson = JSON.stringify({ reason: opinionReason.value.trim() });

  try {
    if (opinionMode.value === 'approve') {
      await approveAuditTask({
        permissionAuditTaskId: currentTaskId.value,
        approverName,
        approvalReason: reasonJson
      });
      message.success('已通过，系统将自动创建 Topic');
    } else {
      await rejectAuditTask({
        permissionAuditTaskId: currentTaskId.value,
        approverName,
        rejectionReason: reasonJson
      });
      message.success('已拒绝');
    }
    opinionVisible.value = false;
    detailVisible.value = false;
    await loadTasks();
  } catch (error: any) {
    console.error('审批提交失败:', error);
    // 通过后建 Topic 失败（broker 异常）后端返回 500
    if (opinionMode.value === 'approve') {
      message.error('创建失败，请检查 broker 后重新审批');
    } else {
      message.error(error.message || '审批提交失败');
    }
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  loadTasks();
});
</script>

<style scoped>
.approval-center {
  padding: 20px;
}
</style>
