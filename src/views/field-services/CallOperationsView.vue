<template>
  <div class="call-operations-view">
    <section class="call-operations-topbar">
      <div class="call-operations-topbar__copy">
        <div class="call-operations-topbar__eyebrow">Field Services</div>
        <h1 class="call-operations-topbar__title">Dispatch Call Operations</h1>
        <p class="call-operations-topbar__subtitle">
          {{
            activeTab === 'testing'
              ? 'Build sandbox DPROMPT calls, schedule them a few minutes out, and debug the full send/status loop without touching live visits.'
              : 'Stage visits for automated calling, send updates to DPROMPT, and track call outcomes from one dispatch queue.'
          }}
        </p>
      </div>

      <div v-if="activeTab !== 'testing'" class="call-operations-topbar__controls">
        <DatePicker
          v-model="filters.date"
          :minDate="today"
          showIcon
          class="w-full sm:w-56"
          @date-select="handleDateChange"
        />
        <Button label="Today" outlined @click="setRelativeDate(0)" />
        <Button label="Tomorrow" outlined @click="setRelativeDate(1)" />
        <Button
          icon="pi pi-refresh"
          label="Refresh Data"
          outlined
          :loading="loadingRows || loadingSummary"
          @click="refreshAll"
        />
        <Button
          icon="pi pi-sync"
          label="Refresh Status"
          :loading="actionLoading"
          @click="refreshStatuses"
        />
      </div>
      <div v-else class="call-operations-topbar__controls">
        <Tag value="Sandbox Testing Mode" severity="warning" />
      </div>
    </section>

    <CallOperationsSummaryStrip v-if="activeTab !== 'testing'" :summary="summary" :loading="loadingSummary" />

    <Message v-if="error && activeTab !== 'testing'" severity="error" :closable="false">
      {{ error }}
    </Message>

    <Card class="shadow-sm call-operations-grid-shell">
      <template #content>
        <Tabs :value="activeTab" @update:value="handleTabChange" class="call-operations-tabs">
          <div class="call-operations-grid-toolbar">
            <TabList>
              <Tab value="queue">Queue</Tab>
              <Tab value="results">Results</Tab>
              <Tab value="activity">Selected Visit Activity</Tab>
              <Tab value="testing">Testing</Tab>
            </TabList>

            <div class="call-operations-grid-toolbar__actions">
              <template v-if="activeTab !== 'testing'">
                <Tag :value="`${meta.total} rows`" severity="secondary" />
                <Chip :label="`Selected ${selectedVisitCount}`" icon="pi pi-check-square" />
                <Chip :label="`Ready ${selectedReadyCount}`" icon="pi pi-send" />
              </template>

              <template v-if="activeTab !== 'activity' && activeTab !== 'testing'">
                <div class="call-operations-force-toggle">
                  <Checkbox v-model="forceMode" inputId="force-send" binary />
                  <label for="force-send">Force send</label>
                </div>

                <Button
                  icon="pi pi-send"
                  label="Send Selected"
                  :disabled="!hasSelections"
                  :loading="actionLoading"
                  @click="sendSelected"
                />
                <Button
                  icon="pi pi-bolt"
                  label="Send All Ready"
                  outlined
                  :loading="actionLoading"
                  @click="sendAllReady"
                />
                <Button
                  icon="pi pi-filter-slash"
                  label="Clear Filters"
                  text
                  @click="clearColumnFilters"
                />
              </template>
            </div>
          </div>

          <TabPanels class="call-operations-tabpanels">
            <TabPanel v-for="tab in tableTabs" :key="tab.value" :value="tab.value">
              <div class="call-operations-panel-header">
                <div>
                  <h3 class="call-operations-panel-header__title">{{ tab.title }}</h3>
                  <p class="call-operations-panel-header__subtitle">{{ tab.description }}</p>
                </div>

                <div class="call-operations-panel-header__meta">
                  <Tag :value="`Page ${meta.current_page} of ${meta.last_page}`" severity="contrast" />
                </div>
              </div>

              <DataTable
                v-model:selection="selectedRows"
                v-model:filters="gridFilters"
                :value="rows"
                dataKey="visit_id"
                lazy
                paginator
                filterDisplay="menu"
                :rows="tableState.perPage"
                :first="(tableState.page - 1) * tableState.perPage"
                :totalRecords="meta.total"
                :rowsPerPageOptions="[10, 25, 50]"
                :loading="loadingRows"
                :sortField="tableState.sort"
                :sortOrder="sortOrder"
                scrollable
                scrollHeight="calc(100vh - 24rem)"
                stripedRows
                showGridlines
                rowHover
                responsiveLayout="scroll"
                size="small"
                class="call-operations-grid"
                :rowClass="rowClass"
                @page="handlePage"
                @sort="handleSort"
                @filter="handleFilter"
                @row-click="handleRowClick"
              >
                <template #empty>
                  <div class="py-12 text-center">
                    <i class="pi pi-phone text-5xl text-surface-300 mb-4"></i>
                    <div class="text-lg font-medium text-surface-700 dark:text-surface-300">No visits match the current queue filters</div>
                    <div class="text-sm text-surface-500 dark:text-surface-400 mt-2">
                      Adjust the date or clear column filters, then refresh the queue.
                    </div>
                  </div>
                </template>

                <Column selectionMode="multiple" headerStyle="width: 3rem" />

                <Column
                  field="visit_id"
                  header="Visit"
                  sortable
                  sortField="visit_id"
                  filterField="visit_search"
                  :showFilterMatchModes="false"
                  :showFilterOperator="false"
                  :showAddButton="false"
                  :style="{ minWidth: '15rem' }"
                >
                  <template #body="{ data }">
                    <div class="space-y-1">
                      <div class="font-semibold text-primary-600">{{ data.client_system_id }}</div>
                      <div class="text-sm text-surface-700 dark:text-surface-300">{{ data.visit_name }}</div>
                    </div>
                  </template>
                  <template #filter="{ filterModel }">
                    <InputText
                      v-model="filterModel.value"
                      type="text"
                      placeholder="Visit ID or name"
                      class="w-full"
                    />
                  </template>
                </Column>

                <Column
                  field="customer.name"
                  header="Customer / Project"
                  sortable
                  sortField="customer.name"
                  filterField="customer_id"
                  :showFilterMatchModes="false"
                  :showFilterOperator="false"
                  :showAddButton="false"
                  :filterMenuStyle="{ width: '18rem' }"
                  :style="{ minWidth: '16rem' }"
                >
                  <template #body="{ data }">
                    <div class="space-y-1">
                      <div class="font-medium text-surface-900 dark:text-surface-0">{{ data.customer?.name || 'Unknown customer' }}</div>
                      <div class="text-sm text-surface-500 dark:text-surface-400">{{ data.project?.name || 'No project' }}</div>
                    </div>
                  </template>
                  <template #filter="{ filterModel, filterCallback }">
                    <div class="space-y-3">
                      <Select
                        v-model="filterModel.value"
                        :options="customerOptions"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Any customer"
                        showClear
                        class="w-full"
                      />
                      <Select
                        v-model="gridFilters.project_id.value"
                        :options="projectOptions"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Any project"
                        showClear
                        class="w-full"
                      />
                      <div class="flex justify-end gap-2">
                        <Button
                          type="button"
                          icon="pi pi-times"
                          severity="secondary"
                          text
                          @click="clearCustomerProjectFilters(filterCallback)"
                        />
                        <Button
                          type="button"
                          icon="pi pi-check"
                          severity="success"
                          text
                          @click="filterCallback()"
                        />
                      </div>
                    </div>
                  </template>
                </Column>

                <Column
                  field="appointment.service_date"
                  header="Appointment"
                  sortable
                  sortField="appointment.service_date"
                  :style="{ minWidth: '12rem' }"
                >
                  <template #body="{ data }">
                    <div class="space-y-1">
                      <div class="font-medium">{{ data.appointment?.service_date || 'No date' }}</div>
                      <div class="text-sm text-surface-500 dark:text-surface-400">
                        {{ data.appointment?.local_time || 'No time' }}<span v-if="data.appointment?.approx_hours"> • {{ data.appointment.approx_hours }} hrs</span>
                      </div>
                      <div class="flex flex-wrap items-center gap-2 text-xs text-surface-500 dark:text-surface-400">
                        <span>{{ data.location?.timezone || 'No timezone' }}</span>
                        <Tag
                          v-if="data.appointment?.is_past_due || data.readiness?.is_past_due"
                          value="Past Due"
                          severity="warn"
                        />
                      </div>
                    </div>
                  </template>
                </Column>

                <Column
                  field="technician.name"
                  header="Technician"
                  sortable
                  sortField="technician.name"
                  :style="{ minWidth: '13rem' }"
                >
                  <template #body="{ data }">
                    <div class="space-y-1">
                      <div class="font-medium text-surface-900 dark:text-surface-0">{{ data.technician?.name || 'Unassigned' }}</div>
                      <div class="text-sm text-surface-500 dark:text-surface-400">{{ data.technician?.phone || 'No phone' }}</div>
                    </div>
                  </template>
                </Column>

                <Column header="Tools" :style="{ minWidth: '15rem' }">
                  <template #body="{ data }">
                    <div class="space-y-2">
                      <div class="text-sm text-surface-900 dark:text-surface-0 line-clamp-2">{{ formatToolsText(data.tools?.resolved) || 'Missing tools' }}</div>
                      <Tag :value="data.tools?.source || 'none'" severity="secondary" />
                    </div>
                  </template>
                </Column>

                <Column
                  field="readiness.ready_to_push"
                  header="Readiness"
                  filterField="ready_to_push"
                  :showFilterMatchModes="false"
                  :showFilterOperator="false"
                  :showAddButton="false"
                  :filterMenuStyle="{ width: '14rem' }"
                  :style="{ minWidth: '12rem' }"
                >
                  <template #body="{ data }">
                    <div class="space-y-2">
                      <Tag
                        :value="getEligibilityState(data).label"
                        :severity="getEligibilityState(data).severity"
                      />
                      <div class="text-xs text-surface-500 dark:text-surface-400 line-clamp-2">
                        {{ getEligibilityState(data).detail }}
                      </div>
                    </div>
                  </template>
                  <template #filter="{ filterModel }">
                    <Select
                      v-model="filterModel.value"
                      :options="readyOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Any readiness"
                      showClear
                      class="w-full"
                    />
                  </template>
                </Column>

                <Column
                  field="sync.sync_status"
                  header="Sync"
                  sortable
                  sortField="sync_status"
                  filterField="sync_status"
                  :showFilterMatchModes="false"
                  :showFilterOperator="false"
                  :showAddButton="false"
                  :filterMenuStyle="{ width: '16rem' }"
                  :style="{ minWidth: '11rem' }"
                >
                  <template #body="{ data }">
                    <div class="space-y-2">
                      <Tag :value="formatSyncStatus(data.sync?.sync_status)" :severity="syncSeverity(data.sync?.sync_status)" />
                      <div class="text-xs text-surface-500 dark:text-surface-400">
                        {{ data.sync?.needs_repush ? `Drift: ${data.sync?.drift_fields?.join(', ')}` : `Pushes: ${data.sync?.push_count || 0}` }}
                      </div>
                    </div>
                  </template>
                  <template #filter="{ filterModel }">
                    <MultiSelect
                      v-model="filterModel.value"
                      :options="syncStatusOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Any sync state"
                      :maxSelectedLabels="1"
                      class="w-full"
                    />
                  </template>
                </Column>

                <Column
                  field="call.call_status"
                  header="Call"
                  sortable
                  sortField="call_status"
                  filterField="call_status"
                  :showFilterMatchModes="false"
                  :showFilterOperator="false"
                  :showAddButton="false"
                  :filterMenuStyle="{ width: '16rem' }"
                  :style="{ minWidth: '11rem' }"
                >
                  <template #body="{ data }">
                    <div class="space-y-2">
                      <Tag :value="formatStatus(data.call?.call_status)" :severity="callSeverity(data.call?.call_status)" />
                      <div class="text-xs text-surface-500 dark:text-surface-400">
                        <span v-if="data.call?.sms_sent">SMS sent</span>
                        <span v-else-if="data.call?.last_outcome">{{ data.call.last_outcome }}</span>
                        <span v-else>Awaiting response</span>
                      </div>
                    </div>
                  </template>
                  <template #filter="{ filterModel }">
                    <MultiSelect
                      v-model="filterModel.value"
                      :options="callStatusOptions"
                      optionLabel="label"
                      optionValue="value"
                      :placeholder="callFilterPlaceholder"
                      :maxSelectedLabels="1"
                      class="w-full"
                    />
                  </template>
                </Column>

                <Column
                  field="sync.last_pushed_at"
                  header="Last Push"
                  sortable
                  sortField="last_pushed_at"
                  :style="{ minWidth: '12rem' }"
                >
                  <template #body="{ data }">
                    <div class="text-sm text-surface-700 dark:text-surface-300">
                      {{ formatTimestamp(data.sync?.last_pushed_at) }}
                    </div>
                  </template>
                </Column>

                <Column header="Actions" frozen alignFrozen="right" :style="{ width: '5rem', minWidth: '5rem' }">
                  <template #body="{ data }">
                    <div class="flex items-center justify-end call-operations-actions-cell">
                      <Button
                        icon="pi pi-ellipsis-v"
                        text
                        rounded
                        size="small"
                        aria-label="Visit actions"
                        aria-haspopup="true"
                        aria-controls="call-operations-row-menu"
                        @click.stop="toggleActionMenu($event, data)"
                        v-tooltip.top="'Visit actions'"
                      />
                    </div>
                  </template>
                </Column>
              </DataTable>
            </TabPanel>

            <TabPanel value="activity">
              <div class="call-operations-activity-panel">
                <CallOperationsActivityPanel
                  :visit="selectedVisit"
                  :events="selectedVisitActivity"
                  :loading="loadingActivity"
                  @refresh="refreshSelectedActivity"
                />
              </div>
            </TabPanel>

            <TabPanel value="testing">
              <CallOperationsTestingTab v-if="activeTab === 'testing'" />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </template>
    </Card>

    <CallOperationsDetailDrawer
      v-model:visible="drawerVisible"
      :detail="selectedVisitDetail"
      :loading="loadingDetail"
      :actionLoading="actionLoading"
      @send="sendSingle"
      @edit-tools="openToolsDialog"
      @open-activity="openActivity"
      @open-visit="openVisit"
    />

    <Menu ref="actionMenu" id="call-operations-row-menu" :model="actionMenuItems" :popup="true" class="w-56" />

    <Dialog v-model:visible="toolsDialogVisible" modal header="Edit Tools Override" :style="{ width: '32rem' }">
      <div class="space-y-4">
        <p class="text-sm text-surface-600 dark:text-surface-400">
          ToolsRequired is a hard readiness requirement. Use a manual override when the source SOW HTML is incomplete.
        </p>
        <Textarea
          v-model="toolsOverrideDraft"
          rows="5"
          class="w-full"
          placeholder="Ladder, cable tester"
        />
      </div>

      <template #footer>
        <Button label="Cancel" text @click="toolsDialogVisible = false" />
        <Button label="Clear Override" outlined @click="clearToolsOverride" />
        <Button label="Save Override" :loading="actionLoading" @click="saveToolsOverride" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { useCallOperationsStore } from '@/stores/callOperationsStore';
