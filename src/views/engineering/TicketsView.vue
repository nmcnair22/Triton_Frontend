<template>
    <Toast position="bottom-center" />
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <h5>Engineering Tickets</h5>
                
                <!-- Filters Section -->
                <div class="mb-4 p-2" style="display: flex; align-items: center; gap: 2rem;">
                    <!-- Status Filter -->
                    <div style="width: 25%;">
                        <Select 
                            v-model="selectedStatus" 
                            :options="statusOptions" 
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Filter by Status"
                            showClear
                            @change="onStatusFilterChange"
                            class="w-full" 
                        />
                    </div>
                    
                    <!-- Priority Filter -->
                    <div style="width: 25%;">
                        <Select 
                            v-model="selectedPriority" 
                            :options="priorityOptions" 
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Filter by Priority"
                            showClear
                            @change="onPriorityFilterChange"
                            class="w-full" 
                        />
                    </div>
                    
                    <!-- Owner Filter -->
                    <div style="width: 25%;">
                        <Select 
                            v-model="selectedOwner" 
                            :options="ownerOptions" 
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Filter by Owner"
                            showClear
                            @change="onOwnerFilterChange"
                            class="w-full" 
                        />
                    </div>
                    
                    <!-- Search -->
                    <div style="width: 25%;">
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText 
                                v-model="searchTerm" 
                                placeholder="Search tickets..." 
                                @input="onSearchChange"
                                class="w-full" 
                            />
                        </IconField>
                    </div>
                </div>
                
                <!-- Engineering Tickets Table -->
                <div class="card p-4 mb-4">
                    <DataTable 
                        v-model:expandedRows="expandedRows"
                        :value="filteredTickets" 
                        :loading="isLoading" 
                        :paginator="true" 
                        :rows="25" 
                        :totalRecords="pagination.total"
                        :rowsPerPageOptions="[10, 25, 50, 100]"
                        paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} tickets"
                        :rowClass="getRowClass"
                        dataKey="id"
                        stripedRows
                        :rowHover="true"
                        :metaKeySelection="false"
                        @row-expand="onRowExpand"
                        @row-collapse="onRowCollapse"
                        tableStyle="min-width: 50rem">
                        
                        <template #header>
                            <div class="flex justify-between">
                                <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined @click="clearAllFilters" />
                                <div class="flex gap-2">
                                    <Button icon="pi pi-plus" label="Expand All" text @click="expandAll" />
                                    <Button icon="pi pi-minus" label="Collapse All" text @click="collapseAll" />
                                    <Button icon="pi pi-refresh" @click="refreshData" :loading="isLoading" />
                                </div>
                            </div>
                        </template>
                        
                        <template #empty>
                            <div class="flex flex-column align-items-center p-5">
                                <i class="pi pi-inbox text-5xl text-primary mb-3"></i>
                                <span class="text-lg">No tickets found</span>
                                <span class="text-sm text-surface-600 dark:text-surface-400 mt-2">
                                    Try adjusting your filters or refresh the data
                                </span>
                            </div>
                        </template>
                        
                        <template #loading>
                            Loading engineering tickets...
                        </template>
                        
                        <!-- Expansion Column -->
                        <Column expander style="width: 3rem" />
                        
                        <!-- Ticket ID Column -->
                        <Column field="ticket_id" header="Ticket ID" style="min-width: 8rem" sortable>
                            <template #body="slotProps">
                                <span class="font-medium text-primary-600 dark:text-primary-400 cursor-pointer hover:text-primary-700 dark:hover:text-primary-300 hover:underline"
                                      @click="viewTicketDetails(slotProps.data)">
                                    #{{ slotProps.data.ticket_id }}
                                </span>
                            </template>
                        </Column>
                        
                        <!-- Subject Column -->
                        <Column field="subject" header="Subject" style="min-width: 20rem" sortable>
                            <template #body="slotProps">
                                <div class="max-w-xs truncate" :title="slotProps.data.subject">
                                    {{ slotProps.data.subject }}
                                </div>
                            </template>
                        </Column>
                        
                        <!-- Customer Column -->
                        <Column field="customer_name" header="Customer" style="min-width: 12rem" sortable>
                            <template #body="slotProps">
                                <span v-if="slotProps.data.customer_name && slotProps.data.customer_name !== 'Unassigned'">
                                    {{ slotProps.data.customer_name }}
                                </span>
                                <span v-else class="text-yellow-600 font-medium">Unassigned</span>
                            </template>
                        </Column>
                        
                        <!-- Status Column -->
                        <Column field="status" header="Status" style="min-width: 8rem" sortable>
                            <template #body="slotProps">
                                <Tag 
                                    :value="slotProps.data.status" 
                                    :severity="getStatusSeverity(slotProps.data.status)" 
                                />
                            </template>
                        </Column>
                        
                        <!-- Priority Column -->
                        <Column field="priority" header="Priority" style="min-width: 8rem" sortable>
                            <template #body="slotProps">
                                <Tag 
                                    :value="slotProps.data.priority" 
                                    :severity="getPrioritySeverity(slotProps.data.priority)" 
                                />
                            </template>
                        </Column>
                        
                        <!-- Owner Column -->
                        <Column field="owner" header="Owner" style="min-width: 10rem" sortable>
                            <template #body="slotProps">
                                <span :class="{'text-surface-400 dark:text-surface-500': !slotProps.data.owner}">
                                    {{ slotProps.data.owner || 'Unassigned' }}
                                </span>
                            </template>
                        </Column>
                        
                        <!-- Due Date Column -->
                        <Column field="dates.due_date" header="Due Date" style="min-width: 10rem" sortable>
                            <template #body="slotProps">
                                <span v-if="slotProps.data.dates?.due_date" :class="formatDueDate(slotProps.data.dates.due_date, slotProps.data.status).class">
                                    {{ formatDueDate(slotProps.data.dates.due_date, slotProps.data.status).message }}
                                </span>
                                <span v-else class="text-surface-400 dark:text-surface-500">No due date</span>
                            </template>
                        </Column>
                        
                        <!-- Age (Days) Column -->
                        <Column field="dates.created_at" header="Age (Days)" style="min-width: 8rem" sortable>
                            <template #body="slotProps">
                                <span :class="getAgeClass(calculateAgeInDays(slotProps.data.dates?.created_at))">
                                    {{ calculateAgeInDays(slotProps.data.dates?.created_at) }}
                                </span>
                            </template>
                        </Column>
                        
                        <!-- Last Updated (Days) Column -->
                        <Column field="dates.updated_at" header="Last Updated (Days)" style="min-width: 8rem" sortable>
                            <template #body="slotProps">
                                <span :class="getAgeClass(calculateAgeInDays(slotProps.data.dates?.updated_at))">
                                    {{ calculateAgeInDays(slotProps.data.dates?.updated_at) }}
                                </span>
                            </template>
                        </Column>
                        
                        <!-- Expansion Template -->
                        <template #expansion="slotProps">
                            <div class="p-4">
                                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <!-- Ticket Details -->
                                    <div class="space-y-3">
                                        <h6 class="text-surface-900 dark:text-surface-0 font-semibold mb-3">Ticket Details</h6>
                                        <div class="space-y-2 text-sm">
                                            <div class="flex justify-between">
                                                <span class="text-surface-600 dark:text-surface-400">Ticket Mask:</span>
                                                <span class="font-medium">{{ slotProps.data.ticket_mask_id }}</span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-surface-600 dark:text-surface-400">Department:</span>
                                                <span class="font-medium">{{ slotProps.data.department || 'N/A' }}</span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-surface-600 dark:text-surface-400">Type:</span>
                                                <span class="font-medium">{{ slotProps.data.ticket_type || 'N/A' }}</span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-surface-600 dark:text-surface-400">Creator:</span>
                                                <span class="font-medium">{{ formatCreatorName(slotProps.data.creator) }}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Dates & Timeline -->
                                    <div class="space-y-3">
                                        <h6 class="text-surface-900 dark:text-surface-0 font-semibold mb-3">Timeline</h6>
                                        <div class="space-y-2 text-sm">
                                            <div class="flex justify-between">
                                                <span class="text-surface-600 dark:text-surface-400">Created:</span>
                                                <span class="font-medium">{{ formatDate(slotProps.data.dates?.created_at) }}</span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-surface-600 dark:text-surface-400">Updated:</span>
                                                <span class="font-medium">{{ formatDate(slotProps.data.dates?.updated_at) }}</span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-surface-600 dark:text-surface-400">Due Date:</span>
                                                <span class="font-medium" :class="getDueDateClass(slotProps.data.dates?.due_date, slotProps.data.sla?.is_overdue)">
                                                    {{ slotProps.data.dates?.due_date ? formatDate(slotProps.data.dates.due_date) : 'Not Set' }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- SLA & Metrics -->
                                    <div class="space-y-3">
                                        <h6 class="text-surface-900 dark:text-surface-0 font-semibold mb-3">SLA & Metrics</h6>
                                        <div class="space-y-2 text-sm">
                                            <div class="flex justify-between">
                                                <span class="text-surface-600 dark:text-surface-400">SLA Status:</span>
                                                <Tag :value="slotProps.data.sla?.is_overdue ? 'Overdue' : 'On Track'" 
                                                     :severity="slotProps.data.sla?.is_overdue ? 'danger' : 'success'" />
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-surface-600 dark:text-surface-400">Reply Count:</span>
                                                <span class="font-medium">{{ slotProps.data.counts?.replies || 0 }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Action Buttons -->
                                <div class="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700 flex gap-2">
                                    <Button icon="pi pi-eye" label="View Details" size="small" @click="viewTicketDetails(slotProps.data)" />
                                </div>
                            </div>
                        </template>
                    </DataTable>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useEngineeringStore } from '@/stores/engineeringStore';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { formatDate, formatDueDate, calculateAgeInDays } from '@/lib/utils';

// PrimeVue Components
import Toast from 'primevue/toast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import DatePicker from 'primevue/datepicker';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';

// Composables
const engineeringStore = useEngineeringStore();
const router = useRouter();
const toast = useToast();

// Reactive data
const tickets = computed(() => engineeringStore.tickets);
const isLoading = computed(() => engineeringStore.loading);
const pagination = computed(() => engineeringStore.pagination);
const expandedRows = ref({});

// Filter states
const selectedStatus = ref(null);
const selectedPriority = ref(null);
const selectedOwner = ref(null);
const searchTerm = ref('');

// Filter options
const statusOptions = ref([
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Pending', value: 'pending' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' }
]);

