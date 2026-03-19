export interface ConfigComponent {
  id: number;
  name: string;
  code: string;
  description: string;
  subsystemId: number;
  status: boolean;
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface ConfigComponentParams {
  subsystemId?: number;
}