export interface Statistics {
  configCenter: ConfigStat;
  jobCenter: JobStat;
  mqCenter: MqStat;
}

export interface ConfigStat {
  namespaceCount: number;
  listenerInstanceCount: number;
  componentCount: number;
}

export interface JobStat {
  localJobCount: number;
  remoteJobCount: number;
}

export interface MqStat {
  topicCount: number;
  publishRelationCount: number;
}