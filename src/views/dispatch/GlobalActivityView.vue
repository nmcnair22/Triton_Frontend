<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useDispatchStore } from '@/stores/dispatchStore';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';

// Components
import Card from 'primevue/card';
import Divider from 'primevue/divider';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import OverlayPanel from 'primevue/overlaypanel';
import ProgressBar from 'primevue/progressbar';
import Breadcrumb from 'primevue/breadcrumb';
import Badge from 'primevue/badge';
import Tag from 'primevue/tag';
import ConfirmDialog from 'primevue/confirmdialog';
import { useConfirm } from 'primevue/useconfirm';
import MultiSelect from 'primevue/multiselect';

// Custom Components
import CustomerSelector from '@/components/dispatch/CustomerSelector.vue';
import DateRangePicker from '@/components/dispatch/DateRangePicker.vue';
import FilterChips from '@/components/dispatch/FilterChips.vue';
import MetricCard from '@/components/dispatch/MetricCard.vue';
import FilterSidebar from '@/components/dispatch/FilterSidebar.vue';
import FilterSection from '@/components/dispatch/FilterSection.vue';
import RevisitRequiredFeed from '@/components/dispatch/RevisitRequiredFeed.vue';
import PartsIssuesFeed from '@/components/dispatch/PartsIssuesFeed.vue';
import CriticalIssuesFeed from '@/components/dispatch/CriticalIssuesFeed.vue';

// Store and router
const dispatchStore = useDispatchStore();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

// Refs from store using storeToRefs for reactivity
const { 
  dashboardSummary, 
  dashboardTrends, 
  projects, 
  jobs, 
  alerts, 
  loading, 
  error,
  selectedCustomers,
  filters,
  turnups
} = storeToRefs(dispatchStore);

// Local reactive state
const sidebarCollapsed = ref(false);
const dateRange = ref([
  new Date(new Date().setDate(new Date().getDate() - 30)), 
  new Date()
]);
const statusFilters = ref([
  { label: 'All', value: 'all', icon: 'pi pi-filter' },
  { label: 'Open', value: 'Open', icon: 'pi pi-exclamation-circle', color: 'bg-blue-600' },
  { label: 'Complete', value: 'Complete', icon: 'pi pi-check', color: 'bg-green-600' },
  { label: 'Cancelled', value: 'Cancelled', icon: 'pi pi-times', color: 'bg-red-700' }
]);
const activeStatusFilters = ref([]);
const searchQuery = ref('');
const selectedProjects = ref([]);
const selectedPriorities = ref([]);
const visits = ref([]);
const visitsLoading = ref(false);

// Breadcrumb items
const breadcrumbItems = ref([
  { label: 'Home', to: '/' },
  { label: 'Global Activity' }
]);
const breadcrumbHome = { icon: 'pi pi-home', to: '/' };

// Table state
const tableData = ref([]);
const tableLoading = ref(false);
const tableTotalRecords = ref(0);
const tableLazyParams = ref({
  first: 0,
  rows: 10,
  page: 1,
  sortField: null,
  sortOrder: null
});
const expandedRows = ref({});

