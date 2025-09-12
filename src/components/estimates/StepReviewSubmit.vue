<script setup>
import { ref, computed } from 'vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import MoneyCell from '@/components/shared/MoneyCell.vue';
import PercentCell from '@/components/shared/PercentCell.vue';
import { useEstimatesStore } from '@/stores/estimatesStore';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import VersionsPanel from './VersionsPanel.vue';
import HistoryPanel from './HistoryPanel.vue';

const emit = defineEmits(['prev','close']);
const store = useEstimatesStore();
const est = computed(() => store.current);
const toast = useToast();

const showApprovalDialog = ref(false);
const approvalReason = ref('Margin below target; requesting approval.');
const showAcceptDialog = ref(false);
const selectedVersion = ref(null);
const showQuotePreview = ref(false);
const showVersions = ref(false);
const showHistory = ref(false);

const categoryTotals = computed(() => {
  const e = est.value;
  if (!e) return [];
  const map = {};
  (e.lineItems || []).forEach(it => {
    const cat = it.category || 'Other';
    const qty = Number(it.quantity) || 0;
    const cost = qty * (Number(it.unitCost) || 0);
    const charge = it.pricingType === 'T&M' ? qty * (Number(it.clientRate) || 0) : (cost > 0 ? cost / (1 - (Number(it.margin) || 0) / 100) : 0);
    const cur = map[cat] || { category: cat, cost: 0, charge: 0 };
    cur.cost += cost;
    cur.charge += charge;
    map[cat] = cur;
  });
  return Object.values(map).map(r => ({
    category: r.category,
    perSiteCost: Math.round(r.cost * 100) / 100,
    perSiteCharge: Math.round(r.charge * 100) / 100,
    grandCost: Math.round(r.cost * (est.value?.siteCount || 1) * 100) / 100,
    grandCharge: Math.round(r.charge * (est.value?.siteCount || 1) * 100) / 100
  }));
});

function sendToClient() {
  if (!est.value) return;
  const snap = store.sendToClient(est.value.id);
  if (snap?.tag) {
    toast.add({ severity:'success', summary:'Sent to Client', detail:`Generated ${snap.tag}`, life:2000 });
  } else {
    toast.add({ severity:'success', summary:'Sent to Client', life:1500 });
  }
}

function requestApproval() {
  if (!est.value) return;
  store.requestApproval(est.value.id, approvalReason.value);
  showApprovalDialog.value = false;
}

function approve() { if (est.value) store.setApprovalStatus(est.value.id, 'approved'); }
function reject() { if (est.value) store.setApprovalStatus(est.value.id, 'rejected'); }

function openAccept() {
  selectedVersion.value = est.value?.versions?.[0]?.tag || null;
  showAcceptDialog.value = true;
}

function markAccepted() {
  if (!est.value) return;
  store.markAccepted(est.value.id, selectedVersion.value);
  showAcceptDialog.value = false;
}
</script>

