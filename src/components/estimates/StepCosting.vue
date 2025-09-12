<script setup>
import { computed, ref } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';
import { useEstimatesStore } from '@/stores/estimatesStore';
import MoneyCell from '@/components/shared/MoneyCell.vue';
import PercentCell from '@/components/shared/PercentCell.vue';
import TotalsBar from '@/components/shared/TotalsBar.vue';
import LineItemModal from './LineItemModal.vue';
import SurveyRequestModal from './SurveyRequestModal.vue';
import Message from 'primevue/message';
import ImportCsvDialog from './ImportCsvDialog.vue';

const props = defineProps({ initialTab: { type: String, default: 'costing' } });
const emit = defineEmits(['prev','next']);
const toast = useToast();
const store = useEstimatesStore();
const est = computed(() => store.current);

const activeTab = ref(props.initialTab);
const showLineItem = ref(false);
const editing = ref(null);
const showSurvey = ref(false);
const showImport = ref(false);
const showGuardrail = computed(() => est.value?.requiresApproval);
const marginView = ref('margin'); // 'margin' | 'markup'
const totalsView = ref('grand'); // 'perSite' | 'grand'

const currentRoles = computed(() => {
  const rcId = est.value?.rateCardId;
  const rc = store.rateCards.find(r => r.id === rcId);
  return rc?.roles || [];
});

function getCategorySeverity(cat) {
  const map = { Labor:'info', Materials:'success', Travel:'warning', 'Other Fees':'secondary' };
  return map[cat] || 'info';
}

function openNew() { editing.value = null; showLineItem.value = true; }
function editItem(row) { editing.value = row; showLineItem.value = true; }
function saveItem(item) {
  showLineItem.value = false;
  if (!est.value) return;
  if (editing.value?.id) {
    store.updateLineItem(est.value.id, editing.value.id, item);
    toast.add({ severity:'success', summary:'Line Item Updated', life:2000 });
  } else {
    item.id = Date.now();
    store.addLineItem(est.value.id, item);
    toast.add({ severity:'success', summary:'Line Item Added', life:2000 });
  }
}
function removeItem(row) {
  if (!est.value) return;
  store.deleteLineItem(est.value.id, row.id);
  toast.add({ severity:'success', summary:'Line Item Removed', life:2000 });
}

function marginPctForRow(row) {
  if (row.pricingType === 'T&M') {
    const cr = Number(row.clientRate) || 0;
    const uc = Number(row.unitCost) || 0;
    if (cr <= 0) return 0;
    return Math.round(((cr - uc) / cr) * 10000) / 100;
  }
  return Number(row.margin) || 0;
}

function markupPctForRow(row) {
  const qty = Number(row.quantity) || 0;
  const uc = Number(row.unitCost) || 0;
  const cost = qty * uc;
  let charge = 0;
  if (row.pricingType === 'T&M') {
    const cr = Number(row.clientRate) || 0;
    charge = qty * cr;
  } else {
    const m = Number(row.margin) || 0;
    charge = cost > 0 ? cost / (1 - m / 100) : 0;
  }
  if (cost <= 0) return 0;
  return Math.round(((charge - cost) / cost) * 10000) / 100;
}
</script>

