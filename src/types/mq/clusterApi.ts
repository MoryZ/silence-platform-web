export interface ClusterInfo {
  clusterAddrTable: Record<string, string[]>;
  brokerAddrTable: Record<string, {
    cluster: string;
    brokerName: string;
    brokerAddrs: Record<string, string>;
    enableActingMaster?: boolean;
    zoneName?: string;
  }>;
}

export interface BrokerDetail {
  brokerName: string;
  index: number;
  brokerAddr: string;
  version: string;
  inTotalYest: number;
  outTotalYest: number;
  inTotalToday: number;
  outTotalToday: number;
}

export interface ClusterData {
  clusterInfo: ClusterInfo;
  brokerServer: Record<string, Record<number, BrokerDetail>>;
  messageTypes: Record<string, string>;
}

export interface BrokerConfig {
  brokerName: string;
  brokerAddr: string;
  config: Record<string, string>;
}