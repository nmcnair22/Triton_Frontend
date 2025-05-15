<script setup>
import { ref, watch, computed, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from 'primevue/button';
import { useDispatchStore } from '@/stores/dispatchStore';
import TabPanel from 'primevue/tabpanel';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import Tag from 'primevue/tag';
import Drawer from 'primevue/drawer';
import { DispatchService } from '@/service/DispatchService';
import Timeline from 'primevue/timeline';
import Dialog from 'primevue/dialog';
import Accordion from 'primevue/accordion';
import AccordionTab from 'primevue/accordiontab';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Select from 'primevue/select';
import TabView from 'primevue/tabview';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ColumnGroup from 'primevue/columngroup';
import Row from 'primevue/row';
import { ApiService } from '@/service/ApiService';

// Router
const route = useRoute();
const router = useRouter();

// Store
const dispatchStore = useDispatchStore();

// Toast and Confirm services
const toast = useToast();
const confirm = useConfirm();

// Job parameters
const projectId = route.params.projectId;
const jobId = route.params.jobId;

// Component state
const activeTabIndex = ref(0);
const displayNotesDrawer = ref(false);

// Loading states
const loading = ref(true);
const error = ref(null);

// Job data states
const jobData = ref(null);
const visits = ref([]);
const financialRecords = ref([]);
const timelineEvents = ref([]);
const issues = ref([]);

// Job report dialog
const jobReportDialog = ref(false);
const showAnalysisDialog = ref(false);

// Selected financial record for displaying notes
const selectedFinancialRecord = ref(null);

// Calculate total receivable amount
function calculateTotalReceivable() {
  return financialRecords.value.reduce((sum, item) => sum + Number(item.financials?.Total_Receivable || 0), 0);
}

// Calculate total payable amount
function calculateTotalPayable() {
  return financialRecords.value.reduce((sum, item) => sum + Number(item.financials?.Total_Payable || 0), 0);
}

// Calculate profit (receivable - payable)
function calculateProfit() {
  return calculateTotalReceivable() - calculateTotalPayable();
}

// Calculate margin percentage
function calculateMargin() {
  const totalReceivable = calculateTotalReceivable();
  if (totalReceivable === 0) return 0;
  return Math.round((calculateProfit() / totalReceivable) * 100);
}

// Get severity for job line type
function getLineTypeSeverity(type) {
  const typeLower = (type || '').toLowerCase();
  if (typeLower.includes('billable')) return 'success';
  if (typeLower.includes('non-billable')) return 'warning';
  return 'info';
}

// Get CSS class for profit column based on value
function getItemProfitClass(item) {
  const profit = (item.financials?.Total_Receivable || 0) - (item.financials?.Total_Payable || 0);
  if (profit > 0) return 'text-green-600';
  if (profit < 0) return 'text-red-600';
  return 'text-gray-600';
}

// Format currency values
function formatCurrency(value) {
  return value > 0 
    ? '$' + value.toFixed(2)
    : value < 0 
      ? '-$' + Math.abs(value).toFixed(2)
      : '$0.00';
}

// Watch for tab index changes for debugging
watch(activeTabIndex, (newValue) => {
  console.log('Tab index changed to:', newValue);
});

// Job timeline events
const formattedTimelineEvents = computed(() => {
  if (!timelineEvents.value || timelineEvents.value.length === 0) return [];
  
  return timelineEvents.value.map(event => ({
    ...event,
    color: getStatusColor(event.status || 'unknown'),
    icon: getStatusIcon(event.event_type || event.status || 'unknown'),
  }));
});

// Navigation and UI functions
function goBack() {
  router.back();
}

function toggleNotesDrawer() {
  displayNotesDrawer.value = !displayNotesDrawer.value;
}

// Fetch job details
async function fetchJobDetails() {
  try {
    console.log('[DEBUG] JobDetailsView: Starting fetchJobDetails for job ID:', jobId);
    loading.value = true;
    error.value = null;
    
    // Use the dispatchStore to fetch job details
    console.log('[DEBUG] JobDetailsView: Calling dispatchStore.fetchJobDetails');
    await dispatchStore.fetchJobDetails(jobId);
    
    console.log('[DEBUG] JobDetailsView: dispatchStore.fetchJobDetails completed');
    console.log('[DEBUG] JobDetailsView: dispatchStore.error:', dispatchStore.error);
    console.log('[DEBUG] JobDetailsView: dispatchStore.loading:', dispatchStore.loading);
    
    if (dispatchStore.error) {
      console.error('[DEBUG] JobDetailsView: Error from store:', dispatchStore.error);
      throw new Error(dispatchStore.error);
    }
    
    jobData.value = transformJobData(dispatchStore.currentJob);
    console.log('[DEBUG] JobDetailsView: Job data transformed successfully');
    console.log('[DEBUG] JobDetailsView: Job data structure:', Object.keys(jobData.value));
    
    loading.value = false;
  } catch (err) {
    console.error('[DEBUG] JobDetailsView: Error in fetchJobDetails:', err);
    error.value = err.message || 'Failed to load job details';
    loading.value = false;
    
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.value,
      life: 3000,
    });
  }
}

