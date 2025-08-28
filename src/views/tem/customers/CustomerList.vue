<template>
  <div class="tem-customer-list">
    <!-- Page Header - Clean, no card wrapper -->
    <div class="page-header">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <h1 class="page-title">TEM Customers</h1>
          <p class="page-subtitle">Manage telecom expense management customers</p>
        </div>
        <div class="flex items-center gap-3">
          <Button 
            icon="pi pi-refresh" 
            label="Refresh"
            outlined 
            @click="loadCustomers"
            :loading="customerStore.isLoading"
          />
        </div>
      </div>
    </div>



    <!-- Summary Cards - Modern with hover effects -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ totalCustomers }}</div>
          <div class="stat-label">Total Customers</div>
        </div>
        <div class="stat-icon stat-icon-blue">
          <i class="pi pi-building"></i>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ activeCustomers }}</div>
          <div class="stat-label">Active Accounts</div>
        </div>
        <div class="stat-icon stat-icon-green">
          <i class="pi pi-check-circle"></i>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ totalMonthlySpend }}</div>
          <div class="stat-label">Monthly Expected</div>
        </div>
        <div class="stat-icon stat-icon-orange">
          <i class="pi pi-dollar"></i>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ customersWithIssues }}</div>
          <div class="stat-label">With Issues</div>
        </div>
        <div class="stat-icon stat-icon-red">
          <i class="pi pi-exclamation-triangle"></i>
        </div>
      </div>
    </div>

    <!-- Customer Data Table - Modern clean design with filtering -->
    <div class="data-table-section">
      <DataTable
        :value="customerStore.customers || []"
        v-model:filters="filters"
        :loading="customerStore.isLoading"
        :totalRecords="customerStore.totalCount || 0"
        :rows="25"
        :lazy="false"
        selectionMode="multiple"
        v-model:selection="selectedCustomers"
        dataKey="id"
        :paginator="true"
        :rowsPerPageOptions="[10, 25, 50, 100]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} customers"
        :globalFilterFields="['name', 'abbreviation']"
        filterDisplay="menu"
        class="tem-table"
        @page="onPageChange"
        @sort="onSort"
      >
        <template #header>
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <h3 class="text-xl font-semibold m-0">TEM Audit - Customers</h3>
              <Badge v-if="customerStore.totalCount" :value="customerStore.totalCount" />
            </div>
            <div class="flex items-center gap-3">
              <Button 
                icon="pi pi-filter-slash" 
                label="Clear Filters" 
                outlined 
                @click="clearFilter"
                v-tooltip.top="'Clear all filters'"
              />
              <IconField iconPosition="left">
                <InputIcon>
                  <i class="pi pi-search" />
                </InputIcon>
                <InputText 
                  v-model="filters.global.value" 
                  placeholder="Search customers..." 
                  class="w-80"
                />
              </IconField>
              <Button 
                icon="pi pi-refresh" 
                outlined 
                @click="loadCustomers"
                :loading="customerStore.isLoading"
                v-tooltip.top="'Refresh'"
              />
              <Button 
                icon="pi pi-download" 
                label="Export" 
                outlined
                @click="exportCustomers"
                v-tooltip.top="'Export all customers'"
              />
            </div>
          </div>
        </template>
        
        <template #empty>No customers found.</template>
        <template #loading>Loading customers data. Please wait.</template>

        <!-- Selection column -->
        <Column selectionMode="multiple" headerStyle="width: 3rem" />
        
        <!-- Customer name with avatar and filter -->
        <Column field="name" header="Customer" sortable style="min-width: 200px">
          <template #body="{ data }">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span class="text-sm font-semibold text-blue-600">
                  {{ data.abbreviation || data.name.charAt(0) }}
                </span>
              </div>
              <div>
                <div class="font-medium text-gray-900">{{ data.name }}</div>
                <div class="text-sm text-gray-500">{{ data.abbreviation }}</div>
              </div>
            </div>
          </template>
          <template #filter="{ filterModel }">
            <InputText v-model="filterModel.value" type="text" placeholder="Search by customer name" />
          </template>
        </Column>

        <!-- Locations with filter -->
        <Column field="total_locations" header="Locations" sortable style="width: 120px">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <span class="font-medium">{{ data.total_locations || 0 }}</span>
              <Button
                icon="pi pi-eye"
                text
                rounded
                size="small"
                @click="viewCustomerLocations(data)"
                v-tooltip.top="'View locations'"
              />
            </div>
          </template>
          <template #filter="{ filterModel }">
            <InputNumber v-model="filterModel.value" placeholder="Min locations" showButtons />
          </template>
        </Column>

        <!-- Accounts -->
        <Column field="total_accounts" header="Accounts" sortable style="width: 100px">
          <template #body="{ data }">
            <span class="font-medium">{{ data.total_accounts || 0 }}</span>
          </template>
        </Column>

        <!-- Monthly Expected -->
        <Column field="monthly_expected" header="Expected" sortable style="width: 120px">
          <template #body="{ data }">
            <span class="font-medium">{{ formatCurrency(data.monthly_expected) }}</span>
          </template>
        </Column>

        <!-- Active Accounts -->
        <Column field="active_accounts" header="Active" sortable style="width: 100px">
          <template #body="{ data }">
            <span class="font-medium text-green-600">{{ data.active_accounts || 0 }}</span>
          </template>
        </Column>

        <!-- Funding Balance with filter -->
        <Column field="funding_balance" header="Balance" sortable style="width: 150px">
          <template #body="{ data }">
            <div class="text-right">
              <div class="font-medium" :class="getFundingColorClass(data.funding_status)">
                {{ formatCurrency(data.funding_balance) }}
              </div>
              <div class="text-sm text-gray-500">
                {{ data.funding_status || 'Unknown' }}
              </div>
            </div>
          </template>
          <template #filter="{ filterModel }">
            <InputNumber v-model="filterModel.value" mode="currency" currency="USD" locale="en-US" placeholder="Min balance" showButtons />
          </template>
        </Column>

        <!-- Last Activity -->
        <Column field="last_activity" header="Last Activity" sortable style="width: 120px">
          <template #body="{ data }">
            <span class="text-sm text-gray-600">
              {{ formatDate(data.last_activity) }}
            </span>
          </template>
        </Column>

        <!-- Issues with filter -->
        <Column field="issue_count" header="Issues" sortable style="width: 80px">
          <template #body="{ data }">
            <Badge 
              :value="data.issue_count || 0"
              :severity="(data.issue_count || 0) > 0 ? 'danger' : 'success'"
            />
          </template>
          <template #filter="{ filterModel }">
            <Select 
              v-model="filterModel.value" 
              :options="[{label: 'No Issues', value: 0}, {label: '1+ Issues', value: 1}]" 
              optionLabel="label"
              optionValue="value"
              placeholder="Filter issues" 
              showClear
            />
          </template>
        </Column>

        <!-- Actions -->
        <Column header="Actions" style="width: 120px">
          <template #body="{ data }">
            <Button
              icon="pi pi-eye"
              outlined
              size="small"
              @click="router.push(`/tem/customers/${data.id}`)"
              v-tooltip.top="'View details'"
            />
          </template>
        </Column>
      </DataTable>
    </div>


  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Select from 'primevue/select';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Badge from 'primevue/badge';
