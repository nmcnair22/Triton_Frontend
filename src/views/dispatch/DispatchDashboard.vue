<script setup>
import { ref, onMounted, computed } from 'vue';
import { useDispatchStore } from '@/stores/dispatchStore';
import { useToast } from 'primevue/usetoast';
import KeyMetricCard from './components/KeyMetricCard.vue';
import DispatchVolumeChart from './components/charts/DispatchVolumeChart.vue';
import StatusDistributionChart from './components/charts/StatusDistributionChart.vue';
import FinancialCategoryChart from './components/charts/FinancialCategoryChart.vue';
import ClientChart from './components/charts/ClientChart.vue';
import ProjectChart from './components/charts/ProjectChart.vue';
import RevenueChart from './components/charts/RevenueChart.vue';
import ClientRevenueChart from './components/charts/ClientRevenueChart.vue';
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

// Add a new function to refresh key metrics
function refreshKeyMetrics() {
  dispatchStore.fetchKeyMetrics();
  
  toast.add({
    severity: 'info',
    summary: 'Refreshing Metrics',
    detail: 'Dashboard metrics are being refreshed',
    life: 3000
  });
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
    <div class="dashboard-header mb-3">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-xl font-bold mb-1 text-surface-900 dark:text-white">Dispatch Dashboard</h1>
          <Breadcrumb :model="breadcrumbItems" class="dashboard-breadcrumb" home-icon="pi pi-home" />
        </div>
        <div class="flex items-center gap-2">
          <DatePicker v-model="dateRange" selection-mode="range" date-format="mm/dd/yy" 
            input-class="date-picker-input" placeholder="Date Range" showIcon
            :pt="{ input: { class: 'custom-date-input' } }"
            @date-select="handleDateRangeChange" />
          <div class="flex">
            <Button icon="pi pi-filter" class="dashboard-button" outlined size="small"
              @click="toggleFiltersPanel" :class="{ 'p-button-highlighted': isFiltersPanelExpanded }"
              tooltip="Advanced Filters" />
            <Button icon="pi pi-refresh" class="dashboard-button" outlined size="small"
              @click="refreshData" tooltip="Refresh Data" />
            <Button icon="pi pi-download" class="dashboard-button" outlined size="small"
              @click="exportData" tooltip="Export Data" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Filters Panel (hidden by default) -->
    <FiltersPanel 
      :is-expanded="isFiltersPanelExpanded" 
      @close="isFiltersPanelExpanded = false"
      @apply="handleAdvancedFiltersApplied"
      @reset="resetFilters" />
    
    <!-- Key Metrics Section -->
    <div class="grid grid-cols-12 gap-3 mb-3">
      <!-- Total Dispatches -->
      <div class="col-span-12 md:col-span-6 lg:col-span-3">
        <KeyMetricCard 
          title="Total Dispatches" 
          :value="dispatchStore.totalDispatches" 
          :change="dispatchStore.dispatchCountChange" 
          loading-key="keyMetrics"
          metric-type="numeric"
          icon="pi pi-truck"
          color-scheme="purple"
          :has-error="dispatchStore.metricErrors.totalDispatches"
          :error-message="dispatchStore.metricErrorMessages.totalDispatches"
          @retry="refreshKeyMetrics" />
      </div>
      
      <!-- Total Revenue -->
      <div class="col-span-12 md:col-span-6 lg:col-span-3">
        <KeyMetricCard 
          title="Total Revenue" 
          :value="dispatchStore.totalRevenue" 
          :change="dispatchStore.revenueChange" 
          loading-key="keyMetrics"
          metric-type="currency"
          icon="pi pi-dollar"
          color-scheme="teal"
          :has-error="dispatchStore.metricErrors.totalRevenue"
          :error-message="dispatchStore.metricErrorMessages.totalRevenue"
          @retry="refreshKeyMetrics" />
      </div>
      
      <!-- Average Margin -->
      <div class="col-span-12 md:col-span-6 lg:col-span-3">
        <KeyMetricCard 
          title="Average Margin" 
          :value="dispatchStore.averageMargin" 
          :change="dispatchStore.marginChange" 
          loading-key="keyMetrics"
          metric-type="percentage"
          icon="pi pi-chart-line"
          color-scheme="orange"
          :has-error="dispatchStore.metricErrors.averageMargin"
          :error-message="dispatchStore.metricErrorMessages.averageMargin"
          @retry="refreshKeyMetrics" />
      </div>
      
      <!-- Completion Rate -->
      <div class="col-span-12 md:col-span-6 lg:col-span-3">
        <KeyMetricCard 
          title="Completion Rate" 
          :value="dispatchStore.completionRate" 
          :change="dispatchStore.completionRateChange" 
          loading-key="keyMetrics"
          metric-type="percentage"
          icon="pi pi-check-circle"
          color-scheme="info"
          :has-error="dispatchStore.metricErrors.completionRate"
          :error-message="dispatchStore.metricErrorMessages.completionRate"
          @retry="refreshKeyMetrics" />
      </div>
    </div>
    
    <!-- Active Filters Section -->
    <div v-if="dispatchStore.activeFilters.length > 0" class="active-filters-container mb-3">
      <div class="flex flex-wrap items-center">
        <div class="filter-badge">
          <i class="pi pi-filter mr-1 text-xs"></i>
          <span class="font-medium text-xs">Filters</span>
        </div>
        <Tag v-for="filter in dispatchStore.activeFilters" :key="filter" 
          :value="filter" class="mr-2 my-1 text-xs"
          :pt="{ root: { class: 'custom-filter-tag' } }" />
        <Button icon="pi pi-times" text rounded size="small"
          class="reset-button" 
          @click="resetFilters" tooltip="Clear filters" />
      </div>
    </div>
    
    <!-- Main Content Tabs -->
    <Tabs class="dashboard-tabs">
      <!-- Overview Tab -->
      <TabPanel header="Overview">
        <!-- Dispatch Volume Chart -->
        <div class="grid grid-cols-12 gap-3 mb-3">
          <div class="col-span-12">
            <div class="card">
              <div class="card-header">
                <h2 class="text-md font-medium">Dispatch Volume</h2>
              </div>
              <div class="h-70">
                <DispatchVolumeChart loading-key="dispatchVolume" />
              </div>
            </div>
          </div>
        </div>
        
        <!-- Status Charts Section -->
        <div class="grid grid-cols-12 gap-3 mb-3">
          <!-- Financial Categories -->
          <div class="col-span-12 md:col-span-6 lg:col-span-4">
            <div class="card">
              <div class="card-header">
                <h2 class="text-md font-medium">Financial Categories</h2>
              </div>
              <div class="h-80">
                <FinancialCategoryChart loading-key="financialCategories" />
              </div>
            </div>
          </div>
          
          <!-- Top Clients -->
          <div class="col-span-12 md:col-span-6 lg:col-span-4">
            <div class="card">
              <div class="card-header">
                <h2 class="text-md font-medium">Top Clients</h2>
              </div>
              <div class="h-80">
                <ClientChart loading-key="dispatchesByClient" />
              </div>
            </div>
          </div>
          
          <!-- Top Projects -->
          <div class="col-span-12 md:col-span-6 lg:col-span-4">
            <div class="card">
              <div class="card-header">
                <h2 class="text-md font-medium">Top Projects</h2>
              </div>
              <div class="h-80">
                <ProjectChart loading-key="projectData" />
              </div>
            </div>
          </div>
        </div>
      </TabPanel>
      
      <!-- Revenue Tab -->
      <TabPanel header="Revenue">
        <!-- Revenue Over Time -->
        <div class="grid grid-cols-12 gap-3 mb-3">
          <div class="col-span-12">
            <div class="card">
              <div class="card-header">
                <h2 class="text-md font-medium">Revenue Over Time</h2>
              </div>
              <div class="h-70">
                <RevenueChart loading-key="revenueOverTime" />
              </div>
            </div>
          </div>
        </div>
        
        <!-- Revenue Distribution -->
        <div class="grid grid-cols-12 gap-3 mb-3">
          <div class="col-span-12 md:col-span-6">
            <div class="card">
              <div class="card-header">
                <h2 class="text-md font-medium">Top Clients by Revenue</h2>
              </div>
              <div class="h-80">
                <ClientRevenueChart loading-key="topClientsByRevenue" />
              </div>
            </div>
          </div>
          
          <div class="col-span-12 md:col-span-6">
            <div class="card">
              <div class="card-header">
                <h2 class="text-md font-medium">Revenue Statistics</h2>
              </div>
              <div class="p-3 bg-surface-50 dark:bg-surface-800 rounded-md">
                <div class="grid grid-cols-3 gap-2">
                  <div class="stat-item">
                    <div class="stat-label">Avg. Revenue per Dispatch</div>
                    <div class="stat-value">${{ averageRevenuePerDispatch }}</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-label">Highest Daily Revenue</div>
                    <div class="stat-value">${{ highestDailyRevenue }}</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-label">Lowest Daily Revenue</div>
                    <div class="stat-value">${{ lowestDailyRevenue }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TabPanel>
      
      <!-- Dispatches Tab -->
      <TabPanel header="Dispatches">
        <div class="card p-0">
          <div v-if="!selectedDispatchId">
            <div class="p-3 flex justify-between items-center border-bottom-1 border-surface-200 dark:border-surface-700">
              <h2 class="text-md font-medium m-0">Dispatch Details</h2>
              <div class="flex">
                <Select v-model="selectedStatus" :options="statusOptions" optionLabel="label" 
                  optionValue="value" placeholder="Status" class="mr-2 w-32"
                  @change="handleStatusChange" />
                <Select v-model="selectedCustomerId" :options="customerOptions" optionLabel="label" 
                  optionValue="value" placeholder="Customer" class="w-40"
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
              <Column field="id" header="ID" :sortable="true" style="width:60px"></Column>
              <Column field="customer_name" header="Customer" :sortable="true"></Column>
              <Column field="project_name" header="Project" :sortable="true"></Column>
              <Column field="service_date" header="Date" :sortable="true" style="width:90px">
                <template #body="slotProps">
                  {{ formatDate(slotProps.data.service_date) }}
                </template>
              </Column>
              <Column field="technician" header="Technician" :sortable="true"></Column>
              <Column field="status" header="Status" :sortable="true" style="width:100px">
                <template #body="slotProps">
                  <Tag :value="slotProps.data.status" 
                    :severity="getStatusSeverity(slotProps.data.status)" />
                </template>
              </Column>
              <Column field="total_charged" header="Revenue" :sortable="true" style="width:90px">
                <template #body="slotProps">
                  ${{ formatCurrency(slotProps.data.total_charged) }}
                </template>
              </Column>
              <Column field="margin_percent" header="Margin" :sortable="true" style="width:70px">
                <template #body="slotProps">
                  {{ slotProps.data.margin_percent }}%
                </template>
              </Column>
              <Column field="state" header="Location" :sortable="true">
                <template #body="slotProps">
                  {{ slotProps.data.city }}, {{ slotProps.data.state }}
                </template>
              </Column>
              <Column field="actions" header="Actions" style="width:60px">
                <template #body="slotProps">
                  <Button icon="pi pi-eye" text rounded severity="info" 
                    tooltip="View Details" @click="viewDispatchDetails(slotProps.data.id)" />
                </template>
              </Column>
            </DataTable>
          </div>
          
          <!-- Dispatch Detail View (shown when a dispatch is selected) -->
          <div v-else>
            <div class="flex justify-content-between p-3 border-bottom-1 border-surface-200 dark:border-surface-700">
              <Button icon="pi pi-arrow-left" label="Back to List" severity="secondary" size="small"
                @click="backToDispatchList" />
            </div>
            <DispatchDetailView :dispatch-id="selectedDispatchId" />
          </div>
        </div>
      </TabPanel>
    </Tabs>
  </div>
</template>

<style scoped>
.dashboard-header {
  border-bottom: 1px solid rgb(229 231 235);
  padding-bottom: 0.75rem;
  margin-bottom: 1rem;
}

.dashboard-breadcrumb :deep(.p-breadcrumb) {
  background-color: transparent;
  border: 0;
  padding: 0;
}

.dashboard-breadcrumb :deep(.p-menuitem-link) {
  padding: 0;
}

.dashboard-breadcrumb :deep(.p-menuitem-text) {
  font-size: 0.75rem;
  color: rgb(107 114 128);
}

.dashboard-breadcrumb :deep(.p-menuitem-icon) {
  font-size: 0.75rem;
}

.dashboard-button {
  border-radius: 0.375rem;
  background-color: white;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid rgb(229 231 235);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
}

.custom-date-input {
  font-size: 0.875rem;
  border: 1px solid rgb(229 231 235);
  border-radius: 0.375rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  height: 2.25rem;
}

.date-picker-input {
  width: 220px;
}

.active-filters-container {
  padding: 0.75rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  background-color: rgb(249 250 251);
  margin-bottom: 1rem;
  border: 1px solid var(--surface-200);
}

.filter-badge {
  display: flex;
  align-items: center;
  background-color: rgb(239 246 255);
  color: rgb(37 99 235);
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  border-radius: 0.375rem;
  margin-right: 0.5rem;
  font-size: 0.75rem;
}

.custom-filter-tag {
  background-color: rgb(243 244 246);
  color: rgb(55 65 81);
  border: 0;
  border-radius: 0.375rem;
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  font-size: 0.75rem;
}

.reset-button {
  color: rgb(239 68 68);
  border-radius: 9999px;
  transition-property: color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
  margin-left: 0.25rem;
  font-size: 0.75rem;
}
.reset-button:hover {
  color: rgb(185 28 28);
}

.dashboard-tabs :deep(.p-tabview-nav) {
  border-bottom: 1px solid rgb(229 231 235);
  margin-bottom: 1rem;
}

.dashboard-tabs :deep(.p-tabview-nav-link) {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  padding-left: 1rem;
  padding-right: 1rem;
  color: rgb(75 85 99);
}

.dashboard-tabs :deep(.p-tabview-selected .p-tabview-nav-link) {
  color: rgb(37 99 235);
  border-color: rgb(37 99 235);
}

.card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.card-header {
  padding: 1rem;
  border-bottom: 1px solid rgb(229 231 235);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-header h2 {
  font-size: 1rem;
  font-weight: 500;
  color: rgb(31 41 55);
  margin: 0;
}

.h-70 {
  height: 17.5rem;
}

.h-80 {
  height: 20rem;
}

.stat-item {
  padding: 0.75rem;
  border-radius: 0.375rem;
  background-color: white;
}

.stat-label {
  font-size: 0.75rem;
  color: rgb(107 114 128);
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(17 24 39);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .dashboard-header {
    border-color: rgb(55 65 81);
  }
  
  .dashboard-breadcrumb :deep(.p-menuitem-text) {
    color: rgb(156 163 175);
  }
  
  .dashboard-button {
    background-color: rgb(31 41 55);
    border-color: rgb(55 65 81);
  }
  
  .custom-date-input {
    border-color: rgb(55 65 81);
  }
  
  .active-filters-container {
    background-color: rgb(31 41 55);
  }
  
  .filter-badge {
    background-color: rgb(30 58 138);
    color: rgb(147 197 253);
  }
  
  .custom-filter-tag {
    background-color: rgb(55 65 81);
    color: rgb(209 213 219);
  }
  
  .dashboard-tabs :deep(.p-tabview-nav) {
    border-color: rgb(55 65 81);
  }
  
  .dashboard-tabs :deep(.p-tabview-nav-link) {
    color: rgb(156 163 175);
  }
  
  .dashboard-tabs :deep(.p-tabview-selected .p-tabview-nav-link) {
    color: rgb(96 165 250);
    border-color: rgb(96 165 250);
  }
  
  .card {
    background-color: rgb(31 41 55);
  }
  
  .card-header {
    border-color: rgb(55 65 81);
  }
  
  .card-header h2 {
    color: white;
  }
  
  .stat-item {
    background-color: rgb(55 65 81);
  }
  
  .stat-label {
    color: rgb(156 163 175);
  }
  
  .stat-value {
    color: white;
  }
}
</style> 