// Transform job data from store to component format
function transformJobData(storeData) {
  console.log('[DEBUG] JobDetailsView: Transforming job data from store:', 
    storeData ? Object.keys(storeData) : 'no data');
  
  if (!storeData) {
    return {
      // Default empty data structure
      // ... existing mock data structure ...
    };
  }
  
  return {
    job: {
      jobId: storeData.job?.job_id || jobId,
      name: storeData.job?.name || `Job ${jobId}`,
      location: storeData.job?.location || '',
      status: storeData.job?.status || '',
      priority: storeData.job?.priority || 'Normal',
      startDate: storeData.job?.start_date || '',
      estimatedEndDate: storeData.job?.estimated_end_date || '',
      description: storeData.job?.description || '',
      assignedManager: storeData.job?.assigned_manager || '',
      projectId: storeData.job?.project_id || projectId
    },
    
    overview: {
      completionPercentage: storeData.job?.completion_percentage || 0,
      visitsCompleted: storeData.analysis?.visits_completed || 0,
      visitsScheduled: storeData.analysis?.visits_scheduled || 0,
      totalVisits: storeData.visits?.length || 0,
      daysElapsed: storeData.analysis?.days_elapsed || 0,
      daysRemaining: storeData.analysis?.days_remaining || 0,
      openIssues: storeData.analysis?.open_issues || 0,
      blockers: storeData.analysis?.blockers || 0
    },
    
    visits: storeData.visits || [],
    
    timeline: {
      events: (storeData.timeline?.events || []).map(event => ({
        date: event.timestamp || event.date,
        title: event.title || event.event_type,
        description: event.description || event.details,
        type: event.type || 'info'
      }))
    },
    
    issues: storeData.analysis?.key_issues || [],
    
    financials: {
      approved: storeData.financials?.approved_amount || 0,
      invoiced: storeData.financials?.invoiced_amount || 0,
      estimated: storeData.financials?.estimated_amount || 0,
      lineItems: storeData.financials?.line_items || []
    },
    
    documents: storeData.documents || [],
    
    notes: storeData.notes || []
  };
}

// Get severity for timeline events based on status or outcome
function getTimelineEventSeverity(event) {
  const eventText = (event.event || '').toLowerCase();
  
  if (eventText.includes('complete') || eventText.includes('success')) {
    return 'success';
  }
  if (eventText.includes('scheduled') || eventText.includes('assign')) {
    return 'info';
  }
  if (eventText.includes('issue') || eventText.includes('delay') || eventText.includes('problem')) {
    return 'warning';
  }
  if (eventText.includes('cancel') || eventText.includes('fail') || eventText.includes('error') || eventText.includes('unable')) {
    return 'danger';
  }
  
  return 'info';
}

// Format a date in the timeline format
function formatTimelineDate(dateString) {
  if (!dateString) return '';
  try {
    // Convert from "YYYY-MM-DD HH:MM:SS" to Date object
    const dateParts = dateString.split(' ');
    if (dateParts.length !== 2) return dateString;
    
    const date = new Date(dateParts[0] + 'T' + dateParts[1]);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    console.error('Error formatting timeline date:', e);
    return dateString;
  }
}

// Format date for display
function formatDate(date) {
  if (!date) return 'N/A';
  
  try {
    // Check if it's a timestamp or a date string
    const dateObj = typeof date === 'number' 
      ? new Date(date * 1000)  // Convert Unix timestamp to milliseconds
      : new Date(date);
      
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    console.error('Error formatting date:', e);
    return date.toString();
  }
}

// Get severity for an issue based on status
function getIssueSeverity(issue) {
  const status = (issue.status || '').toLowerCase();
  
  if (status === 'resolved') {
    return 'success';
  }
  if (status === 'in_progress' || status === 'pending') {
    return 'info';
  }
  if (status === 'unresolved') {
    return 'warning';
  }
  if (status === 'critical' || status === 'blocker') {
    return 'danger';
  }
  
  return 'info';
}

// Get severity for completion percentage
function getCompletionSeverity(percentage) {
  percentage = Number(percentage) || 0;
  
  if (percentage >= 90) {
    return 'success';
  }
  if (percentage >= 70) {
    return 'info';
  }
  if (percentage >= 40) {
    return 'warning';
  }
  return 'danger';
}

