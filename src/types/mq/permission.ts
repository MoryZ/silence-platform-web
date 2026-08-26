// 权限审批相关类型定义（Topic 创建审批改造）

/** 权限类型 */
export type PermissionCode = 'CREATE_TOPIC' | 'DELETE_TOPIC' | 'PRODUCE' | 'CONSUME';

/** 申请单状态 */
export type PermissionRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** 审批任务操作类型 */
export type AuditOperationType = 'REQUEST' | 'APPROVE' | 'REJECT';

/** 申请单（含 Topic 配置快照） */
export interface PermissionRequest {
  id: number;
  userId: number;
  applyName: string;
  permissionCode: PermissionCode;
  requestReason?: string;
  /** CREATE_* 类型才有 */
  topicName?: string;
  readQueueNums?: number;
  writeQueueNums?: number;
  messageType?: string;
  status: PermissionRequestStatus;
  expireTime?: string | null;
  createdDate?: string;
}

/** 待审批任务 */
export interface PermissionAuditTask {
  id: number;
  requestId: number;
  dependsOnAuditTaskId?: number | null;
  operatorName?: string;
  operationType?: AuditOperationType;
  operationDetails?: string | null;
  createdDate?: string;
}

/** 创建 Topic 发起审批命令（POST /api/v1/topics 请求体） */
export interface CreateTopicApprovalCommand {
  topicName: string;
  readQueueNums?: number;
  writeQueueNums?: number;
  messageType?: string;
  requestReason?: string;
}

/** 审批通过命令（审批意见必须是 JSON 字符串，见 spec 5.5） */
export interface ApproveTaskCommand {
  permissionAuditTaskId: number;
  approverName: string;
  /** JSON 字符串，如 '{"reason":"同意"}' */
  approvalReason: string;
}

/** 审批拒绝命令 */
export interface RejectTaskCommand {
  permissionAuditTaskId: number;
  approverName: string;
  /** JSON 字符串，如 '{"reason":"队列数过大"}' */
  rejectionReason: string;
}

/** 分页列表通用响应 */
export interface PageResult<T> {
  data?: T[];
  total?: number;
  pageNo?: number;
  pageSize?: number;
}

/** permissionCode 中文映射 */
export const PERMISSION_CODE_LABEL: Record<PermissionCode, string> = {
  CREATE_TOPIC: '创建Topic',
  DELETE_TOPIC: '删除Topic',
  PRODUCE: '生产权限',
  CONSUME: '消费权限'
};

/** 申请单状态中文映射 */
export const REQUEST_STATUS_LABEL: Record<PermissionRequestStatus, string> = {
  PENDING: '审批中',
  APPROVED: '已通过',
  REJECTED: '已拒绝'
};
