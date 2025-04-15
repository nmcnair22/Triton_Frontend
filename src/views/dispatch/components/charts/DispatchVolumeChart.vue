<template>
  <div class="h-full">
    <div v-if="isLoading" class="flex flex-column gap-2 h-full justify-content-center">
      <div v-for="i in 3" :key="i" class="w-full">
        <Skeleton height="6rem" />
      </div>
    </div>
    <div v-else-if="!chartData" class="flex flex-column h-full justify-content-center align-items-center">
      <i class="pi pi-chart-bar text-5xl text-surface-300 mb-3"></i>
      <p class="m-0 text-surface-600 dark:text-surface-400">No dispatch volume data available for this time period</p>
    </div>
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
  
  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue('--text-color') || '#495057';
  const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#6c757d';
  const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#dee2e6';
  const primaryColor = documentStyle.getPropertyValue('--primary-color') || '#3B82F6';
  
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
        backgroundColor: primaryColor,
        data: counts,
        borderRadius: 6,
        hoverBackgroundColor: adjustColorBrightness(primaryColor, -10)
      }
    ]
  };

  chartOptions.value = {
    maintainAspectRatio: false,
    aspectRatio: 1.2,
    plugins: {
      tooltip: {
        mode: 'index',
        intersect: false,
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
        labels: {
          color: textColor,
          usePointStyle: true
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: textColorSecondary,
          maxRotation: 45,
          minRotation: 0
        },
        grid: {
          color: surfaceBorder,
          display: false
        }
      },
      y: {
        ticks: {
          color: textColorSecondary,
          precision: 0
        },
        grid: {
          color: surfaceBorder
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

// Function to adjust color brightness (for hover effects)
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
</script>

<style scoped>
/* The skeleton loader styling is handled by PrimeVue and Tailwind classes */
</style> 