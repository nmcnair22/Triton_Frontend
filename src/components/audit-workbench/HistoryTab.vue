<template>
  <div class="history-tab">
    <!-- Historical View Banner (when viewing past audit run) -->
    <Message v-if="isHistoricalView" severity="info" :closable="false" class="mb-4">
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-3">
          <i class="pi pi-clock text-blue-500 text-xl"></i>
          <div>
            <div class="font-semibold">Viewing Historical Data</div>
            <div class="text-sm">
              Comparing audit run #{{ auditRunId }} from {{ formatHistoricalDate(auditRunId) }}
            </div>
          </div>
        </div>
        <Button 
          label="Return to Latest" 
          icon="pi pi-arrow-right" 
          severity="secondary" 
          size="small"
          @click="returnToLatest"
        />
      </div>
    </Message>

    <!-- Signature Changes Warning (after rescan) -->
    <Message v-if="signatureDiff" severity="warn" :closable="false" class="mb-4">
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-3">
          <i class="pi pi-exclamation-triangle text-orange-500 text-xl"></i>
          <div>
            <div class="font-semibold">Signatures Changed After Rescan</div>
            <div class="text-sm space-y-1">
              <div v-for="change in signatureDiff" :key="change.type" class="flex items-center gap-2">
                <Tag :value="change.type.toUpperCase()" :severity="change.type === 'asset' ? 'info' : 'warning'" class="text-xs" />
                <code class="text-xs bg-surface-100 dark:bg-surface-800 px-1 rounded">{{ change.before }}</code>
                <i class="pi pi-arrow-right text-xs"></i>
                <code class="text-xs bg-surface-100 dark:bg-surface-800 px-1 rounded">{{ change.after }}</code>
              </div>
            </div>
          </div>
        </div>
        <Button 
          label="Review Allocation" 
          icon="pi pi-arrow-right" 
          severity="warning" 
          size="small"
          @click="reviewAllocation"
        />
      </div>
    </Message>

    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Left Panel: Current Location Info -->
      <div class="lg:col-span-1">
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-map-marker text-blue-500"></i>
              <span>Location Status</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <!-- Location Details -->
              <div>
                <label class="text-sm font-medium text-surface-600 dark:text-surface-400">Location</label>
                <div class="font-medium">{{ locationDetail?.location_name || 'Unknown' }}</div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-surface-600 dark:text-surface-400">Site Number</label>
                  <div class="font-medium">{{ locationDetail?.site_number || 'N/A' }}</div>
                </div>
                <div>
                  <label class="text-sm font-medium text-surface-600 dark:text-surface-400">Status</label>
                  <div>
                    <Tag 
                      :value="locationDetail?.audit_status || 'unknown'" 
                      :severity="getStatusSeverity(locationDetail?.audit_status)"
                      class="text-xs"
                    />
                  </div>
                </div>
              </div>

              <!-- Last Audited -->
              <div>
                <label class="text-sm font-medium text-surface-600 dark:text-surface-400">Last Audited</label>
                <div class="font-medium">{{ formatDate(locationDetail?.last_audited_at) || 'Never' }}</div>
              </div>

              <!-- Signatures -->
              <div>
                <label class="text-sm font-medium text-surface-600 dark:text-surface-400">Current Signatures</label>
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <Tag value="ASSETS" severity="info" class="text-xs" />
                    <code class="text-xs bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded">
                      {{ locationDetail?.asset_signature || 'NO_ASSETS' }}
                    </code>
                  </div>
                  <div class="flex items-center gap-2">
                    <Tag value="CHARGES" severity="warning" class="text-xs" />
                    <code class="text-xs bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded">
                      {{ locationDetail?.charge_signature || 'NO_CHARGES' }}
                    </code>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="pt-4 border-t border-surface-200 dark:border-surface-700">
                <Button 
                  label="Trigger Rescan" 
                  icon="pi pi-refresh" 
                  severity="secondary" 
                  size="small"
                  class="w-full"
                  :loading="workbenchStore.loading.rescan"
                  @click="triggerRescan"
                />
                <small class="text-surface-500 mt-2 block">
                  Re-audit this location to detect changes
                </small>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Right Panel: Audit History -->
      <div class="lg:col-span-2">
        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="pi pi-history text-green-500"></i>
                <span>Audit History</span>
              </div>
              <Button 
                icon="pi pi-refresh" 
                severity="secondary" 
                text
                size="small"
                :loading="workbenchStore.loading.history"
                @click="refreshHistory"
              />
            </div>
          </template>
          <template #content>
            <!-- History not available -->
            <Message v-if="workbenchStore.errors.history" severity="info" class="mb-4">
              <div class="flex flex-col items-center gap-2">
                <i class="pi pi-info-circle text-xl"></i>
                <div class="font-semibold">Audit History Not Available</div>
                <div class="text-sm">History tracking is not enabled in your environment</div>
              </div>
            </Message>

            <!-- Audit Runs Table -->
            <DataTable 
              v-else
              :value="auditRuns" 
              :loading="workbenchStore.loading.history"
              size="small"
              responsiveLayout="scroll"
              :paginator="auditRuns.length > 10"
              :rows="10"
              sortField="started_at"
              :sortOrder="-1"
            >
              <Column field="id" header="Run ID" style="width: 80px">
                <template #body="{ data }">
                  <Tag 
                    :value="'#' + data.id" 
                    severity="info" 
                    class="text-xs cursor-pointer"
                    @click="viewHistoricalRun(data.id)"
                  />
                </template>
              </Column>
              
              <Column field="audit_type" header="Type" style="width: 120px">
                <template #body="{ data }">
                  <Tag 
                    :value="data.audit_type" 
                    :severity="data.audit_type === 'full-override' ? 'warning' : 'info'"
                    class="text-xs"
                  />
                </template>
              </Column>
              
              <Column field="status" header="Status" style="width: 100px">
                <template #body="{ data }">
                  <Tag 
                    :value="data.status" 
                    :severity="getStatusSeverity(data.status)"
                    class="text-xs"
                  />
                </template>
              </Column>
              
              <Column field="started_at" header="Started" style="width: 140px">
                <template #body="{ data }">
                  <span class="text-sm">{{ formatDateTime(data.started_at) }}</span>
                </template>
              </Column>
              
              <Column field="total_assets" header="Assets" style="width: 80px">
                <template #body="{ data }">
                  <span class="text-sm font-medium">{{ data.total_assets || 0 }}</span>
                </template>
              </Column>
              
              <Column field="total_monthly_cost" header="Monthly Cost" style="width: 120px">
                <template #body="{ data }">
                  <span class="text-sm font-medium">
                    ${{ parseFloat(data.total_monthly_cost || 0).toFixed(2) }}
                  </span>
                </template>
              </Column>
              
              <Column field="created_by" header="Created By">
                <template #body="{ data }">
                  <span class="text-sm">{{ data.created_by || 'System' }}</span>
                </template>
              </Column>
              
              <Column header="Actions" style="width: 100px">
                <template #body="{ data }">
                  <div class="flex gap-1">
                    <Button 
                      icon="pi pi-eye" 
                      severity="secondary" 
                      text
                      size="small"
                      v-tooltip="'View Historical Data'"
                      @click="viewHistoricalRun(data.id)"
                    />
                    <Button 
                      icon="pi pi-clone" 
                      severity="secondary" 
                      text
                      size="small"
                      v-tooltip="'Compare to Current'"
                      @click="compareRun(data.id)"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>

            <!-- Empty State -->
            <div v-if="auditRuns.length === 0 && !workbenchStore.loading.history && !workbenchStore.errors.history" 
                 class="text-center p-8">
              <i class="pi pi-history text-4xl text-surface-400 mb-4"></i>
              <div class="text-lg font-medium text-surface-600 dark:text-surface-400 mb-2">No Audit History</div>
              <div class="text-sm text-surface-500">
                This location hasn't been audited yet or history is not available
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Historical View Comparison Dialog -->
    <Dialog v-model:visible="showComparison" header="Audit Run Comparison" modal class="w-[800px]">
      <div v-if="comparisonData" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <h4 class="font-semibold mb-2">Current (Latest)</h4>
            <div class="space-y-2">
              <div class="p-3 bg-surface-50 dark:bg-surface-800 rounded">
                <div class="text-sm font-medium">Asset Signature</div>
                <code class="text-xs">{{ comparisonData.current.asset_signature }}</code>
              </div>
              <div class="p-3 bg-surface-50 dark:bg-surface-800 rounded">
                <div class="text-sm font-medium">Charge Signature</div>
                <code class="text-xs">{{ comparisonData.current.charge_signature }}</code>
              </div>
            </div>
          </div>
          <div>
            <h4 class="font-semibold mb-2">Historical (Run #{{ comparisonData.historical.id }})</h4>
            <div class="space-y-2">
              <div class="p-3 bg-surface-50 dark:bg-surface-800 rounded">
                <div class="text-sm font-medium">Asset Signature</div>
                <code class="text-xs">{{ comparisonData.historical.asset_signature || 'N/A' }}</code>
              </div>
              <div class="p-3 bg-surface-50 dark:bg-surface-800 rounded">
                <div class="text-sm font-medium">Charge Signature</div>
                <code class="text-xs">{{ comparisonData.historical.charge_signature || 'N/A' }}</code>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <Button 
          label="Close" 
          severity="secondary" 
          @click="showComparison = false" 
        />
        <Button 
          v-if="comparisonData"
          label="View Historical Data" 
          @click="viewHistoricalRun(comparisonData.historical.id)" 
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useWorkbenchStore } from '@/stores/workbenchStore';
import { useToast } from 'primevue/usetoast';

