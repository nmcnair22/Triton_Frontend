import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { CallOperationsService } from '@/service/CallOperationsService';

function formatDateForApi(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function defaultSummary(date) {
  return {
    date,
    total_visits: 0,
    queue_in_scope: 0,
    out_of_scope: 0,
    ready: 0,
    pushable_with_warnings: 0,
    blocked: 0,
    ready_to_push: 0,
    not_ready: 0,
    upcoming: 0,
    past_due: 0,
    by_timing_state: {
      upcoming: 0,
      past_due: 0
    },
    by_data_quality: {
      ready: 0,
      pushable_with_warnings: 0,
      blocked: 0
    },
    by_queue_scope_reason: {},
    sent: 0,
    needs_update: 0,
    push_failed: 0,
    awaiting_call: 0,
    completed: 0,
    transferred: 0,
    failed: 0,
    sms_sent_count: 0,
    sms_sent: 0,
    completion_rate: 0,
    transfer_rate: 0,
    last_status_sync_at: null
  };
}

function normalizeActivityEvent(event) {
  if (!event) {
    return event;
  }

  return {
    ...event,
    user_name: event.user_name || event.user?.name || null
  };
}

function normalizeVisitRow(visit) {
  if (!visit) {
    return visit;
  }

  const appointment = visit.appointment || {};
  const readiness = visit.readiness || {};
  const sync = visit.sync || {};
  const call = visit.call || {};
  const tools = visit.tools || {};

  return {
    ...visit,
    queue_in_scope: typeof visit.queue_in_scope === 'boolean' ? visit.queue_in_scope : !visit.queue_scope_reason,
    queue_scope_reason: visit.queue_scope_reason ?? null,
    timing_state: visit.timing_state || (appointment.is_past_due || readiness.is_past_due ? 'past_due' : 'upcoming'),
    data_quality: visit.data_quality || readiness.grade || 'blocked',
    ready_to_push: Boolean(readiness.ready_to_push ?? visit.ready_to_push ?? false),
    job: visit.job ? { ...visit.job } : null,
    location: {
      ...visit.location
    },
    appointment: {
      ...appointment,
      local_time: appointment.local_time || appointment.visit_time_local || appointment.visit_time || null,
      visit_time_local: appointment.visit_time_local || appointment.local_time || appointment.visit_time || null,
      requested_datetime: appointment.requested_datetime || appointment.scheduled_at_local || null,
      scheduled_at_local: appointment.scheduled_at_local || appointment.requested_datetime || null,
      is_past_due: Boolean(appointment.is_past_due)
    },
    technician: {
      ...visit.technician
    },
    customer: {
      ...visit.customer
    },
    project: {
      ...visit.project
    },
    readiness: {
      ready_to_push: false,
      grade: visit.data_quality || readiness.grade || 'blocked',
      blockers: [],
      warnings: [],
      blocker_count: 0,
      warning_count: 0,
      reasons: [],
      is_past_due: false,
      ...readiness,
      grade: readiness.grade || visit.data_quality || 'blocked',
      blockers: Array.isArray(readiness.blockers)
        ? readiness.blockers
        : Array.isArray(readiness.reasons)
          ? readiness.reasons
          : [],
      warnings: Array.isArray(readiness.warnings) ? readiness.warnings : [],
      reasons: Array.isArray(readiness.reasons)
        ? readiness.reasons
        : Array.isArray(readiness.blockers)
          ? readiness.blockers
          : [],
      blocker_count: Number(
        readiness.blocker_count ??
          (Array.isArray(readiness.blockers)
            ? readiness.blockers.length
            : Array.isArray(readiness.reasons)
              ? readiness.reasons.length
              : 0)
      ),
      warning_count: Number(
        readiness.warning_count ?? (Array.isArray(readiness.warnings) ? readiness.warnings.length : 0)
      ),
      is_past_due: Boolean(readiness.is_past_due || appointment.is_past_due)
    },
    sync: {
      sync_status: 'unknown',
      needs_repush: false,
      drift_fields: [],
      push_count: 0,
      first_pushed_at: null,
      last_pushed_at: null,
      last_status_sync_at: null,
      last_error: null,
      ...sync
    },
    call: {
      call_status: 'unknown',
      call_date: null,
      last_outcome: null,
      sms_sent: null,
      call_transfer: null,
      has_tools_confirmed: null,
      retell_call_id: null,
      recording_url: null,
      recording_direct: null,
      transcript_url: null,
      ...call
    },
    tools: {
      resolved: null,
      override: null,
      source: 'none',
      ...tools
    },
    vendor_debug: visit.vendor_debug || null,
    payload_preview: visit.payload_preview || null,
    allowed_actions: visit.allowed_actions || []
  };
}

function mergeVisitPayload(existingVisit, nextVisit) {
  if (!existingVisit) {
    return nextVisit;
  }

  if (!nextVisit) {
    return existingVisit;
  }

  return {
    ...existingVisit,
    ...nextVisit,
    job: nextVisit.job ?? existingVisit.job ?? null,
    location: {
      ...(existingVisit.location || {}),
      ...(nextVisit.location || {})
    },
    appointment: {
      ...(existingVisit.appointment || {}),
      ...(nextVisit.appointment || {})
    },
    technician: {
      ...(existingVisit.technician || {}),
      ...(nextVisit.technician || {})
    },
    customer: {
      ...(existingVisit.customer || {}),
      ...(nextVisit.customer || {})
    },
    project: {
      ...(existingVisit.project || {}),
      ...(nextVisit.project || {})
    },
    readiness: {
      ...(existingVisit.readiness || {}),
      ...(nextVisit.readiness || {})
    },
    sync: {
      ...(existingVisit.sync || {}),
      ...(nextVisit.sync || {})
    },
    call: {
      ...(existingVisit.call || {}),
      ...(nextVisit.call || {})
    },
    tools: {
      ...(existingVisit.tools || {}),
      ...(nextVisit.tools || {})
    },
    vendor_debug: nextVisit.vendor_debug ?? existingVisit.vendor_debug ?? null,
    payload_preview: nextVisit.payload_preview ?? existingVisit.payload_preview ?? null,
    allowed_actions: Array.isArray(nextVisit.allowed_actions)
      ? nextVisit.allowed_actions
      : existingVisit.allowed_actions || []
  };
}

function normalizeVisitDetail(detail) {
  if (!detail?.visit) {
    return detail;
  }

  const normalizedVisit = normalizeVisitRow({
    ...detail.visit,
    readiness: detail.visit.readiness || detail.readiness,
    sync: detail.visit.sync || detail.sync,
    call: detail.visit.call || detail.call,
    tools: detail.visit.tools || detail.tools,
    allowed_actions: detail.visit.allowed_actions || detail.allowed_actions
  });

  return {
    ...detail,
    vendor_debug: detail.vendor_debug || normalizedVisit.vendor_debug || null,
    payload_preview: detail.payload_preview || normalizedVisit.payload_preview || null,
    readiness: detail.readiness || normalizedVisit.readiness,
    sync: detail.sync || normalizedVisit.sync,
    call: detail.call || normalizedVisit.call,
    tools: detail.tools || normalizedVisit.tools,
    allowed_actions: detail.allowed_actions || normalizedVisit.allowed_actions,
    visit: normalizedVisit
  };
}

function normalizeSummaryPayload(summary, date) {
  const sent = Number(summary?.sent ?? 0);
  const completed = Number(summary?.completed ?? 0);
  const transferred = Number(summary?.transferred ?? 0);
  const failed = Number(summary?.failed ?? 0);
  const terminalTotal = completed + transferred + failed;
  const ready = Number(summary?.ready ?? 0);
  const warnings = Number(summary?.pushable_with_warnings ?? 0);
  const blocked = Number(summary?.blocked ?? summary?.not_ready ?? 0);
  const queueInScope = Number(summary?.queue_in_scope ?? ready + warnings + blocked);
  const pastDue = Number(summary?.past_due ?? 0);

  return {
    ...defaultSummary(date),
    ...(summary || {}),
    queue_in_scope: queueInScope,
    out_of_scope: Number(summary?.out_of_scope ?? Math.max(Number(summary?.total_visits ?? 0) - queueInScope, 0)),
    ready,
    pushable_with_warnings: warnings,
    blocked,
    ready_to_push: Number(summary?.ready_to_push ?? ready + warnings),
    not_ready: Number(summary?.not_ready ?? blocked),
    upcoming: Number(summary?.upcoming ?? summary?.by_timing_state?.upcoming ?? 0),
    past_due: pastDue,
    by_timing_state: {
      upcoming: Number(summary?.by_timing_state?.upcoming ?? summary?.upcoming ?? 0),
      past_due: pastDue
    },
    by_data_quality: {
      ready,
      pushable_with_warnings: warnings,
      blocked
    },
    by_queue_scope_reason: summary?.by_queue_scope_reason || {},
    sms_sent_count: summary?.sms_sent_count ?? summary?.sms_sent ?? 0,
    sms_sent: summary?.sms_sent ?? summary?.sms_sent_count ?? 0,
    completion_rate: summary?.completion_rate ?? (terminalTotal > 0 ? completed / terminalTotal : sent > 0 ? completed / sent : 0),
    transfer_rate: summary?.transfer_rate ?? (terminalTotal > 0 ? transferred / terminalTotal : 0),
    last_status_sync_at: summary?.last_status_sync_at ?? null
  };
}

function normalizeMetaPayload(meta, fallbackPerPage) {
  const currentPage = Number(meta?.current_page ?? meta?.page ?? 1);
  const perPage = Number(meta?.per_page ?? fallbackPerPage ?? 25);
  const total = Number(meta?.total ?? 0);
  const lastPage = Number(meta?.last_page ?? (perPage > 0 ? Math.max(1, Math.ceil(total / perPage)) : 1));

  return {
    current_page: currentPage,
    per_page: perPage,
    total,
    last_page: lastPage
  };
}

export const useCallOperationsStore = defineStore('call-operations', () => {
  const today = new Date();

  const activeTab = ref('queue');
  const rows = ref([]);
  const meta = ref({
    current_page: 1,
    per_page: 25,
    total: 0,
    last_page: 1
  });
  const summary = ref(defaultSummary(formatDateForApi(today)));
  const selectedRows = ref([]);
  const selectedVisitId = ref(null);
  const selectedVisitDetail = ref(null);
  const selectedVisitActivity = ref([]);
  const error = ref(null);

  const loadingRows = ref(false);
  const loadingSummary = ref(false);
  const loadingDetail = ref(false);
  const loadingActivity = ref(false);
  const actionLoading = ref(false);

  const filters = ref({
    date: today,
    preset: 'queue',
    customerId: null,
    projectId: null,
    syncStatuses: [],
    callStatuses: [],
    queueInScope: null,
    timingStates: [],
    dataQualities: [],
    readyToPush: null,
    search: ''
  });

  const tableState = ref({
    page: 1,
    perPage: 25,
    sort: 'appointment.service_date',
    direction: 'asc'
  });

  const selectedVisit = computed(() => {
    if (selectedVisitDetail.value?.visit) {
      return selectedVisitDetail.value.visit;
    }

    return rows.value.find((row) => String(row.visit_id) === String(selectedVisitId.value)) || null;
  });

  const customerOptions = computed(() => {
    const lookup = new Map();

    rows.value.forEach((row) => {
      if (row.customer?.id && !lookup.has(row.customer.id)) {
        lookup.set(row.customer.id, row.customer);
      }
    });

    return Array.from(lookup.values()).sort((left, right) => left.name.localeCompare(right.name));
  });

  const projectOptions = computed(() => {
    const lookup = new Map();

    rows.value.forEach((row) => {
      if (row.project?.id && !lookup.has(row.project.id)) {
        lookup.set(row.project.id, row.project);
      }
    });

    return Array.from(lookup.values()).sort((left, right) => left.name.localeCompare(right.name));
  });

  const hasSelections = computed(() => selectedRows.value.length > 0);
  const selectedVisitCount = computed(() => selectedRows.value.length);
  const selectedReadyCount = computed(() => selectedRows.value.filter((row) => row.ready_to_push).length);

  function buildQuery() {
    const query = {
      date: formatDateForApi(filters.value.date),
      page: tableState.value.page,
      per_page: tableState.value.perPage,
      sort: tableState.value.sort,
      direction: tableState.value.direction
    };

    if (filters.value.preset) {
      query.preset = filters.value.preset;
    }

    if (filters.value.customerId) {
      query.customer_id = filters.value.customerId;
    }

    if (filters.value.projectId) {
      query.project_id = filters.value.projectId;
    }

    if (filters.value.search) {
      query.search = filters.value.search;
    }

    if (filters.value.syncStatuses.length > 0) {
      query.sync_status = filters.value.syncStatuses;
    }

    if (filters.value.callStatuses.length > 0) {
      query.call_status = filters.value.callStatuses;
    }

    if (filters.value.queueInScope !== null) {
      query.queue_in_scope = filters.value.queueInScope;
    }

    if (filters.value.timingStates.length > 0) {
      query.timing_state = filters.value.timingStates;
    }

    if (filters.value.dataQualities.length > 0) {
      query.data_quality = filters.value.dataQualities;
    }

    if (filters.value.readyToPush !== null) {
      query.ready_to_push = filters.value.readyToPush;
    }

    return query;
  }

  function buildFilterContext() {
    const query = {};

    if (filters.value.customerId) {
      query.customer_id = filters.value.customerId;
    }

    if (filters.value.projectId) {
      query.project_id = filters.value.projectId;
    }

    if (filters.value.search) {
      query.search = filters.value.search;
    }

    if (filters.value.syncStatuses.length > 0) {
      query.sync_status = filters.value.syncStatuses;
    }

    if (filters.value.callStatuses.length > 0) {
      query.call_status = filters.value.callStatuses;
    }

    if (filters.value.queueInScope !== null) {
      query.queue_in_scope = filters.value.queueInScope;
    }

    if (filters.value.timingStates.length > 0) {
      query.timing_state = filters.value.timingStates;
    }

    if (filters.value.dataQualities.length > 0) {
      query.data_quality = filters.value.dataQualities;
    }

    if (filters.value.readyToPush !== null) {
      query.ready_to_push = filters.value.readyToPush;
    }

    return query;
  }

  function mergeUpdatedVisit(visit) {
    if (!visit) {
      return;
    }

    const visitId = visit.visit_id;
    const index = rows.value.findIndex((row) => String(row.visit_id) === String(visitId));
    const normalizedVisit = normalizeVisitRow(mergeVisitPayload(index !== -1 ? rows.value[index] : null, visit));

    if (index !== -1) {
      rows.value[index] = normalizedVisit;
    }

    if (selectedVisitDetail.value?.visit && String(selectedVisitDetail.value.visit.visit_id) === String(normalizedVisit.visit_id)) {
      const mergedDetailVisit = normalizeVisitRow(mergeVisitPayload(selectedVisitDetail.value.visit, visit));

      selectedVisitDetail.value = {
        ...selectedVisitDetail.value,
        payload_preview: mergedDetailVisit.payload_preview ?? selectedVisitDetail.value.payload_preview ?? null,
        readiness: mergedDetailVisit.readiness,
        sync: mergedDetailVisit.sync,
        call: mergedDetailVisit.call,
        tools: mergedDetailVisit.tools,
        allowed_actions: mergedDetailVisit.allowed_actions,
        visit: mergedDetailVisit
      };
    }
  }

  async function loadRows() {
    loadingRows.value = true;
    error.value = null;

    try {
      const response = await CallOperationsService.getVisits(buildQuery());
      rows.value = (response.data || []).map((visit) => normalizeVisitRow(visit));
      meta.value = normalizeMetaPayload(response.meta, tableState.value.perPage);
      return rows.value;
    } catch (loadError) {
      error.value = loadError.message || 'Failed to load dispatch call visits.';
      throw loadError;
    } finally {
      loadingRows.value = false;
    }
  }

  async function loadSummary() {
    loadingSummary.value = true;
    error.value = null;

    try {
      const response = await CallOperationsService.getSummary(buildQuery());
      summary.value = normalizeSummaryPayload(response.data, formatDateForApi(filters.value.date));
      return summary.value;
    } catch (loadError) {
      error.value = loadError.message || 'Failed to load summary metrics.';
      throw loadError;
    } finally {
      loadingSummary.value = false;
    }
  }

  async function refreshAll() {
    await Promise.all([loadRows(), loadSummary()]);

    if (selectedVisitId.value) {
      await Promise.all([loadVisitDetail(selectedVisitId.value), loadVisitActivity(selectedVisitId.value)]);
    }
  }

  async function loadVisitDetail(visitId, options = {}) {
    if (!visitId) {
      return null;
    }

    loadingDetail.value = true;
    error.value = null;
    selectedVisitId.value = visitId;

    try {
      const response = await CallOperationsService.getVisitDetail(visitId, options);
      const existingVisit =
        rows.value.find((row) => String(row.visit_id) === String(visitId)) ||
        selectedVisitDetail.value?.visit ||
        null;
      const normalizedDetail = normalizeVisitDetail(response.data);

      if (normalizedDetail?.visit && existingVisit) {
        const mergedVisit = normalizeVisitRow(mergeVisitPayload(existingVisit, normalizedDetail.visit));
        selectedVisitDetail.value = {
          ...normalizedDetail,
          vendor_debug: normalizedDetail.vendor_debug ?? mergedVisit.vendor_debug ?? null,
          payload_preview: normalizedDetail.payload_preview ?? mergedVisit.payload_preview ?? null,
          readiness: mergedVisit.readiness,
          sync: mergedVisit.sync,
          call: mergedVisit.call,
          tools: mergedVisit.tools,
          allowed_actions: mergedVisit.allowed_actions,
          visit: mergedVisit
        };
      } else {
        selectedVisitDetail.value = normalizedDetail;
      }

      if (selectedVisitDetail.value?.visit) {
        mergeUpdatedVisit(selectedVisitDetail.value.visit);
      }
      return selectedVisitDetail.value;
    } catch (loadError) {
      error.value = loadError.message || 'Failed to load visit details.';
      throw loadError;
    } finally {
      loadingDetail.value = false;
    }
  }

  async function loadVisitActivity(visitId = selectedVisitId.value) {
    if (!visitId) {
      selectedVisitActivity.value = [];
      return [];
    }

    loadingActivity.value = true;
    error.value = null;
    selectedVisitId.value = visitId;

    try {
      const response = await CallOperationsService.getVisitActivity(visitId);
      selectedVisitActivity.value = (response.data || []).map((event) => normalizeActivityEvent(event));
      return selectedVisitActivity.value;
    } catch (loadError) {
      error.value = loadError.message || 'Failed to load selected visit activity.';
      throw loadError;
    } finally {
      loadingActivity.value = false;
    }
  }

  async function setActiveTab(nextTab) {
    activeTab.value = nextTab;
    selectedRows.value = [];
    tableState.value.page = 1;
  }

  function updateFilters(partialFilters) {
    filters.value = {
      ...filters.value,
      ...partialFilters
    };
    tableState.value.page = 1;
  }

  function clearFilters() {
    filters.value = {
      date: new Date(),
      preset: 'queue',
      customerId: null,
      projectId: null,
      syncStatuses: [],
      callStatuses: [],
      queueInScope: null,
      timingStates: [],
      dataQualities: [],
      readyToPush: null,
      search: ''
    };
    tableState.value.page = 1;
    tableState.value.sort = 'appointment.service_date';
    tableState.value.direction = 'asc';
    selectedRows.value = [];
  }

  function clearQueryFilters() {
    filters.value = {
      ...filters.value,
      customerId: null,
      projectId: null,
      syncStatuses: [],
      callStatuses: [],
      queueInScope: null,
      timingStates: [],
      dataQualities: [],
      readyToPush: null,
      search: ''
    };
    tableState.value.page = 1;
    selectedRows.value = [];
  }

  function updatePagination({ page, perPage }) {
    tableState.value.page = page;
    tableState.value.perPage = perPage;
  }

  function updateSorting({ sort, direction }) {
    tableState.value.sort = sort;
    tableState.value.direction = direction;
    tableState.value.page = 1;
  }

  async function saveToolsOverride(toolsRequiredOverride) {
    if (!selectedVisitId.value) {
      return null;
    }

    actionLoading.value = true;
    error.value = null;

    try {
      const response = await CallOperationsService.updateTools(selectedVisitId.value, toolsRequiredOverride);
      if (response.data?.visit) {
        mergeUpdatedVisit(response.data.visit);
      }
      await Promise.all([loadRows(), loadSummary(), loadVisitDetail(selectedVisitId.value), loadVisitActivity(selectedVisitId.value)]);
      return response;
    } catch (actionError) {
      error.value = actionError.message || 'Failed to update tools override.';
      throw actionError;
    } finally {
      actionLoading.value = false;
    }
  }

  async function sendVisit(visitId, force = false) {
    actionLoading.value = true;
    error.value = null;

    try {
      const response = await CallOperationsService.sendVisit(visitId, force);
      if (response.data?.visit) {
        mergeUpdatedVisit(response.data.visit);
      }
      await Promise.all([loadRows(), loadSummary()]);

      if (String(selectedVisitId.value) === String(visitId)) {
        await Promise.all([loadVisitDetail(visitId), loadVisitActivity(visitId)]);
      }

      return response;
    } catch (actionError) {
      error.value = actionError.message || 'Failed to send the selected visit.';
      throw actionError;
    } finally {
      actionLoading.value = false;
    }
  }

  async function sendSelected(force = false) {
    const visitIds = selectedRows.value
      .filter((row) => row.allowed_actions?.includes('send_update'))
      .map((row) => row.visit_id);

    if (visitIds.length === 0) {
      return {
        data: {
          accepted_count: 0,
          requested_count: 0
        },
        message: 'No selected visits are currently sendable.'
      };
    }

    actionLoading.value = true;
    error.value = null;

    try {
      const response = await CallOperationsService.sendBulk({
        visit_ids: visitIds,
        force
      });
      selectedRows.value = [];
      await Promise.all([loadRows(), loadSummary()]);

      if (selectedVisitId.value && visitIds.some((visitId) => String(visitId) === String(selectedVisitId.value))) {
        await Promise.all([loadVisitDetail(selectedVisitId.value), loadVisitActivity(selectedVisitId.value)]);
      }

      return response;
    } catch (actionError) {
      error.value = actionError.message || 'Failed to send the selected visits.';
      throw actionError;
    } finally {
      actionLoading.value = false;
    }
  }

  async function sendAllReady(force = false) {
    actionLoading.value = true;
    error.value = null;

    try {
      const response = await CallOperationsService.sendBulk({
        date: formatDateForApi(filters.value.date),
        preset: filters.value.preset || undefined,
        filters: buildFilterContext(),
        mode: 'all_ready',
        force
      });
      selectedRows.value = [];
      await Promise.all([loadRows(), loadSummary()]);

      if (selectedVisitId.value) {
        await Promise.all([loadVisitDetail(selectedVisitId.value), loadVisitActivity(selectedVisitId.value)]);
      }

      return response;
    } catch (actionError) {
      error.value = actionError.message || 'Failed to send all ready visits.';
      throw actionError;
    } finally {
      actionLoading.value = false;
    }
  }

  async function refreshStatuses(payload = null) {
    actionLoading.value = true;
    error.value = null;

    try {
      const response = await CallOperationsService.refreshStatuses(
        payload || {
          date: formatDateForApi(filters.value.date),
          mode: 'active_for_day'
        }
      );
      await Promise.all([loadRows(), loadSummary()]);

      if (selectedVisitId.value) {
        await Promise.all([loadVisitDetail(selectedVisitId.value), loadVisitActivity(selectedVisitId.value)]);
      }

      return response;
    } catch (actionError) {
      error.value = actionError.message || 'Failed to refresh call statuses.';
      throw actionError;
    } finally {
      actionLoading.value = false;
    }
  }

  return {
    activeTab,
    rows,
    meta,
    summary,
    selectedRows,
    selectedVisitId,
    selectedVisitDetail,
    selectedVisitActivity,
    selectedVisit,
    customerOptions,
    projectOptions,
    error,
    loadingRows,
    loadingSummary,
    loadingDetail,
    loadingActivity,
    actionLoading,
    filters,
    tableState,
    hasSelections,
    selectedVisitCount,
    selectedReadyCount,
    loadRows,
    loadSummary,
    refreshAll,
    loadVisitDetail,
    loadVisitActivity,
    setActiveTab,
    updateFilters,
    clearFilters,
    clearQueryFilters,
    updatePagination,
    updateSorting,
    saveToolsOverride,
    sendVisit,
    sendSelected,
    sendAllReady,
    refreshStatuses
  };
});