<template>
  <div class="step-content">
    <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-6">Step 4: Review & Submit</h3>
    <div v-if="!est" class="text-surface-500">No estimate selected.</div>
    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg border">
          <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Per‑site Client Charge</div>
          <div class="text-xl font-bold text-green-600 dark:text-green-400"><MoneyCell :value="est.totals?.perSite?.charge || 0"/></div>
        </div>
        <div class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg border">
          <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Per‑site Margin %</div>
          <div class="text-xl font-bold text-blue-600 dark:text-blue-400"><PercentCell :value="est.totals?.perSite?.marginPct || 0" :warn-below="est.targetMarginPct || null"/></div>
        </div>
        <div class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg border">
          <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Grand Total × {{ est.siteCount || 1 }}</div>
          <div class="text-xl font-bold text-blue-600 dark:text-blue-400"><MoneyCell :value="est.totals?.grand?.charge || 0"/></div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg border md:col-span-1">
          <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Pricing Status</div>
          <div class="text-sm">Open bid requests: {{ (est.bidTracks||[]).filter(b=>['Requested','Pending Vendor'].includes(b.status)).length }}</div>
          <div class="mt-2 flex items-center gap-2">
            <Button :label="est.pricingComplete ? 'Pricing Complete' : 'Mark Pricing Complete'" size="small" :severity="est.pricingComplete?'success':'secondary'" @click="store.setPricingComplete(est.id, !est.pricingComplete)" />
            <Button label="Sync winning bids to estimate" size="small" outlined @click="() => { const n = store.convertWinningBidsToLineItems(est.id); toast.add({severity:'success', summary:'Synced', detail:`Added ${n} item(s)`, life:2000}); }" />
          </div>
        </div>
        <div class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg border md:col-span-2">
          <div class="text-sm text-surface-600 dark:text-surface-400 mb-2">Selected Bids</div>
          <div v-if="!((est.bidTracks||[]).some(b=>b.selectedVersionTag))" class="text-surface-500 text-sm">No winning bids selected yet.</div>
          <div v-else>
            <ul class="text-sm space-y-1">
              <li v-for="b in (est.bidTracks||[]).filter(b=>b.selectedVersionTag)" :key="b.id">
                <b>{{ b.vendor_name }}</b> — {{ b.subject }} ({{ b.selectedVersionTag }})
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="space-y-1 text-sm text-surface-700 dark:text-surface-300 mb-6">
        <div><b>Client:</b> {{ est.clientName }}</div>
        <div><b>Project:</b> {{ est.projectName }}</div>
        <div><b>Pricing:</b> {{ est.pricingMode }} | <b>Target Margin:</b> {{ est.targetMarginPct || 0 }}%</div>
        <div><b>Sites:</b> {{ (est.sites?.length || est.siteCount || 1) }}
          <span v-if="est.sites?.length"> — {{ (est.sites||[]).slice(0,3).map(s=>s.name).join(', ') }}<span v-if="(est.sites||[]).length>3">…</span></span>
        </div>
      </div>

      <div class="mb-6">
        <h4 class="font-medium mb-2">Scope Summary</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div class="text-surface-500">Tasks</div>
            <div class="whitespace-pre-wrap max-h-28 overflow-auto">{{ est.tasks || '—' }}</div>
          </div>
          <div>
            <div class="text-surface-500">Labor Requirements</div>
            <div class="whitespace-pre-wrap max-h-28 overflow-auto">{{ est.laborRequirements || '—' }}</div>
          </div>
          <div>
            <div class="text-surface-500">Materials & Equipment</div>
            <div class="whitespace-pre-wrap max-h-28 overflow-auto">{{ est.materialsEquipment || '—' }}</div>
          </div>
        </div>
      </div>

      <div class="mb-6">
        <h4 class="font-medium mb-2">Category Totals</h4>
        <DataTable :value="categoryTotals" class="p-datatable-sm">
          <Column field="category" header="Category" />
          <Column field="perSiteCost" header="Per‑site Cost">
            <template #body="{data}"><MoneyCell :value="data.perSiteCost" /></template>
          </Column>
          <Column field="perSiteCharge" header="Per‑site Charge">
            <template #body="{data}"><MoneyCell :value="data.perSiteCharge" /></template>
          </Column>
          <Column field="grandCost" header="Grand Cost">
            <template #body="{data}"><MoneyCell :value="data.grandCost" /></template>
          </Column>
          <Column field="grandCharge" header="Grand Charge">
            <template #body="{data}"><MoneyCell :value="data.grandCharge" /></template>
          </Column>
        </DataTable>
      </div>

      <div class="mb-6 text-sm">
        <h4 class="font-medium mb-2">Terms</h4>
        <ul class="list-disc pl-5 space-y-1">
          <li>Validity: 30 days from quote date.</li>
          <li>Payment: Net 30 days.</li>
          <li>Warranty: 1 year on parts/labor unless noted otherwise.</li>
        </ul>
      </div>

      <div class="mt-4">
        <div v-if="est.requiresApproval && est.approvalStatus !== 'approved'" class="mb-4">
          <Message severity="warn" icon="pi pi-lock">Approval is required before sending to client.</Message>
          <div class="flex items-center gap-2 mt-2">
            <Button v-if="est.approvalStatus==='none' || est.approvalStatus==='rejected'" label="Request Approval" icon="pi pi-send" @click="showApprovalDialog=true" />
            <Message v-if="est.approvalStatus==='requested'" severity="info" icon="pi pi-clock">Awaiting approval…</Message>
            <Button v-if="est.approvalStatus==='requested'" label="Approve" icon="pi pi-check" severity="success" outlined @click="approve" />
            <Button v-if="est.approvalStatus==='requested'" label="Reject" icon="pi pi-times" severity="danger" outlined @click="reject" />
          </div>
        </div>

        <div class="flex justify-between mt-6 pt-6 border-t border-surface-200 dark:border-surface-700">
          <div class="flex gap-2">
            <Button label="Previous" icon="pi pi-arrow-left" severity="secondary" @click="$emit('prev')" />
          </div>
          <div class="flex gap-2">
            <Button label="Versions" icon="pi pi-list" outlined @click="showVersions=true" />
            <Button label="History" icon="pi pi-history" outlined @click="showHistory=true" />
            <Button label="Generate Quote (mock)" icon="pi pi-file" outlined @click="showQuotePreview=true" />
            <Button label="Send to Client" icon="pi pi-send" :disabled="est.requiresApproval && est.approvalStatus!=='approved'" @click="sendToClient" />
            <Button label="Mark as Accepted" icon="pi pi-check" severity="success" outlined @click="openAccept" />
            <Button label="Close" severity="secondary" @click="$emit('close')" />
          </div>
        </div>
      </div>

      <!-- Request Approval Dialog -->
      <Dialog v-model:visible="showApprovalDialog" header="Request Approval" :modal="true" :draggable="false" class="w-full max-w-lg">
        <div class="space-y-3">
          <label class="block text-sm font-medium">Reason</label>
          <InputText v-model="approvalReason" class="w-full" />
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <Button label="Cancel" severity="secondary" outlined @click="showApprovalDialog=false" />
            <Button label="Request" @click="requestApproval" />
          </div>
        </template>
      </Dialog>

      <!-- Mark as Accepted Dialog -->
      <Dialog v-model:visible="showAcceptDialog" header="Mark as Accepted" :modal="true" :draggable="false" class="w-full max-w-lg">
        <div class="space-y-3">
          <label class="block text-sm font-medium">Accepted Version</label>
          <Select v-model="selectedVersion" :options="(est.versions||[]).map(v=>v.tag)" placeholder="Choose version" class="w-full" />
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <Button label="Cancel" severity="secondary" outlined @click="showAcceptDialog=false" />
            <Button label="Mark Accepted" severity="success" @click="markAccepted" />
          </div>
        </template>
      </Dialog>

      <!-- Quote Preview (mock) -->
      <Dialog v-model:visible="showQuotePreview" header="Quote Preview (Mock)" :modal="true" :draggable="false" class="w-full max-w-5xl">
        <div class="space-y-4 text-sm">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-lg font-semibold">{{ est.clientName }}</div>
              <div class="text-surface-600">{{ est.projectName }}</div>
            </div>
            <div>Sites: {{ est.sites?.length || est.siteCount || 1 }}</div>
          </div>
          <div>
            <h5 class="font-medium mb-1">Scope Summary</h5>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><div class="text-surface-500">Tasks</div><div class="whitespace-pre-wrap">{{ est.tasks || '—' }}</div></div>
              <div><div class="text-surface-500">Labor</div><div class="whitespace-pre-wrap">{{ est.laborRequirements || '—' }}</div></div>
              <div><div class="text-surface-500">Materials</div><div class="whitespace-pre-wrap">{{ est.materialsEquipment || '—' }}</div></div>
            </div>
          </div>
          <div>
            <h5 class="font-medium mb-1">Category Totals</h5>
            <DataTable :value="categoryTotals" class="p-datatable-sm">
              <Column field="category" header="Category" />
              <Column field="perSiteCharge" header="Per‑site Charge">
                <template #body="{data}"><MoneyCell :value="data.perSiteCharge" /></template>
              </Column>
              <Column field="grandCharge" header="Grand Charge">
                <template #body="{data}"><MoneyCell :value="data.grandCharge" /></template>
              </Column>
            </DataTable>
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <Button label="Close" severity="secondary" outlined @click="showQuotePreview=false" />
            <Button label="Download (mock)" icon="pi pi-download" @click="toast.add({severity:'success', summary:'Download started', life:1500})" />
          </div>
        </template>
      </Dialog>

      <!-- Versions / History Panels -->
      <VersionsPanel v-model:visible="showVersions" />
      <HistoryPanel v-model:visible="showHistory" />
    </template>
  </div>
</template>
