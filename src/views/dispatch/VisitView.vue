<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
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
import { useToast } from 'primevue/usetoast';
import { useDispatchStore } from '@/stores/dispatchStore';
import { DispatchService } from '@/service/DispatchService';
import { ApiService } from '@/service/ApiService';

// Router and route
const route = useRoute();
const router = useRouter();
const toast = useToast();

// Extract params
const projectId = route.params.projectId;
const jobId = route.params.jobId;
const visitId = route.params.visitId;

// Get dispatch store
const dispatchStore = useDispatchStore();

// State management
const loading = ref(true);
const error = ref(null);
const visitData = ref(null);
const materialsData = ref([]);
const timelineData = ref([]);
const keyInteractionsData = ref([]);
const workPerformanceData = ref(null);

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

// Computed properties
const formattedTimelineData = computed(() => {
  if (!timelineData.value) return [];
  
  return timelineData.value.map(event => {
    const date = new Date(event.timestamp);
    return {
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      event: event.event_description || event.event,
      icon: getTimelineIcon(event.event_description || event.event),
      color: getTimelineColor(event.event_description || event.event)
    };
  });
});

const totalTimeOnSite = computed(() => {
  if (!visitData.value?.timeOnSiteMin && visitData.value?.timeOnSiteMin !== 0) return 'N/A';
  
  const timeOnSite = visitData.value.timeOnSiteMin;
  const hours = Math.floor(timeOnSite / 60);
  const minutes = timeOnSite % 60;
  
  if (hours === 0) return `${minutes} minutes`;
  return `${hours}h ${minutes}m`;
});

// Methods
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  
  // Check if timeString is already in HH:MM:SS format
  if (timeString.includes(':')) {
    // Convert from "08:00:00" format to "8:00 AM"
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12; // Convert to 12-hour format
    
    return `${displayHour}:${minutes} ${period}`;
  }
  
  // If it's a timestamp
  try {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  } catch (e) {
    console.error('Error formatting time:', e);
    return timeString;
  }
};

const formatHours = (hours) => {
  if (!hours && hours !== 0) return 'N/A';
  return hours === 1 ? '1 hour' : `${hours} hours`;
};

const getStatusSeverity = (status) => {
  if (!status) return 'secondary';
  
  const statusLower = status.toLowerCase();
  if (statusLower.includes('complete')) return 'success';
  if (statusLower.includes('fail')) return 'danger';
  if (statusLower.includes('schedul')) return 'info';
  if (statusLower.includes('cancel')) return 'warning';
  return 'secondary';
};

const getIssueSeverity = (status) => {
  if (!status) return 'info';
  
  const statusLower = status.toLowerCase();
  if (statusLower.includes('resolve')) return 'success';
  if (statusLower.includes('partial')) return 'warning';
  if (statusLower.includes('unresolv')) return 'danger';
  return 'info';
};

const getTimelineIcon = (event) => {
  if (!event) return 'pi pi-clock';
  
  const eventLower = event.toLowerCase();
  if (eventLower.includes('arrived') || eventLower.includes('arrival')) return 'pi pi-sign-in';
  if (eventLower.includes('left') || eventLower.includes('depart')) return 'pi pi-sign-out';
  if (eventLower.includes('check')) return 'pi pi-check-circle';
  if (eventLower.includes('start')) return 'pi pi-play';
  if (eventLower.includes('complet')) return 'pi pi-flag';
  return 'pi pi-clock';
};

const getTimelineColor = (event) => {
  if (!event) return '#607D8B';
  
  const eventLower = event.toLowerCase();
  if (eventLower.includes('arrived') || eventLower.includes('arrival')) return '#2196F3'; // Blue
  if (eventLower.includes('left') || eventLower.includes('depart')) return '#9C27B0'; // Purple
  if (eventLower.includes('check')) return '#4CAF50'; // Green
  if (eventLower.includes('start')) return '#FF9800'; // Orange
  if (eventLower.includes('complet')) return '#4CAF50'; // Green
  return '#607D8B'; // Blue Grey
};

const openResolutionDialog = (issue) => {
  selectedIssue.value = issue;
  resolutionText.value = '';
  resolutionStatus.value = null;
  showResolutionDialog.value = true;
};

