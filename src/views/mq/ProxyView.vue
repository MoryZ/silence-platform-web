<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import type { ProxyNode, ProxyConfig, ProxyStats, ProxyConnection } from '@/types/mq/proxy'

// State
const loading = ref(false)
const proxyNodes = ref<ProxyNode[]>([])
const proxyStats = ref<ProxyStats[]>([])
const selectedProxy = ref('')
const showConfigDialog = ref(false)
const showConnectionsDialog = ref(false)

const proxyConfig = ref<ProxyConfig>({
  proxyName: '',
  listenPort: 8081,
  virtualHost: '/',
  accessLog: true,
  mqMode: 'CLUSTER',
  threadPoolSize: 32,
  maxConns: 10000,
  connectTimeout: 3000,
  socketTimeout: 5000,
  heartbeatInterval: 30000,
  heartbeatTimeout: 90000
})

const connections = ref<ProxyConnection[]>([])
const refreshInterval = ref(30) // seconds
let timer: number | undefined

const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)

// Methods
const loadProxyNodes = async () => {
  loading.value = true
  try {
    const response = await fetch('/proxy/list.query')
    const data = await response.json()
    if (data.status === 0) {
      proxyNodes.value = data.data
      totalItems.value = data.data.length
    } else {
      message.error('Error loading proxy nodes: ' + data.errMsg)
    }
  } catch (error: any) {
    message.error('Error loading proxy nodes: ' + (error?.message || error))
  } finally {
    loading.value = false
  }
}

const loadProxyStats = async () => {
  loading.value = true
  try {
    const response = await fetch('/proxy/stats.query')
    const data = await response.json()
    if (data.status === 0) {
      proxyStats.value = data.data
      totalItems.value = data.data.length
    } else {
      message.error('Error loading proxy stats: ' + data.errMsg)
    }
  } catch (error: any) {
    message.error('Error loading proxy stats: ' + (error?.message || error))
  } finally {
    loading.value = false
  }
}

const loadProxyConfig = async (proxyAddr: string) => {
  try {
    const response = await fetch(`/proxy/config.query?proxyAddr=${proxyAddr}`)
    const data = await response.json()
    if (data.status === 0) {
      proxyConfig.value = data.data
      showConfigDialog.value = true
    } else {
      message.error('Error loading proxy config: ' + data.errMsg)
    }
  } catch (error: any) {
    message.error('Error loading proxy config: ' + (error?.message || error))
  }
}

const loadConnections = async (proxyAddr: string) => {
  try {
    const response = await fetch(`/proxy/connections.query?proxyAddr=${proxyAddr}`)
    const data = await response.json()
    if (data.status === 0) {
      connections.value = data.data
      showConnectionsDialog.value = true
    } else {
      message.error('Error loading connections: ' + data.errMsg)
    }
  } catch (error: any) {
    message.error('Error loading connections: ' + (error?.message || error))
  }
}

const updateProxyConfig = async () => {
  try {
    const response = await fetch('/proxy/config.update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(proxyConfig.value)
    })
    const data = await response.json()
    if (data.status === 0) {
      showConfigDialog.value = false
      await loadProxyNodes()
    } else {
      message.error('Error updating proxy config: ' + data.errMsg)
    }
  } catch (error: any) {
    message.error('Error updating proxy config: ' + (error?.message || error))
  }
}

const refreshData = async () => {
  await Promise.all([loadProxyNodes(), loadProxyStats()])
}

const startAutoRefresh = () => {
  stopAutoRefresh()
  if (refreshInterval.value > 0) {
    timer = window.setInterval(refreshData, refreshInterval.value * 1000)
  }
}

const stopAutoRefresh = () => {
  if (timer) {
    clearInterval(timer)
    timer = undefined
  }
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat().format(num)
}

const formatTps = (tps: number) => {
  return `${tps.toFixed(2)}/s`
}

const formatLatency = (latency: number) => {
  return `${latency.toFixed(2)}ms`
}

const formatPercent = (value: number) => {
  return `${(value * 100).toFixed(1)}%`
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString()
}

const getStatusClass = (status: string) => {
  return status === 'ONLINE' ? 'text-success' : 'text-danger'
}

