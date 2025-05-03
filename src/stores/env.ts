import { defineStore } from 'pinia';

export type EnvType = '1' | '2' | '3';

export interface EnvState {
  currentEnv: EnvType;
}

export const useEnvStore = defineStore('env', {
  state: (): EnvState => ({
    currentEnv: '1',
  }),
  
  getters: {
    envDisplayName(): string {
      const envMap = {
        1: '开发环境',
        2: '测试环境',
        3: '生产环境',
      };
      return envMap[this.currentEnv];
    },
  },

  actions: {
    setCurrentEnv(env: EnvType) {
      this.currentEnv = env;
    },
  },
}); 