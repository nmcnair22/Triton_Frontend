function titleCase(value) {
  return String(value || '')
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
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

function parseDateTimeParts(value) {
  const match = String(value || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);

  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4] || 0),
    minute: Number(match[5] || 0),
    second: Number(match[6] || 0)
  };
}

function getZonedParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second)
  };
}

function zonedLocalToDate(dateTimeValue, timeZone) {
  const parts = parseDateTimeParts(dateTimeValue);

  if (!parts || !timeZone) {
    return null;
  }

  let guess = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const desired = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);

  for (let index = 0; index < 3; index += 1) {
    const zoned = getZonedParts(new Date(guess), timeZone);
    const current = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute, zoned.second);
    const diff = desired - current;

    if (diff === 0) {
      break;
    }

    guess += diff;
  }

  return new Date(guess);
}

function normalizeVisitStatus(value) {
  return String(value || '').trim().toLowerCase();
}

function getIneligibleStatusLabel(visit) {
  const status = normalizeVisitStatus(visit?.visit_status);
  const reasons = visit?.readiness?.reasons || [];

  if (reasons.includes('visit_completed') || status === 'completed') {
    return 'Visit Completed';
  }

  if (reasons.includes('visit_cancelled') || reasons.includes('visit_canceled') || status === 'cancelled' || status === 'canceled') {
    return 'Visit Cancelled';
  }

  if (status && status !== 'open') {
    return `Visit ${titleCase(status)}`;
  }

  return null;
}

function isPastVisitStart(visit, now = new Date()) {
  const requestedDateTime = visit?.appointment?.requested_datetime;
  const timeZone = visit?.location?.timezone;
  const startAt = zonedLocalToDate(requestedDateTime, timeZone);

  if (!startAt) {
    return false;
  }

  return startAt.getTime() < now.getTime();
}

const REASON_LABELS = {
  missing_tech: 'Missing technician',
  missing_tech_phone: 'Missing technician phone',
  invalid_phone: 'Invalid technician phone',
  missing_time: 'Missing start time',
  invalid_timezone: 'Invalid timezone',
  missing_tools: 'Missing tools',
  visit_past_due: 'Visit Past Due',
  visit_not_eligible: 'Not eligible for pre-visit call'
};

function isBackendPastDue(visit) {
  return Boolean(visit?.readiness?.is_past_due || visit?.appointment?.is_past_due);
}

export function formatReadinessReasons(visit) {
  const reasons = (visit?.readiness?.reasons || []).filter(
    (reason) => !['visit_completed', 'visit_cancelled', 'visit_canceled'].includes(reason)
  );

  return reasons.map((reason) => REASON_LABELS[reason] || titleCase(reason));
}

export function getVisitEligibility(visit, now = new Date()) {
  if (!visit) {
    return {
      label: 'Unknown',
      severity: 'secondary',
      detail: 'Unavailable',
      kind: 'unknown'
    };
  }

  if (visit?.readiness?.ready_to_push) {
    return {
      label: 'Ready',
      severity: 'success',
      detail: 'No blockers',
      kind: 'ready'
    };
  }

  const ineligibleLabel = getIneligibleStatusLabel(visit);

  if (ineligibleLabel) {
    return {
      label: ineligibleLabel,
      severity: 'secondary',
      detail: 'No longer eligible for a pre-visit call',
      kind: 'ineligible'
    };
  }

  if (isBackendPastDue(visit)) {
    return {
      label: 'Past Due',
      severity: 'warning',
      detail: 'Visit time has already passed in the site timezone',
      kind: 'past_due'
    };
  }

  if (isPastVisitStart(visit, now)) {
    return {
      label: 'Past Start Time',
      severity: 'warning',
      detail: 'Scheduled start time has passed',
      kind: 'past_start'
    };
  }

  const reasonLabels = formatReadinessReasons(visit);

  return {
    label: 'Blocked',
    severity: 'danger',
    detail: reasonLabels.join(', ') || 'Missing required info',
    kind: 'blocked'
  };
}
