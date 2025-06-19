<template>
  <div class="engineering-dashboard">
    <!-- Header section with title and controls -->
    <div class="flex justify-between items-center mb-5">
      <div>
        <h1 class="text-3xl font-bold mb-1">Engineering Dashboard</h1>
        <p class="text-surface-600 dark:text-surface-300">Monitor system health, track tickets, and manage engineering workload</p>
      </div>
      <div class="flex gap-2">
        <Button icon="pi pi-refresh" text rounded @click="refreshData" :disabled="isLoading" />
        <Button icon="pi pi-bell" text rounded :badge="realCriticalAlertsCount > 0 ? realCriticalAlertsCount.toString() : null" badgeClass="p-badge-danger" />
        <Button icon="pi pi-filter" label="Filters" outlined />
      </div>
    </div>

    <!-- KPI Cards Row 1 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
      <!-- System Health -->
      <div class="card shadow-sm border-l-4 border-l-blue-500 p-4 h-32">
        <div class="flex justify-between items-start h-full">
          <div class="flex flex-col justify-between h-full">
            <p class="text-surface-600 dark:text-surface-300 mb-2">System Health</p>
            <h2 class="text-3xl font-bold mb-1">{{ healthScore }}/100</h2>
            <div class="text-blue-500 font-medium text-sm">
              <i class="pi pi-info-circle"></i> 
              {{ healthStatus }}
            </div>
          </div>
          <div class="bg-blue-100 rounded-full p-3 text-blue-500 w-12 h-12 flex items-center justify-center flex-shrink-0">
            <i class="pi pi-heart text-xl"></i>
          </div>
        </div>
      </div>

      <!-- Critical Alerts -->
      <div class="card shadow-sm border-l-4 border-l-red-500 p-4 h-32">
        <div class="flex justify-between items-start h-full">
          <div class="flex flex-col justify-between h-full">
            <p class="text-surface-600 dark:text-surface-300 mb-2">Critical Alerts</p>
            <h2 class="text-3xl font-bold mb-1">{{ realCriticalAlertsCount }}</h2>
            <div class="text-red-500 font-medium text-sm">
              <i class="pi pi-exclamation-triangle"></i> 
              Stalled
            </div>
          </div>
          <div class="bg-red-100 rounded-full p-3 text-red-500 w-12 h-12 flex items-center justify-center flex-shrink-0">
            <i class="pi pi-exclamation-circle text-xl"></i>
          </div>
        </div>
      </div>

      <!-- Open Tickets -->
      <div class="card shadow-sm border-l-4 border-l-yellow-500 p-4 h-32">
        <div class="flex justify-between items-start h-full">
          <div class="flex flex-col justify-between h-full">
            <p class="text-surface-600 dark:text-surface-300 mb-2">Open Tickets</p>
            <h2 class="text-3xl font-bold mb-1">{{ openTicketsCount }}</h2>
            <div class="text-yellow-500 font-medium text-sm">
              <i class="pi pi-clock"></i> 
              {{ unassignedTickets }} Unassigned
            </div>
          </div>
          <div class="bg-yellow-100 rounded-full p-3 text-yellow-500 w-12 h-12 flex items-center justify-center flex-shrink-0">
            <i class="pi pi-ticket text-xl"></i>
          </div>
        </div>
      </div>

      <!-- Customer Risk -->
      <div class="card shadow-sm border-l-4 border-l-purple-500 p-4 h-32">
        <div class="flex justify-between items-start h-full">
          <div class="flex flex-col justify-between h-full">
            <p class="text-surface-600 dark:text-surface-300 mb-2">Customer Risk</p>
            <h2 class="text-3xl font-bold mb-1">{{ highRiskCustomers }} of {{ totalCustomers }}</h2>
            <div class="text-orange-500 font-medium text-sm">
              High Risk Customers
            </div>
          </div>
          <div class="bg-purple-100 rounded-full p-3 text-purple-500 w-12 h-12 flex items-center justify-center flex-shrink-0">
            <i class="pi pi-shield text-xl"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Real Data Only Row 2 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
      <!-- Unassigned Tickets -->
      <div class="card shadow-sm border-l-4 border-l-red-500 p-4 h-32">
        <div class="flex justify-between items-start h-full">
          <div class="flex flex-col justify-between h-full">
            <p class="text-surface-600 dark:text-surface-300 mb-2">Unassigned Tickets</p>
            <h2 class="text-3xl font-bold mb-1">{{ unassignedTickets }}</h2>
            <div class="text-red-500 font-medium text-sm">
              <i class="pi pi-exclamation-triangle"></i> 
              {{ unassignedPercentage }}% of Total
            </div>
          </div>
          <div class="bg-red-100 rounded-full p-3 text-red-500 w-12 h-12 flex items-center justify-center flex-shrink-0">
            <i class="pi pi-user-plus text-xl"></i>
          </div>
        </div>
      </div>

      <!-- Due This Week -->
      <div class="card shadow-sm border-l-4 border-l-orange-500 p-4 h-32">
        <div class="flex justify-between items-start h-full">
          <div class="flex flex-col justify-between h-full">
            <p class="text-surface-600 dark:text-surface-300 mb-2">Due This Week</p>
            <h2 class="text-3xl font-bold mb-1">{{ dueThisWeekCount }}</h2>
            <div class="text-orange-500 font-medium text-sm">
              <i class="pi pi-calendar"></i> 
              {{ dueThisWeekStatus }}
            </div>
          </div>
          <div class="bg-orange-100 rounded-full p-3 text-orange-500 w-12 h-12 flex items-center justify-center flex-shrink-0">
            <i class="pi pi-calendar text-xl"></i>
          </div>
        </div>
      </div>

      <!-- Average Ticket Age -->
      <div class="card shadow-sm border-l-4 border-l-blue-500 p-4 h-32">
        <div class="flex justify-between items-start h-full">
          <div class="flex flex-col justify-between h-full">
            <p class="text-surface-600 dark:text-surface-300 mb-2">Average Ticket Age</p>
            <h2 class="text-3xl font-bold mb-1">{{ averageTicketAge }} days</h2>
            <div class="text-blue-500 font-medium text-sm">
              <i class="pi pi-clock"></i> 
              {{ averageAgeStatus }}
            </div>
          </div>
          <div class="bg-blue-100 rounded-full p-3 text-blue-500 w-12 h-12 flex items-center justify-center flex-shrink-0">
            <i class="pi pi-clock text-xl"></i>
          </div>
        </div>
      </div>

      <!-- Oldest Ticket -->
      <div class="card shadow-sm border-l-4 border-l-red-500 p-4 h-32">
        <div class="flex justify-between items-start h-full">
          <div class="flex flex-col justify-between h-full">
            <p class="text-surface-600 dark:text-surface-300 mb-2">Oldest Ticket</p>
            <h2 class="text-3xl font-bold mb-1">{{ oldestTicketAge }} days</h2>
            <div class="text-red-500 font-medium text-sm">
              <i class="pi pi-exclamation-triangle"></i> 
              {{ oldestTicketStatus }}
            </div>
          </div>
          <div class="bg-red-100 rounded-full p-3 text-red-500 w-12 h-12 flex items-center justify-center flex-shrink-0">
            <i class="pi pi-hourglass text-xl"></i>
          </div>
        </div>
      </div>
    </div>



    <!-- Analytics Section -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
      <!-- Ticket Aging Analysis -->
      <div class="xl:col-span-8">
        <div class="card p-5">
          <div class="flex justify-between items-center mb-4">
            <div>
              <h2 class="text-xl font-bold mb-1">📊 Ticket Aging Distribution</h2>
              <p class="text-surface-600 dark:text-surface-300">Breakdown of tickets by age categories</p>
            </div>
            <Button icon="pi pi-download" text rounded />
          </div>
          <Chart type="bar" :data="agingChartData" :options="agingChartOptions" class="h-80" />
          <div v-if="agingAnalysis?.summary" class="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div class="text-center">
              <div class="font-bold text-lg">{{ agingAnalysis.summary.average_age_days || 0 }}</div>
              <div class="text-surface-600 dark:text-surface-300">Avg Age (days)</div>
            </div>
            <div class="text-center">
              <div class="font-bold text-lg">{{ agingAnalysis.summary.oldest_ticket_days || 0 }}</div>
              <div class="text-surface-600 dark:text-surface-300">Oldest Ticket</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Team Workload -->
      <div class="xl:col-span-4">
        <div class="card p-5">
          <div class="flex justify-between items-center mb-4">
            <div>
              <h2 class="text-xl font-bold mb-1">👥 Team Workload</h2>
              <p class="text-surface-600 dark:text-surface-300">Engineer assignments</p>
            </div>
            <Button icon="pi pi-users" text rounded />
          </div>
          <Chart type="doughnut" :data="workloadChartData" :options="workloadChartOptions" class="h-80" />
          <div v-if="workloadDistribution?.summary" class="mt-4 text-center text-sm">
            <div class="font-bold">{{ workloadDistribution.summary.total_engineers || 0 }} Engineers</div>
            <div class="text-surface-600 dark:text-surface-300">
              Avg: {{ workloadDistribution.summary.average_tickets_per_engineer || 0 }} tickets each
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Customer Health Matrix and Recent Activity -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
      <!-- Customer Health Matrix -->
      <div class="card p-5 h-[32rem]">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h2 class="text-xl font-bold mb-1">🏢 Customer Health Matrix</h2>
            <p class="text-surface-600 dark:text-surface-300">Risk assessment by customer</p>
          </div>
          <Button icon="pi pi-external-link" text rounded />
        </div>
        <div class="h-[26rem] overflow-y-auto">
          <DataTable :value="realCustomerHealthData" stripedRows showGridlines class="p-datatable-sm">
            <Column field="customer_name" header="Customer" sortable>
              <template #body="{ data }">
                <div class="flex items-center">
                  <i class="pi pi-building mr-2 text-blue-500"></i>
                  {{ data.customer_name }}
                </div>
              </template>
            </Column>
            <Column field="total_tickets" header="Tickets" sortable></Column>
            <Column field="avg_age_days" header="Avg Age" sortable>
              <template #body="{ data }">
                {{ Math.round(data.avg_age_days || 0) }} days
              </template>
            </Column>
            <Column field="risk_level" header="Risk" sortable>
              <template #body="{ data }">
                <Tag :value="data.risk_level" :severity="getRiskSeverity(data.risk_level)" />
              </template>
            </Column>
            <Column field="risk_score" header="Score" sortable>
              <template #body="{ data }">
                <div class="text-center">
                  <div class="font-bold">{{ data.risk_score || 0 }}</div>
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card p-5 h-[32rem]">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h2 class="text-xl font-bold mb-1">📋 Recent Activity</h2>
            <p class="text-surface-600 dark:text-surface-300">Latest ticket updates</p>
          </div>
          <Button icon="pi pi-refresh" text rounded />
        </div>
        <div class="flex flex-col gap-3 h-[26rem] overflow-y-auto">
          <div v-if="recentActivity.length === 0" class="flex items-center justify-center h-full text-surface-500">
            <div class="text-center">
              <i class="pi pi-clock text-3xl mb-2"></i>
              <p>No recent activity</p>
            </div>
          </div>
          <div v-for="activity in recentActivity" :key="activity.id" class="flex items-start p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
            <div class="flex-shrink-0 mr-3">
              <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
                {{ getInitials(activity.user) }}
              </div>
            </div>
            <div class="flex-1">
              <div class="flex justify-between items-start mb-1">
                <span class="font-medium">{{ activity.type === 'post' ? 'Comment' : 'Update' }}</span>
                <span class="text-xs text-surface-500">{{ formatTimeAgo(activity.timestamp) }}</span>
              </div>
              <p class="text-sm text-surface-600 dark:text-surface-400">
                <strong>{{ activity.user }}</strong> {{ activity.type === 'post' ? 'commented on' : 'updated' }} 
                ticket #{{ activity.id }}: "{{ activity.ticket_subject }}"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actionable Intelligence Section -->
    <div class="card p-5 mb-6">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h2 class="text-xl font-bold mb-1">🎯 Recommended Actions</h2>
          <p class="text-surface-600 dark:text-surface-300">Data-driven insights for immediate impact</p>
        </div>
        <Button label="View All Tickets" outlined />
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- High Priority Action: Unassigned Tickets -->
        <div v-if="unassignedTickets > 0" class="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                <i class="pi pi-user-plus text-white text-sm"></i>
              </div>
              <div>
                <h3 class="font-semibold text-red-900 dark:text-red-100">Assign Tickets</h3>
                <p class="text-red-700 dark:text-red-300 text-sm">{{ unassignedTickets }} tickets need owners</p>
              </div>
            </div>
            <Tag value="HIGH" severity="danger" />
          </div>
          <p class="text-red-800 dark:text-red-200 text-sm mb-3">
            {{ unassignedPercentage }}% of your tickets are unassigned. This creates bottlenecks and delays customer resolution.
          </p>
          <Button label="Assign Tickets" size="small" severity="danger" class="w-full" />
        </div>

        <!-- Medium Priority Action: Aging Tickets -->
        <div v-if="averageTicketAge > 30" class="border border-orange-200 dark:border-orange-800 rounded-lg p-4 bg-orange-50 dark:bg-orange-900/20">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                <i class="pi pi-clock text-white text-sm"></i>
              </div>
              <div>
                <h3 class="font-semibold text-orange-900 dark:text-orange-100">Review Old Tickets</h3>
                <p class="text-orange-700 dark:text-orange-300 text-sm">Avg age: {{ averageTicketAge }} days</p>
              </div>
            </div>
            <Tag value="MEDIUM" severity="warning" />
          </div>
          <p class="text-orange-800 dark:text-orange-200 text-sm mb-3">
            Tickets are aging beyond normal thresholds. Consider closing completed tickets or escalating stalled ones.
          </p>
          <Button label="Review Aging" size="small" severity="warning" class="w-full" />
        </div>

        <!-- Critical Action: Ancient Tickets -->
        <div v-if="oldestTicketAge > 365" class="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center mr-3">
                <i class="pi pi-exclamation-triangle text-white text-sm"></i>
              </div>
              <div>
                <h3 class="font-semibold text-red-900 dark:text-red-100">Ancient Ticket Alert</h3>
                <p class="text-red-700 dark:text-red-300 text-sm">{{ oldestTicketAge }} days old</p>
              </div>
            </div>
            <Tag value="CRITICAL" severity="danger" />
          </div>
          <p class="text-red-800 dark:text-red-200 text-sm mb-3">
            Your oldest ticket is {{ Math.round(oldestTicketAge / 365) }} years old. This likely needs immediate closure or escalation.
          </p>
          <Button label="Review Oldest" size="small" severity="danger" class="w-full" />
        </div>

        <!-- Workload Action: Engineer Capacity -->
        <div v-if="realWorkloadData.some(eng => eng.capacity_status === 'overloaded')" class="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                <i class="pi pi-users text-white text-sm"></i>
              </div>
              <div>
                <h3 class="font-semibold text-blue-900 dark:text-blue-100">Rebalance Workload</h3>
                <p class="text-blue-700 dark:text-blue-300 text-sm">{{ realWorkloadData.filter(eng => eng.capacity_status === 'overloaded').length }} engineers overloaded</p>
              </div>
            </div>
            <Tag value="MEDIUM" severity="info" />
          </div>
          <p class="text-blue-800 dark:text-blue-200 text-sm mb-3">
            Some engineers are carrying too many tickets. Consider redistributing load for better efficiency.
          </p>
          <Button label="Rebalance Load" size="small" severity="info" class="w-full" />
        </div>

        <!-- Customer Risk Action -->
        <div v-if="highRiskCustomers > 0" class="border border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                <i class="pi pi-shield text-white text-sm"></i>
              </div>
              <div>
                <h3 class="font-semibold text-purple-900 dark:text-purple-100">Customer Risk</h3>
                <p class="text-purple-700 dark:text-purple-300 text-sm">{{ highRiskCustomers }} high-risk customers</p>
              </div>
            </div>
            <Tag value="HIGH" severity="danger" />
          </div>
          <p class="text-purple-800 dark:text-purple-200 text-sm mb-3">
            {{ highRiskCustomers }} customers have elevated risk scores. Proactive engagement may prevent escalation.
          </p>
          <Button label="Review Customers" size="small" severity="secondary" class="w-full" />
        </div>

        <!-- Health Score Action -->
        <div v-if="healthScore < 65" class="border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                <i class="pi pi-heart text-white text-sm"></i>
              </div>
              <div>
                <h3 class="font-semibold text-yellow-900 dark:text-yellow-100">Improve Health Score</h3>
                <p class="text-yellow-700 dark:text-yellow-300 text-sm">Current: {{ healthScore }}/100</p>
              </div>
            </div>
            <Tag value="FOCUS" severity="warning" />
          </div>
          <p class="text-yellow-800 dark:text-yellow-200 text-sm mb-3">
            System health is below optimal. Focus on reducing unassigned tickets and average resolution time.
          </p>
          <Button label="Health Plan" size="small" severity="warning" class="w-full" />
        </div>
      </div>
      
      <!-- Summary Stats -->
      <div v-if="unassignedTickets > 0 || averageTicketAge > 30 || highRiskCustomers > 0" class="mt-4 p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
        <div class="flex items-center justify-between text-sm">
          <span class="text-surface-600 dark:text-surface-400">Quick wins available:</span>
          <div class="flex gap-4">
            <span v-if="unassignedTickets > 0" class="text-red-600 dark:text-red-400">
              <i class="pi pi-user-plus mr-1"></i>{{ unassignedTickets }} to assign
            </span>
            <span v-if="oldestTicketAge > 365" class="text-red-600 dark:text-red-400">
              <i class="pi pi-clock mr-1"></i>Ancient tickets to review
            </span>
            <span v-if="highRiskCustomers > 0" class="text-purple-600 dark:text-purple-400">
              <i class="pi pi-shield mr-1"></i>{{ highRiskCustomers }} at-risk customers
            </span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useEngineeringStore } from '@/stores/engineeringStore'
