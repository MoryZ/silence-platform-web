import * as Diff from 'diff';

export interface ChangeResult {
  type: 'added' | 'removed' | 'changed' | 'unchanged';
  changes: {
    added: string[];
    removed: string[];
    changed: Array<{
      old: string;
      new: string;
    }>;
  };
  summary: {
    addedLines: number;
    removedLines: number;
    changedLines: number;
    totalChanges: number;
  };
}

/**
 * 分析两个字符串之间的变更
 * @param oldStr 原始字符串
 * @param newStr 新字符串
 * @returns 变更分析结果
 */
export function analyzeChanges(oldStr: string, newStr: string): ChangeResult {
  // 如果两个字符串完全相同
  if (oldStr === newStr) {
    return {
      type: 'unchanged',
      changes: {
        added: [],
        removed: [],
        changed: []
      },
      summary: {
        addedLines: 0,
        removedLines: 0,
        changedLines: 0,
        totalChanges: 0
      }
    };
  }

  // 如果原始字符串为空，新字符串不为空，则为新增
  if (!oldStr && newStr) {
    const newLines = newStr.split('\n');
    return {
      type: 'added',
      changes: {
        added: newLines,
        removed: [],
        changed: []
      },
      summary: {
        addedLines: newLines.length,
        removedLines: 0,
        changedLines: 0,
        totalChanges: newLines.length
      }
    };
  }

  // 如果新字符串为空，原始字符串不为空，则为删除
  if (oldStr && !newStr) {
    const oldLines = oldStr.split('\n');
    return {
      type: 'removed',
      changes: {
        added: [],
        removed: oldLines,
        changed: []
      },
      summary: {
        addedLines: 0,
        removedLines: oldLines.length,
        changedLines: 0,
        totalChanges: oldLines.length
      }
    };
  }

  // 使用 diff 库分析字符级别的变更
  const changes = Diff.diffChars(oldStr, newStr);
  const result: ChangeResult = {
    type: 'changed',
    changes: {
      added: [],
      removed: [],
      changed: []
    },
    summary: {
      addedLines: 0,
      removedLines: 0,
      changedLines: 0,
      totalChanges: 0
    }
  };

  let currentAdded = '';
  let currentRemoved = '';

  changes.forEach(part => {
    if (part.added) {
      currentAdded += part.value;
    } else if (part.removed) {
      currentRemoved += part.value;
    } else {
      // 当遇到未变更的部分时，处理之前累积的变更
      if (currentAdded || currentRemoved) {
        if (currentAdded && currentRemoved) {
          // 既有新增又有删除，视为修改
          result.changes.changed.push({
            old: currentRemoved,
            new: currentAdded
          });
          result.summary.changedLines++;
        } else if (currentAdded) {
          // 只有新增
          result.changes.added.push(currentAdded);
          result.summary.addedLines += currentAdded.split('\n').length;
        } else if (currentRemoved) {
          // 只有删除
          result.changes.removed.push(currentRemoved);
          result.summary.removedLines += currentRemoved.split('\n').length;
        }
        
        currentAdded = '';
        currentRemoved = '';
      }
    }
  });

  // 处理最后累积的变更
  if (currentAdded || currentRemoved) {
    if (currentAdded && currentRemoved) {
      result.changes.changed.push({
        old: currentRemoved,
        new: currentAdded
      });
      result.summary.changedLines++;
    } else if (currentAdded) {
      result.changes.added.push(currentAdded);
      result.summary.addedLines += currentAdded.split('\n').length;
    } else if (currentRemoved) {
      result.changes.removed.push(currentRemoved);
      result.summary.removedLines += currentRemoved.split('\n').length;
    }
  }

  // 计算总变更数
  result.summary.totalChanges = result.summary.addedLines + result.summary.removedLines + result.summary.changedLines;

  // 根据变更情况确定类型
  if (result.summary.addedLines > 0 && result.summary.removedLines === 0 && result.summary.changedLines === 0) {
    result.type = 'added';
  } else if (result.summary.removedLines > 0 && result.summary.addedLines === 0 && result.summary.changedLines === 0) {
    result.type = 'removed';
  } else {
    result.type = 'changed';
  }

  return result;
}

