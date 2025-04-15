<template>
  <div class="dispatch-volume-chart h-full">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center h-full gap-3">
      <Skeleton height="16rem" width="100%" class="rounded-md" />
    </div>
    
    <!-- No Data State -->
    <div v-else-if="!chartData" class="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-800 rounded-md">
      <i class="pi pi-chart-bar text-3xl text-gray-400 mb-3"></i>
      <p class="m-0 text-gray-500 dark:text-gray-400 text-sm">No dispatch volume data available for this period</p>
    </div>
    
    <!-- Chart -->
    <Chart v-else id="dispatch-volume-chart" type="bar" :data="chartData" :options="chartOptions" class="h-full" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
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
    default: 'dispatchVolume'
  }
});

// Store
const dispatchStore = useDispatchStore();

// Chart data
const chartData = ref(null);
const chartOptions = ref(null);

// Colors
const barColor = '#3B82F6'; // Blue from the mockups
const barHoverColor = '#2563EB';

// Computed properties
const isLoading = computed(() => {
  return props.loading || dispatchStore.loading[props.loadingKey];
});

const dispatches = computed(() => {
  return props.data?.length > 0 ? props.data : dispatchStore.dispatchVolume || [];
});

// Process the data when dispatches change
watch(() => dispatches.value, setupChart, { immediate: true });

function setupChart() {
  if (!dispatches.value || dispatches.value.length === 0) {
    chartData.value = null;
    return;
  }
  
  // Check if this is the new format (daily_volume)
  const isNewFormat = dispatches.value[0] && 'dispatch_date' in dispatches.value[0];
  
  let dates = [];
  let counts = [];
  
  if (isNewFormat) {
    // New format from combined endpoint
    dispatches.value.forEach(item => {
      dates.push(formatDate(item.dispatch_date));
      counts.push(item.daily_dispatch_count);
    });
  } else {
    // Original format
    // Group dispatches by date
    const dispatchesByDate = {};
    dispatches.value.forEach(dispatch => {
      const date = dispatch.service_date ? dispatch.service_date.split('T')[0] : 'Unknown';
      if (!dispatchesByDate[date]) {
        dispatchesByDate[date] = 0;
      }
      dispatchesByDate[date]++;
    });
    
    // Sort dates
    const sortedDates = Object.keys(dispatchesByDate).sort();
    
    // Format and prepare data for the chart
    sortedDates.forEach(date => {
      dates.push(formatDate(date));
      counts.push(dispatchesByDate[date]);
    });
  }
  
  // Create chart data
  chartData.value = {
    labels: dates,
    datasets: [
      {
        type: 'bar',
        label: 'Dispatch Count',
        backgroundColor: barColor,
        data: counts,
        borderRadius: 4,
        barThickness: 12,
        maxBarThickness: 18,
        hoverBackgroundColor: barHoverColor
      }
    ]
  };

  chartOptions.value = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        padding: 10,
        cornerRadius: 4,
        callbacks: {
          title: function(context) {
            return context[0].label;
          },
          label: function(context) {
            return `Dispatches: ${context.raw}`;
          }
        }
      },
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#64748B',
          font: { 
            size: 10 
          },
          maxRotation: 45,
          minRotation: 0
        },
        grid: {
          color: 'rgba(226, 232, 240, 0.6)',
          display: false,
          drawBorder: false
        }
      },
      y: {
        ticks: {
          color: '#64748B',
          font: { 
            size: 10 
          },
          precision: 0
        },
        grid: {
          color: 'rgba(226, 232, 240, 0.6)',
          drawBorder: false
        },
        beginAtZero: true
      }
    }
  };
}

// Format date for display
function formatDate(dateString) {
  if (dateString === 'Unknown') return dateString;
  return new Date(dateString).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric'
  });
}
</script>

<style scoped>
.dispatch-volume-chart {
  padding: 0;
  margin: 0;
  width: 100%;
}
</style> 