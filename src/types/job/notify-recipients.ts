export interface NotifyRecipientParams {
  pageNo: number;
  pageSize: number;
  sort: string;
  recipientName: string | null;
  notifyType: number | null;
}

export interface NotifyRecipient {
  id: string;
  notifyName: string;
  groupName: string;
  notifyType: number;
  description: string;
  notifyAttribute: any;
  recipientName: string;
}

export interface NotifyRecipientPage {
  total: number;
  data: NotifyRecipient[];
}