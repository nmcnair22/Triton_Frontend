function titleCase(value) {
  return String(value || '')
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function normalizeReasonList(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return value ? [value] : [];
}

export function formatToolsText(value) {
  if (!value) {
    return '';
  }

  const cleaned = String(value)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return '';
  }

  return cleaned;
}

const SYNC_STATUS_LABELS = {
  not_ready: 'Not Ready',
  ready: 'Ready',
  sent: 'Sent',
  needs_update: 'Needs Update',
  push_failed: 'Push Failed'
};

const CALL_STATUS_LABELS = {
  awaiting_call: 'Awaiting Call',
  completed: 'Completed',
  transferred: 'Transferred',
  failed: 'Failed',
  unknown: 'Unknown'
};

const TIMING_STATE_LABELS = {
  upcoming: 'Upcoming',
  past_due: 'Past Due'
};

const DATA_QUALITY_LABELS = {
  ready: 'Ready',
  pushable_with_warnings: 'Warnings',
  blocked: 'Blocked'
};

const QUEUE_SCOPE_REASON_LABELS = {
  completed: 'Completed',
  cancelled: 'Cancelled',
  outcome_complete: 'Outcome Complete',
  outcome_incomplete: 'Outcome Incomplete',
  outcome_failed: 'Outcome Failed',
  outcome_cancelled: 'Outcome Cancelled',
  outcome_set: 'Outcome Set',
  on_hold: 'On Hold',
  draft: 'Draft'
};

const READINESS_REASON_LABELS = {
  visit_not_open: 'Visit not open',
  visit_cancelled: 'Visit cancelled',
  visit_completed: 'Visit completed',
  visit_on_hold: 'Visit on hold',
  visit_outcome_set: 'Visit outcome set',
  visit_template: 'Visit template',
  missing_tech: 'Missing technician',
  missing_tech_name: 'Missing technician name',
  missing_tech_phone: 'Missing technician phone',
  invalid_phone: 'Invalid technician phone',
  missing_service_date: 'Missing service date',
  missing_requested_time: 'Missing requested time',
  missing_time: 'Missing requested time',
  missing_timezone: 'Missing timezone',
  invalid_timezone: 'Invalid timezone',
  missing_location_context: 'Missing location context',
  draft_visit: 'Draft visit',
  missing_location_name: 'Missing location name',
  missing_address: 'Missing address',
  missing_tools: 'Missing tools'
};

const EVENT_TYPE_LABELS = {
  send_requested: 'Send Requested',
  send_succeeded: 'Send Succeeded',
  send_failed: 'Send Failed',
  status_sync_requested: 'Status Sync Requested',
  status_sync_updated: 'Status Sync Updated',
  status_sync_no_change: 'Status Sync No Change',
  status_sync_failed: 'Status Sync Failed',
  tools_override_updated: 'Tools Override Updated',
  drift_detected: 'Drift Detected',
  drift_cleared: 'Drift Cleared',
  test_call_created: 'Test Call Created',
  test_call_updated: 'Test Call Updated'
};

function formatWithMap(value, labelMap) {
  if (!value) {
    return 'Unknown';
  }

  return labelMap[value] || titleCase(value);
}

export function formatSyncStatus(value) {
  return formatWithMap(value, SYNC_STATUS_LABELS);
}

export function formatCallStatus(value) {
  return formatWithMap(value, CALL_STATUS_LABELS);
}

export function formatTimingState(value) {
  return formatWithMap(value, TIMING_STATE_LABELS);
}

export function formatDataQuality(value) {
  return formatWithMap(value, DATA_QUALITY_LABELS);
}

export function formatQueueScopeReason(value) {
  return formatWithMap(value, QUEUE_SCOPE_REASON_LABELS);
}

export function formatActivityEventType(value) {
  return formatWithMap(value, EVENT_TYPE_LABELS);
}

export function formatReadinessReason(value) {
  return formatWithMap(value, READINESS_REASON_LABELS);
}

export function formatReadinessBlockers(value) {
  const blockers = Array.isArray(value) ? value : value?.readiness?.blockers || value?.readiness?.reasons || [];
  return normalizeReasonList(blockers).map((reason) => formatReadinessReason(reason));
}

export function formatReadinessWarnings(value) {
  const warnings = Array.isArray(value) ? value : value?.readiness?.warnings || [];
  return normalizeReasonList(warnings).map((reason) => formatReadinessReason(reason));
}

export function formatReadinessReasons(value) {
  return formatReadinessBlockers(value);
}

export function syncStatusSeverity(value) {
  const severityMap = {
    not_ready: 'danger',
    ready: 'success',
    sent: 'info',
    needs_update: 'warning',
    push_failed: 'danger'
  };

  return severityMap[value] || 'secondary';
}

export function callStatusSeverity(value) {
  const severityMap = {
    awaiting_call: 'warning',
    completed: 'success',
    transferred: 'info',
    failed: 'danger',
    unknown: 'secondary'
  };

  return severityMap[value] || 'secondary';
}

export function timingStateSeverity(value) {
  const severityMap = {
    upcoming: 'info',
    past_due: 'warn'
  };

  return severityMap[value] || 'secondary';
}

export function dataQualitySeverity(value) {
  const severityMap = {
    ready: 'success',
    pushable_with_warnings: 'warn',
    blocked: 'danger'
  };

  return severityMap[value] || 'secondary';
}

export function queueScopeSeverity(queueInScope) {
  return queueInScope === false ? 'secondary' : 'contrast';
}

export function formatStatus(value) {
  return titleCase(value || 'unknown');
}
