<template>
    <div class="dispatch-ticket-analysis p-2 md:p-4 lg:p-6">
        <h1 class="text-2xl md:text-3xl font-bold mb-2 md:mb-4">Dispatch Ticket Analysis</h1>
        <p class="text-gray-600 mb-6 md:mb-8">Enter a ticket number to analyze dispatch operations and field service tickets with AI-powered insights</p>

        <!-- Search Panel -->
        <Card class="mb-6 md:mb-8">
            <template #content>
                <!-- Direct Ticket ID Entry -->
                <div class="mb-6">
                    <label for="ticketInput" class="font-medium block mb-2">Enter Ticket ID:</label>
                    <div class="flex flex-wrap gap-2">
                        <InputGroup class="flex-1 min-w-[250px]">
                            <InputGroupAddon>
                                <i class="pi pi-search"></i>
                            </InputGroupAddon>
                            <InputText 
                                id="ticketInput" 
                                v-model="ticketInput" 
                                placeholder="Enter ticket number(s)..." 
                                class="w-full" 
                                @keyup.enter="searchTicket" />
                        </InputGroup>
                        <Button 
                            label="Search" 
                            icon="pi pi-search" 
                            @click="searchTicket" 
                            :loading="isSearching" />
                    </div>
                    <small class="text-gray-500 mt-2 block">
                        Enter one or more comma-separated ticket IDs for dispatch analysis.
                    </small>
                </div>
            </template>
        </Card>

        <!-- Results Section -->
        <div v-if="hasSearched && !isSearching" class="grid">
            <div class="col-12">
                <Card>
                    <template #content>
                        <div v-if="searchResults.length > 0">
                            <h5 class="mb-4">Dispatch Analysis Results for Ticket(s): {{ searchedTicketIds }}</h5>
                            
                            <!-- Ticket Details Table -->
                            <DataTable 
                                :value="searchResults" 
                                class="p-datatable-sm mb-6"
                                responsiveLayout="scroll"
                            >
                                <Column field="id" header="Ticket ID" sortable></Column>
                                <Column field="technician" header="Technician"></Column>
                                <Column field="location" header="Location"></Column>
                                <Column field="priority" header="Priority">
                                    <template #body="slotProps">
                                        <Tag 
                                            :value="slotProps.data.priority" 
                                            :severity="getPrioritySeverity(slotProps.data.priority)"
                                        />
                                    </template>
                                </Column>
                                <Column field="status" header="Status">
                                    <template #body="slotProps">
                                        <Tag 
                                            :value="slotProps.data.status" 
                                            :severity="getStatusSeverity(slotProps.data.status)"
                                        />
                                    </template>
                                </Column>
                                <Column field="eta" header="ETA" sortable></Column>
                            </DataTable>

                            <!-- AI Dispatch Analysis Section -->
                            <div class="grid">
                                <div class="col-12 lg:col-8">
                                    <div class="p-4 bg-indigo-50 border-round border-indigo-200 border-1 mb-4">
                                        <h6 class="text-indigo-800 mb-3">
                                            <i class="pi pi-brain mr-2"></i>
                                            AI Dispatch Analysis
                                        </h6>
                                        <div class="text-indigo-700">
                                            <p class="mb-2"><strong>Route Optimization:</strong> Analyzing optimal routing for efficiency...</p>
                                            <p class="mb-2"><strong>Resource Allocation:</strong> Evaluating technician assignments and workload...</p>
                                            <p class="mb-0"><strong>Time Prediction:</strong> Estimating completion times based on historical data...</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 lg:col-4">
                                    <div class="p-4 bg-teal-50 border-round border-teal-200 border-1">
                                        <h6 class="text-teal-800 mb-3">
                                            <i class="pi pi-map mr-2"></i>
                                            Dispatch Recommendations
                                        </h6>
                                        <div class="text-teal-700">
                                            <p class="mb-2">• Optimize travel routes</p>
                                            <p class="mb-2">• Consider technician expertise</p>
                                            <p class="mb-0">• Monitor real-time updates</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="text-center py-8">
                            <i class="pi pi-info-circle text-4xl text-gray-400 mb-3"></i>
                            <p class="text-gray-500 text-lg">No dispatch tickets found for the specified ID(s)</p>
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Initial State -->
        <div v-if="!hasSearched && !isSearching" class="text-center py-12">
            <i class="pi pi-search text-6xl text-gray-300 mb-4"></i>
            <h3 class="text-gray-500 mb-2">Ready for Dispatch Analysis</h3>
            <p class="text-gray-400">Enter a ticket ID above to begin AI-powered dispatch analysis</p>
        </div>

        <!-- Loading State -->
        <div v-if="isSearching" class="text-center py-12">
            <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="8" />
            <p class="text-gray-500 mt-4">Analyzing dispatch data...</p>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';

const toast = useToast();

// Search state
const ticketInput = ref('');
const isSearching = ref(false);
const hasSearched = ref(false);
const searchResults = ref([]);
const searchedTicketIds = ref('');

// Handle search submission
async function searchTicket() {
    if (!ticketInput.value || ticketInput.value.trim() === '') {
        toast.add({ 
            severity: 'warn', 
            summary: 'Input Required', 
            detail: 'Please enter a ticket number', 
            life: 3000 
        });
        return;
    }

    await performTicketSearch(ticketInput.value.trim());
}

// Perform ticket search
async function performTicketSearch(ticketId) {
    isSearching.value = true;
    searchedTicketIds.value = ticketId;
    
    try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simulate search results - replace with actual API call
        const mockResults = [
            {
                id: ticketId,
                technician: 'John Smith',
                location: 'Downtown Office Complex',
                priority: 'High',
                status: 'En Route',
                eta: '15 mins'
            }
        ];
        
        searchResults.value = mockResults;
        hasSearched.value = true;
        
        toast.add({ 
            severity: 'success', 
            summary: 'Search Complete', 
            detail: `Found ${mockResults.length} dispatch ticket(s) for analysis`, 
            life: 3000 
        });
        
    } catch (error) {
        console.error('Search error:', error);
        searchResults.value = [];
        hasSearched.value = true;
        
        toast.add({ 
            severity: 'error', 
            summary: 'Search Error', 
            detail: 'Failed to search for dispatch tickets', 
            life: 3000 
        });
    } finally {
        isSearching.value = false;
    }
}

const getPrioritySeverity = (priority) => {
    switch (priority) {
        case 'Critical':
            return 'danger';
        case 'High':
            return 'warning';
        case 'Medium':
            return 'info';
        case 'Low':
            return 'success';
        default:
            return null;
    }
};

const getStatusSeverity = (status) => {
    switch (status) {
        case 'Assigned':
            return 'info';
        case 'En Route':
            return 'warning';
        case 'On Site':
            return 'success';
        case 'Completed':
            return 'success';
        default:
            return null;
    }
};
</script>

<style scoped>
.card {
    background: var(--surface-card);
    padding: 2rem;
    border-radius: 10px;
    margin-bottom: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style> 