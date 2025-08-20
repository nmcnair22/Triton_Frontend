<template>
  <div class="flex flex-col gap-6">
    <!-- 🎛️ Control Panel (Top Bar) -->
    <Card class="shadow-sm">
      <template #content>
        <div class="flex flex-wrap items-center justify-between gap-4">
          <!-- Date Range & Filters -->
          <div class="flex flex-wrap items-center gap-4">
            <DatePicker 
              v-model="selectedDateRange" 
              selectionMode="range" 
              placeholder="Select Date Range"
              showIcon
              :pt="{
                root: { class: '!rounded-lg border-surface-300 dark:border-surface-600' },
                input: { class: '!py-2 !text-sm' }
              }"
              @date-select="onDateRangeChange"
            />
            
            <Select
              v-model="selectedDatePreset"
              :options="dateRangeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Quick Select"
              @change="onDatePresetChange"
              :pt="{
                root: { class: '!rounded-lg min-w-32' },
                input: { class: '!py-2 !text-sm' }
              }"
            />

            <MultiSelect 
              v-if="filterOptions?.customers"
              v-model="selectedCustomers" 
              :options="filterOptions.customers" 
              optionLabel="label"
              optionValue="value"
              placeholder="Filter by Customer"
              display="chip"
              :pt="{
                root: { class: 'min-w-48 !rounded-lg' },
                label: { class: '!py-2 !text-sm' }
              }"
              @change="onFiltersChange"
            />

            <MultiSelect 
              v-if="filterOptions?.locations"
              v-model="selectedLocations" 
              :options="filterOptions.locations" 
              optionLabel="name"
              optionValue="code"
              placeholder="Filter by Location"
              display="chip"
              :pt="{
                root: { class: 'min-w-48 !rounded-lg' },
                label: { class: '!py-2 !text-sm' }
              }"
              @change="onFiltersChange"
            />

            <MultiSelect 
              v-if="filterOptions?.status_options"
              v-model="selectedStatuses" 
              :options="filterOptions.status_options" 
              optionLabel="label"
              optionValue="value"
              placeholder="Filter by Status"
              display="chip"
              :pt="{
                root: { class: 'min-w-48 !rounded-lg' },
                label: { class: '!py-2 !text-sm' }
              }"
              @change="onFiltersChange"
            />
          </div>

          <!-- Real-time Controls -->
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
              <i class="pi pi-circle-fill text-green-500 animate-pulse" v-if="autoRefresh"></i>
              <i class="pi pi-circle-fill text-gray-400" v-else></i>
              <span class="text-sm text-surface-600 dark:text-surface-400">
                {{ autoRefresh ? 'Live' : 'Paused' }}
              </span>
            </div>
            
            <Select
              v-model="refreshInterval"
              :options="refreshOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Auto-refresh"
              @change="onRefreshIntervalChange"
              :pt="{
                root: { class: '!rounded-lg min-w-24' },
                input: { class: '!py-2 !text-sm' }
              }"
            />
            
            <Button 
              icon="pi pi-refresh" 
              text
              rounded
              @click="refreshData"
              :loading="loading"
              v-tooltip.top="'Refresh Data'"
              :pt="{
                root: { class: '!w-10 !h-10' }
              }"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- 📊 Executive Summary (KPI Cards Row) -->
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <!-- Total Visits Card -->
      <Card class="shadow-sm border-l-4 border-l-blue-500">
        <template #content>
          <div class="flex justify-between items-start">
            <div>
              <span class="text-surface-500 dark:text-surface-400 text-sm font-medium block mb-2">Total Visits</span>
              <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">
                {{ dashboardSummary?.kpis?.total_tickets || 0 }}
              </div>
              <div class="flex items-center gap-1 mt-1" v-if="dashboardSummary?.trends?.completion_rate_change">
                <i class="pi pi-arrow-up text-green-500 text-xs" v-if="dashboardSummary.trends.completion_rate_change.includes('+')"></i>
                <i class="pi pi-arrow-down text-red-500 text-xs" v-else-if="dashboardSummary.trends.completion_rate_change.includes('-')"></i>
                <span class="text-xs text-surface-500">{{ dashboardSummary.trends.completion_rate_change }}</span>
              </div>
            </div>
            <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <i class="pi pi-calendar text-blue-600 dark:text-blue-400 text-lg"></i>
            </div>
          </div>
        </template>
      </Card>

      <!-- Success Rate Card -->
      <Card class="shadow-sm border-l-4 border-l-green-500">
        <template #content>
          <div class="flex justify-between items-start">
            <div>
              <span class="text-surface-500 dark:text-surface-400 text-sm font-medium block mb-2">Success Rate</span>
              <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">
                {{ dashboardSummary?.kpis?.completion_rate ? Math.round(dashboardSummary.kpis.completion_rate) : 0 }}%
              </div>
              <div class="flex items-center gap-1 mt-1" v-if="dashboardSummary?.trends?.completion_rate_change">
                <i class="pi pi-arrow-up text-green-500 text-xs" v-if="dashboardSummary.trends.completion_rate_change.includes('+')"></i>
                <i class="pi pi-arrow-down text-red-500 text-xs" v-else-if="dashboardSummary.trends.completion_rate_change.includes('-')"></i>
                <span class="text-xs text-surface-500">{{ dashboardSummary.trends.completion_rate_change }}</span>
              </div>
            </div>
            <div class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <i class="pi pi-check-circle text-green-600 dark:text-green-400 text-lg"></i>
            </div>
          </div>
        </template>
      </Card>

      <!-- No-show Rate Card -->
      <Card class="shadow-sm border-l-4 border-l-red-500">
        <template #content>
          <div class="flex justify-between items-start">
            <div>
              <span class="text-surface-500 dark:text-surface-400 text-sm font-medium block mb-2">No-shows</span>
              <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">
                {{ dashboardSummary?.kpis?.no_shows || 0 }}
              </div>
              <div class="flex items-center gap-1 mt-1" v-if="dashboardSummary?.kpis?.total_tickets">
                <span class="text-xs text-surface-500">
                  {{ Math.round((dashboardSummary.kpis.no_shows / dashboardSummary.kpis.total_tickets) * 100) }}% of total
                </span>
              </div>
            </div>
            <div class="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <i class="pi pi-times-circle text-red-600 dark:text-red-400 text-lg"></i>
            </div>
          </div>
        </template>
      </Card>

      <!-- Escalation Rate Card -->
      <Card class="shadow-sm border-l-4 border-l-orange-500">
        <template #content>
          <div class="flex justify-between items-start">
            <div>
              <span class="text-surface-500 dark:text-surface-400 text-sm font-medium block mb-2">Escalations</span>
              <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">
                {{ dashboardSummary?.kpis?.escalated || 0 }}
              </div>
              <div class="flex items-center gap-1 mt-1" v-if="dashboardSummary?.kpis?.total_tickets">
                <span class="text-xs text-surface-500">
                  {{ Math.round((dashboardSummary.kpis.escalated / dashboardSummary.kpis.total_tickets) * 100) }}% of total
                </span>
              </div>
            </div>
            <div class="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <i class="pi pi-exclamation-triangle text-orange-600 dark:text-orange-400 text-lg"></i>
            </div>
          </div>
        </template>
      </Card>

      <!-- Active Operations Card -->
      <Card class="shadow-sm border-l-4 border-l-purple-500">
        <template #content>
          <div class="flex justify-between items-start">
            <div>
              <span class="text-surface-500 dark:text-surface-400 text-sm font-medium block mb-2">Active Today</span>
              <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">
                {{ activeOperations?.length || 0 }}
              </div>
              <div class="flex items-center gap-1 mt-1">
                <i class="pi pi-circle-fill text-purple-500 animate-pulse text-xs"></i>
                <span class="text-xs text-surface-500">Live</span>
              </div>
            </div>
            <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <i class="pi pi-cog text-purple-600 dark:text-purple-400 text-lg"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Main Dashboard Content (3-Column Layout) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- 🚨 Critical Alerts (Left Column) -->
      <div class="lg:col-span-3 space-y-6">
        <!-- Priority Action Items -->
        <Panel toggleable :pt="{ root: { class: 'shadow-sm border border-surface-200 dark:border-surface-700' } }">
          <template #header>
            <div class="flex items-center gap-2">
              <i class="pi pi-exclamation-triangle text-red-500"></i>
              <span class="font-semibold">Critical Alerts</span>
              <Badge 
                v-if="riskAnalysis?.attention_needed?.length" 
                :value="riskAnalysis.attention_needed.length" 
                severity="danger" 
              />
            </div>
          </template>
          
          <div v-if="riskAnalysis?.attention_needed?.length" class="space-y-3">
            <div 
              v-for="item in riskAnalysis.attention_needed.slice(0, 5)" 
              :key="item.id"
              class="p-3 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg"
            >
              <div class="flex justify-between items-start mb-2">
                <Badge 
                  :value="item.priority" 
                  :severity="item.priority === 'CRITICAL' ? 'danger' : item.priority === 'HIGH' ? 'warning' : 'info'" 
                  size="small"
                />
                <span class="text-xs text-surface-500">{{ formatDate(item.date) }}</span>
              </div>
              <p class="text-sm text-surface-700 dark:text-surface-300 mb-2">{{ item.description }}</p>
              <div class="flex gap-2">
                <Button 
                  label="View" 
                  size="small" 
                  text 
                  @click="viewCriticalItem(item)"
                  :pt="{ root: { class: '!py-1 !text-xs' } }"
                />
                <Button 
                  label="Escalate" 
                  size="small" 
                  severity="danger" 
                  outlined 
                  @click="escalateItem(item)"
                  :pt="{ root: { class: '!py-1 !text-xs' } }"
                />
              </div>
            </div>
          </div>
          
          <div v-else class="text-center py-6">
            <i class="pi pi-check-circle text-green-500 text-3xl mb-3"></i>
            <p class="text-surface-500">No critical alerts</p>
          </div>
        </Panel>

        <!-- Risk Correlation Widget -->
        <Panel toggleable :pt="{ root: { class: 'shadow-sm border border-surface-200 dark:border-surface-700' } }">
          <template #header>
            <span class="font-semibold">Risk Breakdown</span>
          </template>
          
          <Chart 
            v-if="riskAnalysis?.risk_correlation"
            type="doughnut" 
            :data="riskCorrelationChartData" 
            :options="riskChartOptions"
            class="w-full h-48"
          />
          
          <div v-else class="text-center py-6">
            <p class="text-surface-500">No risk data available</p>
          </div>
        </Panel>
      </div>

      <!-- 📈 Performance Charts (Center Column) -->
      <div class="lg:col-span-6 space-y-6">
        <!-- Main Performance Chart -->
        <Panel toggleable :pt="{ root: { class: 'shadow-sm border border-surface-200 dark:border-surface-700' } }">
          <template #header>
            <span class="font-semibold">Performance Trends</span>
          </template>
          
          <Chart 
            v-if="chartsData?.outcome_trends"
            type="line" 
            :data="performanceChartData" 
            :options="performanceChartOptions"
            class="w-full h-64"
          />
          
          <div v-else class="text-center py-12">
            <ProgressSpinner v-if="loading" />
            <p v-else class="text-surface-500">No performance data available</p>
          </div>
        </Panel>

        <!-- Technician Performance -->
        <Panel toggleable :pt="{ root: { class: 'shadow-sm border border-surface-200 dark:border-surface-700' } }">
          <template #header>
            <span class="font-semibold">Technician Performance</span>
          </template>
          
          <Chart 
            v-if="chartsData?.technician_performance"
            type="bar" 
            :data="visitTypeChartData" 
            :options="visitTypeChartOptions"
            class="w-full h-48"
          />
          
          <div v-else class="text-center py-8">
            <p class="text-surface-500">No technician data available</p>
          </div>
        </Panel>
      </div>

      <!-- 🔍 Insights Widgets (Right Column) -->
      <div class="lg:col-span-3 space-y-6">
        <!-- Customer Performance -->
        <Panel toggleable :pt="{ root: { class: 'shadow-sm border border-surface-200 dark:border-surface-700' } }">
          <template #header>
            <span class="font-semibold">Top Customers</span>
          </template>
          
          <div v-if="customerAnalytics?.customer_performance?.length" class="space-y-3">
            <div 
              v-for="customer in customerAnalytics.customer_performance.slice(0, 5)" 
              :key="customer.id"
              class="flex justify-between items-center p-2 hover:bg-surface-50 dark:hover:bg-surface-800 rounded"
            >
              <div>
                <p class="font-medium text-sm">{{ customer.name }}</p>
                <p class="text-xs text-surface-500">{{ customer.visit_count }} visits</p>
              </div>
              <div class="text-right">
                <Badge 
                  :value="`${Math.round(customer.success_rate)}%`" 
                  :severity="customer.success_rate > 80 ? 'success' : customer.success_rate > 60 ? 'warning' : 'danger'"
                  size="small"
                />
              </div>
            </div>
          </div>
          
          <div v-else class="text-center py-6">
            <p class="text-surface-500">No customer data available</p>
          </div>
        </Panel>

        <!-- Recent Activity -->
        <Panel toggleable :pt="{ root: { class: 'shadow-sm border border-surface-200 dark:border-surface-700' } }">
          <template #header>
            <span class="font-semibold">Recent Activity</span>
          </template>
          
          <Timeline 
            v-if="notesAnalysis?.notes_activity?.length"
            :value="notesAnalysis.notes_activity.slice(0, 5)" 
            layout="vertical"
            :pt="{ event: { class: 'text-xs' } }"
          >
            <template #content="{ item }">
              <div class="p-2">
                <p class="text-sm font-medium">{{ item.title }}</p>
                <p class="text-xs text-surface-500">{{ item.description }}</p>
                <p class="text-xs text-surface-400 mt-1">{{ formatDateTime(item.created_at) }}</p>
              </div>
            </template>
          </Timeline>
          
          <div v-else class="text-center py-6">
            <p class="text-surface-500">No recent activity</p>
          </div>
        </Panel>
      </div>
    </div>

    <!-- 📋 Active Operations Table -->
    <Panel toggleable :pt="{ root: { class: 'shadow-sm border border-surface-200 dark:border-surface-700' } }">
      <template #header>
        <div class="flex items-center gap-2">
          <i class="pi pi-list text-purple-500"></i>
          <span class="font-semibold">Active Operations</span>
          <Badge v-if="activeOperations?.length" :value="activeOperations.length" severity="info" />
        </div>
      </template>
      
      <DataTable 
        v-if="activeOperations?.length"
        :value="activeOperations" 
        :paginator="activeOperations.length > 10"
        :rows="10"
        dataKey="id"
        responsiveLayout="scroll"
        :pt="{
          table: { class: 'border-separate border-spacing-0' },
          row: { class: 'hover:bg-surface-50 dark:hover:bg-surface-800' }
        }"
      >
        <Column field="visit_id" header="Visit ID" style="width: 15%">
          <template #body="{ data }">
            <Button 
              :label="data.visit_id" 
              link 
              size="small"
              @click="viewVisitDetail(data)"
              :pt="{ root: { class: '!text-primary-600 !p-0 !text-sm' } }"
            />
          </template>
        </Column>
        
        <Column field="customer_name" header="Customer" style="width: 20%"></Column>
        
        <Column field="location" header="Location" style="width: 15%"></Column>
        
        <Column field="technician" header="Technician" style="width: 15%"></Column>
        
        <Column field="scheduled_time" header="Scheduled" style="width: 15%">
          <template #body="{ data }">
            {{ formatDateTime(data.scheduled_time) }}
          </template>
        </Column>
        
        <Column field="status" header="Status" style="width: 12%">
          <template #body="{ data }">
            <Tag 
              :value="data.status" 
              :severity="getStatusSeverity(data.status)"
              size="small"
            />
          </template>
        </Column>
        
        <Column header="Actions" style="width: 8%">
          <template #body="{ data }">
            <Button 
              icon="pi pi-eye" 
              text 
              rounded 
              size="small"
              @click="viewVisitDetail(data)"
              v-tooltip.top="'View Details'"
              :pt="{ root: { class: '!w-8 !h-8' } }"
            />
          </template>
        </Column>
      </DataTable>
      
      <div v-else class="text-center py-12">
        <i class="pi pi-clock text-surface-300 text-4xl mb-4"></i>
        <p class="text-surface-500">No active operations</p>
      </div>
    </Panel>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useDispatchStore } from '@/stores/dispatchStore'

