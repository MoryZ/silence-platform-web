<template>
  <div class="change-analysis">
    <div class="change-header">
      <a-tag :color="getChangeTypeColor(analysis.type)" class="change-type-tag">
        {{ getChangeTypeText(analysis.type) }}
      </a-tag>
      <span class="change-summary">
        总计 {{ analysis.summary.totalChanges }} 处变更
      </span>
    </div>
    
    <div v-if="analysis.summary.totalChanges > 0" class="change-details">
      <a-row :gutter="16">
        <a-col :span="8" v-if="analysis.summary.addedLines > 0">
          <a-statistic
            title="新增"
            :value="analysis.summary.addedLines"
            value-style="color: #52c41a"
            suffix="行"
          />
        </a-col>
        <a-col :span="8" v-if="analysis.summary.removedLines > 0">
          <a-statistic
            title="删除"
            :value="analysis.summary.removedLines"
            value-style="color: #ff4d4f"
            suffix="行"
          />
        </a-col>
        <a-col :span="8" v-if="analysis.summary.changedLines > 0">
          <a-statistic
            title="修改"
            :value="analysis.summary.changedLines"
            value-style="color: #1890ff"
            suffix="行"
          />
        </a-col>
      </a-row>
    </div>

    <div v-if="showDetails && analysis.changes.added.length > 0" class="change-content">
      <h4>新增内容:</h4>
      <div class="change-item added">
        <pre v-for="(item, index) in analysis.changes.added" :key="`added-${index}`">{{ item }}</pre>
      </div>
    </div>

    <div v-if="showDetails && analysis.changes.removed.length > 0" class="change-content">
      <h4>删除内容:</h4>
      <div class="change-item removed">
        <pre v-for="(item, index) in analysis.changes.removed" :key="`removed-${index}`">{{ item }}</pre>
      </div>
    </div>

    <div v-if="showDetails && analysis.changes.changed.length > 0" class="change-content">
      <h4>修改内容:</h4>
      <div v-for="(item, index) in analysis.changes.changed" :key="`changed-${index}`" class="change-item changed">
        <div class="change-old">
          <span class="change-label">原内容:</span>
          <pre>{{ item.old }}</pre>
        </div>
        <div class="change-new">
          <span class="change-label">新内容:</span>
          <pre>{{ item.new }}</pre>
        </div>
      </div>
    </div>

    <div v-if="analysis.summary.totalChanges > 0" class="change-actions">
      <a-button type="link" @click="showDetails = !showDetails">
        {{ showDetails ? '隐藏详情' : '显示详情' }}
      </a-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { getChangeTypeText, getChangeTypeColor } from '../utils/changeAnalyzer';
import type { ChangeResult } from '../utils/changeAnalyzer';

interface Props {
  analysis: ChangeResult;
}

defineProps<Props>();

const showDetails = ref(false);
</script>

<style scoped lang="scss">
.change-analysis {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 16px;
  background: #fafafa;

  .change-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;

    .change-type-tag {
      font-weight: 500;
    }

    .change-summary {
      color: #666;
      font-size: 14px;
    }
  }

  .change-details {
    margin-bottom: 16px;
  }

  .change-content {
    margin-bottom: 16px;

    h4 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 14px;
    }

    .change-item {
      border-radius: 4px;
      padding: 8px;
      margin-bottom: 8px;

      &.added {
        background: #f6ffed;
        border: 1px solid #b7eb8f;
      }

      &.removed {
        background: #fff2f0;
        border: 1px solid #ffccc7;
      }

      &.changed {
        background: #e6f7ff;
        border: 1px solid #91d5ff;
        display: flex;
        gap: 16px;

        .change-old,
        .change-new {
          flex: 1;

          .change-label {
            display: block;
            font-size: 12px;
            color: #666;
            margin-bottom: 4px;
          }
        }
      }

      pre {
        margin: 0;
        font-size: 12px;
        line-height: 1.4;
        white-space: pre-wrap;
        word-break: break-all;
      }
    }
  }

  .change-actions {
    text-align: center;
    border-top: 1px solid #e8e8e8;
    padding-top: 12px;
  }
}
</style>
