import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ApiService } from '@/service/ApiService';

export const useVisitsStore = defineStore('visits', () => {
  // State
  const visits = ref([]);
  const currentVisit = ref(null);
  const visitTimeline = ref([]);
  const visitAnalytics = ref(null);
  const visitStats = ref({
    overview: {
      total: 0,
      completed: 0,
      inProgress: 0,
      scheduled: 0,
      cancelled: 0,
      completionRate: 0,
      avgQualityScore: 0,
      totalRevenue: 0
    },
    trends: []
  });
  const loading = ref(false);
  const timelineLoading = ref(false);
  const analyticsLoading = ref(false);
  const error = ref(null);
  
  // Ticket state
  const currentTicket = ref(null);
  const ticketLoading = ref(false);
  const ticketError = ref(null);
  const filters = ref({
    dateRange: null,
    status: [],
    customers: [],
    technicians: [],
    visitTypes: [],
    projects: []
  });

  // Getters
  const getVisitById = computed(() => {
    return (id) => visits.value.find(visit => visit.id === id);
  });

  const totalVisits = computed(() => visits.value.length);

  const completedVisits = computed(() => 
    visits.value.filter(visit => visit.status === 'completed').length
  );

  const inProgressVisits = computed(() => 
    visits.value.filter(visit => visit.status === 'in_progress').length
  );

  const upcomingVisits = computed(() => 
    visits.value.filter(visit => visit.status === 'scheduled').length
  );

  const filteredVisits = computed(() => {
    let filtered = [...visits.value];
    
    // Apply status filter
    if (filters.value.status.length > 0) {
      filtered = filtered.filter(visit => filters.value.status.includes(visit.status));
    }
    
    // Apply customer filter
    if (filters.value.customers.length > 0) {
      filtered = filtered.filter(visit => 
        filters.value.customers.some(customer => customer.id === visit.customer?.id)
      );
    }
    
    // Apply date range filter
    if (filters.value.dateRange && filters.value.dateRange.length === 2) {
      const [startDate, endDate] = filters.value.dateRange;
      filtered = filtered.filter(visit => {
        const visitDate = new Date(visit.serviceDate);
        return visitDate >= startDate && visitDate <= endDate;
      });
    }
    
    return filtered;
  });

  const visitTrends = computed(() => visitStats.value.trends || {});

  // Computed statistics for dashboard
  const overallStats = computed(() => {
    const totalCount = visits.value.length;
    const completed = visits.value.filter(v => v.status === 'completed').length;
    const inProgress = visits.value.filter(v => v.status === 'in_progress').length;
    const scheduled = visits.value.filter(v => v.status === 'scheduled').length;
    
    // Calculate completion rate using AI-enhanced completion percentage
    const aiCompletionRates = visits.value
      .filter(v => v.computed_metrics?.completion_percentage !== undefined)
      .map(v => v.computed_metrics.completion_percentage);
    const avgCompletionRate = aiCompletionRates.length > 0 
      ? Math.round(aiCompletionRates.reduce((sum, rate) => sum + rate, 0) / aiCompletionRates.length)
      : (totalCount > 0 ? Math.round((completed / totalCount) * 100) : 0);
    
    // Calculate average quality score from AI insights
    const qualityScores = visits.value
      .filter(v => v.ai_analysis?.technician_rating?.rating_value)
      .map(v => v.ai_analysis.technician_rating.rating_value);
    const avgQualityScore = qualityScores.length > 0 
      ? Math.round((qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length) * 10) / 10
      : 0;
    
    // Calculate total revenue
    const totalRevenue = visits.value.reduce((sum, visit) => sum + (visit.revenue || 0), 0);
    
    return {
      total: totalCount,
      completed,
      inProgress,
      scheduled,
      completionRate: avgCompletionRate,
      avgQualityScore,
      totalRevenue
    };
  });

  // Actions
  async function fetchVisits(params = {}) {
    loading.value = true;
    error.value = null;
    
    console.log('Starting visits fetch with params:', params);
    
    try {
      const response = await ApiService.get('/visits', params);
      
      if (response.data && response.data.data) {
        console.log(`Retrieved ${response.data.data.length} visits`);
        
        visits.value = response.data.data.map(visit => ({
          id: visit.id,
          externalId: visit.external_id,
          status: visit.status,
          visitType: visit.visit_type,
          serviceDate: visit.service_date,
          customer: visit.customer,
          project: visit.project,
          technicians: visit.technicians || [],
          
          // Enhanced AI-enriched fields
          enhanced_data: visit.enhanced_data || null,
          ai_analysis: visit.ai_analysis || null,
          work_summary: visit.work_summary || '',
          scope_analysis: visit.scope_analysis || null,
          outcome_analysis: visit.outcome_analysis || null,
          future_actions: visit.future_actions || null,
          extraction_warnings: visit.extraction_warnings || [],
          
          // Enhanced computed metrics
          computed_metrics: visit.computed_metrics || {
            total_tasks: 0,
            completed_tasks: 0,
            completion_percentage: 0,
            actual_duration: null,
            has_ai_analysis: false
          },
          
          flags: visit.flags || {},
          
          // Legacy fields for backwards compatibility
          aiInsights: visit.ai_insights || (visit.ai_analysis ? {
            outcomeScore: visit.outcome_analysis?.completion_percentage || 0,
            qualityRating: visit.ai_analysis?.technician_rating?.rating_value || 0,
            riskLevel: visit.outcome_analysis?.blocking_issues_analysis?.length > 0 ? 'high' : 'low',
            outcomeCategory: visit.outcome_analysis?.primary_status || 'unknown',
            efficiencyScore: visit.computed_metrics?.completion_percentage || 0,
            customerSatisfactionScore: visit.ai_analysis?.technician_rating?.rating_value || 0,
            recommendations: visit.future_actions?.new_work_identified || [],
            followUpRequired: visit.future_actions?.revisit_needed === 'Yes',
            riskIndicators: visit.outcome_analysis?.blocking_issues_analysis || []
          } : {
            outcomeScore: 0,
            qualityRating: 0,
            riskLevel: 'low'
          }),
          
          hoursWorked: visit.hours_worked || (visit.computed_metrics?.actual_duration ? 
            parseFloat(visit.computed_metrics.actual_duration.match(/(\d+(\.\d+)?)/)?.[0]) || 0 : 0),
          totalCost: visit.total_cost || 0,
          revenue: visit.revenue || 0,
          createdAt: visit.created_at,
          updatedAt: visit.updated_at
        }));
        
        console.log(`Total visits after processing: ${visits.value.length}`);
      } else {
        console.log('Unexpected response format or no visits in response:', response.data);
        visits.value = [];
      }
      
      return visits.value;
    } catch (err) {
      error.value = err.message || 'Failed to fetch visits';
      console.error('Error fetching visits:', err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchVisit(id) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await ApiService.get(`/visits/${id}`);
      
      if (response.data && response.data.data) {
        const visit = response.data.data;
        currentVisit.value = {
          id: visit.id,
          externalId: visit.external_id,
          status: visit.status,
          visitType: visit.visit_type,
          serviceDate: visit.service_date,
          customer: visit.customer,
          project: visit.project,
          technicians: visit.technicians || [],
          tasks: visit.tasks || [],
          issues: visit.issues || [],
          materials: visit.materials || [],
          
          // Enhanced AI-enriched data
          enhanced_data: visit.enhanced_data || null,
          ai_analysis: visit.ai_analysis || null,
          work_summary: visit.work_summary || '',
          scope_analysis: visit.scope_analysis || null,
          outcome_analysis: visit.outcome_analysis || null,
          future_actions: visit.future_actions || null,
          extraction_warnings: visit.extraction_warnings || [],
          
          // Enhanced computed metrics
          computed_metrics: visit.computed_metrics || {
            total_tasks: 0,
            completed_tasks: 0,
            completion_percentage: 0,
            actual_duration: null,
            has_ai_analysis: false
          },
          
          flags: visit.flags || {},
          
          timeline: visit.timeline ? visit.timeline.map(event => ({
            id: event.id,
            type: event.event_type || 'milestone',
            title: event.event_description || 'Timeline Event',
            description: event.event_description || '',
            timestamp: event.event_time || event.created_at,
            user: event.technician_name || 'System',
            metadata: event.event_details ? JSON.parse(event.event_details) : {},
            priority: event.priority || 'medium'
          })) : [],
          
          // Legacy fields for backwards compatibility
          aiInsights: visit.ai_insights || (visit.ai_analysis ? {
            outcomeScore: visit.outcome_analysis?.completion_percentage || 0,
            qualityRating: visit.ai_analysis?.technician_rating?.rating_value || 0,
            riskLevel: visit.outcome_analysis?.blocking_issues_analysis?.length > 0 ? 'high' : 'low',
            outcomeCategory: visit.outcome_analysis?.primary_status || 'unknown',
            efficiencyScore: visit.computed_metrics?.completion_percentage || 0,
            customerSatisfactionScore: visit.ai_analysis?.technician_rating?.rating_value || 0,
            recommendations: visit.future_actions?.new_work_identified || [],
            followUpRequired: visit.future_actions?.revisit_needed === 'Yes',
            riskIndicators: visit.outcome_analysis?.blocking_issues_analysis || []
          } : {
            outcomeScore: 0,
            qualityRating: 0,
            riskLevel: 'low'
          }),
          
          hoursWorked: visit.hours_worked || (visit.computed_metrics?.actual_duration ? 
            parseFloat(visit.computed_metrics.actual_duration.match(/(\d+(\.\d+)?)/)?.[0]) || 0 : 0),
          efficiency: visit.computed_metrics?.completion_percentage || 0,
          profitMargin: visit.profit_margin || 0,
          totalCost: visit.total_cost || 0,
          revenue: visit.revenue || 0,
          createdAt: visit.created_at,
          updatedAt: visit.updated_at
        };
        
        return currentVisit.value;
      }
    } catch (err) {
      error.value = err.message || 'Failed to fetch visit';
      console.error('Error fetching visit:', err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function fetchVisitTimeline(visitId) {
    timelineLoading.value = true;
    error.value = null;
    
    try {
      const response = await ApiService.get(`/visits/${visitId}/timeline`);
      
      if (response.data && response.data.data) {
        visitTimeline.value = response.data.data.map(event => ({
          id: event.id,
          type: event.event_type || 'milestone',
          title: event.event_description || 'Timeline Event',
          description: event.event_description || '',
          timestamp: event.event_time || event.created_at,
          user: event.technician_name || 'System',
          metadata: event.event_details ? JSON.parse(event.event_details) : {},
          priority: event.priority || 'medium'
        }));
      } else {
        visitTimeline.value = [];
      }
      
      return visitTimeline.value;
    } catch (err) {
      error.value = err.message || `Failed to fetch timeline for visit #${visitId}`;
      console.error(`Error fetching visit timeline #${visitId}:`, err);
      return [];
    } finally {
      timelineLoading.value = false;
    }
  }

  async function fetchVisitAnalytics(visitId) {
    analyticsLoading.value = true;
    error.value = null;
    
    try {
      const response = await ApiService.get(`/visits/${visitId}/analytics`);
      
      if (response.data && response.data.data) {
        visitAnalytics.value = response.data.data;
      } else {
        visitAnalytics.value = null;
      }
      
      return visitAnalytics.value;
    } catch (err) {
      error.value = err.message || `Failed to fetch analytics for visit #${visitId}`;
      console.error(`Error fetching visit analytics #${visitId}:`, err);
      return null;
    } finally {
      analyticsLoading.value = false;
    }
  }

  async function fetchVisitStats(params = {}) {
    loading.value = true;
    error.value = null;
    
    try {
      const [overviewResponse, trendsResponse] = await Promise.all([
        ApiService.get('/visits/stats/overview', params),
        ApiService.get('/visits/stats/trends', params)
      ]);
      
      if (overviewResponse.data && overviewResponse.data.data) {
        visitStats.value.overview = overviewResponse.data.data;
      }
      
      if (trendsResponse.data && trendsResponse.data.data) {
        visitStats.value.trends = trendsResponse.data.data;
      }
      
      return visitStats.value;
    } catch (err) {
      error.value = err.message || 'Failed to fetch visit statistics';
      console.error('Error fetching visit stats:', err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function updateVisitStatus(visitId, status, notes = '') {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await ApiService.patch(`/visits/${visitId}`, {
        status: status,
        notes: notes
      });
      
      if (response.data && response.data.data) {
        // Update the visit in our local state
        const visitIndex = visits.value.findIndex(v => v.id === visitId);
        if (visitIndex !== -1) {
          visits.value[visitIndex] = {
            ...visits.value[visitIndex],
            status: status,
            updatedAt: response.data.data.updated_at
          };
        }
        
        // Update current visit if it's the same one
        if (currentVisit.value && currentVisit.value.id === visitId) {
          currentVisit.value = {
            ...currentVisit.value,
            status: status,
            updatedAt: response.data.data.updated_at
          };
        }
      }
      
      return response.data.data;
    } catch (err) {
      error.value = err.message || `Failed to update visit status #${visitId}`;
      console.error(`Error updating visit status #${visitId}:`, err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function addTimelineEvent(visitId, event) {
    timelineLoading.value = true;
    error.value = null;
    
    try {
      const response = await ApiService.post(`/visits/${visitId}/timeline`, event);
      
      if (response.data && response.data.data) {
        // Add the new event to our local timeline
        visitTimeline.value.unshift(response.data.data);
      }
      
      return response.data.data;
    } catch (err) {
      error.value = err.message || `Failed to add timeline event for visit #${visitId}`;
      console.error(`Error adding timeline event #${visitId}:`, err);
      return null;
    } finally {
      timelineLoading.value = false;
    }
  }

  async function fetchTicketData(ticketId) {
    ticketLoading.value = true;
    ticketError.value = null;
    currentTicket.value = null;
    
    try {
      const response = await ApiService.get(`/cisdb/tickets/${ticketId}?include_posts=true`);
      
      if (response.data && response.data.success && response.data.data) {
        currentTicket.value = response.data.data;
        return currentTicket.value;
      } else {
        throw new Error('Invalid ticket response format');
      }
    } catch (err) {
      ticketError.value = err.message || `Failed to fetch ticket #${ticketId}`;
      console.error(`Error fetching ticket #${ticketId}:`, err);
      return null;
    } finally {
      ticketLoading.value = false;
    }
  }

  // Utility functions
  function updateFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters };
  }

  function resetFilters() {
    filters.value = {
      dateRange: null,
      status: [],
      customers: [],
      technicians: [],
      visitTypes: [],
      projects: []
    };
  }

  function resetState() {
    visits.value = [];
    currentVisit.value = null;
    visitTimeline.value = [];
    visitAnalytics.value = null;
    error.value = null;
    resetFilters();
  }

  return {
    // State
    visits,
    currentVisit,
    visitTimeline,
    visitAnalytics,
    visitStats,
    loading,
    timelineLoading,
    analyticsLoading,
    error,
    filters,
    
    // Ticket state
    currentTicket,
    ticketLoading,
    ticketError,
    
    // Getters
    getVisitById,
    totalVisits,
    completedVisits,
    inProgressVisits,
    upcomingVisits,
    filteredVisits,
    visitTrends,
    overallStats,
    
    // Actions
    fetchVisits,
    fetchVisit,
    fetchVisitTimeline,
    fetchVisitAnalytics,
    fetchVisitStats,
    updateVisitStatus,
    addTimelineEvent,
    fetchTicketData,
    updateFilters,
    resetFilters,
    resetState
  };
}); 