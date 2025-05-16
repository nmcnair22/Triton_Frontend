<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useDispatchStore } from '@/stores/dispatchStore';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';

// Components
import Card from 'primevue/card';
import Button from 'primevue/button';
import Breadcrumb from 'primevue/breadcrumb';
import Tag from 'primevue/tag';
import Divider from 'primevue/divider';
import Timeline from 'primevue/timeline';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ProgressBar from 'primevue/progressbar';
import Accordion from 'primevue/accordion';
import AccordionTab from 'primevue/accordiontab';

// Refs and state
const router = useRouter();
const route = useRoute();
const toast = useToast();
const dispatchStore = useDispatchStore();
const { loading } = storeToRefs(dispatchStore);

// Local state
const visitId = computed(() => route.params.id);
const jobId = computed(() => route.params.jobId);
const projectId = computed(() => route.params.projectId);
const visit = ref(null);
const job = ref(null);
const timelineEvents = ref([]);
const issuesExpanded = ref(true);
const tasksExpanded = ref(true);
const materialsExpanded = ref(true);
const billingExpanded = ref(true);

// Breadcrumb items - dynamic based on navigation path
const breadcrumbItems = computed(() => {
  const items = [
    { label: 'Home', to: '/' }
  ];
  
  if (projectId.value && jobId.value) {
    // Coming from project hierarchy
    items.push(
      { label: 'Projects', to: '/dispatch/projects' },
      { label: 'Project Details', to: `/dispatch/projects/${projectId.value}` },
      { label: 'Job Details', to: `/dispatch/projects/${projectId.value}/jobs/${jobId.value}` }
    );
  } else if (jobId.value) {
    // Coming from jobs view
    items.push(
      { label: 'Jobs', to: '/dispatch/jobs' },
      { label: 'Job Details', to: `/dispatch/jobs/${jobId.value}` }
    );
  } else {
    // Coming from global activity
    items.push({ label: 'Global Activity', to: '/dispatch/global-activity' });
  }
  
  items.push({ label: 'Visit Details' });
  return items;
});

const breadcrumbHome = { icon: 'pi pi-home', to: '/' };

// Methods
function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  });
}

function formatTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDateTime(date) {
  if (!date) return '';
  return `${formatDate(date)} ${formatTime(date)}`;
}

function getStatusSeverity(status) {
  const statusMap = {
    'completed': 'success',
    'in_progress': 'info',
    'scheduled': 'warning',
    'delayed': 'warning',
    'cancelled': 'danger',
    'failed': 'danger',
    'revisit': 'info'
  };
  return statusMap[status.toLowerCase()] || 'secondary';
}

function getStatusIcon(status) {
  const iconMap = {
    'completed': 'pi-check-circle',
    'in_progress': 'pi-sync',
    'scheduled': 'pi-calendar',
    'delayed': 'pi-clock',
    'cancelled': 'pi-times-circle',
    'failed': 'pi-times',
    'revisit': 'pi-refresh'
  };
  return `pi ${iconMap[status.toLowerCase()] || 'pi-question'}`;
}

async function loadVisitDetails() {
  try {
    // Fetch visit details
    const visitResponse = await dispatchStore.fetchVisitById(visitId.value);
    visit.value = visitResponse;
    
    // Fetch job details if needed
    if (!job.value && visitResponse.job_id) {
      const jobResponse = await dispatchStore.fetchJobById(visitResponse.job_id);
      job.value = jobResponse;
    }
    
    // Create timeline events
    if (visit.value) {
      const events = [];
      
      // Add dispatch card events
      if (visit.value.dispatch_cards && visit.value.dispatch_cards.length > 0) {
        const dispatch = visit.value.dispatch_cards[0];
        
        if (dispatch.scheduled_at) {
          events.push({
            status: 'info',
            date: formatDateTime(dispatch.scheduled_at),
            icon: 'pi pi-calendar',
            color: '#2196F3',
            content: 'Scheduled',
            detail: `Visit scheduled for ${formatDate(dispatch.scheduled_at)}`
          });
        }
        
        if (dispatch.dispatched_at) {
          events.push({
            status: 'info',
            date: formatDateTime(dispatch.dispatched_at),
            icon: 'pi pi-send',
            color: '#9C27B0',
            content: 'Dispatched',
            detail: `Technician dispatched to site`
          });
        }
      }
      
      // Add turnup card events
      if (visit.value.turnup_cards && visit.value.turnup_cards.length > 0) {
        const turnup = visit.value.turnup_cards[0];
        
        if (turnup.arrived_at) {
          events.push({
            status: 'success',
            date: formatDateTime(turnup.arrived_at),
            icon: 'pi pi-map-marker',
            color: '#4CAF50',
            content: 'Arrived',
            detail: `Technician arrived on site`
          });
        }
        
        if (turnup.completed_at) {
          events.push({
            status: 'success',
            date: formatDateTime(turnup.completed_at),
            icon: 'pi pi-check-circle',
            color: '#4CAF50',
            content: 'Completed',
            detail: `Visit completed at ${formatTime(turnup.completed_at)}`
          });
        }
        
        if (turnup.cancelled_at) {
          events.push({
            status: 'danger',
            date: formatDateTime(turnup.cancelled_at),
            icon: 'pi pi-times-circle',
            color: '#F44336',
            content: 'Cancelled',
            detail: turnup.cancel_reason || 'Visit was cancelled'
          });
        }
      }
      
      // Sort events chronologically
      timelineEvents.value = events.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
  } catch (error) {
    console.error('Error loading visit details:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load visit details',
      life: 3000
    });
  }
}

