export interface ConfigEnvironment {
  id: number;
  name: string;
  displayName: string;
  envType: number;
  display: boolean;
  configComponentId: number;
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface ConfigEnvironmentParams {
  configComponentId: number;
  envType: number;
}