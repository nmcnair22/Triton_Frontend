import { defineStore } from 'pinia';
import { DispatchService } from '@/service/DispatchService';
import { formatISO } from 'date-fns';
import { format } from 'date-fns';
import { ApiService } from '@/service/ApiService';

export const useDispatchStore = defineStore('dispatch', {
  state: () => ({
    // Loading states
    loading: false,
    error: null,
    
    // Date range filter
    dateRange: {
      startDate: null,
      endDate: null
    },
    
    // Dashboard data sections
    header: null,
    overview: null,
    revenue: null,
    details: {
      dispatches: [],
      pagination: {
        currentPage: 1,
        perPage: 25,
        total: 0,
        totalPages: 0
      }
    },
    
    // Cache for performance
    lastFetchTimestamp: null,
    
    // Client metrics data
    clientMetrics: [],
    
    // Dispatch data rows for Jobs table
    dispatchRows: [],
    
    // Dashboard data
    dashboardSummary: null,
    dashboardTrends: null,
    
    // Projects data
    projects: [],
    selectedProjects: [],
    currentProject: null,
    
    // Customer data
    customers: [],
    selectedCustomers: [],
    
    // Jobs data
    jobs: [],
    selectedJobs: [],
    currentJob: null,
    
    // Visits data
    visits: [],
    currentVisit: null,
    
    // Alerts
    alerts: [],
    
    // Filters
    filters: {
      status: [],
      priority: [],
      customer: [],
      project: [],
      job: [],
      date: {
        start: null,
        end: null
      },
      search: ''
    },
    
    // Pagination
    pagination: {
      page: 1,
      limit: 10,
      total: 0
    },
    
    // Enhanced dashboard data
    dashboardEnhanced: null
  }),
  
  getters: {
    // KPI metrics and their changes
    totalDispatches: state => {
      return state.header?.total_dispatches?.current || 0;
    },
    previousPeriodDispatches: state => state.header?.total_dispatches?.previous || 0,
    
    totalRevenue: state => state.header?.total_revenue?.current || 0,
    previousPeriodRevenue: state => state.header?.total_revenue?.previous || 0,
    
    averageMargin: state => state.header?.average_margin?.current || 0,
    previousPeriodMargin: state => state.header?.average_margin?.previous || 0,
    
    completionRate: state => state.header?.completion_rate?.current || 0,
    previousPeriodCompletionRate: state => state.header?.completion_rate?.previous || 0,
    
    // Growth/change percentages
    dispatchCountChange: state => state.header?.total_dispatches?.growth || 0,
    revenueChange: state => state.header?.total_revenue?.growth || 0,
    marginChange: state => state.header?.average_margin?.growth || 0,
    completionRateChange: state => state.header?.completion_rate?.growth || 0,
    
    // Overview metrics
    volumeOverTime: state => {
      return state.overview?.daily_volume || [];
    },
    statusDistribution: state => {
      return state.overview?.status_breakdown || [];
    },
    clientDispatches: state => {
      return state.overview?.top_clients || [];
    },
    projectDispatches: state => {
      return state.overview?.top_projects || [];
    },
    
    // Revenue metrics
    revenueOverTime: state => {
      return state.revenue?.revenue_timeline || [];
    },
    clientsByRevenue: state => {
      return state.revenue?.top_clients || [];
    },
    revenueCategories: state => state.revenue?.categories || [],
    revenueTotals: state => {
      return state.revenue?.totals || {};
    },
    
    // Additional revenue metrics
    averageRevenuePerDispatch: state => {
      const totalRevenue = state.header?.total_revenue?.current || 0;
      const totalDispatches = state.header?.total_dispatches?.current || 1; // Avoid division by zero
      return totalRevenue / totalDispatches;
    },
    
    highestDailyRevenue: state => {
      const revenueTimeline = state.revenue?.revenue_timeline || [];
      if (!revenueTimeline.length) return 0;
      
      return Math.max(...revenueTimeline.map(day => day.revenue || 0));
    },
    
    lowestDailyRevenue: state => {
      const revenueTimeline = state.revenue?.revenue_timeline || [];
      if (!revenueTimeline.length) return 0;
      
      // Filter out days with zero revenue
      const nonZeroDays = revenueTimeline.filter(day => day.revenue > 0);
      if (!nonZeroDays.length) return 0;
      
      return Math.min(...nonZeroDays.map(day => day.revenue));
    },
    
    // Cached status - determines if we should refetch data
    isDataCached: state => {
      if (!state.lastFetchTimestamp) return false;
      // Consider data stale after 5 minutes
      return (Date.now() - state.lastFetchTimestamp) < 5 * 60 * 1000;
    },
    
    // Helper to check if any section is loading
    isLoading: state => state.loading === true,
    
    // Status helpers
    jobStatusColor: () => (status) => {
      if (!status) return '#9CA3AF'; // gray-400
      
      const statusLower = status.toLowerCase();
      if (statusLower.includes('complete')) return '#22C55E'; // green-500
      if (statusLower.includes('in progress')) return '#3B82F6'; // blue-500
      if (statusLower.includes('schedul')) return '#F59E0B'; // amber-500
      if (statusLower.includes('delay')) return '#EF4444'; // red-500
      if (statusLower.includes('cancel')) return '#6B7280'; // gray-500
      return '#9CA3AF'; // gray-400
    },
    
    visitStatusColor: () => (status) => {
      if (!status) return '#9CA3AF'; // gray-400
      
      const statusLower = status.toLowerCase();
      if (statusLower.includes('complete')) return '#22C55E'; // green-500
      if (statusLower.includes('fail')) return '#EF4444'; // red-500
      if (statusLower.includes('schedul')) return '#3B82F6'; // blue-500
      if (statusLower.includes('cancel')) return '#6B7280'; // gray-500
      return '#9CA3AF'; // gray-400
    },
    
    // Dashboard metrics
    totalJobs: state => state.dashboardSummary?.total_jobs?.current || 0,
    activeJobs: state => state.dashboardSummary?.active_jobs?.current || 0,
    averageVisitsPerJob: state => state.dashboardSummary?.avg_visits_per_job?.current || 0,
    
    // Count of jobs by status
    jobsByStatus: state => state.dashboardTrends?.jobs_by_status || [],
    
    // Job metrics over time
    jobsOverTime: state => state.dashboardTrends?.jobs_timeline || [],
    
    // Current job details
    jobDetails: state => state.currentJob?.job || null,
    jobVisits: state => state.currentJob?.visits || [],
    jobFinancials: state => state.currentJob?.financials || { invoices: [], lineItems: [] },
    jobTimeline: state => state.currentJob?.timeline || { events: [], delays: [] },
    jobAnalysis: state => state.currentJob?.analysis || { 
      key_issues: [], 
      outstanding_items: [], 
      recommended_actions: [] 
    },
    
    // For multi-selection
    hasSelectedProjects: state => state.selectedProjects.length > 0,
    hasSelectedCustomers: state => state.selectedCustomers.length > 0,
    hasSelectedJobs: state => state.selectedJobs.length > 0,
    
    // Helper for pagination
    totalPages: state => Math.ceil(state.pagination.total / state.pagination.limit),
    
    // Helper for filter states
    activeFilters: state => {
      const active = [];
      
      if (state.filters.status.length > 0) active.push('status');
      if (state.filters.priority.length > 0) active.push('priority');
      if (state.filters.customer.length > 0) active.push('customer');
      if (state.filters.project.length > 0) active.push('project');
      if (state.filters.job.length > 0) active.push('job');
      if (state.filters.date.start && state.filters.date.end) active.push('date');
      if (state.filters.search) active.push('search');
      
      return active;
    },
    
    // Get all status options
    statusOptions: () => [
      { label: 'Complete', value: 'complete', icon: 'pi pi-check-circle', color: 'bg-green-500' },
      { label: 'In Progress', value: 'in_progress', icon: 'pi pi-sync', color: 'bg-blue-500' },
      { label: 'Scheduled', value: 'scheduled', icon: 'pi pi-calendar', color: 'bg-amber-500' },
      { label: 'Delayed', value: 'delayed', icon: 'pi pi-clock', color: 'bg-red-500' },
      { label: 'Cancelled', value: 'cancelled', icon: 'pi pi-times-circle', color: 'bg-gray-500' },
      { label: 'Pending', value: 'pending', icon: 'pi pi-hourglass', color: 'bg-purple-500' },
      { label: 'Overdue', value: 'overdue', icon: 'pi pi-exclamation-circle', color: 'bg-red-600' },
      { label: 'Failed', value: 'failed', icon: 'pi pi-times', color: 'bg-red-700' },
      { label: 'Revisit', value: 'revisit', icon: 'pi pi-refresh', color: 'bg-blue-600' }
    ],
    
    // Get all priority options
    priorityOptions: () => [
      { label: 'Critical', value: 'critical', icon: 'pi pi-exclamation-triangle', color: 'bg-red-600' },
      { label: 'High', value: 'high', icon: 'pi pi-arrow-up', color: 'bg-orange-500' },
      { label: 'Medium', value: 'medium', icon: 'pi pi-minus', color: 'bg-amber-500' },
      { label: 'Low', value: 'low', icon: 'pi pi-arrow-down', color: 'bg-green-500' }
    ]
  },
  
  actions: {
    setLoading(section, isLoading) {
      if (section) {
        // For future use if we want to track loading state per section
      }
      this.loading = isLoading;
    },
    
    setError(section, errorMessage) {
      if (section) {
        // For future use if we want to track errors per section
      }
      this.error = errorMessage;
    },
    
    clearErrors() {
      this.error = null;
    },
    
    setDateRange(startDate, endDate) {
      this.dateRange.startDate = startDate;
      this.dateRange.endDate = endDate;
    },
    
    setPagination(page, limit) {
      this.pagination.page = page;
      this.pagination.limit = limit || this.pagination.limit;
    },
    
    // Add multi-selection methods
    selectProject(project) {
      if (!this.selectedProjects.some(p => p.id === project.id)) {
        this.selectedProjects.push(project);
      }
    },
    
    unselectProject(projectId) {
      this.selectedProjects = this.selectedProjects.filter(p => p.id !== projectId);
    },
    
    selectCustomer(customer) {
      if (!this.selectedCustomers.some(c => c.id === customer.id)) {
        this.selectedCustomers.push(customer);
      }
    },
    
    unselectCustomer(customerId) {
      this.selectedCustomers = this.selectedCustomers.filter(c => c.id !== customerId);
    },
    
    selectJob(job) {
      if (!this.selectedJobs.some(j => j.id === job.id)) {
        this.selectedJobs.push(job);
      }
    },
    
    unselectJob(jobId) {
      this.selectedJobs = this.selectedJobs.filter(j => j.id !== jobId);
    },
    
    // Set filter methods
    setStatusFilter(statuses) {
      this.filters.status = Array.isArray(statuses) ? statuses : [statuses];
    },
    
    setPriorityFilter(priorities) {
      this.filters.priority = Array.isArray(priorities) ? priorities : [priorities];
    },
    
    setCustomerFilter(customers) {
      this.filters.customer = Array.isArray(customers) ? customers : [customers];
    },
    
    setProjectFilter(projects) {
      this.filters.project = Array.isArray(projects) ? projects : [projects];
    },
    
    setJobFilter(jobs) {
      this.filters.job = Array.isArray(jobs) ? jobs : [jobs];
    },
    
    setDateFilter(start, end) {
      this.filters.date.start = start;
      this.filters.date.end = end;
    },
    
    setSearchFilter(search) {
      this.filters.search = search;
    },
    
    resetFilters() {
      this.filters = {
        status: [],
        priority: [],
        customer: [],
        project: [],
        job: [],
        date: {
          start: null,
          end: null
        },
        search: ''
      };
    },
    
    // Fetch all dashboard data using the /dashboard/all endpoint
    async fetchDashboardData(forceFetch = false) {
      if (!this.dateRange.startDate || !this.dateRange.endDate) {
        return;
      }
      
      // Use cache if available and not forced refresh
      if (this.isDataCached && !forceFetch) {
        return;
      }
      
      this.setLoading('dashboardData', true);
      this.setError('dashboardData', null);
      
      try {
        const response = await DispatchService.getDashboardAll(
          this.dateRange.startDate,
          this.dateRange.endDate
        );
        
        // Handle the nested structure where everything is under 'data'
        if (response.data && response.data.success && response.data.data) {
          // Extract the nested data
          const responseData = response.data.data;
          
          // Store sections of the response
          this.header = responseData.header;
          this.overview = responseData.overview;
          this.revenue = responseData.revenue;
        } else {
          this.setError('dashboardData', 'Unexpected data format received from the server');
        }
        
        // Update cache timestamp
        this.lastFetchTimestamp = Date.now();
      } catch (error) {
        this.setError('dashboardData', error.message || 'Failed to load dashboard data');
      } finally {
        this.setLoading('dashboardData', false);
      }
    },
    
    // Fetch detailed dispatches for a given page
    async fetchDetailedDispatches(page = 1, perPage = 10) {
      if (!this.dateRange.startDate || !this.dateRange.endDate) {
        return;
      }
      
      this.setLoading('details', true);
      this.setError('details', null);
      
      try {
        const response = await DispatchService.getDetailedDispatches({
          startDate: this.dateRange.startDate, 
          endDate: this.dateRange.endDate,
          page,
          perPage
        });
        
        if (response.data && response.data.success && response.data.data) {
          const responseData = response.data.data;
          
          this.details = {
            dispatches: responseData.dispatches || [],
            pagination: responseData.pagination || {
              currentPage: page,
              perPage: perPage,
              total: 0
            }
          };
        } else {
          this.setError('details', 'Unexpected data format received from the server');
        }
      } catch (error) {
        this.setError('details', error.message || 'Failed to load detailed dispatches');
      } finally {
        this.setLoading('details', false);
      }
    },
    
    // Helper for status colors (used by components)
    getStatusColor(status) {
      switch (status) {
        case 'Completed': return '#22c55e';
        case 'In Progress': return '#3b82f6';
        case 'Scheduled': return '#f59e0b';
        case 'Cancelled': return '#ef4444';
        default: return '#9ca3af';
      }
    },
    
    // Fetch client metrics for the Clients tab
    async fetchClientMetrics(sortBy = 'revenue', sortOrder = 'desc') {
      if (!this.dateRange.startDate || !this.dateRange.endDate) {
        console.error('Date range not set');
        return;
      }
      
      this.setLoading('clientMetrics', true);
      this.setError('clientMetrics', null);
      
      try {
        console.log('Fetching client metrics:', { sortBy, sortOrder });
        
        // First try to get from already loaded dashboard data
        if (this.revenue?.client_metrics && !sortBy && !sortOrder) {
          this.clientMetrics = this.revenue.client_metrics;
          console.log('Using cached client metrics data:', this.clientMetrics);
          return;
        }
        
        // Otherwise fetch from API
        const response = await DispatchService.getDashboardHeader(
          this.dateRange.startDate,
          this.dateRange.endDate
        );
        
        console.log('Client metrics response:', response);
        
        // Handle the nested structure
        if (response.data && response.data.success && response.data.data) {
          const responseData = response.data.data;
          
          // Process and sort client data
          this.clientMetrics = responseData.client_metrics || [];
          
          // Sort client metrics if needed
          if (sortBy && sortOrder) {
            this.clientMetrics = this.sortClientMetrics(this.clientMetrics, sortBy, sortOrder);
          }
        } else {
          console.error('Unexpected API response structure for client metrics:', response.data);
          this.error = 'Unexpected data format received from the server';
        }
        
        console.log('Client metrics loaded:', this.clientMetrics);
      } catch (error) {
        console.error('Error fetching client metrics:', error);
        this.error = error.message || 'Failed to load client metrics';
      } finally {
        this.setLoading('clientMetrics', false);
      }
    },
    
    // Helper method to sort client metrics
    sortClientMetrics(clients, sortBy, sortOrder) {
      // Clone the array to avoid modifying the original
      const sorted = [...clients];
      
      // Convert sortBy code to actual field
      let field;
      switch (sortBy) {
        case 'revenue':
          field = 'revenue';
          break;
        case 'dispatches':
          field = 'dispatch_count';
          break;
        case 'name':
          field = 'name';
          break;
        default:
          field = 'revenue';
      }
      
      console.log('Sorting client metrics by:', { field, sortOrder });
      
      // Sort the array
      sorted.sort((a, b) => {
        if (field === 'name') {
          // String comparison for names
          return sortOrder === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        } else {
          // Numeric comparison for other fields
          return sortOrder === 'asc'
            ? a[field] - b[field]
            : b[field] - a[field];
        }
      });
      
      return sorted;
    },
    
    // Format dates for API calls
    formatDateParam(date) {
      return format(date, 'yyyy-MM-dd');
    },
    
    // Fetch dispatch data for Jobs table
    async fetchDispatchData(filters) {
      console.log('[DEBUG] dispatchStore.fetchDispatchData - Starting with filters:', filters);
      this.setLoading('details', true);
      this.setError('details', null);

      try {
        console.log('[DEBUG] dispatchStore.fetchDispatchData - Calling DispatchService.getDispatchData');
        const response = await DispatchService.getDispatchData(filters);
        console.log('[DEBUG] dispatchStore.fetchDispatchData - Response received:', response.status);
        console.log('[DEBUG] dispatchStore.fetchDispatchData - Response success:', response.data?.success);
        
        if (response.data && response.data.success && response.data.data) {
          console.log('[DEBUG] dispatchStore.fetchDispatchData - Data structure:', 
            Object.keys(response.data.data));
          console.log('[DEBUG] dispatchStore.fetchDispatchData - Dispatches count:', 
            response.data.data.dispatches?.length || 0);
          
          const rawRows = response.data.data.dispatches || [];
          console.log('[DEBUG] dispatchStore.fetchDispatchData - Processing', rawRows.length, 'raw rows');
          
          const mappedRows = rawRows.map(d => ({
            id: d["Ticket ID"] ?? d.ticket_id,
            customerName: d["Customer Name"] ?? d.customer_name,
            subject: d.Subject ?? d.subject,
            status: d.Status ?? d.status,
            cityState: d["City/State"] ?? d.city_state,
            serviceDate: d["Service Date"] ?? d.service_date,
            jobDetails: {
              projectId: d.project_id,
              projectName: d.project_name,
              scopeOfWork: d["Detailed Scope of Work"] ?? d.detailed_scope_of_work,
              dispatchNotes: d["Dispatch Notes"] ?? d.dispatch_notes
            },
            schedule: {
              visitRecordId: d["Visit Record ID"] ?? d.visit_record_id,
              queue: d.Queue ?? d.queue,
              checkInTime: d["Check-in Time"] ?? d.check_in_time,
              checkOutTime: d["Check-out Time"] ?? d.check_out_time,
              duration: d.Duration ?? d.duration,
              expectedServiceDate: d["Service Date"] ?? d.service_date,
              actualServiceDate: d["Service Date"] ?? d.service_date,
              flexTimeStart: 'N/A',
              flexTimeEnd: 'N/A'
            },
            technicianInfo: {
              name: d["Technician Name"] ?? d.technician_name,
              grade: d["Technician Grade/Review"] ?? d.technician_grade,
              comments: d["Technician Comments"] ?? d.technician_comments,
              vendor: d["Vendor Information"] ?? d.vendor_information,
              contactInfo: d["Contact Information"] ?? d.contact_information
            },
            billing: {
              invoiceNumber: d["Invoice Number"] ?? d.invoice_number,
              quotedCost: `$${parseFloat((d["Quoted Costs"] ?? d.quoted_costs) || 0).toFixed(2)}`,
              finalBilledAmount: `$${parseFloat((d["Final Billed Amount"] ?? d.final_billed_amount) || 0).toFixed(2)}`,
              billingStatus: d["Billing Status"] ?? d.billing_status
            },
            daysToInvoice: d["Days to Invoice"] ?? d.days_to_invoice ?? null,
            completion: {
              closeOutNotes: d["Close-out Notes"] ?? d.close_out_notes
            },
            pmReview: d["PM Review"] ?? d.pm_review ?? 0,
            siteNumber: d["Site Number"] ?? d.site_number,
            address: d["Address"] ?? d.address,
            zipCode: d["Zip Code"] ?? d.zip_code,
            timeZone: d["Time Zone"] ?? d.time_zone,
            priority: d.Priority ?? d.priority,
            failureCode: d["Failure Code"] ?? d.failure_code,
            otherFailureCode: d["Other Failure Code"] ?? d.other_failure_code,
            itemId: d["Item ID"] ?? d.item_id,
            quantity: d.Quantity ?? d.quantity,
            jobLineType: d["Job Line Type"] ?? d.job_line_type,
            unitPrice: d["Unit Price"] ?? d.unit_price,
            lineAmount: d["Line Amount"] ?? d.line_amount
          }));

          console.log('[DEBUG] dispatchStore.fetchDispatchData - Mapped', mappedRows.length, 'rows');
          
          // Deduplicate by id to avoid duplicate keys in DataTable
          const uniqueMap = new Map();
          mappedRows.forEach(row => {
            if (!uniqueMap.has(row.id)) {
              uniqueMap.set(row.id, row);
            }
          });

          this.dispatchRows = Array.from(uniqueMap.values());
          console.log('[DEBUG] dispatchStore.fetchDispatchData - Final unique rows count:', this.dispatchRows.length);
        } else {
          console.error('[DEBUG] dispatchStore.fetchDispatchData - Unexpected API response:', response.data);
          this.error = 'Invalid response format';
        }
      } catch (error) {
        console.error('[DEBUG] dispatchStore.fetchDispatchData - Error:', error);
        this.error = error.message || 'Failed to load dispatch data';
      } finally {
        this.setLoading('details', false);
        console.log('[DEBUG] dispatchStore.fetchDispatchData - Completed, loading status:', this.loading);
      }
    },

    // Check if a ticket has been analyzed
    async checkTicketAnalysis(ticketId) {
      try {
        console.log('Checking ticket analysis status for ticket ID:', ticketId);
        const response = await ApiService.post('chain-analysis/check-ticket', { ticket_id: ticketId });
        console.log('Ticket analysis check response:', response);
        
        return response.data;
      } catch (error) {
        console.error('Error checking ticket analysis:', error);
        return { success: false, message: error.message || 'Failed to check analysis status' };
      }
    },
    
    // Get visit details by ticket ID
    async getVisitByTicket(ticketId) {
      try {
        console.log('Fetching visit details for ticket ID:', ticketId);
        const response = await ApiService.post('chain-analysis/get-visit-by-ticket', { ticket_id: ticketId });
        console.log('Visit details response:', response);
        
        return response.data;
      } catch (error) {
        console.error('Error fetching visit details:', error);
        return { success: false, message: error.message || 'Failed to fetch visit details' };
      }
    },
    
    // Get full job report
    async getJobReport(ticketId) {
      try {
        console.log('Fetching job report for ticket ID:', ticketId);
        const response = await ApiService.post('chain-analysis/get-job-report', { ticket_id: ticketId });
        console.log('Job report response:', response);
        
        return response.data;
      } catch (error) {
        console.error('Error fetching job report:', error);
        return { success: false, message: error.message || 'Failed to fetch job report' };
      }
    },
    
    // Analyze ticket - begins or re-runs AI analysis
    async analyzeTicket(ticketId, forceRefresh = false, model = 'gpt-4.1-mini') {
      try {
        console.log('Triggering analysis for ticket ID:', ticketId, { forceRefresh, model });
        const response = await ApiService.post('chain-analysis/analyze-ticket', { 
          ticket_id: ticketId,
          force_refresh: forceRefresh,
          model: model
        });
        console.log('Analysis response:', response);
        
        return response.data;
      } catch (error) {
        console.error('Error analyzing ticket:', error);
        return { success: false, message: error.message || 'Failed to analyze ticket' };
      }
    },
    
    // Dashboard Summary
    async fetchDashboardSummary() {
      try {
        this.loading = true;
        this.error = null;
        
        console.log('[DEBUG] dispatchStore.fetchDashboardSummary - Calling API');
        const response = await DispatchService.getDashboardSummary();
        console.log('[DEBUG] dispatchStore.fetchDashboardSummary - Response received:', {
          status: response.status,
          success: response.data?.success,
          dataKeys: response.data?.data ? Object.keys(response.data.data) : []
        });
        
        if (response.data && response.data.success) {
          // Store the raw data from API
          this.dashboardSummary = response.data.data;
          console.log('[DEBUG] dispatchStore.fetchDashboardSummary - Stored data:', this.dashboardSummary);
        } else {
          throw new Error(response.data.message || 'Failed to load dashboard summary');
        }
        
        return response;
      } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        this.error = error.message || 'Failed to load dashboard summary';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // Dashboard Trends
    async fetchDashboardTrends() {
      try {
        this.loading = true;
        this.error = null;
        
        console.log('[DEBUG] dispatchStore.fetchDashboardTrends - Calling API');
        const response = await DispatchService.getDashboardTrends();
        console.log('[DEBUG] dispatchStore.fetchDashboardTrends - Response received:', {
          status: response.status,
          success: response.data?.success,
          dataKeys: response.data?.data ? Object.keys(response.data.data) : []
        });
        
        if (response.data && response.data.success) {
          // Store the raw data from API
          this.dashboardTrends = response.data.data;
          console.log('[DEBUG] dispatchStore.fetchDashboardTrends - Stored data:', {
            metricsCount: this.dashboardTrends?.metrics?.length || 0,
            hasSummary: !!this.dashboardTrends?.summary,
          });
        } else {
          throw new Error(response.data.message || 'Failed to load dashboard trends');
        }
        
        return response;
      } catch (error) {
        console.error('Error fetching dashboard trends:', error);
        this.error = error.message || 'Failed to load dashboard trends';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // Projects list
    async fetchProjects(params = {}) {
      try {
        this.loading = true;
        this.error = null;
        
        console.log('[DEBUG] dispatchStore.fetchProjects - Calling with params:', JSON.parse(JSON.stringify(params)));
        const response = await DispatchService.getProjects(params);
        console.log('[DEBUG] dispatchStore.fetchProjects - Response received:', {
          status: response.status,
          success: response.data?.success,
          hasProjects: Array.isArray(response.data?.data?.data),
          projectCount: response.data?.data?.data?.length || 0
        });
        
        if (response.data && response.data.success) {
          // Handle nested data structure where projects are in data.data
          this.projects = response.data.data.data || [];
          
          if (response.data.data.pagination) {
            this.pagination = response.data.data.pagination;
          }
        } else {
          throw new Error(response.data.message || 'Failed to load projects');
        }
        
        return response;
      } catch (error) {
        console.error('Error fetching projects:', error);
        this.error = error.message || 'Failed to load projects';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // Project details
    async fetchProject(projectId) {
      try {
        this.loading = true;
        this.error = null;
        
        const response = await DispatchService.getProject(projectId);
        
        if (response.data && response.data.success) {
          this.currentProject = response.data.data;
          this.jobs = response.data.data.jobs || [];
        } else {
          throw new Error(response.data.message || 'Failed to load project details');
        }
      } catch (error) {
        console.error('Error fetching project:', error);
        this.error = error.message || 'Failed to load project details';
      } finally {
        this.loading = false;
      }
    },
    
    // Job details
    async fetchJobDetails(jobId) {
      try {
        console.log('[DEBUG] dispatchStore.fetchJobDetails - Starting for job ID:', jobId);
        this.loading = true;
        this.error = null;
        
        // Option 1: Use the comprehensive endpoint for better performance
        console.log('[DEBUG] dispatchStore.fetchJobDetails - Using complete job data endpoint');
        const response = await DispatchService.getCompleteJobData(jobId);
        
        if (response.data && response.data.success) {
          console.log('[DEBUG] dispatchStore.fetchJobDetails - Complete job data received');
          this.currentJob = DispatchService.formatJobDetails(response.data.data);
          console.log('[DEBUG] dispatchStore.fetchJobDetails - Data formatted and stored in state');
        } else {
          console.error('[DEBUG] dispatchStore.fetchJobDetails - Invalid response format');
          throw new Error('Invalid response format');
        }
        
        return this.currentJob;
      } catch (error) {
        console.error('[DEBUG] dispatchStore.fetchJobDetails - Error:', error);
        this.error = error.message || 'Failed to load job details';
        throw error;
      } finally {
        this.loading = false;
        console.log('[DEBUG] dispatchStore.fetchJobDetails - Completed');
      }
    },
    
    // Visit details via job analysis
    async fetchVisitFromJob(jobId, visitId) {
      try {
        this.loading = true;
        this.error = null;
        
        // First get job data with visits component
        const jobResponse = await DispatchService.getJobVisits(jobId);
        
        if (jobResponse.data && jobResponse.data.success) {
          const job = jobResponse.data.data;
          
          // Find the specific visit in the job data
          const visit = job.visits.find(v => v.visit_id === visitId);
          
          if (visit) {
            // Format the visit data using the helper method
            this.currentVisit = DispatchService.formatVisitData(visit);
          } else {
            throw new Error('Visit not found in job data');
          }
        } else {
          throw new Error(jobResponse.data.message || 'Failed to load job data');
        }
      } catch (error) {
        console.error('Error fetching visit from job:', error);
        this.error = error.message || 'Failed to load visit details';
      } finally {
        this.loading = false;
      }
    },
    
    // Direct visit endpoint
    async fetchVisit(visitId) {
      try {
        this.loading = true;
        this.error = null;
        
        const response = await DispatchService.getVisit(visitId);
        
        if (response.data && response.data.success) {
          // Format the response data
          this.currentVisit = DispatchService.formatVisitData(response.data.data);
        } else {
          throw new Error(response.data.message || 'Failed to load visit details');
        }
      } catch (error) {
        console.error('Error fetching visit:', error);
        this.error = error.message || 'Failed to load visit details';
      } finally {
        this.loading = false;
      }
    },
    
    // Alerts
    async fetchAlerts() {
      try {
        this.loading = true;
        this.error = null;
        
        console.log('[DEBUG] dispatchStore.fetchAlerts - Calling API');
        const response = await DispatchService.getAlerts();
        console.log('[DEBUG] dispatchStore.fetchAlerts - Response received:', {
          status: response.status,
          success: response.data?.success,
          alertCount: response.data?.data?.data?.length || 0
        });
        
        if (response.data && response.data.success) {
          // Handle nested data structure where alerts are in data.data
          this.alerts = response.data.data.data || [];
        } else {
          throw new Error(response.data.message || 'Failed to load alerts');
        }
        
        return response;
      } catch (error) {
        console.error('Error fetching alerts:', error);
        this.error = error.message || 'Failed to load alerts';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // Submit visit issue resolution
    async submitIssueResolution(visitId, issueId, resolution) {
      try {
        this.loading = true;
        this.error = null;
        
        const response = await DispatchService.submitIssueResolution(
          visitId,
          issueId,
          resolution
        );
        
        if (response.data && response.data.success) {
          // Update the issue in the current visit if found
          if (this.currentVisit && this.currentVisit.issues) {
            const issue = this.currentVisit.issues.find(i => i.visitIssueId === issueId);
            if (issue) {
              if (!issue.resolutionAttempts) {
                issue.resolutionAttempts = [];
              }
              
              issue.resolutionAttempts.push({
                attemptDescription: resolution.resolution_text,
                outcome: resolution.resolution_status
              });
              
              issue.status = resolution.resolution_status;
            }
          }
          
          return true;
        } else {
          throw new Error(response.data.message || 'Failed to submit resolution');
        }
      } catch (error) {
        console.error('Error submitting resolution:', error);
        this.error = error.message || 'Failed to submit resolution';
        return false;
      } finally {
        this.loading = false;
      }
    },
    
    // Date formatter helper
    formatDate(date) {
      if (!date) return '';
      return format(new Date(date), 'MMM d, yyyy');
    },

    // === GlobalActivityView Actions ===
    async loadDashboardData() {
      try {
        console.log('[DEBUG] dispatchStore.loadDashboardData - Starting');
        this.loading = true;
        this.error = null;
        
        // Fetch global dashboard summary
        console.log('[DEBUG] dispatchStore.loadDashboardData - Fetching global dashboard summary');
        const globalResponse = await DispatchService.getDashboardGlobal();
        if (globalResponse.data && globalResponse.data.success) {
          console.log('[DEBUG] dispatchStore.loadDashboardData - Global dashboard data received');
          this.dashboardSummary = globalResponse.data.data;
        } else {
          console.error('[DEBUG] dispatchStore.loadDashboardData - Invalid global dashboard response format');
        }
        
        // Fetch enhanced dashboard with more details
        console.log('[DEBUG] dispatchStore.loadDashboardData - Fetching enhanced dashboard data');
        const enhancedResponse = await DispatchService.getDashboardGlobalEnhanced();
        if (enhancedResponse.data && enhancedResponse.data.success) {
          console.log('[DEBUG] dispatchStore.loadDashboardData - Enhanced dashboard data received');
          this.dashboardEnhanced = enhancedResponse.data.data;
        } else {
          console.error('[DEBUG] dispatchStore.loadDashboardData - Invalid enhanced dashboard response format');
        }
        
        // Fetch dashboard metrics
        console.log('[DEBUG] dispatchStore.loadDashboardData - Fetching dashboard metrics');
        const metricsResponse = await DispatchService.getDashboardMetrics();
        if (metricsResponse.data && metricsResponse.data.success) {
          console.log('[DEBUG] dispatchStore.loadDashboardData - Dashboard metrics data received');
          this.dashboardTrends = metricsResponse.data.data;
        } else {
          console.error('[DEBUG] dispatchStore.loadDashboardData - Invalid metrics response format');
        }
        
        // Fetch visits data for activity table
        console.log('[DEBUG] dispatchStore.loadDashboardData - Fetching visits data');
        await this.fetchVisitsData();
        
        console.log('[DEBUG] dispatchStore.loadDashboardData - Dashboard data loaded successfully');
        return { globalResponse, enhancedResponse, metricsResponse };
      } catch (error) {
        console.error('[DEBUG] dispatchStore.loadDashboardData - Error:', error);
        this.error = error.message || 'Failed to load dashboard data';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchVisitsData(params = {}) {
      try {
        console.log('[DEBUG] dispatchStore.fetchVisitsData - Starting');
        this.loading = true;
        this.error = null;
        
        // Initialize visits as empty array to prevent undefined errors
        if (!Array.isArray(this.visits)) {
          this.visits = [];
        }
        
        // Make the direct API call to fetch visits
        console.log('[DEBUG] dispatchStore.fetchVisitsData - Calling API endpoint');
        try {
          const response = await DispatchService.getVisits(params);
          
          if (response.data && response.data.success) {
            console.log('[DEBUG] dispatchStore.fetchVisitsData - Success from API, visits received:', 
              response.data.data.data?.length || 0);
            this.visits = response.data.data.data || [];
            
            // Update pagination info if provided
            if (response.data.data.pagination) {
              console.log('[DEBUG] dispatchStore.fetchVisitsData - Updating pagination info');
              this.pagination = response.data.data.pagination;
            }
            
            return response;
          } else {
            console.error('[DEBUG] dispatchStore.fetchVisitsData - Invalid response from API');
            this.error = "Could not retrieve visits data";
            return { data: { success: false, message: this.error } };
          }
        } catch (apiError) {
          console.error('[DEBUG] dispatchStore.fetchVisitsData - API Error:', apiError);
          this.error = "Visit data API endpoint not available";
          return { data: { success: false, message: this.error } };
        }
      } catch (error) {
        console.error('[DEBUG] dispatchStore.fetchVisitsData - Error:', error);
        this.error = error.message || 'Failed to load visits';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // === ProjectsView Actions ===
    // Already implemented with fetchProjects

    // === ProjectDetailsView Actions ===
    async fetchProjectDetails(projectId) {
      try {
        console.log('[DEBUG] dispatchStore.fetchProjectDetails - Starting for project ID:', projectId);
        this.loading = true;
        this.error = null;
        
        // Fetch project details
        console.log('[DEBUG] dispatchStore.fetchProjectDetails - Fetching project details');
        const projectResponse = await DispatchService.getProjectById(projectId);
        this.currentProject = projectResponse;
        console.log('[DEBUG] dispatchStore.fetchProjectDetails - Project details received');
        
        // Fetch jobs for this project
        console.log('[DEBUG] dispatchStore.fetchProjectDetails - Fetching project jobs');
        const jobsResponse = await DispatchService.fetchJobsByProject(projectId);
        this.jobs = jobsResponse;
        console.log('[DEBUG] dispatchStore.fetchProjectDetails - Project jobs received:', jobsResponse.length);
        
        // Fetch project timeline
        console.log('[DEBUG] dispatchStore.fetchProjectDetails - Fetching project timeline');
        const timelineResponse = await DispatchService.getProjectTimeline(projectId);
        if (timelineResponse.data && timelineResponse.data.success) {
          console.log('[DEBUG] dispatchStore.fetchProjectDetails - Project timeline received');
          this.currentProject.timeline = timelineResponse.data.data;
        } else {
          console.error('[DEBUG] dispatchStore.fetchProjectDetails - Invalid timeline response format');
        }
        
        console.log('[DEBUG] dispatchStore.fetchProjectDetails - Project details loaded successfully');
        return { projectResponse, jobsResponse, timelineResponse };
      } catch (error) {
        console.error('[DEBUG] dispatchStore.fetchProjectDetails - Error:', error);
        this.error = error.message || 'Failed to load project details';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // === JobsView Actions ===
    async fetchJobs(params = {}) {
      try {
        console.log('[DEBUG] dispatchStore.fetchJobs - Starting');
        this.loading = true;
        this.error = null;
        
        // Apply filters from store state if not provided
        const filterParams = params || {};
        if (this.filters.date.start && this.filters.date.end) {
          console.log('[DEBUG] dispatchStore.fetchJobs - Adding date filters');
          filterParams.date_from = this.formatDateParam(this.filters.date.start);
          filterParams.date_to = this.formatDateParam(this.filters.date.end);
        }
        
        if (this.filters.status.length > 0) {
          console.log('[DEBUG] dispatchStore.fetchJobs - Adding status filters');
          filterParams.status = this.filters.status.join(',');
        }
        
        if (this.filters.customer.length > 0) {
          console.log('[DEBUG] dispatchStore.fetchJobs - Adding customer filters');
          filterParams.customer_ids = this.filters.customer.join(',');
        }
        
        if (this.filters.search) {
          console.log('[DEBUG] dispatchStore.fetchJobs - Adding search term');
          filterParams.search = this.filters.search;
        }
        
        // Set pagination parameters
        filterParams.page = this.pagination.page;
        filterParams.per_page = this.pagination.limit;
        
        console.log('[DEBUG] dispatchStore.fetchJobs - Calling API with params:', filterParams);
        const response = await DispatchService.getJobs(filterParams);
        
        if (response.data && response.data.success) {
          console.log('[DEBUG] dispatchStore.fetchJobs - Success, jobs received:', response.data.data.data?.length || 0);
          this.jobs = response.data.data.data || [];
          
          // Update pagination info if provided
          if (response.data.data.pagination) {
            console.log('[DEBUG] dispatchStore.fetchJobs - Updating pagination info');
            this.pagination = response.data.data.pagination;
          }
        } else {
          console.error('[DEBUG] dispatchStore.fetchJobs - Invalid response format');
        }
        
        // Fetch statistics for KPI metrics
        console.log('[DEBUG] dispatchStore.fetchJobs - Fetching job statistics');
        const statsResponse = await DispatchService.getJobStatistics();
        if (statsResponse.data && statsResponse.data.success) {
          console.log('[DEBUG] dispatchStore.fetchJobs - Job statistics received');
          // Store metrics data for the KPIs
          this.header = statsResponse.data.data;
        } else {
          console.error('[DEBUG] dispatchStore.fetchJobs - Invalid statistics response format');
        }
        
        console.log('[DEBUG] dispatchStore.fetchJobs - Jobs data loaded successfully');
        return response;
      } catch (error) {
        console.error('[DEBUG] dispatchStore.fetchJobs - Error:', error);
        this.error = error.message || 'Failed to load jobs';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // === JobDetailsView Actions ===
    // Enhancing existing fetchJobDetails
    async fetchJobDetails(jobId) {
      try {
        console.log('[DEBUG] dispatchStore.fetchJobDetails - Starting for job ID:', jobId);
        this.loading = true;
        this.error = null;
        
        // Option 1: Use the comprehensive endpoint for better performance
        console.log('[DEBUG] dispatchStore.fetchJobDetails - Using complete job data endpoint');
        const response = await DispatchService.getCompleteJobData(jobId);
        
        if (response.data && response.data.success) {
          console.log('[DEBUG] dispatchStore.fetchJobDetails - Complete job data received');
          this.currentJob = DispatchService.formatJobDetails(response.data.data);
          console.log('[DEBUG] dispatchStore.fetchJobDetails - Data formatted and stored in state');
        } else {
          console.error('[DEBUG] dispatchStore.fetchJobDetails - Invalid response format');
          throw new Error('Invalid response format');
        }
        
        return this.currentJob;
      } catch (error) {
        console.error('[DEBUG] dispatchStore.fetchJobDetails - Error:', error);
        this.error = error.message || 'Failed to load job details';
        throw error;
      } finally {
        this.loading = false;
        console.log('[DEBUG] dispatchStore.fetchJobDetails - Completed');
      }
    },

    // === VisitDetailsView Actions ===
    async fetchVisitById(visitId) {
      try {
        console.log('[DEBUG] dispatchStore.fetchVisitById - Starting for visit ID:', visitId);
        this.loading = true;
        this.error = null;
        
        // Fetch visit details
        console.log('[DEBUG] dispatchStore.fetchVisitById - Fetching visit details');
        const visitResponse = await DispatchService.getVisitById(visitId);
        this.currentVisit = visitResponse;
        console.log('[DEBUG] dispatchStore.fetchVisitById - Visit details received');
        
        // Fetch visit timeline
        console.log('[DEBUG] dispatchStore.fetchVisitById - Fetching visit timeline');
        const timelineResponse = await DispatchService.getVisitTimeline(visitId);
        if (timelineResponse.data && timelineResponse.data.success) {
          console.log('[DEBUG] dispatchStore.fetchVisitById - Visit timeline received');
          this.currentVisit.timeline = timelineResponse.data.data;
        } else {
          console.error('[DEBUG] dispatchStore.fetchVisitById - Invalid timeline response format');
        }
        
        // Fetch work performance data
        console.log('[DEBUG] dispatchStore.fetchVisitById - Fetching work performance data');
        const workResponse = await DispatchService.getVisitWorkPerformance(visitId);
        if (workResponse.data && workResponse.data.success) {
          console.log('[DEBUG] dispatchStore.fetchVisitById - Work performance data received');
          this.currentVisit.tasks_performed = workResponse.data.data.tasks || [];
        } else {
          console.error('[DEBUG] dispatchStore.fetchVisitById - Invalid work performance response format');
        }
        
        // Fetch materials used
        console.log('[DEBUG] dispatchStore.fetchVisitById - Fetching materials data');
        const materialsResponse = await DispatchService.getVisitMaterials(visitId);
        if (materialsResponse.data && materialsResponse.data.success) {
          console.log('[DEBUG] dispatchStore.fetchVisitById - Materials data received');
          this.currentVisit.materials_used = materialsResponse.data.data.materials || [];
        } else {
          console.error('[DEBUG] dispatchStore.fetchVisitById - Invalid materials response format');
        }
        
        // Fetch relationships
        console.log('[DEBUG] dispatchStore.fetchVisitById - Fetching relationships data');
        const relationshipsResponse = await DispatchService.getVisitRelationships(visitId);
        if (relationshipsResponse.data && relationshipsResponse.data.success) {
          console.log('[DEBUG] dispatchStore.fetchVisitById - Relationships data received');
          // Add job info to the visit
          if (relationshipsResponse.data.data.job) {
            this.currentVisit.job = relationshipsResponse.data.data.job;
          }
        } else {
          console.error('[DEBUG] dispatchStore.fetchVisitById - Invalid relationships response format');
        }
        
        // Fetch key interactions
        console.log('[DEBUG] dispatchStore.fetchVisitById - Fetching key interactions data');
        const interactionsResponse = await DispatchService.getVisitKeyInteractions(visitId);
        if (interactionsResponse.data && interactionsResponse.data.success) {
          console.log('[DEBUG] dispatchStore.fetchVisitById - Key interactions data received');
          this.currentVisit.key_interactions = interactionsResponse.data.data.interactions || [];
        } else {
          console.error('[DEBUG] dispatchStore.fetchVisitById - Invalid interactions response format');
        }
        
        console.log('[DEBUG] dispatchStore.fetchVisitById - Visit data loaded successfully');
        return this.currentVisit;
      } catch (error) {
        console.error('[DEBUG] dispatchStore.fetchVisitById - Error:', error);
        this.error = error.message || 'Failed to load visit details';
        throw error;
      } finally {
        this.loading = false;
        console.log('[DEBUG] dispatchStore.fetchVisitById - Completed');
      }
    }
  }
}); 