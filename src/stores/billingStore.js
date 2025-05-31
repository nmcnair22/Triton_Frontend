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
  
  // New state for Dynamics data
  const dynamicsData = ref([]);
  const dynamicsLoading = ref(false);
  const dynamicsError = ref(null);

  // New state for detailed invoice and purchase data
  const detailedInvoiceData = ref(null);
  const detailedPurchaseData = ref(null);
  const detailedInvoiceLoading = ref(false);
  const detailedPurchaseLoading = ref(false);
  const detailedInvoiceError = ref(null);
  const detailedPurchaseError = ref(null);

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

  // New function to fetch Dynamics 365 data
  async function fetchDynamicsData(ticketId) {
    if (!ticketId) return;
    
    dynamicsLoading.value = true;
    dynamicsError.value = null;
    
    try {
      console.log(`Fetching Dynamics 365 data for ticket: ${ticketId}`);
      
      const response = await ApiService.get(`/field-service-billing/dynamics/${ticketId}`);
      
      if (response.data && response.data.success) {
        console.log(`Retrieved Dynamics data for ticket ${ticketId}:`, response.data.data);
        dynamicsData.value = response.data.data;
        return dynamicsData.value;
      } else {
        console.warn('No Dynamics data found or request unsuccessful:', response.data.message);
        dynamicsData.value = [];
        dynamicsError.value = response.data.message || 'No Dynamics data found';
        return [];
      }
    } catch (err) {
      dynamicsError.value = err.message || `Failed to fetch Dynamics data for ticket ${ticketId}`;
      console.error(`Error fetching Dynamics data:`, err);
      dynamicsData.value = [];
      return [];
    } finally {
      dynamicsLoading.value = false;
    }
  }

  // New function to fetch detailed invoice data
  async function fetchDetailedInvoiceData(invoiceNumber) {
    if (!invoiceNumber) return;
    
    detailedInvoiceLoading.value = true;
    detailedInvoiceError.value = null;
    
    try {
      console.log(`Fetching detailed invoice data for: ${invoiceNumber}`);
      
      const response = await ApiService.get(`/field-service-billing/dynamics-invoices`, {
        params: {
          invoice_number: invoiceNumber,
          limit: 1000
        }
      });
      
      if (response.data && response.data.success) {
        console.log(`Retrieved detailed invoice data for ${invoiceNumber}:`, response.data.data);
        detailedInvoiceData.value = response.data.data;
        return detailedInvoiceData.value;
      } else {
        console.warn('No detailed invoice data found:', response.data.message);
        detailedInvoiceData.value = null;
        detailedInvoiceError.value = response.data.message || 'No invoice data found';
        return null;
      }
    } catch (err) {
      detailedInvoiceError.value = err.message || `Failed to fetch detailed invoice data for ${invoiceNumber}`;
      console.error(`Error fetching detailed invoice data:`, err);
      detailedInvoiceData.value = null;
      return null;
    } finally {
      detailedInvoiceLoading.value = false;
    }
  }

  // New function to fetch detailed purchase data
  async function fetchDetailedPurchaseData(documentNo) {
    if (!documentNo) return;
    
    detailedPurchaseLoading.value = true;
    detailedPurchaseError.value = null;
    
    try {
      console.log(`Fetching detailed purchase data for: ${documentNo}`);
      
      const response = await ApiService.get(`/field-service-billing/dynamics-purchases`, {
        params: {
          document_no: documentNo,
          limit: 1000
        }
      });
      
      if (response.data && response.data.success) {
        console.log(`Retrieved detailed purchase data for ${documentNo}:`, response.data.data);
        detailedPurchaseData.value = response.data.data;
        return detailedPurchaseData.value;
      } else {
        console.warn('No detailed purchase data found:', response.data.message);
        detailedPurchaseData.value = null;
        detailedPurchaseError.value = response.data.message || 'No purchase data found';
        return null;
      }
    } catch (err) {
      detailedPurchaseError.value = err.message || `Failed to fetch detailed purchase data for ${documentNo}`;
      console.error(`Error fetching detailed purchase data:`, err);
      detailedPurchaseData.value = null;
      return null;
    } finally {
      detailedPurchaseLoading.value = false;
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
    // Reset Dynamics state as well
    dynamicsData.value = [];
    dynamicsError.value = null;
    // Reset detailed data state
    detailedInvoiceData.value = null;
    detailedPurchaseData.value = null;
    detailedInvoiceLoading.value = false;
    detailedPurchaseLoading.value = false;
    detailedInvoiceError.value = null;
    detailedPurchaseError.value = null;
  }

  return {
    // State
    billingData,
    currentTicket,
    loading,
    error,
    viewMode,
    
    // New Dynamics state
    dynamicsData,
    dynamicsLoading,
    dynamicsError,
    
    // New detailed data state
    detailedInvoiceData,
    detailedPurchaseData,
    detailedInvoiceLoading,
    detailedPurchaseLoading,
    detailedInvoiceError,
    detailedPurchaseError,
    
    // Getters
    hasData,
    filteredBillingData,
    totalInvoicedAmount,
    totalAmountPaid,
    totalProfitLoss,
    uniqueVendors,
    
    // Actions
    fetchBillingDataByTicket,
    fetchDynamicsData,
    fetchDetailedInvoiceData,
    fetchDetailedPurchaseData,
    setViewMode,
    resetState
  };
}); 