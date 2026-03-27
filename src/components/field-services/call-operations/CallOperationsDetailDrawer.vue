<template>
  <Drawer
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    position="right"
    class="call-operations-drawer"
    :style="{ width: 'min(92vw, 34rem)' }"
    :modal="true"
  >
    <template #header>
      <div class="flex flex-col gap-2 w-full" v-if="visit">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="text-xs uppercase tracking-[0.24em] text-surface-500">Dispatch Call Detail</div>
            <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0">
              {{ visit.client_system_id }}
            </h2>
            <p class="text-sm text-surface-600 dark:text-surface-400">{{ visit.visit_name }}</p>
          </div>
          <Button icon="pi pi-times" text rounded aria-label="Close drawer" @click="$emit('update:visible', false)" />
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Tag :value="syncLabel" :severity="syncSeverity" />
          <Tag :value="callLabel" :severity="callSeverity" />
          <Tag :value="eligibility.label" :severity="eligibility.severity" />
        </div>
      </div>
    </template>

    <div class="space-y-5 pb-6">
      <div v-if="loading" class="space-y-4">
        <Skeleton height="7rem" />
        <Skeleton height="7rem" />
        <Skeleton height="12rem" />
      </div>

      <template v-else-if="visit">
        <div class="grid grid-cols-2 gap-3">
          <Card class="shadow-sm col-span-2">
            <template #content>
              <div class="flex flex-wrap gap-2">
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
                  label="Activity"
                  icon="pi pi-history"
                  outlined
                  @click="$emit('open-activity', visit)"
                />
                <Button
                  label="Open Visit"
                  icon="pi pi-external-link"
                  text
                  @click="$emit('open-visit', visit)"
                />
              </div>
            </template>
          </Card>

          <Card class="shadow-sm col-span-2">
            <template #content>
              <div class="flex items-start justify-between gap-4">
                <div>
                  <div class="text-xs uppercase tracking-[0.2em] text-surface-500 mb-1">Location</div>
                  <div class="font-semibold text-surface-900 dark:text-surface-0">{{ visit.location.name }}</div>
                  <div class="text-sm text-surface-600 dark:text-surface-400">{{ visit.location.address }}</div>
                  <div class="text-sm text-surface-500 mt-2">{{ visit.location.phone }} • {{ visit.location.timezone }}</div>
                </div>
                <div class="text-right">
                  <div class="text-xs uppercase tracking-[0.2em] text-surface-500 mb-1">Appointment</div>
                  <div class="font-semibold text-surface-900 dark:text-surface-0">{{ visit.appointment.service_date }}</div>
                  <div class="text-sm text-surface-600 dark:text-surface-400">{{ visit.appointment.local_time }}</div>
                  <div class="mt-2 flex flex-col items-end gap-1">
                    <div class="text-sm text-surface-500">{{ visit.appointment.approx_hours }} hrs</div>
                    <Tag v-if="visit.appointment.is_past_due || visit.readiness.is_past_due" value="Past Due" severity="warn" />
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <Card class="shadow-sm">
            <template #content>
              <div class="text-xs uppercase tracking-[0.2em] text-surface-500 mb-2">Customer</div>
              <div class="font-semibold text-surface-900 dark:text-surface-0">{{ visit.customer.name }}</div>
              <div class="text-sm text-surface-600 dark:text-surface-400">{{ visit.project.name }}</div>
            </template>
          </Card>

          <Card class="shadow-sm">
            <template #content>
              <div class="text-xs uppercase tracking-[0.2em] text-surface-500 mb-2">Technician</div>
              <div class="font-semibold text-surface-900 dark:text-surface-0">{{ visit.technician.name || 'Unassigned' }}</div>
              <div class="text-sm text-surface-600 dark:text-surface-400">{{ visit.technician.phone || 'No phone on file' }}</div>
            </template>
          </Card>

          <Card class="shadow-sm col-span-2">
            <template #content>
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-2">
                  <div class="text-xs uppercase tracking-[0.2em] text-surface-500">Tools Required</div>
                  <div class="font-semibold text-surface-900 dark:text-surface-0">{{ formatToolsText(visit.tools.resolved) || 'Missing tools' }}</div>
                  <div class="text-sm text-surface-500">
                    Source: <span class="font-medium">{{ visit.tools.source }}</span>
                    <span v-if="visit.tools.override"> • Override: {{ formatToolsText(visit.tools.override) }}</span>
                  </div>
                </div>
                <Tag :value="visit.sync.needs_repush ? 'Needs Re-push' : 'In Sync'" :severity="visit.sync.needs_repush ? 'warning' : 'success'" />
              </div>
            </template>
          </Card>

          <Card class="shadow-sm col-span-2">
            <template #content>
              <div class="text-xs uppercase tracking-[0.2em] text-surface-500 mb-3">Readiness</div>
              <Message v-if="eligibility.kind === 'ready'" severity="success" :closable="false">
                Visit is clear to send or update.
              </Message>
              <Message v-else-if="eligibility.kind === 'past_due'" severity="warn" :closable="false">
                {{ eligibility.detail }}
              </Message>
              <Message v-else-if="eligibility.kind === 'ineligible' || eligibility.kind === 'past_start'" severity="secondary" :closable="false">
                {{ eligibility.detail }}
              </Message>
              <Message
                v-else-if="formattedReasons.length"
                severity="warn"
                :closable="false"
              >
                {{ formattedReasons.join(', ') }}
              </Message>
              <Message v-else severity="warn" :closable="false">
                {{ eligibility.detail }}
              </Message>
            </template>
          </Card>

          <Card class="shadow-sm col-span-2">
            <template #content>
              <div class="text-xs uppercase tracking-[0.2em] text-surface-500 mb-3">Payload Preview</div>
              <pre class="payload-preview">{{ formattedPayload }}</pre>
            </template>
          </Card>

          <Card class="shadow-sm col-span-2" v-if="hasCallAssets || visit.sync.last_error">
            <template #content>
              <div class="text-xs uppercase tracking-[0.2em] text-surface-500 mb-3">Call Assets</div>
              <div class="flex flex-wrap gap-2 mb-3" v-if="hasCallAssets">
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

              <Message v-if="visit.sync.last_error" severity="error" :closable="false">
                {{ visit.sync.last_error }}
              </Message>
            </template>
          </Card>
        </div>
      </template>

      <div v-else class="py-8 text-center text-surface-500">
        Select a visit to inspect its DPROMPT payload and current call state.
      </div>
    </div>
  </Drawer>
