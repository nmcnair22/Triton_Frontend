import { defineStore } from 'pinia';
import { auditClient } from '@/services/auditClient';

export const useWorkbenchStore = defineStore('workbench', {
  state: () => ({
    // Current context
    currentLocationId: null,
    currentCustomerId: null,
    auditRunId: null,
    locationDetail: null,
    
    // Core data
    rawAssets: null,
    assetUnits: [],
    unitRelationships: [],
    allocationResult: null,
    exceptions: [],
    issues: [],
    notes: [],
    auditRuns: [],
    previousSignatures: null,
    signatureChanged: false,
    
    // Additive data for new features
    profiles: [],
    contracts: [],
    charges: [],
    
    // Tab states
    tabStates: {
      rawAssetsReviewed: false,
      allocationSaved: false
    },
    
    // Loading states
    loading: {
      location: false,
      rawAssets: false,
      units: false,
      relationships: false,
      allocation: false,
      exceptions: false,
      issues: false,
      history: false,
      rescan: false
    },
    
    // Error states
    errors: {
      rawAssets: null,
      units: null,
      relationships: null,
      allocation: null,
      exceptions: null,
      issues: null,
      history: null,
      rescan: null
    },
    
    // Cache timestamps
    lastFetch: {
      rawAssets: null,
      units: null,
      relationships: null,
      allocation: null,
      exceptions: null,
      issues: null
    }
  }),

  getters: {
    // ============================================
    // ASSET & UNITS ANALYSIS
    // ============================================

    /**
     * Check if there are unmapped assets
     */
    hasUnmappedAssets: (state) => {
      if (!state.rawAssets || !state.assetUnits.length) return false;
      
      // Get all raw assets from all categories
      const allRawAssets = [];
      const rawAssetsData = state.rawAssets.raw_assets || {};
      
      // Collect all assets with their IDs
      Object.keys(rawAssetsData).forEach(assetType => {
        if (Array.isArray(rawAssetsData[assetType])) {
          rawAssetsData[assetType].forEach(asset => {
            if (asset.id) {
              allRawAssets.push(asset.id);
            }
          });
        }
      });
      
      // Get all linked asset IDs
      const linkedAssetIds = state.assetUnits.flatMap(unit => 
        (unit.links || []).map(link => link.raw_id)
      );
      
      // Check if any assets are not linked
      return allRawAssets.some(assetId => !linkedAssetIds.includes(assetId));
    },

    /**
     * Count of open issues
     */
    openIssuesCount: (state) => {
      return state.issues.filter(issue => 
        ['open', 'in_progress'].includes(issue.status)
      ).length;
    },

    /**
     * Get count of units
     */
    unitCount: (state) => state.assetUnits.length,

    /**
     * Get count of open issues
     */
    openIssuesCount: (state) => 
      state.issues.filter(issue => 
        ['open', 'in_progress'].includes(issue.status)
      ).length,

    /**
     * Get asset counts by type
     */
    assetCountsByType: (state) => {
      if (!state.rawAssets) return {};
      
      const counts = {};
      const rawAssetsData = state.rawAssets.raw_assets || {};
      
      Object.keys(rawAssetsData).forEach(assetType => {
        if (Array.isArray(rawAssetsData[assetType])) {
          counts[assetType] = rawAssetsData[assetType].length;
        }
      });
      
      return counts;
    },

    /**
     * Get units grouped by category
     */
    unitsByCategory: (state) => {
      const grouped = {};
      
      state.assetUnits.forEach(unit => {
        const category = unit.category || 'unknown';
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(unit);
      });
      
      return grouped;
    },

    /**
     * Check if allocation can be run
     */
    canRunAllocation: (state) => {
      return state.assetUnits.length > 0; // At least one unit required
    },

    /**
     * Get allocation summary
     */
    allocationSummary: (state) => {
      if (!state.allocationResult) return null;
      
      const result = state.allocationResult;
      return {
        requiredCount: Object.values(result.required || {}).reduce((sum, count) => sum + count, 0),
        availableCount: Object.values(result.available || {}).reduce((sum, count) => sum + count, 0),
        uncoveredCount: (result.uncovered || []).length,
        unusedCount: (result.unused || []).length,
        mismatchCount: (result.mismatches || []).length,
        isPerfect: (result.uncovered || []).length === 0 && 
                  (result.unused || []).length === 0 && 
                  (result.mismatches || []).length === 0
      };
    },

    // ============================================
    // ISSUES & EXCEPTIONS ANALYSIS
    // ============================================

    /**
     * Count of open + in_progress issues for badge display
     */
    openIssuesCount: (state) => {
      if (!state.locationDetail?.issues) return 0;
      
      return state.locationDetail.issues.filter(issue => 
        issue.status === 'open' || issue.status === 'in_progress'
      ).length;
    }
  },

  actions: {
    // ============================================
    // INITIALIZATION
    // ============================================

    /**
     * Initialize workbench for a location
     */
    async initializeLocation(customerId, locationId, auditRunId = null) {
      console.log('Initializing workbench for location:', { customerId, locationId, auditRunId });
      
      this.currentCustomerId = customerId;
      this.currentLocationId = locationId;
      this.auditRunId = auditRunId;
      
      // Clear previous data
      this.clearAllData();
      
      // Load initial data
      await Promise.all([
        this.loadRawAssets(locationId, auditRunId),
        this.loadAssetUnits(locationId)
      ]);
    },

    // ============================================
    // RAW ASSETS MANAGEMENT
    // ============================================

    /**
     * Load raw assets for location
     */
    async loadRawAssets(locationId, auditRunId = null) {
      this.loading.rawAssets = true;
      this.errors.rawAssets = null;
      
      try {
        console.log('Loading raw assets for location:', locationId, auditRunId ? `(run: ${auditRunId})` : '(latest)');
        
        const response = await auditClient.getRawAssets(locationId, auditRunId);
        this.rawAssets = response.data;
        this.lastFetch.rawAssets = new Date();
        
        console.log('Raw assets loaded:', this.rawAssets);
      } catch (error) {
        console.error('Failed to load raw assets:', error);
        this.errors.rawAssets = error.response?.data?.message || 'Failed to load raw assets';
        throw error;
      } finally {
        this.loading.rawAssets = false;
      }
    },

    /**
     * Set raw assets as reviewed
     */
    setRawAssetsReviewed(reviewed = true) {
      console.log('Setting raw assets reviewed:', reviewed);
      this.tabStates.rawAssetsReviewed = reviewed;
      
      // Persist to localStorage
      if (this.currentLocationId) {
        localStorage.setItem(
          `workbench_raw_reviewed_${this.currentLocationId}`, 
          reviewed.toString()
        );
      }
    },

    // ============================================
    // ASSET UNITS MANAGEMENT
    // ============================================

    /**
     * Load asset units and their links
     */
    async loadAssetUnits(locationId) {
      this.loading.units = true;
      this.errors.units = null;
      
      try {
        console.log('Loading asset units for location:', locationId);
        
        const response = await auditClient.getAssetUnits(locationId);
        this.assetUnits = response.data.units || [];
        this.lastFetch.units = new Date();
        
        console.log('Asset units loaded:', this.assetUnits);
      } catch (error) {
        console.error('Failed to load asset units:', error);
        this.errors.units = error.response?.data?.message || 'Failed to load asset units';
        
        // Don't throw - units might not exist yet (new location)
        this.assetUnits = [];
      } finally {
        this.loading.units = false;
      }
    },

    /**
     * Create a new asset unit
     */
    async createAssetUnit(locationId, unit) {
      try {
        console.log('Creating asset unit:', unit);
        
        const response = await auditClient.createAssetUnits(locationId, [unit]);
        
        // Refresh units list
        await this.loadAssetUnits(locationId);
        
        return response.data;
      } catch (error) {
        console.error('Failed to create asset unit:', error);
        throw error;
      }
    },

    /**
     * Create asset unit link with 1:1 validation
     */
    async createAssetUnitLink(locationId, link) {
      // Client-side 1:1 validation
      const existingLink = this.assetUnits
        .flatMap(unit => unit.links || [])
        .find(l => l.raw_id === link.raw_id && l.aspect === link.aspect);
        
      if (existingLink) {
        const error = new Error(`Asset ${link.raw_id} is already linked for aspect ${link.aspect}`);
        error.code = 'DUPLICATE_LINK';
        throw error;
      }
      
      try {
        console.log('Creating asset unit link:', link);
        
        const response = await auditClient.createAssetUnitLinks(locationId, [link]);
        
        // Refresh units list to show new link
        await this.loadAssetUnits(locationId);
        
        return response.data;
      } catch (error) {
        console.error('Failed to create asset unit link:', error);
        throw error;
      }
    },

    // ============================================
    // UNIT RELATIONSHIPS MANAGEMENT (NEW)
    // ============================================

    /**
     * Load unit-to-unit relationships
     */
    async loadUnitRelationships(locationId) {
      this.loading.relationships = true;
      this.errors.relationships = null;
      
      try {
        console.log('Loading unit relationships for location:', locationId);
        
        const response = await auditClient.getUnitRelationships(locationId);
        this.unitRelationships = response.data.relationships || [];
        this.lastFetch.relationships = new Date();
        
        console.log('Unit relationships loaded:', this.unitRelationships);
      } catch (error) {
        console.error('Failed to load unit relationships:', error);
        this.errors.relationships = error.response?.data?.message || 'Failed to load unit relationships';
        
        // Don't throw - relationships might not exist yet
        this.unitRelationships = [];
      } finally {
        this.loading.relationships = false;
      }
    },

    /**
     * Create unit-to-unit relationships
     */
    async createUnitRelationships(locationId, relationships) {
      try {
        console.log('Creating unit relationships:', relationships);
        
        const response = await auditClient.createUnitRelationships(locationId, relationships);
        
        // Refresh relationships list
        await this.loadUnitRelationships(locationId);
        
        return response.data;
      } catch (error) {
        console.error('Failed to create unit relationships:', error);
        throw error;
      }
    },

    /**
     * Delete a unit relationship
     */
    async deleteUnitRelationship(locationId, relationshipId) {
      try {
        console.log('Deleting unit relationship:', relationshipId);
        
        const response = await auditClient.deleteUnitRelationship(locationId, relationshipId);
        
        // Refresh relationships list
        await this.loadUnitRelationships(locationId);
        
        return response.data;
      } catch (error) {
        console.error('Failed to delete unit relationship:', error);
        throw error;
      }
    },

    /**
     * Get relationships for a specific unit
     */
    getRelationshipsForUnit(unitId) {
      return this.unitRelationships.filter(rel => 
        rel.from_unit_id === unitId || rel.to_unit_id === unitId
      );
    },

    /**
     * Check if a relationship already exists
     */
    relationshipExists(fromUnitId, toUnitId, type) {
      return this.unitRelationships.some(rel => 
        rel.from_unit_id === fromUnitId && 
        rel.to_unit_id === toUnitId && 
        rel.type === type
      );
    },

    // ============================================
    // ALLOCATION MANAGEMENT
    // ============================================

    /**
     * Run allocation analysis
     */
    async runAllocation(locationId, { chargeProfileId, serviceLevelKey, save = false }) {
      if (!this.canRunAllocation) {
        throw new Error('Cannot run allocation: no units created');
      }
      
      this.loading.allocation = true;
      this.errors.allocation = null;
      
      try {
        console.log('Running allocation:', { chargeProfileId, serviceLevelKey, save });
        
        const response = await auditClient.runAllocation(locationId, {
          charge_profile_id: chargeProfileId,
          service_level_key: serviceLevelKey,
          save
        });
        
        this.allocationResult = response.data;
        this.lastFetch.allocation = new Date();
        
        if (save) {
          this.tabStates.allocationSaved = true;
          
          // Persist to localStorage
          if (this.currentLocationId) {
            localStorage.setItem(
              `workbench_allocation_saved_${this.currentLocationId}`, 
              'true'
            );
          }
        }
        
        console.log('Allocation result:', this.allocationResult);
        return this.allocationResult;
      } catch (error) {
        console.error('Failed to run allocation:', error);
        this.errors.allocation = error.response?.data?.message || 'Failed to run allocation';
        throw error;
      } finally {
        this.loading.allocation = false;
      }
    },

    // ============================================
    // EXCEPTIONS MANAGEMENT
    // ============================================

    /**
     * Load exceptions for location
     */
    async loadExceptions(locationId) {
      this.loading.exceptions = true;
      this.errors.exceptions = null;
      
      try {
        console.log('Loading exceptions for location:', locationId);
        
        const response = await auditClient.getExceptions(locationId);
        this.exceptions = response.data || [];
        this.lastFetch.exceptions = new Date();
        
        console.log('Exceptions loaded:', this.exceptions);
      } catch (error) {
        console.error('Failed to load exceptions:', error);
        this.errors.exceptions = error.response?.data?.message || 'Failed to load exceptions';
        this.exceptions = [];
      } finally {
        this.loading.exceptions = false;
      }
    },

    /**
     * Create an exception
     */
    async createException(locationId, exception) {
      try {
        console.log('Creating exception:', exception);
        
        const response = await auditClient.createException(locationId, exception);
        
        // Refresh exceptions list
        await this.loadExceptions(locationId);
        
        return response.data;
      } catch (error) {
        console.error('Failed to create exception:', error);
        throw error;
      }
    },

    /**
     * Update an exception
     */
    async updateException(locationId, exceptionId, updates) {
      try {
        console.log('Updating exception:', exceptionId, updates);
        
        const response = await auditClient.updateException(locationId, exceptionId, updates);
        
        // Refresh exceptions list
        await this.loadExceptions(locationId);
        
        return response.data;
      } catch (error) {
        console.error('Failed to update exception:', error);
        throw error;
      }
    },

    // ============================================
    // ISSUES & NOTES MANAGEMENT
    // ============================================

    /**
     * Create an issue
     */
    async createIssue(customerId, locationId, issue) {
      try {
        console.log('Creating issue:', issue);
        
        const response = await auditClient.createIssue(customerId, locationId, issue);
        
        // Add to local state optimistically
        this.issues.push({
          ...issue,
          id: response.data.id || Date.now(),
          created_at: new Date().toISOString(),
          status: 'open'
        });
        
        return response.data;
      } catch (error) {
        console.error('Failed to create issue:', error);
        throw error;
      }
    },

    /**
     * Create a note
     */
    async createNote(customerId, locationId, note) {
      try {
        console.log('Creating note:', note);
        
        const response = await auditClient.createNote(customerId, locationId, note);
        
        // Add to local state optimistically
        this.notes.push({
          ...note,
          id: response.data.id || Date.now(),
          created_at: new Date().toISOString()
        });
        
        return response.data;
      } catch (error) {
        console.error('Failed to create note:', error);
        throw error;
      }
    },

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Clear all tab states
     */
    clearTabStates() {
      this.tabStates = {
        rawAssetsReviewed: false,
        allocationSaved: false
      };
      
      // Clear localStorage as well
      if (this.currentLocationId) {
        localStorage.removeItem(`workbench_raw_reviewed_${this.currentLocationId}`);
        localStorage.removeItem(`workbench_allocation_saved_${this.currentLocationId}`);
      }
    },

    /**
     * Load tab states from localStorage
     */
    loadTabStates() {
      if (!this.currentLocationId) return;
      
      const rawReviewed = localStorage.getItem(`workbench_raw_reviewed_${this.currentLocationId}`);
      const allocationSaved = localStorage.getItem(`workbench_allocation_saved_${this.currentLocationId}`);
      
      this.tabStates.rawAssetsReviewed = rawReviewed === 'true';
      this.tabStates.allocationSaved = allocationSaved === 'true';
    },

    /**
     * Clear all data
     */
    clearAllData() {
      this.rawAssets = null;
      this.assetUnits = [];
      this.unitRelationships = [];
      this.allocationResult = null;
      this.exceptions = [];
      this.issues = [];
      this.notes = [];
      
      this.clearTabStates();
      
      // Clear errors
      Object.keys(this.errors).forEach(key => {
        this.errors[key] = null;
      });
      
      // Clear loading states
      Object.keys(this.loading).forEach(key => {
        this.loading[key] = false;
      });
      
      // Clear timestamps
      Object.keys(this.lastFetch).forEach(key => {
        this.lastFetch[key] = null;
      });
    },

    /**
     * Refresh all data for current location
     */
    async refreshAll() {
      if (!this.currentLocationId) return;
      
      console.log('Refreshing all workbench data');
      
      await Promise.all([
        this.loadRawAssets(this.currentLocationId, this.auditRunId),
        this.loadAssetUnits(this.currentLocationId),
        this.loadUnitRelationships(this.currentLocationId),
        this.loadExceptions(this.currentLocationId)
      ]);
    },

    // ============================================
    // LOCATION MANAGEMENT
    // ============================================

    /**
     * Set current location ID
     */
    setLocationId(locationId) {
      this.currentLocationId = locationId;
    },


    /**
     * Clear location data
     */
    clearLocationData() {
      this.currentLocationId = null;
      this.currentCustomerId = null;
      this.locationDetail = null;
      this.rawAssets = null;
      this.assetUnits = [];
      this.unitRelationships = [];
      this.allocationResult = null;
      this.exceptions = [];
      this.issues = [];
      this.notes = [];
    },

    // ============================================
    // RELATIONSHIPS MANAGEMENT (ADDITIVE)
    // ============================================

    /**
     * Load unit-to-unit relationships for a location
     */
    async listUnitRelationships(locationId) {
      this.loading.relationships = true;
      this.errors.relationships = null;
      
      try {
        const res = await auditClient.getUnitRelationships(locationId);
        this.relationships = res.data?.relationships || [];
        this.lastFetch.relationships = new Date();
        return this.relationships;
      } catch (error) {
        console.error('Failed to load unit relationships:', error);
        this.errors.relationships = error.response?.data?.message || 'Failed to load relationships';
        this.relationships = [];
        throw error;
      } finally {
        this.loading.relationships = false;
      }
    },

    /**
     * Create unit-to-unit relationships
     */
    async createUnitRelationships(locationId, rows) {
      try {
        await auditClient.createUnitRelationships(locationId, rows);
        return this.listUnitRelationships(locationId);
      } catch (error) {
        console.error('Failed to create unit relationships:', error);
        throw error;
      }
    },

    /**
     * Delete a unit relationship
     */
    async deleteUnitRelationship(locationId, id) {
      try {
        await auditClient.deleteUnitRelationship(locationId, id);
        return this.listUnitRelationships(locationId);
      } catch (error) {
        console.error('Failed to delete unit relationship:', error);
        throw error;
      }
    },

    // ============================================
    // PROFILES & CONTRACTS MANAGEMENT (ADDITIVE)  
    // ============================================

    /**
     * Load all profiles for a customer (includes charge profiles)
     */
    async listProfiles(customerId) {
      try {
        const res = await auditClient.getProfiles(customerId);
        this.profiles = res.data?.profiles || [];
        return this.profiles;
      } catch (error) {
        console.error('Failed to load profiles:', error);
        throw error;
      }
    },

    /**
     * Create a new charge profile
     */
    async createChargeProfile(customerId, profile) {
      try {
        const res = await auditClient.createChargeProfile(customerId, profile);
        if (res?.data?.id && this.profiles) {
          this.profiles.push({
            id: res.data.id,
            name: profile.name,
            description: profile.description
          });
        }
        return res.data;
      } catch (error) {
        console.error('Failed to create charge profile:', error);
        throw error;
      }
    },

    /**
     * Load location detail which includes charges
     */
    async loadLocationDetail(customerId, locationId) {
      this.loading.location = true;
      
      try {
        const res = await auditClient.getLocationDetail(customerId, locationId);
        this.locationDetail = res?.data || null;
        this.charges = res?.data?.charges || [];
        this.currentCustomerId = customerId;
        this.currentLocationId = locationId;
        return this.locationDetail;
      } catch (error) {
        console.error('Failed to load location detail:', error);
        this.locationDetail = null;
        this.charges = [];
        throw error;
      } finally {
        this.loading.location = false;
      }
    },

    /**
     * Tab state setters
     */
    setRawAssetsReviewed(reviewed) {
      this.tabStates.rawAssetsReviewed = reviewed;
    },

    setAllocationSaved(saved) {
      this.tabStates.allocationSaved = saved;
    },

    clearTabStates() {
      this.tabStates.rawAssetsReviewed = false;
      this.tabStates.allocationSaved = false;
    },

    // ============================================
    // HISTORY & AUDIT RUNS MANAGEMENT
    // ============================================

    /**
     * Load audit runs for current customer (defensive - may 404)
     */
    async loadAuditRuns(customerId, locationId = null) {
      this.loading.history = true;
      this.errors.history = null;
      
      try {
        const response = await auditClient.getAuditRuns(customerId, locationId);
        this.auditRuns = response.data?.audit_runs || [];
        return this.auditRuns;
      } catch (error) {
        console.error('Failed to load audit runs:', error);
        if (error.response?.status === 404) {
          // History endpoint not available yet
          this.auditRuns = [];
          this.errors.history = 'Audit history not available';
        } else {
          this.errors.history = error.response?.data?.message || 'Failed to load audit history';
        }
        return [];
      } finally {
        this.loading.history = false;
      }
    },

    /**
     * Trigger rescan for current location and monitor progress
     */
    async rescanLocation(customerId, locationId) {
      this.loading.rescan = true;
      this.errors.rescan = null;
      
      try {
        // Trigger rescan
        await auditClient.rescanLocation(customerId, locationId);
        
        // Update status to awaiting_validation
        this.locationDetail.audit_status = 'awaiting_validation';
        
        // Clear allocation saved state since signatures may change
        this.tabStates.allocationSaved = false;
        
        // Start monitoring rescan progress
        await this.monitorRescanProgress(customerId);
        
        return true;
      } catch (error) {
        console.error('Failed to trigger rescan:', error);
        this.errors.rescan = error.response?.data?.message || 'Failed to start rescan';
        throw error;
      } finally {
        this.loading.rescan = false;
      }
    },

    /**
     * Monitor rescan progress and update when complete
     */
    async monitorRescanProgress(customerId) {
      const maxPolls = 30; // 5 minutes max
      let pollCount = 0;
      
      const pollStatus = async () => {
        try {
          if (pollCount >= maxPolls) {
            console.warn('Rescan monitoring timeout');
            return;
          }
          
          const statusResponse = await auditClient.getCustomerStatus(customerId);
          const status = statusResponse.data?.audit_status;
          
          if (status === 'idle' || status === 'completed') {
            // Rescan completed - refresh location data
            await this.loadLocationDetail(this.currentCustomerId, this.currentLocationId);
            await this.loadRawAssets(this.currentLocationId);
            
            // Check for signature changes
            this.checkSignatureChanges();
            
            // Refresh audit runs history
            await this.loadAuditRuns(customerId, this.currentLocationId);
          } else if (status === 'running' || status === 'pending') {
            // Still processing - poll again in 10 seconds
            pollCount++;
            setTimeout(pollStatus, 10000);
          }
        } catch (error) {
          console.error('Error monitoring rescan progress:', error);
        }
      };
      
      // Start polling after initial 5-second delay
      setTimeout(pollStatus, 5000);
    },

    /**
     * Check for signature changes after rescan
     */
    checkSignatureChanges() {
      if (!this.locationDetail || !this.previousSignatures) return;
      
      const currentAssetSig = this.locationDetail.asset_signature;
      const currentChargeSig = this.locationDetail.charge_signature;
      const prevAssetSig = this.previousSignatures.asset_signature;
      const prevChargeSig = this.previousSignatures.charge_signature;
      
      if (currentAssetSig !== prevAssetSig || currentChargeSig !== prevChargeSig) {
        this.signatureChanged = true;
        
        // Store new signatures for future comparison
        this.previousSignatures = {
          asset_signature: currentAssetSig,
          charge_signature: currentChargeSig
        };
      }
    },

    /**
     * Get signature diff for display
     */
    getSignatureDiff() {
      if (!this.previousSignatures || !this.locationDetail) return null;
      
      const changes = [];
      
      const currentAssetSig = this.locationDetail.asset_signature;
      const currentChargeSig = this.locationDetail.charge_signature;
      const prevAssetSig = this.previousSignatures.asset_signature;
      const prevChargeSig = this.previousSignatures.charge_signature;
      
      if (currentAssetSig !== prevAssetSig) {
        changes.push({
          type: 'asset',
          before: prevAssetSig,
          after: currentAssetSig
        });
      }
      
      if (currentChargeSig !== prevChargeSig) {
        changes.push({
          type: 'charge', 
          before: prevChargeSig,
          after: currentChargeSig
        });
      }
      
      return changes.length > 0 ? changes : null;
    },

    // ============================================
    // ISSUES & NOTES MANAGEMENT (AUDIT-MANAGEMENT)
    // ============================================

    /**
     * Create an issue and refresh location detail
     */
    async createIssue(customerId, locationId, issue) {
      this.loading.issues = true;
      this.errors.issues = null;
      
      try {
        await auditClient.createIssue(customerId, locationId, issue);
        // Refresh location detail to get updated issues list
        await this.loadLocationDetail(customerId, locationId);
        return true;
      } catch (error) {
        console.error('Failed to create issue:', error);
        this.errors.issues = error.response?.data?.message || 'Failed to create issue';
        throw error;
      } finally {
        this.loading.issues = false;
      }
    },

    /**
     * Update an issue status (defensive - may not exist)
     */
    async updateIssueStatus(customerId, locationId, issueId, status) {
      try {
        await auditClient.updateIssue(customerId, locationId, issueId, { status });
        // Refresh location detail to get updated issues
        await this.loadLocationDetail(customerId, locationId);
        return true;
      } catch (error) {
        console.error('Failed to update issue status:', error);
        if (error.response?.status === 404) {
          // Endpoint not available yet - just refresh to show current state
          await this.loadLocationDetail(customerId, locationId);
        }
        throw error;
      }
    },

    /**
     * Create a note and refresh location detail
     */
    async createNote(customerId, locationId, note) {
      this.loading.issues = true;
      this.errors.issues = null;
      
      try {
        await auditClient.createNote(customerId, locationId, note);
        // Refresh location detail to get updated notes list
        await this.loadLocationDetail(customerId, locationId);
        return true;
      } catch (error) {
        console.error('Failed to create note:', error);
        this.errors.issues = error.response?.data?.message || 'Failed to create note';
        throw error;
      } finally {
        this.loading.issues = false;
      }
    },

    // ============================================
    // EXCEPTIONS MANAGEMENT (DEFENSIVE)
    // ============================================

    /**
     * Load exceptions for a location (defensive - may 404)
     */
    async loadExceptions(locationId) {
      this.loading.exceptions = true;
      this.errors.exceptions = null;
      
      try {
        const response = await auditClient.getExceptions(locationId);
        this.exceptions = response.data?.exceptions || [];
        return this.exceptions;
      } catch (error) {
        console.error('Failed to load exceptions:', error);
        if (error.response?.status === 404) {
          // Exceptions endpoint not available yet
          this.exceptions = [];
          this.errors.exceptions = 'Exceptions not available';
        } else {
          this.errors.exceptions = error.response?.data?.message || 'Failed to load exceptions';
        }
        return [];
      } finally {
        this.loading.exceptions = false;
      }
    },

    /**
     * Create an exception (defensive - may 404)
     */
    async createException(locationId, exception) {
      this.loading.exceptions = true;
      this.errors.exceptions = null;
      
      try {
        await auditClient.createException(locationId, exception);
        // Refresh exceptions list
        await this.loadExceptions(locationId);
        return true;
      } catch (error) {
        console.error('Failed to create exception:', error);
        if (error.response?.status === 404) {
          this.errors.exceptions = 'Exceptions feature not available';
        } else {
          this.errors.exceptions = error.response?.data?.message || 'Failed to create exception';
        }
        throw error;
      } finally {
        this.loading.exceptions = false;
      }
    }
  }
});
