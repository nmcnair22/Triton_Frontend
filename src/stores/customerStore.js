import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ApiService } from '@/service/ApiService';

export const useCustomerStore = defineStore('customer', () => {
  // State
  const customers = ref([]);
  const currentCustomer = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Getters
  const getCustomerById = computed(() => {
    return (id) => customers.value.find(customer => customer.id === id);
  });

  const totalCustomers = computed(() => customers.value.length);

  // Actions
  async function fetchCustomers(params = {}) {
    loading.value = true;
    error.value = null;
    let allCustomers = [];
    
    try {
      let hasMoreRecords = true;
      let skip = 0;
      const pageSize = 100; // Match our backend default
      let pageCount = 0;
      
      console.log('Starting customer pagination fetch');
      
      // Continue fetching until we get all customers
      while (hasMoreRecords) {
        pageCount++;
        // Add pagination parameters
        const paginationParams = {
          ...params,
          $skip: skip,
          pageSize: pageSize
        };
        
        console.log(`Fetching customer page ${pageCount} with params:`, paginationParams);
        
        const response = await ApiService.get('/customers', paginationParams);
        
        // Extract customers from this page
        let pageCustomers = [];
        if (response.data && response.data.data && response.data.data.value) {
          pageCustomers = response.data.data.value.map(customer => ({
            id: customer.id,
            number: customer.number,
            name: customer.displayName,
            company: customer.type === 'Company' ? customer.displayName : '',
            address: customer.addressLine1,
            city: customer.city,
            state: customer.state,
            postalCode: customer.postalCode,
            country: customer.country,
            email: customer.email,
            phoneNumber: customer.phoneNumber
          }));
          
          console.log(`Retrieved ${pageCustomers.length} customers on page ${pageCount}`);
          
          // Add this page's customers to our collection
          allCustomers = [...allCustomers, ...pageCustomers];
          
          // If we got fewer customers than pageSize, we're at the end
          if (pageCustomers.length < pageSize) {
            console.log(`Received ${pageCustomers.length} customers (< pageSize ${pageSize}), no more pages`);
            hasMoreRecords = false;
          }
          
          // Move to next page
          skip += pageSize;
        } else {
          console.log('Unexpected response format or no customers in response:', response.data);
          hasMoreRecords = false;
        }
      }
      
      customers.value = allCustomers;
      console.log(`Total customers retrieved: ${customers.value.length}`);
      return customers.value;
    } catch (err) {
      error.value = err.message || 'Failed to fetch customers';
      console.error('Error fetching customers:', err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchCustomer(id) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await ApiService.get(`/customers/${id}`);
      if (response.data && response.data.data) {
        const customer = response.data.data;
        currentCustomer.value = {
          id: customer.id,
          number: customer.number,
          name: customer.displayName,
          company: customer.type === 'Company' ? customer.displayName : '',
          address: customer.addressLine1,
          city: customer.city,
          state: customer.state,
          postalCode: customer.postalCode,
          country: customer.country,
          email: customer.email,
          phoneNumber: customer.phoneNumber
        };
      } else {
        currentCustomer.value = null;
      }
      return currentCustomer.value;
    } catch (err) {
      error.value = err.message || `Failed to fetch customer #${id}`;
      console.error(`Error fetching customer #${id}:`, err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  // Reset state
  function resetState() {
    customers.value = [];
    currentCustomer.value = null;
    error.value = null;
  }

  return {
    // State
    customers,
    currentCustomer,
    loading,
    error,
    
    // Getters
    getCustomerById,
    totalCustomers,
    
    // Actions
    fetchCustomers,
    fetchCustomer,
    resetState
  };
}); 