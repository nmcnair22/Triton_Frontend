<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from 'primevue/card';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Breadcrumb from 'primevue/breadcrumb';
import Tag from 'primevue/tag';
import Divider from 'primevue/divider';
import Panel from 'primevue/panel';
import Timeline from 'primevue/timeline';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';

// Router and route
const route = useRoute();
const router = useRouter();
const projectId = route.params.projectId;
const jobId = route.params.jobId;
const visitId = route.params.visitId;

// Breadcrumb navigation function
const navigateTo = (path) => {
  console.log('Navigating to:', path);
  router.push(path);
};

// UI state
const showResolutionDialog = ref(false);
const selectedIssue = ref(null);
const resolutionText = ref('');
const resolutionStatus = ref(null);

// Status options for resolution
const resolutionStatusOptions = [
  { name: 'Resolved', value: 'Resolved' },
  { name: 'Partially Resolved', value: 'Partially Resolved' },
  { name: 'Unresolved', value: 'Unresolved' }
];

// Breadcrumb items
const breadcrumbItems = computed(() => [
  { label: 'Home', route: '/' },
  { label: 'Projects Dashboard', route: '/dashboard' },
  { label: `Project ${projectId}`, route: `/dashboard/projects/${projectId}` },
  { label: `Job Details`, route: `/dashboard/projects/${projectId}/jobs/${jobId}` },
  { label: `Visit ${visitId}` }
]);
const breadcrumbHome = { icon: 'pi pi-home', route: '/' };

// Mock data based on the provided JSON
const visitData = ref({
  visit: {
    visitId: "VG1",
    jobId: "6d815ec56dfb85e2182e01471c31e486",
    phaseName: "Site Survey",
    visitDate: "2025-02-04",
    status: "Completed",
    timeIn: "08:00:00",
    timeOut: "08:27:00",
    timeOnSiteMin: 27,
    revisitNeeded: false,
    workSummary: "Site survey completed successfully."
  },
  technicians: [
    { technicianId: null, name: "Joel", hoursWorked: 0.45, roles: ["Contractor"] }
  ],
  tasks: [
    "Site Survey"
  ],
  issues: [
    {
      visitIssueId: "VI-001",
      description: "Technician was unable to locate the ISP circuit.",
      status: "Unresolved",
      mitigation: "Further investigation may be required.",
      resolutionAttempts: [
        { attemptDescription: "Checked for ISP circuit on site.", outcome: "Unsuccessful" }
      ]
    }
  ],
  timelineEvents: [
    { timestamp: "2025-02-04T08:00:00Z", event: "Technician arrived on site" },
    { timestamp: "2025-02-04T08:10:00Z", event: "Checked in with MOD, Tim" },
    { timestamp: "2025-02-04T08:15:00Z", event: "Started site survey" },
    { timestamp: "2025-02-04T08:25:00Z", event: "Completed site survey" },
    { timestamp: "2025-02-04T08:27:00Z", event: "Left site" }
  ],
  materialsUsed: [],
  keyInteractions: [
    { interactionType: "Check-in", details: "Checked in with MOD, Tim", impact: "Allowed access to site" }
  ]
});

// Additional mock data
const materials = ref([
  {
    id: "MAT-001",
    name: "Site Survey Toolkit",
    quantity: 1
  }
]);

// Computed properties
const totalTimeOnSite = computed(() => {
  const timeOnSite = visitData.value.visit.timeOnSiteMin;
  if (timeOnSite === null || timeOnSite === undefined) return 'N/A';
  
  const hours = Math.floor(timeOnSite / 60);
  const minutes = timeOnSite % 60;
  
  if (hours === 0) return `${minutes} minutes`;
  return `${hours}h ${minutes}m`;
});

const timelineData = computed(() => {
  return visitData.value.timelineEvents.map(event => {
    const date = new Date(event.timestamp);
    return {
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      event: event.event,
      icon: getTimelineIcon(event.event),
      color: getTimelineColor(event.event)
    };
  });
});