// Store
const dispatchStore = useDispatchStore()

// Reactive data
const selectedDateRange = ref()
const selectedDatePreset = ref('last7days')
const selectedCustomers = ref([])
const selectedLocations = ref([])
const selectedStatuses = ref([])
const autoRefresh = ref(true)
const refreshInterval = ref(120000) // 2 minutes
const refreshTimer = ref(null)

// Computed properties from store
const loading = computed(() => dispatchStore.loading)
const dashboardSummary = computed(() => dispatchStore.dashboardSummary)
const activeOperations = computed(() => dispatchStore.activeOperations)
const riskAnalysis = computed(() => dispatchStore.riskAnalysis)
const customerAnalytics = computed(() => dispatchStore.customerAnalytics)
const trendAnalysis = computed(() => dispatchStore.trendAnalysis)
const visitTypeAnalysis = computed(() => dispatchStore.visitTypeAnalysis)
const benchmarks = computed(() => dispatchStore.benchmarks)
const notesAnalysis = computed(() => dispatchStore.notesAnalysis)
const filterOptions = computed(() => dispatchStore.filterOptions)
const chartsData = computed(() => dispatchStore.chartsData)
const dateRangeOptions = computed(() => dispatchStore.dateRangeOptions)

// Options
const refreshOptions = [
  { label: 'Off', value: 0 },
  { label: '30s', value: 30000 },
  { label: '2m', value: 120000 },
  { label: '5m', value: 300000 }
]