import { formatToolsText, getVisitEligibility } from '@/utils/callOperations';
import CallOperationsSummaryStrip from '@/components/field-services/call-operations/CallOperationsSummaryStrip.vue';
import CallOperationsDetailDrawer from '@/components/field-services/call-operations/CallOperationsDetailDrawer.vue';
import CallOperationsActivityPanel from '@/components/field-services/call-operations/CallOperationsActivityPanel.vue';
import CallOperationsTestingTab from '@/components/field-services/call-operations/CallOperationsTestingTab.vue';

const router = useRouter();
const toast = useToast();
const store = useCallOperationsStore();

const {
  activeTab,
  rows,
  meta,
  summary,
  selectedRows,
  selectedVisit,
  selectedVisitDetail,
  selectedVisitActivity,
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
  selectedReadyCount
} = storeToRefs(store);

const today = new Date();
const forceMode = ref(false);
const drawerVisible = ref(false);
const toolsDialogVisible = ref(false);
const toolsOverrideDraft = ref('');
const actionMenu = ref(null);
const currentActionVisit = ref(null);

function createGridFilters() {
  return {
    visit_search: { value: null, matchMode: FilterMatchMode.CONTAINS },
    customer_id: { value: null, matchMode: FilterMatchMode.EQUALS },
    project_id: { value: null, matchMode: FilterMatchMode.EQUALS },
    ready_to_push: { value: null, matchMode: FilterMatchMode.EQUALS },
    sync_status: { value: null, matchMode: FilterMatchMode.IN },
    call_status: { value: null, matchMode: FilterMatchMode.IN }
  };
}

