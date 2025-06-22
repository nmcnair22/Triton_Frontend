import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ApiService } from '@/service/ApiService';

export const useLocationStore = defineStore('location', () => {
  // State
  const locations = ref([]);
  const currentLocation = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Getters
  const getLocationById = computed(() => {
    return (id) => locations.value.find(location => location.id === id);
  });

  const totalLocations = computed(() => locations.value.length);

  // Actions
  async function fetchLocations(customerId, params = {}) {
    loading.value = true;
    error.value = null;
    
    console.log(`Starting locations fetch for customer ID: ${customerId}`, params);
    
    // Convert boolean values to "0"/"1" strings for Laravel's validation
    const formattedParams = { ...params };
    if (formattedParams.archived === false) {
      formattedParams.archived = "0";
    } else if (formattedParams.archived === true) {
      formattedParams.archived = "1";
    }
    
    try {
      // Use the endpoint with Dynamics ID and specify id_type=dynamics
      const endpoint = `/cisdb/customers/${customerId}/locations`;
      const queryParams = { 
        id_type: 'dynamics',
        ...formattedParams 
      };
      
      console.log('Sending request with params:', queryParams);
      
      const response = await ApiService.get(endpoint, queryParams);
      
      if (response.data && response.data.data) {
        console.log(`Retrieved ${response.data.data.length} locations`);
        
        // Map the response data to the frontend location format
        locations.value = response.data.data.map(location => ({
          id: location.id,
          name: location.name,
          address: location.address,
          suite: location.suite,
          city: location.city,
          state: location.state,
          zipcode: location.zipcode,
          country: location.country,
          telephone: location.telephone,
          status: location.status
        }));
        
        console.log(`Total locations after processing: ${locations.value.length}`);
      } else {
        console.log('Unexpected response format or no locations in response:', response.data);
        locations.value = [];
      }
      
      return locations.value;
    } catch (err) {
      error.value = err.message || `Failed to fetch locations for customer #${customerId}`;
      console.error(`Error fetching locations for customer #${customerId}:`, err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchLocation(customerId, locationId) {
    loading.value = true;
    error.value = null;
    
    try {
      const endpoint = `/cisdb/customers/${customerId}/locations/${locationId}`;
      const response = await ApiService.get(endpoint, { id_type: 'dynamics' });
      
      if (response.data && response.data.data) {
        const location = response.data.data;
        currentLocation.value = {
          id: location.id,
          name: location.name,
          address: location.address,
          suite: location.suite,
          city: location.city,
          state: location.state,
          zipcode: location.zipcode,
          country: location.country,
          telephone: location.telephone,
          status: location.status
        };
      } else {
        currentLocation.value = null;
      }
      return currentLocation.value;
    } catch (err) {
      error.value = err.message || `Failed to fetch location #${locationId}`;
      console.error(`Error fetching location #${locationId}:`, err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  // Reset state
  function resetState() {
    locations.value = [];
    currentLocation.value = null;
    error.value = null;
  }

  return {
    // State
    locations,
    currentLocation,
    loading,
    error,
    
    // Getters
    getLocationById,
    totalLocations,
    
    // Actions
    fetchLocations,
    fetchLocation,
    resetState
  };
}); 