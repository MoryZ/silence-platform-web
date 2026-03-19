export interface RetrySearchParams {
  pageNo: number;
  pageSize: number;
  sort: string;
  groupName?: string;
  sceneName?: string;
  idempotentId?: string;
  bizNo?: string;
  retryStatus?: number;
}