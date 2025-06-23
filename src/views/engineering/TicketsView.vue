<template>
    <Toast position="bottom-center" />
    <div class="engineering-tickets">
        <!-- Responsive Header Section -->
        <div class="mb-4 md:mb-6">
            <!-- Title and Controls Row -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                    <h1 class="text-2xl md:text-3xl font-bold text-surface-900 dark:text-surface-0 mb-1">
                        Engineering Tickets
                    </h1>
                    <p class="text-sm md:text-base text-surface-600 dark:text-surface-400">
                        Manage and track engineering support tickets
                    </p>
                </div>
                
                <!-- Action Buttons - Responsive Layout -->
                <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button 
                        icon="pi pi-refresh" 
                        :label="isDesktop ? 'Refresh' : undefined"
                        :text="isMobile"
                        :outlined="!isMobile"
                        @click="refreshData" 
                        :disabled="isLoading"
                        :size="isMobile ? 'large' : 'default'"
                        class="w-full sm:w-auto"
                    />
                    <Button 
                        icon="pi pi-sync" 
                        :label="isDesktop ? 'Field Sync' : undefined"
                        severity="secondary"
                        :outlined="true"
                        @click="triggerFieldSync" 
                        :disabled="isLoading || isFieldSyncing"
                        :loading="isFieldSyncing"
                        :size="isMobile ? 'large' : 'default'"
                        class="w-full sm:w-auto"
                    />
                    <Button 
                        icon="pi pi-eye" 
                        :label="isDesktop ? 'Columns' : undefined"
                        severity="secondary"
                        :outlined="true"
                        @click="toggleColumnSelector" 
                        :size="isMobile ? 'large' : 'default'"
                        class="w-full sm:w-auto"
                    />
                    <Button 
                        icon="pi pi-plus" 
                        :label="isDesktop ? 'New Ticket' : undefined"
                        severity="primary"
                        :size="isMobile ? 'large' : 'default'"
                        class="w-full sm:w-auto"
                        @click="openNewTicketWindow"
                    />
                </div>
            </div>

            <!-- Search and Filter Controls -->
            <div class="flex flex-col lg:flex-row gap-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg border">
                <!-- Global Search -->
                <div class="flex-1 lg:max-w-md">
                    <IconField iconPosition="left" class="w-full">
                        <InputIcon class="pi pi-search" />
                        <InputText 
                            v-model="filters.global.value" 
                            placeholder="Search tickets..." 
                            class="w-full"
                            :size="isMobile ? 'large' : 'default'"
                        />
                    </IconField>
                </div>
                
                <!-- Show Closed Tickets Toggle -->
                <div class="flex items-center gap-3">
                    <Checkbox 
                        v-model="showClosedTickets" 
                        @change="onShowClosedChange"
                        inputId="showClosed" 
                    />
                    <label for="showClosed" class="text-sm font-medium select-none">
                        Show closed tickets
                    </label>
                </div>
                
                <!-- Quick Actions - Desktop Only -->
                <div v-if="isDesktop" class="flex gap-2">
                    <Button 
                        icon="pi pi-filter-slash" 
                        label="Clear Filters" 
                        text 
                        size="small"
                        @click="clearAllFilters" 
                    />
                    <Button 
                        icon="pi pi-expand" 
                        label="Expand All" 
                        text 
                        size="small"
                        @click="expandAll" 
                    />
                    <Button 
                        icon="pi pi-compress" 
                        label="Collapse All" 
                        text 
                        size="small"
                        @click="collapseAll" 
                    />
                </div>
            </div>
        </div>

        <!-- Mobile Quick Actions (when desktop actions are hidden) -->
        <div v-if="!isDesktop" class="flex flex-wrap gap-2 mb-4">
            <Button 
                icon="pi pi-filter-slash" 
                label="Clear" 
                text 
                size="small"
                @click="clearAllFilters" 
            />
            <Button 
                icon="pi pi-expand" 
                label="Expand" 
                text 
                size="small"
                @click="expandAll" 
            />
            <Button 
                icon="pi pi-compress" 
                label="Collapse" 
                text 
                size="small"
                @click="collapseAll" 
            />
        </div>

        <!-- Responsive DataTable -->
        <!-- Column Selector Overlay -->
        <OverlayPanel ref="columnSelectorPanel" appendTo="body" :showCloseIcon="true" class="w-80">
            <template #header>
                <div class="flex items-center gap-2">
                    <i class="pi pi-eye text-lg"></i>
                    <span class="font-semibold">Column Visibility</span>
                </div>
            </template>
            
            <div class="space-y-3">
                <div class="text-sm text-surface-600 dark:text-surface-300 mb-4">
                    Choose which columns to display in the table. Your preferences will be saved automatically.
                </div>
                
                <!-- Column Toggle Checkboxes -->
                <div class="space-y-2">
                    <div v-for="column in availableColumns" :key="column.key" class="flex items-center">
                        <Checkbox 
                            v-model="column.visible" 
                            :inputId="column.key"
                            :disabled="column.required"
                            @change="saveColumnPreferences"
                        />
                        <label :for="column.key" class="ml-2 text-sm flex-1 cursor-pointer">
                            {{ column.label }}
                            <span v-if="column.required" class="text-xs text-surface-500 ml-1">(Required)</span>
                        </label>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="border-t pt-3 mt-4 flex gap-2">
                    <Button 
                        label="Show All" 
                        size="small" 
                        outlined 
                        @click="showAllColumns"
                        class="flex-1"
                    />
                    <Button 
                        label="Reset to Default" 
                        size="small" 
                        outlined 
                        severity="secondary"
                        @click="resetToDefault"
                        class="flex-1"
                    />
                </div>
            </div>
        </OverlayPanel>

        <div class="card overflow-hidden">
            <!-- Mobile: Show ticket count and pagination info -->
            <div v-if="isMobile" class="p-4 border-b bg-surface-50 dark:bg-surface-800">
                <div class="flex justify-between items-center text-sm">
                    <span class="font-medium">{{ filteredTickets.length }} tickets</span>
                    <span v-if="!showClosedTickets" class="text-surface-500">
                        (Closed tickets hidden)
                    </span>
                </div>
            </div>

            <DataTable 
                v-model:expandedRows="expandedRows"
                v-model:filters="filters"
                :value="filteredTickets" 
                :loading="isLoading" 
                :paginator="true" 
                :rows="isMobile ? 10 : isTablet ? 15 : 25" 
                :rowsPerPageOptions="isMobile ? [5, 10, 20] : [10, 25, 50, 100]"
                paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                :currentPageReportTemplate="isMobile ? '{first}-{last} of {totalRecords}' : 'Showing {first} to {last} of {totalRecords} tickets'"
                dataKey="id"
                filterDisplay="menu"
                :globalFilterFields="['ticket_id', 'subject', 'customer_name', 'status', 'priority', 'owner']"
                :rowHover="!isMobile"
                stripedRows
                :metaKeySelection="false"
                :rowClass="getRowClass"
                @rowExpand="onRowExpand"
                @rowCollapse="onRowCollapse"
                class="responsive-datatable"
                :tableStyle="{ 'min-width': isMobile ? '100%' : '60rem' }"
                :scrollable="!isMobile"
                :scrollHeight="!isMobile ? '70vh' : undefined"
            >
                <!-- Expandable Row Toggle - Always Visible -->
                <Column :expander="true" :style="{ width: isMobile ? '3rem' : '3rem' }" />
                
                <!-- Ticket ID - Always Visible -->
                <Column 
                    field="ticket_id" 
                    header="Ticket" 
                    sortable 
                    :style="{ width: isMobile ? '25%' : '12%' }"
                    class="font-medium"
                >
                    <template #body="slotProps">
                        <div class="flex flex-col">
                            <span 
                                class="font-bold text-primary text-sm md:text-base cursor-pointer hover:text-primary-600 hover:underline"
                                @click="viewTicketDetails(slotProps.data)"
                                :title="'View ticket details for #' + slotProps.data.ticket_id"
                            >
                                {{ slotProps.data.ticket_id }}
                            </span>
                            <!-- Show subject on mobile -->
                            <span v-if="isMobile" class="text-xs text-surface-500 mt-1 line-clamp-2">
                                {{ slotProps.data.subject }}
                            </span>
                        </div>
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" placeholder="Search by ID" class="p-column-filter" />
                    </template>
                </Column>

                <!-- Subject - Configurable Column -->
                <Column 
                    v-if="getColumnVisibility('subject')"
                    field="subject" 
                    header="Subject" 
                    sortable
                    :style="{ width: isMobile ? '40%' : '25%', minWidth: '200px' }"
                >
                    <template #body="slotProps">
                        <div class="max-w-xs lg:max-w-sm truncate" :title="slotProps.data.subject">
                            {{ slotProps.data.subject }}
                        </div>
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" placeholder="Search subject" class="p-column-filter" />
                    </template>
                </Column>

                <!-- Customer - Configurable Column -->
                <Column 
                    v-if="getColumnVisibility('customer')"
                    field="customer_name" 
                    header="Customer" 
                    sortable
                    :style="{ width: '15%' }"
                >
                    <template #body="slotProps">
                        <div class="truncate" :title="slotProps.data.customer_name">
                            {{ slotProps.data.customer_name || 'Unassigned' }}
                        </div>
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" placeholder="Search customer" class="p-column-filter" />
                    </template>
                </Column>

                <!-- Status - Always Visible -->
                <Column 
                    field="status" 
                    header="Status" 
                    sortable
                    :style="{ width: isMobile ? '25%' : '12%' }"
                >
                    <template #body="slotProps">
                        <Tag 
                            :value="slotProps.data.status" 
                            :severity="getStatusSeverity(slotProps.data.status)"
                            :class="isMobile ? 'text-xs' : ''"
                        />
                    </template>
                    <template #filter="{ filterModel }">
                        <Select 
                            v-model="filterModel.value" 
                            :options="statusOptions" 
                            optionLabel="label" 
                            optionValue="value"
                            placeholder="Select Status" 
                            class="p-column-filter" 
                            showClear 
                        />
                    </template>
                </Column>

                <!-- Priority - Configurable Column -->
                <Column 
                    v-if="getColumnVisibility('priority')"
                    field="priority" 
                    header="Priority" 
                    sortable
                    :style="{ width: '10%' }"
                >
                    <template #body="slotProps">
                        <Tag 
                            :value="slotProps.data.priority" 
                            :severity="getPrioritySeverity(slotProps.data.priority)"
                            class="text-xs"
                        />
                    </template>
                    <template #filter="{ filterModel }">
                        <Select 
                            v-model="filterModel.value" 
                            :options="priorityOptions" 
                            optionLabel="label" 
                            optionValue="value"
                            placeholder="Select Priority" 
                            class="p-column-filter" 
                            showClear 
                        />
                    </template>
                </Column>

                <!-- Owner - Configurable Column -->
                <Column 
                    v-if="getColumnVisibility('owner')"
                    field="owner" 
                    header="Owner" 
                    sortable
                    :style="{ width: '12%' }"
                >
                    <template #body="slotProps">
                        <div class="truncate">
                            {{ slotProps.data.owner || 'Unassigned' }}
                        </div>
                    </template>
                    <template #filter="{ filterModel }">
                        <Select 
                            v-model="filterModel.value" 
                            :options="ownerOptions" 
                            optionLabel="label" 
                            optionValue="value"
                            placeholder="Select Owner" 
                            class="p-column-filter" 
                            showClear 
                        />
                    </template>
                </Column>

                <!-- Mobile: Combined Actions Column - Show only on actual mobile devices -->
                <Column v-if="isMobile" header="Actions" :style="{ width: '20%' }">
                    <template #body="slotProps">
                        <div class="flex flex-col gap-1">
                            <Tag 
                                v-if="slotProps.data.priority && !getColumnVisibility('priority')"
                                :value="slotProps.data.priority" 
                                :severity="getPrioritySeverity(slotProps.data.priority)"
                                class="text-xs"
                            />
                            <Button 
                                icon="pi pi-external-link" 
                                text 
                                size="small"
                                class="p-1"
                                @click="openTritonTicket(slotProps.data.ticket_id)"
                                :title="'View in Triton'"
                            />
                        </div>
                    </template>
                </Column>

                <!-- Due Date - Configurable Column -->
                <Column 
                    v-if="getColumnVisibility('dueDate')"
                    field="dates.due_date" 
                    header="Due Date" 
                    sortable
                    :style="{ width: '10%' }"
                >
                    <template #body="slotProps">
                        <span 
                            v-if="slotProps.data.dates?.due_date" 
                            :class="getDueDateClass(slotProps.data.dates.due_date, slotProps.data.sla?.is_overdue)"
                            class="text-sm"
                        >
                            {{ formatDate(slotProps.data.dates.due_date) }}
                        </span>
                        <span v-else class="text-surface-400 text-sm">-</span>
                    </template>
                    <template #filter="{ filterModel }">
                        <DatePicker v-model="filterModel.value" placeholder="Filter by date" class="p-column-filter" />
                    </template>
                </Column>

                <!-- Age - Configurable Column -->
                <Column 
                    v-if="getColumnVisibility('age')"
                    field="dates.created_at" 
                    header="Age" 
                    sortable
                    :style="{ width: '8%' }"
                >
                    <template #body="slotProps">
                        <span :class="getAgeClass(calculateAgeInDays(slotProps.data.dates?.created_at))" class="text-sm font-medium">
                            {{ calculateAgeInDays(slotProps.data.dates?.created_at) }}d
                        </span>
                    </template>
                    <template #filter="{ filterModel }">
                        <InputNumber v-model="filterModel.value" placeholder="Max days" class="p-column-filter" />
                    </template>
                </Column>

                <!-- View in Triton - Configurable Column -->
                <Column v-if="getColumnVisibility('viewInTriton')" header="View in Triton" :style="{ width: '10%' }">
                    <template #body="slotProps">
                        <Button 
                            icon="pi pi-external-link" 
                            text 
                            rounded
                            size="small"
                            @click="openTritonTicket(slotProps.data.ticket_id)"
                            :title="'View ticket #' + slotProps.data.ticket_id + ' in Triton'"
                        />
                    </template>
                </Column>

                <!-- Responsive Expansion Template -->
                <template #expansion="slotProps">
                    <div class="p-3 md:p-6">
                        <!-- Mobile: Show all hidden information -->
                        <div v-if="isMobile" class="space-y-4">
                            <!-- Essential Info Grid -->
                            <div class="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span class="font-medium text-surface-600">Customer:</span>
                                    <div class="font-medium">{{ slotProps.data.customer_name || 'Unassigned' }}</div>
                                </div>
                                <div>
                                    <span class="font-medium text-surface-600">Owner:</span>
                                    <div class="font-medium">{{ slotProps.data.owner || 'Unassigned' }}</div>
                                </div>
                                <div>
                                    <span class="font-medium text-surface-600">Age:</span>
                                    <div :class="getAgeClass(calculateAgeInDays(slotProps.data.dates?.created_at))">
                                        {{ calculateAgeInDays(slotProps.data.dates?.created_at) }} days
                                    </div>
                                </div>
                                <div>
                                    <span class="font-medium text-surface-600">Due:</span>
                                    <div v-if="slotProps.data.dates?.due_date" 
                                         :class="getDueDateClass(slotProps.data.dates.due_date, slotProps.data.sla?.is_overdue)">
                                        {{ formatDate(slotProps.data.dates.due_date) }}
                                    </div>
                                    <div v-else class="text-surface-400">Not set</div>
                                </div>
                            </div>
                            
                            <!-- Subject for mobile (if not already shown) -->
                            <div>
                                <span class="font-medium text-surface-600 block mb-1">Subject:</span>
                                <p class="text-sm leading-relaxed">{{ slotProps.data.subject }}</p>
                            </div>
                        </div>

                        <!-- Desktop: Enhanced details -->
                        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <!-- Ticket Details -->
                            <div class="space-y-3">
                                <h6 class="text-surface-900 dark:text-surface-0 font-semibold mb-3">Ticket Details</h6>
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
                                        <span class="text-surface-600 dark:text-surface-400">Creator:</span>
                                        <span class="font-medium">{{ formatCreatorName(slotProps.data.creator) }}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Status & Assignment -->
                            <div class="space-y-3">
                                <h6 class="text-surface-900 dark:text-surface-0 font-semibold mb-3">Assignment</h6>
                                <div class="space-y-2 text-sm">
                                    <div class="flex justify-between">
                                        <span class="text-surface-600 dark:text-surface-400">Status:</span>
                                        <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-surface-600 dark:text-surface-400">Priority:</span>
                                        <Tag :value="slotProps.data.priority" :severity="getPrioritySeverity(slotProps.data.priority)" />
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-surface-600 dark:text-surface-400">Owner:</span>
                                        <span class="font-medium">{{ slotProps.data.owner || 'Unassigned' }}</span>
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
                        <div class="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
                                                        <div :class="`flex gap-2 ${isMobile ? 'flex-col' : ''}`">
                                <Button 
                                    icon="pi pi-eye" 
                                    label="View Details" 
                                    :size="isMobile ? 'large' : 'small'"
                                    :class="isMobile ? 'w-full' : ''"
                                    @click="viewTicketDetails(slotProps.data)" 
                                />
                                <Button 
                                    icon="pi pi-external-link" 
                                    label="View in Triton" 
                                    severity="secondary"
                                    outlined
                                    :size="isMobile ? 'large' : 'small'"
                                    :class="isMobile ? 'w-full' : ''"
                                    @click="openTritonTicket(slotProps.data.ticket_id)"
                                />
                            </div>
                        </div>
                    </div>
                </template>
            </DataTable>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useEngineeringStore } from '@/stores/engineeringStore';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { formatDate, formatDueDate, calculateAgeInDays } from '@/lib/utils';
