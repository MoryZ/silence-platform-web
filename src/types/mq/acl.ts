export interface AclConfig {
  accessKey: string
  secretKey: string
  admin: boolean
  defaultTopicPerm: 'PUB' | 'SUB' | 'DENY'
  defaultGroupPerm: 'PUB' | 'SUB' | 'DENY'
  topicPerms?: Record<string, string>
  groupPerms?: Record<string, string>
  whiteRemoteAddresses?: string[]
}

export interface AclResponse {
  plainAccessConfigs: AclConfig[]
  globalWhiteAddrs: string[]
}

export interface AclPermission {
  pub: boolean
  sub: boolean
  deny: boolean
}

export interface UpdatePermRequest {
  accessKey: string
  secretKey?: string
  admin?: boolean
  defaultTopicPerm?: 'PUB' | 'SUB' | 'DENY'
  defaultGroupPerm?: 'PUB' | 'SUB' | 'DENY'
}

export interface AddPermRequest {
  accessKey: string
  topic?: string
  group?: string
  perm: AclPermission
}

export interface ACLAccount {
  username: string
  password?: string
  accessKey?: string
  secretKey?: string
  admin: boolean
  defaultTopicPerm: 'PUB' | 'SUB' | 'PUB|SUB' | 'DENY'
  defaultGroupPerm: 'PUB' | 'SUB' | 'PUB|SUB' | 'DENY'
  topicPerms: Record<string, string>
  groupPerms: Record<string, string>
  createTime: number
  updateTime: number
}

export interface ACLConfig {
  globalWhiteRemoteAddresses: string[]
  accessValidateEnable: boolean
  aclFileFullPath: string
  accounts: ACLAccount[]
}
