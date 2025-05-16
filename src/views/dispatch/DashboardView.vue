<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useDispatchStore } from '@/stores/dispatchStore';
import { storeToRefs } from 'pinia';
import Card from 'primevue/card';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import MultiSelect from 'primevue/multiselect';
import DatePicker from 'primevue/datepicker';
import Breadcrumb from 'primevue/breadcrumb';
import Tag from 'primevue/tag';
import Chart from 'primevue/chart';
import ProgressBar from 'primevue/progressbar';
import { useToast } from 'primevue/usetoast';

// Router for navigation
const router = useRouter();
const toast = useToast();

// Initialize the dispatch store
const dispatchStore = useDispatchStore();
const { dashboardSummary, dashboardTrends, projects, alerts, loading, error } = storeToRefs(dispatchStore);

// Breadcrumb navigation function
const navigateTo = (path) => {
  console.log('Navigating to:', path);
  router.push(path);
};

// Breadcrumb items
const breadcrumbItems = ref([
  { label: 'Home', route: '/' },
  { label: 'Projects Dashboard' }
]);
const breadcrumbHome = { icon: 'pi pi-home', route: '/' };

// Selected project for DataTable
const selectedProject = ref(null);

// Filter state
const dateRange = ref([new Date(new Date().setDate(new Date().getDate() - 30)), new Date()]);
const selectedCustomer = ref(null);
const selectedStatus = ref(null);

// Customer options
const customerOptions = ref([
  { name: 'All Customers', code: null },
  { name: 'Flynn', code: 'flynn' },
  { name: 'Wendy\'s', code: 'wendys' },
  { name: 'Burger King', code: 'bk' },
  { name: 'McDonald\'s', code: 'mcdonalds' }
]);

// Status options
const statusOptions = ref([
  { name: 'All Statuses', code: null },
  { name: 'In Progress', code: 'in_progress' },
  { name: 'Completed', code: 'completed' },
  { name: 'At Risk', code: 'at_risk' }
]);

// Computed properties mapped from store data
const dashboardData = computed(() => {
  const data = {
    summary: {
      totalProjects: dashboardSummary.value?.summary?.projects?.total || 0,
      totalJobs: dashboardSummary.value?.summary?.jobs?.total || 0,
      totalVisits: dashboardSummary.value?.summary?.visits?.total || 0,
      openIssues: dashboardSummary.value?.summary?.issues?.open || 0,
      avgCompletionPct: dashboardSummary.value?.metrics_trend?.[0]?.avg_completion_pct || 0,
      atRiskCount: dashboardSummary.value?.summary?.projects?.health?.at_risk || 0
    },
    projectList: projects.value || [],
    globalTrends: dashboardTrends.value?.metrics || [],
    alerts: alerts.value || []
  };
  
  console.log('[DEBUG] dashboardData computed values:', data);
  return data;
});

// Computed properties for charts
const trendChartData = computed(() => {
  const trends = dashboardData.value.globalTrends;
  if (!trends || !trends.length) {
    console.log('[DEBUG] No trend data available for chart');
    return { labels: [], datasets: [] };
  }
  
  console.log('[DEBUG] Building chart with trends data:', trends);
  
  const labels = trends.map(item => {
    const date = new Date(item.date);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  
  return {
    labels,
    datasets: [
      {
        label: 'Issues Opened',
        data: trends.map(item => item.issuesOpened || 0),
        borderColor: '#FF6384',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4
      },
      {
        label: 'Visits Scheduled',
        data: trends.map(item => item.visitsScheduled || 0),
        borderColor: '#36A2EB',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4
      },
      {
        label: 'Projects Completed',
        data: trends.map(item => item.projectsCompleted || 0),
        borderColor: '#4BC0C0',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4
      }
    ]
  };
});

const trendChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top'
    },
    tooltip: {
      mode: 'index',
      intersect: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0
      }
    }
  }
};

// Methods
const applyFilters = () => {
  console.log('[DEBUG] DashboardView: Applying filters:', {
    dateRange: dateRange.value,
    customer: selectedCustomer.value,
    status: selectedStatus.value
  });
  
  // Call the store methods with the filter parameters
  const params = {};
  if (selectedCustomer.value) params.customer_id = selectedCustomer.value.code;
  if (selectedStatus.value) params.status = selectedStatus.value.code;
  
  if (dateRange.value && dateRange.value.length === 2) {
    params.date_from = dateRange.value[0];
    params.date_to = dateRange.value[1];
  }
  
  loadDashboardData(params);
};

const resetFilters = () => {
  dateRange.value = [new Date(new Date().setDate(new Date().getDate() - 30)), new Date()];
  selectedCustomer.value = null;
  selectedStatus.value = null;
  loadDashboardData();
};

