import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import DispatchApiService from '@/services/DispatchApiService'
import { useDispatchStore } from '@/stores/dispatchStore'

/**
 * Job Store for Dispatch V2 - MVP Version
 * Manages job data with basic CRUD operations
 * Only includes MVP endpoints for core job management
 */
export const useJobStore = defineStore('dispatch-job', () => {
  // ==========================================
  // STATE (MVP - Simplified)
  // ==========================================
  
  // Job data
  const jobs = ref([])
  const currentJob = ref(null)
  
  // Loading states (MVP only)
  const loading = ref({
    jobs: false,
    job: false,
    updating: false,
    assigning: false
  })
  
  // Error states (MVP only)
  const errors = ref({
    jobs: null,
    job: null,
    updating: null,
    assigning: null
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
    status: null,
    priority: null
  })
  
  // Cache timestamps
  const lastFetch = ref({
    jobs: null,
    job: null
  })
  
  // ==========================================
  // GETTERS (MVP - Simplified)
  // ==========================================
  
  // Filtered jobs (basic client-side filtering)
  const filteredJobs = computed(() => {
    let filtered = jobs.value
    
    if (filters.value.search) {
      const search = filters.value.search.toLowerCase()
      filtered = filtered.filter(job => 
        job.title?.toLowerCase().includes(search) ||
        job.customer?.name?.toLowerCase().includes(search) ||
        job.project?.name?.toLowerCase().includes(search)
      )
    }
    
    if (filters.value.status) {
      filtered = filtered.filter(job => job.status === filters.value.status)
    }
    
    if (filters.value.priority) {
      filtered = filtered.filter(job => job.priority === filters.value.priority)
    }
    
    return filtered
  })
  
  // Job counts by status
  const jobCounts = computed(() => {
    const counts = {
      total: jobs.value.length,
      scheduled: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0
    }
    
    jobs.value.forEach(job => {
      if (counts[job.status] !== undefined) {
        counts[job.status]++
      }
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
  
  // Fetch jobs list (Working + Enhanced)
  async function fetchJobs(params = {}) {
    setLoading('jobs', true)
    setError('jobs', null)
    
    try {
      const response = await DispatchApiService.jobs.getAll({
        page: pagination.value.page,
        limit: pagination.value.limit,
        ...params
      })
      
      console.log('Raw API response:', response)
      console.log('Response data:', response.data)
      
      // Handle different possible response structures
      let jobsData = []
      let metaData = null
      
      if (response.data) {
        // Check if data is directly in response.data
        if (Array.isArray(response.data)) {
          jobsData = response.data
        }
        // Check if data is in response.data.data
        else if (response.data.data && Array.isArray(response.data.data)) {
          jobsData = response.data.data
          metaData = response.data.meta || response.data.pagination
        }
        // Check if data is in response.data.jobs
        else if (response.data.jobs && Array.isArray(response.data.jobs)) {
          jobsData = response.data.jobs
          metaData = response.data.meta || response.data.pagination
        }
        // Check if the entire response.data is the jobs array
        else if (response.data.length !== undefined) {
          jobsData = response.data
        }
      }
      
      console.log('Extracted jobs data:', jobsData)
      console.log('Extracted meta data:', metaData)
      
      // Transform the jobs data to ensure consistent structure
      jobs.value = jobsData.map(job => ({
        id: job.id || job.job_id || job.ticket_id,
        title: job.title || job.name || job.job_title || `Job #${job.id || job.job_id || job.ticket_id}`,
        status: job.status || 'scheduled',
        priority: job.priority || 'medium',
        progress: job.progress || job.completion_percentage || 0,
        healthScore: job.health_score || job.healthScore || 75,
        healthLevel: getHealthLevelFromScore(job.health_score || job.healthScore || 75),
        revenue: job.revenue || job.total_amount || job.amount || 0,
        profitMargin: job.profit_margin || job.profitMargin || 0,
        outstandingItems: job.outstanding_items || job.outstandingItems || 0,
        scheduledDate: job.scheduled_date || job.scheduledDate || job.start_date,
        dueDate: job.due_date || job.dueDate || job.end_date,
        assignedTechnician: job.assigned_technician || job.assignedTechnician || job.technician,
        customer: job.customer || (job.customer_name ? { name: job.customer_name } : null),
        project: job.project || (job.project_name ? { name: job.project_name } : null)
      }))
      
      console.log('Transformed jobs:', jobs.value)
      
      // Update pagination
      if (metaData) {
        pagination.value = {
          page: metaData.current_page || metaData.page || 1,
          limit: metaData.per_page || metaData.limit || 25,
          total: metaData.total || jobsData.length,
          totalPages: metaData.last_page || metaData.totalPages || 1
        }
      }

      lastFetch.value.jobs = Date.now()
      
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setError('jobs', error.message || 'Failed to fetch jobs')
    } finally {
      setLoading('jobs', false)
    }
  }
  
  // Fetch single job (MVP)
  async function fetchJob(id) {
    setLoading('job', true)
    setError('job', null)
    
    try {
      const response = await DispatchApiService.jobs.getById(id)
      currentJob.value = response.data || response
      lastFetch.value.job = Date.now()
      
    } catch (error) {
      console.error('Error fetching job:', error)
      setError('job', error.message || 'Failed to fetch job')
    } finally {
      setLoading('job', false)
    }
  }
  
  // Update job status (MVP)
  async function updateJobStatus(id, status) {
    setLoading('updating', true)
    setError('updating', null)
    
    try {
      const response = await DispatchApiService.jobs.updateStatus(id, status)
      
      // Update local job data
      const jobIndex = jobs.value.findIndex(job => job.id === id)
      if (jobIndex !== -1) {
        jobs.value[jobIndex].status = status
      }
      
      if (currentJob.value && currentJob.value.id === id) {
        currentJob.value.status = status
      }
      
      return response.data || response
      
    } catch (error) {
      console.error('Error updating job status:', error)
      setError('updating', error.message || 'Failed to update job status')
      throw error
    } finally {
      setLoading('updating', false)
    }
  }
  
  // Assign technician (MVP)
  async function assignTechnician(id, technicianId) {
    setLoading('assigning', true)
    setError('assigning', null)
    
    try {
      const response = await DispatchApiService.jobs.assignTechnician(id, technicianId)
      
      // Update local job data
      const jobIndex = jobs.value.findIndex(job => job.id === id)
      if (jobIndex !== -1 && response.data?.assignedTechnician) {
        jobs.value[jobIndex].assignedTechnician = response.data.assignedTechnician
      }
      
      if (currentJob.value && currentJob.value.id === id && response.data?.assignedTechnician) {
        currentJob.value.assignedTechnician = response.data.assignedTechnician
      }
      
      return response.data || response
      
    } catch (error) {
      console.error('Error assigning technician:', error)
      setError('assigning', error.message || 'Failed to assign technician')
      throw error
    } finally {
      setLoading('assigning', false)
    }
  }
  
  // Update filters
  function updateFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters }
  }
  
  function resetFilters() {
    filters.value = {
      search: '',
      status: null,
      priority: null
    }
  }
  
  // Update pagination
  function updatePagination(newPagination) {
    pagination.value = { ...pagination.value, ...newPagination }
  }
  
  // Real-time update handlers (Basic)
  function handleJobUpdate(data) {
    const jobIndex = jobs.value.findIndex(job => job.id === data.id)
    if (jobIndex !== -1) {
      jobs.value[jobIndex] = { ...jobs.value[jobIndex], ...data }
    }
    
    if (currentJob.value && currentJob.value.id === data.id) {
      currentJob.value = { ...currentJob.value, ...data }
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
      scheduled: 'info',
      in_progress: 'warning',
      completed: 'success',
      cancelled: 'danger',
      on_hold: 'secondary'
    }
    return colors[status] || 'secondary'
  }
  
  function getPriorityColor(priority) {
    const colors = {
      low: 'success',
      medium: 'info',
      high: 'warning',
      critical: 'danger'
    }
    return colors[priority] || 'secondary'
  }
  
  function getHealthColor(level) {
    const colors = {
      excellent: 'success',
      good: 'info',
      fair: 'warning',
      poor: 'danger'
    }
    return colors[level] || 'secondary'
  }
  
  // Helper function to determine health level from score
  function getHealthLevelFromScore(score) {
    if (score >= 90) return 'excellent'
    if (score >= 70) return 'good'
    if (score >= 50) return 'fair'
    return 'poor'
  }
  
  // ==========================================
  // RETURN (MVP - Simplified)
  // ==========================================
  
  return {
    // State
    jobs,
    currentJob,
    loading,
    errors,
    pagination,
    filters,
    lastFetch,
    
    // Getters
    filteredJobs,
    jobCounts,
    
    // Actions
    fetchJobs,
    fetchJob,
    updateJobStatus,
    assignTechnician,
    updateFilters,
    resetFilters,
    updatePagination,
    handleJobUpdate,
    formatCurrency,
    formatDate,
    getStatusColor,
    getPriorityColor,
    getHealthColor,
    clearErrors
  }
}) 