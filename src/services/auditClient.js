import axios from 'axios';

class AuditClient {
  constructor() {
    this.http = axios.create({
      baseURL: 'http://localhost:8000/api',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add CSRF token interceptor
    this.http.interceptors.request.use((config) => {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
      if (csrfToken) {
        config.headers['X-CSRF-TOKEN'] = csrfToken;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.http.interceptors.response.use(
      (response) => response,
      (error) => {
        // Log errors for debugging
        console.error('API Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          data: error.response?.data
        });

        // Ensure we always return JSON errors, never HTML
        if (error.response?.data && typeof error.response.data === 'string') {
          try {
            error.response.data = JSON.parse(error.response.data);
          } catch (e) {
            error.response.data = { 
              message: 'Server error occurred',
              error: error.response.data 
            };
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // ============================================
  // CUSTOMER-LEVEL ENDPOINTS
  // ============================================

  /**
   * Start a full customer audit (background job)
   */
  async startFullAudit(customerId, options = {}) {
    return this.http.post(`/audit-management/customers/${customerId}/start-full-audit`, options);
  }

  /**
   * Get customer audit status and progress
   */
  async getCustomerStatus(customerId) {
    return this.http.get(`/audit-management/customers/${customerId}/status`);
  }

  /**
   * Get paginated list of audited locations for a customer
   */
  async getLocations(customerId, { limit = 25, offset = 0, sort = 'location_name', order = 'asc', search = '', status = '' } = {}) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (offset) params.append('offset', offset);
    if (sort) params.append('sort', sort);
    if (order) params.append('order', order);
    if (search) params.append('search', search);
    if (status) params.append('status', status);

    return this.http.get(`/audit-management/customers/${customerId}/locations?${params.toString()}`);
  }

  // ============================================
  // LOCATION-LEVEL ENDPOINTS
  // ============================================

  /**
   * Get detailed information for a specific location
   */
  async getLocationDetail(customerId, locationId) {
    return this.http.get(`/audit-management/customers/${customerId}/locations/${locationId}`);
  }

  /**
   * Trigger a rescan for a specific location
   */
  async rescanLocation(customerId, locationId) {
    return this.http.post(`/audit-management/customers/${customerId}/locations/${locationId}/rescan`);
  }

  /**
   * Trigger a fresh audit for a specific location
   */
  async auditSingleLocation(customerId, locationId) {
    return this.http.post(`/audit-management/customers/${customerId}/locations/${locationId}/audit`);
  }

  /**
   * Update the audit status of a location
   */
  async updateLocationStatus(customerId, locationId, status) {
    return this.http.patch(`/audit-management/customers/${customerId}/locations/${locationId}/status`, { status });
  }

  /**
   * Create an issue for a location
   */
  async createIssue(customerId, locationId, issue) {
    return this.http.post(`/audit-management/customers/${customerId}/locations/${locationId}/issues`, issue);
  }

  /**
   * Create a note for a location
   */
  async createNote(customerId, locationId, note) {
    return this.http.post(`/audit-management/customers/${customerId}/locations/${locationId}/notes`, note);
  }

  // ============================================
  // RAW ASSETS & UNITS ENDPOINTS
  // ============================================

  /**
   * Get raw assets for a location (optionally for a specific audit run)
   */
  async getRawAssets(locationId, auditRunId = null) {
    const params = auditRunId ? { audit_run_id: auditRunId } : {};
    return this.http.get(`/audit/locations/${locationId}/raw-assets`, { params });
  }

  /**
   * Get asset units for a location (with their links)
   */
  async getAssetUnits(locationId) {
    return this.http.get(`/audit/locations/${locationId}/asset-units`);
  }

  /**
   * Create one or more asset units
   */
  async createAssetUnits(locationId, units) {
    return this.http.post(`/audit/locations/${locationId}/asset-units`, { units });
  }

  /**
   * Create links between raw assets and units
   */
  async createAssetUnitLinks(locationId, links) {
    return this.http.post(`/audit/locations/${locationId}/asset-unit-links`, { links });
  }

  // ============================================
  // UNIT RELATIONSHIPS ENDPOINTS (NEW)
  // ============================================

  /**
   * Get unit-to-unit relationships for a location
   */
  async getUnitRelationships(locationId) {
    return this.http.get(`/audit/locations/${locationId}/unit-relationships`);
  }

  /**
   * Create unit-to-unit relationships
   */
  async createUnitRelationships(locationId, relationships) {
    return this.http.post(`/audit/locations/${locationId}/unit-relationships`, { relationships });
  }

  /**
   * Delete a specific unit relationship
   */
  async deleteUnitRelationship(locationId, relationshipId) {
    return this.http.delete(`/audit/locations/${locationId}/unit-relationships/${relationshipId}`);
  }

  // ============================================
  // ALLOCATION & EXCEPTIONS ENDPOINTS
  // ============================================

  /**
   * Run allocation analysis against a charge profile
   */
  async runAllocation(locationId, { charge_profile_id, service_level_key, save = false }) {
    return this.http.post(`/audit/locations/${locationId}/allocate`, {
      charge_profile_id,
      service_level_key,
      save
    });
  }

  /**
   * Get exceptions for a location
   */
  async getExceptions(locationId) {
    return this.http.get(`/audit/locations/${locationId}/exceptions`);
  }

  /**
   * Create an exception (temporary ignore)
   */
  async createException(locationId, exception) {
    // Add default 30-day expiry if not provided
    if (!exception.expires_at) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      exception.expires_at = expiryDate.toISOString();
    }

    return this.http.post(`/audit/locations/${locationId}/exceptions`, exception);
  }

  /**
   * Update an exception (e.g., to deactivate it)
   */
  async updateException(locationId, exceptionId, updates) {
    return this.http.patch(`/audit/locations/${locationId}/exceptions/${exceptionId}`, updates);
  }

  // ============================================
  // REFERENCE DATA ENDPOINTS (NO HARDCODING)
  // ============================================

  /**
   * Get asset categories and layers (for Units dropdown)
   */
  async getAssetCategories() {
    return this.http.get('/audit/ref/asset-categories');
  }

  /**
   * Get service levels for a customer (for Licensing dropdown)
   */
  async getServiceLevels(customerId) {
    return this.http.get(`/audit/ref/service-levels/${customerId}`);
  }

  /**
   * Get charge profiles for a customer (for Licensing dropdown)
   */
  async getChargeProfiles(customerId) {
    return this.http.get(`/audit/profiles/${customerId}?type=CP`);
  }

  // ============================================
  // PROFILES & CONTRACTS ENDPOINTS (NEW)
  // ============================================

  /**
   * Get profiles for a customer (CP = Charge Profiles)
   */
  async getProfiles(customerId, type = 'CP') {
    return this.http.get(`/audit/profiles/${customerId}?type=${type}`);
  }

  /**
   * Create a new profile for a customer
   */
  async createProfile(customerId, profile) {
    return this.http.post(`/audit/profiles/${customerId}`, profile);
  }

  /**
   * Get contracts for a customer
   */
  async getContracts(customerId) {
    return this.http.get(`/contracts?customer_id=${customerId}`);
  }

  // ============================================
  // CHARGES ENDPOINTS (NEW)
  // ============================================

  /**
   * Get location detail which includes charges data
   */
  async getLocationDetail(customerId, locationId) {
    return this.http.get(`/audit-management/customers/${customerId}/locations/${locationId}`);
  }

  /**
   * Get charge line items for a location (invoice-style) - DEPRECATED
   * Use getLocationDetail instead as charges are included
   */
  async getLocationCharges(locationId) {
    return this.http.get(`/audit/locations/${locationId}/charges`);
  }

  /**
   * Update license→unit mapping in allocation snapshot (optional)
   */
  async updateAllocationMapping(locationId, mappings) {
    return this.http.post(`/audit/locations/${locationId}/allocation-mapping`, { mappings });
  }

  // ============================================
  // ISSUES & NOTES ENDPOINTS (AUDIT-MANAGEMENT)
  // ============================================

  /**
   * Create an issue for a location
   * Required: issue_type, severity, title, description
   * Optional: expected_value, actual_value, assigned_to, metadata
   */
  async createIssue(customerId, locationId, issue) {
    return this.http.post(`/audit-management/customers/${customerId}/locations/${locationId}/issues`, issue);
  }

  /**
   * Update an issue status or fields (defensive - may not exist yet)
   */
  async updateIssue(customerId, locationId, issueId, updates) {
    return this.http.patch(`/audit-management/customers/${customerId}/locations/${locationId}/issues/${issueId}`, updates);
  }

  /**
   * Delete an issue (defensive - may not exist yet)
   */
  async deleteIssue(customerId, locationId, issueId) {
    return this.http.delete(`/audit-management/customers/${customerId}/locations/${locationId}/issues/${issueId}`);
  }

  /**
   * Create a note for a location
   * Required: note_type, content
   * Optional: is_internal, audit_issue_id
   */
  async createNote(customerId, locationId, note) {
    return this.http.post(`/audit-management/customers/${customerId}/locations/${locationId}/notes`, note);
  }

  // ============================================
  // EXCEPTIONS ENDPOINTS (AUDIT - DEFENSIVE)
  // ============================================

  /**
   * List exceptions for a location (defensive - may 404)
   */
  async getExceptions(locationId) {
    return this.http.get(`/audit/locations/${locationId}/exceptions`);
  }

  /**
   * Create an exception (defensive - may 404)
   * Required: code, scope, predicate, note
   * Optional: expires_at (defaults to +30 days)
   */
  async createException(locationId, exception) {
    return this.http.post(`/audit/locations/${locationId}/exceptions`, exception);
  }

  /**
   * Update an exception (defensive - may 404)
   */
  async updateException(locationId, exceptionId, updates) {
    return this.http.patch(`/audit/locations/${locationId}/exceptions/${exceptionId}`, updates);
  }

  // ============================================
  // HISTORY & AUDIT RUNS ENDPOINTS (DEFENSIVE)
  // ============================================

  /**
   * Get audit runs for a customer (defensive - may 404)
   * Optional location_id parameter to filter runs affecting a specific location
   */
  async getAuditRuns(customerId, locationId = null) {
    const params = locationId ? `?location_id=${locationId}` : '';
    return this.http.get(`/audit/runs/${customerId}${params}`);
  }

  /**
   * Trigger a rescan for a specific location
   * Uses existing audit-management API for rescan functionality
   */
  async rescanLocation(customerId, locationId) {
    return this.http.post(`/audit-management/customers/${customerId}/locations/${locationId}/rescan`);
  }

  /**
   * Get customer audit status (for monitoring rescan progress)
   * Uses existing audit-management API
   */
  async getCustomerStatus(customerId) {
    return this.http.get(`/audit-management/customers/${customerId}/status`);
  }

  // ============================================
  // UNIT RELATIONSHIPS ENDPOINTS (ADDITIVE)
  // ============================================

  /**
   * Get unit-to-unit relationships for a location
   */
  async getUnitRelationships(locationId) {
    return this.http.get(`/audit/locations/${locationId}/unit-relationships`);
  }

  /**
   * Create unit-to-unit relationships
   */
  async createUnitRelationships(locationId, relationships) {
    return this.http.post(`/audit/locations/${locationId}/unit-relationships`, { relationships });
  }

  /**
   * Delete a specific unit relationship
   */
  async deleteUnitRelationship(locationId, relationshipId) {
    return this.http.delete(`/audit/locations/${locationId}/unit-relationships/${relationshipId}`);
  }

  // ============================================
  // PROFILES & CONTRACTS ENDPOINTS (ADDITIVE)
  // ============================================

  /**
   * Create a new charge profile for a customer
   */
  async createChargeProfile(customerId, profile) {
    return this.http.post(`/audit/profiles/${customerId}`, profile);
  }

  /**
   * Get all profiles for a customer (includes charge profiles)
   */
  async getProfiles(customerId) {
    return this.http.get(`/audit/profiles/${customerId}`);
  }

  // ============================================
  // AUDIT HISTORY ENDPOINTS
  // ============================================

  /**
   * Get audit run history for a customer
   */
  async getAuditHistory(customerId) {
    return this.http.get(`/audit/runs/${customerId}`);
  }

  /**
   * Get detailed results for a specific audit run
   */
  async getAuditResults(auditRunId) {
    return this.http.get(`/audit/results/${auditRunId}`);
  }

  // ============================================
  // LEGACY/FALLBACK ENDPOINTS (for backward compatibility)
  // ============================================

  /**
   * Legacy test endpoint (if new endpoints aren't available)
   */
  async getTestAuditData(customerId, options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.audit_mode) params.append('audit_mode', options.audit_mode);
    if (options.skip_days) params.append('skip_days', options.skip_days);

    return this.http.get(`/test/asset-profiles/${customerId}?${params.toString()}`);
  }
}

// Create singleton instance
export const auditClient = new AuditClient();

// Export the class as well for testing
export { AuditClient };
