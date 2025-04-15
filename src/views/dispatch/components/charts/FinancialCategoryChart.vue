<script setup>
import { ref, computed } from 'vue';
import { useDispatchStore } from '@/stores/dispatchStore';
import Chart from 'primevue/chart';
import Skeleton from 'primevue/skeleton';

const props = defineProps({
  loadingKey: {
    type: String,
    default: 'financialCategories'
  }
});

// Store
const dispatchStore = useDispatchStore();

// Data handling
const selectedMetric = ref('revenue'); // Options: 'revenue', 'profit', 'margin'

// Computed properties
const loading = computed(() => {
  return dispatchStore.loading[props.loadingKey];
});

const categories = computed(() => {
  return dispatchStore.financialCategories || [];
});

const sortedCategories = computed(() => {
  if (!categories.value || categories.value.length === 0) return [];
  
  const metric = selectedMetric.value;
  let sortKey;
  
  switch (metric) {
    case 'revenue':
      sortKey = 'total_revenue';
      break;
    case 'profit':
      sortKey = 'profit';
      break;
    case 'margin':
      sortKey = 'margin_percentage';
      break;
    default:
      sortKey = 'total_revenue';
  }
  
  // Sort by the selected metric and take top 10
  return [...categories.value]
    .sort((a, b) => b[sortKey] - a[sortKey])
    .slice(0, 10);
});

const chartData = computed(() => {
  if (!sortedCategories.value || sortedCategories.value.length === 0) return null;
  
  // For revenue and profit, show stacked bars (cost + profit = revenue)
  if (selectedMetric.value === 'revenue' || selectedMetric.value === 'profit') {
    return {
      labels: sortedCategories.value.map(cat => shortenCategoryName(cat.category)),
      datasets: [
        {
          label: 'Profit',
          backgroundColor: '#22C55E', // green-500
          data: sortedCategories.value.map(cat => cat.profit)
        },
        {
          label: 'Cost',
          backgroundColor: '#3B82F6', // blue-500
          data: sortedCategories.value.map(cat => cat.total_cost)
        }
      ]
    };
  } 
  // For margin, show simple bars of margin percentages
  else {
    return {
      labels: sortedCategories.value.map(cat => shortenCategoryName(cat.category)),
      datasets: [
        {
          label: 'Margin %',
          backgroundColor: sortedCategories.value.map(cat => getMarginColor(cat.margin_percentage)),
          data: sortedCategories.value.map(cat => cat.margin_percentage)
        }
      ]
    };
  }
});

const chartOptions = computed(() => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y', // Horizontal bar chart
    plugins: {
      legend: {
        position: 'top'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const datasetLabel = context.dataset.label || '';
            const value = context.raw || 0;
            
            if (selectedMetric.value === 'margin') {
              return `${datasetLabel}: ${value.toFixed(1)}%`;
            } else {
              return `${datasetLabel}: $${value.toLocaleString()}`;
            }
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            if (selectedMetric.value === 'margin') {
              return `${value}%`;
            } else {
              if (value >= 1000000) {
                return `$${(value / 1000000).toFixed(1)}M`;
              } else if (value >= 1000) {
                return `$${(value / 1000).toFixed(1)}K`;
              } else {
                return `$${value}`;
              }
            }
          }
        }
      }
    }
  };
  
  // Add stacked options for revenue and profit view
  if (selectedMetric.value === 'revenue' || selectedMetric.value === 'profit') {
    baseOptions.scales.x.stacked = true;
    baseOptions.scales.y = {
      stacked: true
    };
  }
  
  return baseOptions;
});

// Helper functions
function shortenCategoryName(category) {
  // Shorten long category names for better display
  if (category.length > 20) {
    return category.substring(0, 17) + '...';
  }
  return category;
}

function formatCurrency(value) {
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPercentage(value) {
  return value.toFixed(1) + '%';
}

function getMarginColor(margin) {
  if (margin < 0) return '#EF4444'; // red-500 (negative margin)
  if (margin < 20) return '#F97316'; // orange-500 (low margin)
  if (margin < 40) return '#FBBF24'; // amber-400 (medium margin)
  if (margin < 60) return '#A3E635'; // lime-400 (good margin)
  return '#22C55E'; // green-500 (excellent margin)
}

function changeMetric(metric) {
  selectedMetric.value = metric;
}
</script>

<template>
  <div class="financial-category-chart h-full">
    <div v-if="loading" class="flex flex-column gap-2 h-full justify-content-center">
      <div v-for="i in 3" :key="i" class="w-full">
        <Skeleton height="6rem" />
      </div>
    </div>
    <div v-else-if="!categories || categories.length === 0" class="flex flex-column h-full justify-content-center align-items-center">
      <i class="pi pi-chart-bar text-5xl text-surface-300 mb-3"></i>
      <p class="m-0 text-surface-600 dark:text-surface-400">No financial category data available</p>
    </div>
    <div v-else class="h-full flex flex-column">
      <div class="metric-selector flex justify-content-center mb-2">
        <div class="flex p-2 bg-surface-100 dark:bg-surface-800 border-round">
          <button 
            class="btn p-2 px-3 border-none text-sm" 
            :class="{'active bg-primary text-white font-medium border-round': selectedMetric === 'revenue'}"
            @click="changeMetric('revenue')">
            Revenue
          </button>
          <button 
            class="btn p-2 px-3 border-none text-sm" 
            :class="{'active bg-primary text-white font-medium border-round': selectedMetric === 'profit'}"
            @click="changeMetric('profit')">
            Profit
          </button>
          <button 
            class="btn p-2 px-3 border-none text-sm" 
            :class="{'active bg-primary text-white font-medium border-round': selectedMetric === 'margin'}"
            @click="changeMetric('margin')">
            Margin %
          </button>
        </div>
      </div>
      
      <div class="chart-container flex-grow-1 h-20rem">
        <Chart type="bar" :data="chartData" :options="chartOptions" />
      </div>
      
      <div class="summary-stats mt-3 p-2 bg-surface-50 dark:bg-surface-800 border-round text-sm">
        <span class="font-medium">Total Revenue:</span> 
        <span>{{ formatCurrency(dispatchStore.totalRevenue) }}</span>
        <span class="mx-2">|</span>
        <span class="font-medium">Overall Margin:</span> 
        <span>{{ formatPercentage(dispatchStore.averageMargin) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  min-height: 300px;
}

.btn {
  cursor: pointer;
  transition: all 0.2s;
}

.btn:not(.active) {
  background: transparent;
  color: var(--text-color);
}

.btn:not(.active):hover {
  background: var(--surface-200);
}

.active {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style> 