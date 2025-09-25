import { parseContent } from '@/utils/common';
import { jobRequest as request } from '@/utils/request';

/** get workflow page list */
export function fetchGetWorkflowPageList(params?: any) {
  return request.get<any>('/workflow/page/list', { params });
}

/** trigger workflow */
export function fetchTriggerWorkflow(id: string) {
  return request.post<any>(`/workflow/trigger/${id}`);
}

/** trigger workflow */
export function fetchTriggerWorkflowParams(data: any) {
  return request.post<any>('/workflow/trigger', data);
}

/** get namespace list */
export function fetchGetWorkflowNameList(params?: any) {
  return request.get<any>('/workflow/workflow-name/list', { params });
}

/** get workflow batch list */
export function fetchGetWorkflowBatchList(params?: any) {
  return request.get<any>('/workflow/batch/page/list', { params });
}

export function fetchUpdateWorkflowStatus(id: string) {
  return request.put<any>(`/workflow/update/status/${id}`);
}

export function fetchBatchDeleteWorkflow(data: string[]) {
  return request.delete<any>('/workflow/ids', { data });
}

export function fetchStopWorkflowBatch(id: string) {
  return request.post<any>(`/workflow/batch/stop/${id}`);
}

export function fetchWorkflowNodeRetry(id: string, workflowNodeId: string) {
  return request.post<any>(`/workflow/node/retry/${workflowNodeId}/${id}`);
}

export function fetchCheckNodeExpression(expression: any) {
  return request.post<any>('/workflow/check-node-expression', {
    ...expression,
    data: {
      ...expression,
      checkContent: JSON.stringify(parseContent(expression.checkContents))
    }
  });
}

export function fetchAddWorkflow(data: any) {
  return request.post<any>('/workflow', data);
}

export function fetchUpdateWorkflow(data: any) {
  return request.put<any>('/workflow', data);
}

export function fetchWorkflowInfo(id: string) {
  return request.get<any>(`/workflow/${id}`);
}

export function fetchWorkflowBatchInfo(id: string) {
  return request.get<any>(`/workflow/batch/${id}`);
}

export function fetchNodeRetry(nodeId: string, taskBatchId: string) {
  return request.post<any>(`/workflow/node/retry/${nodeId}/${taskBatchId}`);
}

export function fetchNodeStop(nodeId: string, taskBatchId: string) {
  return request.post<any>(`/workflow/node/stop/${nodeId}/${taskBatchId}`);
}

export function fetchDeleteWorkflowBatch(id: string) {
  return request.delete<any>('/workflow/batch/ids', { data: [id] });
}

export function fetchBatchDeleteWorkflowBatch(data: string[]) {
  return request.delete<any>('/workflow/batch/ids', { data });
}
