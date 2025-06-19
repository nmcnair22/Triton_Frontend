<template>
  <div class="customer-view p-6">
    <!-- Loading State -->
    <div v-if="loading.customer" class="animate-pulse">
      <div class="h-8 bg-surface-200 dark:bg-surface-700 rounded mb-4 w-1/3"></div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="h-64 bg-surface-200 dark:bg-surface-700 rounded"></div>
          <div class="h-96 bg-surface-200 dark:bg-surface-700 rounded"></div>
        </div>
        <div class="space-y-6">
          <div class="h-48 bg-surface-200 dark:bg-surface-700 rounded"></div>
          <div class="h-64 bg-surface-200 dark:bg-surface-700 rounded"></div>
        </div>
      </div>
    </div>

    <!-- Customer Not Found -->
    <div v-else-if="!customer" class="text-center py-12">
      <BaseCard>
        <i class="pi pi-exclamation-triangle text-6xl text-orange-400 mb-4"></i>
        <h3 class="text-xl font-semibold text-surface-600 mb-2">Customer Not Found</h3>
        <p class="text-surface-500 mb-4">The requested customer could not be found.</p>
        <Button 
          label="Back to Customers" 
          icon="pi pi-arrow-left"
          @click="$router.push('/dispatch/customer')"
        />
      </BaseCard>
    </div>

    <!-- Customer Details -->
    <div v-else>
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <Button 
            icon="pi pi-arrow-left" 
            text 
            @click="$router.push('/dispatch/customer')"
            class="p-2"
          />
          <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">
              {{ customer.name }}
            </h1>
            <div class="flex items-center gap-3 mt-1">
              <StatusIndicator 
                :status="customer.status"
                :color="getStatusColor(customer.status)"
              />
              <span class="text-surface-600 dark:text-surface-400">
                Customer since {{ formatDate(customer.createdAt) }}
              </span>
            </div>
          </div>
        </div>
        <div class="flex gap-3">
          <Button 
            label="Export Data" 
            icon="pi pi-download" 
            severity="secondary" 
            outlined 
          />
          <Button 
            label="Edit Customer" 
            icon="pi pi-pencil"
            @click="showEditDialog = true"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Customer Overview -->
          <BaseCard>
            <template #header>
              <h3 class="text-lg font-semibold">Customer Overview</h3>
            </template>
            
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard
                title="Health Score"
                :value="customer.healthScore || 0"
                suffix="%"
                :trend="customer.healthTrend"
                :color="getSatisfactionColor(customer.healthScore)"
                icon="pi pi-heart"
              />
              <MetricCard
                title="Total Revenue"
                :value="customer.totalRevenue || 0"
                format="currency"
                :trend="customer.revenueTrend"
                color="text-green-600"
                icon="pi pi-dollar"
              />
              <MetricCard
                title="Active Projects"
                :value="customer.activeProjects || 0"
                :trend="customer.projectsTrend"
                color="text-blue-600"
                icon="pi pi-briefcase"
              />
              <MetricCard
                title="Satisfaction"
                :value="customer.satisfactionScore || 0"
                suffix="%"
                :trend="customer.satisfactionTrend"
                :color="getSatisfactionColor(customer.satisfactionScore)"
                icon="pi pi-star"
              />
            </div>
          </BaseCard>

          <!-- Performance Chart -->
          <BaseCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold">Performance Trends</h3>
                <Select
                  v-model="selectedPeriod"
                  :options="periodOptions"
                  optionLabel="label"
                  optionValue="value"
                  @change="loadPerformanceData"
                />
              </div>
            </template>
            
            <InteractiveChart
              v-if="performanceData"
              type="line"
              :data="performanceData"
              :options="chartOptions"
              height="300px"
            />
            <div v-else class="text-center py-8">
              <ProgressSpinner />
              <p class="text-surface-500 mt-2">Loading performance data...</p>
            </div>
          </BaseCard>

          <!-- Projects List -->
          <BaseCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold">Active Projects</h3>
                <Button 
                  label="View All" 
                  text 
                  @click="$router.push(`/dispatch/project?customer=${customer.id}`)"
                />
              </div>
            </template>
            
            <div v-if="loading.projects" class="space-y-4">
              <div v-for="n in 3" :key="n" class="animate-pulse">
                <div class="h-16 bg-surface-200 dark:bg-surface-700 rounded"></div>
              </div>
            </div>
            
            <div v-else-if="projects.length === 0" class="text-center py-8">
              <i class="pi pi-briefcase text-4xl text-surface-300 mb-2"></i>
              <p class="text-surface-500">No active projects</p>
            </div>
            
            <div v-else class="space-y-4">
              <div 
                v-for="project in projects.slice(0, 5)" 
                :key="project.id"
                class="flex items-center justify-between p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 cursor-pointer transition-colors"
                @click="$router.push(`/dispatch/project/${project.id}`)"
              >
                <div class="flex-1">
                  <h4 class="font-semibold text-surface-900 dark:text-surface-0">
                    {{ project.name }}
                  </h4>
                  <p class="text-sm text-surface-600 dark:text-surface-400">
                    {{ project.description }}
                  </p>
                </div>
                <div class="text-right">
                  <StatusIndicator 
                    :status="project.status"
                    :color="getStatusColor(project.status)"
                    size="small"
                  />
                  <div class="text-sm text-surface-500 mt-1">
                    {{ formatCurrency(project.budget) }}
                  </div>
                </div>
              </div>
            </div>
          </BaseCard>

          <!-- Activity Timeline -->
          <BaseCard>
            <template #header>
              <h3 class="text-lg font-semibold">Recent Activity</h3>
            </template>
            
            <Timeline 
              v-if="activity.length > 0"
              :value="activity"
              class="w-full"
            >
              <template #content="{ item }">
                <div class="p-3">
                  <div class="flex items-center gap-2 mb-1">
                    <i :class="item.icon" class="text-primary"></i>
                    <span class="font-semibold">{{ item.title }}</span>
                  </div>
                  <p class="text-surface-600 dark:text-surface-400 text-sm mb-2">
                    {{ item.description }}
                  </p>
                  <small class="text-surface-500">{{ formatDate(item.date) }}</small>
                </div>
              </template>
            </Timeline>
            
            <div v-else class="text-center py-8">
              <i class="pi pi-clock text-4xl text-surface-300 mb-2"></i>
              <p class="text-surface-500">No recent activity</p>
            </div>
          </BaseCard>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Contact Information -->
          <BaseCard>
            <template #header>
              <h3 class="text-lg font-semibold">Contact Information</h3>
            </template>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-1">
                  Email
                </label>
                <div class="flex items-center gap-2">
                  <i class="pi pi-envelope text-surface-400"></i>
                  <span>{{ customer.email }}</span>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-1">
                  Phone
                </label>
                <div class="flex items-center gap-2">
                  <i class="pi pi-phone text-surface-400"></i>
                  <span>{{ customer.phone || 'Not provided' }}</span>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-1">
                  Address
                </label>
                <div class="flex items-start gap-2">
                  <i class="pi pi-map-marker text-surface-400 mt-1"></i>
                  <span>{{ customer.address || 'Not provided' }}</span>
                </div>
              </div>
            </div>
          </BaseCard>

          <!-- Quick Stats -->
          <BaseCard>
            <template #header>
              <h3 class="text-lg font-semibold">Quick Stats</h3>
            </template>
            
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-surface-600 dark:text-surface-400">Total Jobs</span>
                <span class="font-semibold">{{ customer.totalJobs || 0 }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-surface-600 dark:text-surface-400">Completed Jobs</span>
                <span class="font-semibold">{{ customer.completedJobs || 0 }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-surface-600 dark:text-surface-400">Avg. Response Time</span>
                <span class="font-semibold">{{ customer.avgResponseTime || 'N/A' }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-surface-600 dark:text-surface-400">Last Contact</span>
                <span class="font-semibold">{{ formatDate(customer.lastContact) }}</span>
              </div>
            </div>
          </BaseCard>

          <!-- Recommendations -->
          <BaseCard v-if="recommendations.length > 0">
            <template #header>
              <h3 class="text-lg font-semibold">Recommendations</h3>
            </template>
            
            <div class="space-y-3">
              <div 
                v-for="rec in recommendations" 
                :key="rec.id"
                class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
              >
                <div class="flex items-start gap-2">
                  <i class="pi pi-lightbulb text-blue-600 mt-1"></i>
                  <div>
                    <h4 class="font-medium text-blue-900 dark:text-blue-100">
                      {{ rec.title }}
                    </h4>
                    <p class="text-sm text-blue-700 dark:text-blue-300">
                      {{ rec.description }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </BaseCard>
        </div>
      </div>
    </div>

    <!-- Edit Customer Dialog -->
    <Dialog 
      v-model:visible="showEditDialog"
      modal
      header="Edit Customer"
      :style="{ width: '600px' }"
    >
      <div class="text-center py-8">
        <i class="pi pi-pencil text-4xl text-primary mb-4"></i>
        <p class="text-surface-600">Customer editing form coming soon...</p>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCustomerStore } from '@/stores/dispatch-v2/customer'
import BaseCard from '../shared/components/BaseCard.vue'
import StatusIndicator from '../shared/components/StatusIndicator.vue'
import MetricCard from '../shared/components/MetricCard.vue'
import InteractiveChart from '../shared/components/InteractiveChart.vue'

// Router
const route = useRoute()
const router = useRouter()

// Store
const customerStore = useCustomerStore()

// Reactive data
const showEditDialog = ref(false)
const selectedPeriod = ref('30d')

// Options
const periodOptions = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Last year', value: '1y' }
]

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
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

// Computed
const customerId = computed(() => route.params.id)
const customer = computed(() => customerStore.selectedCustomer)
const loading = computed(() => customerStore.loading)
const projects = computed(() => customerStore.customerProjects)
const activity = computed(() => customerStore.customerActivity)
const performanceData = computed(() => customerStore.customerPerformance)
const recommendations = computed(() => customerStore.customerRecommendations)

// Methods
function loadPerformanceData() {
  if (customerId.value) {
    customerStore.fetchCustomerPerformance(customerId.value)
  }
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

// Lifecycle
onMounted(async () => {
  if (customerId.value) {
    await customerStore.loadCustomerData(customerId.value)
  }
})

onUnmounted(() => {
  customerStore.clearErrors()
})

// Watch for route changes
watch(() => route.params.id, async (newId) => {
  if (newId) {
    await customerStore.loadCustomerData(newId)
  }
})

// Watch for real-time updates
watch(() => customerStore.selectedCustomer, (newCustomer) => {
  // Handle real-time customer updates
}, { deep: true })
</script> 