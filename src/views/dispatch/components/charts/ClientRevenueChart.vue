<template>
  <div class="client-revenue-chart h-full shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
    <!-- Chart Header -->
    <div class="chart-header flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700">
      <div class="title">
        <h3 class="text-base font-medium text-gray-900 dark:text-gray-100">Top Clients</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400">Revenue and profitability by client</p>
      </div>
      
      <div class="view-controls flex gap-2">
        <div class="tab-controls flex rounded-md overflow-hidden shadow-sm">
          <button 
            class="tab-button px-3 py-1.5 text-xs font-medium flex items-center"
            :class="{'active-tab': selectedView === 'chart'}"
            @click="selectedView = 'chart'"
          >
            <i class="pi pi-chart-bar mr-1"></i>Chart
          </button>
          <button 
            class="tab-button px-3 py-1.5 text-xs font-medium flex items-center"
            :class="{'active-tab': selectedView === 'table'}"
            @click="selectedView = 'table'"
          >
            <i class="pi pi-list mr-1"></i>Table
          </button>
        </div>
        
        <div class="metric-controls flex rounded-md overflow-hidden shadow-sm">
          <button 
            class="tab-button px-3 py-1.5 text-xs font-medium"
            :class="{'active-tab': selectedMetric === 'revenue'}"
            @click="selectMetric('revenue')"
          >
            Revenue
          </button>
          <button 
            class="tab-button px-3 py-1.5 text-xs font-medium"
            :class="{'active-tab': selectedMetric === 'margin'}"
            @click="selectMetric('margin')"
          >
            Margin
          </button>
        </div>
      </div>
    </div>

    <div class="chart-body p-3 h-[calc(100%-60px)]">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center h-full">
        <Skeleton height="16rem" width="100%" class="rounded-md" />
      </div>
      
      <!-- No Data State -->
      <div v-else-if="!hasData" class="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-800 rounded-md p-6">
        <i class="pi pi-chart-bar text-3xl text-gray-400 mb-3"></i>
        <p class="m-0 text-gray-500 dark:text-gray-400 text-sm">No client revenue data available for this period</p>
      </div>
      
      <!-- Data Display -->
      <div v-else class="h-full flex flex-col">
        <!-- Chart View -->
        <div v-if="selectedView === 'chart'" class="chart-container flex-1">
          <Chart :type="chartType" :data="chartData" :options="chartOptions" class="h-full" />
        </div>
        
        <!-- Table View -->
        <div v-else class="table-container flex-1 rounded-md overflow-hidden">
          <DataTable 
            :value="sortedClients" 
            stripedRows 
            size="small"
            :sortField="sortField"
            :sortOrder="sortOrder"
            @sort="onSort"
            responsiveLayout="scroll"
            class="w-full">
            
            <Column field="name" header="Client" :sortable="true">
              <template #body="slotProps">
                <div class="flex items-center">
                  <span class="mr-2 text-gray-800 dark:text-gray-200 text-sm">{{ slotProps.data.name }}</span>
                  <span v-if="slotProps.data.dispatch_count" 
                    class="px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                    {{ slotProps.data.dispatch_count }}
                  </span>
                </div>
              </template>
            </Column>
            
            <Column field="total_revenue" header="Revenue" :sortable="true">
              <template #body="slotProps">
                <span class="text-gray-800 dark:text-gray-200 text-sm">{{ formatCurrency(slotProps.data.total_revenue) }}</span>
              </template>
            </Column>
            
            <Column field="profit" header="Profit" :sortable="true">
              <template #body="slotProps">
                <span :class="[slotProps.data.profit < 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400', 'text-sm']">
                  {{ formatCurrency(slotProps.data.profit) }}
                </span>
              </template>
            </Column>
            
            <Column field="margin_percent" header="Margin" :sortable="true">
              <template #body="slotProps">
                <span class="px-2 py-0.5 text-xs rounded-md" :class="getMarginBadgeClass(slotProps.data.margin_percent)">
                  {{ formatPercentage(slotProps.data.margin_percent) }}
                </span>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </div>

    <!-- Summary metrics footer -->
    <div v-if="hasData" class="chart-footer grid grid-cols-3 gap-2 py-2 px-3 mt-auto border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <div class="metric">
        <div class="metric-label text-xs text-gray-500 dark:text-gray-400">Total Revenue</div>
        <div class="metric-value text-sm font-semibold text-gray-900 dark:text-white">{{ formatCurrency(totalClientRevenue) }}</div>
      </div>
      <div class="metric">
        <div class="metric-label text-xs text-gray-500 dark:text-gray-400">Average Margin</div>
        <div class="metric-value text-sm font-semibold" :class="getMarginTextColor(averageClientMargin)">
          {{ formatPercentage(averageClientMargin) }}
        </div>
      </div>
      <div class="metric">
        <div class="metric-label text-xs text-gray-500 dark:text-gray-400">Total Clients</div>
        <div class="metric-value text-sm font-semibold text-gray-900 dark:text-white">{{ clientRevenueData.length }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useDispatchStore } from '@/stores/dispatchStore';
import Chart from 'primevue/chart';
import Skeleton from 'primevue/skeleton';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

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
    default: 'clientRevenueData'
  }
});

const dispatchStore = useDispatchStore();

// State
const selectedView = ref('chart'); // 'chart' or 'table'
const selectedMetric = ref('revenue'); // 'revenue' or 'margin'
const chartType = ref('bar');
const sortField = ref('total_revenue');
const sortOrder = ref(-1); // Descending

