<template>
  <div class="websocket-tester p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
    <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
      🧪 WebSocket Connection Tester
    </h3>
    
    <!-- Connection Status -->
    <div class="mb-4">
      <div class="flex items-center space-x-2 mb-2">
        <div class="w-3 h-3 rounded-full"
             :class="isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'"></div>
        <span class="font-medium" :class="isConnected ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'">
          {{ isConnected ? 'Connected to TritonV3 WebSocket' : 'Disconnected' }}
        </span>
      </div>
      
      <div v-if="error" class="text-red-600 dark:text-red-400 text-sm">
        Error: {{ error }}
      </div>
    </div>

    <!-- Dashboard Metrics -->
    <div class="mb-4">
      <h4 class="font-medium text-gray-900 dark:text-white mb-2">📊 Dashboard Metrics</h4>
      <div v-if="metrics" class="bg-white dark:bg-gray-700 p-3 rounded border text-sm">
        <pre class="text-gray-800 dark:text-gray-200">{{ JSON.stringify(metrics, null, 2) }}</pre>
      </div>
      <div v-else class="text-gray-500 dark:text-gray-400 text-sm">
        No metrics received yet...
      </div>
    </div>

    <!-- Test Buttons -->
    <div class="space-y-2">
      <h4 class="font-medium text-gray-900 dark:text-white">🎯 Test Events</h4>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
        <button @click="testDashboardMetrics" 
                class="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
          Test Dashboard
        </button>
        <button @click="testJobUpdate" 
                class="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm">
          Test Job Update
        </button>
        <button @click="testVisitCompletion" 
                class="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm">
          Test Visit
        </button>
      </div>
    </div>

    <!-- Event Log -->
    <div class="mt-4">
      <h4 class="font-medium text-gray-900 dark:text-white mb-2">📝 Event Log</h4>
      <div class="bg-black text-green-400 p-3 rounded text-xs font-mono max-h-40 overflow-y-auto">
        <div v-for="(log, index) in eventLog" :key="index" class="mb-1">
          {{ log }}
        </div>
        <div v-if="eventLog.length === 0" class="text-gray-500">
          Waiting for events...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useTritonRealTime } from '../composables/useTritonRealTime'

const tritonRealTime = useTritonRealTime()
const eventLog = ref([])

// Extract reactive values
const isConnected = tritonRealTime.isConnected
const error = tritonRealTime.error
const metrics = tritonRealTime.dashboardMetrics

// Add to event log
const addLog = (message) => {
  const timestamp = new Date().toLocaleTimeString()
  eventLog.value.unshift(`[${timestamp}] ${message}`)
  
  // Keep only last 20 entries
  if (eventLog.value.length > 20) {
    eventLog.value = eventLog.value.slice(0, 20)
  }
}

// Test functions
const testDashboardMetrics = () => {
  addLog('🧪 Testing dashboard metrics...')
  window.open('http://localhost:8000/test-dashboard-metrics', '_blank')
}

const testJobUpdate = () => {
  addLog('🧪 Testing job update...')
  window.open('http://localhost:8000/test-job-update/123', '_blank')
}

const testVisitCompletion = () => {
  addLog('🧪 Testing visit completion...')
  window.open('http://localhost:8000/test-visit-completion/789', '_blank')
}

// Watch for connection changes
onMounted(() => {
  addLog('🚀 WebSocket tester initialized')
  
  // Watch for metrics updates
  const unwatchMetrics = tritonRealTime.dashboardMetrics.value && 
    (() => {
      addLog('📊 Dashboard metrics updated!')
    })
  
  // Watch for connection status
  const unwatchConnection = isConnected.value && 
    (() => {
      addLog(isConnected.value ? '✅ Connected to WebSocket' : '❌ Disconnected from WebSocket')
    })
})
</script> 