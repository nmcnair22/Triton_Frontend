import { defineStore } from 'pinia';
import ApiService from '@/service/ApiService';

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
      financialCategories: false,
      volumeStats: false
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
      financialCategories: null,
      volumeStats: null
    },
    
    // New state variables
    clientData: [],
    projectData: [],
    revenueData: [],
    clientRevenueData: [],
    stateData: [],
    detailedData: [],
    technicianData: [],
    financialCategories: [],
    keyMetrics: {}
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
    },
    
    // Convert current date range to query parameters
    filterParams: (state) => {
      const params = {
        date_from: state.dateRange.start,
        date_to: state.dateRange.end
      };
      
      if (state.selectedCustomerId) {
        params.customer_id = state.selectedCustomerId;
      }
      
      if (state.selectedProjectName) {
        params.project_name = state.selectedProjectName;
      }
      
      if (state.selectedStatus) {
        params.status = state.selectedStatus;
      }
      
      return params;
    },
    
    // Project data accessor for charts (renamed to avoid conflict)
    projectDataForChart: (state) => {
      return state.projectData || [];
    }
  },
  
  actions: {
    // Helper method to get filter parameters with validation
    getFilterParams() {
      console.log('Getting filterParams with dateRange:', this.dateRange);
      
      // Validate date range - set default if invalid
      if (!this.dateRange || !this.dateRange.start || !this.dateRange.end) {
        console.warn('Invalid date range detected in filterParams. Using defaults.');
        const today = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        
        this.dateRange = {
          start: oneWeekAgo.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };
        
        console.log('Using default date range:', this.dateRange);
      }
      
      // Use the getter to get the base params
      const params = { ...this.filterParams };
      
      console.log('Returning filterParams:', params);
      return params;
    },
    
    // Update date range and optionally refresh data
    setDateRange(start, end, refresh = true) {
      console.log('Setting date range:', { start, end });
      
      // Ensure we're using string dates in YYYY-MM-DD format
      this.dateRange = {
        start: typeof start === 'string' ? start : (start instanceof Date ? start.toISOString().split('T')[0] : this.dateRange.start),
        end: typeof end === 'string' ? end : (end instanceof Date ? end.toISOString().split('T')[0] : this.dateRange.end)
      };
      
      console.log('Date range set to:', this.dateRange);
      
      if (refresh) {
        this.fetchAllDashboardData();
      }
    },
    
    // Set filter values
    setFilters(customerId = null, projectName = null, status = null, refresh = true) {
      console.log('Setting filters:', { customerId, projectName, status });
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
      console.log('fetchAllDashboardData - Date range:', this.dateRange);
      try {
        // First attempt to get comprehensive stats data
        await this.fetchVolumeStats();
        
        // Fetch data that's not part of the volume stats
        await Promise.all([
          this.fetchRevenueOverTime(),
          this.fetchTopClientsByRevenue(),
          this.fetchDetailedDispatches(),
          this.fetchFinancialCategories(),
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    },
    
    // Volume stats comprehensive endpoint
    async fetchVolumeStats() {
      this.loading.volumeStats = true;
      this.errors.volumeStats = null;
      
      const params = this.getFilterParams();
      
      // Clean up null/undefined values
      Object.keys(params).forEach(key => 
        (params[key] === null || params[key] === undefined) && delete params[key]
      );
      
      console.log('fetchVolumeStats - Request params:', params);
      
      try {
        const response = await ApiService.get('/dispatch-reports/stats/volume', params);
        console.log('fetchVolumeStats - Response:', response.data);
        
        if (response.data?.success) {
          const stats = response.data.data;
          
          // Update metrics directly from the stats
          this.totalDispatches = stats.total_dispatches;
          console.log('Total dispatches set to:', this.totalDispatches);
          
          // Calculate completion rate from turnup statuses
          if (stats.by_turnup_status && stats.by_turnup_status.length > 0) {
            console.log('Turnup statuses found:', stats.by_turnup_status);
            const completedStatus = stats.by_turnup_status.find(
              status => status.turnup_status === 'Completed'
            );
            const failedStatus = stats.by_turnup_status.find(
              status => status.turnup_status === 'Failed'
            );
            const incompleteStatus = stats.by_turnup_status.find(
              status => status.turnup_status === 'Incomplete'
            );
            
            const completedCount = completedStatus ? completedStatus.dispatch_count : 0;
            const failedCount = failedStatus ? failedStatus.dispatch_count : 0;
            const incompleteCount = incompleteStatus ? incompleteStatus.dispatch_count : 0;
            
            const total = completedCount + failedCount + incompleteCount;
            if (total > 0) {
              this.completionRate = (completedCount / total) * 100;
              console.log('Completion rate calculated:', this.completionRate);
            } else {
              this.completionRate = 0;
              console.log('No completed/failed/incomplete dispatches for completion rate calculation');
            }
          } else {
            console.log('No turnup status data found');
          }
          
          // Update store with all the data sections
          this.clientData = stats.by_client || [];
          console.log('Clients data loaded:', this.clientData.length);
          
          this.projectData = stats.by_project || [];
          console.log('Projects data loaded:', this.projectData.length);
          
          this.dispatchVolume = stats.daily_volume || [];
          console.log('Dispatch volume data loaded:', this.dispatchVolume.length);
          
          this.resultCodes = stats.by_turnup_status?.map(item => ({
            status: item.turnup_status,
            count: item.dispatch_count
          })) || [];
          console.log('Result codes data loaded:', this.resultCodes.length);
          
          // We need to make sure we have revenue and margin data
          // This will be populated later from fetchRevenueOverTime if not available here
          if (!this.totalRevenue || !this.averageMargin) {
            console.log('Revenue and margin data not available from volume stats, will be fetched separately');
          }
          
          // Update key metrics to reflect these values
          this.keyMetrics = {
            totalDispatches: this.totalDispatches,
            totalRevenue: this.totalRevenue,
            averageMargin: this.averageMargin,
            completionRate: this.completionRate,
            dispatchesChange: this.dispatchChange,
            revenueChange: this.revenueChange,
            marginChange: this.marginChange,
            completionRateChange: this.completionRateChange
          };
        } else {
          console.error('fetchVolumeStats - API returned error:', response.data?.error);
          throw new Error(response.data?.error || 'Failed to fetch volume stats');
        }
      } catch (error) {
        console.error('Error fetching volume stats:', error);
        this.errors.volumeStats = 'Failed to load volume statistics';
      } finally {
        this.loading.volumeStats = false;
      }
    },
    
    // Key Metrics section - fetches all four main metrics
    async fetchKeyMetrics() {
      // If metrics are already loaded from volume stats, skip
      if (this.totalDispatches > 0 && this.completionRate > 0) {
        return;
      }
      
      this.loading.keyMetrics = true;
      this.errors.keyMetrics = null;
      
      try {
        const response = await ApiService.get('/dispatch-reports/stats/dispatches', 
          this.getFilterParams()
        );
        
        // Process metrics as before
        // ... existing code ...
      } catch (error) {
        console.error('Error fetching key metrics:', error);
        this.errors.keyMetrics = 'Failed to load key metrics';
      } finally {
        this.loading.keyMetrics = false;
      }
    },
    
    // Dispatch Volume Chart
    async fetchDispatchVolume() {
      // Skip if already loaded from volume stats
      if (this.dispatchVolume.length > 0) {
        return;
      }
      
      this.loading.dispatchVolume = true;
      this.errors.dispatchVolume = null;
      
      try {
        const response = await ApiService.get('/dispatch-reports/dispatches', {
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
      // Skip if already loaded from volume stats
      if (this.resultCodes.length > 0) {
        return;
      }
      
      this.loading.resultCodes = true;
      this.errors.resultCodes = null;
      
      try {
        const response = await ApiService.get('/dispatch-reports/stats/dispatches', {
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
        this.errors.resultCodes = 'Failed to load status distribution data';
        this.resultCodes = [];
      } finally {
        this.loading.resultCodes = false;
      }
    },
    
    // Top Clients Chart
    async fetchDispatchesByClient(params = {}) {
      // Skip if already loaded from volume stats
      if (this.clientData.length > 0) {
        return;
      }
      
      this.loading.clientData = true;
      this.errors.clientData = null;
      try {
        const response = await ApiService.get('/dispatch-reports/customers', {
          ...this.getFilterParams(),
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
      // Skip if already loaded from volume stats
      if (this.projectData.length > 0) {
        return;
      }
      
      this.loading.projectData = true;
      this.errors.projectData = null;
      try {
        const response = await ApiService.get('/dispatch-reports/stats/projects', {
          ...this.getFilterParams(),
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
      
      const requestParams = {
        ...this.getFilterParams(),
        ...params
      };
      
      console.log('fetchRevenueOverTime - Request params:', requestParams);
      
      try {
        const response = await ApiService.get('/dispatch-reports/accounting/margins', requestParams);
        console.log('fetchRevenueOverTime - Response:', response.data);
        
        // Check for totals in the API response
        if (response.data?.data?.data?.totals) {
          const totals = response.data.data.data.totals;
          console.log('Found totals in API response:', totals);
          
          // Update total revenue and average margin from totals
          this.totalRevenue = totals.total_revenue || 0;
          this.averageMargin = totals.margin_percentage || 0;
          
          console.log('Updated totalRevenue and averageMargin from totals:', {
            totalRevenue: this.totalRevenue,
            averageMargin: this.averageMargin
          });
          
          // Since we don't have daily data in this format, we need to fetch it separately
          // or provide a placeholder for the chart
          this.revenueData = { 
            labels: ['Current Period'], 
            revenue: [totals.total_revenue || 0], 
            cost: [totals.total_cost || 0], 
            margin: [totals.margin_percentage || 0] 
          };
        } else if (response.data) {
          // Fallback to old processing method if the new format isn't found
          console.log('No totals found, falling back to old processing method');
          const processedData = this.processRevenueData(response.data);
          this.revenueData = processedData;
          
          // Update averageMargin if we have revenue data
          if (processedData.revenue.length > 0 && processedData.margin.length > 0) {
            const totalRevenue = processedData.revenue.reduce((sum, val) => sum + val, 0);
            const totalCost = processedData.cost.reduce((sum, val) => sum + val, 0);
            
            // Calculate overall average margin
            if (totalRevenue > 0) {
              this.totalRevenue = totalRevenue;
              this.averageMargin = ((totalRevenue - totalCost) / totalRevenue) * 100;
              console.log('Updated totalRevenue and averageMargin from processed data:', {
                totalRevenue: this.totalRevenue,
                averageMargin: this.averageMargin
              });
            }
          }
        } else {
          console.log('No revenue data received');
          this.revenueData = { labels: [], revenue: [], cost: [], margin: [] };
        }
      } catch (error) {
        console.error('Error fetching revenue over time', error);
        this.errors.revenueData = 'Failed to load revenue data';
        this.revenueData = { labels: [], revenue: [], cost: [], margin: [] };
      } finally {
        this.loading.revenueData = false;
      }
    },
    
    // Helper to process revenue data into chart format
    processRevenueData(data) {
      console.log('Processing revenue data:', data);
      
      // Default empty structure
      const result = {
        labels: [],
        revenue: [],
        cost: [],
        margin: []
      };
      
      try {
        // Check if we have the expected data structure
        let margins = [];
        
        // Handle different possible response structures
        if (data?.data?.data?.margins) {
          console.log('Found margins data at data.data.data.margins');
          margins = data.data.data.margins;
        } else if (data?.data?.margins) {
          console.log('Found margins data at data.data.margins');
          margins = data.data.margins;
        } else if (Array.isArray(data?.data)) {
          console.log('Found margins data as array at data.data');
          margins = data.data;
        } else if (Array.isArray(data)) {
          console.log('Found margins data as direct array');
          margins = data;
        } else {
          console.log('No margins data found in expected locations');
          return result;
        }
        
        console.log('Processing', margins.length, 'margin records');
        
        // Group by date
        const dateGroups = {};
        margins.forEach(item => {
          const rawDate = item.service_date || item.date;
          if (!rawDate) {
            console.log('Item missing date:', item);
            return;
          }
          
          // Format date for display
          const date = new Date(rawDate);
          const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          
          if (!dateGroups[formattedDate]) {
            dateGroups[formattedDate] = {
              revenue: 0,
              cost: 0,
              count: 0,
              // Store the raw date for sorting
              rawDate: date
            };
          }
          
          // Extract values with fallbacks for different API response formats
          const revenue = parseFloat(item.total_charged || item.revenue || item.total_revenue || 0);
          const cost = parseFloat(item.total_cost || item.cost || item.total_cost || 0);
          
          dateGroups[formattedDate].revenue += revenue;
          dateGroups[formattedDate].cost += cost;
          dateGroups[formattedDate].count++;
          
          // Debug individual records
          if (revenue > 0) {
            console.log(`Added revenue: ${revenue} for date ${formattedDate}`);
          }
        });
        
        // Sort dates chronologically
        const sortedDates = Object.keys(dateGroups).sort((a, b) => {
          return dateGroups[a].rawDate - dateGroups[b].rawDate;
        });
        
        console.log('Sorted dates:', sortedDates);
        
        // Populate result
        result.labels = sortedDates;
        
        sortedDates.forEach(date => {
          const group = dateGroups[date];
          result.revenue.push(Math.round(group.revenue * 100) / 100);
          result.cost.push(Math.round(group.cost * 100) / 100);
          
          // Calculate margin percentage
          const marginPercent = group.revenue > 0 ? ((group.revenue - group.cost) / group.revenue) * 100 : 0;
          result.margin.push(Math.round(marginPercent * 10) / 10); // Round to 1 decimal place
        });
        
        // Data validation
        if (result.revenue.some(val => val > 0)) {
          console.log('Revenue data successfully processed with values');
        } else {
          console.warn('Revenue data processed but all values are zero');
        }
        
        return result;
      } catch (error) {
        console.error('Error processing revenue data:', error);
        return result;
      }
    },
    
    // Top Clients by Revenue
    async fetchTopClientsByRevenue(params = {}) {
      this.loading.clientRevenueData = true;
      this.errors.clientRevenueData = null;
      
      const requestParams = {
        ...this.getFilterParams(),
        ...params
      };
      
      console.log('fetchTopClientsByRevenue - Request params:', requestParams);
      
      try {
        // First try to use detailed dispatches if available
        if (this.detailedData && this.detailedData.length > 0) {
          console.log('Using detailed dispatches for client revenue data');
          
          // Group by client and sum up revenue
          const clientRevenueMap = {};
          
          this.detailedData.forEach(item => {
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
            
            const revenue = parseFloat(item.total_charged || 0);
            const cost = parseFloat(item.total_cost || 0);
            const profit = revenue - cost;
            
            clientRevenueMap[clientName].total_revenue += revenue;
            clientRevenueMap[clientName].profit += profit;
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
          console.log('Client revenue data processed from detailed data:', this.clientRevenueData.length, 'clients');
          
        } else {
          // Fallback to fetching specific data
          console.log('Fetching specific client revenue data');
          
          // Try to fetch detailed dispatches to process client revenue
          await this.fetchDetailedDispatches({
            limit: 100, // Reasonable limit to get enough data
            ...requestParams
          });
          
          if (this.detailedData && this.detailedData.length > 0) {
            // Process again with the newly fetched data
            await this.fetchTopClientsByRevenue(params);
            return;
          } else {
            console.log('No client revenue data available');
            this.clientRevenueData = [];
          }
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
      
      const requestParams = {
        ...this.getFilterParams(),
        limit: 100, // Use reasonable limit
        ...params
      };
      
      console.log('fetchDispatchesByState - Request params:', requestParams);
      
      try {
        // Use the general dispatches endpoint instead of a dedicated states endpoint
        const response = await ApiService.get('/dispatch-reports/dispatches', requestParams);
        console.log('fetchDispatchesByState - Response:', response.data);
        
        // Process data to aggregate by state
        if (response.data?.data) {
          const dispatches = Array.isArray(response.data.data) ? response.data.data : [];
          console.log('Processing', dispatches.length, 'dispatches for state data');
          
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
          
          console.log('Processed state data:', this.stateData.length, 'states found');
        } else {
          console.log('No dispatch data found for state processing');
          this.stateData = [];
        }
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
      
      const requestParams = {
        ...this.getFilterParams(),
        ...params
      };
      
      console.log('fetchDetailedDispatches - Request params:', requestParams);
      
      try {
        const response = await ApiService.get('/dispatch-reports/dispatches', requestParams);
        console.log('fetchDetailedDispatches - Response:', response);
        
        if (response.data?.data) {
          this.detailedData = response.data.data;
          console.log('Detailed dispatches loaded:', this.detailedData.length);
          
          // Extract technician data from dispatches
          if (this.detailedData && this.detailedData.length) {
            const technicians = new Set();
            this.detailedData.forEach(dispatch => {
              if (dispatch.technician_name) {
                technicians.add(dispatch.technician_name);
              }
            });
            this.technicianData = Array.from(technicians).map(name => ({ name }));
            console.log('Extracted technician data:', this.technicianData.length, 'technicians');
          } else {
            console.log('No detailed data for technician extraction');
            this.technicianData = [];
          }
        } else {
          console.log('No detailed dispatch data found in response');
          this.detailedData = [];
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
        const dispatchResponse = await ApiService.get('/dispatch-reports/stats/dispatches', {
          date_from: previousStart.toISOString().split('T')[0],
          date_to: previousEnd.toISOString().split('T')[0],
          customer_id: this.selectedCustomerId,
          project_name: this.selectedProjectName
        });
        
        this.previousPeriodMetrics.totalDispatches = dispatchResponse.data?.total || 0;
        
        // 2. Revenue and Margin for previous period
        try {
          const marginsResponse = await ApiService.get('/dispatch-reports/accounting/margins', {
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
        const statsResponse = await ApiService.get('/dispatch-reports/stats/dispatches', { 
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
        const response = await ApiService.get('/dispatch-reports/accounting/margins', {
          date_from: this.dateRange.start,
          date_to: this.dateRange.end,
          group_by: 'category'
        });
        
        console.log('Financial categories response:', response);
        
        if (response.data?.data?.data?.categories) {
          // New API response format
          this.financialCategories = response.data.data.data.categories.filter(cat => cat.category !== null);
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
    },

    // New methods for dispatch document handling
    async getDispatchDocuments(dispatchId) {
      try {
        const response = await ApiService.get(`/dispatch-reports/dispatches/${dispatchId}/documents`);
        return response.data;
      } catch (error) {
        console.error(`Error fetching documents for dispatch ${dispatchId}:`, error);
        throw error;
      }
    },
    
    async deleteDocument(jobId) {
      try {
        const response = await ApiService.delete(`/dispatch-reports/documents/${jobId}`);
        return response.data;
      } catch (error) {
        console.error(`Error deleting document ${jobId}:`, error);
        throw error;
      }
    },
    
    async getDispatchMargin(dispatchId) {
      try {
        const response = await ApiService.get(`/dispatch-reports/dispatches/${dispatchId}/margin`);
        return response.data;
      } catch (error) {
        console.error(`Error fetching margin for dispatch ${dispatchId}:`, error);
        throw error;
      }
    },

    // Method to get a specific dispatch by ID
    async getDispatchById(dispatchId) {
      try {
        // First check if we already have this dispatch in the detailed data
        const existingDispatch = this.detailedData.find(d => d.id == dispatchId);
        if (existingDispatch) {
          return existingDispatch;
        }
        
        // If not found in store, fetch it from API
        const response = await ApiService.get(`/dispatch-reports/dispatches/${dispatchId}`);
        if (response.data?.data) {
          return response.data.data;
        }
        
        return null;
      } catch (error) {
        console.error(`Error fetching dispatch ${dispatchId}:`, error);
        throw error;
      }
    }
  }
}); 