// Chart data computed properties
const riskCorrelationChartData = computed(() => {
  if (!riskAnalysis.value?.risk_correlation) return null
  
  const data = riskAnalysis.value.risk_correlation
  return {
    labels: data.map(item => item.category),
    datasets: [{
      data: data.map(item => item.count),
      backgroundColor: [
        '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16'
      ]
    }]
  }
})

const performanceChartData = computed(() => {
  if (!chartsData.value?.outcome_trends) return null
  
  const data = chartsData.value.outcome_trends
  const datasets = []
  
  // Convert backend data structure to Chart.js format
  if (data.datasets) {
    Object.entries(data.datasets).forEach(([label, values], index) => {
      const colors = ['#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6']
      datasets.push({
        label: label,
        data: values,
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '20',
        tension: 0.4
      })
    })
  }
  
  return {
    labels: data.labels || [],
    datasets: datasets
  }
})

const visitTypeChartData = computed(() => {
  if (!chartsData.value?.technician_performance) return null
  
  const data = chartsData.value.technician_performance
  return {
    labels: data.map(item => item.name),
    datasets: [{
      label: 'Completion Rate',
      data: data.map(item => item.completion_rate),
      backgroundColor: data.map(item => 
        item.completion_rate > 80 ? '#10b981' : 
        item.completion_rate > 60 ? '#f59e0b' : '#ef4444'
      )
    }]
  }
})