const gridFilters = ref(createGridFilters());

const sortOrder = computed(() => (tableState.value.direction === 'desc' ? -1 : 1));
const callFilterPlaceholder = computed(() => (activeTab.value === 'queue' ? 'Queue preset' : 'Any call state'));

const tableTabs = [
  {
    value: 'queue',
    title: 'Queue',
    description: 'Active dispatch visits with non-terminal call states and current send readiness.'
  },
  {
    value: 'results',
    title: 'Results',
    description: 'Terminal DPROMPT call outcomes, including completed, transferred, and failed calls.'
  }
];

const syncStatusOptions = [
  { label: 'Not Queued', value: 'not_ready' },
  { label: 'Ready to Send', value: 'ready' },
  { label: 'Sent', value: 'sent' },
  { label: 'Needs Update', value: 'needs_update' },
  { label: 'Push Failed', value: 'push_failed' }
];

const callStatusOptions = [
  { label: 'Awaiting Call', value: 'awaiting_call' },
  { label: 'Completed', value: 'completed' },
  { label: 'Transferred', value: 'transferred' },
  { label: 'Failed', value: 'failed' },
  { label: 'Unknown', value: 'unknown' }
];

const readyOptions = [
  { label: 'Ready Only', value: true },
  { label: 'Not Ready / Ineligible', value: false }
];

