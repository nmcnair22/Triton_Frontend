<template>
  <div class="job-details p-6 space-y-6">
    <!-- Header Section -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-surface-900">Job Details</h1>
        <p class="text-surface-600 mt-1">
          Manage job information and track progress
        </p>
      </div>
      
      <div class="flex items-center gap-3">
        <Button 
          icon="pi pi-arrow-left" 
          label="Back to Jobs"
          @click="$router.push('/dispatch/jobs')"
          severity="secondary"
          outlined
        />
        <Button 
          icon="pi pi-refresh" 
          :loading="jobStore.loading.currentJob"
          @click="refreshJob"
          severity="secondary"
          outlined
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="jobStore.loading.currentJob" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <Skeleton height="200px" />
        <Skeleton height="300px" />
      </div>
      <div class="space-y-6">
        <Skeleton height="150px" />
        <Skeleton height="200px" />
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="jobStore.errors.currentJob" class="text-center py-12">
      <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
      <h3 class="text-xl font-semibold mb-2">Error Loading Job</h3>
      <p class="text-surface-600 mb-4">{{ jobStore.errors.currentJob }}</p>
      <Button label="Try Again" @click="refreshJob" />
    </div>

    <!-- Job Content -->
    <div v-else-if="job" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Job Overview -->
        <BaseCard title="Job Overview" variant="elevated">
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-1">Job Title</label>
                <p class="text-lg font-semibold">{{ job.title || 'Untitled Job' }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-1">Status</label>
                <StatusIndicator :status="job.status" :label="getStatusLabel(job.status)" />
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-surface-700 mb-1">Description</label>
              <p class="text-surface-900">{{ job.description || 'No description provided' }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-1">Priority</label>
                <StatusIndicator 
                  :status="job.priority" 
                  :label="getPriorityLabel(job.priority)"
                  type="priority"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-1">Estimated Duration</label>
                <p class="text-surface-900">{{ formatDuration(job.estimated_duration) }}</p>
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- Customer & Location -->
        <BaseCard title="Customer & Location" variant="elevated">
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-1">Customer</label>
                <div class="flex items-center space-x-2">
                  <i class="pi pi-building text-primary"></i>
                  <span class="font-medium">{{ job.customer?.name || 'Unknown Customer' }}</span>
                </div>
                <p class="text-sm text-surface-600 mt-1">{{ job.customer?.contact_person }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-1">Contact</label>
                <p class="text-surface-900">{{ job.customer?.phone || 'No phone provided' }}</p>
                <p class="text-surface-600 text-sm">{{ job.customer?.email || 'No email provided' }}</p>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-surface-700 mb-1">Location</label>
              <div class="flex items-start space-x-2">
                <i class="pi pi-map-marker text-primary mt-1"></i>
                <div>
                  <p class="font-medium">{{ job.location?.address || 'No address provided' }}</p>
                  <p class="text-sm text-surface-600">{{ job.location?.city }}</p>
                </div>
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- Schedule & Timeline -->
        <BaseCard title="Schedule & Timeline" variant="elevated">
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-1">Scheduled Date</label>
                <p class="text-surface-900">{{ formatDate(job.schedule?.scheduled_date) }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-1">Estimated Duration</label>
                <p class="text-surface-900">{{ formatDuration(job.schedule?.estimated_duration) }}</p>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-1">Actual Start</label>
                <p class="text-surface-900">{{ formatDateTime(job.schedule?.actual_start) || 'Not started' }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-1">Actual End</label>
                <p class="text-surface-900">{{ formatDateTime(job.schedule?.actual_end) || 'Not completed' }}</p>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Quick Actions -->
        <BaseCard title="Quick Actions" variant="elevated">
          <div class="space-y-3">
            <Button 
              label="Update Status" 
              icon="pi pi-refresh"
              @click="showStatusDialog = true"
              class="w-full"
              severity="primary"
            />
            <Button 
              label="Assign Technician" 
              icon="pi pi-user-plus"
              @click="showAssignDialog = true"
              class="w-full"
              severity="secondary"
            />
            <Button 
              label="Add Note" 
              icon="pi pi-comment"
              @click="showNoteDialog = true"
              class="w-full"
              severity="info"
              outlined
            />
            <Button 
              label="View on Map" 
              icon="pi pi-map"
              @click="openMap"
              class="w-full"
              severity="help"
              outlined
            />
          </div>
        </BaseCard>

        <!-- Assigned Technician -->
        <BaseCard title="Assigned Technician" variant="elevated">
          <div v-if="job.technician" class="space-y-3">
            <div class="flex items-center space-x-3">
              <Avatar 
                :label="getInitials(job.technician.name)"
                class="bg-primary text-white"
                size="large"
              />
              <div>
                <p class="font-medium">{{ job.technician.name }}</p>
                <p class="text-sm text-surface-600">{{ job.technician.phone }}</p>
              </div>
            </div>
            <Button 
              label="Contact Technician" 
              icon="pi pi-phone"
              @click="contactTechnician"
              class="w-full"
              severity="success"
              outlined
            />
          </div>
          <div v-else class="text-center py-4">
            <i class="pi pi-user-plus text-2xl text-surface-400 mb-2"></i>
            <p class="text-surface-600">No technician assigned</p>
            <Button 
              label="Assign Now" 
              @click="showAssignDialog = true"
              class="mt-2"
              size="small"
            />
          </div>
        </BaseCard>

        <!-- Job Timeline -->
        <BaseCard title="Activity Timeline" variant="elevated">
          <div class="space-y-3">
            <div v-for="activity in jobActivities" :key="activity.id" 
                 class="flex items-start space-x-3 pb-3 border-b border-surface-200 last:border-b-0">
              <div class="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div class="flex-1">
                <p class="text-sm font-medium">{{ activity.title }}</p>
                <p class="text-xs text-surface-600">{{ formatDateTime(activity.timestamp) }}</p>
              </div>
            </div>
            
            <div v-if="jobActivities.length === 0" class="text-center py-4 text-surface-500">
              <i class="pi pi-clock text-xl mb-2"></i>
              <p class="text-sm">No activity yet</p>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <i class="pi pi-briefcase text-4xl text-surface-400 mb-4"></i>
      <h3 class="text-xl font-semibold mb-2">Job Not Found</h3>
      <p class="text-surface-600 mb-4">The requested job could not be found.</p>
      <Button label="Back to Jobs" @click="$router.push('/dispatch/jobs')" />
    </div>

    <!-- Status Update Dialog -->
    <Dialog v-model:visible="showStatusDialog" header="Update Job Status" modal class="w-96">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">New Status</label>
          <Select 
            v-model="selectedStatus"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            placeholder="Select status"
            class="w-full"
          />
        </div>
        <div class="flex justify-end space-x-2">
          <Button label="Cancel" @click="showStatusDialog = false" severity="secondary" outlined />
          <Button label="Update" @click="updateJobStatus" :loading="updating" />
        </div>
      </div>
    </Dialog>

    <!-- Assign Technician Dialog -->
    <Dialog v-model:visible="showAssignDialog" header="Assign Technician" modal class="w-96">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Select Technician</label>
          <Select 
            v-model="selectedTechnician"
            :options="availableTechnicians"
            option-label="name"
            option-value="id"
            placeholder="Select technician"
            class="w-full"
          />
        </div>
        <div class="flex justify-end space-x-2">
          <Button label="Cancel" @click="showAssignDialog = false" severity="secondary" outlined />
          <Button label="Assign" @click="assignTechnician" :loading="assigning" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useJobStore } from '@/stores/dispatch-v2/job'
import { useToast } from 'primevue/usetoast'
import BaseCard from '../shared/components/BaseCard.vue'
import StatusIndicator from '../shared/components/StatusIndicator.vue'
import DispatchApiService from '@/services/DispatchApiService'

// Composables
const route = useRoute()
const router = useRouter()
const jobStore = useJobStore()
const toast = useToast()

// Reactive data
const showStatusDialog = ref(false)
const showAssignDialog = ref(false)
const showNoteDialog = ref(false)
const selectedStatus = ref('')
const selectedTechnician = ref('')
const updating = ref(false)
const assigning = ref(false)

// Computed
const job = computed(() => jobStore.currentJob)
const jobId = computed(() => route.params.id)

// Status options - these should come from API
const statusOptions = ref([])

// Available technicians - these should come from API
const availableTechnicians = ref([])

const jobActivities = computed(() => {
  if (!job.value) return []
  
  const activities = []
  if (job.value.created_at) {
    activities.push({ id: 1, title: 'Job created', timestamp: job.value.created_at })
  }
  if (job.value.updated_at) {
    activities.push({ id: 2, title: 'Job updated', timestamp: job.value.updated_at })
  }
  return activities
})

// Methods
async function loadStatusOptions() {
  try {
    const response = await DispatchApiService.shared.getStatusOptions()
    statusOptions.value = response.data || []
  } catch (error) {
    console.error('Failed to load status options:', error)
    // Show error state in UI instead of fallback data
  }
}

async function loadTechnicians() {
  try {
    const response = await DispatchApiService.shared.getTechnicians()
    availableTechnicians.value = response.data || []
  } catch (error) {
    console.error('Failed to load technicians:', error)
    // Show error state in UI instead of fallback data
  }
}

async function refreshJob() {
  if (jobId.value) {
    await jobStore.fetchJob(jobId.value)
  }
}

async function updateJobStatus() {
  if (!selectedStatus.value) return
  
  updating.value = true
  try {
    await jobStore.updateJobStatus(jobId.value, selectedStatus.value)
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Job status updated successfully',
      life: 3000
    })
    showStatusDialog.value = false
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update job status',
      life: 3000
    })
  } finally {
    updating.value = false
  }
}

