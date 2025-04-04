import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { InvoiceService } from '@/service/ApiService';

export const useInvoiceStore = defineStore('invoice', () => {
  // State
  const invoices = ref([]);
  const currentInvoice = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Getters
  const getInvoiceById = computed(() => {
    return (id) => invoices.value.find(invoice => invoice.id === id);
  });

  const totalInvoices = computed(() => invoices.value.length);

  // Actions
  async function fetchInvoices(params = {}) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await InvoiceService.getInvoices(params);
      invoices.value = response.data;
    } catch (err) {
      error.value = err.message || 'Failed to fetch invoices';
      console.error('Error fetching invoices:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchInvoice(id) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await InvoiceService.getInvoice(id);
      currentInvoice.value = response.data;
      return response.data;
    } catch (err) {
      error.value = err.message || `Failed to fetch invoice #${id}`;
      console.error(`Error fetching invoice #${id}:`, err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function createInvoice(invoice) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await InvoiceService.createInvoice(invoice);
      invoices.value.push(response.data);
      return response.data;
    } catch (err) {
      error.value = err.message || 'Failed to create invoice';
      console.error('Error creating invoice:', err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function updateInvoice(invoice) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await InvoiceService.updateInvoice(invoice);
      const index = invoices.value.findIndex(i => i.id === invoice.id);
      if (index !== -1) {
        invoices.value[index] = response.data;
      }
      if (currentInvoice.value && currentInvoice.value.id === invoice.id) {
        currentInvoice.value = response.data;
      }
      return response.data;
    } catch (err) {
      error.value = err.message || `Failed to update invoice #${invoice.id}`;
      console.error(`Error updating invoice #${invoice.id}:`, err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function deleteInvoice(id) {
    loading.value = true;
    error.value = null;
    
    try {
      await InvoiceService.deleteInvoice(id);
      invoices.value = invoices.value.filter(invoice => invoice.id !== id);
      if (currentInvoice.value && currentInvoice.value.id === id) {
        currentInvoice.value = null;
      }
      return true;
    } catch (err) {
      error.value = err.message || `Failed to delete invoice #${id}`;
      console.error(`Error deleting invoice #${id}:`, err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  // Reset state
  function resetState() {
    invoices.value = [];
    currentInvoice.value = null;
    error.value = null;
  }

  return {
    // State
    invoices,
    currentInvoice,
    loading,
    error,
    
    // Getters
    getInvoiceById,
    totalInvoices,
    
    // Actions
    fetchInvoices,
    fetchInvoice,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    resetState
  };
}); 