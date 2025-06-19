<template>
  <div class="dispatch-dashboard p-6 space-y-6">
    <!-- Header Section -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-surface-900">Dispatch Dashboard</h1>
        <p class="text-surface-600 mt-1">
          Real-time operational overview and performance metrics
        </p>
      </div>
      
      <div class="flex items-center gap-3">
        <Button 
          icon="pi pi-refresh" 
          :loading="isLoading"
          @click="refreshDashboard"
          severity="secondary"
          outlined
        />
        <div class="flex items-center gap-2 text-sm text-surface-500">
          <i class="pi pi-clock"></i>
          <span>Last updated: {{ dashboardStore.lastUpdatedFormatted }}</span>
        </div>
      </div>
    </div>

    <!-- Real-time Connection Status -->
    <div class="flex items-center space-x-2">
      <div class="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium"
           :class="connectionStatus ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'">
        <div class="w-2 h-2 rounded-full"
             :class="connectionStatus ? 'bg-green-500 animate-pulse' : 'bg-red-500'"></div>
        <span>{{ connectionStatus ? 'Live Updates' : 'Offline' }}</span>
      </div>
    </div>

    <!-- Real-time Status Bar -->
    <div class="grid grid-cols-4 gap-4">
      <MetricCard
        title="Active Jobs"
        :value="metrics.activeJobs"
        icon="pi pi-briefcase"
        icon-color="primary"
        size="sm"
      />
      <MetricCard
        title="Online Teams"
        :value="metrics.onlineTeams"
        icon="pi pi-users"
        icon-color="success"
        size="sm"
      />
      <MetricCard
        title="Completed Today"
        :value="metrics.completedToday"
        icon="pi pi-check-circle"
        icon-color="warning"
        size="sm"
      />
      <MetricCard
        title="Revenue Today"
        :value="dashboardStore.formatCurrency(metrics.revenueToday)"
        icon="pi pi-dollar"
        icon-color="success"
        size="sm"
      />
    </div>

    <!-- Key Performance Metrics -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Jobs"
        :value="metrics.activeJobs || 0"
        icon="pi pi-briefcase"
        description="Active jobs"
      />
      <MetricCard
        title="Visits Today"
        :value="metrics.completedToday || 0"
        icon="pi pi-map-marker"
        icon-color="info"
        description="Completed today"
      />
      <MetricCard
        title="Revenue Today"
        :value="dashboardStore.formatCurrency(metrics.revenueToday || 0)"
        icon="pi pi-dollar"
        icon-color="success"
        description="Today's revenue"
      />
      <MetricCard
        title="Health Score"
        :value="`${healthScore}%`"
        icon="pi pi-heart"
        :icon-color="healthColor"
        description="Overall performance"
      />
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Trends Chart -->
      <BaseCard>
        <template #header>
          <h3 class="text-lg font-semibold">Performance Trends</h3>
        </template>
        
        <div v-if="trendsData.visitVolume && trendsData.visitVolume.length > 0" class="h-64">
          <InteractiveChart
            type="line"
            :data="{
              labels: trendsData.visitVolume.map((_, index) => `Day ${index + 1}`),
              datasets: [{
                label: 'Visit Volume',
                data: trendsData.visitVolume,
                borderColor: '#007AD9',
                backgroundColor: 'rgba(0, 122, 217, 0.1)',
                tension: 0.4
              }]
            }"
            :options="lineChartOptions"
            height="240px"
          />
        </div>
        <div v-else class="h-64 flex items-center justify-center text-surface-500">
          <div class="text-center">
            <i class="pi pi-chart-line text-4xl mb-2"></i>
            <p>No trend data available</p>
          </div>
        </div>
      </BaseCard>

      <!-- Health Score -->
      <BaseCard>
        <template #header>
          <h3 class="text-lg font-semibold">System Health</h3>
        </template>
        
        <div class="flex items-center justify-center h-64">
          <div class="relative">
            <svg class="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="56"
                stroke="currentColor"
                stroke-width="8"
                fill="transparent"
                class="text-surface-200 dark:text-surface-700"
              />
              <circle
                cx="60"
                cy="60"
                r="56"
                stroke="currentColor"
                stroke-width="8"
                fill="transparent"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="circumference - (healthScore / 100) * circumference"
                :class="healthScoreColor"
                class="transition-all duration-1000 ease-out"
              />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="text-center">
                <div class="text-2xl font-bold" :class="healthScoreColor">
                  {{ healthScore }}%
                </div>
                <div class="text-sm text-surface-600">
                  {{ healthScoreDescription }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Critical Alerts -->
    <BaseCard title="Critical Alerts" variant="elevated" class="col-span-full">
      <div class="space-y-3">
        <div v-for="alert in displayedAlerts" :key="alert.id" 
             class="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div class="flex items-center space-x-3">
            <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <div>
              <p class="font-medium text-red-900 dark:text-red-100">{{ alert.title }}</p>
              <p class="text-sm text-red-700 dark:text-red-300">{{ alert.message || alert.description }}</p>
            </div>
          </div>
          <span class="text-xs text-red-600 dark:text-red-400">{{ formatTime(alert.created_at || alert.timestamp) }}</span>
        </div>
        
        <div v-if="displayedAlerts.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
          <i class="pi pi-check-circle text-2xl mb-2 text-green-500"></i>
          <p>No critical alerts</p>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useDashboardStore } from '@/stores/dispatch-v2/dashboard'
