import axios from 'axios';
import { AuthService } from './AuthService';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = AuthService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      AuthService.clearSession();
      window.location.href = '/auth/login';
    } else if (error.response?.status === 403) {
      // Forbidden - show access denied
      console.error('Access denied:', error.response.data);
    } else if (error.response?.status >= 500) {
      // Server error
      console.error('Server error:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// Finance API endpoints
export const FinanceAPI = {
  // Dashboard
  getDashboardStats: () => Promise.all([
    api.get('/invoicing/statistics'),
    api.get('/receivables/statistics'),
    api.get('/payables/statistics')
  ]),

  // Invoicing
  getInvoices: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return api.get(`/invoicing/invoices?${params.toString()}`);
  },
  
  getInvoiceDetails: (invoiceId) => api.get(`/invoicing/invoices/${invoiceId}`),
  createInvoice: (invoiceData) => api.post('/invoicing/invoices', invoiceData),
  updateInvoice: (invoiceId, invoiceData) => api.put(`/invoicing/invoices/${invoiceId}`, invoiceData),
  deleteInvoice: (invoiceId) => api.delete(`/invoicing/invoices/${invoiceId}`),

  // Receivables
  getReceivables: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return api.get(`/receivables/weekly-payments?${params.toString()}`);
  },
  
  getShortPayments: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return api.get(`/receivables/short-payments?${params.toString()}`);
  },
  
  getClientPaymentDetails: (customerId) => api.get(`/receivables/clients/${customerId}`),
  sendPaymentReminder: (receivableId) => api.post(`/receivables/${receivableId}/send-reminder`),
  markReceivableAsPaid: (receivableId, paymentData) => api.post(`/receivables/${receivableId}/mark-paid`, paymentData),

  // Payables
  getPayables: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return api.get(`/payables/invoices?${params.toString()}`);
  },
  
  getVendorDetails: (vendorId) => api.get(`/payables/vendors/${vendorId}`),
  approvePayment: (payableId) => api.post(`/payables/${payableId}/approve`),
  schedulePayment: (payableId, paymentData) => api.post(`/payables/${payableId}/schedule`, paymentData),
  markPayableAsPaid: (payableId, paymentData) => api.post(`/payables/${payableId}/mark-paid`, paymentData),
  
  // Export functions
  exportInvoices: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return api.get(`/invoicing/export?${params.toString()}`, { responseType: 'blob' });
  },
  
  exportReceivables: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return api.get(`/receivables/export?${params.toString()}`, { responseType: 'blob' });
  },
  
  exportPayables: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return api.get(`/payables/export?${params.toString()}`, { responseType: 'blob' });
  }
};

// Generic API instance for other services
export default api;

// Original ApiService for backward compatibility
export const ApiService = {
  // Generic API methods
  get(resource, params) {
    return api.get(resource, { params });
  },
  
  post(resource, data) {
    return api.post(resource, data);
  },
  
  put(resource, data) {
    return api.put(resource, data);
  },
  
  delete(resource) {
    return api.delete(resource);
  }
};

// Invoice-specific API services
export const InvoiceService = {
  // Get all invoices with optional filtering
  getInvoices(params) {
    return api.get('/invoices', params);
  },
  
  // Get a specific invoice by ID
  getInvoice(id) {
    return api.get(`/invoices/${id}`);
  },
  
  // Get customer invoices with optional filtering
  getCustomerInvoices(filterConditions, params = {}) {
    // Use the provided filter conditions directly
    return api.get(`/accounting/sales-invoices`, { 
      ...params,
      filter: filterConditions
    });
  },
  
  // Get a specific sales invoice by ID
  getSalesInvoice(id) {
    return api.get(`/accounting/sales-invoices/${id}`);
  },
  
  // Get line items for a specific sales invoice
  getSalesInvoiceLines(id) {
    return api.get(`/accounting/sales-invoices/${id}/lines`);
  },
  
  // Get enriched line items for interactive invoice
  getEnrichedSalesInvoiceLines(documentNumber) {
    return api.post('/accounting/sales-invoice-lines', {
      document_number: documentNumber
    });
  },
  
  // Create a new invoice
  createInvoice(invoice) {
    return api.post('/invoices', invoice);
  },
  
  // Update an existing invoice
  updateInvoice(invoice) {
    return api.put(`/invoices/${invoice.id}`, invoice);
  },
  
  // Delete an invoice
  deleteInvoice(id) {
    return api.delete(`/invoices/${id}`);
  },
  
  // Get available templates for a client and optional invoice number
  getAvailableTemplates(clientId, invoiceNumber = null) {
    const params = { client_id: clientId };
    if (invoiceNumber) {
      params.invoice_number = invoiceNumber;
    }
    console.log('getAvailableTemplates API call with params:', params);
    console.log('API URL:', `${api.defaults.baseURL}/invoice-templates/available`);
    
    return api.get('/invoice-templates/available', params)
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
    return api.post('/invoice-templates/generate', {
      invoice_number: invoiceNumber,
      template_id: templateId
    });
  },
  
  // Get generated files for an invoice
  getGeneratedFiles(invoiceNumber) {
    return api.get(`/invoice-templates/files/${invoiceNumber}`);
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
    const fullUrl = `${api.defaults.baseURL}${url}`;
    
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
          url = `${api.defaults.baseURL}/invoice-templates/preview/${jobId}/${type}/${subtype}${tokenParam}`;
        }
        // For Excel files with index
        else if (type === 'excel' && parts.length > 2) {
          const index = parts.slice(2).join('_');
          url = `${api.defaults.baseURL}/invoice-templates/preview/${jobId}/${type}/${index}${tokenParam}`;
        }
        else {
          url = `${api.defaults.baseURL}/invoice-templates/preview/${jobId}/${type}${tokenParam}`;
        }
      }
      else {
        // Fallback to original behavior for compatibility
        url = `${api.defaults.baseURL}/invoice-templates/preview/${fileId}${tokenParam}`;
      }
    }
    else {
      // Fallback to original behavior for compatibility
      url = `${api.defaults.baseURL}/invoice-templates/preview/${fileId}${tokenParam}`;
    }
    
    console.log('Preview URL constructed:', url);
    return url;
  },
  
  // Get all documents for a specific customer
  getCustomerDocuments(customerNumber, limit = 50, offset = 0) {
    return api.get(`/invoice-templates/customer-documents?customer_number=${customerNumber}&limit=${limit}&offset=${offset}`);
  },
  
  // Get all documents for a specific invoice
  getInvoiceDocuments(invoiceNumber) {
    return api.get(`/invoice-templates/invoice-documents?invoice_number=${invoiceNumber}`);
  }
}; 