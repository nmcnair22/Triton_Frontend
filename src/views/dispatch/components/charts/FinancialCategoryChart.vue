<script setup>
import { ref, computed, onMounted } from 'vue';
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

// Refs
const selectedTab = ref('revenue');

// Computed
const loading = computed(() => {
  return dispatchStore.loading[props.loadingKey];
});

const categories = computed(() => {
  return dispatchStore.financialCategories || [];
});

const hasData = computed(() => {
  return categories.value && categories.value.length > 0;
});

const sortedCategories = computed(() => {
  if (!hasData.value) return [];
  
  const sortField = selectedTab.value === 'revenue' 
    ? 'total_revenue' 
    : (selectedTab.value === 'profit' ? 'profit' : 'margin_percentage');
  
  return [...categories.value]
    .filter(cat => cat.category) // Remove null categories
    .sort((a, b) => (b[sortField] || 0) - (a[sortField] || 0)) // Descending
    .slice(0, 5); // Top 5 for readability
});

const totalRevenue = computed(() => {
  if (!hasData.value) return 0;
  return categories.value.reduce((sum, cat) => sum + (cat.total_revenue || 0), 0);
});

const totalProfit = computed(() => {
  if (!hasData.value) return 0;
  return categories.value.reduce((sum, cat) => sum + (cat.profit || 0), 0);
});

const overallMargin = computed(() => {
  if (!totalRevenue.value) return 0;
  return (totalProfit.value / totalRevenue.value) * 100;
});

const chartData = computed(() => {
  if (!hasData.value) return null;
  
  const labels = sortedCategories.value.map(cat => shortenCategoryName(cat.category));
  
  if (selectedTab.value === 'revenue') {
    return {
      labels,
      datasets: [
        {
          label: 'Revenue',
          backgroundColor: '#00C4B4',
          barThickness: 20,
          borderRadius: 4,
          data: sortedCategories.value.map(cat => cat.total_revenue || 0)
        }
      ]
    };
  } else if (selectedTab.value === 'profit') {
    return {
      labels,
      datasets: [
        {
          label: 'Profit',
          backgroundColor: '#34D399',
          barThickness: 20,
          borderRadius: 4,
          data: sortedCategories.value.map(cat => cat.profit || 0)
        }
      ]
    };
  } else {
    return {
      labels,
      datasets: [
        {
          label: 'Margin %',
          backgroundColor: '#6366F1',
          barThickness: 20,
          borderRadius: 4,
          data: sortedCategories.value.map(cat => cat.margin_percentage || 0)
        }
      ]
    };
  }
});

const chartOptions = computed(() => {
  const suffix = selectedTab.value === 'margin' ? '%' : '';
  const prefix = selectedTab.value !== 'margin' ? '$' : '';
  
  return {
    indexAxis: 'y',
    maintainAspectRatio: false,
    aspectRatio: 2,
    layout: {
      padding: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      }
    },
    scales: {
      y: {
        ticks: {
          color: '#64748B',
          font: {
            size: 12
          }
        },
        grid: {
          display: false,
          drawBorder: false
        }
      },
      x: {
        beginAtZero: true,
        ticks: {
          color: '#64748B',
          font: {
            size: 11
          },
          callback: function(value) {
            if (selectedTab.value !== 'margin') {
              if (value >= 1000000) {
                return `$${(value / 1000000).toFixed(1)}M`;
              } else if (value >= 1000) {
                return `$${(value / 1000).toFixed(0)}K`;
              } 
              return `$${value}`;
            }
            return value + '%';
          }
        },
        grid: {
          color: 'rgba(226, 232, 240, 0.6)',
          drawBorder: false
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: {
          size: 12
        },
        bodyFont: {
          size: 12
        },
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.raw;
            return `${label}: ${prefix}${value.toLocaleString()}${suffix}`;
          }
        }
      }
    }
  };
});

// Helpers
function shortenCategoryName(name) {
  if (!name) return 'Uncategorized';
  if (name.length > 18) {
    return name.substring(0, 15) + '...';
  }
  return name;
}

function formatCurrency(value) {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toLocaleString()}`;
}

function formatPercentage(value) {
  return `${value.toFixed(1)}%`;
}
</script>

<template>
  <div class="chart-panel h-full">
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center h-full">
      <Skeleton height="200px" width="100%" class="rounded-md" />
    </div>
    
    <!-- No data state -->
    <div v-else-if="!hasData" class="flex flex-col justify-center items-center h-full bg-gray-50 dark:bg-gray-800 rounded-md">
      <i class="pi pi-chart-bar text-2xl text-gray-400 mb-2"></i>
      <p class="m-0 text-gray-500 dark:text-gray-400 text-sm">No financial category data available</p>
    </div>
    
    <!-- Data display -->
    <div v-else class="h-full flex flex-col">
      <!-- Header with metrics summary -->
      <div class="chart-header flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
        <h3 class="text-lg font-medium text-gray-800 dark:text-white m-0">Financial Categories</h3>
        <div class="metrics-summary flex gap-6">
          <div class="metric">
            <div class="metric-label text-sm text-gray-500 dark:text-gray-400">Total Revenue</div>
            <div class="metric-value text-xl font-semibold text-gray-900 dark:text-white">{{ formatCurrency(totalRevenue) }}</div>
          </div>
          <div class="metric">
            <div class="metric-label text-sm text-gray-500 dark:text-gray-400">Total Profit</div>
            <div class="metric-value text-xl font-semibold text-gray-900 dark:text-white">{{ formatCurrency(totalProfit) }}</div>
          </div>
          <div class="metric">
            <div class="metric-label text-sm text-gray-500 dark:text-gray-400">Overall Margin</div>
            <div class="metric-value text-xl font-semibold text-green-600 dark:text-green-400">{{ formatPercentage(overallMargin) }}</div>
          </div>
        </div>
      </div>
      
      <!-- Tab Controls -->
      <div class="tab-controls flex border-b border-gray-200 dark:border-gray-700 mt-3">
        <button 
          class="tab-button pb-2 px-4 text-sm font-medium"
          :class="{'active-tab': selectedTab === 'revenue'}"
          @click="selectedTab = 'revenue'"
        >
          Revenue
        </button>
        <button 
          class="tab-button pb-2 px-4 text-sm font-medium"
          :class="{'active-tab': selectedTab === 'profit'}"
          @click="selectedTab = 'profit'"
        >
          Profit
        </button>
        <button 
          class="tab-button pb-2 px-4 text-sm font-medium"
          :class="{'active-tab': selectedTab === 'margin'}"
          @click="selectedTab = 'margin'"
        >
          Margin %
        </button>
      </div>
      
      <!-- Chart area -->
      <div class="chart-area flex-1 pt-4">
        <Chart type="bar" :data="chartData" :options="chartOptions" class="h-full" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-panel {
  @apply bg-white dark:bg-gray-900 rounded-md shadow-sm p-4;
}

.tab-button {
  @apply text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-b-2 border-transparent transition-colors;
}

.active-tab {
  @apply text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400;
}

.metrics-summary {
  @apply items-end;
}

.metric-value {
  @apply leading-none;
}
</style> 