import { FilterMatchMode } from '@primevue/core/api';

// Responsive breakpoints using VueUse
import { useBreakpoints } from '@vueuse/core';

const breakpoints = useBreakpoints({
  sm: 640,
  md: 768, 
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
});

// Reactive breakpoint checks - More conservative hiding of columns
const isMobile = breakpoints.smaller('md'); // Only phones < 768px
const isTabletAndUp = breakpoints.greaterOrEqual('md'); // 768px+
const isDesktop = breakpoints.greaterOrEqual('lg'); // 1024px+ 
const isLargeDesktop = breakpoints.greaterOrEqual('xl'); // 1280px+
const isTablet = breakpoints.between('md', 'lg'); // 768px - 1023px

// More conservative column visibility - show more columns by default
const showSubject = breakpoints.greaterOrEqual('md'); // Show subject on tablet+
const showCustomer = breakpoints.greaterOrEqual('lg'); // Show customer on desktop+
const showPriority = breakpoints.greaterOrEqual('md'); // Show priority on tablet+
const showOwner = breakpoints.greaterOrEqual('lg'); // Show owner on desktop+
const showDueDate = breakpoints.greaterOrEqual('xl'); // Show due date on large desktop+
const showAge = breakpoints.greaterOrEqual('xl'); // Show age on large desktop+

