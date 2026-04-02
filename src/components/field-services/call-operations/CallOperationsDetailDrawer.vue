<template>
  <Drawer
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    position="right"
    class="call-operations-drawer"
    :style="{ width: 'min(96vw, 46rem)' }"
    :modal="true"
  >
    <template #header>
      <div v-if="visit" class="call-operations-drawer__header">
        <div>
          <div class="call-operations-drawer__eyebrow">Dispatch Call Inspector</div>
          <h2 class="call-operations-drawer__title">{{ visit.client_system_id }}</h2>
          <p class="call-operations-drawer__subtitle">{{ visit.visit_name }}</p>
        </div>

        <div class="call-operations-drawer__status">
          <Tag :value="queueScopeLabel" :severity="queueScopeTagSeverity" rounded />
          <Tag :value="timingLabel" :severity="timingSeverity" rounded />
          <Tag :value="qualityLabel" :severity="qualitySeverity" rounded />
          <Tag :value="syncLabel" :severity="syncSeverity" rounded />
          <Tag :value="callLabel" :severity="callSeverity" rounded />
        </div>
      </div>
    </template>

    <div class="call-operations-drawer__body">
      <div v-if="loading" class="space-y-4">
        <Skeleton height="4.5rem" />
        <Skeleton height="16rem" />
        <Skeleton height="20rem" />
      </div>

      <template v-else-if="visit">
        <div class="call-operations-drawer__actions">
          <Button
            label="Send / Update"
            icon="pi pi-send"
            :disabled="!visit.allowed_actions.includes('send_update') || actionLoading"
            :loading="actionLoading"
            @click="$emit('send', visit)"
          />
          <Button
            label="Edit Tools"
            icon="pi pi-file-edit"
            outlined
            :disabled="!visit.allowed_actions.includes('edit_tools') || actionLoading"
            @click="$emit('edit-tools', visit)"
          />
          <Button
            label="Open Visit"
            icon="pi pi-external-link"
            text
            @click="$emit('open-visit', visit)"
          />
        </div>

        <Tabs v-model:value="inspectorTab" class="call-operations-drawer__tabs">
          <TabList>
            <Tab value="overview">Overview</Tab>
            <Tab value="payload">Payload</Tab>
            <Tab value="activity">Activity</Tab>
          </TabList>

          <TabPanels>
            <TabPanel value="overview">
              <div class="call-operations-drawer__overview">
                <section class="call-operations-drawer__section">
                  <div class="call-operations-drawer__section-header">
                    <div>
                      <div class="call-operations-drawer__section-title">Visit context</div>
                      <p class="call-operations-drawer__section-copy">
                        Source visit, schedule, and technician details for the current DPROMPT record.
                      </p>
                    </div>
                  </div>

                  <div class="call-operations-drawer__facts">
                    <div class="call-operations-drawer__fact">
                      <span class="call-operations-drawer__fact-label">Customer</span>
                      <strong>{{ visit.customer?.name || 'Unknown customer' }}</strong>
                      <span>{{ visit.project?.name || 'No project' }}</span>
                    </div>
                    <div class="call-operations-drawer__fact">
                      <span class="call-operations-drawer__fact-label">Appointment</span>
                      <strong>{{ visit.appointment?.service_date || 'No date' }}</strong>
                      <span>{{ visit.appointment?.local_time || 'No time' }}</span>
                    </div>
                    <div class="call-operations-drawer__fact">
                      <span class="call-operations-drawer__fact-label">Technician</span>
                      <strong>{{ visit.technician?.name || 'Unassigned' }}</strong>
                      <span>{{ visit.technician?.phone || 'No phone on file' }}</span>
                    </div>
                    <div class="call-operations-drawer__fact">
                      <span class="call-operations-drawer__fact-label">Location</span>
                      <strong>{{ visit.location?.name || 'No location' }}</strong>
                      <span>{{ visit.location?.contact_name || visit.location?.timezone || 'No contact or timezone' }}</span>
                    </div>
                    <div class="call-operations-drawer__fact">
                      <span class="call-operations-drawer__fact-label">Job</span>
                      <strong>{{ visit.job?.name || 'No source job' }}</strong>
                      <span>{{ visit.fieldnation_workorder_id || 'No Field Nation work order' }}</span>
                    </div>
                    <div class="call-operations-drawer__fact">
                      <span class="call-operations-drawer__fact-label">Visit metadata</span>
                      <strong>{{ visit.visit_type || 'Unknown type' }}</strong>
                      <span>{{ visit.visit_status || 'Unknown status' }}</span>
                    </div>
                  </div>
                </section>

                <section class="call-operations-drawer__section" v-if="hasVisitNotes">
                  <div class="call-operations-drawer__section-header">
                    <div>
                      <div class="call-operations-drawer__section-title">Operational notes</div>
                      <p class="call-operations-drawer__section-copy">
                        Visit notes and description content returned by dispatch for this record.
                      </p>
                    </div>
                  </div>

                  <div class="call-operations-drawer__notes">
                    <div v-if="visit.site_specific_info" class="call-operations-drawer__note-block">
                      <div class="call-operations-drawer__fact-label">Site specific info</div>
                      <p>{{ visit.site_specific_info }}</p>
                    </div>
                    <div v-if="visit.logistics_notes" class="call-operations-drawer__note-block">
                      <div class="call-operations-drawer__fact-label">Internal logistics</div>
                      <p>{{ visit.logistics_notes }}</p>
                    </div>
                    <div v-if="visit.logistics_notes_external" class="call-operations-drawer__note-block">
                      <div class="call-operations-drawer__fact-label">External logistics</div>
                      <p>{{ visit.logistics_notes_external }}</p>
                    </div>
                    <div v-if="cleanPublicDescription" class="call-operations-drawer__note-block">
                      <div class="call-operations-drawer__fact-label">Public description</div>
                      <p>{{ cleanPublicDescription }}</p>
                    </div>
                  </div>
                </section>

                <section class="call-operations-drawer__section">
                  <div class="call-operations-drawer__section-header">
                    <div class="call-operations-drawer__section-title">Readiness</div>
                    <Tag
                      :value="visit.sync?.needs_repush ? 'Needs Re-push' : 'In Sync'"
                      :severity="visit.sync?.needs_repush ? 'warning' : 'success'"
                      rounded
                    />
                  </div>

                  <div class="call-operations-drawer__badge-list">
                    <Tag :value="queueScopeLabel" :severity="queueScopeTagSeverity" rounded />
                    <Tag :value="timingLabel" :severity="timingSeverity" rounded />
                    <Tag :value="qualityLabel" :severity="qualitySeverity" rounded />
                  </div>

                  <Message v-if="!visit.queue_in_scope" severity="secondary" variant="outlined" :closable="false">
                    This visit is out of scope for the DPROMPT queue. Reason: {{ queueScopeReasonLabel }}.
                  </Message>
                  <Message v-else-if="visit.data_quality === 'blocked'" severity="error" variant="outlined" :closable="false">
                    Backend marked this visit as blocked until the listed blockers are resolved.
                  </Message>
                  <Message
                    v-else-if="visit.data_quality === 'pushable_with_warnings'"
                    severity="warn"
                    variant="outlined"
                    :closable="false"
                  >
                    Backend marked this visit as sendable with warnings. Warnings do not block Send / Update.
                  </Message>
                  <Message v-else severity="success" variant="simple" :closable="false">
                    Backend marked this visit as ready to push.
                  </Message>

                  <div v-if="blockers.length" class="call-operations-drawer__reason-group">
                    <div class="call-operations-drawer__fact-label">Blockers</div>
                    <div class="call-operations-drawer__pill-list">
                      <Tag v-for="blocker in blockers" :key="blocker" :value="blocker" severity="danger" rounded />
                    </div>
                  </div>

                  <div v-if="warnings.length" class="call-operations-drawer__reason-group">
                    <div class="call-operations-drawer__fact-label">Warnings</div>
                    <div class="call-operations-drawer__pill-list">
                      <Tag v-for="warning in warnings" :key="warning" :value="warning" severity="warn" rounded />
                    </div>
                  </div>

                  <div class="call-operations-drawer__tools">
                    <div>
                      <div class="call-operations-drawer__fact-label">Tools required</div>
                      <div class="call-operations-drawer__tools-text">{{ formatToolsText(visit.tools?.resolved) || 'Missing tools' }}</div>
                    </div>
                    <div class="call-operations-drawer__tools-meta">
                      Source: <span class="font-medium">{{ visit.tools?.source || 'none' }}</span>
                      <span v-if="visit.tools?.override"> • Override applied</span>
                    </div>
                  </div>
                </section>

                <section class="call-operations-drawer__section">
                  <div class="call-operations-drawer__section-header">
                    <div>
                      <div class="call-operations-drawer__section-title">Sync and call state</div>
                      <p class="call-operations-drawer__section-copy">
                        Current backend-tracked submission and call results for this visit.
                      </p>
                    </div>
                  </div>

                  <div class="call-operations-drawer__facts">
                    <div class="call-operations-drawer__fact">
                      <span class="call-operations-drawer__fact-label">Submission</span>
                      <strong>{{ formatSyncStatus(visit.sync?.sync_status) }}</strong>
                      <span>{{ visit.sync?.push_count || 0 }} pushes • {{ formatTimestamp(visit.sync?.last_pushed_at) }}</span>
                    </div>
                    <div class="call-operations-drawer__fact">
                      <span class="call-operations-drawer__fact-label">Last status sync</span>
                      <strong>{{ formatTimestamp(visit.sync?.last_status_sync_at) }}</strong>
                      <span>{{ visit.sync?.needs_repush ? `Needs re-push • ${driftSummary}` : 'No drift detected' }}</span>
                    </div>
                    <div class="call-operations-drawer__fact">
                      <span class="call-operations-drawer__fact-label">Call status</span>
                      <strong>{{ formatCallStatus(visit.call?.call_status) }}</strong>
                      <span>{{ visit.call?.last_outcome || visit.call?.retell_call_id || 'No outcome yet' }}</span>
                    </div>
                    <div class="call-operations-drawer__fact">
                      <span class="call-operations-drawer__fact-label">Call signals</span>
                      <strong>{{ visit.call?.sms_sent ? 'SMS sent' : 'No SMS' }}</strong>
                      <span>{{ visit.call?.call_transfer || (visit.call?.has_tools_confirmed === null ? 'No transfer/tools signal' : `Tools confirmed: ${visit.call?.has_tools_confirmed ? 'Yes' : 'No'}`) }}</span>
                    </div>
                  </div>

                  <Message v-if="visit.sync?.last_error" severity="error" variant="outlined" :closable="false">
                    {{ visit.sync.last_error }}
                  </Message>
                </section>

                <section class="call-operations-drawer__section">
                  <div class="call-operations-drawer__section-header">
                    <div class="call-operations-drawer__section-title">Call assets</div>
                  </div>

                  <div v-if="hasCallAssets" class="call-operations-drawer__asset-actions">
                    <Button
                      v-if="visit.allowed_actions.includes('view_recording')"
                      label="Recording"
                      icon="pi pi-play-circle"
                      outlined
                      @click="openExternal(visit.call.recording_direct || visit.call.recording_url)"
                    />
                    <Button
                      v-if="visit.allowed_actions.includes('view_transcript')"
                      label="Transcript"
                      icon="pi pi-file"
                      outlined
                      @click="openExternal(visit.call.transcript_url)"
                    />
                  </div>

                  <div v-if="!hasCallAssets && !visit.sync?.last_error" class="call-operations-drawer__empty">
                    No recording, transcript, or sync errors are available for this visit yet.
                  </div>
                </section>

                <section v-if="hasVendorDebug" class="call-operations-drawer__section">
                  <div class="call-operations-drawer__section-header">
                    <div>
                      <div class="call-operations-drawer__section-title">Vendor Debug</div>
                      <p class="call-operations-drawer__section-copy">
                        Secondary troubleshooting data returned by the detail endpoint.
                      </p>
                    </div>
                  </div>

                  <div class="space-y-4">
                    <div v-if="detail.vendor_debug?.last_api_response || visit.vendor_debug?.last_api_response">
                      <div class="call-operations-drawer__fact-label">Last API response</div>
                      <pre class="call-operations-drawer__code-block">{{ formatJson(detail.vendor_debug?.last_api_response || visit.vendor_debug?.last_api_response) }}</pre>
                    </div>
                    <div v-if="detail.vendor_debug?.last_vendor_row_raw || visit.vendor_debug?.last_vendor_row_raw">
                      <div class="call-operations-drawer__fact-label">Last vendor row</div>
                      <pre class="call-operations-drawer__code-block">{{ formatJson(detail.vendor_debug?.last_vendor_row_raw || visit.vendor_debug?.last_vendor_row_raw) }}</pre>
                    </div>
                  </div>
                </section>
              </div>
            </TabPanel>

            <TabPanel value="payload">
              <div class="call-operations-drawer__section">
                <div class="call-operations-drawer__section-header">
                  <div>
                    <div class="call-operations-drawer__section-title">Payload preview</div>
                    <p class="call-operations-drawer__section-copy">
                      Current DPROMPT payload generated from the visit and any tools override.
                    </p>
                  </div>
                </div>

                <pre class="payload-preview">{{ formattedPayload }}</pre>
              </div>
            </TabPanel>

            <TabPanel value="activity">
              <CallOperationsActivityPanel
                :visit="visit"
                :events="events"
                :loading="loadingActivity"
                activeDescription="Latest DPROMPT sends, sync updates, and call outcomes for this visit."
                emptyDescription="No DPROMPT activity has been recorded for this visit yet."
                @refresh="$emit('refresh-activity')"
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </template>

      <div v-else class="call-operations-drawer__empty-state">
        Select a visit to inspect its payload, current call state, and activity history.
      </div>
    </div>
  </Drawer>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import {
  callStatusSeverity,
  dataQualitySeverity,
  formatCallStatus,
  formatDataQuality,
  formatQueueScopeReason,
  formatReadinessBlockers,
  formatReadinessWarnings,
  formatSyncStatus,
  formatTimingState,
  formatToolsText,
  queueScopeSeverity,
  syncStatusSeverity,
  timingStateSeverity
} from '@/utils/callOperations';
import CallOperationsActivityPanel from '@/components/field-services/call-operations/CallOperationsActivityPanel.vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  detail: {
    type: Object,
    default: null
  },
  events: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingActivity: {
    type: Boolean,
    default: false
  },
  actionLoading: {
    type: Boolean,
    default: false
  }
});