// Computed properties
const metricsData = computed(() => {
  // Try to get data from enhanced dashboard first, then fall back to regular dashboard
  const enhancedData = dispatchStore.dashboardEnhanced || {};
  const summaryData = dashboardSummary.value?.summary || {};
  const metricsTrend = dashboardSummary.value?.metrics_trend || [];
  
  // Use default values when data isn't available
  const defaultVisits = { total: 0, previous: 0 };
  const defaultRate = { current: 0, previous: 0 };
  
  // Use enhanced data for visit metrics when available
  const totalVisits = enhancedData.daily_statistics?.total_visits || 
                      summaryData.visits?.total || 
                      defaultVisits.total;
                      
  const previousTotalVisits = enhancedData.daily_statistics?.yesterday_total_visits || 
                              summaryData.visits?.previous || 
                              defaultVisits.previous;
  
  // Enhanced data has more detailed completion metrics
  const completionRate = enhancedData.daily_statistics?.completion_rate || 
                        (metricsTrend[0]?.completion_rate ?? defaultRate.current);
                        
  const previousCompletionRate = enhancedData.daily_statistics?.yesterday_completion_rate || 
                                (metricsTrend[1]?.completion_rate ?? defaultRate.previous);
  
  // Safely get values with fallbacks for missing data
  const getMetricValue = (path, fallback = 0) => {
    try {
      // Parse path like "issues_summary.revisit_rate" or "metrics.avg_duration"
      const parts = path.split('.');
      let value = enhancedData;
      for (const part of parts) {
        value = value[part];
        if (value === undefined || value === null) return fallback;
      }
      return value;
    } catch (e) {
      return fallback;
    }
  };
  
  return {
    totalVisits: {
      title: 'Total Visits',
      value: totalVisits,
      previousValue: previousTotalVisits,
      change: calculateChange(totalVisits, previousTotalVisits),
      icon: 'pi pi-calendar-plus',
      color: 'primary'
    },
    completionRate: {
      title: 'Success Rate',
      value: completionRate,
      previousValue: previousCompletionRate,
      change: calculateChange(completionRate, previousCompletionRate),
      icon: 'pi pi-check-circle',
      color: 'success',
      isPercentage: true
    },
    revisitRate: {
      title: 'Revisit Rate',
      value: getMetricValue('issues_summary.revisit_rate', metricsTrend[0]?.revisit_rate || 0),
      previousValue: metricsTrend[1]?.revisit_rate || 0,
      change: calculateChange(
        getMetricValue('issues_summary.revisit_rate', metricsTrend[0]?.revisit_rate || 0),
        metricsTrend[1]?.revisit_rate || 0
      ),
      icon: 'pi pi-refresh',
      color: 'warning',
      isPercentage: true
    },
    avgDuration: {
      title: 'Avg. Duration',
      value: getMetricValue('metrics.avg_duration', metricsTrend[0]?.avg_duration || 0),
      previousValue: metricsTrend[1]?.avg_duration || 0,
      change: calculateChange(
        getMetricValue('metrics.avg_duration', metricsTrend[0]?.avg_duration || 0),
        metricsTrend[1]?.avg_duration || 0
      ),
      icon: 'pi pi-clock',
      color: 'info',
      format: 'time'
    }
  };
});

// Computed properties for activity feeds
const revisitVisits = computed(() => {
  if (!visits.value || !Array.isArray(visits.value)) return [];
  return visits.value.filter(visit => {
    return visit.metadata?.turnup_data?.revisit_indicated === 'Yes';
  });
});

const allVisitsWithIssues = computed(() => {
  if (!visits.value || !Array.isArray(visits.value)) return [];
  return visits.value.filter(visit => {
    return visit.issues_encountered && visit.issues_encountered.length > 0;
  });
});

