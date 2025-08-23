<template>
  <div class="locations-list p-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-2">Audit Locations</h1>
        <p class="text-surface-600 dark:text-surface-400 mb-1">
          Customer {{ customerId }} • {{ locationsStore.totalLocations }} locations
        </p>
        <div class="text-sm text-surface-500 dark:text-surface-400">
          Customer ID: <span class="font-medium">{{ customerId }}</span>
        </div>
      </div>
      
      <div class="flex gap-2 mt-4 md:mt-0">
        <Button 
          label="Back to Dashboard" 
          icon="pi pi-arrow-left" 
          outlined
          @click="goToDashboard"
        />
        <Button 
          label="Export List" 
          icon="pi pi-download" 
          outlined
        />
      </div>
    </div>

    <!-- Key Metrics Summary -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <Card class="shadow-sm text-center">
        <template #content>
          <div class="p-4">
            <div class="text-surface-500 dark:text-surface-400 font-medium text-base mb-2">Total</div>
            <div class="text-surface-900 dark:text-surface-0 font-semibold text-3xl mb-1">{{ summaryStats.total }}</div>
            <div class="text-blue-500 text-base font-medium">
              <i class="pi pi-building mr-1"></i>
              All locations
            </div>
          </div>
        </template>
      </Card>
      
      <Card class="shadow-sm text-center">
        <template #content>
          <div class="p-4">
            <div class="text-surface-500 dark:text-surface-400 font-medium text-base mb-2">Pending</div>
            <div class="text-surface-900 dark:text-surface-0 font-semibold text-3xl mb-1">{{ summaryStats.pending }}</div>
            <div class="text-gray-500 text-base font-medium">
              <i class="pi pi-clock mr-1"></i>
              Not started
            </div>
          </div>
        </template>
      </Card>
      
      <Card class="shadow-sm text-center">
        <template #content>
          <div class="p-4">
            <div class="text-surface-500 dark:text-surface-400 font-medium text-base mb-2">In Progress</div>
            <div class="text-surface-900 dark:text-surface-0 font-semibold text-3xl mb-1">{{ summaryStats.inProgress }}</div>
            <div class="text-orange-500 text-base font-medium">
              <i class="pi pi-spin pi-spinner mr-1"></i>
              Scanning
            </div>
          </div>
        </template>
      </Card>
      
      <Card class="shadow-sm text-center">
        <template #content>
          <div class="p-4">
            <div class="text-surface-500 dark:text-surface-400 font-medium text-base mb-2">Completed</div>
            <div class="text-surface-900 dark:text-surface-0 font-semibold text-3xl mb-1">{{ summaryStats.completed }}</div>
            <div class="text-green-500 text-base font-medium">
              <i class="pi pi-check-circle mr-1"></i>
              Validated
            </div>
          </div>
        </template>
      </Card>
      
      <Card class="shadow-sm text-center">
        <template #content>
          <div class="p-4">
            <div class="text-surface-500 dark:text-surface-400 font-medium text-base mb-2">With Issues</div>
            <div class="text-surface-900 dark:text-surface-0 font-semibold text-3xl mb-1">{{ summaryStats.withIssues }}</div>
            <div class="text-red-500 text-base font-medium">
              <i class="pi pi-exclamation-triangle mr-1"></i>
              Need attention
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Search & Filters Toolbar -->
    <Card class="shadow-sm mb-6">
      <template #header>
        <div class="p-6 pb-0">
          <h3 class="text-2xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Search & Filter</h3>
          <p class="text-surface-600 dark:text-surface-400 text-base">Find specific locations using search and filter criteria</p>
        </div>
      </template>
      <template #content>
        <div class="flex flex-wrap gap-4 items-center">
          <!-- Search -->
          <div class="flex-1 min-w-64">
            <label class="block text-base font-medium text-surface-700 dark:text-surface-300 mb-2">Search Locations</label>
            <IconField iconPosition="left">
              <InputIcon class="pi pi-search" />
              <InputText 
                v-model="searchQuery" 
                placeholder="Search by name, site number, city..."
                class="w-full"
                @input="onSearchChange"
              />
            </IconField>
          </div>
          
          <!-- Status Filter -->
          <div class="w-48">
            <label class="block text-base font-medium text-surface-700 dark:text-surface-300 mb-2">Status Filter</label>
            <Select 
              v-model="statusFilter" 
              :options="statusOptions"
              option-label="label"
              option-value="value"
              placeholder="All statuses"
              class="w-full"
              @change="onFilterChange"
              :showClear="true"
            />
          </div>
          
          <!-- Sort Options -->
          <div class="w-56">
            <label class="block text-base font-medium text-surface-700 dark:text-surface-300 mb-2">Sort By</label>
            <Select 
              v-model="sortOption" 
              :options="sortOptions"
              option-label="label"
              option-value="value"
              placeholder="Default sorting"
              class="w-full"
              @change="onSortChange"
            />
          </div>
          
          <!-- Actions -->
          <div class="flex flex-col gap-2 pt-6">
            <Button 
              label="Refresh"
              icon="pi pi-refresh" 
              outlined
              @click="refreshData"
              :loading="locationsStore.loading"
              class="w-full"
            />
            
            <Button 
              label="Clear Filters"
              icon="pi pi-filter-slash" 
              outlined
              @click="clearAllFilters"
              :disabled="!hasActiveFilters"
              class="w-full"
            />
          </div>
        </div>
        
        <!-- Active Filters Display -->
        <div v-if="locationsStore.activeFilters && locationsStore.activeFilters.length > 0" class="mt-6 p-4 bg-gray-50 dark:bg-gray-900/20 rounded">
          <div class="flex flex-wrap gap-2 items-center">
            <span class="text-base font-medium text-surface-700 dark:text-surface-300">Active filters:</span>
            <Tag 
              v-for="filter in locationsStore.activeFilters" 
              :key="filter" 
              :value="filter" 
              severity="info"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Data Table -->
    <Card class="shadow-sm">
      <template #header>
        <div class="p-6 pb-0">
          <h3 class="text-2xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Location Details</h3>
          <p class="text-surface-600 dark:text-surface-400 text-base">Comprehensive audit status and progress tracking</p>
        </div>
      </template>
      <template #content>
        <DataTable 
          :value="locationsStore.locationsWithStatus" 
          :loading="locationsStore.loading"
          lazy
          paginator
          :rows="locationsStore.pageSize"
          :total-records="locationsStore.totalLocations"
          :first="locationsStore.currentPage * locationsStore.pageSize"
          @page="onPageChange"
          @row-click="onRowClick"
          class="locations-table"
          :row-hover="true"
          :paginator-template="paginatorTemplate"
          :rows-per-page-options="[25, 50, 100]"
          @rows-per-page-change="onPageSizeChange"
          responsiveLayout="scroll"
          stripedRows
        >
          <Column field="location_name" header="Location" sortable :style="{ minWidth: '250px' }">
            <template #body="{ data }">
              <div>
                <div class="font-medium text-surface-900 dark:text-surface-0">{{ data.location_name }}</div>
                <div class="text-sm text-surface-500 dark:text-surface-400">
                  {{ data.site_number }} • {{ data.city }}, {{ data.state }}
                </div>
              </div>
            </template>
          </Column>

          <Column field="total_assets" header="Assets" sortable class="text-center" :style="{ width: '100px' }">
            <template #body="{ data }">
              <Badge 
                :value="data.total_assets || 0" 
                :severity="(data.total_assets || 0) > 0 ? 'success' : 'secondary'" 
              />
            </template>
          </Column>

          <Column field="total_monthly_cost" header="Monthly Cost" sortable :style="{ width: '120px' }">
            <template #body="{ data }">
              <div class="text-right font-medium">
                ${{ formatCurrency(data.total_monthly_cost || 0) }}
              </div>
            </template>
          </Column>

          <Column header="Signatures" :style="{ width: '300px' }">
            <template #body="{ data }">
              <div class="space-y-1">
                <div>
                  <Tag 
                    :value="truncateSignature(data.asset_signature)" 
                    severity="success" 
                    class="text-xs"
                    v-tooltip="data.asset_signature || 'No asset signature'"
                  />
                </div>
                <div>
                  <Tag 
                    :value="truncateSignature(data.charge_signature)" 
                    severity="warning" 
                    class="text-xs"
                    v-tooltip="data.charge_signature || 'No charge signature'"
                  />
                </div>
              </div>
            </template>
          </Column>

          <Column field="audit_status" header="Status" :style="{ width: '120px' }">
            <template #body="{ data }">
              <Tag 
                :value="getStatusLabel(data.audit_status)" 
                :severity="getStatusSeverity(data.audit_status)"
              />
            </template>
          </Column>

          <Column field="issues_count" header="Issues" :style="{ width: '80px' }">
            <template #body="{ data }">
              <Badge 
                v-if="data.issues_count > 0"
                :value="data.issues_count" 
                severity="danger" 
              />
              <span v-else class="text-gray-400 text-sm">None</span>
            </template>
          </Column>

          <Column field="last_audited_at" header="Last Audited" :style="{ width: '140px' }">
            <template #body="{ data }">
              <div class="text-sm">
                {{ formatDate(data.last_audited_at) }}
              </div>
            </template>
          </Column>

          <Column header="Actions" :style="{ width: '160px' }">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button 
                  icon="pi pi-eye" 
                  severity="success" 
                  size="small"
                  @click.stop="viewLocation(data)"
                  v-tooltip="'Open Workbench'"
                />
                <Button 
                  icon="pi pi-refresh" 
                  severity="warning" 
                  size="small"
                  @click.stop="rescanLocation(data)"
                  :loading="data.rescanning"
                  v-tooltip="'Rescan Location'"
                />
                <Button 
                  icon="pi pi-plus" 
                  severity="secondary" 
                  size="small"
                  @click.stop="addIssue(data)"
                  v-tooltip="'Add Issue'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Add Issue Dialog -->
    <Dialog 
      v-model:visible="showAddIssueDialog" 
      header="Add Issue"
      :modal="true"
      class="w-[500px]"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Location</label>
          <div class="p-3 bg-gray-50 rounded border">
            <div class="font-medium">{{ selectedLocation?.name }}</div>
            <div class="text-sm text-gray-600">{{ selectedLocation?.site_number }}</div>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">Issue Type</label>
          <Select 
            v-model="newIssue.type" 
            :options="issueTypeOptions"
            option-label="label"
            option-value="value"
            placeholder="Select issue type"
            class="w-full"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">Severity</label>
          <Select 
            v-model="newIssue.severity" 
            :options="severityOptions"
            option-label="label"
            option-value="value"
            placeholder="Select severity"
            class="w-full"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">Title</label>
          <InputText 
            v-model="newIssue.title" 
            placeholder="Brief description of the issue"
            class="w-full" 
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">Description</label>
          <Textarea 
            v-model="newIssue.description" 
            rows="4" 
            placeholder="Detailed description of the issue"
            class="w-full" 
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">Assigned To</label>
          <InputText 
            v-model="newIssue.assignee" 
            placeholder="Person responsible for this issue"
            class="w-full" 
          />
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-3">
          <Button 
            label="Cancel" 
            severity="secondary" 
            @click="showAddIssueDialog = false" 
          />
          <Button 
            label="Create Issue" 
            severity="primary" 
            @click="createIssue"
            :loading="creatingIssue"
            :disabled="!isIssueFormValid"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useLocationsStore } from '@/stores/locationsStore';
