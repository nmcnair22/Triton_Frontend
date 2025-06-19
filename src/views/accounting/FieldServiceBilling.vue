<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useBillingStore } from '@/stores/billingStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useDispatchStore } from '@/stores/dispatchStore';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { useDateFormatting } from '@/composables/useDateFormatting';

// Components - using PrimeVue 4 component names
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import SelectButton from 'primevue/selectbutton';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import Checkbox from 'primevue/checkbox';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Badge from 'primevue/badge';
import ProgressSpinner from 'primevue/progressspinner';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';
import Message from 'primevue/message';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import ColumnGroup from 'primevue/columngroup';
import Row from 'primevue/row';

// Modal Components
import InvoiceDetailModal from '@/components/modals/InvoiceDetailModal.vue';
import PurchaseDetailModal from '@/components/modals/PurchaseDetailModal.vue';

// Initialize stores
const billingStore = useBillingStore();
const customerStore = useCustomerStore();
const dispatchStore = useDispatchStore();
const confirm = useConfirm();
const toast = useToast();

// Form state
const ticketInput = ref('');
const isSearching = ref(false);
const activeTab = ref('0');

// Customer and location selection
const selectedCustomer = ref(null);
const selectedLocation = ref(null);
const useLocationFilter = ref(false); // Checkbox to enable/disable location filtering
const isLoadingCustomers = computed(() => customerStore.loading);
const isLoadingLocations = computed(() => dispatchStore.loading);

// Date range selection
const selectedDateRange = ref({ label: 'This Week', value: 'thisWeek' });
const customDateRange = ref([]);
const showCustomDatePicker = computed(() => selectedDateRange.value?.value === 'custom');

// Turnup search state
const isSearchingTurnups = ref(false);
const turnupSearchError = ref(null);

// Dynamics modal state
const showDynamicsModal = ref(false);
const selectedTicketForDynamics = ref(null);

// Modal state for detailed views
const showInvoiceDetailModal = ref(false);
const showPurchaseDetailModal = ref(false);
const selectedInvoiceNumber = ref(null);
const selectedDocumentNumber = ref(null);

// View options
const viewOptions = [
    { label: 'Payables', value: 'payables' },
    { label: 'Receivables', value: 'receivables' }
];

// Date formatting composable
const { safeDate, formatDateTime, isEpochDate } = useDateFormatting();

// Format date values with safe handling for Unix epoch dates
function formatDate(dateString) {
    return safeDate(dateString);
}

// Format currency values
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value || 0);
}

// Comparison mode toggle
const comparisonMode = ref('single'); // 'single' or 'group'

// Computed properties for comparison data
const singleTicketDynamicsData = computed(() => {
    if (!selectedTicketForDynamics.value || !billingStore.dynamicsData?.length) return null;
    
    // Find Dynamics records that match the selected ticket ID
    const matchingTicket = billingStore.dynamicsData?.find(ticket => 
        ticket.ticket_id === selectedTicketForDynamics.value.ticket_id ||
        ticket.cis_id === selectedTicketForDynamics.value.ticket_id ||
        ticket.cisid === selectedTicketForDynamics.value.ticket_id
    );
    
    return matchingTicket || null;
});

const originalDataSummary = computed(() => {
    if (comparisonMode.value === 'single' && selectedTicketForDynamics.value) {
        // Single ticket data
        return {
            invoiced_amount: selectedTicketForDynamics.value.billing_details?.invoiced_amount || 0,
            amount_paid: selectedTicketForDynamics.value.billing_details?.amount_paid || 0,
            net_profit: (selectedTicketForDynamics.value.billing_details?.invoiced_amount || 0) - (selectedTicketForDynamics.value.billing_details?.amount_paid || 0),
            ticket_count: 1,
            invoice_number: selectedTicketForDynamics.value.billing_details?.invoice_number,
            product_code: selectedTicketForDynamics.value.billing_details?.product_code,
            quantity: selectedTicketForDynamics.value.billing_details?.quantity
        };
    } else {
        // Group data - all billing records
        const totalInvoiced = billingStore.billingData.reduce((sum, ticket) => sum + (ticket.billing_details?.invoiced_amount || 0), 0);
        const totalPaid = billingStore.billingData.reduce((sum, ticket) => sum + (ticket.billing_details?.amount_paid || 0), 0);
        
        return {
            invoiced_amount: totalInvoiced,
            amount_paid: totalPaid,
            net_profit: totalInvoiced - totalPaid,
            ticket_count: billingStore.billingData.length,
            invoice_number: 'Multiple',
            product_code: 'Multiple',
            quantity: 'Multiple'
        };
    }
});

const dynamicsDataSummary = computed(() => {
    if (comparisonMode.value === 'single' && singleTicketDynamicsData.value) {
        // Single ticket Dynamics data
        const ticket = singleTicketDynamicsData.value;
        return {
            total_receivables: ticket.summary?.total_receivables_amount || 0,
            total_payables: ticket.summary?.total_payables_amount || 0,
            net_profit: (ticket.summary?.total_receivables_amount || 0) - (ticket.summary?.total_payables_amount || 0),
            ticket_count: 1,
            receivables_count: ticket.summary?.receivables_count || 0,
            payables_count: ticket.summary?.payables_count || 0
        };
    } else {
        // Group data - all Dynamics records
        const totalReceivables = billingStore.dynamicsData ? billingStore.dynamicsData.reduce((sum, ticket) => sum + (ticket.summary?.total_receivables_amount || 0), 0) : 0;
        const totalPayables = billingStore.dynamicsData ? billingStore.dynamicsData.reduce((sum, ticket) => sum + (ticket.summary?.total_payables_amount || 0), 0) : 0;
        
        return {
            total_receivables: totalReceivables,
            total_payables: totalPayables,
            net_profit: totalReceivables - totalPayables,
            ticket_count: billingStore.dynamicsData?.length || 0,
            receivables_count: billingStore.dynamicsData ? billingStore.dynamicsData.reduce((sum, ticket) => sum + (ticket.summary?.receivables_count || 0), 0) : 0,
            payables_count: billingStore.dynamicsData ? billingStore.dynamicsData.reduce((sum, ticket) => sum + (ticket.summary?.payables_count || 0), 0) : 0
        };
    }
});

const varianceAnalysis = computed(() => {
    const original = originalDataSummary.value;
    const dynamics = dynamicsDataSummary.value;
    
    const revenueVariance = dynamics.total_receivables - original.invoiced_amount;
    const costVariance = dynamics.total_payables - original.amount_paid;
    const netVariance = dynamics.net_profit - original.net_profit;
    
    return {
        revenue: {
            amount: revenueVariance,
            percentage: original.invoiced_amount > 0 ? (revenueVariance / original.invoiced_amount * 100) : 0
        },
        cost: {
            amount: costVariance,
            percentage: original.amount_paid > 0 ? (costVariance / original.amount_paid * 100) : 0
        },
        net: {
            amount: netVariance,
            percentage: Math.abs(original.net_profit) > 0 ? (netVariance / Math.abs(original.net_profit) * 100) : 0
        }
    };
});

// Computed properties
const customers = computed(() => customerStore.customers);
const customerLocations = computed(() => dispatchStore.customerLocations);
const dateRangeOptions = computed(() => dispatchStore.dateRangeOptions);

// Local reactive reference for turnups to break reactive chain that causes recursive updates
const turnups = ref([]);

