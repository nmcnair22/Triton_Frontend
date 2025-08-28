import axios from 'axios';

class TEMClient {
  constructor() {
    this.http = axios.create({
      baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/tem/audit`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add CSRF token interceptor (reusing pattern from auditClient)
    this.http.interceptors.request.use((config) => {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
      if (csrfToken) {
        config.headers['X-CSRF-TOKEN'] = csrfToken;
      }
      
      // Add auth token to requests
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      
      return config;
    });

    // Add response interceptor for error handling
    this.http.interceptors.response.use(
      (response) => response,
      (error) => {
        // Log errors for debugging
        console.error('TEM API Error:', {
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
  // CUSTOMER ENDPOINTS
  // ============================================

  /**
   * Get paginated list of TEM customers with optimized data
   * Uses the new /customers/tem endpoint for fast performance
   */
  async getCustomers(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page);
    if (filters.per_page) params.append('per_page', filters.per_page);
    if (filters.search) params.append('search', filters.search);
    if (filters.sort) params.append('sort', filters.sort);
    
    return this.http.get(`/customers/tem?${params.toString()}`);
  }

  /**
   * Get detailed customer information
   */
  async getCustomerDetail(customerId, includes = ['locations', 'funding']) {
    const params = new URLSearchParams();
    if (includes.length > 0) params.append('include', includes.join(','));
    
    return this.http.get(`/customers/${customerId}?${params.toString()}`);
  }

  /**
   * Get customer locations with pagination and filtering
   */
  async getCustomerLocations(customerId, filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page);
    if (filters.per_page) params.append('per_page', filters.per_page);
    if (filters.search) params.append('search', filters.search);
    if (filters.sort) params.append('sort', filters.sort);
    
    return this.http.get(`/customers/${customerId}/locations?${params.toString()}`);
  }

  /**
   * Get customer TEM locations with business metrics and account details
   * Uses the optimized TEM endpoint for business intelligence
   */
  async getCustomerTEMLocations(customerId, filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page);
    if (filters.per_page) params.append('per_page', filters.per_page);
    if (filters.search) params.append('search', filters.search);
    if (filters.sort) params.append('sort', filters.sort);
    
    return this.http.get(`/customers/${customerId}/locations/tem?${params.toString()}`);
  }

  /**
   * Get enhanced customer TEM locations with detailed metrics and recent activity
   */
  async getCustomerTEMLocationsEnhanced(customerId, filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page);
    if (filters.per_page) params.append('per_page', filters.per_page);
    if (filters.provider_id) params.append('filter[provider_id]', filters.provider_id);
    if (filters.search) params.append('search', filters.search);
    if (filters.sort) params.append('sort', filters.sort);
    
    return this.http.get(`/customers/${customerId}/locations/tem-enhanced?${params.toString()}`);
  }

  /**
   * Get customer accounts with filtering
   */
  async getCustomerAccounts(customerId, filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page);
    if (filters.per_page) params.append('per_page', filters.per_page);
    if (filters.provider) params.append('filter[provider]', filters.provider);
    if (filters.status) params.append('filter[status]', filters.status);
    if (filters.flagged !== undefined) params.append('filter[flagged]', filters.flagged);
    
    return this.http.get(`/customers/${customerId}/accounts?${params.toString()}`);
  }

  /**
   * Get customer bills with date range and filtering
   */
  async getCustomerBills(customerId, filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.status) params.append('filter[status]', filters.status);
    if (filters.payment_status) params.append('filter[payment_status]', filters.payment_status);
    if (filters.page) params.append('page', filters.page);
    if (filters.per_page) params.append('per_page', filters.per_page);
    
    return this.http.get(`/customers/${customerId}/bills?${params.toString()}`);
  }

  /**
   * Get customer funding details
   */
  async getCustomerFunding(customerId) {
    return this.http.get(`/customers/${customerId}/funding`);
  }

  /**
   * Get customer dashboard data
   */
  async getCustomerDashboard() {
    return this.http.get('/customers/dashboard');
  }

  /**
   * Search customers by name/abbreviation
   */
  async searchCustomers(searchTerm) {
    return this.http.get(`/customers/search?term=${encodeURIComponent(searchTerm)}`);
  }

  /**
   * Get customers with issues
   */
  async getCustomersWithIssues() {
    return this.http.get('/customers/with-issues');
  }

  /**
   * Get customer summary
   */
  async getCustomerSummary(customerId) {
    return this.http.get(`/customers/${customerId}/summary`);
  }

  /**
   * Get customer analytics
   */
  async getCustomerAnalytics(customerId, months = 12) {
    return this.http.get(`/customers/${customerId}/analytics?months=${months}`);
  }

  // ============================================
  // LOCATION ENDPOINTS
  // ============================================

  /**
   * Get locations with advanced filtering
   */
  async getLocations(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.customer_id) params.append('filter[customer_id]', filters.customer_id);
    if (filters.search) params.append('search', filters.search);
    if (filters.city) params.append('filter[city]', filters.city);
    if (filters.state) params.append('filter[state]', filters.state);
    if (filters.provider_id) params.append('filter[provider_id]', filters.provider_id);
    if (filters.cost_min) params.append('filter[cost_min]', filters.cost_min);
    if (filters.cost_max) params.append('filter[cost_max]', filters.cost_max);
    if (filters.page) params.append('page', filters.page);
    if (filters.per_page) params.append('per_page', filters.per_page);
    if (filters.sort) params.append('sort', filters.sort);
    
    return this.http.get(`/locations?${params.toString()}`);
  }

  /**
   * Get location detail with accounts
   */
  async getLocationDetail(locationId) {
    return this.http.get(`/locations/${locationId}?include=accounts,bills`);
  }

  /**
   * Get location accounts
   */
  async getLocationAccounts(locationId) {
    return this.http.get(`/locations/${locationId}/accounts`);
  }

  /**
   * Get location bills
   */
  async getLocationBills(locationId, filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.page) params.append('page', filters.page);
    
    return this.http.get(`/locations/${locationId}/bills?${params.toString()}`);
  }

  /**
   * Get location accounts with TEM business metrics
   * Perfect for location detail accounts column
   */
  async getLocationTEMAccounts(customerId, locationId, filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.vendor_id) params.append('vendor_id', filters.vendor_id);
    
    return this.http.get(`/customers/${customerId}/locations/${locationId}/accounts?${params.toString()}`);
  }

  /**
   * Get location bills timeline with TEM business intelligence
   * Perfect for location detail bills timeline column
   */
  async getLocationTEMBillsTimeline(customerId, locationId, filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.months) params.append('months', filters.months);
    if (filters.vendor_id) params.append('vendor_id', filters.vendor_id);
    
    return this.http.get(`/customers/${customerId}/locations/${locationId}/bills?${params.toString()}`);
  }

  /**
   * Compare multiple locations
   */
  async compareLocations(locationIds, metrics = ['monthly_cost', 'provider_count', 'bill_trends']) {
    return this.http.post('/locations/compare', {
      location_ids: locationIds,
      metrics: metrics
    });
  }

  /**
   * Get location orders with TEM integration
   */
  async getLocationTEMOrders(customerId, locationId, filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.months) params.append('months', filters.months);
    if (filters.include_archived !== undefined) params.append('include_archived', filters.include_archived);
    
    return this.http.get(`/customers/${customerId}/locations/${locationId}/orders?${params.toString()}`);
  }

  /**
   * Get location cancellations with TEM linkage
   */
  async getLocationTEMCancellations(customerId, locationId, filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.months) params.append('months', filters.months);
    if (filters.include_archived !== undefined) params.append('include_archived', filters.include_archived);
    
    return this.http.get(`/customers/${customerId}/locations/${locationId}/cancellations?${params.toString()}`);
  }

  // ============================================
  // ACCOUNT ENDPOINTS
  // ============================================

  /**
   * Get account inventory with advanced filtering
   */
  async getAccounts(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.customer_ids?.length) {
      filters.customer_ids.forEach(id => params.append('filter[customer_ids][]', id));
    }
    if (filters.provider_ids?.length) {
      filters.provider_ids.forEach(id => params.append('filter[provider_ids][]', id));
    }
    if (filters.location_ids?.length) {
      filters.location_ids.forEach(id => params.append('filter[location_ids][]', id));
    }
    if (filters.status) params.append('filter[status]', filters.status);
    if (filters.flagged !== undefined) params.append('filter[flagged]', filters.flagged);
    if (filters.page) params.append('page', filters.page);
    if (filters.per_page) params.append('per_page', filters.per_page);
    if (filters.sort) params.append('sort', filters.sort);
    
    return this.http.get(`/accounts?${params.toString()}`);
  }

  /**
   * Get account details
   */
  async getAccountDetail(accountId) {
    return this.http.get(`/accounts/${accountId}?include=bills,customer,location`);
  }

  /**
   * Update account information
   */
  async updateAccount(accountId, updates) {
    return this.http.put(`/accounts/${accountId}`, updates);
  }

  /**
   * Get account bill history
   */
  async getAccountBills(accountId) {
    return this.http.get(`/accounts/${accountId}/bills`);
  }

  /**
   * Create account flag
   */
  async createAccountFlag(accountId, flag) {
    return this.http.post(`/accounts/${accountId}/flags`, flag);
  }

  // ============================================
  // BILL ENDPOINTS
  // ============================================

  // ============================================
  // BILL DASHBOARD & MANAGEMENT ENDPOINTS
  // ============================================

  /**
   * Get bill management dashboard
   */
  async getBillDashboard() {
    return this.http.get('/bills/dashboard');
  }

  /**
   * Get unpaid bills
   */
  async getUnpaidBills(customerId = null) {
    const params = new URLSearchParams();
    if (customerId) params.append('customer_id', customerId);
    return this.http.get(`/bills/unpaid?${params.toString()}`);
  }

  /**
   * Get overdue bills
   */
  async getOverdueBills() {
    return this.http.get('/bills/overdue');
  }

  /**
   * Get bills due within specified days
   */
  async getBillsDueWithin(days = 7) {
    return this.http.get(`/bills/due-within?days=${days}`);
  }

  /**
   * Get high amount bills
   */
  async getHighAmountBills(threshold = 1000) {
    return this.http.get(`/bills/high-amount?threshold=${threshold}`);
  }

  /**
   * Search bills by invoice number
   */
  async searchBills(searchTerm) {
    return this.http.get(`/bills/search?term=${encodeURIComponent(searchTerm)}`);
  }

  /**
   * Get bill summary by date range
   */
  async getBillSummaryByDateRange(startDate, endDate) {
    return this.http.get(`/bills/summary-by-date-range?start_date=${startDate}&end_date=${endDate}`);
  }

  /**
   * Get customer bill analytics
   */
  async getCustomerBillAnalytics(customerId, months = 6) {
    return this.http.get(`/bills/${customerId}/analytics?months=${months}`);
  }

  /**
   * Update bill payment status
   */
  async updateBillPaymentStatus(billId, paymentData) {
    return this.http.patch(`/bills/${billId}/payment-status`, paymentData);
  }

  /**
   * Process bulk payments
   */
  async processBulkPayments(billIds, paymentData) {
    return this.http.post('/bills/bulk-payments', {
      bill_ids: billIds,
      ...paymentData
    });
  }

  /**
   * Get bills with advanced search and filtering
   */
  async getBills(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.invoice_number) params.append('invoice_number', filters.invoice_number);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.amount_min) params.append('amount_min', filters.amount_min);
    if (filters.amount_max) params.append('amount_max', filters.amount_max);
    if (filters.status?.length) {
      filters.status.forEach(s => params.append('filter[status][]', s));
    }
    if (filters.payment_status?.length) {
      filters.payment_status.forEach(ps => params.append('filter[payment_status][]', ps));
    }
    if (filters.customer_ids?.length) {
      filters.customer_ids.forEach(id => params.append('filter[customer_ids][]', id));
    }
    if (filters.provider_ids?.length) {
      filters.provider_ids.forEach(id => params.append('filter[provider_ids][]', id));
    }
    if (filters.page) params.append('page', filters.page);
    if (filters.per_page) params.append('per_page', filters.per_page);
    if (filters.sort) params.append('sort', filters.sort);
    
    return this.http.get(`/bills?${params.toString()}`);
  }

  /**
   * Get bill details with audit trail
   */
  async getBillDetail(billId) {
    return this.http.get(`/bills/${billId}?include=customer,account,audit_trail`);
  }

  /**
   * Update bill status
   */
  async updateBillStatus(billId, status, notes = '') {
    return this.http.put(`/bills/${billId}/status`, {
      status: status,
      notes: notes
    });
  }

  /**
   * Add note to bill
   */
  async addBillNote(billId, note) {
    return this.http.post(`/bills/${billId}/notes`, note);
  }

  // ============================================
  // AUDIT & VALIDATION ENDPOINTS
  // ============================================

  /**
   * Get audit validations
   */
  async getValidations(filters = {}) {
    const params = new URLSearchParams();
    if (filters.customer_id) params.append('filter[customer_id]', filters.customer_id);
    if (filters.type) params.append('filter[type]', filters.type);
    if (filters.status) params.append('filter[status]', filters.status);
    if (filters.severity) params.append('filter[severity]', filters.severity);
    if (filters.assigned_to) params.append('filter[assigned_to]', filters.assigned_to);
    if (filters.page) params.append('page', filters.page);
    if (filters.per_page) params.append('per_page', filters.per_page);
    
    return this.http.get(`/validations?${params.toString()}`);
  }

  /**
   * Get validation dashboard
   */
  async getValidationDashboard() {
    return this.http.get('/validations/dashboard');
  }

  /**
   * Get pending validations
   */
  async getPendingValidations() {
    return this.http.get('/validations/pending');
  }

  /**
   * Get overdue validations
   */
  async getOverdueValidations() {
    return this.http.get('/validations/overdue');
  }

  /**
   * Get high priority validations
   */
  async getHighPriorityValidations(threshold = 70) {
    return this.http.get(`/validations/high-priority?threshold=${threshold}`);
  }

  /**
   * Get validation statistics
   */
  async getValidationStatistics(filters = {}) {
    const params = new URLSearchParams();
    if (filters.customer_id) params.append('customer_id', filters.customer_id);
    if (filters.date_from) params.append('date_from', filters.date_from);
    
    return this.http.get(`/validations/statistics?${params.toString()}`);
  }

  /**
   * Search validations
   */
  async searchValidations(searchTerm) {
    return this.http.get(`/validations/search?term=${encodeURIComponent(searchTerm)}`);
  }

  /**
   * Get validations by type
   */
  async getValidationsByType(type) {
    return this.http.get(`/validations/by-type/${type}`);
  }

  /**
   * Get validation detail
   */
  async getValidationDetail(validationId) {
    return this.http.get(`/validations/${validationId}`);
  }

  /**
   * Run audit for customer
   */
  async runCustomerAudit(customerId) {
    return this.http.post(`/validations/${customerId}/run-audit`);
  }

  /**
   * Update validation status
   */
  async updateValidationStatus(validationId, statusData) {
    return this.http.patch(`/validations/${validationId}/status`, statusData);
  }

  /**
   * Bulk update validation status
   */
  async bulkUpdateValidationStatus(validationIds, statusData) {
    return this.http.post('/validations/bulk-update-status', {
      validation_ids: validationIds,
      ...statusData
    });
  }

  // ============================================
  // VARIANCE ANALYSIS ENDPOINTS
  // ============================================

  /**
   * Get variance dashboard
   */
  async getVarianceDashboard() {
    return this.http.get('/variance/dashboard');
  }

  /**
   * Get variance summary
   */
  async getVarianceSummary(customerId = null) {
    const params = new URLSearchParams();
    if (customerId) params.append('customer_id', customerId);
    return this.http.get(`/variance/summary?${params.toString()}`);
  }

  /**
   * Get high variance accounts
   */
  async getHighVarianceAccounts(threshold = 20, customerId = null) {
    const params = new URLSearchParams();
    params.append('threshold', threshold);
    if (customerId) params.append('customer_id', customerId);
    
    return this.http.get(`/variance/high-variance-accounts?${params.toString()}`);
  }

  /**
   * Get variance trends
   */
  async getVarianceTrends(customerId = null, months = 12) {
    const params = new URLSearchParams();
    params.append('months', months);
    if (customerId) params.append('customer_id', customerId);
    
    return this.http.get(`/variance/trends?${params.toString()}`);
  }

  /**
   * Get variance by account type
   */
  async getVarianceByAccountType(customerId = null) {
    const params = new URLSearchParams();
    if (customerId) params.append('customer_id', customerId);
    
    return this.http.get(`/variance/by-account-type?${params.toString()}`);
  }

  /**
   * Export variance data
   */
  async exportVarianceData(filters = {}, format = 'json') {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined) {
        params.append(key, filters[key]);
      }
    });
    params.append('format', format);
    
    return this.http.get(`/variance/export?${params.toString()}`);
  }

  /**
   * Get customer variance analysis
   */
  async getCustomerVarianceAnalysis(customerId, months = 6) {
    return this.http.get(`/variance/${customerId}/analysis?months=${months}`);
  }

  // ============================================
  // FUNDING MANAGEMENT ENDPOINTS
  // ============================================

  /**
   * Get all funding records
   */
  async getFunding(filters = {}) {
    const params = new URLSearchParams();
    if (filters.type) params.append('filter[type]', filters.type);
    if (filters.fiscal_year) params.append('filter[fiscal_year]', filters.fiscal_year);
    if (filters.status) params.append('filter[status]', filters.status);
    if (filters.page) params.append('page', filters.page);
    if (filters.per_page) params.append('per_page', filters.per_page);
    
    return this.http.get(`/funding?${params.toString()}`);
  }

  /**
   * Create funding allocation
   */
  async createFunding(fundingData) {
    return this.http.post('/funding', fundingData);
  }

  /**
   * Get funding dashboard
   */
  async getFundingDashboard() {
    return this.http.get('/funding/dashboard');
  }

  /**
   * Get active funding
   */
  async getActiveFunding() {
    return this.http.get('/funding/active');
  }

  /**
   * Get expired funding
   */
  async getExpiredFunding() {
    return this.http.get('/funding/expired');
  }

  /**
   * Get depleted funding
   */
  async getDepletedFunding() {
    return this.http.get('/funding/depleted');
  }

  /**
   * Get high utilization funding
   */
  async getHighUtilizationFunding(threshold = 80) {
    return this.http.get(`/funding/high-utilization?threshold=${threshold}`);
  }

  /**
   * Get low remaining funding
   */
  async getLowRemainingFunding(threshold = 1000) {
    return this.http.get(`/funding/low-remaining?threshold=${threshold}`);
  }

  /**
   * Get customer funding summary
   */
  async getCustomerFundingSummary() {
    return this.http.get('/funding/customer-summary');
  }

  /**
   * Get funding utilization trends
   */
  async getFundingUtilizationTrends(customerId = null, months = 12) {
    const params = new URLSearchParams();
    params.append('months', months);
    if (customerId) params.append('customer_id', customerId);
    
    return this.http.get(`/funding/utilization-trends?${params.toString()}`);
  }

  /**
   * Get funding by fiscal year
   */
  async getFundingByFiscalYear(fiscalYear) {
    return this.http.get(`/funding/by-fiscal-year/${fiscalYear}`);
  }

  /**
   * Get funding by type
   */
  async getFundingByType(fundingType) {
    return this.http.get(`/funding/by-type/${fundingType}`);
  }

  /**
   * Get funding detail
   */
  async getFundingDetail(fundingId) {
    return this.http.get(`/funding/${fundingId}`);
  }

  /**
   * Get customer funding analysis
   */
  async getCustomerFundingAnalysis(customerId) {
    return this.http.get(`/funding/${customerId}/analysis`);
  }

  /**
   * Update funding allocation
   */
  async updateFundingAllocation(fundingId, allocationData) {
    return this.http.patch(`/funding/${fundingId}/allocation`, allocationData);
  }

  // ============================================
  // LEGACY AUDIT ENDPOINTS (keeping for compatibility)
  // ============================================

  /**
   * Run variance analysis
   */
  async getVarianceAnalysis(criteria = {}) {
    const params = new URLSearchParams();
    
    if (criteria.threshold_percent) params.append('threshold_percent', criteria.threshold_percent);
    if (criteria.threshold_amount) params.append('threshold_amount', criteria.threshold_amount);
    if (criteria.include_credits !== undefined) params.append('include_credits', criteria.include_credits);
    if (criteria.date_from) params.append('date_from', criteria.date_from);
    if (criteria.date_to) params.append('date_to', criteria.date_to);
    
    return this.http.get(`/audit/variance?${params.toString()}`);
  }

  /**
   * Detect missing bills
   */
  async getMissingBills(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.days_threshold) params.append('days_threshold', filters.days_threshold);
    if (filters.customer_id) params.append('customer_id', filters.customer_id);
    if (filters.provider_id) params.append('provider_id', filters.provider_id);
    
    return this.http.get(`/audit/missing-bills?${params.toString()}`);
  }

  /**
   * Get exception queue
   */
  async getExceptions(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.exception_type) params.append('exception_type', filters.exception_type);
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page);
    
    return this.http.get(`/audit/exceptions?${params.toString()}`);
  }

  /**
   * Create audit flag
   */
  async createFlag(flag) {
    return this.http.post('/audit/flags', flag);
  }

  /**
   * Resolve multiple exceptions
   */
  async resolveExceptions(exceptionIds, resolution, notes = '') {
    return this.http.put('/audit/resolve', {
      exception_ids: exceptionIds,
      resolution: resolution,
      notes: notes
    });
  }

  // ============================================
  // EXPORT ENDPOINTS
  // ============================================

  /**
   * Export data to CSV/Excel
   */
  async exportData(type, filters = {}, format = 'csv') {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined) {
        params.append(key, filters[key]);
      }
    });
    params.append('format', format);
    
    return this.http.get(`/export/${type}?${params.toString()}`, {
      responseType: 'blob'
    });
  }
}

// Create singleton instance
export const temClient = new TEMClient();

// Export the class as well for testing
export { TEMClient };