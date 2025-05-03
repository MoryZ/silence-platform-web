import request from '../utils/request';
import type { AxiosResponse } from 'axios';

export interface Notice {
  id: number;
  title: string;
  content: string;
  senderId: number;
  senderName: string;
  status: number;
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface NoticeResponse {
  data: Notice[];
  total: number;
  pageNo: number;
  pageSize: number;
}

export interface NoticeParams {
  pageNo: number;
  pageSize: number;
  status: number;
}

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
  return request.post<Notice>('/api/v1/notices', data);
}


/**
 * 标记为已读
 */
export function markNoticeAsRead(id: number) {
  return request.put(`/api/v1/notices/${id}/read`);
}

/**
 * 全部标记为已读
 */
export function markAllNoticeAsRead() {
  return request.put(`/api/v1/notices/readAll`);
}

/**
 * 清除通知
 */
export function clearNotice() {
  return request.delete(`/api/v1/notices/clear`);
}
