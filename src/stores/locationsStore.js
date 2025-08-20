import { defineStore } from 'pinia';
import { auditClient } from '@/services/auditClient';

export const useLocationsStore = defineStore('locations', {
  state: () => ({
    // Location data
    locations: [],
    totalLocations: 0,
    loading: false,
    error: null,
    
    // Pagination
    currentPage: 0,
    pageSize: 25,
    
    // Sorting
    sortField: 'location_name',
    sortOrder: 'asc',
    
    // Filtering
    searchQuery: '',
    statusFilter: '',
    
    // Cache control
    lastFetch: null,
    customerId: null
  }),

  getters: {
    // Pagination info
    totalPages: (state) => Math.ceil(state.totalLocations / state.pageSize),
    
    // Current filters summary
    activeFilters: (state) => {
      const filters = [];
      if (state.searchQuery) filters.push(`Search: "${state.searchQuery}"`);
      if (state.statusFilter) filters.push(`Status: ${state.statusFilter}`);
      return filters;
    },
    
    // Check if data is stale (older than 5 minutes)
    isDataStale: (state) => {
      if (!state.lastFetch) return true;
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return state.lastFetch < fiveMinutesAgo;
    },

    // Get locations with computed status info
    locationsWithStatus: (state) => {
      return state.locations.map(location => ({
        ...location,
        hasIssues: (location.issues_count || 0) > 0,
        needsAttention: location.audit_status === 'pending' && (location.issues_count || 0) > 0,
        isComplete: location.audit_status === 'completed'
      }));
    }
  },

  actions: {
    // ============================================
    // DATA LOADING
    // ============================================

    /**
     * Load locations for a customer with current filters/pagination
     */
    async loadLocations(customerId, forceRefresh = false) {
      // Don't reload if we have recent data for the same customer
      if (!forceRefresh && this.customerId === customerId && !this.isDataStale && this.locations.length > 0) {
        console.log('Using cached locations data');
        return;
      }

      this.loading = true;
      this.error = null;
      this.customerId = customerId;
      
      try {
        console.log('Loading locations for customer:', customerId, {
          page: this.currentPage,
          pageSize: this.pageSize,
          sort: this.sortField,
          order: this.sortOrder,
          search: this.searchQuery,
          status: this.statusFilter
        });

        const response = await auditClient.getLocations(customerId, {
          limit: this.pageSize,
          offset: this.currentPage * this.pageSize,
          sort: this.sortField,
          order: this.sortOrder,
          search: this.searchQuery,
          status: this.statusFilter
        });

        this.locations = response.data.locations || [];
        this.totalLocations = response.data.total_locations || 0;
        this.lastFetch = new Date();
        
        console.log(`Loaded ${this.locations.length} locations out of ${this.totalLocations} total`);
      } catch (error) {
        console.error('Failed to load locations:', error);
        this.error = error.response?.data?.message || 'Failed to load locations';
        this.locations = [];
        this.totalLocations = 0;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Refresh current data
     */
    async refresh(customerId) {
      console.log('Refreshing locations data');
      await this.loadLocations(customerId, true);
    },

    // ============================================
    // PAGINATION MANAGEMENT
    // ============================================

    /**
     * Go to a specific page
     */
    async goToPage(customerId, page) {
      if (page < 0 || page >= this.totalPages) {
        console.warn('Invalid page number:', page);
        return;
      }
      
      this.currentPage = page;
      await this.loadLocations(customerId);
    },

    /**
     * Go to next page
     */
    async nextPage(customerId) {
      if (this.currentPage < this.totalPages - 1) {
        await this.goToPage(customerId, this.currentPage + 1);
      }
    },

    /**
     * Go to previous page
     */
    async previousPage(customerId) {
      if (this.currentPage > 0) {
        await this.goToPage(customerId, this.currentPage - 1);
      }
    },

    /**
     * Change page size
     */
    async setPageSize(customerId, newSize) {
      this.pageSize = newSize;
      this.currentPage = 0; // Reset to first page
      await this.loadLocations(customerId);
    },

    // ============================================
    // FILTERING & SORTING
    // ============================================

    /**
     * Update search and status filters
     */
    async updateFilters(customerId, { search, status }) {
      console.log('Updating filters:', { search, status });
      
      this.searchQuery = search || '';
      this.statusFilter = status || '';
      this.currentPage = 0; // Reset to first page when filtering
      
      await this.loadLocations(customerId);
    },

    /**
     * Clear all filters
     */
    async clearFilters(customerId) {
      console.log('Clearing all filters');
      
      this.searchQuery = '';
      this.statusFilter = '';
      this.currentPage = 0;
      
      await this.loadLocations(customerId);
    },

    /**
     * Update sorting
     */
    async updateSort(customerId, { field, order }) {
      console.log('Updating sort:', { field, order });
      
      this.sortField = field;
      this.sortOrder = order;
      this.currentPage = 0; // Reset to first page when sorting changes
      
      await this.loadLocations(customerId);
    },

    // ============================================
    // LOCATION OPERATIONS
    // ============================================

    /**
     * Update a location's status optimistically
     */
    async updateLocationStatus(customerId, locationId, newStatus) {
      try {
        // Optimistic update
        const location = this.locations.find(loc => loc.id === locationId);
        if (location) {
          const oldStatus = location.status;
          location.status = newStatus;
          
          try {
            await auditClient.updateLocationStatus(customerId, locationId, newStatus);
            console.log(`Location ${locationId} status updated to ${newStatus}`);
          } catch (error) {
            // Revert on error
            location.status = oldStatus;
            throw error;
          }
        }
      } catch (error) {
        console.error('Failed to update location status:', error);
        throw error;
      }
    },

    /**
     * Trigger rescan for a location
     */
    async rescanLocation(customerId, locationId) {
      try {
        await auditClient.rescanLocation(customerId, locationId);
        
        // Update the location status optimistically
        const location = this.locations.find(loc => loc.id === locationId);
        if (location) {
          location.status = 'awaiting_validation';
          location.last_audited = new Date().toISOString();
        }
        
        console.log(`Rescan initiated for location ${locationId}`);
      } catch (error) {
        console.error('Failed to rescan location:', error);
        throw error;
      }
    },

    /**
     * Create an issue for a location
     */
    async createLocationIssue(customerId, locationId, issue) {
      try {
        await auditClient.createIssue(customerId, locationId, issue);
        
        // Update issue count optimistically
        const location = this.locations.find(loc => loc.id === locationId);
        if (location) {
          location.issues_count = (location.issues_count || 0) + 1;
        }
        
        console.log(`Issue created for location ${locationId}`);
      } catch (error) {
        console.error('Failed to create location issue:', error);
        throw error;
      }
    },

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Find a location by ID
     */
    findLocationById(locationId) {
      return this.locations.find(loc => loc.id === locationId);
    },

    /**
     * Get locations by status
     */
    getLocationsByStatus(status) {
      return this.locations.filter(loc => loc.status === status);
    },

    /**
     * Get locations with issues
     */
    getLocationsWithIssues() {
      return this.locations.filter(loc => (loc.issues_count || 0) > 0);
    },

    /**
     * Clear all data (when switching customers)
     */
    clearData() {
      this.locations = [];
      this.totalLocations = 0;
      this.loading = false;
      this.error = null;
      this.currentPage = 0;
      this.searchQuery = '';
      this.statusFilter = '';
      this.lastFetch = null;
      this.customerId = null;
    },

    /**
     * Get summary statistics
     */
    getSummaryStats() {
      const stats = {
        total: this.totalLocations,
        pending: 0,
        inProgress: 0,
        awaitingValidation: 0,
        completed: 0,
        withIssues: 0
      };

      this.locations.forEach(location => {
        switch (location.audit_status) {
          case 'pending':
            stats.pending++;
            break;
          case 'in_progress':
            stats.inProgress++;
            break;
          case 'awaiting_validation':
            stats.awaitingValidation++;
            break;
          case 'completed':
            stats.completed++;
            break;
        }

        if ((location.issues_count || 0) > 0) {
          stats.withIssues++;
        }
      });

      return stats;
    }
  }
});
