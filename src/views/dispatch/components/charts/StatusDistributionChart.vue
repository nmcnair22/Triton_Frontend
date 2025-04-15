<template>
  <div class="status-chart-container h-full">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center h-full">
      <Skeleton height="16rem" width="100%" class="rounded-md" />
    </div>
    
    <!-- No Data State -->
    <div v-else-if="!hasData" class="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-800 rounded-md">
      <i class="pi pi-chart-pie text-3xl text-gray-400 mb-3"></i>
      <p class="m-0 text-gray-500 dark:text-gray-400 text-sm">No status data available</p>
    </div>
    
    <!-- Chart Content -->
    <div v-else class="h-full flex flex-col">
      <!-- Chart -->
      <div class="chart-area flex-1">
        <Chart type="doughnut" :data="chartData" :options="chartOptions" class="h-full" />
      </div>
      
      <!-- Status Legend -->
      <div class="status-legend grid grid-cols-2 gap-2 mt-3">
        <div 
          v-for="(item, index) in chartData.labels" 
          :key="index"
          class="status-item flex items-center"
        >
          <div class="status-color w-3 h-3 rounded-full mr-2" 
              :style="{ backgroundColor: chartData.datasets[0].backgroundColor[index] }">
          </div>
          <div class="status-name text-xs text-gray-700 dark:text-gray-300">
            {{ item }}: {{ chartData.datasets[0].data[index] }}
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
    default: 'resultCodes'
  }
});

const dispatchStore = useDispatchStore();

// Status colors mapping with modern colors from mockups
const statusColors = {
  'completed': '#10B981', // Green
  'pending': '#F59E0B', // Amber
  'scheduled': '#3B82F6', // Blue
  'cancelled': '#EF4444', // Red
  'canceled': '#EF4444', // Red
  'in progress': '#6366F1', // Indigo
  'in_progress': '#6366F1', // Indigo
  'in transit': '#60A5FA', // Blue-400
  'in_transit': '#60A5FA', // Blue-400
  'on hold': '#F97316', // Orange
  'on_hold': '#F97316', // Orange
  'delayed': '#F59E0B', // Amber
  'approved': '#10B981'  // Green
};

const chartOptions = {
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(30, 41, 59, 0.9)',
      padding: 10,
      cornerRadius: 4,
      bodyFont: {
        size: 12
      },
      titleFont: {
        size: 12,
        weight: 'bold'
      },
      callbacks: {
        label: function(context) {
          const label = context.label || '';
          const value = context.parsed || 0;
          const dataset = context.dataset;
          const total = dataset.data.reduce((a, b) => a + b, 0);
          const percentage = Math.round((value / total) * 100);
          return `${label}: ${value} (${percentage}%)`;
        }
      }
    }
  },
  cutout: '70%',
  responsive: true,
  maintainAspectRatio: false
};

// Computed properties
const loading = computed(() => {
  return props.loading || dispatchStore.loading[props.loadingKey];
});

const statusData = computed(() => {
  return props.data && props.data.length > 0 
    ? props.data 
    : dispatchStore.resultCodes;
});

const hasData = computed(() => {
  return statusData.value && statusData.value.length > 0;
});

const chartData = computed(() => {
  if (!hasData.value) return null;
  
  const labels = [];
  const data = [];
  const backgroundColors = [];
  const hoverBackgroundColors = [];
  
  statusData.value.forEach(item => {
    // Extract the correct properties based on data format
    const status = item.status || item.name || 'Unknown';
    const count = item.count || 0;
    
    if (count > 0) {
      labels.push(status);
      data.push(count);
      
      // Normalize the status key for matching
      const statusLower = status.toLowerCase();
      const statusUnderscored = statusLower.replace(/ /g, '_');
      const statusSpaced = statusUnderscored.replace(/_/g, ' ');
      
      // Try different variants to find a matching color
      const baseColor = 
        statusColors[statusLower] || 
        statusColors[statusUnderscored] || 
        statusColors[statusSpaced] || 
        '#6366F1'; // Default indigo
      
      backgroundColors.push(baseColor);
      hoverBackgroundColors.push(adjustBrightness(baseColor, -10));
    }
  });
  
  return {
    labels: labels,
    datasets: [
      {
        data: data,
        backgroundColor: backgroundColors,
        hoverBackgroundColor: hoverBackgroundColors,
        borderWidth: 0
      }
    ]
  };
});

// Function to adjust brightness of colors
function adjustBrightness(hex, percent) {
  // Clean up hex value if needed
  hex = hex.replace(/^\s*#|\s*$/g, '');
  
  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex.replace(/(.)/g, '$1$1');
  }
  
  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Adjust brightness
  const adjustedR = Math.max(0, Math.min(255, Math.round(r * (1 + percent / 100))));
  const adjustedG = Math.max(0, Math.min(255, Math.round(g * (1 + percent / 100))));
  const adjustedB = Math.max(0, Math.min(255, Math.round(b * (1 + percent / 100))));
  
  // Convert back to hex
  return '#' + 
    ((1 << 24) + (adjustedR << 16) + (adjustedG << 8) + adjustedB)
    .toString(16).slice(1);
}
</script>

<style scoped>
.status-chart-container {
  padding: 0;
  margin: 0;
  width: 100%;
}

.chart-area {
  height: calc(100% - 60px);
  min-height: 160px;
}

.status-legend {
  background-color: rgb(249 250 251); /* bg-gray-50 */
  border-radius: 0.375rem; /* rounded-md */
  padding: 0.5rem; /* p-2 */
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .status-legend {
    background-color: rgb(31 41 55); /* dark:bg-gray-800 */
  }
}
</style> 