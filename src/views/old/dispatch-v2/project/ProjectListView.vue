<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Projects</h1>
        <p class="text-surface-600 dark:text-surface-400 mt-1">
          Manage and track project progress
        </p>
      </div>
    </div>

    <!-- Search and Filters -->
    <BaseCard>
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1">
          <IconField iconPosition="left">
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="filters.search"
              placeholder="Search projects..."
              class="w-full"
            />
          </IconField>
        </div>
        <div class="flex gap-2">
          <Select
            v-model="selectedStatus"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="All Statuses"
            class="w-40"
            showClear
          />
        </div>
      </div>
    </BaseCard>

    <!-- Projects Grid -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="n in 6" :key="n" class="animate-pulse">
        <BaseCard>
          <div class="h-64 bg-surface-200 dark:bg-surface-700 rounded"></div>
        </BaseCard>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <BaseCard class="border-red-200 dark:border-red-800">
        <i class="pi pi-exclamation-triangle text-6xl text-red-500 mb-4"></i>
        <h3 class="text-xl font-semibold text-red-600 mb-2">Unable to Load Projects</h3>
        <p class="text-surface-600 dark:text-surface-400 mb-4">
          {{ error }}
        </p>
        <Button 
          label="Try Again" 
          icon="pi pi-refresh"
          @click="fetchProjects"
          severity="secondary"
        />
      </BaseCard>
    </div>

    <div v-else-if="projects.length === 0" class="text-center py-12">
      <BaseCard>
        <i class="pi pi-folder text-6xl text-surface-300 mb-4"></i>
        <h3 class="text-xl font-semibold text-surface-600 mb-2">No Projects Found</h3>
        <p class="text-surface-500 mb-4">
          {{ filters.search ? 'No projects match your search criteria.' : 'Get started by creating your first project.' }}
        </p>
      </BaseCard>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <BaseCard 
        v-for="project in filteredProjects" 
        :key="project?.id || Math.random()"
        class="cursor-pointer hover:shadow-lg transition-shadow duration-200"
        @click="project?.id ? navigateToProject(project.id) : null"
      >
        <!-- Project Header -->
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-1">
              {{ project?.name || 'Untitled Project' }}
            </h3>
            <p class="text-surface-600 dark:text-surface-400 text-sm">
              {{ project?.customer?.name || 'No Customer' }}
            </p>
          </div>
          <StatusIndicator 
            :status="project?.status || 'unknown'"
            :color="getStatusColor(project?.status || 'unknown')"
            size="small"
          />
        </div>

        <!-- Project Metrics -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
              {{ project?.budget ? formatCurrency(project.budget) : '$0' }}
            </div>
            <div class="text-xs text-surface-500">Budget</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
              {{ project?.activeJobs || 0 }}
            </div>
            <div class="text-xs text-surface-500">Active Jobs</div>
          </div>
        </div>

        <!-- Progress -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium">Progress</span>
            <span class="text-sm font-bold">{{ project?.progress || 0 }}%</span>
          </div>
          <ProgressBar 
            :value="project?.progress || 0"
            class="h-2"
          />
        </div>

        <!-- Timeline -->
        <div class="text-xs text-surface-500 space-y-1">
          <div>Start: {{ formatDate(project?.startDate) }}</div>
          <div>End: {{ formatDate(project?.endDate) }}</div>
        </div>
      </BaseCard>
    </div>

    <!-- Pagination -->
    <div v-if="projects.length > 0" class="mt-6 flex justify-center">
      <Paginator
        :rows="pagination.limit"
        :totalRecords="pagination.total"
        :first="(pagination.page - 1) * pagination.limit"
        @page="onPageChange"
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import DispatchApiService from '@/services/DispatchApiService'
import BaseCard from '../shared/components/BaseCard.vue'
import StatusIndicator from '../shared/components/StatusIndicator.vue'

// Router
const router = useRouter()

// Reactive data
const projects = ref([])
const loading = ref(false)
const error = ref(null)
const selectedStatus = ref(null)

// Pagination
const pagination = ref({
  page: 1,
  limit: 25,
  total: 0,
  totalPages: 1
})

// Filters
const filters = ref({
  search: ''
})

// Filter options
const statusOptions = [
  { label: 'Planning', value: 'planning' },
  { label: 'Active', value: 'active' },
  { label: 'On Hold', value: 'on_hold' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' }
]

// Computed
const filteredProjects = computed(() => {
  let filtered = projects.value

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    filtered = filtered.filter(project => 
      project.name?.toLowerCase().includes(search) ||
      project.customer?.name?.toLowerCase().includes(search)
    )
  }

  if (selectedStatus.value) {
    filtered = filtered.filter(project => project.status === selectedStatus.value)
  }

  return filtered
})

// Methods
async function fetchProjects() {
  loading.value = true
  error.value = null
  
  try {
    const response = await DispatchApiService.projects.getAll({
      page: pagination.value.page,
      limit: pagination.value.limit
    })
    
    // Handle different response structures
    let projectsData = []
    let metaData = null
    
    if (response.data) {
      if (Array.isArray(response.data)) {
        projectsData = response.data
      } else if (response.data.projects && Array.isArray(response.data.projects)) {
        projectsData = response.data.projects
        metaData = response.data.meta || response.data.pagination
      } else if (response.data.data && Array.isArray(response.data.data)) {
        projectsData = response.data.data
        metaData = response.data.meta || response.data.pagination
      }
    }
    
    // Transform project data
    projects.value = projectsData.map(project => ({
      id: project.id,
      name: project.name,
      status: project.status || 'planning',
      progress: project.progress || 0,
      budget: project.budget || 0,
      activeJobs: project.active_jobs || 0,
      startDate: project.start_date || project.startDate,
      endDate: project.end_date || project.endDate,
      customer: project.customer || (project.customer_name ? { name: project.customer_name } : null)
    }))
    
    // Update pagination
    if (metaData) {
      pagination.value = {
        page: metaData.current_page || metaData.page || 1,
        limit: metaData.per_page || metaData.limit || 25,
        total: metaData.total || projectsData.length,
        totalPages: metaData.last_page || metaData.totalPages || 1
      }
    }
    
  } catch (err) {
    console.error('Error fetching projects:', err)
    error.value = err.message || 'Failed to fetch projects'
  } finally {
    loading.value = false
  }
}

function onPageChange(event) {
  pagination.value.page = Math.floor(event.first / event.rows) + 1
  pagination.value.limit = event.rows
  fetchProjects()
}

function navigateToProject(projectId) {
  router.push(`/dispatch/project/${projectId}`)
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
  fetchProjects()
})

// Watch for filter changes
watch([() => filters.value.search, selectedStatus], () => {
  // Client-side filtering, no need to refetch
})
</script> 