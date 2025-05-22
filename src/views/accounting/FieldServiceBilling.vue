<script setup>
import { ref, onMounted } from 'vue';
import { useBillingStore } from '@/stores/billingStore';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';

// Components
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import SelectButton from 'primevue/selectbutton';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Badge from 'primevue/badge';
import ProgressSpinner from 'primevue/progressspinner';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';

const billingStore = useBillingStore();
const confirm = useConfirm();
const toast = useToast();

// Form state
const ticketInput = ref('');
const isSearching = ref(false);
const activeTab = ref('0');

// View options
const viewOptions = [
    { label: 'Payables', value: 'payables' },
    { label: 'Receivables', value: 'receivables' }
];

// Format currency values
function formatCurrency(value) {
    return value ? `$${parseFloat(value).toFixed(2)}` : '$0.00';
}

// Format date values
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Handle search submission
async function searchTicket() {
    if (!ticketInput.value || ticketInput.value.trim() === '') {
        toast.add({ severity: 'warn', summary: 'Input Required', detail: 'Please enter a ticket number', life: 3000 });
        return;
    }

    isSearching.value = true;
    try {
        await billingStore.fetchBillingDataByTicket(ticketInput.value.trim());
        
        if (billingStore.error) {
            if (billingStore.hasData) {
                // Partial success - some tickets were found, others weren't
                toast.add({ 
                    severity: 'info', 
                    summary: 'Partial Data Retrieved', 
                    detail: billingStore.error,
                    life: 5000 
                });
            } else {
                // Complete failure - no tickets were found
                toast.add({ 
                    severity: 'error', 
                    summary: 'Error', 
                    detail: billingStore.error, 
                    life: 3000 
                });
            }
        } else if (!billingStore.hasData) {
            toast.add({ 
                severity: 'info', 
                summary: 'No Data', 
                detail: 'No billing data found for this ticket', 
                life: 3000 
            });
        } else {
            // Success message with count of tickets found
            toast.add({ 
                severity: 'success', 
                summary: 'Data Retrieved', 
                detail: `Found ${billingStore.billingData.length} billing records`, 
                life: 3000 
            });
            
            // Reset the active tab index to show the first ticket
            activeTab.value = '0';
        }
    } catch (error) {
        toast.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: 'An error occurred while fetching data', 
            life: 3000 
        });
    } finally {
        isSearching.value = false;
    }
}

// Handle export
function exportData() {
    confirm.require({
        message: 'This will export the current data as CSV. Proceed?',
        header: 'Export Confirmation',
        icon: 'pi pi-info-circle',
        acceptClass: 'p-button-primary',
        accept: () => {
            toast.add({ severity: 'success', summary: 'Exported', detail: 'Data has been exported successfully', life: 3000 });
        },
        reject: () => {
            // Do nothing on reject
        }
    });
}

// Navigate to ticket tab
function navigateToTicket(ticket) {
    const ticketIndex = billingStore.billingData.findIndex(item => item.ticket_id === ticket.ticket_id);
    if (ticketIndex !== -1) {
        activeTab.value = ticketIndex.toString();
    }
}

// Generate ticket URL for external system
function getTicketUrl(ticketId) {
    return `https://staff.cis.us/ticketing/ticket/${ticketId}`;
}

// Open ticket in external system
function openExternalTicket(ticketId, event) {
    if (event) {
        // Stop event propagation to prevent other click handlers from firing
        event.stopPropagation();
    }
    window.open(getTicketUrl(ticketId), '_blank');
}
</script>