async function assignTechnician() {
  if (!selectedTechnician.value) return
  
  assigning.value = true
  try {
    await jobStore.assignTechnician(jobId.value, selectedTechnician.value)
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Technician assigned successfully',
      life: 3000
    })
    showAssignDialog.value = false
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to assign technician',
      life: 3000
    })
  } finally {
    assigning.value = false
  }
}

function getStatusLabel(status) {
  const option = statusOptions.value.find(opt => opt.value === status)
  return option?.label || status
}

function getPriorityLabel(priority) {
  const priorities = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent'
  }
  return priorities[priority] || priority
}

function formatDuration(minutes) {
  if (!minutes) return 'Not specified'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

function formatDate(date) {
  if (!date) return 'Not scheduled'
  return new Date(date).toLocaleDateString()
}

function formatDateTime(datetime) {
  if (!datetime) return null
  return new Date(datetime).toLocaleString()
}

function getInitials(name) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??'
}

function contactTechnician() {
  if (job.value?.technician?.phone) {
    window.open(`tel:${job.value.technician.phone}`)
  }
}

function openMap() {
  if (job.value?.location?.coordinates) {
    const [lat, lng] = job.value.location.coordinates
    window.open(`https://maps.google.com/?q=${lat},${lng}`)
  }
}

// Lifecycle
onMounted(async () => {
  // Load reference data
  await Promise.allSettled([
    loadStatusOptions(),
    loadTechnicians()
  ])
  
  // Load job data
  if (jobId.value) {
    await refreshJob()
  }
})

watch(() => route.params.id, (newId) => {
  if (newId) {
    refreshJob()
  }
})
</script> 