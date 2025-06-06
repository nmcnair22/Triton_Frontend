<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import Drawer from 'primevue/drawer';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import ProgressBar from 'primevue/progressbar';

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  ticketId: {
    type: [String, Number],
    default: null
  },
  jobReport: {
    type: Object,
    default: null
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  error: {
    type: [String, Object, null],
    default: null
  }
});

// Emits
const emit = defineEmits(['update:visible', 'load-report']);

// Sample data for initial rendering
const jobData = computed(() => {
  return props.jobReport || {
    success: true,
    job_id: props.ticketId || 'JOB-12345',
    location: '123 Main Street, Anytown, CA 94321',
    start_date: 'Apr 15, 2023',
    start_time: '2:00 AM',
    customer_id: 'CUST-789',
    completion_percentage: 75,
    status: 'In Progress',
    work_summary: 'HVAC system installation and configuration with multiple visits required due to parts availability and scheduling constraints.',
    visits: [
      { id: 1, status: 'Completed' },
      { id: 2, status: 'Completed' },
      { id: 3, status: 'Completed' }
    ],
    key_issues: [
      { id: 1, status: 'Resolved' },
      { id: 2, status: 'Resolved' },
      { id: 3, status: 'Resolved' },
      { id: 4, status: 'Resolved' }
    ]
  };
});

// Computed stats for cards
const totalVisits = computed(() => jobData.value.visits?.length || 0);
const completedVisits = computed(() => {
  if (!jobData.value.visits) return 0;
  return jobData.value.visits.filter(v => v.status === 'Completed').length;
});
const totalHours = computed(() => '24.5'); // Hardcoded for now
const totalIssues = computed(() => {
  if (!jobData.value.key_issues) return '0/0';
  const total = jobData.value.key_issues.length;
  const resolved = jobData.value.key_issues.filter(i => i.status === 'Resolved').length;
  return `${resolved}/${total}`;
});

// Methods
function closeDrawer() {
  emit('update:visible', false);
}

// Fetch report on mount if needed
onMounted(() => {
  if (props.visible && !props.jobReport && !props.isLoading) {
    emit('load-report');
  }
});
</script>