// Props
const props = defineProps({
  locationId: {
    type: Number,
    required: true
  },
  customerId: {
    type: Number,
    required: true
  }
});

// Composables
const route = useRoute();
const router = useRouter();
const workbenchStore = useWorkbenchStore();
const toast = useToast();

// Reactive state
const showComparison = ref(false);
const comparisonData = ref(null);

// Computed
const auditRuns = computed(() => workbenchStore.auditRuns || []);
const locationDetail = computed(() => workbenchStore.locationDetail);
const isHistoricalView = computed(() => !!route.query.audit_run_id);
const auditRunId = computed(() => route.query.audit_run_id);
const signatureDiff = computed(() => workbenchStore.getSignatureDiff());

// Methods
const refreshHistory = async () => {
  await workbenchStore.loadAuditRuns(props.customerId, props.locationId);
};

const triggerRescan = async () => {
  try {
    await workbenchStore.rescanLocation(props.customerId, props.locationId);
    toast.add({
      severity: 'success',
      summary: 'Rescan Started',
      detail: 'Location rescan has been queued. Results will update automatically.',
      life: 5000
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Rescan Failed',
      detail: error.response?.data?.message || 'Failed to start rescan',
      life: 5000
    });
  }
};

const viewHistoricalRun = (runId) => {
  // Navigate to workbench with audit_run_id parameter
  router.push({
    path: route.path,
    query: { ...route.query, audit_run_id: runId }
  });
  showComparison.value = false;
};

