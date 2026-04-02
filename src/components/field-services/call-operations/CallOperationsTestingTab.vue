<template>
  <div class="call-operations-testing">
    <Message v-if="error" severity="error" variant="outlined" :closable="false">
      {{ error }}
    </Message>

    <section class="call-operations-testing__shell">
      <div class="call-operations-testing__form-bar">
        <Message v-if="draftMissingFields.length" :severity="draftStateSeverity" variant="outlined" :closable="false" class="flex-1">
          {{ draftStateMessage }}
        </Message>
        <div class="call-operations-testing__form-actions">
          <Button icon="pi pi-times" text label="Clear" :disabled="actionLoading" @click="resetForm(true)" />
          <Button
            icon="pi pi-save"
            :label="isEditingExisting ? 'Update Draft' : 'Save Draft'"
            outlined
            :loading="actionLoading"
            @click="submitForm(false)"
          />
          <Button
            icon="pi pi-send"
            :label="isEditingExisting ? 'Update & Send' : 'Send Test'"
            :loading="actionLoading"
            @click="submitForm(true)"
          />
        </div>
      </div>

      <div class="call-operations-testing__presets">
        <p class="call-operations-testing__presets-hint">Quick fill — pick a preset to auto-populate the fields below, or type values directly.</p>
        <div class="call-operations-testing__presets-row">
          <div class="call-operations-testing__pfield">
            <label class="call-operations-testing__label" for="test-scenario">Scenario</label>
            <Select
              id="test-scenario"
              v-model="form.scenario_preset"
              :options="scenarioOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              @update:modelValue="handleScenarioChange"
            />
          </div>

          <div class="call-operations-testing__pfield">
            <label class="call-operations-testing__label" for="test-tech-preset">Technician</label>
            <Select
              id="test-tech-preset"
              v-model="form.technician_preset"
              :options="technicianPresetOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              @update:modelValue="handleTechnicianChange"
            />
          </div>

          <div class="call-operations-testing__pfield">
            <label class="call-operations-testing__label" for="test-location-preset">Location</label>
            <Select
              id="test-location-preset"
              v-model="form.location_preset"
              :options="locationPresetOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              @update:modelValue="handleLocationChange"
            />
          </div>
        </div>
      </div>

      <div class="call-operations-testing__fields">
        <div class="call-operations-testing__row3">
          <div class="call-operations-testing__fld">
            <label class="call-operations-testing__label" for="test-visit-day">Visit Day</label>
            <Select
              id="test-visit-day"
              v-model="form.visit_day_preset"
              :options="visitDayOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              @update:modelValue="handleVisitDayChange"
            />
          </div>

          <div class="call-operations-testing__fld">
            <label class="call-operations-testing__label" for="test-visit-time">Visit Time</label>
            <InputText
              id="test-visit-time"
              v-model.trim="form.visit_time"
              placeholder="11:45 PM"
              class="w-full"
              @blur="normalizeTimeField"
            />
          </div>

          <div class="call-operations-testing__fld">
            <label class="call-operations-testing__label" for="test-timezone">Timezone</label>
            <Select
              id="test-timezone"
              v-model="form.timezone"
              :options="timezoneOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              @update:modelValue="handleTimezoneChange"
            />
          </div>
        </div>

        <div class="call-operations-testing__row3">
          <div class="call-operations-testing__fld">
            <label class="call-operations-testing__label" for="test-tech-name">Tech Name</label>
            <InputText id="test-tech-name" v-model.trim="form.tech_name" placeholder="Test Technician" class="w-full" />
          </div>

          <div class="call-operations-testing__fld">
            <label class="call-operations-testing__label" for="test-tech-phone">Tech Phone</label>
            <InputText id="test-tech-phone" v-model.trim="form.tech_phone" placeholder="+19495551212" class="w-full" />
          </div>

          <div class="call-operations-testing__fld">
            <label class="call-operations-testing__label" for="test-location-name">Location Name</label>
            <InputText id="test-location-name" v-model.trim="form.location_name" placeholder="Fake Store 001" class="w-full" />
          </div>
        </div>

        <div class="call-operations-testing__fld">
          <label class="call-operations-testing__label" for="test-address">Address</label>
          <InputText id="test-address" v-model.trim="form.address" placeholder="123 Test Ave, Los Angeles, CA 90001" class="w-full" />
        </div>

        <div class="call-operations-testing__fld">
          <label class="call-operations-testing__label" for="test-tools">Tools Required</label>
          <Textarea
            id="test-tools"
            v-model="form.tools_required"
            autoResize
            rows="2"
            placeholder="Laptop, console cable, cable tester"
            class="w-full"
          />
        </div>
      </div>

      <Fieldset legend="Advanced" toggleable :collapsed="true" class="call-operations-testing__advanced">
        <div class="call-operations-testing__row3" style="margin-bottom: 1rem;">
          <div class="call-operations-testing__fld">
            <label class="call-operations-testing__label" for="test-label">Label</label>
            <InputText id="test-label" v-model.trim="form.label" placeholder="Sandbox smoke test" class="w-full" />
          </div>

          <div class="call-operations-testing__fld">
            <label class="call-operations-testing__label" for="test-company">Company</label>
            <InputText id="test-company" v-model.trim="form.company" placeholder="CIS" class="w-full" />
          </div>

          <div class="call-operations-testing__fld">
            <label class="call-operations-testing__label" for="test-work-order">Work Order</label>
            <InputText id="test-work-order" v-model.trim="form.work_order" placeholder="Optional" class="w-full" />
          </div>
        </div>

        <div class="call-operations-testing__row3" style="margin-bottom: 1rem;">
          <div class="call-operations-testing__fld">
            <label class="call-operations-testing__label" for="test-client-system-id">Client System ID</label>
            <InputText
              id="test-client-system-id"
              v-model.trim="form.client_system_id"
              :disabled="isEditingExisting"
              placeholder="Auto-generated"
              class="w-full"
            />
          </div>
        </div>

        <div class="call-operations-testing__fld">
          <label class="call-operations-testing__label" for="test-notes">Notes</label>
          <Textarea
            id="test-notes"
            v-model="form.notes"
            autoResize
            rows="2"
            placeholder="Optional debug notes"
            class="w-full"
          />
        </div>
      </Fieldset>
    </section>

    <section class="call-operations-testing__shell">
      <div class="call-operations-testing__grid-toolbar">
        <InputText
          v-model.trim="filterDraft.search"
          class="w-full md:w-72"
          placeholder="Search test calls"
          @keyup.enter="applyFilters"
        />
        <Button icon="pi pi-filter-slash" text rounded @click="clearFilters" v-tooltip.top="'Reset filters'" />
        <SplitButton
          icon="pi pi-refresh"
          label="Refresh"
          :loading="loadingRows"
          @click="refreshRows"
          :model="[{ label: 'Refresh Status', icon: 'pi pi-sync', command: () => refreshStatuses() }]"
          outlined
          size="small"
        />
      </div>

      <DataTable
        v-model:filters="gridFilters"
        :value="rows"
        dataKey="id"
        lazy
        paginator
        filterDisplay="menu"
        :rows="tableState.perPage"
        :first="(tableState.page - 1) * tableState.perPage"
        :totalRecords="meta.total"
        :rowsPerPageOptions="[10, 25, 50]"
        :loading="loadingRows"
        scrollable
        scrollHeight="34rem"
        rowHover
        responsiveLayout="scroll"
        size="small"
        class="call-operations-testing__grid"
        :rowClass="rowClass"
        @page="handlePage"
        @row-click="handleRowClick"
      >
        <template #empty>
          <div class="call-operations-testing__empty">
            <div class="call-operations-testing__empty-title">No test calls found</div>
            <div class="call-operations-testing__empty-copy">
              Create a test call above or clear the current filters.
            </div>
          </div>
        </template>

        <Column field="client_system_id" header="Test Call" :style="{ minWidth: '18rem' }">
          <template #body="{ data }">
            <div class="space-y-1">
              <div class="font-semibold text-primary-600">{{ data.client_system_id || `Test #${data.id}` }}</div>
              <div class="text-sm text-surface-900 dark:text-surface-0">{{ data.label || 'Untitled test call' }}</div>
              <div class="text-xs text-surface-500 dark:text-surface-400">{{ formatLocationDisplay(data.location?.name, data.location?.address) || 'No address' }}</div>
            </div>
          </template>
        </Column>

        <Column field="appointment.visit_date" header="Schedule" :style="{ minWidth: '12rem' }">
          <template #body="{ data }">
            <div class="space-y-1">
              <div class="font-medium text-surface-900 dark:text-surface-0">{{ data.appointment?.visit_date || 'No date' }}</div>
              <div class="text-sm text-surface-600 dark:text-surface-400">{{ data.appointment?.visit_time || 'No time' }} · {{ data.appointment?.timezone || '' }}</div>
            </div>
          </template>
        </Column>

        <Column
          header="Status"
          filterField="sync_status"
          :showFilterMatchModes="false"
          :showFilterOperator="false"
          :showAddButton="false"
          :style="{ minWidth: '14rem' }"
        >
          <template #body="{ data }">
            <div class="space-y-1">
              <span :class="unifiedStatusPillClass(data)">{{ unifiedStatusLabel(data) }}</span>
              <div class="text-xs text-surface-500 dark:text-surface-400">{{ unifiedStatusDetail(data) }}</div>
            </div>
          </template>
          <template #filter="{ filterModel }">
            <MultiSelect
              v-model="filterModel.value"
              :options="syncStatusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Any status"
              :maxSelectedLabels="1"
              class="w-full"
            />
          </template>
        </Column>

        <Column header="" :style="{ minWidth: '8rem' }">
          <template #body="{ data }">
            <div class="flex items-center gap-1">
              <Button icon="pi pi-pencil" text rounded size="small" @click.stop="loadCallIntoForm(data, true)" v-tooltip.top="'Edit'" />
              <Button
                icon="pi pi-send"
                text
                rounded
                size="small"
                :disabled="!data.allowed_actions?.includes('send_update') || actionLoading"
                @click.stop="sendCall(data)"
                v-tooltip.top="'Send'"
              />
              <Button
                icon="pi pi-trash"
                text
                rounded
                size="small"
                severity="danger"
                :disabled="actionLoading"
                @click.stop="confirmDelete(data)"
                v-tooltip.top="'Delete'"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </section>

    <CallOperationsTestDetailDrawer
      v-model:visible="timelineVisible"
      :testCall="selectedCall"
      :events="selectedTestCallActivity"
      :loading="loadingTimeline"
      @refresh="refreshTimeline"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import CallOperationsTestDetailDrawer from '@/components/field-services/call-operations/CallOperationsTestDetailDrawer.vue';