const submitResolution = async () => {
  if (!resolutionText.value || !resolutionStatus.value) return;
  
  try {
    loading.value = true;
    
    console.log('[DEBUG] Submitting resolution for issue:', selectedIssue.value.visitIssueId);
    console.log('[DEBUG] Resolution data:', {
      resolution_text: resolutionText.value,
      resolution_status: resolutionStatus.value
    });
    
    // Call API to submit resolution
    const response = await ApiService.post(`visits/${visitId}/issues/${selectedIssue.value.visitIssueId}/resolution`, {
      resolution_text: resolutionText.value,
      resolution_status: resolutionStatus.value
    });
    
    console.log('[DEBUG] Resolution submission response:', response.data);
    
    if (response.data.success) {
      // Update the issue in our local data
      const issue = visitData.value.issues.find(i => i.visitIssueId === selectedIssue.value.visitIssueId);
      if (issue) {
        if (!issue.resolutionAttempts) {
          issue.resolutionAttempts = [];
        }
        
        issue.resolutionAttempts.push({
          attemptDescription: resolutionText.value,
          outcome: resolutionStatus.value
        });
        
        issue.status = resolutionStatus.value;
      }
      
      toast.add({
        severity: 'success',
        summary: 'Resolution Submitted',
        detail: 'The issue resolution has been recorded',
        life: 3000
      });
    } else {
      throw new Error(response.data.message || 'Failed to submit resolution');
    }
  } catch (err) {
    console.error('[DEBUG] Error submitting resolution:', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to submit resolution',
      life: 3000
    });
  } finally {
    loading.value = false;
    showResolutionDialog.value = false;
  }
};

const cancelResolution = () => {
  showResolutionDialog.value = false;
};

// API data fetching
const fetchVisitData = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    console.log('[DEBUG] VisitView: Fetching data for visit', visitId, 'in job', jobId);
    console.log('[DEBUG] API request params:', { jobId, include: 'job,visits' });
    
    // Fetch job data with visits component
    const jobResponse = await ApiService.get(`dashboard/jobs/${jobId}/analysis?include=job,visits`);
    
    console.log('[DEBUG] Job analysis response received:', jobResponse.status);
    console.log('[DEBUG] Job response success:', jobResponse.data.success);
    console.log('[DEBUG] Job response data structure:', Object.keys(jobResponse.data.data || {}));
    
    if (jobResponse.data.success && jobResponse.data.data) {
      console.log('[DEBUG] Visits in response:', jobResponse.data.data.visits?.length || 0);
      
      // Find the specific visit in the visits array
      const visit = jobResponse.data.data.visits.find(v => v.visit_id === visitId);
      
      if (visit) {
        console.log('[DEBUG] Found matching visit:', visit.visit_id);
        console.log('[DEBUG] Visit data structure:', Object.keys(visit));
        
        visitData.value = {
          visit: {
            visitId: visit.visit_id,
            jobId: jobId,
            phaseName: visit.phase_name || 'Site Visit',
            visitDate: visit.visit_date,
            status: visit.status,
            timeIn: visit.time_in,
            timeOut: visit.time_out,
            timeOnSiteMin: visit.time_on_site_min,
            revisitNeeded: visit.revisit_needed,
            workSummary: visit.work_summary || visit.work_performed?.summary
          },
          technicians: visit.technicians || [],
          tasks: visit.tasks || [],
          issues: visit.issues || []
        };
        
        console.log('[DEBUG] Processed visit data:', visitData.value);
      } else {
        console.error('[DEBUG] Visit not found in job data. Available visit IDs:', 
          jobResponse.data.data.visits.map(v => v.visit_id));
        throw new Error('Visit not found in job data');
      }
    } else {
      console.error('[DEBUG] Job response error:', jobResponse.data.message || 'Unknown error');
      throw new Error(jobResponse.data.message || 'Failed to load job data');
    }
    
    console.log('[DEBUG] Fetching additional visit-specific data');
    
    // Fetch additional visit-specific data in parallel
    await Promise.all([
      fetchVisitMaterials(),
      fetchVisitTimeline(),
      fetchVisitKeyInteractions(),
      fetchVisitWorkPerformance()
    ]);
    
    console.log('[DEBUG] All visit data fetched successfully');
    
  } catch (err) {
    console.error('[DEBUG] Error fetching visit data:', err);
    error.value = err.message || 'Failed to load visit data';
  } finally {
    loading.value = false;
  }
};

const fetchVisitMaterials = async () => {
  try {
    console.log('[DEBUG] Fetching materials for visit', visitId);
    
    const response = await ApiService.get(`visits/${visitId}/materials`);
    
    console.log('[DEBUG] Materials response received:', response.status);
    console.log('[DEBUG] Materials success:', response.data.success);
    
    if (response.data.success && response.data.data) {
      console.log('[DEBUG] Materials count:', response.data.data.materials?.length || 0);
      materialsData.value = response.data.data.materials || [];
    } else {
      console.warn('[DEBUG] Failed to load materials:', response.data.message);
    }
  } catch (err) {
    console.error('[DEBUG] Error fetching visit materials:', err);
    // Don't fail the entire page for this data
  }
};