const priorityOptions = ref([
  { label: 'Low', value: 'Low' },
  { label: 'Medium', value: 'Medium' },
  { label: 'High', value: 'High' },
  { label: 'Critical', value: 'Critical' }
]);

const ownerOptions = computed(() => {
  const owners = [...new Set(tickets.value.map(ticket => ticket.owner).filter(Boolean))];
  return owners.map(owner => ({ label: owner, value: owner }));
});

// Computed filtered tickets
const filteredTickets = computed(() => {
  let filtered = [...tickets.value];
  
  // Apply status filter
  if (selectedStatus.value) {
    filtered = filtered.filter(ticket => ticket.status === selectedStatus.value);
  }
  
  // Apply priority filter
  if (selectedPriority.value) {
    filtered = filtered.filter(ticket => ticket.priority === selectedPriority.value);
  }
  
  // Apply owner filter
  if (selectedOwner.value) {
    filtered = filtered.filter(ticket => ticket.owner === selectedOwner.value);
  }
  
  // Apply search filter
  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase();
    filtered = filtered.filter(ticket => 
      ticket.subject?.toLowerCase().includes(search) ||
      ticket.ticket_id?.toString().includes(search) ||
      ticket.customer_name?.toLowerCase().includes(search) ||
      ticket.owner?.toLowerCase().includes(search)
    );
  }
  
  return filtered;
});

