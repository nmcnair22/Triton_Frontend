import axios from 'axios';
import { AuthService } from './AuthService';

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
    return ApiService.get('/invoice-templates/available', params);
  },
  
  // Generate a document from a template for an invoice
  generateTemplate(invoiceNumber, templateId) {
    return ApiService.post('/invoice-templates/generate', {
      invoice_number: invoiceNumber,
      template_id: templateId
    });
  },
  
  // Get generated files for an invoice
  getGeneratedFiles(invoiceNumber) {
    return ApiService.get(`/invoice-templates/files/${invoiceNumber}`);
  },
  
  // Download a generated file
  downloadGeneratedFile(jobId, fileType = 'pdf', subtype = null) {
    let url = `/invoice-templates/download/${jobId}/${fileType}`;
    
    // If subtype is provided (for PDF files like 'summary', 'consolidated', etc.), add it to the URL
    if (subtype) {
      url += `/${subtype}`;
    }
    
    console.log('Download URL:', url);
    
    return ApiService.get(url, { responseType: 'blob' })
    .then(response => {
      // Create a blob URL from the binary data
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      
      // Create a link and trigger the download
      const a = document.createElement('a');
      a.href = url;
      
      // Get filename from Content-Disposition header or use a default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `document.${fileType}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=(.+)/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return true;
    });
  },
  
  // Get file preview URL
  getFilePreviewUrl(fileId, fileType = 'pdf', subtype = null) {
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
          return `${apiClient.defaults.baseURL}/invoice-templates/preview/${jobId}/${type}/${subtype}`;
        }
        
        // For Excel files with index
        if (type === 'excel' && parts.length > 2) {
          const index = parts.slice(2).join('_');
          return `${apiClient.defaults.baseURL}/invoice-templates/preview/${jobId}/${type}/${index}`;
        }
        
        return `${apiClient.defaults.baseURL}/invoice-templates/preview/${jobId}/${type}`;
      }
    }
    
    // Fallback to original behavior for compatibility
    return `${apiClient.defaults.baseURL}/invoice-templates/preview/${fileId}`;
  },
  
  // Get all documents for a specific customer
  getCustomerDocuments(customerNumber, limit = 50, offset = 0) {
    return ApiService.get(`/invoice-templates/customer-documents?customer_number=${customerNumber}&limit=${limit}&offset=${offset}`);
  },
  
  // Get all documents for a specific invoice
  getInvoiceDocuments(invoiceNumber) {
    return ApiService.get(`/invoice-templates/invoice-documents?invoice_number=${invoiceNumber}`);
  }
}; 