const actionMenuItems = computed(() => {
  const visit = currentActionVisit.value;

  if (!visit) {
    return [];
  }

  const items = [
    {
      label: 'View Detail',
      icon: 'pi pi-eye',
      command: () => openDetail(visit)
    },
    {
      label: 'Send / Update',
      icon: 'pi pi-send',
      disabled: !visit.allowed_actions?.includes('send_update') || actionLoading.value,
      command: () => sendSingle(visit)
    },
    {
      label: 'Edit Tools',
      icon: 'pi pi-file-edit',
      disabled: !visit.allowed_actions?.includes('edit_tools') || actionLoading.value,
      command: () => openToolsDialog(visit)
    },
    {
      label: 'Selected Visit Activity',
      icon: 'pi pi-history',
      command: () => openActivity(visit)
    },
    {
      label: 'Open Visit',
      icon: 'pi pi-external-link',
      command: () => openVisit(visit)
    }
  ];

  if (visit.allowed_actions?.includes('view_recording') && (visit.call?.recording_direct || visit.call?.recording_url)) {
    items.push({
      label: 'View Recording',
      icon: 'pi pi-play-circle',
      command: () => openExternal(visit.call.recording_direct || visit.call.recording_url)
    });
  }

  if (visit.allowed_actions?.includes('view_transcript') && visit.call?.transcript_url) {
    items.push({
      label: 'View Transcript',
      icon: 'pi pi-file',
      command: () => openExternal(visit.call.transcript_url)
    });
  }

  return items;
});

