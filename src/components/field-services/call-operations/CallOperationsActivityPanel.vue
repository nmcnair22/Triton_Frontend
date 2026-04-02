<template>
  <Card class="shadow-sm">
    <template #content>
      <div class="flex items-start justify-between gap-4 mb-6">
        <div>
          <div class="text-xs uppercase tracking-[0.24em] text-surface-500 mb-2">{{ eyebrowText }}</div>
          <h3 class="text-2xl font-semibold text-surface-900 dark:text-surface-0">
            {{ visit ? `${visit.client_system_id} · ${visit.visit_name || visit.label || 'Untitled'}` : emptySelectionTitle }}
          </h3>
          <p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
            {{ visit ? props.activeDescription : props.emptyDescription }}
          </p>
        </div>

        <Button
          icon="pi pi-refresh"
          label="Refresh Activity"
          outlined
          :disabled="!visit || loading"
          :loading="loading"
          @click="$emit('refresh')"
        />
      </div>

      <div v-if="loading" class="space-y-4">
        <Skeleton height="5rem" />
        <Skeleton height="5rem" />
        <Skeleton height="5rem" />
      </div>

      <div v-else-if="!visit" class="call-activity-empty">
        <i class="pi pi-history text-4xl text-surface-300 mb-3"></i>
        <div class="text-lg font-medium text-surface-700 dark:text-surface-300">{{ emptySelectionTitle }}</div>
        <div class="text-sm text-surface-500 dark:text-surface-400">{{ props.emptyDescription }}</div>
      </div>

      <div v-else-if="events.length === 0" class="call-activity-empty">
        <i class="pi pi-inbox text-4xl text-surface-300 mb-3"></i>
        <div class="text-lg font-medium text-surface-700 dark:text-surface-300">No activity yet</div>
        <div class="text-sm text-surface-500 dark:text-surface-400">This visit has not produced any DPROMPT events.</div>
      </div>

      <Timeline v-else :value="events" layout="vertical" class="call-activity-timeline">
        <template #marker="slotProps">
          <span class="timeline-marker" :class="markerClass(slotProps.item.event_type)">
            <i :class="markerIcon(slotProps.item.event_type)"></i>
          </span>
        </template>

        <template #content="slotProps">
          <Card class="mt-3 shadow-sm">
            <template #content>
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <Tag :value="formatActivityEventType(slotProps.item.event_type)" :severity="tagSeverity(slotProps.item.event_type)" />
                    <span class="text-xs text-surface-500">{{ formatDateTime(slotProps.item.event_at) }}</span>
                  </div>
                  <div class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.item.message }}</div>
                  <div class="text-sm text-surface-600 dark:text-surface-400" v-if="slotProps.item.user_name || slotProps.item.user?.name">
                    {{ slotProps.item.user_name || slotProps.item.user?.name }}
                  </div>
                  <div class="text-sm text-surface-500 space-y-1" v-if="slotProps.item.status_before || slotProps.item.status_after">
                    <div v-if="slotProps.item.status_before">
                      Before:
                      <span v-if="slotProps.item.status_before.sync_status"> Sync {{ formatSyncStatus(slotProps.item.status_before.sync_status) }}</span>
                      <span v-if="slotProps.item.status_before.call_status" class="ml-2">Call {{ formatCallStatus(slotProps.item.status_before.call_status) }}</span>
                    </div>
                    <div v-if="slotProps.item.status_after">
                      After:
                      <span v-if="slotProps.item.status_after.sync_status"> Sync {{ formatSyncStatus(slotProps.item.status_after.sync_status) }}</span>
                      <span v-if="slotProps.item.status_after.call_status" class="ml-2">Call {{ formatCallStatus(slotProps.item.status_after.call_status) }}</span>
                    </div>
                  </div>
                  <div v-if="slotProps.item.payload_snapshot" class="call-activity-json">
                    <div class="call-activity-json__label">Payload Snapshot</div>
                    <pre>{{ formatJson(slotProps.item.payload_snapshot) }}</pre>
                  </div>
                  <div v-if="slotProps.item.response_snapshot" class="call-activity-json">
                    <div class="call-activity-json__label">Response Snapshot</div>
                    <pre>{{ formatJson(slotProps.item.response_snapshot) }}</pre>
                  </div>
                  <Message v-if="slotProps.item.error_text" severity="error" :closable="false">
                    {{ slotProps.item.error_text }}
                  </Message>
                </div>
              </div>
            </template>
          </Card>
        </template>
      </Timeline>
    </template>
  </Card>