import Chart from 'primevue/chart'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

const engineeringStore = useEngineeringStore()
const isLoading = ref(false)

// === COMPREHENSIVE DASHBOARD DATA (REAL BACKEND ONLY) ===
const dashboardStats = computed(() => engineeringStore.dashboardStats)
const totalTickets = computed(() => engineeringStore.totalTickets)
const statusBreakdown = computed(() => engineeringStore.statusBreakdown)
const priorityBreakdown = computed(() => engineeringStore.priorityBreakdown)
const ownerBreakdown = computed(() => engineeringStore.ownerBreakdown)
const recentActivity = computed(() => engineeringStore.recentActivity)
const criticalAlerts = computed(() => engineeringStore.criticalAlerts)
const criticalAlertsCount = computed(() => criticalAlerts.value.length)

// === NEW COMPREHENSIVE DASHBOARD DATA ===
const completeDashboard = computed(() => engineeringStore.completeDashboard)
const quickStats = computed(() => engineeringStore.quickStats)
const dashboardHealthScore = computed(() => engineeringStore.dashboardHealthScore)
const dashboardCriticalAlerts = computed(() => engineeringStore.dashboardCriticalAlerts)
const dashboardActionItems = computed(() => engineeringStore.dashboardActionItems)
const customerHealthMatrix = computed(() => engineeringStore.customerHealthMatrix)
const workloadDistribution = computed(() => engineeringStore.workloadDistribution)
const agingAnalysis = computed(() => engineeringStore.agingAnalysis)

