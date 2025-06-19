import { ApiService } from './ApiService';

// Engineering-specific API services
export const EngineeringService = {
  // === COMPREHENSIVE DASHBOARD ENDPOINTS ===
  
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
  
  // Get calendar events with optional filters
  getCalendarEvents(params = {}) {
    return ApiService.get('/engineering/calendar', params);
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
  getCalendarStatistics() {
    return ApiService.get('/engineering/calendar/statistics');
  }
}; 