import { useCallOperationsTestStore } from '@/stores/callOperationsTestStore';
import { formatToolsText } from '@/utils/callOperations';

const DEFAULT_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';
const DEFAULT_COMPANY = 'CIS';
const DEFAULT_TOOLS = 'Laptop, console cable, cable tester';


const scenarioOptions = [
  {
    label: 'Smoke Test',
    value: 'smoke',
    resolvedLabel: 'Sandbox Smoke Test',
    tools: 'Laptop, console cable, cable tester',
    notes: 'Baseline DPROMPT smoke test for send and status tracking.'
  },
  {
    label: 'Arrival Reminder',
    value: 'arrival',
    resolvedLabel: 'Arrival Reminder Test',
    tools: 'Laptop, charger, patch cable',
    notes: 'Use this to validate pre-arrival reminder messaging.'
  },
  {
    label: 'Tools Confirmation',
    value: 'tools',
    resolvedLabel: 'Tools Confirmation Test',
    tools: 'Ladder, cable tester, console cable',
    notes: 'Focused on verifying the tools-required branch of the call.'
  },
  {
    label: 'Status Loop',
    value: 'status',
    resolvedLabel: 'Status Loop Verification',
    tools: 'Laptop, hotspot, label maker',
    notes: 'Used to validate the refresh and reconciliation loop.'
  },
  {
    label: 'Transfer Flow',
    value: 'transfer',
    resolvedLabel: 'Transfer Flow Test',
    tools: 'Laptop, console cable, cell phone',
    notes: 'Use this when testing transfer behavior and follow-up updates.'
  }
];

