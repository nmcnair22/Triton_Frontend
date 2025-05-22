<script setup>
import { ref, onMounted, computed } from 'vue';
import { useDispatchStore } from '@/stores/dispatchStore';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Select from 'primevue/select';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import Chart from 'primevue/chart';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import KpiCard from '@/components/KpiCard.vue';
import CalendarRange from '@/components/CalendarRange.vue';
import VolumeChart from '@/components/VolumeChart.vue';
import PieChart from '@/components/PieChart.vue';
import DispatchTable from '@/components/DispatchTable.vue';
import ProgressSpinner from 'primevue/progressspinner';

// Import ChartJS datalabels plugin (Comment this out if you don't have the plugin installed)
// import ChartDataLabels from 'chartjs-plugin-datalabels';
// import { Chart as ChartJS } from 'chart.js';
// ChartJS.register(ChartDataLabels);

// Store and utils
const dispatchStore = useDispatchStore();
const toast = useToast();

// Extract reactive state from store using storeToRefs
const { 
  loading: storeLoading,
  header,
  overview,
  revenue,
  details,
  dateRange: storeDateRange,
  clientMetrics
} = storeToRefs(dispatchStore);

// Set this to false to disable debug features
const showDebugTools = true;

// Active tab state - use string value to match Tab component values
const activeTab = ref('overview');

// Navigation items with key identifiers
const tabItems = ref([
  { key: 'overview', label: 'Overview', icon: 'pi pi-chart-line' },
  { key: 'performance', label: 'Performance', icon: 'pi pi-chart-bar' },
  { key: 'revenue', label: 'Revenue', icon: 'pi pi-dollar' },
  { key: 'clients', label: 'Clients', icon: 'pi pi-users' },
  { key: 'details', label: 'Detailed View', icon: 'pi pi-table' }
]);

// Date range selection - initialize with defaults if not set
const selectedDateRange = ref({
  startDate: storeDateRange.value.startDate || new Date(new Date().setDate(new Date().getDate() - 30)),
  endDate: storeDateRange.value.endDate || new Date()
});

// Computed properties for dashboard data
const isLoading = computed(() => {
  // Check if any section is loading
  return Object.values(storeLoading.value).some(status => status === true);
});

// Computed data based on store
const volumeOverTimeData = computed(() => {
  const data = overview.value?.daily_volume || [];
  // Map the data to match the expected format
  return data.map(item => ({
    date: item.date, // API already provides the date in a good format
    value: item.count // API uses 'count' instead of 'value'
  }));
});

// Sort status distribution data in descending order by count
const statusDistributionData = computed(() => {
  const data = overview.value?.status_breakdown || [];
  // Map the data to match the expected format and sort by count in descending order
  return data
    .map(item => ({
      label: item.status, // API uses 'status' instead of 'label'
      value: item.count,  // API uses 'count' instead of 'value'
      color: dispatchStore.getStatusColor(item.status)
    }))
    .sort((a, b) => b.value - a.value); // Sort by count in descending order
});

const clientData = computed(() => {
  const data = overview.value?.top_clients || [];
  return data.map(item => ({
    name: item.name,
    value: item.count // API uses 'count' instead of 'value'
  }));
});

const projectData = computed(() => {
  const data = overview.value?.top_projects || [];
  return data.map(item => ({
    name: item.name,
    value: item.count // API uses 'count' instead of 'value'
  }));
});

const revenueOverTimeData = computed(() => {
  const data = revenue.value?.revenue_timeline || [];
  return data.map(item => ({
    date: item.date,
    value: item.revenue
  }));
});

const clientsByRevenueData = computed(() => {
  const data = revenue.value?.top_clients || [];
  return data.map(item => ({
    name: item.client_name, // API uses 'client_name' instead of 'name'
    value: item.revenue
  }));
});

const dispatchRecords = computed(() => details.value.dispatches);
const paginationInfo = computed(() => details.value.pagination);
const totalRecords = computed(() => parseInt(paginationInfo.value.total) || 0);
const currentPage = computed({
  get: () => parseInt(paginationInfo.value.currentPage) || 1,
  set: (value) => details.value.pagination.currentPage = value
});
const pageSize = computed({
  get: () => parseInt(paginationInfo.value.perPage) || 10,
  set: (value) => details.value.pagination.perPage = value
});