// Load data on component mount
onMounted(() => {
  loadVisitDetails();
});
</script>

<template>
  <div class="p-4">
    <!-- Breadcrumb -->
    <div class="mb-4">
      <Breadcrumb :model="breadcrumbItems" :home="breadcrumbHome" />
    </div>
    
    <div v-if="visit">
      <!-- Header Card -->
      <Card class="mb-4">
        <template #title>
          <div class="flex justify-between">
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl font-bold">Visit #{{ visit.id }}</h1>
                <Tag 
                  :value="visit.status" 
                  :severity="getStatusSeverity(visit.status)"
                  :icon="getStatusIcon(visit.status)"
                  class="ml-2"
                />
                <Tag 
                  v-if="visit.is_revisit" 
                  value="Revisit" 
                  severity="info" 
                  icon="pi pi-refresh"
                />
              </div>
              <div class="text-gray-600 mt-1">
                <span v-if="job">{{ job.customer?.name }} &bull; {{ job.location?.name }}</span>
                <span v-if="visit.date"> &bull; {{ formatDate(visit.date) }}</span>
              </div>
            </div>
            
            <div class="flex gap-2">
              <Button icon="pi pi-pencil" label="Edit" class="p-button-outlined p-button-sm" />
              <Button icon="pi pi-clock" label="Reschedule" class="p-button-outlined p-button-sm" />
              <Button icon="pi pi-download" label="Export" class="p-button-outlined p-button-sm" />
            </div>
          </div>
        </template>
      </Card>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Left Column: Timeline -->
        <div class="lg:col-span-1">
          <!-- Timeline Card -->
          <Card class="mb-4">
            <template #title>
              <div class="flex justify-between items-center">
                <span>Visit Timeline</span>
              </div>
            </template>
            <template #content>
              <Timeline :value="timelineEvents" align="left" class="mt-3">
                <template #content="slotProps">
                  <div class="text-sm">
                    <div class="font-bold mb-1">{{ slotProps.item.content }}</div>
                    <div class="text-gray-600 mb-1">{{ slotProps.item.date }}</div>
                    <div>{{ slotProps.item.detail }}</div>
                  </div>
                </template>
                <template #opposite>
                  <!-- Empty opposite slot to keep alignment -->
                </template>
                <template #marker="slotProps">
                  <span :style="`color:${slotProps.item.color}`">
                    <i :class="['pi', slotProps.item.icon]"></i>
                  </span>
                </template>
              </Timeline>
            </template>
          </Card>
          
          <!-- Dispatch Card -->
          <Card class="mb-4" v-if="visit.dispatch_cards && visit.dispatch_cards.length > 0">
            <template #title>
              <div class="flex justify-between items-center">
                <span>Dispatch Information</span>
              </div>
            </template>
            <template #content>
              <div class="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <div class="text-xs text-gray-500">Scheduled Date</div>
                  <div>{{ formatDate(visit.dispatch_cards[0].scheduled_at) }}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-500">Scheduled Time</div>
                  <div>{{ formatTime(visit.dispatch_cards[0].scheduled_at) }}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-500">Technician</div>
                  <div>{{ visit.dispatch_cards[0].technician?.name || 'Not Assigned' }}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-500">Priority</div>
                  <div>{{ visit.dispatch_cards[0].priority || 'Normal' }}</div>
                </div>
              </div>
              
              <Divider />
              
              <div>
                <div class="text-xs text-gray-500 mb-1">Scope of Work</div>
                <div class="text-sm">
                  {{ visit.dispatch_cards[0].work_scope || 'No scope of work provided.' }}
                </div>
              </div>
            </template>
          </Card>
          
          <!-- Turn-Up Card -->
          <Card class="mb-4" v-if="visit.turnup_cards && visit.turnup_cards.length > 0">
            <template #title>
              <div class="flex justify-between items-center">
                <span>Turn-Up Card</span>
              </div>
            </template>
            <template #content>
              <div class="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <div class="text-xs text-gray-500">Start Time</div>
                  <div>{{ formatTime(visit.turnup_cards[0].arrived_at) }}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-500">End Time</div>
                  <div>{{ formatTime(visit.turnup_cards[0].completed_at) }}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-500">Duration</div>
                  <div>{{ visit.turnup_cards[0].duration || 'N/A' }}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-500">Performed By</div>
                  <div>{{ visit.turnup_cards[0].technician?.name || 'N/A' }}</div>
                </div>
              </div>
              
              <Divider />
              
              <div v-if="visit.turnup_cards[0].outcome">
                <div class="text-xs text-gray-500 mb-1">Outcome</div>
                <div class="text-sm">
                  {{ visit.turnup_cards[0].outcome }}
                </div>
              </div>
            </template>
          </Card>
        </div>
        
        <!-- Right Column: Details Tabs -->
        <div class="lg:col-span-2">
          <TabView>
            <!-- Issues Tab -->
            <TabPanel header="Issues" v-if="visit.issues_encountered && visit.issues_encountered.length > 0">
              <div class="p-2">
                <Accordion :multiple="true" :activeIndex="[0]">
                  <AccordionTab v-for="(issue, index) in visit.issues_encountered" :key="index">
                    <template #header>
                      <div class="flex items-center">
                        <i class="pi pi-exclamation-triangle mr-2" :class="{ 'text-red-500': issue.severity === 'high', 'text-yellow-500': issue.severity === 'medium', 'text-blue-500': issue.severity === 'low' }"></i>
                        <span>{{ issue.title }}</span>
                        <Tag 
                          :value="issue.status" 
                          :severity="issue.status === 'resolved' ? 'success' : issue.status === 'in_progress' ? 'info' : 'warning'"
                          class="ml-3"
                        />
                      </div>
                    </template>
                    <div>
                      <p class="mb-3">{{ issue.description }}</p>
                      
                      <div v-if="issue.resolution_attempts && issue.resolution_attempts.length > 0">
                        <h4 class="text-sm font-semibold mb-2">Resolution Attempts</h4>
                        <div 
                          v-for="(attempt, i) in issue.resolution_attempts" 
                          :key="i"
                          class="p-3 bg-gray-50 dark:bg-gray-800 mb-2 rounded"
                        >
                          <div class="text-sm text-gray-600 mb-1">
                            {{ formatDateTime(attempt.timestamp) }} by {{ attempt.technician?.name }}
                          </div>
                          <p>{{ attempt.description }}</p>
                        </div>
                      </div>
                      
                      <Button 
                        icon="pi pi-plus" 
                        label="Add Resolution" 
                        class="p-button-outlined p-button-sm mt-3"
                      />
                    </div>
                  </AccordionTab>
                </Accordion>
              </div>
            </TabPanel>
            
            <!-- Tasks Performed Tab -->
            <TabPanel header="Tasks Performed" v-if="visit.tasks_performed && visit.tasks_performed.length > 0">
              <DataTable :value="visit.tasks_performed" stripedRows class="p-datatable-sm">
                <Column field="name" header="Task Name"></Column>
                <Column field="category" header="Category"></Column>
                <Column field="completed" header="Completed">
                  <template #body="{ data }">
                    <i 
                      :class="data.completed ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'"
                    ></i>
                  </template>
                </Column>
                <Column field="notes" header="Notes"></Column>
              </DataTable>
            </TabPanel>
            
            <!-- Materials Used Tab -->
            <TabPanel header="Materials Used" v-if="visit.materials_used && visit.materials_used.length > 0">
              <DataTable :value="visit.materials_used" stripedRows class="p-datatable-sm">
                <Column field="item_code" header="Item Code"></Column>
                <Column field="description" header="Description"></Column>
                <Column field="quantity" header="Quantity"></Column>
                <Column field="unit" header="Unit"></Column>
              </DataTable>
            </TabPanel>
            
            <!-- Billing Tab -->
            <TabPanel header="Billing & Outcome" v-if="visit.billing_cards && visit.billing_cards.length > 0">
              <div class="p-2">
                <div class="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                  <div>
                    <div class="text-xs text-gray-500">Invoice Status</div>
                    <div>
                      <Tag 
                        :value="visit.billing_cards[0].invoice_status" 
                        :severity="visit.billing_cards[0].invoice_status === 'paid' ? 'success' : visit.billing_cards[0].invoice_status === 'invoiced' ? 'info' : 'warning'"
                      />
                    </div>
                  </div>
                  <div>
                    <div class="text-xs text-gray-500">Invoice Number</div>
                    <div>{{ visit.billing_cards[0].invoice_number || 'Not Invoiced' }}</div>
                  </div>
                  <div>
                    <div class="text-xs text-gray-500">Amount</div>
                    <div>{{ visit.billing_cards[0].amount ? `$${visit.billing_cards[0].amount.toFixed(2)}` : 'N/A' }}</div>
                  </div>
                  <div>
                    <div class="text-xs text-gray-500">Billing Date</div>
                    <div>{{ formatDate(visit.billing_cards[0].billing_date) }}</div>
                  </div>
                </div>
                
                <div v-if="visit.billing_cards[0].line_items && visit.billing_cards[0].line_items.length > 0">
                  <h4 class="text-sm font-semibold mb-2">Line Items</h4>
                  <DataTable :value="visit.billing_cards[0].line_items" stripedRows class="p-datatable-sm">
                    <Column field="description" header="Description"></Column>
                    <Column field="quantity" header="Qty"></Column>
                    <Column field="unit_price" header="Unit Price">
                      <template #body="{ data }">
                        {{ data.unit_price ? `$${data.unit_price.toFixed(2)}` : '' }}
                      </template>
                    </Column>
                    <Column field="total" header="Total">
                      <template #body="{ data }">
                        {{ data.total ? `$${data.total.toFixed(2)}` : '' }}
                      </template>
                    </Column>
                  </DataTable>
                </div>
                
                <Divider />
                
                <div>
                  <div class="text-xs text-gray-500 mb-1">Customer Signature</div>
                  <div>
                    <img 
                      v-if="visit.billing_cards[0].signature_url" 
                      :src="visit.billing_cards[0].signature_url" 
                      alt="Customer Signature" 
                      class="max-h-16"
                    />
                    <div v-else class="text-sm text-gray-600">No signature available</div>
                  </div>
                </div>
              </div>
            </TabPanel>
            
            <!-- Notes Tab -->
            <TabPanel header="Notes & Interactions">
              <div class="p-2">
                <div v-if="visit.key_interactions && visit.key_interactions.length > 0">
                  <div 
                    v-for="(interaction, index) in visit.key_interactions" 
                    :key="index"
                    class="p-3 bg-gray-50 dark:bg-gray-800 mb-3 rounded"
                  >
                    <div class="flex justify-between mb-1">
                      <div class="font-medium">{{ interaction.title }}</div>
                      <div class="text-sm text-gray-600">{{ formatDateTime(interaction.timestamp) }}</div>
                    </div>
                    <p>{{ interaction.description }}</p>
                    <div class="text-sm text-gray-600 mt-1">
                      {{ interaction.user?.name || 'System' }}
                    </div>
                  </div>
                </div>
                <div v-else class="text-center p-4 text-gray-500">
                  <p>No notes or interactions recorded</p>
                </div>
                
                <div class="mt-4">
                  <Button 
                    icon="pi pi-plus" 
                    label="Add Note" 
                    class="p-button-outlined"
                  />
                </div>
              </div>
            </TabPanel>
          </TabView>
        </div>
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-if="!visit && loading" class="flex justify-center items-center p-8">
      <i class="pi pi-spin pi-spinner text-4xl"></i>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-tabview-panels) {
  padding: 1rem 0;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: #f8f9fa;
  color: #495057;
}

:deep(.p-datatable.p-datatable-striped .p-datatable-tbody > tr.p-row-odd) {
  background: #fcfcfc;
}

:deep(.p-accordion .p-accordion-header:not(.p-disabled).p-highlight .p-accordion-header-link) {
  background: #f8f9fa;
  border-color: #e9ecef;
  color: #495057;
}

:deep(.p-accordion .p-accordion-header:not(.p-disabled) .p-accordion-header-link:focus) {
  box-shadow: none;
}

:deep(.dark .p-accordion .p-accordion-header:not(.p-disabled).p-highlight .p-accordion-header-link) {
  background: #2a2a3c;
  border-color: #1e1e2d;
  color: #e0e0e0;
}

:deep(.dark .p-tabview-panels) {
  background: #1e1e2d;
  color: #e0e0e0;
}
</style> 