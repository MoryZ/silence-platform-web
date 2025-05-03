<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { ACLConfig, ACLAccount, AclResponse } from '@/types/mq/acl'
import { message } from 'ant-design-vue'
import { addAclAccount, queryAclConfigs } from '@/api/mq/acl'

// State
const config = ref<AclResponse>({
  globalWhiteAddrs: [],
  plainAccessConfigs: []
})

const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showPermDialog = ref(false)

const newAccount = ref({
  accessKey: '',
  secretKey: '',
  admin: false,
  defaultTopicPerm: 'DENY',
  defaultGroupPerm: 'SUB'
})

const editAccount = ref<ACLAccount>()

const selectedAccount = ref<ACLAccount | null>(null)
const newTopicPerm = ref({ resource: '', perm: 'DENY' })
const newGroupPerm = ref({ resource: '', perm: 'DENY' })

const globalWhiteRemoteAddressesStr = computed({
  get() {
    return (config.value.globalWhiteAddrs || []).join('\n')
  },
  set(val: string) {
    config.value.globalWhiteAddrs = val.split('\n').filter(Boolean)
  }
})

const activeTab = ref('account')
const filterAccessKey = ref('')

const filteredAccounts = computed(() =>
  config.value.globalWhiteAddrs.includes(filterAccessKey.value)
)

const columns = [
  { title: 'Access Key', dataIndex: 'accessKey', key: 'accessKey' },
  { title: 'Secret Key', dataIndex: 'secretKey', key: 'secretKey' },
  { title: '是否管理员', dataIndex: 'admin', key: 'admin' },
  { title: 'topic默认权限', dataIndex: 'defaultTopicPerm', key: 'defaultTopicPerm' },
  { title: '消费组默认权限', dataIndex: 'defaultGroupPerm', key: 'defaultGroupPerm' },
  { title: 'topic权限', dataIndex: 'topicPerms', key: 'topicPerms' },
  { title: '消费组权限', dataIndex: 'groupPerms', key: 'groupPerms' },
  { title: '操作', key: 'action' }
]

const whiteListColumns = [
  { title: '白名单', dataIndex: 'address', key: 'address' },
  { title: '操作', key: 'action', customRender: ({ record }) => '操作按钮' }
]

// Methods
const loadConfig = async () => {
  try {
    const response = await queryAclConfigs()
    if (response) {
      config.value = response
    } else {
      console.error('Error loading ACL config:', data.errMsg)
    }
  } catch (error) {
    console.error('Error loading ACL config:', error)
  }
}

const createAccount = async (account: ACLAccount) => {
  try {
    const response = await addAclAccount(account)
    if (response) {
      showCreateDialog.value = false
      await loadConfig()
      resetNewAccount()
    } else {
      console.error('Error creating account:')
    }
  } catch (error) {
    console.error('Error creating account:', error)
  }
}

const updateAccount = async () => {
  try {
    const response = await fetch('/acl/account.update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(editAccount.value)
    })
    const data = await response.json()
    if (data.status === 0) {
      showEditDialog.value = false
      await loadConfig()
    } else {
      console.error('Error updating account:', data.errMsg)
    }
  } catch (error) {
    console.error('Error updating account:', error)
  }
}

const deleteAccount = async (username: string) => {
  if (!confirm(`Are you sure you want to delete account "${username}"?`)) {
    return
  }
  
  try {
    const response = await fetch('/acl/account.delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username })
    })
    const data = await response.json()
    if (data.status === 0) {
      await loadConfig()
    } else {
      console.error('Error deleting account:', data.errMsg)
    }
  } catch (error) {
    console.error('Error deleting account:', error)
  }
}

const openEditDialog = (account: ACLAccount) => {
  editAccount.value = {
    ...account,
    password: ''
  }
  showEditDialog.value = true
}

const openPermDialog = (account: ACLAccount) => {
  selectedAccount.value = account
  showPermDialog.value = true
}

const addTopicPerm = () => {
  if (selectedAccount.value && newTopicPerm.value.resource) {
    editAccount.value.topicPerms = {
      ...editAccount.value.topicPerms,
      [newTopicPerm.value.resource]: newTopicPerm.value.perm
    }
    newTopicPerm.value = { resource: '', perm: 'DENY' }
  }
}

const addGroupPerm = () => {
  if (selectedAccount.value && newGroupPerm.value.resource) {
    editAccount.value.groupPerms = {
      ...editAccount.value.groupPerms,
      [newGroupPerm.value.resource]: newGroupPerm.value.perm
    }
    newGroupPerm.value = { resource: '', perm: 'DENY' }
  }
}

const removeTopicPerm = (topic: string) => {
  if (editAccount.value.topicPerms) {
    const { [topic]: removed, ...rest } = editAccount.value.topicPerms
    editAccount.value.topicPerms = rest
  }
}

const removeGroupPerm = (group: string) => {
  if (editAccount.value.groupPerms) {
    const { [group]: removed, ...rest } = editAccount.value.groupPerms
    editAccount.value.groupPerms = rest
  }
}

