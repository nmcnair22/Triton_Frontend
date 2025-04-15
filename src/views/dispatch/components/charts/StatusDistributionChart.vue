<template>
  <div class="h-full">
    <div v-if="loading" class="flex flex-column gap-2 h-full justify-content-center">
      <div v-for="i in 3" :key="i" class="w-full">
        <Skeleton height="6rem" />
      </div>
    </div>
    <div v-else-if="!statusData || statusData.length === 0" class="flex flex-column h-full justify-content-center align-items-center">
      <i class="pi pi-chart-pie text-5xl text-surface-300 mb-3"></i>
      <p class="m-0 text-surface-600 dark:text-surface-400">No status data available for this time period</p>
    </div>
    <div v-else>
      <div class="flex justify-content-center mb-4">
        <div class="text-center">
          <div class="text-4xl font-bold text-surface-900 dark:text-surface-0">{{ totalCount }}</div>
          <div class="text-sm text-surface-500 dark:text-surface-400">Total Dispatches</div>
        </div>
      </div>
      
      <Chart id="status-distribution-chart" type="doughnut" :data="chartData" :options="chartOptions" class="max-h-18rem" />
      
      <div class="grid mt-4">
        <div v-for="(status, index) in statusData" :key="status.status" class="col-6 p-2">
          <div class="flex align-items-center">
            <div class="w-1rem h-1rem mr-2 rounded" :style="{ backgroundColor: getStatusColor(status.status, index) }"></div>
            <div class="flex-grow text-sm text-surface-700 dark:text-surface-300">{{ status.status }}</div>
            <div class="text-sm font-semibold text-surface-900 dark:text-surface-0">{{ Math.round((status.count / totalCount) * 100) }}%</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useDispatchStore } from '@/stores/dispatchStore';
import Chart from 'primevue/chart';
import Skeleton from 'primevue/skeleton';

const props = defineProps({
  loadingKey: {
    type: String,
    default: 'resultCodes'
  }
});

// Store
const dispatchStore = useDispatchStore();

// Function to adjust color brightness
function adjustColorBrightness(hex, percent) {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
    return hex;
  }
  
  // Convert hex to RGB
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  // Adjust brightness
  r = Math.max(0, Math.min(255, r + Math.floor(r * percent / 100)));
  g = Math.max(0, Math.min(255, g + Math.floor(g * percent / 100)));
  b = Math.max(0, Math.min(255, b + Math.floor(b * percent / 100)));

  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Chart colors
const statusColors = {
  'Completed': '#22C55E',  // green-500
  'In Progress': '#3B82F6', // blue-500
  'Scheduled': '#F59E0B',   // amber-500
  'Cancelled': '#EF4444',   // red-500
  'On Hold': '#8B5CF6',     // violet-500
  'Pending': '#EC4899',     // pink-500
  'Delayed': '#F97316',     // orange-500
  'Rejected': '#9F1239',    // rose-800
  'Other': '#6B7280'        // gray-500
};

// Default color list for fallback
const chartColors = Object.values(statusColors);

// Helper function to get status color
function getStatusColor(status, index) {
  return statusColors[status] || statusColors['Other'] || chartColors[index % chartColors.length];
}

// Computed properties
const loading = computed(() => {
  return dispatchStore.loading[props.loadingKey];
});

const statusData = computed(() => {
  return dispatchStore.resultCodes || [];
});

const totalCount = computed(() => {
  return statusData.value.reduce((sum, item) => sum + item.count, 0);
});

// Chart data
const chartData = computed(() => {
  if (!statusData.value || statusData.value.length === 0) return null;
  
  const labels = statusData.value.map(item => item.status);
  const data = statusData.value.map(item => item.count);
  const backgroundColor = statusData.value.map((item, index) => 
    getStatusColor(item.status, index)
  );
  
  const hoverBackgroundColor = backgroundColor.map(color => 
    adjustColorBrightness(color, -10)
  );
  
  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor,
        hoverBackgroundColor,
        borderWidth: 0
      }
    ]
  };
});

// Chart options
const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const label = context.label || '';
          const value = context.raw || 0;
          const percentage = Math.round((value / totalCount.value) * 100);
          return `${label}: ${value} (${percentage}%)`;
        }
      }
    }
  },
  cutout: '60%'
});
</script>

<style scoped>
/* The skeleton loader styling is handled by PrimeVue and Tailwind classes */
</style> 