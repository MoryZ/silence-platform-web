export interface BatchPublishParams {
  configItemIds: number[];
  releaseName: string;
  releaseType: number;
  environmentId: number;
}

export interface PublishParams {
  releaseName: string;
  configItemId: number;
  oldContent: string;
  content: string;
  releaseType: number;
}