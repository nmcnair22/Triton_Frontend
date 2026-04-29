<template>
  <div class="call-operations-view">
    <header class="call-operations-header">
      <div>
        <div class="call-operations-header__eyebrow">Field Services</div>
        <h1 class="call-operations-header__title">Dispatch Call Operations</h1>
      </div>

      <div v-if="activeTab !== 'testing'" class="call-operations-header__actions">
        <DatePicker
          v-model="filters.date"
          showIcon
          class="w-full sm:w-52"
          @date-select="handleDateChange"
        />
        <Button label="Today" outlined @click="setRelativeDate(0)" />
        <Button label="Tomorrow" outlined @click="setRelativeDate(1)" />
      </div>
    </header>

    <Message v-if="error && activeTab !== 'testing'" severity="error" variant="outlined" :closable="false">
      {{ error }}
    </Message>

    <section class="call-operations-shell">
      <Tabs :value="activeTab" @update:value="handleTabChange" class="call-operations-tabs">
        <div class="call-operations-tabs__nav">
          <TabList>
            <Tab value="queue">Queue</Tab>
            <Tab value="results">Results</Tab>
            <Tab value="testing">Testing</Tab>
          </TabList>
        </div>

        <TabPanels>
          <TabPanel value="queue">
            <div class="call-operations-workspace">
              <div class="call-operations-workspace__toolbar">
                <div class="call-operations-workspace__tools">
                  <SelectButton
                    v-model="queueMode"
                    :options="queueModeOptions"
                    optionLabel="label"
                    optionValue="value"
                    size="small"
                    @update:modelValue="handleQueueModeChange"
                  />
                  <InputText
                    v-model.trim="searchDraft"
                    class="call-operations-search"
                    placeholder="Search customer, visit, tech, or ID"
                    @keyup.enter="applySearch"
                  />
                  <Button icon="pi pi-filter-slash" text rounded @click="clearWorkspaceFilters" v-tooltip.top="'Reset filters'" />
                </div>

                <div class="call-operations-workspace__actions">
                  <span v-if="selectedRows.length" class="call-operations-inline-note">{{ selectedRows.length }} selected</span>
                  <SplitButton
                    icon="pi pi-refresh"
                    label="Refresh"
                    :loading="loadingRows || loadingSummary"
                    @click="refreshAll"
                    :model="[{ label: 'Refresh Status', icon: 'pi pi-sync', command: () => refreshStatuses() }]"
                    outlined
                    size="small"
                  />
                  <Button
                    icon="pi pi-send"
                    label="Send Selected"
                    :disabled="selectedSendableCount === 0"
                    :loading="actionLoading"
                    @click="sendSelected"
                  />
                </div>
              </div>

              <div class="call-operations-summary-row">
                <div
                  v-for="item in queueSummaryItems"
                  :key="item.label"
                  class="call-operations-summary-card"
                >
                  <span class="call-operations-summary-card__label">{{ item.label }}</span>
                  <strong class="call-operations-summary-card__value">{{ item.value }}</strong>
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
                scrollHeight="calc(100vh - 17rem)"
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
                  <div class="call-operations-empty">
                    <div class="call-operations-empty__title">No visits match the current queue view</div>
                    <div class="call-operations-empty__subtitle">
                      Clear filters or widen to All Visits when you need broader context.
                    </div>
                  </div>
                </template>

                <Column selectionMode="multiple" headerStyle="width: 3rem" />

                <Column
                  field="customer.name"
                  header="Customer"
                  sortable
                  sortField="customer.name"
                  filterField="customer_id"
                  :showFilterMatchModes="false"
                  :showFilterOperator="false"
                  :showAddButton="false"
                  :style="{ minWidth: '16rem' }"
                >
                  <template #body="{ data }">
                    <div class="space-y-1">
                      <div class="font-semibold text-surface-900 dark:text-surface-0">{{ data.customer?.name || 'Unknown customer' }}</div>
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
                      <div class="flex justify-end">
                        <Button type="button" icon="pi pi-check" text @click="filterCallback()" />
                      </div>
                    </div>
                  </template>
                </Column>

                <Column
                  field="appointment.service_date"
                  header="Date / Time"
                  sortable
                  sortField="appointment.service_date"
                  :style="{ minWidth: '12rem' }"
                >
                  <template #body="{ data }">
                    <div class="space-y-1">
                      <div class="font-medium text-surface-900 dark:text-surface-0">{{ data.appointment?.service_date || 'No date' }}</div>
                      <div class="text-sm text-surface-600 dark:text-surface-400">{{ data.appointment?.local_time || 'No time' }}</div>
                      <div class="text-xs text-surface-500 dark:text-surface-400">{{ data.location?.timezone || 'No timezone' }}</div>
                    </div>
                  </template>
                </Column>

                <Column
                  field="visit_id"
                  header="Visit"
                  sortable
                  sortField="visit_id"
                  :style="{ minWidth: '18rem' }"
                >
                  <template #body="{ data }">
                    <div class="space-y-1">
                      <div class="font-semibold text-primary-700">{{ data.visit_name }}</div>
                      <div class="text-sm text-surface-500 dark:text-surface-400">
                        {{ data.client_system_id }}<span v-if="data.visit_type"> • {{ data.visit_type }}</span>
                      </div>
                    </div>
                  </template>
                </Column>

                <Column
                  field="technician.name"
                  header="Tech"
                  sortable
                  sortField="technician.name"
                  :style="{ minWidth: '14rem' }"
                >
                  <template #body="{ data }">
                    <div class="space-y-1">
                      <div class="font-medium text-surface-900 dark:text-surface-0">{{ data.technician?.name || 'Unassigned' }}</div>
                      <div class="text-sm text-surface-500 dark:text-surface-400">{{ data.technician?.phone || 'No phone' }}</div>
                    </div>
                  </template>
                </Column>

                <Column
                  field="sync.sync_status"
                  header="Status"
                  sortable
                  sortField="sync_status"
                  filterField="sync_status"
                  :showFilterMatchModes="false"
                  :showFilterOperator="false"
                  :showAddButton="false"
                  :style="{ minWidth: '10rem' }"
                >
                  <template #body="{ data }">
                    <span :class="pushPillClass(data)">{{ pushedStateLabel(data) }}</span>
                  </template>
                  <template #filter="{ filterModel }">
                    <MultiSelect
                      v-model="filterModel.value"
                      :options="syncStatusOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Any push state"
                      :maxSelectedLabels="1"
                      class="w-full"
                    />
                  </template>
                </Column>

                <Column
                  field="data_quality"
                  header="Readiness"
                  filterField="data_quality"
                  :showFilterMatchModes="false"
                  :showFilterOperator="false"
                  :showAddButton="false"
                  :style="{ minWidth: '10rem' }"
                >
                  <template #body="{ data }">
                    <span :class="eligibilityPillClass(data)">{{ eligibilityLabel(data) }}</span>
                  </template>
                  <template #filter="{ filterModel }">
                    <MultiSelect
                      v-model="filterModel.value"
                      :options="dataQualityOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Any eligibility"
                      :maxSelectedLabels="1"
                      class="w-full"
                    />
                  </template>
                </Column>

                <Column header="Action" :style="{ minWidth: '10rem' }">
                  <template #body="{ data }">
                    <Button
                      label="Send / Update"
                      size="small"
                      :disabled="!data.allowed_actions?.includes('send_update') || actionLoading"
                      :loading="actionLoading && String(selectedVisit?.visit_id || '') === String(data.visit_id)"
                      @click.stop="sendSingle(data)"
                    />
                  </template>
                </Column>
              </DataTable>
            </div>
          </TabPanel>

          <TabPanel value="results">
            <div class="call-operations-workspace">
              <div class="call-operations-workspace__toolbar">
                <div class="call-operations-workspace__tools">
                  <InputText
                    v-model.trim="searchDraft"
                    class="call-operations-search"
                    placeholder="Search customer, visit, tech, or ID"
                    @keyup.enter="applySearch"
                  />
                  <Button icon="pi pi-filter-slash" text rounded @click="clearWorkspaceFilters" v-tooltip.top="'Reset filters'" />
                </div>

                <div class="call-operations-workspace__actions">
                  <SplitButton
                    icon="pi pi-refresh"
                    label="Refresh"
                    :loading="loadingRows || loadingSummary || actionLoading"
                    @click="refreshStatuses"
                    :model="[{ label: 'Reload List', icon: 'pi pi-list', command: () => refreshAll() }]"
                    outlined
                    size="small"
                  />
                </div>
              </div>

              <div class="call-operations-summary-row">
                <div
                  v-for="item in resultsSummaryItems"
                  :key="item.label"
                  class="call-operations-summary-card"
                >
                  <span class="call-operations-summary-card__label">{{ item.label }}</span>
                  <strong class="call-operations-summary-card__value">{{ item.value }}</strong>
                </div>
              </div>

              <DataTable
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
                scrollHeight="calc(100vh - 17rem)"
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
                  <div class="call-operations-empty">
                    <div class="call-operations-empty__title">No submitted visits match the current results view</div>
                    <div class="call-operations-empty__subtitle">
                      Clear filters to widen the result set for the selected day.
                    </div>
                  </div>
                </template>

                <Column
                  field="customer.name"
                  header="Customer"
                  sortable
                  sortField="customer.name"
                  filterField="customer_id"
                  :showFilterMatchModes="false"
                  :showFilterOperator="false"
                  :showAddButton="false"
                  :style="{ minWidth: '16rem' }"
                >
                  <template #body="{ data }">
                    <div class="space-y-1">
                      <div class="font-semibold text-surface-900 dark:text-surface-0">{{ data.customer?.name || 'Unknown customer' }}</div>
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
                      <div class="flex justify-end">
                        <Button type="button" icon="pi pi-check" text @click="filterCallback()" />
                      </div>
                    </div>
                  </template>
                </Column>

                <Column
                  field="appointment.service_date"
                  header="Date / Time"
                  sortable
                  sortField="appointment.service_date"
                  :style="{ minWidth: '12rem' }"
                >
                  <template #body="{ data }">
                    <div class="space-y-1">
                      <div class="font-medium text-surface-900 dark:text-surface-0">{{ data.appointment?.service_date || 'No date' }}</div>
                      <div class="text-sm text-surface-600 dark:text-surface-400">{{ data.appointment?.local_time || 'No time' }}</div>
                      <div class="text-xs text-surface-500 dark:text-surface-400">{{ data.location?.timezone || 'No timezone' }}</div>
                    </div>
                  </template>
                </Column>

                <Column
                  field="visit_id"
                  header="Visit"
                  sortable
                  sortField="visit_id"
                  :style="{ minWidth: '18rem' }"
                >
                  <template #body="{ data }">
                    <div class="space-y-1">
                      <div class="font-semibold text-primary-700">{{ data.visit_name }}</div>
                      <div class="text-sm text-surface-500 dark:text-surface-400">{{ data.client_system_id }}</div>
                    </div>
                  </template>
                </Column>

                <Column
                  field="technician.name"
                  header="Tech"
                  sortable
                  sortField="technician.name"
                  :style="{ minWidth: '14rem' }"
                >
                  <template #body="{ data }">
                    <div class="space-y-1">
                      <div class="font-medium text-surface-900 dark:text-surface-0">{{ data.technician?.name || 'Unassigned' }}</div>
                      <div class="text-sm text-surface-500 dark:text-surface-400">{{ data.technician?.phone || 'No phone' }}</div>
                    </div>
                  </template>
                </Column>

                <Column
                  field="sync.sync_status"
                  header="Synced"
                  sortable
                  sortField="sync_status"
                  filterField="sync_status"
                  :showFilterMatchModes="false"
                  :showFilterOperator="false"
                  :showAddButton="false"
                  :style="{ minWidth: '12rem' }"
                >
                  <template #body="{ data }">
                    <div class="space-y-1">
                      <span :class="pushPillClass(data)">{{ resultSyncLabel(data) }}</span>
                      <div class="text-xs text-surface-500 dark:text-surface-400">{{ pushedStateCopy(data) }}</div>
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

                <Column header="Call Window" :style="{ minWidth: '11rem' }">
                  <template #body="{ data }">
                    <div class="space-y-1">
                      <span :class="callWindowPillClass(data)">{{ shouldCallLabel(data) }}</span>
                      <div class="text-xs text-surface-500 dark:text-surface-400">{{ callWindowCopy(data) }}</div>
                    </div>
                  </template>
                </Column>

                <Column header="Call Made" :style="{ minWidth: '10rem' }">
                  <template #body="{ data }">
                    <div class="call-operations-call-state">
                      <div :class="callMadeStateClass(data)">{{ callMadeLabel(data) }}</div>
                      <div class="call-operations-call-state__copy">{{ callMadeCopy(data) }}</div>
                      <div v-if="smsStatusText(data)" class="call-operations-call-state__meta">
                        SMS {{ smsStatusText(data) }}
                      </div>
                    </div>
                  </template>
                </Column>

                <Column
                  field="call.call_status"
                  header="Outcome"
                  filterField="call_status"
                  :showFilterMatchModes="false"
                  :showFilterOperator="false"
                  :showAddButton="false"
                  :style="{ minWidth: '16rem' }"
                >
                  <template #body="{ data }">
                    <div :class="outcomeCardClass(data)">
                      <div class="call-operations-outcome__eyebrow">{{ outcomeHeading(data) }}</div>
                      <div class="call-operations-outcome__value">{{ outcomeLabel(data) }}</div>
                      <div class="call-operations-outcome__meta">{{ outcomeCopy(data) }}</div>
                    </div>
                  </template>
                  <template #filter="{ filterModel }">
                    <MultiSelect
                      v-model="filterModel.value"
                      :options="callStatusOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Any outcome"
                      :maxSelectedLabels="1"
                      class="w-full"
                    />
                  </template>
                </Column>
              </DataTable>
            </div>
          </TabPanel>

          <TabPanel value="testing">
            <div class="call-operations-workspace call-operations-workspace--testing">
              <CallOperationsTestingTab v-if="activeTab === 'testing'" />
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </section>

    <CallOperationsDetailDrawer
      v-model:visible="drawerVisible"
      :detail="selectedVisitDetail"
      :events="selectedVisitActivity"
      :loading="loadingDetail"
      :loadingActivity="loadingActivity"
      :actionLoading="actionLoading"
      @send="sendSingle"
      @edit-tools="openToolsDialog"
      @open-visit="openVisit"
      @refresh-activity="refreshSelectedActivity"
    />

    <Dialog v-model:visible="toolsDialogVisible" modal header="Edit Tools Override" :style="{ width: '32rem' }">
      <div class="space-y-4">
        <p class="text-sm text-surface-600 dark:text-surface-400">
          Update the tools text when the source record is incomplete.
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
import {
  formatCallStatus,
  formatQueueScopeReason,
  formatReadinessBlockers,
  formatReadinessWarnings
} from '@/utils/callOperations';
import CallOperationsDetailDrawer from '@/components/field-services/call-operations/CallOperationsDetailDrawer.vue';
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
  tableState
} = storeToRefs(store);

