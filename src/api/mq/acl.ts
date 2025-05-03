import { AclConfig, AclResponse, AclPermission, UpdatePermRequest, AddPermRequest, ACLAccount } from '@/types/mq/acl';
import request from '../../utils/request';



// 获取ACL配置列表
export const queryAclConfigs = async (): Promise<AclResponse> => {
 return await request.get('/api/v1/acl/config')
 
}

// 添加ACL账号
export const addAclAccount = async (config: ACLAccount): Promise<boolean> => {
  return await request.post('/api/v1/acl/add', config)
}

// 更新ACL账号
export const updateAclAccount = async (params: UpdatePermRequest): Promise<boolean> => {
  return await request.post('/api/v1/acl/update', params)
 
}

// 删除ACL账号
export const deleteAclAccount = async (accessKey: string): Promise<boolean> => {
  return await request.post('/api/v1/acl/delete', { accessKey })
 
}

// 添加Topic权限
export const addTopicPerm = async (params: AddPermRequest): Promise<void> => {
  return await request.post('/api/v1/acl/topic/add', params)
 
}

// 更新Topic权限
export const updateTopicPerm = async (params: AddPermRequest): Promise<void> => {
  return await request.post('/api/v1/acl/topic/update', params)
 
}

// 添加Group权限
export const addGroupPerm = async (params: AddPermRequest): Promise<void> => {
  return await request.post('/api/v1/acl/group/add', params)
 
}

// 更新Group权限
export const updateGroupPerm = async (params: AddPermRequest): Promise<void> => {
  return await request.post('/api/v1/acl/group/update', params)
 
}

// 删除权限配置
export const deletePermConfig = async (
  config: AclConfig,
  name: string,
  type: 'topic' | 'group'
): Promise<void> => {
  const params = {
    config,
    [type === 'topic' ? 'topicPerm' : 'groupPerm']: name
  }
  return await request.post('/api/v1/acl/perm/delete', params)
 
}

// 同步ACL数据
export const synchronizeAclData = async (params: AclConfig): Promise<void> => {
  return await request.post('/api/v1/acl/sync', params)
 
}

// 工具函数：拼接权限字符串
export const concatPerm = (name: string, pub: boolean, sub: boolean, deny: boolean): string => {
  const perms: string[] = []
  if (pub) perms.push('PUB')
  if (sub) perms.push('SUB')
  if (deny) perms.push('DENY')
  return `${name}=${perms.join('|')}`
}

// 工具函数：解析权限字符串
export const parsePermString = (permString: string): { name: string; perm: AclPermission } => {
  const [name, permStr] = permString.split('=')
  const perms = permStr.split('|')
  return {
    name,
    perm: {
      pub: perms.includes('PUB'),
      sub: perms.includes('SUB'),
      deny: perms.includes('DENY')
    }
  }
} 