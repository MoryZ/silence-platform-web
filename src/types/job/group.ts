export interface GroupConfigSearchParams {
  groupName: string;
  groupStatus: boolean;
  pageNo: number;
  pageSize: number;
}

export interface GroupConfigRequestVO {
  id?: number;
  groupName: string;
  groupStatus: boolean;
  token: string;
  description?: string;
  groupPartition: number;
  idGeneratorMode: number;
  initScene: boolean;
}

export interface GroupConfigResponseVO {
  total: number;
  data: GroupConfig[];
}

export interface GroupConfig {
  id: number;
  groupName: string;
  namespaceId: string;
  namespaceName: string;
  groupStatus: boolean;
  groupPartition: number;
  routeKey: number;
  version: number;
  description?: string;
  idGeneratorMode: number;
  initScene: boolean;
  onlinePodList: string[];
  token: string;
  createdDat: string;
  updatedDate: string;
}

export interface GroupConfigUpdateVO {
  groupName: string;
  groupStatus: boolean;
}

export interface CommonSelectedVO {
  label: string;
  value: string;
}