// Chart options
const riskChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { fontSize: 12 }
    }
  }
})

const performanceChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' }
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100
    }
  }
})

const visitTypeChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      ticks: {
        callback: function(value) {
          return value + '%'
        }
      }
    }
  }
})

// Methods
const buildFilters = () => {
  const filters = {}
  
  if (selectedDateRange.value && selectedDateRange.value[0] && selectedDateRange.value[1]) {
    filters.date_from = selectedDateRange.value[0].toISOString().split('T')[0]
    filters.date_to = selectedDateRange.value[1].toISOString().split('T')[0]
  } else if (selectedDatePreset.value) {
    const dateRange = dispatchStore.calculateDateRange(selectedDatePreset.value)
    if (dateRange) {
      filters.date_from = dateRange.start_date
      filters.date_to = dateRange.end_date
    }
  }
  
  if (selectedCustomers.value.length) {
    filters.customers = selectedCustomers.value
  }
  
  if (selectedLocations.value.length) {
    filters.locations = selectedLocations.value
  }
  
  if (selectedStatuses.value.length) {
    filters.statuses = selectedStatuses.value
  }
  
  return filters
}

const loadDashboardData = async () => {
  try {
    const filters = buildFilters()
    await dispatchStore.fetchAllDashboardData(filters)
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
}

const refreshData = async () => {
  await loadDashboardData()
}

const onDateRangeChange = () => {
  selectedDatePreset.value = null
  loadDashboardData()
}

const onDatePresetChange = () => {
  selectedDateRange.value = null
  loadDashboardData()
}

const onFiltersChange = () => {
  loadDashboardData()
}

const onRefreshIntervalChange = () => {
  setupAutoRefresh()
}

const setupAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
  
  if (refreshInterval.value > 0) {
    autoRefresh.value = true
    refreshTimer.value = setInterval(() => {
      loadDashboardData()
    }, refreshInterval.value)
  } else {
    autoRefresh.value = false
  }
}

