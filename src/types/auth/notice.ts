export interface Notice {
  id: number;
  title: string;
  content: string;
  senderId: number;
  senderName: string;
  status: number;
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface NoticeResponse {
  data: Notice[];
  total: number;
  pageNo: number;
  pageSize: number;
}

export interface NoticeParams {
  pageNo: number;
  pageSize: number;
  status: number;
}