<template>
  <div class="card shadow-md rounded-lg overflow-hidden">
    <div class="p-4 flex items-center justify-between bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">Status Distribution</h3>
      <div class="flex space-x-2">
        <Button
          @click="chartType = 'pie'"
          :class="['p-button-sm', chartType === 'pie' ? 'p-button-primary' : 'p-button-outlined']"
          label="Pie"
        />
        <Button
          @click="chartType = 'doughnut'" 
          :class="['p-button-sm', chartType === 'doughnut' ? 'p-button-primary' : 'p-button-outlined']"
          label="Doughnut"
        />
      </div>
    </div>

    <div class="p-4 bg-white dark:bg-gray-800 h-[350px] flex items-center justify-center">
      <div v-if="loading" class="flex flex-col items-center justify-center">
        <ProgressSpinner style="width:50px;height:50px" strokeWidth="4" class="text-blue-500" />
        <div class="mt-3 text-sm text-gray-600 dark:text-gray-400">Loading status data...</div>
      </div>
      
      <div v-else-if="!hasData" class="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <i class="pi pi-chart-pie text-4xl mb-3"></i>
        <p>No status distribution data available</p>
      </div>
      
      <div v-else class="w-full h-full flex flex-col">
        <div class="flex-grow flex items-center justify-center">
          <Chart
            :type="chartType"
            :data="chartData"
            :options="chartOptions"
          />
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div 
            v-for="(status, index) in topStatuses" 
            :key="index"
            class="flex items-center gap-2 p-2 rounded-md"
          >
            <div 
              class="w-3 h-3 rounded-full" 
              :style="`background-color: ${getStatusColor(index)}`"
            ></div>
            <div class="flex flex-col">
              <span class="text-xs font-medium text-gray-900 dark:text-white">{{ status.status }}</span>
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ status.count }} ({{ getPercentage(status.count) }})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useDispatchStore } from '@/stores/dispatchStore';
import Chart from 'primevue/chart';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';

const dispatchStore = useDispatchStore();
const chartType = ref('doughnut');

// Computed properties for loading and error states
const loading = computed(() => dispatchStore.loading.resultCodes);
const error = computed(() => dispatchStore.errors.resultCodes);

// Computed property to check if there's data to display
const hasData = computed(() => {
  return Array.isArray(dispatchStore.resultCodes) && 
         dispatchStore.resultCodes.length > 0;
});

// Fetch data on component mount
onMounted(async () => {
  if (!hasData.value && !loading.value) {
    await dispatchStore.fetchResultCodes();
  }
});

// Watch for filter changes to refresh data
watch(() => [
  dispatchStore.dateRange,
  dispatchStore.selectedCustomerId,
  dispatchStore.selectedProjectName,
  dispatchStore.selectedStatus
], async () => {
  dispatchStore.resultCodes = []; // Reset so it fetches fresh data
  await dispatchStore.fetchResultCodes();
}, { deep: true });

// Get the top statuses for display
const topStatuses = computed(() => {
  if (!hasData.value) return [];
  
  // Sort by count in descending order and take top 8
  const sorted = [...dispatchStore.resultCodes]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  
  return sorted;
});

// Calculate the total count of all statuses
const totalCount = computed(() => {
  if (!hasData.value) return 0;
  return dispatchStore.resultCodes.reduce((sum, item) => sum + item.count, 0);
});

// Get percentage for a status count
const getPercentage = (count) => {
  if (!totalCount.value) return '0%';
  return `${Math.round((count / totalCount.value) * 100)}%`;
};

// Get a color for a status based on index
const getStatusColor = (index) => {
  const colors = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#06B6D4', // cyan-500
    '#F97316'  // orange-500
  ];
  return colors[index % colors.length];
};

// Chart data
const chartData = computed(() => {
  if (!hasData.value) return { labels: [], datasets: [] };
  
  const statuses = topStatuses.value;
  
  return {
    labels: statuses.map(item => item.status),
    datasets: [
      {
        data: statuses.map(item => item.count),
        backgroundColor: statuses.map((_, index) => getStatusColor(index)),
        hoverBackgroundColor: statuses.map((_, index) => getStatusColor(index))
      }
    ]
  };
});

// Chart options
const chartOptions = computed(() => {
  return {
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const percentage = getPercentage(value);
            return `${label}: ${value} (${percentage})`;
          }
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false,
    cutout: chartType.value === 'doughnut' ? '60%' : 0
  };
});
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