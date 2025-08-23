import { defineStore } from 'pinia';
import { auditClient } from '@/services/auditClient';

export const useCustomerContractsStore = defineStore('customerContracts', {
  state: () => ({
    // Current context
    currentCustomerId: null,
    
    // Customer-level data
    contracts: [],
    currentContract: null,
    sofLines: [],
    bundles: [],
    locationProfiles: [],
    
    // Loading states
    loading: {
      contracts: false,
      sof: false,
      bundles: false,
      profiles: false
    },
    
    // Error states
    errors: {
      contracts: null,
      sof: null,
      bundles: null,
      profiles: null
    }
  }),

  getters: {
    // Contract helpers
    hasActiveContract: (state) => state.currentContract !== null,
    activeContractName: (state) => state.currentContract?.name || 'None',
    contractCount: (state) => state.contracts.length,
    
    // SoF helpers
    sofLineCount: (state) => state.sofLines.length,
    sofTotalMonthly: (state) => {
      return state.sofLines
        .filter(line => line.cadence === 'Monthly')
        .reduce((sum, line) => sum + (line.final_price || 0), 0);
    },
    
    // Bundle helpers
    activeBundles: (state) => state.bundles.filter(b => b.is_active),
    bundleCount: (state) => state.bundles.length,
    
    // Profile helpers
    profileCount: (state) => state.locationProfiles.length
  },

  actions: {
    // ============================================
    // INITIALIZATION
    // ============================================
    
    async initializeCustomer(customerId) {
      console.log('Initializing customer contracts store for:', customerId);
      this.currentCustomerId = customerId;
      this.clearErrors();
      
      // Load basic contracts data
      await this.loadContracts(customerId);
    },

    clearErrors() {
      this.errors.contracts = null;
      this.errors.sof = null;
      this.errors.bundles = null;
      this.errors.profiles = null;
    },

    // ============================================
    // CONTRACTS MANAGEMENT
    // ============================================
    
    async loadContracts(customerId) {
      this.loading.contracts = true;
      this.errors.contracts = null;
      
      try {
        // Use actual backend endpoint with pagination
        const response = await auditClient.http.get('/contracts', {
          params: {
            customer_id: customerId,
            limit: 100,
            offset: 0,
            sort: 'name',
            order: 'asc'
          }
        });
        this.contracts = response.data?.contracts || [];
        
        // Auto-select first contract if available
        if (this.contracts.length > 0 && !this.currentContract) {
          this.currentContract = this.contracts[0];
        }
        
        console.log('Loaded contracts:', this.contracts.length);
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('Contracts endpoint not available yet - showing placeholder');
          this.contracts = [];
        } else {
          this.errors.contracts = error;
          console.error('Failed to load contracts:', error);
        }
      } finally {
        this.loading.contracts = false;
      }
    },

    async saveContract(customerId, contractData) {
      this.loading.contracts = true;
      this.errors.contracts = null;
      
      try {
        let response;
        
        if (contractData.id) {
          // Update existing contract
          response = await auditClient.http.patch(`/contracts/${contractData.id}`, {
            ...contractData,
            customer_id: customerId
          });
        } else {
          // Create new contract
          response = await auditClient.http.post('/contracts', {
            customer_id: customerId,
            ...contractData
          });
        }
        
        const savedContract = response.data;
        
        if (contractData.id) {
          // Update existing in array
          const index = this.contracts.findIndex(c => c.id === contractData.id);
          if (index !== -1) {
            this.contracts[index] = savedContract;
          }
        } else {
          // Add new to array
          this.contracts.push(savedContract);
        }
        
        return true;
      } catch (error) {
        this.errors.contracts = error;
        console.error('Failed to save contract:', error);
        return false;
      } finally {
        this.loading.contracts = false;
      }
    },

    async deleteContract(contractId) {
      this.loading.contracts = true;
      this.errors.contracts = null;
      
      try {
        await auditClient.http.delete(`/contracts/${contractId}`);
        
        // Remove from local array
        const index = this.contracts.findIndex(c => c.id === contractId);
        if (index !== -1) {
          this.contracts.splice(index, 1);
        }
        
        // If this was the current contract, clear it
        if (this.currentContract?.id === contractId) {
          this.currentContract = null;
        }
        
        return true;
      } catch (error) {
        this.errors.contracts = error;
        console.error('Failed to delete contract:', error);
        return false;
      } finally {
        this.loading.contracts = false;
      }
    },

    // ============================================
    // SCHEDULE OF FEES MANAGEMENT
    // ============================================
    
    async loadSofLines(contractId) {
      if (!contractId) return;
      
      this.loading.sof = true;
      this.errors.sof = null;
      
      try {
        const response = await auditClient.http.get(`/contracts/${contractId}/sof`);
        this.sofLines = response.data?.data || [];
        console.log('Loaded SoF lines:', this.sofLines.length);
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('SoF endpoint not available yet');
          this.sofLines = [];
        } else {
          this.errors.sof = error;
          console.error('Failed to load SoF lines:', error);
        }
      } finally {
        this.loading.sof = false;
      }
    },

    async saveSofLines(contractId, lines, deletedIds = []) {
      if (!contractId) return false;
      
      this.loading.sof = true;
      this.errors.sof = null;
      
      try {
        const promises = [];
        
        // Handle deletions
        if (deletedIds && deletedIds.length > 0) {
          deletedIds.forEach(id => {
            promises.push(auditClient.http.delete(`/contracts/${contractId}/sof/${id}`));
          });
        }
        
        // Create or update SOF lines individually
        if (lines && lines.length > 0) {
          lines.forEach(line => {
            if (line.id && !line._isNew) {
              promises.push(auditClient.http.patch(`/contracts/${contractId}/sof/${line.id}`, line));
            } else {
              promises.push(auditClient.http.post(`/contracts/${contractId}/sof`, line));
            }
          });
        }
        
        if (promises.length > 0) {
          await Promise.all(promises);
        }
        
        // Reload SOF lines to get server-calculated prices
        await this.loadSofLines(contractId);
        console.log('Saved SoF lines with server-calculated prices');
        return true;
      } catch (error) {
        this.errors.sof = error;
        console.error('Failed to save SoF lines:', error);
        return false;
      } finally {
        this.loading.sof = false;
      }
    },

    async saveSofLine(contractId, lineData) {
      if (!contractId) return false;
      
      this.loading.sof = true;
      this.errors.sof = null;
      
      try {
        let response;
        
        if (lineData.id && !lineData._isNew) {
          // Update existing line
          response = await auditClient.http.patch(`/contracts/${contractId}/sof/${lineData.id}`, lineData);
        } else {
          // Create new line
          response = await auditClient.http.post(`/contracts/${contractId}/sof`, lineData);
        }
        
        const savedLine = response.data;
        
        if (lineData.id) {
          // Update existing in array
          const index = this.sofLines.findIndex(l => l.id === lineData.id);
          if (index !== -1) {
            this.sofLines[index] = savedLine;
          }
        } else {
          // Add new to array
          this.sofLines.push(savedLine);
        }
        
        console.log('Saved SoF line:', savedLine);
        return true;
      } catch (error) {
        this.errors.sof = error;
        console.error('Failed to save SoF line:', error);
        return false;
      } finally {
        this.loading.sof = false;
      }
    },

    async deleteSofLine(contractId, lineId) {
      if (!contractId || !lineId) return false;
      
      this.loading.sof = true;
      this.errors.sof = null;
      
      try {
        await auditClient.http.delete(`/contracts/${contractId}/sof/${lineId}`);
        
        // Remove from local array
        const index = this.sofLines.findIndex(l => l.id === lineId);
        if (index !== -1) {
          this.sofLines.splice(index, 1);
        }
        
        console.log('Deleted SoF line:', lineId);
        return true;
      } catch (error) {
        this.errors.sof = error;
        console.error('Failed to delete SoF line:', error);
        return false;
      } finally {
        this.loading.sof = false;
      }
    },

    // ============================================
    // SERVICE BUNDLES MANAGEMENT
    // ============================================
    
    async loadBundles(contractId) {
      if (!contractId) return;
      
      this.loading.bundles = true;
      this.errors.bundles = null;
      
      try {
        const response = await auditClient.http.get(`/contracts/${contractId}/bundles`, {
          params: { limit: 100, offset: 0 }
        });
        this.bundles = response.data?.bundles || [];
        console.log('Loaded bundles:', this.bundles.length);
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('Bundles endpoint not available yet');
          this.bundles = [];
        } else {
          this.errors.bundles = error;
          console.error('Failed to load bundles:', error);
        }
      } finally {
        this.loading.bundles = false;
      }
    },

    async seedBundlesFromAudit(contractId, customerId) {
      this.loading.bundles = true;
      this.errors.bundles = null;
      
      try {
        const response = await auditClient.http.post(
          `/contracts/${contractId}/bundles/seed-from-audit`,
          {
            customer_id: customerId,
            strategy: 'most_recent'
          }
        );
        
        // Server returns newly seeded bundles
        this.bundles = response.data?.bundles || [];
        console.log('Seeded bundles from audit data');
        return true;
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('Seed from audit not available yet');
          return false;
        } else {
          this.errors.bundles = error;
          console.error('Failed to seed bundles:', error);
          return false;
        }
      } finally {
        this.loading.bundles = false;
      }
    },

    async saveBundle(contractId, bundleData) {
      this.loading.bundles = true;
      this.errors.bundles = null;
      
      try {
        let response;
        
        if (bundleData.id) {
          // Update existing bundle
          response = await auditClient.http.patch(`/contracts/${contractId}/bundles/${bundleData.id}`, bundleData);
        } else {
          // Create new bundle
          response = await auditClient.http.post(`/contracts/${contractId}/bundles`, bundleData);
        }
        
        const savedBundle = response.data;
        
        if (bundleData.id) {
          // Update existing in array
          const index = this.bundles.findIndex(b => b.id === bundleData.id);
          if (index !== -1) {
            this.bundles[index] = savedBundle;
          }
        } else {
          // Add new to array
          this.bundles.push(savedBundle);
        }
        
        return true;
      } catch (error) {
        this.errors.bundles = error;
        console.error('Failed to save bundle:', error);
        return false;
      } finally {
        this.loading.bundles = false;
      }
    },

    async deleteBundle(bundleId) {
      this.loading.bundles = true;
      this.errors.bundles = null;
      
      try {
        // Need contract ID for bundle deletion
        const bundle = this.bundles.find(b => b.id === bundleId);
        if (bundle && bundle.contract_id) {
          await auditClient.http.delete(`/contracts/${bundle.contract_id}/bundles/${bundleId}`);
        } else if (this.currentContract?.id) {
          await auditClient.http.delete(`/contracts/${this.currentContract.id}/bundles/${bundleId}`);
        }
        
        // Remove from local array
        const index = this.bundles.findIndex(b => b.id === bundleId);
        if (index !== -1) {
          this.bundles.splice(index, 1);
        }
        
        console.log('Deleted bundle:', bundleId);
        return true;
      } catch (error) {
        this.errors.bundles = error;
        console.error('Failed to delete bundle:', error);
        return false;
      } finally {
        this.loading.bundles = false;
      }
    },

    // ============================================
    // LOCATION PROFILES MANAGEMENT
    // ============================================
    
    async loadLocationProfiles(customerId) {
      this.loading.profiles = true;
      this.errors.profiles = null;
      
      try {
        // Use actual location profiles endpoint with contract filter
        const params = { customer_id: customerId };
        if (this.currentContract?.id) {
          params.contract_id = this.currentContract.id;
        }
        const response = await auditClient.http.get('/location-profiles', { params });
        // Extract just the location_profiles array, not the pagination wrapper
        this.locationProfiles = response.data?.location_profiles || response.data || [];
        console.log('Loaded location profiles:', this.locationProfiles.length);
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('Location profiles endpoint not available yet');
          this.locationProfiles = [];
        } else {
          this.errors.profiles = error;
          console.error('Failed to load location profiles:', error);
        }
      } finally {
        this.loading.profiles = false;
      }
    },

    async saveLocationProfile(customerId, profileData) {
      this.loading.profiles = true;
      this.errors.profiles = null;
      
      try {
        // Prepare the data for the API
        const apiData = {
          ...profileData,
          customer_id: customerId,
          contract_id: this.currentContract?.id
        };
        
        // Ensure configuration is a JSON string for the API
        if (apiData.configuration && typeof apiData.configuration === 'object') {
          apiData.configuration = JSON.stringify(apiData.configuration);
        }
        
        // billing_line_items should be sent as a separate field (not removed)
        
        let response;
        
        if (profileData.id) {
          // Update existing profile
          response = await auditClient.http.patch(`/location-profiles/${profileData.id}`, apiData);
        } else {
          // Create new profile
          response = await auditClient.http.post('/location-profiles', apiData);
        }
        
        // Merge the response with the original data to ensure all fields are present
        const savedProfile = {
          ...profileData,
          ...response.data,
          // Ensure display fields are preserved
          location_count: response.data.location_count || profileData.location_count || 0,
          monthly_revenue: response.data.monthly_revenue || profileData.monthly_revenue || 0
        };
        
        if (profileData.id) {
          // Update existing in array
          const index = this.locationProfiles.findIndex(p => p.id === profileData.id);
          if (index !== -1) {
            this.locationProfiles[index] = savedProfile;
          }
        } else {
          // Add new to array with all fields
          this.locationProfiles.push(savedProfile);
        }
        
        return true;
      } catch (error) {
        this.errors.profiles = error;
        console.error('Failed to save location profile:', error);
        return false;
      } finally {
        this.loading.profiles = false;
      }
    },

    async deleteLocationProfile(profileId) {
      this.loading.profiles = true;
      this.errors.profiles = null;
      
      try {
        await auditClient.http.delete(`/location-profiles/${profileId}`);
        
        // Remove from local array
        const index = this.locationProfiles.findIndex(p => p.id === profileId);
        if (index !== -1) {
          this.locationProfiles.splice(index, 1);
        }
        
        console.log('Deleted location profile:', profileId);
        return true;
      } catch (error) {
        this.errors.profiles = error;
        console.error('Failed to delete location profile:', error);
        return false;
      } finally {
        this.loading.profiles = false;
      }
    },

    // ============================================
    // CONTRACT SWITCHING
    // ============================================
    
    async switchContract(contract) {
      console.log('Switching to contract:', contract.name);
      this.currentContract = contract;
      
      // Load related data for the new contract
      await Promise.all([
        this.loadSofLines(contract.id),
        this.loadBundles(contract.id)
      ]);
    }
  },
  
  // ============================================
  // GETTERS (Computed Properties)
  // ============================================
  
  getters: {
    hasActiveContract: (state) => {
      return state.currentContract && 
             state.currentContract.status && 
             ['Active', 'Signed'].includes(state.currentContract.status);
    }
  }
});