// PrimeVue Components
import Toast from 'primevue/toast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import DatePicker from 'primevue/datepicker';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';
import Checkbox from 'primevue/checkbox';
import OverlayPanel from 'primevue/overlaypanel';

// Composables
const engineeringStore = useEngineeringStore();
const router = useRouter();
const toast = useToast();

// Reactive data
const tickets = computed(() => engineeringStore.tickets);
const isLoading = computed(() => engineeringStore.loading);
const pagination = computed(() => engineeringStore.pagination);
const expandedRows = ref({});
const isFieldSyncing = ref(false);

// Column preferences system
const columnSelectorPanel = ref();
const STORAGE_KEY = 'engineering-tickets-column-preferences';

// Default column configuration
const defaultColumns = [
  { key: 'ticketId', label: 'Ticket ID', visible: true, required: true },
  { key: 'subject', label: 'Subject', visible: isTabletAndUp.value, required: false },
  { key: 'customer', label: 'Customer', visible: isDesktop.value, required: false },
  { key: 'status', label: 'Status', visible: true, required: true },
  { key: 'priority', label: 'Priority', visible: isTabletAndUp.value, required: false },
  { key: 'owner', label: 'Owner', visible: isDesktop.value, required: false },
  { key: 'dueDate', label: 'Due Date', visible: isLargeDesktop.value, required: false },
  { key: 'age', label: 'Age', visible: isLargeDesktop.value, required: false },
  { key: 'viewInTriton', label: 'View in Triton', visible: isDesktop.value, required: false }
];

