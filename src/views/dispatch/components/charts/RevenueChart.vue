<template>
  <div class="h-full">
    <div v-if="loading" class="flex flex-column gap-2 h-full justify-content-center">
      <Skeleton height="20rem" />
    </div>
    <div v-else-if="!revenueData || revenueData.length === 0" class="flex flex-column h-full justify-content-center align-items-center">
      <i class="pi pi-chart-line text-5xl text-gray-300 mb-3"></i>
      <p class="m-0 text-gray-600">No revenue data available for this time period</p>
    </div>
    <Chart v-else id="revenue-chart" type="bar" :data="chartData" :options="chartOptions" class="h-full" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useDispatchStore } from '@/stores/dispatchStore';
import Chart from 'primevue/chart';
import Skeleton from 'primevue/skeleton';

const props = defineProps({
  loadingKey: {
    type: String,
    default: 'revenueOverTime'
  }
});

// Store
const dispatchStore = useDispatchStore();

// Chart data
const chartData = ref(null);
const chartOptions = ref(null);

// Computed properties
const loading = computed(() => {
  return dispatchStore.loading[props.loadingKey];
});

const revenueData = computed(() => {
  return dispatchStore.revenueOverTime || [];
});

// Process the data when revenueData changes
watch(() => revenueData.value, setupChart, { immediate: true });

function setupChart() {
  if (!revenueData.value || revenueData.value.length === 0) {
    chartData.value = null;
    return;
  }
  
  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue('--text-color') || '#495057';
  const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#6c757d';
  const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#dee2e6';
  
  // Sort data by date
  const sortedData = [...revenueData.value].sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });
  
  // Extract data
  const labels = sortedData.map(item => {
    const date = new Date(item.date);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  
  const revenueValues = sortedData.map(item => item.total_charged || 0);
  const marginValues = sortedData.map(item => item.margin_percent || 0);
  
  chartData.value = {
    labels: labels,
    datasets: [
      {
        type: 'bar',
        label: 'Revenue',
        backgroundColor: documentStyle.getPropertyValue('--primary-color') || '#3B82F6',
        data: revenueValues,
        borderRadius: 6,
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: 'Margin %',
        borderColor: documentStyle.getPropertyValue('--green-500') || '#22C55E',
        pointBackgroundColor: documentStyle.getPropertyValue('--green-500') || '#22C55E',
        pointBorderColor: documentStyle.getPropertyValue('--green-500') || '#22C55E',
        pointHoverBackgroundColor: textColor,
        pointHoverBorderColor: documentStyle.getPropertyValue('--green-500') || '#22C55E',
        data: marginValues,
        yAxisID: 'y1',
        tension: 0.4
      }
    ]
  };

  chartOptions.value = {
    maintainAspectRatio: false,
    aspectRatio: 1.2,
    plugins: {
      tooltip: {
        mode: 'index',
        intersect: false
      },
      legend: {
        labels: {
          color: textColor
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: textColorSecondary
        },
        grid: {
          color: surfaceBorder
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        ticks: {
          color: textColorSecondary,
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        },
        grid: {
          color: surfaceBorder
        },
        beginAtZero: true
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        ticks: {
          color: textColorSecondary,
          callback: function(value) {
            return value + '%';
          }
        },
        grid: {
          drawOnChartArea: false,
          color: surfaceBorder
        },
        beginAtZero: true,
        max: 100
      }
    }
  };
}
</script>

<style scoped>
.skeleton-loader {
  background-color: var(--surface-200);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style> 