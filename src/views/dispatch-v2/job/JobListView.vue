<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Jobs</h1>
        <p class="text-surface-600 dark:text-surface-400 mt-1">
          Manage and track job progress
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
              placeholder="Search jobs..."
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
          <Select
            v-model="selectedPriority"
            :options="priorityOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="All Priorities"
            class="w-40"
            showClear
          />
        </div>
      </div>
    </BaseCard>

    <!-- Jobs Grid -->
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
        <h3 class="text-xl font-semibold text-red-600 mb-2">Unable to Load Jobs</h3>
        <p class="text-surface-600 dark:text-surface-400 mb-4">
          {{ error }}
        </p>
        <Button 
          label="Try Again" 
          icon="pi pi-refresh"
          @click="fetchJobs"
          severity="secondary"
        />
      </BaseCard>
    </div>

    <div v-else-if="filteredJobs.length === 0" class="text-center py-12">
      <BaseCard>
        <i class="pi pi-briefcase text-6xl text-surface-300 mb-4"></i>
        <h3 class="text-xl font-semibold text-surface-600 mb-2">No Jobs Found</h3>
        <p class="text-surface-500 mb-4">
          {{ filters.search ? 'No jobs match your search criteria.' : 'No jobs available at the moment.' }}
        </p>
      </BaseCard>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <BaseCard 
        v-for="job in filteredJobs" 
        :key="job?.id || Math.random()"
        class="cursor-pointer hover:shadow-lg transition-shadow duration-200"
        @click="job?.id ? navigateToJob(job.id) : null"
      >
        <!-- Job Header -->
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-1">
              {{ job?.title || 'Untitled Job' }}
            </h3>
            <p class="text-surface-600 dark:text-surface-400 text-sm">
              {{ job?.customer?.name || 'No Customer' }}
            </p>
          </div>
          <div class="flex flex-col items-end gap-2">
            <StatusIndicator 
              :status="job?.status || 'unknown'"
              :color="getStatusColor(job?.status || 'unknown')"
              size="small"
            />
            <StatusIndicator 
              :status="job?.priority || 'medium'"
              :color="getPriorityColor(job?.priority || 'medium')"
              size="small"
            />
          </div>
        </div>

        <!-- Job Metrics -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
              {{ job?.revenue ? formatCurrency(job.revenue) : '$0' }}
            </div>
            <div class="text-xs text-surface-500">Revenue</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
              {{ job?.progress || 0 }}%
            </div>
            <div class="text-xs text-surface-500">Progress</div>
          </div>
        </div>

        <!-- Health Score -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium">Health</span>
            <StatusIndicator 
              :status="job?.healthLevel || 'good'"
              :color="getHealthColor(job?.healthLevel || 'good')"
              size="small"
            />
          </div>
          <ProgressBar 
            :value="job?.healthScore || 75"
            :class="getHealthColor(job?.healthLevel || 'good')"
            class="h-2"
          />
        </div>

        <!-- Timeline -->
        <div class="text-xs text-surface-500 space-y-1">
          <div>Scheduled: {{ formatDate(job?.scheduledDate) }}</div>
          <div>Due: {{ formatDate(job?.dueDate) }}</div>
          <div v-if="job?.assignedTechnician">
            Technician: {{ job.assignedTechnician.name || job.assignedTechnician }}
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Pagination -->
    <div v-if="filteredJobs.length > 0" class="mt-6 flex justify-center">
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
import { useJobStore } from '@/stores/dispatch-v2/job'
import BaseCard from '../shared/components/BaseCard.vue'
import StatusIndicator from '../shared/components/StatusIndicator.vue'

// Router
const router = useRouter()

// Store
const jobStore = useJobStore()

// Reactive data
const selectedStatus = ref(null)
const selectedPriority = ref(null)
const loading = computed(() => jobStore.loading.jobs)
const error = computed(() => jobStore.errors.jobs)
const filteredJobs = computed(() => jobStore.filteredJobs)
const pagination = computed(() => jobStore.pagination)
const filters = computed(() => jobStore.filters)

// Filter options
const statusOptions = [
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'On Hold', value: 'on_hold' }
]

const priorityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' }
]

// Methods
async function fetchJobs() {
  await jobStore.fetchJobs()
}

function onPageChange(event) {
  jobStore.updatePagination({
    page: Math.floor(event.first / event.rows) + 1,
    limit: event.rows
  })
  fetchJobs()
}

function navigateToJob(jobId) {
  router.push(`/dispatch/jobs/${jobId}`)
}

function formatCurrency(amount) {
  return jobStore.formatCurrency(amount)
}

function formatDate(date) {
  return jobStore.formatDate(date)
}

function getStatusColor(status) {
  return jobStore.getStatusColor(status)
}

function getPriorityColor(priority) {
  return jobStore.getPriorityColor(priority)
}

function getHealthColor(level) {
  return jobStore.getHealthColor(level)
}

// Apply filters when they change
function applyFilters() {
  const filterParams = {
    status: selectedStatus.value,
    priority: selectedPriority.value
  }
  jobStore.updateFilters(filterParams)
  fetchJobs()
}

// Lifecycle
onMounted(() => {
  fetchJobs()
})

// Watch for filter changes
watch([selectedStatus, selectedPriority], () => {
  applyFilters()
})
</script> 