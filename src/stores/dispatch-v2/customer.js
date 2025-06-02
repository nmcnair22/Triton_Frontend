import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import DispatchApiService from '@/services/DispatchApiService'

/**
 * Customer Store for Dispatch V2 - MVP Version
 * Manages customer data with basic CRUD operations
 * Only includes MVP endpoints for core customer management
 */
export const useCustomerStore = defineStore('dispatch-customer', () => {
  // ==========================================
  // STATE (MVP - Simplified)
  // ==========================================
  
  // Customer data
  const customers = ref([])
  const currentCustomer = ref(null)
  const customerProjects = ref([])
  const customerActivity = ref([])
  const customerMetrics = ref({})
  
  // Loading states (MVP only)
  const loading = ref({
    customers: false,
    customer: false,
    projects: false,
    activity: false,
    metrics: false
  })
  
  // Error states (MVP only)
  const errors = ref({
    customers: null,
    customer: null,
    projects: null,
    activity: null,
    metrics: null
  })
  
  // Pagination
  const pagination = ref({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1
  })
  
  // Filters (Basic)
  const filters = ref({
    search: '',
    status: null
  })
  
  // Cache timestamps
  const lastFetch = ref({
    customers: null,
    customer: null,
    projects: null,
    activity: null,
    metrics: null
  })
  
  // ==========================================
  // GETTERS (MVP - Simplified)
  // ==========================================
  
  // Filtered customers (basic client-side filtering)
  const filteredCustomers = computed(() => {
    let filtered = customers.value
    
    if (filters.value.search) {
      const search = filters.value.search.toLowerCase()
      filtered = filtered.filter(customer => 
        customer.name?.toLowerCase().includes(search) ||
        customer.email?.toLowerCase().includes(search)
      )
    }
    
    if (filters.value.status) {
      filtered = filtered.filter(customer => customer.status === filters.value.status)
    }
    
    return filtered
  })
  
  // Customer counts by status
  const customerCounts = computed(() => {
    const counts = {
      total: customers.value.length,
      active: 0,
      inactive: 0
    }
    
    customers.value.forEach(customer => {
      if (customer.status === 'active') counts.active++
      else counts.inactive++
    })
    
    return counts
  })
  
  // ==========================================
  // ACTIONS (MVP - Core Operations Only)
  // ==========================================
  
  // Helper functions
  function setLoading(key, state) {
    loading.value[key] = state
  }
  
  function setError(key, error) {
    errors.value[key] = error
  }
  
  function clearErrors() {
    Object.keys(errors.value).forEach(key => {
      errors.value[key] = null
    })
  }
  
  // Fetch customers list (Working)
  async function fetchCustomers(params = {}) {
    setLoading('customers', true)
    setError('customers', null)
    
    try {
      const response = await DispatchApiService.customers.getAll({
        page: pagination.value.page,
        limit: pagination.value.limit,
        ...params
      })
      
      // Handle different response structures
      let customersData = []
      let metaData = null
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          customersData = response.data
        } else if (response.data.data && Array.isArray(response.data.data)) {
          customersData = response.data.data
          // Handle nested pagination structure from API
          metaData = response.data.meta?.pagination || response.data.meta
        } else if (response.data.customers && Array.isArray(response.data.customers)) {
          customersData = response.data.customers
          metaData = response.data.meta || response.data.pagination
        }
      }
      
      // Transform customer data to ensure consistent structure
      customers.value = customersData.map(customer => ({
        id: customer.id,
        name: customer.name,
        email: customer.contact_info?.email || customer.email,
        phone: customer.contact_info?.phone || customer.phone,
        address: customer.contact_info?.address || customer.address,
        status: customer.account_status || customer.status || 'active',
        totalProjects: customer.total_projects || 0,
        activeJobs: customer.active_jobs || 0,
        totalVisits: customer.total_visits || 0,
        totalRevenue: customer.total_revenue || 0,
        lastVisit: customer.last_visit,
        lastActivity: customer.last_visit,
        // Only use real data from API - no mock generation
        healthScore: customer.health_score || customer.healthScore,
        satisfactionScore: customer.satisfaction_score || customer.satisfactionScore
      }))
      
      // Update pagination with correct structure
      if (metaData) {
        pagination.value = {
          page: metaData.current_page || metaData.page || 1,
          limit: metaData.per_page || metaData.limit || 25,
          total: metaData.total || customersData.length,
          totalPages: metaData.last_page || metaData.totalPages || 1
        }
      }

      lastFetch.value.customers = Date.now()
      
    } catch (error) {
      console.error('Error fetching customers:', error)
      
      // Enhanced error handling with more specific messages
      let errorMessage = 'Failed to fetch customers'
      
      if (error.response) {
        const status = error.response.status
        const statusText = error.response.statusText
        const responseData = error.response.data
        
        switch (status) {
          case 500:
            errorMessage = `Server Error (${status}): The backend server encountered an internal error. Please check if the API endpoint '/api/customers/' is properly implemented.`
            break
          case 404:
            errorMessage = `Not Found (${status}): The customers API endpoint was not found. Please verify the backend routes are configured.`
            break
          case 403:
            errorMessage = `Forbidden (${status}): You don't have permission to access customer data.`
            break
          case 401:
            errorMessage = `Unauthorized (${status}): Please log in again.`
            break
          case 422:
            errorMessage = `Validation Error (${status}): ${responseData?.message || 'Invalid request parameters'}`
            break
          default:
            errorMessage = `HTTP Error (${status}): ${statusText || 'Unknown server error'}`
        }
        
        // Log detailed error information for debugging
        console.error('Detailed error information:', {
          status,
          statusText,
          url: error.config?.url,
          method: error.config?.method,
          params: error.config?.params,
          responseData,
          timestamp: new Date().toISOString()
        })
      } else if (error.request) {
        errorMessage = 'Network Error: Unable to connect to the server. Please check your internet connection and verify the backend server is running.'
        console.error('Network error details:', {
          request: error.request,
          baseURL: error.config?.baseURL,
          timeout: error.config?.timeout,
          timestamp: new Date().toISOString()
        })
      } else {
        errorMessage = `Request Error: ${error.message}`
        console.error('Request setup error:', {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        })
      }
      
      setError('customers', errorMessage)
    } finally {
      setLoading('customers', false)
    }
  }
  
  // Fetch single customer (Working)
  async function fetchCustomer(id) {
    setLoading('customer', true)
    setError('customer', null)
    
    try {
      const response = await DispatchApiService.customers.getById(id)
      currentCustomer.value = response.data || response
      lastFetch.value.customer = Date.now()
      
    } catch (error) {
      console.error('Error fetching customer:', error)
      setError('customer', error.message || 'Failed to fetch customer')
    } finally {
      setLoading('customer', false)
    }
  }
  
  // Fetch customer metrics (Working)
  async function fetchCustomerMetrics(id) {
    setLoading('metrics', true)
    setError('metrics', null)
    
    try {
      const response = await DispatchApiService.customers.getMetrics(id)
      customerMetrics.value = response.data || response
      lastFetch.value.metrics = Date.now()
      
    } catch (error) {
      console.error('Error fetching customer metrics:', error)
      setError('metrics', error.message || 'Failed to fetch customer metrics')
    } finally {
      setLoading('metrics', false)
    }
  }
  
  // Fetch customer projects (Working)
  async function fetchCustomerProjects(id) {
    setLoading('projects', true)
    setError('projects', null)
    
    try {
      const response = await DispatchApiService.customers.getProjects(id)
      customerProjects.value = response.data || response
      lastFetch.value.projects = Date.now()
      
    } catch (error) {
      console.error('Error fetching customer projects:', error)
      setError('projects', error.message || 'Failed to fetch customer projects')
    } finally {
      setLoading('projects', false)
    }
  }
  
  // Fetch customer activity (MVP - To be implemented)
  async function fetchCustomerActivity(id) {
    setLoading('activity', true)
    setError('activity', null)
    
    try {
      const response = await DispatchApiService.customers.getActivity(id)
      customerActivity.value = response.data || response
      lastFetch.value.activity = Date.now()
      
    } catch (error) {
      console.error('Error fetching customer activity:', error)
      setError('activity', error.message || 'Failed to fetch customer activity')
    } finally {
      setLoading('activity', false)
    }
  }
  
  // Load complete customer data (MVP)
  async function loadCustomerData(id) {
    clearErrors()
    
    // Load all customer data in parallel
    await Promise.allSettled([
      fetchCustomer(id),
      fetchCustomerMetrics(id),
      fetchCustomerProjects(id),
      fetchCustomerActivity(id)
    ])
  }
  
  // Update filters
  function updateFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters }
  }
  
  function resetFilters() {
    filters.value = {
      search: '',
      status: null
    }
  }
  
  // Update pagination
  function updatePagination(newPagination) {
    pagination.value = { ...pagination.value, ...newPagination }
  }
  
  // Real-time update handlers (Basic)
  function handleCustomerUpdate(data) {
    const customerIndex = customers.value.findIndex(customer => customer.id === data.id)
    if (customerIndex !== -1) {
      customers.value[customerIndex] = { ...customers.value[customerIndex], ...data }
    }
    
    if (currentCustomer.value && currentCustomer.value.id === data.id) {
      currentCustomer.value = { ...currentCustomer.value, ...data }
    }
  }
  
  // Utility functions
  function formatCurrency(amount) {
    if (typeof amount !== 'number') return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  function formatDate(date) {
    if (!date) return 'Not set'
    return new Date(date).toLocaleDateString()
  }
  
  function getStatusColor(status) {
    const colors = {
      active: 'success',
      inactive: 'secondary',
      suspended: 'danger'
    }
    return colors[status] || 'secondary'
  }
  
  function getHealthColor(score) {
    if (score >= 80) return 'success'
    if (score >= 60) return 'warning'
    return 'danger'
  }
  
  function getSatisfactionColor(score) {
    if (score >= 90) return 'text-green-600 dark:text-green-400'
    if (score >= 80) return 'text-blue-600 dark:text-blue-400'
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400'
    if (score >= 60) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }
  
  // ==========================================
  // RETURN (MVP - Simplified)
  // ==========================================
  
  return {
    // State
    customers,
    currentCustomer,
    customerProjects,
    customerActivity,
    customerMetrics,
    loading,
    errors,
    pagination,
    filters,
    lastFetch,
    
    // Getters
    filteredCustomers,
    customerCounts,
    
    // Actions
    fetchCustomers,
    fetchCustomer,
    fetchCustomerMetrics,
    fetchCustomerProjects,
    fetchCustomerActivity,
    loadCustomerData,
    updateFilters,
    resetFilters,
    updatePagination,
    handleCustomerUpdate,
    formatCurrency,
    formatDate,
    getStatusColor,
    getHealthColor,
    getSatisfactionColor,
    clearErrors
  }
}) 