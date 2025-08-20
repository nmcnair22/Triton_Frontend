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
  
  // Dispatch-specific state
  const dispatches = ref([]);
  const technicians = ref([]);
  const selectedDispatch = ref(null);
  const filters = ref({
    status: null,
    priority: null,
    technician: null,
    dateRange: null
  });

  // Getters
  const hasTurnups = computed(() => turnups.value.length > 0);
  const hasLocations = computed(() => customerLocations.value.length > 0);
  
  // Dispatch-specific getters
  const pendingDispatches = computed(() => 
    dispatches.value.filter(d => d.status === 'pending')
  );
  
  const activeDispatches = computed(() => 
    dispatches.value.filter(d => d.status === 'active' || d.status === 'in_progress')
  );
  
  const completedDispatches = computed(() => 
    dispatches.value.filter(d => d.status === 'completed')
  );

  const unassignedDispatches = computed(() =>
    dispatches.value.filter(d => !d.technician && d.status !== 'completed')
  );

  const dispatchStats = computed(() => ({
    total: dispatches.value.length,
    pending: pendingDispatches.value.length,
    active: activeDispatches.value.length,
    completed: completedDispatches.value.length,
    unassigned: unassignedDispatches.value.length
  }));

  // Date range options
  const dateRangeOptions = [
    { label: 'Last 24 Hours', value: 'last24h' },
    { label: 'Last 7 Days', value: 'last7days' },
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
      
      case 'last7days':
        return {
          start_date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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

  // Dashboard data
  const dashboardSummary = ref(null);
  const activeOperations = ref([]);
  const riskAnalysis = ref(null);
  const customerAnalytics = ref(null);
  const trendAnalysis = ref(null);
  const visitTypeAnalysis = ref(null);
  const benchmarks = ref(null);
  const notesAnalysis = ref(null);
  const filterOptions = ref(null);
  const chartsData = ref(null);

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

  // Dashboard API methods
  async function fetchDashboardSummary(filters = {}) {
    loading.value = true;
    error.value = null;

    try {
      console.log('🔄 Fetching dashboard summary with filters:', filters);
      
      const response = await ApiService.get('/dashboard/summary', filters);
      
      if (response.data && response.data.success) {
        dashboardSummary.value = response.data.data;
        console.log('✅ Dashboard summary loaded');
        return dashboardSummary.value;
      } else {
        const backendError = response.data?.error || 'Unknown backend error';
        console.error('❌ Backend error for dashboard summary:', backendError);
        throw new Error(backendError);
      }
    } catch (err) {
      console.error('❌ Dashboard summary fetch error:', err);
      error.value = err.response?.data?.message || err.message || 'Failed to fetch dashboard summary';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchActiveOperations(filters = {}) {
    try {
      console.log('🔄 Fetching active operations');
      
      const response = await ApiService.get('/dashboard/active-operations', filters);
      
      if (response.data && response.data.success) {
        activeOperations.value = response.data.data?.active_visits || [];
        console.log('✅ Active operations loaded:', activeOperations.value?.length || 0);
        return activeOperations.value;
      } else {
        const backendError = response.data?.error || 'Unknown backend error';
        console.error('❌ Backend error for active operations:', backendError);
        throw new Error(backendError);
      }
    } catch (err) {
      console.error('❌ Active operations fetch error:', err);
      throw err;
    }
  }

  async function fetchRiskAnalysis(filters = {}) {
    try {
      console.log('🔄 Fetching risk analysis');
      
      const response = await ApiService.get('/dashboard/risk-analysis', filters);
      
      if (response.data && response.data.success) {
        riskAnalysis.value = response.data.data;
        console.log('✅ Risk analysis loaded');
        return riskAnalysis.value;
      } else {
        const backendError = response.data?.error || 'Unknown backend error';
        console.error('❌ Backend error for risk analysis:', backendError);
        throw new Error(backendError);
      }
    } catch (err) {
      console.error('❌ Risk analysis fetch error:', err);
      throw err;
    }
  }

  async function fetchCustomerAnalytics(filters = {}) {
    try {
      console.log('🔄 Fetching customer analytics');
      
      const response = await ApiService.get('/dashboard/customer-analytics', filters);
      
      if (response.data && response.data.success) {
        customerAnalytics.value = response.data.data;
        console.log('✅ Customer analytics loaded');
        return customerAnalytics.value;
      } else {
        const backendError = response.data?.error || 'Unknown backend error';
        console.error('❌ Backend error for customer analytics:', backendError);
        throw new Error(backendError);
      }
    } catch (err) {
      console.error('❌ Customer analytics fetch error:', err);
      throw err;
    }
  }

  async function fetchTrendAnalysis(filters = {}) {
    try {
      console.log('🔄 Fetching trend analysis');
      
      const response = await ApiService.get('/dashboard/trend-analysis', filters);
      
      if (response.data && response.data.success) {
        trendAnalysis.value = response.data.data;
        console.log('✅ Trend analysis loaded');
        return trendAnalysis.value;
      } else {
        const backendError = response.data?.error || 'Unknown backend error';
        console.error('❌ Backend error for trend analysis:', backendError);
        throw new Error(backendError);
      }
    } catch (err) {
      console.error('❌ Trend analysis fetch error:', err);
      throw err;
    }
  }

  async function fetchVisitTypeAnalysis(filters = {}) {
    try {
      console.log('🔄 Fetching visit type analysis');
      
      const response = await ApiService.get('/dashboard/visit-type-analysis', filters);
      
      if (response.data && response.data.success) {
        visitTypeAnalysis.value = response.data.data;
        console.log('✅ Visit type analysis loaded');
        return visitTypeAnalysis.value;
      } else {
        const backendError = response.data?.error || 'Unknown backend error';
        console.error('❌ Backend error for visit type analysis:', backendError);
        throw new Error(backendError);
      }
    } catch (err) {
      console.error('❌ Visit type analysis fetch error:', err);
      throw err;
    }
  }

  async function fetchBenchmarks(filters = {}) {
    try {
      console.log('🔄 Fetching benchmarks');
      
      const response = await ApiService.get('/dashboard/benchmarks', filters);
      
      if (response.data && response.data.success) {
        benchmarks.value = response.data.data;
        console.log('✅ Benchmarks loaded');
        return benchmarks.value;
      } else {
        const backendError = response.data?.error || 'Unknown backend error';
        console.error('❌ Backend error for benchmarks:', backendError);
        throw new Error(backendError);
      }
    } catch (err) {
      console.error('❌ Benchmarks fetch error:', err);
      throw err;
    }
  }

  async function fetchNotesAnalysis(filters = {}) {
    try {
      console.log('🔄 Fetching notes analysis');
      
      const response = await ApiService.get('/dashboard/notes-analysis', filters);
      
      if (response.data && response.data.success) {
        notesAnalysis.value = response.data.data;
        console.log('✅ Notes analysis loaded');
        return notesAnalysis.value;
      } else {
        const backendError = response.data?.error || 'Unknown backend error';
        console.error('❌ Backend error for notes analysis:', backendError);
        throw new Error(backendError);
      }
    } catch (err) {
      console.error('❌ Notes analysis fetch error:', err);
      throw err;
    }
  }

  async function fetchFilterOptions() {
    try {
      console.log('🔄 Fetching filter options');
      
      const response = await ApiService.get('/dashboard/filter-options');
      
      if (response.data && response.data.success) {
        filterOptions.value = response.data.data;
        console.log('✅ Filter options loaded');
        return filterOptions.value;
      } else {
        const backendError = response.data?.error || 'Unknown backend error';
        console.error('❌ Backend error for filter options:', backendError);
        throw new Error(backendError);
      }
    } catch (err) {
      console.error('❌ Filter options fetch error:', err);
      throw err;
    }
  }

  async function fetchChartsData(filters = {}) {
    try {
      console.log('🔄 Fetching charts data');
      
      const response = await ApiService.get('/dashboard/charts', filters);
      
      if (response.data && response.data.success) {
        chartsData.value = response.data.data;
        console.log('✅ Charts data loaded');
        return chartsData.value;
      } else {
        const backendError = response.data?.error || 'Unknown backend error';
        console.error('❌ Backend error for charts data:', backendError);
        throw new Error(backendError);
      }
    } catch (err) {
      console.error('❌ Charts data fetch error:', err);
      throw err;
    }
  }

  // Consolidated dashboard data fetch
  async function fetchAllDashboardData(filters = {}) {
    loading.value = true;
    error.value = null;

    try {
      console.log('🔄 Fetching all dashboard data');
      
      // Fetch all dashboard endpoints in parallel
      const [
        summary,
        operations,
        risk,
        customer,
        trends,
        visitTypes,
        benchmarkData,
        notes,
        filterOpts,
        charts
      ] = await Promise.allSettled([
        fetchDashboardSummary(filters),
        fetchActiveOperations(filters),
        fetchRiskAnalysis(filters),
        fetchCustomerAnalytics(filters),
        fetchTrendAnalysis(filters),
        fetchVisitTypeAnalysis(filters),
        fetchBenchmarks(filters),
        fetchNotesAnalysis(filters),
        fetchFilterOptions(),
        fetchChartsData(filters)
      ]);

      console.log('✅ All dashboard data loaded');
      return {
        summary: summary.status === 'fulfilled' ? summary.value : null,
        operations: operations.status === 'fulfilled' ? operations.value : [],
        risk: risk.status === 'fulfilled' ? risk.value : null,
        customer: customer.status === 'fulfilled' ? customer.value : null,
        trends: trends.status === 'fulfilled' ? trends.value : null,
        visitTypes: visitTypes.status === 'fulfilled' ? visitTypes.value : null,
        benchmarks: benchmarkData.status === 'fulfilled' ? benchmarkData.value : null,
        notes: notes.status === 'fulfilled' ? notes.value : null,
        filterOptions: filterOpts.status === 'fulfilled' ? filterOpts.value : null,
        charts: charts.status === 'fulfilled' ? charts.value : null
      };
    } catch (err) {
      console.error('❌ Dashboard data fetch error:', err);
      error.value = err.message || 'Failed to fetch dashboard data';
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

  // Dispatch management functions
  async function loadDispatches(date = null) {
    loading.value = true;
    error.value = null;
    try {
      const params = {};
      if (date) {
        params.date = date.toISOString().split('T')[0];
      }
      if (filters.value.status) {
        params.status = filters.value.status;
      }
      if (filters.value.priority) {
        params.priority = filters.value.priority;
      }
      if (filters.value.technician) {
        params.technician_id = filters.value.technician;
      }
      
      const response = await ApiService.get('dispatches', params);
      dispatches.value = response.data?.data || [];
      return dispatches.value;
    } catch (err) {
      error.value = err.message || 'Failed to load dispatches';
      console.error('Error loading dispatches:', err);
      dispatches.value = [];
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function loadTechnicians() {
    try {
      const response = await ApiService.get('technicians');
      technicians.value = response.data?.data || [];
      // Add initials for avatar display
      technicians.value = technicians.value.map(tech => ({
        ...tech,
        initials: tech.name ? tech.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'TK'
      }));
      return technicians.value;
    } catch (err) {
      console.error('Error loading technicians:', err);
      technicians.value = [];
      throw err;
    }
  }

  async function createDispatch(dispatch) {
    loading.value = true;
    error.value = null;
    try {
      const dispatchData = {
        customer_id: dispatch.customer?.id,
        customer_name: dispatch.customer?.name,
        service_type: dispatch.serviceType,
        priority: dispatch.priority,
        address: dispatch.address,
        scheduled_date: dispatch.scheduledDate,
        scheduled_time: dispatch.scheduledTime,
        technician_id: dispatch.technician?.id,
        notes: dispatch.notes,
        status: 'scheduled'
      };
      
      const response = await ApiService.post('dispatches', dispatchData);
      if (response.data?.data) {
        dispatches.value.push(response.data.data);
      }
      return response.data?.data;
    } catch (err) {
      error.value = err.message || 'Failed to create dispatch';
      console.error('Error creating dispatch:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateDispatch(id, updates) {
    loading.value = true;
    error.value = null;
    try {
      const response = await ApiService.put(`dispatches/${id}`, updates);
      const index = dispatches.value.findIndex(d => d.id === id);
      if (index !== -1 && response.data?.data) {
        dispatches.value[index] = response.data.data;
      }
      return response.data?.data;
    } catch (err) {
      error.value = err.message || 'Failed to update dispatch';
      console.error('Error updating dispatch:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteDispatch(id) {
    loading.value = true;
    error.value = null;
    try {
      await ApiService.delete(`dispatches/${id}`);
      dispatches.value = dispatches.value.filter(d => d.id !== id);
    } catch (err) {
      error.value = err.message || 'Failed to delete dispatch';
      console.error('Error deleting dispatch:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function assignTechnician(dispatchId, technicianId) {
    return updateDispatch(dispatchId, { technician_id: technicianId });
  }

  async function updateStatus(dispatchId, status) {
    return updateDispatch(dispatchId, { status });
  }

  function selectDispatch(dispatch) {
    selectedDispatch.value = dispatch;
  }

  function applyFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters };
  }

  function clearFilters() {
    filters.value = {
      status: null,
      priority: null,
      technician: null,
      dateRange: null
    };
  }

  async function exportDispatches(format = 'csv') {
    try {
      const params = {
        format,
        ...filters.value
      };
      const response = await ApiService.post('dispatches/export', params);
      return response.data;
    } catch (err) {
      console.error('Error exporting dispatches:', err);
      throw err;
    }
  }

  // Reset state
  function resetState() {
    turnups.value = [];
    customerLocations.value = [];
    dispatches.value = [];
    technicians.value = [];
    selectedDispatch.value = null;
    error.value = null;
    totalRecords.value = 0;
    clearFilters();
  }

  return {
    // State
    turnups,
    customerLocations,
    loading,
    error,
    totalRecords,
    
    // Dispatch state
    dispatches,
    technicians,
    selectedDispatch,
    filters,
    
    // Dashboard state
    dashboardSummary,
    activeOperations,
    riskAnalysis,
    customerAnalytics,
    trendAnalysis,
    visitTypeAnalysis,
    benchmarks,
    notesAnalysis,
    filterOptions,
    chartsData,
    
    // Getters
    hasTurnups,
    hasLocations,
    dateRangeOptions,
    
    // Dispatch getters
    pendingDispatches,
    activeDispatches,
    completedDispatches,
    unassignedDispatches,
    dispatchStats,
    
    // Actions
    fetchTurnups,
    fetchCustomerLocations,
    fetchTurnupById,
    calculateDateRange,
    resetState,
    
    // Dispatch actions
    loadDispatches,
    loadTechnicians,
    createDispatch,
    updateDispatch,
    deleteDispatch,
    assignTechnician,
    updateStatus,
    selectDispatch,
    applyFilters,
    clearFilters,
    exportDispatches,
    
    // Dashboard actions
    fetchDashboardSummary,
    fetchActiveOperations,
    fetchRiskAnalysis,
    fetchCustomerAnalytics,
    fetchTrendAnalysis,
    fetchVisitTypeAnalysis,
    fetchBenchmarks,
    fetchNotesAnalysis,
    fetchFilterOptions,
    fetchChartsData,
    fetchAllDashboardData
  };
}); 