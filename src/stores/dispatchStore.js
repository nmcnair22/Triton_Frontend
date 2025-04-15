import { defineStore } from 'pinia';
import { ApiService, DispatchService } from '@/service/ApiService';

export const useDispatchStore = defineStore('dispatch', {
  state: () => ({
    // Key Metrics
    totalDispatches: 0,
    totalRevenue: 0,
    averageMargin: 0,
    completionRate: 0,
    
    // Overview Tab Data
    dispatchVolume: [],
    resultCodes: [],
    dispatchesByClient: [],
    dispatchesByProject: [],
    
    // Revenue Tab Data
    revenueOverTime: [],
    topClientsByRevenue: [],
    
    // Geography Tab Data
    dispatchesByState: [],
    
    // Detailed View Tab Data
    detailedDispatches: [],
    detailedDispatchesTotal: 0,
    
    // Filters state
    dateRange: {
      start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
    selectedCustomerId: null,
    selectedProjectName: null,
    selectedStatus: null,
    
    // Loading states
    loading: {
      keyMetrics: false,
      dispatchVolume: false,
      resultCodes: false,
      dispatchesByClient: false,
      dispatchesByProject: false,
      revenueOverTime: false,
      topClientsByRevenue: false,
      dispatchesByState: false,
      detailedDispatches: false,
      clientData: false,
      projectData: false,
      revenueData: false,
      clientRevenueData: false,
      stateData: false,
      detailedData: false,
      technicianData: false
    },
    
    // Error states
    errors: {
      keyMetrics: null,
      dispatchVolume: null,
      resultCodes: null,
      dispatchesByClient: null,
      dispatchesByProject: null,
      revenueOverTime: null,
      topClientsByRevenue: null,
      dispatchesByState: null,
      detailedDispatches: null,
      clientData: null,
      projectData: null,
      revenueData: null,
      clientRevenueData: null,
      stateData: null,
      detailedData: null,
      technicianData: null
    },
    
    // New state variables
    clientData: [],
    projectData: [],
    revenueData: [],
    clientRevenueData: [],
    stateData: [],
    detailedData: [],
    technicianData: []
  }),
  
  getters: {
    dateRangeText: (state) => {
      const start = new Date(state.dateRange.start);
      const end = new Date(state.dateRange.end);
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    },
    
    // Calculate percentage changes in metrics compared to previous period
    dispatchCountChange: (state) => {
      // Placeholder - will be calculated when comparing current vs previous period
      return 8.12;
    },
    
    revenueChange: (state) => {
      // Placeholder
      return 14.5;
    },
    
    marginChange: (state) => {
      // Placeholder
      return 2.3;
    },
    
    completionRateChange: (state) => {
      // Placeholder
      return -1.5;
    },
    
    // Filter helpers
    activeFilters: (state) => {
      const filters = [];
      if (state.selectedCustomerId) filters.push('Customer');
      if (state.selectedProjectName) filters.push('Project');
      if (state.selectedStatus) filters.push('Status');
      return filters;
    }
  },
  
  actions: {
    // Update date range and optionally refresh data
    setDateRange(start, end, refresh = true) {
      this.dateRange.start = start;
      this.dateRange.end = end;
      
      if (refresh) {
        this.fetchAllDashboardData();
      }
    },
    
    // Set filter values
    setFilters(customerId = null, projectName = null, status = null, refresh = true) {
      this.selectedCustomerId = customerId;
      this.selectedProjectName = projectName;
      this.selectedStatus = status;
      
      if (refresh) {
        this.fetchAllDashboardData();
      }
    },
    
    // Reset filters
    resetFilters(refresh = true) {
      this.selectedCustomerId = null;
      this.selectedProjectName = null;
      this.selectedStatus = null;
      
      if (refresh) {
        this.fetchAllDashboardData();
      }
    },
    
    // Fetch all dashboard data
    async fetchAllDashboardData() {
      await Promise.all([
        this.fetchKeyMetrics(),
        this.fetchDispatchVolume(),
        this.fetchResultCodes(),
        this.fetchDispatchesByClient(),
        this.fetchDispatchesByProject(),
        this.fetchRevenueOverTime(),
        this.fetchTopClientsByRevenue(),
        this.fetchDispatchesByState()
      ]);
    },
    
    // Key Metrics section - fetches all four main metrics
    async fetchKeyMetrics() {
      this.loading.keyMetrics = true;
      this.errors.keyMetrics = null;
      
      try {
        // 1. Total Dispatches
        const dispatchResponse = await DispatchService.getKeyMetrics({
          date_from: this.dateRange.start,
          date_to: this.dateRange.end,
          customer_id: this.selectedCustomerId,
          project_name: this.selectedProjectName,
          status: this.selectedStatus,
          limit: -1
        });
        
        this.totalDispatches = dispatchResponse.data?.count || 0;
        
        // 2. Revenue and Margin - using accounting margins API
        try {
          const marginsResponse = await DispatchService.getMargins({
            date_from: this.dateRange.start,
            date_to: this.dateRange.end
          });
          
          if (marginsResponse.data?.totals) {
            this.totalRevenue = marginsResponse.data.totals.total_charged || 0;
            this.averageMargin = marginsResponse.data.totals.overall_margin_percent || 0;
          } else {
            this.totalRevenue = 0;
            this.averageMargin = 0;
          }
        } catch (marginError) {
          console.error('Error fetching margin data:', marginError);
          this.errors.keyMetrics = marginError.message || 'Failed to load revenue data';
          this.totalRevenue = 0;
          this.averageMargin = 0;
        }
        
        // 3. Completion Rate
        const statsResponse = await DispatchService.getDispatchStats({ 
          date_from: this.dateRange.start, 
          date_to: this.dateRange.end,
          customer_id: this.selectedCustomerId,
          project_name: this.selectedProjectName
        });
        
        if (statsResponse.data?.data && statsResponse.data?.total) {
          const completedCount = statsResponse.data.data.find(
            item => item.status.toLowerCase() === 'completed'
          )?.count || 0;
          
          this.completionRate = statsResponse.data.total 
            ? (completedCount / statsResponse.data.total) * 100 
            : 0;
        } else {
          this.completionRate = 0;
        }
      } catch (error) {
        console.error('Error fetching key metrics:', error);
        this.errors.keyMetrics = error.message || 'Failed to load key metrics';
        
        // Reset to zero instead of using mock data
        this.totalDispatches = 0;
        this.totalRevenue = 0;
        this.averageMargin = 0;
        this.completionRate = 0;
      } finally {
        this.loading.keyMetrics = false;
      }
    },
    
    // Dispatch Volume Chart - fetches dispatch data for the volume chart
    async fetchDispatchVolume() {
      this.loading.dispatchVolume = true;
      this.errors.dispatchVolume = null;
      
      try {
        const response = await DispatchService.getDetailedDispatches({
          date_from: this.dateRange.start,
          date_to: this.dateRange.end,
          customer_id: this.selectedCustomerId,
          project_name: this.selectedProjectName,
          status: this.selectedStatus,
          limit: -1
        });
        
        if (response.data?.data) {
          // Store raw data - grouping will be handled in component
          this.dispatchVolume = response.data.data;
        } else {
          this.dispatchVolume = [];
        }
      } catch (error) {
        console.error('Error fetching dispatch volume:', error);
        this.errors.dispatchVolume = error.message || 'Failed to load dispatch volume data';
        this.dispatchVolume = [];
      } finally {
        this.loading.dispatchVolume = false;
      }
    },
    
    // Result Codes Chart
    async fetchResultCodes() {
      this.loading.resultCodes = true;
      this.errors.resultCodes = null;
      
      try {
        const response = await DispatchService.getDispatchStats({
          date_from: this.dateRange.start,
          date_to: this.dateRange.end,
          customer_id: this.selectedCustomerId,
          project_name: this.selectedProjectName
        });
        
        if (response.data?.data) {
          this.resultCodes = response.data.data;
        } else {
          this.resultCodes = [];
        }
      } catch (error) {
        console.error('Error fetching result codes:', error);
        this.errors.resultCodes = error.message || 'Failed to load result codes data';
        this.resultCodes = [];
      } finally {
        this.loading.resultCodes = false;
      }
    },
    
    // Top Clients Chart
    async fetchDispatchesByClient(params = {}) {
      this.loading.clientData = true;
      this.errors.clientData = null;
      try {
        const response = await ApiService.get('/dispatch-reports/stats/customers', {
          ...this.filterParams,
          ...params
        });
        this.clientData = response.data || [];
      } catch (error) {
        console.error('Error fetching dispatches by client', error);
        this.errors.clientData = 'Failed to load client data';
        this.clientData = [];
      } finally {
        this.loading.clientData = false;
      }
    },
    
    // Top Projects Chart
    async fetchDispatchesByProject(params = {}) {
      this.loading.projectData = true;
      this.errors.projectData = null;
      try {
        const response = await ApiService.get('/dispatch-reports/stats/project', {
          ...this.filterParams,
          ...params
        });
        this.projectData = response.data || [];
      } catch (error) {
        console.error('Error fetching dispatches by project', error);
        this.errors.projectData = 'Failed to load project data';
        this.projectData = [];
      } finally {
        this.loading.projectData = false;
      }
    },
    
    // Revenue Over Time Chart
    async fetchRevenueOverTime(params = {}) {
      this.loading.revenueData = true;
      this.errors.revenueData = null;
      try {
        const response = await ApiService.get('/dispatch-reports/accounting/margins', {
          ...this.filterParams,
          ...params
        });
        this.revenueData = response.data || [];
      } catch (error) {
        console.error('Error fetching revenue over time', error);
        this.errors.revenueData = 'Failed to load revenue data';
        this.revenueData = [];
      } finally {
        this.loading.revenueData = false;
      }
    },
    
    // Top Clients by Revenue
    async fetchTopClientsByRevenue(params = {}) {
      this.loading.clientRevenueData = true;
      this.errors.clientRevenueData = null;
      try {
        const response = await ApiService.get('/dispatch-reports/accounting/client-revenue', {
          ...this.filterParams,
          ...params
        });
        this.clientRevenueData = response.data || [];
      } catch (error) {
        console.error('Error fetching top clients by revenue', error);
        this.errors.clientRevenueData = 'Failed to load client revenue data';
        this.clientRevenueData = [];
      } finally {
        this.loading.clientRevenueData = false;
      }
    },
    
    // Geography distribution
    async fetchDispatchesByState(params = {}) {
      this.loading.stateData = true;
      this.errors.stateData = null;
      try {
        const response = await ApiService.get('/dispatch-reports/stats/states', {
          ...this.filterParams,
          ...params
        });
        this.stateData = response.data || [];
      } catch (error) {
        console.error('Error fetching dispatches by state', error);
        this.errors.stateData = 'Failed to load state data';
        this.stateData = [];
      } finally {
        this.loading.stateData = false;
      }
    },
    
    // Detailed dispatches for table
    async fetchDetailedDispatches(params = {}) {
      this.loading.detailedData = true;
      this.errors.detailedData = null;
      try {
        const response = await ApiService.get('/dispatch-reports/dispatches', {
          ...this.filterParams,
          ...params
        });
        this.detailedData = response.data || [];
        
        // Extract technician data from dispatches
        if (this.detailedData && this.detailedData.length) {
          const technicians = new Set();
          this.detailedData.forEach(dispatch => {
            if (dispatch.technician_name) {
              technicians.add(dispatch.technician_name);
            }
          });
          this.technicianData = Array.from(technicians).map(name => ({ name }));
        } else {
          this.technicianData = [];
        }
      } catch (error) {
        console.error('Error fetching detailed dispatches', error);
        this.errors.detailedData = 'Failed to load dispatch data';
        this.detailedData = [];
        this.technicianData = [];
      } finally {
        this.loading.detailedData = false;
      }
    },

    async fetchTechnicians(params = {}) {
      // This function is now a placeholder as we extract technicians from dispatch data
      this.loading.technicianData = true;
      this.errors.technicianData = null;
      
      // If we already have detailed data, extract technicians
      if (this.detailedData && this.detailedData.length) {
        const technicians = new Set();
        this.detailedData.forEach(dispatch => {
          if (dispatch.technician_name) {
            technicians.add(dispatch.technician_name);
          }
        });
        this.technicianData = Array.from(technicians).map(name => ({ name }));
        this.loading.technicianData = false;
        return;
      }
      
      // Otherwise, fetch detailed dispatches if not already loading
      if (!this.loading.detailedData) {
        try {
          await this.fetchDetailedDispatches(params);
        } catch (error) {
          console.error('Error fetching technicians', error);
          this.errors.technicianData = 'Failed to load technician data';
          this.technicianData = [];
        } finally {
          this.loading.technicianData = false;
        }
      } else {
        // If detailed data is currently loading, wait for it
        const checkInterval = setInterval(() => {
          if (!this.loading.detailedData) {
            clearInterval(checkInterval);
            
            if (this.detailedData && this.detailedData.length) {
              const technicians = new Set();
              this.detailedData.forEach(dispatch => {
                if (dispatch.technician_name) {
                  technicians.add(dispatch.technician_name);
                }
              });
              this.technicianData = Array.from(technicians).map(name => ({ name }));
            } else {
              this.technicianData = [];
            }
            
            this.loading.technicianData = false;
          }
        }, 300);
        
        // Ensure the interval doesn't run forever
        setTimeout(() => {
          clearInterval(checkInterval);
          if (this.loading.technicianData) {
            this.loading.technicianData = false;
            this.errors.technicianData = 'Timeout while waiting for dispatch data';
            this.technicianData = [];
          }
        }, 10000);
      }
    }
  }
}); 