</template>

<script setup>
import { computed } from 'vue';
import { formatReadinessReasons, formatToolsText, getVisitEligibility } from '@/utils/callOperations';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  detail: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  },
  actionLoading: {
    type: Boolean,
    default: false
  }
});

defineEmits(['update:visible', 'send', 'edit-tools', 'open-activity', 'open-visit']);

const visit = computed(() => props.detail?.visit || null);

const formattedPayload = computed(() => JSON.stringify(props.detail?.payload_preview || {}, null, 2));
const eligibility = computed(() => getVisitEligibility(visit.value));
const formattedReasons = computed(() => formatReadinessReasons(visit.value));

function formatSyncStatus(status) {
  const labelMap = {
    not_ready: 'Not Queued',
    ready: 'Ready to Send',
    sent: 'Sent',
    needs_update: 'Needs Update',
    push_failed: 'Push Failed'
  };

  return labelMap[status] || String(status || 'unknown').replaceAll('_', ' ');
}

const syncLabel = computed(() => {
  if (!visit.value) {
    return '';
  }

  return `Sync · ${formatSyncStatus(visit.value.sync.sync_status)}`;
});

const callLabel = computed(() => {
  if (!visit.value) {
    return '';
  }

  return `Call · ${visit.value.call.call_status.replaceAll('_', ' ')}`;
});

const syncSeverity = computed(() => {
  if (!visit.value) {
    return 'secondary';
  }

  const severityMap = {
    not_ready: 'danger',
    ready: 'success',
    sent: 'info',
    needs_update: 'warning',
    push_failed: 'danger'
  };

  return severityMap[visit.value.sync.sync_status] || 'secondary';
});

const callSeverity = computed(() => {
  if (!visit.value) {
    return 'secondary';
  }

  const severityMap = {
    awaiting_call: 'warning',
    completed: 'success',
    transferred: 'info',
    failed: 'danger',
    unknown: 'secondary'
  };

  return severityMap[visit.value.call.call_status] || 'secondary';
});

const hasCallAssets = computed(() => {
  if (!visit.value) {
    return false;
  }

  return Boolean(
    visit.value.call.recording_url ||
      visit.value.call.recording_direct ||
      visit.value.call.transcript_url
  );
});

function openExternal(url) {
  if (!url) {
    return;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}
</script>

<style scoped>
.payload-preview {
  @apply rounded-xl bg-surface-950 text-surface-50 p-4 text-xs overflow-x-auto;
}
</style>
