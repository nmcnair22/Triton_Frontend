import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ApiService } from '@/service/ApiService';

export const useTemAccountStore = defineStore('temAccount', () => {
  // State
  const accounts = ref([]);
  const currentAccount = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Getters
  const getAccountById = computed(() => {
    return (id) => accounts.value.find(account => account.id === id);
  });

  const totalAccounts = computed(() => accounts.value.length);

  // Actions
  async function fetchAccountsByLocation(locationId, params = {}) {
    loading.value = true;
    error.value = null;
    
    console.log(`Starting TEM accounts fetch for location ID: ${locationId}`, params);
    
    // Convert boolean values to "0"/"1" strings for Laravel's validation
    const formattedParams = { ...params };
    if (formattedParams.archived === false) {
      formattedParams.archived = "0";
    } else if (formattedParams.archived === true) {
      formattedParams.archived = "1";
    }
    
    try {
      // Use the TEM accounts endpoint with location ID filter
      const endpoint = `/cisdb/tem/accounts`;
      const queryParams = { 
        id_location: locationId,
        ...formattedParams 
      };
      
      console.log('Sending request with params:', queryParams);
      
      const response = await ApiService.get(endpoint, queryParams);
      
      // Log the raw response for debugging
      console.log('Raw TEM accounts response:', JSON.stringify(response.data, null, 2));
      
      if (response.data && response.data.data) {
        console.log(`Retrieved ${response.data.data.length} TEM accounts`);
        
        // Map the response data to the frontend account format
        const mappedAccounts = response.data.data.map(account => {
          // Log the raw account data to see exactly what properties are available
          console.log('Raw account data:', JSON.stringify(account, null, 2));
          
          // Create a mapped account with all properties we need
          const mappedAccount = {
            id: account.id || '',
            accountNumber: account.accountNumber || '',
            name: account.customerName || account.accountNumber || 'Unknown Account',
            
            // Customer information
            customerName: account.customerName || '',
            locationName: account.locationName || '',
            vendorName: account.vendorName || '',
            
            // Financial information
            vendorBalance: account.vendorBalance || '0.00',
            expectedAmount: account.expectedAmount || '0.00',
            lastAmount: account.lastAmount || '0.00',
            
            // Address information
            address1: account.address1 || '',
            address2: account.address2 === 'NULL' ? '' : account.address2 || '',
            addressCity: account.addressCity || '',
            addressState: account.addressState || '',
            addressZip: account.addressZip || '',
            
            // Service information
            providerName: account.providerName || '',
            status: account.status || 0,
            
            // Payment information
            billType: account.billType || '',
            payType: account.payType || '',
            
            // Portal information
            url: account.url || '',
            username: account.username || '',
            password: account.password || ''
          };
          
          // Log each mapped account for debugging
          console.log(`Mapped TEM account ${account.id}:`, mappedAccount);
          
          return mappedAccount;
        });
        
        accounts.value = mappedAccounts;
        console.log(`Total TEM accounts after processing: ${accounts.value.length}`);
      } else {
        console.log('Unexpected response format or no TEM accounts in response:', response.data);
        accounts.value = [];
      }
      
      return accounts.value;
    } catch (err) {
      error.value = err.message || `Failed to fetch TEM accounts for location #${locationId}`;
      console.error(`Error fetching TEM accounts for location #${locationId}:`, err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchAccountsByCustomer(customerId, params = {}) {
    loading.value = true;
    error.value = null;
    
    console.log(`Starting TEM accounts fetch for customer ID: ${customerId}`, params);
    
    try {
      // Use the TEM accounts endpoint with customer ID filter
      const endpoint = `/cisdb/tem/accounts`;
      const queryParams = { 
        id_customer: customerId,
        ...params 
      };
      
      console.log('Sending request with params:', queryParams);
      
      const response = await ApiService.get(endpoint, queryParams);
      
      if (response.data && response.data.data) {
        console.log(`Retrieved ${response.data.data.length} TEM accounts`);
        
        // Map the response data to the frontend account format
        accounts.value = response.data.data.map(account => ({
          id: account.id || account.accountId || '',
          accountNumber: account.accountNumber || '',
          name: account.accountName || account.name || 'Account ' + account.accountNumber,
          providerName: account.providerName || '',
          balance: account.currentBalance || 0,
          status: account.status || '',
          vendor: account.vendorName || '',
          monthly: account.monthlyRecurring || 0
        }));
        
        console.log(`Total TEM accounts after processing: ${accounts.value.length}`);
      } else {
        console.log('Unexpected response format or no TEM accounts in response:', response.data);
        accounts.value = [];
      }
      
      return accounts.value;
    } catch (err) {
      error.value = err.message || `Failed to fetch TEM accounts for customer #${customerId}`;
      console.error(`Error fetching TEM accounts for customer #${customerId}:`, err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  // Reset state
  function resetState() {
    accounts.value = [];
    currentAccount.value = null;
    error.value = null;
  }

  return {
    // State
    accounts,
    currentAccount,
    loading,
    error,
    
    // Getters
    getAccountById,
    totalAccounts,
    
    // Actions
    fetchAccountsByLocation,
    fetchAccountsByCustomer,
    resetState
  };
}); 