<template>
    <div class="field-service-billing">
        <h1 class="text-3xl font-bold mb-4">Field Service Billing Analysis</h1>
        <p class="text-gray-600 mb-8">Enter a ticket number to retrieve and analyze billing data</p>

        <!-- Search Panel -->
        <Card class="mb-8">
            <template #content>
                <div class="flex flex-col gap-2">
                    <label for="ticketInput" class="font-medium">Enter Ticket ID:</label>
                    <div class="flex flex-col sm:flex-row gap-4">
                        <InputGroup class="flex-grow">
                            <InputGroupAddon>
                                <i class="pi pi-search"></i>
                            </InputGroupAddon>
                            <InputText id="ticketInput" v-model="ticketInput" placeholder="Enter ticket number..." 
                                class="w-full" @keyup.enter="searchTicket" />
                        </InputGroup>
                        <Button label="Search" icon="pi pi-search" @click="searchTicket" :loading="isSearching" class="min-w-20" />
                    </div>
                    <small class="text-gray-500">
                        Enter one or more ticket IDs separated by commas to analyze multiple tickets at once.
                    </small>
                </div>
            </template>
        </Card>

        <!-- Results Panel -->
        <Card v-if="billingStore.hasData" class="mb-8">
            <template #title>
                <div class="flex justify-between items-center">
                    <span>Financial Records</span>
                    <div class="flex gap-2">
                        <SelectButton v-model="billingStore.viewMode" :options="viewOptions" optionLabel="label" optionValue="value" aria-labelledby="view-mode-label" />
                        <Button icon="pi pi-file-export" label="Export" severity="secondary" text raised @click="exportData" />
                    </div>
                </div>
            </template>
            <template #content>
                <!-- Table for Payables View -->
                <DataTable v-if="billingStore.viewMode === 'payables'" :value="billingStore.filteredBillingData" 
                          class="p-datatable-sm" responsiveLayout="scroll" :paginator="billingStore.filteredBillingData.length > 10" :rows="10"
                          selectionMode="single" @row-click="event => navigateToTicket(event.data)">
                    <Column field="ticket_id" header="Ticket #" :sortable="true">
                        <template #body="slotProps">
                            <a href="#" class="text-blue-600 hover:text-blue-800 hover:underline" 
                               @click="openExternalTicket(slotProps.data.ticket_id, $event)">
                                {{ slotProps.data.ticket_id }}
                            </a>
                        </template>
                    </Column>
                    <Column field="billing_details.vendor.vendor_name" header="Vendor" :sortable="true"></Column>
                    <Column field="service_date" header="Service Date" :sortable="true">
                        <template #body="slotProps">
                            {{ formatDate(slotProps.data.service_date) }}
                        </template>
                    </Column>
                    <Column field="billing_details.product_code" header="Product Code" :sortable="true"></Column>
                    <Column field="billing_details.amount_paid" header="Amount Paid" :sortable="true">
                        <template #body="slotProps">
                            {{ formatCurrency(slotProps.data.billing_details.amount_paid) }}
                        </template>
                    </Column>
                    <Column field="status" header="Status" :sortable="true">
                        <template #body="{data}">
                            <Badge :value="data.status" :severity="data.status === 'Closed' ? 'success' : 'warning'" />
                        </template>
                    </Column>
                </DataTable>
                
                <!-- Table for Receivables View -->
                <DataTable v-else :value="billingStore.filteredBillingData" 
                          class="p-datatable-sm" responsiveLayout="scroll" :paginator="billingStore.filteredBillingData.length > 10" :rows="10"
                          selectionMode="single" @row-click="event => navigateToTicket(event.data)">
                    <Column field="ticket_id" header="Ticket #" :sortable="true">
                        <template #body="slotProps">
                            <a href="#" class="text-blue-600 hover:text-blue-800 hover:underline" 
                               @click="openExternalTicket(slotProps.data.ticket_id, $event)">
                                {{ slotProps.data.ticket_id }}
                            </a>
                        </template>
                    </Column>
                    <Column field="customer" header="Customer" :sortable="true"></Column>
                    <Column field="service_date" header="Service Date" :sortable="true">
                        <template #body="slotProps">
                            {{ formatDate(slotProps.data.service_date) }}
                        </template>
                    </Column>
                    <Column field="billing_details.invoice_number" header="Invoice #" :sortable="true"></Column>
                    <Column field="billing_details.invoiced_amount" header="Invoiced Amount" :sortable="true">
                        <template #body="slotProps">
                            {{ formatCurrency(slotProps.data.billing_details.invoiced_amount) }}
                        </template>
                    </Column>
                    <Column field="status" header="Status" :sortable="true">
                        <template #body="{data}">
                            <Badge :value="data.status" :severity="data.status === 'Closed' ? 'success' : 'warning'" />
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- Ticket Details Panel -->
        <div v-if="billingStore.hasData && billingStore.billingData.length > 0" class="grid grid-cols-12 gap-6">
            <!-- Financial Summary Card -->
            <div class="col-span-12">
                <Card>
                    <template #title>
                        <div>Financial Summary</div>
                    </template>
                    <template #content>
                        <div class="grid grid-cols-12 gap-4">
                            <!-- Financial Summary -->
                            <div class="col-span-4">
                                <div class="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                    <div class="text-sm text-blue-700 mb-1">Invoiced Amount</div>
                                    <div class="text-xl font-semibold text-blue-900">
                                        {{ formatCurrency(billingStore.totalInvoicedAmount) }}
                                    </div>
                                </div>
                            </div>
                            <div class="col-span-4">
                                <div class="p-4 bg-green-50 rounded-lg border border-green-100">
                                    <div class="text-sm text-green-700 mb-1">Amount Paid</div>
                                    <div class="text-xl font-semibold text-green-900">
                                        {{ formatCurrency(billingStore.totalAmountPaid) }}
                                    </div>
                                </div>
                            </div>
                            <div class="col-span-4">
                                <div class="p-4 bg-red-50 rounded-lg border border-red-100">
                                    <div class="text-sm text-red-700 mb-1">Profit/Loss</div>
                                    <div class="text-xl font-semibold text-red-900">
                                        {{ formatCurrency(billingStore.totalProfitLoss) }}
                                    </div>
                                </div>
                            </div>

                            <!-- Billing Records Table -->
                            <div class="col-span-12 mt-4">
                                <h3 class="text-lg font-semibold mb-3">All Billing Records</h3>
                                <p class="text-sm text-gray-500 mb-2">Click on any row to view detailed information</p>
                                <DataTable :value="billingStore.billingData" 
                                          class="p-datatable-sm" responsiveLayout="scroll"
                                          selectionMode="single" @row-click="event => navigateToTicket(event.data)"
                                          :rowClass="(data) => ({'bg-blue-50': billingStore.billingData.findIndex(item => item.ticket_id === data.ticket_id) === parseInt(activeTab)})">
                                    <Column field="ticket_id" header="Ticket ID" :sortable="true">
                                        <template #body="slotProps">
                                            <a href="#" class="text-blue-600 hover:text-blue-800 hover:underline" 
                                               @click="openExternalTicket(slotProps.data.ticket_id, $event)">
                                                {{ slotProps.data.ticket_id }}
                                            </a>
                                        </template>
                                    </Column>
                                    <Column field="subject" header="Subject" :sortable="true"></Column>
                                    <Column field="billing_details.product_code" header="Product Code" :sortable="true"></Column>
                                    <Column field="billing_details.invoice_number" header="Invoice Number" :sortable="true"></Column>
                                    <Column field="billing_details.vendor.vendor_name" header="Vendor" :sortable="true"></Column>
                                    <Column field="billing_details.quantity" header="Quantity" :sortable="true"></Column>
                                    <Column field="billing_details.unit_price" header="Unit Price" :sortable="true">
                                        <template #body="slotProps">
                                            {{ formatCurrency(slotProps.data.billing_details?.unit_price) }}
                                        </template>
                                    </Column>
                                    <Column field="billing_details.invoiced_amount" header="Invoiced Amount" :sortable="true">
                                        <template #body="slotProps">
                                            {{ formatCurrency(slotProps.data.billing_details?.invoiced_amount) }}
                                        </template>
                                    </Column>
                                    <Column field="billing_details.amount_paid" header="Amount Paid" :sortable="true">
                                        <template #body="slotProps">
                                            {{ formatCurrency(slotProps.data.billing_details?.amount_paid) }}
                                        </template>
                                    </Column>
                                    <Column field="status" header="Status" :sortable="true">
                                        <template #body="{data}">
                                            <Badge :value="data.status" 
                                                   :severity="data.status === 'Closed' ? 'success' : (data.status === 'Paid' ? 'info' : 'warning')" />
                                        </template>
                                    </Column>
                                    <Column headerStyle="width: 4rem">
                                        <template #body="slotProps">
                                            <Button icon="pi pi-arrow-right" text rounded size="small" 
                                                    @click="navigateToTicket(slotProps.data)" 
                                                    aria-label="View details"
                                                    tooltip="View details" :tooltipOptions="{ position: 'top' }" />
                                        </template>
                                    </Column>
                                </DataTable>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
            
            <!-- Ticket Info Panel -->
            <div class="col-span-12">
                <Card>
                    <template #title>
                        <div class="flex items-center gap-2">
                            <span>Ticket Details</span>
                        </div>
                    </template>
                    <template #content>
                        <!-- Tabbed Ticket View -->
                        <Tabs v-model:value="activeTab">
                            <TabList>
                                <Tab v-for="(ticket, index) in billingStore.billingData" 
                                     :key="ticket.ticket_id" 
                                     :value="index.toString()">
                                    #{{ticket.ticket_id}} - {{ticket.status}}
                                </Tab>
                            </TabList>
                            <TabPanels>
                                <TabPanel v-for="(ticket, index) in billingStore.billingData" 
                                          :key="ticket.ticket_id" 
                                          :value="index.toString()">
                                    <div class="grid grid-cols-12 gap-6">
                                        <!-- Header with ticket info -->
                                        <div class="col-span-12">
                                            <div class="flex items-center gap-2 mb-2">
                                                <h3 class="text-xl font-semibold">{{ ticket.subject }}</h3>
                                                <a href="#" class="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium" 
                                                   @click="openExternalTicket(ticket.ticket_id, $event)">
                                                    #{{ ticket.ticket_id }}
                                                </a>
                                            </div>
                                            <div class="flex flex-wrap gap-2 mb-4">
                                                <Badge :value="ticket.status" 
                                                       :severity="ticket.status === 'Closed' ? 'success' : (ticket.status === 'Paid' ? 'info' : 'warning')" />
                                                <Badge :value="ticket.ticket_type" severity="secondary" />
                                                <Badge :value="ticket.ticket_category" severity="secondary" />
                                            </div>
                                        </div>

                                        <!-- Basic Info -->
                                        <div class="col-span-12 sm:col-span-6 lg:col-span-3 flex items-start">
                                            <i class="pi pi-calendar mr-2 mt-1 text-gray-500"></i>
                                            <div>
                                                <div class="text-sm text-gray-500">Service Date</div>
                                                <div>{{ formatDate(ticket.service_date) || 'Not specified' }}</div>
                                            </div>
                                        </div>

                                        <div class="col-span-12 sm:col-span-6 lg:col-span-3 flex items-start">
                                            <i class="pi pi-map-marker mr-2 mt-1 text-gray-500"></i>
                                            <div>
                                                <div class="text-sm text-gray-500">Location</div>
                                                <div>{{ ticket.city ? `${ticket.city}, ${ticket.state}` : 'Not specified' }}</div>
                                                <div class="text-xs text-gray-400">Location ID: {{ ticket.location_id }}</div>
                                            </div>
                                        </div>

                                        <div class="col-span-12 sm:col-span-6 lg:col-span-3 flex items-start">
                                            <i class="pi pi-briefcase mr-2 mt-1 text-gray-500"></i>
                                            <div>
                                                <div class="text-sm text-gray-500">Department</div>
                                                <div>{{ ticket.department }}</div>
                                            </div>
                                        </div>

                                        <div class="col-span-12 sm:col-span-6 lg:col-span-3 flex items-start">
                                            <i class="pi pi-users mr-2 mt-1 text-gray-500"></i>
                                            <div>
                                                <div class="text-sm text-gray-500">Customer & Project</div>
                                                <div>Customer ID: {{ ticket.customer }}</div>
                                                <div class="text-xs text-gray-400">Project ID: {{ ticket.project_id || 'Not specified' }}</div>
                                            </div>
                                        </div>

                                        <!-- Billing Details -->
                                        <div class="col-span-12 mt-4">
                                            <h4 class="text-lg font-semibold mb-2">Billing Details</h4>
                                            <div class="p-3 bg-gray-50 rounded-lg">
                                                <div class="grid grid-cols-12 gap-x-4 gap-y-2">
                                                    <div class="col-span-3">
                                                        <span class="text-xs text-gray-500 block">Invoice Number</span>
                                                        <span class="font-medium">{{ ticket.billing_details?.invoice_number || 'N/A' }}</span>
                                                    </div>
                                                    <div class="col-span-3">
                                                        <span class="text-xs text-gray-500 block">Product Code</span>
                                                        <span class="font-medium">{{ ticket.billing_details?.product_code || 'N/A' }}</span>
                                                    </div>
                                                    <div class="col-span-2">
                                                        <span class="text-xs text-gray-500 block">Quantity</span>
                                                        <span class="font-medium">{{ ticket.billing_details?.quantity || 'N/A' }}</span>
                                                    </div>
                                                    <div class="col-span-2">
                                                        <span class="text-xs text-gray-500 block">Unit Price</span>
                                                        <span class="font-medium">{{ formatCurrency(ticket.billing_details?.unit_price) }}</span>
                                                    </div>
                                                    <div class="col-span-1">
                                                        <span class="text-xs text-blue-700 block">Invoiced</span>
                                                        <span class="font-medium text-blue-900">{{ formatCurrency(ticket.billing_details?.invoiced_amount) }}</span>
                                                    </div>
                                                    <div class="col-span-1">
                                                        <span class="text-xs text-green-700 block">Paid</span>
                                                        <span class="font-medium text-green-900">{{ formatCurrency(ticket.billing_details?.amount_paid) }}</span>
                                                    </div>
                                                    <div class="col-span-12 mt-1">
                                                        <span class="text-xs text-gray-500 block">Description</span>
                                                        <span>{{ ticket.billing_details?.invoice_description || 'No description available' }}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Vendor Information -->
                                        <div class="col-span-12 mt-4">
                                            <h4 class="text-lg font-semibold mb-2">Vendor Information</h4>
                                            <div class="p-3 bg-gray-50 rounded-lg">
                                                <div class="grid grid-cols-12 gap-x-4 gap-y-2">
                                                    <!-- Vendor Basic Info -->
                                                    <div class="col-span-3">
                                                        <span class="text-xs text-gray-500 block">Vendor ID</span>
                                                        <span class="font-medium">{{ ticket.billing_details?.vendor?.vendor_id || 'N/A' }}</span>
                                                    </div>
                                                    <div class="col-span-3">
                                                        <span class="text-xs text-gray-500 block">Vendor Name</span>
                                                        <span class="font-medium">{{ ticket.billing_details?.vendor?.vendor_name || 'N/A' }}</span>
                                                    </div>
                                                    <div class="col-span-3">
                                                        <span class="text-xs text-gray-500 block">Currency</span>
                                                        <span class="font-medium">{{ ticket.billing_details?.vendor?.currency_code || 'USD' }}</span>
                                                    </div>
                                                    <div class="col-span-3">
                                                        <span class="text-xs text-gray-500 block">Balance</span>
                                                        <span class="font-medium">{{ formatCurrency(ticket.billing_details?.vendor?.balance) }}</span>
                                                    </div>
                                                    
                                                    <!-- Divider -->
                                                    <div class="col-span-12 border-t border-gray-200 my-2"></div>
                                                    
                                                    <!-- Tax and Address -->
                                                    <div class="col-span-7">
                                                        <span class="text-xs text-gray-500 font-medium mb-1 block">Tax Information</span>
                                                        <div class="flex gap-4 text-sm">
                                                            <div>
                                                                <span class="text-xs text-gray-500">Tax Registration:</span>
                                                                <span class="ml-1">{{ ticket.billing_details?.vendor?.tax_information?.tax_registration_number || 'Not provided' }}</span>
                                                            </div>
                                                            <div>
                                                                <span class="text-xs text-gray-500">IRS 1099 Code:</span>
                                                                <span class="ml-1">{{ ticket.billing_details?.vendor?.tax_information?.irs1099_code || 'N/A' }}</span>
                                                            </div>
                                                            <div>
                                                                <span class="text-xs text-gray-500">Tax Liable:</span>
                                                                <span class="ml-1">{{ ticket.billing_details?.vendor?.tax_information?.tax_liable ? 'Yes' : 'No' }}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div class="col-span-5">
                                                        <span class="text-xs text-gray-500 font-medium mb-1 block">Address</span>
                                                        <div v-if="ticket.billing_details?.vendor?.address" class="text-sm">
                                                            {{ ticket.billing_details.vendor.address.line1 || '' }}
                                                            {{ ticket.billing_details.vendor.address.line2 || '' }}
                                                            {{ ticket.billing_details.vendor.address.city || '' }},
                                                            {{ ticket.billing_details.vendor.address.state || '' }} 
                                                            {{ ticket.billing_details.vendor.address.postal_code || '' }}
                                                            {{ ticket.billing_details.vendor.address.country || '' }}
                                                        </div>
                                                        <div v-else class="text-sm">No address information available.</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Ticket Posts -->
                                        <div class="col-span-12 mt-4">
                                            <h4 class="text-lg font-semibold mb-3">Ticket Posts</h4>
                                            <div class="grid grid-cols-12 gap-4">
                                                <div class="col-span-12 md:col-span-6">
                                                    <div class="text-sm text-gray-500 mb-1">Initial Request</div>
                                                    <div class="p-3 bg-gray-50 rounded-lg text-gray-700 whitespace-pre-line">
                                                        {{ ticket.first_post_content || 'No initial request information available.' }}
                                                    </div>
                                                </div>
                                                <div class="col-span-12 md:col-span-6">
                                                    <div class="text-sm text-gray-500 mb-1">Latest Update</div>
                                                    <div class="p-3 bg-gray-50 rounded-lg text-gray-700 whitespace-pre-line">
                                                        {{ ticket.last_post_content || 'No updates available.' }}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="isSearching" class="flex flex-col items-center justify-center my-12">
            <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
            <div class="mt-4 text-gray-600">Loading billing data...</div>
        </div>

        <!-- No Data State -->
        <div v-if="!billingStore.hasData && !isSearching && billingStore.error" class="flex flex-col items-center justify-center my-12 text-center">
            <i class="pi pi-exclamation-triangle text-5xl text-yellow-500 mb-4"></i>
            <h2 class="text-xl font-semibold mb-2">No Data Found</h2>
            <p class="text-gray-600 max-w-md">{{ billingStore.error }}</p>
        </div>
    </div>
</template>

<style scoped>
.text-secondary {
    color: var(--text-color-secondary);
}

/* Make table rows appear clickable */
:deep(.p-datatable .p-datatable-tbody > tr) {
    cursor: pointer;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
    background-color: var(--surface-hover);
}

/* Improve tab panel styling */
:deep(.p-tabview-nav-link) {
    padding: 1rem 1.5rem;
}

:deep(.p-tabview-panels) {
    padding: 1.5rem 0;
}

/* Allow pre-line formatting for ticket content */
.whitespace-pre-line {
    white-space: pre-line;
}
</style> 