const fetchVisitTimeline = async () => {
  try {
    console.log('[DEBUG] Fetching timeline for visit', visitId);
    
    const response = await ApiService.get(`visits/${visitId}/timeline`);
    
    console.log('[DEBUG] Timeline response received:', response.status);
    console.log('[DEBUG] Timeline success:', response.data.success);
    
    if (response.data.success && response.data.data) {
      console.log('[DEBUG] Timeline events count:', response.data.data.events?.length || 0);
      timelineData.value = response.data.data.events || [];
    } else {
      console.warn('[DEBUG] Failed to load timeline:', response.data.message);
    }
  } catch (err) {
    console.error('[DEBUG] Error fetching visit timeline:', err);
    // Don't fail the entire page for this data
  }
};

const fetchVisitKeyInteractions = async () => {
  try {
    console.log('[DEBUG] Fetching key interactions for visit', visitId);
    
    const response = await ApiService.get(`visits/${visitId}/key-interactions`);
    
    console.log('[DEBUG] Key interactions response received:', response.status);
    console.log('[DEBUG] Key interactions success:', response.data.success);
    
    if (response.data.success && response.data.data) {
      console.log('[DEBUG] Interactions count:', response.data.data.interactions?.length || 0);
      keyInteractionsData.value = response.data.data.interactions || [];
    } else {
      console.warn('[DEBUG] Failed to load key interactions:', response.data.message);
    }
  } catch (err) {
    console.error('[DEBUG] Error fetching key interactions:', err);
    // Don't fail the entire page for this data
  }
};

const fetchVisitWorkPerformance = async () => {
  try {
    console.log('[DEBUG] Fetching work performance for visit', visitId);
    
    const response = await ApiService.get(`visits/${visitId}/work-performance`);
    
    console.log('[DEBUG] Work performance response received:', response.status);
    console.log('[DEBUG] Work performance success:', response.data.success);
    
    if (response.data.success && response.data.data) {
      console.log('[DEBUG] Work performance data structure:', Object.keys(response.data.data));
      workPerformanceData.value = response.data.data;
    } else {
      console.warn('[DEBUG] Failed to load work performance:', response.data.message);
    }
  } catch (err) {
    console.error('[DEBUG] Error fetching work performance:', err);
    // Don't fail the entire page for this data
  }
};

// Watch for route changes to reload data
watch(() => route.params.visitId, (newVisitId) => {
  if (newVisitId && newVisitId !== visitId) {
    console.log('[DEBUG] Route visitId changed, fetching new data:', newVisitId);
    fetchVisitData();
  }
});

