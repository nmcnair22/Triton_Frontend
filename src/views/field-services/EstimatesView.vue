<template>
  <div class="estimates-page">
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-2">Estimates / Quotes</h1>
        <p class="text-surface-600 dark:text-surface-400">Manage project estimates, quotes, and proposals</p>
      </div>
      <div class="flex gap-2">
        <Button icon="pi pi-plus" label="New Estimate" severity="primary" @click="openEstimateBuilder" />
        <Button icon="pi pi-calendar" label="Schedule Site Survey" severity="info" outlined @click="scheduleSurvey" />
      </div>
    </div>

    <div v-if="!showEstimateBuilder" class="estimates-content">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div class="bg-white dark:bg-surface-900 rounded-lg p-6 border border-surface-200 dark:border-surface-700">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <i class="pi pi-file text-2xl text-blue-600 dark:text-blue-400"></i>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ storeMetrics.open }}</h3>
              <p class="text-surface-600 dark:text-surface-400 text-sm">Open Estimates</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-surface-900 rounded-lg p-6 border border-surface-200 dark:border-surface-700">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
              <i class="pi pi-calendar text-2xl text-teal-600 dark:text-teal-400"></i>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ storeMetrics.surveysScheduled }}</h3>
              <p class="text-surface-600 dark:text-surface-400 text-sm">Site Surveys Scheduled</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-surface-900 rounded-lg p-6 border border-surface-200 dark:border-surface-700">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <i class="pi pi-clock text-2xl text-orange-600 dark:text-orange-400"></i>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ storeMetrics.awaitingApproval }}</h3>
              <p class="text-surface-600 dark:text-surface-400 text-sm">Awaiting Approval</p>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex flex-col gap-3 mb-4">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0">All Estimates</h2>
            <Button icon="pi pi-refresh" text rounded @click="refreshEstimates" />
          </div>
          <div class="flex flex-col md:flex-row md:items-center gap-3">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-sm text-surface-500 mr-1">Status:</span>
              <Tag v-for="s in ALL_STATUSES" :key="s" :value="s" :severity="statusChipSeverity(s)" :class="['cursor-pointer', selectedStatuses.includes(s) ? 'opacity-100' : 'opacity-60']" @click="toggleStatus(s)" />
              <Button v-if="selectedStatuses.length" label="Clear" size="small" text @click="clearStatuses" />
            </div>
            <div class="flex items-center gap-2 ml-0 md:ml-auto">
              <span class="relative">
                <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-surface-500"></i>
                <InputText v-model="clientSearch" placeholder="Search client/project" class="pl-10 w-64" />
              </span>
              <DatePicker v-model="dateFrom" placeholder="From" />
              <DatePicker v-model="dateTo" placeholder="To" />
            </div>
          </div>
        </div>

        <DataTable :value="filteredEstimates" :paginator="true" :rows="10" :loading="isLoading" dataKey="id" :rowHover="true" stripedRows class="p-datatable-sm">
          <Column field="id" header="Estimate ID" sortable style="width:12%">
            <template #body="{data}"><span class="font-medium text-primary">{{ data.id }}</span></template>
          </Column>
          <Column field="clientName" header="Client" sortable style="width:18%">
            <template #body="{data}"><div class="font-medium">{{ data.clientName }}</div></template>
          </Column>
          <Column field="projectName" header="Project" sortable style="width:22%">
            <template #body="{data}"><div class="max-w-xs truncate" :title="data.projectName">{{ data.projectName }}</div></template>
          </Column>
          <Column field="pricingMode" header="Pricing" sortable style="width:10%" />
          <Column field="status" header="Status" sortable style="width:12%">
            <template #body="{data}"><StatusTag :status="data.status"/></template>
          </Column>
          <Column field="owner" header="Owner" sortable style="width:10%">
            <template #body="{data}"><div class="text-surface-700 dark:text-surface-300">{{ data.owner || 'Unassigned' }}</div></template>
          </Column>
          <Column field="total" header="Client Total" sortable style="width:14%">
            <template #body="{data}"><div class="font-medium text-green-600 dark:text-green-400"><MoneyCell :value="data.totals?.grand?.charge || 0"/></div></template>
          </Column>
          <Column field="updatedAt" header="Updated" sortable style="width:12%">
            <template #body="{data}"><span class="text-sm text-surface-600 dark:text-surface-400">{{ formatUpdated(data.updatedAt) }}</span></template>
          </Column>
          <Column header="Actions" style="width:18%">
            <template #body="{data}">
              <div class="flex gap-2">
                <Button icon="pi pi-pencil" text rounded size="small" @click="openBuilderFor(data)" v-tooltip.top="'Open Builder'" />
                <Button icon="pi pi-copy" text rounded size="small" @click="duplicateEstimate(data)" v-tooltip.top="'Duplicate'" />
                <Button icon="pi pi-download" text rounded size="small" @click="downloadEstimate(data)" v-tooltip.top="'Download PDF'" />
                <Button icon="pi pi-history" text rounded size="small" @click="viewHistory(data)" v-tooltip.top="'View History'" />
                <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="confirmDeleteEstimate(data)" v-tooltip.top="'Delete'" />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <div v-else class="estimate-builder-overlay">
      <EstimateBuilder :initial-step="builderInitialStep" :initial-tab="builderInitialTab" @close="closeEstimateBuilder" />
    </div>

    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { storeToRefs } from 'pinia';