<template>
  <div class="step-content">
    <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-6">Step 3: Costing, Site Survey & Documents</h3>

    <div v-if="!est" class="text-surface-500">No estimate selected.</div>
    <template v-else>
      <!-- Tabs -->
      <div class="mb-6">
        <div class="flex border-b border-surface-200 dark:border-surface-700">
          <button @click="activeTab='costing'" :class="['px-4 py-2 font-medium text-sm border-b-2 transition-colors', activeTab==='costing' ? 'border-primary text-primary' : 'border-transparent text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-100']">Line Items & Costing</button>
          <button @click="activeTab='surveys'" :class="['px-4 py-2 font-medium text-sm border-b-2 transition-colors', activeTab==='surveys' ? 'border-primary text-primary' : 'border-transparent text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-100']">Site Surveys & Bids</button>
          <button @click="activeTab='documents'" :class="['px-4 py-2 font-medium text-sm border-b-2 transition-colors', activeTab==='documents' ? 'border-primary text-primary' : 'border-transparent text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-100']">Documents & Processing</button>
        </div>
      </div>

      <!-- Guardrail Warning -->
      <Message v-if="showGuardrail" severity="warn" icon="pi pi-exclamation-triangle" class="mb-4">
        Overall margin is below the target margin. Approval required before sending to client.
      </Message>

      <!-- Costing -->
      <div v-if="activeTab==='costing'" class="tab-content">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h4 class="text-lg font-medium">Line Items</h4>
            <p class="text-sm text-surface-600 dark:text-surface-400">Add and manage cost line items for this estimate</p>
          </div>
          <div class="flex items-center gap-3">
            <div class="hidden md:flex items-center gap-2 mr-2">
              <span class="text-xs text-surface-500">View</span>
              <SelectButton v-model="marginView" :options="[{label:'Margin %',value:'margin'},{label:'Markup %',value:'markup'}]" optionLabel="label" optionValue="value" size="small" />
              <span class="text-xs text-surface-500 ml-3">Totals</span>
              <SelectButton v-model="totalsView" :options="[{label:'Per-site',value:'perSite'},{label:'Grand',value:'grand'}]" optionLabel="label" optionValue="value" size="small" />
            </div>
            <Button label="Import CSV" icon="pi pi-upload" severity="secondary" outlined @click="showImport=true" />
            <Button label="Add Line Item" icon="pi pi-plus" @click="openNew" />
          </div>
        </div>

        <DataTable :value="est.lineItems" :paginator="false" dataKey="id" :rowHover="true" stripedRows class="p-datatable-sm"
                   :emptyMessage="'No line items added yet. Click Add Line Item to get started.'">
          <Column field="category" header="Category" style="width:12%">
            <template #body="{data}">
              <Tag :value="data.category" :severity="getCategorySeverity(data.category)" />
            </template>
          </Column>
          <Column field="description" header="Description" style="width:25%">
            <template #body="{data}"><div class="max-w-xs truncate" :title="data.description">{{ data.description }}</div></template>
          </Column>
          <Column field="vendor" header="Vendor" style="width:15%">
            <template #body="{data}"><span class="text-surface-600 dark:text-surface-400">{{ data.vendor || 'N/A' }}</span></template>
          </Column>
          <Column field="pricingType" header="Type" style="width:8%" />
          <Column field="role" header="Role" style="width:10%">
            <template #body="{data}">{{ data.pricingType==='T&M' ? (data.role || '—') : '—' }}</template>
          </Column>
          <Column field="clientRate" header="Client Rate" style="width:10%">
            <template #body="{data}"><span v-if="data.pricingType==='T&M'"><MoneyCell :value="data.clientRate || 0" /></span><span v-else>—</span></template>
          </Column>
          <Column field="quantity" header="Qty" style="width:8%" />
          <Column field="unitCost" header="Unit Cost" style="width:10%">
            <template #body="{data}"><MoneyCell :value="data.unitCost" /></template>
          </Column>
          <Column field="margin" :header="marginView==='margin' ? 'Margin %' : 'Markup %'" style="width:10%">
            <template #body="{data}">
              <PercentCell :value="marginView==='margin' ? marginPctForRow(data) : markupPctForRow(data)" />
            </template>
          </Column>
          <Column header="Client Charge" style="width:12%">
            <template #body="{data}">
              <MoneyCell :value="data.pricingType==='T&M' ? (data.quantity||0)*(data.clientRate||0) : ((data.quantity||0)*(data.unitCost||0))/(1-(data.margin||0)/100)" />
            </template>
          </Column>
          <Column header="Actions" style="width:10%">
            <template #body="{data}">
              <div class="flex gap-2">
                <Button icon="pi pi-pencil" text rounded size="small" v-tooltip.top="'Edit'" @click="editItem(data)" />
                <Button icon="pi pi-trash" text rounded size="small" severity="danger" v-tooltip.top="'Remove'" @click="removeItem(data)" />
              </div>
            </template>
          </Column>
        </DataTable>

        <div class="my-6">
          <TotalsBar :perSite="est.totals?.perSite || {cost:0,charge:0}"
                     :siteCount="est.siteCount || 1"
                     :targetMarginPct="est.targetMarginPct || null"
                     :mode="totalsView"
                     :view="marginView" />
        </div>

        <div class="flex justify-between mt-8 pt-6 border-t border-surface-200 dark:border-surface-700">
          <Button label="Previous" icon="pi pi-arrow-left" severity="secondary" @click="$emit('prev')" />
          <Button label="Next" icon="pi pi-arrow-right" iconPos="right" @click="$emit('next')" />
        </div>
      </div>

      <!-- Surveys & Bids -->
      <div v-else-if="activeTab==='surveys'" class="tab-content">
        <div class="flex justify-between items-center mb-6">
          <h4 class="text-lg font-medium">Site Surveys & Bids</h4>
          <div class="flex items-center gap-2">
            <Button label="Request Survey" icon="pi pi-send" @click="showSurvey=true" />
            <Button label="New Bid (mock)" icon="pi pi-plus" severity="secondary" outlined @click="store.addBid(est.id, { vendor_name: 'Vendor Co', bid_name: 'Bid A', bid_amount: 1000, received_date: new Date().toISOString(), notes: '' })" />
          </div>
        </div>
        <div v-if="!(est.surveys?.length)">
          <p class="text-surface-500">No surveys yet.</p>
        </div>
        <DataTable v-else :value="est.surveys" dataKey="id" class="p-datatable-sm">
          <Column field="id" header="ID" style="width:12%" />
          <Column field="vendor" header="Vendor" style="width:18%" />
          <Column field="location" header="Location" />
          <Column field="status" header="Status" style="width:12%">
            <template #body="{data}"><Tag :value="data.status" severity="info"/></template>
          </Column>
          <Column field="scheduledDate" header="Date" style="width:16%" />
          <Column field="estimatedCost" header="Est. Cost" style="width:12%">
            <template #body="{data}"><MoneyCell :value="data.estimatedCost || 0" /></template>
          </Column>
        </DataTable>

        <h5 class="font-medium mt-6">Bids</h5>
        <div v-if="!(est.bids?.length)"><p class="text-surface-500">No bids yet.</p></div>
        <DataTable v-else :value="est.bids" dataKey="id" class="p-datatable-sm">
          <Column field="vendor_name" header="Vendor" />
          <Column field="bid_name" header="Bid Name/#" />
          <Column field="received_date" header="Received" />
          <Column field="bid_amount" header="Amount">
            <template #body="{data}"><MoneyCell :value="data.bid_amount || 0" /></template>
          </Column>
          <Column field="status" header="Status" />
          <Column header="Actions" style="width:16%">
            <template #body="{data}">
              <div class="flex gap-2">
                <Button label="Select for Line Item" icon="pi pi-check" size="small" @click="store.selectBidForLineItem(est.id, data.id)" />
                <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="store.deleteBid(est.id, data.id)" />
              </div>
            </template>
          </Column>
        </DataTable>

        <div class="flex justify-between mt-8 pt-6 border-t border-surface-200 dark:border-surface-700">
          <Button label="Previous" icon="pi pi-arrow-left" severity="secondary" @click="$emit('prev')" />
          <Button label="Next" icon="pi pi-arrow-right" iconPos="right" @click="$emit('next')" />
        </div>
      </div>

      <!-- Documents placeholder -->
      <div v-else class="tab-content">
        <StepDocuments />
        <div class="flex justify-between mt-8 pt-6 border-t border-surface-200 dark:border-surface-700">
          <Button label="Previous" icon="pi pi-arrow-left" severity="secondary" @click="$emit('prev')" />
          <Button label="Next" icon="pi pi-arrow-right" iconPos="right" @click="$emit('next')" />
        </div>
      </div>
    </template>

    <LineItemModal v-model:visible="showLineItem" :value="editing" :vendors="store.vendors" :roles="currentRoles" @save="saveItem" />
    <SurveyRequestModal v-model:visible="showSurvey" />
    <ImportCsvDialog v-model:visible="showImport" :mode="'lineItems'" @imported="toast.add({severity:'success', summary:'Imported', life:1500})" />
  </div>
</template>
