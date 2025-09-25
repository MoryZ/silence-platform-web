import { jobRequest as request } from '@/utils/request';

/** get system user list */
export function fetchSystemUser() {
  return request.get('/api/v1/systemUsers');
}
