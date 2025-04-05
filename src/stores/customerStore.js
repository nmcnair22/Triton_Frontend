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
    
    console.log('Starting customer fetch with params:', params);
    
    try {
      const response = await ApiService.get('/customers', params);
      // Handle the nested data structure in the API response
      if (response.data && response.data.data && response.data.data.value) {
        console.log(`Retrieved ${response.data.data.value.length} customers`);
        
        customers.value = response.data.data.value.map(customer => ({
          id: customer.id,
          number: customer.number,
          name: customer.displayName, // Use displayName for the customer name
          company: customer.type === 'Company' ? customer.displayName : '',
          address: customer.addressLine1,
          city: customer.city,
          state: customer.state,
          postalCode: customer.postalCode,
          country: customer.country,
          email: customer.email,
          phoneNumber: customer.phoneNumber
        }));
        
        console.log(`Total customers after processing: ${customers.value.length}`);
      } else {
        console.log('Unexpected response format or no customers in response:', response.data);
        customers.value = [];
      }
      
      return customers.value;
    } catch (err) {
      error.value = err.message || 'Failed to fetch customers';
      console.error('Error fetching customers:', err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  // New function to fetch active customers
  async function fetchActiveCustomers(params = {}) {
    loading.value = true;
    error.value = null;
    
    console.log('Starting active customers fetch with params:', params);
    
    try {
      // Call the active customers endpoint instead of the regular customers endpoint
      const response = await ApiService.get('/active-customers', params);
      
      if (response.data && response.data.data) {
        console.log(`Retrieved ${response.data.data.length} active customers`);
        
        // Map the response data to your frontend customer format
        customers.value = response.data.data.map(customer => ({
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
        
        console.log(`Total active customers after processing: ${customers.value.length}`);
      } else {
        console.log('Unexpected response format or no active customers in response:', response.data);
        customers.value = [];
      }
      
      return customers.value;
    } catch (err) {
      error.value = err.message || 'Failed to fetch active customers';
      console.error('Error fetching active customers:', err);
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
    fetchActiveCustomers,
    fetchCustomer,
    resetState
  };
}); 