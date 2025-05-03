import { defineStore } from 'pinia';
import { DispatchService } from '@/service/DispatchService';
import { formatISO } from 'date-fns';

export const useDispatchStore = defineStore('dispatch', {
  state: () => ({
    // Loading states
    loading: {
      dashboardData: false,
      details: false,
      clientMetrics: false
    },
    
    // Error states
    errors: {
      dashboardData: null,
      details: null,
      clientMetrics: null
    },
    
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
    dispatchRows: []
  }),
  
  getters: {
    // KPI metrics and their changes
    totalDispatches: state => {
      const value = state.header?.total_dispatches?.current || 0;
      console.log('Getter totalDispatches:', { header: state.header, value });
      return value;
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
      const data = state.overview?.daily_volume || [];
      console.log('Getter volumeOverTime:', { overview: state.overview, dataLength: data.length });
      return data;
    },
    statusDistribution: state => state.overview?.status_breakdown || [],
    clientDispatches: state => state.overview?.top_clients || [],
    projectDispatches: state => state.overview?.top_projects || [],
    
    // Revenue metrics
    revenueOverTime: state => state.revenue?.revenue_timeline || [],
    clientsByRevenue: state => state.revenue?.top_clients || [],
    revenueCategories: state => state.revenue?.categories || [],
    revenueTotals: state => state.revenue?.totals || {},
    
    // Additional revenue metrics
    averageRevenuePerDispatch: state => {
      // Calculate based on total revenue and total dispatches
      const totalRevenue = state.header?.total_revenue?.current || 0;
      const totalDispatches = state.header?.total_dispatches?.current || 1; // Avoid division by zero
      const average = totalDispatches > 0 ? totalRevenue / totalDispatches : 0;
      console.log('Computed averageRevenuePerDispatch:', { totalRevenue, totalDispatches, average });
      return average;
    },
    
    highestDailyRevenue: state => {
      // Find the highest revenue day from the timeline
      const revenueTimeline = state.revenue?.revenue_timeline || [];
      if (revenueTimeline.length === 0) return 0;
      
      const highest = revenueTimeline.reduce((max, day) => {
        return day.revenue > max ? day.revenue : max;
      }, 0);
      console.log('Computed highestDailyRevenue:', { timelineLength: revenueTimeline.length, highest });
      return highest;
    },
    
    lowestDailyRevenue: state => {
      // Find the lowest revenue day from the timeline (excluding zero values)
      const revenueTimeline = state.revenue?.revenue_timeline || [];
      if (revenueTimeline.length === 0) return 0;
      
      // Filter out days with zero revenue first
      const nonZeroDays = revenueTimeline.filter(day => day.revenue > 0);
      if (nonZeroDays.length === 0) return 0;
      
      const lowest = nonZeroDays.reduce((min, day) => {
        return (day.revenue < min || min === 0) ? day.revenue : min;
      }, nonZeroDays[0].revenue);
      console.log('Computed lowestDailyRevenue:', { 
        timelineLength: revenueTimeline.length, 
        nonZeroDaysLength: nonZeroDays.length,
        lowest 
      });
      return lowest;
    },
    
    // Cached status - determines if we should refetch data
    isDataCached: state => {
      if (!state.lastFetchTimestamp) return false;
      // Consider data stale after 5 minutes
      return (Date.now() - state.lastFetchTimestamp) < 5 * 60 * 1000;
    },
    
    // Helper to check if any section is loading
    isLoading: state => Object.values(state.loading).some(status => status === true)
  },
  
  actions: {
    // Set date range for filtering dashboard data
    setDateRange(startDate, endDate) {
      if (startDate && endDate) {
        this.dateRange.startDate = startDate instanceof Date ? startDate : new Date(startDate);
        this.dateRange.endDate = endDate instanceof Date ? endDate : new Date(endDate);
        console.log('Date range set:', this.dateRange);
      } else {
        console.error('Invalid date range provided:', { startDate, endDate });
      }
    },
    
    // Debug helper to inspect the revenue data
    debugRevenueData() {
      console.log('--- DEBUG REVENUE DATA ---');
      console.log('Header:', this.header);
      console.log('Revenue data:', this.revenue);
      console.log('Revenue totals:', this.revenueTotals);
      console.log('Average revenue per dispatch:', this.averageRevenuePerDispatch);
      console.log('Highest daily revenue:', this.highestDailyRevenue);
      console.log('Lowest daily revenue:', this.lowestDailyRevenue);
      console.log('Revenue timeline:', this.revenueOverTime?.slice(0, 3)); // Just show the first 3 entries
      console.log('--- END DEBUG REVENUE DATA ---');
    },
    
    // Fetch all dashboard data using the /dashboard/all endpoint
    async fetchDashboardData(forceFetch = false) {
      if (!this.dateRange.startDate || !this.dateRange.endDate) {
        console.error('Date range not set');
        return;
      }
      
      // Use cache if available and not forced refresh
      if (this.isDataCached && !forceFetch) {
        console.log('Using cached dashboard data');
        return;
      }
      
      this.loading.dashboardData = true;
      this.errors.dashboardData = null;
      
      try {
        console.log('Fetching dashboard data for date range:', this.dateRange);
        
        const response = await DispatchService.getDashboardAll(
          this.dateRange.startDate,
          this.dateRange.endDate
        );
        
        console.log('Dashboard data received:', response);
        console.log('Response data structure:', response.data);
        
        // Handle the nested structure where everything is under 'data'
        if (response.data && response.data.success && response.data.data) {
          // Extract the nested data
          const responseData = response.data.data;
          
          // Store sections of the response
          this.header = responseData.header;
          this.overview = responseData.overview;
          this.revenue = responseData.revenue;
          
          console.log('Extracted header:', this.header);
          console.log('Extracted overview:', this.overview);
          console.log('Extracted revenue:', this.revenue);
          
          // Debug revenue data after loading
          this.debugRevenueData();
        } else {
          console.error('Unexpected API response structure:', response.data);
          this.errors.dashboardData = 'Unexpected data format received from the server';
        }
        
        // Update cache timestamp
        this.lastFetchTimestamp = Date.now();
        
        console.log('All dashboard data loaded');
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        this.errors.dashboardData = error.message || 'Failed to load dashboard data';
      } finally {
        this.loading.dashboardData = false;
      }
    },
    
    // Fetch detailed dispatch records for the table view
    async fetchDetailedDispatches(page = 1, perPage = 25, sortBy = null, sortOrder = null) {
      if (!this.dateRange.startDate || !this.dateRange.endDate) {
        console.error('Date range not set');
        return;
      }
      
      this.loading.details = true;
      this.errors.details = null;
      
      try {
        console.log('Fetching detailed dispatches:', { page, perPage, sortBy, sortOrder });
        
        const response = await DispatchService.getDashboardDetails(
          this.dateRange.startDate,
          this.dateRange.endDate,
          page,
          perPage,
          sortBy,
          sortOrder
        );
        
        console.log('Detailed dispatches received:', response);
        
        // Handle the nested structure
        if (response.data && response.data.success && response.data.data) {
          const responseData = response.data.data;
          
          this.details = {
            dispatches: responseData.dispatches || [],
            pagination: {
              currentPage: parseInt(responseData.pagination?.current_page) || 1,
              perPage: parseInt(responseData.pagination?.per_page) || perPage,
              total: parseInt(responseData.pagination?.total) || 0,
              totalPages: parseInt(responseData.pagination?.last_page) || 1
            }
          };
          
          console.log('Updated pagination info:', this.details.pagination);
        } else {
          console.error('Unexpected API response structure for details:', response.data);
          this.errors.details = 'Unexpected data format received from the server';
        }
        
        console.log('Detailed dispatches loaded:', this.details);
      } catch (error) {
        console.error('Error fetching detailed dispatches:', error);
        this.errors.details = error.message || 'Failed to load detailed dispatches';
      } finally {
        this.loading.details = false;
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
      
      this.loading.clientMetrics = true;
      this.errors.clientMetrics = null;
      
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
          this.errors.clientMetrics = 'Unexpected data format received from the server';
        }
        
        console.log('Client metrics loaded:', this.clientMetrics);
      } catch (error) {
        console.error('Error fetching client metrics:', error);
        this.errors.clientMetrics = error.message || 'Failed to load client metrics';
      } finally {
        this.loading.clientMetrics = false;
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
    
    // Fetch dispatch data for Jobs table
    async fetchDispatchData(filters) {
      this.loading.details = true;
      this.errors.details = null;

      try {
        const response = await DispatchService.getDispatchData(filters);
        console.log('fetchDispatchData response:', response);
        if (response.data && response.data.success && response.data.data) {
          const rawRows = response.data.data.dispatches || [];
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

          // Deduplicate by id to avoid duplicate keys in DataTable
          const uniqueMap = new Map();
          mappedRows.forEach(row => {
            if (!uniqueMap.has(row.id)) {
              uniqueMap.set(row.id, row);
            }
          });

          this.dispatchRows = Array.from(uniqueMap.values());
        } else {
          console.error('Unexpected API response:', response.data);
          this.errors.details = 'Invalid response format';
        }
      } catch (error) {
        console.error('Error fetching dispatch data:', error);
        this.errors.details = error.message || 'Failed to load dispatch data';
      } finally {
        this.loading.details = false;
      }
    }
  }
}); 