import InputNumber from 'primevue/inputnumber';
import MultiSelect from 'primevue/multiselect';
import { FilterMatchMode } from '@primevue/core/api';
import { useTEMCustomerStore } from '@/stores/tem/customerStore';

// Composables
const router = useRouter();
const toast = useToast();
const customerStore = useTEMCustomerStore();

// State
const selectedCustomers = ref([]);

// Status options for filtering
const fundingStatusOptions = [
  'healthy', 'low', 'critical'
];

// Initialize filters with correct PrimeVue 4.x structure
const initFilters = () => {
  return {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    total_locations: { value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO },
    total_accounts: { value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO },
    monthly_expected: { value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO },
    funding_balance: { value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO },
    funding_status: { value: null, matchMode: FilterMatchMode.EQUALS },
    issue_count: { value: null, matchMode: FilterMatchMode.EQUALS }
  };
};

// Filters for DataTable - Initialize immediately
const filters = ref(initFilters());



// Computed properties for summary cards using optimized endpoint meta data
const totalCustomers = computed(() => customerStore.totalCustomers || 0);
const activeCustomers = computed(() => customerStore.totalActiveAccounts || 0);
const totalMonthlySpend = computed(() => formatCurrency(customerStore.totalMonthlyExpected || 0));
const customersWithIssues = computed(() => {
  return (customerStore.customers || []).filter(c => c?.has_flags || (c?.issue_count || 0) > 0).length;
});

