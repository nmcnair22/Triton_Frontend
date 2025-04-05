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
  }
}; 