/**
 * 分析行级别的变更
 * @param oldStr 原始字符串
 * @param newStr 新字符串
 * @returns 行级别变更分析结果
 */
export function analyzeLineChanges(oldStr: string, newStr: string): ChangeResult {
  const oldLines = oldStr ? oldStr.split('\n') : [];
  const newLines = newStr ? newStr.split('\n') : [];

  // 如果两个字符串完全相同
  if (oldStr === newStr) {
    return {
      type: 'unchanged',
      changes: {
        added: [],
        removed: [],
        changed: []
      },
      summary: {
        addedLines: 0,
        removedLines: 0,
        changedLines: 0,
        totalChanges: 0
      }
    };
  }

  // 如果原始字符串为空，新字符串不为空，则为新增
  if (oldLines.length === 0 && newLines.length > 0) {
    return {
      type: 'added',
      changes: {
        added: newLines,
        removed: [],
        changed: []
      },
      summary: {
        addedLines: newLines.length,
        removedLines: 0,
        changedLines: 0,
        totalChanges: newLines.length
      }
    };
  }

  // 如果新字符串为空，原始字符串不为空，则为删除
  if (oldLines.length > 0 && newLines.length === 0) {
    return {
      type: 'removed',
      changes: {
        added: [],
        removed: oldLines,
        changed: []
      },
      summary: {
        addedLines: 0,
        removedLines: oldLines.length,
        changedLines: 0,
        totalChanges: oldLines.length
      }
    };
  }

  // 使用 diff 库分析行级别的变更
  const changes = Diff.diffLines(oldStr, newStr);
  const result: ChangeResult = {
    type: 'changed',
    changes: {
      added: [],
      removed: [],
      changed: []
    },
    summary: {
      addedLines: 0,
      removedLines: 0,
      changedLines: 0,
      totalChanges: 0
    }
  };

  changes.forEach(part => {
    if (part.added) {
      const addedLines = part.value.split('\n').filter(line => line !== '');
      result.changes.added.push(...addedLines);
      result.summary.addedLines += addedLines.length;
    } else if (part.removed) {
      const removedLines = part.value.split('\n').filter(line => line !== '');
      result.changes.removed.push(...removedLines);
      result.summary.removedLines += removedLines.length;
    }
  });

  // 计算总变更数
  result.summary.totalChanges = result.summary.addedLines + result.summary.removedLines + result.summary.changedLines;

  // 根据变更情况确定类型
  if (result.summary.addedLines > 0 && result.summary.removedLines === 0) {
    result.type = 'added';
  } else if (result.summary.removedLines > 0 && result.summary.addedLines === 0) {
    result.type = 'removed';
  } else {
    result.type = 'changed';
  }

  return result;
}

/**
 * 获取变更类型的显示文本
 * @param type 变更类型
 * @returns 显示文本
 */
export function getChangeTypeText(type: string): string {
  switch (type) {
    case 'added':
      return '新增';
    case 'removed':
      return '删除';
    case 'changed':
      return '修改';
    case 'unchanged':
      return '未变更';
    default:
      return '未知';
  }
}

/**
 * 获取变更类型的颜色
 * @param type 变更类型
 * @returns 颜色值
 */
export function getChangeTypeColor(type: string): string {
  switch (type) {
    case 'added':
      return 'green';
    case 'removed':
      return 'red';
    case 'changed':
      return 'blue';
    case 'unchanged':
      return 'default';
    default:
      return 'default';
  }
}

/**
 * 根据变更类型获取操作类型
 * @param type 变更类型
 * @returns 操作类型数字
 */
export function getOperationType(type: string): number {
  switch (type) {
    case 'added':
      return 1; // 新增
    case 'changed':
      return 2; // 修改
    case 'removed':
      return 3; // 删除
    case 'unchanged':
      return 4; // 未变更
    default:
      return 2; // 默认为修改
  }
}
