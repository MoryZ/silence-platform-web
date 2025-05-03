import { defineStore } from 'pinia';
import { PiniaPluginContext } from 'pinia';

interface ConfigState {
  selectedSystemId: number | null;
  selectedComponentIds: number[];
}

export const useConfigStore = defineStore({
  id: 'config',
  state: (): ConfigState => ({
    selectedSystemId: null,
    selectedComponentIds: [],
  }),

  actions: {
    setSelectedSystem(systemId: number | null) {
      this.selectedSystemId = systemId;
    },
    setSelectedComponents(componentIds: number[]) {
      this.selectedComponentIds = componentIds;
    },
    clearSelections() {
      this.selectedSystemId = null;
      this.selectedComponentIds = [];
    },
  },
});

// 添加持久化插件
export function piniaPluginPersist({ store }: PiniaPluginContext) {
  // 对config store和searchHistory store应用持久化逻辑
  if (store.$id === 'config' || store.$id === 'searchHistory') {
    const storedState = localStorage.getItem(`silence-config-${store.$id}`);
    
    if (storedState) {
      try {
        const parsedState = JSON.parse(storedState);
        
        if (store.$id === 'config') {
          // 确保ID正确转换为数字类型
          if (parsedState.selectedSystemId) {
            parsedState.selectedSystemId = Number(parsedState.selectedSystemId);
          }
          
          if (Array.isArray(parsedState.selectedComponentIds)) {
            parsedState.selectedComponentIds = parsedState.selectedComponentIds.map((id: string | number) => Number(id));
          }
        }
        
        store.$patch(parsedState);
        console.log(`从localStorage恢复${store.$id}数据:`, parsedState);
      } catch (error) {
        console.error(`恢复储存的${store.$id}状态失败:`, error);
        localStorage.removeItem(`silence-config-${store.$id}`);
      }
    }

    store.$subscribe((mutation, state) => {
      console.log(`存储${store.$id}状态到localStorage:`, state);
      localStorage.setItem(`silence-config-${store.$id}`, JSON.stringify(state));
    });
  }
} 