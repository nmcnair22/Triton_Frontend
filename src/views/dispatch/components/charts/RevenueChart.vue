<template>
  <div class="revenue-chart-container h-full">
    <!-- Loading State -->
    <div v-if="loading || !revenueChartData" class="flex items-center justify-center h-full">
      <Skeleton height="20rem" width="100%" class="rounded-md" />
    </div>
    
    <!-- No Data State -->
    <div v-else-if="!hasData" class="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-800 rounded-md">
      <i class="pi pi-chart-line text-3xl text-gray-400 mb-3"></i>
      <p class="m-0 text-gray-500 dark:text-gray-400 text-sm">No revenue data available for the selected period</p>
    </div>
    
    <!-- Chart -->
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

// Modern color palette from mockups
const chartColors = {
  revenue: '#10B981', // Emerald green
  revenueHover: '#059669',
  cost: '#6366F1', // Indigo
  costHover: '#4F46E5',
  margin: '#F59E0B', // Amber
  marginHover: '#D97706',
  gridLines: 'rgba(226, 232, 240, 0.6)'
};

const chartOptions = ref({
  maintainAspectRatio: false,
  responsive: true,
  layout: {
    padding: {
      top: 10,
      right: 20, 
      bottom: 10,
      left: 10
    }
  },
  plugins: {
    legend: {
      position: 'top',
      align: 'end',
      labels: {
        usePointStyle: true,
        boxWidth: 8,
        boxHeight: 8,
        padding: 15,
        color: '#64748B',
        font: {
          size: 11,
          weight: '500'
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(30, 41, 59, 0.9)',
      padding: 10,
      cornerRadius: 4,
      boxPadding: 4,
      bodyFont: {
        size: 12
      },
      titleFont: {
        size: 12,
        weight: 'bold'
      },
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
        color: chartColors.gridLines,
        display: false,
        drawBorder: false
      },
      ticks: {
        color: '#64748B',
        font: {
          size: 10
        },
        maxRotation: 45,
        minRotation: 0,
        autoSkip: true,
        maxTicksLimit: 12
      }
    },
    y: {
      stacked: false,
      grid: {
        color: chartColors.gridLines,
        drawBorder: false
      },
      ticks: {
        color: '#64748B',
        font: {
          size: 10
        },
        callback: function(value) {
          return formatCurrency(value);
        },
        maxTicksLimit: 8
      }
    },
    margin: {
      position: 'right',
      grid: {
        display: false
      },
      ticks: {
        color: '#64748B',
        font: {
          size: 10
        },
        callback: function(value) {
          return value + '%';
        },
        maxTicksLimit: 6
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
        backgroundColor: chartColors.revenue,
        hoverBackgroundColor: chartColors.revenueHover,
        borderRadius: 4,
        maxBarThickness: 18,
        data: revenueData.value.revenue || [],
        order: 2
      },
      {
        type: 'bar',
        label: 'Cost',
        backgroundColor: chartColors.cost,
        hoverBackgroundColor: chartColors.costHover,
        borderRadius: 4,
        maxBarThickness: 18,
        data: revenueData.value.cost || [],
        order: 3
      },
      {
        type: 'line',
        label: 'Margin %',
        borderColor: chartColors.margin,
        borderWidth: 2,
        pointBackgroundColor: chartColors.margin,
        pointBorderColor: '#FFF',
        pointBorderWidth: 1,
        pointRadius: 3,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: chartColors.marginHover,
        pointHoverBorderColor: '#FFF',
        pointHoverBorderWidth: 1,
        tension: 0.3,
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
.revenue-chart-container {
  @apply p-0 mx-0 my-0 w-full;
}
</style> 