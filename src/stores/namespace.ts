import { defineStore } from 'pinia';
import type { NameSpace } from '@/api/job/namespace';
import { ls } from '@/utils/stoarge';
import { CURRENT_NAMESPACE } from '@/utils/constant';

export interface NamespaceState {
  currentNamespace: NameSpace | null;
}

export const useNamespaceStore = defineStore('namespace', {
  state: (): NamespaceState => {
    // 从 localStorage 恢复命名空间
    const storedNamespace = ls.get<NameSpace>(CURRENT_NAMESPACE);
    return {
      currentNamespace: storedNamespace || null,
    };
  },
  
  getters: {
    namespaceDisplayName(): string {
      return this.currentNamespace?.name || 'Default';
    },
    
    namespaceId(): string {
      return this.currentNamespace?.uniqueId || '';
    },
  },

  actions: {
    setCurrentNamespace(namespace: NameSpace | null) {
      this.currentNamespace = namespace;
      // 保存到 localStorage
      if (namespace) {
        ls.set(CURRENT_NAMESPACE, namespace);
      } else {
        ls.remove(CURRENT_NAMESPACE);
      }
    },
    
    clearCurrentNamespace() {
      this.currentNamespace = null;
      ls.remove(CURRENT_NAMESPACE);
    },
  },
});