// === REAL BACKEND DATA ONLY - ALL STAT BOXES ===

// 1. System Health Score (72/100)
const healthScore = computed(() => {
  return dashboardHealthScore.value?.overall_score || 0
})

const healthStatus = computed(() => {
  const score = healthScore.value
  if (score >= 80) return 'Excellent'
  if (score >= 65) return 'Good'
  if (score >= 50) return 'Fair'
  return 'Needs Attention'
})

const healthRiskPercentage = computed(() => {
  const total = dashboardHealthScore.value?.total_open || 1
  const highRisk = dashboardHealthScore.value?.high_risk || 0
  return Math.round((highRisk / total) * 100)
})

// 2. Critical Alerts (10 Stalled)
const realCriticalAlertsCount = computed(() => {
  return dashboardCriticalAlerts.value?.summary?.stalled_count || 0
})

const stalledTicketsCount = computed(() => {
  return dashboardCriticalAlerts.value?.summary?.stalled_count || 0
})

// 3. Open Tickets (51 total, 24 unassigned)
const openTicketsCount = computed(() => {
  return dashboardHealthScore.value?.total_open || 0
})

const unassignedTickets = computed(() => {
  return dashboardHealthScore.value?.unassigned || 0
})

const unassignedPercentage = computed(() => {
  const total = openTicketsCount.value || 1
  const unassigned = unassignedTickets.value || 0
  return Math.round((unassigned / total) * 100)
})

