export interface NotifyParams {
  pageNo: number;
  pageSize: number;
  sort: string;
  notifyName: string | null;
  groupName: string | null;
  systemTaskType: number | null;
  notifyStatus: number | null;
}

export interface NotifyConfig {
  id: string;
  notifyName: string;
  groupName: string;
  systemTaskType: number;
  notifyStatus: number;
}

export interface NotifyConfigPage {
  total: number;
  data: NotifyConfig[];
}