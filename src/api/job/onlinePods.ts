import { jobRequest as request } from '@/utils/request';


export function getAllGroupConfigs(groupName: string) {
  return request.get( `/api/v1/onlin/pods/${groupName}`);
}


