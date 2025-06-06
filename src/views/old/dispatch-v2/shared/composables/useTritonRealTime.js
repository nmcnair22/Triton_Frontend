import { ref, readonly, computed, onMounted, onUnmounted } from 'vue'

/**
 * TritonV3 Real-Time WebSocket Composable
 * Handles specific TritonV3 backend events via Laravel Echo/Reverb
 */
export function useTritonRealTime() {
  const dashboardMetrics = ref(null)
  const jobUpdates = ref(new Map())
  const visitUpdates = ref(new Map())
  const isConnected = ref(false)
  const error = ref(null)
  const channels = ref(new Map())

  // Connection status management
  const setupConnectionListeners = () => {
    if (window.Echo?.connector?.pusher) {
      const pusher = window.Echo.connector.pusher
      
      pusher.connection.bind('connected', () => {
        isConnected.value = true
        error.value = null
        console.log('✅ TritonV3 WebSocket connected')
      })

      pusher.connection.bind('disconnected', () => {
        isConnected.value = false
        console.log('🔴 TritonV3 WebSocket disconnected')
      })

      pusher.connection.bind('error', (err) => {
        error.value = err.message || 'Connection error'
        isConnected.value = false
        console.error('❌ TritonV3 WebSocket error:', err)
      })
    }
  }

  // Dashboard metrics listener
  const subscribeToDashboard = () => {
    if (!window.Echo) {
      error.value = 'Laravel Echo not initialized'
      return
    }

    const channel = window.Echo.channel('dashboard')
    channels.value.set('dashboard', channel)

    channel.listen('dashboard.metrics.updated', (data) => {
      console.log('📊 Dashboard metrics updated:', data)
      dashboardMetrics.value = data.metrics
      
      // Example data structure:
      // {
      //   metrics: {
      //     total_visits_today: 45,
      //     completed_visits_today: 42,
      //     revenue_today: 15420.50,
      //     completion_rate: 93.3
      //   },
      //   timestamp: "2025-01-06T05:01:47.000000Z"
      // }
    })

    console.log('🎯 Subscribed to dashboard metrics')
  }

  // Job status updates
  const subscribeToJob = (jobId) => {
    if (!window.Echo || !jobId) {
      console.warn('Cannot subscribe to job: Echo not initialized or invalid jobId')
      return
    }

    const channelName = `jobs.${jobId}`
    
    // Don't subscribe if already subscribed
    if (channels.value.has(channelName)) {
      return
    }

    const channel = window.Echo.private(channelName)
    channels.value.set(channelName, channel)

    channel.listen('job.status.updated', (data) => {
      console.log('🔧 Job status updated:', data)
      jobUpdates.value.set(jobId, data.job)
      
      // Example data structure:
      // {
      //   job: {
      //     id: 123,
      //     status: "in_progress",
      //     completion_percentage: 75,
      //     customer_name: "ABC Corporation",
      //     location: "123 Main St",
      //     updated_at: "2025-01-06T05:01:47.000000Z"
      //   }
      // }
    })

    console.log(`🎯 Subscribed to job ${jobId} updates`)
  }

  // Customer-wide job updates
  const subscribeToCustomer = (customerId) => {
    if (!window.Echo || !customerId) {
      console.warn('Cannot subscribe to customer: Echo not initialized or invalid customerId')
      return
    }

    const channelName = `customers.${customerId}`
    
    if (channels.value.has(channelName)) {
      return
    }

    const channel = window.Echo.private(channelName)
    channels.value.set(channelName, channel)

    channel.listen('job.status.updated', (data) => {
      console.log('👥 Customer job updated:', data)
      jobUpdates.value.set(data.job.id, data.job)
    })

    console.log(`🎯 Subscribed to customer ${customerId} updates`)
  }

  // Visit completion events
  const subscribeToVisit = (visitId) => {
    if (!window.Echo || !visitId) {
      console.warn('Cannot subscribe to visit: Echo not initialized or invalid visitId')
      return
    }

    const channelName = `visits.${visitId}`
    
    if (channels.value.has(channelName)) {
      return
    }

    const channel = window.Echo.private(channelName)
    channels.value.set(channelName, channel)

    channel.listen('visit.completed', (data) => {
      console.log('✅ Visit completed:', data)
      visitUpdates.value.set(visitId, data.visit)
      
      // Also update related job if provided
      if (data.job) {
        jobUpdates.value.set(data.job.id, data.job)
      }
      
      // Example data structure:
      // {
      //   visit: {
      //     id: 789,
      //     job_id: 123,
      //     technician_name: "John Doe",
      //     completed_at: "2025-01-06T05:01:47.000000Z",
      //     duration_minutes: 90,
      //     total_amount: 250.00,
      //     issues_count: 0
      //   },
      //   job: {
      //     id: 123,
      //     completion_percentage: 85
      //   }
      // }
    })

    console.log(`🎯 Subscribed to visit ${visitId} updates`)
  }

  // Location-based updates
  const subscribeToLocation = (locationAddress) => {
    if (!window.Echo || !locationAddress) {
      console.warn('Cannot subscribe to location: Echo not initialized or invalid location')
      return
    }

    const channelName = `locations.${encodeURIComponent(locationAddress)}`
    
    if (channels.value.has(channelName)) {
      return
    }

    const channel = window.Echo.channel(channelName)
    channels.value.set(channelName, channel)

    channel.listen('visit.completed', (data) => {
      console.log('📍 Location visit completed:', data)
      visitUpdates.value.set(data.visit.id, data.visit)
    })

    console.log(`🎯 Subscribed to location ${locationAddress} updates`)
  }

  // Unsubscribe from specific channels
  const unsubscribeFromJob = (jobId) => {
    const channelName = `jobs.${jobId}`
    if (channels.value.has(channelName)) {
      window.Echo.leaveChannel(channelName)
      channels.value.delete(channelName)
      console.log(`🚫 Unsubscribed from job ${jobId}`)
    }
  }

  const unsubscribeFromCustomer = (customerId) => {
    const channelName = `customers.${customerId}`
    if (channels.value.has(channelName)) {
      window.Echo.leaveChannel(channelName)
      channels.value.delete(channelName)
      console.log(`🚫 Unsubscribed from customer ${customerId}`)
    }
  }

  const unsubscribeFromVisit = (visitId) => {
    const channelName = `visits.${visitId}`
    if (channels.value.has(channelName)) {
      window.Echo.leaveChannel(channelName)
      channels.value.delete(channelName)
      console.log(`🚫 Unsubscribed from visit ${visitId}`)
    }
  }

  const unsubscribeFromLocation = (locationAddress) => {
    const channelName = `locations.${encodeURIComponent(locationAddress)}`
    if (channels.value.has(channelName)) {
      window.Echo.leaveChannel(channelName)
      channels.value.delete(channelName)
      console.log(`🚫 Unsubscribed from location ${locationAddress}`)
    }
  }

  // Get specific job data
  const getJobUpdate = (jobId) => {
    return jobUpdates.value.get(jobId) || null
  }

  // Get specific visit data
  const getVisitUpdate = (visitId) => {
    return visitUpdates.value.get(visitId) || null
  }

  // Cleanup all subscriptions
  const cleanup = () => {
    channels.value.forEach((channel, channelName) => {
      window.Echo.leaveChannel(channelName)
    })
    channels.value.clear()
    console.log('🧹 Cleaned up all TritonV3 subscriptions')
  }

  // Test connection with backend
  const testConnection = () => {
    console.log('🧪 Testing TritonV3 WebSocket connection...')
    console.log('Visit these URLs to trigger test events:')
    console.log('- Dashboard: http://localhost:8000/test-dashboard-metrics')
    console.log('- Job: http://localhost:8000/test-job-update/123')
    console.log('- Visit: http://localhost:8000/test-visit-completion/789')
  }

  onMounted(() => {
    if (!window.Echo) {
      error.value = 'Laravel Echo not initialized. Make sure echo.js is imported.'
      console.error('❌ Laravel Echo not found')
      return
    }

    setupConnectionListeners()
    subscribeToDashboard()
    
    // Test connection on mount
    setTimeout(testConnection, 1000)
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    // State
    dashboardMetrics: readonly(dashboardMetrics),
    jobUpdates: readonly(jobUpdates),
    visitUpdates: readonly(visitUpdates),
    isConnected: readonly(isConnected),
    error: readonly(error),
    
    // Subscription methods
    subscribeToJob,
    subscribeToCustomer,
    subscribeToVisit,
    subscribeToLocation,
    
    // Unsubscription methods
    unsubscribeFromJob,
    unsubscribeFromCustomer,
    unsubscribeFromVisit,
    unsubscribeFromLocation,
    
    // Data getters
    getJobUpdate,
    getVisitUpdate,
    
    // Utilities
    cleanup,
    testConnection
  }
}

/**
 * Specialized hook for dashboard metrics only
 */
export function useTritonDashboard() {
  const { dashboardMetrics, isConnected, error } = useTritonRealTime()
  
  return {
    metrics: dashboardMetrics,
    isConnected,
    error
  }
}

/**
 * Specialized hook for job tracking
 */
export function useTritonJob(jobId) {
  const realtime = useTritonRealTime()
  
  onMounted(() => {
    if (jobId) {
      realtime.subscribeToJob(jobId)
    }
  })
  
  onUnmounted(() => {
    if (jobId) {
      realtime.unsubscribeFromJob(jobId)
    }
  })
  
  return {
    jobData: computed(() => realtime.getJobUpdate(jobId)),
    isConnected: realtime.isConnected,
    error: realtime.error
  }
} 