// Column preferences reactive array
const availableColumns = ref([...defaultColumns]);

// Filter states
const showClosedTickets = ref(false);
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  ticket_id: { value: null, matchMode: FilterMatchMode.CONTAINS },
  subject: { value: null, matchMode: FilterMatchMode.CONTAINS },
  customer_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  status: { value: null, matchMode: FilterMatchMode.EQUALS },
  priority: { value: null, matchMode: FilterMatchMode.EQUALS },
  owner: { value: null, matchMode: FilterMatchMode.EQUALS },
  'dates.due_date': { value: null, matchMode: FilterMatchMode.DATE_IS },
  'dates.created_at': { value: null, matchMode: FilterMatchMode.EQUALS },
  'dates.updated_at': { value: null, matchMode: FilterMatchMode.EQUALS }
});

// Filter options
const statusOptions = ref([
  { label: 'Open', value: 'Open' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Resolved', value: 'Resolved' },
  { label: 'Closed', value: 'Closed' }
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

// Computed filtered tickets - Apply closed filter before DataTable filters
const filteredTickets = computed(() => {
  let filtered = [...tickets.value];
  
  // Apply closed tickets filter first (case-insensitive)
  if (!showClosedTickets.value) {
    filtered = filtered.filter(ticket => ticket.status?.toLowerCase() !== 'closed');
  }
  
  return filtered;
});

// Load tickets on component mount
onMounted(async () => {
  loadColumnPreferences();
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
    'in progress': 'primary',
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

// Show closed tickets toggle handler
function onShowClosedChange() {
  toast.add({
    severity: 'info',
    summary: showClosedTickets.value ? 'Showing Closed Tickets' : 'Hiding Closed Tickets',
    detail: showClosedTickets.value ? 'Closed tickets are now visible' : 'Closed tickets are now hidden',
    life: 2000
  });
}

function clearAllFilters() {
  filters.value = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    ticket_id: { value: null, matchMode: FilterMatchMode.CONTAINS },
    subject: { value: null, matchMode: FilterMatchMode.CONTAINS },
    customer_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
    priority: { value: null, matchMode: FilterMatchMode.EQUALS },
    owner: { value: null, matchMode: FilterMatchMode.EQUALS },
    'dates.due_date': { value: null, matchMode: FilterMatchMode.DATE_IS },
    'dates.created_at': { value: null, matchMode: FilterMatchMode.EQUALS },
    'dates.updated_at': { value: null, matchMode: FilterMatchMode.EQUALS }
  };
  
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

// Navigate to ticket details
function viewTicketDetails(ticketData) {
  router.push({ 
    name: 'engineering-ticket-detail', 
    params: { id: ticketData.ticket_id } 
  });
}

// Open new ticket window
function openNewTicketWindow() {
  window.open('https://staff.cissdm.com/ticketing/department/7', '_blank', 'noopener,noreferrer');
}

// Open Triton ticket in new window
function openTritonTicket(ticketId) {
  window.open(`https://staff.cissdm.com/ticketing/ticket/${ticketId}`, '_blank', 'noopener,noreferrer');
}

// Trigger field sync
async function triggerFieldSync() {
  isFieldSyncing.value = true;
  
  try {
    await engineeringStore.triggerFieldSync();
    
    toast.add({
      severity: 'success',
      summary: 'Field Sync Complete',
      detail: 'Field synchronization completed successfully',
      life: 3000
    });
    
    // Refresh the tickets data after sync
    await loadTickets();
    
  } catch (error) {
    console.error('Field sync error:', error);
    toast.add({
      severity: 'error',
      summary: 'Field Sync Failed',
      detail: error.message || 'Failed to complete field synchronization',
      life: 5000
    });
  } finally {
    isFieldSyncing.value = false;
  }
}

// === COLUMN PREFERENCES METHODS ===

// Load column preferences from localStorage
function loadColumnPreferences() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const savedPrefs = JSON.parse(saved);
      
      // Merge saved preferences with defaults, keeping the structure intact
      availableColumns.value = defaultColumns.map(defaultCol => {
        const savedCol = savedPrefs.find(saved => saved.key === defaultCol.key);
        return {
          ...defaultCol,
          visible: savedCol ? savedCol.visible : defaultCol.visible
        };
      });
    }
  } catch (error) {
    console.error('Error loading column preferences:', error);
    availableColumns.value = [...defaultColumns];
  }
}

// Save column preferences to localStorage
function saveColumnPreferences() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(availableColumns.value));
    toast.add({
      severity: 'success',
      summary: 'Preferences Saved',
      detail: 'Column preferences have been saved',
      life: 2000
    });
  } catch (error) {
    console.error('Error saving column preferences:', error);
    toast.add({
      severity: 'error',
      summary: 'Save Failed',
      detail: 'Failed to save column preferences',
      life: 3000
    });
  }
}