// Combined accounting records for the new unified table
const combinedAccountingRecords = computed(() => {
    if (!billingStore.hasData || !billingStore.billingData.length) return [];
    
    console.log('combinedAccountingRecords - billingData:', billingStore.billingData);
    
    const records = [];
    
    billingStore.billingData.forEach(ticket => {
        console.log('Processing ticket:', ticket);
        // Add receivable record if there's invoiced amount
        if (ticket.billing_details?.invoiced_amount && ticket.billing_details.invoiced_amount > 0) {
            records.push({
                ...ticket,
                category: 'Receivable',
                amount: ticket.billing_details.invoiced_amount,
                description: ticket.billing_details?.invoice_description || ticket.subject,
                invoice_number: ticket.billing_details?.invoice_number,
                product_code: ticket.billing_details?.product_code,
                vendor_name: ticket.billing_details?.vendor?.vendor_name,
                record_type: 'receivable'
            });
        }
        
        // Add payable record if there's amount paid
        if (ticket.billing_details?.amount_paid && ticket.billing_details.amount_paid > 0) {
            records.push({
                ...ticket,
                category: 'Payable',
                amount: ticket.billing_details.amount_paid,
                description: ticket.billing_details?.invoice_description || ticket.subject,
                invoice_number: ticket.billing_details?.invoice_number,
                product_code: ticket.billing_details?.product_code,
                vendor_name: ticket.billing_details?.vendor?.vendor_name,
                record_type: 'payable'
            });
        }
    });
    
    return records;
});

// Computed properties for financial summary (original billing data)
const totalReceivables = computed(() => {
    return combinedAccountingRecords.value
        .filter(record => record.category === 'Receivable')
        .reduce((sum, record) => sum + (record.amount || 0), 0);
});

const totalPayables = computed(() => {
    return combinedAccountingRecords.value
        .filter(record => record.category === 'Payable')
        .reduce((sum, record) => sum + (record.amount || 0), 0);
});

// Computed properties for Dynamics data (for the conditional styling)
const dynamicsTotalReceivables = computed(() => {
    return billingStore.dynamicsData ? billingStore.dynamicsData.reduce((sum, ticket) => sum + (ticket.summary?.total_receivables_amount || 0), 0) : 0;
});

const dynamicsTotalPayables = computed(() => {
    return billingStore.dynamicsData ? billingStore.dynamicsData.reduce((sum, ticket) => sum + (ticket.summary?.total_payables_amount || 0), 0) : 0;
});

const netProfitLoss = computed(() => {
    return dynamicsTotalReceivables.value - dynamicsTotalPayables.value;
});

// Net profit/loss for original billing data (for the main Financial Summary cards)
const originalNetProfitLoss = computed(() => {
    return totalReceivables.value - totalPayables.value;
});

// Watch for customer selection to load locations
watch(selectedCustomer, async (newCustomer) => {
    selectedLocation.value = null;
    
    if (newCustomer) {
        try {
            await dispatchStore.fetchCustomerLocations({
                customer_id: newCustomer.number,
                limit: 100
            });
        } catch (error) {
            console.error('Error loading customer locations:', error);
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load customer locations',
                life: 3000
            });
        }
    }
});

// Watch for location filter checkbox changes
watch(useLocationFilter, (newValue) => {
    if (!newValue) {
        // Clear selected location when checkbox is unchecked
        selectedLocation.value = null;
    }
});

// Load customers on mount
onMounted(async () => {
    try {
        await customerStore.fetchActiveCustomers();
    } catch (error) {
        console.error('Error loading customers:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load customers',
            life: 3000
        });
    }
});

// Get status severity for tags
function getStatusSeverity(status) {
    switch (status?.toLowerCase()) {
        case 'open': return 'info';
        case 'completed': return 'success';
        case 'in progress': return 'warning';
        case 'cancelled': return 'danger';
        default: return 'secondary';
    }
}

// Handle search submission (existing ticket search)
async function searchTicket() {
    if (!ticketInput.value || ticketInput.value.trim() === '') {
        toast.add({ severity: 'warn', summary: 'Input Required', detail: 'Please enter a ticket number', life: 3000 });
        return;
    }

    await performTicketSearch(ticketInput.value.trim());
}

