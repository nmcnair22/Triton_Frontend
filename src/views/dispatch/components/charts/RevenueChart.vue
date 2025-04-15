<template>
  <div class="h-full">
    <div v-if="loading || !revenueChartData" class="chart-skeleton">
      <Skeleton height="20rem" />
    </div>
    
    <div v-else-if="!hasData" class="flex flex-column h-full justify-content-center align-items-center">
      <i class="pi pi-chart-line text-5xl text-surface-300 mb-3"></i>
      <p class="m-0 text-surface-600 dark:text-surface-400">No revenue data available</p>
    </div>
    
    <Chart v-else type="bar" :data="revenueChartData" :options="chartOptions" class="h-full" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useDispatchStore } from '@/stores/dispatchStore';
import Chart from 'primevue/chart';
import Skeleton from 'primevue/skeleton';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingKey: {
    type: String,
    default: 'revenueData'
  }
});

const dispatchStore = useDispatchStore();

const chartOptions = ref({
  maintainAspectRatio: false,
  aspectRatio: 0.8,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        color: 'var(--text-color)'
      }
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          
          if (context.dataset.yAxisID === 'margin') {
            label += context.parsed.y.toFixed(1) + '%';
          } else {
            // Format as currency
            label += formatCurrency(context.parsed.y);
          }
          return label;
        }
      }
    }
  },
  scales: {
    x: {
      stacked: false,
      grid: {
        color: 'var(--surface-border)',
        drawBorder: false
      },
      ticks: {
        color: 'var(--text-color-secondary)'
      }
    },
    y: {
      stacked: false,
      grid: {
        color: 'var(--surface-border)',
        drawBorder: false
      },
      ticks: {
        color: 'var(--text-color-secondary)',
        callback: function(value) {
          return formatCurrency(value);
        }
      }
    },
    margin: {
      position: 'right',
      grid: {
        display: false
      },
      ticks: {
        color: 'var(--text-color-secondary)',
        callback: function(value) {
          return value + '%';
        }
      }
    }
  }
});

// Computed properties
const loading = computed(() => {
  return props.loading || dispatchStore.loading[props.loadingKey];
});

const revenueData = computed(() => {
  return props.data && Object.keys(props.data).length > 0 
    ? props.data 
    : dispatchStore.revenueData;
});

const hasData = computed(() => {
  if (!revenueData.value || !revenueData.value.labels) return false;
  
  // Check if data points exist for any series
  return (
    (revenueData.value.revenue && revenueData.value.revenue.some(val => val > 0)) ||
    (revenueData.value.cost && revenueData.value.cost.some(val => val > 0)) ||
    (revenueData.value.margin && revenueData.value.margin.some(val => val > 0))
  );
});

const revenueChartData = computed(() => {
  if (!revenueData.value || !revenueData.value.labels) return null;

  return {
    labels: revenueData.value.labels || [],
    datasets: [
      {
        type: 'bar',
        label: 'Revenue',
        backgroundColor: 'var(--primary-color)',
        data: revenueData.value.revenue || [],
        order: 2
      },
      {
        type: 'bar',
        label: 'Cost',
        backgroundColor: 'var(--surface-500)',
        data: revenueData.value.cost || [],
        order: 3
      },
      {
        type: 'line',
        label: 'Margin',
        borderColor: 'var(--green-500)',
        pointBackgroundColor: 'var(--green-500)',
        pointBorderColor: 'var(--green-500)',
        pointHoverBackgroundColor: 'var(--green-700)',
        pointHoverBorderColor: 'var(--green-700)',
        tension: 0.4,
        fill: false,
        data: revenueData.value.margin || [],
        yAxisID: 'margin',
        order: 1
      }
    ]
  };
});

// Helper function to format currency
function formatCurrency(value) {
  if (value === undefined || value === null) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}
</script>

<style scoped>
.chart-skeleton {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 20rem;
}
</style> 