import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { CallOperationsService } from '@/service/CallOperationsService';

function defaultMeta() {
  return {
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1
  };
}

function normalizeMetaPayload(meta, fallbackPerPage) {
  const currentPage = Number(meta?.current_page ?? meta?.page ?? 1);
  const perPage = Number(meta?.per_page ?? fallbackPerPage ?? 10);
  const total = Number(meta?.total ?? 0);
  const lastPage = Number(meta?.last_page ?? (perPage > 0 ? Math.max(1, Math.ceil(total / perPage)) : 1));

  return {
    current_page: currentPage,
    per_page: perPage,
    total,
    last_page: lastPage
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

function normalizeTestCall(call) {
  if (!call) {
    return call;
  }

  const readiness = call.readiness || {};
  const blockers = Array.isArray(readiness.blockers)
    ? readiness.blockers
    : Array.isArray(readiness.reasons)
      ? readiness.reasons
      : [];
  const warnings = Array.isArray(readiness.warnings) ? readiness.warnings : [];

  return {
    ...call,
    visit_name: call.visit_name || call.label || 'Manual Test Call',
    queue_in_scope: typeof call.queue_in_scope === 'boolean' ? call.queue_in_scope : true,
    queue_scope_reason: call.queue_scope_reason ?? null,
    timing_state: call.timing_state || (call.appointment?.is_past_due || readiness.is_past_due ? 'past_due' : 'upcoming'),
    data_quality: call.data_quality || readiness.grade || (blockers.length > 0 ? 'blocked' : warnings.length > 0 ? 'pushable_with_warnings' : 'ready'),
    ready_to_push: Boolean(readiness.ready_to_push ?? call.ready_to_push ?? false),
    technician: {
      name: call.technician?.name || null,
      phone: call.technician?.phone || null,
      email: call.technician?.email || null,
      company: call.technician?.company || null,
      source: call.technician?.source || null
    },
    appointment: {
      visit_date: call.appointment?.visit_date || null,
      service_date: call.appointment?.visit_date || null,
      visit_time: call.appointment?.visit_time || null,
      local_time: call.appointment?.visit_time || null,
      timezone: call.appointment?.timezone || null,
      scheduled_at_local: call.appointment?.scheduled_at_local || null,
      is_past_due: Boolean(call.appointment?.is_past_due || readiness.is_past_due)
    },
    location: {
      name: call.location?.name || null,
      address: call.location?.address || null,
      timezone: call.appointment?.timezone || null
    },
    tools: call.tools || {
      resolved: null,
      override: null,
      source: 'missing'
    },
    readiness: {
      ready_to_push: false,
      grade: call.data_quality || 'blocked',
      blockers: [],
      warnings: [],
      blocker_count: 0,
      warning_count: 0,
      reasons: [],
      is_past_due: false,
      ...readiness,
      grade: readiness.grade || call.data_quality || (blockers.length > 0 ? 'blocked' : warnings.length > 0 ? 'pushable_with_warnings' : 'ready'),
      blockers,
      warnings,
      blocker_count: Number(readiness.blocker_count ?? blockers.length),
      warning_count: Number(readiness.warning_count ?? warnings.length),
      reasons: Array.isArray(readiness.reasons) ? readiness.reasons : blockers,
      is_past_due: Boolean(readiness.is_past_due || call.appointment?.is_past_due)
    },
    sync: call.sync || {
      sync_status: 'not_ready',
      needs_repush: false,
      drift_fields: [],
      push_count: 0,
      first_pushed_at: null,
      last_pushed_at: null,
      last_status_sync_at: null,
      last_error: null
    },
    call: call.call || {
      call_status: 'unknown',
      call_date: null,
      last_outcome: null,
      sms_sent: null,
      call_transfer: null,
      has_tools_confirmed: null,
      retell_call_id: null,
      recording_url: null,
      recording_direct: null,
      transcript_url: null
    },
    allowed_actions: call.allowed_actions || [],
    vendor_debug: call.vendor_debug || null
  };
}

export const useCallOperationsTestStore = defineStore('call-operations-test', () => {
  const rows = ref([]);
  const meta = ref(defaultMeta());
  const selectedRows = ref([]);
  const selectedTestCallId = ref(null);
  const selectedTestCallDetail = ref(null);
  const selectedTestCallActivity = ref([]);
  const error = ref(null);

  const loadingRows = ref(false);
  const loadingDetail = ref(false);
  const loadingActivity = ref(false);
  const actionLoading = ref(false);

  const filters = ref({
    search: '',
    syncStatuses: [],
    callStatuses: [],
    queueInScope: null,
    timingStates: [],
    dataQualities: [],
    readyToPush: null
  });

  const tableState = ref({
    page: 1,
    perPage: 10
  });

  const selectedTestCall = computed(() => {
    if (selectedTestCallDetail.value) {
      return selectedTestCallDetail.value;
    }

    return rows.value.find((row) => String(row.id) === String(selectedTestCallId.value)) || null;
  });

  const hasSelections = computed(() => selectedRows.value.length > 0);
  const selectedCount = computed(() => selectedRows.value.length);

  function buildQuery() {
    const query = {
      page: tableState.value.page,
      per_page: tableState.value.perPage
    };

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

  function mergeUpdatedCall(call) {
    if (!call) {
      return;
    }

    const normalizedCall = normalizeTestCall(call);
    const index = rows.value.findIndex((row) => String(row.id) === String(normalizedCall.id));

    if (index !== -1) {
      rows.value[index] = normalizedCall;
    } else {
      rows.value.unshift(normalizedCall);
    }

    if (selectedTestCallDetail.value && String(selectedTestCallDetail.value.id) === String(normalizedCall.id)) {
      selectedTestCallDetail.value = {
        ...selectedTestCallDetail.value,
        ...normalizedCall
      };
    }
  }

  async function loadRows() {
    loadingRows.value = true;
    error.value = null;

    try {
      const response = await CallOperationsService.getTestCalls(buildQuery());
      rows.value = (response.data || []).map((call) => normalizeTestCall(call));
      meta.value = normalizeMetaPayload(response.meta, tableState.value.perPage);
      return rows.value;
    } catch (loadError) {
      error.value = loadError.message || 'Failed to load DPROMPT test calls.';
      throw loadError;
    } finally {
      loadingRows.value = false;
    }
  }

  async function loadDetail(testCallId, options = { include_vendor_debug: true }) {
    if (!testCallId) {
      return null;
    }

    loadingDetail.value = true;
    error.value = null;
    selectedTestCallId.value = testCallId;

    try {
      const response = await CallOperationsService.getTestCallDetail(testCallId, options);
      const existingCall =
        rows.value.find((row) => String(row.id) === String(testCallId)) ||
        selectedTestCallDetail.value ||
        null;
      const normalizedCall = normalizeTestCall(response.data);
      selectedTestCallDetail.value = existingCall
        ? normalizeTestCall({
            ...existingCall,
            ...normalizedCall,
            payload_preview: normalizedCall.payload_preview ?? existingCall.payload_preview ?? null,
            vendor_debug: normalizedCall.vendor_debug ?? existingCall.vendor_debug ?? null,
            allowed_actions: Array.isArray(normalizedCall.allowed_actions) && normalizedCall.allowed_actions.length > 0
              ? normalizedCall.allowed_actions
              : existingCall.allowed_actions || []
          })
        : normalizedCall;
      mergeUpdatedCall(selectedTestCallDetail.value);
      return selectedTestCallDetail.value;
    } catch (loadError) {
      error.value = loadError.message || 'Failed to load DPROMPT test call detail.';
      throw loadError;
    } finally {
      loadingDetail.value = false;
    }
  }

  async function loadActivity(testCallId = selectedTestCallId.value) {
    if (!testCallId) {
      selectedTestCallActivity.value = [];
      return [];
    }

    loadingActivity.value = true;
    error.value = null;
    selectedTestCallId.value = testCallId;

    try {
      const response = await CallOperationsService.getTestCallActivity(testCallId);
      selectedTestCallActivity.value = (response.data || []).map((event) => normalizeActivityEvent(event));
      return selectedTestCallActivity.value;
    } catch (loadError) {
      error.value = loadError.message || 'Failed to load DPROMPT test call activity.';
      throw loadError;
    } finally {
      loadingActivity.value = false;
    }
  }

  async function refreshAll() {
    await loadRows();

    if (selectedTestCallId.value) {
      await Promise.all([loadDetail(selectedTestCallId.value), loadActivity(selectedTestCallId.value)]);
    }
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
      search: '',
      syncStatuses: [],
      callStatuses: [],
      queueInScope: null,
      timingStates: [],
      dataQualities: [],
      readyToPush: null
    };
    tableState.value.page = 1;
    selectedRows.value = [];
  }

  function updatePagination({ page, perPage }) {
    tableState.value.page = page;
    tableState.value.perPage = perPage;
  }

  async function createTestCall(payload) {
    actionLoading.value = true;
    error.value = null;

    try {
      const response = await CallOperationsService.createTestCall(payload);
      const nextCall = normalizeTestCall(response.sendResult?.data || response.data);

      if (nextCall?.id) {
        selectedTestCallId.value = nextCall.id;
      }

      mergeUpdatedCall(nextCall);
      await loadRows();

      if (nextCall?.id) {
        await Promise.all([loadDetail(nextCall.id), loadActivity(nextCall.id)]);
      }

      return response;
    } catch (actionError) {
      error.value = actionError.message || 'Failed to create DPROMPT test call.';
      throw actionError;
    } finally {
      actionLoading.value = false;
    }
  }

  async function updateTestCall(testCallId, payload) {
    actionLoading.value = true;
    error.value = null;

    try {
      const response = await CallOperationsService.updateTestCall(testCallId, payload);
      const nextCall = normalizeTestCall(response.sendResult?.data || response.data);
      mergeUpdatedCall(nextCall);
      await loadRows();

      if (nextCall?.id) {
        await Promise.all([loadDetail(nextCall.id), loadActivity(nextCall.id)]);
      }

      return response;
    } catch (actionError) {
      error.value = actionError.message || 'Failed to update DPROMPT test call.';
      throw actionError;
    } finally {
      actionLoading.value = false;
    }
  }

  async function sendTestCall(testCallId, force = false) {
    actionLoading.value = true;
    error.value = null;

    try {
      const response = await CallOperationsService.sendTestCall(testCallId, force);
      mergeUpdatedCall(response.data);
      await loadRows();

      if (String(selectedTestCallId.value) === String(testCallId)) {
        await Promise.all([loadDetail(testCallId), loadActivity(testCallId)]);
      }

      return response;
    } catch (actionError) {
      error.value = actionError.message || 'Failed to send DPROMPT test call.';
      throw actionError;
    } finally {
      actionLoading.value = false;
    }
  }

  async function refreshStatuses(testCallIds = null) {
    actionLoading.value = true;
    error.value = null;

    try {
      const payload = Array.isArray(testCallIds) && testCallIds.length > 0 ? { test_call_ids: testCallIds } : {};
      const response = await CallOperationsService.refreshTestStatuses(payload);
      await loadRows();

      if (selectedTestCallId.value) {
        await Promise.all([loadDetail(selectedTestCallId.value), loadActivity(selectedTestCallId.value)]);
      }

      return response;
    } catch (actionError) {
      error.value = actionError.message || 'Failed to refresh DPROMPT test statuses.';
      throw actionError;
    } finally {
      actionLoading.value = false;
    }
  }

  async function deleteTestCall(testCallId) {
    actionLoading.value = true;
    error.value = null;

    try {
      const response = await CallOperationsService.deleteTestCall(testCallId);

      rows.value = rows.value.filter((row) => String(row.id) !== String(testCallId));
      selectedRows.value = selectedRows.value.filter((row) => String(row.id) !== String(testCallId));

      if (String(selectedTestCallId.value) === String(testCallId)) {
        selectedTestCallId.value = null;
        selectedTestCallDetail.value = null;
        selectedTestCallActivity.value = [];
      }

      await loadRows();
      return response;
    } catch (actionError) {
      error.value = actionError.message || 'Failed to delete DPROMPT test call.';
      throw actionError;
    } finally {
      actionLoading.value = false;
    }
  }

  return {
    rows,
    meta,
    selectedRows,
    selectedTestCallId,
    selectedTestCallDetail,
    selectedTestCallActivity,
    selectedTestCall,
    error,
    loadingRows,
    loadingDetail,
    loadingActivity,
    actionLoading,
    filters,
    tableState,
    hasSelections,
    selectedCount,
    loadRows,
    loadDetail,
    loadActivity,
    refreshAll,
    updateFilters,
    clearFilters,
    updatePagination,
    createTestCall,
    updateTestCall,
    sendTestCall,
    refreshStatuses,
    deleteTestCall
  };
});
