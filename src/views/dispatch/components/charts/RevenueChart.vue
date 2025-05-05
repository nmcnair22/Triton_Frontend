<template>
  <div class="card h-full flex flex-col">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-50">Revenue Over Time</h3>
      
      <div class="flex gap-2">
        <div v-if="loading" class="flex items-center gap-2 text-sm text-surface-500">
          <ProgressSpinner style="width: 20px; height: 20px" />
          <span>Loading...</span>
        </div>
        
        <Button v-if="!loading" icon="pi pi-refresh" text severity="secondary" @click="refreshData" />
        
        <Select
          v-model="selectedChartType"
          :options="chartTypes"
          optionLabel="label"
          optionValue="value"
          class="w-40"
          :pt="{
            root: { class: 'text-sm' },
            input: { class: 'py-2' }
          }"
        />
      </div>
    </div>
    
    <div class="relative flex-grow">
      <div v-if="loading" class="chart-overlay bg-surface-0/50 dark:bg-surface-900/50 backdrop-blur-sm">
        <ProgressSpinner
          strokeWidth="4"
          :pt="{ root: { class: 'w-12 h-12' } }"
          class="text-primary-500"
        />
      </div>
      
      <div v-else-if="!hasData" class="chart-overlay">
        <div class="flex flex-col items-center text-center p-4">
          <i class="pi pi-chart-line text-4xl mb-2 text-surface-300 dark:text-surface-600"></i>
          <p class="text-surface-600 dark:text-surface-400 mb-2">No revenue data available for the selected date range</p>
          <Button label="Refresh Data" icon="pi pi-refresh" size="small" @click="refreshData" />
        </div>
      </div>
      
      <Chart
        v-else
        :type="selectedChartType"
        :data="chartData"
        :options="chartOptions"
      />
    </div>
    
    <div v-if="hasData" class="mt-4 grid grid-cols-3 gap-4">
      <div class="flex flex-col items-center p-2 rounded-lg bg-surface-50 dark:bg-surface-800">
        <span class="text-xs text-surface-600 dark:text-surface-400">Total Revenue</span>
        <span class="text-lg font-bold text-surface-900 dark:text-surface-50">{{ formattedTotalRevenue }}</span>
      </div>
      
      <div class="flex flex-col items-center p-2 rounded-lg bg-surface-50 dark:bg-surface-800">
        <span class="text-xs text-surface-600 dark:text-surface-400">Total Profit</span>
        <span class="text-lg font-bold text-surface-900 dark:text-surface-50">{{ formattedTotalProfit }}</span>
      </div>
      
      <div class="flex flex-col items-center p-2 rounded-lg bg-surface-50 dark:bg-surface-800">
        <span class="text-xs text-surface-600 dark:text-surface-400">Average Margin</span>
        <span class="text-lg font-bold" :class="marginColorClass">{{ formattedAverageMargin }}</span>
      </div>
    </div>
    
    <div v-if="debug && !loading" class="mt-4 p-2 border-t border-surface-200 dark:border-surface-700">
      <div class="text-xs text-surface-500 dark:text-surface-400">
        <div class="mb-1">Revenue data: {{ dispatchStore.revenueData ? 'Available' : 'Unavailable' }}</div>
        <div v-if="dispatchStore.revenueData" class="mb-1">
          Labels: {{ dispatchStore.revenueData.labels?.length || 0 }}
          Revenue: {{ dispatchStore.revenueData.revenue?.length || 0 }}
          Cost: {{ dispatchStore.revenueData.cost?.length || 0 }}
        </div>
        <div class="mb-1">Time series: {{ dispatchStore.revenueOverTime?.length || 0 }} records</div>
        <div v-if="dataError" class="text-red-500">Error: {{ dataError }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useDispatchStore } from '@/stores/dispatchStore'
import Chart from 'primevue/chart'
import Select from 'primevue/select'
import ProgressSpinner from 'primevue/progressspinner'
import Button from 'primevue/button'

// Props
const props = defineProps({
  loading: Boolean,
  revenueData: Array,
  totalRevenue: Number,
  averageMargin: Number
})

// Store
const dispatchStore = useDispatchStore()
const debug = ref(process.env.NODE_ENV === 'development')
const dataError = ref(null)

// Debug logs
console.log('RevenueChart: initializing chart component');
console.log('RevenueChart: revenueData is loaded?', !!dispatchStore.revenueData);
console.log('RevenueChart: revenueOverTime records:', dispatchStore.revenueOverTime?.length || 0);

if (dispatchStore.revenueData) {
  console.log('RevenueChart: revenueData structure:', {
    labels: dispatchStore.revenueData.labels?.length || 0,
    revenue: dispatchStore.revenueData.revenue?.length || 0,
    cost: dispatchStore.revenueData.cost?.length || 0,
    margin: dispatchStore.revenueData.margin?.length || 0
  });
}

// Local state
const selectedChartType = ref('line')
const chartTypes = [
  { label: 'Line Chart', value: 'line' },
  { label: 'Bar Chart', value: 'bar' }
]

// Fetch data on mount
onMounted(() => {
  console.log('RevenueChart: component mounted');
  refreshData();
});

// Watch for filter changes to refresh data
watch(() => [
  dispatchStore.dateRange,
  dispatchStore.selectedCustomerId,
  dispatchStore.selectedProjectName
], () => {
  console.log('RevenueChart: filters changed, refreshing data');
  refreshData();
}, { deep: true });