// Methods
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  
  // Convert from "08:00:00" format to "8:00 AM"
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12; // Convert to 12-hour format
  
  return `${displayHour}:${minutes} ${period}`;
};

const formatHours = (hours) => {
  if (!hours && hours !== 0) return 'N/A';
  return hours === 1 ? '1 hour' : `${hours} hours`;
};

const getStatusSeverity = (status) => {
  switch (status) {
    case 'Completed': return 'success';
    case 'Failed': return 'danger';
    case 'Scheduled': return 'info';
    case 'Cancelled': return 'warning';
    default: return 'secondary';
  }
};

const getIssueSeverity = (status) => {
  switch (status) {
    case 'Resolved': return 'success';
    case 'Partially Resolved': return 'warning';
    case 'Unresolved': return 'danger';
    default: return 'info';
  }
};

const getTimelineIcon = (event) => {
  if (event.includes('arrived')) return 'pi pi-sign-in';
  if (event.includes('left')) return 'pi pi-sign-out';
  if (event.includes('check')) return 'pi pi-check-circle';
  if (event.includes('started')) return 'pi pi-play';
  if (event.includes('completed')) return 'pi pi-flag';
  return 'pi pi-clock';
};

const getTimelineColor = (event) => {
  if (event.includes('arrived')) return '#2196F3'; // Blue
  if (event.includes('left')) return '#9C27B0'; // Purple
  if (event.includes('check')) return '#4CAF50'; // Green
  if (event.includes('started')) return '#FF9800'; // Orange
  if (event.includes('completed')) return '#4CAF50'; // Green
  return '#607D8B'; // Blue Grey
};

const openResolutionDialog = (issue) => {
  selectedIssue.value = issue;
  resolutionText.value = '';
  resolutionStatus.value = null;
  showResolutionDialog.value = true;
};

const submitResolution = () => {
  if (!resolutionText.value || !resolutionStatus.value) return;
  
  // In a real app, this would send the resolution to the server
  console.log('Submitting resolution for issue:', selectedIssue.value);
  console.log('Resolution text:', resolutionText.value);
  console.log('Resolution status:', resolutionStatus.value);
  
  // For demo, update the issue in our local data
  const issue = visitData.value.issues.find(i => i.visitIssueId === selectedIssue.value.visitIssueId);
  if (issue) {
    issue.resolutionAttempts.push({
      attemptDescription: resolutionText.value,
      outcome: resolutionStatus.value
    });
    issue.status = resolutionStatus.value;
  }
  
  // Close the dialog
  showResolutionDialog.value = false;
};

const cancelResolution = () => {
  showResolutionDialog.value = false;
};

