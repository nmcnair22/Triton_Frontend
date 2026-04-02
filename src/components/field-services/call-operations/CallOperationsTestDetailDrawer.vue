<template>
  <Drawer
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    position="right"
    class="call-operations-test-drawer"
    :style="{ width: 'min(92vw, 42rem)' }"
    :modal="true"
  >
    <template #header>
      <div class="call-operations-test-drawer__header">
        <div>
          <div class="call-operations-test-drawer__eyebrow">Test Call Details</div>
          <h2 class="call-operations-test-drawer__title">
            {{ testCall?.client_system_id || 'No test call selected' }}
          </h2>
          <p class="call-operations-test-drawer__subtitle">
            {{ testCall?.label || 'Open a row from the testing grid to inspect the payload, API details, and history.' }}
          </p>
        </div>
      </div>
    </template>

    <div v-if="loading && !testCall" class="space-y-4">
      <Skeleton height="6rem" />
      <Skeleton height="16rem" />
    </div>

    <template v-else-if="testCall">
      <Tabs v-model:value="activeTab">
        <TabList>
          <Tab value="overview">Overview</Tab>
          <Tab value="api">API</Tab>
          <Tab value="history">History</Tab>
        </TabList>

        <TabPanels>
          <TabPanel value="overview">
            <div class="call-operations-test-drawer__stack">
              <section class="call-operations-test-drawer__section">
                <div class="call-operations-test-drawer__facts">
                  <div class="call-operations-test-drawer__fact">
                    <span class="call-operations-test-drawer__fact-label">Schedule</span>
                    <strong>{{ testCall.appointment?.visit_date || 'No date' }}</strong>
                    <span>{{ testCall.appointment?.visit_time || 'No time' }} · {{ testCall.appointment?.timezone || 'No timezone' }}</span>
                  </div>
                  <div class="call-operations-test-drawer__fact">
                    <span class="call-operations-test-drawer__fact-label">Technician</span>
                    <strong>{{ testCall.technician?.name || 'Missing tech' }}</strong>
                    <span>{{ testCall.technician?.phone || 'Missing phone' }}</span>
                  </div>
                  <div class="call-operations-test-drawer__fact">
                    <span class="call-operations-test-drawer__fact-label">Address</span>
                    <strong>{{ testCall.location?.address || 'Missing address' }}</strong>
                    <span>{{ testCall.location?.name || 'Missing location name' }}</span>
                  </div>
                  <div class="call-operations-test-drawer__fact">
                    <span class="call-operations-test-drawer__fact-label">Push State</span>
                    <strong>{{ formatSyncStatus(testCall.sync?.sync_status) }}</strong>
                    <span>{{ testCall.sync?.last_pushed_at || 'No push timestamp' }}</span>
                  </div>
                  <div class="call-operations-test-drawer__fact">
                    <span class="call-operations-test-drawer__fact-label">Call State</span>
                    <strong>{{ formatCallStatus(testCall.call?.call_status) }}</strong>
                    <span>{{ testCall.call?.last_outcome || testCall.call?.retell_call_id || 'No outcome recorded' }}</span>
                  </div>
                  <div class="call-operations-test-drawer__fact">
                    <span class="call-operations-test-drawer__fact-label">Work Order</span>
                    <strong>{{ testCall.work_order || 'None' }}</strong>
                    <span>{{ testCall.company || 'No company' }}</span>
                  </div>
                </div>
              </section>

              <section class="call-operations-test-drawer__section">
                <div class="call-operations-test-drawer__section-title">Tools</div>
                <div class="call-operations-test-drawer__body-copy">
                  {{ formatToolsText(testCall.tools?.resolved) || 'No tools listed' }}
                </div>
              </section>

              <section v-if="testCall.notes" class="call-operations-test-drawer__section">
                <div class="call-operations-test-drawer__section-title">Notes</div>
                <div class="call-operations-test-drawer__body-copy whitespace-pre-wrap">
                  {{ testCall.notes }}
                </div>
              </section>

              <section v-if="hasCallAssets" class="call-operations-test-drawer__section">
                <div class="call-operations-test-drawer__section-title">Call Assets</div>
                <div class="flex flex-wrap items-center gap-2">
                  <Button
                    v-if="testCall.call?.recording_direct || testCall.call?.recording_url"
                    label="Recording"
                    icon="pi pi-play-circle"
                    outlined
                    @click="openExternal(testCall.call?.recording_direct || testCall.call?.recording_url)"
                  />
                  <Button
                    v-if="testCall.call?.transcript_url"
                    label="Transcript"
                    icon="pi pi-file"
                    outlined
                    @click="openExternal(testCall.call?.transcript_url)"
                  />
                </div>
              </section>
            </div>
          </TabPanel>

          <TabPanel value="api">
            <div class="call-operations-test-drawer__stack">
              <section class="call-operations-test-drawer__section">
                <div class="call-operations-test-drawer__section-title">Payload Preview</div>
                <pre class="call-operations-test-drawer__code">{{ formatJson(testCall.payload_preview) }}</pre>
              </section>

              <section v-if="testCall.vendor_debug?.last_api_response" class="call-operations-test-drawer__section">
                <div class="call-operations-test-drawer__section-title">Last API Response</div>
                <pre class="call-operations-test-drawer__code">{{ formatJson(testCall.vendor_debug.last_api_response) }}</pre>
              </section>

              <section v-if="testCall.vendor_debug?.last_vendor_row_raw" class="call-operations-test-drawer__section">
                <div class="call-operations-test-drawer__section-title">Last Vendor Row</div>
                <pre class="call-operations-test-drawer__code">{{ formatJson(testCall.vendor_debug.last_vendor_row_raw) }}</pre>
              </section>
            </div>
          </TabPanel>

          <TabPanel value="history">
            <CallOperationsActivityPanel
              :visit="testCall"
              :events="events"
              :loading="loading"
              entityLabel="Test Call"
              activeDescription="Append-only send, refresh, and outcome events for this sandbox test call."
              emptyDescription="No activity has been recorded for this sandbox test call yet."
              @refresh="$emit('refresh')"
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </template>
  </Drawer>