// Perform ticket search (shared function)
async function performTicketSearch(ticketId) {
    isSearching.value = true;
    try {
        await billingStore.fetchBillingDataByTicket(ticketId);
        
        if (billingStore.error) {
            if (billingStore.hasData) {
                toast.add({ 
                    severity: 'info', 
                    summary: 'Partial Data Retrieved', 
                    detail: billingStore.error,
                    life: 5000 
                });
            } else {
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
            toast.add({ 
                severity: 'success', 
                summary: 'Data Retrieved', 
                detail: `Found ${billingStore.billingData.length} billing records`, 
                life: 3000 
            });
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

// Search turnups based on filters
async function searchTurnups() {
    if (!selectedCustomer.value) {
        toast.add({
            severity: 'warn',
            summary: 'Customer Required',
            detail: 'Please select a customer to search for turnups',
            life: 3000
        });
        return;
    }

    isSearchingTurnups.value = true;
    turnupSearchError.value = null;

    try {
        // Build filters
        const filters = {
            customer_id: selectedCustomer.value.number,
            limit: 50
        };

        // Add location filter if selected and checkbox is enabled
        if (useLocationFilter.value && selectedLocation.value) {
            filters.location_id = selectedLocation.value.location_id;
        }

        // Add date range filter
        if (selectedDateRange.value?.value === 'custom' && customDateRange.value?.length === 2) {
            filters.start_date = customDateRange.value[0].toISOString().split('T')[0];
            filters.end_date = customDateRange.value[1].toISOString().split('T')[0];
        } else if (selectedDateRange.value?.value !== 'custom') {
            const dateRange = dispatchStore.calculateDateRange(selectedDateRange.value.value);
            if (dateRange) {
                filters.start_date = dateRange.start_date;
                filters.end_date = dateRange.end_date;
            }
        }

        const result = await dispatchStore.fetchTurnups(filters);
        
        // Update local turnups to break reactive chain and freeze objects for performance
        turnups.value = (result.turnups || []).map(turnup => Object.freeze(turnup));
        
        if (turnups.value.length > 0) {
            toast.add({
                severity: 'success',
                summary: 'Turnups Found',
                detail: `Found ${turnups.value.length} turnup tickets`,
                life: 3000
            });
        } else {
            toast.add({
                severity: 'info',
                summary: 'No Results',
                detail: 'No turnup tickets found for the selected criteria',
                life: 3000
            });
        }
    } catch (error) {
        console.error('Error searching turnups:', error);
        turnupSearchError.value = error.message || 'Failed to search turnups';
        toast.add({
            severity: 'error',
            summary: 'Search Error',
            detail: turnupSearchError.value,
            life: 3000
        });
    } finally {
        isSearchingTurnups.value = false;
    }
}

// Handle turnup ticket selection
function selectTurnupTicket(turnup) {
    ticketInput.value = turnup.id.toString();
    performTicketSearch(turnup.id.toString());
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

// Generate ticket URL for external system
function getTicketUrl(ticketId) {
    return `https://staff.cis.us/ticketing/ticket/${ticketId}`;
}

// Open ticket in external system
function openExternalTicket(ticketId, event) {
    if (event) {
        event.stopPropagation();
    }
    window.open(getTicketUrl(ticketId), '_blank');
}

// Debug function to see what data is being passed to the modal
function debugAndOpenDynamicsModal(ticket) {
    console.log('=== DYNAMICS MODAL DEBUG ===');
    console.log('Full ticket data object:', ticket);
    console.log('ticket.ticket_id:', ticket.ticket_id);
    console.log('ticket.id:', ticket.id);
    console.log('ticket.billing_details:', ticket.billing_details);
    console.log('ticket.category:', ticket.category);
    console.log('ticket.record_type:', ticket.record_type);
    console.log('All ticket properties:', Object.keys(ticket));
    
    console.log('=== BILLING STORE STATE ===');
    console.log('billingStore.hasData:', billingStore.hasData);
    console.log('billingStore.billingData length:', billingStore.billingData.length);
    console.log('billingStore.currentTicket:', billingStore.currentTicket);
    console.log('billingStore.billingData:', billingStore.billingData);
    console.log('combinedAccountingRecords length:', combinedAccountingRecords.value.length);
    console.log('=== END DEBUG ===');
    
    // Call the original function
    openDynamicsModal(ticket);
}

// New function to open Dynamics modal
async function openDynamicsModal(ticket) {
    selectedTicketForDynamics.value = ticket;
    showDynamicsModal.value = true;
    
    // Fetch Dynamics data for this ticket
    try {
        await billingStore.fetchDynamicsData(ticket.ticket_id);
        
        if (billingStore.dynamicsError) {
            toast.add({
                severity: 'warn',
                summary: 'Limited Data',
                detail: billingStore.dynamicsError,
                life: 5000
            });
        } else if (billingStore.dynamicsData?.length === 0) {
            toast.add({
                severity: 'info',
                summary: 'No Dynamics Data',
                detail: 'No accounting records found in Dynamics 365 for this ticket',
                life: 3000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load Dynamics 365 data',
            life: 3000
        });
    }
}

// Close Dynamics modal
function closeDynamicsModal() {
    showDynamicsModal.value = false;
    selectedTicketForDynamics.value = null;
}

// Function to handle invoice number click
async function onInvoiceNumberClick(invoiceNumber) {
    if (!invoiceNumber) return;
    
    selectedInvoiceNumber.value = invoiceNumber;
    showInvoiceDetailModal.value = true;
    
    try {
        await billingStore.fetchDetailedInvoiceData(invoiceNumber);
        
        if (billingStore.detailedInvoiceError) {
            toast.add({
                severity: 'warn',
                summary: 'Limited Data',
                detail: billingStore.detailedInvoiceError,
                life: 5000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load detailed invoice data',
            life: 3000
        });
    }
}

// Function to handle document number click
async function onDocumentNumberClick(documentNumber) {
    if (!documentNumber) return;
    
    selectedDocumentNumber.value = documentNumber;
    showPurchaseDetailModal.value = true;
    
    try {
        await billingStore.fetchDetailedPurchaseData(documentNumber);
        
        if (billingStore.detailedPurchaseError) {
            toast.add({
                severity: 'warn',
                summary: 'Limited Data',
                detail: billingStore.detailedPurchaseError,
                life: 5000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load detailed purchase data',
            life: 3000
        });
    }
}

// Close modal functions
function closeInvoiceDetailModal() {
    showInvoiceDetailModal.value = false;
    selectedInvoiceNumber.value = null;
}

function closePurchaseDetailModal() {
    showPurchaseDetailModal.value = false;
    selectedDocumentNumber.value = null;
}
</script>

<template>
    <div class="field-service-billing">
        <h1 class="text-3xl font-bold mb-4">Field Service Billing Analysis</h1>
        <p class="text-gray-600 mb-8">Enter a ticket number or search for turnup tickets to retrieve and analyze billing data</p>

        <!-- Search Panel with Accordion -->
        <Card class="mb-8">
            <template #content>
                <!-- Direct Ticket ID Entry -->
                <div class="flex flex-col gap-2 mb-6">
                    <label for="ticketInput" class="font-medium">Enter Ticket ID:</label>
                    <div class="flex flex-col sm:flex-row gap-4">
                        <InputGroup class="flex-grow">
                            <InputGroupAddon>
                                <i class="pi pi-search"></i>
                            </InputGroupAddon>
                            <InputText 
                                id="ticketInput" 
                                v-model="ticketInput" 
                                placeholder="Enter ticket number..." 
                                class="w-full" 
                                @keyup.enter="searchTicket" />
                        </InputGroup>
                        <Button 
                            label="Search" 
                            icon="pi pi-search" 
                            @click="searchTicket" 
                            :loading="isSearching" 
                            class="min-w-20" />
                    </div>
                    <small class="text-gray-500">
                        Enter one or more ticket IDs separated by commas to analyze multiple tickets at once.
                    </small>
                </div>

                <!-- Accordion for Advanced Search -->
                <Accordion>
                    <AccordionPanel value="0">
                        <AccordionHeader>
                            <i class="pi pi-search-plus mr-2"></i>
                            Find Ticket ID
                        </AccordionHeader>
                        <AccordionContent>
                            <!-- Row 1: Customer and Date Range -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <!-- Customer Selector -->
                                <div class="flex flex-col gap-2">
                                    <label for="customerSelect" class="font-medium">Customer:</label>
                                    <Select
                                        id="customerSelect"
                                        v-model="selectedCustomer"
                                        :options="customers"
                                        optionLabel="name"
                                        placeholder="Select Customer"
                                        filter
                                        :disabled="isLoadingCustomers"
                                        class="w-full"
                                        :loading="isLoadingCustomers">
                                        <template #option="slotProps">
                                            <div class="flex items-center">
                                                <div>
                                                    <div class="font-medium">{{ slotProps.option.name }}</div>
                                                    <div class="text-sm text-gray-500">ID: {{ slotProps.option.id }}</div>
                                                </div>
                                            </div>
                                        </template>
                                    </Select>
                                </div>

                                <!-- Date Range Selector -->
                                <div class="flex flex-col gap-2">
                                    <label for="dateRangeSelect" class="font-medium">Date Range:</label>
                                    <Select
                                        id="dateRangeSelect"
                                        v-model="selectedDateRange"
                                        :options="dateRangeOptions"
                                        optionLabel="label"
                                        placeholder="Select Date Range"
                                        class="w-full" />
                                </div>
                            </div>

                            <!-- Row 2: Location with Checkbox -->
                            <div class="mb-4">
                                <label for="locationSelect" class="font-medium mb-2 block">Location (Optional):</label>
                                <div class="flex gap-4 items-start">
                                    <!-- Location Selector -->
                                    <div class="flex-1">
                                        <Select
                                            id="locationSelect"
                                            v-model="selectedLocation"
                                            :options="customerLocations"
                                            optionLabel="location_name"
                                            placeholder="Select Location"
                                            filter
                                            :disabled="!useLocationFilter || !selectedCustomer || isLoadingLocations"
                                            class="w-full"
                                            :loading="isLoadingLocations">
                                            <template #option="slotProps">
                                                <div class="flex flex-col">
                                                    <div class="font-medium">{{ slotProps.option.location_name }}</div>
                                                    <div class="text-sm text-gray-500">{{ slotProps.option.full_address }}</div>
                                                </div>
                                            </template>
                                        </Select>
                                        <small class="text-gray-500 block mt-1">
                                            {{ useLocationFilter ? 'Select a location to filter results' : 'Check the box to enable location filtering' }}
                                        </small>
                                    </div>
                                    
                                    <!-- Checkbox to the right -->
                                    <div class="flex items-center gap-2 mt-1">
                                        <Checkbox 
                                            id="useLocationFilter" 
                                            v-model="useLocationFilter" 
                                            :binary="true" />
                                        <label for="useLocationFilter" class="text-sm cursor-pointer whitespace-nowrap">
                                            Filter by specific location
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <!-- Row 3: Custom Date Range Picker -->
                            <div v-if="showCustomDatePicker" class="mb-4">
                                <label class="font-medium mb-2 block">Custom Date Range:</label>
                                <DatePicker
                                    v-model="customDateRange"
                                    selectionMode="range"
                                    :manualInput="false"
                                    dateFormat="mm/dd/yy"
                                    placeholder="Select date range"
                                    class="w-full md:w-80" />
                            </div>

                            <!-- Search Button -->
                            <div class="flex justify-between items-center">
                                <Button
                                    label="Search Turnups"
                                    icon="pi pi-search"
                                    @click="searchTurnups"
                                    :loading="isSearchingTurnups"
                                    :disabled="!selectedCustomer"
                                    class="mb-4" />
                                
                                <div v-if="turnups.length > 0" class="text-sm text-gray-600">
                                    Found {{ turnups.length }} turnup tickets
                                    <span v-if="useLocationFilter && selectedLocation" class="text-blue-600">
                                        (filtered by {{ selectedLocation.location_name }})
                                    </span>
                                </div>
                            </div>

                            <!-- Error Message -->
                            <Message v-if="turnupSearchError" severity="error" class="mb-4">
                                {{ turnupSearchError }}
                            </Message>

                            <!-- Turnups DataTable -->
                            <div v-if="turnups.length > 0">
                                <h6 class="text-lg font-semibold mb-3">Turnup Tickets</h6>
                                <DataTable
                                    :value="turnups"
                                    :paginator="turnups.length > 10"
                                    :rows="10"
                                    dataKey="id"
                                    class="p-datatable-sm"
                                    responsiveLayout="scroll"
                                    selectionMode="single"
                                    @row-click="selectTurnupTicket($event.data)">
                                    
                                    <Column field="id" header="Ticket ID" :sortable="true">
                                        <template #body="slotProps">
                                            <Button
                                                :label="slotProps.data.id.toString()"
                                                link
                                                class="p-0 text-blue-600 hover:text-blue-800"
                                                @click="selectTurnupTicket(slotProps.data)" />
                                        </template>
                                    </Column>
                                    
                                    <Column field="subject" header="Subject" :sortable="true">
                                        <template #body="slotProps">
                                            <div class="max-w-xs truncate" :title="slotProps.data.subject">
                                                {{ slotProps.data.subject }}
                                            </div>
                                        </template>
                                    </Column>
                                    
                                    <Column field="service_date" header="Service Date" :sortable="true">
                                        <template #body="slotProps">
                                            {{ formatDate(slotProps.data.service_date) }}
                                        </template>
                                    </Column>
                                    
                                    <Column field="status" header="Status" :sortable="true">
                                        <template #body="slotProps">
                                            <Tag 
                                                :value="slotProps.data.status" 
                                                :severity="getStatusSeverity(slotProps.data.status)" />
                                        </template>
                                    </Column>
                                    
                                    <Column field="location.name" header="Location" :sortable="true">
                                        <template #body="slotProps">
                                            <div v-if="slotProps.data.location">
                                                <div class="font-medium">{{ slotProps.data.location.name }}</div>
                                                <div class="text-sm text-gray-500">{{ slotProps.data.location.city }}, {{ slotProps.data.location.state }}</div>
                                            </div>
                                        </template>
                                    </Column>
                                    
                                    <Column field="technician" header="Technician" :sortable="true">
                                        <template #body="slotProps">
                                            {{ slotProps.data.technician || 'Not assigned' }}
                                        </template>
                                    </Column>
                                </DataTable>
                            </div>
                        </AccordionContent>
                    </AccordionPanel>
                </Accordion>
            </template>
        </Card>

        <!-- Results Panel -->
        <Card v-if="billingStore.hasData" class="mb-8">
            <template #title>
                <div class="flex justify-between items-center">
                    <span>Financial Summary</span>
                    <Button icon="pi pi-file-export" label="Export" severity="secondary" text raised @click="exportData" />
                </div>
            </template>
            <template #content>
                <div class="grid grid-cols-12 gap-4 mb-6">
                    <!-- Financial Summary Cards -->
                    <div class="col-span-4">
                        <div class="p-4 bg-green-50 rounded-lg border border-green-100">
                            <div class="text-sm text-green-700 mb-1">Total Receivables</div>
                            <div class="text-xl font-semibold text-green-900">
                                {{ formatCurrency(totalReceivables) }}
                            </div>
                        </div>
                    </div>
                    <div class="col-span-4">
                        <div class="p-4 bg-red-50 rounded-lg border border-red-100">
                            <div class="text-sm text-red-700 mb-1">Total Payables</div>
                            <div class="text-xl font-semibold text-red-900">
                                {{ formatCurrency(totalPayables) }}
                            </div>
                        </div>
                    </div>
                    <div class="col-span-4">
                        <div class="p-4 rounded-lg border" 
                             :class="originalNetProfitLoss >= 0 
                                     ? 'border-2 border-emerald-300 dark:border-emerald-700 bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30' 
                                     : 'border-2 border-red-400 dark:border-red-700 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-900/30'">
                            <div class="flex items-center gap-2 mb-1">
                                <i class="pi text-sm"
                                   :class="originalNetProfitLoss >= 0 
                                           ? 'pi-trending-up text-emerald-700 dark:text-emerald-400' 
                                           : 'pi-trending-down text-red-700 dark:text-red-400'"></i>
                                <div class="text-sm font-medium"
                                     :class="originalNetProfitLoss >= 0 
                                             ? 'text-emerald-700 dark:text-emerald-300' 
                                             : 'text-red-700 dark:text-red-300'">Net Profit/Loss</div>
                            </div>
                            <div class="text-xl font-bold" 
                                 :class="originalNetProfitLoss >= 0 
                                         ? 'text-emerald-900 dark:text-emerald-400' 
                                         : 'text-red-900 dark:text-red-400'">
                                {{ formatCurrency(originalNetProfitLoss) }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- All Accounting Records Table -->
                <div>
                    <h3 class="text-lg font-semibold mb-3">All Accounting Records</h3>
                    <p class="text-sm text-gray-500 mb-4">Click on any row to view detailed information</p>
                    <DataTable :value="combinedAccountingRecords" 
                              class="p-datatable-xs text-sm" 
                              responsiveLayout="scroll"
                              :paginator="combinedAccountingRecords.length > 15"
                              :rows="15"
                              sortMode="multiple"
                              removableSort
                              :globalFilterFields="['ticket_id', 'subject', 'product_code', 'vendor_name', 'category', 'description']"
                              filterDisplay="menu"
                              showGridlines>
                        
                        <Column field="ticket_id" header="Ticket ID" :sortable="true" frozen style="min-width: 100px">
                            <template #body="slotProps">
                                <a href="#" class="text-blue-600 hover:text-blue-800 hover:underline font-medium" 
                                   @click="openExternalTicket(slotProps.data.ticket_id, $event)">
                                    {{ slotProps.data.ticket_id }}
                                </a>
                            </template>
                        </Column>
                        
                        <Column field="category" header="Category" :sortable="true" style="min-width: 120px">
                            <template #body="slotProps">
                                <Tag :value="slotProps.data.category" 
                                     :severity="slotProps.data.category === 'Receivable' ? 'success' : 'danger'" />
                            </template>
                            <template #filter="{ filterModel, filterCallback }">
                                <Select v-model="filterModel.value" 
                                       @change="filterCallback()" 
                                       :options="[{label: 'Receivable', value: 'Receivable'}, {label: 'Payable', value: 'Payable'}]" 
                                       optionLabel="label" 
                                       optionValue="value"
                                       placeholder="All Categories" 
                                       :showClear="true" />
                            </template>
                        </Column>
                        
                        <Column field="subject" header="Subject" :sortable="true" style="min-width: 200px">
                            <template #body="slotProps">
                                <div class="max-w-xs truncate" :title="slotProps.data.subject">
                                    {{ slotProps.data.subject }}
                                </div>
                            </template>
                            <template #filter="{ filterModel, filterCallback }">
                                <InputText v-model="filterModel.value" 
                                          @input="filterCallback()" 
                                          placeholder="Search subject" />
                            </template>
                        </Column>
                        
                        <Column field="product_code" header="Product Code" :sortable="true" style="min-width: 120px">
                            <template #filter="{ filterModel, filterCallback }">
                                <InputText v-model="filterModel.value" 
                                          @input="filterCallback()" 
                                          placeholder="Search code" />
                            </template>
                        </Column>
                        
                        <Column field="vendor_name" header="Vendor" :sortable="true" style="min-width: 150px">
                            <template #filter="{ filterModel, filterCallback }">
                                <InputText v-model="filterModel.value" 
                                          @input="filterCallback()" 
                                          placeholder="Search vendor" />
                            </template>
                        </Column>
                        
                        <Column field="receivables" header="Receivables" :sortable="true" style="min-width: 120px">
                            <template #body="slotProps">
                                <span v-if="slotProps.data.category === 'Receivable'" class="font-semibold text-green-600">
                                    {{ formatCurrency(slotProps.data.amount) }}
                                </span>
                                <span v-else class="text-gray-400">—</span>
                            </template>
                        </Column>
                        
                        <Column field="payables" header="Payables" :sortable="true" style="min-width: 120px">
                            <template #body="slotProps">
                                <span v-if="slotProps.data.category === 'Payable'" class="font-semibold text-red-600">
                                    {{ formatCurrency(slotProps.data.amount) }}
                                </span>
                                <span v-else class="text-gray-400">—</span>
                            </template>
                        </Column>
                        
                        <Column field="service_date" header="Service Date" :sortable="true" style="min-width: 120px">
                            <template #body="slotProps">
                                {{ safeDate(slotProps.data.service_date) }}
                            </template>
                        </Column>
                        
                        <Column field="status" header="Status" :sortable="true" style="min-width: 100px">
                            <template #body="{data}">
                                <Badge :value="data.status" 
                                       :severity="data.status === 'Closed' ? 'success' : (data.status === 'Paid' ? 'info' : 'warning')" />
                            </template>
                        </Column>
                        
                        <Column headerStyle="width: 4rem" :exportable="false">
                            <template #body="slotProps">
                                <Button icon="pi pi-eye" text rounded size="small" 
                                        @click="debugAndOpenDynamicsModal(slotProps.data)" 
                                        aria-label="View Dynamics data"
                                        v-tooltip="'View Dynamics 365 data'" />
                            </template>
                        </Column>

                        <!-- Footer with totals -->
                        <ColumnGroup type="footer">
                            <Row>
                                <Column footer="Totals:" :colspan="5" footerStyle="text-align:right; font-weight: bold;" />
                                <Column footerStyle="text-align:left; font-weight: bold; color: #16a34a;">
                                    <template #footer>
                                        {{ formatCurrency(totalReceivables) }}
                                    </template>
                                </Column>
                                <Column footerStyle="text-align:left; font-weight: bold; color: #dc2626;">
                                    <template #footer>
                                        {{ formatCurrency(totalPayables) }}
                                    </template>
                                </Column>
                                <Column footer="" :colspan="3" />
                            </Row>
                        </ColumnGroup>
                    </DataTable>
                </div>
            </template>
        </Card>

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

        <!-- Dynamics 365 Data Modal -->
        <Dialog 
            v-model:visible="showDynamicsModal" 
            :style="{ width: '95vw', maxWidth: '1400px' }" 
            header="Dynamics 365 Accounting Data"
            modal
            maximizable
            @hide="closeDynamicsModal">
            
            <template #header>
                <div class="flex items-center gap-3">
                    <i class="pi pi-database text-2xl text-blue-600"></i>
                    <div>
                        <h3 class="text-xl font-semibold">Dynamics 365 Accounting Data</h3>
                        <p class="text-sm text-surface-600 dark:text-surface-400">
                            Ticket #{{ selectedTicketForDynamics?.ticket_id }} - Accounting System Records
                        </p>
                    </div>
                </div>
            </template>

            <div v-if="billingStore.dynamicsLoading" class="flex flex-col items-center justify-center py-12">
                <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
                <div class="mt-4 text-surface-600 dark:text-surface-400">Loading Dynamics 365 data...</div>
            </div>

            <div v-else-if="billingStore.dynamicsError" class="text-center py-8">
                <i class="pi pi-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
                <h4 class="text-lg font-semibold mb-2">No Dynamics Data Found</h4>
                <p class="text-surface-600 dark:text-surface-400">{{ billingStore.dynamicsError }}</p>
            </div>

            <div v-else-if="billingStore.dynamicsData && billingStore.dynamicsData.length === 0" class="text-center py-8">
                <i class="pi pi-info-circle text-4xl text-blue-500 mb-4"></i>
                <h4 class="text-lg font-semibold mb-2">No Records Found</h4>
                <p class="text-surface-600 dark:text-surface-400">No accounting records found in Dynamics 365 for this ticket.</p>
            </div>

            <div v-else-if="billingStore.dynamicsData && billingStore.dynamicsData.length > 0">
                <!-- Consolidated Summary Dashboard -->
                <div class="mb-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-semibold">Financial Summary</h3>
                        <div class="flex items-center gap-2">
                            <Badge value="Source: Dynamics 365 Business Central" severity="success" />
                            <i class="pi pi-info-circle text-blue-500" v-tooltip="'All summary data below comes from the Dynamics 365 accounting system'"></i>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <!-- Total Receivables -->
                        <Card class="shadow-sm border border-green-200 dark:border-green-800">
                            <template #content>
                                <div class="text-center">
                                    <div class="flex items-center justify-center mb-2">
                                        <i class="pi pi-arrow-up text-green-600 text-xl mr-2"></i>
                                        <span class="text-surface-500 dark:text-surface-400 font-medium text-sm">Total Receivables</span>
                                    </div>
                                    <div class="text-green-600 font-bold text-2xl mb-1">
                                        {{ formatCurrency(dynamicsTotalReceivables) }}
                                    </div>
                                </div>
                            </template>
                        </Card>

                        <!-- Total Payables -->
                        <Card class="shadow-sm border border-red-200 dark:border-red-800">
                            <template #content>
                                <div class="text-center">
                                    <div class="flex items-center justify-center mb-2">
                                        <i class="pi pi-arrow-down text-red-600 text-xl mr-2"></i>
                                        <span class="text-surface-500 dark:text-surface-400 font-medium text-sm">Total Payables</span>
                                    </div>
                                    <div class="text-red-600 font-bold text-2xl mb-1">
                                        {{ formatCurrency(dynamicsTotalPayables) }}
                                    </div>
                                </div>
                            </template>
                        </Card>

                        <!-- Net Profit/Loss -->
                        <Card class="shadow-sm" 
                              :class="netProfitLoss >= 0 
                                      ? 'border-2 border-emerald-300 dark:border-emerald-700 bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30' 
                                      : 'border-2 border-red-400 dark:border-red-700 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-900/30'">
                            <template #content>
                                <div class="text-center">
                                    <div class="flex items-center justify-center mb-2">
                                        <i class="pi text-xl mr-2"
                                           :class="netProfitLoss >= 0 
                                                   ? 'pi-trending-up text-emerald-700 dark:text-emerald-400' 
                                                   : 'pi-trending-down text-red-700 dark:text-red-400'"></i>
                                        <span class="font-medium text-sm"
                                              :class="netProfitLoss >= 0 
                                                      ? 'text-emerald-800 dark:text-emerald-300' 
                                                      : 'text-red-800 dark:text-red-300'">Net Profit/Loss</span>
                                    </div>
                                    <div class="font-bold text-3xl mb-1 drop-shadow-sm" 
                                         :class="netProfitLoss >= 0 
                                                 ? 'text-emerald-700 dark:text-emerald-400' 
                                                 : 'text-red-700 dark:text-red-400'">
                                        {{ formatCurrency(netProfitLoss) }}
                                    </div>
                                    <div class="text-xs font-medium"
                                         :class="netProfitLoss >= 0 
                                                 ? 'text-emerald-700 dark:text-emerald-400' 
                                                 : 'text-red-700 dark:text-red-400'">
                                        Margin: {{ ((netProfitLoss) / Math.max(dynamicsTotalReceivables, 1) * 100).toFixed(1) }}%
                                    </div>
                                </div>
                            </template>
                        </Card>

                        <!-- Ticket Count -->
                        <Card class="shadow-sm border border-blue-200 dark:border-blue-800">
                            <template #content>
                                <div class="text-center">
                                    <div class="flex items-center justify-center mb-2">
                                        <i class="pi pi-ticket text-blue-600 text-xl mr-2"></i>
                                        <span class="text-surface-500 dark:text-surface-400 font-medium text-sm">Tickets Processed</span>
                                    </div>
                                    <div class="text-blue-600 font-bold text-2xl mb-1">
                                        {{ billingStore.dynamicsData?.length || 0 }}
                                    </div>
                                    <div class="text-xs text-surface-500 dark:text-surface-400">
                                        {{ billingStore.dynamicsData ? new Set(billingStore.dynamicsData.map(t => `${t.city}, ${t.state}`)).size : 0 }} unique location(s)
                                    </div>
                                </div>
                            </template>
                        </Card>
                    </div>
                </div>

                <!-- Enhanced Tabbed Data View -->
                <Tabs value="0" class="mt-6">
                    <TabList>
                        <Tab value="0">
                            <i class="pi pi-arrow-up mr-2"></i>
                            Receivables ({{ billingStore.dynamicsData ? billingStore.dynamicsData.reduce((sum, ticket) => sum + (ticket.receivables?.length || 0), 0) : 0 }})
                        </Tab>
                        <Tab value="1">
                            <i class="pi pi-arrow-down mr-2"></i>
                            Payables ({{ billingStore.dynamicsData ? billingStore.dynamicsData.reduce((sum, ticket) => sum + (ticket.payables?.length || 0), 0) : 0 }})
                        </Tab>
                        <Tab value="2">
                            <i class="pi pi-chart-bar mr-2"></i>
                            Comparison Analysis
                        </Tab>
                    </TabList>
                    
                    <TabPanels>
                        <!-- Consolidated Receivables Tab -->
                        <TabPanel value="0">
                            <div class="space-y-6">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <h4 class="text-lg font-semibold">Customer Billing Records</h4>
                                        <i class="pi pi-info-circle text-blue-500" v-tooltip="'This data comes from the Dynamics 365 accounting system, not the original billing records'"></i>
                                    </div>
                                    <div class="text-sm text-surface-600 dark:text-surface-400">
                                        Total: {{ formatCurrency(dynamicsTotalReceivables) }}
                                    </div>
                                </div>
                                
                                <DataTable 
                                    :value="billingStore.dynamicsData ? billingStore.dynamicsData.flatMap(ticket => (ticket.receivables || []).map(r => ({ ...r, ticket_id: ticket.ticket_id, ticket_location: `${ticket.city}, ${ticket.state}` }))) : []" 
                                    class="p-datatable-sm" 
                                    responsiveLayout="scroll"
                                    :paginator="true" 
                                    :rows="15"
                                    sortMode="multiple"
                                    removableSort
                                    :globalFilterFields="['ticket_id', 'invoice_number', 'description', 'item_no']"
                                    filterDisplay="menu">
                                    
                                    <template #header>
                                        <div class="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                                            <div class="flex items-center gap-2">
                                                <i class="pi pi-database text-green-600"></i>
                                                <span class="font-semibold text-green-800 dark:text-green-200">Dynamics 365 Receivables Data</span>
                                            </div>
                                            <span class="text-xs text-green-700 dark:text-green-300">Accounting System Records</span>
                                        </div>
                                    </template>
                                    
                                    <Column field="ticket_id" header="Ticket #" sortable style="width: 100px" frozen>
                                        <template #body="{ data }">
                                            <Badge :value="data.ticket_id" severity="info" />
                                        </template>
                                    </Column>
                                    <Column field="invoice_number" header="Invoice #" sortable style="min-width: 120px">
                                        <template #body="{ data }">
                                            <button 
                                                @click="onInvoiceNumberClick(data.invoice_number)"
                                                class="font-mono text-primary hover:text-primary-600 hover:underline cursor-pointer bg-transparent border-none p-0 transition-colors duration-200"
                                                :title="`Click to view details for invoice ${data.invoice_number}`">
                                                {{ data.invoice_number }}
                                            </button>
                                        </template>
                                    </Column>
                                    <Column field="line_no" header="Line" sortable style="width: 80px" />
                                    <Column field="type" header="Type" sortable style="width: 100px">
                                        <template #body="{ data }">
                                            <Tag :value="data.type" severity="info" />
                                        </template>
                                    </Column>
                                    <Column field="item_no" header="Item #" sortable style="min-width: 150px" />
                                    <Column field="description" header="Description" sortable style="min-width: 200px" />
                                    <Column field="quantity" header="Qty" sortable style="width: 80px" />
                                    <Column field="unit_price" header="Unit Price" sortable style="width: 100px">
                                        <template #body="{ data }">
                                            {{ formatCurrency(data.unit_price) }}
                                        </template>
                                    </Column>
                                    <Column field="amount" header="Amount" sortable style="width: 120px">
                                        <template #body="{ data }">
                                            <span class="font-semibold text-green-600">{{ formatCurrency(data.amount) }}</span>
                                        </template>
                                    </Column>
                                    <Column field="job_no" header="Job #" sortable style="width: 100px" />
                                    <Column field="ticket_location" header="Location" sortable style="min-width: 120px">
                                        <template #body="{ data }">
                                            <span class="text-sm text-surface-600 dark:text-surface-400">{{ data.ticket_location }}</span>
                                        </template>
                                    </Column>
                                </DataTable>
                            </div>
                        </TabPanel>

                        <!-- Consolidated Payables Tab -->
                        <TabPanel value="1">
                            <div class="space-y-6">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <h4 class="text-lg font-semibold">Vendor Cost Records</h4>
                                        <i class="pi pi-info-circle text-blue-500" v-tooltip="'This data comes from the Dynamics 365 accounting system, not the original billing records'"></i>
                                    </div>
                                    <div class="text-sm text-surface-600 dark:text-surface-400">
                                        Total: {{ formatCurrency(dynamicsTotalPayables) }}
                                    </div>
                                </div>
                                
                                <DataTable 
                                    :value="billingStore.dynamicsData ? billingStore.dynamicsData.flatMap(ticket => (ticket.payables || []).map(p => ({ ...p, ticket_id: ticket.ticket_id, ticket_location: `${ticket.city}, ${ticket.state}` }))) : []" 
                                    class="p-datatable-sm" 
                                    responsiveLayout="scroll"
                                    :paginator="true" 
                                    :rows="15"
                                    sortMode="multiple"
                                    removableSort
                                    :globalFilterFields="['ticket_id', 'document_no', 'vendor_no', 'description']"
                                    filterDisplay="menu">
                                    
                                    <template #header>
                                        <div class="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                                            <div class="flex items-center gap-2">
                                                <i class="pi pi-database text-red-600"></i>
                                                <span class="font-semibold text-red-800 dark:text-red-200">Dynamics 365 Payables Data</span>
                                            </div>
                                            <span class="text-xs text-red-700 dark:text-red-300">Accounting System Records</span>
                                        </div>
                                    </template>
                                    
                                    <Column field="ticket_id" header="Ticket #" sortable style="width: 100px" frozen>
                                        <template #body="{ data }">
                                            <Badge :value="data.ticket_id" severity="warn" />
                                        </template>
                                    </Column>
                                    <Column field="document_no" header="Document #" sortable style="min-width: 120px">
                                        <template #body="{ data }">
                                            <button 
                                                @click="onDocumentNumberClick(data.document_no)"
                                                class="font-mono text-primary hover:text-primary-600 hover:underline cursor-pointer bg-transparent border-none p-0 transition-colors duration-200"
                                                :title="`Click to view details for document ${data.document_no}`">
                                                {{ data.document_no }}
                                            </button>
                                        </template>
                                    </Column>
                                    <Column field="vendor_no" header="Vendor #" sortable style="width: 100px" />
                                    <Column field="vendor_invoice_no" header="Vendor Invoice" sortable style="min-width: 120px" />
                                    <Column field="type" header="Type" sortable style="width: 100px">
                                        <template #body="{ data }">
                                            <Tag :value="data.type" severity="warn" />
                                        </template>
                                    </Column>
                                    <Column field="description" header="Description" sortable style="min-width: 200px" />
                                    <Column field="quantity" header="Qty" sortable style="width: 80px" />
                                    <Column field="direct_unit_cost" header="Unit Cost" sortable style="width: 100px">
                                        <template #body="{ data }">
                                            {{ formatCurrency(data.direct_unit_cost) }}
                                        </template>
                                    </Column>
                                    <Column field="amount" header="Total Cost" sortable style="width: 120px">
                                        <template #body="{ data }">
                                            <span class="font-semibold text-red-600">{{ formatCurrency(data.amount || (data.quantity * data.direct_unit_cost)) }}</span>
                                        </template>
                                    </Column>
                                    <Column field="job_no" header="Job #" sortable style="width: 100px" />
                                    <Column field="ticket_location" header="Location" sortable style="min-width: 120px">
                                        <template #body="{ data }">
                                            <span class="text-sm text-surface-600 dark:text-surface-400">{{ data.ticket_location }}</span>
                                        </template>
                                    </Column>
                                </DataTable>
                            </div>
                        </TabPanel>

                        <!-- Enhanced Comparison Tab -->
                        <TabPanel value="2">
                            <div class="space-y-6">
                                <div class="flex items-center justify-between mb-4">
                                    <h4 class="text-lg font-semibold">Financial Analysis & Comparison</h4>
                                    
                                    <!-- Comparison Mode Toggle -->
                                    <div class="flex items-center gap-3">
                                        <span class="text-sm text-surface-600 dark:text-surface-400">Comparison Mode:</span>
                                        <div class="flex gap-2">
                                            <Button 
                                                :label="`Single Ticket (#${selectedTicketForDynamics?.ticket_id || 'N/A'})`"
                                                :severity="comparisonMode === 'single' ? 'primary' : 'secondary'"
                                                :outlined="comparisonMode !== 'single'"
                                                size="small"
                                                @click="comparisonMode = 'single'"
                                                :disabled="!singleTicketDynamicsData"
                                            />
                                            <Button 
                                                label="All Tickets Group"
                                                :severity="comparisonMode === 'group' ? 'primary' : 'secondary'"
                                                :outlined="comparisonMode !== 'group'"
                                                size="small"
                                                @click="comparisonMode = 'group'"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <!-- No Single Ticket Match Warning -->
                                <div v-if="comparisonMode === 'single' && !singleTicketDynamicsData" class="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-exclamation-triangle text-yellow-600"></i>
                                        <span class="text-yellow-800 dark:text-yellow-200 font-medium">No Matching Dynamics Record</span>
                                    </div>
                                    <p class="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                                        No Dynamics 365 record found for ticket #{{ selectedTicketForDynamics?.ticket_id }}. 
                                        Switch to "All Tickets Group" mode to compare the entire dataset.
                                    </p>
                                </div>
                                
                                <!-- Original vs Dynamics Comparison -->
                                <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                    <!-- Original Data Summary -->
                                    <Card class="border border-blue-200 dark:border-blue-800">
                                        <template #title>
                                            <div class="flex items-center justify-between">
                                                <div class="flex items-center gap-2">
                                                    <i class="pi pi-file-o text-blue-600"></i>
                                                    <span v-if="comparisonMode === 'single'">Triton Billing Record</span>
                                                    <span v-else>All Triton Billing Records</span>
                                                </div>
                                                <Badge value="Triton" severity="info" />
                                            </div>
                                        </template>
                                        <template #content>
                                            <div class="space-y-3">
                                                <div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-800 dark:text-blue-200 mb-3">
                                                    <i class="pi pi-info-circle mr-1"></i>
                                                    Data from the Triton billing/ticketing system
                                                </div>
                                                <div v-if="comparisonMode === 'single'" class="space-y-2">
                                                    <div class="flex justify-between">
                                                        <span class="text-surface-600 dark:text-surface-400">Invoice Number:</span>
                                                        <span class="font-medium">{{ originalDataSummary.invoice_number || 'N/A' }}</span>
                                                    </div>
                                                    <div class="flex justify-between">
                                                        <span class="text-surface-600 dark:text-surface-400">Product Code:</span>
                                                        <span class="font-medium">{{ originalDataSummary.product_code || 'N/A' }}</span>
                                                    </div>
                                                    <div class="flex justify-between">
                                                        <span class="text-surface-600 dark:text-surface-400">Quantity:</span>
                                                        <span class="font-medium">{{ originalDataSummary.quantity || 'N/A' }}</span>
                                                    </div>
                                                </div>
                                                <div class="flex justify-between">
                                                    <span class="text-surface-600 dark:text-surface-400">Ticket Count:</span>
                                                    <span class="font-medium">{{ originalDataSummary.ticket_count }}</span>
                                                </div>
                                                <div class="flex justify-between border-t pt-2">
                                                    <span class="text-surface-600 dark:text-surface-400 font-semibold">Invoiced Amount:</span>
                                                    <span class="font-semibold text-green-600">{{ formatCurrency(originalDataSummary.invoiced_amount) }}</span>
                                                </div>
                                                <div class="flex justify-between">
                                                    <span class="text-surface-600 dark:text-surface-400 font-semibold">Amount Paid:</span>
                                                    <span class="font-semibold text-red-600">{{ formatCurrency(originalDataSummary.amount_paid) }}</span>
                                                </div>
                                                <div class="flex justify-between border-t pt-2">
                                                    <span class="text-surface-600 dark:text-surface-400 font-semibold">Net Profit:</span>
                                                    <span class="font-semibold" :class="originalDataSummary.net_profit >= 0 ? 'text-green-600' : 'text-red-600'">
                                                        {{ formatCurrency(originalDataSummary.net_profit) }}
                                                    </span>
                                                </div>
                                            </div>
                                        </template>
                                    </Card>

                                    <!-- Dynamics Data Summary -->
                                    <Card class="border border-green-200 dark:border-green-800">
                                        <template #title>
                                            <div class="flex items-center justify-between">
                                                <div class="flex items-center gap-2">
                                                    <i class="pi pi-database text-green-600"></i>
                                                    <span v-if="comparisonMode === 'single'">Matching Dynamics 365 Record</span>
                                                    <span v-else>All Dynamics 365 Records</span>
                                                </div>
                                                <Badge value="Dynamics 365" severity="success" />
                                            </div>
                                        </template>
                                        <template #content>
                                            <div class="space-y-3">
                                                <div class="p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs text-green-800 dark:text-green-200 mb-3">
                                                    <i class="pi pi-database mr-1"></i>
                                                    Data from Dynamics 365 Business Central accounting system
                                                </div>
                                                <div class="flex justify-between">
                                                    <span class="text-surface-600 dark:text-surface-400">Ticket Count:</span>
                                                    <span class="font-medium">{{ dynamicsDataSummary.ticket_count }}</span>
                                                </div>
                                                <div class="flex justify-between">
                                                    <span class="text-surface-600 dark:text-surface-400">Receivables Records:</span>
                                                    <span class="font-medium">{{ dynamicsDataSummary.receivables_count }}</span>
                                                </div>
                                                <div class="flex justify-between">
                                                    <span class="text-surface-600 dark:text-surface-400">Payables Records:</span>
                                                    <span class="font-medium">{{ dynamicsDataSummary.payables_count }}</span>
                                                </div>
                                                <div class="flex justify-between border-t pt-2">
                                                    <span class="text-surface-600 dark:text-surface-400 font-semibold">Total Receivables:</span>
                                                    <span class="font-semibold text-green-600">{{ formatCurrency(dynamicsDataSummary.total_receivables) }}</span>
                                                </div>
                                                <div class="flex justify-between">
                                                    <span class="text-surface-600 dark:text-surface-400 font-semibold">Total Payables:</span>
                                                    <span class="font-semibold text-red-600">{{ formatCurrency(dynamicsDataSummary.total_payables) }}</span>
                                                </div>
                                                <div class="flex justify-between border-t pt-2">
                                                    <span class="text-surface-600 dark:text-surface-400 font-semibold">Net Profit:</span>
                                                    <span class="font-semibold" :class="dynamicsDataSummary.net_profit >= 0 ? 'text-green-600' : 'text-red-600'">
                                                        {{ formatCurrency(dynamicsDataSummary.net_profit) }}
                                                    </span>
                                                </div>
                                            </div>
                                        </template>
                                    </Card>
                                </div>

                                <!-- Variance Analysis -->
                                <Card v-if="comparisonMode === 'single' && singleTicketDynamicsData || comparisonMode === 'group'" class="border border-purple-200 dark:border-purple-800">
                                    <template #title>
                                        <div class="flex items-center gap-2">
                                            <i class="pi pi-chart-line text-purple-600"></i>
                                            <span>Variance Analysis</span>
                                            <Badge v-if="comparisonMode === 'single'" value="Single Ticket" severity="info" />
                                            <Badge v-else value="All Tickets" severity="warn" />
                                        </div>
                                    </template>
                                    <template #content>
                                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div class="text-center p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                                                <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Revenue Variance</div>
                                                <div class="text-lg font-semibold" :class="varianceAnalysis.revenue.amount >= 0 ? 'text-green-600' : 'text-red-600'">
                                                    {{ formatCurrency(varianceAnalysis.revenue.amount) }}
                                                </div>
                                                <div class="text-xs text-surface-500 dark:text-surface-400 mt-1">
                                                    {{ varianceAnalysis.revenue.percentage.toFixed(1) }}% difference
                                                </div>
                                                <div class="text-xs text-surface-400 dark:text-surface-500 mt-1">
                                                    Dynamics vs Triton
                                                </div>
                                            </div>
                                            <div class="text-center p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                                                <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Cost Variance</div>
                                                <div class="text-lg font-semibold" :class="varianceAnalysis.cost.amount >= 0 ? 'text-red-600' : 'text-green-600'">
                                                    {{ formatCurrency(varianceAnalysis.cost.amount) }}
                                                </div>
                                                <div class="text-xs text-surface-500 dark:text-surface-400 mt-1">
                                                    {{ varianceAnalysis.cost.percentage.toFixed(1) }}% difference
                                                </div>
                                                <div class="text-xs text-surface-400 dark:text-surface-500 mt-1">
                                                    Higher costs = red
                                                </div>
                                            </div>
                                            <div class="text-center p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                                                <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Net Profit Variance</div>
                                                <div class="text-lg font-semibold" :class="varianceAnalysis.net.amount >= 0 ? 'text-green-600' : 'text-red-600'">
                                                    {{ formatCurrency(varianceAnalysis.net.amount) }}
                                                </div>
                                                <div class="text-xs text-surface-500 dark:text-surface-400 mt-1">
                                                    {{ Math.abs(varianceAnalysis.net.percentage).toFixed(1) }}% {{ varianceAnalysis.net.amount >= 0 ? 'better' : 'worse' }}
                                                </div>
                                                <div class="text-xs text-surface-400 dark:text-surface-500 mt-1">
                                                    Overall impact
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Comparison Summary -->
                                        <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                            <div class="text-sm text-blue-800 dark:text-blue-200">
                                                <i class="pi pi-info-circle mr-2"></i>
                                                <strong>Summary:</strong>
                                                <span v-if="comparisonMode === 'single'">
                                                    Comparing ticket #{{ selectedTicketForDynamics?.ticket_id }} against its matching Dynamics 365 record.
                                                </span>
                                                <span v-else>
                                                    Comparing all {{ originalDataSummary.ticket_count }} Triton billing records against all {{ dynamicsDataSummary.ticket_count }} Dynamics 365 records.
                                                </span>
                                                <span v-if="Math.abs(varianceAnalysis.net.amount) < 100" class="text-green-700 dark:text-green-300 ml-2">
                                                    ✓ Close match (variance under $100)
                                                </span>
                                                <span v-else-if="Math.abs(varianceAnalysis.net.amount) < 1000" class="text-yellow-700 dark:text-yellow-300 ml-2">
                                                    ⚠ Moderate variance (${{ Math.abs(varianceAnalysis.net.amount).toFixed(0) }})
                                                </span>
                                                <span v-else class="text-red-700 dark:text-red-300 ml-2">
                                                    ⚠ Significant variance (${{ Math.abs(varianceAnalysis.net.amount).toFixed(0) }})
                                                </span>
                                            </div>
                                        </div>
                                    </template>
                                </Card>
                            </div>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </div>

            <template #footer>
                <div class="flex justify-between items-center">
                    <div class="text-sm text-surface-600 dark:text-surface-400">
                        <i class="pi pi-info-circle mr-1"></i>
                        Data retrieved from Dynamics 365 Business Central
                    </div>
                    <Button label="Close" icon="pi pi-times" @click="closeDynamicsModal" />
                </div>
            </template>
        </Dialog>
    </div>

    <!-- Invoice Detail Modal -->
    <InvoiceDetailModal 
        v-model:visible="showInvoiceDetailModal"
        :invoice-data="billingStore.detailedInvoiceData"
        :loading="billingStore.detailedInvoiceLoading"
        :error="billingStore.detailedInvoiceError"
        @update:visible="closeInvoiceDetailModal" />

    <!-- Purchase Detail Modal -->
    <PurchaseDetailModal 
        v-model:visible="showPurchaseDetailModal"
        :purchase-data="billingStore.detailedPurchaseData"
        :loading="billingStore.detailedPurchaseLoading"
        :error="billingStore.detailedPurchaseError"
        @update:visible="closePurchaseDetailModal" />
</template>

<style scoped>
.field-service-billing {
    padding: 1rem;
}

.p-datatable .p-datatable-tbody > tr.bg-blue-50 {
    background-color: #eff6ff !important;
}

.p-datatable .p-datatable-tbody > tr.bg-blue-50:hover {
    background-color: #dbeafe !important;
}

.truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.max-w-xs {
    max-width: 20rem;
}

/* Accordion styling for better visual hierarchy */
.p-accordion .p-accordion-header {
    border-radius: 6px;
    margin-bottom: 0.5rem;
}

.p-accordion .p-accordion-content {
    border-radius: 0 0 6px 6px;
    border-top: none;
}

/* Custom styling for the search sections */
.search-section {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
}

.search-section h6 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: #374151;
    font-weight: 600;
}

/* Responsive grid adjustments */
@media (max-width: 768px) {
    .grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3 {
        grid-template-columns: 1fr;
    }
}

@media (min-width: 768px) {
    .grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3 {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (min-width: 1024px) {
    .grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3 {
        grid-template-columns: repeat(3, 1fr);
    }
}
</style> 