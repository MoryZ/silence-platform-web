import type {PaginationQuery, PaginationResult } from '@/types/mq/api'
import { mqRequest as request } from '@/utils/request';
import { MessagePageResultPage } from '@/types/mq/message';
import { MessageView } from '@/types/mq/message';
import { ResendDLQMessageRequest } from '@/types/mq/dlqMessage';
export interface DLQMessageQuery extends PaginationQuery {
  topic: string
  taskId?: string
  begin: number
  end: number
}

export interface DLQMessagePage {
  page: MessagePageResultPage<MessageView>
  taskId: string
}


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
