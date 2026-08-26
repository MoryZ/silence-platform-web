import { mqRequest as request } from '@/utils/request';
import type {
  PermissionRequest,
  PermissionAuditTask,
  CreateTopicApprovalCommand,
  ApproveTaskCommand,
  RejectTaskCommand,
  PageResult
} from '@/types/mq/permission';

/**
 * 创建 Topic 发起审批
 * POST /api/v1/topics
 * 响应体为 permissionRequestId（number），不再是 topicId
 */
export const createTopicApproval = (params: CreateTopicApprovalCommand): Promise<number> =>
  request.post<number>('/api/v1/topics', params);

/**
 * 我的申请列表
 * GET /api/v1/permissionRequests
 */
export const getMyPermissionRequests = (params?: {
  pageNo?: number;
  pageSize?: number;
}): Promise<PageResult<PermissionRequest> | PermissionRequest[]> =>
  request.get('/api/v1/permissionRequests', { params });

/**
 * 申请详情（含 Topic 配置快照）
 * GET /api/v1/permissionRequests/{id}
 */
export const getPermissionRequestDetail = (
  id: number | string
): Promise<PermissionRequest> => request.get(`/api/v1/permissionRequests/${id}`);

/**
 * 待我审批列表
 * GET /api/v1/permissionAuditTasks/pending
 */
export const getPendingAuditTasks = (): Promise<
  PermissionAuditTask[] | PageResult<PermissionAuditTask>
> => request.get('/api/v1/permissionAuditTasks/pending');

/**
 * 审批通过
 * PUT /api/v1/permissionAuditTasks/approve
 * approvalReason 必须是 JSON 字符串，如 '{"reason":"同意"}'
 */
export const approveAuditTask = (params: ApproveTaskCommand): Promise<void> =>
  request.put('/api/v1/permissionAuditTasks/approve', params);

/**
 * 审批拒绝
 * PUT /api/v1/permissionAuditTasks/reject
 * rejectionReason 必须是 JSON 字符串，如 '{"reason":"队列数过大"}'
 */
export const rejectAuditTask = (params: RejectTaskCommand): Promise<void> =>
  request.put('/api/v1/permissionAuditTasks/reject', params);
