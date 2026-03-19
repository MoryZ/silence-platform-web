export interface CloneNamespaceParams {
  sourceEnvironmentId: number;
  targetEnvironmentId: number;
  cloneMode: number;
}

export interface SyncNamespaceParams {
  sourceConfigItemId: number;
  targetEnvironmentId: number;
  targetNamespaceIds: string[];
  conflictStrategy: number;
}