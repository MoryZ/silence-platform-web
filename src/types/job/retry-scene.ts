export interface RetrySceneParams {
  pageNo?: number;
  pageSize?: number;
  sort?: string;
  groupName?: string | null;
  sceneName?: string | null;
  sceneStatus?: boolean | null;
}

export interface RetryScene {
  id: string;
  groupName: string;
  sceneName: string;
  sceneStatus: boolean;
}

export interface RetryScenePage {
  data: RetryScene[];
  total: number;
}