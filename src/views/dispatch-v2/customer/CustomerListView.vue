<template>
  <div class="customer-list-view p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">Customers</h1>
        <p class="text-surface-600 dark:text-surface-400 mt-1">
          Manage customer relationships and performance
        </p>
      </div>
      <div class="flex gap-3">
        <Button 
          label="Export" 
          icon="pi pi-download" 
          severity="secondary" 
          outlined 
        />
        <Button 
          label="Add Customer" 
          icon="pi pi-plus" 
          @click="showAddDialog = true"
        />
      </div>
    </div>

    <!-- Filters and Search -->
    <BaseCard class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Search -->
        <div class="md:col-span-2">
          <IconField iconPosition="left">
            <InputIcon class="pi pi-search" />
            <InputText 
              v-model="filters.search"
              placeholder="Search customers..."
              class="w-full"
            />
          </IconField>
        </div>
        
        <!-- Status Filter -->
        <Select
          v-model="selectedStatus"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="All Statuses"
          class="w-full"
          @change="applyFilters"
        />
        
        <!-- Health Filter -->
        <Select
          v-model="selectedHealth"
          :options="healthOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="All Health Levels"
          class="w-full"
          @change="applyFilters"
        />
      </div>
      
      <!-- Advanced Filters Toggle -->
      <div class="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
        <Button 
          :label="showAdvancedFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'"
          :icon="showAdvancedFilters ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
          text
          @click="showAdvancedFilters = !showAdvancedFilters"
        />
      </div>
      
      <!-- Advanced Filters -->
      <div v-if="showAdvancedFilters" class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium mb-2">Revenue Range</label>
          <div class="flex gap-2">
            <InputNumber 
              v-model="revenueRange.min"
              placeholder="Min"
              mode="currency"
              currency="USD"
              class="flex-1"
            />
            <InputNumber 
              v-model="revenueRange.max"
              placeholder="Max"
              mode="currency"
              currency="USD"
              class="flex-1"
            />
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">Date Range</label>
          <DatePicker 
            v-model="dateRange"
            selectionMode="range"
            :manualInput="false"
            placeholder="Select date range"
            class="w-full"
          />
        </div>
        
        <div class="flex items-end">
          <Button 
            label="Apply Filters"
            icon="pi pi-filter"
            @click="applyFilters"
            class="w-full"
          />
        </div>
      </div>
    </BaseCard>

    <!-- Customer Cards Grid -->
    <div v-if="loading.customers" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="n in 6" :key="n" class="animate-pulse">
        <BaseCard>
          <div class="h-48 bg-surface-200 dark:bg-surface-700 rounded"></div>
        </BaseCard>
      </div>
    </div>

    <div v-else-if="customers.length === 0" class="text-center py-12">
      <BaseCard>
        <i class="pi pi-users text-6xl text-surface-300 mb-4"></i>
        <h3 class="text-xl font-semibold text-surface-600 mb-2">No Customers Found</h3>
        <p class="text-surface-500 mb-4">
          {{ filters.search ? 'No customers match your search criteria.' : 'Get started by adding your first customer.' }}
        </p>
        <Button 
          label="Add Customer" 
          icon="pi pi-plus"
          @click="showAddDialog = true"
        />
      </BaseCard>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <BaseCard 
        v-for="customer in customers" 
        :key="customer.id"
        class="cursor-pointer hover:shadow-lg transition-shadow duration-200"
        @click="navigateToCustomer(customer.id)"
      >
        <!-- Customer Header -->
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-1">
              {{ customer.name }}
            </h3>
            <p v-if="customer.email" class="text-surface-600 dark:text-surface-400 text-sm">
              {{ customer.email }}
            </p>
            <p v-else class="text-surface-400 dark:text-surface-500 text-sm italic">
              No email on file
            </p>
          </div>
          <StatusIndicator 
            :status="customer.status"
            :color="getStatusColor(customer.status)"
            size="small"
          />
        </div>

        <!-- Customer Metrics -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
              {{ customer.activeJobs || 0 }}
            </div>
            <div class="text-xs text-surface-500">Active Jobs</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
              {{ formatCurrency(customer.totalRevenue || 0) }}
            </div>
            <div class="text-xs text-surface-500">Total Revenue</div>
          </div>
        </div>

        <!-- Health Score - Only show if data exists -->
        <div v-if="customer.healthScore !== null && customer.healthScore !== undefined" class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium">Health Score</span>
            <span class="text-sm font-bold" :class="getSatisfactionColor(customer.healthScore)">
              {{ customer.healthScore }}%
            </span>
          </div>
          <ProgressBar 
            :value="customer.healthScore"
            :class="getSatisfactionColor(customer.healthScore)"
            class="h-2"
          />
        </div>

        <!-- Last Activity -->
        <div class="text-xs text-surface-500">
          <span v-if="customer.lastActivity">
            Last activity: {{ formatDate(customer.lastActivity) }}
          </span>
          <span v-else class="italic">
            No recent activity
          </span>
        </div>
      </BaseCard>
    </div>

    <!-- Pagination -->
    <div v-if="customers.length > 0" class="mt-6 flex justify-center">
      <Paginator
        :rows="pagination.limit"
        :totalRecords="pagination.total"
        :first="(pagination.page - 1) * pagination.limit"
        @page="onPageChange"
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        :rowsPerPageOptions="[10, 20, 50]"
      />
    </div>

    <!-- Add Customer Dialog -->
    <Dialog 
      v-model:visible="showAddDialog"
      modal
      header="Add New Customer"
      :style="{ width: '500px' }"
    >
      <div class="text-center py-8">
        <i class="pi pi-plus-circle text-4xl text-primary mb-4"></i>
        <p class="text-surface-600">Customer creation form coming soon...</p>
      </div>
    </Dialog>

    <!-- Error State -->
    <div v-if="customerStore.errors.customers && !loading.customers" class="text-center py-12">
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
        <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
        <h3 class="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
          Server Error
        </h3>
        <p class="text-red-700 dark:text-red-300 mb-4">
          {{ customerStore.errors.customers }}
        </p>
        <div class="space-y-2">
          <Button 
            icon="pi pi-refresh" 
            label="Retry"
            @click="retryFetchCustomers"
            severity="danger"
            outlined
            class="w-full"
          />
          <details class="text-left">
            <summary class="text-sm text-red-600 dark:text-red-400 cursor-pointer hover:text-red-800 dark:hover:text-red-200">
              Technical Details
            </summary>
            <div class="mt-2 p-3 bg-red-100 dark:bg-red-900/40 rounded text-xs text-red-800 dark:text-red-200">
              <p><strong>Endpoint:</strong> GET /api/customers/</p>
              <p><strong>Status:</strong> 500 Internal Server Error</p>
              <p><strong>Time:</strong> {{ new Date().toLocaleString() }}</p>
              <p class="mt-2"><strong>Possible Causes:</strong></p>
              <ul class="list-disc list-inside ml-2 space-y-1">
                <li>Backend server is down</li>
                <li>Database connection issues</li>
                <li>Missing API endpoint implementation</li>
                <li>Server configuration problems</li>
              </ul>
            </div>
          </details>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// @ts-nocheck
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCustomerStore } from '@/stores/dispatch-v2/customer'
import { useFilters } from '../shared/composables/useFilters'
import BaseCard from '../shared/components/BaseCard.vue'
import StatusIndicator from '../shared/components/StatusIndicator.vue'

