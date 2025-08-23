<template>
  <div class="queue-monitor">
    <!-- Collapsed View (Default) -->
    <div 
      v-if="!expanded" 
      class="monitor-collapsed flex items-center gap-3 px-3 py-2 bg-surface-50 dark:bg-surface-800 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
      @click="expanded = true"
    >
      <div class="flex items-center gap-2">
        <i class="pi pi-server text-sm" :class="statusIconClass"></i>
        <span class="text-sm font-medium">Queue Status</span>
      </div>
      
      <div class="flex items-center gap-4 text-xs">
        <div v-if="queueData?.summary?.pending_jobs > 0" class="flex items-center gap-1">
          <i class="pi pi-clock text-orange-500"></i>
          <span>{{ queueData.summary.pending_jobs }} pending</span>
        </div>
        
        <div v-if="queueData?.summary?.running_audits > 0" class="flex items-center gap-1">
          <i class="pi pi-spin pi-spinner text-blue-500"></i>
          <span>{{ queueData.summary.running_audits }} running</span>
        </div>
        
        <div v-if="queueData?.summary?.failed_jobs > 0" class="flex items-center gap-1">
          <i class="pi pi-exclamation-triangle text-red-500"></i>
          <span>{{ queueData.summary.failed_jobs }} failed</span>
        </div>
        
        <div v-if="isIdle" class="flex items-center gap-1 text-surface-500">
          <i class="pi pi-check-circle text-green-500"></i>
          <span>Idle</span>
        </div>
      </div>
      
      <i class="pi pi-chevron-down ml-auto text-surface-400"></i>
    </div>

    <!-- Expanded View -->
    <div 
      v-else 
      class="monitor-expanded bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg p-4"
    >
      <!-- Header -->
      <div class="flex justify-between items-center mb-4">
        <div class="flex items-center gap-2">
          <i class="pi pi-server" :class="statusIconClass"></i>
          <h4 class="font-semibold">Queue Monitor</h4>
          <Tag v-if="connectionStatus === 'connected'" value="Live" severity="success" class="text-xs" />
          <Tag v-else-if="connectionStatus === 'connecting'" value="Connecting..." severity="warning" class="text-xs" />
          <Tag v-else value="Disconnected" severity="danger" class="text-xs" />
        </div>
        <Button 
          icon="pi pi-times" 
          class="p-button-text p-button-sm p-button-rounded" 
          @click="expanded = false"
        />
      </div>

      <!-- Summary Stats -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <div class="stat-card bg-surface-50 dark:bg-surface-800 p-2 rounded">
          <div class="text-xs text-surface-600 dark:text-surface-400 mb-1">Pending</div>
          <div class="text-lg font-semibold">{{ queueData?.summary?.pending_jobs || 0 }}</div>
        </div>
        <div class="stat-card bg-surface-50 dark:bg-surface-800 p-2 rounded">
          <div class="text-xs text-surface-600 dark:text-surface-400 mb-1">Running</div>
          <div class="text-lg font-semibold text-blue-500">{{ queueData?.summary?.running_audits || 0 }}</div>
        </div>
        <div class="stat-card bg-surface-50 dark:bg-surface-800 p-2 rounded">
          <div class="text-xs text-surface-600 dark:text-surface-400 mb-1">Failed</div>
          <div class="text-lg font-semibold" :class="{'text-red-500': queueData?.summary?.failed_jobs > 0}">
            {{ queueData?.summary?.failed_jobs || 0 }}
          </div>
        </div>
        <div class="stat-card bg-surface-50 dark:bg-surface-800 p-2 rounded">
          <div class="text-xs text-surface-600 dark:text-surface-400 mb-1">Workers</div>
          <div class="text-lg font-semibold">{{ queueData?.summary?.active_workers || 0 }}</div>
        </div>
        <div class="stat-card bg-surface-50 dark:bg-surface-800 p-2 rounded">
          <div class="text-xs text-surface-600 dark:text-surface-400 mb-1">Rate</div>
          <div class="text-sm font-semibold">{{ queueData?.summary?.processing_rate || '0/min' }}</div>
        </div>
      </div>

      <!-- Running Audits -->
      <div v-if="queueData?.running_audits?.length > 0" class="mb-4">
        <h5 class="text-sm font-semibold mb-2 text-surface-700 dark:text-surface-300">Running Audits</h5>
        <div class="space-y-2 max-h-32 overflow-y-auto">
          <div 
            v-for="audit in queueData.running_audits" 
            :key="audit.id"
            class="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-xs"
          >
            <div class="flex items-center gap-2">
              <i class="pi pi-spin pi-spinner text-blue-500"></i>
              <span class="font-medium">{{ audit.job_type }}</span>
              <span class="text-surface-600 dark:text-surface-400">Customer {{ audit.customer_id }}</span>
            </div>
            <div class="flex items-center gap-2">
              <ProgressBar 
                :value="audit.progress" 
                :showValue="false"
                class="w-20 h-2"
              />
              <span class="text-surface-500">{{ audit.progress }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pending Jobs -->
      <div v-if="queueData?.pending_jobs?.length > 0" class="mb-4">
        <h5 class="text-sm font-semibold mb-2 text-surface-700 dark:text-surface-300">Pending Jobs</h5>
        <div class="space-y-1 max-h-24 overflow-y-auto">
          <div 
            v-for="job in queueData.pending_jobs.slice(0, 5)" 
            :key="job.id"
            class="flex items-center justify-between bg-orange-50 dark:bg-orange-900/20 p-2 rounded text-xs"
          >
            <div class="flex items-center gap-2">
              <i class="pi pi-clock text-orange-500"></i>
              <span class="font-medium">{{ job.display_name }}</span>
            </div>
            <span class="text-surface-500">{{ formatWaitTime(job.wait_time) }}</span>
          </div>
          <div v-if="queueData.pending_jobs.length > 5" class="text-xs text-surface-500 text-center">
            +{{ queueData.pending_jobs.length - 5 }} more pending
          </div>
        </div>
      </div>

      <!-- Alerts -->
      <div v-if="queueData?.alerts?.length > 0">
        <h5 class="text-sm font-semibold mb-2 text-surface-700 dark:text-surface-300">Alerts</h5>
        <div class="space-y-1">
          <div 
            v-for="(alert, index) in queueData.alerts" 
            :key="index"
            class="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 p-2 rounded text-xs"
          >
            <i class="pi pi-exclamation-triangle text-red-500 mt-0.5"></i>
            <span>{{ alert }}</span>
          </div>
        </div>
      </div>

      <!-- Last Update -->
      <div class="text-xs text-surface-400 mt-3 text-right">
        Last update: {{ lastUpdateTime }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

// State
const expanded = ref(false);
const queueData = ref(null);
const connectionStatus = ref('disconnected');
const lastUpdate = ref(null);
const eventSource = ref(null);
const reconnectAttempts = ref(0);
const maxReconnectAttempts = 10;
const reconnectDelay = 5000; // 5 seconds

// Computed
const isIdle = computed(() => {
  if (!queueData.value?.summary) return true;
  const summary = queueData.value.summary;
  return summary.pending_jobs === 0 && 
         summary.running_audits === 0 && 
         summary.failed_jobs === 0;
});

const statusIconClass = computed(() => {
  if (connectionStatus.value !== 'connected') {
    return 'text-surface-400';
  }
  if (queueData.value?.summary?.failed_jobs > 0) {
    return 'text-red-500';
  }
  if (queueData.value?.summary?.running_audits > 0) {
    return 'text-blue-500';
  }
  if (queueData.value?.summary?.pending_jobs > 0) {
    return 'text-orange-500';
  }
  return 'text-green-500';
});

const lastUpdateTime = computed(() => {
  if (!lastUpdate.value) return 'Never';
  const now = new Date();
  const diff = Math.floor((now - lastUpdate.value) / 1000);
  if (diff < 5) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
});

// Methods
const connectToSSE = () => {
  if (eventSource.value) {
    eventSource.value.close();
  }

  connectionStatus.value = 'connecting';
  
  // Get the API base URL from environment or use default
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  const sseUrl = `${apiBase}/queue-monitor/stream`;
  
  console.log('Connecting to Queue Monitor SSE:', sseUrl);
  
  eventSource.value = new EventSource(sseUrl);
  
  eventSource.value.onopen = () => {
    console.log('Queue Monitor SSE connected');
    connectionStatus.value = 'connected';
    reconnectAttempts.value = 0;
  };
  
  eventSource.value.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      queueData.value = data;
      lastUpdate.value = new Date();
      
      // Check for critical alerts
      if (data.alerts && data.alerts.length > 0) {
        data.alerts.forEach(alert => {
          if (alert.includes('high failure rate') || alert.includes('no workers')) {
            toast.add({
              severity: 'warn',
              summary: 'Queue Alert',
              detail: alert,
              life: 5000
            });
          }
        });
      }
    } catch (error) {
      console.error('Failed to parse SSE data:', error);
    }
  };
  
  eventSource.value.onerror = (error) => {
    console.error('Queue Monitor SSE error:', error);
    connectionStatus.value = 'disconnected';
    eventSource.value.close();
    eventSource.value = null;
    
    // Attempt reconnection with exponential backoff
    if (reconnectAttempts.value < maxReconnectAttempts) {
      reconnectAttempts.value++;
      const delay = Math.min(reconnectDelay * Math.pow(1.5, reconnectAttempts.value - 1), 30000);
      console.log(`Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts.value}/${maxReconnectAttempts})`);
      setTimeout(connectToSSE, delay);
    }
  };
};