</template>

<script setup>
import { computed, ref } from 'vue';
import CallOperationsActivityPanel from '@/components/field-services/call-operations/CallOperationsActivityPanel.vue';
import { formatCallStatus, formatSyncStatus, formatToolsText } from '@/utils/callOperations';

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

const activeTab = ref('overview');

const hasCallAssets = computed(() => Boolean(
  props.testCall?.call?.recording_url ||
    props.testCall?.call?.recording_direct ||
    props.testCall?.call?.transcript_url
));

function formatJson(value) {
  return JSON.stringify(value || {}, null, 2);
}

function openExternal(url) {
  if (!url) {
    return;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}
</script>

<style scoped>
.call-operations-test-drawer__header {
  @apply flex w-full flex-col gap-2;
}

.call-operations-test-drawer__eyebrow {
  @apply text-[0.68rem] uppercase tracking-[0.24em] text-surface-500 dark:text-surface-400;
}

.call-operations-test-drawer__title {
  @apply text-xl font-semibold text-surface-950 dark:text-surface-0;
}

.call-operations-test-drawer__subtitle {
  @apply text-sm text-surface-600 dark:text-surface-400;
}

.call-operations-test-drawer__stack {
  @apply space-y-4;
}

.call-operations-test-drawer__section {
  @apply rounded-2xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-800 dark:bg-surface-900;
}

.call-operations-test-drawer__section-title {
  @apply mb-3 text-sm font-semibold text-surface-900 dark:text-surface-0;
}

.call-operations-test-drawer__facts {
  @apply grid gap-3 md:grid-cols-2;
}

.call-operations-test-drawer__fact {
  @apply rounded-xl border border-surface-200 bg-white p-3 dark:border-surface-800 dark:bg-surface-950;
}

.call-operations-test-drawer__fact-label {
  @apply block text-[0.68rem] uppercase tracking-[0.18em] text-surface-500 dark:text-surface-400;
}

.call-operations-test-drawer__fact strong {
  @apply mt-2 block text-sm font-semibold text-surface-950 dark:text-surface-0;
}

.call-operations-test-drawer__fact span:last-child {
  @apply mt-1 block text-xs text-surface-500 dark:text-surface-400;
}

.call-operations-test-drawer__body-copy {
  @apply text-sm text-surface-700 dark:text-surface-300;
}

.call-operations-test-drawer__code {
  @apply overflow-auto rounded-xl bg-surface-950 p-4 text-xs text-surface-50;
}
</style>