onMounted(() => {
  refreshData()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<template>
  <div class="proxy-page">
    <a-card class="header-card" v-loading="loading">
      <template #header>
        <div class="header">
          <h2>Proxy Management</h2>
          <div class="refresh-control">
            <a-select v-model="refreshInterval" placeholder="Select Refresh Interval" @change="startAutoRefresh">
              <a-option :value="0" label="Manual Refresh" />
              <a-option :value="10" label="Refresh every 10s" />
              <a-option :value="30" label="Refresh every 30s" />
              <a-option :value="60" label="Refresh every 1m" />
            </a-select>
            <a-button type="primary" @click="refreshData">
              Refresh Now
            </a-button>
          </div>
        </div>
      </template>
    </a-card>

    <a-card class="data-section" v-loading="loading">
      <template #header>
        <h4>Proxy Nodes</h4>
      </template>
      <a-table :data="proxyNodes" border stripe :default-sort="{prop: 'proxyName', order: 'ascending'}">
        <a-table-column label="Name" prop="proxyName" sortable />
        <a-table-column label="Address" prop="proxyAddr" sortable />
        <a-table-column label="Version" prop="version" sortable />
        <a-table-column label="Status" :class-name="getStatusClass" />
        <a-table-column label="Start Time" :formatter="formatDate" />
        <a-table-column label="Last Update" :formatter="formatDate" />
        <a-table-column label="Actions">
          <template #default="{ row }">
            <a-button type="primary" size="small" @click="loadProxyConfig(row.proxyAddr)">
              Config
            </a-button>
            <a-button type="info" size="small" @click="loadConnections(row.proxyAddr)">
              Connections
            </a-button>
          </template>
        </a-table-column>
      </a-table>
      <a-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="totalItems"
        layout="total, prev, pager, next"
        @current-change="refreshData"
      />
    </a-card>

    <a-card class="data-section" v-loading="loading">
      <template #header>
        <h4>Performance Statistics</h4>
      </template>
      <a-table :data="proxyStats" border stripe :default-sort="{prop: 'proxyAddr', order: 'ascending'}">
        <a-table-column label="Proxy" prop="proxyAddr" sortable />
        <a-table-column label="Connections" prop="connections" sortable />
        <a-table-column label="TPS" :formatter="formatTps" sortable />
        <a-table-column label="Requests" :formatter="formatNumber" sortable />
        <a-table-column label="Failures" :formatter="formatNumber" sortable />
        <a-table-column label="Avg Latency" :formatter="formatLatency" sortable />
        <a-table-column label="Max Latency" :formatter="formatLatency" sortable />
        <a-table-column label="CPU Usage" :formatter="formatPercent" sortable />
        <a-table-column label="Memory Usage" :formatter="formatPercent" sortable />
        <a-table-column label="Threads" prop="threadCount" sortable />
      </a-table>
      <a-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="totalItems"
        layout="total, prev, pager, next"
        @current-change="refreshData"
      />
    </a-card>

    <!-- Config Dialog -->
    <a-dialog v-model="showConfigDialog" title="Proxy Configuration">
      <a-form @submit.prevent="updateProxyConfig">
        <a-form-item label="Proxy Name">
          <a-input v-model="proxyConfig.proxyName" required />
        </a-form-item>
        <a-form-item label="Listen Port">
          <a-input-number v-model="proxyConfig.listenPort" required />
        </a-form-item>
        <a-form-item label="Virtual Host">
          <a-input v-model="proxyConfig.virtualHost" required />
        </a-form-item>
        <a-form-item label="Enable Access Log">
          <a-switch v-model="proxyConfig.accessLog" />
        </a-form-item>
        <a-form-item label="MQ Mode">
          <a-select v-model="proxyConfig.mqMode">
            <a-option value="CLUSTER" label="Cluster" />
            <a-option value="BROADCAST" label="Broadcast" />
          </a-select>
        </a-form-item>
        <a-form-item label="Thread Pool Size">
          <a-input-number v-model="proxyConfig.threadPoolSize" required />
        </a-form-item>
        <a-form-item label="Max Connections">
          <a-input-number v-model="proxyConfig.maxConns" required />
        </a-form-item>
        <a-form-item label="Connect Timeout (ms)">
          <a-input-number v-model="proxyConfig.connectTimeout" required />
        </a-form-item>
        <a-form-item label="Socket Timeout (ms)">
          <a-input-number v-model="proxyConfig.socketTimeout" required />
        </a-form-item>
        <a-form-item label="Heartbeat Interval (ms)">
          <a-input-number v-model="proxyConfig.heartbeatInterval" required />
        </a-form-item>
        <a-form-item label="Heartbeat Timeout (ms)">
          <a-input-number v-model="proxyConfig.heartbeatTimeout" required />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="updateProxyConfig">Save Changes</a-button>
          <a-button @click="showConfigDialog = false">Cancel</a-button>
        </a-form-item>
      </a-form>
    </a-dialog>

    <!-- Connections Dialog -->
    <a-dialog v-model="showConnectionsDialog" title="Client Connections">
      <a-table :data="connections" border stripe>
        <a-table-column label="Client ID" prop="clientId" />
        <a-table-column label="Address" prop="clientAddr" />
        <a-table-column label="Language" prop="language" />
        <a-table-column label="Version" prop="version" />
        <a-table-column label="Connect Time" :formatter="formatDate" />
        <a-table-column label="Last Heartbeat" :formatter="formatDate" />
        <a-table-column label="Requests" :formatter="formatNumber" />
      </a-table>
      <span slot="footer" class="dialog-footer">
        <a-button @click="showConnectionsDialog = false">Close</a-button>
      </span>
    </a-dialog>
  </div>
</template>

<style scoped>
.proxy-page {
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

.refresh-control {
  display: flex;
  gap: 10px;
  align-items: center;
}

.data-section {
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow-x: auto;
}

.section-header {
  padding: 15px 20px;
  border-bottom: 1px solid #dee2e6;
}

.section-header h4 {
  margin: 0;
  color: #333;
}

.table {
  margin: 0;
}

.table th {
  background: #f8f9fa;
  white-space: nowrap;
}

.table td {
  white-space: nowrap;
}

.text-success {
  color: #28a745;
}

.text-danger {
  color: #dc3545;
}
</style> 