// Methods
function calculateChange(current, previous) {
  if (previous === undefined || previous === null || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

// Handle date range change
function onDateRangeChange(newRange) {
  console.log('Date range changed:', newRange);
  dateRange.value = newRange;
  
  // Set date filter in store
  if (newRange && newRange.length === 2) {
    dispatchStore.setDateFilter(newRange[0], newRange[1]);
  } else {
    // Reset date filter if no valid range
    dispatchStore.setDateFilter(null, null);
  }
  
  // Reset to first page when filters change
  tableLazyParams.value.page = 0;
  dispatchStore.turnupsPagination.page = 1;
  
  loadDashboardData();
}

// Handle customer selection change
function onCustomerChange(customers) {
  console.log('Customer selection changed:', customers);
  
  if (Array.isArray(customers)) {
    // For turnups API, we use customer_name instead of code
    dispatchStore.setCustomerFilter(customers.map(c => c.name || c.code));
  } else if (customers) {
    dispatchStore.setCustomerFilter([customers.name || customers.code]);
  } else {
    dispatchStore.setCustomerFilter([]);
  }
  
  // Reset to first page when filters change
  tableLazyParams.value.page = 0;
  dispatchStore.turnupsPagination.page = 1;
  
  loadDashboardData();
}

// Handle status filters change
function onStatusFilterChange(statuses) {
  console.log('Status filters changed:', statuses);
  activeStatusFilters.value = statuses;
  
  // Handle the 'all' selection case
  if (statuses.includes('all')) {
    dispatchStore.setStatusFilter([]);
  } else {
    // For turnups endpoint, we need to pass specific status values
    dispatchStore.setStatusFilter(statuses);
  }
  
  // Reset to first page when filters change
  tableLazyParams.value.page = 0;
  dispatchStore.turnupsPagination.page = 1;
  
  loadDashboardData();
}

// Handle search query change
function onSearchChange(event) {
  dispatchStore.setSearchFilter(searchQuery.value);
  loadDashboardData();
}

// Handle project selection in filter sidebar
function onProjectFilterChange(projects) {
  console.log('Project selection changed:', projects);
  selectedProjects.value = projects;
  
  // For turnups API, we use project_name instead of code
  dispatchStore.setProjectFilter(projects.map(p => p.name || p.code));
  
  // Reset to first page when filters change
  tableLazyParams.value.page = 0;
  dispatchStore.turnupsPagination.page = 1;
  
  loadDashboardData();
}

// Handle priority selection in filter sidebar
function onPriorityFilterChange(priorities) {
  selectedPriorities.value = priorities;
  dispatchStore.setPriorityFilter(priorities);
  loadDashboardData();
}

// Reset all filters
function resetAllFilters() {
  confirm.require({
    message: 'Are you sure you want to reset all filters?',
    header: 'Reset Filters',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => {
      // Set default date range to 30 days past to today
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateRange.value = [thirtyDaysAgo, new Date()];
      
      selectedCustomers.value = [];
      activeStatusFilters.value = [];
      searchQuery.value = '';
      selectedProjects.value = [];
      selectedPriorities.value = [];
      
      // Reset store filters and set date range to past 30 days
      dispatchStore.resetFilters();
      dispatchStore.setDateFilter(thirtyDaysAgo, new Date());
      
      loadDashboardData();
      
      toast.add({
        severity: 'info',
        summary: 'Filters Reset',
        detail: 'All filters have been reset to default values showing the past 30 days',
        life: 3000
      });
    }
  });
}

// Apply filters from sidebar
function applyFilters() {
  loadDashboardData();
  
  toast.add({
    severity: 'success',
    summary: 'Filters Applied',
    detail: 'Data has been updated based on your filter selections',
    life: 3000
  });
}

// Navigate to project details
function navigateToProject(project) {
  router.push(`/dashboard/projects/${project.id}`);
}

// Navigate to job details
function navigateToJob(job) {
  router.push(`/dispatch/jobs/${job.id}`);
}

// Navigate to visit details
function navigateToTurnup(turnup) {
  router.push(`/dispatch/turnups/${turnup.id}`);
}

// Load dashboard data from store
async function loadDashboardData() {
  try {
    tableLoading.value = true;
    await dispatchStore.loadDashboardData();
    
    // If we have turnups data from API, use it
    if (Array.isArray(dispatchStore.turnups) && dispatchStore.turnups.length > 0) {
      // Create a copy of the data so we don't modify the store directly
      let sortedData = [...dispatchStore.turnups];
      
      // Apply client-side sorting if sort parameters are present
      if (tableLazyParams.value && tableLazyParams.value.sortField) {
        const { sortField, sortOrder } = tableLazyParams.value;
        console.log(`Applying client-side sorting by ${sortField} in ${sortOrder === 1 ? 'ascending' : 'descending'} order`);
        
        sortedData.sort((a, b) => {
          // Handle different data types (string, number, date)
          let valueA = a[sortField];
          let valueB = b[sortField];
          
          // Handle dates
          if (sortField === 'service_date' || sortField.includes('date')) {
            valueA = valueA ? new Date(valueA).getTime() : 0;
            valueB = valueB ? new Date(valueB).getTime() : 0;
          }
          // Handle strings (case-insensitive)
          else if (typeof valueA === 'string' && typeof valueB === 'string') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
          }
          // Handle null/undefined values
          if (valueA === null || valueA === undefined) valueA = '';
          if (valueB === null || valueB === undefined) valueB = '';
          
          // Compare values
          if (valueA < valueB) return sortOrder === 1 ? -1 : 1;
          if (valueA > valueB) return sortOrder === 1 ? 1 : -1;
          return 0;
        });
      }
      
      tableData.value = sortedData;
      tableTotalRecords.value = dispatchStore.turnupsPagination.total;
      console.log('Using turnups API data for table:', sortedData.length, 'records');
      console.log('Total records available:', dispatchStore.turnupsPagination.total);
    } 
    // Otherwise, display no data available
    else {
      tableData.value = [];
      tableTotalRecords.value = 0;
      console.log('No turnups data available for table');
      
      toast.add({
        severity: 'info',
        summary: 'Limited View',
        detail: 'Turnup data is not available. Please contact support if this issue persists.',
        life: 5000
      });
    }
  } catch (err) {
    console.error('Error loading dashboard data:', err);
    toast.add({
      severity: 'error',
      summary: 'Error Loading Data',
      detail: 'Failed to load dashboard data. Please try again.',
      life: 3000
    });
    
    // Initialize empty table data
    tableData.value = [];
    tableTotalRecords.value = 0;
  } finally {
    tableLoading.value = false;
  }
}

// Load visits data from jobs
async function loadVisitsData() {
  try {
    visitsLoading.value = true;
    
    // Direct API call to fetch visits
    const response = await dispatchStore.fetchVisitsData();
    
    // If there's an error from the API call, it will be in the store
    if (dispatchStore.error) {
      console.error('Error loading visits data:', dispatchStore.error);
      toast.add({
        severity: 'error',
        summary: 'Error Loading Visits',
        detail: 'Visit data not available. Some features will be limited.',
        life: 5000
      });
      
      // Always initialize visits as an empty array to prevent undefined errors
      visits.value = [];
    } else {
      visits.value = dispatchStore.visits || [];
    }
  } catch (err) {
    console.error('Error loading visits data:', err);
    toast.add({
      severity: 'error',
      summary: 'Visit Data Unavailable',
      detail: 'Visit data could not be loaded. Some features will be limited.',
      life: 5000
    });
    
    // Always ensure visits is at least an empty array
    visits.value = [];
  } finally {
    visitsLoading.value = false;
  }
}

// Build filter params object for API calls
function buildFilterParams() {
  const params = {};
  
  if (dateRange.value && dateRange.value.length === 2) {
    params.date_from = dateRange.value[0];
    params.date_to = dateRange.value[1];
  }
  
  if (selectedCustomers.value.length > 0) {
    params.customer_ids = selectedCustomers.value.map(c => c.code).join(',');
  }
  
  if (activeStatusFilters.value.length > 0 && !activeStatusFilters.value.includes('all')) {
    params.statuses = activeStatusFilters.value.join(',');
  }
  
  if (selectedProjects.value.length > 0) {
    params.project_ids = selectedProjects.value.map(p => p.code).join(',');
  }
  
  if (selectedPriorities.value.length > 0) {
    params.priorities = selectedPriorities.value.join(',');
  }
  
  if (searchQuery.value) {
    params.search = searchQuery.value;
  }
  
  return params;
}

// Handle lazy loading for data table
function onLazyLoad(event) {
  console.log('Lazy load event triggered:', event);
  
  // Store the lazy loading parameters
  tableLazyParams.value = event;
  
  const previousParams = { ...tableLazyParams.value };
  
  // Ensure page is a valid number (PrimeVue uses 0-based indexing)
  const page = (event.page !== undefined && !isNaN(event.page)) ? event.page + 1 : 1;
  
  // Check if this is just a sort operation (no page change)
  const isSortOnly = previousParams.page === event.page;
  
  // Update pagination in the store
  dispatchStore.turnupsPagination.page = page;
  dispatchStore.turnupsPagination.limit = event.rows || 10;
  
  // Handle sorting if present - PrimeVue uses 1 for ascending, -1 for descending
  if (event.sortField) {
    console.log(`Sorting by ${event.sortField} in ${event.sortOrder === 1 ? 'ascending' : 'descending'} order`);
    dispatchStore.turnupsPagination.sortField = event.sortField;
    dispatchStore.turnupsPagination.sortOrder = event.sortOrder; // Store will convert 1/-1 to asc/desc
    
    // Apply client-side sorting immediately if we're just changing sort, not changing page
    if (isSortOnly && Array.isArray(dispatchStore.turnups) && dispatchStore.turnups.length > 0) {
      let sortedData = [...dispatchStore.turnups];
      
      sortedData.sort((a, b) => {
        // Handle different data types (string, number, date)
        let valueA = a[event.sortField];
        let valueB = b[event.sortField];
        
        // Handle dates
        if (event.sortField === 'service_date' || event.sortField.includes('date')) {
          valueA = valueA ? new Date(valueA).getTime() : 0;
          valueB = valueB ? new Date(valueB).getTime() : 0;
        }
        // Handle strings (case-insensitive)
        else if (typeof valueA === 'string' && typeof valueB === 'string') {
          valueA = valueA.toLowerCase();
          valueB = valueB.toLowerCase();
        }
        // Handle null/undefined values
        if (valueA === null || valueA === undefined) valueA = '';
        if (valueB === null || valueB === undefined) valueB = '';
        
        // Compare values
        if (valueA < valueB) return event.sortOrder === 1 ? -1 : 1;
        if (valueA > valueB) return event.sortOrder === 1 ? 1 : -1;
        return 0;
      });
      
      // Update the table data without reloading from API
      tableData.value = sortedData;
      console.log('Applied client-side sorting without reloading data');
    } else {
      // If changing page or initial load, fetch from the backend
      loadDashboardData();
    }
  } else {
    // Clear sort if not present
    dispatchStore.turnupsPagination.sortField = null;
    dispatchStore.turnupsPagination.sortOrder = null;
    
    // Trigger reload of turnups with new pagination
    loadDashboardData();
  }
}

// Format date for display
function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  });
}