import { useEstimatesStore } from '@/stores/estimatesStore';
import EstimateBuilder from '@/components/estimates/EstimateBuilder.vue';
import MoneyCell from '@/components/shared/MoneyCell.vue';
import StatusTag from '@/components/shared/StatusTag.vue';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import InputText from 'primevue/inputtext';
import DatePicker from 'primevue/datepicker';
import ConfirmDialog from 'primevue/confirmdialog';

const toast = useToast();
const confirm = useConfirm();

const estimatesStore = useEstimatesStore();
const { metrics } = storeToRefs(estimatesStore);
const storeMetrics = metrics;

const ALL_STATUSES = ['Draft','Submitted','Awaiting Approval','Approved','Client Sent','Accepted','Rejected','Converted'];
const selectedStatuses = ref([]);
const clientSearch = ref('');
const dateFrom = ref(null);
const dateTo = ref(null);
const isLoading = ref(false);
const showEstimateBuilder = ref(false);
const builderInitialStep = ref(1);
const builderInitialTab = ref('costing');

function statusChipSeverity(s) {
  const map = { Draft:'secondary', Submitted:'info', 'Awaiting Approval':'warning', Approved:'success', 'Client Sent':'info', Accepted:'success', Rejected:'danger', Converted:'success' };
  return map[s] || 'info';
}
function toggleStatus(s) { const i = selectedStatuses.value.indexOf(s); if (i>=0) selectedStatuses.value.splice(i,1); else selectedStatuses.value.push(s); }
function clearStatuses() { selectedStatuses.value = []; }

const filteredEstimates = computed(() => {
  let rows = estimatesStore.query({ statuses: selectedStatuses.value, search: clientSearch.value });
  if (dateFrom.value || dateTo.value) {
    const from = dateFrom.value ? new Date(dateFrom.value).getTime() : -Infinity;
    const to = dateTo.value ? new Date(dateTo.value).getTime() : Infinity;
    rows = rows.filter(e => {
      const t = new Date(e.updatedAt).getTime();
      return t >= from && t <= to;
    });
  }
  return rows;
});

function refreshEstimates() {
  isLoading.value = true;
  setTimeout(() => {
    isLoading.value = false;
    toast.add({ severity:'success', summary:'Refreshed', detail:'Estimates data has been refreshed', life:2000 });
  }, 600);
}

function openEstimateBuilder() {
  const est = estimatesStore.createEstimate({});
  estimatesStore.setCurrent(est.id);
  builderInitialStep.value = 1;
  builderInitialTab.value = 'costing';
  showEstimateBuilder.value = true;
}

function openBuilderFor(estimate) {
  estimatesStore.setCurrent(estimate.id);
  builderInitialStep.value = 1;
  builderInitialTab.value = 'costing';
  showEstimateBuilder.value = true;
}

function scheduleSurvey() {
  if (!estimatesStore.current) {
    const est = estimatesStore.createEstimate({});
    estimatesStore.setCurrent(est.id);
  }
  builderInitialStep.value = 3;
  builderInitialTab.value = 'surveys';
  showEstimateBuilder.value = true;
}

function duplicateEstimate(estimate) {
  const copy = estimatesStore.duplicateEstimate(estimate.id);
  if (copy) toast.add({ severity:'success', summary:'Estimate Duplicated', detail:`Created copy ${copy.id}`, life:2000 });
}

function downloadEstimate(estimate) {
  toast.add({ severity:'success', summary:'Download Started', detail:`Downloading PDF for ${estimate.id}`, life:2000 });
}

function viewHistory(estimate) {
  toast.add({ severity:'info', summary:'History', detail:`History for ${estimate.id} (mock)`, life:2000 });
}

function confirmDeleteEstimate(estimate) {
  confirm.require({
    message:`Delete estimate ${estimate.id}?`, header:'Confirm Deletion', icon:'pi pi-exclamation-triangle',
    rejectProps:{ label:'Cancel', severity:'secondary', outlined:true },
    acceptProps:{ label:'Delete', severity:'danger' },
    accept: () => { estimatesStore.deleteEstimate(estimate.id); toast.add({ severity:'success', summary:'Deleted', detail:`Removed ${estimate.id}`, life:2000 }); }
  });
}

function closeEstimateBuilder() { showEstimateBuilder.value = false; }

function formatUpdated(ts) { try { return new Date(ts).toLocaleString(); } catch { return ts || '—'; } }
</script>

<style scoped>
.estimates-page { padding: 1rem; }
.tab-content { min-height: 60vh; }
.card { background: white; border-radius: 8px; padding: 1.5rem; border: 1px solid var(--surface-border); box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1); }
.dark .card { background: var(--surface-900); border-color: var(--surface-700); }
@media (max-width: 768px) {
  .estimates-page { padding: 0.5rem; }
  .card { padding: 1rem; }
}
:deep(.p-datatable-sm .p-datatable-tbody > tr > td) { padding: 0.75rem 1rem; }
.estimate-builder-overlay { min-height: 100vh; padding: 1rem; }
</style>

