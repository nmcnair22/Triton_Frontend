<template>
  <div class="visit-details-page">
    <!-- Page Header with Stats Overview -->
    <div class="bg-white dark:bg-surface-900 rounded-lg shadow-sm border border-surface-200 dark:border-surface-700 p-6 mb-6">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center">
            <i class="pi pi-calendar-plus text-primary-600 dark:text-primary-400 text-2xl"></i>
          </div>
          <div>
            <h1 :id="titleId" class="text-3xl font-bold text-surface-900 dark:text-surface-0">
              Visit Management
            </h1>
            <p class="text-surface-600 dark:text-surface-300 mt-1">
              Gateway to comprehensive field service visits - click any visit for detailed analysis
            </p>
          </div>
        </div>
        
        <div class="flex items-center gap-3">
          <Button 
            icon="pi pi-plus" 
            label="New Visit" 
            @click="showCreateVisitDialog = true"
            class="p-button-primary"
          />
          <Button 
            icon="pi pi-refresh" 
            :loading="loading"
            @click="refreshData"
            class="p-button-outlined"
            aria-label="Refresh data"
          />
        </div>
      </div>

      <!-- Key Performance Indicators -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Visits"
          :value="visitsStore.overallStats?.total || 0"
          icon="pi pi-calendar"
          color="primary"
          :trend="visitsStore.visitTrends?.total || 0"
        />
        <StatsCard
          title="Completion Rate"
          :value="`${visitsStore.overallStats?.completionRate || 0}%`"
          icon="pi pi-check-circle"
          color="success"
          :trend="visitsStore.visitTrends?.completionRate || 0"
        />
        <StatsCard
          title="Avg Quality Score"
          :value="visitsStore.overallStats?.avgQualityScore || 0"
          icon="pi pi-star"
          color="warning"
          :trend="visitsStore.visitTrends?.avgQualityScore || 0"
        />
        <StatsCard
          title="Total Revenue"
          :value="`$${(visitsStore.overallStats?.totalRevenue || 0).toLocaleString()}`"
          icon="pi pi-dollar"
          color="info"
          :trend="visitsStore.visitTrends?.totalRevenue || 0"
        />
      </div>
    </div>

    <!-- Advanced Filters Panel -->
    <div class="bg-white dark:bg-surface-900 rounded-lg shadow-sm border border-surface-200 dark:border-surface-700 mb-6">
      <Accordion v-model:value="filtersAccordionValue" class="filters-accordion">
        <AccordionPanel value="filters">
          <AccordionHeader>
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center gap-2">
                <i class="pi pi-filter text-primary-600"></i>
                <span class="text-lg font-semibold">Filters & Search</span>
              </div>
              <Button 
                icon="pi pi-filter-slash" 
                label="Clear All" 
                @click.stop="clearAllFilters"
                class="p-button-text p-button-sm"
              />
            </div>
          </AccordionHeader>
          <AccordionContent>
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Smart Search -->
                <div class="col-span-full">
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Smart Search
                  </label>
                  <div class="p-input-icon-left">
                    <i class="pi pi-search"></i>
                    <InputText 
                      v-model="searchQuery"
                      placeholder="Search visits, customers, technicians..."
                      class="w-full"
                      @input="handleSearch"
                    />
                  </div>
                </div>

                <!-- Date Range Filter -->
                <div>
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Date Range
                  </label>
                  <DatePicker 
                    v-model="selectedDateRange"
                    selection-mode="range"
                    :show-icon="true"
                    placeholder="Select date range"
                    class="w-full"
                    @date-select="applyFilters"
                  />
                </div>

                <!-- Status Filter -->
                <div>
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Status
                  </label>
                  <MultiSelect 
                    v-model="selectedStatuses"
                    :options="statusOptions"
                    option-label="label"
                    option-value="value"
                    placeholder="All Statuses"
                    class="w-full"
                    display="chip"
                    @change="applyFilters"
                  />
                </div>

                <!-- Customer Filter -->
                <div>
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Customers
                  </label>
                  <MultiSelect 
                    v-model="selectedCustomers"
                    :options="customerOptions"
                    option-label="name"
                    option-value="id"
                    placeholder="All Customers"
                    class="w-full"
                    display="chip"
                    :loading="customerStore.loading"
                    @change="applyFilters"
                  />
                </div>

                <!-- Visit Type Filter -->
                <div>
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Visit Type
                  </label>
                  <Select 
                    v-model="selectedVisitType"
                    :options="visitTypeOptions"
                    option-label="label"
                    option-value="value"
                    placeholder="All Types"
                    class="w-full"
                    show-clear
                    @change="applyFilters"
                  />
                </div>
              </div>

              <!-- Quick Filter Chips -->
              <div class="flex flex-wrap gap-2 mt-4">
                <Chip 
                  v-for="quickFilter in quickFilters"
                  :key="quickFilter.id"
                  :label="quickFilter.label"
                  :class="{ 'p-chip-outlined': !quickFilter.active }"
                  @click="toggleQuickFilter(quickFilter)"
                  removable
                  class="cursor-pointer"
                />
              </div>
              
              <!-- Debug Info -->
              <div class="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900 rounded text-sm border border-yellow-300">
                <strong>🐛 Debug Info:</strong><br>
                Store visits: {{ visits?.length || 0 }} | 
                Filtered visits: {{ filteredVisits?.length || 0 }} | 
                Loading: {{ loading }} | 
                Date range: {{ selectedDateRange?.[0]?.toISOString()?.split('T')[0] }} to {{ selectedDateRange?.[1]?.toISOString()?.split('T')[0] }}
              </div>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
    </div>

    <!-- Main Content Tabs -->
    <div class="bg-white dark:bg-surface-900 rounded-lg shadow-sm border border-surface-200 dark:border-surface-700">
      <Tabs v-model:value="activeTabIndex" class="visit-tabs">
        <TabList>
          <Tab value="0">Visits List</Tab>
          <Tab value="1">Analytics</Tab>
          <Tab value="2">Timeline</Tab>
        </TabList>
        
        <TabPanels>
          <!-- Visits List Tab -->
          <TabPanel value="0">
          <div class="p-6">
            <!-- List Controls -->
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <span class="text-sm text-surface-600 dark:text-surface-300">
                  {{ filteredVisits.length }} of {{ totalVisits }} visits
                </span>
                <div class="flex items-center gap-2">
                  <Button 
                    icon="pi pi-list" 
                    :class="{ 'p-button-filled': viewMode === 'list' }"
                    @click="viewMode = 'list'"
                    text
                    rounded
                  />
                  <Button 
                    icon="pi pi-th-large" 
                    :class="{ 'p-button-filled': viewMode === 'cards' }"
                    @click="viewMode = 'cards'"
                    text
                    rounded
                  />
                </div>
              </div>
              
              <div class="flex items-center gap-2">
                <Button 
                  icon="pi pi-download" 
                  label="Export" 
                  @click="exportVisits"
                  outlined
                  size="small"
                />
                <MultiSelect 
                  v-model="selectedVisitsForBatch"
                  :options="filteredVisits"
                  option-label="id"
                  option-value="id"
                  placeholder="Batch Actions"
                  display="chip"
                  class="w-48"
                  v-if="filteredVisits.length > 0"
                />
              </div>
            </div>

            <!-- Data Table View -->
            <DataTable 
              v-if="viewMode === 'list'"
              :value="filteredVisits"
              v-model:selection="selectedVisits"
              :loading="loading"
              paginator
              :rows="25"
              :rows-per-page-options="[10, 25, 50, 100]"
              sort-mode="multiple"
              removable-sort
              class="p-datatable-sm"
              responsive-layout="scroll"
              current-page-report-template="Showing {first} to {last} of {totalRecords} visits"
              paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            >
              <Column selection-mode="multiple" header-style="width: 3rem"></Column>
              
              <Column field="id" header="Visit ID" sortable style="min-width: 10rem">
                <template #body="{ data }">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-primary-600">{{ data.externalId || data.id }}</span>
                    <Button 
                      icon="pi pi-external-link" 
                      @click="openVisitDetail(data)"
                      text
                      rounded
                      size="small"
                    />
                  </div>
                </template>
              </Column>

              <Column field="customer.name" header="Customer" sortable style="min-width: 12rem">
                <template #body="{ data }">
                  <div class="flex items-center gap-2">
                    <Avatar 
                      :label="data.customer?.name?.charAt(0)" 
                      class="mr-2" 
                      size="small"
                      style="background-color: #3B82F6; color: white"
                    />
                    <span>{{ data.customer?.name || 'N/A' }}</span>
                  </div>
                </template>
              </Column>

              <Column field="serviceDate" header="Service Date" sortable style="min-width: 10rem">
                <template #body="{ data }">
                  <div class="flex flex-col">
                    <span class="font-medium">{{ formatDate(data.serviceDate) }}</span>
                    <span class="text-xs text-surface-500">{{ formatTime(data.serviceDate) }}</span>
                  </div>
                </template>
              </Column>

              <Column field="status" header="Status" sortable style="min-width: 8rem">
                <template #body="{ data }">
                  <Tag 
                    :value="getStatusLabel(data.status)" 
                    :severity="getStatusSeverity(data.status)"
                  />
                </template>
              </Column>

              <Column field="visitType" header="Type" sortable style="min-width: 8rem">
                <template #body="{ data }">
                  <Chip 
                    :label="data.visitType" 
                    :icon="getVisitTypeIcon(data.visitType)"
                  />
                </template>
              </Column>

              <Column field="technicians" header="Technicians" style="min-width: 12rem">
                <template #body="{ data }">
                  <div class="flex items-center gap-1">
                    <Avatar 
                      v-for="tech in data.technicians.slice(0, 3)"
                      :key="tech.id"
                      :label="tech.name?.charAt(0)"
                      size="small"
                      class="mr-1"
                    />
                    <span v-if="data.technicians.length > 3" class="text-xs text-surface-500">
                      +{{ data.technicians.length - 3 }}
                    </span>
                  </div>
                </template>
              </Column>

              <Column field="aiInsights.qualityRating" header="Quality" sortable style="min-width: 8rem">
                <template #body="{ data }">
                  <div class="flex items-center gap-2">
                    <Rating 
                      :model-value="data.aiInsights?.qualityRating || 0" 
                      :readonly="true" 
                      :stars="5"
                    />
                    <span class="text-sm">{{ (data.aiInsights?.qualityRating || 0).toFixed(1) }}</span>
                  </div>
                </template>
              </Column>

              <Column field="revenue" header="Revenue" sortable style="min-width: 8rem">
                <template #body="{ data }">
                  <span class="font-semibold text-green-600">
                    {{ formatCurrency(data.revenue || 0) }}
                  </span>
                </template>
              </Column>

              <Column header="Actions" style="min-width: 8rem">
                <template #body="{ data }">
                  <div class="flex gap-1">
                    <Button 
                      icon="pi pi-eye" 
                      @click="openVisitDetail(data)"
                      text
                      rounded
                      size="small"
                      v-tooltip.top="'View Details'"
                    />
                    <Button 
                      icon="pi pi-pencil" 
                      @click="editVisit(data)"
                      text
                      rounded
                      size="small"
                      v-tooltip.top="'Edit Visit'"
                    />
                    <Button 
                      icon="pi pi-cog" 
                      @click="showVisitActions(data)"
                      text
                      rounded
                      size="small"
                      v-tooltip.top="'More Actions'"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>

            <!-- Card View -->
            <div v-else-if="viewMode === 'cards'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <Card 
                v-for="visit in paginatedVisits"
                :key="visit.id"
                class="visit-card hover:shadow-lg transition-shadow cursor-pointer"
                @click="openVisitDetail(visit)"
              >
                <template #header>
                  <div class="p-4 pb-0">
                    <div class="flex items-center justify-between mb-2">
                      <span class="font-semibold text-primary-600">{{ visit.externalId || visit.id }}</span>
                      <Tag 
                        :value="getStatusLabel(visit.status)" 
                        :severity="getStatusSeverity(visit.status)"
                        size="small"
                      />
                    </div>
                    <div class="flex items-center gap-2">
                      <Avatar 
                        :label="visit.customer?.name?.charAt(0)" 
                        size="small"
                        style="background-color: #3B82F6; color: white"
                      />
                      <span class="text-sm font-medium">{{ visit.customer?.name || 'N/A' }}</span>
                    </div>
                  </div>
                </template>
                
                <template #content>
                  <div class="px-4 pb-4">
                    <div class="space-y-2 text-sm">
                      <div class="flex items-center gap-2">
                        <i class="pi pi-calendar text-surface-400"></i>
                        <span>{{ formatDate(visit.serviceDate) }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <i class="pi pi-tag text-surface-400"></i>
                        <span>{{ visit.visitType }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <i class="pi pi-users text-surface-400"></i>
                        <span>{{ visit.technicians.length }} technician(s)</span>
                      </div>
                      <div class="flex items-center justify-between pt-2 border-t border-surface-200">
                        <div class="flex items-center gap-1">
                          <Rating 
                            :model-value="visit.aiInsights?.qualityRating || 0" 
                            :readonly="true" 
                            :stars="5"
                            size="small"
                          />
                        </div>
                        <span class="font-semibold text-green-600">
                          {{ formatCurrency(visit.revenue || 0) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </template>
              </Card>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="flex items-center justify-center py-8">
              <ProgressSpinner />
            </div>

            <!-- Empty State -->
            <div v-else-if="filteredVisits.length === 0" class="text-center py-8">
              <i class="pi pi-calendar-times text-6xl text-surface-300 mb-4"></i>
              <h3 class="text-lg font-semibold text-surface-500 mb-2">No visits found</h3>
              <p class="text-surface-400 mb-4">Try adjusting your filters or create a new visit</p>
              <Button 
                icon="pi pi-plus" 
                label="Create Visit" 
                @click="showCreateVisitDialog = true"
              />
            </div>
          </div>
          </TabPanel>

          <!-- Analytics Dashboard Tab -->
          <TabPanel value="1">
            <div class="p-6">
              <VisitAnalyticsDashboard 
                :visit-stats="visitStats"
                :loading="loading"
                @refresh="refreshData"
              />
            </div>
          </TabPanel>

          <!-- Timeline View Tab -->
          <TabPanel value="2">
            <div class="p-6">
              <VisitTimelineView 
                :timeline="visitTimeline"
                :loading="timelineLoading"
                @add-event="handleAddTimelineEvent"
              />
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>

    <!-- Visit Detail Dialog -->
    <Dialog 
      v-model:visible="showVisitDetail" 
      :modal="true" 
      :style="{ width: '80vw', maxWidth: '1200px' }"
      :maximizable="true"
      class="visit-detail-dialog"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <Tag 
            :value="getStatusLabel(selectedVisitForDetail?.status)" 
            :severity="getStatusSeverity(selectedVisitForDetail?.status)"
          />
          <span class="font-semibold">{{ selectedVisitForDetail?.externalId || selectedVisitForDetail?.id }}</span>
          <span class="text-surface-500">{{ selectedVisitForDetail?.customer?.name }}</span>
        </div>
      </template>
      
      <VisitDetailPanel 
        v-if="selectedVisitForDetail"
        :visit="selectedVisitForDetail"
        @status-updated="handleStatusUpdate"
        @close="closeVisitDetail"
      />
    </Dialog>

    <!-- Create Visit Dialog -->
    <Dialog 
      v-model:visible="showCreateVisitDialog" 
      :modal="true" 
      :style="{ width: '600px' }"
      header="Create New Visit"
    >
      <CreateVisitForm 
        @visit-created="handleVisitCreated"
        @cancel="showCreateVisitDialog = false"
      />
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, useId } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';
import { useVisitsStore } from '@/stores/visitsStore';
import { useCustomerStore } from '@/stores/customerStore';
import StatsCard from '@/components/field-services/StatsCard.vue';
import VisitAnalyticsDashboard from '@/components/field-services/VisitAnalyticsDashboard.vue';
import VisitTimelineView from '@/components/field-services/VisitTimelineView.vue';
import VisitDetailPanel from '@/components/field-services/VisitDetailPanel.vue';
import CreateVisitForm from '@/components/field-services/CreateVisitForm.vue';

// Vue 3.5 features
const titleId = useId();

// Store instances
const router = useRouter();
const visitsStore = useVisitsStore();
const customerStore = useCustomerStore();
const toast = useToast();

// Reactive computed properties from store (properly reactive)
const visits = computed(() => visitsStore.visits);
const filteredVisits = computed(() => visitsStore.filteredVisits);
const visitStats = computed(() => visitsStore.visitStats);
const visitTimeline = computed(() => visitsStore.visitTimeline);
const loading = computed(() => visitsStore.loading);
const timelineLoading = computed(() => visitsStore.timelineLoading);
const error = computed(() => visitsStore.error);
const totalVisits = computed(() => visitsStore.totalVisits);

// Set default date range to last 30 days
const getDefaultDateRange = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);
  return [startDate, endDate];
};

// Local component state
const activeTabIndex = ref("0");
const viewMode = ref('list');
const searchQuery = ref('');
const selectedDateRange = ref(getDefaultDateRange());
const selectedStatuses = ref([]);
const selectedCustomers = ref([]);
const selectedVisitType = ref(null);
const selectedVisits = ref([]);
const selectedVisitsForBatch = ref([]);
const showVisitDetail = ref(false);
const showCreateVisitDialog = ref(false);
const selectedVisitForDetail = ref(null);

// Accordion state (null means closed by default)
const filtersAccordionValue = ref(null);

// Get trend data from store
const visitStatsTrend = computed(() => visitsStore.visitTrends || {});

// Computed properties
const customerOptions = computed(() => customerStore.customers);

const statusOptions = ref([
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Failed', value: 'failed' }
]);

const visitTypeOptions = ref([
  { label: 'Installation', value: 'installation' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Repair', value: 'repair' },
  { label: 'Inspection', value: 'inspection' },
  { label: 'Emergency', value: 'emergency' }
]);

const quickFilters = ref([
  { id: 'high-priority', label: 'High Priority', active: false },
  { id: 'overdue', label: 'Overdue', active: false },
  { id: 'incomplete', label: 'Incomplete', active: false },
  { id: 'high-value', label: 'High Value', active: false }
]);

const paginatedVisits = computed(() => {
  // For card view, implement simple pagination
  return filteredVisits.value?.slice(0, 50) || []; // Show first 50 for performance
});

// Methods
async function refreshData() {
  try {
    // Build API parameters from current filters
    const apiParams = {};
    
    // Add date range if selected
    if (selectedDateRange.value && selectedDateRange.value.length === 2) {
      apiParams.start_date = selectedDateRange.value[0].toISOString().split('T')[0];
      apiParams.end_date = selectedDateRange.value[1].toISOString().split('T')[0];
    }
    
    // Add status filters if selected
    if (selectedStatuses.value.length > 0) {
      apiParams.status = selectedStatuses.value.join(',');
    }
    
    // Add customer filters if selected
    if (selectedCustomers.value.length > 0) {
      apiParams.customer_ids = selectedCustomers.value.join(',');
    }
    
    // Add visit type filter if selected
    if (selectedVisitType.value) {
      apiParams.visit_type = selectedVisitType.value;
    }
    
    console.log('Refreshing data with API parameters:', apiParams);
    
    await Promise.all([
      visitsStore.fetchVisits(apiParams),
      visitsStore.fetchVisitStats(apiParams),
      customerStore.fetchCustomers()
    ]);
    
    toast.add({
      severity: 'success',
      summary: 'Data Refreshed',
      detail: 'Visit data has been updated successfully',
      life: 3000
    });
  } catch (error) {
    console.error('Error refreshing data:', error);
    toast.add({
      severity: 'error',
      summary: 'Refresh Failed',
      detail: 'Failed to refresh visit data',
      life: 5000
    });
  }
}

async function applyFilters() {
  // Update store filters for local filtering
  visitsStore.updateFilters({
    dateRange: selectedDateRange.value,
    status: selectedStatuses.value,
    customers: selectedCustomers.value.map(id => ({ id })),
    visitType: selectedVisitType.value
  });
  
  // Also refresh data from API with new filters
  await refreshData();
}

async function clearAllFilters() {
  selectedDateRange.value = getDefaultDateRange(); // Reset to default 30 days
  selectedStatuses.value = [];
  selectedCustomers.value = [];
  selectedVisitType.value = null;
  quickFilters.value.forEach(filter => filter.active = false);
  visitsStore.resetFilters();
  
  // Refresh data with cleared filters
  await refreshData();
}

function handleSearch() {
  // Implement search logic
  console.log('Searching for:', searchQuery.value);
}

function toggleQuickFilter(filter) {
  filter.active = !filter.active;
  // Implement quick filter logic based on filter.id
  console.log('Quick filter toggled:', filter);
}

function openVisitDetail(visit) {
  // Navigate to the dedicated visit detail page
  router.push(`/field-services/visit/${visit.id}`);
}

function closeVisitDetail() {
  showVisitDetail.value = false;
  selectedVisitForDetail.value = null;
}

function editVisit(visit) {
  console.log('Edit visit:', visit);
  // Implement edit functionality
}

function showVisitActions(visit) {
  console.log('Show actions for visit:', visit);
  // Implement actions menu
}

function exportVisits() {
  console.log('Export visits');
  // Implement export functionality
}

function handleStatusUpdate(visitId, newStatus) {
  visitsStore.updateVisitStatus(visitId, newStatus);
  toast.add({
    severity: 'success',
    summary: 'Status Updated',
    detail: `Visit status changed to ${newStatus}`,
    life: 3000
  });
}

function handleVisitCreated(newVisit) {
  showCreateVisitDialog.value = false;
  refreshData();
  toast.add({
    severity: 'success',
    summary: 'Visit Created',
    detail: 'New visit has been created successfully',
    life: 3000
  });
}

function handleAddTimelineEvent(event) {
  console.log('Add timeline event:', event);
  // Implement timeline event addition
}

// Utility functions
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(dateString));
}