// import QueueMonitor from '@/components/audit-workbench/QueueMonitor.vue';

const router = useRouter();
const toast = useToast();
const locationsStore = useLocationsStore();

// Component state
const searchQuery = ref('');
const statusFilter = ref('');
const sortOption = ref('location_name_asc');
const showAddIssueDialog = ref(false);
const selectedLocation = ref(null);
const creatingIssue = ref(false);

// New issue form
const newIssue = ref({
  type: '',
  severity: '',
  title: '',
  description: '',
  assignee: ''
});

// Options
const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Awaiting Validation', value: 'awaiting_validation' },
  { label: 'Completed', value: 'completed' }
];

const sortOptions = [
  { label: 'Location Name (A-Z)', value: 'location_name_asc' },
  { label: 'Location Name (Z-A)', value: 'location_name_desc' },
  { label: 'Last Audited (Newest)', value: 'last_audited_desc' },
  { label: 'Last Audited (Oldest)', value: 'last_audited_asc' },
  { label: 'Total Cost (High-Low)', value: 'total_cost_desc' },
  { label: 'Total Cost (Low-High)', value: 'total_cost_asc' }
];

const issueTypeOptions = [
  { label: 'Asset Mismatch', value: 'asset_mismatch' },
  { label: 'Charge Mismatch', value: 'charge_mismatch' },
  { label: 'Missing Assets', value: 'missing_assets' },
  { label: 'Missing Charges', value: 'missing_charges' },
  { label: 'Configuration Error', value: 'configuration_error' },
  { label: 'Data Quality Issue', value: 'data_quality' },
  { label: 'Access Issue', value: 'access_issue' },
  { label: 'Other', value: 'other' }
];

const severityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' }
];

// Paginator template
const paginatorTemplate = 'RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink';

// Computed properties
const customerId = computed(() => router.currentRoute.value.params.customerId);

const summaryStats = computed(() => locationsStore.getSummaryStats());

const hasActiveFilters = computed(() => 
  searchQuery.value.length > 0 || statusFilter.value.length > 0
);

const isIssueFormValid = computed(() => 
  newIssue.value.type && 
  newIssue.value.severity && 
  newIssue.value.title.trim().length > 0
);

// Methods

const loadLocations = async (forceRefresh = false) => {
  try {
    await locationsStore.loadLocations(customerId.value, forceRefresh);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Failed to Load Locations',
      detail: error.response?.data?.message || 'Unable to load location data'
    });
  }
};

const onSearchChange = async () => {
  await locationsStore.updateFilters(customerId.value, {
    search: searchQuery.value,
    status: statusFilter.value
  });
};

const onFilterChange = async () => {
  await locationsStore.updateFilters(customerId.value, {
    search: searchQuery.value,
    status: statusFilter.value
  });
};

const onSortChange = async () => {
  const [field, order] = sortOption.value.split('_');
  await locationsStore.updateSort(customerId.value, { field, order });
};

const onPageChange = async (event) => {
  await locationsStore.goToPage(customerId.value, event.page);
};