defineEmits(['update:visible', 'send', 'edit-tools', 'open-visit', 'refresh-activity']);

const inspectorTab = ref('overview');

watch(
  () => props.visible,
  (nextVisible) => {
    if (nextVisible) {
      inspectorTab.value = 'overview';
    }
  }
);

const visit = computed(() => props.detail?.visit || null);
const detail = computed(() => props.detail || {});

const payloadPreview = computed(() => visit.value?.payload_preview || props.detail?.payload_preview || {});
const formattedPayload = computed(() => JSON.stringify(payloadPreview.value, null, 2));
const blockers = computed(() => formatReadinessBlockers(visit.value));
const warnings = computed(() => formatReadinessWarnings(visit.value));
const cleanPublicDescription = computed(() => formatToolsText(visit.value?.public_description));
const hasVisitNotes = computed(() => Boolean(
  visit.value?.site_specific_info ||
    visit.value?.logistics_notes ||
    visit.value?.logistics_notes_external ||
    cleanPublicDescription.value
));
const hasVendorDebug = computed(() => Boolean(
  detail.value?.vendor_debug?.last_api_response ||
    detail.value?.vendor_debug?.last_vendor_row_raw ||
    visit.value?.vendor_debug?.last_api_response ||
    visit.value?.vendor_debug?.last_vendor_row_raw
));
const driftSummary = computed(() => {
  const fields = visit.value?.sync?.drift_fields || [];
  return fields.length > 0 ? fields.join(', ') : 'No drift fields returned';
});
const queueScopeReasonLabel = computed(() => formatQueueScopeReason(visit.value?.queue_scope_reason));
const queueScopeLabel = computed(() =>
  visit.value?.queue_in_scope === false ? `Out of Scope · ${queueScopeReasonLabel.value}` : 'In Scope'
);
const timingLabel = computed(() => `Timing · ${formatTimingState(visit.value?.timing_state)}`);
const qualityLabel = computed(() => `Quality · ${formatDataQuality(visit.value?.data_quality)}`);

