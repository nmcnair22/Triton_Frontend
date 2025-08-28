import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { temClient } from '@/services/tem/temClient';

export const useTEMBillStore = defineStore('temBill', () => {
  // State
  const bills = ref([]);
  const currentBill = ref(null);
  const queueCounts = ref({
    all: 0,
    pending_review: 0,
    overdue: 0,
    high_variance: 0,
    denied: 0
  });
  const loading = ref(false);
  const error = ref(null);
  
  // Pagination
  const pagination = ref({
    current_page: 1,
    total: 0,
    per_page: 25,
    total_pages: 1
  });

  // Filters
  const filters = ref({
    invoice_number: '',
    date_from: '',
    date_to: '',
    amount_min: null,
    amount_max: null,
    status: [],
    payment_status: [],
    customer_ids: [],
    provider_ids: [],
    sort: 'invoice_date:desc'
  });

  // Current queue view
  const activeQueue = ref('all');

  // Getters
  const filteredBills = computed(() => bills.value);
  const totalCount = computed(() => pagination.value.total);
  const hasActiveFilters = computed(() => {
    return filters.value.invoice_number ||
           filters.value.date_from ||
           filters.value.date_to ||
           filters.value.amount_min !== null ||
           filters.value.amount_max !== null ||
           filters.value.status.length > 0 ||
           filters.value.payment_status.length > 0 ||
           filters.value.customer_ids.length > 0 ||
           filters.value.provider_ids.length > 0;
  });
  
  const isLoading = computed(() => loading.value);
  const currentError = computed(() => error.value);
  
  // Queue-specific getters
  const pendingReviewCount = computed(() => queueCounts.value.pending_review);
  const overdueCount = computed(() => queueCounts.value.overdue);
  const highVarianceCount = computed(() => queueCounts.value.high_variance);
  const deniedCount = computed(() => queueCounts.value.denied);
  
  // Current bill details
  const currentBillAmount = computed(() => currentBill.value?.amount || 0);
  const currentBillStatus = computed(() => currentBill.value?.status || '');
  const currentBillVariance = computed(() => {
    if (!currentBill.value?.expected_amount) return null;
    const variance = currentBill.value.amount - currentBill.value.expected_amount;
    const percentVariance = (variance / currentBill.value.expected_amount) * 100;
    return {
      amount: variance,
      percentage: percentVariance
    };
  });

  // Actions
  async function fetchBills(customFilters = {}) {
    loading.value = true;
    error.value = null;
    
    try {
      const searchFilters = {
        ...filters.value,
        ...customFilters
      };
      
      const response = await temClient.getBills(searchFilters);
      
      bills.value = response.data.data;
      pagination.value = response.data.meta.pagination;
      
      console.log(`Loaded ${bills.value.length} TEM bills`);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load bills';
      console.error('Error fetching TEM bills:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchBillsByQueue(queueType) {
    activeQueue.value = queueType;
    
    let queueFilters = {};
    
    switch (queueType) {
      case 'pending_review':
        queueFilters = { status: ['pending_review'] };
        break;
      case 'overdue':
        queueFilters = { 
          payment_status: ['overdue'],
          sort: 'days_overdue:desc'
        };
        break;
      case 'high_variance':
        queueFilters = { 
          variance_threshold: 20,
          sort: 'variance_percentage:desc'
        };
        break;
      case 'denied':
        queueFilters = { status: ['denied'] };
        break;
      default:
        queueFilters = {};
    }
    
    return await fetchBills(queueFilters);
  }

  async function fetchBillDetail(billId) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await temClient.getBillDetail(billId);
      
      currentBill.value = response.data.data;
      
      console.log(`Loaded TEM bill detail for: ${currentBill.value.invoice_number}`);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load bill details';
      console.error('Error fetching TEM bill detail:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateBillStatus(billId, status, notes = '') {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await temClient.updateBillStatus(billId, status, notes);
      
      // Update current bill if it's the one being modified
      if (currentBill.value?.id === billId) {
        currentBill.value.status = status;
      }
      
      // Update the bill in the list if it exists
      const billIndex = bills.value.findIndex(bill => bill.id === billId);
      if (billIndex !== -1) {
        bills.value[billIndex].status = status;
      }
      
      console.log(`Updated bill ${billId} status to: ${status}`);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update bill status';
      console.error('Error updating bill status:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function addBillNote(billId, note) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await temClient.addBillNote(billId, note);
      
      // Update current bill notes if it's the one being modified
      if (currentBill.value?.id === billId) {
        if (!currentBill.value.notes) {
          currentBill.value.notes = [];
        }
        currentBill.value.notes.push(response.data.data);
      }
      
      console.log(`Added note to bill ${billId}`);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to add bill note';
      console.error('Error adding bill note:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function bulkUpdateBillStatus(billIds, status, notes = '') {
    loading.value = true;
    error.value = null;
    
    try {
      const promises = billIds.map(billId => 
        temClient.updateBillStatus(billId, status, notes)
      );
      
      await Promise.all(promises);
      
      // Update bills in the list
      bills.value = bills.value.map(bill => {
        if (billIds.includes(bill.id)) {
          return { ...bill, status: status };
        }
        return bill;
      });
      
      console.log(`Bulk updated ${billIds.length} bills to status: ${status}`);
      
      // Refresh counts after bulk update
      await fetchQueueCounts();
      
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to bulk update bills';
      console.error('Error bulk updating bills:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchQueueCounts() {
    try {
      // Fetch counts for each queue type
      const promises = [
        temClient.getBills({ count_only: true }),
        temClient.getBills({ status: ['pending_review'], count_only: true }),
        temClient.getBills({ payment_status: ['overdue'], count_only: true }),
        temClient.getBills({ variance_threshold: 20, count_only: true }),
        temClient.getBills({ status: ['denied'], count_only: true })
      ];
      
      const [allResponse, pendingResponse, overdueResponse, varianceResponse, deniedResponse] = await Promise.all(promises);
      
      queueCounts.value = {
        all: allResponse.data.meta.pagination.total,
        pending_review: pendingResponse.data.meta.pagination.total,
        overdue: overdueResponse.data.meta.pagination.total,
        high_variance: varianceResponse.data.meta.pagination.total,
        denied: deniedResponse.data.meta.pagination.total
      };
      
    } catch (err) {
      console.error('Error fetching queue counts:', err);
      // Don't throw - queue counts are supplementary
    }
  }

  function updateFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters };
  }

  function clearFilters() {
    filters.value = {
      invoice_number: '',
      date_from: '',
      date_to: '',
      amount_min: null,
      amount_max: null,
      status: [],
      payment_status: [],
      customer_ids: [],
      provider_ids: [],
      sort: 'invoice_date:desc'
    };
  }

  function setCurrentBill(bill) {
    currentBill.value = bill;
  }

  function clearBillData() {
    bills.value = [];
    currentBill.value = null;
    error.value = null;
    queueCounts.value = {
      all: 0,
      pending_review: 0,
      overdue: 0,
      high_variance: 0,
      denied: 0
    };
  }

  async function exportBills(exportFilters = {}, format = 'csv') {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await temClient.exportData('bills', {
        ...filters.value,
        ...exportFilters
      }, format);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tem_bills.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      console.log('Bill export completed');
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to export bills';
      console.error('Error exporting bills:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Initialize function
  async function initialize() {
    await Promise.all([
      fetchBills(),
      fetchQueueCounts()
    ]);
  }

  return {
    // State
    bills,
    currentBill,
    queueCounts,
    loading,
    error,
    pagination,
    filters,
    activeQueue,
    
    // Getters
    filteredBills,
    totalCount,
    hasActiveFilters,
    isLoading,
    currentError,
    pendingReviewCount,
    overdueCount,
    highVarianceCount,
    deniedCount,
    currentBillAmount,
    currentBillStatus,
    currentBillVariance,
    
    // Actions
    fetchBills,
    fetchBillsByQueue,
    fetchBillDetail,
    updateBillStatus,
    addBillNote,
    bulkUpdateBillStatus,
    fetchQueueCounts,
    updateFilters,
    clearFilters,
    setCurrentBill,
    clearBillData,
    exportBills,
    initialize
  };
});