// Get color class for completion percentage bar
function getCompletionColorClass(percentage) {
  percentage = Number(percentage) || 0;
  
  if (percentage >= 90) {
    return 'bg-green-500';
  }
  if (percentage >= 70) {
    return 'bg-blue-500';
  }
  if (percentage >= 40) {
    return 'bg-orange-500';
  }
  return 'bg-red-500';
}

// Get status color based on status string
function getStatusColor(status) {
  if (!status) return 'var(--surface-500)';
  
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('complete') || statusLower.includes('success') || statusLower.includes('resolved')) {
    return 'var(--green-500)';
  }
  if (statusLower.includes('progress') || statusLower.includes('scheduled') || statusLower.includes('pending')) {
    return 'var(--blue-500)';
  }
  if (statusLower.includes('delay') || statusLower.includes('wait') || statusLower.includes('hold')) {
    return 'var(--orange-500)';
  }
  if (statusLower.includes('cancel') || statusLower.includes('fail') || statusLower.includes('error')) {
    return 'var(--red-500)';
  }
  
  return 'var(--surface-500)';
}

// Get status icon based on status string
function getStatusIcon(status) {
  if (!status) return 'pi pi-question-circle';
  
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('complete') || statusLower.includes('success') || statusLower.includes('resolved')) {
    return 'pi pi-check-circle';
  }
  if (statusLower.includes('progress')) {
    return 'pi pi-spinner';
  }
  if (statusLower.includes('scheduled') || statusLower.includes('pending')) {
    return 'pi pi-calendar';
  }
  if (statusLower.includes('delay') || statusLower.includes('wait') || statusLower.includes('hold')) {
    return 'pi pi-clock';
  }
  if (statusLower.includes('cancel') || statusLower.includes('fail') || statusLower.includes('error')) {
    return 'pi pi-times-circle';
  }
  
  return 'pi pi-question-circle';
}

// Toggle job report dialog
function toggleJobReportDialog() {
  jobReportDialog.value = !jobReportDialog.value;
}

// Initialize data on component mount
onMounted(() => {
  console.log('[DEBUG] JobDetailsView: Component mounted for job ID:', jobId);
  fetchJobDetails();
});

// Watch for route changes to reload data if jobId changes
watch(() => route.params.jobId, (newJobId) => {
  if (newJobId && newJobId !== jobId) {
    console.log('[DEBUG] JobDetailsView: Job ID changed in route, fetching new data:', newJobId);
    fetchJobDetails();
  }
});
</script>

