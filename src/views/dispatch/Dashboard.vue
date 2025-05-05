<template>
  <div class="dispatch-dashboard container mx-auto p-5">
    <h1 class="text-3xl font-bold mb-6">Dispatch Dashboard</h1>
    
    <!-- Date Range and Filters -->
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <DatePicker 
          v-model="dateRange" 
          selectionMode="range" 
          dateFormat="M d, yy"
          :manualInput="false"
          :showIcon="true"
          inputClass="w-56"
          placeholder="Select date range"
          :showOtherMonths="false"
          :touchUI="false"
          showButtonBar
          :minDate="minDate"
          :maxDate="maxDate"
          @date-select="handleDateRangeChange" 
        />
        <Button 
          icon="pi pi-filter" 
          label="Filters" 
          @click="filtersVisible = true" 
          outlined
        />
      </div>
      <div class="flex gap-3">
        <Button 
          icon="pi pi-refresh" 
          label="Refresh" 
          @click="refreshData" 
          :loading="isRefreshing"
          severity="info"
        />
        <Button 
          icon="pi pi-download" 
          label="Export" 
          @click="exportData" 
          severity="success"
        />
      </div>
    </div>
    
    <!-- Key Metrics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <KeyMetricCard 
        title="Total Dispatches" 
        :value="totalDispatches" 
        :change="dispatchesChange" 
        :loading="loading.keyMetrics"
        icon="pi pi-truck"
      />
      <KeyMetricCard 
        title="Total Revenue" 
        :value="totalRevenue" 
        :change="revenueChange" 
        :loading="loading.keyMetrics"
        icon="pi pi-dollar"
        format="currency"
      />
      <KeyMetricCard 
        title="Average Margin" 
        :value="averageMargin" 
        :change="marginChange" 
        :loading="loading.keyMetrics"
        icon="pi pi-percentage"
        format="percent"
      />
      <KeyMetricCard 
        title="Completion Rate" 
        :value="completionRate" 
        :change="completionRateChange" 
        :loading="loading.keyMetrics"
        icon="pi pi-check-circle"
        format="percent"
      />
    </div>
    
    <!-- Tabs for different views -->
    <TabView class="mb-6">
      <!-- Overview Tab -->
      <TabPanel header="Overview">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <!-- Volume Chart -->
          <Card>
            <template #title>
              <div class="flex justify-between items-center">
                <span>Dispatch Volume</span>
              </div>
            </template>
            <template #content>
              <DispatchVolumeChart 
                :data="dispatchVolume" 
                :loading="loading.dispatchVolume"
              />
            </template>
          </Card>
          
          <!-- Status Distribution -->
          <Card>
            <template #title>
              <div class="flex justify-between items-center">
                <span>Status Distribution</span>
              </div>
            </template>
            <template #content>
              <StatusDistributionChart 
                :data="resultCodes" 
                :loading="loading.resultCodes"
              />
            </template>
          </Card>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Top Clients -->
          <Card>
            <template #title>
              <div class="flex justify-between items-center">
                <span>Top Clients</span>
              </div>
            </template>
            <template #content>
              <ClientChart 
                :data="clientData" 
                :loading="loading.clientData"
              />
            </template>
          </Card>
          
          <!-- Top Projects -->
          <Card>
            <template #title>
              <div class="flex justify-between items-center">
                <span>Top Projects</span>
              </div>
            </template>
            <template #content>
              <ProjectChart 
                :data="projectData" 
                :loading="loading.projectData"
              />
            </template>
          </Card>
        </div>
      </TabPanel>
      
      <!-- Revenue Tab -->
      <TabPanel header="Revenue">
        <div class="grid grid-cols-1 gap-6 mb-6">
          <!-- Revenue Over Time -->
          <Card>
            <template #title>
              <div class="flex justify-between items-center">
                <span>Revenue & Margin Over Time</span>
              </div>
            </template>
            <template #content>
              <RevenueChart 
                :data="revenueData" 
                :loading="loading.revenueData"
              />
            </template>
          </Card>
        </div>
        
        <div class="grid grid-cols-1 gap-6">
          <!-- Top Clients by Revenue -->
          <Card>
            <template #title>
              <div class="flex justify-between items-center">
                <span>Top Clients by Revenue</span>
              </div>
            </template>
            <template #content>
              <ClientRevenueChart 
                :data="clientRevenueData" 
                :loading="loading.clientRevenueData"
              />
            </template>
          </Card>
        </div>
      </TabPanel>
      
      <!-- Geography Tab -->
      <TabPanel header="Geography">
        <div class="grid grid-cols-1 gap-6">
          <!-- State Distribution -->
          <Card>
            <template #title>
              <div class="flex justify-between items-center">
                <span>Dispatch Distribution by State</span>
              </div>
            </template>
            <template #content>
              <StateDistributionChart 
                :data="stateData" 
                :loading="loading.stateData"
              />
            </template>
          </Card>
        </div>
      </TabPanel>
      
      <!-- Detailed View Tab -->
      <TabPanel header="Detailed View">
        <Card>
          <template #title>
            <div class="flex justify-between items-center">
              <span>Dispatch Details</span>
            </div>
          </template>
          <template #content>
            <DispatchTable 
              :dispatches="detailedData" 
              :loading="loading.detailedData"
            />
          </template>
        </Card>
      </TabPanel>
    </TabView>
    
    <!-- Documents Section -->
    <Card class="mb-6">
      <template #title>
        <div class="flex justify-between items-center">
          <span>Dispatch Documents</span>
        </div>
      </template>
      <template #content>
        <DispatchDocumentTable />
      </template>
    </Card>
    
    <!-- Filters Panel -->
    <Dialog 
      v-model:visible="filtersVisible" 
      modal 
      header="Advanced Filters" 
      :style="{ width: '500px' }"
    >
      <FiltersPanel 
        @apply-filters="applyFilters" 
        @reset-filters="resetFilters"
      />
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useDispatchStore } from '@/stores/dispatchStore';
import DatePicker from 'primevue/datepicker';
import Button from 'primevue/button';
import Card from 'primevue/card';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Dialog from 'primevue/dialog';

