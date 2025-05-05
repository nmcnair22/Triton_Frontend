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
  
  // Get linked tickets for a specific dispatch
  getLinkedTickets(dispatchId) {
    console.log('DispatchService.getLinkedTickets - ID:', dispatchId);
    return ApiService.get(`dispatch-reports/chains/${dispatchId}`, { record_type: 'dispatch' })
      .catch(error => this.handleApiError(error, 'getLinkedTickets'));
  }
}; 