function normalizeMultiValue(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return value ? [value] : [];
}

function syncStoreFiltersFromGrid(filterState = gridFilters.value) {
  store.updateFilters({
    search: filterState.visit_search?.value?.trim?.() || '',
    customerId: filterState.customer_id?.value ?? null,
    projectId: filterState.project_id?.value ?? null,
    syncStatuses: normalizeMultiValue(filterState.sync_status?.value),
    callStatuses: normalizeMultiValue(filterState.call_status?.value),
    readyToPush: filterState.ready_to_push?.value ?? null
  });
}

function rowClass(data) {
  const eligibility = getVisitEligibility(data);

  return {
    'call-operations-row-past-due': eligibility.kind === 'past_due',
    'call-operations-row-warning': data.sync?.sync_status === 'needs_update',
    'call-operations-row-danger': eligibility.kind === 'blocked',
    'call-operations-row-muted': eligibility.kind === 'ineligible',
    'call-operations-row-success': data.call?.call_status === 'completed'
  };
}

function formatStatus(value) {
  if (!value) {
    return 'Unknown';
  }

  return value
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function formatSyncStatus(status) {
  const labelMap = {
    not_ready: 'Not Queued',
    ready: 'Ready to Send',
    sent: 'Sent',
    needs_update: 'Needs Update',
    push_failed: 'Push Failed'
  };

  return labelMap[status] || formatStatus(status);
}

function syncSeverity(status) {
  const severityMap = {
    not_ready: 'danger',
    ready: 'success',
    sent: 'info',
    needs_update: 'warning',
    push_failed: 'danger'
  };

  return severityMap[status] || 'secondary';
}

function callSeverity(status) {
  const severityMap = {
    awaiting_call: 'warning',
    completed: 'success',
    transferred: 'info',
    failed: 'danger',
    unknown: 'secondary'
  };

  return severityMap[status] || 'secondary';
}

function formatTimestamp(value) {
  if (!value) {
    return 'Not sent';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

function showToast(severity, summary, detail, life = 4000) {
  toast.add({
    severity,
    summary,
    detail,
    life
  });
}

function getEligibilityState(visit) {
  return getVisitEligibility(visit);
}

async function refreshAll() {
  try {
    await store.refreshAll();
  } catch (loadError) {
    showToast('error', 'Refresh failed', loadError.message || 'Unable to refresh dispatch call operations.');
  }
}

async function handleDateChange() {
  tableState.value.page = 1;
  await refreshAll();
}

async function clearColumnFilters() {
  try {
    gridFilters.value = createGridFilters();
    store.clearQueryFilters();
    await store.refreshAll();
  } catch (clearError) {
    showToast('error', 'Filter reset failed', clearError.message || 'Unable to clear the current filters.');
  }
}

function clearCustomerProjectFilters(filterCallback) {
  gridFilters.value.customer_id.value = null;
  gridFilters.value.project_id.value = null;
  filterCallback();
}

async function handleFilter(event) {
  try {
    gridFilters.value = event.filters;
    syncStoreFiltersFromGrid(event.filters);
    await store.refreshAll();
  } catch (filterError) {
    showToast('error', 'Filters failed', filterError.message || 'Unable to apply the current column filters.');
  }
}

async function handleTabChange(nextTab) {
  try {
    await store.setActiveTab(nextTab);
  } catch (tabError) {
    showToast('error', 'Tab load failed', tabError.message || 'Unable to load the selected tab.');
  }
}

async function handlePage(event) {
  try {
    store.updatePagination({
      page: event.page + 1,
      perPage: event.rows
    });

    await store.loadRows();
  } catch (pageError) {
    showToast('error', 'Pagination failed', pageError.message || 'Unable to load the requested page.');
  }
}

async function handleSort(event) {
  try {
    store.updateSorting({
      sort: event.sortField || 'appointment.service_date',
      direction: event.sortOrder === -1 ? 'desc' : 'asc'
    });

    await store.loadRows();
  } catch (sortError) {
    showToast('error', 'Sort failed', sortError.message || 'Unable to sort the queue.');
  }
}

async function openDetail(visit) {
  try {
    drawerVisible.value = true;
    await store.loadVisitDetail(visit.visit_id);
  } catch (detailError) {
    drawerVisible.value = false;
    showToast('error', 'Detail failed', detailError.message || 'Unable to load visit detail.');
  }
}

async function sendSingle(visit) {
  try {
    const response = await store.sendVisit(visit.visit_id, forceMode.value);
    showToast('success', 'Visit sent', response.message || 'Visit was sent to DPROMPT.', 3000);
  } catch (sendError) {
    showToast('error', 'Send failed', sendError.message || 'Unable to send the selected visit.', 4500);
  }
}

async function sendSelected() {
  try {
    const response = await store.sendSelected(forceMode.value);
    showToast(
      'success',
      'Bulk send queued',
      `${response.data?.accepted_count || 0} of ${response.data?.requested_count || 0} visits accepted.`,
      3500
    );
  } catch (sendError) {
    showToast('error', 'Bulk send failed', sendError.message || 'Unable to send the selected visits.', 4500);
  }
}

async function sendAllReady() {
  try {
    const response = await store.sendAllReady(forceMode.value);
    showToast(
      'success',
      'All ready visits queued',
      `${response.data?.accepted_count || 0} of ${response.data?.requested_count || 0} ready visits accepted.`,
      3500
    );
  } catch (sendError) {
    showToast('error', 'Send all ready failed', sendError.message || 'Unable to send all ready visits.', 4500);
  }
}

async function refreshStatuses() {
  try {
    const response = await store.refreshStatuses();
    showToast(
      'success',
      'Status refresh complete',
      `${response.data?.accepted_count || 0} visits refreshed.`,
      3000
    );
  } catch (refreshError) {
    showToast('error', 'Status refresh failed', refreshError.message || 'Unable to refresh DPROMPT call statuses.', 4500);
  }
}

async function openToolsDialog(visit) {
  try {
    await store.loadVisitDetail(visit.visit_id);
    toolsOverrideDraft.value =
      selectedVisitDetail.value?.visit?.tools?.override ||
      selectedVisitDetail.value?.visit?.tools?.resolved ||
      '';
    toolsDialogVisible.value = true;
  } catch (detailError) {
    showToast('error', 'Tools failed', detailError.message || 'Unable to load visit tools.', 4500);
  }
}

async function saveToolsOverride() {
  try {
    const response = await store.saveToolsOverride(toolsOverrideDraft.value.trim() || null);
    toolsDialogVisible.value = false;
    showToast('success', 'Tools override saved', response.message || 'The tools override was updated.', 3000);
  } catch (saveError) {
    showToast('error', 'Tools update failed', saveError.message || 'Unable to save the tools override.', 4500);
  }
}

async function clearToolsOverride() {
  toolsOverrideDraft.value = '';
  await saveToolsOverride();
}

async function openActivity(visit) {
  try {
    await store.loadVisitDetail(visit.visit_id);
    await store.setActiveTab('activity');
  } catch (activityError) {
    showToast('error', 'Activity failed', activityError.message || 'Unable to load visit activity.', 4500);
  }
}

async function refreshSelectedActivity() {
  if (!selectedVisit.value) {
    return;
  }

  try {
    await store.loadVisitActivity(selectedVisit.value.visit_id);
  } catch (activityError) {
    showToast('error', 'Activity refresh failed', activityError.message || 'Unable to refresh visit activity.', 4500);
  }
}

function openExternal(url) {
  if (!url) {
    return;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}

function openVisit(visit) {
  router.push(`/field-services/visit/${visit.visit_id}`);
}

function toggleActionMenu(event, visit) {
  currentActionVisit.value = visit;
  actionMenu.value?.toggle(event);
}

async function handleRowClick(event) {
  const target = event.originalEvent?.target;

  if (target?.closest('.p-checkbox') || target?.closest('button')) {
    return;
  }

  await openDetail(event.data);
}

async function setRelativeDate(offset) {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + offset);
  filters.value.date = nextDate;
  await handleDateChange();
}

onMounted(async () => {
  await refreshAll();
});
</script>

<style scoped>
.call-operations-view {
  @apply p-4 lg:p-5 space-y-4;
}

.call-operations-topbar {
  @apply rounded-[1.5rem] border border-surface-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(245,247,250,0.98))] px-5 py-5 shadow-sm flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between dark:border-surface-700 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(17,24,39,0.94))];
}