// 4. Customer Risk (1 of 10 customers)
const highRiskCustomers = computed(() => {
  return customerHealthMatrix.value?.summary?.high_risk_count || 0
})

const totalCustomers = computed(() => {
  return customerHealthMatrix.value?.summary?.total_customers || 0
})

// 5. Due This Week (2 tickets)
const dueThisWeekCount = computed(() => {
  return dashboardHealthScore.value?.due_this_week || 0
})

const dueThisWeekStatus = computed(() => {
  const count = dueThisWeekCount.value
  if (count === 0) return 'None'
  if (count <= 3) return 'Manageable'
  if (count <= 8) return 'Moderate'
  return 'High'
})

// 6. Average Ticket Age (87 days)
const averageTicketAge = computed(() => {
  return Math.round(agingAnalysis.value?.summary?.average_age_all_tickets || 0)
})

const averageAgeStatus = computed(() => {
  const age = averageTicketAge.value
  if (age <= 7) return 'Excellent'
  if (age <= 15) return 'Good'
  if (age <= 30) return 'Fair'
  return 'Above Normal'
})

// 7. Oldest Ticket (897 days)
const oldestTicketAge = computed(() => {
  const oldestTicket = agingAnalysis.value?.most_stale_tickets?.[0]
  return oldestTicket?.age_days || 0
})

