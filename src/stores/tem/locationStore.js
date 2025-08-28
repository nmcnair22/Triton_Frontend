import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { temClient } from '@/services/tem/temClient';

export const useTEMLocationStore = defineStore('temLocation', () => {
  // State
  const currentLocation = ref(null);
  const locationAccounts = ref([]);
  const locationBillsTimeline = ref([]);
  const locationBills = ref([]);
  const locationSummary = ref(null);
  const locationOrders = ref([]);
  const ordersGrouped = ref({});
  const ordersSummary = ref(null);
  const locationCancellations = ref([]);
  const cancellationsGrouped = ref({});
  const cancellationsSummary = ref(null);
  const loading = ref(false);
  const error = ref(null);
  
  // Loading states for individual sections
  const accountsLoading = ref(false);
  const billsLoading = ref(false);
  const ordersLoading = ref(false);
  const cancellationsLoading = ref(false);
  
  // Filters
  const accountFilters = ref({
    vendor_id: null
  });
  
  const billFilters = ref({
    months: 12,
    vendor_id: null
  });
  
  const ordersFilters = ref({
    months: 12,
    include_archived: true
  });
  
  const cancellationsFilters = ref({
    months: 12,
    include_archived: true
  });

  // Getters
  const isLoading = computed(() => loading.value);
  const currentError = computed(() => error.value);
  const locationName = computed(() => currentLocation.value?.name || '');
  const locationAddress = computed(() => {
    const loc = currentLocation.value;
    if (!loc) return '';
    return `${loc.address || ''}, ${loc.city || ''}, ${loc.state || ''} ${loc.zipcode || ''}`.trim();
  });
  
  // Account metrics
  const accountMetrics = computed(() => {
    const summary = locationSummary.value;
    if (!summary) return { totalAccounts: 0, activeAccounts: 0, totalExpected: 0 };
    
    return {
      totalAccounts: summary.total_accounts || 0,
      activeAccounts: summary.active_accounts || 0,
      totalExpected: summary.total_expected || 0,
      flaggedAccounts: summary.flagged_accounts || 0
    };
  });
  
  // Bill metrics from timeline
  const billMetrics = computed(() => {
    if (!locationBillsTimeline.value?.summary) {
      return { totalBills: 0, totalAmount: 0, overdueBills: 0 };
    }
    
    const summary = locationBillsTimeline.value.summary;
    return {
      totalBills: summary.total_bills || 0,
      totalAmount: summary.total_amount || 0,
      overdueBills: summary.overdue_bills || 0,
      paidBills: summary.paid_bills || 0
    };
  });
  
  // Active accounts for display
  const activeAccounts = computed(() => {
    return locationAccounts.value.filter(account => account.is_active);
  });
  
  // Flagged accounts for display
  const flaggedAccounts = computed(() => {
    return locationAccounts.value.filter(account => account.is_flagged);
  });
  
  // Recent bills from timeline
  const recentBills = computed(() => {
    if (!locationBillsTimeline.value?.bills) return [];
    return locationBillsTimeline.value.bills.slice(0, 10);
  });
  
  // Overdue bills
  const overdueBills = computed(() => {
    if (!locationBillsTimeline.value?.bills) return [];
    return locationBillsTimeline.value.bills.filter(bill => bill.is_overdue);
  });
  
  // Orders computed properties
  const activeOrders = computed(() => {
    return ordersGrouped.value?.active || [];
  });
  
  const linkedOrders = computed(() => {
    return ordersGrouped.value?.linked || [];
  });
  
  const unlinkedOrders = computed(() => {
    return ordersGrouped.value?.unlinked || [];
  });
  
  const completedOrders = computed(() => {
    return ordersGrouped.value?.completed || [];
  });
  
  const inProgressOrders = computed(() => {
    return ordersGrouped.value?.in_progress || [];
  });
  
  // Cancellations computed properties
  const linkedCancellations = computed(() => {
    return locationCancellations.value.filter(cancellation => 
      cancellation.tem_linkage?.status === 'Linked'
    );
  });
  
  const unlinkedCancellations = computed(() => {
    return locationCancellations.value.filter(cancellation => 
      cancellation.tem_linkage?.status !== 'Linked'
    );
  });
  
  const completedCancellations = computed(() => {
    return locationCancellations.value.filter(cancellation => 
      cancellation.status === 'Cancellation Complete'
    );
  });

  // Actions
  async function fetchLocationAccounts(customerId, locationId, filters = {}) {
    accountsLoading.value = true;
    error.value = null;
    
    try {
      const response = await temClient.getLocationTEMAccounts(customerId, locationId, {
        ...accountFilters.value,
        ...filters
      });
      
      console.log('TEM Location Accounts Response:', response.data);
      
      // Handle response structure
      if (response.data.status === 'success' && response.data.data) {
        locationAccounts.value = response.data.data || [];
        locationSummary.value = response.data.summary || {};
        
        // Store location info from response
        if (response.data.location) {
          currentLocation.value = response.data.location;
        }
      } else if (Array.isArray(response.data)) {
        locationAccounts.value = response.data;
      } else {
        console.warn('Unexpected location accounts response format:', response.data);
        locationAccounts.value = [];
      }
      
      console.log(`Loaded ${locationAccounts.value.length} accounts for location ${locationId}`);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load location accounts';
      console.error('Error fetching location accounts:', err);
      throw err;
    } finally {
      accountsLoading.value = false;
    }
  }

  async function fetchLocationBillsTimeline(customerId, locationId, filters = {}) {
    billsLoading.value = true;
    error.value = null;
    
    try {
      const response = await temClient.getLocationTEMBillsTimeline(customerId, locationId, {
        ...billFilters.value,
        ...filters
      });
      
      console.log('TEM Location Bills Timeline Response:', response.data);
      
      // Handle response structure
      if (response.data.status === 'success' && response.data.data) {
        locationBillsTimeline.value = response.data;
        locationBills.value = response.data.bills || [];
      } else if (response.data.data && response.data.bills) {
        // Direct format
        locationBillsTimeline.value = response.data;
        locationBills.value = response.data.bills || [];
      } else {
        console.warn('Unexpected bills timeline response format:', response.data);
        locationBillsTimeline.value = { data: [], bills: [], summary: {} };
        locationBills.value = [];
      }
      
      console.log(`Loaded bills timeline for location ${locationId}`);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load location bills timeline';
      console.error('Error fetching location bills timeline:', err);
      throw err;
    } finally {
      billsLoading.value = false;
    }
  }

  async function fetchLocationOrders(customerId, locationId, filters = {}) {
    ordersLoading.value = true;
    error.value = null;
    
    try {
      const response = await temClient.getLocationTEMOrders(customerId, locationId, {
        ...ordersFilters.value,
        ...filters
      });
      
      console.log('TEM Location Orders Response:', response.data);
      
      // Handle response structure - check for status wrapper
      if (response.data.status === 'success' && response.data.data) {
        locationOrders.value = response.data.data || [];
        ordersGrouped.value = response.data.grouped || {};
        ordersSummary.value = response.data.summary || {};
        
        // Store location info from response if available
        if (response.data.location) {
          currentLocation.value = response.data.location;
        }
      } else if (response.data.data) {
        // Direct format fallback
        locationOrders.value = response.data.data || [];
        ordersGrouped.value = response.data.grouped || {};
        ordersSummary.value = response.data.summary || {};
      } else {
        console.warn('Unexpected orders response format:', response.data);
        locationOrders.value = [];
        ordersGrouped.value = {};
        ordersSummary.value = {};
      }
      
      console.log(`Loaded ${locationOrders.value.length} orders for location ${locationId}`);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load location orders';
      console.error('Error fetching location orders:', err);
      throw err;
    } finally {
      ordersLoading.value = false;
    }
  }

  async function fetchLocationCancellations(customerId, locationId, filters = {}) {
    cancellationsLoading.value = true;
    error.value = null;
    
    try {
      const response = await temClient.getLocationTEMCancellations(customerId, locationId, {
        ...cancellationsFilters.value,
        ...filters
      });
      
      console.log('TEM Location Cancellations Response:', response.data);
      
      // Handle response structure - check for status wrapper
      if (response.data.status === 'success' && response.data.data) {
        locationCancellations.value = response.data.data || [];
        cancellationsGrouped.value = response.data.grouped || {};
        cancellationsSummary.value = response.data.summary || {};
        
        // Store location info from response if available
        if (response.data.location) {
          currentLocation.value = response.data.location;
        }
      } else if (response.data.data) {
        // Direct format fallback
        locationCancellations.value = response.data.data || [];
        cancellationsGrouped.value = response.data.grouped || {};
        cancellationsSummary.value = response.data.summary || {};
      } else {
        console.warn('Unexpected cancellations response format:', response.data);
        locationCancellations.value = [];
        cancellationsGrouped.value = {};
        cancellationsSummary.value = {};
      }
      
      console.log(`Loaded ${locationCancellations.value.length} cancellations for location ${locationId}`);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load location cancellations';
      console.error('Error fetching location cancellations:', err);
      throw err;
    } finally {
      cancellationsLoading.value = false;
    }
  }

  async function fetchLocationDetail(customerId, locationId) {
    loading.value = true;
    error.value = null;
    
    try {
      // Load both accounts and bills data in parallel
      const [accountsResult, billsResult] = await Promise.allSettled([
        fetchLocationAccounts(customerId, locationId),
        fetchLocationBillsTimeline(customerId, locationId)
      ]);
      
      // Check for errors but don't fail if one section fails
      if (accountsResult.status === 'rejected') {
        console.warn('Failed to load location accounts:', accountsResult.reason);
      }
      
      if (billsResult.status === 'rejected') {
        console.warn('Failed to load location bills:', billsResult.reason);
      }
      
      console.log(`Loaded location detail for location ${locationId}`);
    } catch (err) {
      error.value = err.message || 'Failed to load location details';
      console.error('Error fetching location detail:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function updateAccountFilters(newFilters) {
    accountFilters.value = { ...accountFilters.value, ...newFilters };
  }

  function updateBillFilters(newFilters) {
    billFilters.value = { ...billFilters.value, ...newFilters };
  }

  function updateOrdersFilters(newFilters) {
    ordersFilters.value = { ...ordersFilters.value, ...newFilters };
  }

  function updateCancellationsFilters(newFilters) {
    cancellationsFilters.value = { ...cancellationsFilters.value, ...newFilters };
  }

  function clearFilters() {
    accountFilters.value = { vendor_id: null };
    billFilters.value = { months: 12, vendor_id: null };
    ordersFilters.value = { months: 12, include_archived: true };
    cancellationsFilters.value = { months: 12, include_archived: true };
  }

  function setCurrentLocation(location) {
    currentLocation.value = location;
  }

  function clearLocationData() {
    currentLocation.value = null;
    locationAccounts.value = [];
    locationBillsTimeline.value = [];
    locationBills.value = [];
    locationSummary.value = null;
    locationOrders.value = [];
    ordersGrouped.value = {};
    ordersSummary.value = null;
    locationCancellations.value = [];
    cancellationsGrouped.value = {};
    cancellationsSummary.value = null;
    error.value = null;
  }

  // Analytics helpers
  function getAccountsByVendor() {
    const vendorGroups = {};
    locationAccounts.value.forEach(account => {
      const vendor = account.vendor_name || 'Unknown';
      if (!vendorGroups[vendor]) {
        vendorGroups[vendor] = [];
      }
      vendorGroups[vendor].push(account);
    });
    return vendorGroups;
  }

  function getBillTrendData() {
    if (!locationBillsTimeline.value?.data) return [];
    
    return locationBillsTimeline.value.data.map(monthData => ({
      month: monthData.month_name,
      amount: monthData.total_amount,
      billCount: monthData.bill_count,
      paidCount: monthData.paid_count,
      overdueCount: monthData.overdue_count
    }));
  }

  function getVarianceAnalysis() {
    // Calculate variance between expected and actual amounts
    const analysis = locationAccounts.value.map(account => {
      const expected = parseFloat(account.expected_amount || 0);
      const actual = parseFloat(account.last_amount || 0);
      const variance = actual - expected;
      const variancePercent = expected > 0 ? (variance / expected) * 100 : 0;
      
      return {
        ...account,
        variance,
        variancePercent,
        hasVariance: Math.abs(variancePercent) > 5 // Flag if > 5% variance
      };
    });
    
    return analysis.filter(account => account.hasVariance);
  }

  return {
    // State
    currentLocation,
    locationAccounts,
    locationBillsTimeline,
    locationBills,
    locationSummary,
    locationOrders,
    ordersGrouped,
    ordersSummary,
    locationCancellations,
    cancellationsGrouped,
    cancellationsSummary,
    loading,
    error,
    accountsLoading,
    billsLoading,
    ordersLoading,
    cancellationsLoading,
    accountFilters,
    billFilters,
    ordersFilters,
    cancellationsFilters,
    
    // Getters
    isLoading,
    currentError,
    locationName,
    locationAddress,
    accountMetrics,
    billMetrics,
    activeAccounts,
    flaggedAccounts,
    recentBills,
    overdueBills,
    activeOrders,
    linkedOrders,
    unlinkedOrders,
    completedOrders,
    inProgressOrders,
    linkedCancellations,
    unlinkedCancellations,
    completedCancellations,
    
    // Actions
    fetchLocationAccounts,
    fetchLocationBillsTimeline,
    fetchLocationOrders,
    fetchLocationCancellations,
    fetchLocationDetail,
    updateAccountFilters,
    updateBillFilters,
    updateOrdersFilters,
    updateCancellationsFilters,
    clearFilters,
    setCurrentLocation,
    clearLocationData,
    
    // Analytics
    getAccountsByVendor,
    getBillTrendData,
    getVarianceAnalysis
  };
});