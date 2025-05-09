<script setup>
import { ref, watch, computed, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from 'primevue/button';
import { useDispatchStore } from '@/stores/dispatchStore';
import TabPanel from 'primevue/tabpanel';
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

// Router
const route = useRoute();
const router = useRouter();

// Store (if we want to fetch a single dispatch later)
const dispatchStore = useDispatchStore();

// Toast and Confirm services
const toast = useToast();
const confirm = useConfirm();

// The route should contain the ticket id as param and the row data in navigation state (for quick load)
const dispatchData = ref(history.state?.dispatch ?? null);
const ticketId = route.params.id;
const activeTabIndex = ref(0);
const displayNotesDrawer = ref(false);

// Chain analysis state
const analysisStatus = ref(null);
const isLoadingAnalysis = ref(false);
const analysisError = ref(null);
const hasBeenAnalyzed = ref(false);
const isRunningAnalysis = ref(false);

// Analysis model selection (default)
const selectedAiModel = ref('gpt-4.1-mini');

// Visit details state
const visitDetails = ref(null);
const isLoadingVisitDetails = ref(false);
const visitDetailsError = ref(null);

// Job report state
const jobReport = ref(null);
const isLoadingJobReport = ref(false);
const jobReportError = ref(null);

// Dialog states
const jobReportDialog = ref(false);

// Linked tickets state
const linkedTickets = ref(null);
const isLoadingLinkedTickets = ref(false);
const linkedTicketsError = ref(null);

// Analysis dialog state
const showAnalysisDialog = ref(false);
const forceRefreshAnalysis = ref(false);

// List of available AI models for analysis
const availableModels = [
  { label: 'GPT-4o', value: 'gpt-4o' },
  { label: 'O4-mini', value: 'o4-mini' },
  { label: 'GPT-4.1-mini (Default)', value: 'gpt-4.1-mini' },
  { label: 'GPT-4.1-2025-04-14', value: 'gpt-4.1-2025-04-14' },
  { label: 'ChatGPT-4o-latest', value: 'chatgpt-4o-latest' },
  { label: 'GPT-4.1', value: 'gpt-4.1' },
  { label: 'O3', value: 'o3' },
  { label: 'O3-mini', value: 'o3-mini' },
  { label: 'O1', value: 'o1' },
  { label: 'O1-mini', value: 'o1-mini' },
  { label: 'O1-pro', value: 'o1-pro' }
];

// Sample financial records data
const financialRecords = ref([
  {
    header: {
      id: "94948",
      visit_id: "2402007",
      created_at: "2025-05-01 16:03:15",
      updated_at: "2025-05-01 16:03:17"
    },
    financials: {
      Total_Payable: 0,
      jobUnitPrice: 2808,
      Total_Receivable: 2808
    },
    details: {
      id_purchase: "",
      id_item: "FST LABOR QUOTED",
      billing_desc: "Flat Rate Labor",
      jobLineType: "BILLABLE",
      vendorNumber: "",
      invoiceNumber: "",
      invoice_only: false,
      dispatch_billing_type_id: 2,
      processed: true,
      billableRate: 0,
      submitted_to_fst: false
    },
    notes: {
      postFirst: "Please invoice customer via Coupa for the amount listed in the edit tab using the PO listed. Thanks\r\rPO: 232498\rType of billing: 50 PERCENT BILLING\rAmount: 2808",
      postLast: "A bill was created under this ticket: 2402007<br/>Total Bill to Customer : $2,808.00<br/>Total Bill to CISSDM  : $0.00\n\n",
      postFirstDetails: "David Fisher - 03/13/2025 03:58 PM",
      postLastDetails: "Kayla Gonzalez - 05/01/2025 04:03 PM"
    }
  },
  {
    header: {
      id: "94427",
      visit_id: "2425532",
      created_at: "",
      updated_at: "2025-04-28 14:31:42"
    },
    financials: {
      Total_Payable: 85,
      jobUnitPrice: 0,
      Total_Receivable: 0
    },
    details: {
      id_purchase: "5b177b2c-7824-f011-9346-7c1e52eba347",
      id_item: "FST LABOR QUOTED",
      billing_desc: "Flat Rate Labor",
      jobLineType: "",
      vendorNumber: "V0078",
      invoiceNumber: "16991432",
      invoice_only: false,
      dispatch_billing_type_id: 0,
      processed: true,
      billableRate: 0,
      submitted_to_fst: false
    },
    notes: {
      postFirst: "Site Survey\nFW009270_Waldorf_MD\n",
      postLast: "A bill was created under this ticket: 2425532<br/>Total Bill to Customer : $0.00<br/>Total Bill to CISSDM  : $85.00\n\n",
      postFirstDetails: "lillian.johnston - 04/21/2025 05:06 AM",
      postLastDetails: "Kayla Gonzalez - 04/28/2025 02:31 PM"
    }
  },
  {
    header: {
      id: "95002",
      visit_id: "2431848",
      created_at: "2025-05-02 08:38:16",
      updated_at: "2025-05-02 08:38:19"
    },
    financials: {
      Total_Payable: 144,
      jobUnitPrice: 0,
      Total_Receivable: 0
    },
    details: {
      id_purchase: "70cdef74-6b27-f011-9af4-6045bd79dd9c",
      id_item: "FST TURNUP",
      billing_desc: "Turnup 2431848",
      jobLineType: "",
      vendorNumber: "V0129",
      invoiceNumber: "2431848",
      invoice_only: false,
      dispatch_billing_type_id: 2,
      processed: true,
      billableRate: 0,
      submitted_to_fst: false
    },
    notes: {
      postFirst: "\rTurn Up #: 2426897\rTime In: 6:30 PM\rTime Out: 11:00 PM\rRTE Hours: 4.50\rRTE Pay: $144.00\r\r",
      postLast: "A bill was created under this ticket: 2431848<br/>Total Bill to Customer : $0.00<br/>Total Bill to CISSDM  : $144.00\n\n",
      postFirstDetails: "Rachelle Williams - 05/01/2025 10:45 AM",
      postLastDetails: "Megan Richardson - 05/02/2025 08:38 AM"
    }
  },
  {
    header: {
      id: "95623",
      visit_id: "2432083",
      created_at: "",
      updated_at: "2025-05-06 15:22:04"
    },
    financials: {
      Total_Payable: 150,
      jobUnitPrice: 160,
      Total_Receivable: 320
    },
    details: {
      id_purchase: "25e1fe88-c82a-f011-9af4-6045bd79dd9c",
      id_item: "FST MINIMUM LABOR",
      billing_desc: "Flat Rate Labor",
      jobLineType: "BILLABLE",
      vendorNumber: "V0078",
      invoiceNumber: "17052464",
      invoice_only: false,
      dispatch_billing_type_id: 0,
      processed: true,
      billableRate: 0,
      submitted_to_fst: false
    },
    notes: {
      postFirst: "Client: Flynn\nLocation:\u0000FLN_Wendys FW009270_Waldorf_MD\nTime/Date: 5/2/25 10am local (7am pst)\u0000\n\u0000\nIssue:\u0000KDS PUW, .82 is not working (it's a networked display monitor in the kitchen that shows the orders to the food prep team).\u0000 It stopped working after CIS dispatch for night one migration dispatch. It is not showing connected.\u0000\nNeeded: A tech that can perform basic network tasks. We just need a cable traced and reset. It likely just needs to be properly plugged in. If there is a bigger issue (cable needs to be run for instance) it just needs to be scoped to be addressed at a later time.\u0000\n\u0000\nNOTES: This is to go to the FSPM team for check in out.\u0000\nI've included the client email below for reference.\u0000\u0000\n",
      postLast: "A bill was created under this ticket: 2432083<br/>Total Bill to Customer : $800.00<br/>Total Bill to CISSDM  : $368.25\n\n",
      postFirstDetails: "Josh Bosen via Triton - 05/01/2025 02:36 PM",
      postLastDetails: "Dana Tompkins - 05/06/2025 03:22 PM"
    }
  },
  {
    header: {
      id: "95624",
      visit_id: "2432083",
      created_at: "",
      updated_at: "2025-05-06 15:22:04"
    },
    financials: {
      Total_Payable: 218.25,
      jobUnitPrice: 160,
      Total_Receivable: 480
    },
    details: {
      id_purchase: "27e1fe88-c82a-f011-9af4-6045bd79dd9c",
      id_item: "FST LABOR PREMIUM",
      billing_desc: "Hourly Labor",
      jobLineType: "BILLABLE",
      vendorNumber: "V0078",
      invoiceNumber: "17052464",
      invoice_only: false,
      dispatch_billing_type_id: 0,
      processed: true,
      billableRate: 0,
      submitted_to_fst: false
    },
    notes: {
      postFirst: "Client: Flynn\nLocation:\u0000FLN_Wendys FW009270_Waldorf_MD\nTime/Date: 5/2/25 10am local (7am pst)\u0000\n\u0000\nIssue:\u0000KDS PUW, .82 is not working (it's a networked display monitor in the kitchen that shows the orders to the food prep team).\u0000 It stopped working after CIS dispatch for night one migration dispatch. It is not showing connected.\u0000\nNeeded: A tech that can perform basic network tasks. We just need a cable traced and reset. It likely just needs to be properly plugged in. If there is a bigger issue (cable needs to be run for instance) it just needs to be scoped to be addressed at a later time.\u0000\n\u0000\nNOTES: This is to go to the FSPM team for check in out.\u0000\nI've included the client email below for reference.\u0000\u0000\n",
      postLast: "A bill was created under this ticket: 2432083<br/>Total Bill to Customer : $800.00<br/>Total Bill to CISSDM  : $368.25\n\n",
      postFirstDetails: "Josh Bosen via Triton - 05/01/2025 02:36 PM",
      postLastDetails: "Dana Tompkins - 05/06/2025 03:22 PM"
    }
  }
]);

// Selected financial record for displaying notes
const selectedFinancialRecord = ref(financialRecords.value[0]);

// Calculate total receivable amount
function calculateTotalReceivable() {
  return financialRecords.value.reduce((sum, item) => sum + Number(item.financials.Total_Receivable), 0);
}

// Calculate total payable amount
function calculateTotalPayable() {
  return financialRecords.value.reduce((sum, item) => sum + Number(item.financials.Total_Payable), 0);
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
  const profit = item.financials.Total_Receivable - item.financials.Total_Payable;
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

// Also watch for tab index changes for debugging
watch(activeTabIndex, (newValue) => {
  console.log('Tab index changed to:', newValue);
});

// Fallback: try to locate the record in already-loaded dispatchRows
const tryLoadFromStore = () => {
  if (!dispatchData.value) {
    const match = dispatchStore.dispatchRows.find(r => String(r.id) === String(ticketId));
    if (match) dispatchData.value = match;
  }
};

// Attempt immediately and also watch for store updates
tryLoadFromStore();

watch(() => dispatchStore.dispatchRows.length, () => {
  tryLoadFromStore();
});

// Timeline events for job report view
const timelineEvents = computed(() => {
  if (!jobReport.value || !jobReport.value.success) {
    return [];
  }
  
  // Try to extract visits from job report using the correct path
  // The visits are in jobReport.value.visits or jobReport.value.analysis_data.job.visits
  const visits = jobReport.value.visits || 
                (jobReport.value.analysis_data?.job?.visits || []);
  
  if (!visits || visits.length === 0) {
    console.warn('No timeline visit data available in job report');
    return [];
  }
  
  // Sort visits by date
  const sortedVisits = [...visits].sort((a, b) => {
    if (!a.visit_date || !b.visit_date) return 0;
    
    // Handle different date formats (some have T, some don't)
    const dateA = new Date(a.visit_date.replace(' ', 'T'));
    const dateB = new Date(b.visit_date.replace(' ', 'T'));
    
    return dateA - dateB;
  });
  
  console.log('Sorted timeline visits:', sortedVisits);
  
  return sortedVisits.map(visit => ({
    ...visit,
    phase_name: visit.phase_name || 'Unknown Phase',
    status: visit.status || 'unknown',
    color: getStatusColor(visit.status),
    icon: getStatusIcon(visit.status),
    work_summary: visit.work_summary || visit.work_performed?.summary || 'No work summary available',
  }));
});

// Navigation and UI functions
function goBack() {
  router.back();
}

function toggleNotesDrawer() {
  displayNotesDrawer.value = !displayNotesDrawer.value;
}

// Run initial checks on component mount
onMounted(() => {
  // Check ticket analysis status on load
  nextTick(() => {
    checkTicketAnalysis();
  });
});

// Check if the ticket has been analyzed - run this on component mount
async function checkTicketAnalysis() {
  if (!ticketId) return;
  
  isLoadingAnalysis.value = true;
  analysisError.value = null;
  
  try {
    const response = await dispatchStore.checkTicketAnalysis(ticketId);
    console.log('Analysis status response:', response);
    
    if (response && response.success) {
      analysisStatus.value = response;
      hasBeenAnalyzed.value = response.has_chain_data || false;
      
      // If ticket has been analyzed, fetch visit details automatically
      if (hasBeenAnalyzed.value) {
        await fetchVisitDetails();
      }
    } else {
      analysisError.value = response?.message || 'Failed to check analysis status';
    }
  } catch (error) {
    console.error('Error checking ticket analysis:', error);
    analysisError.value = error.message || 'An error occurred while checking analysis status';
  } finally {
    isLoadingAnalysis.value = false;
  }
}

// Run analysis on ticket to get insights
async function runAnalysis(forceRefresh = false) {
  if (!ticketId) return;
  
  // Open analysis dialog instead of using confirm service
  showAnalysisDialog.value = true;
  forceRefreshAnalysis.value = forceRefresh;
}

// Start the actual analysis process with selected options
async function startAnalysis() {
  if (!ticketId) return;
  
  showAnalysisDialog.value = false;
  isRunningAnalysis.value = true;
  
  // Show initial toast with progress
  toast.add({
    severity: 'info',
    summary: 'Analysis Started',
    detail: 'Processing ticket chain. This may take several minutes...',
    life: 10000, // 10 seconds
    closable: false
  });
  
  // Start analysis process
  try {
    const response = await dispatchStore.analyzeTicket(ticketId, forceRefreshAnalysis.value, selectedAiModel.value);
    console.log('Run analysis response:', response);
    
    if (response && response.success) {
      // Success toast
      toast.add({
        severity: 'success',
        summary: 'Analysis Complete',
        detail: response.already_analyzed 
          ? 'This ticket has already been analyzed.' 
          : `Successfully analyzed ticket chain. Found ${response.total_tickets || 0} tickets in ${response.total_visits || 0} visits.`,
        life: 5000,
        closable: true
      });
      
      // Update local state
      hasBeenAnalyzed.value = true;
      
      // Refresh analysis data
      await checkTicketAnalysis();
    } else {
      // Error toast
      toast.add({
        severity: 'error',
        summary: 'Analysis Failed',
        detail: response?.message || 'Failed to analyze ticket',
        life: 5000,
        closable: true
      });
    }
  } catch (error) {
    console.error('Error running analysis:', error);
    
    // Error toast
    toast.add({
      severity: 'error',
      summary: 'Analysis Error',
      detail: error.message || 'An error occurred during analysis',
      life: 5000,
      closable: true
    });
  } finally {
    isRunningAnalysis.value = false;
  }
}

// Fetch visit details for this ticket
async function fetchVisitDetails() {
  if (!ticketId || !hasBeenAnalyzed.value) return;
  
  isLoadingVisitDetails.value = true;
  visitDetailsError.value = null;
  
  try {
    const response = await dispatchStore.getVisitByTicket(ticketId);
    console.log('Visit details response:', response);
    
    if (response && response.success) {
      visitDetails.value = response;
    } else {
      visitDetailsError.value = response?.message || 'Failed to fetch visit details';
    }
  } catch (error) {
    console.error('Error fetching visit details:', error);
    visitDetailsError.value = error.message || 'An error occurred while fetching visit details';
  } finally {
    isLoadingVisitDetails.value = false;
  }
}

// Fetch full job report
async function fetchJobReport() {
  if (!ticketId || !hasBeenAnalyzed.value) return;
  
  isLoadingJobReport.value = true;
  jobReportError.value = null;
  jobReport.value = null;
  
  try {
    const response = await dispatchStore.getJobReport(ticketId);
    console.log('Job report response:', response);
    
    if (response && response.success) {
      // Success - set the job report data from the correct structure
      // The actual data is in response.data
      jobReport.value = {
        success: true,
        ...response.data, // This contains chain_data, visits, key_issues, etc.
      };
      jobReportDialog.value = true;
    } else {
      // API returned an error
      jobReport.value = {
        success: false,
        message: response?.message || 'Failed to fetch job report'
      };
      jobReportDialog.value = true;
    }
  } catch (error) {
    console.error('Error fetching job report:', error);
    jobReport.value = {
      success: false,
      message: error.message || 'An error occurred while fetching job report'
    };
    jobReportDialog.value = true;
  } finally {
    isLoadingJobReport.value = false;
  }
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
  if (jobReportDialog.value) {
    jobReportDialog.value = false;
  } else {
    fetchJobReport();
  }
}

// Billing status tag severity
const billingSeverity = computed(() => {
  if (!dispatchData.value?.billing?.billingStatus) return 'danger';
  const status = dispatchData.value.billing.billingStatus.toLowerCase();
  if (status.includes('paid') || status.includes('complete')) return 'success';
  if (status.includes('pending') || status.includes('partial')) return 'warning';
  return 'danger';
});

// Fetch linked tickets
async function fetchLinkedTickets() {
  if (!ticketId) return;
  
  isLoadingLinkedTickets.value = true;
  linkedTicketsError.value = null;
  
  try {
    const response = await DispatchService.getLinkedTickets(ticketId);
    console.log('Linked tickets response:', response);
    
    if (response.data && response.data.success && response.data.data) {
      // Extract the chain hash ID for display
      const chainHash = response.data.data.chain_hash || 'N/A';
      
      // Check if tickets_by_category is available in the response
      if (response.data.data.tickets_by_category) {
        // Convert the tickets by category object into an array of tickets with category
        linkedTickets.value = [];
        
        // Process each category
        Object.entries(response.data.data.tickets_by_category).forEach(([category, tickets]) => {
          // Add each ticket with its category
          tickets.forEach(ticket => {
            linkedTickets.value.push({
              record_id: ticket.ticketid,
              record_type: category,
              status: ticket.ticketstatustitle,
              customer_name: ticket.fullname || 'N/A',
              created_date: formatDate(ticket.ticket_created),
              ticket_created: ticket.ticket_created, // Raw timestamp for sorting
              subject: ticket.subject,
              type: ticket.tickettypetitle,
              department: ticket.departmenttitle,
              last_activity: formatDate(ticket.lastactivity),
              last_activity_timestamp: ticket.lastactivity,
              owner: ticket.fullname || 'N/A',
              chainId: chainHash
            });
          });
        });
      } 
      // Fallback to the tickets array if tickets_by_category is not available
      else if (response.data.data.tickets && Array.isArray(response.data.data.tickets)) {
        linkedTickets.value = response.data.data.tickets.map(ticket => ({
          record_id: ticket.ticketid,
          record_type: ticket.TicketCategory || 'Other',
          status: ticket.ticketstatustitle,
          customer_name: ticket.fullname || 'N/A',
          created_date: formatDate(ticket.ticket_created),
          ticket_created: ticket.ticket_created, // Raw timestamp for sorting
          subject: ticket.subject,
          type: ticket.tickettypetitle,
          department: ticket.departmenttitle,
          last_activity: formatDate(ticket.lastactivity),
          last_activity_timestamp: ticket.lastactivity,
          owner: ticket.fullname || 'N/A',
          chainId: chainHash
        }));
      } else {
        linkedTickets.value = [];
        console.warn('No tickets data found in response:', response.data.data);
      }
    } else {
      console.error('Unexpected API response structure for linked tickets:', response.data);
      linkedTicketsError.value = 'Unexpected data format received from the server';
    }
  } catch (error) {
    console.error('Error fetching linked tickets:', error);
    linkedTicketsError.value = error.message || 'Failed to load linked tickets';
  } finally {
    isLoadingLinkedTickets.value = false;
    if (linkedTickets.value && linkedTickets.value.length > 0) {
      console.log('Chain ID in first ticket:', linkedTickets.value[0].chainId);
    }
  }
}

// Format Unix timestamps to readable dates
function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  
  try {
    const date = new Date(timestamp * 1000); // Convert Unix timestamp to milliseconds
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Invalid Date';
  }
}

// Format short date for timeline
function formatShortDate(timestamp) {
  if (!timestamp) return '';
  
  try {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    console.error('Error formatting short date:', e);
    return '';
  }
}

// Get the timeline items from linked tickets
const timelineItems = computed(() => {
  if (!linkedTickets.value || linkedTickets.value.length === 0) return [];
  
  // Sort tickets by created date (ascending)
  return [...linkedTickets.value]
    .sort((a, b) => {
      // Extract timestamps from ticket objects
      const aTimestamp = a.ticket_created || 0;
      const bTimestamp = b.ticket_created || 0;
      return aTimestamp - bTimestamp;
    })
    .map(ticket => {
      // Create icon and color based on ticket type
      let icon = 'pi pi-ticket';
      let color = '#3B82F6'; // Default blue
      
      const type = (ticket.type || '').toLowerCase();
      
      if (type.includes('hardware')) {
        icon = 'pi pi-desktop';
        color = '#F59E0B'; // Amber
      } else if (type.includes('software')) {
        icon = 'pi pi-code';
        color = '#10B981'; // Emerald
      } else if (type.includes('network')) {
        icon = 'pi pi-wifi';
        color = '#6366F1'; // Indigo
      } else if (type.includes('billing')) {
        icon = 'pi pi-dollar';
        color = '#8B5CF6'; // Violet
      } else if (type.includes('service')) {
        icon = 'pi pi-wrench';
        color = '#EC4899'; // Pink
      } else if (type.includes('support')) {
        icon = 'pi pi-question-circle';
        color = '#14B8A6'; // Teal
      }
      
      return {
        id: ticket.record_id,
        date: formatShortDate(ticket.ticket_created),
        rawDate: ticket.ticket_created,
        status: ticket.status || 'Unknown',
        type: ticket.type || 'Dispatch', 
        icon,
        color,
        subject: ticket.subject || 'No Subject',
        record_type: ticket.record_type,
        customer_name: ticket.customer_name,
        department: ticket.department
      };
    });
});

// Group tickets by type for the fieldset display
const ticketsByType = computed(() => {
  if (!linkedTickets.value || linkedTickets.value.length === 0) return {};
  
  // Create groups based on ticket category (record_type)
  const groups = {};
  
  linkedTickets.value.forEach(ticket => {
    // Use a default category if none is provided
    const category = ticket.record_type || 'Other';
    
    // Create the group if it doesn't exist
    if (!groups[category]) {
      groups[category] = [];
    }
    
    // Add the ticket to its category group
    groups[category].push(ticket);
  });
  
  // Sort each group by date
  Object.keys(groups).forEach(category => {
    groups[category].sort((a, b) => {
      const aTimestamp = a.ticket_created || 0;
      const bTimestamp = b.ticket_created || 0;
      return aTimestamp - bTimestamp;
    });
  });
  
  return groups;
});

// Split timeline items into chunks of 6 for multiple rows
const timelineChunks = computed(() => {
  if (!timelineItems.value || timelineItems.value.length === 0) return [];
  
  const chunks = [];
  const chunkSize = 6; // Maximum 6 tickets per row
  
  for (let i = 0; i < timelineItems.value.length; i += chunkSize) {
    chunks.push(timelineItems.value.slice(i, i + chunkSize));
  }
  
  return chunks;
});

// Get severity for a ticket based on status
function getTicketSeverity(ticket) {
  if (!ticket || !ticket.status) return 'info';
  
  const status = ticket.status.toLowerCase();
  
  // Map specific statuses to severity levels
  if (status.includes('closed') || 
      status.includes('complete') || 
      status.includes('resolved') ||
      status.includes('successful')) {
    return 'success';
  }
  
  if (status.includes('confirmed') || 
      status.includes('in progress') || 
      status.includes('assigned') || 
      status.includes('working') ||
      status.includes('partial') ||
      status.includes('scheduled')) {
    return 'info';
  }
  
  if (status.includes('pending') || 
      status.includes('open') || 
      status.includes('waiting') || 
      status.includes('on hold') ||
      status.includes('canceled') ||
      status.includes('failed')) {
    return 'warning';
  }
  
  if (status.includes('cancel') || 
      status.includes('fail') || 
      status.includes('reject') ||
      status.includes('critical') ||
      status.includes('error')) {
    return 'danger';
  }
  
  return 'info';
}

// Navigate to a linked ticket
function navigateToTicket(ticket) {
  if (!ticket || !ticket.record_id) return;
  
  // Based on ticket type, navigate to appropriate view
  const recordType = (ticket.record_type || '').toLowerCase();
  
  if (recordType.includes('dispatch')) {
    router.push({
      name: 'dispatch-job-details',
      params: { id: ticket.record_id }
    });
  } else if (recordType.includes('service')) {
    // If there's a service ticket view, navigate there
    router.push({
      name: 'service-details',
      params: { id: ticket.record_id }
    });
  } else {
    // For other types, show a message
    console.log(`Navigation to ${recordType} tickets is not yet implemented`);
    alert(`Viewing ${recordType} tickets is not yet supported. ID: ${ticket.record_id}`);
  }
}
</script>

<template>
  <div class="p-4">
    <!-- Loading state -->
    <div v-if="!dispatchData" class="flex items-center justify-center h-64">
      <span class="pi pi-spin pi-spinner text-4xl text-primary"></span>
    </div>
    
    <div v-else class="dispatch-details">
      <!-- Header with ticket information and status -->
      <div class="flex flex-col gap-2 mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Button 
              icon="pi pi-arrow-left" 
              @click="goBack" 
              text 
              class="hover:bg-gray-100 mr-2 p-2 rounded-full"
            />
            <h1 class="text-2xl font-bold m-0">{{ dispatchData.customerName }}_{{ dispatchData.siteNumber }}_{{ dispatchData.cityState }}_P{{ dispatchData.schedule?.visitNumber || '1' }}</h1>
          </div>
          
          <div class="flex items-center gap-2">
            <Tag value="Confirmed" severity="success" class="px-3 py-1" />
            <Tag v-if="dispatchData.jobLineType" :value="dispatchData.jobLineType" severity="info" class="px-3 py-1" />
          </div>
        </div>
        
        <div class="text-gray-600">
          Ticket ID: {{ ticketId }} | Visit ID: {{ dispatchData.schedule?.visitRecordId || 'N/A' }}
        </div>
      </div>

      <!-- Tab navigation -->
      <TabView>
        <!-- Overview Tab -->
        <TabPanel header="Overview">
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
                    <div class="font-medium">{{ dispatchData.customerName || 'N/A' }}</div>
                  </div>
                  
                  <div>
                    <div class="text-gray-500 mb-1">Site Number</div>
                    <div class="font-medium">{{ dispatchData.siteNumber || 'N/A' }}</div>
                  </div>
                  
                  <div>
                    <div class="text-gray-500 mb-1">Service Date</div>
                    <div class="font-medium">{{ dispatchData.serviceDate || 'N/A' }}</div>
                  </div>
                  
                  <div>
                    <div class="text-gray-500 mb-1">Time Zone</div>
                    <div class="font-medium">{{ dispatchData.timeZone || 'America/New_York' }}</div>
                  </div>
                  
                  <div>
                    <div class="text-gray-500 mb-1">Scope of Work</div>
                    <div class="font-medium">{{ dispatchData.scope || 'N/A' }}</div>
                  </div>
                  
                  <div>
                    <div class="text-gray-500 mb-1">Project</div>
                    <div class="font-medium">{{ dispatchData.jobDetails?.projectName || dispatchData.project || 'N/A' }}</div>
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
                    <div class="font-medium">{{ dispatchData.address || 'N/A' }}</div>
                  </div>
                  
                  <div>
                    <div class="text-gray-500 mb-1">City/State</div>
                    <div class="font-medium">{{ dispatchData.cityState || 'N/A' }}</div>
                  </div>
                  
                  <div>
                    <div class="text-gray-500 mb-1">Zip Code</div>
                    <div class="font-medium">{{ dispatchData.zipCode || 'N/A' }}</div>
                  </div>
                  
                  <div class="col-span-2">
                    <div class="text-gray-500 mb-1">Contact</div>
                    <div class="font-medium">{{ dispatchData.contactName || dispatchData.contactPhone || 'N/A' }}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Timing Information Panel -->
            <div class="bg-white rounded-lg shadow border border-gray-200">
              <div class="p-4 border-b border-gray-200 flex items-center">
                <i class="pi pi-clock mr-2 text-purple-600"></i>
                <h2 class="text-xl font-semibold">Timing Information</h2>
              </div>
              
              <div class="p-4">
                <div class="grid grid-cols-2 gap-6">
                  <div>
                    <div class="text-gray-500 mb-1">Check-in Time</div>
                    <div class="font-medium">{{ dispatchData.schedule?.checkInTime || 'N/A' }}</div>
                  </div>
                  
                  <div>
                    <div class="text-gray-500 mb-1">Check-out Time</div>
                    <div class="font-medium">{{ dispatchData.schedule?.checkOutTime || 'N/A' }}</div>
                  </div>
                  
                  <div class="col-span-2">
                    <div class="text-gray-500 mb-1">Duration</div>
                    <div class="font-medium">{{ dispatchData.schedule?.duration || 'N/A' }}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Technician Information Panel -->
            <div class="bg-white rounded-lg shadow border border-gray-200">
              <div class="p-4 border-b border-gray-200 flex items-center">
                <i class="pi pi-user mr-2 text-green-600"></i>
                <h2 class="text-xl font-semibold">Technician Information</h2>
              </div>
              
              <div class="p-4">
                <div class="grid grid-cols-2 gap-6">
                  <div class="col-span-2">
                    <div class="text-gray-500 mb-1">Technician Name</div>
                    <div class="font-medium">{{ dispatchData.technicianName || 'N/A' }}</div>
                  </div>
                  
                  <div>
                    <div class="text-gray-500 mb-1">Grade/Review</div>
                    <div class="font-medium flex items-center">
                      <span class="text-blue-600 mr-1">10</span>
                      <span class="text-yellow-500">/10</span>
                    </div>
                  </div>
                  
                  <div>
                    <div class="text-gray-500 mb-1">Vendor</div>
                    <div class="font-medium">{{ dispatchData.vendor || 'N/A' }}</div>
                  </div>
                  
                  <div class="col-span-2">
                    <div class="text-gray-500 mb-1">Comments</div>
                    <div class="font-medium">{{ dispatchData.technicianComments || 'N/A' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>
        
        <!-- Details Tab -->
        <TabPanel header="Details">
          <div class="bg-white rounded-lg shadow border border-gray-200 p-4">
            <h2 class="text-xl font-semibold mb-4">Detailed Information</h2>
            
            <div v-if="hasBeenAnalyzed" class="mb-6">
              <Button 
                icon="pi pi-file-pdf" 
                label="Show Report" 
                @click="toggleJobReportDialog" 
                :loading="isLoadingJobReport"
                severity="info"
                class="mr-2"
              />
              <Button 
                icon="pi pi-refresh" 
                @click="runAnalysis(true)"
                :loading="isRunningAnalysis"
                severity="secondary"
                text
              />
            </div>
            
            <div v-else class="mb-6">
              <Button 
                icon="pi pi-brain" 
                label="Run AI Analysis" 
                severity="info"
                :loading="isRunningAnalysis"
                @click="runAnalysis(false)"
              />
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Additional details sections can be added here -->
              <div>
                <div class="text-gray-500 mb-1">Subject</div>
                <div class="font-medium">{{ dispatchData.subject || 'N/A' }}</div>
              </div>
              
              <div>
                <div class="text-gray-500 mb-1">Item ID</div>
                <div class="font-medium">{{ dispatchData.itemId || 'N/A' }}</div>
              </div>
              
              <div>
                <div class="text-gray-500 mb-1">Failure Code</div>
                <div class="font-medium">{{ dispatchData.failureCode || 'N/A' }}</div>
              </div>
              
              <div>
                <div class="text-gray-500 mb-1">Status</div>
                <div class="font-medium">
                  <Tag 
                    :value="dispatchData.status || 'N/A'" 
                    severity="info"
                    class="text-xs px-2 py-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabPanel>
        
        <!-- Notes Tab -->
        <TabPanel header="Notes">
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
                <div class="bg-gray-50 p-3 rounded-md min-h-[100px]">{{ dispatchData.notes || 'No notes available' }}</div>
              </div>
              
              <div>
                <div class="text-gray-500 mb-1">Scope</div>
                <div class="bg-gray-50 p-3 rounded-md min-h-[100px]">{{ dispatchData.scope || 'No scope information available' }}</div>
              </div>
              
              <div>
                <div class="text-gray-500 mb-1">Additional Notes</div>
                <div class="bg-gray-50 p-3 rounded-md min-h-[100px]">{{ dispatchData.additionalNotes || 'No additional notes available' }}</div>
              </div>
              
              <div>
                <div class="text-gray-500 mb-1">Service Details</div>
                <div class="bg-gray-50 p-3 rounded-md min-h-[100px]">{{ dispatchData.serviceDetails || 'No service details available' }}</div>
              </div>
            </div>
          </div>
        </TabPanel>
        
        <!-- Financial Tab -->
        <TabPanel header="Financial">
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
            <DataTable 
              :value="financialRecords" 
              stripedRows 
              class="p-datatable-sm"
              showGridlines
              responsiveLayout="scroll"
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
                    ${{ slotProps.data.financials.Total_Receivable.toFixed(2) }}
                  </div>
                </template>
              </Column>
              
              <Column field="financials.Total_Payable" header="Payable" style="min-width: 120px">
                <template #body="slotProps">
                  <div class="text-right">
                    ${{ slotProps.data.financials.Total_Payable.toFixed(2) }}
                  </div>
                </template>
              </Column>
              
              <Column header="Profit" style="min-width: 120px">
                <template #body="slotProps">
                  <div class="text-right">
                    <span :class="getItemProfitClass(slotProps.data)">
                      ${{ (slotProps.data.financials.Total_Receivable - slotProps.data.financials.Total_Payable).toFixed(2) }}
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
              <div class="mb-4">
                <div class="text-xs text-gray-500">{{ selectedFinancialRecord.notes.postFirstDetails }}</div>
                <div class="text-sm mt-1">{{ selectedFinancialRecord.notes.postFirst }}</div>
              </div>
              
              <div v-if="selectedFinancialRecord.notes.postLast">
                <div class="text-xs text-gray-500">{{ selectedFinancialRecord.notes.postLastDetails }}</div>
                <div class="text-sm mt-1" v-html="selectedFinancialRecord.notes.postLast"></div>
              </div>
            </div>
          </div>
        </TabPanel>
        
        <!-- Visit Summary Tab (if analyzed) -->
        <TabPanel v-if="hasBeenAnalyzed" header="Visit Summary">
          <div class="bg-white rounded-lg shadow border border-gray-200 p-4">
            <h2 class="text-xl font-semibold mb-4">Visit Analysis</h2>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <div class="text-gray-500 mb-1">Total Visits</div>
                <div class="font-medium">{{ dispatchData.totalVisits || 'N/A' }}</div>
              </div>
              
              <div>
                <div class="text-gray-500 mb-1">Total Tickets</div>
                <div class="font-medium">{{ dispatchData.totalTickets || 'N/A' }}</div>
              </div>
              
              <div>
                <div class="text-gray-500 mb-1">Key Issues</div>
                <div class="font-medium">{{ dispatchData.keyIssues || 'N/A' }}</div>
              </div>
              
              <div>
                <div class="text-gray-500 mb-1">Summary</div>
                <div class="font-medium">{{ dispatchData.summary || 'N/A' }}</div>
              </div>
            </div>
            
            <Button 
              label="View All Visits" 
              icon="pi pi-eye" 
              outlined
              @click="fetchLinkedTickets" 
              class="w-full"
            />
          </div>
        </TabPanel>
      </TabView>
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
              :value="dispatchData.notes"
              readonly
            ></textarea>
          </div>
          
          <div class="flex flex-col gap-2">
            <label class="text-xs font-semibold text-surface-600">Scope</label>
            <textarea 
              class="p-inputtext w-full" 
              rows="4" 
              :value="dispatchData.scope"
              readonly
            ></textarea>
          </div>
          
          <div class="flex flex-col gap-2">
            <label class="text-xs font-semibold text-surface-600">Service Details</label>
            <textarea 
              class="p-inputtext w-full" 
              rows="4" 
              :value="dispatchData.serviceDetails"
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
        <div v-if="isLoadingJobReport" class="flex items-center justify-center py-8">
          <span class="pi pi-spin pi-spinner text-3xl text-primary"></span>
        </div>
        
        <div v-else-if="jobReport && !jobReport.success" class="bg-red-50 border border-red-200 rounded p-4 text-red-700">
          <h3 class="text-lg font-semibold mb-2">Error Loading Report</h3>
          <p>{{ jobReport.message }}</p>
        </div>
        
        <div v-else-if="jobReport && jobReport.success" class="flex flex-col gap-6">
          <!-- Report content here -->
          <Accordion :activeIndex="0" class="w-full">
            <AccordionTab header="Job Summary">
              <div class="grid">
                <div class="col-12 md:col-6 p-2">
                  <div class="flex flex-col gap-2">
                    <label class="text-xs font-semibold text-surface-600">Customer</label>
                    <div class="p-inputtext w-full">{{ jobReport.customer_name || 'N/A' }}</div>
                  </div>
                </div>
                <div class="col-12 md:col-6 p-2">
                  <div class="flex flex-col gap-2">
                    <label class="text-xs font-semibold text-surface-600">Total Visits</label>
                    <div class="p-inputtext w-full">{{ (jobReport.visits || []).length || 'N/A' }}</div>
                  </div>
                </div>
                <div class="col-12 p-2">
                  <div class="flex flex-col gap-2">
                    <label class="text-xs font-semibold text-surface-600">Overall Job Summary</label>
                    <div class="p-inputtext w-full">{{ jobReport.job_summary || 'No summary available' }}</div>
                  </div>
                </div>
              </div>
            </AccordionTab>
            
            <AccordionTab header="Timeline">
              <Timeline :value="timelineEvents" layout="horizontal" class="w-full">
                <template #content="slotProps">
                  <div class="flex flex-col gap-1">
                    <div class="font-bold">{{ slotProps.item.phase_name }}</div>
                    <div class="text-xs">{{ formatTimelineDate(slotProps.item.visit_date) }}</div>
                    <Tag :value="slotProps.item.status" :severity="getTimelineEventSeverity(slotProps.item)" />
                    <div class="mt-2 text-sm">{{ slotProps.item.work_summary }}</div>
                  </div>
                </template>
                <template #opposite="slotProps">
                  <div class="flex flex-col items-center">
                    <span class="text-xs">{{ slotProps.item.visit_number || 'Visit' }}</span>
                  </div>
                </template>
                <template #marker="slotProps">
                  <span :class="slotProps.item.icon" :style="{ color: slotProps.item.color }"></span>
                </template>
              </Timeline>
            </AccordionTab>
            
            <AccordionTab header="Key Issues">
              <div class="flex flex-col gap-4">
                <div v-for="(issue, i) in jobReport.key_issues || []" :key="i" class="border-b border-surface-200 pb-2">
                  <div class="flex items-center gap-2 mb-1">
                    <Tag :value="issue.status || 'Open'" :severity="getIssueSeverity(issue)" />
                    <span class="font-semibold">{{ issue.title }}</span>
                  </div>
                  <p class="text-sm">{{ issue.description }}</p>
                </div>
                
                <div v-if="!(jobReport.key_issues || []).length" class="text-surface-600 italic">
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
    
    <!-- Analysis Dialog -->
    <Dialog 
      v-model:visible="showAnalysisDialog" 
      header="Analyze Ticket Chain" 
      modal 
      :closable="!isRunningAnalysis"
      class="w-full max-w-lg"
    >
      <div class="flex flex-col gap-4 p-3">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">AI Model Selection</label>
          <Select 
            v-model="selectedAiModel" 
            :options="availableModels" 
            optionLabel="label" 
            optionValue="value"
            class="w-full"
          />
          <small class="text-surface-600">Select the AI model to use for chain analysis.</small>
        </div>
        
        <div class="bg-yellow-50 border border-yellow-200 rounded p-3 text-yellow-700 text-sm">
          <span class="pi pi-info-circle mr-2"></span>
          <span v-if="forceRefreshAnalysis">This will re-analyze the ticket chain from scratch, which may take several minutes.</span>
          <span v-else>This process will analyze the complete ticket chain to provide insights. This may take several minutes.</span>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button 
            label="Cancel" 
            icon="pi pi-times" 
            @click="showAnalysisDialog = false"
            :disabled="isRunningAnalysis"
            text
          />
          <Button 
            label="Start Analysis" 
            icon="pi pi-play" 
            @click="startAnalysis"
            :loading="isRunningAnalysis"
            severity="info"
          />
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