// Methods
const loadCustomers = async (apiFilters = {}) => {
  try {
    await customerStore.fetchCustomers(apiFilters);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load customers',
      life: 3000
    });
  }
};

const clearFilter = () => {
  filters.value = initFilters();
};



const onPageChange = (event) => {
  const filters = {
    page: event.page + 1,
    per_page: event.rows
  };
  loadCustomers(filters);
};

const onSort = (event) => {
  // For now, let client-side sorting handle this
  // In future, we can add server-side sorting
  console.log('Sort event:', event);
};

// Remove onFilter as we're not using lazy loading for filters



const viewCustomerLocations = (customer) => {
  router.push(`/tem/customers/${customer.id}?tab=locations`);
};

const exportCustomers = async () => {
  try {
    await customerStore.exportCustomers();
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Export completed successfully',
      life: 3000
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Export failed',
      life: 3000
    });
  }
};

// Utility functions
const formatCurrency = (value) => {
  if (value == null) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
};

const getFundingColorClass = (status) => {
  switch (status) {
    case 'healthy': return 'text-green-600';
    case 'low': return 'text-yellow-600';
    case 'critical': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Lifecycle
onMounted(async () => {
  try {
    await customerStore.initialize();
  } catch (error) {
    console.error('Failed to initialize customer list:', error);
    toast.add({
      severity: 'warn',
      summary: 'Backend Not Ready',
      detail: 'TEM backend is not available. Showing demo mode.',
      life: 5000
    });
  }
});
</script>

<style scoped>
/* ===== MODERN TEM CUSTOMER LIST DESIGN ===== */

.tem-customer-list {
  padding: 2rem;
  min-height: 100vh;
  background: var(--surface-ground);
  max-width: 1400px;
  margin: 0 auto;
}

/* Page Header - Clean and spacious */
.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--text-color-secondary);
  margin: 0.5rem 0 0 0;
  line-height: 1.4;
}

.button-primary {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: var(--primary-color-text);
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}



/* Stats Grid - Modern card layout */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 16px;
  padding: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-color-text));
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-color);
}

.stat-card:hover::before {
  transform: scaleX(1);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-icon {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.stat-icon i {
  font-size: 1.5rem;
  color: white;
}

.stat-icon-blue {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.stat-icon-green {
  background: linear-gradient(135deg, #10b981, #047857);
}

.stat-icon-orange {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.stat-icon-red {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

/* Data Table Section - Clean container */
.data-table-section {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* DataTable Enhancements */
:deep(.p-datatable) {
  border-radius: 8px;
  overflow: hidden;
  border: none;
}

:deep(.p-datatable-header) {
  background: var(--surface-card);
  border: none;
  padding: 1.5rem;
  border-bottom: 1px solid var(--surface-border);
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: var(--surface-50);
  color: var(--text-color);
  font-weight: 600;
  padding: 1rem;
  border-bottom: 2px solid var(--surface-border);
}

:deep(.p-datatable .p-datatable-tbody > tr) {
  transition: all 0.2s ease;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background-color: var(--surface-hover);
  transform: translateY(-1px);
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 1rem;
  border-bottom: 1px solid var(--surface-border);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .tem-customer-list {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 1.875rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .stat-card {
    padding: 1.25rem;
  }
  
  .stat-value {
    font-size: 2rem;
  }
  
  .search-section,
  .data-table-section {
    padding: 1rem;
  }
}

/* Dark mode optimizations */
@media (prefers-color-scheme: dark) {
  .stat-card:hover {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }
  
  .search-section:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
}
</style>