</template>

<script setup>
import { formatActivityEventType, formatCallStatus, formatSyncStatus } from '@/utils/callOperations';

const props = defineProps({
  visit: {
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
  entityLabel: {
    type: String,
    default: 'Visit'
  },
  activeDescription: {
    type: String,
    default: 'Append-only sync and send events for the current visit.'
  },
  emptyDescription: {
    type: String,
    default: 'Open a row from the operations table or use the drawer shortcut.'
  }
});

defineEmits(['refresh']);

const eyebrowText = `${props.entityLabel} Activity`;
const emptySelectionTitle = `No ${props.entityLabel.toLowerCase()} selected`;

function markerClass(eventType) {
  const type = String(eventType || '');

  if (type.includes('failed')) {
    return 'timeline-marker-danger';
  }

  if (type.includes('created') || type.includes('updated') || type.includes('succeeded') || type.includes('cleared')) {
    return 'timeline-marker-success';
  }

  if (type.includes('requested') || type.includes('detected')) {
    return 'timeline-marker-warning';
  }

  return 'timeline-marker-info';
}

function markerIcon(eventType) {
  const iconMap = {
    test_call_created: 'pi pi-plus-circle',
    test_call_updated: 'pi pi-file-edit',
    send_requested: 'pi pi-send',
    send_succeeded: 'pi pi-check',
    send_failed: 'pi pi-times',
    status_sync_requested: 'pi pi-refresh',
    status_sync_updated: 'pi pi-phone',
    status_sync_no_change: 'pi pi-minus-circle',
    status_sync_failed: 'pi pi-exclamation-circle',
    tools_override_updated: 'pi pi-file-edit',
    drift_detected: 'pi pi-exclamation-triangle',
    drift_cleared: 'pi pi-check-circle'
  };

  return iconMap[eventType] || 'pi pi-circle';
}

function tagSeverity(eventType) {
  const type = String(eventType || '');

  if (type.includes('failed')) {
    return 'danger';
  }

  if (type.includes('created') || type.includes('succeeded') || type.includes('updated') || type.includes('cleared')) {
    return 'success';
  }

  if (type.includes('detected')) {
    return 'warning';
  }

  return 'info';
}

function formatDateTime(value) {
  if (!value) {
    return 'Unknown time';
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
.call-activity-empty {
  @apply flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-300 dark:border-surface-700 py-14 text-center;
}

.call-activity-json {
  @apply rounded-2xl border border-surface-200 bg-surface-50/80 px-4 py-3 dark:border-surface-800 dark:bg-surface-900/80;
}

.call-activity-json__label {
  @apply mb-2 text-[0.7rem] uppercase tracking-[0.18em] text-surface-500 dark:text-surface-400;
}

.call-activity-json pre {
  @apply overflow-x-auto whitespace-pre-wrap text-xs text-surface-700 dark:text-surface-300;
}

.timeline-marker {
  @apply flex h-9 w-9 items-center justify-center rounded-full text-white shadow;
}

.timeline-marker-success {
  @apply bg-green-500;
}

.timeline-marker-warning {
  @apply bg-yellow-500;
}

.timeline-marker-danger {
  @apply bg-red-500;
}

.timeline-marker-info {
  @apply bg-blue-500;
}
</style>
