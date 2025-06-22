import { ApiService } from '../service/ApiService'

/**
 * Dispatch API Service - MVP Version
 * Simplified API service for MVP dispatch-v2 implementation
 * Only includes endpoints that are actually implemented in backend
 */
export const DispatchApiService = {
  
  // ==========================================
  // 1. DASHBOARD API ENDPOINTS (MVP)
  // ==========================================
  
  dashboard: {
    // Main Dashboard Data (Working)
    getOverview() {
      return ApiService.get('dashboard/')
    },
    
    getMetrics() {
      return ApiService.get('dashboard/metrics')
    },
    
    getAlerts() {
      return ApiService.get('dashboard/alerts')
    },
    
    getTrends(period = '7d') {
      return ApiService.get(`dashboard/trends/${period}`)
    }
  },

  // ==========================================
  // 2. CUSTOMER API ENDPOINTS (MVP)
  // ==========================================
  
  customers: {
    // Customer CRUD (Working + MVP Extensions)
    getAll(params = {}) {
      return ApiService.get('customers/', params)
    },
    
    getById(id) {
      return ApiService.get(`customers/${id}`)
    },
    
    getMetrics(id) {
      return ApiService.get(`customers/${id}/metrics`)
    },
    
    getProjects(id) {
      return ApiService.get(`customers/${id}/projects`)
    },
    
    getActivity(id) {
      return ApiService.get(`customers/${id}/activity`)
    }
  },

  // ==========================================
  // 3. PROJECT API ENDPOINTS (MVP - Basic Only)
  // ==========================================
  
  projects: {
    // Basic Project List (Working)
    getAll(params = {}) {
      return ApiService.get('projects/', params)
    },
    
    getById(id) {
      return ApiService.get(`projects/${id}`)
    }
  },

  // ==========================================
  // 4. JOB API ENDPOINTS (MVP - Core Management)
  // ==========================================
  
  jobs: {
    // Job CRUD & Management (Working + MVP Extensions)
    getAll(params = {}) {
      return ApiService.get('jobs/', params)
    },
    
    getById(id) {
      return ApiService.get(`jobs/${id}`)
    },
    
    // Job Actions (MVP)
    updateStatus(id, status) {
      return ApiService.put(`jobs/${id}/status`, { status })
    },
    
    assignTechnician(id, technicianId) {
      return ApiService.put(`jobs/${id}/assign`, { technician_id: technicianId })
    }
  },

  // ==========================================
  // 5. LOCATION API ENDPOINTS (MVP - Basic Only)
  // ==========================================
  
  locations: {
    // Basic Location List (Working)
    getAll(params = {}) {
      return ApiService.get('locations/', params)
    },
    
    getById(id) {
      return ApiService.get(`locations/${id}`)
    }
  },

  // ==========================================
  // 6. UTILITY ENDPOINTS (MVP)
  // ==========================================
  
  shared: {
    // Technician list for assignments (MVP)
    getTechnicians(params = {}) {
      return ApiService.get('technicians', params)
    },
    
    // Status options for dropdowns (MVP)
    getStatusOptions() {
      return ApiService.get('options/statuses')
    }
  },

  // ==========================================
  // 7. REAL-TIME SUBSCRIPTIONS (MVP - Basic)
  // ==========================================
  
  realtime: {
    // Subscribe to dashboard metrics updates
    subscribeDashboardMetrics() {
      return 'dashboard'
    },
    
    // Subscribe to job updates
    subscribeJobUpdates(jobId) {
      return `jobs.${jobId}`
    },
    
    // Subscribe to customer updates
    subscribeCustomerUpdates(customerId) {
      return `customers.${customerId}`
    }
  }
}

export default DispatchApiService 