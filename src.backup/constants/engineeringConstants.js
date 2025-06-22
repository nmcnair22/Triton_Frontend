// Engineering module constants

// Health score thresholds
export const HEALTH_SCORE_THRESHOLDS = {
  EXCELLENT: 80,
  GOOD: 65,
  FAIR: 50,
  NEEDS_ATTENTION: 0
}

// Workload capacity thresholds
export const WORKLOAD_THRESHOLDS = {
  HIGH_LOAD: 20,
  MEDIUM_LOAD: 15,
  NORMAL_LOAD: 0
}

// Ticket age thresholds (days)
export const TICKET_AGE_THRESHOLDS = {
  CRITICAL: 365,
  HIGH_PRIORITY: 300,
  URGENT: 100,
  NORMAL: 30,
  RECENT: 7
}

// Chart color schemes
export const CHART_COLORS = {
  primary: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
  priority: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
  status: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
  aging: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
  workload: {
    high: '#ef4444',
    medium: '#f59e0b', 
    normal: '#10b981'
  }
}

// Performance metrics
export const PERFORMANCE_TARGETS = {
  RESOLUTION_TIME_HOURS: 24,
  OVERDUE_PERCENTAGE_MAX: 10,
  ESCALATION_PERCENTAGE_MAX: 5
}

// Avatar color palette
export const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
]

// Status mappings
export const SEVERITY_MAPPINGS = {
  risk: {
    high: 'danger',
    medium: 'warning', 
    low: 'success'
  },
  capacity: {
    overloaded: 'danger',
    'near capacity': 'warning',
    available: 'success',
    'high availability': 'info'
  },
  health: {
    excellent: 'success',
    good: 'info',
    fair: 'warning',
    'needs attention': 'danger'
  }
}