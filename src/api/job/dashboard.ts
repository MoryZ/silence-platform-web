import request from '../../utils/request';

/** Task Retry Job */
export function fetchCardCount() {
  return request.get<Api.Dashboard.CardCount>({
    url: '/dashboard/task-retry-job',
    method: 'get'
  });
}

/** All Group Name */
export function fetchAllGroupName() {
  return request<string[]>({
    url: '/group/all/group-name/list',
    method: 'get'
  });
}

/** Retry Line */
export function fetchRetryLine(params?: Api.Dashboard.DashboardLineParams) {
  return request<Api.Dashboard.DashboardLine>({
    url: '/dashboard/retry/line',
    method: 'get',
    params
  });
}

/** Job Line */
export function fetchJobLine(params?: Api.Dashboard.DashboardLineParams) {
  return request<Api.Dashboard.DashboardLine>({
    url: '/dashboard/job/line',
    method: 'get',
    params
  });
}

/** Pods */
export function fetchPods(params?: Api.Dashboard.DashboardPodsParams) {
  return request<Api.Dashboard.DashboardPodList>({
    url: '/dashboard/pods',
    method: 'get',
    params
  });
}