const onPageSizeChange = async (event) => {
  await locationsStore.setPageSize(customerId.value, event.rows);
};

const clearAllFilters = async () => {
  searchQuery.value = '';
  statusFilter.value = '';
  await locationsStore.clearFilters(customerId.value);
};

const refreshData = async () => {
  await loadLocations(true);
  toast.add({
    severity: 'success',
    summary: 'Data Refreshed',
    detail: 'Location data has been refreshed'
  });
};

const onRowClick = (event) => {
  viewLocation(event.data);
};

const viewLocation = (location) => {
  router.push({
    name: 'LocationWorkbench',
    params: {
      customerId: customerId.value,
      locationId: location.location_id
    }
  });
};

const rescanLocation = async (location) => {
  location.rescanning = true;
  
  try {
    await locationsStore.rescanLocation(customerId.value, location.location_id);
    
    toast.add({
      severity: 'success',
      summary: 'Rescan Initiated',
      detail: `Rescan started for ${location.location_name}`
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Rescan Failed',
      detail: error.response?.data?.message || 'Failed to initiate rescan'
    });
  } finally {
    location.rescanning = false;
  }
};

const addIssue = (location) => {
  selectedLocation.value = location;
  newIssue.value = {
    type: '',
    severity: '',
    title: '',
    description: '',
    assignee: ''
  };
  showAddIssueDialog.value = true;
};

const createIssue = async () => {
  if (!isIssueFormValid.value) return;
  
  creatingIssue.value = true;
  
  try {
    await locationsStore.createLocationIssue(
      customerId.value, 
      selectedLocation.value.location_id, 
      newIssue.value
    );
    
    toast.add({
      severity: 'success',
      summary: 'Issue Created',
      detail: `Issue "${newIssue.value.title}" has been created for ${selectedLocation.value.location_name}`
    });
    
    showAddIssueDialog.value = false;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Failed to Create Issue',
      detail: error.response?.data?.message || 'Unknown error occurred'
    });
  } finally {
    creatingIssue.value = false;
  }
};

const goToDashboard = () => {
  router.push({
    name: 'AuditDashboard',
    params: { customerId: customerId.value }
  });
};

// Utility methods
const getStatusSeverity = (status) => {
  const severityMap = {
    pending: 'secondary',
    in_progress: 'info',
    awaiting_validation: 'warning',
    completed: 'success'
  };
  return severityMap[status] || 'secondary';
};

const getStatusLabel = (status) => {
  const labelMap = {
    pending: 'Pending',
    in_progress: 'In Progress',
    awaiting_validation: 'Awaiting Validation',
    completed: 'Completed'
  };
  return labelMap[status] || 'Unknown';
};

const formatDate = (dateString) => {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString();
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const truncateSignature = (signature) => {
  if (!signature) return 'None';
  return signature.length > 20 ? `${signature.substring(0, 20)}...` : signature;
};

// Watch for route changes
watch(() => router.currentRoute.value.params.customerId, async (newCustomerId) => {
  if (newCustomerId) {
    // Clear previous data and load new
    locationsStore.clearData();
    await loadLocations();
  }
}, { immediate: true });

// Lifecycle
onMounted(async () => {
  const routeCustomerId = customerId.value;
  if (routeCustomerId) {
    await loadLocations();
  }
});
</script>

<style scoped>
.locations-list {
  max-width: 1600px;
  margin: 0 auto;
}

.locations-table :deep(.p-datatable-tbody > tr) {
  cursor: pointer;
  transition: background-color 0.2s;
}

.locations-table :deep(.p-datatable-tbody > tr:hover) {
  background-color: var(--surface-hover);
}

/* Enhanced DataTable styling */
.locations-table :deep(.p-datatable .p-datatable-thead > tr > th) {
  background-color: #f9fafb;
  color: #374151;
  font-weight: 600;
  padding: 0.75rem;
  border-width: 0 0 1px 0;
}

.locations-table :deep(.dark .p-datatable .p-datatable-thead > tr > th) {
  background-color: #1f2937;
  color: #e5e7eb;
}

.locations-table :deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.75rem;
  border-width: 0 0 1px 0;
}

@media (max-width: 768px) {
  .locations-list {
    padding: 1rem;
  }
}
</style>