.call-operations-topbar__eyebrow {
  @apply text-xs uppercase tracking-[0.24em] text-surface-500 dark:text-surface-400 mb-2;
}

.call-operations-topbar__title {
  @apply text-2xl font-semibold text-surface-900 dark:text-surface-0;
}

.call-operations-topbar__subtitle {
  @apply mt-2 max-w-3xl text-sm text-surface-600 dark:text-surface-300;
}

.call-operations-topbar__controls {
  @apply flex flex-wrap items-center gap-3 xl:justify-end;
}

.call-operations-grid-toolbar {
  @apply flex flex-col gap-3 border-b border-surface-200 px-5 py-4 dark:border-surface-700 xl:flex-row xl:items-center xl:justify-between;
}

.call-operations-grid-toolbar__actions {
  @apply flex flex-wrap items-center gap-2;
}

.call-operations-force-toggle {
  @apply flex items-center gap-2 rounded-full border border-surface-200 px-3 py-2 text-sm text-surface-600 dark:border-surface-700 dark:text-surface-300;
}

.call-operations-tabpanels {
  @apply min-h-0;
}

.call-operations-panel-header {
  @apply flex flex-col gap-3 px-5 pt-5 pb-3 border-b border-surface-100 dark:border-surface-800 xl:flex-row xl:items-center xl:justify-between;
}