function formatTime(dateString) {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString));
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
}

function getStatusLabel(status) {
  const statusMap = {
    scheduled: 'Scheduled',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    failed: 'Failed'
  };
  return statusMap[status] || status;
}

function getStatusSeverity(status) {
  const severityMap = {
    scheduled: 'info',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'secondary',
    failed: 'danger'
  };
  return severityMap[status] || 'secondary';
}

function getVisitTypeIcon(type) {
  const iconMap = {
    installation: 'pi pi-cog',
    maintenance: 'pi pi-wrench',
    repair: 'pi pi-hammer',
    inspection: 'pi pi-eye',
    emergency: 'pi pi-exclamation-triangle'
  };
  return iconMap[type] || 'pi pi-calendar';
}

// Lifecycle
onMounted(async () => {
  await refreshData();
});

// Watch for errors
watch(error, (newError) => {
  if (newError) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: newError,
      life: 5000
    });
  }
});
</script>

<style scoped>
.visit-details-page {
  max-width: 100%;
}

.visit-card {
  border: 1px solid var(--surface-border);
  transition: all 0.3s ease;
}

.visit-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.visit-tabs .p-tabview-nav {
  background: transparent;
  border-bottom: 1px solid var(--surface-border);
}

.visit-detail-dialog .p-dialog-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--surface-border);
}

.p-datatable-sm .p-datatable-tbody > tr > td {
  padding: 0.75rem;
}

.p-chip {
  background: var(--primary-100);
  color: var(--primary-700);
}

.p-rating .p-rating-icon {
  color: var(--yellow-500);
}

.filters-accordion .p-accordion-header {
  border: none;
  background: transparent;
}

.filters-accordion .p-accordion-content {
  border: none;
  background: transparent;
  padding: 0;
}
</style> 