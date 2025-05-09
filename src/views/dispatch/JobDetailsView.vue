<script setup>
import { ref, watch, computed, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from 'primevue/button';
import { useDispatchStore } from '@/stores/dispatchStore';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import Panel from 'primevue/panel';
import Tag from 'primevue/tag';
import Drawer from 'primevue/drawer';
import Card from 'primevue/card';
import { DispatchService } from '@/service/DispatchService';
import Fieldset from 'primevue/fieldset';
import Timeline from 'primevue/timeline';
import Dialog from 'primevue/dialog';
import ScrollPanel from 'primevue/scrollpanel';
import Accordion from 'primevue/accordion';
import AccordionTab from 'primevue/accordiontab';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Select from 'primevue/select';
import TabView from 'primevue/tabview';

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

// Simple back navigation
function goBack() {
  if (router.options.history.state.back) {
    router.back();
  } else {
    router.push({ name: 'dispatch-jobs' });
  }
}

// Toggle notes drawer
function toggleNotesDrawer() {
  displayNotesDrawer.value = !displayNotesDrawer.value;
}

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

// Passthrough (pt) options for the PrimeVue components
const tabsPtOptions = {
  root: { class: 'mb-6' },
  navContainer: { 
    class: 'border-b border-surface-200 dark:border-surface-700 mb-1'
  },
  nav: { class: 'flex' }
};

const tabListPtOptions = {
  root: { class: 'flex flex-nowrap overflow-x-auto' }
};

const tabPtOptions = {
  root: { 
    class: 'px-4 py-2 font-medium text-sm rounded-t-lg transition-colors duration-200 focus:outline-none focus:ring-0 border-b-2'
  },
  selected: {
    class: 'text-primary-600 dark:text-primary-400 border-primary-500 dark:border-primary-400'
  },
  notSelected: {
    class: 'text-surface-700 dark:text-surface-300 border-transparent hover:text-surface-900 dark:hover:text-surface-100 hover:border-surface-300 dark:hover:border-surface-600'
  }
};

const tabPanelsPtOptions = {
  root: { class: 'mt-3' }
};

const tabPanelPtOptions = {
  root: { class: 'p-0' }
};

const panelPtOptions = {
  root: { 
    class: 'mb-4 border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden shadow-sm' 
  },
  header: { 
    class: 'bg-surface-50 dark:bg-surface-800 px-4 py-3 border-b border-surface-200 dark:border-surface-700 flex items-center' 
  },
  title: { 
    class: 'text-base font-medium text-surface-800 dark:text-surface-100' 
  },
  content: { 
    class: 'p-4 bg-white dark:bg-surface-900' 
  },
  icons: { 
    class: 'ml-auto' 
  },
  togglericon: {
    class: 'text-surface-600 dark:text-surface-400'
  }
};

const drawerPtOptions = {
  root: { 
    class: 'bg-white dark:bg-surface-900 shadow-lg',
    style: 'max-width: 40rem; width: 100%'
  },
  header: { 
    class: 'px-6 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800' 
  },
  title: {
    class: 'text-xl font-bold text-surface-800 dark:text-white'
  },
  content: { class: 'p-4 overflow-y-auto' },
  footer: { class: 'p-4 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800' },
  closeButton: {
    class: 'p-2 rounded-full hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors'
  },
  closeButtonIcon: {
    class: 'text-surface-600 dark:text-surface-400'
  },
  mask: {
    class: 'bg-black/40'
  },
  transition: {
    enterFromClass: 'translate-x-full',
    enterActiveClass: 'transition-transform duration-300 ease-out',
    enterToClass: 'translate-x-0',
    leaveFromClass: 'translate-x-0',
    leaveActiveClass: 'transition-transform duration-300 ease-in',
    leaveToClass: 'translate-x-full'
  }
};

const buttonPtOptions = {
  root: { 
    class: 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400'
  },
  outlined: {
    class: 'border border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800'
  },
  text: {
    class: 'hover:bg-surface-100 dark:hover:bg-surface-800'
  },
  primary: {
    class: 'bg-primary-500 hover:bg-primary-600 text-white'
  }
};

const tagPtOptions = {
  root: {
    class: 'inline-flex items-center px-2 py-1 text-xs font-medium rounded-md'
  },
  success: {
    class: 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300'
  },
  info: {
    class: 'bg-info-100 text-info-800 dark:bg-info-900 dark:text-info-300'
  },
  warning: {
    class: 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-300'
  },
  danger: {
    class: 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-300'
  }
};

const fieldsetPtOptions = {
  root: {
    class: 'border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden shadow-sm'
  },
  legend: {
    class: 'px-4 py-2 bg-surface-50 dark:bg-surface-800 text-base font-medium text-surface-800 dark:text-surface-100'
  },
  toggleable: {
    class: 'border-b border-surface-200 dark:border-surface-700'
  }
};

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
</script>

<template>
  <div class="p-2">
    <!-- Loading state -->
    <div v-if="!dispatchData" class="flex align-items-center justify-content-center h-64">
      <span class="pi pi-spin pi-spinner text-4xl text-primary" />
    </div>
    
    <div v-else class="dispatch-details">
      <!-- Header with navigation and ticket number -->
      <div class="mb-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <Button 
              icon="pi pi-arrow-left" 
              @click="goBack" 
              text 
              :pt="{
                root: { class: 'hover:bg-gray-100 mr-2 p-2 rounded-full' }
              }" 
            />
            <h1 class="text-xl font-semibold m-0">Dispatch Ticket #{{ ticketId }}</h1>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex items-center gap-2">
            <Button 
              v-if="!hasBeenAnalyzed" 
              icon="pi pi-brain" 
              label="Run AI Analysis" 
              severity="info"
              :loading="isRunningAnalysis"
              :disabled="isRunningAnalysis" 
              @click="runAnalysis(false)"
              size="small"
            />
            <Button 
              v-else 
              icon="pi pi-file-pdf" 
              label="Show Report" 
              @click="toggleJobReportDialog" 
              :loading="isLoadingJobReport"
              :disabled="isLoadingJobReport"
              severity="info"
              size="small"
            />
            <Button 
              v-if="hasBeenAnalyzed" 
              icon="pi pi-refresh" 
              @click="runAnalysis(true)"
              :loading="isRunningAnalysis"
              :disabled="isRunningAnalysis" 
              severity="secondary"
              text
              size="small"
            />
          </div>
        </div>

        <!-- Status indicators -->
        <div class="flex flex-wrap py-2 gap-3 mt-2">
          <div class="flex items-center">
            <span class="bg-surface-200 text-surface-700 text-xs font-semibold px-2 py-1 rounded-l">Status</span>
            <Tag 
              :value="dispatchData.status || 'N/A'" 
              severity="info"
              :pt="{
                root: { class: 'text-xs px-2 py-1 rounded-l-none' }
              }"
            />
          </div>
          
          <div class="flex items-center">
            <span class="bg-surface-200 text-surface-700 text-xs font-semibold px-2 py-1 rounded-l">Created</span>
            <span class="bg-surface-100 text-surface-800 text-xs px-2 py-1 rounded-r">{{ formatShortDate(dispatchData.createdTimestamp) || dispatchData.createdDate || 'N/A' }}</span>
          </div>
          
          <div class="flex items-center">
            <span class="bg-surface-200 text-surface-700 text-xs font-semibold px-2 py-1 rounded-l">Service Date</span>
            <span class="bg-surface-100 text-surface-800 text-xs px-2 py-1 rounded-r">{{ dispatchData.serviceDate || 'N/A' }}</span>
          </div>
          
          <div class="flex items-center">
            <span class="bg-surface-200 text-surface-700 text-xs font-semibold px-2 py-1 rounded-l">Billing</span>
            <Tag 
              :value="dispatchData.billing?.billingStatus || 'Not Billed'" 
              :severity="billingSeverity"
              :pt="{
                root: { class: 'text-xs px-2 py-1 rounded-l-none' }
              }"
            />
          </div>
          
          <div v-if="hasBeenAnalyzed" class="flex items-center ml-auto">
            <Tag 
              severity="success" 
              icon="pi pi-check-circle"
              :pt="{
                root: { class: 'text-xs px-2 py-1' }
              }"
            >
              Job Analyzed
            </Tag>
          </div>
        </div>
      </div>

      <!-- Tabbed interface -->
      <Tabs 
        :defaultIndex="0" 
        :pt="{
          root: { class: 'mb-4' },
          navContainer: { class: 'border-b border-surface-200 dark:border-surface-700 bg-surface-50' },
          nav: { class: 'flex px-2' }
        }"
      >
        <TabList 
          :pt="{
            root: { class: 'flex flex-nowrap overflow-x-auto' }
          }"
        >
          <Tab 
            value="0" 
            :pt="{
              root: { class: 'px-3 py-2 font-medium text-sm transition-colors duration-200 border-b-2 focus:outline-none' },
              selected: { class: 'text-primary-600 border-primary-500' },
              notSelected: { class: 'text-surface-600 border-transparent hover:text-surface-900 hover:border-surface-300' }
            }"
          >
            <i class="pi pi-info-circle mr-2"></i>
            Job Details
          </Tab>
          <Tab 
            value="1" 
            :pt="{
              root: { class: 'px-3 py-2 font-medium text-sm transition-colors duration-200 border-b-2 focus:outline-none' },
              selected: { class: 'text-primary-600 border-primary-500' },
              notSelected: { class: 'text-surface-600 border-transparent hover:text-surface-900 hover:border-surface-300' }
            }"
          >
            <i class="pi pi-dollar mr-2"></i>
            Billing
          </Tab>
          <Tab 
            value="2" 
            :pt="{
              root: { class: 'px-3 py-2 font-medium text-sm transition-colors duration-200 border-b-2 focus:outline-none' },
              selected: { class: 'text-primary-600 border-primary-500' },
              notSelected: { class: 'text-surface-600 border-transparent hover:text-surface-900 hover:border-surface-300' }
            }"
          >
            <i class="pi pi-file-edit mr-2"></i>
            Notes & Scope
          </Tab>
          <Tab 
            v-if="hasBeenAnalyzed" 
            value="3" 
            :pt="{
              root: { class: 'px-3 py-2 font-medium text-sm transition-colors duration-200 border-b-2 focus:outline-none' },
              selected: { class: 'text-primary-600 border-primary-500' },
              notSelected: { class: 'text-surface-600 border-transparent hover:text-surface-900 hover:border-surface-300' }
            }"
          >
            <i class="pi pi-chart-line mr-2"></i>
            Visit Summary
          </Tab>
        </TabList>
        <TabPanels 
          :pt="{
            root: { class: 'mt-4' }
          }"
        >
          <!-- Job Details Tab -->
          <TabPanel value="0" :pt="{ root: { class: 'p-0' } }">
            <!-- Job Information Section -->
            <div class="mb-4">
              <!-- Job Information Panel -->
              <Panel 
                header="Job Information" 
                class="card"
                :pt="{
                  root: { class: 'border border-surface-200 rounded-lg shadow-sm overflow-hidden mb-4' },
                  header: { class: 'bg-surface-50 p-3 border-b border-surface-200 flex items-center' },
                  title: { class: 'font-medium text-lg text-surface-800' },
                  content: { class: 'p-4 bg-white' },
                  icons: { class: 'ml-auto' }
                }"
              >
                <template #icons>
                  <Button 
                    label="Close-out Notes" 
                    icon="pi pi-file-edit" 
                    outlined
                    @click="toggleNotesDrawer" 
                    size="small"
                    class="py-1 px-2"
                  />
                </template>
                
                <!-- First row: Customer, Project -->
                <div class="flex flex-col md:flex-row gap-4">
                  <div class="flex flex-wrap gap-2 w-full">
                    <label class="text-xs font-semibold text-surface-600" for="customer">Customer</label>
                    <div id="customer" class="p-inputtext w-full">{{ dispatchData.customerName || 'N/A' }}</div>
                  </div>
                  <div class="flex flex-wrap gap-2 w-full">
                    <label class="text-xs font-semibold text-surface-600" for="project">Project</label>
                    <div id="project" class="p-inputtext w-full">{{ dispatchData.jobDetails?.projectName || 'N/A' }}</div>
                  </div>
                </div>
                
                <!-- Second row: Subject, Item ID -->
                <div class="flex flex-col md:flex-row gap-4 mt-4">
                  <div class="flex flex-wrap gap-2 w-full">
                    <label class="text-xs font-semibold text-surface-600" for="subject">Subject</label>
                    <div id="subject" class="p-inputtext w-full">{{ dispatchData.subject || 'N/A' }}</div>
                  </div>
                  <div class="flex flex-wrap gap-2 w-full">
                    <label class="text-xs font-semibold text-surface-600" for="itemId">Item ID</label>
                    <div id="itemId" class="p-inputtext w-full">{{ dispatchData.itemId || 'N/A' }}</div>
                  </div>
                </div>
                
                <!-- Third row: Service Date, Job Line Type -->
                <div class="flex flex-col md:flex-row gap-4 mt-4">
                  <div class="flex flex-wrap gap-2 w-full">
                    <label class="text-xs font-semibold text-surface-600" for="serviceDate">Service Date</label>
                    <div id="serviceDate" class="p-inputtext w-full">{{ dispatchData.serviceDate || 'N/A' }}</div>
                  </div>
                  <div class="flex flex-wrap gap-2 w-full">
                    <label class="text-xs font-semibold text-surface-600" for="jobLineType">Job Line Type</label>
                    <div id="jobLineType" class="p-inputtext w-full">{{ dispatchData.jobLineType || 'N/A' }}</div>
                  </div>
                </div>
                
                <!-- Fourth row: Failure Code, Status -->
                <div class="flex flex-col md:flex-row gap-4 mt-4">
                  <div class="flex flex-wrap gap-2 w-full">
                    <label class="text-xs font-semibold text-surface-600" for="failureCode">Failure Code</label>
                    <div id="failureCode" class="p-inputtext w-full">{{ dispatchData.failureCode || 'N/A' }}</div>
                  </div>
                  <div class="flex flex-wrap gap-2 w-full">
                    <label class="text-xs font-semibold text-surface-600" for="status">Status</label>
                    <div id="status" class="w-full">
                      <Tag 
                        :value="dispatchData.status || 'N/A'" 
                        severity="info"
                        :pt="{
                          root: { class: 'text-xs px-2 py-1' }
                        }"
                      />
                    </div>
                  </div>
                </div>
                
                <!-- Fifth row: Billing Status (optional) -->
                <div class="flex flex-col gap-4 mt-4">
                  <div class="flex flex-wrap gap-2 w-full">
                    <label class="text-xs font-semibold text-surface-600" for="billingStatus">Billing Status</label>
                    <div id="billingStatus" class="w-full">
                      <Tag 
                        :value="dispatchData.billing?.billingStatus || 'Not Billed'" 
                        :severity="billingSeverity"
                        :pt="{
                          root: { class: 'text-xs px-2 py-1' }
                        }"
                      />
                    </div>
                  </div>
                </div>
              </Panel>
            </div>
            
            <!-- Location Section -->
            <Panel 
              header="Location" 
              class="card mb-4"
              :pt="{
                root: { class: 'border border-surface-200 rounded-lg shadow-sm overflow-hidden' },
                header: { class: 'bg-surface-50 p-3 border-b border-surface-200' },
                title: { class: 'font-medium text-lg text-surface-800' },
                content: { class: 'p-4 bg-white' }
              }"
            >
              <!-- First row: Site #, Address -->
              <div class="flex flex-col md:flex-row gap-4">
                <div class="flex flex-wrap gap-2 w-full">
                  <label class="text-xs font-semibold text-surface-600" for="siteNumber">Site #</label>
                  <div id="siteNumber" class="p-inputtext w-full">{{ dispatchData.siteNumber || 'N/A' }}</div>
                </div>
                <div class="flex flex-wrap gap-2 w-full">
                  <label class="text-xs font-semibold text-surface-600" for="address">Address</label>
                  <div id="address" class="p-inputtext w-full">{{ dispatchData.address || 'N/A' }}</div>
                </div>
              </div>
              
              <!-- Second row: Zip Code, City/State -->
              <div class="flex flex-col md:flex-row gap-4 mt-4">
                <div class="flex flex-wrap gap-2 w-full">
                  <label class="text-xs font-semibold text-surface-600" for="zipCode">Zip Code</label>
                  <div id="zipCode" class="p-inputtext w-full">{{ dispatchData.zipCode || 'N/A' }}</div>
                </div>
                <div class="flex flex-wrap gap-2 w-full">
                  <label class="text-xs font-semibold text-surface-600" for="cityState">City/State</label>
                  <div id="cityState" class="p-inputtext w-full">{{ dispatchData.cityState || 'N/A' }}</div>
                </div>
              </div>
            </Panel>
            
            <!-- Visit Record Section -->
            <Panel 
              header="Visit Record" 
              class="card mb-4"
              :pt="{
                root: { class: 'border border-surface-200 rounded-lg shadow-sm overflow-hidden' },
                header: { class: 'bg-surface-50 p-3 border-b border-surface-200' },
                title: { class: 'font-medium text-lg text-surface-800' },
                content: { class: 'p-4 bg-white' }
              }"
            >
              <!-- First row: Visit ID, Check-out Time -->
              <div class="flex flex-col md:flex-row gap-4">
                <div class="flex flex-wrap gap-2 w-full">
                  <label class="text-xs font-semibold text-surface-600" for="visitId">Visit ID</label>
                  <div id="visitId" class="p-inputtext w-full">{{ dispatchData.schedule?.visitRecordId || 'N/A' }}</div>
                </div>
                <div class="flex flex-wrap gap-2 w-full">
                  <label class="text-xs font-semibold text-surface-600" for="checkoutTime">Check-out Time</label>
                  <div id="checkoutTime" class="p-inputtext w-full">{{ dispatchData.schedule?.checkOutTime || 'N/A' }}</div>
                </div>
              </div>
              
              <!-- Second row: Check-in Time, Status -->
              <div class="flex flex-col md:flex-row gap-4 mt-4">
                <div class="flex flex-wrap gap-2 w-full">
                  <label class="text-xs font-semibold text-surface-600" for="checkinTime">Check-in Time</label>
                  <div id="checkinTime" class="p-inputtext w-full">{{ dispatchData.schedule?.checkInTime || 'N/A' }}</div>
                </div>
                <div class="flex flex-wrap gap-2 w-full">
                  <label class="text-xs font-semibold text-surface-600" for="visitStatus">Status</label>
                  <div id="visitStatus" class="w-full">
                    <Tag 
                      :value="dispatchData.schedule?.status || 'N/A'" 
                      severity="info"
                      :pt="{
                        root: { class: 'text-xs px-2 py-1' }
                      }"
                    />
                  </div>
                </div>
              </div>
              
              <!-- Third row: Duration, Visit Number -->
              <div class="flex flex-col md:flex-row gap-4 mt-4">
                <div class="flex flex-wrap gap-2 w-full">
                  <label class="text-xs font-semibold text-surface-600" for="duration">Duration</label>
                  <div id="duration" class="p-inputtext w-full">{{ dispatchData.schedule?.duration || 'N/A' }}</div>
                </div>
                <div class="flex flex-wrap gap-2 w-full">
                  <label class="text-xs font-semibold text-surface-600" for="visitNumber">Visit Number</label>
                  <div id="visitNumber" class="p-inputtext w-full">{{ dispatchData.schedule?.visitNumber || 'N/A' }}</div>
                </div>
              </div>
            </Panel>
            
            <!-- Technician Section -->
            <Panel 
              header="Technician Information" 
              class="card mb-4"
              :pt="{
                root: { class: 'border border-surface-200 rounded-lg shadow-sm overflow-hidden' },
                header: { class: 'bg-surface-50 p-3 border-b border-surface-200' },
                title: { class: 'font-medium text-lg text-surface-800' },
                content: { class: 'p-4 bg-white' }
              }"
            >
              <!-- First row: Name, Department -->
              <div class="flex flex-col md:flex-row gap-4">
                <div class="flex flex-wrap gap-2 w-full">
                  <label class="text-xs font-semibold text-surface-600" for="techName">Name</label>
                  <div id="techName" class="p-inputtext w-full">{{ dispatchData.technicianName || 'N/A' }}</div>
                </div>
                <div class="flex flex-wrap gap-2 w-full">
                  <label class="text-xs font-semibold text-surface-600" for="department">Department</label>
                  <div id="department" class="p-inputtext w-full">{{ dispatchData.department || 'N/A' }}</div>
                </div>
              </div>
              
              <!-- Second row: Employee ID, Certification -->
              <div class="flex flex-col md:flex-row gap-4 mt-4">
                <div class="flex flex-wrap gap-2 w-full">
                  <label class="text-xs font-semibold text-surface-600" for="employeeId">Employee ID</label>
                  <div id="employeeId" class="p-inputtext w-full">{{ dispatchData.technicianId || 'N/A' }}</div>
                </div>
                <div class="flex flex-wrap gap-2 w-full">
                  <label class="text-xs font-semibold text-surface-600" for="certification">Certification</label>
                  <div id="certification" class="p-inputtext w-full">{{ dispatchData.certification || 'N/A' }}</div>
                </div>
              </div>
              
              <!-- Third row: Phone, Specialization -->
              <div class="flex flex-col md:flex-row gap-4 mt-4">
                <div class="flex flex-wrap gap-2 w-full">
                  <label class="text-xs font-semibold text-surface-600" for="phone">Phone</label>
                  <div id="phone" class="p-inputtext w-full">{{ dispatchData.technicianPhone || 'N/A' }}</div>
                </div>
                <div class="flex flex-wrap gap-2 w-full">
                  <label class="text-xs font-semibold text-surface-600" for="specialization">Specialization</label>
                  <div id="specialization" class="p-inputtext w-full">{{ dispatchData.specialization || 'N/A' }}</div>
                </div>
              </div>
            </Panel>
          </TabPanel>
          <!-- Billing Tab -->
          <TabPanel value="1" :pt="{ root: { class: 'p-0' } }">
            <!-- Billing Information Panel -->
            <Panel 
              header="Billing Information" 
              class="card"
              :pt="{
                root: { class: 'border border-surface-200 rounded-lg shadow-sm overflow-hidden mb-4' },
                header: { class: 'bg-surface-50 p-3 border-b border-surface-200 flex items-center' },
                title: { class: 'font-medium text-lg text-surface-800' },
                content: { class: 'p-0 bg-white' },
                icons: { class: 'ml-auto' }
              }"
            >
              <template #icons>
                <Button 
                  label="Edit Billing" 
                  icon="pi pi-pencil" 
                  outlined
                  @click="toggleNotesDrawer" 
                  size="small"
                  class="py-1 px-2"
                />
              </template>
              
              <div class="grid">
                <!-- Column 1 - Left side -->
                <div class="col-12 md:col-6 p-0">
                  <div class="p-3">
                    <div class="mb-3">
                      <label class="text-xs font-semibold text-surface-600 block mb-1">Billing Status</label>
                      <Tag 
                        :value="dispatchData.billing?.billingStatus || 'Not Billed'" 
                        :severity="billingSeverity"
                        :pt="{
                          root: { class: 'text-xs px-2 py-1' }
                        }"
                      />
                    </div>
                    
                    <div>
                      <label class="text-xs font-semibold text-surface-600 block mb-1">Billing Amount</label>
                      <div class="text-sm">{{ dispatchData.billing?.billingAmount || 'N/A' }}</div>
                    </div>
                  </div>
                </div>
                
                <!-- Column 2 - Right side -->
                <div class="col-12 md:col-6 p-0">
                  <div class="p-3 h-full border-left-1 surface-border">
                    <div class="mb-3">
                      <label class="text-xs font-semibold text-surface-600 block mb-1">Payment Due Date</label>
                      <div class="text-sm">{{ dispatchData.billing?.paymentDueDate || 'N/A' }}</div>
                    </div>
                    
                    <div>
                      <label class="text-xs font-semibold text-surface-600 block mb-1">Payment Method</label>
                      <div class="text-sm">{{ dispatchData.billing?.paymentMethod || 'N/A' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Panel>
          </TabPanel>
          <!-- Notes & Scope Tab -->
          <TabPanel value="2" :pt="{ root: { class: 'p-0' } }">
            <!-- Notes & Scope Panel -->
            <Panel 
              header="Notes & Scope" 
              class="card"
              :pt="{
                root: { class: 'border border-surface-200 rounded-lg shadow-sm overflow-hidden mb-4' },
                header: { class: 'bg-surface-50 p-3 border-b border-surface-200 flex items-center' },
                title: { class: 'font-medium text-lg text-surface-800' },
                content: { class: 'p-0 bg-white' },
                icons: { class: 'ml-auto' }
              }"
            >
              <template #icons>
                <Button 
                  label="Edit Notes" 
                  icon="pi pi-pencil" 
                  outlined
                  @click="toggleNotesDrawer" 
                  size="small"
                  class="py-1 px-2"
                />
              </template>
              
              <div class="grid">
                <!-- Column 1 - Left side -->
                <div class="col-12 md:col-6 p-0">
                  <div class="p-3">
                    <div class="mb-3">
                      <label class="text-xs font-semibold text-surface-600 block mb-1">Notes</label>
                      <div class="text-sm">{{ dispatchData.notes || 'N/A' }}</div>
                    </div>
                    
                    <div>
                      <label class="text-xs font-semibold text-surface-600 block mb-1">Scope</label>
                      <div class="text-sm">{{ dispatchData.scope || 'N/A' }}</div>
                    </div>
                  </div>
                </div>
                
                <!-- Column 2 - Right side -->
                <div class="col-12 md:col-6 p-0">
                  <div class="p-3 h-full border-left-1 surface-border">
                    <div class="mb-3">
                      <label class="text-xs font-semibold text-surface-600 block mb-1">Additional Notes</label>
                      <div class="text-sm">{{ dispatchData.additionalNotes || 'N/A' }}</div>
                    </div>
                    
                    <div>
                      <label class="text-xs font-semibold text-surface-600 block mb-1">Service Details</label>
                      <div class="text-sm">{{ dispatchData.serviceDetails || 'N/A' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Panel>
          </TabPanel>
          <!-- Visit Summary Tab -->
          <TabPanel value="3" :pt="{ root: { class: 'p-0' } }">
            <!-- Visit Summary Panel -->
            <Panel 
              header="Visit Summary" 
              class="card"
              :pt="{
                root: { class: 'border border-surface-200 rounded-lg shadow-sm overflow-hidden mb-4' },
                header: { class: 'bg-surface-50 p-3 border-b border-surface-200 flex items-center' },
                title: { class: 'font-medium text-lg text-surface-800' },
                content: { class: 'p-0 bg-white' },
                icons: { class: 'ml-auto' }
              }"
            >
              <template #icons>
                <Button 
                  label="View All Visits" 
                  icon="pi pi-eye" 
                  outlined
                  @click="fetchLinkedTickets" 
                  size="small"
                  class="py-1 px-2"
                />
              </template>
              
              <div class="grid">
                <!-- Column 1 - Left side -->
                <div class="col-12 md:col-6 p-0">
                  <div class="p-3">
                    <div class="mb-3">
                      <label class="text-xs font-semibold text-surface-600 block mb-1">Total Visits</label>
                      <div class="text-sm">{{ dispatchData.totalVisits || 'N/A' }}</div>
                    </div>
                    
                    <div>
                      <label class="text-xs font-semibold text-surface-600 block mb-1">Total Tickets</label>
                      <div class="text-sm">{{ dispatchData.totalTickets || 'N/A' }}</div>
                    </div>
                  </div>
                </div>
                
                <!-- Column 2 - Right side -->
                <div class="col-12 md:col-6 p-0">
                  <div class="p-3 h-full border-left-1 surface-border">
                    <div class="mb-3">
                      <label class="text-xs font-semibold text-surface-600 block mb-1">Key Issues</label>
                      <div class="text-sm">{{ dispatchData.keyIssues || 'N/A' }}</div>
                    </div>
                    
                    <div>
                      <label class="text-xs font-semibold text-surface-600 block mb-1">Summary</label>
                      <div class="text-sm">{{ dispatchData.summary || 'N/A' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Panel>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  </div>
</template>

<style scoped>
/* Add your styles here */
</style>
