<template>
  <div class="client-revenue-chart">
    <div v-if="loading" class="chart-skeleton">
      <Skeleton height="20rem" />
    </div>
    
    <div v-else-if="!clientData || clientData.length === 0" class="flex flex-column justify-content-center align-items-center" style="height: 200px;">
      <i class="pi pi-chart-bar text-5xl text-gray-300 mb-3"></i>
      <p class="m-0 text-gray-600">No client revenue data available</p>
    </div>
    
    <div v-else class="client-list">
      <div 
        v-for="(client, index) in clientData" 
        :key="client.customer_name" 
        class="client-item mb-3"
      >
        <div class="flex justify-content-between mb-1">
          <span class="font-medium">{{ truncateText(client.customer_name, 25) }}</span>
          <span class="font-bold">${{ formatNumber(client.total_charged) }}</span>
        </div>
        <div class="progress-container">
          <div class="progress-bar" :style="{ width: getPercentage(client.total_charged) + '%' }"></div>
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
  loading: {
    type: Boolean,
    default: false
  },
  loadingKey: {
    type: String,
    default: 'topClientsByRevenue'
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
  const clients = dispatchStore.topClientsByRevenue || [];
  return clients.slice(0, props.limit);
});

// Calculate maximum revenue for percentage calculation
const maxRevenue = computed(() => {
  if (!clientData.value.length) return 0;
  return Math.max(...clientData.value.map(client => client.total_charged || 0));
});

// Helper functions
function getPercentage(value) {
  if (!maxRevenue.value) return 0;
  return (value / maxRevenue.value) * 100;
}

function formatNumber(value) {
  if (value === undefined || value === null) return '0.00';
  return value.toLocaleString('en-US', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function truncateText(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}
</script>

<style scoped>
.client-revenue-chart {
  height: 100%;
}

.chart-skeleton {
  min-height: 20rem;
  display: flex;
  justify-content: center;
  align-items: center;
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
  background-color: var(--surface-200);
  border-radius: 5px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: var(--primary-color);
  transition: width 0.5s ease;
}
</style> 