// Load tickets on component mount
onMounted(async () => {
  await loadTickets();
});

// Methods
async function loadTickets() {
  try {
    await engineeringStore.fetchTickets();
  } catch (error) {
    console.error('Error loading tickets:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load tickets',
      life: 3000
    });
  }
}

async function refreshData() {
  await loadTickets();
  toast.add({
    severity: 'success',
    summary: 'Refreshed',
    detail: 'Ticket data has been refreshed',
    life: 2000
  });
}

// Function to determine row class based on ticket conditions
function getRowClass(data) {
  // Check for overdue status (highest priority)
  if (data.sla?.is_overdue || (data.dates?.due_date && new Date(data.dates.due_date) < new Date())) {
    return 'overdue-row';
  }
  
  // Check for high priority
  if (data.priority === 'High' || data.priority === 'Critical') {
    return 'high-priority-row';
  }
  
  // Check for missing customer assignment
  if (!data.customer_name || data.customer_name === 'Unassigned') {
    return 'unassigned-customer-row';
  }
  
  return '';
}

// Age-based color coding
function getAgeClass(ageInDays) {
  if (ageInDays > 14) {
    return 'age-old';
  } else if (ageInDays > 7) {
    return 'age-moderate';
  } else {
    return 'age-new';
  }
}

// Due date styling
function getDueDateClass(dueDate, isOverdue) {
  if (!dueDate) return 'text-surface-400';
  
  if (isOverdue) {
    return 'text-red-600 font-bold';
  }
  
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'text-red-600 font-bold'; // Overdue
  } else if (diffDays <= 1) {
    return 'text-orange-600 font-medium'; // Due today or tomorrow
  } else if (diffDays <= 3) {
    return 'text-yellow-600 font-medium'; // Due within 3 days
  } else {
    return 'text-surface-700 dark:text-surface-300'; // Normal
  }
}

// Status severity mapping
function getStatusSeverity(status) {
  const severityMap = {
    'open': 'info',
    'in_progress': 'primary',
    'pending': 'warning',
    'resolved': 'success',
    'closed': 'secondary'
  };
  return severityMap[status?.toLowerCase()] || 'info';
}

// Priority severity mapping
function getPrioritySeverity(priority) {
  const severityMap = {
    'low': 'success',
    'medium': 'info',
    'high': 'warning',
    'critical': 'danger'
  };
  return severityMap[priority?.toLowerCase()] || 'info';
}

