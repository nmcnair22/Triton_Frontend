import { defineStore } from 'pinia';
import { ApiService, DispatchService } from '@/service/ApiService';

export const useDispatchStore = defineStore('dispatch', {
  state: () => ({
    // Key Metrics
    totalDispatches: null,
    totalRevenue: null,
    averageMargin: null,
    completionRate: null,
    
    // Previous period metrics for comparison
    previousPeriodMetrics: {
      totalDispatches: null,
      totalRevenue: null,
      averageMargin: null,
      completionRate: null
    },
    
    // Error states for each metric
    metricErrors: {
      totalDispatches: false,
      totalRevenue: false,
      averageMargin: false,
      completionRate: false
    },
    metricErrorMessages: {
      totalDispatches: '',
      totalRevenue: '',
      averageMargin: '',
      completionRate: ''
    },
    
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
      technicianData: false,
      financialCategories: false
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
      technicianData: null,
      financialCategories: null
    },
    
    // New state variables
    clientData: [],
    projectData: [],
    revenueData: [],
    clientRevenueData: [],
    stateData: [],
    detailedData: [],
    technicianData: [],
    financialCategories: []
  }),
  
  getters: {
    dateRangeText: (state) => {
      const start = new Date(state.dateRange.start);
      const end = new Date(state.dateRange.end);
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    },
    
    // Calculate percentage changes in metrics compared to previous period
    dispatchCountChange: (state) => {
      if (!state.previousPeriodMetrics.totalDispatches) return undefined; // Return undefined if no previous data
      
      if (state.previousPeriodMetrics.totalDispatches === 0) return 100; // Avoid division by zero
      
      const change = ((state.totalDispatches - state.previousPeriodMetrics.totalDispatches) / 
                     state.previousPeriodMetrics.totalDispatches) * 100;
      
      return parseFloat(change.toFixed(2)); // Round to 2 decimal places
    },
    
    revenueChange: (state) => {
      if (!state.previousPeriodMetrics.totalRevenue) return undefined; // Return undefined if no previous data
      
      if (state.previousPeriodMetrics.totalRevenue === 0) return 100; // Avoid division by zero
      
      const change = ((state.totalRevenue - state.previousPeriodMetrics.totalRevenue) / 
                     state.previousPeriodMetrics.totalRevenue) * 100;
      
      return parseFloat(change.toFixed(2));
    },
    
    marginChange: (state) => {
      if (!state.previousPeriodMetrics.averageMargin) return undefined; // Return undefined if no previous data
      
      if (state.previousPeriodMetrics.averageMargin === 0) return 100; // Avoid division by zero
      
      const change = ((state.averageMargin - state.previousPeriodMetrics.averageMargin) / 
                     state.previousPeriodMetrics.averageMargin) * 100;
      
      return parseFloat(change.toFixed(2));
    },
    
    completionRateChange: (state) => {
      if (!state.previousPeriodMetrics.completionRate) return undefined; // Return undefined if no previous data
      
      if (state.previousPeriodMetrics.completionRate === 0) return 100; // Avoid division by zero
      
      const change = ((state.completionRate - state.previousPeriodMetrics.completionRate) / 
                     state.previousPeriodMetrics.completionRate) * 100;
      
      return parseFloat(change.toFixed(2));
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
        this.fetchDispatchesByState(),
        this.fetchPreviousPeriodMetrics(),
        this.fetchFinancialCategories()
      ]);
    },
    
    // Key Metrics section - fetches all four main metrics
    async fetchKeyMetrics() {
      this.loading.keyMetrics = true;
      this.errors.keyMetrics = null;
      
      // Reset error states
      this.metricErrors.totalDispatches = false;
      this.metricErrors.totalRevenue = false;
      this.metricErrors.averageMargin = false;
      this.metricErrors.completionRate = false;
      
      // 1. Total Dispatches - Use stats/dispatches endpoint instead of getKeyMetrics
      try {
        const dispatchResponse = await DispatchService.getDispatchStats({
          date_from: this.dateRange.start,
          date_to: this.dateRange.end,
          customer_id: this.selectedCustomerId,
          project_name: this.selectedProjectName
        });
        
        // The total comes from the response's "total" field, not the count of returned records
        if (dispatchResponse.data?.total !== undefined) {
          this.totalDispatches = dispatchResponse.data.total;
        } else {
          console.error('No total field found in dispatch stats response');
          this.metricErrors.totalDispatches = true;
          this.metricErrorMessages.totalDispatches = 'No data available';
          this.totalDispatches = null;
        }
      } catch (error) {
        console.error('Error fetching dispatch stats:', error);
        this.metricErrors.totalDispatches = true;
        this.metricErrorMessages.totalDispatches = error.message || 'API error';
        this.totalDispatches = null;
      }
      
      // 2. Revenue and Margin - using accounting margins API
      try {
        const marginsResponse = await DispatchService.getMargins({
          date_from: this.dateRange.start,
          date_to: this.dateRange.end
        });
        
        console.log('Margins API response:', marginsResponse);
        
        // New response format from backend:
        // {
        //   "success": true,
        //   "data": {
        //     "success": true,
        //     "data": {
        //       "totals": {
        //         "total_revenue": 1447512.6,
        //         "total_cost": 675954.21,
        //         "total_profit": 771558.39,
        //         "margin_percentage": 53.302361
        //       }
        //     }
        //   }
        // }
        
        if (marginsResponse.data?.data?.data?.totals) {
          const totals = marginsResponse.data.data.data.totals;
          console.log('Found totals at data.data.data.totals:', totals);
          
          // Use the new field names
          this.totalRevenue = totals.total_revenue || 0;
          this.averageMargin = totals.margin_percentage || 0;
          
          console.log('Successfully set revenue to:', this.totalRevenue);
          console.log('Successfully set margin to:', this.averageMargin);
          
          this.metricErrors.totalRevenue = false;
          this.metricErrors.averageMargin = false;
        } else {
          console.log('No totals data found in the new response format');
          this.metricErrors.totalRevenue = true;
          this.metricErrors.averageMargin = true;
          this.metricErrorMessages.totalRevenue = 'No revenue data found';
          this.metricErrorMessages.averageMargin = 'No margin data found';
          this.totalRevenue = null;
          this.averageMargin = null;
        }
      } catch (marginError) {
        console.error('Error fetching margin data:', marginError);
        this.metricErrors.totalRevenue = true;
        this.metricErrors.averageMargin = true;
        this.metricErrorMessages.totalRevenue = marginError.message || 'API error';
        this.metricErrorMessages.averageMargin = marginError.message || 'API error';
        this.totalRevenue = null;
        this.averageMargin = null;
      }
      
      // 3. Completion Rate
      try {
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
          
          if (statsResponse.data.total > 0) {
            this.completionRate = (completedCount / statsResponse.data.total) * 100;
          } else {
            this.metricErrors.completionRate = true;
            this.metricErrorMessages.completionRate = 'No dispatches found';
            this.completionRate = null;
          }
        } else {
          console.log('No completion rate data found');
          this.metricErrors.completionRate = true;
          this.metricErrorMessages.completionRate = 'No status data available';
          this.completionRate = null;
        }
      } catch (error) {
        console.error('Error fetching completion rate:', error);
        this.metricErrors.completionRate = true;
        this.metricErrorMessages.completionRate = error.message || 'API error';
        this.completionRate = null;
      }
      
      this.loading.keyMetrics = false;
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
          limit: 100
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
        const response = await ApiService.get('/dispatch-reports/customers', {
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
        const response = await ApiService.get('/dispatch-reports/stats/projects', {
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
          date_from: this.dateRange.start,
          date_to: this.dateRange.end,
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
        // Using the margins endpoint instead of client-revenue which doesn't exist
        const response = await ApiService.get('/dispatch-reports/accounting/margins', {
          date_from: this.dateRange.start,
          date_to: this.dateRange.end,
          ...this.filterParams,
          ...params
        });
        
        // Transform the data to get clients by revenue
        if (response.data?.data?.margins) {
          // Group by client and sum up revenue
          const clientRevenueMap = {};
          
          response.data.data.margins.forEach(item => {
            const clientName = item.customer_name || 'Unknown';
            if (!clientRevenueMap[clientName]) {
              clientRevenueMap[clientName] = {
                name: clientName,
                total_revenue: 0,
                profit: 0,
                margin_percent: 0,
                dispatch_count: 0
              };
            }
            
            clientRevenueMap[clientName].total_revenue += parseFloat(item.total_charged || 0);
            clientRevenueMap[clientName].profit += parseFloat(item.total_profit || 0);
            clientRevenueMap[clientName].dispatch_count += 1;
          });
          
          // Calculate margin percentages and convert to array
          const clientsArray = Object.values(clientRevenueMap).map(client => {
            client.margin_percent = client.total_revenue > 0 
              ? Math.round((client.profit / client.total_revenue) * 100) 
              : 0;
            return client;
          });
          
          // Sort by revenue (highest first)
          this.clientRevenueData = clientsArray.sort((a, b) => b.total_revenue - a.total_revenue);
        } else {
          this.clientRevenueData = [];
        }
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
        // Use the general dispatches endpoint instead of a dedicated states endpoint
        const response = await ApiService.get('/dispatch-reports/dispatches', {
          date_from: this.dateRange.start,
          date_to: this.dateRange.end,
          limit: 100, // Use reasonable limit
          ...this.filterParams,
          ...params
        });
        
        // Process data to aggregate by state
        if (response.data?.data) {
          const dispatches = Array.isArray(response.data.data) ? response.data.data : [];
          const byState = {};
          
          // Group dispatches by state
          dispatches.forEach(dispatch => {
            const state = (dispatch.state || 'Unknown').toUpperCase();
            if (!byState[state]) {
              byState[state] = {
                state: state,
                count: 0,
                revenue: 0
              };
            }
            byState[state].count++;
            byState[state].revenue += parseFloat(dispatch.total_charged || 0);
          });
          
          // Convert to array for display
          const statesArray = Object.values(byState);
          
          // Sort by count (highest first)
          this.stateData = statesArray.sort((a, b) => b.count - a.count);
          
          console.log('Processed state data:', this.stateData);
        } else {
          this.stateData = [];
        }
      } catch (error) {
        console.error('Error fetching dispatches by state', error);
        this.errors.stateData = 'Failed to load state data';
        this.stateData = [];
        
        // Provide some mock data for testing the UI
        this.stateData = [
          { state: 'CA', count: 45, revenue: 67500 },
          { state: 'TX', count: 32, revenue: 48000 },
          { state: 'FL', count: 28, revenue: 42000 },
          { state: 'NY', count: 21, revenue: 31500 },
          { state: 'IL', count: 18, revenue: 27000 }
        ];
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
    },
    
    // Fetch metrics for the previous period (for comparison)
    async fetchPreviousPeriodMetrics() {
      // Calculate the previous period date range (same length as current period)
      const currentStart = new Date(this.dateRange.start);
      const currentEnd = new Date(this.dateRange.end);
      const dayDiff = Math.ceil((currentEnd - currentStart) / (1000 * 60 * 60 * 24));
      
      const previousEnd = new Date(currentStart);
      previousEnd.setDate(previousEnd.getDate() - 1); // Day before current start
      
      const previousStart = new Date(previousEnd);
      previousStart.setDate(previousStart.getDate() - dayDiff); // Same number of days as current period
      
      try {
        // 1. Total Dispatches for previous period - Use stats endpoint
        const dispatchResponse = await DispatchService.getDispatchStats({
          date_from: previousStart.toISOString().split('T')[0],
          date_to: previousEnd.toISOString().split('T')[0],
          customer_id: this.selectedCustomerId,
          project_name: this.selectedProjectName
        });
        
        this.previousPeriodMetrics.totalDispatches = dispatchResponse.data?.total || 0;
        
        // 2. Revenue and Margin for previous period
        try {
          const marginsResponse = await DispatchService.getMargins({
            date_from: previousStart.toISOString().split('T')[0],
            date_to: previousEnd.toISOString().split('T')[0]
          });
          
          console.log('Previous period margins response:', marginsResponse);
          
          // New response format from backend for previous period
          if (marginsResponse.data?.data?.data?.totals) {
            const totals = marginsResponse.data.data.data.totals;
            console.log('Found previous period totals:', totals);
            
            // Use the new field names
            this.previousPeriodMetrics.totalRevenue = totals.total_revenue || 0;
            this.previousPeriodMetrics.averageMargin = totals.margin_percentage || 0;
            
            console.log('Successfully set previous period revenue to:', this.previousPeriodMetrics.totalRevenue);
          } else {
            console.log('No previous period totals found in the new response format');
            this.previousPeriodMetrics.totalRevenue = null;
            this.previousPeriodMetrics.averageMargin = null;
          }
        } catch (error) {
          console.error('Error fetching previous period margins:', error);
          this.previousPeriodMetrics.totalRevenue = null;
          this.previousPeriodMetrics.averageMargin = null;
        }
        
        // 3. Completion Rate for previous period
        const statsResponse = await DispatchService.getDispatchStats({ 
          date_from: previousStart.toISOString().split('T')[0],
          date_to: previousEnd.toISOString().split('T')[0],
          customer_id: this.selectedCustomerId,
          project_name: this.selectedProjectName
        });
        
        if (statsResponse.data?.data && statsResponse.data?.total) {
          const completedCount = statsResponse.data.data.find(
            item => item.status.toLowerCase() === 'completed'
          )?.count || 0;
          
          this.previousPeriodMetrics.completionRate = statsResponse.data.total 
            ? (completedCount / statsResponse.data.total) * 100 
            : 0;
        }
      } catch (error) {
        console.error('Error fetching previous period metrics:', error);
        // Keep default values on error
      }
    },

    // Add a new method to fetch financial categories data
    async fetchFinancialCategories() {
      this.loading.financialCategories = true;
      this.errors.financialCategories = null;
      
      try {
        const response = await DispatchService.getMargins({
          date_from: this.dateRange.start,
          date_to: this.dateRange.end,
          group_by: 'category'
        });
        
        console.log('Financial categories response:', response);
        
        if (response.data?.data?.data?.categories) {
          this.financialCategories = response.data.data.data.categories;
          console.log('Successfully loaded financial categories:', this.financialCategories.length);
        } else {
          console.log('No categories data found in the response');
          this.errors.financialCategories = 'No categories data available';
          this.financialCategories = [];
        }
      } catch (error) {
        console.error('Error fetching financial categories:', error);
        this.errors.financialCategories = error.message || 'Failed to load categories data';
        this.financialCategories = [];
      } finally {
        this.loading.financialCategories = false;
      }
    }
  }
}); 