const visitDayOptions = [
  { label: 'Today', value: 'today', offsetDays: 0 },
  { label: 'Tomorrow', value: 'tomorrow', offsetDays: 1 },
  { label: 'In 2 days', value: 'plus2', offsetDays: 2 },
  { label: 'In 3 days', value: 'plus3', offsetDays: 3 }
];

const timezoneOptions = [
  { label: 'Pacific · America/Los_Angeles', value: 'America/Los_Angeles' },
  { label: 'Arizona · America/Phoenix', value: 'America/Phoenix' },
  { label: 'Central · America/Chicago', value: 'America/Chicago' },
  { label: 'Mountain · America/Denver', value: 'America/Denver' },
  { label: 'Eastern · America/New_York', value: 'America/New_York' }
];

const technicianPresetOptions = [
  { label: 'Billy Bob', value: 'billy', resolvedValue: 'Billy Bob', resolvedPhone: '+19495551212' },
  { label: 'Dispatch QA Alpha', value: 'qa_alpha', resolvedValue: 'Dispatch QA Alpha', resolvedPhone: '+16025550114' },
  { label: 'Dispatch QA Bravo', value: 'qa_bravo', resolvedValue: 'Dispatch QA Bravo', resolvedPhone: '+12145550119' },
  { label: 'Dispatch QA Charlie', value: 'qa_charlie', resolvedValue: 'Dispatch QA Charlie', resolvedPhone: '+13125550118' },
  { label: 'Dispatch QA Delta', value: 'qa_delta', resolvedValue: 'Dispatch QA Delta', resolvedPhone: '+19175550117' }
];

