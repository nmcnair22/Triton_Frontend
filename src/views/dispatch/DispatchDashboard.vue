<script setup>
import { ref, onMounted, computed } from 'vue';
import { useDispatchStore } from '@/stores/dispatchStore';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Select from 'primevue/select';
import TabMenu from 'primevue/tabmenu';
import Chart from 'primevue/chart';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import KpiCard from '@/components/KpiCard.vue';
import CalendarRange from '@/components/CalendarRange.vue';
import VolumeChart from '@/components/VolumeChart.vue';
import PieChart from '@/components/PieChart.vue';
import DispatchTable from '@/components/DispatchTable.vue';

// Store and utils
const dispatchStore = useDispatchStore();
const toast = useToast();

// Active tab state
const activeTab = ref(0);

// Navigation items - removed Geography tab
const tabItems = ref([
  { label: 'Overview', icon: 'pi pi-chart-line' },
  { label: 'Performance', icon: 'pi pi-chart-bar' },
  { label: 'Revenue', icon: 'pi pi-dollar' },
  { label: 'Clients', icon: 'pi pi-users' },
  { label: 'Detailed View', icon: 'pi pi-table' }
]);

// Date range selection - initialize with defaults if not set
const selectedDateRange = ref({
  startDate: dispatchStore.dateRange.startDate || new Date(new Date().setDate(new Date().getDate() - 30)),
  endDate: dispatchStore.dateRange.endDate || new Date()
});

// Computed properties for KPI cards
const loadingVolume = computed(() => dispatchStore.loading.volumeStats);
const loadingRevenue = computed(() => dispatchStore.loading.revenueStats);
const isLoading = computed(() => Object.values(dispatchStore.loading).some(state => state));

