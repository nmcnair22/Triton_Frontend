import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { InvoiceService } from '@/service/ApiService';

// Create a finance-specific API instance with longer timeout
import axios from 'axios';

const financeApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 30000, // 30 seconds for finance APIs
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add auth interceptor
financeApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const useFinanceStore = defineStore('finance', () => {
  // State
  const loading = ref(false);
  const error = ref(null);
  
  // Dashboard Statistics - using new optimized endpoints
  const dashboardStats = ref({
    invoicing: {
      totalInvoiced: 0,
      invoiceCount: 0,
      averageInvoice: 0,
      outstandingAmount: 0,
      outstandingCount: 0,
      overdueAmount: 0,
      overdueCount: 0
    },
    receivables: {
      totalReceivables: 0,
      customerCount: 0,
      monthlyPayments: 0,
      paymentCount: 0
    },
    payables: {
      totalOutstanding: 0,
      vendorCount: 0,
      monthlyPayments: 0,
      paymentCount: 0
    },
    cashManagement: {
      accountCount: 0,
      netCashFlow: 0,
      transactionCount: 0
    }
  });

  // Invoicing Data
  const invoices = ref([]);
  const invoiceDetails = ref(null);
  const invoicingStats = ref({});
  const invoicePagination = ref({});

  // Receivables Data
  const receivables = ref([]);
  const weeklyPayments = ref([]);
  const shortPayments = ref([]);
  const clientPaymentDetails = ref({});

  // Payables Data
  const payables = ref([]);
  const vendorDetails = ref({});
  const paymentSummary = ref({});

  // Computed getters
  const totalRevenue = computed(() => dashboardStats.value.invoicing.totalInvoiced);
  const totalReceivables = computed(() => dashboardStats.value.receivables.totalReceivables);
  const totalPayables = computed(() => dashboardStats.value.payables.totalOutstanding);
  const netIncome = computed(() => totalRevenue.value - totalPayables.value);

  const isLoading = computed(() => loading.value);
  const hasError = computed(() => !!error.value);

  // Actions

  // Dashboard Actions - using new optimized accounting endpoints
  async function fetchDashboardStats() {
    loading.value = true;
    error.value = null;

    try {
      // Use the new optimized summary endpoint that's fast and working
      const response = await financeApi.get('/accounting/optimized/summary', {
        params: {
          startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        }
      });

      // Update dashboard stats with optimized data structure
      if (response.data && response.data.data) {
        const data = response.data.data;
        
        dashboardStats.value = {
          invoicing: {
            totalInvoiced: data.invoicing?.totalInvoiced?.totalInvoiced || 0,
            invoiceCount: data.invoicing?.totalInvoiced?.invoiceCount || 0,
            averageInvoice: data.invoicing?.totalInvoiced?.averageInvoice || 0,
            outstandingAmount: data.invoicing?.outstanding?.outstandingAmount || 0,
            outstandingCount: data.invoicing?.outstanding?.outstandingCount || 0,
            overdueAmount: data.invoicing?.overdue?.overdueAmount || 0,
            overdueCount: data.invoicing?.overdue?.overdueCount || 0
          },
          receivables: {
            totalReceivables: data.receivables?.customerBalances?.totalReceivables || 0,
            customerCount: data.receivables?.customerBalances?.customerCount || 0,
            monthlyPayments: data.receivables?.payments?.monthlyPayments || 0,
            paymentCount: data.receivables?.payments?.paymentCount || 0
          },
          payables: {
            totalOutstanding: data.payables?.vendorOutstanding?.totalOutstanding || 0,
            vendorCount: data.payables?.vendorOutstanding?.vendorCount || 0,
            monthlyPayments: data.payables?.payments?.monthlyPayments || 0,
            paymentCount: data.payables?.payments?.paymentCount || 0
          },
          cashManagement: {
            accountCount: data.cashManagement?.bankBalances?.accountCount || 0,
            netCashFlow: data.cashManagement?.cashFlow?.netCashFlow || 0,
            transactionCount: data.cashManagement?.cashFlow?.transactionCount || 0
          }
        };
      }

      return dashboardStats.value;
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Failed to fetch dashboard statistics';
      console.error('Dashboard stats error:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Individual optimized endpoint methods for specific data
  async function fetchTotalRevenue(startDate, endDate) {
    loading.value = true;
    error.value = null;

    try {
      const response = await financeApi.get('/accounting/optimized/total-revenue', {
        params: { startDate, endDate }
      });

      return response.data.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch revenue data';
      console.error('Revenue fetch error:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchOutstandingInvoices() {
    loading.value = true;
    error.value = null;

    try {
      const response = await financeApi.get('/accounting/optimized/outstanding-invoices');
      return response.data.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch outstanding invoices';
      console.error('Outstanding invoices error:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchOverdueInvoices() {
    loading.value = true;
    error.value = null;

    try {
      const response = await financeApi.get('/accounting/optimized/overdue-invoices');
      return response.data.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch overdue invoices';
      console.error('Overdue invoices error:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCustomerBalances() {
    loading.value = true;
    error.value = null;

    try {
      console.log('🔄 Fetching customer balances with optimized endpoint...');
      
      const response = await financeApi.get('/accounting/optimized/customer-balances');
      
      console.log('📊 Customer balances response:', response.data);

      if (response.data && response.data.data) {
        // Update the dashboard stats with customer balance data
        const data = response.data.data;
        
        if (!dashboardStats.value.receivables) {
          dashboardStats.value.receivables = {};
        }
        
        dashboardStats.value.receivables = {
          totalReceivables: data.totalReceivables || 0,
          customerCount: data.customerCount || 0,
          monthlyPayments: data.monthlyPayments || 0,
          paymentCount: data.paymentCount || 0
        };
        
        console.log('✅ Customer balances updated:', dashboardStats.value.receivables);
        return dashboardStats.value.receivables;
      } else {
        console.warn('⚠️ Unexpected customer balances response:', response.data);
        return {};
      }
    } catch (err) {
      console.error('❌ Customer balances fetch error:', err);
      error.value = err.response?.data?.message || err.message || 'Failed to fetch customer balances';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCustomerPayments(startDate, endDate) {
    loading.value = true;
    error.value = null;

    try {
      const response = await financeApi.get('/accounting/optimized/customer-payments', {
        params: { startDate, endDate }
      });
      return response.data.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch customer payments';
      console.error('Customer payments error:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchReceivables(filters = {}) {
    loading.value = true;
    error.value = null;

    try {
      console.log('🔄 Fetching receivables data...');
      
      // Fetch both customer balances and payments data
      const [balancesResponse, paymentsResponse] = await Promise.all([
        financeApi.get('/accounting/optimized/customer-balances'),
        financeApi.get('/accounting/optimized/customer-payments', {
          params: {
            startDate: filters.startDate || new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
            endDate: filters.endDate || new Date().toISOString().split('T')[0],
            ...filters
          }
        })
      ]);

      console.log('📊 Customer balances response:', balancesResponse.data);
      console.log('📊 Customer payments response:', paymentsResponse.data);

      let receivablesData = [];
      let receivablesStats = {};

      // Process customer balances
      if (balancesResponse.data?.success && balancesResponse.data?.data) {
        receivablesStats = balancesResponse.data.data;
        console.log('✅ Customer balances loaded:', receivablesStats);
      }

      // Process customer payments
      if (paymentsResponse.data?.success && paymentsResponse.data?.data) {
        const paymentsData = paymentsResponse.data.data;
        
        // Convert payments data to receivables format
        if (Array.isArray(paymentsData)) {
          receivablesData = paymentsData;
        } else if (paymentsData.payments && Array.isArray(paymentsData.payments)) {
          receivablesData = paymentsData.payments;
        } else if (paymentsData.customers && Array.isArray(paymentsData.customers)) {
          receivablesData = paymentsData.customers;
        }
        
        console.log('✅ Customer payments loaded:', receivablesData.length);
      }

      // Store the data
      receivables.value = receivablesData;
      
      // Update dashboard stats if not already set
      if (!dashboardStats.value.receivables) {
        dashboardStats.value.receivables = {};
      }
      
      dashboardStats.value.receivables = {
        ...dashboardStats.value.receivables,
        ...receivablesStats
      };

      console.log('✅ Receivables data loaded successfully');
      return { 
        receivables: receivables.value,
        stats: receivablesStats
      };

    } catch (err) {
      console.error('❌ Receivables fetch error:', err);
      error.value = err.response?.data?.message || err.message || 'Failed to fetch receivables';
      receivables.value = [];
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Payables Actions - using optimized endpoints
  async function fetchPayables(filters = {}) {
    loading.value = true;
    error.value = null;

    try {
      console.log('🔄 Fetching payables from /api/payables/invoices...');
      
      // Use the correct payables endpoint that actually works
      const response = await financeApi.get('/payables/invoices', { 
        params: {
          limit: filters.limit || 100,
          page: filters.page || 1,
          ...filters
        }
      });
      
      console.log('📊 Payables invoices response:', response.data);

      if (response.data && response.data.success && response.data.data) {
        // Handle the correct nested structure: response.data.data.invoices
        const data = response.data.data;
        const invoicesArray = data.invoices || [];
        
        // Map the API response to our expected format
        payables.value = invoicesArray.map(invoice => ({
          id: invoice.id,
          vendorId: invoice.vendor_id || invoice.id,
          vendorName: invoice.vendor_name,
          vendorNumber: invoice.vendor_number || invoice.number,
          invoiceNumber: invoice.number,
          description: invoice.description || `Invoice ${invoice.number}`,
          amount: invoice.total_amount?.including_tax || invoice.total_amount || 0,
          dueDate: invoice.due_date?.iso || invoice.due_date,
          invoiceDate: invoice.invoice_date?.iso || invoice.invoice_date,
          status: invoice.status?.toLowerCase() || 'pending',
          paymentTerms: invoice.payment_terms || 'Net 30',
          currency: invoice.currency || 'USD',
          category: invoice.category || 'General',
          // Format dates for display
          dueDateFormatted: invoice.due_date?.formatted || invoice.due_date,
          invoiceDateFormatted: invoice.invoice_date?.formatted || invoice.invoice_date,
          dueDateRelative: invoice.due_date?.relative,
          invoiceDateRelative: invoice.invoice_date?.relative,
          // Additional fields that might be available
          contact: {
            email: invoice.vendor_email || '',
            phone: invoice.vendor_phone || ''
          },
          address: {
            street: invoice.vendor_address || '',
            city: invoice.vendor_city || '',
            state: invoice.vendor_state || '',
            zipCode: invoice.vendor_zip || '',
            country: invoice.vendor_country || ''
          }
        }));
        
        console.log('✅ Payables loaded successfully:', payables.value.length);
        console.log('📋 Total count from API:', data.total_count);
        
        return { 
          payables: payables.value,
          totalCount: data.total_count || payables.value.length
        };
      } else {
        console.warn('⚠️ Unexpected payables response structure:', response.data);
        error.value = 'Invalid response format from payables API';
        payables.value = [];
        return { payables: [] };
      }
    } catch (err) {
      console.error('❌ Payables fetch error:', err);
      error.value = err.response?.data?.message || err.message || 'Failed to fetch payables';
      payables.value = [];
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchVendorOutstanding() {
    loading.value = true;
    error.value = null;

    try {
      console.log('🔄 Fetching vendor outstanding with optimized endpoint...');
      
      const response = await financeApi.get('/accounting/optimized/vendor-outstanding');
      
      console.log('📊 Vendor outstanding response:', response.data);

      if (response.data && response.data.data) {
        // Update the dashboard stats with vendor outstanding data
        const data = response.data.data;
        
        if (!dashboardStats.value.payables) {
          dashboardStats.value.payables = {};
        }
        
        dashboardStats.value.payables = {
          totalOutstanding: data.totalOutstanding || 0,
          vendorCount: data.vendorCount || 0,
          monthlyPayments: data.monthlyPayments || 0,
          paymentCount: data.paymentCount || 0
        };
        
        console.log('✅ Vendor outstanding updated:', dashboardStats.value.payables);
        return dashboardStats.value.payables;
      } else {
        console.warn('⚠️ Unexpected vendor outstanding response:', response.data);
        return {};
      }
    } catch (err) {
      console.error('❌ Vendor outstanding fetch error:', err);
      error.value = err.response?.data?.message || err.message || 'Failed to fetch vendor outstanding';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchVendorDetails(vendorId) {
    loading.value = true;
    error.value = null;

    try {
      const response = await financeApi.get(`/payables/vendors/${vendorId}`);
      vendorDetails.value[vendorId] = response.data;
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch vendor details';
      console.error('Vendor details error:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function approvePayment(payableId) {
    loading.value = true;
    error.value = null;

    try {
      const response = await financeApi.put(`/payables/${payableId}/approve`);
      
      // Update payable status in the list
      const index = payables.value.findIndex(pay => pay.id === payableId);
      if (index > -1) {
        payables.value[index].status = 'approved';
      }
      
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to approve payment';
      console.error('Payment approval error:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function markPayableAsPaid(payableId, paymentData) {
    loading.value = true;
    error.value = null;

    try {
      const response = await financeApi.put(`/payables/${payableId}/mark-paid`, paymentData);
      
      // Update payable status in the list
      const index = payables.value.findIndex(pay => pay.id === payableId);
      if (index > -1) {
        payables.value[index].status = 'paid';
      }
      
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to mark payable as paid';
      console.error('Mark payable as paid error:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Export Actions - using real data only
  async function exportInvoices(filters = {}) {
    loading.value = true;
    error.value = null;

    try {
      // Try to get export from API first
      try {
        const response = await financeApi.get('/invoicing/export', { 
          params: filters,
          responseType: 'blob'
        });
        
        // Handle blob response
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoices-${new Date().toISOString().split('T')[0]}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        return { success: true };
      } catch (exportError) {
        // Fallback to CSV export from current data
        if (invoices.value.length === 0) {
          throw new Error('No invoice data to export');
        }

        const csvContent = "Invoice Number,Customer,Amount,Status,Date,Due Date\n" +
          invoices.value.map(inv => {
            const invoiceNumber = inv.document_number || inv.invoice_number || inv.id;
            const customerName = inv.customer_name || inv.client_name || 'N/A';
            const amount = inv.total_amount || inv.amount || 0;
            const status = inv.status || 'pending';
            const date = inv.invoice_date || inv.created_at || new Date().toISOString();
            const dueDate = inv.due_date || '';
            
            return `"${invoiceNumber}","${customerName}","${amount}","${status}","${date}","${dueDate}"`;
          }).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoices-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        return { success: true };
      }
    } catch (err) {
      error.value = err.message || 'Failed to export invoices';
      console.error('Export invoices error:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Utility Actions
  function clearError() {
    error.value = null;
  }

  function resetState() {
    loading.value = false;
    error.value = null;
    dashboardStats.value = {
      invoicing: {
        totalInvoiced: 0,
        invoiceCount: 0,
        averageInvoice: 0,
        outstandingAmount: 0,
        outstandingCount: 0,
        overdueAmount: 0,
        overdueCount: 0
      },
      receivables: {
        totalReceivables: 0,
        customerCount: 0,
        monthlyPayments: 0,
        paymentCount: 0
      },
      payables: {
        totalOutstanding: 0,
        vendorCount: 0,
        monthlyPayments: 0,
        paymentCount: 0
      },
      cashManagement: {
        accountCount: 0,
        netCashFlow: 0,
        transactionCount: 0
      }
    };
    invoices.value = [];
    receivables.value = [];
    payables.value = [];
    invoiceDetails.value = null;
    clientPaymentDetails.value = {};
    vendorDetails.value = {};
  }

  return {
    // State
    loading,
    error,
    dashboardStats,
    invoices,
    invoiceDetails,
    invoicingStats,
    invoicePagination,
    receivables,
    weeklyPayments,
    shortPayments,
    clientPaymentDetails,
    payables,
    vendorDetails,
    paymentSummary,

    // Computed
    totalRevenue,
    totalReceivables,
    totalPayables,
    netIncome,
    isLoading,
    hasError,

    // Actions
    fetchDashboardStats,
    fetchTotalRevenue,
    fetchOutstandingInvoices,
    fetchOverdueInvoices,
    fetchCustomerBalances,
    fetchCustomerPayments,
    fetchReceivables,
    fetchPayables,
    fetchVendorOutstanding,
    fetchVendorDetails,
    approvePayment,
    markPayableAsPaid,
    
    // Export
    exportInvoices,
    
    // Utilities
    clearError,
    resetState
  };
}); 