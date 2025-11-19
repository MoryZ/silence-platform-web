import { parseContent } from '@/utils/common';
import { jobRequest as request } from '@/utils/request';

/** get workflow page list */
export function fetchGetWorkflowPageList(params?: any) {
  return request.get<any>('/api/v1/workflows', { params });
}

/** get namespace list */
export function fetchGetWorkflowNameList(params?: any) {
    return request.get<any>('/api/v1/workflows', { params });
}

/** trigger workflow */
export function fetchTriggerWorkflow(id: string) {
  return request.post<any>(`/api/v1/workflows/trigger/${id}`);
}

/** trigger workflow */
export function fetchTriggerWorkflowParams(data: any) {
  return request.post<any>('/api/v1/workflows/trigger', data);
}


export function enableWorkflow(id: string) {
  return request.put<any>(`/api/v1/workflows/${id}/enable`);
}

export function disableWorkflow(id: string) {
  return request.put<any>(`/api/v1/workflows/${id}/disable`);
}

export function fetchBatchDeleteWorkflow(data: string[]) {
  return request.delete<any>('/api/v1/workflows', { data });
}

export function fetchStopWorkflowBatch(id: string) {
  return request.post<any>(`/api/v1/workflowBatches/stop/${id}/stop`);
}

export function fetchWorkflowNodeRetry(id: string, workflowNodeId: string) {
  return request.post<any>(`/api/v1/workflowNodes/${id}/${workflowNodeId}`);
}

export function fetchCheckNodeExpression(expression: any) {
  return request.post<any>('/api/v1/workflows/check-node-expression', {
    ...expression,
    data: {
      ...expression,
      checkContent: JSON.stringify(parseContent(expression.checkContents))
    }
  });
}

export function fetchAddWorkflow(data: any) {
  return request.post<any>('/api/v1/workflows', data);
}

export function fetchUpdateWorkflow(data: any) {
  return request.put<any>('/api/v1/workflows', data);
}

export function fetchWorkflowInfo(id: string) {
  return request.get<any>(`/api/v1/workflows/${id}`);
}


export function fetchNodeRetry(nodeId: string, taskBatchId: string) {
  return request.post<any>(`/api/v1/workflowNodes/${nodeId}/${taskBatchId}`);
}

export function fetchNodeStop(nodeId: string, taskBatchId: string) {
  return request.post<any>(`/api/v1/workflowNodes/${nodeId}/${taskBatchId}/stop`);
}




/** get workflow batch list */
export function fetchGetWorkflowBatchList(params?: any) {
    return request.get<any>('/api/v1/workflowBatches', { params });
}

export function fetchWorkflowBatchInfo(id: string) {    
    return request.get<any>(`/api/v1/workflowBatches/${id}`);
}

export function fetchDeleteWorkflowBatch(id: string) {
    return request.delete<any>('/api/v1/workflowBatches', { data: [id] });
}

export function fetchBatchDeleteWorkflowBatch(data: string[]) {
    return request.delete<any>('/api/v1/workflowBatches', { data });
}

