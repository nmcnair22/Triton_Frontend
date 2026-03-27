<template>
  <Drawer
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    position="right"
    class="call-operations-drawer"
    :style="{ width: 'min(92vw, 38rem)' }"
    :modal="true"
  >
    <template #header>
      <div class="flex flex-col gap-2 w-full">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="text-xs uppercase tracking-[0.24em] text-surface-500">Sandbox Timeline</div>
            <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0">
              {{ testCall?.client_system_id || 'No test call selected' }}
            </h2>
            <p class="text-sm text-surface-600 dark:text-surface-400">
              {{ testCall?.label || 'Open timeline from the row actions menu.' }}
            </p>
          </div>
          <Button icon="pi pi-times" text rounded aria-label="Close drawer" @click="$emit('update:visible', false)" />
        </div>

        <div v-if="testCall" class="flex flex-wrap items-center gap-2">
          <Tag :value="`Sync · ${formatStatus(testCall.sync?.sync_status)}`" :severity="syncSeverity" />
          <Tag :value="`Call · ${formatStatus(testCall.call?.call_status)}`" :severity="callSeverity" />
          <Tag :value="testCall.readiness?.ready_to_push ? 'Ready' : 'Blocked'" :severity="testCall.readiness?.ready_to_push ? 'success' : 'warning'" />
        </div>
      </div>
    </template>

    <CallOperationsActivityPanel
      :visit="testCall"
      :events="events"
      :loading="loading"
      entityLabel="Test Call"
      activeDescription="Append-only send and status events for this sandbox DPROMPT call."
      emptyDescription="Use the Timeline action on a test call row to load its event history."
      @refresh="$emit('refresh')"
    />
  </Drawer>
</template>

<script setup>
import { computed } from 'vue';
import CallOperationsActivityPanel from '@/components/field-services/call-operations/CallOperationsActivityPanel.vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  testCall: {
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
  }
});

defineEmits(['update:visible', 'refresh']);

const syncSeverity = computed(() => {
  const severityMap = {
    not_ready: 'danger',
    ready: 'success',
    sent: 'info',
    needs_update: 'warning',
    push_failed: 'danger'
  };

  return severityMap[props.testCall?.sync?.sync_status] || 'secondary';
});

const callSeverity = computed(() => {
  const severityMap = {
    awaiting_call: 'warning',
    completed: 'success',
    transferred: 'info',
    failed: 'danger',
    unknown: 'secondary'
  };

  return severityMap[props.testCall?.call?.call_status] || 'secondary';
});

function formatStatus(value) {
  return String(value || 'unknown')
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}
</script>