// Router
const router = useRouter()

// Store
const customerStore = useCustomerStore()

// Reactive data
const showAddDialog = ref(false)
const showAdvancedFilters = ref(false)
const selectedStatus = ref(null)
const selectedHealth = ref(null)
const revenueRange = ref({ min: null, max: null })
const dateRange = ref(null)

// Filter options
const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Pending', value: 'pending' },
  { label: 'Suspended', value: 'suspended' }
]

const healthOptions = [
  { label: 'Excellent (90-100%)', value: 'excellent' },
  { label: 'Good (70-89%)', value: 'good' },
  { label: 'Fair (50-69%)', value: 'fair' },
  { label: 'Poor (0-49%)', value: 'poor' }
]

// Composables
const {
  filters,
  debouncedSearch,
  setFilter,
  clearAllFilters,
  hasActiveFilters
} = useFilters({
  search: '',
  status: null,
  health: null
})

// Watch for debounced search changes
watch(debouncedSearch, (newValue) => {
  applyFilters()
})

// Computed
const customers = computed(() => customerStore.customers)
const loading = computed(() => customerStore.loading)
const pagination = computed(() => customerStore.pagination)

// Methods
function applyFilters() {
  const filterParams = {
    search: filters.search,
    status: selectedStatus.value,
    health: selectedHealth.value,
    revenueMin: revenueRange.value.min,
    revenueMax: revenueRange.value.max,
    dateFrom: dateRange.value?.[0],
    dateTo: dateRange.value?.[1]
  }
  
  customerStore.updateFilters(filterParams)
  customerStore.fetchCustomers()
}

function onPageChange(event) {
  customerStore.updatePagination({
    page: Math.floor(event.first / event.rows) + 1,
    limit: event.rows
  })
  customerStore.fetchCustomers()
}

function navigateToCustomer(customerId) {
  router.push(`/dispatch/customer/${customerId}`)
}

function formatCurrency(amount) {
  return customerStore.formatCurrency(amount)
}

function formatDate(date) {
  return customerStore.formatDate(date)
}

function getStatusColor(status) {
  return customerStore.getStatusColor(status)
}

function getSatisfactionColor(score) {
  return customerStore.getSatisfactionColor(score)
}

function retryFetchCustomers() {
  customerStore.fetchCustomers()
}

// Lifecycle
onMounted(() => {
  customerStore.fetchCustomers()
})

onUnmounted(() => {
  customerStore.clearErrors()
})

// Watch for real-time updates
watch(() => customerStore.customers, (newCustomers) => {
  // Handle real-time customer updates
}, { deep: true })
</script> 