const formatWaitTime = (seconds) => {
  if (!seconds) return '0s';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
};

// Lifecycle
onMounted(() => {
  connectToSSE();
});

onUnmounted(() => {
  if (eventSource.value) {
    console.log('Closing Queue Monitor SSE connection');
    eventSource.value.close();
    eventSource.value = null;
  }
});

// Auto-collapse when idle
watch(isIdle, (newVal) => {
  if (newVal && expanded.value) {
    // Auto-collapse after 10 seconds of being idle
    setTimeout(() => {
      if (isIdle.value) {
        expanded.value = false;
      }
    }, 10000);
  }
});
</script>

<style scoped>
.queue-monitor {
  position: relative;
  z-index: 10;
}

.monitor-collapsed {
  max-width: fit-content;
}

.monitor-expanded {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 400px;
  max-width: 500px;
  max-height: 600px;
  overflow-y: auto;
}

.stat-card {
  text-align: center;
}

:deep(.p-progressbar) {
  height: 0.5rem;
  background: var(--surface-200);
}

:deep(.p-progressbar-value) {
  background: var(--blue-500);
}

@media (max-width: 768px) {
  .monitor-expanded {
    position: fixed;
    top: 60px;
    right: 10px;
    left: 10px;
    min-width: unset;
    max-width: unset;
  }
}
</style>