// Formatting helpers
const formatCurrency = (value) => {
  // Handle null/undefined values
  if (value === null || value === undefined) return '$0';
  
  // Show 0 values for revenue, instead of "-"
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatPercentage = (value) => {
  // Handle null/undefined values
  if (value === null || value === undefined) return '0.0%';
  
  // Show 0 values for percentages, instead of "-"
  return `${value.toFixed(1)}%`;
};

// Helper to get status badge class
const getStatusClass = (status) => {
  switch (status) {
    case 'Completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
    case 'In Progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    case 'Scheduled':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
    case 'Cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
  }
};

// Handle date range changes
function handleDateChange(newDateRange) {
  if (newDateRange.startDate && newDateRange.endDate) {
    dispatchStore.setDateRange(newDateRange.startDate, newDateRange.endDate);
    refreshDashboard();
    
    // If currently on details tab, reset pagination to page 1 and refresh
    if (activeTab.value === 'details') {
      // Reset to page 1 when changing date range
      dispatchStore.fetchDetailedDispatches(1, pageSize.value);
    }
  }
}

// Refresh dashboard data
function refreshDashboard() {
  dispatchStore.fetchDashboardData(true);
  
  // If currently on details tab, also refresh the details data
  if (activeTab.value === 'details') {
    dispatchStore.fetchDetailedDispatches(currentPage.value, pageSize.value);
  }
  
  toast.add({
    severity: 'info',
    summary: 'Data Refreshed',
    detail: 'Dashboard data has been refreshed',
    life: 3000
  });
}

// Sort options
const sortOptions = ref([
  { name: 'Revenue (High to Low)', code: 'revenue-desc' },
  { name: 'Revenue (Low to High)', code: 'revenue-asc' },
  { name: 'Dispatches (High to Low)', code: 'dispatches-desc' },
  { name: 'Dispatches (Low to High)', code: 'dispatches-asc' },
  { name: 'Alphabetical (A-Z)', code: 'name-asc' },
  { name: 'Alphabetical (Z-A)', code: 'name-desc' }
]);

const selectedSort = ref({ name: 'Revenue (High to Low)', code: 'revenue-desc' });

// Handle page change for detailed view
const onPageChange = (event) => {
  // Get page and rows info from the event
  const page = event.page + 1; // PrimeVue uses 0-based pagination, our API uses 1-based
  const perPage = event.rows;
  
  console.log('Page changed:', { 
    page, 
    perPage, 
    first: event.first,
    pageCount: event.pageCount 
  });
  
  // Update store with new pagination settings and fetch data
  dispatchStore.fetchDetailedDispatches(page, perPage);
};

// Handle tab change
const onTabChange = (value) => {
  activeTab.value = value;
  loadTabData(value);
};

// Handle client metrics load
const loadClientMetrics = () => {
  const sortCode = selectedSort.value.code;
  const [sortBy, sortOrder] = sortCode.split('-');
  dispatchStore.fetchClientMetrics(sortBy, sortOrder);
};

// Load data for specific tab
const loadTabData = (tabKey) => {
  switch(tabKey) {
    case 'overview': // Overview tab
      // Data already loaded by fetchDashboardData
      break;
    case 'revenue': // Revenue tab
      // Make sure we have revenue data
      if (!dispatchStore.revenue) {
        dispatchStore.fetchDashboardData();
      }
      break;
    case 'clients': // Clients tab
      loadClientMetrics();
      break;
    case 'details': // Detailed View tab
      // If we don't have any dispatch records yet, or if we need to refresh,
      // fetch the data with current pagination settings
      if (!dispatchStore.details.dispatches.length || dispatchStore.errors.details) {
        dispatchStore.fetchDetailedDispatches(
          parseInt(paginationInfo.value.currentPage) || 1,
          parseInt(paginationInfo.value.perPage) || 10
        );
      }
      break;
  }
};

// Global search filter
const globalFilterValue = ref('');

// Initialize dashboard 
onMounted(async () => {
  // Set initial date range in store if not already set
  if (!dispatchStore.dateRange.startDate || !dispatchStore.dateRange.endDate) {
    dispatchStore.setDateRange(selectedDateRange.value.startDate, selectedDateRange.value.endDate);
  }
  
  await dispatchStore.fetchDashboardData();
  
  // Also fetch first page of detailed data to ensure the table is initialized properly
  dispatchStore.fetchDetailedDispatches(1, 10);
  
  loadTabData(activeTab.value);
});
</script>

<template>
  <div class="grid">
    <!-- Header with date range filter -->
    <div class="col-12 flex justify-between items-center mb-3">
      <h1 class="text-2xl font-semibold">Dispatch Dashboard</h1>
      <div class="flex items-center gap-3">
        <CalendarRange 
          v-model="selectedDateRange" 
          @change="handleDateChange"
          size="small"
        />
        <Button icon="pi pi-refresh" text @click="refreshDashboard" :loading="isLoading" />
      </div>
    </div>

    <!-- Error message display -->
    <div v-if="dispatchStore.errors && dispatchStore.errors.dashboardData" class="col-12 mb-3">
      <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h2 class="text-lg font-semibold text-red-700 mb-2">Error Loading Dashboard Data</h2>
        <p class="text-red-600">{{ dispatchStore.errors.dashboardData }}</p>
        <div class="mt-3">
          <Button label="Retry" icon="pi pi-refresh" severity="danger" @click="refreshDashboard" />
        </div>
      </div>
    </div>

    <!-- KPI cards -->
    <div class="col-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
      <KpiCard 
        title="Total Dispatches"
        :value="dispatchStore.totalDispatches.toLocaleString()"
        :change-percentage="dispatchStore.dispatchCountChange"
        :loading="dispatchStore.loading.dashboardData"
        :retry="() => dispatchStore.fetchDashboardData(true)"
      />
      <KpiCard 
        title="Total Revenue"
        :value="formatCurrency(dispatchStore.totalRevenue)"
        :change-percentage="dispatchStore.revenueChange"
        :loading="dispatchStore.loading.dashboardData"
        :retry="() => dispatchStore.fetchDashboardData(true)"
      />
      <KpiCard 
        title="Average Margin"
        :value="formatPercentage(dispatchStore.averageMargin)"
        :change-percentage="dispatchStore.marginChange"
        :loading="dispatchStore.loading.dashboardData"
        :retry="() => dispatchStore.fetchDashboardData(true)"
      />
      <KpiCard 
        title="Completion Rate"
        :value="formatPercentage(dispatchStore.completionRate)"
        :change-percentage="dispatchStore.completionRateChange"
        :loading="dispatchStore.loading.dashboardData"
        :retry="() => dispatchStore.fetchDashboardData(true)"
      />
    </div>

    <!-- Tab Navigation with PrimeVue 4 Tabs component -->
    <div class="col-12">
      <Tabs v-model:value="activeTab" @update:value="onTabChange">
        <TabList>
          <Tab v-for="item in tabItems" :key="item.key" :value="item.key">
            <div class="flex items-center gap-2">
              <i :class="item.icon"></i>
              <span>{{ item.label }}</span>
            </div>
          </Tab>
        </TabList>
        <TabPanels>
          <!-- Overview Tab Panel -->
          <TabPanel :value="'overview'">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <!-- Volume Chart (Top Left) -->
              <Card class="h-full" :pt="{ body: { class: 'p-0' } }">
                <template #title>
                  <div class="px-4 pt-4">
                    <div class="font-semibold text-xl">Dispatch Volume Over Time</div>
                    <div class="text-sm text-surface-500">Number of dispatches over the selected time period</div>
                  </div>
                </template>
                <template #content>
                  <div class="px-4 pb-4">
                    <Chart 
                      type="bar" 
                      :data="{
                        labels: volumeOverTimeData.map(item => item.date),
                        datasets: [
                          {
                            label: 'Dispatches',
                            backgroundColor: '#60a5fa',
                            data: volumeOverTimeData.map(item => item.value),
                            barThickness: 10,
                            borderRadius: 4
                          }
                        ]
                      }"
                      :options="{
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              title: (tooltipItems) => {
                                return tooltipItems[0].label;
                              },
                              label: (context) => {
                                return `Dispatches: ${context.parsed.y}`;
                              }
                            }
                          }
                        },
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            grid: {
                              color: 'rgba(0, 0, 0, 0.05)'
                            }
                          },
                          x: {
                            grid: {
                              display: false
                            },
                            ticks: {
                              autoSkip: true,
                              maxRotation: 0,
                              font: {
                                size: 10
                              }
                            }
                          }
                        }
                      }"
                      class="w-full h-[300px]"
                    />
                  </div>
                </template>
              </Card>

              <!-- Result Code Breakdown (Top Right) -->
              <Card class="h-full" :pt="{ body: { class: 'p-0' } }">
                <template #title>
                  <div class="px-4 pt-4">
                    <div class="font-semibold text-xl">Result Code Breakdown</div>
                    <div class="text-sm text-surface-500">Distribution of dispatch statuses</div>
                  </div>
                </template>
                <template #content>
                  <div class="px-4 pb-4">
                    <!-- Horizontal bar chart for status distribution -->
                    <Chart 
                      type="bar" 
                      :data="{
                        labels: statusDistributionData.map(item => item.label),
                        datasets: [
                          {
                            label: 'Count',
                            backgroundColor: statusDistributionData.map(item => item.color),
                            data: statusDistributionData.map(item => item.value),
                            barThickness: 'flex',
                            minBarLength: 5,
                            borderRadius: 2
                          }
                        ]
                      }"
                      :options="{
                        indexAxis: 'y',
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { 
                            display: false 
                          },
                          tooltip: {
                            callbacks: {
                              label: (context) => {
                                const value = context.raw;
                                const total = statusDistributionData.reduce((sum, item) => sum + item.value, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${value.toLocaleString()} (${percentage}%)`;
                              }
                            }
                          }
                        },
                        responsive: true,
                        scales: {
                          x: {
                            beginAtZero: true,
                            grid: {
                              color: 'rgba(0, 0, 0, 0.05)'
                            },
                            ticks: {
                              precision: 0,
                              callback: (value) => value.toLocaleString()
                            },
                            title: {
                              display: true,
                              text: 'Number of Dispatches',
                              font: {
                                size: 12
                              }
                            }
                          },
                          y: {
                            grid: {
                              display: false
                            },
                            ticks: {
                              font: {
                                size: 11
                              }
                            }
                          }
                        }
                      }"
                      class="w-full h-[300px]"
                    />
                    
                    <!-- Legend and totals -->
                    <div class="mt-2">
                      <div class="text-center mt-2 mb-3">
                        <div class="text-sm text-surface-500">Total Dispatches</div>
                        <div class="text-xl font-bold">{{ statusDistributionData.reduce((sum, item) => sum + item.value, 0).toLocaleString() }}</div>
                      </div>

                      <!-- Display percentages for top status categories -->
                      <div class="grid grid-cols-2 gap-2">
                        <div v-for="(item, index) in statusDistributionData.slice(0, 6)" :key="item.label" class="flex items-center gap-2">
                          <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: item.color }"></div>
                          <span class="text-xs">
                            {{ item.label }}: 
                            {{ item.value.toLocaleString() }} 
                            ({{ ((item.value / statusDistributionData.reduce((sum, i) => sum + i.value, 0)) * 100).toFixed(1) }}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </Card>

              <!-- Dispatches by Client (Bottom Left) -->
              <Card class="h-full" :pt="{ body: { class: 'p-0' } }">
                <template #title>
                  <div class="px-4 pt-4">
                    <div class="font-semibold text-xl">Dispatches by Client</div>
                    <div class="text-sm text-surface-500">Top clients by dispatch count</div>
                  </div>
                </template>
                <template #content>
                  <div class="px-4 pb-4 space-y-4">
                    <div v-for="item in clientData" :key="item.name" class="w-full">
                      <div class="flex justify-between items-center mb-1">
                        <span class="text-sm font-medium">{{ item.name }}</span>
                        <span class="text-sm font-bold">{{ item.value }}</span>
                      </div>
                      <div class="w-full bg-gray-100 dark:bg-surface-700 rounded-full h-2.5">
                        <div 
                          class="bg-blue-600 h-2.5 rounded-full" 
                          :style="{ width: `${(item.value / (clientData[0]?.value || 1)) * 100}%` }"
                        ></div>
                      </div>
                    </div>
                  </div>
                </template>
              </Card>

              <!-- Dispatches by Project (Bottom Right) -->
              <Card class="h-full" :pt="{ body: { class: 'p-0' } }">
                <template #title>
                  <div class="px-4 pt-4">
                    <div class="font-semibold text-xl">Dispatches by Project</div>
                    <div class="text-sm text-surface-500">Top projects by dispatch count</div>
                  </div>
                </template>
        <template #content>
                  <div class="px-4 pb-4 space-y-4">
                    <div v-for="item in projectData" :key="item.name" class="w-full">
                      <div class="flex justify-between items-center mb-1">
                        <span class="text-sm font-medium">{{ item.name }}</span>
                        <span class="text-sm font-bold">{{ item.value }}</span>
                      </div>
                      <div class="w-full bg-gray-100 dark:bg-surface-700 rounded-full h-2.5">
                        <div 
                          class="bg-blue-600 h-2.5 rounded-full" 
                          :style="{ width: `${(item.value / (projectData[0]?.value || 1)) * 100}%` }"
                        ></div>
                      </div>
                    </div>
                  </div>
                </template>
              </Card>
                </div>
              </TabPanel>

          <!-- Performance Tab Panel (Placeholder) -->
          <TabPanel :value="'performance'">
            <div class="col-12 mt-3">
              <Card :pt="{ body: { class: 'p-0' } }">
                <template #title>
                  <div class="px-4 pt-4">
                    <div class="font-semibold text-xl">Performance</div>
                  </div>
                </template>
                <template #content>
                  <div class="px-4 pb-4">
                    <p>This tab's content will be implemented in future iterations.</p>
                  </div>
                </template>
              </Card>
                </div>
              </TabPanel>

          <!-- Revenue Tab Panel -->
          <TabPanel :value="'revenue'">
            <div class="grid grid-cols-1 gap-3 mt-3">
              <!-- Debug button - for development purposes only -->
              <div v-if="showDebugTools" class="mb-2 text-right">
                <Button 
                  label="Debug Revenue Data" 
                  severity="secondary" 
                  size="small" 
                  @click="dispatchStore.debugRevenueData()" 
                  icon="pi pi-bug"
                />
              </div>
              
              <!-- Revenue Over Time Chart -->
              <Card class="h-full" :pt="{ body: { class: 'p-0' } }">
                <template #title>
                  <div class="px-4 pt-4">
                    <div class="font-semibold text-xl">Revenue Over Time</div>
                    <div class="text-sm text-surface-500">Revenue trends over the selected time period</div>
                  </div>
                </template>
                <template #content>
                  <div class="px-4 pb-4">
                    <Chart 
                      type="bar" 
                      :data="{
                        labels: revenueOverTimeData.map(item => item.date),
                        datasets: [
                          {
                            label: 'Revenue',
                            backgroundColor: '#4ade80',
                            data: revenueOverTimeData.map(item => item.value),
                            barThickness: 10,
                            borderRadius: 4
                          }
                        ]
                      }"
                      :options="{
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              title: (tooltipItems) => {
                                return tooltipItems[0].label;
                              },
                              label: (context) => {
                                return `Revenue: $${context.parsed.y.toLocaleString()}`;
                              }
                            }
                          }
                        },
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            grid: {
                              color: 'rgba(0, 0, 0, 0.05)'
                            },
                            ticks: {
                              callback: (value) => {
                                return '$' + value.toLocaleString();
                              }
                            }
                          },
                          x: {
                            grid: {
                              display: false
                            },
                            ticks: {
                              autoSkip: true,
                              maxRotation: 0,
                              font: {
                                size: 10
                              }
                            }
                          }
                        }
                      }"
                      class="w-full h-[350px]"
                    />
                  </div>
                </template>
              </Card>

              <!-- Top Clients by Revenue -->
              <Card class="h-full" :pt="{ body: { class: 'p-0' } }">
                <template #title>
                  <div class="px-4 pt-4">
                    <div class="font-semibold text-xl">Top Clients by Revenue</div>
                    <div class="text-sm text-surface-500">Highest revenue-generating clients</div>
                  </div>
                </template>
                <template #content>
                  <div class="px-4 pb-4 space-y-4">
                    <div v-for="item in clientsByRevenueData" :key="item.name" class="w-full">
                      <div class="flex justify-between items-center mb-1">
                        <span class="text-sm font-medium">{{ item.name }}</span>
                        <span class="text-sm font-bold">${{ item.value.toLocaleString() }}</span>
                      </div>
                      <div class="w-full bg-gray-100 dark:bg-surface-700 rounded-full h-2.5">
                        <div 
                          class="bg-green-500 h-2.5 rounded-full" 
                          :style="{ width: `${(item.value / (clientsByRevenueData[0]?.value || 1)) * 100}%` }"
                        ></div>
                      </div>
                    </div>
                  </div>
                </template>
              </Card>

              <!-- Revenue Statistics -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card class="h-full" :pt="{ body: { class: 'p-0' } }">
                  <template #content>
                    <div class="p-4 flex flex-col items-center justify-center">
                      <div class="text-sm text-surface-500 mb-1">Average Revenue per Dispatch</div>
                      <div class="text-2xl font-bold">{{ formatCurrency(dispatchStore.averageRevenuePerDispatch || 0) }}</div>
                      <div class="text-xs text-surface-400 mt-1">
                        Total: {{ formatCurrency(dispatchStore.totalRevenue) }} / {{ dispatchStore.totalDispatches.toLocaleString() }} dispatches
                      </div>
                      <div v-if="showDebugTools" class="text-xs text-red-400 mt-1">
                        Calculated from header metrics
                      </div>
                    </div>
                  </template>
                </Card>
                <Card class="h-full" :pt="{ body: { class: 'p-0' } }">
                  <template #content>
                    <div class="p-4 flex flex-col items-center justify-center">
                      <div class="text-sm text-surface-500 mb-1">Highest Daily Revenue</div>
                      <div class="text-2xl font-bold">{{ formatCurrency(dispatchStore.highestDailyRevenue || 0) }}</div>
                      <div class="text-xs text-surface-400 mt-1">
                        Based on {{ dispatchStore.revenueOverTime.length }} days of data
                      </div>
                      <div v-if="showDebugTools" class="text-xs text-red-400 mt-1">
                        From revenue timeline max
                      </div>
                    </div>
                  </template>
                </Card>
                <Card class="h-full" :pt="{ body: { class: 'p-0' } }">
                  <template #content>
                    <div class="p-4 flex flex-col items-center justify-center">
                      <div class="text-sm text-surface-500 mb-1">Lowest Daily Revenue</div>
                      <div class="text-2xl font-bold">{{ formatCurrency(dispatchStore.lowestDailyRevenue || 0) }}</div>
                      <div class="text-xs text-surface-400 mt-1">
                        Non-zero days only
                      </div>
                      <div v-if="showDebugTools" class="text-xs text-red-400 mt-1">
                        From revenue timeline min (non-zero)
                      </div>
                    </div>
                  </template>
                </Card>
              </div>

              <!-- Revenue Totals Summary Card -->
              <Card class="h-full" :pt="{ body: { class: 'p-0' } }">
                <template #title>
                  <div class="px-4 pt-4">
                    <div class="font-semibold text-xl">Revenue Totals</div>
                    <div class="text-sm text-surface-500">Overall financial metrics for the period</div>
                  </div>
                </template>
                <template #content>
                  <div class="px-4 pb-4">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <div class="text-sm text-surface-500 mb-1">Total Revenue</div>
                        <div class="text-xl font-bold">{{ formatCurrency(dispatchStore.revenueTotals?.revenue || 0) }}</div>
                      </div>
                      <div>
                        <div class="text-sm text-surface-500 mb-1">Total Cost</div>
                        <div class="text-xl font-bold">{{ formatCurrency(dispatchStore.revenueTotals?.cost || 0) }}</div>
                      </div>
                      <div>
                        <div class="text-sm text-surface-500 mb-1">Total Profit</div>
                        <div class="text-xl font-bold">{{ formatCurrency(dispatchStore.revenueTotals?.profit || 0) }}</div>
                      </div>
                      <div>
                        <div class="text-sm text-surface-500 mb-1">Margin Rate</div>
                        <div class="text-xl font-bold">{{ formatPercentage(dispatchStore.revenueTotals?.margin || 0) }}</div>
                      </div>
                    </div>
                  </div>
                </template>
              </Card>
            </div>
          </TabPanel>

          <!-- Clients Tab Panel -->
          <TabPanel :value="'clients'">
            <div class="grid gap-3 mt-3">
              <!-- Client Stats Header with Sort Option -->
              <div class="col-12 flex justify-between items-center">
                <div>
                  <h2 class="text-xl font-semibold">Client Statistics</h2>
                  <p class="text-sm text-surface-500">Performance metrics by client for the selected period</p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm">Sort by:</span>
                  <Select 
                    v-model="selectedSort" 
                    :options="sortOptions" 
                    optionLabel="name" 
                    class="w-52"
                    @change="loadClientMetrics"
                    :pt="{
                      root: { class: 'text-sm' }
                    }"
                  />
                </div>
              </div>

              <!-- Client Cards -->
              <div class="col-12">
                <div v-if="dispatchStore.loading.clientMetrics" class="flex justify-center p-6">
                  <ProgressSpinner style="width:50px;height:50px" strokeWidth="4" />
                </div>
                <div v-else-if="dispatchStore.errors.clientMetrics" class="p-4 text-center text-red-500">
                  {{ dispatchStore.errors.clientMetrics }}
                  <div class="mt-2">
                    <Button label="Retry" @click="loadClientMetrics" size="small" />
                  </div>
                </div>
                <div v-else-if="dispatchStore.clientMetrics && dispatchStore.clientMetrics.length > 0">
                  <div v-for="client in dispatchStore.clientMetrics" :key="client.name" class="mb-3">
                    <Card class="h-full" :pt="{ body: { class: 'p-0' } }">
                      <template #content>
                        <div class="p-4">
                          <div class="flex justify-between items-start mb-4">
                            <div>
                              <h3 class="text-lg font-semibold">{{ client.name }}</h3>
                              <div class="flex items-center mt-1">
                                <span class="text-sm text-surface-500 mr-3">Growth: </span>
                                <span class="text-sm font-semibold" :class="client.growth > 0 ? 'text-green-500' : 'text-red-500'">
                                  {{ client.growth > 0 ? '+' : '' }}{{ client.growth }}%
                                </span>
                              </div>
                            </div>
                            <Button icon="pi pi-ellipsis-v" text rounded />
                          </div>

                          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <!-- Dispatches -->
                            <div class="flex flex-col">
                              <span class="text-sm text-surface-500 mb-1">Dispatches</span>
                              <span class="text-xl font-bold">{{ client.dispatch_count }}</span>
                              <div class="mt-2 w-full bg-gray-100 dark:bg-surface-700 rounded-full h-2">
                                <div 
                                  class="bg-blue-600 h-2 rounded-full" 
                                  :style="{ width: `${(client.dispatch_count / (dispatchStore.clientMetrics[0]?.dispatch_count || 1)) * 100}%` }"
                                ></div>
                              </div>
                            </div>

                            <!-- Revenue -->
                            <div class="flex flex-col">
                              <span class="text-sm text-surface-500 mb-1">Revenue</span>
                              <span class="text-xl font-bold">${{ client.revenue.toLocaleString() }}</span>
                              <div class="mt-2 w-full bg-gray-100 dark:bg-surface-700 rounded-full h-2">
                                <div 
                                  class="bg-green-500 h-2 rounded-full" 
                                  :style="{ width: `${(client.revenue / (dispatchStore.clientMetrics[0]?.revenue || 1)) * 100}%` }"
                                ></div>
                              </div>
                            </div>

                            <!-- Completion Rate -->
                            <div class="flex flex-col">
                              <span class="text-sm text-surface-500 mb-1">Completion Rate</span>
                              <span class="text-xl font-bold">{{ client.completion_rate }}%</span>
                              <div class="mt-2 w-full bg-gray-100 dark:bg-surface-700 rounded-full h-2">
                                <div 
                                  class="bg-teal-500 h-2 rounded-full" 
                                  :style="{ width: `${client.completion_rate}%` }"
                                ></div>
                              </div>
                            </div>

                            <!-- Margin Rate -->
                            <div class="flex flex-col">
                              <span class="text-sm text-surface-500 mb-1">Margin Rate</span>
                              <span class="text-xl font-bold">{{ client.margin_rate }}%</span>
                              <div class="mt-2 w-full bg-gray-100 dark:bg-surface-700 rounded-full h-2">
                                <div 
                                  class="bg-purple-500 h-2 rounded-full" 
                                  :style="{ width: `${client.margin_rate}%` }"
                                ></div>
                              </div>
                            </div>
                          </div>
          </div>
        </template>
      </Card>
                  </div>
                </div>
                <div v-else class="text-center p-6 bg-surface-50 rounded-lg">
                  <p class="text-lg text-surface-600">No client data available for the selected period</p>
                </div>
              </div>
            </div>
          </TabPanel>

          <!-- Detailed View Tab Panel -->
          <TabPanel :value="'details'">
            <div class="grid gap-3 mt-3">
              <!-- Table header with search and title -->
              <div class="col-12 flex flex-wrap justify-between items-center mb-2">
                <div>
                  <h2 class="text-xl font-semibold">Detailed Dispatch List</h2>
                  <p class="text-sm text-surface-500">Comprehensive list of all dispatches</p>
                </div>
                <div class="flex items-center">
                  <span class="p-input-icon-left">
                    <i class="pi pi-search" />
                    <InputText v-model="globalFilterValue" placeholder="Search dispatches..." class="p-inputtext-sm" />
                  </span>
                </div>
              </div>

              <!-- Dispatch data table -->
              <div class="col-12">
                <DataTable 
                  :value="dispatchRecords"
                  :paginator="true" 
                  :rows="pageSize"
                  :rowsPerPageOptions="[5, 10, 20, 50]"
                  tableStyle="min-width: 50rem"
                  :globalFilter="globalFilterValue"
                  stripedRows
                  :loading="dispatchStore.loading.details"
                  @page="onPageChange"
                  :totalRecords="totalRecords"
                  :lazy="true"
                  paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                  currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
                  :alwaysShowPaginator="true"
                  class="p-datatable-sm"
                  :pt="{
                    wrapper: { class: 'border border-surface-200 rounded' }
                  }"
                >
                  <Column field="id" header="ID" sortable style="width: 8%">
                    <template #body="{ data }">
                      <span class="text-primary-600 font-medium">{{ data.id }}</span>
                    </template>
                  </Column>
                  <Column field="client_name" header="Client" sortable style="width: 15%"></Column>
                  <Column field="project_name" header="Project" sortable style="width: 15%"></Column>
                  <Column field="service_date" header="Service Date" sortable style="width: 10%">
                    <template #body="{ data }">
                      {{ new Date(data.service_date).toLocaleDateString() }}
                    </template>
                  </Column>
                  <Column field="site_id" header="Site ID" sortable style="width: 8%"></Column>
                  <Column field="status" header="Status" sortable style="width: 8%">
                    <template #body="{ data }">
                      <span :class="`inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(data.status)}`">
                        {{ data.status }}
                      </span>
                    </template>
                  </Column>
                  <Column field="turnup_status" header="Turnup Status" sortable style="width: 10%">
                    <template #body="{ data }">
                      <span :class="`inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(data.turnup_status)}`">
                        {{ data.turnup_status }}
                      </span>
                    </template>
                  </Column>
                  <Column field="revenue" header="Revenue" sortable style="width: 9%">
                    <template #body="{ data }">
                      {{ formatCurrency(data.revenue) }}
                    </template>
                  </Column>
                  <Column field="profit" header="Profit" sortable style="width: 9%">
                    <template #body="{ data }">
                      {{ formatCurrency(data.profit) }}
                    </template>
                  </Column>
                  <Column field="margin" header="Margin %" sortable style="width: 8%">
                    <template #body="{ data }">
                      {{ formatPercentage(data.margin) }}
                    </template>
                  </Column>
                  <Column field="actions" header="Actions" style="width: 5%">
                    <template #body>
                      <Button icon="pi pi-ellipsis-v" text rounded />
                    </template>
                  </Column>
                </DataTable>
              </div>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  </div>
</template>

<style scoped>
/* PrimeVue 4 styling for Tabs */
:deep(.p-tabs-nav) {
  border: none;
  padding: 0 1rem;
}

:deep(.p-tab) {
  border: none;
  background-color: transparent;
}

:deep(.p-tab-header-action) {
  padding: 0.75rem 1.25rem;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

:deep(.p-tab-header-action:focus) {
  box-shadow: none;
}

:deep(.p-tab[data-pc-selected="true"] .p-tab-header-action) {
  border-bottom: 2px solid var(--primary-color);
  color: var(--primary-color);
}

/* Card styling */
:deep(.p-card) {
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

:deep(.p-card .p-card-body) {
  padding: 0;
}

:deep(.p-card .p-card-content) {
  padding: 0;
}

/* Add styles for the data table */
:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.5rem 1rem;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  padding: 0.75rem 1rem;
  background-color: #f8f9fa;
  font-weight: 600;
}

:deep(.p-datatable-wrapper) {
  border-radius: 0.5rem;
  overflow: hidden;
}

:deep(.p-paginator) {
  padding: 0.5rem;
  background-color: #ffffff;
  border-top: 1px solid #e9ecef;
}
</style> 