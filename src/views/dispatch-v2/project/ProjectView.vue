<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Button 
          icon="pi pi-arrow-left" 
          text 
          @click="$router.go(-1)"
          class="p-2"
        />
        <div>
          <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
            {{ project?.name || 'Project Details' }}
          </h1>
          <p class="text-surface-600 dark:text-surface-400 mt-1">
            {{ project?.customer?.name || 'No Customer' }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <StatusIndicator 
          :status="project?.status || 'unknown'"
          :color="getStatusColor(project?.status || 'unknown')"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-6">
      <div v-for="n in 3" :key="n" class="animate-pulse">
        <BaseCard>
          <div class="h-32 bg-surface-200 dark:bg-surface-700 rounded"></div>
        </BaseCard>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <BaseCard class="border-red-200 dark:border-red-800">
        <i class="pi pi-exclamation-triangle text-6xl text-red-500 mb-4"></i>
        <h3 class="text-xl font-semibold text-red-600 mb-2">Unable to Load Project</h3>
        <p class="text-surface-600 dark:text-surface-400 mb-4">
          {{ error }}
        </p>
        <Button 
          label="Try Again" 
          icon="pi pi-refresh"
          @click="fetchProject"
          severity="secondary"
        />
      </BaseCard>
    </div>

    <!-- Project Content -->
    <div v-else-if="project" class="space-y-6">
      <!-- Overview Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Budget"
          :value="formatCurrency(project.budget || 0)"
          icon="pi-dollar"
          color="primary"
        />
        <MetricCard
          title="Progress"
          :value="`${project.progress || 0}%`"
          icon="pi-chart-line"
          color="success"
        />
        <MetricCard
          title="Active Jobs"
          :value="project.activeJobs || 0"
          icon="pi-briefcase"
          color="info"
        />
        <MetricCard
          title="Duration"
          :value="calculateDuration(project.startDate, project.endDate)"
          icon="pi-calendar"
          color="warning"
        />
      </div>

      <!-- Project Details -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Basic Information -->
        <BaseCard>
          <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4">
            Project Information
          </h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-1">
                Project Name
              </label>
              <p class="text-surface-900 dark:text-surface-0">{{ project.name || 'N/A' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-1">
                Customer
              </label>
              <p class="text-surface-900 dark:text-surface-0">{{ project.customer?.name || 'N/A' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-1">
                Status
              </label>
              <StatusIndicator 
                :status="project.status || 'unknown'"
                :color="getStatusColor(project.status || 'unknown')"
                size="small"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-1">
                Description
              </label>
              <p class="text-surface-900 dark:text-surface-0">
                {{ project.description || 'No description available' }}
              </p>
            </div>
          </div>
        </BaseCard>

        <!-- Timeline -->
        <BaseCard>
          <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4">
            Timeline
          </h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-1">
                Start Date
              </label>
              <p class="text-surface-900 dark:text-surface-0">{{ formatDate(project.startDate) }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-1">
                End Date
              </label>
              <p class="text-surface-900 dark:text-surface-0">{{ formatDate(project.endDate) }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-1">
                Progress
              </label>
              <div class="mt-2">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium">{{ project.progress || 0 }}%</span>
                </div>
                <ProgressBar :value="project.progress || 0" class="h-3" />
              </div>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Contact Information -->
      <BaseCard v-if="project.customer">
        <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4">
          Customer Contact
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div v-if="project.customer.email">
            <label class="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-1">
              Email
            </label>
            <p class="text-surface-900 dark:text-surface-0">{{ project.customer.email }}</p>
          </div>
          <div v-if="project.customer.phone">
            <label class="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-1">
              Phone
            </label>
            <p class="text-surface-900 dark:text-surface-0">{{ project.customer.phone }}</p>
          </div>
          <div v-if="project.customer.address">
            <label class="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-1">
              Address
            </label>
            <p class="text-surface-900 dark:text-surface-0">{{ project.customer.address }}</p>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- No Project Found -->
    <div v-else class="text-center py-12">
      <BaseCard>
        <i class="pi pi-folder text-6xl text-surface-300 mb-4"></i>
        <h3 class="text-xl font-semibold text-surface-600 mb-2">Project Not Found</h3>
        <p class="text-surface-500 mb-4">
          The requested project could not be found.
        </p>
        <Button 
          label="Back to Projects" 
          icon="pi pi-arrow-left"
          @click="$router.push('/dispatch/projects')"
          severity="secondary"
        />
      </BaseCard>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import DispatchApiService from '@/services/DispatchApiService'
import BaseCard from '../shared/components/BaseCard.vue'
import StatusIndicator from '../shared/components/StatusIndicator.vue'
import MetricCard from '../shared/components/MetricCard.vue'

// Route
const route = useRoute()

// Reactive data
const project = ref(null)
const loading = ref(false)
const error = ref(null)

// Methods
async function fetchProject() {
  loading.value = true
  error.value = null
  
  try {
    const response = await DispatchApiService.projects.getById(route.params.id)
    
    // Transform project data
    const projectData = response.data || response
    project.value = {
      id: projectData.id,
      name: projectData.name,
      description: projectData.description,
      status: projectData.status || 'planning',
      progress: projectData.progress || 0,
      budget: projectData.budget || 0,
      activeJobs: projectData.active_jobs || 0,
      startDate: projectData.start_date || projectData.startDate,
      endDate: projectData.end_date || projectData.endDate,
      customer: projectData.customer || (projectData.customer_name ? { 
        name: projectData.customer_name,
        email: projectData.customer_email,
        phone: projectData.customer_phone,
        address: projectData.customer_address
      } : null)
    }
    
  } catch (err) {
    console.error('Error fetching project:', err)
    error.value = err.message || 'Failed to fetch project'
  } finally {
    loading.value = false
  }
}

function formatCurrency(amount) {
  if (typeof amount !== 'number') return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

function formatDate(date) {
  if (!date) return 'Not set'
  return new Date(date).toLocaleDateString()
}

function calculateDuration(startDate, endDate) {
  if (!startDate || !endDate) return 'Not set'
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 30) {
    return `${diffDays} days`
  } else if (diffDays < 365) {
    const months = Math.round(diffDays / 30)
    return `${months} month${months > 1 ? 's' : ''}`
  } else {
    const years = Math.round(diffDays / 365)
    return `${years} year${years > 1 ? 's' : ''}`
  }
}

function getStatusColor(status) {
  const colors = {
    planning: 'secondary',
    active: 'info',
    on_hold: 'warning',
    completed: 'success',
    cancelled: 'danger'
  }
  return colors[status] || 'secondary'
}

// Lifecycle
onMounted(() => {
  fetchProject()
})
</script> 