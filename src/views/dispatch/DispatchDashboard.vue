<script setup>
import { ref, onMounted, computed } from 'vue';
import { useDispatchStore } from '@/stores/dispatchStore';
import { useToast } from 'primevue/usetoast';
import KeyMetricCard from './components/KeyMetricCard.vue';
import DispatchVolumeChart from './components/charts/DispatchVolumeChart.vue';
import StatusDistributionChart from './components/charts/StatusDistributionChart.vue';
import ClientChart from './components/charts/ClientChart.vue';
import ProjectChart from './components/charts/ProjectChart.vue';
import RevenueChart from './components/charts/RevenueChart.vue';
import ClientRevenueChart from './components/charts/ClientRevenueChart.vue';
import StateDistributionChart from './components/charts/StateDistributionChart.vue';
import FiltersPanel from './components/FiltersPanel.vue';
import DispatchDetailView from './components/DispatchDetailView.vue';
import DatePicker from 'primevue/datepicker';
import Breadcrumb from 'primevue/breadcrumb';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Select from 'primevue/select';
import Tabs from 'primevue/tabs';
import TabPanel from 'primevue/tabpanel';

// Store and utils
const dispatchStore = useDispatchStore();
const toast = useToast();

// Breadcrumb items
const breadcrumbItems = ref([
  { label: 'Dashboard', url: '/' },
  { label: 'Dispatch Dashboard' }
]);

// Date range picker
const dateRange = ref([
  new Date(new Date().setDate(new Date().getDate() - 30)),
  new Date()
]);

