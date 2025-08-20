import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// Add CSRF token to requests
api.interceptors.request.use(config => {
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (token) {
    config.headers['X-CSRF-TOKEN'] = token;
  }
  return config;
});

/**
 * Audit Service - Restructured for Stored Data and Background Scanning
 */
export const auditService = {
  /**
   * PRIMARY METHOD: Load stored audit data for customer
   * This is the main method to get existing scan results from database
   */
  getStoredAuditData: (customerId) => {
    // First try the new audit management endpoint
    return api.get(`/audit-management/customers/${customerId}/locations`)
      .catch(() => {
        // Fallback to test endpoint if audit management not available
        console.log('Falling back to test endpoint for stored data');
        return api.get(`/test/asset-profiles/${customerId}?limit=1000`);
      });
  },

  /**
   * Get customer audit status and coverage statistics
   */
  getCustomerAuditStatus: (customerId) => {
    return api.get(`/audit-management/customers/${customerId}/status`)
      .catch(() => {
        // Fallback to basic statistics if audit management not available
        console.log('Falling back to basic audit status');
        return api.get(`/test/asset-profiles/${customerId}?limit=1&stats_only=true`);
      });
  },

  /**
   * Start background scan for unscanned or selected locations
   */
  startBackgroundScan: (customerId, options = {}) => {
    const defaultOptions = {
      audit_mode: 'incremental',
      limit: 50,
      skip_days: 7,
      force_reaudit: false,
      reset_locations: '',
      audit_since: ''
    };

    const payload = { ...defaultOptions, ...options };
    
    // Clean empty values
    Object.keys(payload).forEach(key => {
      if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
        delete payload[key];
      }
    });

    // Try new audit management endpoint first
    return api.post(`/audit-management/customers/${customerId}/start-full-audit`, payload)
      .catch(() => {
        // Fallback to test endpoint for background scanning
        console.log('Falling back to test endpoint for background scan');
        return api.get(`/test/asset-profiles/${customerId}`, { params: payload });
      });
  },

  /**
   * Get audit history for customer
   */
  getAuditHistory: (customerId) => {
    return api.get(`/audit/runs/${customerId}`);
  },

  /**
   * Get detailed audit results by audit run ID
   */
  getAuditResults: (auditRunId) => {
    return api.get(`/audit/results/${auditRunId}`);
  },

  /**
   * DEPRECATED: Use getStoredAuditData instead - maintained for backward compatibility
   */
  runAudit: (customerId, options = {}) => {
    console.warn('runAudit is deprecated for background scanning workflow, use startBackgroundScan instead');
    return this.startBackgroundScan(customerId, options);
  },

  /**
   * DEPRECATED: Use getStoredAuditData instead - maintained for backward compatibility
   */
  getLatestAuditData: (customerId, limit = 50) => {
    console.warn('getLatestAuditData is deprecated, use getStoredAuditData instead');
    return this.getStoredAuditData(customerId);
  }
};

export default api;