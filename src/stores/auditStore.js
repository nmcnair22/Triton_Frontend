import { defineStore } from 'pinia';
import { auditClient } from '@/services/auditClient';

export const useAuditStore = defineStore('audit', {
  state: () => ({
    // Current customer context
    currentCustomerId: null,
    customerStatus: null,
    
    // Background job monitoring
    isPolling: false,
    pollInterval: null,
    lastUpdated: null,
    
    // Error state
    error: null,
    
    // Reference data cache
    assetCategories: null,
    serviceLevels: {},
    chargeProfiles: {}
  }),

  getters: {
    // Customer status computed properties
    totalLocations: (state) => state.customerStatus?.total_locations || 0,
    auditedLocations: (state) => state.customerStatus?.audited_locations || 0,
    inProgressLocations: (state) => state.customerStatus?.audit_in_progress || 0,
    completedLocations: (state) => state.customerStatus?.audit_completed || 0,
    
    // Progress calculations
    auditProgress: (state) => {
      const total = state.customerStatus?.total_locations || 0;
      const audited = state.customerStatus?.audited_locations || 0;
      return total > 0 ? Math.round((audited / total) * 100) : 0;
    },
    
    // Check if any audit is currently running
    hasActiveAudit: (state) => (state.customerStatus?.audit_in_progress || 0) > 0,
    
    // Last scan information
    lastScanDate: (state) => state.customerStatus?.last_scan ? new Date(state.customerStatus.last_scan) : null,
    
    // Coverage percentage
    coveragePercentage: (state) => {
      const total = state.customerStatus?.total_locations || 0;
      const audited = state.customerStatus?.audited_locations || 0;
      return total > 0 ? Math.round((audited / total) * 100) : 0;
    }
  },

  actions: {
    // ============================================
    // CUSTOMER INITIALIZATION
    // ============================================

    /**
     * Initialize store with customer from route params
     */
    async initializeFromRoute(customerId) {
      const caller = new Error().stack.split('\n')[2]?.trim() || 'unknown';
      console.log(`[AUDIT STORE] Initializing for customer: ${customerId} | Called from: ${caller}`);
      
      this.currentCustomerId = customerId;
      this.error = null;
      
      try {
        await this.fetchCustomerStatus();
        await this.loadReferenceData();
      } catch (error) {
        console.error('Failed to initialize audit store:', error);
        this.error = error.response?.data?.message || 'Failed to load customer data';
      }
    },

    /**
     * Switch to a different customer
     */
    async switchCustomer(customerId) {
      console.log('Switching to customer:', customerId);
      
      // Stop any active polling
      this.stopStatusPolling();
      
      // Clear previous data
      this.clearCustomerData();
      
      // Initialize new customer
      await this.initializeFromRoute(customerId);
    },

    // ============================================
    // CUSTOMER STATUS MANAGEMENT
    // ============================================

    /**
     * Fetch current customer audit status
     */
    async fetchCustomerStatus() {
      if (!this.currentCustomerId) {
        console.warn('No customer ID set for status fetch');
        return;
      }

      try {
        const caller = new Error().stack.split('\n')[2]?.trim() || 'unknown';
        console.log(`[AUDIT STORE] Fetching customer status for: ${this.currentCustomerId} | Called from: ${caller}`);
        const response = await auditClient.getCustomerStatus(this.currentCustomerId);
        
        this.customerStatus = response.data;
        this.lastUpdated = new Date();
        this.error = null;
        
        console.log('Customer status updated:', this.customerStatus);
      } catch (error) {
        console.error('Failed to fetch customer status:', error);
        this.error = error.response?.data?.message || 'Failed to fetch customer status';
        throw error;
      }
    },

    /**
     * Start a full customer audit
     */
    async startFullAudit(options = {}) {
      if (!this.currentCustomerId) {
        throw new Error('No customer selected');
      }

      try {
        console.log('Starting full audit for customer:', this.currentCustomerId, 'with options:', options);
        
        const response = await auditClient.startFullAudit(this.currentCustomerId, options);
        
        // Immediately refresh status to show the new job
        await this.fetchCustomerStatus();
        
        // Start polling for progress updates
        this.startStatusPolling();
        
        return response.data;
      } catch (error) {
        console.error('Failed to start full audit:', error);
        throw error;
      }
    },

    // ============================================
    // BACKGROUND JOB MONITORING
    // ============================================

    /**
     * Start polling for status updates (10-second intervals per spec)
     */
    startStatusPolling(intervalMs = 10000) {
      if (this.pollInterval) {
        console.warn('Status polling already active');
        return;
      }

      console.log('Starting status polling every', intervalMs, 'ms');
      this.isPolling = true;
      
      this.pollInterval = setInterval(async () => {
        try {
          await this.fetchCustomerStatus();
          
          // Stop polling if no active audits (audit completed)
          if (!this.hasActiveAudit) {
            console.log('Audit completed - no active audits detected, stopping polling');
            this.stopStatusPolling();
            
            // Note: Toast notification should be handled by components, not in store polling
          }
        } catch (error) {
          console.error('Status polling error:', error);
          
          // Handle network errors gracefully - continue polling for temporary issues
          if (error.response?.status === 403 || error.response?.status === 404) {
            console.error('Access denied during polling, stopping');
            this.stopStatusPolling();
          }
          // For other errors (network issues), continue polling
        }
      }, intervalMs);
    },

    /**
     * Stop status polling
     */
    stopStatusPolling() {
      if (this.pollInterval) {
        console.log('Stopping status polling');
        clearInterval(this.pollInterval);
        this.pollInterval = null;
        this.isPolling = false;
      }
    },

    // ============================================
    // REFERENCE DATA MANAGEMENT
    // ============================================

    /**
     * Load reference data for dropdowns (cached)
     */
    async loadReferenceData() {
      try {
        // Load asset categories (global) - only once
        if (!this.assetCategories) {
          console.log('Loading asset categories (for Units & Links phase)...');
          const categoriesResponse = await auditClient.getAssetCategories();
          this.assetCategories = categoriesResponse.data;
        }

        // Load service levels for current customer - only once per customer
        if (this.currentCustomerId && !this.serviceLevels[this.currentCustomerId]) {
          console.log('Loading service levels for customer (for Licensing phase):', this.currentCustomerId);
          const serviceLevelsResponse = await auditClient.getServiceLevels(this.currentCustomerId);
          this.serviceLevels[this.currentCustomerId] = serviceLevelsResponse.data;
        }

        // Load charge profiles for current customer - only once per customer
        if (this.currentCustomerId && !this.chargeProfiles[this.currentCustomerId]) {
          console.log('Loading charge profiles for customer (for Licensing phase):', this.currentCustomerId);
          const chargeProfilesResponse = await auditClient.getChargeProfiles(this.currentCustomerId);
          this.chargeProfiles[this.currentCustomerId] = chargeProfilesResponse.data;
        }
      } catch (error) {
        console.error('Failed to load reference data:', error);
        // Don't throw - reference data is not critical for basic functionality
      }
    },

    /**
     * Get asset categories for UI dropdowns
     */
    getAssetCategories() {
      return this.assetCategories || [];
    },

    /**
     * Get service levels for current customer
     */
    getServiceLevels() {
      if (!this.currentCustomerId) return [];
      return this.serviceLevels[this.currentCustomerId] || [];
    },

    /**
     * Get charge profiles for current customer
     */
    getChargeProfiles() {
      if (!this.currentCustomerId) return [];
      return this.chargeProfiles[this.currentCustomerId] || [];
    },

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Clear all customer-specific data
     */
    clearCustomerData() {
      this.currentCustomerId = null;
      this.customerStatus = null;
      this.lastUpdated = null;
      this.error = null;
    },

    /**
     * Force refresh of all data
     */
    async refresh() {
      console.log('Force refreshing audit store data');
      
      if (this.currentCustomerId) {
        await this.fetchCustomerStatus();
        await this.loadReferenceData();
      }
    },

    /**
     * Get estimated time remaining for current audit
     */
    getEstimatedTimeRemaining() {
      if (!this.hasActiveAudit || !this.customerStatus) {
        return null;
      }

      // Simple estimation based on progress
      const total = this.totalLocations;
      const completed = this.auditedLocations;
      const remaining = total - completed;
      
      if (remaining <= 0) return 'Almost complete';
      
      // Assume ~2 minutes per location (adjust based on real data)
      const estimatedMinutes = remaining * 2;
      
      if (estimatedMinutes < 60) {
        return `~${estimatedMinutes} minutes`;
      } else {
        const hours = Math.floor(estimatedMinutes / 60);
        const minutes = estimatedMinutes % 60;
        return `~${hours}h ${minutes}m`;
      }
    }
  }
});