// Formatting helpers
const formatCurrency = (value) => {
  if (value === 0 || value === null || value === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatPercentage = (value) => {
  if (value === 0 || value === null || value === undefined) return '-';
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
  }
}

// Refresh dashboard data
function refreshDashboard() {
  dispatchStore.fetchDashboardData();
  toast.add({
    severity: 'info',
    summary: 'Data Refreshed',
    detail: 'Dashboard data has been refreshed',
    life: 3000
  });
}

// Mock data for pie chart
const resultCodeData = ref([
  { label: 'Completed', value: 876, color: '#22c55e' },
  { label: 'In Progress', value: 235, color: '#3b82f6' },
  { label: 'Scheduled', value: 99, color: '#f59e0b' },
  { label: 'Cancelled', value: 38, color: '#ef4444' }
]);

// Mock data for dispatch by client
const clientData = ref([
  { name: 'Arvin Park Post Acute', value: 187 },
  { name: 'Bayside Medical Center', value: 143 },
  { name: 'Clearwater Health', value: 112 },
  { name: 'Deerfield Rehabilitation', value: 98 },
  { name: 'Evergreen Senior Living', value: 76 }
]);

// Mock data for dispatch by project
const projectData = ref([
  { name: 'Network Upgrade', value: 245 },
  { name: 'WiFi Deployment', value: 198 },
  { name: 'Server Migration', value: 156 },
  { name: 'Cabling Installation', value: 132 },
  { name: 'Equipment Replacement', value: 87 }
]);

// Mock data for revenue chart
const revenueData = ref([
  { date: 'Apr 1', value: 9500 },
  { date: 'Apr 2', value: 11200 },
  { date: 'Apr 3', value: 13600 },
  { date: 'Apr 4', value: 8700 },
  { date: 'Apr 5', value: 7900 },
  { date: 'Apr 6', value: 9100 },
  { date: 'Apr 7', value: 10400 },
  { date: 'Apr 8', value: 8400 },
  { date: 'Apr 9', value: 9200 },
  { date: 'Apr 10', value: 10700 },
  { date: 'Apr 11', value: 11800 },
  { date: 'Apr 12', value: 7600 },
  { date: 'Apr 13', value: 9800 },
  { date: 'Apr 14', value: 12500 },
  { date: 'Apr 15', value: 8900 },
  { date: 'Apr 16', value: 10200 },
  { date: 'Apr 17', value: 7800 },
  { date: 'Apr 18', value: 9300 },
  { date: 'Apr 19', value: 11500 },
  { date: 'Apr 20', value: 12800 },
  { date: 'Apr 21', value: 9700 },
  { date: 'Apr 22', value: 8500 },
  { date: 'Apr 23', value: 7900 },
  { date: 'Apr 24', value: 10800 },
  { date: 'Apr 25', value: 12300 },
  { date: 'Apr 26', value: 8700 },
  { date: 'Apr 27', value: 9900 },
  { date: 'Apr 28', value: 11200 },
  { date: 'Apr 29', value: 10500 },
  { date: 'Apr 30', value: 13800 }
]);

// Mock data for top clients by revenue
const topClientsByRevenue = ref([
  { name: 'Arvin Park Post Acute', value: 87500 },
  { name: 'Bayside Medical Center', value: 65200 },
  { name: 'Clearwater Health', value: 43800 },
  { name: 'Deerfield Rehabilitation', value: 36600 },
  { name: 'Evergreen Senior Living', value: 29400 }
]);

// Add mock data for client statistics
const clientMetrics = ref([
  { 
    name: 'Arvin Park Post Acute', 
    dispatchCount: 187,
    revenue: 87500,
    completionRate: 93.4,
    marginRate: 47.6,
    growth: 15.2
  },
  { 
    name: 'Bayside Medical Center', 
    dispatchCount: 143,
    revenue: 65200,
    completionRate: 89.1,
    marginRate: 42.8,
    growth: 8.7
  },
  { 
    name: 'Clearwater Health', 
    dispatchCount: 112,
    revenue: 43800,
    completionRate: 92.6,
    marginRate: 39.5,
    growth: 12.3
  },
  { 
    name: 'Deerfield Rehabilitation', 
    dispatchCount: 98,
    revenue: 36600,
    completionRate: 88.7,
    marginRate: 41.2,
    growth: 6.8
  },
  { 
    name: 'Evergreen Senior Living', 
    dispatchCount: 76,
    revenue: 29400,
    completionRate: 90.5,
    marginRate: 43.7,
    growth: 9.5
  }
]);

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

// Mock data for detailed dispatch records
const dispatchRecords = ref([
  { 
    id: 'D-10248', 
    client: 'Arvin Park Post Acute', 
    project: 'Network Upgrade',
    serviceDate: '2023-04-28',
    technician: 'John Smith',
    status: 'Completed',
    revenue: 2450,
    margin: 42.5,
    location: 'Arvin, CA'
  },
  { 
    id: 'D-10247', 
    client: 'Bayside Medical Center', 
    project: 'WiFi Deployment',
    serviceDate: '2023-04-27',
    technician: 'Sarah Johnson',
    status: 'Completed',
    revenue: 3200,
    margin: 38.2,
    location: 'San Francisco, CA'
  },
  { 
    id: 'D-10246', 
    client: 'Clearwater Health', 
    project: 'Server Migration',
    serviceDate: '2023-04-26',
    technician: 'Mike Wilson',
    status: 'In Progress',
    revenue: 4800,
    margin: 45.0,
    location: 'Austin, TX'
  },
  { 
    id: 'D-10245', 
    client: 'Deerfield Rehabilitation', 
    project: 'Cabling Installation',
    serviceDate: '2023-04-25',
    technician: 'Lisa Chen',
    status: 'Completed',
    revenue: 1850,
    margin: 36.8,
    location: 'Chicago, IL'
  },
  { 
    id: 'D-10244', 
    client: 'Evergreen Senior Living', 
    project: 'Equipment Replacement',
    serviceDate: '2023-04-24',
    technician: 'David Johnson',
    status: 'Scheduled',
    revenue: 2100,
    margin: 41.2,
    location: 'Miami, FL'
  },
  { 
    id: 'D-10243', 
    client: 'Fairview Hospital', 
    project: 'Network Upgrade',
    serviceDate: '2023-04-23',
    technician: 'John Smith',
    status: 'Completed',
    revenue: 3750,
    margin: 44.5,
    location: 'New York, NY'
  },
  { 
    id: 'D-10242', 
    client: 'Golden Years Retirement', 
    project: 'WiFi Deployment',
    serviceDate: '2023-04-22',
    technician: 'Sarah Johnson',
    status: 'Cancelled',
    revenue: 0,
    margin: 0,
    location: 'Atlanta, GA'
  },
  { 
    id: 'D-10241', 
    client: 'Harmony Health Center', 
    project: 'Server Migration',
    serviceDate: '2023-04-21',
    technician: 'Mike Wilson',
    status: 'Completed',
    revenue: 5200,
    margin: 48.3,
    location: 'Dallas, TX'
  },
  { 
    id: 'D-10240', 
    client: 'Innovative Medical Group', 
    project: 'Cabling Installation',
    serviceDate: '2023-04-20',
    technician: 'Lisa Chen',
    status: 'Completed',
    revenue: 2300,
    margin: 39.6,
    location: 'Seattle, WA'
  },
  { 
    id: 'D-10239', 
    client: 'Jubilee Care Center', 
    project: 'Equipment Replacement',
    serviceDate: '2023-04-19',
    technician: 'David Johnson',
    status: 'In Progress',
    revenue: 1950,
    margin: 40.8,
    location: 'Denver, CO'
  }
]);

// Global search filter
const globalFilterValue = ref('');

// Initialize dashboard 
onMounted(async () => {
  // Set initial date range in store if not already set
  if (!dispatchStore.dateRange.startDate || !dispatchStore.dateRange.endDate) {
    dispatchStore.setDateRange(selectedDateRange.value.startDate, selectedDateRange.value.endDate);
  }
  
  await dispatchStore.fetchDashboardData();
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

    <!-- KPI cards -->
    <div class="col-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
      <KpiCard 
        title="Total Dispatches"
        :value="dispatchStore.totalDispatches.toLocaleString()"
        :change-percentage="dispatchStore.dispatchCountChange"
        :loading="loadingVolume"
        :retry="() => dispatchStore.fetchVolumeStats()"
      />
      <KpiCard 
        title="Total Revenue"
        :value="formatCurrency(dispatchStore.totalRevenue)"
        :change-percentage="dispatchStore.revenueChange"
        :loading="loadingRevenue"
        :retry="() => dispatchStore.fetchRevenueStatistics()"
      />
      <KpiCard 
        title="Average Margin"
        :value="formatPercentage(dispatchStore.averageMargin)"
        :change-percentage="dispatchStore.marginChange"
        :loading="loadingRevenue"
        :retry="() => dispatchStore.fetchRevenueStatistics()"
      />
      <KpiCard 
        title="Completion Rate"
        :value="formatPercentage(dispatchStore.completionRate)"
        :change-percentage="dispatchStore.completionRateChange"
        :loading="loadingVolume"
        :retry="() => dispatchStore.fetchVolumeStats()"
      />
    </div>

    <!-- Tab Navigation - no longer in a card -->
    <div class="col-12 border-b border-surface-200">
      <TabMenu v-model:activeIndex="activeTab" :model="tabItems" />
    </div>

    <!-- Overview tab content with 2x2 grid layout -->
    <div v-if="activeTab === 0" class="col-12">
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
                  labels: ['Apr 1', 'Apr 2', 'Apr 3', 'Apr 4', 'Apr 5', 'Apr 6', 'Apr 7', 'Apr 8', 'Apr 9', 'Apr 10',
                          'Apr 11', 'Apr 12', 'Apr 13', 'Apr 14', 'Apr 15', 'Apr 16', 'Apr 17', 'Apr 18', 'Apr 19', 'Apr 20',
                          'Apr 21', 'Apr 22', 'Apr 23', 'Apr 24', 'Apr 25', 'Apr 26', 'Apr 27', 'Apr 28', 'Apr 29', 'Apr 30'],
                  datasets: [
                    {
                      label: 'Dispatches',
                      backgroundColor: '#60a5fa',
                      data: [40, 35, 45, 50, 38, 42, 36, 48, 52, 45, 40, 35, 45, 50, 38, 42, 36, 48, 52, 45, 40, 35, 45, 50, 38, 42, 36, 48, 52, 45],
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
              <div class="flex flex-col items-center">
                <div class="relative" style="height: 180px; width: 100%;">
                  <Chart 
                    type="doughnut" 
                    :data="{
                      labels: ['Completed', 'In Progress', 'Scheduled', 'Cancelled'],
                      datasets: [
                        {
                          data: [876, 235, 99, 38],
                          backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
                          borderWidth: 0
                        }
                      ]
                    }"
                    :options="{
                      cutout: '70%',
                      radius: '90%',
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { 
                          display: false 
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const value = context.raw;
                              const total = 1248;
                              const percentage = ((value / total) * 100).toFixed(1);
                              return `${context.label}: ${value} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }"
                  />
                  <div class="absolute inset-0 flex items-center justify-center">
                    <div class="text-4xl font-bold">1248</div>
                  </div>
                </div>

                <!-- Labels moved below chart -->
                <div class="grid grid-cols-2 gap-3 mt-4 w-full">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full bg-green-500"></div>
                    <span class="text-sm">Completed: 70.2%</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span class="text-sm">In Progress: 18.8%</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span class="text-sm">Scheduled: 7.9%</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full bg-red-500"></div>
                    <span class="text-sm">Cancelled: 3.2%</span>
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
                    :style="{ width: `${(item.value / 245) * 100}%` }"
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
                    :style="{ width: `${(item.value / 245) * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Revenue Tab Content -->
    <div v-if="activeTab === 2" class="col-12">
      <div class="grid grid-cols-1 gap-3 mt-3">
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
                  labels: revenueData.map(item => item.date),
                  datasets: [
                    {
                      label: 'Revenue',
                      backgroundColor: '#4ade80',
                      data: revenueData.map(item => item.value),
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
              <div v-for="item in topClientsByRevenue" :key="item.name" class="w-full">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-sm font-medium">{{ item.name }}</span>
                  <span class="text-sm font-bold">${{ item.value.toLocaleString() }}</span>
                </div>
                <div class="w-full bg-gray-100 dark:bg-surface-700 rounded-full h-2.5">
                  <div 
                    class="bg-green-500 h-2.5 rounded-full" 
                    :style="{ width: `${(item.value / 87500) * 100}%` }"
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
                <div class="text-2xl font-bold">$228</div>
              </div>
            </template>
          </Card>
          <Card class="h-full" :pt="{ body: { class: 'p-0' } }">
            <template #content>
              <div class="p-4 flex flex-col items-center justify-center">
                <div class="text-sm text-surface-500 mb-1">Highest Daily Revenue</div>
                <div class="text-2xl font-bold">$13,800</div>
              </div>
            </template>
          </Card>
          <Card class="h-full" :pt="{ body: { class: 'p-0' } }">
            <template #content>
              <div class="p-4 flex flex-col items-center justify-center">
                <div class="text-sm text-surface-500 mb-1">Lowest Daily Revenue</div>
                <div class="text-2xl font-bold">$7,600</div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>

    <!-- Clients Tab Content -->
    <div v-if="activeTab === 3" class="col-12">
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
              :pt="{
                root: { class: 'text-sm' }
              }"
            />
          </div>
        </div>

        <!-- Client Cards -->
        <div class="col-12">
          <div v-for="client in clientMetrics" :key="client.name" class="mb-3">
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
                      <span class="text-xl font-bold">{{ client.dispatchCount }}</span>
                      <div class="mt-2 w-full bg-gray-100 dark:bg-surface-700 rounded-full h-2">
                        <div 
                          class="bg-blue-600 h-2 rounded-full" 
                          :style="{ width: `${(client.dispatchCount / 187) * 100}%` }"
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
                          :style="{ width: `${(client.revenue / 87500) * 100}%` }"
                        ></div>
                      </div>
                    </div>

                    <!-- Completion Rate -->
                    <div class="flex flex-col">
                      <span class="text-sm text-surface-500 mb-1">Completion Rate</span>
                      <span class="text-xl font-bold">{{ client.completionRate }}%</span>
                      <div class="mt-2 w-full bg-gray-100 dark:bg-surface-700 rounded-full h-2">
                        <div 
                          class="bg-teal-500 h-2 rounded-full" 
                          :style="{ width: `${client.completionRate}%` }"
                        ></div>
                      </div>
                    </div>

                    <!-- Margin Rate -->
                    <div class="flex flex-col">
                      <span class="text-sm text-surface-500 mb-1">Margin Rate</span>
                      <span class="text-xl font-bold">{{ client.marginRate }}%</span>
                      <div class="mt-2 w-full bg-gray-100 dark:bg-surface-700 rounded-full h-2">
                        <div 
                          class="bg-purple-500 h-2 rounded-full" 
                          :style="{ width: `${client.marginRate}%` }"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Detailed View tab content -->
    <div v-if="activeTab === 4" class="col-12">
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
            <Button icon="pi pi-download" label="Export" text class="ml-2" severity="secondary" />
          </div>
        </div>

        <!-- Dispatch data table -->
        <div class="col-12">
          <DataTable 
            :value="dispatchRecords"
            :paginator="true" 
            :rows="10"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            tableStyle="min-width: 50rem"
            :globalFilter="globalFilterValue"
            stripedRows
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
            <Column field="client" header="Client" sortable style="width: 15%"></Column>
            <Column field="project" header="Project" sortable style="width: 15%"></Column>
            <Column field="serviceDate" header="Service Date" sortable style="width: 10%">
              <template #body="{ data }">
                {{ new Date(data.serviceDate).toLocaleDateString() }}
              </template>
            </Column>
            <Column field="technician" header="Technician" sortable style="width: 12%"></Column>
            <Column field="status" header="Status" sortable style="width: 10%">
              <template #body="{ data }">
                <span :class="`inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(data.status)}`">
                  {{ data.status }}
                </span>
              </template>
            </Column>
            <Column field="revenue" header="Revenue" sortable style="width: 10%">
              <template #body="{ data }">
                {{ formatCurrency(data.revenue) }}
              </template>
            </Column>
            <Column field="margin" header="Margin %" sortable style="width: 10%">
              <template #body="{ data }">
                {{ formatPercentage(data.margin) }}
              </template>
            </Column>
            <Column field="location" header="Location" sortable style="width: 15%"></Column>
            <Column field="actions" header="Actions" style="width: 5%">
              <template #body>
                <Button icon="pi pi-ellipsis-v" text rounded />
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </div>

    <!-- Other tabs content (placeholder for now) -->
    <div v-else-if="activeTab !== 0" class="col-12 mt-3">
      <Card :pt="{ body: { class: 'p-0' } }">
        <template #title>
          <div class="px-4 pt-4">
            <div class="font-semibold text-xl">{{ tabItems[activeTab].label }}</div>
          </div>
        </template>
        <template #content>
          <div class="px-4 pb-4">
            <p>This tab's content will be implemented in future iterations.</p>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped>
/* PrimeVue 4 styling for TabMenu */
:deep(.p-tabmenu) {
  margin-bottom: 0;
}

:deep(.p-tabmenu .p-tabmenu-nav) {
  border: none;
  padding: 0 1rem;
}

:deep(.p-tabmenu .p-tabmenu-nav .p-tabmenuitem .p-menuitem-link) {
  border: none;
  background-color: transparent;
  padding: 0.75rem 1.25rem;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

:deep(.p-tabmenu .p-tabmenu-nav .p-tabmenuitem .p-menuitem-link:not(.p-disabled):focus) {
  box-shadow: none;
}

:deep(.p-tabmenu .p-tabmenu-nav .p-tabmenuitem.p-highlight .p-menuitem-link) {
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