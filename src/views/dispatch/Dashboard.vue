<template>
  <div class="dispatch-dashboard container mx-auto p-5">
    <h1 class="text-3xl font-bold mb-6">Dispatch Dashboard</h1>
    
    <!-- Date Range and Filters -->
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Calendar 
          v-model="dateRange" 
          selectionMode="range" 
          dateFormat="M d, yy"
          :manualInput="false"
          :showIcon="true"
          inputClass="w-56"
          @date-select="handleDateRangeChange" 
        />
        <Button 
          icon="pi pi-filter" 
          label="Filters" 
          @click="filtersVisible = true" 
          outlined
        />
      </div>
      <div>
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
import Calendar from 'primevue/calendar';
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
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(today.getDate() - 30);

const dateRange = ref([thirtyDaysAgo, today]);

// Computed properties accessing store data
const totalDispatches = computed(() => dispatchStore.keyMetrics.totalDispatches);
const totalRevenue = computed(() => dispatchStore.keyMetrics.totalRevenue);
const averageMargin = computed(() => dispatchStore.keyMetrics.averageMargin);
const completionRate = computed(() => dispatchStore.keyMetrics.completionRate);

const dispatchesChange = computed(() => dispatchStore.keyMetrics.dispatchesChange);
const revenueChange = computed(() => dispatchStore.keyMetrics.revenueChange);
const marginChange = computed(() => dispatchStore.keyMetrics.marginChange);
const completionRateChange = computed(() => dispatchStore.keyMetrics.completionRateChange);

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

// Event handlers
const handleDateRangeChange = () => {
  dispatchStore.setDateRange({
    start: dateRange.value[0],
    end: dateRange.value[1]
  });
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

onMounted(() => {
  // Set initial date range in store
  dispatchStore.setDateRange({
    start: dateRange.value[0],
    end: dateRange.value[1]
  });
  
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