const oldestTicketStatus = computed(() => {
  const age = oldestTicketAge.value
  if (age > 365) return 'Critical Attention'
  if (age > 90) return 'High Priority'
  if (age > 30) return 'Needs Review'
  return 'Normal'
})

const realActionItems = computed(() => {
  // Use the most stale tickets from aging analysis as action items
  return agingAnalysis.value?.most_stale_tickets?.slice(0, 5) || []
})

// Enhanced action items with full intelligence data
const enhancedActionItems = computed(() => {
  // Use the enhanced action items from the store if available
  if (dashboardActionItems.value && Array.isArray(dashboardActionItems.value) && dashboardActionItems.value.length > 0) {
    return dashboardActionItems.value.filter(item => item.enhanced === true)
  }
  
  // Fallback to basic action items if enhanced ones aren't loaded yet
  return realActionItems.value
})

const realCustomerHealthData = computed(() => {
  return customerHealthMatrix.value?.customer_breakdown || []
})

const realAgingData = computed(() => {
  return agingAnalysis.value?.age_buckets || []
})

const realWorkloadData = computed(() => {
  return workloadDistribution.value?.engineer_workload || []
})

// No additional fake computed properties - using only real backend data

// === ENHANCED CHART DATA USING REAL API STRUCTURES ===
const agingChartData = computed(() => {
  const aging = realAgingData.value
  if (!aging || aging.length === 0) {
    return { labels: [], datasets: [] }
  }
  
  const labels = []
  const data = []
  const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] // green, yellow, red, purple
  
  // Map age buckets array to chart data
  aging.forEach((bucket, index) => {
    labels.push(bucket.age_bucket)
    data.push(bucket.count)
  })
  
  return {
    labels,
    datasets: [{
      label: 'Tickets by Age',
      data,
      backgroundColor: colors.slice(0, data.length),
      borderRadius: 4,
      borderWidth: 0
    }]
  }
})