// Components
import KeyMetricCard from './components/KeyMetricCard.vue';
import DispatchVolumeChart from './components/charts/DispatchVolumeChart.vue';
import StatusDistributionChart from './components/charts/StatusDistributionChart.vue';
import ClientChart from './components/charts/ClientChart.vue';
import ProjectChart from './components/charts/ProjectChart.vue';
import RevenueChart from './components/charts/RevenueChart.vue';
import ClientRevenueChart from './components/charts/ClientRevenueChart.vue';
import StateDistributionChart from './components/charts/StateDistributionChart.vue';
import DispatchTable from './components/DispatchTable.vue';
import DispatchDocumentTable from './components/DispatchDocumentTable.vue';
import FiltersPanel from './components/FiltersPanel.vue';

const dispatchStore = useDispatchStore();
const filtersVisible = ref(false);

// Date range setup
const today = new Date();
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(today.getDate() - 7);

const dateRange = ref([sevenDaysAgo, today]);

// Calendar date constraints
const minDate = ref(new Date(today.getFullYear() - 1, 0, 1)); // 1 year ago
const maxDate = ref(today); // Today

// Computed properties accessing store data
const totalDispatches = computed(() => dispatchStore.totalDispatches);
const totalRevenue = computed(() => dispatchStore.totalRevenue);
const averageMargin = computed(() => dispatchStore.averageMargin);
const completionRate = computed(() => dispatchStore.completionRate);

const dispatchesChange = computed(() => dispatchStore.dispatchChange);
const revenueChange = computed(() => dispatchStore.revenueChange);
const marginChange = computed(() => dispatchStore.marginChange);
const completionRateChange = computed(() => dispatchStore.completionRateChange);

// Use computed properties directly from the store
const dispatchVolume = computed(() => dispatchStore.dispatchVolume);
const resultCodes = computed(() => dispatchStore.resultCodes);
const clientData = computed(() => dispatchStore.clientData);
const projectData = computed(() => dispatchStore.projectData);
const revenueData = computed(() => dispatchStore.revenueData);
const clientRevenueData = computed(() => dispatchStore.clientRevenueData);
const stateData = computed(() => dispatchStore.stateData);
const detailedData = computed(() => dispatchStore.detailedData);

// Loading states from store
const loading = computed(() => dispatchStore.loading);

// Loading state for refresh button
const isRefreshing = ref(false);

// Event handlers
const handleDateRangeChange = () => {
  console.log('Date range changed to:', dateRange.value);
  
  // Ensure we have both start and end dates
  if (!dateRange.value || !Array.isArray(dateRange.value) || dateRange.value.length < 2) {
    console.error('Invalid date range:', dateRange.value);
    return;
  }

  // Format dates as YYYY-MM-DD strings
  const formatDate = (date) => {
    if (!date) return '';
    
    try {
      // Extract year, month, and day
      const year = date.getFullYear();
      // getMonth() is 0-indexed, so add 1 and pad with leading zero if needed
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return '';
    }
  };

  const start = formatDate(dateRange.value[0]);
  const end = formatDate(dateRange.value[1]);
  
  console.log('Formatted dates for API:', { start, end });
  
  dispatchStore.setDateRange(start, end);
  dispatchStore.fetchAllDashboardData();
};

const applyFilters = (filters) => {
  dispatchStore.setFilters(filters);
  dispatchStore.fetchAllDashboardData();
  filtersVisible.value = false;
};

const resetFilters = () => {
  dispatchStore.resetFilters();
  dispatchStore.fetchAllDashboardData();
  filtersVisible.value = false;
};

const exportData = () => {
  // Implement export functionality
  alert('Export functionality to be implemented');
};

// Refresh data
const refreshData = async () => {
  console.log('Manually refreshing data');
  isRefreshing.value = true;
  
  try {
    await dispatchStore.fetchAllDashboardData();
    console.log('Data refresh complete');
  } catch (error) {
    console.error('Error refreshing data:', error);
  } finally {
    isRefreshing.value = false;
  }
};

onMounted(() => {
  console.log('Dashboard mounted, initial date range:', dateRange.value);
  
  // Format dates as YYYY-MM-DD strings
  const formatDate = (date) => {
    if (!date) return '';
    
    try {
      // Extract year, month, and day
      const year = date.getFullYear();
      // getMonth() is 0-indexed, so add 1 and pad with leading zero if needed
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return '';
    }
  };

  // Set initial date range in store
  const start = formatDate(dateRange.value[0]);
  const end = formatDate(dateRange.value[1]);
  
  console.log('Initial formatted dates for API:', { start, end });
  
  dispatchStore.setDateRange(start, end);
  
  // Fetch all dashboard data
  dispatchStore.fetchAllDashboardData();
});
</script>

<style scoped>
.dispatch-dashboard {
  max-width: 1440px;
}

:deep(.p-card) {
  border-radius: 0.5rem;
  height: 100%;
}

:deep(.p-card-content) {
  padding: 0;
}
</style> 