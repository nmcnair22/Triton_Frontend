<template>
    <div class="ticket-analysis-panel">
        <!-- Ticket Summary -->
        <Card class="mb-4">
            <template #header>
                <div class="flex items-center justify-between p-4">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-ticket text-blue-600"></i>
                        <h6 class="text-lg font-semibold mb-0">Ticket Summary</h6>
                    </div>
                    <Button 
                        label="View All Tickets" 
                        icon="pi pi-external-link" 
                        size="small" 
                        severity="secondary" 
                        outlined />
                </div>
            </template>
            <template #content>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div class="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                        <div class="text-2xl font-bold text-blue-700 dark:text-blue-300">{{ ticketSummary.total }}</div>
                        <div class="text-sm text-blue-600 dark:text-blue-400">Total Tickets</div>
                    </div>
                    <div class="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                        <div class="text-2xl font-bold text-green-700 dark:text-green-300">{{ ticketSummary.resolved }}</div>
                        <div class="text-sm text-green-600 dark:text-green-400">Resolved</div>
                    </div>
                    <div class="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                        <div class="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{{ ticketSummary.inProgress }}</div>
                        <div class="text-sm text-yellow-600 dark:text-yellow-400">In Progress</div>
                    </div>
                    <div class="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                        <div class="text-2xl font-bold text-red-700 dark:text-red-300">{{ ticketSummary.open }}</div>
                        <div class="text-sm text-red-600 dark:text-red-400">Open</div>
                    </div>
                </div>

                <!-- Date Range Info -->
                <div class="flex items-center gap-4 text-sm text-surface-600 dark:text-surface-400">
                    <span><i class="pi pi-calendar mr-1"></i>Date Range: {{ dateRangeText }}</span>
                    <span><i class="pi pi-chart-line mr-1"></i>Avg Resolution: {{ avgResolutionTime }}</span>
                </div>
            </template>
        </Card>

        <!-- Ticket List -->
        <Card>
            <template #header>
                <div class="flex items-center justify-between p-4">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-list text-green-600"></i>
                        <h6 class="text-lg font-semibold mb-0">Recent Tickets</h6>
                    </div>
                    <div class="flex items-center gap-2">
                        <Select 
                            v-model="statusFilter" 
                            :options="statusFilterOptions" 
                            placeholder="Filter by status" 
                            class="w-40" />
                        <Button 
                            icon="pi pi-refresh" 
                            size="small" 
                            text 
                            @click="refreshTickets" />
                    </div>
                </div>
            </template>
            <template #content>
                <DataTable 
                    :value="filteredTickets" 
                    dataKey="id"
                    :expandedRows="expandedRows"
                    @update:expandedRows="expandedRows = $event"
                    v-model:expandedRows="expandedRows"
                    class="ticket-table">
                    
                    <Column :expander="true" headerStyle="width: 3rem" />

                    <Column field="id" header="Ticket #" style="min-width: 100px">
                        <template #body="slotProps">
                            <span class="font-mono font-bold text-blue-600">#{{ slotProps.data.id }}</span>
                        </template>
                    </Column>

                    <Column field="subject" header="Subject" style="min-width: 200px">
                        <template #body="slotProps">
                            <div>
                                <div class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.subject }}</div>
                                <div class="text-xs text-surface-500 dark:text-surface-400">{{ slotProps.data.category }}</div>
                            </div>
                        </template>
                    </Column>

                    <Column field="status" header="Status" style="min-width: 100px">
                        <template #body="slotProps">
                            <Tag 
                                :value="slotProps.data.status" 
                                :severity="getTicketStatusSeverity(slotProps.data.status)" />
                        </template>
                    </Column>

                    <Column field="priority" header="Priority" style="min-width: 100px">
                        <template #body="slotProps">
                            <Tag 
                                :value="slotProps.data.priority" 
                                :severity="getPrioritySeverity(slotProps.data.priority)" />
                        </template>
                    </Column>

                    <Column field="created" header="Created" style="min-width: 120px">
                        <template #body="slotProps">
                            <div class="text-sm">{{ formatDate(slotProps.data.created) }}</div>
                        </template>
                    </Column>

                    <Column field="assignee" header="Assignee" style="min-width: 120px">
                        <template #body="slotProps">
                            <div v-if="slotProps.data.assignee" class="flex items-center gap-2">
                                <Avatar 
                                    :label="slotProps.data.assignee.charAt(0).toUpperCase()" 
                                    size="small" 
                                    shape="circle" />
                                <span class="text-sm">{{ slotProps.data.assignee }}</span>
                            </div>
                            <span v-else class="text-sm text-surface-400">Unassigned</span>
                        </template>
                    </Column>

                    <Column headerStyle="width: 120px" bodyStyle="text-align: center">
                        <template #body="slotProps">
                            <div class="flex justify-center gap-1">
                                <Button 
                                    icon="pi pi-eye" 
                                    size="small" 
                                    text 
                                    rounded 
                                    severity="info"
                                    v-tooltip.top="'View Details'"
                                    @click="viewTicketDetails(slotProps.data)" />
                                <Button 
                                    icon="pi pi-external-link" 
                                    size="small" 
                                    text 
                                    rounded 
                                    severity="primary"
                                    v-tooltip.top="'Open in Helpdesk'"
                                    @click="openInHelpdesk(slotProps.data)" />
                            </div>
                        </template>
                    </Column>

                    <template #expansion="slotProps">
                        <div class="p-6 bg-surface-50 dark:bg-surface-800">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <!-- Ticket Details -->
                                <div>
                                    <h6 class="font-semibold mb-3">Ticket Details</h6>
                                    <div class="space-y-2 text-sm">
                                        <div><strong>Description:</strong></div>
                                        <p class="text-surface-700 dark:text-surface-300 pl-4">{{ slotProps.data.description }}</p>
                                        <div><strong>Requester:</strong> {{ slotProps.data.requester }}</div>
                                        <div><strong>Department:</strong> {{ slotProps.data.department }}</div>
                                        <div><strong>Location Reference:</strong> {{ slotProps.data.locationRef }}</div>
                                        <div><strong>Last Updated:</strong> {{ formatDate(slotProps.data.lastUpdated) }}</div>
                                    </div>
                                </div>

                                <!-- Activity Summary -->
                                <div>
                                    <h6 class="font-semibold mb-3">Activity Summary</h6>
                                    <div class="space-y-2 text-sm">
                                        <div class="flex justify-between">
                                            <span>Total Comments:</span>
                                            <span class="font-medium">{{ slotProps.data.comments }}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span>Time Spent:</span>
                                            <span class="font-medium">{{ slotProps.data.timeSpent }}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span>Resolution Time:</span>
                                            <span class="font-medium">{{ slotProps.data.resolutionTime || 'Pending' }}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span>Related Items:</span>
                                            <span class="font-medium">{{ slotProps.data.relatedItems }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>

                    <template #empty>
                        <div class="text-center py-4">
                            <i class="pi pi-ticket text-4xl text-surface-300 dark:text-surface-600 mb-3"></i>
                            <p class="text-surface-500 dark:text-surface-400">No tickets found for this location</p>
                        </div>
                    </template>
                </DataTable>
            </template>
        </Card>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Avatar from 'primevue/avatar';
import Select from 'primevue/select';

// Props
const props = defineProps({
    location: {
        type: Object,
        required: true
    },
    tickets: {
        type: Array,
        default: () => []
    }
});

// Reactive data
const expandedRows = ref({});
const statusFilter = ref('All');

// Filter options
const statusFilterOptions = ref(['All', 'Open', 'In Progress', 'Resolved', 'Closed']);

// Use tickets from props - NO MOCK DATA

// Computed - using props.tickets, NO MOCK DATA
const ticketSummary = computed(() => {
    if (!props.tickets || props.tickets.length === 0) return { total: 0, resolved: 0, inProgress: 0, open: 0 };
    
    const total = props.tickets.length;
    const resolved = props.tickets.filter(t => t.ticketstatustitle === 'Resolved' || t.ticketstatustitle === 'Closed').length;
    const inProgress = props.tickets.filter(t => t.ticketstatustitle === 'In Progress').length;
    const open = props.tickets.filter(t => t.ticketstatustitle === 'Open').length;
    
    return { total, resolved, inProgress, open };
});

const filteredTickets = computed(() => {
    if (!props.tickets || props.tickets.length === 0) return [];
    
    // Map backend ticket format to display format
    let tickets = props.tickets.map(ticket => ({
        id: ticket.ticketmaskid || ticket.ticketid,
        subject: ticket.subject || 'No subject',
        description: ticket.description || 'No description available',
        category: ticket.tickettypetitle || 'General',
        status: ticket.ticketstatustitle || 'Unknown',
        priority: ticket.prioritytitle || 'Normal',
        created: ticket.dateline,
        lastUpdated: ticket.lastactivity,
        assignee: ticket.ownerstaffname || null,
        requester: ticket.requestor || 'Unknown',
        department: ticket.department || 'N/A',
        locationRef: `Site: ${props.location?.siteNumber || 'Unknown'}`,
        comments: 0, // Would need to get from posts
        timeSpent: 'N/A',
        resolutionTime: ticket.ticketstatustitle === 'Resolved' ? 'Resolved' : null,
        relatedItems: 0
    }));
    
    if (statusFilter.value === 'All') {
        return tickets;
    }
    return tickets.filter(ticket => ticket.status === statusFilter.value);
});

const dateRangeText = computed(() => {
    if (!props.tickets || props.tickets.length === 0) return 'No data';
    
    const dates = props.tickets.map(t => new Date(t.dateline)).filter(d => !isNaN(d.getTime()));
    if (dates.length === 0) return 'No dates available';
    
    const earliest = new Date(Math.min(...dates));
    const latest = new Date(Math.max(...dates));
    
    return `${earliest.toLocaleDateString()} - ${latest.toLocaleDateString()}`;
});

const avgResolutionTime = computed(() => {
    if (!props.tickets || props.tickets.length === 0) return 'N/A';
    
    // Would need resolution time calculation from backend data
    return 'Backend calculation needed';
});

// Methods
const getTicketStatusSeverity = (status) => {
    switch (status) {
        case 'Resolved':
        case 'Closed':
            return 'success';
        case 'In Progress':
            return 'warning';
        case 'Open':
            return 'info';
        default:
            return 'secondary';
    }
};

const getPrioritySeverity = (priority) => {
    switch (priority) {
        case 'Critical':
            return 'danger';
        case 'High':
            return 'warning';
        case 'Medium':
            return 'info';
        case 'Low':
            return 'secondary';
        default:
            return 'secondary';
    }
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const viewTicketDetails = (ticket) => {
    // Implementation for viewing ticket details
    console.log('View ticket details:', ticket.id);
};

const openInHelpdesk = (ticket) => {
    // Implementation for opening ticket in helpdesk system
    console.log('Open in helpdesk:', ticket.id);
};

const refreshTickets = () => {
    // Implementation for refreshing ticket data
    console.log('Refreshing tickets...');
};
</script>

<style scoped>
.ticket-analysis-panel {
    height: 100%;
    overflow-y: auto;
}

.ticket-table :deep(.p-datatable-tbody) > tr {
    cursor: pointer;
}

.ticket-table :deep(.p-datatable-tbody) > tr:hover {
    background-color: var(--p-surface-100);
}
</style>