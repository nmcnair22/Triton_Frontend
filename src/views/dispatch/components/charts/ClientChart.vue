<template>
  <div class="h-full">
    <div v-if="loading" class="flex flex-column gap-2 h-full justify-content-center">
      <Skeleton height="20rem" />
    </div>
    <div v-else-if="!clientData || clientData.length === 0" class="flex flex-column h-full justify-content-center align-items-center">
      <i class="pi pi-chart-bar text-5xl text-gray-300 mb-3"></i>
      <p class="m-0 text-gray-600">No client data available for this time period</p>
    </div>
    <div v-else class="client-list">
      <div 
        v-for="(client, index) in clientData" 
        :key="client.id || client.customer_id || index" 
        class="client-item mb-3"
      >
        <div class="flex justify-content-between mb-1">
          <span class="font-medium">{{ truncateText(client.name || client.customer_name, 25) }}</span>
          <span class="font-bold">{{ client.count || client.dispatches_count }} dispatches</span>
        </div>
        <div class="progress-container">
          <div class="progress-bar" :style="{ width: getPercentage(client.count || client.dispatches_count) + '%' }"></div>
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
    default: 'dispatchesByClient'
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
  const clients = dispatchStore.dispatchesByClient || [];
  return clients.slice(0, props.limit);
});

// Calculate maximum count for percentage calculation
const maxCount = computed(() => {
  if (!clientData.value.length) return 0;
  return Math.max(...clientData.value.map(client => client.count || client.dispatches_count || 0));
});

// Helper functions
function getPercentage(value) {
  if (!maxCount.value) return 0;
  return (value / maxCount.value) * 100;
}

function truncateText(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}
</script>

<style scoped>
.client-list {
  height: 100%;
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