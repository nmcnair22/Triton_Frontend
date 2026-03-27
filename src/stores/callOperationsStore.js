import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { CallOperationsService } from '@/service/CallOperationsService';

function formatDateForApi(value) {
  return new Date(value).toISOString().split('T')[0];
}

function defaultSummary(date) {
  return {
    date,
    total_visits: 0,
    ready_to_push: 0,
    not_ready: 0,
    past_due: 0,
    sent: 0,
    needs_update: 0,
    push_failed: 0,
    awaiting_call: 0,
    completed: 0,
    transferred: 0,
    failed: 0,
    sms_sent: 0,
    completion_rate: 0,
    transfer_rate: 0
  };
}

function normalizeVisitRow(visit) {
  if (!visit) {
    return visit;
  }

  return {
    ...visit,
    location: {
      ...visit.location
    },
    appointment: {
      ...visit.appointment,
      local_time: visit.appointment?.local_time || visit.appointment?.visit_time_local || null,
      is_past_due: Boolean(visit.appointment?.is_past_due),
      scheduled_at_local: visit.appointment?.scheduled_at_local || null
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
      reasons: [],
      is_past_due: false,
      ...(visit.readiness || {}),
      is_past_due: Boolean(visit.readiness?.is_past_due || visit.appointment?.is_past_due)
    },
    sync: visit.sync || {
      sync_status: 'unknown',
      needs_repush: false,
      drift_fields: [],
      push_count: 0,
      first_pushed_at: null,
      last_pushed_at: null,
      last_status_sync_at: null,
      last_error: null
    },
    call: visit.call || {
      call_status: 'unknown',
      last_outcome: null,
      sms_sent: null,
      call_transfer: null,
      has_tools_confirmed: null,
      retell_call_id: null,
      recording_url: null,
      recording_direct: null,
      transcript_url: null
    },
    tools: visit.tools || {
      resolved: null,
      override: null,
      source: 'none'
    },
    allowed_actions: visit.allowed_actions || []
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
    visit: normalizedVisit
  };
}

function normalizeSummaryPayload(summary, date) {
  return {
    ...defaultSummary(date),
    ...(summary || {}),
    ready_to_push: summary?.ready_to_push ?? summary?.ready ?? 0,
    past_due: summary?.past_due ?? 0,
    sms_sent: summary?.sms_sent ?? summary?.sms_sent_count ?? 0
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
    customerId: null,
    projectId: null,
    syncStatuses: [],
    callStatuses: [],
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
  const selectedReadyCount = computed(() => selectedRows.value.filter((row) => row.readiness?.ready_to_push).length);

  function buildQuery() {
    const query = {
      date: formatDateForApi(filters.value.date),
      page: tableState.value.page,
      per_page: tableState.value.perPage,
      sort: tableState.value.sort,
      direction: tableState.value.direction
    };

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
    } else if (activeTab.value === 'queue') {
      query.call_status = ['awaiting_call', 'unknown'];
    } else if (activeTab.value === 'results') {
      query.call_status = CallOperationsService.TERMINAL_CALL_STATUSES;
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

    const normalizedVisit = normalizeVisitRow(visit);

    const index = rows.value.findIndex((row) => String(row.visit_id) === String(normalizedVisit.visit_id));

    if (index !== -1) {
      rows.value[index] = normalizedVisit;
    }

    if (selectedVisitDetail.value?.visit && String(selectedVisitDetail.value.visit.visit_id) === String(normalizedVisit.visit_id)) {
      selectedVisitDetail.value = {
        ...selectedVisitDetail.value,
        visit: normalizedVisit
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
      await loadVisitDetail(selectedVisitId.value);

      if (activeTab.value === 'activity') {
        await loadVisitActivity(selectedVisitId.value);
      }
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
      selectedVisitDetail.value = normalizeVisitDetail(response.data);
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
      selectedVisitActivity.value = response.data || [];
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

    if (nextTab === 'activity') {
      if (selectedVisitId.value) {
        await Promise.all([loadVisitDetail(selectedVisitId.value), loadVisitActivity(selectedVisitId.value)]);
      }
      return;
    }

    if (nextTab === 'testing') {
      return;
    }

    await Promise.all([loadRows(), loadSummary()]);
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
      customerId: null,
      projectId: null,
      syncStatuses: [],
      callStatuses: [],
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
      await Promise.all([loadSummary(), loadVisitActivity(selectedVisitId.value)]);
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
    const visitIds = selectedRows.value.map((row) => row.visit_id);

    actionLoading.value = true;
    error.value = null;

    try {
      const response = await CallOperationsService.sendBulk({
        visit_ids: visitIds,
        force
      });
      selectedRows.value = [];
      await Promise.all([loadRows(), loadSummary()]);
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
        filters: buildQuery(),
        mode: 'all_ready',
        force
      });
      selectedRows.value = [];
      await Promise.all([loadRows(), loadSummary()]);
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
