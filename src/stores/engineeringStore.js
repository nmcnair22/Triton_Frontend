import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { EngineeringService } from '@/service/EngineeringService';

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
  
  // New dashboard state properties
  const criticalAlerts = ref([
    {
      id: 1,
      title: 'Sun Auto Tire - 45 Days Overdue',
      description: 'Azure migration issues ticket has been open for 45 days',
      icon: 'pi pi-exclamation-triangle',
      action: { label: 'Assign Specialist', route: '/engineering/tickets/123' }
    },
    {
      id: 2,
      title: 'Anthony Raia - Workload Critical',
      description: 'Engineer has 24 active tickets (150% capacity)',
      icon: 'pi pi-users',
      action: { label: 'Redistribute Load', type: 'rebalance' }
    },
    {
      id: 3,
      title: '5 Unassigned Tickets >15 Days',
      description: 'Multiple tickets require immediate assignment',
      icon: 'pi pi-clock',
      action: { label: 'Assign Now', route: '/engineering/tickets?filter=unassigned' }
    }
  ]);
  
  const actionItems = ref([
    {
      id: 1,
      description: 'Assign specialist to Sun Auto Tire (35 days overdue)'
    },
    {
      id: 2,
      description: "Review Anthony Raia's workload (24 tickets)"
    },
    {
      id: 3,
      description: 'Implement ticket triage system'
    }
  ]);
  

  
  const customerHealthData = ref([
    {
      customerName: 'Sun Auto Tire',
      ticketCount: 8,
      avgAge: 45,
      riskScore: 35
    },
    {
      customerName: 'USRES',
      ticketCount: 12,
      avgAge: 28,
      riskScore: 62
    },
    {
      customerName: 'Carters - Corporate',
      ticketCount: 6,
      avgAge: 15,
      riskScore: 78
    },
    {
      customerName: 'Premier Logistics',
      ticketCount: 4,
      avgAge: 22,
      riskScore: 68
    }
  ]);
  

  
  const rebalanceSuggestion = ref({
    from: 'Anthony Raia',
    moveCount: 6,
    suggestions: [
      { count: 3, to: 'Sarah Chen', reason: 'capacity available' },
      { count: 2, to: 'David Kim', reason: 'skill match' },
      { count: 1, to: 'Mike Johnson', reason: 'customer familiarity' }
    ]
  });
  
  const globalSearch = ref('');
  
  // Calendar state
  const calendarEvents = ref([]);
  const calendarEngineers = ref([]);
  const calendarTickets = ref([]);
  const calendarStatistics = ref({});
  
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
    if (score >= 80) return 'EXCELLENT';
    if (score >= 65) return 'GOOD';
    if (score >= 50) return 'FAIR';
    return 'NEEDS ATTENTION';
  });

  const healthScoreTrendIcon = computed(() => {
    const score = healthScore.value;
    if (score >= 80) return 'pi pi-arrow-up text-green-500';
    if (score >= 65) return 'pi pi-arrow-right text-blue-500';
    if (score >= 50) return 'pi pi-arrow-down text-yellow-500';
    return 'pi pi-arrow-down text-red-500';
  });

  const healthScoreCardClass = computed(() => {
    const score = healthScore.value;
    if (score >= 80) return 'bg-gradient-to-br from-green-500 to-green-600 text-white';
    if (score >= 65) return 'bg-gradient-to-br from-blue-500 to-blue-600 text-white';
    if (score >= 50) return 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white';
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
    
    return [
      {
        label: '0-7 days',
        count: Math.max(0, Math.round(open * 0.3)),
        key: '0-7',
        colorClass: 'bg-green-500'
      },
      {
        label: '8-15 days', 
        count: Math.max(0, Math.round(open * 0.25)),
        key: '8-15',
        colorClass: 'bg-blue-500'
      },
      {
        label: '16-30 days',
        count: Math.max(0, Math.round(open * 0.25)),
        key: '16-30', 
        colorClass: 'bg-yellow-500'
      },
      {
        label: '31+ days',
        count: overdue,
        key: '31+',
        colorClass: 'bg-red-500'
      }
    ];
  });

  const maxAgingCount = computed(() => {
    return Math.max(...agingRanges.value.map(r => r.count), 1);
  });

  const engineerWorkload = computed(() => {
    if (!ownerBreakdown.value || typeof ownerBreakdown.value !== 'object') return [];
    
    // Convert the owner breakdown object to array format
    const workloadData = Object.entries(ownerBreakdown.value).map(([name, count]) => ({
      name,
      count,
      loadClass: count > 20 ? 'bg-red-500' : count > 15 ? 'bg-yellow-500' : 'bg-green-500',
      avatarColor: getAvatarColor(name)
    }));
    
    // Sort by count descending
    return workloadData.sort((a, b) => b.count - a.count);
  });

  const maxWorkload = computed(() => {
    return Math.max(...engineerWorkload.value.map(e => e.count), 1);
  });

  const showWorkloadBalancer = computed(() => {
    return engineerWorkload.value.some(e => e.count > 20);
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
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  // Actions
  async function fetchDashboardData() {
    dashboardLoading.value = true;
    error.value = null;
    
    try {
      console.log('Fetching engineering dashboard data...');
      
      // Fetch all dashboard data in parallel
      const [statsResponse, statusResponse, priorityResponse, ownerResponse, performanceResponse, activityResponse] = await Promise.all([
        EngineeringService.getDashboardStats(),
        EngineeringService.getStatusBreakdown(),
        EngineeringService.getPriorityBreakdown(),
        EngineeringService.getOwnerBreakdown(),
        EngineeringService.getPerformanceMetrics(),
        EngineeringService.getRecentActivity()
      ]);
      
      // Debug: Log all responses
      console.log('Stats Response:', statsResponse.data);
      console.log('Status Breakdown Response:', statusResponse.data);
      console.log('Priority Breakdown Response:', priorityResponse.data);
      console.log('Owner Breakdown Response:', ownerResponse.data);
      console.log('Performance Response:', performanceResponse.data);
      console.log('Activity Response:', activityResponse.data);
      
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
        
        console.log('Updated dashboard stats:', dashboardStats.value);
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
      
      console.log('Updated breakdowns:', {
        status: statusBreakdown.value,
        priority: priorityBreakdown.value,
        owner: ownerBreakdown.value,
        performance: performanceMetrics.value,
        activity: recentActivity.value
      });
      
      console.log('Engineering dashboard data loaded successfully');
      
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
      console.log('Fetching complete dashboard data...');
      const response = await EngineeringService.getCompleteDashboard();
      completeDashboard.value = response.data?.data || response.data || {};
      console.log('Complete dashboard data loaded:', completeDashboard.value);
    } catch (err) {
      console.error('Error fetching complete dashboard:', err);
    }
  }

  async function fetchQuickStats() {
    try {
      console.log('Fetching quick stats...');
      const response = await EngineeringService.getQuickStats();
      quickStats.value = response.data?.data || response.data || {};
      console.log('Quick stats loaded:', quickStats.value);
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

  // Enhanced fetchDashboardData that includes all comprehensive data
  async function fetchAllDashboardData() {
    dashboardLoading.value = true;
    error.value = null;
    
    try {
      console.log('Fetching ALL comprehensive dashboard data...');
      
      // Fetch all dashboard data in parallel for maximum performance
      await Promise.all([
        fetchDashboardData(), // Existing basic dashboard data
        fetchCompleteDashboard(),
        fetchQuickStats(),
        fetchDashboardHealthScore(),
        fetchDashboardCriticalAlerts(),
        fetchDashboardActionItems(),
        fetchCustomerHealthMatrix(),
        fetchWorkloadDistribution(),
        fetchAgingAnalysis()
      ]);
      
      console.log('ALL comprehensive dashboard data loaded successfully');
      
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
      console.log('🎫 Fetching engineering tickets with params:', params);
      
      // Merge filters with params
      const queryParams = {
        ...params,
        page: pagination.value.page,
        per_page: pagination.value.perPage,
        ...Object.fromEntries(
          Object.entries(filters.value).filter(([key, value]) => {
            if (Array.isArray(value)) return value.length > 0;
            return value !== null && value !== '';
          })
        )
      };
      
      console.log('🔍 Final query params:', queryParams);
      
      const response = await EngineeringService.getTickets(queryParams);
      
      console.log('📡 Raw API response:', response);
      console.log('📊 Response data structure:', response.data);
      
      if (response.data) {
        // Check if data is nested or direct
        const ticketData = response.data.data || response.data;
        console.log('🎯 Extracted ticket data:', ticketData);
        console.log('📈 Ticket data type:', typeof ticketData);
        console.log('📋 Is array?', Array.isArray(ticketData));
        
        if (Array.isArray(ticketData)) {
          tickets.value = ticketData;
          console.log(`✅ Loaded ${ticketData.length} engineering tickets`);
          
          // Log first ticket structure for debugging
          if (ticketData.length > 0) {
            console.log('🔍 First ticket structure:', ticketData[0]);
            console.log('🔍 First ticket keys:', Object.keys(ticketData[0]));
          }
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
          console.log('📄 Updated pagination:', pagination.value);
        } else {
          console.log('⚠️ No pagination meta found in response');
        }
      } else {
        console.error('❌ No data in response');
        tickets.value = [];
      }
      
    } catch (err) {
      console.error('💥 Error fetching engineering tickets:', err);
      console.error('💥 Error response:', err.response?.data);
      error.value = err.response?.data?.message || 'Failed to load tickets';
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
      error.value = err.response?.data?.message || 'Failed to load ticket';
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
  
  async function fetchCalendarEvents(params = {}) {
    calendarLoading.value = true;
    error.value = null;
    
    try {
      const response = await EngineeringService.getCalendarEvents(params);
      calendarEvents.value = response.data.events || [];
      return calendarEvents.value;
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
      // Refresh events after creation
      await fetchCalendarEvents();
      return response.data;
    } catch (err) {
      console.error('Error creating calendar event:', err);
      error.value = 'Failed to create calendar event';
      throw err;
    } finally {
      calendarLoading.value = false;
    }
  }

  async function updateCalendarEvent(eventId, eventData) {
    calendarLoading.value = true;
    error.value = null;
    
    try {
      const response = await EngineeringService.updateCalendarEvent(eventId, eventData);
      // Refresh events after update
      await fetchCalendarEvents();
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
      await fetchCalendarEvents();
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
      const response = await EngineeringService.getCalendarStatistics();
      calendarStatistics.value = response.data || {};
      return calendarStatistics.value;
    } catch (err) {
      console.error('Error fetching calendar statistics:', err);
      error.value = 'Failed to fetch calendar statistics';
      calendarStatistics.value = {};
      throw err;
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
    fetchCalendarEngineers,
    fetchCalendarTickets,
    fetchCalendarStatistics
  };
}); 