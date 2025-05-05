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
      <div class="flex align-items-center mb-2">
        <Button icon="pi pi-arrow-left" @click="goBack" text class="mr-2" />
        <h1 class="text-xl font-medium m-0">Dispatch Ticket #{{ ticketId }}</h1>
        
        <!-- Analysis Status Indicator -->
        <div v-if="hasBeenAnalyzed" class="ml-auto flex items-center gap-2">
          <Tag severity="success" icon="pi pi-check-circle" class="mr-2">Job Analyzed</Tag>
          <Button 
            label="Show Job Report" 
            icon="pi pi-file-pdf" 
            @click="toggleJobReportDialog" 
            :loading="isLoadingJobReport"
            :disabled="isLoadingJobReport"
          />
        </div>
      </div>

      <!-- Status summary -->
      <div class="surface-section p-2 border-1 border-300 border-round shadow-1 mb-3">
        <div class="flex flex-column sm:flex-row">
          <div class="flex-auto mb-1 sm:mb-0 sm:mr-4">
            <span class="text-sm text-500 mr-2">Status:</span>
            <span class="font-medium">{{ dispatchData.status || 'N/A' }}</span>
          </div>
          <div class="flex-auto mb-1 sm:mb-0 sm:mr-4">
            <span class="text-sm text-500 mr-2">Priority:</span>
            <span class="font-medium">{{ dispatchData.priority || 'N/A' }}</span>
          </div>
          <div class="flex-auto mb-1 sm:mb-0 sm:mr-4">
            <span class="text-sm text-500 mr-2">Service Date:</span>
            <span class="font-medium">{{ dispatchData.serviceDate || 'N/A' }}</span>
          </div>
          <div class="flex-auto mb-1 sm:mb-0 sm:mr-4">
            <span class="text-sm text-500 mr-2">Billing Status:</span>
            <Tag :value="dispatchData.billing?.billingStatus || 'Not Billed'" 
                 :severity="billingSeverity" />
          </div>
          <div class="flex-auto flex justify-content-end">
            <Button 
              v-if="!hasBeenAnalyzed" 
              icon="pi pi-brain" 
              label="Run AI Analysis" 
              severity="info"
              :loading="isRunningAnalysis"
              :disabled="isRunningAnalysis" 
              @click="runAnalysis(false)"
            />
            <Button 
              v-else 
              icon="pi pi-refresh" 
              label="Re-run Analysis" 
              severity="secondary"
              :loading="isRunningAnalysis"
              :disabled="isRunningAnalysis" 
              @click="runAnalysis(true)"
            />
          </div>
        </div>
      </div>

      <!-- Tabbed interface -->
      <Tabs :defaultIndex="0" :pt="tabsPtOptions">
        <TabList :pt="tabListPtOptions">
          <Tab value="0" :pt="tabPtOptions">Job Details</Tab>
          <Tab value="1" :pt="tabPtOptions">Billing</Tab>
          <Tab value="2" :pt="tabPtOptions">Notes, Scope & Technician</Tab>
          <Tab v-if="hasBeenAnalyzed" value="3" :pt="tabPtOptions">
            <span class="flex items-center gap-2">
              <i class="pi pi-chart-line"></i>Visit Summary
            </span>
          </Tab>
        </TabList>
        <TabPanels :pt="tabPanelsPtOptions">
          <!-- Job Details Tab -->
          <TabPanel value="0" :pt="tabPanelPtOptions">
            <!-- Job Information -->
            <Panel header="Job Information" class="mb-3" :pt="panelPtOptions">
              <template #icons>
                <Button 
                  label="Close-out Notes" 
                  icon="pi pi-file-edit" 
                  outlined
                  @click="toggleNotesDrawer" 
                  size="small"
                />
              </template>
              <div class="flex flex-column md:flex-row gap-2 mb-3">
                <div class="flex-1">
                  <label for="customer" class="block text-sm font-medium mb-1">Customer</label>
                  <div id="customer" class="p-inputtext w-full">{{ dispatchData.customerName || 'N/A' }}</div>
                </div>
                <div class="flex-1">
                  <label for="subject" class="block text-sm font-medium mb-1">Subject</label>
                  <div id="subject" class="p-inputtext w-full">{{ dispatchData.subject || 'N/A' }}</div>
                </div>
                <div class="flex-1">
                  <label for="project" class="block text-sm font-medium mb-1">Project</label>
                  <div id="project" class="p-inputtext w-full">{{ dispatchData.jobDetails?.projectName || 'N/A' }}</div>
                </div>
              </div>
              
              <div class="flex flex-column md:flex-row gap-2">
                <div class="flex-1">
                  <label for="itemid" class="block text-sm font-medium mb-1">Item ID</label>
                  <div id="itemid" class="p-inputtext w-full">{{ dispatchData.itemId || 'N/A' }}</div>
                </div>
                <div class="flex-1">
                  <label for="jobline" class="block text-sm font-medium mb-1">Job Line Type</label>
                  <div id="jobline" class="p-inputtext w-full">{{ dispatchData.jobLineType || 'N/A' }}</div>
                </div>
                <div class="flex-1">
                  <label for="servicedate" class="block text-sm font-medium mb-1">Service Date</label>
                  <div id="servicedate" class="p-inputtext w-full">{{ dispatchData.serviceDate || 'N/A' }}</div>
                </div>
              </div>
            </Panel>

            <div class="flex flex-column xl:flex-row gap-3 mb-3">
              <!-- Location -->
              <Panel header="Location" class="flex-1" :pt="panelPtOptions">
                <div class="flex flex-column md:flex-row gap-2 mb-2">
                  <div class="flex-1">
                    <label for="siteno" class="block text-sm font-medium mb-1">Site #</label>
                    <div id="siteno" class="p-inputtext w-full">{{ dispatchData.siteNumber || 'N/A' }}</div>
                  </div>
                  <div class="flex-1">
                    <label for="zipcode" class="block text-sm font-medium mb-1">Zip Code</label>
                    <div id="zipcode" class="p-inputtext w-full">{{ dispatchData.zipCode || 'N/A' }}</div>
                  </div>
                </div>
                
                <div class="field mb-2">
                  <label for="address" class="block text-sm font-medium mb-1">Address</label>
                  <div id="address" class="p-inputtext w-full">{{ dispatchData.address || 'N/A' }}</div>
                </div>
                
                <div class="field">
                  <label for="citystate" class="block text-sm font-medium mb-1">City/State</label>
                  <div id="citystate" class="p-inputtext w-full">{{ dispatchData.cityState || 'N/A' }}</div>
                </div>
              </Panel>
              
              <!-- Visit Record -->
              <Panel header="Visit Record" class="flex-1" :pt="panelPtOptions">
                <div class="flex flex-column md:flex-row gap-2 mb-2">
                  <div class="flex-1">
                    <label for="visitid" class="block text-sm font-medium mb-1">Visit ID</label>
                    <div id="visitid" class="p-inputtext w-full">{{ dispatchData.schedule?.visitRecordId || 'N/A' }}</div>
                  </div>
                  <div class="flex-1">
                    <label for="queue" class="block text-sm font-medium mb-1">Queue</label>
                    <div id="queue" class="p-inputtext w-full">{{ dispatchData.schedule?.queue || 'N/A' }}</div>
                  </div>
                </div>
                
                <div class="flex flex-column md:flex-row gap-2 mb-2">
                  <div class="flex-1">
                    <label for="checkin" class="block text-sm font-medium mb-1">Check-in Time</label>
                    <div id="checkin" class="p-inputtext w-full">{{ dispatchData.schedule?.checkInTime || 'N/A' }}</div>
                  </div>
                  <div class="flex-1">
                    <label for="checkout" class="block text-sm font-medium mb-1">Check-out Time</label>
                    <div id="checkout" class="p-inputtext w-full">{{ dispatchData.schedule?.checkOutTime || 'N/A' }}</div>
                  </div>
                </div>
                
                <div class="flex flex-column md:flex-row gap-2">
                  <div class="flex-1">
                    <label for="duration" class="block text-sm font-medium mb-1">Duration</label>
                    <div id="duration" class="p-inputtext w-full">{{ dispatchData.schedule?.duration || 'N/A' }}</div>
                  </div>
                  <div class="flex-1">
                    <label for="failcode" class="block text-sm font-medium mb-1">Failure Code</label>
                    <div id="failcode" class="p-inputtext w-full">{{ dispatchData.failureCode || 'N/A' }}</div>
                  </div>
                </div>
              </Panel>
            </div>
            
            <!-- Linked Tickets Section -->
            <div class="mb-3">
              <div class="flex justify-content-end align-items-center mb-2">
                <h2 class="text-lg font-medium m-0 mr-auto">Linked Tickets</h2>
                <Button 
                  label="Get Linked Tickets" 
                  icon="pi pi-link" 
                  @click="fetchLinkedTickets" 
                  :loading="isLoadingLinkedTickets"
                  :disabled="isLoadingLinkedTickets" 
                />
              </div>
              
              <!-- Loading state -->
              <div v-if="isLoadingLinkedTickets" class="flex align-items-center justify-content-center p-4">
                <span class="pi pi-spin pi-spinner text-2xl text-primary mr-2" />
                <span>Loading linked tickets...</span>
              </div>
              
              <!-- Error state -->
              <div v-else-if="linkedTicketsError" class="p-message p-message-error p-3 mb-3">
                <i class="pi pi-exclamation-triangle p-message-icon mr-2"></i>
                <span class="p-message-text">{{ linkedTicketsError }}</span>
              </div>
              
              <!-- No data state -->
              <div v-else-if="linkedTickets && linkedTickets.length === 0" class="p-3 surface-100 border-round text-center">
                <span class="text-600">No linked tickets found for this dispatch.</span>
              </div>
              
              <!-- Data display - Using Fieldset to group tickets by type -->
              <div v-else-if="linkedTickets && linkedTickets.length > 0" class="pb-4">
                <!-- Chain ID display -->
                <div class="mb-3 p-3 bg-surface-50 dark:bg-surface-800 border-round">
                  <div class="text-md font-medium">Chain: <span class="text-primary-600 dark:text-primary-400">{{ linkedTickets[0]?.chainId || 'N/A' }}</span></div>
                </div>
                
                <!-- Grouped tickets by type -->
                <div v-for="(group, type) in ticketsByType" :key="type" class="mb-3">
                  <Fieldset :legend="`${type} (${group.length})`" :toggleable="true" :pt="fieldsetPtOptions">
                    <div class="overflow-x-auto">
                      <table class="w-full border-collapse">
                        <thead>
                          <tr class="border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
                            <th class="p-2 text-left text-sm font-medium">Ticket ID</th>
                            <th class="p-2 text-left text-sm font-medium">Subject</th>
                            <th class="p-2 text-left text-sm font-medium">Status</th>
                            <th class="p-2 text-left text-sm font-medium">Department</th>
                            <th class="p-2 text-left text-sm font-medium">Owner</th>
                            <th class="p-2 text-left text-sm font-medium">Created</th>
                            <th class="p-2 text-left text-sm font-medium">Last Activity</th>
                            <th class="p-2 text-left text-sm font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="ticket in group" :key="ticket.record_id" 
                              class="border-b border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors duration-150">
                            <td class="p-2 text-sm">{{ ticket.record_id }}</td>
                            <td class="p-2 text-sm">{{ ticket.subject }}</td>
                            <td class="p-2 text-sm">
                              <Tag :value="ticket.status" :severity="getTicketSeverity({status: ticket.status})" />
                            </td>
                            <td class="p-2 text-sm">{{ ticket.department }}</td>
                            <td class="p-2 text-sm">{{ ticket.owner || 'N/A' }}</td>
                            <td class="p-2 text-sm">{{ formatShortDate(ticket.ticket_created) }}</td>
                            <td class="p-2 text-sm">{{ formatShortDate(ticket.last_activity) }}</td>
                            <td class="p-2 text-sm">
                              <Button icon="pi pi-eye" size="small" text class="p-0" 
                                      @click="navigateToTicket(ticket)" />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </Fieldset>
                </div>
              </div>
              
              <!-- Not yet fetched state -->
              <div v-else class="p-4 surface-50 border-round text-center">
                <i class="pi pi-link text-2xl text-500 mb-3 block"></i>
                <div class="text-700 font-medium mb-2">No Linked Tickets Loaded</div>
                <p class="text-500 m-0">Click the "Get Linked Tickets" button to view related tickets for this dispatch.</p>
              </div>
            </div>
          </TabPanel>

          <!-- Billing Tab -->
          <TabPanel value="1">
            <Panel header="Billing Details" :pt="panelPtOptions">
              <div class="flex flex-column md:flex-row gap-2 mb-2">
                <div class="flex-1">
                  <label for="invoice" class="block text-sm font-medium mb-1">Invoice #</label>
                  <div id="invoice" class="p-inputtext w-full">{{ dispatchData.billing?.invoiceNumber || 'N/A' }}</div>
                </div>
                <div class="flex-1">
                  <label for="quoted" class="block text-sm font-medium mb-1">Quoted Cost</label>
                  <div id="quoted" class="p-inputtext w-full">{{ dispatchData.billing?.quotedCost || 'N/A' }}</div>
                </div>
                <div class="flex-1">
                  <label for="quantity" class="block text-sm font-medium mb-1">Quantity</label>
                  <div id="quantity" class="p-inputtext w-full">{{ dispatchData.quantity || 'N/A' }}</div>
                </div>
              </div>
              
              <div class="flex flex-column md:flex-row gap-2 mb-2">
                <div class="flex-1">
                  <label for="daystoinvoice" class="block text-sm font-medium mb-1">Days to Invoice</label>
                  <div id="daystoinvoice" class="p-inputtext w-full">{{ dispatchData.daysToInvoice || 'N/A' }}</div>
                </div>
                <div class="flex-1">
                  <label for="final" class="block text-sm font-medium mb-1">Final Amount</label>
                  <div id="final" class="p-inputtext w-full">{{ dispatchData.billing?.finalBilledAmount || 'N/A' }}</div>
                </div>
                <div class="flex-1">
                  <label for="unitprice" class="block text-sm font-medium mb-1">Unit Price</label>
                  <div id="unitprice" class="p-inputtext w-full">{{ dispatchData.unitPrice || 'N/A' }}</div>
                </div>
              </div>
              
              <div class="mt-3 p-2 surface-100 border-round flex justify-content-between align-items-center">
                <span class="font-medium">Line Amount:</span>
                <span class="font-bold text-lg">{{ dispatchData.lineAmount || '$0.00' }}</span>
              </div>
            </Panel>
          </TabPanel>

          <!-- Notes & Scope Tab -->
          <TabPanel value="2">
            <!-- Scope of Work -->
            <Panel header="Scope of Work" class="mb-3" :pt="panelPtOptions">
              <div class="field">
                <div id="scope" class="p-inputtext w-full min-h-4rem whitespace-pre-line">{{ dispatchData.jobDetails?.scopeOfWork || 'No scope of work provided.' }}</div>
              </div>
            </Panel>

            <!-- Technician -->
            <Panel header="Technician" class="mb-3" :pt="panelPtOptions">
              <div class="flex flex-column md:flex-row gap-2 mb-2">
                <div class="flex-1">
                  <label for="techname" class="block text-sm font-medium mb-1">Name</label>
                  <div id="techname" class="p-inputtext w-full">{{ dispatchData.technicianInfo?.name || 'N/A' }}</div>
                </div>
                <div class="flex-1">
                  <label for="vendor" class="block text-sm font-medium mb-1">Vendor</label>
                  <div id="vendor" class="p-inputtext w-full">{{ dispatchData.technicianInfo?.vendor || 'N/A' }}</div>
                </div>
              </div>
              
              <div class="flex flex-column md:flex-row gap-2">
                <div class="flex-1">
                  <label for="contact" class="block text-sm font-medium mb-1">Contact</label>
                  <div id="contact" class="p-inputtext w-full">{{ dispatchData.technicianInfo?.contactInfo || 'N/A' }}</div>
                </div>
                <div class="flex-1">
                  <label for="grade" class="block text-sm font-medium mb-1">Grade/Review</label>
                  <div id="grade" class="p-inputtext w-full">{{ dispatchData.technicianInfo?.grade || 'N/A' }}</div>
                </div>
              </div>
            </Panel>

            <!-- Notes -->
            <Panel header="Technician Comments" :pt="panelPtOptions">
              <div class="field">
                <div id="techcomments" class="p-inputtext w-full min-h-4rem whitespace-pre-line">{{ dispatchData.technicianInfo?.comments || 'No comments provided.' }}</div>
              </div>
            </Panel>
          </TabPanel>

          <!-- Visit Summary Tab -->
          <TabPanel v-if="hasBeenAnalyzed" value="3" :pt="tabPanelPtOptions">
            <!-- Analysis Status Indicator -->
            <div class="flex justify-content-between align-items-center mb-3">
              <div class="flex align-items-center gap-2">
                <Tag severity="success" icon="pi pi-check-circle">Job Analyzed</Tag>
                <span class="text-sm text-surface-600">Chain ID: <span class="font-semibold">{{ analysisStatus?.chain_hash || 'N/A' }}</span></span>
                <span class="text-sm text-surface-600">Analysis Date: <span class="font-semibold">{{ 
                  analysisStatus?.analysis_date ? new Date(analysisStatus.analysis_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : 'N/A' 
                }}</span></span>
              </div>
              
              <Button 
                label="Show Job Report" 
                icon="pi pi-file-pdf" 
                @click="toggleJobReportDialog" 
                :loading="isLoadingJobReport"
                :disabled="isLoadingJobReport"
              />
            </div>
            
            <!-- Loading state -->
            <div v-if="isLoadingVisitDetails" class="flex align-items-center justify-content-center p-4">
              <span class="pi pi-spin pi-spinner text-2xl text-primary mr-2" />
              <span>Loading visit details...</span>
            </div>
            
            <!-- Error state -->
            <div v-else-if="visitDetailsError" class="p-message p-message-error p-3 mb-3">
              <i class="pi pi-exclamation-triangle p-message-icon mr-2"></i>
              <span class="p-message-text">{{ visitDetailsError }}</span>
            </div>
            
            <!-- Visit Details Content -->
            <div v-else-if="visitDetails && visitDetails.visit_data">
              <!-- Summary Panel -->
              <Panel header="Visit Summary" class="mb-3" :pt="panelPtOptions">
                <div class="flex flex-column md:flex-row gap-3 mb-3">
                  <div class="flex-1">
                    <label class="block text-sm font-medium mb-1">Phase Name</label>
                    <div class="p-inputtext w-full">{{ visitDetails.visit_data.phase_name || 'N/A' }}</div>
                  </div>
                  <div class="flex-1">
                    <label class="block text-sm font-medium mb-1">Visit Date</label>
                    <div class="p-inputtext w-full">{{ visitDetails.visit_data.visit_date || 'N/A' }}</div>
                  </div>
                  <div class="flex-1">
                    <label class="block text-sm font-medium mb-1">Status</label>
                    <Tag :value="visitDetails.visit_data.status || 'unknown'" :severity="getTicketSeverity({status: visitDetails.visit_data.status})"></Tag>
                  </div>
                </div>
                
                <div class="flex flex-column md:flex-row gap-3 mb-3">
                  <div class="flex-1">
                    <label class="block text-sm font-medium mb-1">Time In</label>
                    <div class="p-inputtext w-full">{{ visitDetails.visit_data.time_in || 'N/A' }}</div>
                  </div>
                  <div class="flex-1">
                    <label class="block text-sm font-medium mb-1">Time Out</label>
                    <div class="p-inputtext w-full">{{ visitDetails.visit_data.time_out || 'N/A' }}</div>
                  </div>
                  <div class="flex-1">
                    <label class="block text-sm font-medium mb-1">Time On Site</label>
                    <div class="p-inputtext w-full">{{ visitDetails.visit_data.time_on_site || 'N/A' }}</div>
                  </div>
                </div>
                
                <div class="flex flex-column md:flex-row gap-3 mb-3">
                  <div class="flex-1">
                    <label class="block text-sm font-medium mb-1">Outcome</label>
                    <Tag :value="visitDetails.visit_data.outcome || 'unknown'" :severity="getTicketSeverity({status: visitDetails.visit_data.outcome})"></Tag>
                  </div>
                  <div class="flex-1">
                    <label class="block text-sm font-medium mb-1">Revisit Needed</label>
                    <Tag :value="visitDetails.visit_data.revisit_needed ? 'Yes' : 'No'" :severity="visitDetails.visit_data.revisit_needed ? 'warning' : 'success'"></Tag>
                  </div>
                  <div class="flex-1">
                    <label class="block text-sm font-medium mb-1">Related Tickets</label>
                    <div class="p-inputtext w-full">{{ visitDetails.visit_data.ticket_ids?.join(', ') || 'N/A' }}</div>
                  </div>
                </div>
                
                <div class="flex flex-column gap-2">
                  <label class="block text-sm font-medium mb-1">Work Summary</label>
                  <div class="p-inputtext w-full min-h-4rem whitespace-pre-line">{{ visitDetails.visit_data.work_summary || 'No work summary available.' }}</div>
                </div>
              </Panel>
              
              <!-- Issues Panel -->
              <Panel header="Issues Encountered" class="mb-3" :pt="panelPtOptions" v-if="visitDetails.visit_data.issues_encountered && visitDetails.visit_data.issues_encountered.length > 0">
                <div class="space-y-4">
                  <div v-for="(issue, index) in visitDetails.visit_data.issues_encountered" :key="index" class="p-3 border-round" :class="{
                    'bg-success-50 dark:bg-success-900/20': issue.status === 'resolved',
                    'bg-warning-50 dark:bg-warning-900/20': issue.status === 'unresolved',
                    'bg-info-50 dark:bg-info-900/20': issue.status === 'in_progress' || issue.status === 'pending'
                  }">
                    <div class="flex justify-content-between align-items-center mb-2">
                      <div class="font-medium">Issue #{{ index + 1 }}</div>
                      <Tag :value="issue.status || 'unknown'" :severity="getIssueSeverity(issue)"></Tag>
                    </div>
                    
                    <div class="mb-2">
                      <div class="text-sm text-surface-600 mb-1">Description:</div>
                      <div>{{ issue.description }}</div>
                    </div>
                    
                    <div class="mb-2" v-if="issue.mitigation">
                      <div class="text-sm text-surface-600 mb-1">Mitigation:</div>
                      <div>{{ issue.mitigation }}</div>
                    </div>
                    
                    <div v-if="issue.resolution_attempts && issue.resolution_attempts.length > 0">
                      <div class="text-sm text-surface-600 mb-1">Resolution Attempts:</div>
                      <ul class="pl-4 m-0">
                        <li v-for="(attempt, idx) in issue.resolution_attempts" :key="idx" class="mb-1">
                          <div>{{ attempt.attempt_description }}</div>
                          <div class="text-sm text-surface-500">Outcome: {{ attempt.outcome }}</div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Panel>
              
              <!-- Timeline Panel -->
              <Panel header="Visit Timeline" class="mb-3" :pt="panelPtOptions" v-if="visitDetails.visit_data.timeline && visitDetails.visit_data.timeline.length > 0">
                <Timeline :value="visitDetails.visit_data.timeline" class="w-full">
                  <template #marker="{ item }">
                    <span class="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1"
                          :class="{
                            'bg-primary-500': getTimelineEventSeverity(item) === 'info',
                            'bg-success-500': getTimelineEventSeverity(item) === 'success',
                            'bg-warning-500': getTimelineEventSeverity(item) === 'warning',
                            'bg-danger-500': getTimelineEventSeverity(item) === 'danger'
                          }">
                      <i class="pi pi-clock"></i>
                    </span>
                  </template>
                  <template #content="{ item }">
                    <div class="p-3 border-round shadow-1 mb-3" :class="{
                      'bg-primary-50 dark:bg-primary-900/20': getTimelineEventSeverity(item) === 'info',
                      'bg-success-50 dark:bg-success-900/20': getTimelineEventSeverity(item) === 'success',
                      'bg-warning-50 dark:bg-warning-900/20': getTimelineEventSeverity(item) === 'warning',
                      'bg-danger-50 dark:bg-danger-900/20': getTimelineEventSeverity(item) === 'danger'
                    }">
                      <div class="font-medium mb-1">{{ formatTimelineDate(item.timestamp) }}</div>
                      <div>{{ item.event }}</div>
                    </div>
                  </template>
                </Timeline>
              </Panel>
              
              <!-- Other Visits Section -->
              <Panel header="All Visits in This Job" class="mb-3" :pt="panelPtOptions" v-if="visitDetails.all_visits && visitDetails.all_visits.length > 0">
                <div class="overflow-x-auto">
                  <table class="w-full border-collapse">
                    <thead>
                      <tr class="border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
                        <th class="p-2 text-left text-sm font-medium">Visit ID</th>
                        <th class="p-2 text-left text-sm font-medium">Phase</th>
                        <th class="p-2 text-left text-sm font-medium">Date</th>
                        <th class="p-2 text-left text-sm font-medium">Status</th>
                        <th class="p-2 text-left text-sm font-medium">Outcome</th>
                        <th class="p-2 text-left text-sm font-medium">Related Tickets</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="visit in visitDetails.all_visits" :key="visit.visit_id" 
                          class="border-b border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors duration-150">
                        <td class="p-2 text-sm">{{ visit.original_visit_id || visit.visit_id }}</td>
                        <td class="p-2 text-sm">{{ visit.phase_name || 'N/A' }}</td>
                        <td class="p-2 text-sm">{{ visit.visit_date || 'N/A' }}</td>
                        <td class="p-2 text-sm">
                          <Tag :value="visit.status || 'unknown'" :severity="getTicketSeverity({status: visit.status})"></Tag>
                        </td>
                        <td class="p-2 text-sm">
                          <Tag :value="visit.outcome || 'unknown'" :severity="getTicketSeverity({status: visit.outcome})"></Tag>
                        </td>
                        <td class="p-2 text-sm">{{ (visit.ticket_ids || []).join(', ') || 'N/A' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>
            
            <!-- No data state -->
            <div v-else class="p-3 surface-100 border-round text-center">
              <i class="pi pi-exclamation-circle text-2xl text-primary mb-3 block"></i>
              <div class="text-700 font-medium mb-2">No Visit Details Available</div>
              <p class="text-500 m-0">Visit details for this ticket could not be loaded.</p>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      <!-- Back button -->
      <div class="flex justify-content-end mt-3">
        <Button label="Back to Jobs" icon="pi pi-arrow-left" @click="goBack" />
      </div>
    </div>

    <!-- Close-out Notes Drawer -->
    <Drawer v-model:visible="displayNotesDrawer" position="right" :pt="drawerPtOptions">
      <template #header>
        <div class="flex align-items-center gap-2">
          <i class="pi pi-file-edit text-xl"></i>
          <span class="font-bold text-xl">Close-out Notes</span>
        </div>
      </template>
      <div class="p-2">
        <div class="p-inputtext w-full min-h-20rem whitespace-pre-line">
          {{ dispatchData.completion?.closeOutNotes || 'No close-out notes provided.' }}
        </div>
      </div>
      <template #footer>
        <Button label="Close" icon="pi pi-times" @click="toggleNotesDrawer" class="w-full" />
      </template>
    </Drawer>
    
    <!-- Job Report Dialog -->
    <Dialog 
      v-model:visible="jobReportDialog" 
      header="Job Report" 
      :style="{ width: '90vw', maxWidth: '1200px' }" 
      :modal="true" 
      :closable="true" 
      :dismissableMask="true"
      class="job-report-dialog"
    >
      <!-- Loading state -->
      <div v-if="isLoadingJobReport" class="flex align-items-center justify-content-center p-5">
        <span class="pi pi-spin pi-spinner text-2xl text-primary mr-2" />
        <span>Loading job report...</span>
      </div>
      
      <!-- Error state -->
      <div v-else-if="jobReportError" class="p-message p-message-error p-3 mb-3">
        <i class="pi pi-exclamation-triangle p-message-icon mr-2"></i>
        <span>{{ jobReportError }}</span>
      </div>
      
      <!-- Content -->
      <div v-else-if="jobReport" class="job-report">
        <template v-if="jobReport.success">
          <div class="p-4">
            <!-- Header -->
            <div class="surface-section border-round shadow-1 mb-4">
              <div class="p-4 flex flex-column md:flex-row md:justify-content-between md:align-items-start">
                <div class="flex-1">
                  <h2 class="text-xl font-bold mt-0 mb-2">Job Report</h2>
                  <div class="mb-2">ID: {{ jobReport.chain_data?.job_id || 'N/A' }}</div>
                  <div class="flex align-items-center mb-2">
                    <i class="pi pi-map-marker mr-2 text-500"></i>
                    <span>{{ jobReport.analysis_data?.job?.location || 'N/A' }}</span>
                  </div>
                </div>
                
                <div class="flex-1 md:text-center">
                  <div class="flex align-items-center mb-2">
                    <i class="pi pi-calendar mr-2 text-500"></i>
                    <span>Started: {{ 
                      jobReport.analysis_data?.job?.start_date 
                        ? new Date(jobReport.analysis_data.job.start_date).toLocaleString() 
                        : 'N/A' 
                    }}</span>
                  </div>
                  <div class="flex align-items-center mb-2">
                    <i class="pi pi-clock mr-2 text-500"></i>
                    <span>{{ jobReport.analysis_data?.job?.total_hours || 0 }} hours</span>
                  </div>
                </div>
                
                <div class="flex-1 md:text-right">
                  <Tag :value="jobReport.analysis_data?.job?.status || 'In Progress'" 
                       class="mb-2"
                       :severity="getTicketSeverity({status: jobReport.analysis_data?.job?.status || 'In Progress'})">
                  </Tag>
                  <div class="flex align-items-center justify-content-end mb-2">
                    <i class="pi pi-list mr-2 text-500"></i>
                    <span>{{ jobReport.visits?.length || jobReport.analysis_data?.job?.visits?.length || 0 }} visits</span>
                  </div>
                </div>
              </div>
              
              <!-- Completion progress bar -->
              <div class="px-4 pb-4">
                <div class="flex align-items-center justify-content-between mb-2">
                  <span class="font-medium">Completion</span>
                  <span class="font-bold">{{ jobReport.analysis_data?.job?.completion_percentage || 0 }}%</span>
                </div>
                <div class="w-full bg-surface-200 rounded-lg h-2">
                  <div class="h-full rounded-lg" 
                      :class="getCompletionColorClass(jobReport.analysis_data?.job?.completion_percentage || 0)"
                      :style="{ width: (jobReport.analysis_data?.job?.completion_percentage || 0) + '%' }"></div>
                </div>
              </div>
            </div>
            
            <!-- Work Summary -->
            <div class="surface-section border-round shadow-1 p-4 mb-4">
              <h3 class="text-lg font-medium mt-0 mb-3">Work Summary</h3>
              <p class="m-0">{{ jobReport.analysis_data?.job?.work_summary || 'No work summary available.' }}</p>
            </div>
            
            <!-- Main content area with tabs -->
            <div class="surface-section border-round shadow-1 mb-4">
              <TabView>
                <!-- Visit Details Tab -->
                <TabPanel header="Visits">
                  <div class="p-4">
                    <h3 class="text-lg font-medium mt-0 mb-3">
                      Visits
                      <span class="text-sm font-normal ml-2 text-500">
                        ({{ timelineEvents.length }} for this job)
                      </span>
                    </h3>
                    
                    <div v-if="timelineEvents.length === 0" class="p-3 text-center">
                      <i class="pi pi-calendar text-3xl text-surface-300 mb-2"></i>
                      <p class="text-surface-600">No visits available for this job.</p>
                    </div>
                    
                    <div v-else class="visit-list">
                      <Accordion :multiple="true">
                        <AccordionTab v-for="(visit, index) in timelineEvents" :key="visit.visit_id">
                          <template #header>
                            <div class="flex align-items-center flex-wrap">
                              <div class="visit-phase mr-3 font-bold">
                                Visit {{ index + 1 }}
                              </div>
                              <div class="visit-date mr-3 text-500">
                                {{ new Date(visit.visit_date.replace(' ', 'T')).toLocaleDateString() }}
                              </div>
                              <div class="visit-name flex-grow-1">
                                {{ visit.phase_name }}
                              </div>
                              <Tag :value="visit.status" :severity="getTicketSeverity({status: visit.status})"></Tag>
                            </div>
                          </template>
                          <div class="p-3">
                            <div class="grid">
                              <div class="col-12 md:col-6 mb-3">
                                <div class="surface-100 p-3 border-round">
                                  <h4 class="text-base font-medium mt-0 mb-2">Visit Information</h4>
                                  <div class="mb-2">
                                    <div class="text-sm text-500 mb-1">Date:</div>
                                    <div>{{ visit.visit_date ? new Date(visit.visit_date.replace(' ', 'T')).toLocaleString() : 'N/A' }}</div>
                                  </div>
                                  <div class="mb-2">
                                    <div class="text-sm text-500 mb-1">Time In:</div>
                                    <div>{{ visit.time_in || 'N/A' }}</div>
                                  </div>
                                  <div class="mb-2">
                                    <div class="text-sm text-500 mb-1">Time Out:</div>
                                    <div>{{ visit.time_out || 'N/A' }}</div>
                                  </div>
                                  <div class="mb-2">
                                    <div class="text-sm text-500 mb-1">Time On Site:</div>
                                    <div>{{ visit.time_on_site || 'N/A' }}</div>
                                  </div>
                                  <div class="mb-2">
                                    <div class="text-sm text-500 mb-1">Outcome:</div>
                                    <Tag :value="visit.outcome || 'unknown'" :severity="getTicketSeverity({status: visit.outcome})"></Tag>
                                  </div>
                                  <div>
                                    <div class="text-sm text-500 mb-1">Revisit Needed:</div>
                                    <Tag :value="visit.revisit_needed ? 'Yes' : 'No'" :severity="visit.revisit_needed ? 'warning' : 'success'"></Tag>
                                  </div>
                                </div>
                              </div>
                              
                              <div class="col-12 md:col-6 mb-3">
                                <div class="surface-100 p-3 border-round">
                                  <h4 class="text-base font-medium mt-0 mb-2">Work Summary</h4>
                                  <p>{{ visit.work_summary || 'No work summary available.' }}</p>
                                </div>
                              </div>
                              
                              <!-- Tasks section - if available -->
                              <div v-if="visit.tasks && visit.tasks.length > 0" class="col-12 mb-3">
                                <div class="surface-100 p-3 border-round">
                                  <h4 class="text-base font-medium mt-0 mb-2">Tasks</h4>
                                  <ul class="m-0 pl-3">
                                    <li v-for="(task, i) in visit.tasks" :key="i" class="mb-1">
                                      <div class="flex align-items-center">
                                        <i class="pi pi-check-circle text-success-500 mr-2"></i>
                                        <span>{{ task.description }}</span>
                                      </div>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                              
                              <!-- Issues section - if available -->
                              <div v-if="visit.issues_encountered && visit.issues_encountered.length > 0" class="col-12 mb-3">
                                <div class="surface-100 p-3 border-round">
                                  <h4 class="text-base font-medium mt-0 mb-2">Issues Encountered</h4>
                                  <div v-for="(issue, i) in visit.issues_encountered" :key="i" class="mb-3 p-3 border-round" :class="{
                                    'bg-success-50 dark:bg-success-900/20': issue.status === 'resolved',
                                    'bg-warning-50 dark:bg-warning-900/20': issue.status === 'unresolved',
                                    'bg-info-50 dark:bg-info-900/20': issue.status === 'in_progress' || issue.status === 'pending'
                                  }">
                                    <div class="flex justify-content-between align-items-center mb-2">
                                      <div class="font-medium">Issue #{{ i + 1 }}</div>
                                      <Tag :value="issue.status || 'unknown'" :severity="getIssueSeverity(issue)"></Tag>
                                    </div>
                                    <div class="mb-2">
                                      <div class="text-sm text-surface-600 mb-1">Description:</div>
                                      <div>{{ issue.description }}</div>
                                    </div>
                                    <div class="mb-2" v-if="issue.mitigation">
                                      <div class="text-sm text-surface-600 mb-1">Mitigation:</div>
                                      <div>{{ issue.mitigation }}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <!-- Timeline section - if available -->
                              <div v-if="visit.timeline && visit.timeline.length > 0" class="col-12 mb-3">
                                <div class="surface-100 p-3 border-round">
                                  <h4 class="text-base font-medium mt-0 mb-2">Timeline</h4>
                                  <Timeline :value="visit.timeline" class="w-full">
                                    <template #content="slotProps">
                                      <div class="text-sm">
                                        <div class="font-medium mb-1">{{ formatTimelineDate(slotProps.item.timestamp) }}</div>
                                        <div>{{ slotProps.item.event }}</div>
                                      </div>
                                    </template>
                                  </Timeline>
                                </div>
                              </div>
                              
                              <!-- Materials section - if available -->
                              <div v-if="visit.materials && visit.materials.length > 0" class="col-12">
                                <div class="surface-100 p-3 border-round">
                                  <h4 class="text-base font-medium mt-0 mb-2">Materials</h4>
                                  <div class="overflow-x-auto">
                                    <table class="w-full border-collapse">
                                      <thead>
                                        <tr class="border-b border-surface-200 text-left">
                                          <th class="p-2 font-medium">Item</th>
                                          <th class="p-2 font-medium">Quantity</th>
                                          <th class="p-2 font-medium">Description</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr v-for="(material, i) in visit.materials" :key="i" class="border-b border-surface-200">
                                          <td class="p-2">{{ material.item }}</td>
                                          <td class="p-2">{{ material.quantity }}</td>
                                          <td class="p-2">{{ material.description }}</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </AccordionTab>
                      </Accordion>
                    </div>
                  </div>
                </TabPanel>
                
                <!-- Tasks Tab -->
                <TabPanel header="Tasks">
                  <div class="p-4">
                    <h3 class="text-lg font-medium mt-0 mb-3">Tasks</h3>
                    
                    <div v-if="!jobReport.analysis_data?.job?.visits || !jobReport.analysis_data.job.visits.some(v => v.tasks && v.tasks.length)" class="p-3 text-center">
                      <i class="pi pi-check-square text-3xl text-surface-300 mb-2"></i>
                      <p class="text-surface-600">No tasks available for this job.</p>
                    </div>
                    
                    <div v-else>
                      <div v-for="(visit, visitIndex) in jobReport.analysis_data.job.visits.filter(v => v.tasks && v.tasks.length)" :key="'visit-' + visitIndex" class="mb-4">
                        <h4 class="text-base font-medium mt-0 mb-2">{{ visit.phase_name }}</h4>
                        <ul class="m-0 pl-3">
                          <li v-for="(task, taskIndex) in visit.tasks" :key="'task-' + taskIndex" class="mb-2">
                            <div class="flex align-items-center">
                              <i class="pi pi-check-circle text-success-500 mr-2"></i>
                              <span>{{ task.description }}</span>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </TabPanel>
                
                <!-- Issues Tab -->
                <TabPanel header="Issues">
                  <div class="p-4">
                    <h3 class="text-lg font-medium mt-0 mb-3">Issues</h3>
                    
                    <div v-if="!jobReport.key_issues || !jobReport.key_issues.length" class="p-3 text-center">
                      <i class="pi pi-exclamation-circle text-3xl text-surface-300 mb-2"></i>
                      <p class="text-surface-600">No key issues identified for this job.</p>
                    </div>
                    
                    <div v-else>
                      <div v-for="(issue, index) in jobReport.key_issues" :key="index" class="mb-3 p-3 border-round" :class="{
                        'bg-success-50 dark:bg-success-900/20': issue.status === 'resolved',
                        'bg-warning-50 dark:bg-warning-900/20': issue.status === 'unresolved',
                        'bg-info-50 dark:bg-info-900/20': issue.status === 'in_progress' || issue.status === 'pending'
                      }">
                        <div class="flex justify-content-between align-items-center mb-2">
                          <div class="font-medium">{{ issue.issue }}</div>
                          <Tag :value="issue.status" :severity="getIssueSeverity({status: issue.status})"></Tag>
                        </div>
                        <div class="mb-2">
                          <div class="text-sm text-surface-600 mb-1">Resolution:</div>
                          <div>{{ issue.resolution_details || 'No resolution details available.' }}</div>
                        </div>
                        <div class="mb-2" v-if="issue.affected_visits && issue.affected_visits.length">
                          <div class="text-sm text-surface-600 mb-1">Affected Visits:</div>
                          <div class="flex flex-wrap gap-1">
                            <Tag v-for="visitId in issue.affected_visits" :key="visitId" :value="visitId" severity="info" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabPanel>
              </TabView>
            </div>
            
            <!-- Bottom section with cards in a 2-column layout -->
            <div class="grid">
              <!-- Recommended Actions -->
              <div class="col-12 md:col-6">
                <div class="surface-section border-round shadow-1 p-4 h-full">
                  <div class="flex align-items-center mb-3">
                    <i class="pi pi-file-edit text-lg mr-2"></i>
                    <h3 class="text-lg font-medium m-0">Recommended Actions</h3>
                  </div>
                  
                  <div v-if="!jobReport.recommended_actions || !jobReport.recommended_actions.length" class="p-3 text-center">
                    <p class="text-surface-600">No recommended actions available.</p>
                  </div>
                  
                  <div v-else>
                    <div v-for="(action, index) in jobReport.recommended_actions" :key="index" class="mb-3 p-3 border-1 border-round surface-border">
                      <div class="flex align-items-center mb-1">
                        <Tag :value="action.priority" class="mr-2" :severity="
                          action.priority === 'High' ? 'danger' : 
                          action.priority === 'Medium' ? 'warning' : 'info'
                        "></Tag>
                        <span>{{ action.action }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Outstanding Items -->
              <div class="col-12 md:col-6">
                <div class="surface-section border-round shadow-1 p-4 h-full">
                  <div class="flex align-items-center mb-3">
                    <i class="pi pi-clock text-lg mr-2"></i>
                    <h3 class="text-lg font-medium m-0">Outstanding Items</h3>
                  </div>
                  
                  <div v-if="!jobReport.outstanding_items || !jobReport.outstanding_items.length" class="p-3 text-center">
                    <p class="text-surface-600">No outstanding items available.</p>
                  </div>
                  
                  <div v-else>
                    <div v-for="(item, index) in jobReport.outstanding_items" :key="index" class="mb-3 p-3 border-1 border-round surface-border">
                      <div class="font-medium mb-1">{{ item.description }}</div>
                      <div class="text-sm text-surface-600 mb-1">Status: {{ item.current_status }}</div>
                      <div v-if="item.related_visits && item.related_visits.length" class="mt-2">
                        <div class="text-sm text-surface-600 mb-1">Related visits:</div>
                        <div class="flex flex-wrap gap-1">
                          <Tag v-for="visitId in item.related_visits" :key="visitId" :value="visitId" severity="info" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="p-4">
          <div class="p-message p-message-error p-3 mb-3">
            <i class="pi pi-exclamation-triangle p-message-icon mr-2"></i>
            <span>Failed to load job report: {{ jobReport.message || 'Unknown error' }}</span>
          </div>
        </div>
      </div>
      
      <template #footer>
        <Button label="Close" @click="jobReportDialog = false" />
      </template>
    </Dialog>
    
    <!-- AI Analysis Dialog -->
    <Dialog 
      v-model:visible="showAnalysisDialog" 
      :header="forceRefreshAnalysis ? 'Re-run Analysis' : 'Run Analysis'" 
      :modal="true" 
      :closable="true" 
      :dismissableMask="true"
    >
      <div class="p-fluid">
        <div class="mb-4">
          <p v-if="forceRefreshAnalysis" class="p-message p-message-warn p-3">
            <i class="pi pi-exclamation-triangle p-message-icon mr-2"></i>
            <span>This will overwrite the existing analysis with new results.</span>
          </p>
          <p class="mb-3">
            Running analysis will process this ticket and its associated chain. 
            This may take several minutes to complete. 
          </p>
          
          <div class="field">
            <label for="model-select" class="font-medium">AI Model</label>
            <Select 
              id="model-select"
              v-model="selectedAiModel" 
              :options="availableModels" 
              optionLabel="label" 
              optionValue="value"
              placeholder="Select AI Model" 
              class="w-full"
            />
            <small class="text-surface-500">Selecting more powerful models may increase analysis quality but also processing time.</small>
          </div>
        </div>
      </div>
      
      <template #footer>
        <Button label="Cancel" icon="pi pi-times" @click="showAnalysisDialog = false" text />
        <Button 
          :label="forceRefreshAnalysis ? 'Re-run Analysis' : 'Run Analysis'" 
          icon="pi pi-check" 
          severity="primary" 
          @click="startAnalysis()" 
          :loading="isRunningAnalysis"
          :disabled="isRunningAnalysis"
        />
      </template>
    </Dialog>
  </div>
  
  <!-- Toast and Confirm Dialog -->
  <Toast position="bottom-right" />
  <ConfirmDialog />
</template>

<style scoped>
.field {
  margin-bottom: 0;
}

.p-inputtext {
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  background-color: var(--surface-100);
  color: var(--text-color);
  min-height: 2.2rem;
  display: flex;
  align-items: center;
}

.min-h-4rem {
  min-height: 4rem;
}

.min-h-20rem {
  min-height: 20rem;
}

/* Job report dialog styles */
:deep(.job-report-dialog .p-dialog-content) {
  padding: 0;
}

:deep(.job-report) {
  min-height: 50vh;
}

:deep(.p-timeline-event-opposite) {
  flex: 0;
  padding: 0 !important;
}

:deep(.p-timeline-event-content) {
  flex: 1;
  padding-left: 1rem;
}

/* Make sure timeline lines up properly */
:deep(.p-timeline .p-timeline-event-marker) {
  border: 2px solid var(--primary-color);
  border-radius: 50%;
}

/* Remove shadow styles since they're now in pt options */
:deep(.p-tabview-nav-container) {
  position: relative;
}

:deep(.p-tabview-ink-bar) {
  z-index: 1;
  display: block;
  position: absolute;
  bottom: 0;
  height: 2px;
  background-color: var(--primary-color);
  transition: 0.3s cubic-bezier(0.35, 0, 0.25, 1);
}

/* Toast styling */
:deep(.p-toast-message-info) {
  background-color: var(--primary-50);
  border-left-color: var(--primary-500);
}

:deep(.p-toast-message-success) {
  background-color: var(--green-50);
  border-left-color: var(--green-500);
}

:deep(.p-toast-message-error) {
  background-color: var(--red-50);
  border-left-color: var(--red-500);
}

:deep(.p-toast-message-warn) {
  background-color: var(--yellow-50);
  border-left-color: var(--yellow-500);
}

:deep(.p-toast .p-toast-icon) {
  font-size: 1.5rem;
}

:deep(.p-toast .p-toast-message-content) {
  padding: 1rem;
}

:deep(.p-toast .p-toast-message-text) {
  margin-left: 1rem;
}

:deep(.p-toast .p-toast-summary) {
  font-weight: 600;
  font-size: 1rem;
}

:deep(.p-toast .p-toast-detail) {
  margin-top: 0.25rem;
  font-size: 0.875rem;
}

/* Job Report Styles */
:deep(.job-report-dialog) {
  max-height: 90vh;
}

:deep(.visit-list .p-accordion-header) {
  background-color: var(--surface-50);
}

:deep(.visit-list .p-accordion-header-link) {
  padding: 1rem;
}

:deep(.p-tabview-panels) {
  padding: 0 !important;
}

:deep(.p-tabview-nav) {
  border-bottom: 1px solid var(--surface-200);
}

:deep(.p-tabview-nav-link) {
  padding: 1rem;
}

:deep(.p-tabview-selected) {
  border-bottom-color: var(--primary-color) !important;
}

:deep(.p-timeline-event-opposite) {
  display: none;
}

:deep(.p-timeline-event-content) {
  padding-left: 1rem;
}
</style> 