const loadDashboardData = (params = {}) => {
  console.log('[DEBUG] DashboardView: Loading dashboard data with params:', JSON.parse(JSON.stringify(params)));
  
  // First load summary data
  dispatchStore.fetchDashboardSummary().then(response => {
    console.log('[DEBUG] DashboardView: Dashboard summary loaded successfully');
  }).catch(err => {
    console.error('[DEBUG] DashboardView: Error fetching dashboard summary:', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load dashboard summary data',
      life: 3000
    });
  });
  
  // Then load trends data
  dispatchStore.fetchDashboardTrends().then(response => {
    console.log('[DEBUG] DashboardView: Dashboard trends loaded successfully');
  }).catch(err => {
    console.error('[DEBUG] DashboardView: Error fetching dashboard trends:', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load dashboard trends data',
      life: 3000
    });
  });
  
  // Load projects list
  dispatchStore.fetchProjects(params).then(response => {
    console.log('[DEBUG] DashboardView: Projects loaded successfully');
  }).catch(err => {
    console.error('[DEBUG] DashboardView: Error fetching projects:', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load projects data',
      life: 3000
    });
  });
  
  // Load alerts
  dispatchStore.fetchAlerts().then(response => {
    console.log('[DEBUG] DashboardView: Alerts loaded successfully');
  }).catch(err => {
    console.error('[DEBUG] DashboardView: Error fetching alerts:', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load alerts data',
      life: 3000
    });
  });
};

const navigateToProject = (project) => {
  console.log('[DEBUG] DashboardView: Navigating to project:', project.project_id);
  router.push(`/dashboard/projects/${project.project_id}`);
};

const getSeverity = (trend) => {
  switch (trend) {
    case 'improving': return 'success';
    case 'steady': return 'info';
    case 'declining': return 'warning';
    default: return 'info';
  }
};

