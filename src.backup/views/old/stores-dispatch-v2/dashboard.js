import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import DispatchApiService from '@/services/DispatchApiService'

/**
 * Dashboard Store for Dispatch V2 - MVP Version
 * Manages basic dashboard data and metrics
 * Only includes working endpoints for MVP
 */
export const useDashboardStore = defineStore('dispatch-dashboard', () => {
  // ==========================================
  // STATE (MVP - Simplified)
  // ==========================================
  
  // Dashboard data (Working endpoints only)
  const overview = ref({})
  const metrics = ref({})
  const alerts = ref([])
  const trends = ref({})
  
  // Loading states (MVP only)
  const loading = ref({
    overview: false,
    metrics: false,
    alerts: false,
    trends: false
  })
  
  // Error states (MVP only)
  const errors = ref({
    overview: null,
    metrics: null,
    alerts: null,
    trends: null
  })
  
  // Cache timestamps (MVP only)
  const lastFetch = ref({
    overview: null,
    metrics: null,
    alerts: null,
    trends: null
  })
  
  // Auto-refresh settings
  const autoRefresh = ref({
    enabled: true,
    interval: 30000, // 30 seconds
    intervalId: null
  })
  
  // ==========================================
  // GETTERS (MVP - Simplified)
  // ==========================================
  
  // Real-time metrics for dashboard cards
  const realTimeMetrics = computed(() => {
    // Handle the actual backend response structure
    const data = overview.value.key_metrics || metrics.value.real_time_metrics || {}
    return {
      activeJobs: data.total_jobs_active || 0,
      onlineTeams: data.technicians_active || 0,
      completedToday: data.completed_today || data.total_visits_today || 0,
      revenueToday: data.revenue_today || 0
    }
  })
  
  // Health score from backend
  const healthScore = computed(() => {
    return overview.value.performance_status?.customer_satisfaction || 0
  })
  
  // Health score color
  const healthScoreColor = computed(() => {
    const score = healthScore.value
    if (score >= 80) return 'success'
    if (score >= 60) return 'warning'
    return 'danger'
  })
  
  // Critical alerts
  const criticalAlerts = computed(() => {
    const alertsData = getAlertsArray()
    
    if (!Array.isArray(alertsData)) {
      console.warn('Alerts data is not an array:', alerts.value)
      return []
    }
    
    return alertsData.filter(alert => 
      alert && 
      (alert.severity === 'critical' || alert.severity === 'high')
    )
  })
  
  // Trends data for simple charts
  const trendsData = computed(() => {
    const trendsInfo = trends.value.trends || {}
    return {
      visitVolume: trendsInfo.visit_volume || [],
      completionRates: trendsInfo.completion_rates || []
    }
  })
  
  // Last updated timestamp
  const lastUpdatedFormatted = computed(() => {
    const lastUpdate = Math.max(...Object.values(lastFetch.value).filter(Boolean))
    if (!lastUpdate) return 'Never'
    return new Date(lastUpdate).toLocaleTimeString()
  })
  
  // ==========================================
  // ACTIONS (MVP - Working Endpoints Only)
  // ==========================================
  
  // Helper function to extract alerts array from different response structures
  function getAlertsArray() {
    if (Array.isArray(alerts.value)) {
      return alerts.value
    } else if (alerts.value && Array.isArray(alerts.value.alerts)) {
      return alerts.value.alerts
    } else if (alerts.value && Array.isArray(alerts.value.data)) {
      return alerts.value.data
    } else if (alerts.value && alerts.value.data && Array.isArray(alerts.value.data.alerts)) {
      return alerts.value.data.alerts
    }
    return []
  }
  
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
  
  // Fetch dashboard overview (Working)
  async function fetchOverview() {
    setLoading('overview', true)
    setError('overview', null)
    
    try {
      const response = await DispatchApiService.dashboard.getOverview()
      overview.value = response.data || response
      lastFetch.value.overview = Date.now()
    } catch (error) {
      console.error('Error fetching dashboard overview:', error)
      setError('overview', error.message || 'Failed to fetch dashboard overview')
    } finally {
      setLoading('overview', false)
    }
  }
  
  // Fetch dashboard metrics (Working)
  async function fetchMetrics() {
    setLoading('metrics', true)
    setError('metrics', null)
    
    try {
      const response = await DispatchApiService.dashboard.getMetrics()
      metrics.value = response.data || response
      lastFetch.value.metrics = Date.now()
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error)
      setError('metrics', error.message || 'Failed to fetch dashboard metrics')
    } finally {
      setLoading('metrics', false)
    }
  }
  
  // Fetch dashboard alerts (Working)
  async function fetchAlerts() {
    setLoading('alerts', true)
    setError('alerts', null)
    
    try {
      const response = await DispatchApiService.dashboard.getAlerts()
      const responseData = response.data || response
      
      // Ensure we always have a proper structure
      if (Array.isArray(responseData)) {
        alerts.value = responseData
      } else if (responseData && Array.isArray(responseData.alerts)) {
        alerts.value = responseData
      } else if (responseData && Array.isArray(responseData.data)) {
        alerts.value = responseData
      } else {
        // Fallback to empty array if structure is unexpected
        console.warn('Unexpected alerts response structure:', responseData)
        alerts.value = []
      }
      
      lastFetch.value.alerts = Date.now()
    } catch (error) {
      console.error('Error fetching dashboard alerts:', error)
      setError('alerts', error.message || 'Failed to fetch dashboard alerts')
      // Set empty array on error to prevent filter issues
      alerts.value = []
    } finally {
      setLoading('alerts', false)
    }
  }
  
  // Fetch dashboard trends (Working)
  async function fetchTrends(period = '7d') {
    setLoading('trends', true)
    setError('trends', null)
    
    try {
      const response = await DispatchApiService.dashboard.getTrends(period)
      trends.value = response.data || response
      lastFetch.value.trends = Date.now()
    } catch (error) {
      console.error('Error fetching dashboard trends:', error)
      setError('trends', error.message || 'Failed to fetch dashboard trends')
    } finally {
      setLoading('trends', false)
    }
  }
  
  // Load all dashboard data (MVP)
  async function loadDashboardData() {
    clearErrors()
    
    // Load all MVP dashboard data in parallel
    await Promise.allSettled([
      fetchOverview(),
      fetchMetrics(),
      fetchAlerts(),
      fetchTrends()
    ])
  }
  
  // Refresh dashboard (MVP)
  async function refreshDashboard() {
    await loadDashboardData()
  }
  
  // Auto-refresh functionality
  function startAutoRefresh() {
    if (autoRefresh.value.intervalId) {
      clearInterval(autoRefresh.value.intervalId)
    }
    
    autoRefresh.value.enabled = true
    autoRefresh.value.intervalId = setInterval(() => {
      refreshDashboard()
    }, autoRefresh.value.interval)
  }
  
  function stopAutoRefresh() {
    if (autoRefresh.value.intervalId) {
      clearInterval(autoRefresh.value.intervalId)
      autoRefresh.value.intervalId = null
    }
    autoRefresh.value.enabled = false
  }
  
  function toggleAutoRefresh() {
    if (autoRefresh.value.enabled) {
      stopAutoRefresh()
    } else {
      startAutoRefresh()
    }
  }
  
  // Dismiss alert
  function dismissAlert(alertId) {
    const alertsData = getAlertsArray()
    
    if (!Array.isArray(alertsData)) {
      console.warn('Cannot dismiss alert: alerts data is not an array:', alerts.value)
      return
    }
    
    const index = alertsData.findIndex(alert => alert && alert.id === alertId)
    if (index !== -1) {
      alertsData.splice(index, 1)
    }
  }
  
  // Real-time update handlers (Basic)
  function handleMetricsUpdate(data) {
    metrics.value = { ...metrics.value, ...data }
  }
  
  function handleAlertUpdate(data) {
    if (data.type === 'new_alert' && data.alert) {
      // Handle different possible response structures
      if (Array.isArray(alerts.value)) {
        alerts.value.unshift(data.alert)
      } else if (alerts.value && Array.isArray(alerts.value.alerts)) {
        alerts.value.alerts.unshift(data.alert)
      } else if (alerts.value && Array.isArray(alerts.value.data)) {
        alerts.value.data.unshift(data.alert)
      } else if (alerts.value && alerts.value.data && Array.isArray(alerts.value.data.alerts)) {
        alerts.value.data.alerts.unshift(data.alert)
      } else {
        // Initialize alerts structure if it doesn't exist
        alerts.value = [data.alert]
      }
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
  
  function formatNumber(number) {
    if (typeof number !== 'number') return '0'
    return new Intl.NumberFormat('en-US').format(number)
  }
  
  function formatPercentage(value) {
    if (typeof value !== 'number') return '0%'
    return `${Math.round(value)}%`
  }
  
  // ==========================================
  // RETURN (MVP - Simplified)
  // ==========================================
  
  return {
    // State
    overview,
    metrics,
    alerts,
    trends,
    loading,
    errors,
    lastFetch,
    autoRefresh,
    
    // Getters
    realTimeMetrics,
    healthScore,
    healthScoreColor,
    criticalAlerts,
    trendsData,
    lastUpdatedFormatted,
    
    // Actions
    fetchOverview,
    fetchMetrics,
    fetchAlerts,
    fetchTrends,
    loadDashboardData,
    refreshDashboard,
    startAutoRefresh,
    stopAutoRefresh,
    toggleAutoRefresh,
    dismissAlert,
    handleMetricsUpdate,
    handleAlertUpdate,
    formatCurrency,
    formatNumber,
    formatPercentage,
    clearErrors,
    
    // Helpers
    getAlertsArray
  }
}) 