const resetNewAccount = () => {
  newAccount.value = {
    accessKey: '',
    secretKey: '',
    admin: false,
    defaultTopicPerm: 'DENY',
    defaultGroupPerm: 'SUB'
  }
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString()
}

const handleCreateAccount = async () => {
  // 校验
  if (!newAccount.value.accessKey || !newAccount.value.secretKey) {
    message.error('Access Key 和 Secret Key 必填')
    return
  }
  // 调用后端接口
  await createAccount(newAccount.value)
  showCreateDialog.value = false
}

const whiteList = ref<string[]>([]) // 假设你有白名单数据

onMounted(() => {
  loadConfig()
  // loadWhiteList() // 如果有白名单接口
})
</script>

<template>
  <div class="acl-page">
    <div class="header">
      <h2>ACL Management</h2>
    </div>

    <a-tabs v-model:activeKey="activeTab" type="line">
      <!-- Tab 1: ACCOUNT INFO -->
      <a-tab-pane key="account" tab="ACCOUNT INFO">
        <div class="acl-header" style="margin-bottom: 16px;">
          <div style="display: flex; align-items: center; width: 100%;">
            <span style="font-weight: bold; margin-right: 12px;">Access Key:</span>
            <a-input v-model:value="filterAccessKey" style="width: 300px; margin-right: auto;" placeholder="输入Access Key筛选" />
            <a-button type="primary" style="background: #26b99a; border-color: #26b99a;" @click="showCreateDialog = true">新增</a-button>
          </div>
        </div>
        <a-table
          :dataSource="filteredAccounts"
          :columns="columns"
          :rowKey="record => record.accessKey"
          :pagination="false"
          style="margin-top: 24px;"
        >
          <template #emptyText>
            <div style="text-align: center; color: #999;">不存在</div>
          </template>
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'admin'">
              {{ record.admin ? '是' : '否' }}
            </template>
            <template v-if="column.key === 'topicPerms'">
              <a @click="showTopicPerms(record)">详情</a>
            </template>
            <template v-if="column.key === 'groupPerms'">
              <a @click="showGroupPerms(record)">详情</a>
            </template>
            <template v-if="column.key === 'action'">
              <a @click="openEditDialog(record)">编辑</a>
              <a-divider type="vertical" />
              <a @click="deleteAccount(record.accessKey)">删除</a>
            </template>
          </template>
        </a-table>
      </a-tab-pane>

      <!-- Tab 2: GLOBAL WHITE LIST -->
      <a-tab-pane key="white" tab="GLOBAL WHITE LIST">
        <div style="margin-bottom: 16px;">
          <a-button type="primary" style="background: #26b99a; border-color: #26b99a; margin-right: 8px;">新增</a-button>
          <a-button type="primary" danger>同步</a-button>
        </div>
        <a-table
          :dataSource="whiteList"
          :columns="whiteListColumns"
          :pagination="false"
          style="margin-top: 24px;"
          rowKey="address"
        >
          <template #emptyText>
            <div style="text-align: center; color: #999;">不存在</div>
          </template>
        </a-table>
      </a-tab-pane>
    </a-tabs>

    <!-- Create Account Dialog -->
    <a-modal
      v-model:visible="showCreateDialog"
      title="新增"
      :width="700"
      :footer="null"
      @cancel="showCreateDialog = false"
    >
      <a-form
        :model="newAccount"
        layout="vertical"
        style="margin-top: 24px;"
      >
        <a-form-item label="Access Key:" required>
          <a-input v-model:value="newAccount.accessKey" placeholder="请输入 Access Key" />
        </a-form-item>
        <a-form-item label="Secret Key:" required>
          <a-input v-model:value="newAccount.secretKey" placeholder="请输入 Secret Key" />
        </a-form-item>
        <a-form-item label="是否管理员:">
          <a-switch v-model:checked="newAccount.admin" />
        </a-form-item>
        <a-form-item label="topic默认权限:">
          <a-select v-model:value="newAccount.defaultTopicPerm" style="width: 100%">
            <a-select-option value="DENY">DENY</a-select-option>
            <a-select-option value="PUB">PUB</a-select-option>
            <a-select-option value="SUB">SUB</a-select-option>
            <a-select-option value="PUB|SUB">PUB|SUB</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="消费组默认权限:">
          <a-select v-model:value="newAccount.defaultGroupPerm" style="width: 100%">
            <a-select-option value="DENY">DENY</a-select-option>
            <a-select-option value="PUB">PUB</a-select-option>
            <a-select-option value="SUB">SUB</a-select-option>
            <a-select-option value="PUB|SUB">PUB|SUB</a-select-option>
          </a-select>
        </a-form-item>
        <div style="text-align: right; margin-top: 32px;">
          <a-button style="margin-right: 8px;" @click="showCreateDialog = false">关闭</a-button>
          <a-button type="primary" @click="handleCreateAccount">提交</a-button>
        </div>
      </a-form>
    </a-modal>

    <div class="accounts">
      <div v-for="account in config.accounts" :key="account.accessKey" class="account-card">
        <div class="account-header">
          <h5>{{ account.accessKey }}</h5>
          <div class="account-actions">
            <button class="btn btn-sm btn-primary" @click="openEditPermissions(account.accessKey)">
              Edit Permissions
            </button>
            <button class="btn btn-sm btn-danger" @click="handleDeleteAccount(account.accessKey)">
                    Delete
            </button>
          </div>
        </div>

        <div class="account-info">
          <div class="info-item">
            <label>Admin:</label>
            <span>{{ account.admin ? 'Yes' : 'No' }}</span>
          </div>
          <div class="info-item">
            <label>White Remote Address:</label>
            <span>{{ account.whiteRemoteAddress || '-' }}</span>
          </div>
          <div class="info-item">
            <label>Default Topic Permission:</label>
            <span>{{ account.defaultTopicPerm }}</span>
          </div>
          <div class="info-item">
            <label>Default Group Permission:</label>
            <span>{{ account.defaultGroupPerm }}</span>
          </div>
          <div class="info-item">
            <label>Last Updated:</label>
            <span>{{ new Date(account.updateTime).toLocaleString() }}</span>
          </div>
        </div>

        <div class="permissions">
          <div class="permission-section">
            <h6>Topic Permissions</h6>
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Permission</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(perm, topic) in account.topicPerms" :key="topic">
                  <td>{{ topic }}</td>
                  <td>{{ perm }}</td>
                  <td>
                    <button
                      class="btn btn-sm btn-danger"
                      @click="handleDeletePermission(account.accessKey, 'TOPIC', topic)"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="permission-section">
            <h6>Group Permissions</h6>
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Permission</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(perm, group) in account.groupPerms" :key="group">
                  <td>{{ group }}</td>
                  <td>{{ perm }}</td>
                  <td>
                    <button
                      class="btn btn-sm btn-danger"
                      @click="handleDeletePermission(account.accessKey, 'GROUP', group)"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Account Dialog -->
    <div v-if="showAddAccountDialog" class="modal">
      <div class="modal-content">
        <h4>Add New Account</h4>
        <form @submit.prevent="handleAddAccount">
          <div class="form-group">
            <label>Access Key:</label>
            <input v-model="accountForm.accessKey" type="text" class="form-control" required />
          </div>

          <div class="form-group">
            <label>Secret Key:</label>
            <input v-model="accountForm.secretKey" type="text" class="form-control" required />
          </div>

          <div class="form-group">
            <label>White Remote Address:</label>
            <input v-model="accountForm.whiteRemoteAddress" type="text" class="form-control" />
          </div>

          <div class="form-group">
            <label>
              <input v-model="accountForm.admin" type="checkbox" />
              Admin Account
            </label>
          </div>

          <div class="form-group">
            <label>Default Topic Permission:</label>
            <select v-model="accountForm.defaultTopicPerm" class="form-control">
              <option value="DENY">DENY</option>
              <option value="PUB">PUB</option>
              <option value="SUB">SUB</option>
              <option value="PUB|SUB">PUB|SUB</option>
            </select>
          </div>

          <div class="form-group">
            <label>Default Group Permission:</label>
            <select v-model="accountForm.defaultGroupPerm" class="form-control">
              <option value="DENY">DENY</option>
              <option value="PUB">PUB</option>
              <option value="SUB">SUB</option>
              <option value="PUB|SUB">PUB|SUB</option>
            </select>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="showAddAccountDialog = false">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">Add Account</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Permissions Dialog -->
    <div v-if="showEditPermDialog" class="modal">
      <div class="modal-content">
        <h4>Add Permission</h4>
        <form @submit.prevent="handleAddPermission">
          <div class="form-group">
            <label>Type:</label>
            <select v-model="permissionForm.type" class="form-control">
              <option value="TOPIC">Topic</option>
              <option value="GROUP">Group</option>
            </select>
          </div>

          <div class="form-group">
            <label>{{ permissionForm.type === 'TOPIC' ? 'Topic' : 'Group' }}:</label>
            <input v-model="permissionForm.resource" type="text" class="form-control" required />
          </div>

          <div class="form-group">
            <label>Permission:</label>
            <select v-model="permissionForm.perm" class="form-control">
              <option value="DENY">DENY</option>
              <option value="PUB">PUB</option>
              <option value="SUB">SUB</option>
              <option value="PUB|SUB">PUB|SUB</option>
            </select>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="showEditPermDialog = false">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">Add Permission</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.acl-page {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
}

.white-addresses {
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.address-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.address-tag {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.9em;
}

.accounts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(600px, 1fr));
  gap: 20px;
}

.account-card {
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.account-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.account-header h5 {
  margin: 0;
  font-weight: 600;
}

.account-actions {
  display: flex;
  gap: 10px;
}

.account-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-item label {
  font-weight: 500;
  color: #666;
}

.permissions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.permission-section h6 {
  margin-bottom: 10px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 4px;
  padding: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h4 {
  margin-top: 0;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.table {
  font-size: 0.9em;
}

.table th {
  background: #f8f9fa;
}

.acl-header {
  margin-bottom: 16px;
}
</style> 