const drawerVisible = ref(false);
const toolsDialogVisible = ref(false);
const toolsOverrideDraft = ref('');
const queueMode = ref('queue');
const searchDraft = ref('');

const queueModeOptions = [
  { label: 'Action Queue', value: 'queue' },
  { label: 'All Visits', value: 'all' }
];

function createGridFilters() {
  return {
    customer_id: { value: null, matchMode: FilterMatchMode.EQUALS },
    project_id: { value: null, matchMode: FilterMatchMode.EQUALS },
    sync_status: { value: null, matchMode: FilterMatchMode.IN },
    call_status: { value: null, matchMode: FilterMatchMode.IN },
    data_quality: { value: null, matchMode: FilterMatchMode.IN }
  };
}

const gridFilters = ref(createGridFilters());
const sortOrder = computed(() => (tableState.value.direction === 'desc' ? -1 : 1));
const selectedSendableCount = computed(() => selectedRows.value.filter((row) => row.allowed_actions?.includes('send_update')).length);
const queueSummaryItems = computed(() => [
  { label: 'In Scope', value: summary.value.queue_in_scope || 0 },
  { label: 'Sendable', value: (summary.value.ready || 0) + (summary.value.pushable_with_warnings || 0) },
  { label: 'Past Due', value: summary.value.past_due || 0 }
]);
const visibleCallMadeCount = computed(() => rows.value.filter((visit) => wasCallMade(visit)).length);
const visibleActionNeededCount = computed(() => rows.value.filter((visit) => resultNeedsAction(visit)).length);
const resultsSummaryItems = computed(() => [
  { label: 'Results', value: meta.value.total || 0 },
  { label: 'Calls Made', value: visibleCallMadeCount.value },
  { label: 'Action Needed', value: visibleActionNeededCount.value }
]);