// Generate status tag with color
function getStatusTag(status) {
  const statusMap = {
    'Open': { severity: 'info', icon: 'pi pi-exclamation-circle' },
    'Complete': { severity: 'success', icon: 'pi pi-check-circle' },
    'Cancelled': { severity: 'danger', icon: 'pi pi-times-circle' },
    'Incomplete': { severity: 'warning', icon: 'pi pi-sync' },
    // Legacy mappings for backwards compatibility
    'complete': { severity: 'success', icon: 'pi pi-check-circle' },
    'in_progress': { severity: 'info', icon: 'pi pi-sync' },
    'scheduled': { severity: 'warning', icon: 'pi pi-calendar' },
    'delayed': { severity: 'danger', icon: 'pi pi-clock' },
    'cancelled': { severity: 'secondary', icon: 'pi pi-times-circle' },
    'pending': { severity: 'help', icon: 'pi pi-hourglass' },
    'overdue': { severity: 'danger', icon: 'pi pi-exclamation-circle' },
    'failed': { severity: 'danger', icon: 'pi pi-times' },
    'revisit': { severity: 'info', icon: 'pi pi-refresh' },
  };
  
  const info = statusMap[status] || { severity: 'secondary', icon: 'pi pi-question' };
  
  return { severity: info.severity, icon: info.icon };
}