// Get column visibility based on preferences
function getColumnVisibility(columnKey) {
  const column = availableColumns.value.find(col => col.key === columnKey);
  return column ? column.visible : false;
}

// Toggle column selector overlay
function toggleColumnSelector(event) {
  columnSelectorPanel.value.toggle(event);
}

// Show all columns
function showAllColumns() {
  availableColumns.value.forEach(column => {
    column.visible = true;
  });
  saveColumnPreferences();
}

// Reset to default preferences
function resetToDefault() {
  availableColumns.value = defaultColumns.map(col => ({
    ...col,
    visible: col.visible // Use the original default visibility
  }));
  saveColumnPreferences();
  toast.add({
    severity: 'info',
    summary: 'Reset Complete',
    detail: 'Column preferences have been reset to defaults',
    life: 3000
  });
}

</script>

<style scoped>
/* Responsive DataTable styles */
.responsive-datatable {
  --datatable-header-padding: 0.75rem 0.5rem;
  --datatable-cell-padding: 0.75rem 0.5rem;
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .responsive-datatable {
    --datatable-header-padding: 0.5rem 0.25rem;
    --datatable-cell-padding: 0.5rem 0.25rem;
  }
  
  /* Hide table borders on mobile for cleaner look */
  .responsive-datatable :deep(.p-datatable-table) {
    border-collapse: separate;
    border-spacing: 0;
  }
  
  /* Make rows more card-like on mobile */
  .responsive-datatable :deep(.p-datatable-tbody tr) {
    border-bottom: 2px solid var(--surface-border);
  }
  
  /* Touch-friendly expansion toggle */
  .responsive-datatable :deep(.p-row-toggler) {
    width: 2.5rem !important;
    height: 2.5rem !important;
  }
}

