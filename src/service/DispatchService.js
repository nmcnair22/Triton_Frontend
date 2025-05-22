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
  
  // === GlobalActivityView Endpoints ===

  // Get global dashboard summary
  getDashboardGlobal() {
    console.log('[DEBUG] DispatchService.getDashboardGlobal - Calling API endpoint: dashboard/global');
    
    return ApiService.get('dashboard/global')
      .then(response => {
        console.log('[DEBUG] DispatchService.getDashboardGlobal - Response status:', response.status);
        console.log('[DEBUG] DispatchService.getDashboardGlobal - Response success:', response.data?.success);
        
        if (response.data?.data) {
          console.log('[DEBUG] DispatchService.getDashboardGlobal - Data structure:', 
            Object.keys(response.data.data));
        }
        
        return response;
      })
      .catch(error => {
        console.error('[DEBUG] DispatchService.getDashboardGlobal - Error:', error);
        return this.handleApiError(error, 'getDashboardGlobal');
      });
  },

  // Get turnups data from new API endpoint
  getTurnups(params = {}) {
    console.log('[DEBUG] DispatchService.getTurnups - Calling API endpoint: dispatch-reports/turnups');
    console.log('[DEBUG] DispatchService.getTurnups - Params:', JSON.parse(JSON.stringify(params || {})));
    
    // Set default date range to last 30 days if not specified
    if (!params.date_from) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      params.date_from = this.formatDateParam(thirtyDaysAgo);
      console.log('[DEBUG] DispatchService.getTurnups - Setting default date_from to 30 days ago:', params.date_from);
    }
    
    // Set default end date to today if not specified
    if (!params.date_to) {
      const today = new Date();
      params.date_to = this.formatDateParam(today);
      console.log('[DEBUG] DispatchService.getTurnups - Setting default date_to to today:', params.date_to);
    }
    
    return ApiService.get('dispatch-reports/turnups', params)
      .then(response => {
        console.log('[DEBUG] DispatchService.getTurnups - Response status:', response.status);
        console.log('[DEBUG] DispatchService.getTurnups - Response success:', response.data?.success);
        
        if (response.data?.data) {
          console.log('[DEBUG] DispatchService.getTurnups - Data received:', 
            response.data.data.length || 0, 'records');
        }
        
        return response;
      })
      .catch(error => {
        console.error('[DEBUG] DispatchService.getTurnups - Error:', error);
        return this.handleApiError(error, 'getTurnups');
      });
  },

  // Get enhanced global dashboard
  getDashboardGlobalEnhanced(params = {}) {
    console.log('[DEBUG] DispatchService.getDashboardGlobalEnhanced - Calling API endpoint: dashboard/global/enhanced');
    console.log('[DEBUG] DispatchService.getDashboardGlobalEnhanced - Params:', JSON.parse(JSON.stringify(params || {})));
    
    return ApiService.get('dashboard/global/enhanced', params)
      .then(response => {
        console.log('[DEBUG] DispatchService.getDashboardGlobalEnhanced - Response status:', response.status);
        console.log('[DEBUG] DispatchService.getDashboardGlobalEnhanced - Response success:', response.data?.success);
        
        if (response.data?.data) {
          console.log('[DEBUG] DispatchService.getDashboardGlobalEnhanced - Data structure:', 
            Object.keys(response.data.data));
        }
        
        return response;
      })
      .catch(error => {
        console.log('[DEBUG] DispatchService.getDashboardGlobalEnhanced - Error:', error);
        return this.handleApiError(error, 'getDashboardGlobalEnhanced');
      });
  },

  // Get time-series metrics for KPI cards
  getDashboardMetrics(days = 30) {
    console.log('[DEBUG] DispatchService.getDashboardMetrics - Calling API endpoint: dashboard/metrics');
    console.log('[DEBUG] DispatchService.getDashboardMetrics - Params:', { days });
    
    return ApiService.get('dashboard/metrics', { days })
      .then(response => {
        console.log('[DEBUG] DispatchService.getDashboardMetrics - Response status:', response.status);
        console.log('[DEBUG] DispatchService.getDashboardMetrics - Response success:', response.data?.success);
        
        if (response.data?.data) {
          console.log('[DEBUG] DispatchService.getDashboardMetrics - Data structure:', 
            Object.keys(response.data.data));
        }
        
        return response;
      })
      .catch(error => {
        console.error('[DEBUG] DispatchService.getDashboardMetrics - Error:', error);
        return this.handleApiError(error, 'getDashboardMetrics');
      });
  },

  // Get visits with filter support
  getVisits(params = {}) {
    console.log('[DEBUG] DispatchService.getVisits - Calling API endpoint: visits/list');
    console.log('[DEBUG] DispatchService.getVisits - Params:', JSON.parse(JSON.stringify(params || {})));
    
    return ApiService.get('visits/list', params)
      .then(response => {
        console.log('[DEBUG] DispatchService.getVisits - Response status:', response.status);
        console.log('[DEBUG] DispatchService.getVisits - Response success:', response.data?.success);
        
        if (response.data?.data) {
          console.log('[DEBUG] DispatchService.getVisits - Data structure:', 
            Object.keys(response.data.data));
          console.log('[DEBUG] DispatchService.getVisits - Visits count:', 
            response.data.data.data?.length || 0);
        }
        
        return response;
      })
      .catch(error => {
        console.log('[DEBUG] DispatchService.getVisits - Error:', error);
        return this.handleApiError(error, 'getVisits');
      });
  },

  // Get technician performance data
  getTechnicians(params = {}) {
    console.log('[DEBUG] DispatchService.getTechnicians - Calling API endpoint: dashboard/technicians');
    console.log('[DEBUG] DispatchService.getTechnicians - Params:', JSON.parse(JSON.stringify(params || {})));
    
    return ApiService.get('dashboard/technicians', params)
      .then(response => {
        console.log('[DEBUG] DispatchService.getTechnicians - Response status:', response.status);
        console.log('[DEBUG] DispatchService.getTechnicians - Response success:', response.data?.success);
        
        if (response.data?.data) {
          console.log('[DEBUG] DispatchService.getTechnicians - Data structure:', 
            Object.keys(response.data.data));
          console.log('[DEBUG] DispatchService.getTechnicians - Technicians count:', 
            response.data.data.data?.length || 0);
        }
        
        return response;
      })
      .catch(error => {
        console.error('[DEBUG] DispatchService.getTechnicians - Error:', error);
        return this.handleApiError(error, 'getTechnicians');
      });
  },

  // === ProjectsView Endpoints ===

  // Get projects list with filtering and pagination
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
            response.data.data.data?.length || 0);
        }
        
        return response;
      })
      .catch(error => {
        console.error('[DEBUG] DispatchService.getProjects - Error:', error);
        return this.handleApiError(error, 'getProjects');
      });
  },

  // === ProjectDetailsView Endpoints ===

  // Get project dashboard summary
  getProjectById(projectId) {
    console.log('[DEBUG] DispatchService.getProjectById - Calling API endpoint: dashboard/projects/' + projectId);
    
    return ApiService.get(`dashboard/projects/${projectId}`)
      .then(response => {
        console.log('[DEBUG] DispatchService.getProjectById - Response status:', response.status);
        console.log('[DEBUG] DispatchService.getProjectById - Response success:', response.data?.success);
        
        if (response.data?.data) {
          console.log('[DEBUG] DispatchService.getProjectById - Data structure:', 
            Object.keys(response.data.data));
        }
        
        if (response.data && response.data.success) {
          return response.data.data.project;
        }
        throw new Error('Failed to load project details');
      })
      .catch(error => {
        console.error('[DEBUG] DispatchService.getProjectById - Error:', error);
        return this.handleApiError(error, 'getProjectById');
      });
  },

  // Get jobs for a specific project
  fetchJobsByProject(projectId, params = {}) {
    console.log('[DEBUG] DispatchService.fetchJobsByProject - Calling API endpoint: dashboard/projects/' + projectId + '/jobs');
    console.log('[DEBUG] DispatchService.fetchJobsByProject - Params:', JSON.parse(JSON.stringify(params || {})));
    
    return ApiService.get(`dashboard/projects/${projectId}/jobs`, params)
      .then(response => {
        console.log('[DEBUG] DispatchService.fetchJobsByProject - Response status:', response.status);
        console.log('[DEBUG] DispatchService.fetchJobsByProject - Response success:', response.data?.success);
        
        if (response.data?.data) {
          console.log('[DEBUG] DispatchService.fetchJobsByProject - Data structure:', 
            Object.keys(response.data.data));
          console.log('[DEBUG] DispatchService.fetchJobsByProject - Jobs count:', 
            response.data.data.data?.length || 0);
        }
        
        if (response.data && response.data.success) {
          return response.data.data.data || [];
        }
        throw new Error('Failed to load project jobs');
      })
      .catch(error => {
        console.error('[DEBUG] DispatchService.fetchJobsByProject - Error:', error);
        return this.handleApiError(error, 'fetchJobsByProject');
      });
  },

  // Get project timeline milestones
  getProjectTimeline(projectId) {
    console.log('[DEBUG] DispatchService.getProjectTimeline - Calling API endpoint: dashboard/projects/' + projectId + '/timeline');
    
    return ApiService.get(`dashboard/projects/${projectId}/timeline`)
      .then(response => {
        console.log('[DEBUG] DispatchService.getProjectTimeline - Response status:', response.status);
        console.log('[DEBUG] DispatchService.getProjectTimeline - Response success:', response.data?.success);
        
        if (response.data?.data) {
          console.log('[DEBUG] DispatchService.getProjectTimeline - Data structure:', 
            Object.keys(response.data.data));
        }
        
        return response;
      })
      .catch(error => {
        console.error('[DEBUG] DispatchService.getProjectTimeline - Error:', error);
        return this.handleApiError(error, 'getProjectTimeline');
      });
  },

  // Get project priority issues
  getProjectPriorityIssues(projectId, params = {}) {
    console.log('[DEBUG] DispatchService.getProjectPriorityIssues - Calling API endpoint: dashboard/projects/' + projectId + '/priority-issues');
    console.log('[DEBUG] DispatchService.getProjectPriorityIssues - Params:', JSON.parse(JSON.stringify(params || {})));
    
    return ApiService.get(`dashboard/projects/${projectId}/priority-issues`, params)
      .then(response => {
        console.log('[DEBUG] DispatchService.getProjectPriorityIssues - Response status:', response.status);
        console.log('[DEBUG] DispatchService.getProjectPriorityIssues - Response success:', response.data?.success);
        
        if (response.data?.data) {
          console.log('[DEBUG] DispatchService.getProjectPriorityIssues - Data structure:', 
            Object.keys(response.data.data));
        }
        
        return response;
      })
      .catch(error => {
        console.error('[DEBUG] DispatchService.getProjectPriorityIssues - Error:', error);
        return this.handleApiError(error, 'getProjectPriorityIssues');
      });
  },

  // === JobsView Endpoints ===

  // Get jobs list with filtering and pagination
  getJobs(params = {}) {
    console.log('[DEBUG] DispatchService.getJobs - Calling API endpoint: dashboard/jobs');
    console.log('[DEBUG] DispatchService.getJobs - Params:', JSON.parse(JSON.stringify(params || {})));
    
    return ApiService.get('dashboard/jobs', params)
      .then(response => {
        console.log('[DEBUG] DispatchService.getJobs - Response status:', response.status);
        console.log('[DEBUG] DispatchService.getJobs - Response success:', response.data?.success);
        
        if (response.data?.data) {
          console.log('[DEBUG] DispatchService.getJobs - Data structure:', 
            Object.keys(response.data.data));
          console.log('[DEBUG] DispatchService.getJobs - Jobs count:', 
            response.data.data.data?.length || 0);
        }
        
        return response;
      })
      .catch(error => {
        console.error('[DEBUG] DispatchService.getJobs - Error:', error);
        return this.handleApiError(error, 'getJobs');
      });
  },

  // Get job statistics for KPI metrics
  getJobStatistics() {
    console.log('[DEBUG] DispatchService.getJobStatistics - Calling API endpoint: dashboard/jobs/statistics');
    
    return ApiService.get('dashboard/jobs/statistics')
      .then(response => {
        console.log('[DEBUG] DispatchService.getJobStatistics - Response status:', response.status);
        console.log('[DEBUG] DispatchService.getJobStatistics - Response success:', response.data?.success);
        
        if (response.data?.data) {
          console.log('[DEBUG] DispatchService.getJobStatistics - Data structure:', 
            Object.keys(response.data.data));
        }
        
        return response;
      })
      .catch(error => {
        console.error('[DEBUG] DispatchService.getJobStatistics - Error:', error);
        return this.handleApiError(error, 'getJobStatistics');
      });
  },

  // === JobDetailsView Endpoints ===

  // Get job summary dashboard - this is implemented earlier (getJobDetails)

  // Get job timeline events
  getJobTimeline(jobId) {
    console.log('[DEBUG] DispatchService.getJobTimeline - Calling API endpoint: dashboard/jobs/' + jobId + '/timeline');
    
    return ApiService.get(`dashboard/jobs/${jobId}/timeline`)
      .then(response => {
        console.log('[DEBUG] DispatchService.getJobTimeline - Response status:', response.status);
        console.log('[DEBUG] DispatchService.getJobTimeline - Response success:', response.data?.success);
        
        if (response.data?.data) {
          console.log('[DEBUG] DispatchService.getJobTimeline - Data structure:', 
            Object.keys(response.data.data));
        }
        
        return response;
      })
      .catch(error => {
        console.error('[DEBUG] DispatchService.getJobTimeline - Error:', error);
        return this.handleApiError(error, 'getJobTimeline');
      });
  },

  // Get financial data for a job
  getJobFinancials(jobId) {
    console.log('[DEBUG] DispatchService.getJobFinancials - Calling API endpoint: dashboard/jobs/' + jobId + '/financials');
    
    return ApiService.get(`dashboard/jobs/${jobId}/financials`)
      .then(response => {
        console.log('[DEBUG] DispatchService.getJobFinancials - Response status:', response.status);
        console.log('[DEBUG] DispatchService.getJobFinancials - Response success:', response.data?.success);
        
        if (response.data?.data) {
          console.log('[DEBUG] DispatchService.getJobFinancials - Data structure:', 
            Object.keys(response.data.data));
        }
        
        return response;
      })
      .catch(error => {
        console.error('[DEBUG] DispatchService.getJobFinancials - Error:', error);
        return this.handleApiError(error, 'getJobFinancials');
      });
  },

  // Get issues for a job
  getJobIssues(jobId, params = {}) {
    console.log('[DEBUG] DispatchService.getJobIssues - Calling API endpoint: dashboard/jobs/' + jobId + '/issues');
    console.log('[DEBUG] DispatchService.getJobIssues - Params:', JSON.parse(JSON.stringify(params || {})));
    
    return ApiService.get(`dashboard/jobs/${jobId}/issues`, params)
      .then(response => {
        console.log('[DEBUG] DispatchService.getJobIssues - Response status:', response.status);
        console.log('[DEBUG] DispatchService.getJobIssues - Response success:', response.data?.success);
        
        if (response.data?.data) {
          console.log('[DEBUG] DispatchService.getJobIssues - Data structure:', 
            Object.keys(response.data.data));
          console.log('[DEBUG] DispatchService.getJobIssues - Issues count:', 
            response.data.data.data?.length || 0);
        }
        
        return response;
      })
      .catch(error => {
        console.error('[DEBUG] DispatchService.getJobIssues - Error:', error);
        return this.handleApiError(error, 'getJobIssues');
      });
  },

  // Get complete job data (all in one request)
  getCompleteJobData(jobId) {
    console.log('[DEBUG] DispatchService.getCompleteJobData - Calling API endpoint: dashboard/jobs/getCompleteJobData/' + jobId);
    
    return ApiService.get(`dashboard/jobs/getCompleteJobData/${jobId}`)
      .then(response => {
        console.log('[DEBUG] DispatchService.getCompleteJobData - Response status:', response.status);
        console.log('[DEBUG] DispatchService.getCompleteJobData - Response success:', response.data?.success);
        
        if (response.data?.data) {
          console.log('[DEBUG] DispatchService.getCompleteJobData - Data structure:', 
            Object.keys(response.data.data));
        }
        
        return response;
      })
      .catch(error => {
        console.error('[DEBUG] DispatchService.getCompleteJobData - Error:', error);
        return this.handleApiError(error, 'getCompleteJobData');
      });
  },

  // Get materials used in a job - implemented earlier (getJobMaterials)

  // === VisitDetailsView Endpoints ===

  // Get visit details - implemented earlier (getVisit)

  // Get visit by ID returning promise of data not response
  getVisitById(visitId) {
    console.log('[DEBUG] DispatchService.getVisitById - Calling API endpoint: visits/' + visitId);
    
    return ApiService.get(`visits/${visitId}`)
      .then(response => {
        console.log('[DEBUG] DispatchService.getVisitById - Response status:', response.status);
        console.log('[DEBUG] DispatchService.getVisitById - Response success:', response.data?.success);
        
        if (response.data?.data) {
          console.log('[DEBUG] DispatchService.getVisitById - Data structure:', 
            Object.keys(response.data.data));
        }
        
        if (response.data && response.data.success) {
          return response.data.data;
        }
        throw new Error('Failed to load visit details');
      })
      .catch(error => {
        console.error('[DEBUG] DispatchService.getVisitById - Error:', error);
        return this.handleApiError(error, 'getVisitById');
      });
  },

  // Enhanced visit timeline with debug logs
  getVisitTimeline(visitId) {
    console.log('[DEBUG] DispatchService.getVisitTimeline - Calling API endpoint: visits/' + visitId + '/timeline');
    
    return ApiService.get(`visits/${visitId}/timeline`)
      .then(response => {
        console.log('[DEBUG] DispatchService.getVisitTimeline - Response status:', response.status);
        console.log('[DEBUG] DispatchService.getVisitTimeline - Response success:', response.data?.success);
        
        if (response.data?.data) {
          console.log('[DEBUG] DispatchService.getVisitTimeline - Data structure:', 
            Object.keys(response.data.data));
        }
        
        return response;
      })
      .catch(error => {
        console.error('[DEBUG] DispatchService.getVisitTimeline - Error:', error);
        return this.handleApiError(error, 'getVisitTimeline');
      });
  },

  // Enhanced work performance with debug logs
  getVisitWorkPerformance(visitId) {
    console.log('[DEBUG] DispatchService.getVisitWorkPerformance - Calling API endpoint: visits/' + visitId + '/work-performance');
    
    return ApiService.get(`visits/${visitId}/work-performance`)
      .then(response => {
        console.log('[DEBUG] DispatchService.getVisitWorkPerformance - Response status:', response.status);
        console.log('[DEBUG] DispatchService.getVisitWorkPerformance - Response success:', response.data?.success);
        
        if (response.data?.data) {
          console.log('[DEBUG] DispatchService.getVisitWorkPerformance - Data structure:', 
            Object.keys(response.data.data));
        }
        
        return response;
      })
      .catch(error => {
        console.error('[DEBUG] DispatchService.getVisitWorkPerformance - Error:', error);
        return this.handleApiError(error, 'getVisitWorkPerformance');
      });
  },

  // Enhanced visit materials with debug logs
  getVisitMaterials(visitId) {
    console.log('[DEBUG] DispatchService.getVisitMaterials - Calling API endpoint: visits/' + visitId + '/materials');
    
    return ApiService.get(`visits/${visitId}/materials`)
      .then(response => {
        console.log('[DEBUG] DispatchService.getVisitMaterials - Response status:', response.status);
        console.log('[DEBUG] DispatchService.getVisitMaterials - Response success:', response.data?.success);
        
        if (response.data?.data) {
          console.log('[DEBUG] DispatchService.getVisitMaterials - Data structure:', 
            Object.keys(response.data.data));
        }
        
        return response;
      })
      .catch(error => {
        console.error('[DEBUG] DispatchService.getVisitMaterials - Error:', error);
        return this.handleApiError(error, 'getVisitMaterials');
      });
  },

  // Get visit relationships (job, project connections)
  getVisitRelationships(visitId) {
    console.log('[DEBUG] DispatchService.getVisitRelationships - Calling API endpoint: visits/' + visitId + '/relationships');
    
    return ApiService.get(`visits/${visitId}/relationships`)
      .then(response => {
        console.log('[DEBUG] DispatchService.getVisitRelationships - Response status:', response.status);
        console.log('[DEBUG] DispatchService.getVisitRelationships - Response success:', response.data?.success);
        
        if (response.data?.data) {
          console.log('[DEBUG] DispatchService.getVisitRelationships - Data structure:', 
            Object.keys(response.data.data));
        }
        
        return response;
      })
      .catch(error => {
        console.error('[DEBUG] DispatchService.getVisitRelationships - Error:', error);
        return this.handleApiError(error, 'getVisitRelationships');
      });
  },

  // Enhanced key interactions with debug logs
  getVisitKeyInteractions(visitId) {
    console.log('[DEBUG] DispatchService.getVisitKeyInteractions - Calling API endpoint: visits/' + visitId + '/key-interactions');
    
    return ApiService.get(`visits/${visitId}/key-interactions`)
      .then(response => {
        console.log('[DEBUG] DispatchService.getVisitKeyInteractions - Response status:', response.status);
        console.log('[DEBUG] DispatchService.getVisitKeyInteractions - Response success:', response.data?.success);
        
        if (response.data?.data) {
          console.log('[DEBUG] DispatchService.getVisitKeyInteractions - Data structure:', 
            Object.keys(response.data.data));
        }
        
        return response;
      })
      .catch(error => {
        console.error('[DEBUG] DispatchService.getVisitKeyInteractions - Error:', error);
        return this.handleApiError(error, 'getVisitKeyInteractions');
      });
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