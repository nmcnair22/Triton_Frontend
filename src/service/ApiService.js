import axios from 'axios';
import { AuthService } from '../auth/AuthService';

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor for authentication
apiClient.interceptors.request.use(config => {
  const token = AuthService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

export const ApiService = {
  // Generic API methods
  get(resource, params) {
    return apiClient.get(resource, { params });
  },
  
  post(resource, data) {
    return apiClient.post(resource, data);
  },
  
  put(resource, data) {
    return apiClient.put(resource, data);
  },
  
  delete(resource) {
    return apiClient.delete(resource);
  },
  

  
  // Custom methods
  // Add specific API methods related to your domain
};

// Invoice-specific API services
export const InvoiceService = {
  // Get all invoices with optional filtering
  getInvoices(params) {
    return ApiService.get('/invoices', params);
  },
  
  // Get a specific invoice by ID
  getInvoice(id) {
    return ApiService.get(`/invoices/${id}`);
  },
  
  // Get customer invoices with optional filtering
  getCustomerInvoices(filterConditions, params = {}) {
    // Use the provided filter conditions directly
    return ApiService.get(`/accounting/sales-invoices`, { 
      ...params,
      filter: filterConditions
    });
  },
  
  // Get a specific sales invoice by ID
  getSalesInvoice(id) {
    return ApiService.get(`/accounting/sales-invoices/${id}`);
  },
  
  // Get line items for a specific sales invoice
  getSalesInvoiceLines(id) {
    return ApiService.get(`/accounting/sales-invoices/${id}/lines`);
  },
  
  // Get enriched line items for interactive invoice
  getEnrichedSalesInvoiceLines(documentNumber) {
    return ApiService.post('/accounting/sales-invoice-lines', {
      document_number: documentNumber
    });
  },
  
  // Create a new invoice
  createInvoice(invoice) {
    return ApiService.post('/invoices', invoice);
  },
  
  // Update an existing invoice
  updateInvoice(invoice) {
    return ApiService.put(`/invoices/${invoice.id}`, invoice);
  },
  
  // Delete an invoice
  deleteInvoice(id) {
    return ApiService.delete(`/invoices/${id}`);
  },
  
  // Get available templates for a client and optional invoice number
  getAvailableTemplates(clientId, invoiceNumber = null) {
    const params = { client_id: clientId };
    if (invoiceNumber) {
      params.invoice_number = invoiceNumber;
    }
    console.log('getAvailableTemplates API call with params:', params);
    console.log('API URL:', `${apiClient.defaults.baseURL}/invoice-templates/available`);
    
    return ApiService.get('/invoice-templates/available', params)
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
  generateTemplate(invoiceNumber, templateId, options = {}) {
    const payload = {
      invoice_number: invoiceNumber,
      template_id: templateId
    };
    
    // Add options if provided
    if (options && Object.keys(options).length > 0) {
      payload.options = options;
    }
    
    // Debug logging
    console.log('ApiService.generateTemplate - Sending payload:', payload);
    
    return ApiService.post('/invoice-templates/generate', payload);
  },
  
  // Get generated files for an invoice
  getGeneratedFiles(invoiceNumber) {
    return ApiService.get(`/invoice-templates/files/${invoiceNumber}`);
  },
  
  // Download a generated file
  downloadGeneratedFile(jobId, fileType = 'pdf', subtype = null) {
    // Get the current authentication token
    const token = AuthService.getToken();
    // Remove 'Bearer ' prefix if present
    const tokenValue = token ? token.replace('Bearer ', '') : '';
    const tokenParam = tokenValue ? `?token=${tokenValue}` : '';
    
    let url = `/invoice-templates/download/${jobId}/${fileType}`;
    
    // If subtype is provided (for PDF files like 'summary', 'consolidated', etc.), add it to the URL
    if (subtype) {
      url += `/${subtype}`;
    }
    
    // Add token parameter
    url += tokenParam;
    
    console.log('Download URL:', url);
    
    // Create a full URL with the base URL
    const fullUrl = `${apiClient.defaults.baseURL}${url}`;
    
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
    
    // Fallback: if AuthService doesn't return a token, try localStorage directly
    const fallbackToken = token || localStorage.getItem('auth_token');
    
    // Enhanced debug logging for production troubleshooting
    console.log('🔍 getFilePreviewUrl Debug:', {
      fileId,
      fileType,
      subtype,
      rawToken: token,
      fallbackToken: fallbackToken,
      tokenLength: token ? token.length : 0,
      fallbackTokenLength: fallbackToken ? fallbackToken.length : 0,
      tokenType: typeof token,
      localStorage_token: localStorage.getItem('auth_token'),
      localStorage_token_length: localStorage.getItem('auth_token') ? localStorage.getItem('auth_token').length : 0,
      environment: import.meta.env.MODE,
      isAuthenticated: AuthService.isAuthenticated(),
      baseURL: apiClient.defaults.baseURL
    });
    
    // Remove 'Bearer ' prefix if present
    const tokenValue = fallbackToken ? fallbackToken.replace('Bearer ', '') : '';
    const tokenParam = tokenValue ? `?token=${tokenValue}` : '';
    
    console.log('🔍 Token processing:', {
      tokenValue: tokenValue ? `${tokenValue.substring(0, 10)}...` : 'null',
      tokenParam: tokenParam,
      hasTokenParam: !!tokenParam
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
          url = `${apiClient.defaults.baseURL}/invoice-templates/preview/${jobId}/${type}/${subtype}${tokenParam}`;
        }
        // For Excel files with index
        else if (type === 'excel' && parts.length > 2) {
          const index = parts.slice(2).join('_');
          url = `${apiClient.defaults.baseURL}/invoice-templates/preview/${jobId}/${type}/${index}${tokenParam}`;
        }
        else {
          url = `${apiClient.defaults.baseURL}/invoice-templates/preview/${jobId}/${type}${tokenParam}`;
        }
      }
      else {
        // Fallback to original behavior for compatibility
        url = `${apiClient.defaults.baseURL}/invoice-templates/preview/${fileId}${tokenParam}`;
      }
    }
    else {
      // Fallback to original behavior for compatibility
      url = `${apiClient.defaults.baseURL}/invoice-templates/preview/${fileId}${tokenParam}`;
    }
    
    console.log('Preview URL constructed:', url);
    return url;
  },
  
  // Get all documents for a specific customer
  getCustomerDocuments(customerNumber, limit = 50, offset = 0) {
    return ApiService.get(`/invoice-templates/customer-documents?customer_number=${customerNumber}&limit=${limit}&offset=${offset}`);
  },
  
  // Get all documents for a specific invoice
  getInvoiceDocuments(invoiceNumber) {
    return ApiService.get(`/invoice-templates/invoice-documents?invoice_number=${invoiceNumber}`);
  },
  
  // Merge functionality
  mergeInvoices(mergeRequest) {
    return ApiService.post('/invoice-templates/generate-merged', mergeRequest);
  },

  getCustomerMergeHistory(customerNumber, limit = 25) {
    return ApiService.get(`/invoice-templates/customer-merge-history/${customerNumber}`, { limit });
  },

  getMergeHistory(mergedInvoiceNumber) {
    return ApiService.get(`/invoice-templates/merge-history/${mergedInvoiceNumber}`);
  },

  findMergeContaining(originalInvoiceNumber) {
    return ApiService.get(`/invoice-templates/find-merge/${originalInvoiceNumber}`);
  },

  checkMergeConflicts(requestData) {
    return ApiService.post('/merge-groups/check-conflicts', requestData);
  },

  getMergeGroupsForCustomer(customerNumber, options = {}) {
    const params = new URLSearchParams({
      customer_number: customerNumber,
      status: options.status || 'active',
      limit: options.limit || 50
    });
    return ApiService.get(`/merge-groups?${params}`);
  },

  getMergeGroupById(groupIdentifier) {
    return ApiService.get(`/merge-groups/${groupIdentifier}`);
  },

  prepareMergeGroupForRemerge(groupIdentifier) {
    return ApiService.post(`/merge-groups/${groupIdentifier}/prepare-remerge`);
  }
}; 