const getAtRiskSeverity = (score) => {
  if (score >= 75) return 'danger';
  if (score >= 50) return 'warning';
  if (score >= 25) return 'info';
  return 'success';
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Initialize data
onMounted(() => {
  console.log('[DEBUG] DashboardView: Component mounted, fetching initial data');
  loadDashboardData();
});
</script>

<template>
  <div class="p-4">
    <!-- Breadcrumbs -->
    <Breadcrumb :model="breadcrumbItems" :home="breadcrumbHome" class="mb-4 border-none surface-ground">
      <template #item="{ item, props }">
        <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
          <a :href="href" v-bind="props.action" @click="navigate">
            <span v-if="item.icon" :class="[item.icon, 'text-color']"></span>
            <span class="text-primary font-semibold">{{ item.label }}</span>
          </a>
        </router-link>
        <a v-else v-bind="props.action">
          <span class="text-surface-700 dark:text-surface-0">{{ item.label }}</span>
        </a>
      </template>
    </Breadcrumb>
    
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold mb-2">Field Service Dashboard</h1>
        <p class="text-color-secondary">Overview of all projects, jobs, and visits</p>
      </div>
    </div>
    
    <!-- Filter Bar -->
    <div class="bg-white dark:bg-surface-900 p-4 rounded-lg shadow mb-6">
      <form class="flex flex-col gap-4" @submit.prevent="applyFilters">
        <!-- First row with date range and customer -->
        <div class="flex flex-col md:flex-row gap-4">
          <!-- Date range filter -->
          <div class="flex flex-col gap-2 w-full">
            <label for="dateRange" class="text-xs font-semibold text-surface-600 dark:text-surface-300">Date Range</label>
            <DatePicker 
              id="dateRange"
              v-model="dateRange" 
              selectionMode="range" 
              dateFormat="mm/dd/yy"
              placeholder="Select date range" 
              class="w-full" 
              aria-label="Date Range"
            />
          </div>
          
          <!-- Customer filter -->
          <div class="flex flex-col gap-2 w-full">
            <label for="customerFilter" class="text-xs font-semibold text-surface-600 dark:text-surface-300">Customer</label>
            <Select
              id="customerFilter"
              v-model="selectedCustomer"
              :options="customerOptions"
              optionLabel="name"
              optionValue="code"
              placeholder="Select a customer"
              class="w-full"
              aria-label="Customer filter"
            />
          </div>
          
          <!-- Status filter -->
          <div class="flex flex-col gap-2 w-full">
            <label for="statusFilter" class="text-xs font-semibold text-surface-600 dark:text-surface-300">Project Status</label>
            <MultiSelect
              id="statusFilter"
              v-model="selectedStatus"
              :options="statusOptions"
              optionLabel="name"
              optionValue="code"
              placeholder="Select status"
              class="w-full"
              aria-label="Status filter"
            />
          </div>
        </div>
        
        <!-- Action buttons -->
        <div class="flex justify-end gap-2">
          <Button type="button" label="Reset" icon="pi pi-refresh" outlined @click="resetFilters" />
          <Button type="submit" label="Apply Filters" icon="pi pi-search" />
        </div>
      </form>
    </div>
    
    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      <!-- Total Projects -->
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-folder text-blue-500"></i>
            <span>Total Projects</span>
          </div>
        </template>
        <template #content>
          <div class="text-3xl font-bold">{{ dashboardData.summary.totalProjects }}</div>
        </template>
      </Card>
      
      <!-- Total Jobs -->
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-briefcase text-green-500"></i>
            <span>Total Jobs</span>
          </div>
        </template>
        <template #content>
          <div class="text-3xl font-bold">{{ dashboardData.summary.totalJobs }}</div>
        </template>
      </Card>
      
      <!-- Total Visits -->
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-calendar text-purple-500"></i>
            <span>Total Visits</span>
          </div>
        </template>
        <template #content>
          <div class="text-3xl font-bold">{{ dashboardData.summary.totalVisits }}</div>
        </template>
      </Card>
      
      <!-- Open Issues -->
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-exclamation-circle text-yellow-500"></i>
            <span>Open Issues</span>
          </div>
        </template>
        <template #content>
          <div class="text-3xl font-bold">{{ dashboardData.summary.openIssues }}</div>
        </template>
      </Card>
      
      <!-- Avg Completion % -->
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-chart-line text-cyan-500"></i>
            <span>Avg Completion</span>
          </div>
        </template>
        <template #content>
          <div class="text-3xl font-bold">{{ dashboardData.summary.avgCompletionPct }}%</div>
        </template>
      </Card>
      
      <!-- At Risk Count -->
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-flag text-red-500"></i>
            <span>At Risk</span>
          </div>
        </template>
        <template #content>
          <div class="text-3xl font-bold">{{ dashboardData.summary.atRiskCount }}</div>
        </template>
      </Card>
    </div>
    
    <!-- Projects Table -->
    <div class="bg-white dark:bg-surface-900 p-4 rounded-lg shadow mb-6">
      <h2 class="text-xl font-bold mb-4">Projects</h2>
      <DataTable 
        :value="dashboardData.projectList" 
        :paginator="true" 
        :rows="10"
        stripedRows 
        responsiveLayout="scroll"
        class="p-datatable-sm"
        v-model:selection="selectedProject"
        selectionMode="single"
        dataKey="project_id"
        @row-click="event => navigateToProject(event.data)"
      >
        <Column field="project_id" header="ID" sortable style="width: 10%"></Column>
        <Column field="project_name" header="Project Name" sortable style="width: 30%"></Column>
        <Column field="customer_name" header="Customer" sortable style="width: 15%"></Column>
        <Column field="total_jobs" header="Sites" sortable style="width: 10%"></Column>
        <Column field="completion_percentage" header="Completion %" sortable style="width: 15%">
          <template #body="slotProps">
            <div class="flex flex-col gap-1">
              <div>{{ slotProps.data.completion_percentage }}%</div>
              <ProgressBar :value="slotProps.data.completion_percentage" :showValue="false" style="height: 6px" />
            </div>
          </template>
        </Column>
        <Column field="status" header="Status" sortable style="width: 10%">
          <template #body="slotProps">
            <Tag :value="slotProps.data.status" :severity="getSeverity(slotProps.data.status)" />
          </template>
        </Column>
        <Column field="health_score" header="Risk Score" sortable style="width: 10%">
          <template #body="slotProps">
            <Tag :value="slotProps.data.health_score" :severity="getAtRiskSeverity(slotProps.data.health_score)" />
          </template>
        </Column>
      </DataTable>
    </div>
    
    <!-- Two Column Layout for Chart and Alerts -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Global Trends Chart -->
      <div class="lg:col-span-2 bg-white dark:bg-surface-900 p-4 rounded-lg shadow">
        <h2 class="text-xl font-bold mb-4">Global Trends</h2>
        <div style="height: 300px">
          <Chart type="line" :data="trendChartData" :options="trendChartOptions" />
        </div>
      </div>
      
      <!-- Alerts Panel -->
      <div class="bg-white dark:bg-surface-900 p-4 rounded-lg shadow">
        <h2 class="text-xl font-bold mb-4">Alerts</h2>
        <div class="flex flex-col gap-4">
          <div v-for="alert in dashboardData.alerts" :key="alert.id" class="border-b pb-4 border-gray-200 dark:border-gray-700 last:border-0">
            <div class="flex items-start gap-3">
              <i class="pi pi-exclamation-triangle text-yellow-500 mt-1"></i>
              <div>
                <h3 class="font-semibold">{{ alert.title || 'Alert' }}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ alert.description }}</p>
                <div class="text-xs text-gray-500 mt-1">{{ formatDate(alert.created_at) }}</div>
              </div>
            </div>
          </div>
          
          <div v-if="dashboardData.alerts.length === 0" class="text-center py-4 text-gray-500">
            No alerts at this time
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom styles if needed */
:deep(.p-datatable-wrapper) {
  overflow-x: auto;
}

:deep(.p-card .p-card-title) {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

:deep(.p-card .p-card-content) {
  padding-top: 0;
}

:deep(.p-datatable .p-datatable-tbody > tr) {
  cursor: pointer;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background-color: var(--surface-100);
}
</style> 