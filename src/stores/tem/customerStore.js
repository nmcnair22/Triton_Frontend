import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { temClient } from '@/services/tem/temClient';

export const useTEMCustomerStore = defineStore('temCustomer', () => {
  // State
  const customers = ref([]);
  const currentCustomer = ref(null);
  const customerDetail = ref(null);
  const customerLocations = ref([]);
  const customerLocationsEnhanced = ref([]);
  const customerAccounts = ref([]);
  const customerBills = ref([]);
  const customerFunding = ref(null);
  const loading = ref(false);
  const error = ref(null);
  
  // Meta statistics from optimized endpoint
  const totalCustomers = ref(0);
  const totalActiveAccounts = ref(0);
  const totalMonthlyExpected = ref(0);
  
  // Pagination
  const pagination = ref({
    current_page: 1,
    total: 0,
    per_page: 20,
    total_pages: 1
  });

  // Filters
  const filters = ref({
    search: '',
    status: '',
    funding_status: '',
    has_issues: undefined,
    sort: 'name:asc'
  });

  // Getters
  const filteredCustomers = computed(() => customers.value);
  const totalCount = computed(() => pagination.value.total);
  const hasActiveFilters = computed(() => {
    return filters.value.search || 
           filters.value.status || 
           filters.value.funding_status ||
           filters.value.has_issues !== undefined;
  });
  
  const isLoading = computed(() => loading.value);
  const currentError = computed(() => error.value);
  
  // Current customer computed properties
  const currentCustomerName = computed(() => currentCustomer.value?.name || '');
  const currentCustomerStatus = computed(() => currentCustomer.value?.status || '');
  const currentCustomerStatistics = computed(() => currentCustomer.value?.statistics || {});

  // Actions
  async function fetchCustomers(customFilters = {}) {
    loading.value = true;
    error.value = null;
    
    try {
      const searchFilters = {
        ...filters.value,
        ...customFilters
      };
      
      const response = await temClient.getCustomers(searchFilters);
      
      // Debug: Log the response structure
      console.log('TEM API Response:', response.data);
      console.log('Response data type:', typeof response.data);
      console.log('Response data keys:', Object.keys(response.data || {}));
      
      // Initialize with empty array to prevent filter errors
      customers.value = [];
      
      // Handle optimized TEM customers endpoint response
      if (response.data.status === 'success' && response.data.data) {
        const paginationData = response.data.data;
        const metaData = response.data.meta;
        console.log('Optimized TEM Response - Data:', paginationData);
        console.log('Optimized TEM Response - Meta:', metaData);
        
        // The customer array from the optimized endpoint
        if (paginationData.data && Array.isArray(paginationData.data)) {
          const rawCustomers = paginationData.data;
          console.log('Optimized TEM Customers:', rawCustomers);
          console.log('First customer raw data:', rawCustomers[0]);
          
          // Map optimized customer fields to frontend format
          customers.value = rawCustomers.map((customer, index) => {
            const mapped = {
            // Core identifiers
            id: customer.customer_id,
            name: customer.customer_name,
            abbreviation: customer.customer_code,
            status: 'active', // All TEM customers are active
            
            // Metrics from optimized endpoint
            total_locations: customer.locations,
            total_accounts: customer.accounts,
            active_accounts: customer.active_accounts,
            monthly_expected: parseFloat(customer.monthly_expected || 0),
            funding_balance: parseFloat(customer.funding_balance || 0),
            
            // Issue indicators
            has_flags: customer.has_flags,
            issue_count: customer.has_flags ? 1 : 0,
            
            // Activity tracking
            last_activity: customer.last_activity,
            
            // Statistics object for compatibility
            statistics: {
              total_locations: customer.locations,
              total_accounts: customer.accounts,
              active_accounts: customer.active_accounts,
              monthly_expected: parseFloat(customer.monthly_expected || 0),
              mtd_spend: 0 // Not available in optimized endpoint
            },
            
            // Funding information
            funding_status: customer.funding_balance > 0 ? 'healthy' : 'low',
            
            // Additional computed fields
            mtd_spend: 0, // Not available in optimized response
            trend: 'stable', // Default value
            
            // For detail page compatibility (will be loaded separately)
            locations: [],
            funding: null,
            billingInterval: null,
            overageCharge: null
            };
            
            if (index === 0) {
              console.log('First mapped customer:', mapped);
            }
            
            return mapped;
          });
          
          // Handle pagination metadata from response
          pagination.value = {
            current_page: paginationData.current_page || 1,
            total: paginationData.total || rawCustomers.length,
            per_page: paginationData.per_page || 20,
            total_pages: paginationData.last_page || 1,
            from: paginationData.from,
            to: paginationData.to
          };
          
          // Store meta statistics for dashboard
          if (metaData) {
            totalCustomers.value = metaData.total_tem_customers || rawCustomers.length;
            totalActiveAccounts.value = metaData.active_tem_accounts || 0;
            totalMonthlyExpected.value = metaData.total_monthly_expected || 0;
          } else {
            // Fallback: calculate from current page data
            totalCustomers.value = pagination.value.total || rawCustomers.length;
            totalActiveAccounts.value = rawCustomers.reduce((sum, c) => sum + (c.active_accounts || 0), 0);
            totalMonthlyExpected.value = rawCustomers.reduce((sum, c) => sum + parseFloat(c.monthly_expected || 0), 0);
          }
          
          console.log('Meta statistics:', {
            totalCustomers: totalCustomers.value,
            totalActiveAccounts: totalActiveAccounts.value, 
            totalMonthlyExpected: totalMonthlyExpected.value
          });
          
        } else {
          console.warn('No customer data array found in optimized TEM response');
          customers.value = [];
          pagination.value = {
            current_page: 1,
            total: 0,
            per_page: 20,
            total_pages: 1
          };
        }
        
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // Fallback: Laravel API Resource format
        customers.value = response.data.data;
        pagination.value = response.data.meta?.pagination || {
          current_page: 1,
          total: response.data.data.length,
          per_page: 20,
          total_pages: 1
        };
      } else if (Array.isArray(response.data)) {
        // Fallback: Simple array response
        customers.value = response.data;
        pagination.value = {
          current_page: 1,
          total: response.data.length,
          per_page: response.data.length,
          total_pages: 1
        };
      } else {
        // Fallback: Empty state
        console.warn('Unexpected API response format:', response.data);
        customers.value = [];
        pagination.value = {
          current_page: 1,
          total: 0,
          per_page: 20,
          total_pages: 1
        };
      }
      
      // Final safety check to ensure customers is always an array
      if (!Array.isArray(customers.value)) {
        console.error('customers.value is not an array:', customers.value, typeof customers.value);
        customers.value = [];
      }
      
      console.log(`Loaded ${customers.value.length} TEM customers`);
      console.log('Final customers array:', customers.value);
      console.log('Final customers.value type:', typeof customers.value);
      console.log('Final customers.value is array:', Array.isArray(customers.value));
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load customers';
      console.error('Error fetching TEM customers:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCustomerDetail(customerId, includes = ['locations', 'funding']) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await temClient.getCustomerDetail(customerId, includes);
      
      // Handle different response structures
      const customerData = response.data.data || response.data;
      customerDetail.value = customerData;
      currentCustomer.value = customerData;
      
      console.log(`Loaded TEM customer detail for: ${customerDetail.value.name}`);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load customer details';
      console.error('Error fetching TEM customer detail:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCustomerLocations(customerId, locationFilters = {}) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await temClient.getCustomerTEMLocations(customerId, locationFilters);
      
      console.log('TEM Locations Response:', response.data);
      
      // Handle TEM locations response structure
      if (response.data.status === 'success' && response.data.data) {
        const rawLocations = response.data.data;
        console.log('Raw TEM Locations:', rawLocations);
        
        // Map TEM location fields to frontend format
        customerLocations.value = rawLocations.map(location => ({
          // Core identifiers
          id: location.location_id,
          name: location.location_name,
          
          // Address information
          address: location.address,
          city: location.city,
          state: location.state,
          zipcode: location.zipcode,
          
          // TEM metrics
          metrics: location.metrics || {},
          total_accounts: location.metrics?.total_accounts || 0,
          active_accounts: location.metrics?.active_accounts || 0,
          flagged_accounts: location.metrics?.flagged_accounts || 0,
          monthly_expected: location.metrics?.monthly_expected || 0,
          last_activity: location.metrics?.last_activity,
          last_bill_total: location.metrics?.last_bill_total || 0,
          has_activity: location.metrics?.has_activity || false,
          
          // Active accounts detail
          active_account_details: location.active_accounts || [],
          
          // Status indicators
          verified: true, // TEM locations are business-verified
          status: location.metrics?.active_accounts > 0 ? 'active' : 'inactive'
        }));
      } else if (Array.isArray(response.data)) {
        // Fallback: direct array
        customerLocations.value = response.data.map(location => ({
          id: location.location_id || location.id,
          name: location.location_name || location.name,
          address: location.address,
          city: location.city,
          state: location.state,
          metrics: location.metrics || {},
          total_accounts: location.metrics?.total_accounts || 0,
          active_accounts: location.metrics?.active_accounts || 0,
          monthly_expected: location.metrics?.monthly_expected || 0,
          verified: true,
          status: 'active'
        }));
      } else {
        console.warn('Unexpected TEM locations response format');
        customerLocations.value = [];
      }
      
      console.log(`Loaded ${customerLocations.value.length} TEM locations for customer ${customerId}`);
      console.log('Mapped TEM Locations:', customerLocations.value);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load customer locations';
      console.error('Error fetching TEM customer locations:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCustomerLocationsEnhanced(customerId, locationFilters = {}) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await temClient.getCustomerTEMLocationsEnhanced(customerId, locationFilters);
      
      console.log('Enhanced TEM Locations Response:', response.data);
      
      // Handle response structure
      if (response.data.status === 'success' && response.data.data) {
        const rawLocations = response.data.data;
        console.log('Raw Enhanced TEM Locations:', rawLocations);
        
        // Process enhanced location data with correct structure
        customerLocationsEnhanced.value = rawLocations.map(location => ({
          // Basic location info
          id: location.location_id,
          name: location.location_name,
          site_number: location.site_number,
          address: location.location_address,
          
          // Provider summary (from nested object)
          provider_count: parseInt(location.provider_summary?.count || 0),
          providers: location.provider_summary?.names || [],
          providers_text: location.provider_summary?.names ? location.provider_summary.names.join(', ') : '',
          
          // Account metrics (from nested object)
          active_accounts: parseInt(location.account_metrics?.active_accounts || 0),
          flagged_accounts: parseInt(location.account_metrics?.flagged_accounts || 0),
          monthly_expected: parseFloat(location.account_metrics?.monthly_expected || 0),
          
          // Recent activity (from nested object)
          recent_bill_count: parseInt(location.recent_activity?.bill_count_30_days || 0),
          recent_spend: parseFloat(location.recent_activity?.spend_30_days || 0),
          overdue_bills: parseInt(location.recent_activity?.overdue_bills || 0),
          days_since_activity: parseInt(location.recent_activity?.days_since_activity || 0),
          has_recent_activity: location.recent_activity?.has_recent_activity || false,
          
          // Account details (already structured)
          account_details: location.accounts || [],
          
          // Computed flags
          is_overdue: parseInt(location.recent_activity?.overdue_bills || 0) > 0,
          needs_attention: parseInt(location.recent_activity?.days_since_activity || 0) > 30 || parseInt(location.recent_activity?.overdue_bills || 0) > 0
        }));
        
        console.log(`Loaded ${customerLocationsEnhanced.value.length} enhanced TEM locations for customer ${customerId}`);
        return response.data;
      } else if (Array.isArray(response.data)) {
        // Direct array format
        customerLocationsEnhanced.value = response.data;
        return response.data;
      } else {
        console.warn('Unexpected enhanced TEM locations response format:', response.data);
        customerLocationsEnhanced.value = [];
        return [];
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load enhanced customer locations';
      console.error('Error fetching enhanced TEM customer locations:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }


  async function fetchCustomerAccounts(customerId, accountFilters = {}) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await temClient.getCustomerAccounts(customerId, accountFilters);
      
      // Handle different response structures
      customerAccounts.value = response.data.data || response.data || [];
      
      console.log(`Loaded ${customerAccounts.value.length} accounts for customer ${customerId}`);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load customer accounts';
      console.error('Error fetching customer accounts:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCustomerBills(customerId, billFilters = {}) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await temClient.getCustomerBills(customerId, billFilters);
      
      // Handle different response structures
      customerBills.value = response.data.data || response.data || [];
      
      console.log(`Loaded ${customerBills.value.length} bills for customer ${customerId}`);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load customer bills';
      console.error('Error fetching customer bills:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCustomerFunding(customerId) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await temClient.getCustomerFunding(customerId);
      
      // Handle different response structures
      customerFunding.value = response.data.data || response.data;
      
      console.log(`Loaded funding details for customer ${customerId}`);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load customer funding';
      console.error('Error fetching customer funding:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function updateFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters };
  }

  function clearFilters() {
    filters.value = {
      search: '',
      status: '',
      funding_status: '',
      has_issues: undefined,
      sort: 'name:asc'
    };
  }

  function setCurrentCustomer(customer) {
    currentCustomer.value = customer;
    customerDetail.value = customer;
  }

  async function switchCustomer(customerId) {
    console.log(`Switching to TEM customer: ${customerId}`);
    
    // Clear previous customer data
    clearCustomerData();
    
    // Load new customer
    await fetchCustomerDetail(customerId);
  }

  function clearCustomerData() {
    currentCustomer.value = null;
    customerDetail.value = null;
    customerLocations.value = [];
    customerAccounts.value = [];
    customerBills.value = [];
    customerFunding.value = null;
    error.value = null;
  }

  async function exportCustomers(exportFilters = {}, format = 'csv') {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await temClient.exportData('customers', {
        ...filters.value,
        ...exportFilters
      }, format);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tem_customers.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      console.log('Customer export completed');
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to export customers';
      console.error('Error exporting customers:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Initialize function for when component mounts
  async function initialize() {
    if (customers.value.length === 0) {
      try {
        await fetchCustomers();
      } catch (error) {
        console.warn('Failed to initialize TEM customer store, using empty state:', error.message);
        // Set empty state so UI doesn't crash
        customers.value = [];
        pagination.value = {
          current_page: 1,
          total: 0,
          per_page: 20,
          total_pages: 1
        };
        // Don't re-throw error, let the UI show empty state
      }
    }
  }

  return {
    // State
    customers,
    currentCustomer,
    customerDetail,
    customerLocations,
    customerLocationsEnhanced,
    customerAccounts,
    customerBills,
    customerFunding,
    loading,
    error,
    pagination,
    filters,
    totalCustomers,
    totalActiveAccounts,
    totalMonthlyExpected,
    
    // Getters
    filteredCustomers,
    totalCount,
    hasActiveFilters,
    isLoading,
    currentError,
    currentCustomerName,
    currentCustomerStatus,
    currentCustomerStatistics,
    
    // Actions
    fetchCustomers,
    fetchCustomerDetail,
    fetchCustomerLocations,
    fetchCustomerLocationsEnhanced,
    fetchCustomerAccounts,
    fetchCustomerBills,
    fetchCustomerFunding,
    updateFilters,
    clearFilters,
    setCurrentCustomer,
    switchCustomer,
    clearCustomerData,
    exportCustomers,
    initialize
  };
});