import { useTritonRealTime } from '../shared/composables/useTritonRealTime'
import BaseCard from '../shared/components/BaseCard.vue'
import StatusIndicator from '../shared/components/StatusIndicator.vue'
import MetricCard from '../shared/components/MetricCard.vue'
import InteractiveChart from '../shared/components/InteractiveChart.vue'
import WebSocketTester from '../shared/components/WebSocketTester.vue'

// Store
const dashboardStore = useDashboardStore()

// Real-time composable
const { connectionStatus, isConnected } = useTritonRealTime()

// Reactive data
const autoRefreshEnabled = ref(true)
const refreshInterval = ref(30) // seconds

// Computed
const metrics = computed(() => dashboardStore.realTimeMetrics)
const healthScore = computed(() => dashboardStore.healthScore)
const healthColor = computed(() => dashboardStore.healthScoreColor)
const alerts = computed(() => dashboardStore.criticalAlerts)
const displayedAlerts = computed(() => {
  const alertsArray = alerts.value
  return Array.isArray(alertsArray) ? alertsArray.slice(0, 5) : []
})
const trendsData = computed(() => dashboardStore.trendsData)
const isLoading = computed(() => Object.values(dashboardStore.loading).some(state => state))
const hasErrors = computed(() => Object.values(dashboardStore.errors).some(error => error !== null))

// Health score calculations
const circumference = 2 * Math.PI * 56

const healthScoreColor = computed(() => {
  if (healthScore.value >= 90) return 'text-green-500'
  if (healthScore.value >= 70) return 'text-yellow-500'
  return 'text-red-500'
})

const healthScoreDescription = computed(() => {
  if (healthScore.value >= 90) return 'Excellent performance'
  if (healthScore.value >= 70) return 'Good performance'
  if (healthScore.value >= 50) return 'Needs attention'
  return 'Critical issues detected'
})

// Chart options
const lineChartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top'
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
}

// Methods
async function refreshDashboard() {
  await dashboardStore.refreshDashboard()
}

function toggleAutoRefresh() {
  autoRefreshEnabled.value = !autoRefreshEnabled.value
  if (autoRefreshEnabled.value) {
    dashboardStore.startAutoRefresh()
  } else {
    dashboardStore.stopAutoRefresh()
  }
}

function dismissAlert(alertId) {
  dashboardStore.dismissAlert(alertId)
}

function formatTime(timestamp) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp))
}

// Lifecycle
onMounted(async () => {
  await dashboardStore.loadDashboardData()
  
  if (autoRefreshEnabled.value) {
    dashboardStore.startAutoRefresh()
  }
})

onUnmounted(() => {
  dashboardStore.stopAutoRefresh()
})
</script>

<style scoped>
.dispatch-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}
</style> 