<template>
  <div class="p-4">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center h-64">
      <span class="pi pi-spin pi-spinner text-4xl text-primary"></span>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
      <div class="flex items-start">
        <i class="pi pi-exclamation-triangle text-red-500 mr-3 mt-0.5"></i>
        <div>
          <h3 class="text-lg font-semibold mb-1">Error Loading Job Details</h3>
          <p>{{ error }}</p>
          <Button 
            label="Try Again" 
            icon="pi pi-refresh" 
            severity="secondary" 
            class="mt-3"
            @click="fetchJobDetails"
          />
        </div>
      </div>
    </div>
    
    <div v-else-if="jobData" class="dispatch-details">
      <!-- Header with job information and status -->
      <div class="flex flex-col gap-2 mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Button 
              icon="pi pi-arrow-left" 
              @click="goBack" 
              text 
              class="hover:bg-gray-100 mr-2 p-2 rounded-full"
            />
            <h1 class="text-2xl font-bold m-0">{{ jobData.customer_name || 'Unknown Customer' }} - {{ jobData.job_title || jobData.site_number || jobData.job_id }}</h1>
          </div>
          
          <div class="flex items-center gap-2">
            <Tag :value="jobData.status" :severity="getCompletionSeverity(jobData.completion_percentage)" class="px-3 py-1" />
            <Tag v-if="jobData.job_type" :value="jobData.job_type" severity="info" class="px-3 py-1" />
          </div>
        </div>
        
        <div class="text-gray-600">
          Job ID: {{ jobData.job_id }} | Project: {{ jobData.project_name || 'N/A' }}
        </div>
      </div>

      <!-- Tab navigation -->
      <Tabs v-model:activeIndex="activeTabIndex">
        <TabList>
          <Tab header="Overview">
            <template #content>
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Job Information Panel -->
                <div class="bg-white rounded-lg shadow border border-gray-200">
                  <div class="p-4 border-b border-gray-200 flex items-center">
                    <i class="pi pi-briefcase mr-2 text-blue-600"></i>
                    <h2 class="text-xl font-semibold">Job Information</h2>
                  </div>
                  
                  <div class="p-4">
                    <div class="grid grid-cols-2 gap-6">
                      <div>
                        <div class="text-gray-500 mb-1">Customer</div>
                        <div class="font-medium">{{ jobData.customer_name || 'N/A' }}</div>
                      </div>
                      
                      <div>
                        <div class="text-gray-500 mb-1">Site Number</div>
                        <div class="font-medium">{{ jobData.site_number || 'N/A' }}</div>
                      </div>
                      
                      <div>
                        <div class="text-gray-500 mb-1">Start Date</div>
                        <div class="font-medium">{{ formatDate(jobData.start_date) }}</div>
                      </div>
                      
                      <div>
                        <div class="text-gray-500 mb-1">End Date</div>
                        <div class="font-medium">{{ formatDate(jobData.end_date) }}</div>
                      </div>
                      
                      <div>
                        <div class="text-gray-500 mb-1">Scope of Work</div>
                        <div class="font-medium">{{ jobData.scope || 'N/A' }}</div>
                      </div>
                      
                      <div>
                        <div class="text-gray-500 mb-1">Project</div>
                        <div class="font-medium">{{ jobData.project_name || 'N/A' }}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Location Information Panel -->
                <div class="bg-white rounded-lg shadow border border-gray-200">
                  <div class="p-4 border-b border-gray-200 flex items-center">
                    <i class="pi pi-map-marker mr-2 text-red-600"></i>
                    <h2 class="text-xl font-semibold">Location Information</h2>
                  </div>
                  
                  <div class="p-4">
                    <div class="grid grid-cols-2 gap-6">
                      <div class="col-span-2">
                        <div class="text-gray-500 mb-1">Address</div>
                        <div class="font-medium">{{ jobData.address || 'N/A' }}</div>
                      </div>
                      
                      <div>
                        <div class="text-gray-500 mb-1">City/State</div>
                        <div class="font-medium">{{ jobData.city || 'N/A' }}, {{ jobData.state || 'N/A' }}</div>
                      </div>
                      
                      <div>
                        <div class="text-gray-500 mb-1">Zip Code</div>
                        <div class="font-medium">{{ jobData.zip_code || 'N/A' }}</div>
                      </div>
                      
                      <div class="col-span-2">
                        <div class="text-gray-500 mb-1">Contact</div>
                        <div class="font-medium">{{ jobData.contact_name || 'N/A' }} {{ jobData.contact_phone ? `(${jobData.contact_phone})` : '' }}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Job Progress Panel -->
                <div class="bg-white rounded-lg shadow border border-gray-200">
                  <div class="p-4 border-b border-gray-200 flex items-center">
                    <i class="pi pi-chart-line mr-2 text-green-600"></i>
                    <h2 class="text-xl font-semibold">Job Progress</h2>
                  </div>
                  
                  <div class="p-4">
                    <div class="grid grid-cols-2 gap-6">
                      <div class="col-span-2">
                        <div class="text-gray-500 mb-1">Completion</div>
                        <div class="w-full bg-gray-200 rounded-full h-4 mb-1">
                          <div 
                            :class="getCompletionColorClass(jobData.completion_percentage)" 
                            class="h-4 rounded-full" 
                            :style="{ width: `${jobData.completion_percentage || 0}%` }"
                          ></div>
                        </div>
                        <div class="text-sm">{{ jobData.completion_percentage || 0 }}% Complete</div>
                      </div>
                      
                      <div>
                        <div class="text-gray-500 mb-1">Status</div>
                        <div class="font-medium">
                          <Tag :value="jobData.status || 'Unknown'" :severity="getCompletionSeverity(jobData.completion_percentage)" />
                        </div>
                      </div>
                      
                      <div>
                        <div class="text-gray-500 mb-1">Total Visits</div>
                        <div class="font-medium">{{ visits.length }}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Quick Links Panel -->
                <div class="bg-white rounded-lg shadow border border-gray-200">
                  <div class="p-4 border-b border-gray-200 flex items-center">
                    <i class="pi pi-link mr-2 text-purple-600"></i>
                    <h2 class="text-xl font-semibold">Quick Actions</h2>
                  </div>
                  
                  <div class="p-4">
                    <div class="flex flex-col gap-3">
                      <Button 
                        label="View All Visits" 
                        icon="pi pi-calendar" 
                        class="p-button-outlined w-full justify-start" 
                        @click="activeTabIndex = 1" 
                      />
                      <Button 
                        label="Financial Information" 
                        icon="pi pi-dollar" 
                        class="p-button-outlined w-full justify-start" 
                        @click="activeTabIndex = 2" 
                      />
                      <Button 
                        label="Job Notes" 
                        icon="pi pi-file-edit" 
                        class="p-button-outlined w-full justify-start" 
                        @click="toggleNotesDrawer" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </Tab>
          
          <Tab header="Visits">
            <template #content>
              <div class="bg-white rounded-lg shadow border border-gray-200 p-4">
                <h2 class="text-xl font-semibold mb-4">Job Visits ({{ visits.length }})</h2>
                
                <div v-if="visits.length === 0" class="text-center py-8 text-gray-500">
                  No visits found for this job.
                </div>
                
                <div v-else class="space-y-4">
                  <div v-for="visit in visits" :key="visit.visitId" class="border border-gray-200 rounded-lg p-4">
                    <div class="flex flex-col md:flex-row justify-between gap-3">
                      <div class="flex-1">
                        <h3 class="text-lg font-semibold flex items-center gap-2">
                          <span>Visit {{ visit.chronological_rank || '?' }}</span>
                          <Tag :value="visit.status" :severity="getStatusSeverity(visit.status)" />
                        </h3>
                        <div class="text-gray-600 mt-1">{{ formatDate(visit.visitDate) }}</div>
                        <div class="mt-2">{{ visit.workSummary || 'No work summary available' }}</div>
                      </div>
                      
                      <div class="flex flex-col md:items-end gap-2">
                        <div class="text-sm text-gray-500">
                          Time on site: <span class="font-medium">{{ visit.timeOnSiteMin ? `${Math.floor(visit.timeOnSiteMin / 60)}h ${visit.timeOnSiteMin % 60}m` : 'N/A' }}</span>
                        </div>
                        
                        <Button 
                          label="View Details" 
                          icon="pi pi-arrow-right" 
                          size="small" 
                          @click="router.push(`/dashboard/projects/${projectId}/jobs/${jobId}/visits/${visit.visitId}`)" 
                        />
                      </div>
                    </div>
                    
                    <div v-if="visit.tasks && visit.tasks.length > 0" class="mt-3 pt-3 border-t border-gray-200">
                      <div class="text-sm font-medium text-gray-600 mb-1">Tasks:</div>
                      <div class="flex flex-wrap gap-2">
                        <Tag v-for="(task, index) in visit.tasks" :key="index" :value="task" severity="info" class="text-xs" />
                      </div>
                    </div>
                    
                    <div v-if="visit.issues && visit.issues.length > 0" class="mt-3 pt-3 border-t border-gray-200">
                      <div class="text-sm font-medium text-gray-600 mb-1">Issues:</div>
                      <div class="space-y-2">
                        <div v-for="issue in visit.issues" :key="issue.visitIssueId" class="text-sm flex items-start gap-2">
                          <Tag :value="issue.status" :severity="getIssueSeverity(issue)" class="text-xs whitespace-nowrap" />
                          <div>{{ issue.description }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </Tab>
          
          <Tab header="Financials">
            <template #content>
              <div class="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center">
                    <i class="pi pi-dollar-sign mr-2 text-green-600"></i>
                    <h2 class="text-xl font-semibold">Financial Information</h2>
                  </div>
                </div>

                <!-- Financial Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div class="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div class="text-sm text-blue-700 mb-1">Total Receivable</div>
                    <div class="text-2xl font-bold text-blue-800">${{ calculateTotalReceivable().toFixed(2) }}</div>
                  </div>
                  
                  <div class="bg-red-50 rounded-lg p-4 border border-red-100">
                    <div class="text-sm text-red-700 mb-1">Total Payable</div>
                    <div class="text-2xl font-bold text-red-800">${{ calculateTotalPayable().toFixed(2) }}</div>
                  </div>
                  
                  <div class="bg-green-50 rounded-lg p-4 border border-green-100">
                    <div class="text-sm text-green-700 mb-1">Profit</div>
                    <div class="text-2xl font-bold text-green-800">${{ calculateProfit().toFixed(2) }}</div>
                  </div>
                  
                  <div class="bg-purple-50 rounded-lg p-4 border border-purple-100">
                    <div class="text-sm text-purple-700 mb-1">Margin</div>
                    <div class="text-2xl font-bold text-purple-800">{{ calculateMargin() }}%</div>
                  </div>
                </div>

                <!-- Line Items DataTable -->
                <div v-if="financialRecords.length === 0" class="text-center py-8 text-gray-500">
                  No financial records found for this job.
                </div>
                
                <DataTable 
                  v-else
                  :value="financialRecords" 
                  stripedRows 
                  class="p-datatable-sm"
                  showGridlines
                  responsiveLayout="scroll"
                  @row-click="selectedFinancialRecord = $event.data"
                  selectionMode="single"
                  v-model:selection="selectedFinancialRecord"
                >
                  <Column field="details.id_item" header="Item"></Column>
                  <Column field="details.billing_desc" header="Description"></Column>
                  
                  <Column field="details.jobLineType" header="Type">
                    <template #body="slotProps">
                      <Tag 
                        v-if="slotProps.data.details.jobLineType" 
                        :value="slotProps.data.details.jobLineType" 
                        :severity="getLineTypeSeverity(slotProps.data.details.jobLineType)" 
                      />
                      <span v-else class="text-gray-500">-</span>
                    </template>
                  </Column>
                  
                  <Column field="details.invoiceNumber" header="Invoice">
                    <template #body="slotProps">
                      {{ slotProps.data.details.invoiceNumber || '-' }}
                    </template>
                  </Column>
                  
                  <Column field="details.vendorNumber" header="Vendor">
                    <template #body="slotProps">
                      {{ slotProps.data.details.vendorNumber || '-' }}
                    </template>
                  </Column>
                  
                  <Column field="financials.Total_Receivable" header="Receivable" style="min-width: 120px">
                    <template #body="slotProps">
                      <div class="text-right">
                        ${{ (slotProps.data.financials.Total_Receivable || 0).toFixed(2) }}
                      </div>
                    </template>
                  </Column>
                  
                  <Column field="financials.Total_Payable" header="Payable" style="min-width: 120px">
                    <template #body="slotProps">
                      <div class="text-right">
                        ${{ (slotProps.data.financials.Total_Payable || 0).toFixed(2) }}
                      </div>
                    </template>
                  </Column>
                  
                  <Column header="Profit" style="min-width: 120px">
                    <template #body="slotProps">
                      <div class="text-right">
                        <span :class="getItemProfitClass(slotProps.data)">
                          ${{ ((slotProps.data.financials.Total_Receivable || 0) - (slotProps.data.financials.Total_Payable || 0)).toFixed(2) }}
                        </span>
                      </div>
                    </template>
                  </Column>

                  <ColumnGroup type="footer">
                    <Row>
                      <Column footer="Totals:" :colspan="5" footerStyle="text-align:right" />
                      <Column :footer="formatCurrency(calculateTotalReceivable())" footerStyle="text-align:right; font-weight: 600;" />
                      <Column :footer="formatCurrency(calculateTotalPayable())" footerStyle="text-align:right; font-weight: 600;" />
                      <Column :footer="formatCurrency(calculateProfit())" :footerStyle="'text-align:right; font-weight: 600; color: ' + (calculateProfit() >= 0 ? 'var(--green-600)' : 'var(--red-600)')"/>
                    </Row>
                  </ColumnGroup>
                </DataTable>
                
                <!-- Notes Section -->
                <div v-if="selectedFinancialRecord" class="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 class="text-lg font-semibold mb-2">Notes</h3>
                  <div v-if="selectedFinancialRecord.notes.postFirst" class="mb-4">
                    <div class="text-xs text-gray-500">{{ selectedFinancialRecord.notes.postFirstDetails }}</div>
                    <div class="text-sm mt-1">{{ selectedFinancialRecord.notes.postFirst }}</div>
                  </div>
                  
                  <div v-if="selectedFinancialRecord.notes.postLast">
                    <div class="text-xs text-gray-500">{{ selectedFinancialRecord.notes.postLastDetails }}</div>
                    <div class="text-sm mt-1" v-html="selectedFinancialRecord.notes.postLast"></div>
                  </div>
                  
                  <div v-if="!selectedFinancialRecord.notes.postFirst && !selectedFinancialRecord.notes.postLast" class="text-center text-gray-500 py-2">
                    No notes available for this record.
                  </div>
                </div>
              </div>
            </template>
          </Tab>
          
          <Tab header="Timeline">
            <template #content>
              <div class="bg-white rounded-lg shadow border border-gray-200 p-4">
                <h2 class="text-xl font-semibold mb-4">Job Timeline</h2>
                
                <div v-if="timelineEvents.length === 0" class="text-center py-8 text-gray-500">
                  No timeline events found for this job.
                </div>
                
                <Timeline v-else :value="formattedTimelineEvents" layout="horizontal" align="top" class="w-full">
                  <template #content="slotProps">
                    <div class="flex flex-col gap-1">
                      <div class="font-bold text-sm">{{ slotProps.item.event_description || slotProps.item.event || 'Event' }}</div>
                      <div class="text-xs">{{ formatTimelineDate(slotProps.item.timestamp) }}</div>
                      <Tag 
                        :value="slotProps.item.status || slotProps.item.outcome || 'Event'" 
                        :severity="getTimelineEventSeverity(slotProps.item)" 
                        class="text-xs mt-1"
                      />
                    </div>
                  </template>
                  <template #opposite>
                    <span></span>
                  </template>
                  <template #marker="slotProps">
                    <span :class="slotProps.item.icon" :style="{ color: slotProps.item.color }" class="text-lg"></span>
                  </template>
                </Timeline>
                
                <div v-if="issues.length > 0" class="mt-8">
                  <h3 class="text-lg font-semibold mb-3">Key Issues</h3>
                  
                  <div class="space-y-4">
                    <div v-for="(issue, index) in issues" :key="index" class="border border-gray-200 rounded-lg p-4">
                      <div class="flex justify-between items-start">
                        <div>
                          <div class="flex items-center gap-2">
                            <Tag 
                              :value="issue.status || 'Open'" 
                              :severity="getIssueSeverity(issue)" 
                              class="text-xs"
                            />
                            <h4 class="text-md font-semibold">{{ issue.title || issue.description }}</h4>
                          </div>
                          
                          <p class="mt-2 text-sm">{{ issue.description }}</p>
                        </div>
                        
                        <div class="text-xs text-gray-500">
                          {{ issue.created_at ? formatDate(issue.created_at) : '' }}
                        </div>
                      </div>
                      
                      <div v-if="issue.resolution" class="mt-3 pt-3 border-t border-gray-200">
                        <div class="text-sm text-gray-600">
                          <span class="font-medium">Resolution:</span> {{ issue.resolution }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </Tab>
          
          <Tab header="Notes">
            <template #content>
              <div class="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div class="flex items-center justify-between mb-4">
                  <h2 class="text-xl font-semibold">Notes & Scope</h2>
                  <Button 
                    label="Edit Notes" 
                    icon="pi pi-pencil" 
                    outlined
                    @click="toggleNotesDrawer" 
                    size="small"
                    class="py-1 px-2"
                  />
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div>
                    <div class="text-gray-500 mb-1">Notes</div>
                    <div class="bg-gray-50 p-3 rounded-md min-h-[100px]">{{ jobData.notes || 'No notes available' }}</div>
                  </div>
                  
                  <div>
                    <div class="text-gray-500 mb-1">Scope</div>
                    <div class="bg-gray-50 p-3 rounded-md min-h-[100px]">{{ jobData.scope || 'No scope information available' }}</div>
                  </div>
                  
                  <div>
                    <div class="text-gray-500 mb-1">Additional Notes</div>
                    <div class="bg-gray-50 p-3 rounded-md min-h-[100px]">{{ jobData.additional_notes || 'No additional notes available' }}</div>
                  </div>
                  
                  <div>
                    <div class="text-gray-500 mb-1">Service Details</div>
                    <div class="bg-gray-50 p-3 rounded-md min-h-[100px]">{{ jobData.service_details || 'No service details available' }}</div>
                  </div>
                </div>
              </div>
            </template>
          </Tab>
        </TabList>
      </Tabs>
    </div>
    
    <!-- No data state -->
    <div v-else class="bg-white dark:bg-surface-900 p-8 rounded-lg shadow text-center">
      <i class="pi pi-exclamation-circle text-4xl text-gray-400 mb-4"></i>
      <h2 class="text-xl font-semibold mb-2">Job Details Not Available</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-4">The requested job could not be found or there was an error loading the data.</p>
      <div class="flex justify-center">
        <Button label="Go Back" icon="pi pi-arrow-left" @click="router.back()" />
      </div>
    </div>
    
    <!-- Notes Drawer -->
    <Drawer 
      v-model:visible="displayNotesDrawer" 
      position="right"
      class="bg-white dark:bg-surface-900 shadow-lg"
      style="max-width: 40rem; width: 100%"
    >
      <template #header>
        <div class="px-6 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
          <h2 class="text-xl font-bold text-surface-800 dark:text-white">Job Notes</h2>
        </div>
      </template>
      
      <div class="p-4 overflow-y-auto">
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-xs font-semibold text-surface-600">Notes</label>
            <textarea 
              class="p-inputtext w-full" 
              rows="4" 
              :value="jobData?.notes || ''"
              readonly
            ></textarea>
          </div>
          
          <div class="flex flex-col gap-2">
            <label class="text-xs font-semibold text-surface-600">Scope</label>
            <textarea 
              class="p-inputtext w-full" 
              rows="4" 
              :value="jobData?.scope || ''"
              readonly
            ></textarea>
          </div>
          
          <div class="flex flex-col gap-2">
            <label class="text-xs font-semibold text-surface-600">Service Details</label>
            <textarea 
              class="p-inputtext w-full" 
              rows="4" 
              :value="jobData?.service_details || ''"
              readonly
            ></textarea>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="p-4 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 flex justify-end">
          <Button 
            label="Close" 
            icon="pi pi-times" 
            @click="displayNotesDrawer = false"
            class="w-auto"
            outlined
          />
        </div>
      </template>
    </Drawer>
    
    <!-- Job Report Dialog -->
    <Dialog 
      v-model:visible="jobReportDialog" 
      header="Job Report" 
      modal 
      class="w-full max-w-4xl"
      :draggable="false"
    >
      <div class="flex flex-col gap-4 p-2">
        <div v-if="loading" class="flex items-center justify-center py-8">
          <span class="pi pi-spin pi-spinner text-3xl text-primary"></span>
        </div>
        
        <div v-else-if="error" class="bg-red-50 border border-red-200 rounded p-4 text-red-700">
          <h3 class="text-lg font-semibold mb-2">Error Loading Report</h3>
          <p>{{ error }}</p>
        </div>
        
        <div v-else-if="jobData" class="flex flex-col gap-6">
          <Accordion :activeIndex="0" class="w-full">
            <AccordionTab header="Job Summary">
              <div class="grid">
                <div class="col-12 md:col-6 p-2">
                  <div class="flex flex-col gap-2">
                    <label class="text-xs font-semibold text-surface-600">Customer</label>
                    <div class="p-inputtext w-full">{{ jobData.customer_name || 'N/A' }}</div>
                  </div>
                </div>
                
                <div class="col-12 md:col-6 p-2">
                  <div class="flex flex-col gap-2">
                    <label class="text-xs font-semibold text-surface-600">Total Visits</label>
                    <div class="p-inputtext w-full">{{ visits.length }}</div>
                  </div>
                </div>
                
                <div class="col-12 p-2">
                  <div class="flex flex-col gap-2">
                    <label class="text-xs font-semibold text-surface-600">Completion</label>
                    <div class="w-full bg-gray-200 rounded-full h-4 mb-1">
                      <div 
                        :class="getCompletionColorClass(jobData.completion_percentage)" 
                        class="h-4 rounded-full" 
                        :style="{ width: `${jobData.completion_percentage || 0}%` }"
                      ></div>
                    </div>
                    <div class="text-sm">{{ jobData.completion_percentage || 0 }}% Complete</div>
                  </div>
                </div>
                
                <div class="col-12 p-2">
                  <div class="flex flex-col gap-2">
                    <label class="text-xs font-semibold text-surface-600">Overall Job Summary</label>
                    <div class="p-inputtext w-full">{{ jobData.job_summary || 'No summary available' }}</div>
                  </div>
                </div>
              </div>
            </AccordionTab>
            
            <AccordionTab header="Timeline">
              <Timeline :value="formattedTimelineEvents" layout="horizontal" class="w-full">
                <template #content="slotProps">
                  <div class="flex flex-col gap-1">
                    <div class="font-bold">{{ slotProps.item.event_description || slotProps.item.event || 'Event' }}</div>
                    <div class="text-xs">{{ formatTimelineDate(slotProps.item.timestamp) }}</div>
                    <Tag :value="slotProps.item.status || slotProps.item.outcome || 'Event'" :severity="getTimelineEventSeverity(slotProps.item)" />
                  </div>
                </template>
                <template #opposite>
                  <span></span>
                </template>
                <template #marker="slotProps">
                  <span :class="slotProps.item.icon" :style="{ color: slotProps.item.color }"></span>
                </template>
              </Timeline>
            </AccordionTab>
            
            <AccordionTab header="Key Issues">
              <div class="flex flex-col gap-4">
                <div v-for="(issue, i) in issues" :key="i" class="border-b border-surface-200 pb-2">
                  <div class="flex items-center gap-2 mb-1">
                    <Tag :value="issue.status || 'Open'" :severity="getIssueSeverity(issue)" />
                    <span class="font-semibold">{{ issue.title || issue.description }}</span>
                  </div>
                  <p class="text-sm">{{ issue.description }}</p>
                </div>
                
                <div v-if="!issues.length" class="text-surface-600 italic">
                  No key issues identified
                </div>
              </div>
            </AccordionTab>
          </Accordion>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end">
          <Button label="Close" icon="pi pi-times" @click="jobReportDialog = false" outlined />
        </div>
      </template>
    </Dialog>
    
    <!-- Toast for notifications -->
    <Toast />
    
    <!-- Confirm Dialog for actions -->
    <ConfirmDialog />
  </div>
</template>

<style scoped>
/* Add your custom styles if needed */
.border-left-1 {
  border-left-width: 1px;
}
</style>