<template>
  <Drawer 
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    position="bottom"
    :style="{ height: '75vh' }"
    class="job-report-drawer w-full"
    :modal="true"
    :dismissableMask="true"
    :closeOnEscape="true"
  >
    <template #header>
      <div class="report-header w-full p-4 border-bottom-1 surface-border">
        <div class="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center">
          <div>
            <h2 class="text-xl font-bold m-0 mb-2">Job Report</h2>
            <div class="text-500">
              ID: JOB-12345 • 123 Main Street, Anytown, CA 94321
            </div>
          </div>
        </div>
      </div>
    </template>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="flex align-items-center justify-content-center p-5">
      <span class="pi pi-spin pi-spinner text-2xl text-primary mr-2" />
      <span>Loading job report...</span>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="p-message p-message-error p-3 mb-3">
      <i class="pi pi-exclamation-triangle p-message-icon mr-2"></i>
      <span>{{ typeof error === 'string' ? error : (error.message || 'An error occurred') }}</span>
    </div>
    
    <!-- Content -->
    <div v-else class="job-report">
      <template v-if="jobData.success">
        <!-- Stats Cards -->
        <div class="flex flex-row flex-wrap gap-3 p-4">
          <div class="flex-1 min-w-min">
            <div class="surface-card border-round-lg border-1 surface-border shadow-2 p-4">
              <div class="flex items-start">
                <div class="bg-blue-50 w-[30px] h-[30px] rounded-full flex items-center justify-center shadow-sm mr-4">
                  <i class="pi pi-building text-blue-500 text-2xl"></i>
                </div>
                <div>
                  <div class="text-700 font-semibold mb-1 mt-1">Total Visits</div>
                  <div class="text-900 text-3xl font-bold">{{ totalVisits }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="flex-1 min-w-min">
            <div class="surface-card border-round-lg border-1 surface-border shadow-2 p-4">
              <div class="flex items-start">
                <div class="bg-green-50 w-[30px] h-[30px] rounded-full flex items-center justify-center shadow-sm mr-4">
                  <i class="pi pi-check-circle text-green-500 text-2xl"></i>
                </div>
                <div>
                  <div class="text-700 font-semibold mb-1 mt-1">Completed</div>
                  <div class="text-900 text-3xl font-bold">{{ completedVisits }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="flex-1 min-w-min">
            <div class="surface-card border-round-lg border-1 surface-border shadow-2 p-4">
              <div class="flex items-start">
                <div class="bg-yellow-50 w-[30px] h-[30px] rounded-full flex items-center justify-center shadow-sm mr-4">
                  <i class="pi pi-clock text-yellow-500 text-2xl"></i>
                </div>
                <div>
                  <div class="text-700 font-semibold mb-1 mt-1">Total Hours</div>
                  <div class="text-900 text-3xl font-bold">{{ totalHours }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="flex-1 min-w-min">
            <div class="surface-card border-round-lg border-1 surface-border shadow-2 p-4">
              <div class="flex items-start">
                <div class="bg-red-50 w-[30px] h-[30px] rounded-full flex items-center justify-center shadow-sm mr-4">
                  <i class="pi pi-exclamation-circle text-red-500 text-2xl"></i>
                </div>
                <div>
                  <div class="text-700 font-semibold mb-1 mt-1">Issues</div>
                  <div class="text-900 text-3xl font-bold">{{ totalIssues }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Job Overview Section -->
        <div class="p-4">
          <div class="surface-card border-round-lg border-1 surface-border shadow-2 p-4">
            <div class="flex justify-content-between align-items-center mb-3">
              <h3 class="text-xl font-medium m-0">Job Overview</h3>
              <Tag 
                value="In Progress" 
                severity="info" 
                class="text-sm bg-blue-100"
              >
                <template #icon>
                  <i class="pi pi-pause mr-1"></i>
                </template>
              </Tag>
            </div>
            
            <div class="grid">
              <!-- Single row of metadata, evenly distributed -->
              <div class="col-12 sm:col-4">
                <div class="flex align-items-center">
                  <i class="pi pi-calendar text-500 mr-2"></i>
                  <span class="font-medium">Started:</span>
                  <span class="ml-2">{{ jobData.start_date }} {{ jobData.start_time }}</span>
                </div>
              </div>
              
              <div class="col-12 sm:col-4">
                <div class="flex align-items-center">
                  <i class="pi pi-calendar-times text-500 mr-2"></i>
                  <span class="font-medium">End date:</span>
                  <span class="ml-2">not set</span>
                </div>
              </div>
              
              <div class="col-12 sm:col-4">
                <div class="flex align-items-center">
                  <i class="pi pi-user text-500 mr-2"></i>
                  <span class="font-medium">Customer ID:</span>
                  <span class="ml-2">{{ jobData.customer_id }}</span>
                </div>
              </div>
            </div>
            
            <!-- Completion Progress -->
            <div class="mb-4 mt-2">
              <div class="flex justify-content-between align-items-center mb-1">
                <span class="text-600 font-medium">Completion</span>
                <span class="font-medium text-right">{{ jobData.completion_percentage }}%</span>
              </div>
              <div class="relative">
                <ProgressBar 
                  :value="jobData.completion_percentage" 
                  :showValue="false" 
                  class="h-1rem"
                />
                <div class="progress-markers absolute top-0 w-full h-full pointer-events-none flex justify-content-between">
                  <div class="marker h-full bg-white w-1" style="opacity: 0.7;"></div>
                  <div class="marker h-full bg-white w-1" style="opacity: 0.7;"></div>
                </div>
              </div>
            </div>
            
            <!-- Work Summary -->
            <div class="mt-4">
              <div class="font-medium mb-2">Work Summary</div>
              <p class="m-0 text-600 line-height-3">{{ jobData.work_summary }}</p>
            </div>
          </div>
        </div>
      </template>
      
      <!-- Error response -->
      <div v-else class="p-message p-message-error p-3 mb-3">
        <i class="pi pi-exclamation-triangle p-message-icon mr-2"></i>
        <span>{{ jobData.message || 'Failed to load job report' }}</span>
      </div>
    </div>
    
    <!-- Footer with close button -->
    <template #footer>
      <div class="flex justify-content-end p-3">
        <Button 
          icon="pi pi-times" 
          label="Close" 
          @click="closeDrawer" 
          class="p-button-sm" 
          severity="secondary"
        />
      </div>
    </template>
  </Drawer>
</template>

<style scoped>
.job-report-drawer {
  width: 100%;
  max-width: 100%;
}

.job-report-drawer :deep(.p-drawer-content) {
  padding: 0;
  overflow: auto;
}

.job-report {
  min-height: 50vh;
  max-height: 70vh;
  overflow-y: auto;
}

.report-header {
  background-color: var(--surface-card);
}

/* Enhanced shadow for cards */
.shadow-2 {
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

/* Progress bar styling */
.h-1rem {
  height: 1rem;
}

.relative {
  position: relative;
}

.absolute {
  position: absolute;
}

.top-0 {
  top: 0;
}

.w-full {
  width: 100%;
}

.h-full {
  height: 100%;
}

.pointer-events-none {
  pointer-events: none;
}
</style>
