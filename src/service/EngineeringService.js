import { ApiService } from './ApiService';

// Engineering-specific API services
export const EngineeringService = {
  // === COMPREHENSIVE DASHBOARD ENDPOINTS ===
  
  // 🚀 NEW: Super-Fast Consolidated Dashboard - Replaces 15+ API calls with 1
  getConsolidatedDashboard(params = {}) {
    return ApiService.get('/engineering/dashboard/consolidated', params);
  },
  
  // Complete Dashboard Data - Single endpoint for full dashboard
  getCompleteDashboard(params = {}) {
    return ApiService.get('/engineering/dashboard', params);
  },

  // Quick Stats Summary - Key metrics for dashboard header
  getQuickStats(params = {}) {
    return ApiService.get('/engineering/dashboard/quick-stats', params);
  },

  // Engineering Health Score - Overall team performance
  getHealthScore(params = {}) {
    return ApiService.get('/engineering/dashboard/health-score', params);
  },

  // Critical Alerts - Tickets requiring immediate attention
  getCriticalAlerts(params = {}) {
    return ApiService.get('/engineering/dashboard/critical-alerts', params);
  },

  // Action Items - Actionable tasks for managers
  getActionItems(params = {}) {
    return ApiService.get('/engineering/dashboard/action-items', params);
  },

  // Customer Health Matrix - Customer risk assessment
  getCustomerHealth(params = {}) {
    return ApiService.get('/engineering/dashboard/customer-health', params);
  },

  // Customer Detail Analysis - Deep-dive for specific customer
  getCustomerDetail(customerName, params = {}) {
    return ApiService.get(`/engineering/dashboard/customer-detail?customer=${encodeURIComponent(customerName)}`, params);
  },

  // Workload Distribution - Engineer capacity and performance
  getWorkloadDistribution(params = {}) {
    return ApiService.get('/engineering/dashboard/workload-distribution', params);
  },

  // Aging Analysis - Ticket staleness and aging intelligence
  getAgingAnalysis(params = {}) {
    return ApiService.get('/engineering/dashboard/aging-analysis', params);
  },

  // === ENHANCED TICKET ENDPOINTS ===

  // Ticket Detail with AI Analysis and ETL Context
  getTicketDetail(ticketId, params = {}) {
    return ApiService.get(`/engineering/tickets/${ticketId}/detail`, params);
  },

  // Ticket ETL Insights - Business intelligence for specific ticket
  getTicketInsights(ticketId, params = {}) {
    return ApiService.get(`/engineering/tickets/${ticketId}/insights`, params);
  },

  // === EXISTING ENDPOINTS (MAINTAINED) ===

  // Dashboard & Analytics
  getDashboardStats(params = {}) {
    return ApiService.get('/engineering/tickets/statistics', params);
  },

  getStatusBreakdown(params = {}) {
    return ApiService.get('/engineering/tickets/status-breakdown', params);
  },

  getPriorityBreakdown(params = {}) {
    return ApiService.get('/engineering/tickets/priority-breakdown', params);
  },

  getOwnerBreakdown(params = {}) {
    return ApiService.get('/engineering/tickets/owner-breakdown', params);
  },

  getPerformanceMetrics(params = {}) {
    return ApiService.get('/engineering/tickets/performance', params);
  },

  getRecentActivity(params = {}) {
    return ApiService.get('/engineering/tickets/recent-activity', params);
  },

  // Ticket Management
  getTickets(params = {}) {
    const defaultParams = { paginate: false, ...params };
    return ApiService.get('/engineering/tickets', defaultParams);
  },

  getTicket(id) {
    return ApiService.get(`/engineering/tickets/${id}`);
  },

  searchTickets(params = {}) {
    return ApiService.get('/engineering/tickets/search', params);
  },

  getOverdueTickets(params = {}) {
    return ApiService.get('/engineering/tickets/overdue', params);
  },

  // Ticket CRUD Operations
  createTicket(ticket) {
    return ApiService.post('/engineering/tickets', ticket);
  },

  updateTicket(id, ticket) {
    return ApiService.put(`/engineering/tickets/${id}`, ticket);
  },

  deleteTicket(id) {
    return ApiService.delete(`/engineering/tickets/${id}`);
  },

  // Ticket Actions
  addPost(ticketId, post) {
    return ApiService.post(`/engineering/tickets/${ticketId}/posts`, post);
  },

  addAction(ticketId, action) {
    return ApiService.post(`/engineering/tickets/${ticketId}/actions`, action);
  },

  addTimelineEvent(ticketId, event) {
    return ApiService.post(`/engineering/tickets/${ticketId}/timeline`, event);
  },

  addRecommendation(ticketId, recommendation) {
    return ApiService.post(`/engineering/tickets/${ticketId}/recommendations`, recommendation);
  },

  // Bulk Operations
  bulkUpdateStatus(ticketIds, status) {
    return ApiService.post('/engineering/tickets/bulk/status', { 
      ticket_ids: ticketIds, 
      status 
    });
  },

  bulkAssign(ticketIds, ownerId) {
    return ApiService.post('/engineering/tickets/bulk/assign', { 
      ticket_ids: ticketIds, 
      owner_id: ownerId 
    });
  },

  // Export Functions
  exportTickets(params = {}) {
    return ApiService.get('/engineering/tickets/export', params);
  },

  exportDashboard(params = {}) {
    return ApiService.get('/engineering/tickets/export/dashboard', params);
  },

  // === CALENDAR ENDPOINTS ===
  
  // Get calendar events with date range parameters (REQUIRED by backend)
  getCalendarEvents(startDate, endDate, engineerId = 'all', eventType = null, includeAiTasks = true) {
    const params = new URLSearchParams();
    
    // CRITICAL: Always send date range parameters
    if (startDate) {
      params.append('start_date', startDate);
    }
    if (endDate) {
      params.append('end_date', endDate);
    }
    if (engineerId && engineerId !== 'all') {
      params.append('engineer_id', engineerId);
    }
    if (eventType) {
      params.append('event_type', eventType);
    }
    // NEW: Include AI-generated tasks by default
    if (includeAiTasks) {
      params.append('include_ai_tasks', 'true');
    }
    
    return ApiService.get(`/engineering/calendar?${params.toString()}`);
  },

  // Create a new calendar event
  createCalendarEvent(eventData) {
    return ApiService.post('/engineering/calendar/events', eventData);
  },

  // Update an existing calendar event
  updateCalendarEvent(eventId, eventData) {
    return ApiService.put(`/engineering/calendar/events/${eventId}`, eventData);
  },

  // Delete a calendar event
  deleteCalendarEvent(eventId) {
    return ApiService.delete(`/engineering/calendar/events/${eventId}`);
  },

  // Get list of engineers for calendar assignment
  getCalendarEngineers() {
    return ApiService.get('/engineering/calendar/engineers');
  },

  // Get list of tickets for calendar linking
  getCalendarTickets() {
    return ApiService.get('/engineering/calendar/tickets');
  },

  // Get calendar statistics and analytics
  getCalendarStatistics(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    return ApiService.get(`/engineering/calendar/statistics?${params.toString()}`);
  },

  // === QUEUE ANALYTICS ENDPOINTS ===
  
  // Current queue snapshot with health metrics
  getQueueCurrent(params = {}) {
    return ApiService.get('/engineering/queue/current', params);
  },

  // Queue health trends over time
  getQueueHealth(params = { days: 7 }) {
    return ApiService.get('/engineering/queue/health', params);
  },

  // Detailed queue analytics and breakdowns
  getQueueAnalytics(params = {}) {
    return ApiService.get('/engineering/queue/analytics', params);
  },

  // Historical queue snapshots with pagination
  getQueueHistory(params = { page: 1, per_page: 20 }) {
    return ApiService.get('/engineering/queue/history', params);
  },

  // Queue trends over specified time period
  getQueueTrends(params = { period: '24h', limit: 100 }) {
    return ApiService.get('/engineering/queue/trends', params);
  },

  // Workload distribution analytics
  getQueueWorkload(params = {}) {
    return ApiService.get('/engineering/queue/workload', params);
  },

  // Performance metrics and throughput
  getQueuePerformance(params = { days: 30 }) {
    return ApiService.get('/engineering/queue/performance', params);
  },

  // === SYNC AND AI TRIGGERS ===
  
  // Trigger field synchronization between MySQL and PostgreSQL
  triggerFieldSync() {
    return ApiService.post('/engineering/sync/trigger/field-sync');
  },

  // Trigger full AI analysis of all tickets
  triggerAIAnalysis() {
    return ApiService.post('/engineering/sync/trigger/ai-analysis');
  },

  // Get sync system status and health
  getSyncStatus() {
    return ApiService.get('/engineering/sync/status');
  },

  // Get sync operation history
  getSyncHistory(params = { limit: 10 }) {
    return ApiService.get('/engineering/sync/history', params);
  },

  // Get validation report
  getValidationReport() {
    return ApiService.get('/engineering/sync/validation');
  }
}; 