// Initialize data
onMounted(() => {
  console.log('Visit view mounted for visit ID:', visitId);
  // In a real implementation, this would fetch visit data from the API
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
    
    <!-- Visit Header -->
    <div class="bg-white dark:bg-surface-900 p-4 rounded-lg shadow mb-6">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-3xl font-bold">Visit {{ visitData.visit.visitId }}</h1>
          <div class="flex items-center gap-2 mt-2">
            <span class="text-lg text-gray-700 dark:text-gray-300">{{ visitData.visit.phaseName }}</span>
            <span class="text-gray-500">•</span>
            <span class="text-lg text-gray-700 dark:text-gray-300">{{ formatDate(visitData.visit.visitDate) }}</span>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <Tag :value="visitData.visit.status" :severity="getStatusSeverity(visitData.visit.status)" class="text-sm" />
          <Button icon="pi pi-file-pdf" label="Export Details" outlined size="small" />
        </div>
      </div>
      
      <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <span class="text-sm text-gray-600 dark:text-gray-400">Time In</span>
          <div class="font-medium">{{ formatTime(visitData.visit.timeIn) }}</div>
        </div>
        <div>
          <span class="text-sm text-gray-600 dark:text-gray-400">Time Out</span>
          <div class="font-medium">{{ formatTime(visitData.visit.timeOut) }}</div>
        </div>
        <div>
          <span class="text-sm text-gray-600 dark:text-gray-400">Time On Site</span>
          <div class="font-medium">{{ totalTimeOnSite }}</div>
        </div>
        <div>
          <span class="text-sm text-gray-600 dark:text-gray-400">Revisit Needed</span>
          <div>
            <Tag v-if="visitData.visit.revisitNeeded" severity="warning" value="Yes" />
            <Tag v-else severity="success" value="No" />
          </div>
        </div>
      </div>
      
      <Divider />
      
      <div class="text-gray-700 dark:text-gray-300">
        <span class="font-medium">Work Summary:</span> {{ visitData.visit.workSummary }}
      </div>
    </div>
    
    <!-- Visit Content Panels -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left Column -->
      <div class="flex flex-col gap-6">
        <!-- Technicians Panel -->
        <Panel header="Technicians" toggleable class="shadow-sm">
          <template #default>
            <DataTable 
              :value="visitData.technicians" 
              responsiveLayout="scroll"
              class="p-datatable-sm"
            >
              <Column field="name" header="Name"></Column>
              <Column field="hoursWorked" header="Hours">
                <template #body="slotProps">
                  {{ formatHours(slotProps.data.hoursWorked) }}
                </template>
              </Column>
              <Column field="roles" header="Roles">
                <template #body="slotProps">
                  <div class="flex flex-wrap gap-1">
                    <Tag v-for="role in slotProps.data.roles" :key="role" :value="role" severity="info" class="text-xs" />
                  </div>
                </template>
              </Column>
            </DataTable>
            
            <div v-if="visitData.technicians.length === 0" class="py-4 text-center text-gray-500">
              No technicians assigned
            </div>
          </template>
        </Panel>
        
        <!-- Tasks Panel -->
        <Panel header="Tasks Performed" toggleable class="shadow-sm">
          <template #default>
            <ul class="list-disc pl-5 space-y-2">
              <li v-for="(task, index) in visitData.tasks" :key="index" class="text-gray-700 dark:text-gray-300">
                {{ task }}
              </li>
            </ul>
            
            <div v-if="visitData.tasks.length === 0" class="py-4 text-center text-gray-500">
              No tasks recorded
            </div>
          </template>
        </Panel>
        
        <!-- Materials Panel -->
        <Panel header="Materials Used" toggleable class="shadow-sm">
          <template #default>
            <DataTable 
              :value="materials" 
              responsiveLayout="scroll"
              class="p-datatable-sm"
            >
              <Column field="id" header="ID" style="width: 25%"></Column>
              <Column field="name" header="Material" style="width: 50%"></Column>
              <Column field="quantity" header="Qty" style="width: 25%"></Column>
            </DataTable>
            
            <div v-if="materials.length === 0" class="py-4 text-center text-gray-500">
              No materials used
            </div>
          </template>
        </Panel>
      </div>
      
      <!-- Right Column -->
      <div class="flex flex-col gap-6">
        <!-- Issues Panel -->
        <Panel header="Visit Issues" toggleable class="shadow-sm">
          <template #default>
            <div v-for="issue in visitData.issues" :key="issue.visitIssueId" class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-3">
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <div class="font-semibold mb-1">{{ issue.description }}</div>
                  <div class="flex items-center gap-2 mb-2">
                    <Tag :value="issue.status" :severity="getIssueSeverity(issue.status)" class="text-xs" />
                  </div>
                </div>
                <Button 
                  label="Add Resolution" 
                  icon="pi pi-plus" 
                  size="small" 
                  @click="openResolutionDialog(issue)"
                />
              </div>
              
              <Divider class="my-2" />
              
              <!-- Mitigation -->
              <div class="mb-2">
                <span class="text-sm font-semibold text-gray-600 dark:text-gray-400">Mitigation:</span>
                <p class="text-sm text-gray-700 dark:text-gray-300">{{ issue.mitigation }}</p>
              </div>
              
              <!-- Resolution Attempts -->
              <div>
                <span class="text-sm font-semibold text-gray-600 dark:text-gray-400">Resolution Attempts:</span>
                <div v-for="(attempt, index) in issue.resolutionAttempts" :key="index" class="text-sm mt-1 border-l-2 border-blue-500 pl-2">
                  <p class="mb-1">{{ attempt.attemptDescription }}</p>
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    Outcome: <span class="font-medium">{{ attempt.outcome }}</span>
                  </p>
                </div>
              </div>
            </div>
            
            <div v-if="visitData.issues.length === 0" class="py-4 text-center text-gray-500">
              No issues recorded
            </div>
          </template>
        </Panel>
        
        <!-- Timeline Panel -->
        <Panel header="Timeline Events" toggleable class="shadow-sm">
          <template #default>
            <Timeline :value="timelineData" layout="vertical" class="w-full">
              <template #content="slotProps">
                <div class="flex flex-col">
                  <span class="text-sm text-gray-600 dark:text-gray-400">{{ slotProps.item.time }}</span>
                  <span class="font-medium">{{ slotProps.item.event }}</span>
                </div>
              </template>
              <template #marker="slotProps">
                <div class="flex items-center justify-center w-7 h-7 border-2 border-white dark:border-surface-900 rounded-full" :style="{ backgroundColor: slotProps.item.color }">
                  <i :class="[slotProps.item.icon, 'text-white text-sm']"></i>
                </div>
              </template>
            </Timeline>
            
            <div v-if="visitData.timelineEvents.length === 0" class="py-4 text-center text-gray-500">
              No timeline events recorded
            </div>
          </template>
        </Panel>
        
        <!-- Key Interactions Panel -->
        <Panel header="Key Interactions" toggleable class="shadow-sm">
          <template #default>
            <div v-for="(interaction, index) in visitData.keyInteractions" :key="index" class="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0 last:mb-0">
              <div class="font-semibold mb-1">{{ interaction.interactionType }}</div>
              <div class="text-sm text-gray-700 dark:text-gray-300">{{ interaction.details }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <span class="font-medium">Impact:</span> {{ interaction.impact }}
              </div>
            </div>
            
            <div v-if="visitData.keyInteractions.length === 0" class="py-4 text-center text-gray-500">
              No key interactions recorded
            </div>
          </template>
        </Panel>
      </div>
    </div>
    
    <!-- Resolution Dialog -->
    <Dialog 
      v-model:visible="showResolutionDialog" 
      header="Add Resolution" 
      :style="{ width: '500px' }" 
      :modal="true"
    >
      <div class="flex flex-col gap-4">
        <div v-if="selectedIssue">
          <h3 class="text-lg font-medium mb-2">Issue:</h3>
          <p class="text-gray-700 dark:text-gray-300">{{ selectedIssue.description }}</p>
        </div>
        
        <div class="flex flex-col gap-2">
          <label for="resolutionText" class="font-medium">Resolution Description</label>
          <Textarea 
            id="resolutionText" 
            v-model="resolutionText" 
            rows="5" 
            class="w-full" 
            placeholder="Describe the resolution attempt..."
          />
        </div>
        
        <div class="flex flex-col gap-2">
          <label for="resolutionStatus" class="font-medium">Outcome</label>
          <Select 
            id="resolutionStatus" 
            v-model="resolutionStatus" 
            :options="resolutionStatusOptions" 
            optionLabel="name" 
            optionValue="value"
            placeholder="Select an outcome" 
            class="w-full"
          />
        </div>
      </div>
      
      <template #footer>
        <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="cancelResolution" />
        <Button label="Submit" icon="pi pi-check" @click="submitResolution" :disabled="!resolutionText || !resolutionStatus" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
/* Custom styles if needed */
:deep(.p-panel-header) {
  padding: 1rem 1.25rem;
  font-weight: 600;
}

:deep(.p-panel-content) {
  padding: 1.25rem;
}

:deep(.p-panel .p-panel-header-icon) {
  width: 2rem;
  height: 2rem;
}

:deep(.p-timeline) {
  margin-left: 1rem;
}

:deep(.p-timeline-event-opposite) {
  flex: 0;
  padding-right: 1rem;
}

:deep(.p-divider.p-divider-horizontal) {
  margin: 1rem 0;
}
</style> 