import axios from 'axios';
import { AuthService } from '../auth/AuthService';

// Helper function to properly join URL parts
function joinUrl(baseUrl, resource) {
  // Remove trailing slash from baseUrl and leading slash from resource
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanResource = resource.replace(/^\//, '');
  return `${cleanBase}/${cleanResource}`;
}

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor for authentication
apiClient.interceptors.request.use(
  config => {
    const token = AuthService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor for handling unauthorized responses
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      AuthService.clearSession();
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Debug log to see the base URL configuration
console.log('API Service BaseURL:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api');

export const ApiService = {
  // Generic API methods
  get(resource, params) {
    // Clean resource path and construct proper URL
    const cleanResource = resource.replace(/^\//, '');
    const fullUrl = joinUrl(apiClient.defaults.baseURL, cleanResource);
    console.log('ApiService.get - Full URL:', fullUrl, params);
    
    return apiClient.get(cleanResource, { params })
      .then(response => {
        console.log(`ApiService.get - Response for ${cleanResource}:`, {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        });
        return response;
      })
      .catch(error => {
        console.error(`ApiService.get - Error for ${cleanResource}:`, error);
        console.error('Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        throw error;
      });
  },
  
  post(resource, data) {
    // Clean resource path and construct proper URL
    const cleanResource = resource.replace(/^\//, '');
    const fullUrl = joinUrl(apiClient.defaults.baseURL, cleanResource);
    console.log('ApiService.post - Full URL:', fullUrl, data);
    
    return apiClient.post(cleanResource, data)
      .then(response => {
        console.log(`ApiService.post - Response for ${cleanResource}:`, {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        });
        return response;
      })
      .catch(error => {
        console.error(`ApiService.post - Error for ${cleanResource}:`, error);
        console.error('Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        throw error;
      });
  },
  
  put(resource, data) {
    // Clean resource path and construct proper URL
    const cleanResource = resource.replace(/^\//, '');
    const fullUrl = joinUrl(apiClient.defaults.baseURL, cleanResource);
    console.log('ApiService.put - Full URL:', fullUrl, data);
    
    return apiClient.put(cleanResource, data)
      .then(response => {
        console.log(`ApiService.put - Response for ${cleanResource}:`, {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        });
        return response;
      })
      .catch(error => {
        console.error(`ApiService.put - Error for ${cleanResource}:`, error);
        console.error('Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        throw error;
      });
  },

  patch(resource, data) {
    // Clean resource path and construct proper URL
    const cleanResource = resource.replace(/^\//, '');
    const fullUrl = joinUrl(apiClient.defaults.baseURL, cleanResource);
    console.log('ApiService.patch - Full URL:', fullUrl, data);
    
    return apiClient.patch(cleanResource, data)
      .then(response => {
        console.log(`ApiService.patch - Response for ${cleanResource}:`, {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        });
        return response;
      })
      .catch(error => {
        console.error(`ApiService.patch - Error for ${cleanResource}:`, error);
        console.error('Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        throw error;
      });
  },
  
  delete(resource) {
    // Clean resource path and construct proper URL
    const cleanResource = resource.replace(/^\//, '');
    const fullUrl = joinUrl(apiClient.defaults.baseURL, cleanResource);
    console.log('ApiService.delete - Full URL:', fullUrl);
    
    return apiClient.delete(cleanResource)
      .then(response => {
        console.log(`ApiService.delete - Response for ${cleanResource}:`, {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        });
        return response;
      })
      .catch(error => {
        console.error(`ApiService.delete - Error for ${cleanResource}:`, error);
        console.error('Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        throw error;
      });
  },
  
  // Custom methods
  // Add specific API methods related to your domain
};

// Visit-specific API services
export const VisitService = {
  // Get all visits with optional filtering
  getVisits(params) {
    return ApiService.get('visits', params);
  },
  
  // Get a specific visit by ID
  getVisit(id) {
    return ApiService.get(`visits/${id}`);
  },
  
  // Get visit timeline
  getVisitTimeline(id) {
    return ApiService.get(`visits/${id}/timeline`);
  },
  
  // Add timeline event
  addTimelineEvent(id, event) {
    return ApiService.post(`visits/${id}/timeline`, event);
  },
  
  // Get visit analytics
  getVisitAnalytics(id) {
    return ApiService.get(`visits/${id}/analytics`);
  },
  
  // Get visit statistics
  getVisitStats(params = {}) {
    return ApiService.get('visits/stats/overview', params);
  },
  
  // Get visit trends
  getVisitTrends(params = {}) {
    return ApiService.get('visits/stats/trends', params);
  },
  
  // Update visit status
  updateVisitStatus(id, status, notes = '') {
    return ApiService.patch(`visits/${id}`, { status, notes });
  },
  
  // Assign technician to visit
  assignTechnician(id, technicianId) {
    return ApiService.patch(`visits/${id}/assign-technician`, { technician_id: technicianId });
  },
  
  // Create a new visit
  createVisit(visit) {
    return ApiService.post('visits', visit);
  },
  
  // Update an existing visit
  updateVisit(visit) {
    return ApiService.put(`visits/${visit.id}`, visit);
  },
  
  // Delete a visit
  deleteVisit(id) {
    return ApiService.delete(`visits/${id}`);
  },
  
  // Batch operations
  batchUpdateStatus(visitIds, status) {
    return ApiService.patch('visits/batch/update-status', { visit_ids: visitIds, status });
  },
  
  // Export visits
  exportVisits(params = {}) {
    return ApiService.post('visits/export/bulk', params);
  }
};

// Invoice-specific API services
export const InvoiceService = {
  // Get all invoices with optional filtering
  getInvoices(params) {
    return ApiService.get('invoices', params);
  },
  
  // Get a specific invoice by ID
  getInvoice(id) {
    return ApiService.get(`invoices/${id}`);
  },
  
  // Get customer invoices with optional filtering
  getCustomerInvoices(filterConditions, params = {}) {
    // Use the provided filter conditions directly
    return ApiService.get(`accounting/sales-invoices`, { 
      ...params,
      filter: filterConditions
    });
  },
  
  // Get a specific sales invoice by ID
  getSalesInvoice(id) {
    return ApiService.get(`accounting/sales-invoices/${id}`);
  },
  
  // Get line items for a specific sales invoice
  getSalesInvoiceLines(id) {
    return ApiService.get(`accounting/sales-invoices/${id}/lines`);
  },
  
  // Get enriched line items for interactive invoice
  getEnrichedSalesInvoiceLines(documentNumber) {
    return ApiService.post('accounting/sales-invoice-lines', {
      document_number: documentNumber
    });
  },
  
  // Create a new invoice
  createInvoice(invoice) {
    return ApiService.post('invoices', invoice);
  },
  
  // Update an existing invoice
  updateInvoice(invoice) {
    return ApiService.put(`invoices/${invoice.id}`, invoice);
  },
  
  // Delete an invoice
  deleteInvoice(id) {
    return ApiService.delete(`invoices/${id}`);
  },
  
  // Get available templates for a client and optional invoice number
  getAvailableTemplates(clientId, invoiceNumber = null) {
    const params = { client_id: clientId };
    if (invoiceNumber) {
      params.invoice_number = invoiceNumber;
    }
    console.log('getAvailableTemplates API call with params:', params);
    console.log('API URL:', joinUrl(apiClient.defaults.baseURL, 'invoice-templates/available'));
    
    return ApiService.get('invoice-templates/available', params)
      .then(response => {
        console.log('getAvailableTemplates raw response:', response);
        return response;
      })
      .catch(error => {
        console.error('getAvailableTemplates API error:', error);
        console.error('Error config:', error.config);
        if (error.response) {
          console.error('Error response:', error.response.data);
        }
        throw error;
      });
  },
  
  // Generate a document from a template for an invoice
  generateTemplate(invoiceNumber, templateId) {
    console.log('ApiService: generateTemplate called with:', { invoiceNumber, templateId });
    console.log('ApiService: POST URL:', joinUrl(apiClient.defaults.baseURL, 'invoice-templates/generate'));
    console.log('ApiService: POST data:', { invoice_number: invoiceNumber, template_id: templateId });
    
    return ApiService.post('invoice-templates/generate', {
      invoice_number: invoiceNumber,
      template_id: templateId
    })
    .then(response => {
      console.log('ApiService: generateTemplate raw response:', response);
      console.log('ApiService: Response structure:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : []
      });
      
      // If the response is a successful queue job instead of immediate results
      if (response.data && response.status === 202) {
        console.log('ApiService: Template generation queued successfully:', response.data);
        // Modify the response to maintain compatibility with existing code
        if (!response.data.success) {
          response.data.success = true;
        }
        if (!response.data.data) {
          response.data.data = { queued: true, job_id: response.data.job_id || 'unknown' };
        }
      }
      
      return response;
    })
    .catch(error => {
      console.error('ApiService: Error in generateTemplate:', error);
      console.error('ApiService: Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    });
  },
  
  // Get generated files for an invoice
  getGeneratedFiles(invoiceNumber) {
    return ApiService.get(`invoice-templates/files/${invoiceNumber}`);
  },
  
  // Download a generated file
  downloadGeneratedFile(jobId, fileType = 'pdf', subtype = null) {
    // Get the current authentication token
    const token = AuthService.getToken();
    // Remove 'Bearer ' prefix if present
    const tokenValue = token ? token.replace('Bearer ', '') : '';
    const tokenParam = tokenValue ? `?token=${tokenValue}` : '';
    
    let url = `invoice-templates/download/${jobId}/${fileType}`;
    
    // If subtype is provided (for PDF files like 'summary', 'consolidated', etc.), add it to the URL
    if (subtype) {
      url += `/${subtype}`;
    }
    
    // Add token parameter
    url += tokenParam;
    
    console.log('Download URL:', url);
    
    // Create a full URL with the base URL
    const fullUrl = joinUrl(apiClient.defaults.baseURL, url);
    
    // Create a simple anchor element and click it
    // This is the most reliable way to trigger a browser download with the original filename
    const a = document.createElement('a');
    a.href = fullUrl;
    a.target = '_blank'; // This helps with popup blockers
    a.rel = 'noopener noreferrer';
    
    // Append to body and click
    document.body.appendChild(a);
    a.click();
    
    // Remove after a short delay
    setTimeout(() => {
      document.body.removeChild(a);
    }, 100);
    
    return Promise.resolve(true);
  },
  
  // Get file preview URL
  getFilePreviewUrl(fileId, fileType = 'pdf', subtype = null) {
    // Get the current authentication token
    const token = AuthService.getToken();
    // Remove 'Bearer ' prefix if present
    const tokenValue = token ? token.replace('Bearer ', '') : '';
    const tokenParam = tokenValue ? `?token=${tokenValue}` : '';
    
    console.log('Creating preview URL with token param:', {
      fileId,
      fileType,
      subtype,
      hasToken: !!tokenValue
    });
    
    let url = '';
    
    // Check if fileId contains our composite format
    if (typeof fileId === 'string' && fileId.includes('_')) {
      const parts = fileId.split('_');
      if (parts.length >= 2) {
        // Extract jobId and file type from the composite ID
        const jobId = parts[0];
        const type = parts[1] || fileType;
        
        // For PDF files with subtypes
        if (type === 'pdf' && parts.length > 2) {
          const subtype = parts.slice(2).join('_');
          url = joinUrl(apiClient.defaults.baseURL, `invoice-templates/preview/${jobId}/${type}/${subtype}${tokenParam}`);
        }
        // For Excel files with index
        else if (type === 'excel' && parts.length > 2) {
          const index = parts.slice(2).join('_');
          url = joinUrl(apiClient.defaults.baseURL, `invoice-templates/preview/${jobId}/${type}/${index}${tokenParam}`);
        }
        else {
          url = joinUrl(apiClient.defaults.baseURL, `invoice-templates/preview/${jobId}/${type}${tokenParam}`);
        }
      }
      else {
        // Fallback to original behavior for compatibility
        url = joinUrl(apiClient.defaults.baseURL, `invoice-templates/preview/${fileId}${tokenParam}`);
      }
    }
    else {
      // Fallback to original behavior for compatibility
      url = joinUrl(apiClient.defaults.baseURL, `invoice-templates/preview/${fileId}${tokenParam}`);
    }
    
    console.log('Preview URL constructed:', url);
    return url;
  },
  
  // Get all documents for a specific customer
  getCustomerDocuments(customerNumber, limit = 50, offset = 0) {
    return ApiService.get(`invoice-templates/customer-documents?customer_number=${customerNumber}&limit=${limit}&offset=${offset}`);
  },
  
  // Get all documents for a specific invoice
  getInvoiceDocuments(invoiceNumber) {
    return ApiService.get(`invoice-templates/invoice-documents?invoice_number=${invoiceNumber}`);
  }
}; 