const locationPresetOptions = [
  {
    label: '123 Test Ave, Los Angeles, CA 90001',
    value: 'la_lab',
    resolvedName: 'Fake Store LA 001',
    resolvedAddress: '123 Test Ave, Los Angeles, CA 90001',
    timezone: 'America/Los_Angeles'
  },
  {
    label: '456 Desert Loop, Phoenix, AZ 85004',
    value: 'phx_sandbox',
    resolvedName: 'Fake Store PHX 014',
    resolvedAddress: '456 Desert Loop, Phoenix, AZ 85004',
    timezone: 'America/Phoenix'
  },
  {
    label: '789 Switchyard Rd, Dallas, TX 75201',
    value: 'dallas_staging',
    resolvedName: 'Fake Store DAL 021',
    resolvedAddress: '789 Switchyard Rd, Dallas, TX 75201',
    timezone: 'America/Chicago'
  },
  {
    label: '101 Grid Ave, Chicago, IL 60601',
    value: 'chicago_loop',
    resolvedName: 'Fake Store CHI 008',
    resolvedAddress: '101 Grid Ave, Chicago, IL 60601',
    timezone: 'America/Chicago'
  },
  {
    label: '202 Signal St, New York, NY 10018',
    value: 'ny_midtown',
    resolvedName: 'Fake Store NYC 003',
    resolvedAddress: '202 Signal St, New York, NY 10018',
    timezone: 'America/New_York'
  }
];