// Methods
async function refreshData() {
  console.log('RevenueChart: refreshing data');
  dataError.value = null;
  
  try {
    await dispatchStore.fetchRevenueOverTime();
    console.log('RevenueChart: data refreshed successfully');
    console.log('RevenueChart: received revenueOverTime:', dispatchStore.revenueOverTime?.length || 0, 'records');
    
    if (dispatchStore.revenueData) {
      console.log('RevenueChart: updated revenueData structure:', {
        labels: dispatchStore.revenueData.labels?.length || 0,
        revenue: dispatchStore.revenueData.revenue?.length || 0,
        cost: dispatchStore.revenueData.cost?.length || 0,
        margin: dispatchStore.revenueData.margin?.length || 0
      });
    } else {
      console.warn('RevenueChart: revenueData is null after refresh');
    }
  } catch (error) {
    console.error('RevenueChart: error refreshing data:', error);
    dataError.value = error.message || 'Error loading revenue data';
  }
}

// Computed
const loading = computed(() => dispatchStore.loading.revenueOverTime);

const hasData = computed(() => {
  const hasRevenueData = dispatchStore.revenueData && 
                      dispatchStore.revenueData.labels && 
                      dispatchStore.revenueData.labels.length > 0;
  console.log('RevenueChart: hasData check:', hasRevenueData);
  
  if (!hasRevenueData && !loading.value && dispatchStore.revenueOverTime?.length > 0) {
    console.warn('RevenueChart: revenueOverTime has data but revenueData is empty');
    console.log('RevenueChart: raw revenueOverTime sample:', dispatchStore.revenueOverTime.slice(0, 2));
  }
  
  return hasRevenueData;
})

const documentStyle = getComputedStyle(document.documentElement)
const chartData = computed(() => {
  console.log('RevenueChart: building chartData with:', 
    dispatchStore.revenueData?.labels?.length || 0, 'data points');
  if (!hasData.value) return { labels: [], datasets: [] }
  
  const labels = dispatchStore.revenueData.labels || [];
  const revenueData = dispatchStore.revenueData.revenue || [];
  const costData = dispatchStore.revenueData.cost || [];
  
  const profitData = revenueData.map((rev, idx) => {
    const cost = costData[idx] || 0;
    return rev - cost;
  });
  
  console.log('RevenueChart: prepared chart data arrays:', {
    labels: labels.length,
    revenue: revenueData.length,
    cost: costData.length,
    profit: profitData.length
  });
  
  return {
    labels,
    datasets: [
      {
        type: 'line',
        label: 'Revenue',
        data: revenueData,
        fill: false,
        borderColor: documentStyle.getPropertyValue('--primary-500'),
        tension: 0.4,
        pointBackgroundColor: documentStyle.getPropertyValue('--primary-500'),
        pointBorderColor: documentStyle.getPropertyValue('--primary-500')
      },
      {
        type: 'line',
        label: 'Cost',
        data: costData,
        fill: false,
        borderColor: documentStyle.getPropertyValue('--orange-500'),
        tension: 0.4,
        pointBackgroundColor: documentStyle.getPropertyValue('--orange-500'),
        pointBorderColor: documentStyle.getPropertyValue('--orange-500')
      },
      {
        type: 'bar',
        label: 'Profit',
        data: profitData,
        backgroundColor: documentStyle.getPropertyValue('--green-300'),
        borderColor: documentStyle.getPropertyValue('--green-500'),
        hoverBackgroundColor: documentStyle.getPropertyValue('--green-400')
      }
    ]
  }
})

const chartOptions = computed(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: documentStyle.getPropertyValue('--surface-900'),
          usePointStyle: true,
          font: {
            weight: 'bold'
          }
        },
        position: 'top',
        align: 'end'
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: documentStyle.getPropertyValue('--surface-200'),
          drawBorder: false
        },
        ticks: {
          color: documentStyle.getPropertyValue('--surface-700')
        }
      },
      y: {
        grid: {
          color: documentStyle.getPropertyValue('--surface-200'),
          drawBorder: false
        },
        ticks: {
          color: documentStyle.getPropertyValue('--surface-700'),
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  }
})

const totalProfit = computed(() => {
  if (!dispatchStore.revenueData || !dispatchStore.revenueData.revenue || !dispatchStore.revenueData.cost) return 0;
  
  let profit = 0;
  for (let i = 0; i < dispatchStore.revenueData.revenue.length; i++) {
    const revenue = dispatchStore.revenueData.revenue[i] || 0;
    const cost = dispatchStore.revenueData.cost[i] || 0;
    profit += (revenue - cost);
  }
  
  return profit;
})

const formattedTotalRevenue = computed(() => {
  return formatCurrency(dispatchStore.totalRevenue || 0)
})

const formattedTotalProfit = computed(() => {
  return formatCurrency(totalProfit.value)
})

const formattedAverageMargin = computed(() => {
  return formatPercentage(dispatchStore.averageMargin || 0)
})

const marginColorClass = computed(() => {
  const margin = dispatchStore.averageMargin || 0
  if (margin < 10) return 'text-red-500 dark:text-red-400'
  if (margin < 20) return 'text-orange-500 dark:text-orange-400'
  if (margin < 30) return 'text-yellow-500 dark:text-yellow-400'
  return 'text-green-500 dark:text-green-400'
})

// Methods
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value)
}

function formatPercentage(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100)
}

function formatLabelDate(dateString) {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(date)
}
</script>

<style scoped>
.chart-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.p-chart) {
  height: 100%;
}
</style> 