const syncStatusOptions = [
  { label: 'Not Queued', value: 'not_ready' },
  { label: 'Ready to Send', value: 'ready' },
  { label: 'Submitted', value: 'sent' },
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

const dataQualityOptions = [
  { label: 'Ready', value: 'ready' },
  { label: 'Warnings', value: 'pushable_with_warnings' },
  { label: 'Blocked', value: 'blocked' }
];

function normalizeMultiValue(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return value ? [value] : [];
}

function defaultFiltersForTab(tab = activeTab.value) {
  if (tab === 'queue') {
    return {
      preset: queueMode.value === 'queue' ? 'queue' : null,
      customerId: null,
      projectId: null,
      syncStatuses: [],
      callStatuses: [],
      queueInScope: null,
      timingStates: [],
      dataQualities: [],
      readyToPush: null,
      search: searchDraft.value.trim()
    };
  }

  if (tab === 'results') {
    return {
      preset: null,
      customerId: null,
      projectId: null,
      syncStatuses: ['sent', 'needs_update', 'push_failed'],
      callStatuses: [],
      queueInScope: null,
      timingStates: [],
      dataQualities: [],
      readyToPush: null,
      search: searchDraft.value.trim()
    };
  }

  return {};
}

function syncStoreFiltersFromGrid(filterState = gridFilters.value, tab = activeTab.value) {
  const defaults = defaultFiltersForTab(tab);
  const syncStatuses = normalizeMultiValue(filterState.sync_status?.value);
  const callStatuses = normalizeMultiValue(filterState.call_status?.value);
  const dataQualities = normalizeMultiValue(filterState.data_quality?.value);

  store.updateFilters({
    ...defaults,
    customerId: filterState.customer_id?.value ?? null,
    projectId: filterState.project_id?.value ?? null,
    syncStatuses: syncStatuses.length > 0 ? syncStatuses : defaults.syncStatuses,
    callStatuses: callStatuses.length > 0 ? callStatuses : defaults.callStatuses,
    dataQualities: dataQualities.length > 0 ? dataQualities : defaults.dataQualities,
    search: searchDraft.value.trim()
  });
}

async function applyWorkspacePreset(tab = activeTab.value, options = {}) {
  if (options.resetSearch) {
    searchDraft.value = '';
  }

  if (options.resetGrid) {
    gridFilters.value = createGridFilters();
  }

  syncStoreFiltersFromGrid(gridFilters.value, tab);

  if (options.load !== false) {
    await store.refreshAll();
  }
}

function parseLocalDateTime(value) {
  if (!value) {
    return null;
  }

  const normalized = String(value).trim().replace('T', ' ');
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);

  if (!match) {
    return null;
  }

  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4] || 0),
    Number(match[5] || 0),
    Number(match[6] || 0)
  );
}