// Utility methods
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString()
}

const getStatusSeverity = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed': return 'success'
    case 'in progress': return 'info'
    case 'en route': return 'info'
    case 'failed': return 'danger'
    case 'cancelled': return 'danger'
    case 'overdue': return 'danger'
    case 'scheduled': return 'secondary'
    default: return 'info'
  }
}

// Action handlers
const viewCriticalItem = (item) => {
  console.log('Viewing critical item:', item)
}

const escalateItem = (item) => {
  console.log('Escalating item:', item)
}

const viewVisitDetail = (visit) => {
  console.log('Viewing visit detail:', visit)
}

// Lifecycle
onMounted(async () => {
  console.log('🚀 Dispatch Dashboard mounted')
  
  // Set default date preset
  selectedDatePreset.value = 'last7days'
  
  // Set default date range to last 7 days
  const defaultRange = dispatchStore.calculateDateRange('last7days')
  if (defaultRange) {
    selectedDateRange.value = [
      new Date(defaultRange.start_date),
      new Date(defaultRange.end_date)
    ]
  }
  
  // Load initial data
  await loadDashboardData()
  
  // Setup auto-refresh
  setupAutoRefresh()
})

onUnmounted(() => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }
})
</script>

<style scoped>
.space-y-3 > * + * {
  margin-top: 0.75rem;
}

.space-y-6 > * + * {
  margin-top: 1.5rem;
}
</style>