// Lifecycle hooks
onMounted(() => {
  // Set the initial date filter in the store to match the default 30-day date range
  if (dateRange.value && dateRange.value.length === 2) {
    console.log('Setting initial date filter to 30-day range:', dateRange.value);
    dispatchStore.setDateFilter(dateRange.value[0], dateRange.value[1]);
  }
  
  // Load the data
  loadDashboardData();
});

// Watch for changes to lazy loading params (pagination, sorting)
watch(tableLazyParams, () => {
  loadDashboardData();
});
</script>

<template>
  <div class="p-4">
    <!-- Header with breadcrumb and customer selector -->
    <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
      <Breadcrumb :model="breadcrumbItems" :home="breadcrumbHome" class="mb-3 md:mb-0" />
      
      <div class="flex gap-2">
        <CustomerSelector
          v-model="selectedCustomers"
          multiple
          placeholder="All Customers"
          @change="onCustomerChange"
        />
        
        <span class="p-input-icon-left">
          <i class="pi pi-search" />
          <InputText 
            v-model="searchQuery" 
            placeholder="Search..." 
            @keyup.enter="onSearchChange"
            class="p-inputtext-sm"
          />
        </span>
      </div>
    </div>
    
    <!-- Status Filter Chips -->
    <div class="mb-4">
      <FilterChips
        v-model="activeStatusFilters"
        :options="statusFilters"
        @change="onStatusFilterChange"
      />
    </div>
    
    <!-- Metrics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard
        :title="metricsData.totalVisits.title"
        :value="metricsData.totalVisits.value"
        :previousValue="metricsData.totalVisits.previousValue"
        :change="metricsData.totalVisits.change"
        :icon="metricsData.totalVisits.icon"
        :color="metricsData.totalVisits.color"
        :loading="loading.dashboardData"
      />
      
      <MetricCard
        :title="metricsData.completionRate.title"
        :value="metricsData.completionRate.value"
        :previousValue="metricsData.completionRate.previousValue"
        :change="metricsData.completionRate.change"
        :icon="metricsData.completionRate.icon"
        :color="metricsData.completionRate.color"
        :isPercentage="metricsData.completionRate.isPercentage"
        :loading="loading.dashboardData"
      />
      
      <MetricCard
        :title="metricsData.revisitRate.title"
        :value="metricsData.revisitRate.value"
        :previousValue="metricsData.revisitRate.previousValue"
        :change="metricsData.revisitRate.change"
        :icon="metricsData.revisitRate.icon"
        :color="metricsData.revisitRate.color"
        :isPercentage="metricsData.revisitRate.isPercentage"
        :loading="loading.dashboardData"
      />
      
      <MetricCard
        :title="metricsData.avgDuration.title"
        :value="metricsData.avgDuration.value"
        :previousValue="metricsData.avgDuration.previousValue"
        :change="metricsData.avgDuration.change"
        :icon="metricsData.avgDuration.icon"
        :color="metricsData.avgDuration.color"
        :format="metricsData.avgDuration.format"
        :loading="loading.dashboardData"
      />
    </div>
    
    <!-- Main content area with filter sidebar and data table -->
    <div class="flex gap-6 mb-6">
      <!-- Filter sidebar -->
      <div class="w-80 bg-white dark:bg-surface-900 rounded-lg shadow border border-gray-200 dark:border-surface-700">
        <div class="p-4 border-b border-gray-200 dark:border-surface-700">
          <h2 class="text-xl font-semibold">Filters</h2>
        </div>
        
        <div class="p-4">
          <div class="mb-4">
            <h3 class="text-sm font-semibold mb-2">Projects</h3>
            <MultiSelect
              v-model="selectedProjects"
              :options="projects"
              optionLabel="name"
              placeholder="Select Projects"
              class="w-full"
              display="chip"
              @change="onProjectFilterChange"
            />
          </div>
          
          <div class="mb-4">
            <h3 class="text-sm font-semibold mb-2">Priority</h3>
            <FilterChips
              v-model="selectedPriorities"
              :options="dispatchStore.priorityOptions"
              :multiSelect="true"
              @change="onPriorityFilterChange"
            />
          </div>
          
          <div class="mb-4">
            <h3 class="text-sm font-semibold mb-2">Date Range</h3>
            <DateRangePicker
              v-model="dateRange"
              :presets="true"
              @change="onDateRangeChange"
            />
          </div>
          
          <div class="flex gap-2 mt-6">
            <Button
              label="Reset"
              icon="pi pi-refresh"
              outlined
              class="w-full"
              @click="resetAllFilters"
            />
            <Button
              label="Apply"
              icon="pi pi-check"
              class="w-full"
              @click="applyFilters"
            />
          </div>
        </div>
      </div>
      
      <!-- Main Data Table -->
      <div class="flex-1 bg-white dark:bg-surface-900 rounded-lg shadow border border-gray-200 dark:border-surface-700">
        <div class="p-4 border-b border-gray-200 dark:border-surface-700 flex justify-between items-center">
          <h2 class="text-xl font-semibold">Turnup Activity</h2>
          <div>
            <Button 
              icon="pi pi-download" 
              label="Export" 
              class="p-button-outlined p-button-sm mr-2"
            />
            <Button 
              icon="pi pi-refresh" 
              aria-label="Refresh"
              class="p-button-text p-button-rounded p-button-sm"
              :loading="tableLoading"
              @click="loadDashboardData"
            />
          </div>
        </div>
        
        <div class="p-4">
          <DataTable
            :value="tableData"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[10, 25, 50, 100]"
            :totalRecords="tableTotalRecords"
            :lazy="true"
            :loading="tableLoading"
            @page="onLazyLoad"
            @sort="onLazyLoad"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
            :sortMode="'single'"
            :defaultSortOrder="1"
            :removableSort="true"
            responsiveLayout="scroll"
            stripedRows
            class="p-datatable-sm"
            dataKey="id"
            filterDisplay="row"
            v-model:expandedRows="expandedRows"
            emptyMessage="No turnups found in the selected date range. Try adjusting your filters or date range."
          >
            <template #expansion="slotProps">
              <div class="p-3 bg-gray-50 dark:bg-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 class="text-lg font-semibold mb-3">Dispatch Instructions</h3>
                  <p class="whitespace-pre-line">{{ slotProps.data.dispatch_instructions || 'No instructions provided' }}</p>
                </div>
                <div>
                  <h3 class="text-lg font-semibold mb-3">Additional Details</h3>
                  <div class="grid grid-cols-2 gap-2">
                    <div class="font-semibold">Created At:</div>
                    <div>{{ formatDate(slotProps.data.created_at) }}</div>
                    
                    <div class="font-semibold">Last Activity:</div>
                    <div>{{ formatDate(slotProps.data.last_activity) }}</div>
                    
                    <div class="font-semibold">Linked Dispatch ID:</div>
                    <div>{{ slotProps.data.linked_dispatch_id || 'N/A' }}</div>
                    
                    <div class="font-semibold">Technician:</div>
                    <div>{{ slotProps.data.technician || 'Not assigned' }}</div>
                    
                    <div class="font-semibold">Check-in Time:</div>
                    <div>{{ slotProps.data.technician_in_time || 'Not checked in' }}</div>
                    
                    <div class="font-semibold">Check-out Time:</div>
                    <div>{{ slotProps.data.technician_out_time || 'Not checked out' }}</div>
                    
                    <div class="font-semibold">Turnup Scope:</div>
                    <div>{{ slotProps.data.turnup_scope_details || 'No scope details' }}</div>
                  </div>
                </div>
              </div>
            </template>
            
            <Column expander style="width: 3rem" />
            
            <Column field="id" header="ID" sortable style="width: 80px">
              <template #body="{ data }">
                <span class="font-semibold text-blue-600 dark:text-blue-400">{{ data.id }}</span>
              </template>
            </Column>
            
            <Column field="customer_name" header="Customer" sortable style="min-width: 150px">
              <template #body="{ data }">
                <div class="flex items-center">
                  <span>{{ data.customer_name }}</span>
                </div>
              </template>
            </Column>
            
            <Column field="site_id" header="Site ID" sortable style="min-width: 120px">
              <template #body="{ data }">
                <div>
                  {{ data.site_id }}
                </div>
              </template>
            </Column>
            
            <Column field="service_date" header="Service Date" sortable style="min-width: 120px">
              <template #body="{ data }">
                {{ formatDate(data.service_date) }}
              </template>
            </Column>
            
            <Column field="service_time" header="Time" sortable style="min-width: 100px">
              <template #body="{ data }">
                {{ data.service_time ? data.service_time.substring(0, 5) : 'N/A' }}
              </template>
            </Column>
            
            <Column field="status" header="Status" sortable style="min-width: 120px">
              <template #body="{ data }">
                <Tag 
                  :value="data.status" 
                  :severity="getStatusTag(data.status).severity"
                  :icon="getStatusTag(data.status).icon"
                />
              </template>
            </Column>
            
            <Column field="project_name" header="Project" sortable style="min-width: 180px">
              <template #body="{ data }">
                <div>
                  {{ data.project_name || 'N/A' }}
                </div>
              </template>
            </Column>
            
            <Column field="project_manager_name" header="Project Manager" sortable style="min-width: 150px">
              <template #body="{ data }">
                <div>
                  {{ data.project_manager_name || 'N/A' }}
                </div>
              </template>
            </Column>
            
            <Column header="Actions" style="width: 100px">
              <template #body="{ data }">
                <div class="flex gap-1">
                  <Button 
                    icon="pi pi-eye" 
                    class="p-button-text p-button-rounded p-button-sm"
                    @click="navigateToTurnup(data)"
                    aria-label="View"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </div>
    
    <!-- Activity Feed Components - Moved below the table -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <RevisitRequiredFeed
        :data="revisitVisits"
        :loading="visitsLoading"
        emptyMessage="No revisit requests found"
      />
      <PartsIssuesFeed
        :data="allVisitsWithIssues"
        :loading="visitsLoading"
        emptyMessage="No parts issues found"
      />
      <CriticalIssuesFeed
        :data="allVisitsWithIssues"
        :loading="visitsLoading"
        emptyMessage="No critical issues found"
      />
    </div>
    
    <ConfirmDialog />
  </div>
</template>

<style scoped>
:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: #f8f9fa;
  color: #495057;
}

:deep(.p-datatable.p-datatable-striped .p-datatable-tbody > tr.p-row-odd) {
  background: #fcfcfc;
}

:deep(.p-datatable .p-datatable-tbody > tr) {
  cursor: default;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: #f5f7f9;
}

:deep(.dark .p-datatable .p-datatable-thead > tr > th) {
  background: #1e1e2d;
  color: #e0e0e0;
}

:deep(.dark .p-datatable.p-datatable-striped .p-datatable-tbody > tr.p-row-odd) {
  background: #2a2a3c;
}

:deep(.dark .p-datatable .p-datatable-tbody > tr:hover) {
  background: #31314a;
}
</style> 