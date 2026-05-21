/** 日志级别 */
export type JobLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

/** 任务日志消息 */
export interface JobMessage {
  /** 日志索引 */
  index: number;
  /** 日志唯一标识 */
  key: string;
  /** 日志级别 */
  level: JobLevel;
  /** 主机地址 */
  host: string;
  /** 端口 */
  port: string;
  /** 代码位置 */
  location: string;
  /** 日志消息 */
  message: string;
  /** 线程名 */
  thread: string;
  /** 时间戳 */
  time_stamp: string;
  /** 异常堆栈 */
  throwable: string;
}

/** WebSocket 场景类型 */
export type WebSocketScene = 'JOB_LOG_SCENE' | 'RETRY_LOG_SCENE';

/** 任务日志查询请求 */
export interface JobLogQuery {
  taskBatchId: string | number;
  taskId: string | number;
}

/** 重试日志查询请求 */
export interface RetryLogQuery {
  groupName: string;
  retryTaskId: string | number;
}

/** WebSocket 连接状态 */
export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