// Expansion functionality
function expandAll() {
  const expanded = {};
  filteredTickets.value.forEach(ticket => {
    expanded[ticket.id] = true;
  });
  expandedRows.value = expanded;
}

function collapseAll() {
  expandedRows.value = {};
}

function onRowExpand(event) {
  console.log('Row expanded:', event.data);
}

function onRowCollapse(event) {
  console.log('Row collapsed:', event.data);
}

// Filter change handlers
function onStatusFilterChange() {
  // Filter change is handled by computed property
}

function onPriorityFilterChange() {
  // Filter change is handled by computed property
}

function onOwnerFilterChange() {
  // Filter change is handled by computed property
}

function onSearchChange() {
  // Search change is handled by computed property
}

function clearAllFilters() {
  selectedStatus.value = null;
  selectedPriority.value = null;
  selectedOwner.value = null;
  searchTerm.value = '';
  
  toast.add({
    severity: 'info',
    summary: 'Filters Cleared',
    detail: 'All filters have been cleared',
    life: 2000
  });
}

// Add a helper function to format creator name
function formatCreatorName(creator) {
  if (!creator) return 'N/A';
  
  // If it's already a string, return it
  if (typeof creator === 'string') {
    // Check if it's JSON string
    try {
      const parsed = JSON.parse(creator);
      return parsed.name || parsed.email || 'N/A';
    } catch (e) {
      // If not JSON, return as is
      return creator;
    }
  }
  
  // If it's an object, extract name or email
  if (typeof creator === 'object') {
    return creator.name || creator.email || 'N/A';
  }
  
  return 'N/A';
}

// Action handlers for expansion row buttons
function viewTicketDetails(ticket) {
  router.push(`/engineering/tickets/${ticket.ticket_id}`);
}
</script>

<style scoped>
/* Clean, minimal styling for professional appearance */
:deep(.p-datatable) {
  border: 1px solid var(--surface-border);
  border-radius: 6px;
}

:deep(.p-datatable .p-datatable-header) {
  background: var(--surface-50);
  border-bottom: 1px solid var(--surface-border);
  padding: 1rem;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: var(--surface-50);
  color: var(--text-color);
  font-weight: 600;
  padding: 0.75rem;
  border-bottom: 1px solid var(--surface-border);
}

:deep(.p-datatable .p-datatable-tbody > tr) {
  background: var(--surface-0);
  transition: background-color 0.2s;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: var(--surface-50);
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.75rem;
  border-bottom: 1px solid var(--surface-border);
}

/* Row highlighting for different states */
:deep(.p-datatable .p-datatable-tbody > tr.overdue-row) {
  background: #fef2f2;
  border-left: 3px solid #ef4444;
}

:deep(.p-datatable .p-datatable-tbody > tr.overdue-row:hover) {
  background: #fecaca;
}

:deep(.p-datatable .p-datatable-tbody > tr.high-priority-row) {
  background: #fef3c7;
  border-left: 3px solid #f59e0b;
}

:deep(.p-datatable .p-datatable-tbody > tr.high-priority-row:hover) {
  background: #fde68a;
}

:deep(.p-datatable .p-datatable-tbody > tr.unassigned-customer-row) {
  background: #f3f4f6;
  border-left: 3px solid #6b7280;
}

:deep(.p-datatable .p-datatable-tbody > tr.unassigned-customer-row:hover) {
  background: #e5e7eb;
}

/* Dark theme adjustments */
:deep(.p-datatable.p-component.p-datatable-dark .p-datatable-tbody > tr.overdue-row) {
  background: rgba(239, 68, 68, 0.1);
  border-left: 3px solid #ef4444;
}

:deep(.p-datatable.p-component.p-datatable-dark .p-datatable-tbody > tr.high-priority-row) {
  background: rgba(245, 158, 11, 0.1);
  border-left: 3px solid #f59e0b;
}

:deep(.p-datatable.p-component.p-datatable-dark .p-datatable-tbody > tr.unassigned-customer-row) {
  background: rgba(107, 114, 128, 0.1);
  border-left: 3px solid #6b7280;
}

/* Expansion panel styling */
:deep(.p-datatable .p-datatable-row-expansion) {
  background: var(--surface-50);
  border-top: 1px solid var(--surface-border);
}

/* Clean tag styling */
:deep(.p-tag) {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
}

/* Age indicators */
.age-new {
  color: #10b981;
  font-weight: 500;
}

.age-moderate {
  color: #f59e0b;
  font-weight: 500;
}

.age-old {
  color: #ef4444;
  font-weight: 500;
}

/* Due date styling */
.due-overdue {
  color: #ef4444;
  font-weight: 600;
}

.due-soon {
  color: #f59e0b;
  font-weight: 500;
}

.due-normal {
  color: var(--text-color);
}
</style> 