const compareRun = (runId) => {
  const historicalRun = auditRuns.value.find(run => run.id === runId);
  if (!historicalRun) return;
  
  comparisonData.value = {
    current: {
      asset_signature: locationDetail.value?.asset_signature,
      charge_signature: locationDetail.value?.charge_signature
    },
    historical: historicalRun
  };
  showComparison.value = true;
};

const returnToLatest = () => {
  // Remove audit_run_id from query to return to latest view
  const query = { ...route.query };
  delete query.audit_run_id;
  router.push({ path: route.path, query });
};

const reviewAllocation = () => {
  // Emit event to parent to switch to Licensing tab
  emit('switch-tab', '2');
};

// Formatting helpers
const formatDate = (dateString) => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatHistoricalDate = (runId) => {
  const run = auditRuns.value.find(r => r.id === parseInt(runId));
  return run ? formatDate(run.started_at) : 'Unknown';
};

const getStatusSeverity = (status) => {
  const severityMap = {
    'completed': 'success',
    'running': 'info',
    'pending': 'warning',
    'awaiting_validation': 'warning',
    'failed': 'danger',
    'idle': 'secondary'
  };
  return severityMap[status] || 'secondary';
};

// Emit definition
const emit = defineEmits(['switch-tab']);

// Initialize data on mount
onMounted(async () => {
  // Load audit history
  await refreshHistory();
});
</script>

<style scoped>
.history-tab {
  /* Component-specific styles */
}

.history-tab :deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: var(--surface-100);
}

.history-tab :deep(.p-tag) {
  cursor: pointer;
  transition: all 0.2s;
}

.history-tab :deep(.p-tag:hover) {
  transform: scale(1.05);
}
</style>
