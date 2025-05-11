import request from '../../utils/request';

/** get Job Log List */
export function fetchJobLogList(params?: Api.JobLog.JobLogSearchParams, controller?: AbortController) {
  return request<Api.JobLog.JobLogList>({
    url: '/job/log/list',
    method: 'get',
    params,
    signal: controller?.signal
  });
}

/** get Retry Log List */
export function fetchRetryLogList(params?: Api.JobLog.RetryLogSearchParams) {
  return request<Api.JobLog.JobLogList>({
    url: '/retry-task/message/list',
    method: 'get',
    params
  });
}