// Status options for dropdown
const statusOptions = ref([
  { label: 'All Statuses', value: null },
  { label: 'Completed', value: 'completed' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Cancelled', value: 'cancelled' }
]);

// Customer options for dropdown
const customerOptions = ref([
  { label: 'All Customers', value: null },
  // These will be populated from API
]);

// Selected filter values
const selectedStatus = ref(null);
const selectedCustomerId = ref(null);

// Filters panel state
const isFiltersPanelExpanded = ref(false);

// Add selectedDispatchId
const selectedDispatchId = ref(null);

// Computed properties for revenue stats
const averageRevenuePerDispatch = computed(() => {
  if (!dispatchStore.totalDispatches || !dispatchStore.totalRevenue) return 0;
  return formatCurrency(dispatchStore.totalRevenue / dispatchStore.totalDispatches);
});

const highestDailyRevenue = computed(() => {
  if (!dispatchStore.revenueOverTime.length) return 0;
  const highest = Math.max(...dispatchStore.revenueOverTime.map(item => item.total_charged || 0));
  return formatCurrency(highest);
});

const lowestDailyRevenue = computed(() => {
  if (!dispatchStore.revenueOverTime.length) return 0;
  const values = dispatchStore.revenueOverTime.map(item => item.total_charged || 0).filter(val => val > 0);
  const lowest = values.length ? Math.min(...values) : 0;
  return formatCurrency(lowest);
});

// Computed properties for geography stats
const statesCovered = computed(() => {
  return dispatchStore.dispatchesByState.length;
});

const topState = computed(() => {
  if (!dispatchStore.dispatchesByState.length) return 'N/A';
  return `${dispatchStore.dispatchesByState[0]?.state || 'N/A'} (${dispatchStore.dispatchesByState[0]?.count || 0} dispatches)`;
});

const coveragePercentage = computed(() => {
  // 50 states in the US
  const totalStates = 50;
  return Math.round((dispatchStore.dispatchesByState.length / totalStates) * 100);
});

// Helper functions
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

function formatCurrency(value) {
  // Return error indicator if the value is null or undefined
  if (value === undefined || value === null) return '--';
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getStatusSeverity(status) {
  const statusMap = {
    'Completed': 'success',
    'In Progress': 'info',
    'Scheduled': 'warning',
    'Cancelled': 'danger'
  };
  
  return statusMap[status] || 'secondary';
}

// Event handlers
function handleDateRangeChange() {
  if (dateRange.value?.[0] && dateRange.value?.[1]) {
    const startDate = dateRange.value[0].toISOString().split('T')[0];
    const endDate = dateRange.value[1].toISOString().split('T')[0];
    
    dispatchStore.setDateRange(startDate, endDate);
    
    toast.add({
      severity: 'info',
      summary: 'Date Range Updated',
      detail: `Data showing from ${formatDate(startDate)} to ${formatDate(endDate)}`,
      life: 3000
    });
  }
}

function handleStatusChange() {
  dispatchStore.setFilters(
    selectedCustomerId.value,
    null, // project name
    selectedStatus.value
  );
}

function handleCustomerChange() {
  dispatchStore.setFilters(
    selectedCustomerId.value,
    null, // project name
    selectedStatus.value
  );
}

function resetFilters() {
  selectedStatus.value = null;
  selectedCustomerId.value = null;
  dispatchStore.resetFilters();
  
  toast.add({
    severity: 'info',
    summary: 'Filters Reset',
    detail: 'All filters have been cleared',
    life: 3000
  });
}

function exportData() {
  // Implementation to be added
  toast.add({
    severity: 'info',
    summary: 'Export Requested',
    detail: 'Dashboard data export coming soon',
    life: 3000
  });
}

function onPage(event) {
  const { first, rows } = event;
  dispatchStore.fetchDetailedDispatches(rows, first);
}

function toggleFiltersPanel() {
  isFiltersPanelExpanded.value = !isFiltersPanelExpanded.value;
}

function handleAdvancedFiltersApplied(filterData) {
  console.log('Advanced filters applied:', filterData);
  
  toast.add({
    severity: 'info',
    summary: 'Filters Applied',
    detail: 'Dashboard data updated with advanced filters',
    life: 3000
  });
}

function refreshData() {
  dispatchStore.fetchAllDashboardData();
  
  toast.add({
    severity: 'info',
    summary: 'Data Refreshed',
    detail: 'Dashboard data has been refreshed',
    life: 3000
  });
}

// Add function to view dispatch details
function viewDispatchDetails(dispatchId) {
  selectedDispatchId.value = dispatchId;
}

// Add function to go back to the dispatch list
function backToDispatchList() {
  selectedDispatchId.value = null;
}

// Lifecycle hooks
onMounted(() => {
  // Initialize with data
  dispatchStore.fetchAllDashboardData();
  dispatchStore.fetchDetailedDispatches();
  
  // Show welcome toast
  toast.add({
    severity: 'info',
    summary: 'Dashboard Loaded',
    detail: `Showing data for the last 30 days`,
    life: 3000
  });
});
</script>

<template>
  <div class="dispatch-dashboard">
    <!-- Breadcrumb Header -->
    <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center mb-4">
      <div>
        <h1 class="text-2xl font-bold mb-1">Dispatch Dashboard</h1>
        <Breadcrumb :model="breadcrumbItems" class="mb-2 md:mb-0" home-icon="pi pi-home" />
      </div>
      <div class="flex align-items-center gap-2">
        <DatePicker v-model="dateRange" selection-mode="range" date-format="mm/dd/yy" 
          input-class="w-full" placeholder="Date Range"
          @date-select="handleDateRangeChange" />
        <Button icon="pi pi-filter" severity="secondary" outlined 
          @click="toggleFiltersPanel" :class="{ 'p-button-highlighted': isFiltersPanelExpanded }"
          tooltip="Advanced Filters" />
        <Button icon="pi pi-refresh" severity="secondary" outlined 
          @click="refreshData" tooltip="Refresh Data" />
        <Button icon="pi pi-download" severity="secondary" outlined 
          @click="exportData" tooltip="Export Data" />
      </div>
    </div>
    
    <!-- Filters Panel (hidden by default) -->
    <FiltersPanel 
      :is-expanded="isFiltersPanelExpanded" 
      @close="isFiltersPanelExpanded = false"
      @apply="handleAdvancedFiltersApplied"
      @reset="resetFilters" />
    
    <!-- Key Metrics Section -->
    <div class="grid grid-cols-12 gap-4 mb-4">
      <!-- Total Dispatches -->
      <div class="col-span-12 md:col-span-6 lg:col-span-3">
        <KeyMetricCard 
          title="Total Dispatches" 
          :value="dispatchStore.totalDispatches" 
          :change="dispatchStore.dispatchCountChange" 
          loading-key="keyMetrics"
          metric-type="numeric"
          icon="pi pi-truck" />
      </div>
      
      <!-- Total Revenue -->
      <div class="col-span-12 md:col-span-6 lg:col-span-3">
        <KeyMetricCard 
          title="Total Revenue" 
          :value="dispatchStore.totalRevenue" 
          :change="dispatchStore.revenueChange" 
          loading-key="keyMetrics"
          metric-type="currency"
          icon="pi pi-dollar" />
      </div>
      
      <!-- Average Margin -->
      <div class="col-span-12 md:col-span-6 lg:col-span-3">
        <KeyMetricCard 
          title="Average Margin" 
          :value="dispatchStore.averageMargin" 
          :change="dispatchStore.marginChange" 
          loading-key="keyMetrics"
          metric-type="percentage"
          icon="pi pi-chart-line" />
      </div>
      
      <!-- Completion Rate -->
      <div class="col-span-12 md:col-span-6 lg:col-span-3">
        <KeyMetricCard 
          title="Completion Rate" 
          :value="dispatchStore.completionRate" 
          :change="dispatchStore.completionRateChange" 
          loading-key="keyMetrics"
          metric-type="percentage"
          icon="pi pi-check-circle" />
      </div>
    </div>
    
    <!-- Active Filters Section -->
    <div v-if="dispatchStore.activeFilters.length > 0" class="flex mb-4 p-3 border border-surface-200 dark:border-surface-700 rounded-lg bg-surface-0 dark:bg-surface-900">
      <div class="flex align-items-center">
        <span class="font-semibold mr-2">Active Filters:</span>
        <Tag v-for="filter in dispatchStore.activeFilters" :key="filter" 
          :value="filter" severity="info" class="mr-2" />
        <Button icon="pi pi-times" text rounded size="small"
          @click="resetFilters" tooltip="Clear all filters" />
      </div>
    </div>
    
    <!-- Main Content Tabs -->
    <Tabs>
      <!-- Overview Tab -->
      <TabPanel header="Overview">
        <!-- Dispatch Volume Chart -->
        <div class="grid grid-cols-12 gap-4 mb-4">
          <div class="col-span-12">
            <div class="card">
              <h2 class="text-xl font-semibold mb-4">Dispatch Volume</h2>
              <DispatchVolumeChart loading-key="dispatchVolume" />
            </div>
          </div>
        </div>
        
        <!-- Status Charts Section -->
        <div class="grid grid-cols-12 gap-4 mb-4">
          <!-- Status Distribution -->
          <div class="col-span-12 md:col-span-6 lg:col-span-4">
            <div class="card h-full">
              <h2 class="text-xl font-semibold mb-4">Status Distribution</h2>
              <StatusDistributionChart loading-key="resultCodes" />
            </div>
          </div>
          
          <!-- Top Clients -->
          <div class="col-span-12 md:col-span-6 lg:col-span-4">
            <div class="card h-full">
              <h2 class="text-xl font-semibold mb-4">Top Clients</h2>
              <ClientChart loading-key="dispatchesByClient" />
            </div>
          </div>
          
          <!-- Top Projects -->
          <div class="col-span-12 md:col-span-6 lg:col-span-4">
            <div class="card h-full">
              <h2 class="text-xl font-semibold mb-4">Top Projects</h2>
              <ProjectChart loading-key="dispatchesByProject" />
            </div>
          </div>
        </div>
      </TabPanel>
      
      <!-- Performance Tab -->
      <TabPanel header="Performance">
        <div class="card">
          <h2 class="text-xl font-semibold mb-4">Performance Trends</h2>
          <div class="flex justify-content-end mb-4">
            <Select placeholder="Select Metric" />
          </div>
          <div class="h-30rem flex align-items-center justify-content-center">
            <i class="pi pi-chart-line text-4xl text-surface-300"></i>
            <span class="ml-2 text-surface-400">Performance chart will be implemented soon</span>
          </div>
        </div>
      </TabPanel>
      
      <!-- Revenue Tab -->
      <TabPanel header="Revenue">
        <!-- Revenue Over Time -->
        <div class="grid grid-cols-12 gap-4 mb-4">
          <div class="col-span-12">
            <div class="card">
              <h2 class="text-xl font-semibold mb-4">Revenue Over Time</h2>
              <RevenueChart loading-key="revenueOverTime" />
            </div>
          </div>
        </div>
        
        <!-- Revenue Distribution -->
        <div class="grid grid-cols-12 gap-4 mb-4">
          <div class="col-span-12 md:col-span-6">
            <div class="card h-full">
              <h2 class="text-xl font-semibold mb-4">Top Clients by Revenue</h2>
              <ClientRevenueChart loading-key="topClientsByRevenue" />
            </div>
          </div>
          
          <div class="col-span-12 md:col-span-6">
            <div class="card h-full">
              <h2 class="text-xl font-semibold mb-4">Revenue Statistics</h2>
              <div class="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <p class="mb-2">
                  <span class="font-semibold">Average Revenue per Dispatch:</span> 
                  <span class="ml-2">${{ averageRevenuePerDispatch }}</span>
                </p>
                <p class="mb-2">
                  <span class="font-semibold">Highest Daily Revenue:</span> 
                  <span class="ml-2">${{ highestDailyRevenue }}</span>
                </p>
                <p>
                  <span class="font-semibold">Lowest Daily Revenue:</span> 
                  <span class="ml-2">${{ lowestDailyRevenue }}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </TabPanel>
      
      <!-- Clients Tab -->
      <TabPanel header="Clients">
        <div class="grid grid-cols-12 gap-4 mb-4">
          <div class="col-span-12 md:col-span-6">
            <div class="card h-full">
              <h2 class="text-xl font-semibold mb-4">Dispatches by Client</h2>
              <ClientChart loading-key="dispatchesByClient" />
            </div>
          </div>
          
          <div class="col-span-12 md:col-span-6">
            <div class="card h-full">
              <h2 class="text-xl font-semibold mb-4">Top Clients by Revenue</h2>
              <ClientRevenueChart loading-key="topClientsByRevenue" />
            </div>
          </div>
        </div>
      </TabPanel>
      
      <!-- Geography Tab -->
      <TabPanel header="Geography">
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12 md:col-span-6">
            <div class="card h-full">
              <h2 class="text-xl font-semibold mb-4">Dispatches by State</h2>
              <StateDistributionChart loading-key="dispatchesByState" />
            </div>
          </div>
          
          <div class="col-span-12 md:col-span-6">
            <div class="card h-full">
              <h2 class="text-xl font-semibold mb-4">State Coverage</h2>
              <div class="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <p class="mb-2">
                  <span class="font-semibold">States Covered:</span> 
                  <span class="ml-2">{{ statesCovered }}</span>
                </p>
                <p class="mb-2">
                  <span class="font-semibold">Top State:</span> 
                  <span class="ml-2">{{ topState }}</span>
                </p>
                <p>
                  <span class="font-semibold">Coverage Percentage:</span> 
                  <span class="ml-2">{{ coveragePercentage }}%</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </TabPanel>
      
      <!-- Detailed View Tab -->
      <TabPanel header="Detailed View">
        <div class="card">
          <div v-if="!selectedDispatchId">
            <div class="flex justify-content-between mb-4">
              <h2 class="text-xl font-semibold">Dispatch Details</h2>
              <div class="flex">
                <Select v-model="selectedStatus" :options="statusOptions" optionLabel="label" 
                  optionValue="value" placeholder="Filter by Status" class="mr-2"
                  @change="handleStatusChange" />
                <Select v-model="selectedCustomerId" :options="customerOptions" optionLabel="label" 
                  optionValue="value" placeholder="Filter by Customer"
                  @change="handleCustomerChange" />
              </div>
            </div>
            
            <!-- Dispatch Data Table -->
            <DataTable :value="dispatchStore.detailedDispatches" 
              :paginator="true" :rows="10" striped-rows
              :total-records="dispatchStore.detailedDispatchesTotal"
              :loading="dispatchStore.loading.detailedDispatches"
              class="p-datatable-sm"
              lazy
              @page="onPage">
              <Column field="id" header="ID"></Column>
              <Column field="customer_name" header="Customer"></Column>
              <Column field="project_name" header="Project"></Column>
              <Column field="service_date" header="Date">
                <template #body="slotProps">
                  {{ formatDate(slotProps.data.service_date) }}
                </template>
              </Column>
              <Column field="technician" header="Technician"></Column>
              <Column field="status" header="Status">
                <template #body="slotProps">
                  <Tag :value="slotProps.data.status" 
                    :severity="getStatusSeverity(slotProps.data.status)" />
                </template>
              </Column>
              <Column field="total_charged" header="Revenue">
                <template #body="slotProps">
                  ${{ formatCurrency(slotProps.data.total_charged) }}
                </template>
              </Column>
              <Column field="margin_percent" header="Margin">
                <template #body="slotProps">
                  {{ slotProps.data.margin_percent }}%
                </template>
              </Column>
              <Column field="state" header="Location">
                <template #body="slotProps">
                  {{ slotProps.data.city }}, {{ slotProps.data.state }}
                </template>
              </Column>
              <Column field="actions" header="Actions">
                <template #body="slotProps">
                  <Button icon="pi pi-eye" text rounded severity="info" 
                    tooltip="View Details" @click="viewDispatchDetails(slotProps.data.id)" />
                </template>
              </Column>
            </DataTable>
          </div>
          
          <!-- Dispatch Detail View (shown when a dispatch is selected) -->
          <div v-else>
            <div class="flex justify-content-between mb-4">
              <Button icon="pi pi-arrow-left" label="Back to List" severity="secondary"
                @click="backToDispatchList" />
            </div>
            <DispatchDetailView :dispatch-id="selectedDispatchId" />
          </div>
        </div>
      </TabPanel>
    </Tabs>
  </div>
</template>

<style lang="scss" scoped>
.card {
  @apply p-4 rounded-lg bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700;
}
</style> 