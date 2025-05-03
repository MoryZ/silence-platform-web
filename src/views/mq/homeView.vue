<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { queryClusterList } from '@/api/mq/cluster'

const clusterInfo = ref('')

onMounted(async () => {
  try {
      const response = await queryClusterList()
      clusterInfo.value = response
  } catch (error) {
    console.error('Error fetching cluster info:', error)
  }
})
</script>

<template>
  <main>
    <h1>RocketMQ Web Console</h1>
    <div class="cluster-info">
      <h2>Cluster Information</h2>
      <pre>{{ clusterInfo }}</pre>
    </div>
  </main>
</template>

<style scoped>
main {
  padding: 2rem;
}

.cluster-info {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 4px;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: #fff;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #ddd;
}
</style> 