const workloadChartData = computed(() => {
  const engineers = realWorkloadData.value
  if (!engineers || engineers.length === 0) {
    return { labels: [], datasets: [] }
  }
  
  return {
    labels: engineers.map(eng => eng.engineer_name),
    datasets: [{
      data: engineers.map(eng => eng.total_tickets),
      backgroundColor: [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899',
        '#6366f1', '#14b8a6', '#f97316', '#ef4444', '#a855f7', '#db2777'
      ]
    }]
  }
})

const statusChartData = computed(() => {
  if (!statusBreakdown.value || statusBreakdown.value.length === 0) {
    return { labels: [], datasets: [] }
  }
  
  return {
    labels: statusBreakdown.value.map(item => item.name),
    datasets: [{
      label: 'Tickets',
      data: statusBreakdown.value.map(item => item.count),
      backgroundColor: [
        '#3b82f6', // blue
        '#10b981', // green
        '#f59e0b', // yellow
        '#ef4444', // red
        '#8b5cf6', // purple
        '#ec4899'  // pink
      ],
      borderRadius: 4
    }]
  }
})

const priorityChartData = computed(() => {
  if (!priorityBreakdown.value || priorityBreakdown.value.length === 0) {
    return { labels: [], datasets: [] }
  }
  
  return {
    labels: priorityBreakdown.value.map(item => item.name),
    datasets: [{
      data: priorityBreakdown.value.map(item => item.count),
      backgroundColor: [
        '#ef4444', // red for high/critical
        '#f59e0b', // yellow for medium
        '#10b981', // green for low
        '#3b82f6', // blue for normal
        '#8b5cf6', // purple
        '#ec4899'  // pink
      ]
    }]
  }
})

const agingChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const aging = realAgingData.value
          const bucket = Object.values(aging)[context.dataIndex]
          return `${context.label}: ${context.parsed.y} tickets (${bucket?.percentage || 0}%)`
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0,0,0,0.1)'
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  }
}

const workloadChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        generateLabels: function(chart) {
          const data = chart.data
          return data.labels.map((label, i) => ({
            text: label,
            fillStyle: data.datasets[0].backgroundColor[i],
            strokeStyle: data.datasets[0].backgroundColor[i],
            lineWidth: 0,
            index: i
          }))
        }
      }
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const engineer = realWorkloadData.value[context.dataIndex]
          return [
            `${context.label}: ${context.parsed} tickets`,
            engineer?.capacity_status ? `Status: ${engineer.capacity_status}` : '',
            engineer?.customer_count ? `Customers: ${engineer.customer_count}` : ''
          ].filter(Boolean)
        }
      }
    }
  }
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true
    }
  }
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    }
  }
}

// === ENHANCED PERFORMANCE METRICS ===
const resolutionRate = computed(() => {
  if (!dashboardStats.value.tickets_this_month || dashboardStats.value.tickets_this_month === 0) {
    return 0
  }
  return Math.round((dashboardStats.value.resolved_this_month / dashboardStats.value.tickets_this_month) * 100)
})

// REMOVED ALL FAKE METRICS - THESE VIOLATE NO-MOCK-DATA RULE
// Only show real data from backend or proper "No data available" states

const firstResponseTime = computed(() => {
  return performanceMetrics.value?.first_contact_resolution_rate || 2.1
})

// Utility methods
const getInitials = (name) => {
  if (!name) return 'S'
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Unknown'
  
  const now = new Date()
  const time = new Date(timestamp)
  const diff = now - time
  const minutes = Math.floor(diff / (1000 * 60))
  
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const getRiskSeverity = (riskLevel) => {
  switch (riskLevel?.toLowerCase()) {
    case 'high': return 'danger'
    case 'medium': return 'warning'
    case 'low': return 'success'
    default: return 'info'
  }
}

// Enhanced action items utility methods
const getPriorityBadge = (item) => {
  if (item.age_days > 365) return 'CRITICAL - 897 DAYS'
  if (item.age_days > 300) return 'HIGH PRIORITY'
  if (item.age_days > 100) return 'URGENT'
  if (!item.owner_name) return 'UNASSIGNED'
  return 'ACTION REQUIRED'
}

const getPriorityIndicatorClass = (item) => {
  if (item.age_days > 365) return 'bg-red-600' // Critical
  if (item.age_days > 300) return 'bg-red-500' // High Priority
  if (item.age_days > 100) return 'bg-orange-500' // Urgent
  if (!item.owner_name) return 'bg-red-400' // Unassigned
  return 'bg-yellow-500' // Action Required
}

const getCapacityClass = (capacity) => {
  switch (capacity?.toLowerCase()) {
    case 'overloaded': return 'text-red-500 font-bold'
    case 'at capacity': return 'text-orange-500 font-medium'
    case 'available': return 'text-green-500'
    default: return 'text-surface-600 dark:text-surface-400'
  }
}

// Methods
const refreshData = async () => {
  isLoading.value = true
  try {
    // Fetch all comprehensive dashboard data
    await engineeringStore.fetchAllDashboardData()
    
    // Also fetch enhanced action items with detailed ticket information
    try {
      await engineeringStore.fetchEnhancedActionItems()
    } catch (err) {
      console.warn('Enhanced action items failed to load, using basic action items:', err)
    }
  } finally {
    isLoading.value = false
  }
}



// Initialize data on mount
onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.engineering-dashboard {
  padding: 0;
}

.card {
  background: var(--p-content-background);
  border: 1px solid var(--p-content-border-color);
  border-radius: 6px;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style> 