const syncStatusOptions = [
  { label: 'Not Ready', value: 'not_ready' },
  { label: 'Ready', value: 'ready' },
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

const toast = useToast();
const store = useCallOperationsTestStore();

const timelineVisible = ref(false);
const form = ref(createDefaultForm());
const filterDraft = ref(createFilterDraft());
const gridFilters = ref({
  sync_status: { value: null, matchMode: FilterMatchMode.IN }
});

const rows = computed(() => store.rows);
const meta = computed(() => store.meta);
const error = computed(() => store.error);
const loadingRows = computed(() => store.loadingRows);
const loadingDetail = computed(() => store.loadingDetail);
const loadingActivity = computed(() => store.loadingActivity);
const actionLoading = computed(() => store.actionLoading);
const tableState = computed(() => store.tableState);
const selectedCall = computed(() => store.selectedTestCall);
const selectedTestCallActivity = computed(() => store.selectedTestCallActivity);
const loadingTimeline = computed(() => loadingActivity.value || (timelineVisible.value && loadingDetail.value));
const isEditingExisting = computed(() => Boolean(form.value.id));
const draftMissingFields = computed(() => {
  const missing = [];

  if (!form.value.tech_name || !form.value.tech_phone) {
    missing.push('technician contact');
  }

  if (!form.value.visit_date || !normalizeTime(form.value.visit_time) || !form.value.timezone) {
    missing.push('schedule');
  }

  if (!form.value.address || !form.value.location_name) {
    missing.push('location');
  }

  return missing;
});
const draftStateSeverity = computed(() => (draftMissingFields.value.length === 0 ? 'success' : 'warn'));
const draftStateMessage = computed(() =>
  draftMissingFields.value.length === 0
    ? 'This draft has the core fields needed to create and send a sandbox test call.'
    : `Missing: ${draftMissingFields.value.join(', ')}`
);
function createFilterDraft() {
  return {
    search: '',
    syncStatuses: [],
    callStatuses: []
  };
}

function findPreset(options, value) {
  return options.find((option) => option.value === value) || null;
}

function createDefaultForm() {
  const nextForm = {
    id: null,
    manual_overrides: false,
    scenario_preset: 'smoke',
    visit_day_preset: 'today',
    technician_preset: 'billy',
    location_preset: 'la_lab',
    label: '',
    notes: '',
    tech_name: '',
    tech_phone: '',
    visit_date: formatDateInput(new Date(), DEFAULT_TIMEZONE),
    visit_time: formatTimeInput(addMinutes(new Date(), 60), DEFAULT_TIMEZONE),
    timezone: DEFAULT_TIMEZONE,
    location_name: '',
    address: '',
    company: DEFAULT_COMPANY,
    work_order: '',
    tools_required: DEFAULT_TOOLS,
    client_system_id: ''
  };

  applyScenarioPreset(nextForm.scenario_preset, nextForm);
  applyTechnicianPreset(nextForm.technician_preset, nextForm);
  applyLocationPreset(nextForm.location_preset, nextForm);
  applyScheduledFields(nextForm);

  return nextForm;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function formatDateInput(date, timeZone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function formatTimeInput(date, timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

function normalizeTime(value) {
  const rawValue = String(value || '').trim();

  if (!rawValue) {
    return '';
  }

  const meridiemMatch = rawValue.match(/^(\d{1,2}):(\d{2})\s*([ap]m)$/i);

  if (meridiemMatch) {
    let hour = Number(meridiemMatch[1]);
    const minute = meridiemMatch[2];
    const meridiem = meridiemMatch[3].toUpperCase();

    if (hour === 0) {
      hour = 12;
    } else if (hour > 12) {
      hour = ((hour - 1) % 12) + 1;
    }

    return `${hour}:${minute} ${meridiem}`;
  }

  const twentyFourHourMatch = rawValue.match(/^(\d{1,2}):(\d{2})$/);

  if (twentyFourHourMatch) {
    let hour = Number(twentyFourHourMatch[1]);
    const minute = twentyFourHourMatch[2];
    const meridiem = hour >= 12 ? 'PM' : 'AM';
    hour %= 12;
    hour = hour || 12;
    return `${hour}:${minute} ${meridiem}`;
  }

  return rawValue;
}

function normalizeTimeField() {
  form.value.visit_time = normalizeTime(form.value.visit_time);
}

function applyScheduledFields(targetForm) {
  const dayPreset = findPreset(visitDayOptions, targetForm.visit_day_preset);

  if (!dayPreset) {
    return;
  }

  const scheduledAt = addDays(new Date(), dayPreset.offsetDays);
  targetForm.visit_date = formatDateInput(scheduledAt, targetForm.timezone || DEFAULT_TIMEZONE);
}

function applyScenarioPreset(presetValue, targetForm = form.value) {
  const preset = findPreset(scenarioOptions, presetValue);

  if (!preset) {
    return;
  }

  targetForm.label = preset.resolvedLabel;
  targetForm.tools_required = preset.tools;
  targetForm.notes = preset.notes;
}

function applyTechnicianPreset(presetValue, targetForm = form.value) {
  const preset = findPreset(technicianPresetOptions, presetValue);

  if (!preset) {
    return;
  }

  targetForm.tech_name = preset.resolvedValue;
  targetForm.tech_phone = preset.resolvedPhone || '';
}

function applyLocationPreset(presetValue, targetForm = form.value) {
  const preset = findPreset(locationPresetOptions, presetValue);

  if (!preset) {
    return;
  }

  targetForm.location_name = preset.resolvedName;
  targetForm.address = preset.resolvedAddress;
  targetForm.timezone = preset.timezone;
}

function formatLocationDisplay(name, address) {
  return [address, name].filter(Boolean).join(' · ');
}

function buildPayload(sendNow) {
  return {
    label: form.value.label || null,
    notes: form.value.notes || null,
    tech_name: form.value.tech_name || null,
    tech_phone: form.value.tech_phone || null,
    visit_date: form.value.visit_date || null,
    visit_time: normalizeTime(form.value.visit_time) || null,
    timezone: form.value.timezone || null,
    location_name: form.value.location_name || null,
    address: form.value.address || null,
    company: form.value.company || DEFAULT_COMPANY,
    work_order: form.value.work_order || null,
    tools_required: form.value.tools_required || null,
    send_now: sendNow,
    client_system_id: !form.value.id ? form.value.client_system_id || null : undefined
  };
}

function populateForm(testCall) {
  if (!testCall) {
    return;
  }

  form.value = {
    id: testCall.id || null,
    manual_overrides: true,
    scenario_preset: 'smoke',
    visit_day_preset: 'today',
    technician_preset: 'nate',
    location_preset: 'la_lab',
    label: testCall.label || '',
    notes: testCall.notes || '',
    tech_name: testCall.technician?.name || '',
    tech_phone: testCall.technician?.phone || '',
    visit_date: testCall.appointment?.visit_date || '',
    visit_time: normalizeTime(testCall.appointment?.visit_time || ''),
    timezone: testCall.appointment?.timezone || DEFAULT_TIMEZONE,
    location_name: testCall.location?.name || '',
    address: testCall.location?.address || '',
    company: testCall.company || DEFAULT_COMPANY,
    work_order: testCall.work_order || '',
    tools_required: formatToolsText(testCall.tools?.resolved || '') || '',
    client_system_id: testCall.client_system_id || ''
  };

}

function unifiedStatusLabel(call) {
  const syncStatus = call.sync?.sync_status;
  const callStatus = call.call?.call_status;

  if (syncStatus === 'push_failed') return 'Push Failed';
  if (callStatus === 'completed') return 'Completed';
  if (callStatus === 'transferred') return 'Transferred';
  if (callStatus === 'failed') return 'Call Failed';
  if (syncStatus === 'sent' || syncStatus === 'needs_update') {
    return callStatus === 'awaiting_call' ? 'Awaiting Call' : 'Sent';
  }
  if (syncStatus === 'ready') return 'Ready';
  return 'Draft';
}

function unifiedStatusDetail(call) {
  const syncStatus = call.sync?.sync_status;

  if (syncStatus === 'push_failed') return call.sync?.last_error || 'Push attempt failed';
  if (call.call?.last_outcome) return call.call.last_outcome;
  if (call.call?.retell_call_id) return `Call ID ${call.call.retell_call_id}`;
  if (syncStatus === 'sent' || syncStatus === 'needs_update') return call.sync?.last_pushed_at || 'Submitted';
  if (syncStatus === 'ready') return 'Ready to send';
  return 'Not sent yet';
}

function unifiedStatusPillClass(call) {
  const syncStatus = call.sync?.sync_status;
  const callStatus = call.call?.call_status;

  if (syncStatus === 'push_failed' || callStatus === 'failed') {
    return 'call-operations-testing__pill call-operations-testing__pill--danger';
  }
  if (callStatus === 'completed' || callStatus === 'transferred') {
    return 'call-operations-testing__pill call-operations-testing__pill--success';
  }
  if (syncStatus === 'sent' || syncStatus === 'needs_update') {
    return 'call-operations-testing__pill call-operations-testing__pill--info';
  }
  return 'call-operations-testing__pill call-operations-testing__pill--muted';
}

function syncFilterDraft() {
  filterDraft.value = {
    search: store.filters.search,
    syncStatuses: [...store.filters.syncStatuses],
    callStatuses: [...store.filters.callStatuses]
  };
}

function showToast(severity, summary, detail, life = 4000) {
  toast.add({
    severity,
    summary,
    detail,
    life
  });
}

async function refreshRows() {
  try {
    await store.loadRows();
  } catch (refreshError) {
    showToast('error', 'Refresh failed', refreshError.message || 'Unable to refresh sandbox test calls.');
  }
}

async function applyFilters() {
  try {
    store.updateFilters({
      search: filterDraft.value.search,
      syncStatuses: [...filterDraft.value.syncStatuses],
      callStatuses: [...filterDraft.value.callStatuses],
      queueInScope: null,
      timingStates: [],
      dataQualities: [],
      readyToPush: null
    });
    await store.loadRows();
  } catch (filterError) {
    showToast('error', 'Filters failed', filterError.message || 'Unable to apply sandbox filters.');
  }
}

async function clearFilters() {
  try {
    store.clearFilters();
    syncFilterDraft();
    await store.loadRows();
  } catch (clearError) {
    showToast('error', 'Clear failed', clearError.message || 'Unable to clear sandbox filters.');
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
    showToast('error', 'Pagination failed', pageError.message || 'Unable to load the requested test-call page.');
  }
}

async function openDetails(call) {
  try {
    await Promise.all([store.loadDetail(call.id), store.loadActivity(call.id)]);
    timelineVisible.value = true;
  } catch (detailError) {
    showToast('error', 'Detail failed', detailError.message || 'Unable to load the selected test call.');
  }
}

async function handleRowClick(event) {
  const target = event.originalEvent?.target;

  if (target?.closest('button') || target?.closest('a')) {
    return;
  }

  await openDetails(event.data);
}

async function loadCallIntoForm(call, scrollToTop) {
  try {
    await store.loadDetail(call.id);
    populateForm(store.selectedTestCall || call);

    if (scrollToTop) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  } catch (detailError) {
    showToast('error', 'Edit failed', detailError.message || 'Unable to load the selected test call into the form.');
  }
}

async function submitForm(sendNow) {
  try {
    normalizeTimeField();
    const payload = buildPayload(sendNow);
    let response;

    if (form.value.id) {
      response = await store.updateTestCall(form.value.id, payload);
    } else {
      response = await store.createTestCall(payload);
    }

    if (store.selectedTestCall) {
      populateForm(store.selectedTestCall);
    }

    showToast(
      'success',
      sendNow ? 'Sandbox send submitted' : isEditingExisting.value ? 'Test call updated' : 'Test call added',
      response.message || (sendNow ? 'The sandbox test call was created and pushed to DPROMPT.' : 'The sandbox test call was added to the grid.'),
      3500
    );
  } catch (submitError) {
    showToast('error', 'Save failed', submitError.message || 'Unable to save the sandbox test call.', 4500);
  }
}

function resetForm(clearSelection) {
  form.value = createDefaultForm();

  if (clearSelection) {
    store.selectedTestCallId = null;
    store.selectedTestCallDetail = null;
    store.selectedTestCallActivity = [];
    timelineVisible.value = false;
  }
}

function handleScenarioChange(value) {
  applyScenarioPreset(value);
}

function handleVisitDayChange() {
  applyScheduledFields(form.value);
}

function handleTimezoneChange() {
  if (form.value.visit_day_preset) {
    applyScheduledFields(form.value);
  }
}

function handleTechnicianChange(value) {
  applyTechnicianPreset(value);
}

function handleLocationChange(value) {
  applyLocationPreset(value);
  applyScheduledFields(form.value);
}

async function sendCall(call) {
  try {
    await store.sendTestCall(call.id, false);
    showToast('success', 'Sandbox send submitted', 'The test call was sent to DPROMPT.', 3000);
  } catch (sendError) {
    showToast('error', 'Send failed', sendError.message || 'Unable to send the selected test call.', 4500);
  }
}

async function refreshStatuses(testCallIds = null) {
  try {
    const response = await store.refreshStatuses(testCallIds);
    showToast(
      'success',
      'Status refresh complete',
      response.message || 'Sandbox call statuses were refreshed.',
      3000
    );
  } catch (refreshError) {
    showToast('error', 'Status refresh failed', refreshError.message || 'Unable to refresh sandbox call statuses.', 4500);
  }
}

async function refreshTimeline() {
  if (!selectedCall.value) {
    return;
  }

  try {
    await store.loadActivity(selectedCall.value.id);
  } catch (timelineError) {
    showToast('error', 'Detail refresh failed', timelineError.message || 'Unable to refresh sandbox activity.', 4500);
  }
}

async function confirmDelete(call) {
  if (!call) {
    return;
  }

  const confirmed = window.confirm(`Delete sandbox test call ${call.client_system_id || call.id}?`);

  if (!confirmed) {
    return;
  }

  try {
    await store.deleteTestCall(call.id);

    if (String(form.value.id) === String(call.id)) {
      resetForm(true);
    }

    showToast('success', 'Test call deleted', 'The sandbox test call and its activity were removed.', 3000);
  } catch (deleteError) {
    showToast('error', 'Delete failed', deleteError.message || 'Unable to delete the sandbox test call.', 4500);
  }
}

function rowClass(data) {
  return String(data.id) === String(store.selectedTestCallId || '') ? 'call-operations-testing__row-selected' : '';
}

onMounted(async () => {
  syncFilterDraft();

  try {
    await store.loadRows();

    if (store.selectedTestCallId) {
      await store.loadDetail(store.selectedTestCallId);
      populateForm(store.selectedTestCall || null);
    }
  } catch (loadError) {
    showToast('error', 'Sandbox load failed', loadError.message || 'Unable to load DPROMPT sandbox test calls.');
  }
});
</script>

<style scoped>
.call-operations-testing {
  @apply space-y-4;
}

.call-operations-testing__shell {
  @apply space-y-4 rounded-[1.35rem] border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-950;
}

.call-operations-testing__form-bar {
  @apply flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between;
}

.call-operations-testing__form-actions {
  @apply flex flex-wrap items-center gap-2;
}

.call-operations-testing__presets {
  @apply rounded-xl border border-dashed border-surface-300 bg-surface-50/60 p-4 dark:border-surface-700 dark:bg-surface-900/40;
}

.call-operations-testing__presets-hint {
  @apply mb-3 text-xs text-surface-500 dark:text-surface-400;
}

.call-operations-testing__presets-row {
  @apply grid gap-4 md:grid-cols-3;
}

.call-operations-testing__pfield {
  @apply flex flex-col gap-2;
}

.call-operations-testing__fields {
  @apply flex flex-col gap-4;
}

.call-operations-testing__row3 {
  @apply grid gap-4 md:grid-cols-3;
}

.call-operations-testing__fld {
  @apply flex flex-col gap-2;
}

.call-operations-testing__label {
  @apply block text-sm font-medium text-surface-700 dark:text-surface-300;
}

.call-operations-testing__advanced {
  @apply mt-2;
}

.call-operations-testing__grid-toolbar {
  @apply flex flex-wrap items-center gap-2;
}

.call-operations-testing__pill {
  @apply inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold;
}

.call-operations-testing__pill--muted {
  @apply bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-200;
}

.call-operations-testing__pill--info {
  @apply bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200;
}

.call-operations-testing__pill--success {
  @apply bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200;
}

.call-operations-testing__pill--danger {
  @apply bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200;
}

.call-operations-testing__empty {
  @apply py-12 text-center;
}

.call-operations-testing__empty-title {
  @apply text-base font-medium text-surface-800 dark:text-surface-200;
}

.call-operations-testing__empty-copy {
  @apply mt-2 text-sm text-surface-500 dark:text-surface-400;
}

:deep(.call-operations-testing__grid .p-datatable-thead > tr > th) {
  @apply bg-surface-50 text-[0.68rem] uppercase tracking-[0.16em] text-surface-500 dark:bg-surface-900 dark:text-surface-400;
}

:deep(.call-operations-testing__grid .p-paginator) {
  @apply border-x-0 border-b-0 px-0;
}

:deep(.call-operations-testing__grid .p-datatable-tbody > tr.call-operations-testing__row-selected) {
  @apply bg-sky-50/70 dark:bg-sky-950/10;
}
</style>