/* Tablet adjustments */
@media (min-width: 769px) and (max-width: 1024px) {
  .responsive-datatable {
    --datatable-header-padding: 1rem 0.75rem;
    --datatable-cell-padding: 1rem 0.75rem;
  }
}

/* Desktop enhancements */
@media (min-width: 1025px) {
  .responsive-datatable :deep(.p-datatable-tbody tr:hover) {
    background-color: var(--surface-hover);
  }
}

/* Custom row classes */
.responsive-datatable :deep(.overdue-row) {
  background-color: rgba(239, 68, 68, 0.05);
  border-left: 4px solid #ef4444;
}

.responsive-datatable :deep(.high-priority-row) {
  background-color: rgba(245, 158, 11, 0.05);
  border-left: 4px solid #f59e0b;
}

.responsive-datatable :deep(.unassigned-customer-row) {
  background-color: rgba(156, 163, 175, 0.05);
  border-left: 4px solid #9ca3af;
}

/* Age color coding */
.age-old {
  @apply text-red-600 font-bold;
}

.age-moderate {
  @apply text-orange-600 font-medium;
}

.age-new {
  @apply text-green-600;
}

/* Utility classes for mobile */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Enhanced mobile expansion panel */
@media (max-width: 768px) {
  .responsive-datatable :deep(.p-datatable-row-expansion) {
    background-color: var(--surface-50);
    border-radius: 0.5rem;
    margin: 0.25rem;
  }
}
</style> 