const syncLabel = computed(() => {
  if (!visit.value) {
    return '';
  }

  return `Submission · ${formatSyncStatus(visit.value.sync?.sync_status)}`;
});

const callLabel = computed(() => {
  if (!visit.value) {
    return '';
  }

  return `Call · ${formatCallStatus(visit.value.call?.call_status)}`;
});

const syncSeverity = computed(() => {
  if (!visit.value) {
    return 'secondary';
  }

  return syncStatusSeverity(visit.value.sync?.sync_status);
});

const callSeverity = computed(() => {
  if (!visit.value) {
    return 'secondary';
  }

  return callStatusSeverity(visit.value.call?.call_status);
});
const timingSeverity = computed(() => timingStateSeverity(visit.value?.timing_state));
const qualitySeverity = computed(() => dataQualitySeverity(visit.value?.data_quality));
const queueScopeTagSeverity = computed(() => queueScopeSeverity(visit.value?.queue_in_scope));

const hasCallAssets = computed(() => {
  if (!visit.value) {
    return false;
  }

  return Boolean(
    visit.value.call?.recording_url ||
      visit.value.call?.recording_direct ||
      visit.value.call?.transcript_url
  );
});

function openExternal(url) {
  if (!url) {
    return;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
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

function formatJson(value) {
  return JSON.stringify(value || {}, null, 2);
}
</script>

<style scoped>
.call-operations-drawer__header {
  @apply flex w-full flex-col gap-3;
}

.call-operations-drawer__eyebrow {
  @apply text-[0.7rem] uppercase tracking-[0.24em] text-surface-500 dark:text-surface-400;
}

.call-operations-drawer__title {
  @apply text-2xl font-semibold text-surface-950 dark:text-surface-0;
}

.call-operations-drawer__subtitle {
  @apply mt-1 text-sm text-surface-600 dark:text-surface-400;
}

.call-operations-drawer__status {
  @apply flex flex-wrap items-center gap-2;
}

.call-operations-drawer__body {
  @apply space-y-5 pb-6;
}

.call-operations-drawer__actions {
  @apply flex flex-wrap items-center gap-2;
}

.call-operations-drawer__tabs {
  @apply rounded-[1.5rem] border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-950;
}

.call-operations-drawer__overview {
  @apply space-y-5;
}

.call-operations-drawer__section {
  @apply space-y-4 px-1;
}

.call-operations-drawer__section-header {
  @apply flex flex-wrap items-start justify-between gap-3;
}

.call-operations-drawer__section-title {
  @apply text-sm font-semibold uppercase tracking-[0.18em] text-surface-500 dark:text-surface-400;
}

.call-operations-drawer__section-copy {
  @apply mt-1 text-sm text-surface-600 dark:text-surface-400;
}

.call-operations-drawer__facts {
  @apply grid gap-3 sm:grid-cols-2;
}

.call-operations-drawer__fact {
  @apply rounded-2xl border border-surface-200 bg-surface-50/80 px-4 py-3 dark:border-surface-800 dark:bg-surface-900/80;
}

.call-operations-drawer__fact-label {
  @apply block text-[0.7rem] uppercase tracking-[0.18em] text-surface-500 dark:text-surface-400;
}

.call-operations-drawer__fact strong {
  @apply mt-2 block text-sm font-semibold text-surface-950 dark:text-surface-0;
}

.call-operations-drawer__fact span:last-child {
  @apply mt-1 block text-sm text-surface-600 dark:text-surface-400;
}

.call-operations-drawer__tools {
  @apply rounded-2xl border border-surface-200 bg-surface-50/80 px-4 py-4 dark:border-surface-800 dark:bg-surface-900/80;
}

.call-operations-drawer__badge-list {
  @apply flex flex-wrap items-center gap-2;
}

.call-operations-drawer__reason-group {
  @apply space-y-2;
}

.call-operations-drawer__pill-list {
  @apply flex flex-wrap items-center gap-2;
}

.call-operations-drawer__tools-text {
  @apply mt-2 text-sm font-medium text-surface-950 dark:text-surface-0;
}

.call-operations-drawer__tools-meta {
  @apply mt-3 text-sm text-surface-500 dark:text-surface-400;
}

.call-operations-drawer__notes {
  @apply space-y-3;
}

.call-operations-drawer__note-block {
  @apply rounded-2xl border border-surface-200 bg-surface-50/80 px-4 py-4 dark:border-surface-800 dark:bg-surface-900/80;
}

.call-operations-drawer__note-block p {
  @apply mt-2 whitespace-pre-wrap text-sm leading-6 text-surface-700 dark:text-surface-300;
}

.call-operations-drawer__asset-actions {
  @apply flex flex-wrap items-center gap-2;
}

.call-operations-drawer__empty,
.call-operations-drawer__empty-state {
  @apply rounded-2xl border border-dashed border-surface-300 px-4 py-6 text-sm text-surface-500 dark:border-surface-700 dark:text-surface-400;
}

.payload-preview {
  @apply overflow-x-auto rounded-[1.25rem] bg-surface-950 p-4 text-xs text-surface-50;
}

.call-operations-drawer__code-block {
  @apply overflow-x-auto rounded-[1.25rem] bg-surface-950 p-4 text-xs text-surface-50;
}

:deep(.call-operations-drawer__tabs .p-tabpanels) {
  @apply p-5;
}

:deep(.call-operations-drawer__tabs .p-tablist-tab-list) {
  @apply border-b border-surface-200 px-4 pt-4 dark:border-surface-800;
}
</style>
