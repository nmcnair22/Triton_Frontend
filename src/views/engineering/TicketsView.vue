<template>
    <Toast position="bottom-center" />
    <div class="grid">
        <div class="col-12">
            <div class="space-y-6">
                <!-- Modern Filters Section -->
                <div class="mb-6 p-4 bg-surface-50 dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-700">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <!-- Status Filter -->
                        <div class="flex flex-col">
                            <label class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Status</label>
                            <Select 
                                v-model="selectedStatus" 
                                :options="statusOptions" 
                                optionLabel="label"
                                optionValue="value"
                                placeholder="All Statuses"
                                showClear
                                @change="onStatusFilterChange"
                                class="w-full" 
                            />
                        </div>
                        
                        <!-- Priority Filter -->
                        <div class="flex flex-col">
                            <label class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Priority</label>
                            <Select 
                                v-model="selectedPriority" 
                                :options="priorityOptions" 
                                optionLabel="label"
                                optionValue="value"
                                placeholder="All Priorities"
                                showClear
                                @change="onPriorityFilterChange"
                                class="w-full" 
                            />
                        </div>
                        
                        <!-- Owner Filter -->
                        <div class="flex flex-col">
                            <label class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Owner</label>
                            <Select 
                                v-model="selectedOwner" 
                                :options="ownerOptions" 
                                optionLabel="label"
                                optionValue="value"
                                placeholder="All Owners"
                                showClear
                                @change="onOwnerFilterChange"
                                class="w-full" 
                            />
                        </div>
                        
                        <!-- Search -->
                        <div class="flex flex-col">
                            <label class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Search</label>
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
                </div>
                
                <!-- Clean Engineering Tickets Table -->
                <div class="card">
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
                        :rowHover="true"
                        :metaKeySelection="false"
                        @row-expand="onRowExpand"
                        @row-collapse="onRowCollapse"
                        tableStyle="min-width: 50rem"
                        responsiveLayout="scroll">
                        
                        <template #header>
                            <div class="flex justify-between items-center">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-ticket text-lg text-surface-500"></i>
                                    <span class="font-semibold text-surface-900 dark:text-surface-0">Engineering Tickets</span>
                                    <span class="text-sm text-surface-500 ml-2">({{ filteredTickets.length }} total)</span>
                                </div>
                                <div class="flex gap-2">
                                    <Button icon="pi pi-filter-slash" label="Clear Filters" size="small" text @click="clearAllFilters" />
                                    <Button icon="pi pi-plus" size="small" text @click="expandAll" v-tooltip="'Expand All'" />
                                    <Button icon="pi pi-minus" size="small" text @click="collapseAll" v-tooltip="'Collapse All'" />
                                    <Button icon="pi pi-refresh" size="small" @click="refreshData" :loading="isLoading" v-tooltip="'Refresh Data'" />
                                </div>
                            </div>
                        </template>
                        
                        <template #empty>
                            <div class="flex flex-column align-items-center p-8">
                                <i class="pi pi-inbox text-4xl text-gray-300 mb-3"></i>
                                <span class="text-lg font-medium text-gray-700">No tickets found</span>
                                <span class="text-sm text-gray-500 mt-2">
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
                                <span class="ticket-id cursor-pointer hover:text-blue-600"
                                      @click="viewTicketDetails(slotProps.data)">
                                    #{{ slotProps.data.ticket_id }}
                                </span>
                            </template>
                        </Column>
                        
                        <!-- Subject Column -->
                        <Column field="subject" header="Subject" style="min-width: 20rem" sortable>
                            <template #body="slotProps">
                                <div class="subject-text max-w-xs truncate" :title="slotProps.data.subject">
                                    {{ slotProps.data.subject }}
                                </div>
                            </template>
                        </Column>
                        
                        <!-- Customer Column -->
                        <Column field="customer_name" header="Customer" style="min-width: 12rem" sortable>
                            <template #body="slotProps">
                                <span v-if="slotProps.data.customer_name && slotProps.data.customer_name !== 'Unassigned'" class="customer-name">
                                    {{ slotProps.data.customer_name }}
                                </span>
                                <span v-else class="text-amber-600 font-medium">Unassigned</span>
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
                                    :class="getPriorityClass(slotProps.data.priority)"
                                />
                            </template>
                        </Column>
                        
                        <!-- Owner Column -->
                        <Column field="owner" header="Owner" style="min-width: 10rem" sortable>
                            <template #body="slotProps">
                                <span class="owner-text" :class="{'text-gray-400': !slotProps.data.owner}">
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
                                <span v-else class="text-gray-400">No due date</span>
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