// Initialize data
onMounted(() => {
  console.log('[DEBUG] VisitView mounted, fetching initial data for visit:', visitId);
  fetchVisitData();
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
    
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="flex flex-col items-center">
        <i class="pi pi-spin pi-spinner text-4xl text-primary mb-3"></i>
        <span class="text-lg">Loading visit data...</span>
      </div>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
      <div class="flex items-start">
        <i class="pi pi-exclamation-triangle text-red-500 mr-3 mt-0.5"></i>
        <div>
          <h3 class="text-lg font-semibold mb-1">Error Loading Visit</h3>
          <p>{{ error }}</p>
          <Button 
            label="Try Again" 
            icon="pi pi-refresh" 
            severity="secondary" 
            class="mt-3"
            @click="fetchVisitData"
          />
        </div>
      </div>
    </div>
    
    <!-- Visit data -->
    <div v-else-if="visitData">
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
          <span class="font-medium">Work Summary:</span> {{ visitData.visit.workSummary || 'No work summary available' }}
        </div>
      </div>
      
      <!-- Visit Content Panels -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left Column -->
        <div class="flex flex-col gap-6">
          <!-- Technicians Panel -->
          <Panel class="shadow-sm">
            <template #header>
              <div class="flex items-center justify-between w-full">
                <span>Technicians</span>
              </div>
            </template>
            <template #togglericon="{ collapsed }">
              <i :class="[collapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up']"></i>
            </template>
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
              
              <div v-if="!visitData.technicians || visitData.technicians.length === 0" class="py-4 text-center text-gray-500">
                No technicians assigned
              </div>
            </template>
          </Panel>
          
          <!-- Tasks Panel -->
          <Panel class="shadow-sm">
            <template #header>
              <div class="flex items-center justify-between w-full">
                <span>Tasks Performed</span>
              </div>
            </template>
            <template #togglericon="{ collapsed }">
              <i :class="[collapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up']"></i>
            </template>
            <template #default>
              <ul class="list-disc pl-5 space-y-2">
                <li v-for="(task, index) in visitData.tasks" :key="index" class="text-gray-700 dark:text-gray-300">
                  {{ task }}
                </li>
              </ul>
              
              <div v-if="!visitData.tasks || visitData.tasks.length === 0" class="py-4 text-center text-gray-500">
                No tasks recorded
              </div>
            </template>
          </Panel>
          
          <!-- Materials Panel -->
          <Panel class="shadow-sm">
            <template #header>
              <div class="flex items-center justify-between w-full">
                <span>Materials Used</span>
              </div>
            </template>
            <template #togglericon="{ collapsed }">
              <i :class="[collapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up']"></i>
            </template>
            <template #default>
              <DataTable 
                :value="materialsData" 
                responsiveLayout="scroll"
                class="p-datatable-sm"
              >
                <Column field="id" header="ID" style="width: 25%"></Column>
                <Column field="name" header="Material" style="width: 50%"></Column>
                <Column field="quantity" header="Qty" style="width: 25%"></Column>
              </DataTable>
              
              <div v-if="materialsData.length === 0" class="py-4 text-center text-gray-500">
                No materials used
              </div>
            </template>
          </Panel>
        </div>
        
        <!-- Right Column -->
        <div class="flex flex-col gap-6">
          <!-- Issues Panel -->
          <Panel class="shadow-sm">
            <template #header>
              <div class="flex items-center justify-between w-full">
                <span>Visit Issues</span>
              </div>
            </template>
            <template #togglericon="{ collapsed }">
              <i :class="[collapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up']"></i>
            </template>
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
                  <div v-if="issue.resolutionAttempts && issue.resolutionAttempts.length > 0">
                    <div v-for="(attempt, index) in issue.resolutionAttempts" :key="index" class="text-sm mt-1 border-l-2 border-blue-500 pl-2">
                      <p class="mb-1">{{ attempt.attemptDescription }}</p>
                      <p class="text-xs text-gray-600 dark:text-gray-400">
                        Outcome: <span class="font-medium">{{ attempt.outcome }}</span>
                      </p>
                    </div>
                  </div>
                  <div v-else class="text-sm text-gray-500 mt-1 italic">
                    No resolution attempts recorded
                  </div>
                </div>
              </div>
              
              <div v-if="!visitData.issues || visitData.issues.length === 0" class="py-4 text-center text-gray-500">
                No issues recorded
              </div>
            </template>
          </Panel>
          
          <!-- Timeline Panel -->
          <Panel class="shadow-sm">
            <template #header>
              <div class="flex items-center justify-between w-full">
                <span>Timeline Events</span>
              </div>
            </template>
            <template #togglericon="{ collapsed }">
              <i :class="[collapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up']"></i>
            </template>
            <template #default>
              <Timeline :value="formattedTimelineData" layout="vertical" class="w-full">
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
              
              <div v-if="!timelineData.value || timelineData.value.length === 0" class="py-4 text-center text-gray-500">
                No timeline events recorded
              </div>
            </template>
          </Panel>
          
          <!-- Key Interactions Panel -->
          <Panel class="shadow-sm">
            <template #header>
              <div class="flex items-center justify-between w-full">
                <span>Key Interactions</span>
              </div>
            </template>
            <template #togglericon="{ collapsed }">
              <i :class="[collapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up']"></i>
            </template>
            <template #default>
              <div v-for="(interaction, index) in keyInteractionsData" :key="index" class="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0 last:mb-0">
                <div class="font-semibold mb-1">{{ interaction.interactionType }}</div>
                <div class="text-sm text-gray-700 dark:text-gray-300">{{ interaction.details }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <span class="font-medium">Impact:</span> {{ interaction.impact }}
                </div>
              </div>
              
              <div v-if="keyInteractionsData.length === 0" class="py-4 text-center text-gray-500">
                No key interactions recorded
              </div>
            </template>
          </Panel>
        </div>
      </div>
    </div>
    
    <!-- No data state -->
    <div v-else class="bg-white dark:bg-surface-900 p-8 rounded-lg shadow text-center">
      <i class="pi pi-exclamation-circle text-4xl text-gray-400 mb-4"></i>
      <h2 class="text-xl font-semibold mb-2">Visit Data Not Available</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-4">The requested visit could not be found or there was an error loading the data.</p>
      <div class="flex justify-center">
        <Button label="Go Back" icon="pi pi-arrow-left" @click="router.back()" />
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
        <Button label="Submit" icon="pi pi-check" @click="submitResolution" :loading="loading" :disabled="!resolutionText || !resolutionStatus" />
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