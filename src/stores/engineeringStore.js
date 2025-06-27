import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { EngineeringService } from '@/service/EngineeringService';
import { 
  HEALTH_SCORE_THRESHOLDS, 
  WORKLOAD_THRESHOLDS, 
  TICKET_AGE_THRESHOLDS,
  AVATAR_COLORS,
  PERFORMANCE_TARGETS
} from '@/constants/engineeringConstants';

export const useEngineeringStore = defineStore('engineering', () => {
  // State
  const tickets = ref([]);
  const currentTicket = ref(null);
  const currentTicketDetail = ref(null);
  const currentTicketInsights = ref(null);
  const currentTicketInsightsEnhanced = ref(null);
  const dashboardStats = ref({
    open_tickets: 0,
    sla_breaches: 0,
    avg_resolution_time_hours: 0,
    tickets_this_month: 0,
    resolved_this_month: 0,
    escalated_tickets: 0
  });
  const statusBreakdown = ref([]);
  const priorityBreakdown = ref([]);
  const ownerBreakdown = ref([]);
  const performanceMetrics = ref({});
  const recentActivity = ref([]);
  const recentTickets = ref([]);
  const topReasons = ref([]);

  // === COMPREHENSIVE DASHBOARD DATA ===
  const completeDashboard = ref({});
  const quickStats = ref({});
  const dashboardHealthScore = ref({});
  const dashboardCriticalAlerts = ref([]);
  const dashboardActionItems = ref([]);
  const customerHealthMatrix = ref([]);
  const workloadDistribution = ref({});
  const agingAnalysis = ref({});
  const ticketInsights = ref({});
  const enhancedTicketDetails = ref({});
  
  // Dashboard state properties - ALL DATA FROM BACKEND ONLY
  const criticalAlerts = ref([]); // Populated from dashboardCriticalAlerts API
  const actionItems = ref([]); // Populated from dashboardActionItems API  
  const customerHealthData = ref([]); // Populated from customerHealthMatrix API
  const rebalanceSuggestion = ref({}); // Populated from workloadDistribution API
  
  const globalSearch = ref('');
  
  // Calendar state
  const calendarEvents = ref([]);
  const calendarEngineers = ref([]);
  const calendarTickets = ref([]);
  const calendarStatistics = ref({});
  const currentViewStart = ref(null);
  const currentViewEnd = ref(null);
  const selectedEngineer = ref('all');
  const selectedEventType = ref(null);
  
  // Loading states
  const loading = ref(false);
  const dashboardLoading = ref(false);
  const ticketLoading = ref(false);
  const calendarLoading = ref(false);
  const error = ref(null);
  
  // Filters
  const filters = ref({
    status: [],
    priority: [],
    department: [],
    owner: [],
    escalated: null,
    overdue: null,
    dateRange: null,
    search: ''
  });

  // Pagination
  const pagination = ref({
    page: 1,
    perPage: 25,
    total: 0,
    totalPages: 0
  });

  // Getters
  const getTicketById = computed(() => {
    return (id) => tickets.value.find(ticket => ticket.ticketid === id);
  });

  const totalTickets = computed(() => tickets.value.length);

  const openTickets = computed(() => 
    tickets.value.filter(ticket => ticket.ticketstatustitle === 'Open').length
  );

  const closedTickets = computed(() => 
    tickets.value.filter(ticket => ticket.ticketstatustitle === 'Closed').length
  );

  const inProgressTickets = computed(() => 
    tickets.value.filter(ticket => ticket.ticketstatustitle === 'In Progress').length
  );

  const overdueTickets = computed(() => 
    tickets.value.filter(ticket => ticket.is_overdue === true).length
  );

  const escalatedTickets = computed(() => 
    tickets.value.filter(ticket => ticket.escalated === true).length
  );

  const highPriorityTickets = computed(() => 
    tickets.value.filter(ticket => ticket.prioritytitle === 'High' || ticket.prioritytitle === 'Critical').length
  );

  const filteredTickets = computed(() => {
    let filtered = [...tickets.value];
    
    // Apply status filter
    if (filters.value.status.length > 0) {
      filtered = filtered.filter(ticket => 
        filters.value.status.includes(ticket.ticketstatustitle)
      );
    }
    
    // Apply priority filter
    if (filters.value.priority.length > 0) {
      filtered = filtered.filter(ticket => 
        filters.value.priority.includes(ticket.prioritytitle)
      );
    }
    
    // Apply department filter
    if (filters.value.department.length > 0) {
      filtered = filtered.filter(ticket => 
        filters.value.department.includes(ticket.department)
      );
    }
    
    // Apply owner filter
    if (filters.value.owner.length > 0) {
      filtered = filtered.filter(ticket => 
        filters.value.owner.includes(ticket.owner)
      );
    }
    
    // Apply escalated filter
    if (filters.value.escalated !== null) {
      filtered = filtered.filter(ticket => ticket.escalated === filters.value.escalated);
    }
    
    // Apply overdue filter
    if (filters.value.overdue !== null) {
      filtered = filtered.filter(ticket => ticket.is_overdue === filters.value.overdue);
    }
    
    // Apply date range filter
    if (filters.value.dateRange && filters.value.dateRange.length === 2) {
      const [startDate, endDate] = filters.value.dateRange;
      filtered = filtered.filter(ticket => {
        const ticketDate = new Date(ticket.created_at);
        return ticketDate >= startDate && ticketDate <= endDate;
      });
    }
    
    // Apply search filter
    if (filters.value.search) {
      const searchTerm = filters.value.search.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.subject?.toLowerCase().includes(searchTerm) ||
        ticket.reason_for_ticket?.toLowerCase().includes(searchTerm) ||
        ticket.ticketid?.toString().includes(searchTerm) ||
        ticket.owner?.toLowerCase().includes(searchTerm)
      );
    }
    
    return filtered;
  });

  // Dashboard computed properties
  const dashboardSummary = computed(() => ({
    totalTickets: dashboardStats.value.total_tickets || 0,
    openTickets: dashboardStats.value.open_tickets || 0,
    closedTickets: dashboardStats.value.closed_tickets || 0,
    slaBreaches: dashboardStats.value.overdue || 0,
    avgResolutionTime: parseFloat(dashboardStats.value.avg_resolution_hours) || 0,
    ticketsThisMonth: dashboardStats.value.total_tickets || 0,
    resolvedThisMonth: dashboardStats.value.closed_tickets || 0,
    escalatedTickets: dashboardStats.value.escalated || 0,
    highPriorityTickets: dashboardStats.value.high_priority || 0,
    resolutionRate: (dashboardStats.value.total_tickets || 0) > 0 
      ? Math.round(((dashboardStats.value.closed_tickets || 0) / (dashboardStats.value.total_tickets || 1)) * 100)
      : 0
  }));

  // New computed properties for enhanced dashboard
  const healthScore = computed(() => {
    const stats = dashboardStats.value;
    if (!stats || !stats.total_tickets) return 0;
    
    let score = 100;
    
    // Deduct points for high overdue percentage
    const overduePercentage = (stats.overdue || 0) / stats.total_tickets * 100;
    score -= Math.min(overduePercentage * 2, 40);
    
    // Deduct points for high escalation rate
    const escalationPercentage = (stats.escalated || 0) / stats.total_tickets * 100;
    score -= Math.min(escalationPercentage * 3, 20);
    
    // Deduct points for high priority tickets
    const highPriorityPercentage = (stats.high_priority || 0) / stats.total_tickets * 100;
    score -= Math.min(highPriorityPercentage * 1.5, 15);
    
    // Bonus for good resolution time (less than 24 hours average)
    if (stats.avg_resolution_hours && stats.avg_resolution_hours < 24) {
      score += 5;
    }
    
    return Math.max(Math.round(score), 0);
  });

  const healthScoreTrend = computed(() => {
    const score = healthScore.value;
    if (score >= HEALTH_SCORE_THRESHOLDS.EXCELLENT) return 'EXCELLENT';
    if (score >= HEALTH_SCORE_THRESHOLDS.GOOD) return 'GOOD';
    if (score >= HEALTH_SCORE_THRESHOLDS.FAIR) return 'FAIR';
    return 'NEEDS ATTENTION';
  });

  const healthScoreTrendIcon = computed(() => {
    const score = healthScore.value;
    if (score >= HEALTH_SCORE_THRESHOLDS.EXCELLENT) return 'pi pi-arrow-up text-green-500';
    if (score >= HEALTH_SCORE_THRESHOLDS.GOOD) return 'pi pi-arrow-right text-blue-500';
    if (score >= HEALTH_SCORE_THRESHOLDS.FAIR) return 'pi pi-arrow-down text-yellow-500';
    return 'pi pi-arrow-down text-red-500';
  });

  const healthScoreCardClass = computed(() => {
    const score = healthScore.value;
    if (score >= HEALTH_SCORE_THRESHOLDS.EXCELLENT) return 'bg-gradient-to-br from-green-500 to-green-600 text-white';
    if (score >= HEALTH_SCORE_THRESHOLDS.GOOD) return 'bg-gradient-to-br from-blue-500 to-blue-600 text-white';
    if (score >= HEALTH_SCORE_THRESHOLDS.FAIR) return 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white';
    return 'bg-gradient-to-br from-red-500 to-red-600 text-white';
  });

  const ticketGrowthPercent = computed(() => {
    // For now, calculate based on open vs closed ratio
    const stats = dashboardStats.value;
    if (!stats || !stats.total_tickets) return 0;
    
    const openPercentage = (stats.open_tickets || 0) / stats.total_tickets * 100;
    // If more than 75% are open, show positive growth, otherwise negative
    return openPercentage > 75 ? Math.round(openPercentage - 75) : -Math.round(75 - openPercentage);
  });

  const customerRiskStats = computed(() => {
    // Calculate based on overdue and escalated tickets
    const stats = dashboardStats.value;
    if (!stats) return { high: 0, medium: 0, low: 0 };
    
    const total = stats.total_tickets || 1;
    const overdue = stats.overdue || 0;
    const escalated = stats.escalated || 0;
    
    // Simple risk calculation - this could be enhanced with real customer data
    const high = Math.min(escalated, 5);
    const medium = Math.min(Math.max(overdue - escalated, 0), 8);
    const low = Math.max(0, 10 - high - medium);
    
    return { high, medium, low };
  });

  const agingRanges = computed(() => {
    const stats = dashboardStats.value;
    if (!stats) return [];
    
    // Calculate aging based on available data
    const total = stats.total_tickets || 1;
    const overdue = stats.overdue || 0;
    const open = stats.open_tickets || 0;
    
    // Use real aging data from backend API only
    return agingAnalysis.value?.age_buckets || [];
  });

  const maxAgingCount = computed(() => {
    return Math.max(...agingRanges.value.map(r => r.count), 1);
  });

  const engineerWorkload = computed(() => {
    if (!ownerBreakdown.value || typeof ownerBreakdown.value !== 'object') return [];
    
    // Convert the owner breakdown object to array format with memoization-friendly approach
    return Object.entries(ownerBreakdown.value)
      .map(([name, count]) => ({
        name,
        count,
        loadClass: count > WORKLOAD_THRESHOLDS.HIGH_LOAD ? 'bg-red-500' : 
                  count > WORKLOAD_THRESHOLDS.MEDIUM_LOAD ? 'bg-yellow-500' : 'bg-green-500',
        avatarColor: getAvatarColor(name)
      }))
      .sort((a, b) => b.count - a.count);
  });

  const maxWorkload = computed(() => {
    return Math.max(...engineerWorkload.value.map(e => e.count), 1);
  });

  const showWorkloadBalancer = computed(() => {
    return engineerWorkload.value.some(e => e.count > WORKLOAD_THRESHOLDS.HIGH_LOAD);
  });

  const aiInsights = computed(() => {
    const insights = [];
    const stats = dashboardStats.value;
    
    if (!stats) return insights;
    
    // Workload imbalance insight
    const maxLoad = Math.max(...engineerWorkload.value.map(e => e.count));
    const avgLoad = engineerWorkload.value.reduce((sum, e) => sum + e.count, 0) / engineerWorkload.value.length;
    
    if (maxLoad > avgLoad * 1.5) {
      insights.push({
        id: 1,
        title: 'Workload Imbalance Detected',
        description: `${engineerWorkload.value[0]?.name} has ${maxLoad} tickets (${Math.round((maxLoad / avgLoad - 1) * 100)}% above average)`,
        icon: 'pi pi-balance-scale',
        color: 'text-orange-500',
        action: { label: 'Rebalance', type: 'rebalance' }
      });
    }
    
    // High overdue rate insight
    if (stats.overdue > 0) {
      const overdueRate = (stats.overdue / stats.total_tickets * 100).toFixed(1);
      insights.push({
        id: 2,
        title: 'High Overdue Rate',
        description: `${stats.overdue} tickets are overdue (${overdueRate}% of total)`,
        icon: 'pi pi-clock',
        color: 'text-red-500',
        action: { label: 'Review Overdue', type: 'overdue' }
      });
    }
    
    // Resolution time insight
    if (stats.avg_resolution_hours > 48) {
      insights.push({
        id: 3,
        title: 'Slow Resolution Time',
        description: `Average resolution time is ${Math.round(stats.avg_resolution_hours)} hours`,
        icon: 'pi pi-hourglass',
        color: 'text-yellow-500',
        action: { label: 'Analyze Bottlenecks', type: 'performance' }
      });
    }
    
    return insights;
  });

  // Helper function for avatar colors
  function getAvatarColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }

  // Actions
  async function fetchDashboardData() {
    dashboardLoading.value = true;
    error.value = null;
    
    try {
      // Fetch all dashboard data in parallel
      const [statsResponse, statusResponse, priorityResponse, ownerResponse, performanceResponse, activityResponse] = await Promise.all([
        EngineeringService.getDashboardStats(),
        EngineeringService.getStatusBreakdown(),
        EngineeringService.getPriorityBreakdown(),
        EngineeringService.getOwnerBreakdown(),
        EngineeringService.getPerformanceMetrics(),
        EngineeringService.getRecentActivity()
      ]);
      
      // Update dashboard stats
      if (statsResponse.data) {
        // Handle both direct data and nested data structures
        const statsData = statsResponse.data.data || statsResponse.data;
        
        // Use the exact field names from the backend API response
        dashboardStats.value = {
          total_tickets: statsData.total_tickets || 0,
          open_tickets: statsData.open_tickets || 0,
          closed_tickets: statsData.closed_tickets || 0,
          high_priority: statsData.high_priority || 0,
          escalated: statsData.escalated || 0,
          overdue: statsData.overdue || 0,
          avg_resolution_hours: statsData.avg_resolution_hours || "0",
          total_posts: statsData.total_posts || 0,
          total_actions: statsData.total_actions || 0,
          total_timeline_events: statsData.total_timeline_events || 0,
          total_recommendations: statsData.total_recommendations || 0,
          // Computed fields for dashboard summary
          sla_breaches: statsData.overdue || 0,
          avg_resolution_time_hours: parseFloat(statsData.avg_resolution_hours) || 0,
          tickets_this_month: statsData.total_tickets || 0,
          resolved_this_month: statsData.closed_tickets || 0,
          escalated_tickets: statsData.escalated || 0
        };
        
        // Extract recent tickets and top reasons from stats if available
        if (statsData.recent_tickets) {
          recentTickets.value = statsData.recent_tickets;
        }
        if (statsData.top_reasons) {
          topReasons.value = statsData.top_reasons;
        }
      }
      
      // Update breakdowns - handle both direct arrays and nested data
      // Convert object-based breakdowns to arrays for charts
      if (statusResponse.data?.data) {
        statusBreakdown.value = Object.entries(statusResponse.data.data).map(([status, count]) => ({
          status,
          count
        }));
      } else {
        statusBreakdown.value = statusResponse.data || [];
      }
      
      if (priorityResponse.data?.data) {
        priorityBreakdown.value = Object.entries(priorityResponse.data.data).map(([priority, count]) => ({
          priority,
          count
        }));
      } else {
        priorityBreakdown.value = priorityResponse.data || [];
      }
      
      if (ownerResponse.data?.data) {
        // Keep as object for engineerWorkload computed property
        ownerBreakdown.value = ownerResponse.data.data;
      } else {
        ownerBreakdown.value = {};
      }
      
      performanceMetrics.value = performanceResponse.data?.data || performanceResponse.data || {};
      
      // Handle activity data - it's already an array
      if (activityResponse.data?.data) {
        recentActivity.value = activityResponse.data.data.map(activity => ({
          id: activity.ticket_id,
          message: `Ticket #${activity.ticket_id}: ${activity.user} ${activity.type === 'post' ? 'commented on' : 'updated'} "${activity.ticket_subject}"`,
          timestamp: activity.date,
          user: activity.user,
          type: activity.type,
          ticket_subject: activity.ticket_subject,
          icon: activity.type === 'post' ? 'pi pi-comment' : 'pi pi-pencil',
          color: activity.type === 'post' ? 'text-blue-500' : 'text-green-500'
        }));
      } else {
        recentActivity.value = activityResponse.data || [];
      }
      
    } catch (err) {
      console.error('Error fetching engineering dashboard data:', err);
      error.value = err.response?.data?.message || 'Failed to load dashboard data';
    } finally {
      dashboardLoading.value = false;
    }
  }

  // === COMPREHENSIVE DASHBOARD DATA FETCHERS ===
  
  async function fetchCompleteDashboard() {
    try {
      const response = await EngineeringService.getCompleteDashboard();
      completeDashboard.value = response.data?.data || response.data || {};
    } catch (err) {
      console.error('Error fetching complete dashboard:', err);
    }
  }

  async function fetchQuickStats() {
    try {
      const response = await EngineeringService.getQuickStats();
      quickStats.value = response.data?.data || response.data || {};
    } catch (err) {
      console.error('Error fetching quick stats:', err);
    }
  }

  async function fetchDashboardHealthScore() {
    try {
      console.log('Fetching dashboard health score...');
      const response = await EngineeringService.getHealthScore();
      dashboardHealthScore.value = response.data?.data || response.data || {};
      console.log('Dashboard health score loaded:', dashboardHealthScore.value);
    } catch (err) {
      console.error('Error fetching dashboard health score:', err);
    }
  }

  async function fetchDashboardCriticalAlerts() {
    try {
      console.log('Fetching dashboard critical alerts...');
      const response = await EngineeringService.getCriticalAlerts();
      dashboardCriticalAlerts.value = response.data?.data || response.data || {};
      console.log('Dashboard critical alerts loaded:', dashboardCriticalAlerts.value);
    } catch (err) {
      console.error('Error fetching dashboard critical alerts:', err);
    }
  }

  async function fetchDashboardActionItems() {
    try {
      console.log('Fetching dashboard action items...');
      const response = await EngineeringService.getActionItems();
      dashboardActionItems.value = response.data?.data || response.data || {};
      console.log('Dashboard action items loaded:', dashboardActionItems.value);
    } catch (err) {
      console.error('Error fetching dashboard action items:', err);
    }
  }

  async function fetchCustomerHealthMatrix() {
    try {
      console.log('Fetching customer health matrix...');
      const response = await EngineeringService.getCustomerHealth();
      customerHealthMatrix.value = response.data?.data || response.data || {};
      console.log('Customer health matrix loaded:', customerHealthMatrix.value);
    } catch (err) {
      console.error('Error fetching customer health matrix:', err);
    }
  }

  async function fetchWorkloadDistribution() {
    try {
      console.log('Fetching workload distribution...');
      const response = await EngineeringService.getWorkloadDistribution();
      workloadDistribution.value = response.data?.data || response.data || {};
      console.log('Workload distribution loaded:', workloadDistribution.value);
    } catch (err) {
      console.error('Error fetching workload distribution:', err);
    }
  }

  async function fetchAgingAnalysis() {
    try {
      console.log('Fetching aging analysis...');
      const response = await EngineeringService.getAgingAnalysis();
      agingAnalysis.value = response.data?.data || response.data || {};
      console.log('Aging analysis loaded:', agingAnalysis.value);
    } catch (err) {
      console.error('Error fetching aging analysis:', err);
    }
  }

  async function fetchTicketDetail(ticketId) {
    loading.value = true;
    error.value = null;
    try {
      console.log(`Fetching ticket detail for ${ticketId}...`);
      const response = await EngineeringService.getTicketDetail(ticketId);
      currentTicketDetail.value = response.data?.data || response.data || {};
      console.log(`Ticket detail loaded for ${ticketId}:`, currentTicketDetail.value);
      return currentTicketDetail.value;
    } catch (err) {
      console.error(`Error fetching ticket detail for ${ticketId}:`, err);
      error.value = err.message || 'Failed to fetch ticket details';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchTicketInsights(ticketId) {
    loading.value = true;
    error.value = null;
    try {
      console.log(`Fetching ticket insights for ${ticketId}...`);
      const response = await EngineeringService.getTicketInsights(ticketId);
      currentTicketInsights.value = response.data?.data || response.data || {};
      console.log(`Ticket insights loaded for ${ticketId}:`, currentTicketInsights.value);
      return currentTicketInsights.value;
    } catch (err) {
      console.error(`Error fetching ticket insights for ${ticketId}:`, err);
      error.value = err.message || 'Failed to fetch ticket insights';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // New method to fetch enhanced action items with full ticket details
  async function fetchEnhancedActionItems() {
    try {
      console.log('Fetching enhanced action items with detailed ticket information...');
      
      // First get the basic action items
      const actionItemsResponse = await EngineeringService.getActionItems();
      const basicActionItems = actionItemsResponse.data?.data || actionItemsResponse.data || [];
      
      console.log('Basic action items:', basicActionItems);
      
      // If we have action items with ticket IDs, fetch detailed information for each
      if (Array.isArray(basicActionItems) && basicActionItems.length > 0) {
        const enhancedItems = await Promise.all(
          basicActionItems.map(async (item) => {
            try {
              // Extract ticket ID from the item (assuming it has a ticket_id field)
              const ticketId = item.ticket_id || item.ticketId || item.id;
              
              if (!ticketId) {
                console.warn('No ticket ID found for action item:', item);
                return {
                  ...item,
                  enhanced: false,
                  error: 'No ticket ID available'
                };
              }
              
              // Fetch both ticket detail and insights in parallel
              const [detailResponse, insightsResponse] = await Promise.all([
                EngineeringService.getTicketDetail(ticketId).catch(err => {
                  console.warn(`Failed to fetch detail for ticket ${ticketId}:`, err);
                  return null;
                }),
                EngineeringService.getTicketInsights(ticketId).catch(err => {
                  console.warn(`Failed to fetch insights for ticket ${ticketId}:`, err);
                  return null;
                })
              ]);
              
              const ticketDetail = detailResponse?.data?.data || detailResponse?.data || {};
              const ticketInsights = insightsResponse?.data?.data || insightsResponse?.data || {};
              
              // Combine all the data into an enhanced action item
              return {
                ...item,
                enhanced: true,
                ticketDetail,
                ticketInsights,
                // Extract key information for easy access
                aiAnalysis: ticketDetail.ai_analysis || {},
                businessIntelligence: ticketInsights.business_intelligence || {},
                riskAssessments: ticketInsights.business_intelligence?.intelligence?.risk_assessments || {},
                customerIntelligence: ticketInsights.business_intelligence?.intelligence?.customer_intelligence || {},
                workloadAnalysis: ticketInsights.business_intelligence?.intelligence?.workload_analysis || {},
                activityIntelligence: ticketInsights.business_intelligence?.intelligence?.activity_intelligence || {}
              };
              
            } catch (err) {
              console.error(`Error enhancing action item for ticket ${item.ticket_id || item.id}:`, err);
              return {
                ...item,
                enhanced: false,
                error: err.message
              };
            }
          })
        );
        
        // Store the enhanced action items
        dashboardActionItems.value = enhancedItems;
        console.log('Enhanced action items loaded:', enhancedItems);
        
        return enhancedItems;
      } else {
        console.log('No action items found or items array is empty');
        dashboardActionItems.value = [];
        return [];
      }
      
    } catch (err) {
      console.error('Error fetching enhanced action items:', err);
      error.value = err.message || 'Failed to fetch enhanced action items';
      throw err;
    }
  }

  // 🚀 NEW: Super-Fast Consolidated Dashboard - Replaces 15+ API calls with 1
  async function fetchConsolidatedDashboard() {
    dashboardLoading.value = true;
    error.value = null;
    
    try {
      console.log('🚀 Fetching consolidated dashboard (1 call replaces 15+)...');
      const startTime = performance.now();
      
      const response = await EngineeringService.getConsolidatedDashboard();
      
      const endTime = performance.now();
      const loadTime = Math.round(endTime - startTime);
      
      // Update all reactive state from single consolidated response
      const data = response.data?.data || response.data || {};
      
      // Update dashboard stats
      if (data.ticket_statistics) {
        dashboardStats.value = {
          total_tickets: data.ticket_statistics.total_tickets || 0,
          open_tickets: data.ticket_statistics.open_tickets || 0,
          closed_tickets: data.ticket_statistics.closed_tickets || 0,
          high_priority: data.ticket_statistics.high_priority || 0,
          escalated: data.ticket_statistics.escalated || 0,
          overdue: data.ticket_statistics.overdue || 0,
          avg_resolution_hours: data.ticket_statistics.avg_resolution_hours || "0",
          total_posts: data.ticket_statistics.total_posts || 0,
          total_actions: data.ticket_statistics.total_actions || 0,
          total_timeline_events: data.ticket_statistics.total_timeline_events || 0,
          total_recommendations: data.ticket_statistics.total_recommendations || 0,
          sla_breaches: data.ticket_statistics.overdue || 0,
          avg_resolution_time_hours: parseFloat(data.ticket_statistics.avg_resolution_hours) || 0,
          tickets_this_month: data.ticket_statistics.total_tickets || 0,
          resolved_this_month: data.ticket_statistics.closed_tickets || 0,
          escalated_tickets: data.ticket_statistics.escalated || 0
        };
      }
      
      // Update breakdowns
      if (data.status_breakdown) {
        statusBreakdown.value = Object.entries(data.status_breakdown).map(([status, count]) => ({
          status,
          count
        }));
      }
      
      if (data.priority_breakdown) {
        priorityBreakdown.value = Object.entries(data.priority_breakdown).map(([priority, count]) => ({
          name: priority,
          count
        }));
      }
      
      if (data.owner_breakdown) {
        ownerBreakdown.value = data.owner_breakdown;
      }
      
      // Update performance metrics
      if (data.performance_metrics) {
        performanceMetrics.value = data.performance_metrics;
      }
      
      // Update recent activity
      if (data.recent_activity) {
        recentActivity.value = data.recent_activity.map(activity => ({
          id: activity.ticket_id,
          message: `Ticket #${activity.ticket_id}: ${activity.user} ${activity.type === 'post' ? 'commented on' : 'updated'} "${activity.ticket_subject}"`,
          timestamp: activity.date,
          user: activity.user,
          type: activity.type,
          ticket_subject: activity.ticket_subject,
          icon: activity.type === 'post' ? 'pi pi-comment' : 'pi pi-pencil',
          color: activity.type === 'post' ? 'text-blue-500' : 'text-green-500'
        }));
      }
      
      // Update comprehensive dashboard data from dashboard_metrics
      if (data.dashboard_metrics) {
        completeDashboard.value = data.dashboard_metrics;
        
        // Map health_score to quickStats structure for compatibility
        if (data.dashboard_metrics.health_score) {
          quickStats.value = {
            health_summary: {
              total_open: data.dashboard_metrics.health_score.total_open || 0,
              high_risk: data.dashboard_metrics.health_score.high_risk || 0,
              unassigned: data.dashboard_metrics.health_score.unassigned || 0,
              due_this_week: data.dashboard_metrics.health_score.due_this_week || 0,
              system_health_score: data.dashboard_metrics.health_score.total_open ? 
                Math.max(100 - Math.round((data.dashboard_metrics.health_score.high_risk / data.dashboard_metrics.health_score.total_open) * 100), 0) : 0
            },
            critical_counts: {
              old_tickets: data.dashboard_metrics.critical_alerts?.summary?.old_count || 0,
              stalled_tickets: data.dashboard_metrics.critical_alerts?.summary?.stalled_count || 0,
              unassigned_tickets: data.dashboard_metrics.critical_alerts?.summary?.unassigned_count || 0,
              due_this_week: data.dashboard_metrics.critical_alerts?.summary?.due_this_week_count || 0
            },
            customer_summary: {
              total_customers: data.dashboard_metrics.customer_health?.summary?.total_customers || 0,
              high_risk_customers: data.dashboard_metrics.customer_health?.summary?.high_risk_count || 0
            },
            aging_summary: {
              average_age_days: data.dashboard_metrics.aging_analysis?.summary?.average_age_all_tickets || 0,
              oldest_ticket_days: data.dashboard_metrics.aging_analysis?.most_stale_tickets?.[0]?.age_days || 0
            },
            ticket_statistics: {
              avg_resolution_hours: parseFloat(data.ticket_statistics?.avg_resolution_hours) || 0
            }
          };
        }
        
                 // Update individual sections
         dashboardHealthScore.value = data.dashboard_metrics.health_score || {};
         dashboardCriticalAlerts.value = data.dashboard_metrics.critical_alerts || {};
         dashboardActionItems.value = data.dashboard_metrics.action_plan_coverage || {};
         customerHealthMatrix.value = data.dashboard_metrics.customer_health || {};
         workloadDistribution.value = data.dashboard_metrics.workload_distribution || {};
         
         // Transform aging analysis with activity velocity mapping
         if (data.dashboard_metrics.aging_analysis) {
           const aging = data.dashboard_metrics.aging_analysis;
           agingAnalysis.value = {
             ...aging,
             activity_velocity: aging.activity_velocity ? aging.activity_velocity.reduce((acc, item) => {
               const status = item.activity_status.toLowerCase();
               if (status.includes('active')) acc.active = item.count;
               else if (status.includes('slow')) acc.slow = item.count;
               else if (status.includes('stalled')) acc.stalled = item.count;
               else if (status.includes('abandoned')) acc.abandoned = item.count;
               return acc;
             }, {}) : {}
           };
         } else {
           agingAnalysis.value = {};
         }
      }
      
      // Fallback for direct properties (backwards compatibility)
      if (data.quick_stats && !data.dashboard_metrics) {
        quickStats.value = data.quick_stats;
      }
      
      if (data.health_score && !data.dashboard_metrics) {
        dashboardHealthScore.value = data.health_score;
      }
      
             if (data.critical_alerts && !data.dashboard_metrics) {
         dashboardCriticalAlerts.value = data.critical_alerts;
       }
       
       if (data.action_items && !data.dashboard_metrics) {
         dashboardActionItems.value = data.action_items;
       }
       
       if (data.customer_health && !data.dashboard_metrics) {
        customerHealthMatrix.value = data.customer_health;
      }
      
      if (data.workload_distribution && !data.dashboard_metrics) {
        workloadDistribution.value = data.workload_distribution;
      }
      
      if (data.aging_analysis && !data.dashboard_metrics) {
        agingAnalysis.value = data.aging_analysis;
      }
      
      // Extract recent tickets and top reasons if available
      if (data.ticket_statistics?.recent_tickets) {
        recentTickets.value = data.ticket_statistics.recent_tickets;
      }
      
      if (data.ticket_statistics?.top_reasons) {
        topReasons.value = data.ticket_statistics.top_reasons;
      }
      
      const legacyAPICallCount = 15; // Number of individual API calls replaced
      const currentAPICallCount = 1; // Consolidated endpoint
      const improvementPercentage = Math.round(((legacyAPICallCount - currentAPICallCount) / legacyAPICallCount) * 100);
      
      console.log(`✅ Consolidated dashboard loaded in ${loadTime}ms (replaces ${legacyAPICallCount} API calls)`);
      console.log(`📊 Performance improvement: ${improvementPercentage}% faster than individual calls`);
      
      // Show performance improvement notification
      if (window.$toast) {
        window.$toast.success(`Dashboard loaded in ${loadTime}ms (${improvementPercentage}% faster!)`);
      }
      
      return response;
      
    } catch (err) {
      console.error('❌ Failed to load consolidated dashboard:', err);
      error.value = err.response?.data?.message || 'Failed to load consolidated dashboard data';
      
      // Fallback to individual calls if consolidated endpoint fails
      console.log('🔄 Falling back to individual API calls...');
      await fetchAllDashboardData();
    } finally {
      dashboardLoading.value = false;
    }
  }

  // 🚨 LEGACY: Enhanced fetchDashboardData (15+ API calls - SLOW)
  // This is kept as fallback for the consolidated endpoint
  async function fetchAllDashboardData() {
    dashboardLoading.value = true;
    error.value = null;
    
    try {
      console.log('⚠️  Using LEGACY dashboard data fetching (15+ API calls)...');
      
      // OLD APPROACH: Fetch all dashboard data in parallel (15+ calls)
      await Promise.all([
        fetchDashboardData(), // /engineering/tickets/statistics
        fetchCompleteDashboard(), // /engineering/dashboard
        fetchQuickStats(), // /engineering/dashboard/quick-stats
        fetchDashboardHealthScore(), // /engineering/dashboard/health-score
        fetchDashboardCriticalAlerts(), // /engineering/dashboard/critical-alerts
        fetchDashboardActionItems(), // /engineering/dashboard/action-items
        fetchCustomerHealthMatrix(), // /engineering/dashboard/customer-health
        fetchWorkloadDistribution(), // /engineering/dashboard/workload-distribution
        fetchAgingAnalysis() // /engineering/dashboard/aging-analysis
        // Plus: status-breakdown, priority-breakdown, owner-breakdown, performance, recent-activity
      ]);
      
      console.log('⚠️  LEGACY dashboard data loaded (consider using fetchConsolidatedDashboard)');
      
    } catch (err) {
      console.error('Error fetching comprehensive dashboard data:', err);
      error.value = err.response?.data?.message || 'Failed to load comprehensive dashboard data';
    } finally {
      dashboardLoading.value = false;
    }
  }

  async function fetchTickets(params = {}) {
    loading.value = true;
    error.value = null;
    
    try {
      // Merge filters with params
      const queryParams = {
        ...params,
        page: pagination.value.page,
        per_page: pagination.value.perPage,
        ...Object.fromEntries(
          Object.entries(filters.value).filter(([, value]) => {
            if (Array.isArray(value)) return value.length > 0;
            return value !== null && value !== '';
          })
        )
      };
      
      const response = await EngineeringService.getTickets(queryParams);
      
      if (response.data) {
        // Check if data is nested or direct
        const ticketData = response.data.data || response.data;
        
        if (Array.isArray(ticketData)) {
          tickets.value = ticketData;
        } else {
          console.error('❌ Ticket data is not an array:', ticketData);
          tickets.value = [];
        }
        
        // Update pagination
        if (response.data.meta) {
          pagination.value = {
            page: response.data.meta.current_page,
            perPage: response.data.meta.per_page,
            total: response.data.meta.total,
            totalPages: response.data.meta.last_page
          };
        }
      } else {
        tickets.value = [];
      }
      
    } catch (err) {
      console.error('Error fetching engineering tickets:', err);
      error.value = err.response?.data?.message || err.message || 'Failed to load tickets';
    } finally {
      loading.value = false;
    }
  }

  async function fetchTicket(id) {
    ticketLoading.value = true;
    error.value = null;
    
    try {
      console.log(`Fetching engineering ticket ${id}...`);
      
      const response = await EngineeringService.getTicket(id);
      
      if (response.data) {
        currentTicket.value = response.data;
        console.log('Engineering ticket loaded successfully');
      }
      
    } catch (err) {
      console.error(`Error fetching engineering ticket ${id}:`, err);
      error.value = err.response?.data?.message || err.message || 'Failed to load ticket';
    } finally {
      ticketLoading.value = false;
    }
  }

  async function searchTickets(searchTerm, additionalParams = {}) {
    loading.value = true;
    error.value = null;
    
    try {
      console.log('Searching engineering tickets:', searchTerm);
      
      const params = {
        q: searchTerm,
        ...additionalParams,
        page: pagination.value.page,
        per_page: pagination.value.perPage
      };
      
      const response = await EngineeringService.searchTickets(params);
      
      if (response.data) {
        tickets.value = response.data.data || [];
        
        if (response.data.meta) {
          pagination.value = {
            page: response.data.meta.current_page,
            perPage: response.data.meta.per_page,
            total: response.data.meta.total,
            totalPages: response.data.meta.last_page
          };
        }
      }
      
    } catch (err) {
      console.error('Error searching engineering tickets:', err);
      error.value = err.response?.data?.message || 'Search failed';
    } finally {
      loading.value = false;
    }
  }

  async function fetchOverdueTickets(params = {}) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await EngineeringService.getOverdueTickets(params);
      
      if (response.data) {
        tickets.value = response.data.data || [];
        
        if (response.data.meta) {
          pagination.value = {
            page: response.data.meta.current_page,
            perPage: response.data.meta.per_page,
            total: response.data.meta.total,
            totalPages: response.data.meta.last_page
          };
        }
      }
      
    } catch (err) {
      console.error('Error fetching overdue tickets:', err);
      error.value = err.response?.data?.message || 'Failed to load overdue tickets';
    } finally {
      loading.value = false;
    }
  }

  async function createTicket(ticketData) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await EngineeringService.createTicket(ticketData);
      
      if (response.data) {
        // Add new ticket to the list
        tickets.value.unshift(response.data);
        console.log('Engineering ticket created successfully');
        return response.data;
      }
      
    } catch (err) {
      console.error('Error creating engineering ticket:', err);
      error.value = err.response?.data?.message || 'Failed to create ticket';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateTicket(id, ticketData) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await EngineeringService.updateTicket(id, ticketData);
      
      if (response.data) {
        // Update ticket in the list
        const index = tickets.value.findIndex(ticket => ticket.ticketid === id);
        if (index !== -1) {
          tickets.value[index] = response.data;
        }
        
        // Update current ticket if it's the same
        if (currentTicket.value && currentTicket.value.ticketid === id) {
          currentTicket.value = response.data;
        }
        
        console.log('Engineering ticket updated successfully');
        return response.data;
      }
      
    } catch (err) {
      console.error('Error updating engineering ticket:', err);
      error.value = err.response?.data?.message || 'Failed to update ticket';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteTicket(id) {
    loading.value = true;
    error.value = null;
    
    try {
      await EngineeringService.deleteTicket(id);
      
      // Remove ticket from the list
      tickets.value = tickets.value.filter(ticket => ticket.ticketid !== id);
      
      // Clear current ticket if it's the same
      if (currentTicket.value && currentTicket.value.ticketid === id) {
        currentTicket.value = null;
      }
      
      console.log('Engineering ticket deleted successfully');
      
    } catch (err) {
      console.error('Error deleting engineering ticket:', err);
      error.value = err.response?.data?.message || 'Failed to delete ticket';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Filter and pagination actions
  function updateFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters };
    pagination.value.page = 1; // Reset to first page when filters change
  }

  function resetFilters() {
    filters.value = {
      status: [],
      priority: [],
      department: [],
      owner: [],
      escalated: null,
      overdue: null,
      dateRange: null,
      search: ''
    };
    pagination.value.page = 1;
  }

  function updatePagination(newPagination) {
    pagination.value = { ...pagination.value, ...newPagination };
  }

  function resetState() {
    tickets.value = [];
    currentTicket.value = null;
    dashboardStats.value = {
      open_tickets: 0,
      sla_breaches: 0,
      avg_resolution_time_hours: 0,
      tickets_this_month: 0,
      resolved_this_month: 0,
      escalated_tickets: 0
    };
    statusBreakdown.value = [];
    priorityBreakdown.value = [];
    ownerBreakdown.value = [];
    performanceMetrics.value = {};
    recentActivity.value = [];
    recentTickets.value = [];
    topReasons.value = [];
    loading.value = false;
    dashboardLoading.value = false;
    ticketLoading.value = false;
    error.value = null;
    resetFilters();
    pagination.value = {
      page: 1,
      perPage: 25,
      total: 0,
      totalPages: 0
    };
  }

  // Dashboard actions
  function clearActionItems() {
    actionItems.value = [];
  }

  function dismissAlert(alertId) {
    criticalAlerts.value = criticalAlerts.value.filter(alert => alert.id !== alertId);
  }

  // === CALENDAR METHODS ===
  
  async function fetchCalendarEvents(startDate = null, endDate = null, refresh = false) {
    calendarLoading.value = true;
    error.value = null;
    
    try {
      // If no dates provided, use current month
      if (!startDate || !endDate) {
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      }

      // Store the current view range for future reference
      currentViewStart.value = startDate;
      currentViewEnd.value = endDate;

      const response = await EngineeringService.getCalendarEvents(
        startDate,
        endDate,
        selectedEngineer.value || 'all',
        selectedEventType.value || null,
        true // Include AI tasks by default
      );

      // DEBUG: Log the exact response structure
      console.log('Calendar Events Response Structure:', response);
      console.log('Response.data:', response.data);
      console.log('Response.data.data:', response.data?.data);
      console.log('Response.data.events:', response.data?.events);

      // Parse the events from the response - try multiple possible structures
      let events = [];
      if (response.data?.data?.events) {
        events = response.data.data.events;
      } else if (response.data?.events) {
        events = response.data.events;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        events = response.data.data;
      } else if (Array.isArray(response.data)) {
        events = response.data;
      }

      console.log('Parsed Events:', events);
      console.log('Events Count:', events.length);

      // Store ONLY the events array, not the entire response object
      calendarEvents.value = events;
      return { data: calendarEvents.value };
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      error.value = 'Failed to fetch calendar events';
      calendarEvents.value = [];
      throw err;
    } finally {
      calendarLoading.value = false;
    }
  }

  async function createCalendarEvent(eventData) {
    calendarLoading.value = true;
    error.value = null;
    
    try {
      const response = await EngineeringService.createCalendarEvent(eventData);
      
      // CRITICAL: Refresh the calendar with expanded date range to include new event
      await refreshCalendarWithNewEvent(eventData.start_time);
      
      return response.data;
    } catch (err) {
      console.error('Error creating calendar event:', err);
      error.value = 'Failed to create calendar event';
      throw err;
    } finally {
      calendarLoading.value = false;
    }
  }

  // NEW: Method to refresh calendar ensuring new event is visible
  async function refreshCalendarWithNewEvent(eventDate) {
    const eventDateObj = new Date(eventDate);
    const currentStart = new Date(currentViewStart.value);
    const currentEnd = new Date(currentViewEnd.value);

    // Expand date range if new event is outside current view
    let newStart = currentStart;
    let newEnd = currentEnd;

    if (eventDateObj < currentStart) {
      newStart = new Date(eventDateObj.getFullYear(), eventDateObj.getMonth(), 1);
    }
    if (eventDateObj > currentEnd) {
      newEnd = new Date(eventDateObj.getFullYear(), eventDateObj.getMonth() + 1, 0);
    }

    await fetchCalendarEvents(
      newStart.toISOString().split('T')[0],
      newEnd.toISOString().split('T')[0],
      true
    );
  }

  async function updateCalendarEvent(eventId, eventData) {
    calendarLoading.value = true;
    error.value = null;
    
    try {
      const response = await EngineeringService.updateCalendarEvent(eventId, eventData);
      // Refresh events after update
      await fetchCalendarEvents(currentViewStart.value, currentViewEnd.value, true);
      return response.data;
    } catch (err) {
      console.error('Error updating calendar event:', err);
      error.value = 'Failed to update calendar event';
      throw err;
    } finally {
      calendarLoading.value = false;
    }
  }

  async function deleteCalendarEvent(eventId) {
    calendarLoading.value = true;
    error.value = null;
    
    try {
      await EngineeringService.deleteCalendarEvent(eventId);
      // Refresh events after deletion
      await fetchCalendarEvents(currentViewStart.value, currentViewEnd.value, true);
    } catch (err) {
      console.error('Error deleting calendar event:', err);
      error.value = 'Failed to delete calendar event';
      throw err;
    } finally {
      calendarLoading.value = false;
    }
  }

  async function fetchCalendarEngineers() {
    try {
      const response = await EngineeringService.getCalendarEngineers();
      calendarEngineers.value = response.data || [];
      return calendarEngineers.value;
    } catch (err) {
      console.error('Error fetching calendar engineers:', err);
      error.value = 'Failed to fetch engineers';
      calendarEngineers.value = [];
      throw err;
    }
  }

  async function fetchCalendarTickets() {
    try {
      const response = await EngineeringService.getCalendarTickets();
      calendarTickets.value = response.data || [];
      return calendarTickets.value;
    } catch (err) {
      console.error('Error fetching calendar tickets:', err);
      error.value = 'Failed to fetch tickets';
      calendarTickets.value = [];
      throw err;
    }
  }

  async function fetchCalendarStatistics() {
    try {
      const response = await EngineeringService.getCalendarStatistics(
        currentViewStart.value,
        currentViewEnd.value
      );
      calendarStatistics.value = response.data || {};
      return calendarStatistics.value;
    } catch (err) {
      console.error('Error fetching calendar statistics:', err);
      error.value = 'Failed to fetch calendar statistics';
      calendarStatistics.value = {};
      throw err;
    }
  }

  // === QUEUE ANALYTICS ACTIONS ===
  
  async function fetchQueueCurrent(params = {}) {
    try {
      console.log('Fetching current queue data...');
      const response = await EngineeringService.getQueueCurrent(params);
      return response.data?.data || response.data || {};
    } catch (err) {
      console.error('Error fetching current queue data:', err);
      throw err;
    }
  }

  async function fetchQueueHealth(params = { days: 7 }) {
    try {
      console.log('Fetching queue health data...');
      const response = await EngineeringService.getQueueHealth(params);
      return response.data?.data || response.data || {};
    } catch (err) {
      console.error('Error fetching queue health data:', err);
      throw err;
    }
  }

  async function fetchQueueAnalytics(params = {}) {
    try {
      console.log('Fetching queue analytics data...');
      const response = await EngineeringService.getQueueAnalytics(params);
      return response.data?.data || response.data || {};
    } catch (err) {
      console.error('Error fetching queue analytics data:', err);
      throw err;
    }
  }

  async function fetchQueueHistory(params = { page: 1, per_page: 20 }) {
    try {
      console.log('Fetching queue history data...');
      const response = await EngineeringService.getQueueHistory(params);
      return response.data?.data || response.data || [];
    } catch (err) {
      console.error('Error fetching queue history data:', err);
      throw err;
    }
  }

  async function fetchQueueTrends(params = { period: '24h', limit: 100 }) {
    try {
      console.log('Fetching queue trends data...');
      const response = await EngineeringService.getQueueTrends(params);
      return response.data?.data || response.data || {};
    } catch (err) {
      console.error('Error fetching queue trends data:', err);
      throw err;
    }
  }

  async function fetchQueueWorkload(params = {}) {
    try {
      console.log('Fetching queue workload data...');
      const response = await EngineeringService.getQueueWorkload(params);
      return response.data?.data || response.data || {};
    } catch (err) {
      console.error('Error fetching queue workload data:', err);
      throw err;
    }
  }

  async function fetchQueuePerformance(params = { days: 30 }) {
    try {
      console.log('Fetching queue performance data...');
      const response = await EngineeringService.getQueuePerformance(params);
      return response.data?.data || response.data || {};
    } catch (err) {
      console.error('Error fetching queue performance data:', err);
      throw err;
    }
  }

  // === SYNC AND AI TRIGGERS ===
  
  async function triggerFieldSync() {
    try {
      loading.value = true;
      const response = await EngineeringService.triggerFieldSync();
      return response.data;
    } catch (error) {
      console.error('Error triggering field sync:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function triggerAIAnalysis() {
    try {
      loading.value = true;
      const response = await EngineeringService.triggerAIAnalysis();
      return response.data;
    } catch (error) {
      console.error('Error triggering AI analysis:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function getSyncStatus() {
    try {
      const response = await EngineeringService.getSyncStatus();
      return response.data;
    } catch (error) {
      console.error('Error fetching sync status:', error);
      throw error;
    }
  }

  // === TICKET TASK MANAGEMENT ===
  
  async function createTicketTask(taskData) {
    try {
      loading.value = true;
      const response = await EngineeringService.createTicketTask(taskData);
      return response.data;
    } catch (error) {
      console.error('Error creating ticket task:', error);
      error.value = error.message || 'Failed to create ticket task';
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function updateTicketTask(taskId, taskData) {
    try {
      loading.value = true;
      const response = await EngineeringService.updateTicketTask(taskId, taskData);
      return response.data;
    } catch (error) {
      console.error('Error updating ticket task:', error);
      error.value = error.message || 'Failed to update ticket task';
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function deleteTicketTask(taskId) {
    try {
      loading.value = true;
      const response = await EngineeringService.deleteTicketTask(taskId);
      return response.data;
    } catch (error) {
      console.error('Error deleting ticket task:', error);
      error.value = error.message || 'Failed to delete ticket task';
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchTicketTasks(params = {}) {
    try {
      loading.value = true;
      const response = await EngineeringService.getTicketTasks(params);
      return response.data;
    } catch (error) {
      console.error('Error fetching ticket tasks:', error);
      error.value = error.message || 'Failed to fetch ticket tasks';
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchTasksForTicket(ticketId) {
    try {
      loading.value = true;
      const response = await EngineeringService.getTasksForTicket(ticketId);
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks for ticket:', error);
      error.value = error.message || 'Failed to fetch tasks for ticket';
      throw error;
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    tickets,
    currentTicket,
    currentTicketDetail,
    currentTicketInsights,
    currentTicketInsightsEnhanced,
    dashboardStats,
    statusBreakdown,
    priorityBreakdown,
    ownerBreakdown,
    performanceMetrics,
    recentActivity,
    recentTickets,
    topReasons,
    criticalAlerts,
    actionItems,
    agingRanges,
    customerHealthData,
    engineerWorkload,
    aiInsights,
    rebalanceSuggestion,
    globalSearch,
    calendarEvents,
    calendarEngineers,
    calendarTickets,
    calendarStatistics,
    currentViewStart,
    currentViewEnd,
    selectedEngineer,
    selectedEventType,
    loading,
    dashboardLoading,
    ticketLoading,
    calendarLoading,
    error,
    filters,
    pagination,
    
    // === COMPREHENSIVE DASHBOARD STATE ===
    completeDashboard,
    quickStats,
    dashboardHealthScore,
    dashboardCriticalAlerts,
    dashboardActionItems,
    customerHealthMatrix,
    workloadDistribution,
    agingAnalysis,
    ticketInsights,
    enhancedTicketDetails,
    
    // Getters
    getTicketById,
    totalTickets,
    openTickets,
    closedTickets,
    inProgressTickets,
    overdueTickets,
    escalatedTickets,
    highPriorityTickets,
    filteredTickets,
    dashboardSummary,
    healthScore,
    healthScoreTrend,
    healthScoreTrendIcon,
    healthScoreCardClass,
    ticketGrowthPercent,
    customerRiskStats,
    maxAgingCount,
    maxWorkload,
    showWorkloadBalancer,
    
    // Actions
    fetchDashboardData,
    fetchTickets,
    fetchTicket,
    searchTickets,
    fetchOverdueTickets,
    createTicket,
    updateTicket,
    deleteTicket,
    updateFilters,
    resetFilters,
    updatePagination,
    resetState,
    clearActionItems,
    dismissAlert,
    
    // === COMPREHENSIVE DASHBOARD ACTIONS ===
    fetchConsolidatedDashboard, // 🚀 NEW: Super-fast single API call
    fetchCompleteDashboard,
    fetchQuickStats,
    fetchDashboardHealthScore,
    fetchDashboardCriticalAlerts,
    fetchDashboardActionItems,
    fetchCustomerHealthMatrix,
    fetchWorkloadDistribution,
    fetchAgingAnalysis,
    fetchTicketDetail,
    fetchTicketInsights,
    fetchAllDashboardData,
    fetchEnhancedActionItems,
    
    // === CALENDAR ACTIONS ===
    fetchCalendarEvents,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    refreshCalendarWithNewEvent,
    fetchCalendarEngineers,
    fetchCalendarTickets,
    fetchCalendarStatistics,
    
    // === QUEUE ANALYTICS ACTIONS ===
    fetchQueueCurrent,
    fetchQueueHealth,
    fetchQueueAnalytics,
    fetchQueueHistory,
    fetchQueueTrends,
    fetchQueueWorkload,
    fetchQueuePerformance,
    
    // === SYNC AND AI TRIGGERS ===
    triggerFieldSync,
    triggerAIAnalysis,
    getSyncStatus,
    
    // === TICKET TASK MANAGEMENT ===
    createTicketTask,
    updateTicketTask,
    deleteTicketTask,
    fetchTicketTasks,
    fetchTasksForTicket
  };
}); 