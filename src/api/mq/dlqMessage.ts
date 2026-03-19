import type { PaginationQuery, PaginationResult } from '@/types/mq/api';
import { mqRequest as request } from '@/utils/request';
import type { MessagePageResultPage, MessageView } from '@/types/mq/message';
import type { ResendDLQMessageRequest, DLQMessageQuery, DLQMessagePage } from '@/types/mq/dlqMessage';


// 获取消费者组列表
export const queryConsumerGroupList = async (): Promise<DLQMessagePage[]> => {
  return await request.get('/api/v1/dlqMessage/queryDlqMessageByConsumerGroup')
}

// 查询死信队列消息
export const queryDLQMessages = async (params: DLQMessageQuery
): Promise<PaginationResult<void>> => {
  return await request.get('/api/v1/dlqMessage/messages', { params })
}

// 导出死信队列消息
export const exportDLQMessages = async (consumerGroup: string, msgId: string): Promise<Blob> => {
    return await request.get('/api/v1/dlqMessage/exportDlqMessage', {
        params: { consumerGroup, msgId },
        responseType: 'blob'
    })
}

// 批量重发死信队列消息
export const batchResendDLQMessage = async (params: ResendDLQMessageRequest[]): Promise<void> => {
  return await request.post('/api/v1/dlqMessage/batchResendDlqMessage', params)
}

// 批量导出死信队列消息
export const batchExportDLQMessages = async (params: ResendDLQMessageRequest[]): Promise<Blob> => {
  return await request.get('/api/v1/batchExportDlqMessage', {
    params,
    responseType: 'blob'
  })
}