.call-operations-panel-header__title {
  @apply text-lg font-semibold text-surface-900 dark:text-surface-0;
}

.call-operations-panel-header__subtitle {
  @apply mt-1 text-sm text-surface-600 dark:text-surface-400;
}

.call-operations-panel-header__meta {
  @apply flex items-center gap-2;
}

.call-operations-activity-panel {
  @apply p-5;
}

:deep(.call-operations-grid-shell .p-card-content) {
  @apply p-0;
}

:deep(.call-operations-grid-shell .p-tabpanels) {
  @apply p-0;
}

:deep(.call-operations-grid .p-datatable-header) {
  @apply border-x-0 border-t-0;
}

:deep(.call-operations-grid .p-datatable-table-container) {
  @apply border-x-0;
}

:deep(.call-operations-grid .p-paginator) {
  @apply border-x-0 border-b-0;
}

:deep(.call-operations-grid .p-datatable-thead > tr > th.p-datatable-frozen-column) {
  @apply bg-surface-0 dark:bg-surface-900;
  box-shadow: -12px 0 16px -16px rgba(15, 23, 42, 0.32);
}

:deep(.call-operations-grid .p-datatable-tbody > tr > td.p-datatable-frozen-column) {
  @apply bg-surface-0 dark:bg-surface-900;
  background-clip: padding-box;
}

