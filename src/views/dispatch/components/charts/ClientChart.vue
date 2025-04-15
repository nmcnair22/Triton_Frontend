<template>
  <div class="client-chart">
    <div v-if="loading" class="chart-skeleton">
      <div v-for="i in 3" :key="i" class="w-full mb-3">
        <Skeleton height="2rem" />
      </div>
    </div>
    
    <div v-else-if="!clientData || clientData.length === 0" class="flex flex-column justify-content-center align-items-center" style="height: 200px;">
      <i class="pi pi-chart-bar text-5xl text-surface-300 mb-3"></i>
      <p class="m-0 text-surface-600 dark:text-surface-400">No client data available</p>
    </div>
    
    <div v-else class="client-list">
      <div 
        v-for="(client, index) in clientData" 
        :key="getClientKey(client)" 
        class="client-item mb-3"
      >
        <div class="flex justify-content-between mb-1">
          <span class="font-medium text-surface-900 dark:text-surface-0">{{ getClientName(client) }}</span>
          <span class="font-bold text-surface-900 dark:text-surface-0">{{ getClientCount(client) }}</span>
        </div>
        <div class="progress-container bg-surface-200 dark:bg-surface-700">
          <div class="progress-bar bg-primary-500 dark:bg-primary-400" :style="{ width: getPercentage(client) + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useDispatchStore } from '@/stores/dispatchStore';
import Skeleton from 'primevue/skeleton';

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingKey: {
    type: String,
    default: 'clientData'
  },
  limit: {
    type: Number,
    default: 5
  }
});

// Store
const dispatchStore = useDispatchStore();

// Computed properties
const loading = computed(() => {
  return props.loading || dispatchStore.loading[props.loadingKey];
});

const clientData = computed(() => {
  const clients = props.data?.length > 0 ? props.data : dispatchStore.clientData || [];
  return clients.slice(0, props.limit);
});

// Calculate maximum count for percentage calculation
const maxCount = computed(() => {
  if (!clientData.value.length) return 0;
  
  // Handle data in either format (old or new volume stats)
  if ('dispatch_count' in clientData.value[0]) {
    return Math.max(...clientData.value.map(client => client.dispatch_count || 0));
  } else {
    return Math.max(...clientData.value.map(client => client.count || 0));
  }
});

// Helper functions
function getPercentage(client) {
  if (!maxCount.value) return 0;
  
  // Handle data in either format
  const count = 'dispatch_count' in client ? client.dispatch_count : client.count;
  return (count / maxCount.value) * 100;
}

function getClientName(client) {
  // Handle data in either format
  if ('customer_name' in client) {
    return truncateText(client.customer_name, 25);
  } else {
    return truncateText(client.name, 25);
  }
}

function getClientCount(client) {
  // Handle data in either format
  return 'dispatch_count' in client ? client.dispatch_count : client.count;
}

function getClientKey(client) {
  // Generate unique key for client based on available properties
  if ('customer_name' in client) {
    return `${client.customer_name}-${client.dispatch_count}`;
  } else if ('id' in client) {
    return client.id;
  } else {
    return `${client.name}-${client.count}`;
  }
}

function truncateText(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}
</script>

<style scoped>
.client-chart {
  height: 100%;
}

.chart-skeleton {
  min-height: 8rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.client-list {
  max-height: 100%;
  overflow-y: auto;
}

.client-item {
  margin-bottom: 1rem;
}

.progress-container {
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  transition: width 0.5s ease;
}
</style> 