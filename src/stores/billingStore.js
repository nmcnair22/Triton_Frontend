import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ApiService } from '@/service/ApiService';

export const useBillingStore = defineStore('billing', () => {
  // State
  const billingData = ref([]);
  const currentTicket = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const viewMode = ref('payables'); // 'payables' or 'receivables'

  // Getters
  const hasData = computed(() => billingData.value.length > 0);
  
  const filteredBillingData = computed(() => {
    if (!hasData.value) return [];
    
    // Filter based on the current view mode
    if (viewMode.value === 'payables') {
      return billingData.value.filter(item => (item.billing_details?.amount_paid || 0) > 0);
    } else {
      return billingData.value.filter(item => (item.billing_details?.invoiced_amount || 0) > 0);
    }
  });

  // Calculate totals across all records
  const totalInvoicedAmount = computed(() => {
    if (!hasData.value) return 0;
    return billingData.value.reduce((total, item) => {
      return total + (item.billing_details?.invoiced_amount || 0);
    }, 0);
  });

  const totalAmountPaid = computed(() => {
    if (!hasData.value) return 0;
    return billingData.value.reduce((total, item) => {
      return total + (item.billing_details?.amount_paid || 0);
    }, 0);
  });

  const totalProfitLoss = computed(() => {
    return totalInvoicedAmount.value - totalAmountPaid.value;
  });

  // Group vendors from all records
  const uniqueVendors = computed(() => {
    if (!hasData.value) return [];
    
    const vendors = [];
    const vendorIds = new Set();
    
    billingData.value.forEach(item => {
      if (item.billing_details?.vendor && !vendorIds.has(item.billing_details.vendor.vendor_id)) {
        vendorIds.add(item.billing_details.vendor.vendor_id);
        vendors.push(item.billing_details.vendor);
      }
    });
    
    return vendors;
  });

  // Actions
  async function fetchBillingDataByTicket(ticketInput) {
    if (!ticketInput) return;
    
    loading.value = true;
    error.value = null;
    
    try {
      // Split input by commas to handle multiple ticket IDs
      const ticketIds = ticketInput.split(',').map(id => id.trim()).filter(id => id);
      
      if (ticketIds.length === 0) {
        throw new Error('No valid ticket IDs provided');
      }
      
      console.log(`Fetching billing data for ticket(s): ${ticketIds.join(', ')}`);
      
      // If multiple tickets, fetch each one and combine the results
      if (ticketIds.length > 1) {
        const allData = [];
        let errorMessage = '';
        
        for (const ticketId of ticketIds) {
          try {
            const response = await ApiService.get(`/field-service-billing/tickets/${ticketId}`);
            
            if (response.data && response.data.success && response.data.data.length > 0) {
              allData.push(...response.data.data);
            } else {
              errorMessage += `No data for ticket #${ticketId}. `;
            }
          } catch (err) {
            errorMessage += `Error with ticket #${ticketId}: ${err.message}. `;
          }
        }
        
        if (allData.length > 0) {
          billingData.value = allData;
          currentTicket.value = ticketIds.join(', ');
          
          if (errorMessage) {
            error.value = `Some tickets couldn't be retrieved: ${errorMessage}`;
          }
        } else {
          billingData.value = [];
          error.value = 'No billing data found for any of the provided tickets';
        }
      } else {
        // Single ticket case
        const ticketId = ticketIds[0];
        const response = await ApiService.get(`/field-service-billing/tickets/${ticketId}`);
        
        if (response.data && response.data.success) {
          console.log(`Retrieved billing data for ticket ${ticketId}:`, response.data.data);
          billingData.value = response.data.data;
          currentTicket.value = ticketId;
        } else {
          console.warn('No billing data found or request unsuccessful:', response.data.message);
          billingData.value = [];
          error.value = response.data.message || 'No billing data found';
        }
      }
      
      return billingData.value;
    } catch (err) {
      error.value = err.message || `Failed to fetch billing data for the provided ticket(s)`;
      console.error(`Error fetching billing data:`, err);
      billingData.value = [];
      return [];
    } finally {
      loading.value = false;
    }
  }

  function setViewMode(mode) {
    if (mode === 'payables' || mode === 'receivables') {
      viewMode.value = mode;
    }
  }

  // Reset state
  function resetState() {
    billingData.value = [];
    currentTicket.value = null;
    error.value = null;
  }

  return {
    // State
    billingData,
    currentTicket,
    loading,
    error,
    viewMode,
    
    // Getters
    hasData,
    filteredBillingData,
    totalInvoicedAmount,
    totalAmountPaid,
    totalProfitLoss,
    uniqueVendors,
    
    // Actions
    fetchBillingDataByTicket,
    setViewMode,
    resetState
  };
}); 