// Priority class mapping for custom styling
function getPriorityClass(priority) {
  const classMap = {
    'low': 'priority-low',
    'medium': 'priority-medium',
    'high': 'priority-high',
    'critical': 'priority-critical'
  };
  return classMap[priority?.toLowerCase()] || '';
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
/* ========================================
   ULTRA-CLEAN TABLE DESIGN
   Matching the reference table style
   ======================================== */

/* Main table container - ultra clean */
:deep(.p-datatable) {
  background: #ffffff;
  border: none;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Remove all table header background and styling */
:deep(.p-datatable .p-datatable-header) {
  background: transparent;
  border: none;
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  border-bottom: none;
}

/* Ultra-clean table headers */
:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: transparent;
  color: #4b5563;
  font-weight: 600;
  font-size: 0.875rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-bottom: 1px solid #e5e7eb;
  text-transform: none;
  letter-spacing: 0.025em;
}

/* Clean, spacious rows */
:deep(.p-datatable .p-datatable-tbody > tr) {
  background: #ffffff;
  border: none;
  transition: background-color 0.1s ease;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: #f3f4f6;
  transform: none;
  box-shadow: none;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 1rem 1.5rem;
  border: none;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: #1f2937;
  vertical-align: middle;
  font-weight: 500;
}

/* Remove all row state indicators for ultra-clean look */
:deep(.p-datatable .p-datatable-tbody > tr.overdue-row),
:deep(.p-datatable .p-datatable-tbody > tr.high-priority-row),
:deep(.p-datatable .p-datatable-tbody > tr.unassigned-customer-row) {
  background: #ffffff;
  border-left: none;
}

:deep(.p-datatable .p-datatable-tbody > tr.overdue-row:hover),
:deep(.p-datatable .p-datatable-tbody > tr.high-priority-row:hover),
:deep(.p-datatable .p-datatable-tbody > tr.unassigned-customer-row:hover) {
  background: #f9fafb;
  border-left: none;
}

/* Clean expansion panel */
:deep(.p-datatable .p-datatable-row-expansion) {
  background: #f9fafb;
  border: none;
  border-top: 1px solid #e5e7eb;
  padding: 1.5rem;
}

/* Minimal tag styling like reference */
:deep(.p-tag) {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  text-transform: capitalize;
  border: none;
}

/* Status-specific tag colors with distinct variations */
:deep(.p-tag.p-tag-info) {
  background: #dbeafe;
  color: #1e40af;
  font-weight: 600;
  border: 1px solid #93c5fd;
}

:deep(.p-tag.p-tag-primary) {
  background: #c7d2fe;
  color: #4338ca;
  font-weight: 600;
  border: 1px solid #a5b4fc;
}

:deep(.p-tag.p-tag-warning) {
  background: #fed7aa;
  color: #ea580c;
  font-weight: 600;
  border: 1px solid #fdba74;
}

:deep(.p-tag.p-tag-success) {
  background: #bbf7d0;
  color: #047857;
  font-weight: 600;
  border: 1px solid #86efac;
}

:deep(.p-tag.p-tag-secondary) {
  background: #e5e7eb;
  color: #374151;
  font-weight: 600;
  border: 1px solid #d1d5db;
}

:deep(.p-tag.p-tag-danger) {
  background: #fecaca;
  color: #dc2626;
  font-weight: 600;
  border: 1px solid #fca5a5;
}

/* Priority-specific tag colors for more variation */
:deep(.p-tag.priority-low) {
  background: #f0fdf4;
  color: #15803d;
  font-weight: 600;
  border: 1px solid #bbf7d0;
}

:deep(.p-tag.priority-medium) {
  background: #fef7cd;
  color: #a16207;
  font-weight: 600;
  border: 1px solid #fde68a;
}

:deep(.p-tag.priority-high) {
  background: #ffedd5;
  color: #c2410c;
  font-weight: 600;
  border: 1px solid #fed7aa;
}

:deep(.p-tag.priority-critical) {
  background: #fef2f2;
  color: #b91c1c;
  font-weight: 600;
  border: 1px solid #fecaca;
  animation: pulse-critical 2s infinite;
}

@keyframes pulse-critical {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(185, 28, 28, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(185, 28, 28, 0.1);
  }
}

/* Clean pagination */
:deep(.p-paginator) {
  background: transparent;
  border: none;
  padding: 1rem 1.5rem;
  border-top: 1px solid #f3f4f6;
}

:deep(.p-paginator .p-paginator-pages .p-paginator-page) {
  min-width: 2.25rem;
  height: 2.25rem;
  border-radius: 6px;
  border: none;
  margin: 0 0.125rem;
  font-size: 0.875rem;
}

/* Ultra-clean expander */
:deep(.p-datatable .p-row-toggler) {
  color: #9ca3af;
  background: transparent;
  border: none;
  border-radius: 4px;
  width: 1.75rem;
  height: 1.75rem;
  transition: all 0.1s ease;
}

:deep(.p-datatable .p-row-toggler:hover) {
  background: #f3f4f6;
  color: #6b7280;
}

/* Remove last row border */
:deep(.p-datatable .p-datatable-tbody > tr:last-child > td) {
  border-bottom: none;
}

/* Clean filter section */
.card {
  background: #ffffff;
  border: none;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* Minimal button styling */
:deep(.p-button.p-button-outlined) {
  border: 1px solid #e5e7eb;
  background: transparent;
  color: #6b7280;
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
}

:deep(.p-button.p-button-outlined:hover) {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #374151;
}

:deep(.p-button.p-button-text) {
  background: transparent;
  color: #6b7280;
  border: none;
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
}

:deep(.p-button.p-button-text:hover) {
  background: #f3f4f6;
  color: #374151;
}

/* Age indicators - better contrast */
.age-new {
  color: #059669;
  font-weight: 600;
}

.age-moderate {
  color: #d97706;
  font-weight: 600;
}

.age-old {
  color: #dc2626;
  font-weight: 600;
}

/* Due date styling - clean */
.due-overdue {
  color: #dc2626;
  font-weight: 600;
}

.due-soon {
  color: #d97706;
  font-weight: 600;
}

.due-normal {
  color: #4b5563;
  font-weight: 500;
}

/* Ticket ID styling like reference */
:deep(.p-datatable .p-datatable-tbody .ticket-id) {
  color: #1f2937;
  font-weight: 700;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
  font-size: 0.875rem;
}

/* Customer name styling */
:deep(.p-datatable .p-datatable-tbody .customer-name) {
  color: #1f2937;
  font-weight: 600;
}

/* Subject styling */
:deep(.p-datatable .p-datatable-tbody .subject-text) {
  color: #1f2937;
  font-weight: 500;
}

/* Owner styling */
:deep(.p-datatable .p-datatable-tbody .owner-text) {
  color: #4b5563;
  font-weight: 500;
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  :deep(.p-datatable) {
    background: #1f2937;
  }
  
  :deep(.p-datatable .p-datatable-tbody > tr) {
    background: #1f2937;
  }
  
  :deep(.p-datatable .p-datatable-tbody > tr:hover) {
    background: #374151;
  }
  
  :deep(.p-datatable .p-datatable-tbody > tr > td) {
    color: #e5e7eb;
    border-bottom: 1px solid #374151;
  }
  
  :deep(.p-datatable .p-datatable-thead > tr > th) {
    color: #9ca3af;
    border-bottom: 1px solid #374151;
  }
}
</style> 