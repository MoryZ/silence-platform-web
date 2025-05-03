<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { ProxyNode, ProxyConfig, ProxyStats, ProxyConnection } from '@/types/proxy'

// State
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
  try {
    const response = await fetch('/proxy/list.query')
    const data = await response.json()
    if (data.status === 0) {
      proxyNodes.value = data.data
      totalItems.value = data.data.length
    } else {
      ElMessage.error('Error loading proxy nodes: ' + data.errMsg)
    }
  } catch (error) {
    ElMessage.error('Error loading proxy nodes: ' + error.message)
  }
}

const loadProxyStats = async () => {
  try {
    const response = await fetch('/proxy/stats.query')
    const data = await response.json()
    if (data.status === 0) {
      proxyStats.value = data.data
      totalItems.value = data.data.length
    } else {
      ElMessage.error('Error loading proxy stats: ' + data.errMsg)
    }
  } catch (error) {
    ElMessage.error('Error loading proxy stats: ' + error.message)
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
      ElMessage.error('Error loading proxy config: ' + data.errMsg)
    }
  } catch (error) {
    ElMessage.error('Error loading proxy config: ' + error.message)
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
      ElMessage.error('Error loading connections: ' + data.errMsg)
    }
  } catch (error) {
    ElMessage.error('Error loading connections: ' + error.message)
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
      ElMessage.error('Error updating proxy config: ' + data.errMsg)
    }
  } catch (error) {
    ElMessage.error('Error updating proxy config: ' + error.message)
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
    <el-card class="header-card" v-loading="loading">
      <template #header>
        <div class="header">
          <h2>Proxy Management</h2>
          <div class="refresh-control">
            <el-select v-model="refreshInterval" placeholder="Select Refresh Interval" @change="startAutoRefresh">
              <el-option :value="0" label="Manual Refresh" />
              <el-option :value="10" label="Refresh every 10s" />
              <el-option :value="30" label="Refresh every 30s" />
              <el-option :value="60" label="Refresh every 1m" />
            </el-select>
            <el-button type="primary" @click="refreshData">
              Refresh Now
            </el-button>
          </div>
        </div>
      </template>
    </el-card>

    <el-card class="data-section" v-loading="loading">
      <template #header>
        <h4>Proxy Nodes</h4>
      </template>
      <el-table :data="proxyNodes" border stripe :default-sort="{prop: 'proxyName', order: 'ascending'}">
        <el-table-column label="Name" prop="proxyName" sortable />
        <el-table-column label="Address" prop="proxyAddr" sortable />
        <el-table-column label="Version" prop="version" sortable />
        <el-table-column label="Status" :class-name="getStatusClass" />
        <el-table-column label="Start Time" :formatter="formatDate" />
        <el-table-column label="Last Update" :formatter="formatDate" />
        <el-table-column label="Actions">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="loadProxyConfig(row.proxyAddr)">
              Config
            </el-button>
            <el-button type="info" size="small" @click="loadConnections(row.proxyAddr)">
              Connections
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="totalItems"
        layout="total, prev, pager, next"
        @current-change="refreshData"
      />
    </el-card>

    <el-card class="data-section" v-loading="loading">
      <template #header>
        <h4>Performance Statistics</h4>
      </template>
      <el-table :data="proxyStats" border stripe :default-sort="{prop: 'proxyAddr', order: 'ascending'}">
        <el-table-column label="Proxy" prop="proxyAddr" sortable />
        <el-table-column label="Connections" prop="connections" sortable />
        <el-table-column label="TPS" :formatter="formatTps" sortable />
        <el-table-column label="Requests" :formatter="formatNumber" sortable />
        <el-table-column label="Failures" :formatter="formatNumber" sortable />
        <el-table-column label="Avg Latency" :formatter="formatLatency" sortable />
        <el-table-column label="Max Latency" :formatter="formatLatency" sortable />
        <el-table-column label="CPU Usage" :formatter="formatPercent" sortable />
        <el-table-column label="Memory Usage" :formatter="formatPercent" sortable />
        <el-table-column label="Threads" prop="threadCount" sortable />
      </el-table>
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="totalItems"
        layout="total, prev, pager, next"
        @current-change="refreshData"
      />
    </el-card>

    <!-- Config Dialog -->
    <el-dialog v-model="showConfigDialog" title="Proxy Configuration">
      <el-form @submit.prevent="updateProxyConfig">
        <el-form-item label="Proxy Name">
          <el-input v-model="proxyConfig.proxyName" required />
        </el-form-item>
        <el-form-item label="Listen Port">
          <el-input-number v-model="proxyConfig.listenPort" required />
        </el-form-item>
        <el-form-item label="Virtual Host">
          <el-input v-model="proxyConfig.virtualHost" required />
        </el-form-item>
        <el-form-item label="Enable Access Log">
          <el-switch v-model="proxyConfig.accessLog" />
        </el-form-item>
        <el-form-item label="MQ Mode">
          <el-select v-model="proxyConfig.mqMode">
            <el-option value="CLUSTER" label="Cluster" />
            <el-option value="BROADCAST" label="Broadcast" />
          </el-select>
        </el-form-item>
        <el-form-item label="Thread Pool Size">
          <el-input-number v-model="proxyConfig.threadPoolSize" required />
        </el-form-item>
        <el-form-item label="Max Connections">
          <el-input-number v-model="proxyConfig.maxConns" required />
        </el-form-item>
        <el-form-item label="Connect Timeout (ms)">
          <el-input-number v-model="proxyConfig.connectTimeout" required />
        </el-form-item>
        <el-form-item label="Socket Timeout (ms)">
          <el-input-number v-model="proxyConfig.socketTimeout" required />
        </el-form-item>
        <el-form-item label="Heartbeat Interval (ms)">
          <el-input-number v-model="proxyConfig.heartbeatInterval" required />
        </el-form-item>
        <el-form-item label="Heartbeat Timeout (ms)">
          <el-input-number v-model="proxyConfig.heartbeatTimeout" required />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="updateProxyConfig">Save Changes</el-button>
          <el-button @click="showConfigDialog = false">Cancel</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <!-- Connections Dialog -->
    <el-dialog v-model="showConnectionsDialog" title="Client Connections">
      <el-table :data="connections" border stripe>
        <el-table-column label="Client ID" prop="clientId" />
        <el-table-column label="Address" prop="clientAddr" />
        <el-table-column label="Language" prop="language" />
        <el-table-column label="Version" prop="version" />
        <el-table-column label="Connect Time" :formatter="formatDate" />
        <el-table-column label="Last Heartbeat" :formatter="formatDate" />
        <el-table-column label="Requests" :formatter="formatNumber" />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showConnectionsDialog = false">Close</el-button>
      </span>
    </el-dialog>
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