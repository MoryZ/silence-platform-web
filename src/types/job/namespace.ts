export interface NameSpace {
  id: number;
  name: string;
  uniqueId: string;
  description: string;
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface NameSpacePage {
  total: number;
  data: NameSpace[];
}

export interface NameSpaceParams {
  name: string;
  uniqueId: string;
  pageNo: number;
  pageSize: number;
}