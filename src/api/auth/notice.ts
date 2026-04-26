import { authRequest as request } from '@/utils/request';
import type { Notice, NoticeResponse, NoticeParams } from '@/types/auth';

/**
 * 查看所有通知列表
 */
export function getNotices(params: NoticeParams): Promise<NoticeResponse> {
  return request.get('/api/v1/notices', { params });
}

/**
 * 获取通知列表 status 0 未读 1 已读
 */
export function getNoticeByStatus(status: number): Promise<Notice[]> {
  return request.get('/api/v1/notices?status=' + status);
}

/**
 * 创建通知
 */
export function createNotice(data: Partial<Notice>) {
  return request.post<Notice>('/api/v1/notices', data, { actionCode: 'system:notice:add' });
}


/**
 * 标记为已读
 */
export function markNoticeAsRead(id: number) {
  return request.put(`/api/v1/notices/${id}/read`, undefined, { actionCode: 'system:notice:read' });
}

/**
 * 全部标记为已读
 */
export function markAllNoticeAsRead() {
  return request.put(`/api/v1/notices/readAll`, undefined, { actionCode: 'system:notice:readAll' });
}

/**
 * 清除通知
 */
export function clearNotice() {
  return request.delete(`/api/v1/notices/clear`, { actionCode: 'system:notice:clear' });
}