// Computed properties
const loading = computed(() => {
  return props.loading || dispatchStore.loading[props.loadingKey];
});

const clientRevenueData = computed(() => {
  return props.data && props.data.length > 0 
    ? props.data 
    : dispatchStore.clientRevenueData;
});

const hasData = computed(() => {
  return clientRevenueData.value && clientRevenueData.value.length > 0;
});

const sortedClients = computed(() => {
  if (!hasData.value) return [];
  
  return [...clientRevenueData.value]
    .sort((a, b) => {
      const fieldA = a[sortField.value] || 0;
      const fieldB = b[sortField.value] || 0;
      return (fieldA - fieldB) * sortOrder.value;
    })
    .slice(0, 10); // Top 10
});

const totalClientRevenue = computed(() => {
  if (!hasData.value) return 0;
  return clientRevenueData.value.reduce((sum, client) => sum + (client.total_revenue || 0), 0);
});

const averageClientMargin = computed(() => {
  if (!hasData.value) return 0;
  
  // Calculate weighted average (by revenue)
  const totalRevenue = totalClientRevenue.value;
  if (totalRevenue === 0) return 0;
  
  const weightedMarginSum = clientRevenueData.value.reduce((sum, client) => {
    const revenue = client.total_revenue || 0;
    const margin = client.margin_percent || 0;
    return sum + (revenue * margin);
  }, 0);
  
  return weightedMarginSum / totalRevenue;
});

const chartData = computed(() => {
  if (!hasData.value) return null;
  
  // Get top clients by selected metric
  const clients = sortedClients.value;
  
  // Generate an array of gradient colors
  const colorPalette = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#6366F1', '#EF4444'];
  
  if (selectedMetric.value === 'revenue') {
    return {
      labels: clients.map(client => truncateLabel(client.name)),
      datasets: [
        {
          label: 'Revenue',
          backgroundColor: clients.map((_, index) => colorPalette[index % colorPalette.length]),
          data: clients.map(client => client.total_revenue),
          borderRadius: 4,
          barThickness: 18,
          maxBarThickness: 22
        }
      ]
    };
  } else { // margin
    return {
      labels: clients.map(client => truncateLabel(client.name)),
      datasets: [
        {
          label: 'Margin %',
          backgroundColor: clients.map(client => {
            const margin = client.margin_percent || 0;
            // Color based on margin performance
            if (margin < 0) return '#EF4444'; // red
            if (margin < 20) return '#F59E0B'; // amber
            if (margin < 40) return '#10B981'; // green
            return '#047857'; // emerald
          }),
          data: clients.map(client => client.margin_percent),
          borderRadius: 4,
          barThickness: 18,
          maxBarThickness: 22
        }
      ]
    };
  }
});

const chartOptions = computed(() => {
  return {
    indexAxis: 'y',
    maintainAspectRatio: false,
    responsive: true,
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
            const value = context.raw || 0;
            
            if (selectedMetric.value === 'margin') {
              return `Margin: ${formatPercentage(value)}`;
            } else {
              return `Revenue: ${formatCurrency(value)}`;
            }
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(226, 232, 240, 0.6)',
          drawBorder: false
        },
        ticks: {
          color: '#64748B',
          font: {
            size: 10
          },
          callback: function(value) {
            if (selectedMetric.value === 'margin') {
              return `${value}%`;
            } else {
              if (value >= 1000000) {
                return `$${(value / 1000000).toFixed(1)}M`;
              } else if (value >= 1000) {
                return `$${(value / 1000).toFixed(0)}K`;
              } else {
                return `$${value}`;
              }
            }
          }
        }
      },
      y: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          color: '#64748B',
          font: {
            size: 11
          }
        }
      }
    }
  };
});

// Helper functions
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value || 0);
}

function formatPercentage(value) {
  return `${(value || 0).toFixed(1)}%`;
}

function getMarginBadgeClass(margin) {
  if (!margin || margin < 0) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  if (margin < 20) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
  if (margin < 40) return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
  if (margin < 60) return 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300';
  return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
}

function getMarginTextColor(margin) {
  if (!margin || margin < 0) return 'text-red-500 dark:text-red-400';
  if (margin < 20) return 'text-yellow-500 dark:text-yellow-400';
  if (margin < 40) return 'text-amber-500 dark:text-amber-400';
  if (margin < 60) return 'text-lime-500 dark:text-lime-400';
  return 'text-green-500 dark:text-green-400';
}

function truncateLabel(label) {
  if (!label) return '';
  if (label.length > 18) {
    return label.substring(0, 15) + '...';
  }
  return label;
}

function selectMetric(metric) {
  selectedMetric.value = metric;
  
  if (metric === 'revenue') {
    sortField.value = 'total_revenue';
  } else {
    sortField.value = 'margin_percent';
  }
}

function onSort(event) {
  sortField.value = event.field;
  sortOrder.value = event.order;
}
</script>

<style scoped>
.client-revenue-chart {
  display: flex;
  flex-direction: column;
}

.chart-container, .table-container {
  min-height: 220px;
}

.tab-button {
  @apply text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors;
}

.active-tab {
  @apply bg-blue-50 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300 border-blue-200 dark:border-blue-700;
}

.metric-value {
  @apply leading-none mt-1;
}
</style> 