function pseudoNowInZone(timeZone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timeZone || 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(new Date())
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  return new Date(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
}

function shouldCallHaveHappened(visit) {
  const scheduledAt = parseLocalDateTime(visit.appointment?.scheduled_at_local || visit.appointment?.requested_datetime);
  const timeZone = visit.location?.timezone || visit.appointment?.timezone;

  if (!scheduledAt || !timeZone) {
    return false;
  }

  const threshold = new Date(scheduledAt.getTime() - 55 * 60 * 1000);
  return pseudoNowInZone(timeZone).getTime() >= threshold.getTime();
}

function wasCallMade(visit) {
  return Boolean(
    visit.call?.call_date ||
      ['completed', 'transferred', 'failed'].includes(visit.call?.call_status)
  );
}

function cleanSignalText(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return typeof value === 'string' ? value.trim() : String(value);
}

function smsStatusText(visit) {
  const sms = visit.call?.sms_sent;

  if (sms === null || sms === undefined || sms === '') {
    return '';
  }

  if (typeof sms === 'boolean') {
    return sms ? 'sent' : '';
  }

  return cleanSignalText(sms);
}

function hasSmsSignal(visit) {
  return Boolean(smsStatusText(visit));
}

function outcomeTone(visit) {
  const outcome = cleanSignalText(visit.call?.last_outcome).toLowerCase();
  const callStatus = cleanSignalText(visit.call?.call_status).toLowerCase();

  if (callStatus === 'failed') {
    return 'danger';
  }

  if (/(cancel|declin|unable|not going|resched|won't make|cannot make|can't make)/.test(outcome)) {
    return 'danger';
  }

  if (/(late|delay|running late)/.test(outcome)) {
    return 'warning';
  }

  if (/(on time|on-time|confirmed|will be on ?site|will be onsite|checked in|ready)/.test(outcome)) {
    return 'success';
  }

  if (callStatus === 'completed' || callStatus === 'transferred') {
    return 'info';
  }

  return 'muted';
}

function resultNeedsAction(visit) {
  return (shouldCallHaveHappened(visit) && !wasCallMade(visit)) || ['warning', 'danger'].includes(outcomeTone(visit));
}

function rowClass(data) {
  return {
    'call-operations-row-blocked': data.data_quality === 'blocked' || data.sync?.sync_status === 'push_failed',
    'call-operations-row-attention': activeTab.value === 'results' && resultNeedsAction(data)
  };
}

function pushedStateLabel(visit) {
  const status = visit.sync?.sync_status;

  if (status === 'sent' || status === 'needs_update') {
    return 'Yes';
  }

  if (status === 'push_failed') {
    return 'Failed';
  }

  return 'No';
}

function pushedStateCopy(visit) {
  const status = visit.sync?.sync_status;

  if (status === 'push_failed') {
    return visit.sync?.last_error || 'Push attempt failed';
  }

  if (status === 'sent') {
    return 'Submitted to DPROMPT';
  }

  if (status === 'needs_update') {
    return 'Submitted and needs update';
  }

  if (status === 'ready') {
    return 'Ready to send';
  }

  return 'Not pushed yet';
}

function eligibilityLabel(visit) {
  if (visit.ready_to_push && visit.data_quality === 'pushable_with_warnings') {
    return 'Yes, with warning';
  }

  return visit.ready_to_push ? 'Yes' : 'No';
}

function eligibilityCopy(visit) {
  const blockers = formatReadinessBlockers(visit);
  const warnings = formatReadinessWarnings(visit);

  if (blockers.length > 0) {
    return blockers.join(', ');
  }

  if (warnings.length > 0) {
    return warnings.join(', ');
  }

  return visit.ready_to_push ? 'Ready for push' : formatQueueScopeReason(visit.queue_scope_reason);
}

function resultSyncLabel(visit) {
  if (visit.sync?.sync_status === 'push_failed') {
    return 'Failed';
  }

  if (visit.sync?.sync_status === 'sent' || visit.sync?.sync_status === 'needs_update') {
    return 'Yes';
  }

  return 'No';
}

function shouldCallLabel(visit) {
  return shouldCallHaveHappened(visit) ? 'Due now' : 'Not yet';
}

function callWindowCopy(visit) {
  if (shouldCallHaveHappened(visit)) {
    return '55-65 minute reminder window is open';
  }

  return 'Waiting for reminder window';
}

function callMadeLabel(visit) {
  if (wasCallMade(visit)) {
    return 'Yes';
  }

  return shouldCallHaveHappened(visit) ? 'No' : 'Not yet';
}

function callMadeCopy(visit) {
  if (wasCallMade(visit)) {
    return visit.call?.call_date ? `Call logged ${formatTimestamp(visit.call.call_date)}` : 'Call outcome recorded';
  }

  if (shouldCallHaveHappened(visit)) {
    return 'Call should have been placed already';
  }

  return visit.call?.call_status === 'awaiting_call' ? 'Scheduled in DPROMPT' : 'Waiting for scheduled call window';
}

function outcomeLabel(visit) {
  if (visit.call?.last_outcome) {
    return cleanSignalText(visit.call.last_outcome);
  }

  if (visit.call?.call_status === 'awaiting_call') {
    return 'Scheduled';
  }

  if (visit.call?.call_status === 'unknown') {
    return shouldCallHaveHappened(visit) ? 'No result yet' : 'Waiting for call window';
  }

  return formatCallStatus(visit.call?.call_status);
}

function outcomeHeading(visit) {
  if (shouldCallHaveHappened(visit) && !wasCallMade(visit)) {
    return 'Action needed';
  }

  const tone = outcomeTone(visit);

  if (tone === 'danger' || tone === 'warning') {
    return 'Action needed';
  }

  if (tone === 'success') {
    return 'Tech confirmed';
  }

  if (wasCallMade(visit)) {
    return 'Call result';
  }

  return visit.call?.call_status === 'awaiting_call' ? 'Awaiting call' : 'No result yet';
}

function outcomeCopy(visit) {
  if (visit.call?.retell_call_id) {
    return `Call ID ${cleanSignalText(visit.call.retell_call_id)}`;
  }

  if (visit.call?.call_transfer) {
    return cleanSignalText(visit.call.call_transfer);
  }

  if (visit.call?.call_date) {
    return `Call logged ${formatTimestamp(visit.call.call_date)}`;
  }

  return visit.sync?.last_status_sync_at ? `Synced ${formatTimestamp(visit.sync.last_status_sync_at)}` : 'Open details for full history';
}

function pushPillClass(visit) {
  const status = visit.sync?.sync_status;

  if (status === 'push_failed') {
    return 'call-operations-pill call-operations-pill--danger';
  }

  if (status === 'sent' || status === 'needs_update') {
    return 'call-operations-pill call-operations-pill--success';
  }

  if (status === 'ready') {
    return 'call-operations-pill call-operations-pill--info';
  }

  return 'call-operations-pill call-operations-pill--muted';
}

function eligibilityPillClass(visit) {
  if (visit.ready_to_push && visit.data_quality === 'pushable_with_warnings') {
    return 'call-operations-pill call-operations-pill--warning';
  }

  if (visit.ready_to_push) {
    return 'call-operations-pill call-operations-pill--success';
  }

  return 'call-operations-pill call-operations-pill--danger';
}

function callWindowPillClass(visit) {
  return shouldCallHaveHappened(visit)
    ? 'call-operations-pill call-operations-pill--warning'
    : 'call-operations-pill call-operations-pill--muted';
}

function callMadeStateClass(visit) {
  if (wasCallMade(visit)) {
    return 'call-operations-call-state__value call-operations-call-state__value--success';
  }

  if (shouldCallHaveHappened(visit)) {
    return 'call-operations-call-state__value call-operations-call-state__value--danger';
  }

  if (visit.call?.call_status === 'awaiting_call') {
    return 'call-operations-call-state__value call-operations-call-state__value--warning';
  }

  return 'call-operations-call-state__value call-operations-call-state__value--muted';
}

function outcomeCardClass(visit) {
  const tone = outcomeTone(visit);

  if (tone === 'danger') {
    return 'call-operations-outcome call-operations-outcome--danger';
  }

  if (tone === 'warning') {
    return 'call-operations-outcome call-operations-outcome--warning';
  }

  if (tone === 'success') {
    return 'call-operations-outcome call-operations-outcome--success';
  }

  if (tone === 'info') {
    return 'call-operations-outcome call-operations-outcome--info';
  }

  return 'call-operations-outcome call-operations-outcome--muted';
}

function formatTimestamp(value) {
  if (!value) {
    return 'No timestamp';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

function showToast(severity, summaryText, detail, life = 4000) {
  toast.add({
    severity,
    summary: summaryText,
    detail,
    life
  });
}

async function refreshAll() {
  try {
    await store.refreshAll();
  } catch (loadError) {
    showToast('error', 'Refresh failed', loadError.message || 'Unable to refresh dispatch call operations.');
  }
}

async function applySearch() {
  try {
    tableState.value.page = 1;
    await applyWorkspacePreset(activeTab.value);
  } catch (searchError) {
    showToast('error', 'Search failed', searchError.message || 'Unable to apply the current search.');
  }
}

async function handleDateChange() {
  tableState.value.page = 1;
  await refreshAll();
}

async function handleQueueModeChange(nextMode) {
  queueMode.value = nextMode || queueMode.value;
  await applyWorkspacePreset('queue', { resetGrid: true });
}

async function clearWorkspaceFilters() {
  try {
    await applyWorkspacePreset(activeTab.value, { resetSearch: true, resetGrid: true });
  } catch (clearError) {
    showToast('error', 'Reset failed', clearError.message || 'Unable to clear the current filters.');
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

    if (nextTab === 'testing') {
      return;
    }

    await applyWorkspacePreset(nextTab, { resetSearch: true, resetGrid: true });
  } catch (tabError) {
    showToast('error', 'Tab load failed', tabError.message || 'Unable to load the selected workspace.');
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
    showToast('error', 'Sort failed', sortError.message || 'Unable to sort the current workspace.');
  }
}

async function openDetail(visit) {
  try {
    drawerVisible.value = true;
    await Promise.all([store.loadVisitDetail(visit.visit_id), store.loadVisitActivity(visit.visit_id)]);
  } catch (detailError) {
    drawerVisible.value = false;
    showToast('error', 'Detail failed', detailError.message || 'Unable to load visit detail.');
  }
}

async function sendSingle(visit) {
  try {
    if (!confirmPastDueSend([visit])) {
      return;
    }

    const response = await store.sendVisit(visit.visit_id, false);
    showToast('success', 'Visit sent', response.message || 'Visit was sent to DPROMPT.', 3000);
  } catch (sendError) {
    showToast('error', 'Send failed', sendError.message || 'Unable to send the selected visit.', 4500);
  }
}

async function sendSelected() {
  try {
    if (!confirmPastDueSend(selectedRows.value)) {
      return;
    }

    const response = await store.sendSelected(false);
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

async function refreshStatuses(payload = null) {
  try {
    const response = await store.refreshStatuses(payload);
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

function confirmPastDueSend(visits) {
  const lateCount = visits.filter(
    (visit) => visit?.allowed_actions?.includes('send_update') && visit?.timing_state === 'past_due'
  ).length;

  if (lateCount === 0) {
    return true;
  }

  return window.confirm(
    `${lateCount} selected visit${lateCount === 1 ? '' : 's'} ${lateCount === 1 ? 'is' : 'are'} past due in the site timezone. Send / Update anyway?`
  );
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

function openVisit(visit) {
  router.push(`/field-services/visit/${visit.visit_id}`);
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
  activeTab.value = 'queue';
  await applyWorkspacePreset('queue', { resetSearch: true, resetGrid: true });
});
</script>

<style scoped>
.call-operations-view {
  @apply space-y-4 p-4 lg:p-5;
}

.call-operations-header {
  @apply flex flex-col gap-4 rounded-[1.4rem] border border-surface-200 bg-white px-5 py-4 shadow-sm dark:border-surface-800 dark:bg-surface-950 lg:flex-row lg:items-end lg:justify-between;
}

.call-operations-header__eyebrow {
  @apply text-[0.7rem] uppercase tracking-[0.26em] text-surface-500 dark:text-surface-400;
}

.call-operations-header__title {
  @apply mt-1 text-2xl font-semibold text-surface-950 dark:text-surface-0;
}

.call-operations-header__actions {
  @apply flex flex-wrap items-center gap-2;
}

.call-operations-shell {
  @apply overflow-hidden rounded-[1.4rem] border border-surface-200 bg-white shadow-sm dark:border-surface-800 dark:bg-surface-950;
}

.call-operations-tabs__nav {
  @apply border-b border-surface-200 px-5 pt-4 dark:border-surface-800;
}

.call-operations-workspace {
  @apply space-y-3 px-5 py-4;
}

.call-operations-workspace--testing {
  @apply p-5;
}

.call-operations-workspace__toolbar {
  @apply flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between;
}

.call-operations-workspace__tools,
.call-operations-workspace__actions {
  @apply flex flex-wrap items-center gap-2;
}

.call-operations-search {
  @apply min-w-[18rem];
}

.call-operations-inline-note {
  @apply text-sm text-surface-500 dark:text-surface-400;
}

.call-operations-summary-row {
  @apply grid gap-2 md:grid-cols-3;
}

.call-operations-summary-card {
  @apply rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 dark:border-surface-800 dark:bg-surface-900;
}

.call-operations-summary-card__label {
  @apply block text-[0.68rem] uppercase tracking-[0.18em] text-surface-500 dark:text-surface-400;
}

.call-operations-summary-card__value {
  @apply mt-2 block text-2xl font-semibold text-surface-950 dark:text-surface-0;
}

.call-operations-empty {
  @apply py-14 text-center;
}

.call-operations-empty__title {
  @apply text-base font-medium text-surface-800 dark:text-surface-200;
}

.call-operations-empty__subtitle {
  @apply mt-2 text-sm text-surface-500 dark:text-surface-400;
}

.call-operations-pill {
  @apply inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold;
}

.call-operations-pill--muted {
  @apply bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-200;
}

.call-operations-pill--info {
  @apply bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200;
}

.call-operations-pill--success {
  @apply bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200;
}

.call-operations-pill--warning {
  @apply bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200;
}

.call-operations-pill--danger {
  @apply bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200;
}

.call-operations-call-state {
  @apply space-y-1;
}

.call-operations-call-state__value {
  @apply text-lg font-semibold leading-none;
}

.call-operations-call-state__value--success {
  @apply text-emerald-700 dark:text-emerald-300;
}

.call-operations-call-state__value--warning {
  @apply text-amber-700 dark:text-amber-300;
}

.call-operations-call-state__value--danger {
  @apply text-rose-700 dark:text-rose-300;
}

.call-operations-call-state__value--muted {
  @apply text-surface-700 dark:text-surface-200;
}

.call-operations-call-state__copy {
  @apply text-xs text-surface-500 dark:text-surface-400;
}

.call-operations-call-state__meta {
  @apply text-xs font-medium text-surface-700 dark:text-surface-200;
}

.call-operations-outcome {
  @apply space-y-1 rounded-2xl border px-3 py-2.5;
}

.call-operations-outcome__eyebrow {
  @apply text-[0.62rem] font-semibold uppercase tracking-[0.18em];
}

.call-operations-outcome__value {
  @apply text-sm font-semibold leading-5;
}

.call-operations-outcome__meta {
  @apply text-xs text-surface-600 dark:text-surface-400;
}

.call-operations-outcome--muted {
  @apply border-surface-200 bg-surface-50 text-surface-900 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-0;
}

.call-operations-outcome--info {
  @apply border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/20 dark:text-sky-100;
}

.call-operations-outcome--success {
  @apply border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-100;
}

.call-operations-outcome--warning {
  @apply border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100;
}

.call-operations-outcome--danger {
  @apply border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-100;
}

:deep(.call-operations-tabs .p-tabpanels) {
  @apply p-0;
}

:deep(.call-operations-grid .p-datatable-thead > tr > th) {
  @apply bg-surface-50 text-[0.68rem] uppercase tracking-[0.16em] text-surface-500 dark:bg-surface-900 dark:text-surface-400;
}

:deep(.call-operations-grid .p-datatable-table-container) {
  @apply border-x-0;
}

:deep(.call-operations-grid .p-paginator) {
  @apply border-x-0 border-b-0 px-0;
}

:deep(.call-operations-grid .p-datatable-tbody > tr.call-operations-row-blocked) {
  @apply bg-rose-50/60 dark:bg-rose-950/10;
}

:deep(.call-operations-grid .p-datatable-tbody > tr.call-operations-row-attention) {
  @apply bg-amber-50/60 dark:bg-amber-950/10;
}
</style>
