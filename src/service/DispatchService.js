import { ApiService } from './ApiService';
import { format } from 'date-fns';

export const DispatchService = {
  // Format dates for API calls
  formatDateParam(date) {
    return format(date, 'yyyy-MM-dd');
  },
  
  // Helper to handle API errors with better logging
  handleApiError(error, endpoint) {
    console.error(`DispatchService - Error calling ${endpoint}:`, error);
    
    if (error.response) {
      // The request was made and the server responded with a status code outside of 2xx
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Request error:', error.message);
    }
    
    // Return a clearer error that can be displayed to the user
    throw new Error('The requested data could not be found. Please check your inputs and try again.');
  },
  
  // Main endpoint for all dashboard data
  getDashboardAll(startDate, endDate) {
    const params = {
      date_from: this.formatDateParam(startDate),
      date_to: this.formatDateParam(endDate)
    };
    
    console.log('DispatchService.getDashboardAll - Params:', params);
    
    // Fix: Remove the leading slash to avoid duplicate /api/api pattern
    return ApiService.get('dashboard/all', params)
      .catch(error => this.handleApiError(error, 'getDashboardAll'));
  },
  
  // Alternative endpoints for specific sections
  getDashboardHeader(startDate, endDate) {
    const params = {
      date_from: this.formatDateParam(startDate),
      date_to: this.formatDateParam(endDate)
    };
    
    console.log('DispatchService.getDashboardHeader - Params:', params);
    
    return ApiService.get('dashboard/header', params)
      .catch(error => this.handleApiError(error, 'getDashboardHeader'));
  },
  
  getDashboardOverview(startDate, endDate) {
    const params = {
      date_from: this.formatDateParam(startDate),
      date_to: this.formatDateParam(endDate)
    };
    
    console.log('DispatchService.getDashboardOverview - Params:', params);
    
    return ApiService.get('dashboard/overview', params)
      .catch(error => this.handleApiError(error, 'getDashboardOverview'));
  },
  
  getDashboardRevenue(startDate, endDate) {
    const params = {
      date_from: this.formatDateParam(startDate),
      date_to: this.formatDateParam(endDate)
    };
    
    console.log('DispatchService.getDashboardRevenue - Params:', params);
    
    return ApiService.get('dashboard/revenue', params)
      .catch(error => this.handleApiError(error, 'getDashboardRevenue'));
  },
  
  getDashboardDetails(startDate, endDate, page = 1, perPage = 25, sortBy = null, sortOrder = null) {
    const params = {
      date_from: this.formatDateParam(startDate),
      date_to: this.formatDateParam(endDate),
      page,
      per_page: perPage
    };
    
    if (sortBy && sortOrder) {
      params.sort_by = sortBy;
      params.sort_order = sortOrder;
    }
    
    console.log('DispatchService.getDashboardDetails - Params:', params);
    
    return ApiService.get('dashboard/details', params)
      .catch(error => this.handleApiError(error, 'getDashboardDetails'));
  },
  
  getDispatchData(filters = {}) {
    // Directly pass the filters object as query params
    console.log('DispatchService.getDispatchData - Filters:', filters);
    return ApiService.get('dispatch-reports/dispatch-data', filters)
      .catch(error => this.handleApiError(error, 'getDispatchData'));
  },
  
  // Get job analysis data with flexible component selection
  getJobAnalysis(jobId, components = []) {
    const defaultComponents = ['job', 'visits', 'timeline', 'analysis', 'financials'];
    const include = components.length > 0 ? components : defaultComponents;
    
    console.log('[DEBUG] DispatchService.getJobAnalysis - Job ID:', jobId);
    console.log('[DEBUG] DispatchService.getJobAnalysis - Components:', include);
    
    const endpoint = `dashboard/jobs/${jobId}/analysis`;
    const params = { include: include.join(',') };
    
    console.log('[DEBUG] DispatchService.getJobAnalysis - Endpoint:', endpoint);
    console.log('[DEBUG] DispatchService.getJobAnalysis - Params:', params);
    
    return ApiService.get(endpoint, params)
      .then(response => {
        console.log('[DEBUG] DispatchService.getJobAnalysis - Response status:', response.status);
        console.log('[DEBUG] DispatchService.getJobAnalysis - Response success:', response.data?.success);
        
        if (response.data?.data) {
          console.log('[DEBUG] DispatchService.getJobAnalysis - Data components received:', 
            Object.keys(response.data.data));
        }
        
        return response;
      })
      .catch(error => {
        console.error('[DEBUG] DispatchService.getJobAnalysis - Error:', error);
        return this.handleApiError(error, 'getJobAnalysis');
      });
  },
  
  // Get comprehensive job details
  getJobDetails(jobId) {
    console.log('[DEBUG] DispatchService.getJobDetails - Job ID:', jobId);
    console.log('[DEBUG] DispatchService.getJobDetails - Requesting all components');
    
    return this.getJobAnalysis(jobId, ['job', 'visits', 'timeline', 'financials', 'analysis', 'issues', 'metadata'])
      .then(response => {
        console.log('[DEBUG] DispatchService.getJobDetails - Response received, forwarding to caller');
        return response;
      });
  },
  
  // Get job data focused on visits
  getJobVisits(jobId) {
    console.log('[DEBUG] DispatchService.getJobVisits - Job ID:', jobId);
    console.log('[DEBUG] DispatchService.getJobVisits - Requesting job and visits components');
    
    return this.getJobAnalysis(jobId, ['job', 'visits'])
      .then(response => {
        console.log('[DEBUG] DispatchService.getJobVisits - Response received, forwarding to caller');
        return response;
      });
  },
  
  // Get specific visit data
  getVisit(visitId) {
    console.log('[DEBUG] DispatchService.getVisit - Visit ID:', visitId);
    
    const endpoint = `visits/${visitId}`;
    console.log('[DEBUG] DispatchService.getVisit - Endpoint:', endpoint);
    
    return ApiService.get(endpoint)
      .then(response => {
        console.log('[DEBUG] DispatchService.getVisit - Response status:', response.status);
        console.log('[DEBUG] DispatchService.getVisit - Response success:', response.data?.success);
        
        if (response.data?.data) {
          console.log('[DEBUG] DispatchService.getVisit - Data structure:', 
            Object.keys(response.data.data));
        }
        
        return response;
      })
      .catch(error => {
        console.error('[DEBUG] DispatchService.getVisit - Error:', error);
        return this.handleApiError(error, 'getVisit');
      });
  },
  
  // Get visit materials
  getVisitMaterials(visitId) {
    return ApiService.get(`visits/${visitId}/materials`);
  },
  
  // Get visit timeline
  getVisitTimeline(visitId) {
    return ApiService.get(`visits/${visitId}/timeline`);
  },
  
  // Get visit key interactions
  getVisitKeyInteractions(visitId) {
    return ApiService.get(`visits/${visitId}/key-interactions`);
  },
  
  // Get visit work performance
  getVisitWorkPerformance(visitId) {
    return ApiService.get(`visits/${visitId}/work-performance`);
  },
  
  // Submit resolution for a visit issue
  submitIssueResolution(visitId, issueId, resolution) {
    return ApiService.post(`visits/${visitId}/issues/${issueId}/resolution`, resolution);
  },
  
  // Get linked tickets
  getLinkedTickets(jobId) {
    return ApiService.get(`jobs/${jobId}/linked-tickets`);
  },
  
  // Dashboard-level data
  getDashboardSummary() {
    console.log('[DEBUG] DispatchService.getDashboardSummary - Calling API endpoint: dashboard/global');
    
    return ApiService.get('dashboard/global')
      .then(response => {
        console.log('[DEBUG] DispatchService.getDashboardSummary - Response status:', response.status);
        console.log('[DEBUG] DispatchService.getDashboardSummary - Response success:', response.data?.success);
        
        if (response.data?.data) {
          console.log('[DEBUG] DispatchService.getDashboardSummary - Data structure:', 
            Object.keys(response.data.data));
        }
        
        return response;
      })
      .catch(error => {
        console.error('[DEBUG] DispatchService.getDashboardSummary - Error:', error);
        return this.handleApiError(error, 'getDashboardSummary');
      });
  },
  
  // Dashboard trends data
  getDashboardTrends() {
    console.log('[DEBUG] DispatchService.getDashboardTrends - Calling API endpoint: dashboard/global/enhanced');
    
    return ApiService.get('dashboard/global/enhanced')
      .then(response => {
        console.log('[DEBUG] DispatchService.getDashboardTrends - Response status:', response.status);
        console.log('[DEBUG] DispatchService.getDashboardTrends - Response success:', response.data?.success);
        
        if (response.data?.data) {
          console.log('[DEBUG] DispatchService.getDashboardTrends - Data structure:', 
            Object.keys(response.data.data));
        }
        
        return response;
      })
      .catch(error => {
        console.error('[DEBUG] DispatchService.getDashboardTrends - Error:', error);
        return this.handleApiError(error, 'getDashboardTrends');
      });
  },
  
  // Project listings
  getProjects(params = {}) {
    console.log('[DEBUG] DispatchService.getProjects - Calling API endpoint: dashboard/projects');
    console.log('[DEBUG] DispatchService.getProjects - Params:', JSON.parse(JSON.stringify(params || {})));
    
    return ApiService.get('dashboard/projects', params)
      .then(response => {
        console.log('[DEBUG] DispatchService.getProjects - Response status:', response.status);
        console.log('[DEBUG] DispatchService.getProjects - Response success:', response.data?.success);
        
        if (response.data?.data) {
          console.log('[DEBUG] DispatchService.getProjects - Data structure:', 
            Object.keys(response.data.data));
          console.log('[DEBUG] DispatchService.getProjects - Projects count:', 
            response.data.data.projects?.length || 0);
        }
        
        return response;
      })
      .catch(error => {
        console.error('[DEBUG] DispatchService.getProjects - Error:', error);
        return this.handleApiError(error, 'getProjects');
      });
  },
  
  // Project details
  getProject(projectId) {
    return ApiService.get(`dashboard/projects/${projectId}`);
  },
  
  // System alerts
  getAlerts() {
    console.log('[DEBUG] DispatchService.getAlerts - Calling API endpoint: dashboard/alerts');
    
    return ApiService.get('dashboard/alerts')
      .then(response => {
        console.log('[DEBUG] DispatchService.getAlerts - Response status:', response.status);
        console.log('[DEBUG] DispatchService.getAlerts - Response success:', response.data?.success);
        
        if (response.data?.data) {
          console.log('[DEBUG] DispatchService.getAlerts - Data structure:', 
            Object.keys(response.data.data));
          console.log('[DEBUG] DispatchService.getAlerts - Alerts count:', 
            response.data.data.alerts?.length || 0);
        }
        
        return response;
      })
      .catch(error => {
        console.error('[DEBUG] DispatchService.getAlerts - Error:', error);
        return this.handleApiError(error, 'getAlerts');
      });
  },
  
  // Data transformers
  // These help convert API data to the format expected by frontend components
  
  formatJobDetails(apiData) {
    if (!apiData) return null;
    
    return {
      job: apiData.job || {},
      visits: (apiData.visits || []).map(visit => ({
        id: visit.id,
        visitId: visit.visit_id,
        jobId: visit.job_id,
        phaseName: visit.phase_name || 'Site Visit',
        visitDate: visit.visit_date,
        status: visit.status,
        timeIn: visit.time_in,
        timeOut: visit.time_out,
        timeOnSiteMin: visit.time_on_site_min,
        revisitNeeded: visit.revisit_needed,
        workSummary: visit.work_summary || visit.work_performed?.summary,
        technicians: visit.technicians || [],
        tasks: visit.tasks || [],
        issues: visit.issues || []
      })),
      financials: {
        invoices: apiData.financials?.invoices || [],
        lineItems: apiData.financials?.line_items || []
      },
      timeline: apiData.timeline || {
        events: [],
        delays: []
      },
      analysis: apiData.analysis || {
        key_issues: [],
        outstanding_items: [],
        recommended_actions: []
      },
      metadata: apiData.metadata || {}
    };
  },
  
  formatVisitData(apiData) {
    if (!apiData) return null;
    
    return {
      visit: {
        visitId: apiData.visit_id,
        jobId: apiData.job_id,
        phaseName: apiData.phase_name || 'Site Visit',
        visitDate: apiData.visit_date,
        status: apiData.status,
        timeIn: apiData.time_in,
        timeOut: apiData.time_out,
        timeOnSiteMin: apiData.time_on_site_min,
        revisitNeeded: apiData.revisit_needed,
        workSummary: apiData.work_summary || apiData.work_performed?.summary
      },
      technicians: apiData.technicians || [],
      tasks: apiData.tasks || [],
      issues: apiData.issues || []
    };
  }
}; 