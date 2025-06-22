import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ApiService } from '@/service/ApiService';

export const useDispatchStore = defineStore('dispatch', () => {
  // State
  const turnups = ref([]);
  const customerLocations = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const totalRecords = ref(0);

  // Getters
  const hasTurnups = computed(() => turnups.value.length > 0);
  const hasLocations = computed(() => customerLocations.value.length > 0);

  // Date range options
  const dateRangeOptions = [
    { label: 'Last 24 Hours', value: 'last24h' },
    { label: 'This Week', value: 'thisWeek' },
    { label: 'Last Week', value: 'lastWeek' },
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Last Month', value: 'lastMonth' },
    { label: 'This Quarter', value: 'thisQuarter' },
    { label: 'Last Quarter', value: 'lastQuarter' },
    { label: 'This Year', value: 'thisYear' },
    { label: 'Custom Range', value: 'custom' }
  ];

  // Helper function to calculate date ranges
  function calculateDateRange(option) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (option) {
      case 'last24h':
        return {
          start_date: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end_date: now.toISOString().split('T')[0]
        };
      
      case 'thisWeek':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return {
          start_date: startOfWeek.toISOString().split('T')[0],
          end_date: today.toISOString().split('T')[0]
        };
      
      case 'lastWeek':
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        return {
          start_date: lastWeekStart.toISOString().split('T')[0],
          end_date: lastWeekEnd.toISOString().split('T')[0]
        };
      
      case 'thisMonth':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          start_date: startOfMonth.toISOString().split('T')[0],
          end_date: today.toISOString().split('T')[0]
        };
      
      case 'lastMonth':
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        return {
          start_date: lastMonthStart.toISOString().split('T')[0],
          end_date: lastMonthEnd.toISOString().split('T')[0]
        };
      
      case 'thisQuarter':
        const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
        return {
          start_date: quarterStart.toISOString().split('T')[0],
          end_date: today.toISOString().split('T')[0]
        };
      
      case 'lastQuarter':
        const lastQuarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 - 3, 1);
        const lastQuarterEnd = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 0);
        return {
          start_date: lastQuarterStart.toISOString().split('T')[0],
          end_date: lastQuarterEnd.toISOString().split('T')[0]
        };
      
      case 'thisYear':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        return {
          start_date: yearStart.toISOString().split('T')[0],
          end_date: today.toISOString().split('T')[0]
        };
      
      default:
        return null;
    }
  }

  // Actions
  async function fetchTurnups(filters = {}) {
    loading.value = true;
    error.value = null;

    try {
      console.log('🔄 Fetching turnups with filters:', filters);
      
      const response = await ApiService.get('/dispatch/turnups', filters);
      
      if (response.data && response.data.success) {
        turnups.value = response.data.data || [];
        totalRecords.value = response.data.count || turnups.value.length;
        
        console.log('✅ Turnups loaded:', turnups.value.length);
        return { turnups: turnups.value, total: totalRecords.value };
      } else {
        // Handle backend error response
        const backendError = response.data?.error || 'Unknown backend error';
        console.error('❌ Backend error for turnups:', backendError);
        turnups.value = [];
        totalRecords.value = 0;
        throw new Error(backendError);
      }
    } catch (err) {
      console.error('❌ Turnups fetch error:', err);
      error.value = err.response?.data?.message || err.message || 'Failed to fetch turnups';
      turnups.value = [];
      totalRecords.value = 0;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCustomerLocations(filters = {}) {
    loading.value = true;
    error.value = null;

    try {
      console.log('🔄 Fetching customer locations with filters:', filters);
      
      // Extract customer_id from filters and build the new API URL format
      const { customer_id, ...queryParams } = filters;
      
      if (!customer_id) {
        throw new Error('customer_id is required');
      }
      
      const response = await ApiService.get(`/cisdb/customers/${customer_id}/locations`, queryParams);
      
      if (response.data && response.data.success) {
        customerLocations.value = response.data.data || [];
        
        console.log('✅ Customer locations loaded:', customerLocations.value.length);
        return customerLocations.value;
      } else {
        // Handle backend error response
        const backendError = response.data?.error || 'Unknown backend error';
        console.error('❌ Backend error for customer locations:', backendError);
        customerLocations.value = [];
        throw new Error(backendError);
      }
    } catch (err) {
      console.error('❌ Customer locations fetch error:', err);
      error.value = err.response?.data?.message || err.message || 'Failed to fetch customer locations';
      customerLocations.value = [];
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchTurnupById(ticketId) {
    loading.value = true;
    error.value = null;

    try {
      console.log('🔄 Fetching turnup by ID:', ticketId);
      
      const response = await ApiService.get(`/dispatch/turnups/${ticketId}`);
      
      if (response.data && response.data.success) {
        console.log('✅ Turnup loaded:', response.data.data);
        return response.data.data;
      } else {
        // Handle backend error response
        const backendError = response.data?.error || 'Unknown backend error';
        console.error('❌ Backend error for turnup by ID:', backendError);
        throw new Error(backendError);
      }
    } catch (err) {
      console.error('❌ Turnup fetch error:', err);
      error.value = err.response?.data?.message || err.message || 'Failed to fetch turnup';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Reset state
  function resetState() {
    turnups.value = [];
    customerLocations.value = [];
    error.value = null;
    totalRecords.value = 0;
  }

  return {
    // State
    turnups,
    customerLocations,
    loading,
    error,
    totalRecords,
    
    // Getters
    hasTurnups,
    hasLocations,
    dateRangeOptions,
    
    // Actions
    fetchTurnups,
    fetchCustomerLocations,
    fetchTurnupById,
    calculateDateRange,
    resetState
  };
}); 