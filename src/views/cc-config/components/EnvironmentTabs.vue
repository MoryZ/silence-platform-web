<template>
  <div v-if="selectedComponents.length && currentEnv" class="environment-selector">
    <div class="env-tabs-wrapper">
      <div class="env-tabs-container">
        <div
          v-for="env in environments"
          :key="env.id"
          :class="['env-tab', { active: activeTabKey === env.id }]"
          @click="handleTabClick(env.id)"
        >
          <span class="env-tab-name">{{ env.displayName || env.name }}</span>
          <span
            v-if="environments.length > 1"
            class="env-tab-close"
            @click.stop="handleDeleteTab(env.id)"
          >
            <close-outlined />
          </span>
        </div>
        <!-- 如果没有环境，显示创建提示 -->
        <div
          v-if="environments.length === 0"
          class="env-tab empty"
          @click="handleAddTab"
        >
          <span class="env-tab-name">请先创建环境</span>
        </div>
        <!-- 添加环境按钮 -->
        <div class="env-add-btn" @click="handleAddTab">
          <plus-outlined />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { PlusOutlined, CloseOutlined } from '@ant-design/icons-vue';
import type { ConfigEnvironment } from '@/types/config';

interface Props {
  environments: ConfigEnvironment[];
  activeTabKey: string | number;
  selectedComponents: number[];
  currentEnv: string | null;
}

interface Emits {
  (e: 'change', envId: number | string): void;
  (e: 'delete', envId: number | string): void;
  (e: 'add'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const handleTabClick = (envId: number | string) => {
  emit('change', envId);
};

const handleDeleteTab = (envId: number | string) => {
  emit('delete', envId);
};

const handleAddTab = () => {
  emit('add');
};
</script>

<style lang="scss" scoped>
.environment-selector {
  margin-bottom: 24px;
  
  .env-tabs-wrapper {
    background: #fff;
    border-radius: 8px;
    padding: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    border: 1px solid #f0f0f0;
  }
  
  .env-tabs-container {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .env-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    border-radius: 8px;
    background: #fafafa;
    border: 1px solid #e8e8e8;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    user-select: none;
    position: relative;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    
    &:hover:not(.empty):not(.active) {
      background: linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 100%);
      border-color: #bfd4f2;
      box-shadow: 0 2px 8px rgba(22, 119, 255, 0.12);
      transform: translateY(-1px);
      
      .env-tab-name {
        color: #1677ff;
        font-weight: 500;
      }
    }
    
    &.active {
      background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
      border-color: #1677ff;
      box-shadow: 0 4px 12px rgba(22, 119, 255, 0.3);
      transform: translateY(-2px);
      
      .env-tab-name {
        color: #fff;
        font-weight: 600;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
      
      .env-tab-close {
        color: #fff;
        opacity: 0.9;
        
        &:hover {
          background: rgba(255, 255, 255, 0.25);
          border-radius: 50%;
          opacity: 1;
          transform: scale(1.1);
        }
      }
      
      &:hover {
        box-shadow: 0 6px 16px rgba(22, 119, 255, 0.4);
        transform: translateY(-2px) scale(1.02);
      }
    }
    
    &.empty {
      border: 2px dashed #d9d9d9;
      background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
      
      .env-tab-name {
        color: #999;
        font-style: italic;
      }
      
      &:hover {
        border-color: #1677ff;
        background: linear-gradient(135deg, #f0f7ff 0%, #e6f4ff 100%);
        box-shadow: 0 2px 8px rgba(22, 119, 255, 0.15);
        transform: translateY(-1px);
        
        .env-tab-name {
          color: #1677ff;
          font-style: normal;
        }
      }
    }
    
    .env-tab-name {
      font-size: 14px;
      color: #333;
      line-height: 1.5;
    }
    
    .env-tab-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      color: #999;
      transition: all 0.2s;
      border-radius: 50%;
      font-size: 12px;
      
      &:hover {
        background: rgba(0, 0, 0, 0.06);
        color: #333;
      }
    }
  }
  
  .env-add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 2px dashed #d9d9d9;
    background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    color: #666;
    font-size: 16px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    
    &:hover {
      border-color: #1677ff;
      color: #1677ff;
      background: linear-gradient(135deg, #f0f7ff 0%, #e6f4ff 100%);
      box-shadow: 0 4px 12px rgba(22, 119, 255, 0.25);
      transform: translateY(-2px) scale(1.05);
      border-width: 2px;
    }
    
    &:active {
      transform: translateY(0) scale(0.98);
      box-shadow: 0 2px 4px rgba(22, 119, 255, 0.2);
    }
  }
}
</style>
