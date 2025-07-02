import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ApiService } from '@/service/ApiService';

export const useHelpdeskStore = defineStore('helpdesk', () => {
  // State
  const tier1OpenTickets = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Computed
  const totalOpenTickets = computed(() => tier1OpenTickets.value.length);
  
  // Customer statistics computed property - top 10 customers by ticket volume
  const topCustomersByTickets = computed(() => {
    const customerCounts = {};
    
    // Count tickets per customer
    tier1OpenTickets.value.forEach(ticket => {
      const customerName = ticket.customerName || 'Unknown Customer';
      customerCounts[customerName] = (customerCounts[customerName] || 0) + 1;
    });
    
    // Convert to array and sort by ticket count descending
    return Object.entries(customerCounts)
      .map(([name, count]) => ({ customerName: name, ticketCount: count }))
      .sort((a, b) => b.ticketCount - a.ticketCount)
      .slice(0, 10); // Top 10 customers
  });

  // Actions
  async function fetchTier1OpenTickets() {
    loading.value = true;
    error.value = null;
    
    try {
      console.log('Fetching helpdesk tier 1 open tickets...');
      const response = await ApiService.get('helpdesk/tier1/open-tickets');
      
      if (response.data) {
        const ticketData = response.data.data || response.data;
        
        if (Array.isArray(ticketData)) {
          // Map the API response fields to more readable format for the table
          tier1OpenTickets.value = ticketData.map(ticket => ({
            // Primary table fields
            ticketId: ticket.ticketId,
            status: ticket.status,
            priority: ticket.priority,
            type: ticket.ticketType,
            subject: ticket.subjectDescription,
            requestor: ticket.requestorCustomerName,
            customerName: ticket.customerName || 'Unknown Customer',
            owner: ticket.ownerAssignedStaff || 'Unassigned',
            lastActivity: ticket.lastActivityTimestamp,
            dueTime: ticket.dueTimeSlaTarget,
            
            // Expansion row fields
            email: ticket.requestorEmail,
            replyto: ticket.sourceEmailMonitoring,
            ownerstaffid: ticket.ownerStaffIdInternalReference,
            laststaffreplytime: ticket.lastStaffReplyTimeTimestamp,
            lastuserreplytime: ticket.lastUserReplyTimeTimestamp,
            totalreplies: ticket.totalNumberOfReplies,
            reopendateline: ticket.reopenedAtTimestamp,
            assignstatus: ticket.assignmentStatusAssignedUnassigned === 0 ? 'Unassigned' : 'Assigned',
            resolutionseconds: ticket.totalTimeToResolutionInSeconds,
            averageresponsetime: ticket.averageStaffResponseTimeSeconds,
            locationid: ticket.locationId,
            assetid: ticket.assetId,
            iswatched: ticket.isWatchedFollowedSubscribedFlag,
            
            // Additional fields for display
            queueDepartment: ticket.queueDepartment,
            resolvedFlag: ticket.resolvedFlag
          }));
          
          console.log(`Loaded ${tier1OpenTickets.value.length} tier 1 open tickets`);
        } else {
          console.error('❌ Tier 1 open tickets data is not an array:', ticketData);
          tier1OpenTickets.value = [];
        }
      } else {
        tier1OpenTickets.value = [];
      }
      
    } catch (err) {
      console.error('Error fetching helpdesk tier 1 open tickets:', err);
      error.value = err.response?.data?.message || err.message || 'Failed to load tier 1 open tickets';
      tier1OpenTickets.value = [];
    } finally {
      loading.value = false;
    }
  }

  function resetState() {
    tier1OpenTickets.value = [];
    loading.value = false;
    error.value = null;
  }

  return {
    // State
    tier1OpenTickets,
    loading,
    error,
    
    // Computed
    totalOpenTickets,
    topCustomersByTickets,
    
    // Actions
    fetchTier1OpenTickets,
    resetState
  };
}); 