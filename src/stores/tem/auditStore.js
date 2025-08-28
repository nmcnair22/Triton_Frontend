import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { temClient } from '@/services/tem/temClient';

export const useTEMAuditStore = defineStore('temAudit', () => {
  // State
  const varianceResults = ref([]);
  const missingBills = ref([]);
  const exceptions = ref([]);
  const auditFlags = ref([]);
  const loading = ref(false);
  const error = ref(null);
  
  // Variance analysis settings
  const varianceCriteria = ref({
    threshold_percent: 10,
    threshold_amount: 50,
    include_credits: false,
    date_from: null,
    date_to: null
  });
  
  // Missing bills settings
  const missingBillsCriteria = ref({
    days_threshold: 45,
    customer_id: null,
    provider_id: null
  });
  
  // Exception filters
  const exceptionFilters = ref({
    exception_type: '',
    status: '',
    page: 1
  });

  // Analytics data for heatmap
  const varianceHeatmapData = ref([]);
  const providerVarianceStats = ref({});
  const customerVarianceStats = ref({});

  // Getters
  const isLoading = computed(() => loading.value);
  const currentError = computed(() => error.value);
  
  // Variance analysis getters
  const totalVarianceCount = computed(() => varianceResults.value.length);
  const criticalVariances = computed(() => 
    varianceResults.value.filter(item => Math.abs(item.variance_pct) > 50)
  );
  const highVariances = computed(() => 
    varianceResults.value.filter(item => Math.abs(item.variance_pct) > 20 && Math.abs(item.variance_pct) <= 50)
  );
  
  // Missing bills getters
  const totalMissingCount = computed(() => missingBills.value.length);
  const missingBillsByProvider = computed(() => {
    const grouped = {};
    missingBills.value.forEach(bill => {
      const provider = bill.provider_name || 'Unknown';
      if (!grouped[provider]) {
        grouped[provider] = [];
      }
      grouped[provider].push(bill);
    });
    return grouped;
  });
  const estimatedExposure = computed(() => {
    return missingBills.value.reduce((total, bill) => {
      return total + (bill.estimated_amount || 0);
    }, 0);
  });
  
  // Exception queue getters
  const totalExceptionCount = computed(() => exceptions.value.length);
  const exceptionsByType = computed(() => {
    const grouped = {};
    exceptions.value.forEach(exception => {
      const type = exception.exception_type;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(exception);
    });
    return grouped;
  });
  const newExceptions = computed(() => 
    exceptions.value.filter(ex => ex.status === 'new')
  );
  const reviewExceptions = computed(() => 
    exceptions.value.filter(ex => ex.status === 'review')
  );

  // Actions
  async function runVarianceAnalysis(criteria = {}) {
    loading.value = true;
    error.value = null;
    
    try {
      const analysisQuery = {
        ...varianceCriteria.value,
        ...criteria
      };
      
      const response = await temClient.getVarianceAnalysis(analysisQuery);
      
      varianceResults.value = response.data.data;
      
      // Process data for heatmap visualization
      await processVarianceHeatmapData();
      
      console.log(`Variance analysis completed: ${varianceResults.value.length} results`);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to run variance analysis';
      console.error('Error running variance analysis:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function processVarianceHeatmapData() {
    const heatmapData = [];
    const providerStats = {};
    const customerStats = {};
    
    varianceResults.value.forEach(result => {
      const provider = result.provider_name || 'Unknown';
      const customer = result.customer_name || 'Unknown';
      const variancePct = Math.abs(result.variance_pct || 0);
      
      // Update provider stats
      if (!providerStats[provider]) {
        providerStats[provider] = {
          total_bills: 0,
          variance_sum: 0,
          high_variance_count: 0
        };
      }
      providerStats[provider].total_bills++;
      providerStats[provider].variance_sum += variancePct;
      if (variancePct > 20) {
        providerStats[provider].high_variance_count++;
      }
      
      // Update customer stats
      if (!customerStats[customer]) {
        customerStats[customer] = {
          total_bills: 0,
          variance_sum: 0,
          high_variance_count: 0
        };
      }
      customerStats[customer].total_bills++;
      customerStats[customer].variance_sum += variancePct;
      if (variancePct > 20) {
        customerStats[customer].high_variance_count++;
      }
      
      // Add to heatmap data
      heatmapData.push({
        provider: provider,
        customer: customer,
        variance_percentage: variancePct,
        bill_count: 1,
        severity: variancePct > 50 ? 'critical' : variancePct > 20 ? 'high' : 'medium'
      });
    });
    
    varianceHeatmapData.value = heatmapData;
    providerVarianceStats.value = providerStats;
    customerVarianceStats.value = customerStats;
  }

  async function detectMissingBills(criteria = {}) {
    loading.value = true;
    error.value = null;
    
    try {
      const detectionQuery = {
        ...missingBillsCriteria.value,
        ...criteria
      };
      
      const response = await temClient.getMissingBills(detectionQuery);
      
      missingBills.value = response.data.data;
      
      console.log(`Missing bills detection completed: ${missingBills.value.length} missing bills found`);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to detect missing bills';
      console.error('Error detecting missing bills:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchExceptions(filters = {}) {
    loading.value = true;
    error.value = null;
    
    try {
      const queryFilters = {
        ...exceptionFilters.value,
        ...filters
      };
      
      const response = await temClient.getExceptions(queryFilters);
      
      exceptions.value = response.data.data;
      
      console.log(`Loaded ${exceptions.value.length} TEM audit exceptions`);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load exceptions';
      console.error('Error fetching exceptions:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createFlag(flagData) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await temClient.createFlag(flagData);
      
      // Add the new flag to our local state
      auditFlags.value.unshift(response.data.data);
      
      console.log(`Created audit flag for ${flagData.entity_type} ${flagData.entity_id}`);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to create flag';
      console.error('Error creating flag:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function resolveExceptions(exceptionIds, resolution, notes = '') {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await temClient.resolveExceptions(exceptionIds, resolution, notes);
      
      // Update exceptions in local state
      exceptions.value = exceptions.value.map(exception => {
        if (exceptionIds.includes(exception.id)) {
          return {
            ...exception,
            status: 'resolved',
            resolution: resolution,
            resolution_notes: notes,
            resolved_at: new Date().toISOString()
          };
        }
        return exception;
      });
      
      console.log(`Resolved ${exceptionIds.length} exceptions`);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to resolve exceptions';
      console.error('Error resolving exceptions:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function updateVarianceCriteria(criteria) {
    varianceCriteria.value = { ...varianceCriteria.value, ...criteria };
  }

  function updateMissingBillsCriteria(criteria) {
    missingBillsCriteria.value = { ...missingBillsCriteria.value, ...criteria };
  }

  function updateExceptionFilters(filters) {
    exceptionFilters.value = { ...exceptionFilters.value, ...filters };
  }

  // Get variance color for heatmap visualization
  function getVarianceColor(variancePercentage) {
    const absVariance = Math.abs(variancePercentage);
    if (absVariance <= 5) return '#22c55e'; // Green
    if (absVariance <= 10) return '#84cc16'; // Light green
    if (absVariance <= 20) return '#eab308'; // Yellow
    if (absVariance <= 50) return '#f97316'; // Orange
    return '#ef4444'; // Red
  }

  // Get severity level for variance
  function getVarianceSeverity(variancePercentage) {
    const absVariance = Math.abs(variancePercentage);
    if (absVariance <= 5) return 'low';
    if (absVariance <= 10) return 'medium';
    if (absVariance <= 20) return 'high';
    return 'critical';
  }

  function clearAuditData() {
    varianceResults.value = [];
    missingBills.value = [];
    exceptions.value = [];
    auditFlags.value = [];
    varianceHeatmapData.value = [];
    providerVarianceStats.value = {};
    customerVarianceStats.value = {};
    error.value = null;
  }

  async function exportVarianceResults(format = 'csv') {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await temClient.exportData('variance-analysis', {
        ...varianceCriteria.value
      }, format);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `variance_analysis.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      console.log('Variance analysis export completed');
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to export variance results';
      console.error('Error exporting variance results:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Run comprehensive audit suite
  async function runFullAudit() {
    loading.value = true;
    error.value = null;
    
    try {
      await Promise.all([
        runVarianceAnalysis(),
        detectMissingBills(),
        fetchExceptions()
      ]);
      
      console.log('Full TEM audit completed');
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to complete full audit';
      console.error('Error running full audit:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    varianceResults,
    missingBills,
    exceptions,
    auditFlags,
    loading,
    error,
    varianceCriteria,
    missingBillsCriteria,
    exceptionFilters,
    varianceHeatmapData,
    providerVarianceStats,
    customerVarianceStats,
    
    // Getters
    isLoading,
    currentError,
    totalVarianceCount,
    criticalVariances,
    highVariances,
    totalMissingCount,
    missingBillsByProvider,
    estimatedExposure,
    totalExceptionCount,
    exceptionsByType,
    newExceptions,
    reviewExceptions,
    
    // Actions
    runVarianceAnalysis,
    processVarianceHeatmapData,
    detectMissingBills,
    fetchExceptions,
    createFlag,
    resolveExceptions,
    updateVarianceCriteria,
    updateMissingBillsCriteria,
    updateExceptionFilters,
    getVarianceColor,
    getVarianceSeverity,
    clearAuditData,
    exportVarianceResults,
    runFullAudit
  };
});