:deep(.call-operations-grid .p-datatable-tbody > tr.call-operations-row-warning > td.p-datatable-frozen-column) {
  @apply bg-yellow-50/95 dark:bg-yellow-950/20;
}

:deep(.call-operations-grid .p-datatable-tbody > tr.call-operations-row-past-due > td.p-datatable-frozen-column) {
  @apply bg-amber-50/95 dark:bg-amber-950/20;
}

:deep(.call-operations-grid .p-datatable-tbody > tr.call-operations-row-danger > td.p-datatable-frozen-column) {
  @apply bg-red-50/95 dark:bg-red-950/20;
}

:deep(.call-operations-grid .p-datatable-tbody > tr.call-operations-row-muted > td.p-datatable-frozen-column) {
  @apply bg-slate-100/95 dark:bg-surface-800/95;
}

:deep(.call-operations-grid .p-datatable-tbody > tr.call-operations-row-success > td.p-datatable-frozen-column) {
  @apply bg-green-50/95 dark:bg-green-950/20;
}

:deep(.call-operations-row-warning) {
  @apply bg-yellow-50/70 dark:bg-yellow-950/10;
}

:deep(.call-operations-row-past-due) {
  @apply bg-amber-50/70 dark:bg-amber-950/10;
}

:deep(.call-operations-row-danger) {
  @apply bg-red-50/60 dark:bg-red-950/10;
}

:deep(.call-operations-row-muted) {
  @apply bg-slate-100/70 dark:bg-surface-800/60;
}

:deep(.call-operations-row-success) {
  @apply bg-green-50/50 dark:bg-green-950/10;
}
</style>
