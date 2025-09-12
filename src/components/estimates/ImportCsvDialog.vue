<script setup>
import { ref, computed, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Select from 'primevue/select';
import FileUpload from 'primevue/fileupload';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Message from 'primevue/message';
import * as XLSX from 'xlsx';
import { useToast } from 'primevue/usetoast';
import { useEstimatesStore } from '@/stores/estimatesStore';

const props = defineProps({
  visible: { type: Boolean, default: false },
  mode: { type: String, default: 'lineItems' } // 'lineItems' | 'bids'
});
const emit = defineEmits(['update:visible','imported']);

const toast = useToast();
const store = useEstimatesStore();

const internalVisible = ref(props.visible);
watch(() => props.visible, v => internalVisible.value = v);
watch(internalVisible, v => emit('update:visible', v));

const tab = ref(props.mode); // local mode selector
const csvHeaders = ref([]);
const csvRows = ref([]);
const mapping = ref({});
const preview = ref([]);
const errors = ref([]);

const LINE_ITEM_FIELDS = [
  { key:'category', label:'Category' },
  { key:'pricing_type', label:'Pricing Type (Fixed/T&M)' },
  { key:'role', label:'Role (for T&M)' },
  { key:'description', label:'Description' },
  { key:'vendor_name', label:'Vendor' },
  { key:'qty', label:'Quantity' },
  { key:'unit', label:'Unit' },
  { key:'unit_cost', label:'Unit Cost' },
  { key:'client_rate', label:'Client Rate (T&M)' },
  { key:'margin_pct', label:'Margin % (Fixed)' },
  { key:'client_charge', label:'Client Charge (Fixed)' }
];

const BID_FIELDS = [
  { key:'vendor_name', label:'Vendor' },
  { key:'bid_name', label:'Bid Name/#' },
  { key:'bid_amount', label:'Amount' },
  { key:'received_date', label:'Received Date' },
  { key:'notes', label:'Notes' }
];

function guessMapping(headers, targetFields) {
  const map = {};
  headers.forEach(h => {
    const key = String(h).toLowerCase().replace(/\s+/g,'_');
    const hit = targetFields.find(tf => key.includes(tf.key));
    if (hit) map[h] = hit.key;
  });
  return map;
}

async function onUpload({ files }) {
  errors.value = [];
  preview.value = [];
  if (!files?.length) return;
  const file = files[0];
  const text = await file.text();
  // Use XLSX to parse CSV robustly
  const wb = XLSX.read(text, { type:'string' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(ws, { header:1 });
  if (!json.length) return;
  const headers = json[0];
  const rows = json.slice(1);
  csvHeaders.value = headers;
  csvRows.value = rows.map(r => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = r[i]; });
    return obj;
  });
  mapping.value = guessMapping(headers, tab.value === 'lineItems' ? LINE_ITEM_FIELDS : BID_FIELDS);
  buildPreview();
}

function buildPreview() {
  const rows = csvRows.value || [];
  const map = mapping.value || {};
  if (!rows.length) { preview.value = []; return; }
  const result = rows.map(r => {
    const out = {};
    Object.entries(map).forEach(([from, to]) => { if (to) out[to] = r[from]; });
    return out;
  });
  preview.value = result;
}

function applyImport() {
  const est = store.current;
  if (!est) { toast.add({severity:'warn', summary:'No estimate open', life:2000}); return; }
  if (!preview.value.length) { toast.add({severity:'warn', summary:'Nothing to import', life:2000}); return; }

  if (tab.value === 'lineItems') {
    preview.value.forEach(row => {
      const pricing = String(row.pricing_type || '').toLowerCase();
      const isTM = pricing.includes('t') && !pricing.includes('fix');
      const qty = Number(row.qty) || 1;
      const unitCost = Number(row.unit_cost) || 0;
      const clientRate = Number(row.client_rate) || null;
      const clientCharge = Number(row.client_charge) || null;
      const marginPct = row.margin_pct != null ? Number(row.margin_pct) : null;
      const item = {
        id: Date.now() + Math.random(),
        pricingType: isTM ? 'T&M' : 'Fixed',
        category: row.category || 'Materials',
        description: row.description || '(imported)',
        vendor: row.vendor_name || '',
        quantity: qty,
        unit: row.unit || 'ea',
        unitCost,
        margin: !isTM ? (marginPct ?? 35) : undefined,
        clientRate: isTM ? (clientRate || guessRoleRate(row.role)) : undefined,
        role: isTM ? (row.role || null) : null
      };
      // back-calc margin if client_charge provided
      if (!isTM && clientCharge && qty > 0) {
        const totalCost = qty * unitCost;
        item.margin = clientCharge > 0 ? Math.round(((clientCharge - totalCost)/clientCharge)*10000)/100 : (item.margin || 35);
      }
      store.addLineItem(est.id, item);
    });
  } else {
    preview.value.forEach(row => {
      store.addBid(est.id, {
        vendor_name: row.vendor_name || '',
        bid_name: row.bid_name || '',
        bid_amount: Number(row.bid_amount) || 0,
        received_date: row.received_date || '',
        notes: row.notes || ''
      });
    });
  }
  toast.add({ severity:'success', summary:'Import complete', detail:`Imported ${preview.value.length} row(s)`, life:2000 });
  internalVisible.value = false;
  emit('imported');
}

function guessRoleRate(roleKey) {
  if (!roleKey) return null;
  const rcId = store.current?.rateCardId;
  const rc = store.rateCards.find(r => r.id === rcId);
  const role = rc?.roles?.find(ro => String(ro.key).toLowerCase() === String(roleKey).toLowerCase());
  return role?.clientRate || null;
}
</script>

<template>
  <Dialog v-model:visible="internalVisible" header="Import CSV" :modal="true" :draggable="false" class="w-full max-w-5xl">
    <div class="flex items-center gap-3 mb-4">
      <Button :severity="tab==='lineItems' ? 'primary' : 'secondary'" label="Line Items" text @click="tab='lineItems'" />
      <Button :severity="tab==='bids' ? 'primary' : 'secondary'" label="Bids" text @click="tab='bids'" />
    </div>

    <div class="mb-4">
      <FileUpload name="files[]" mode="basic" :auto="true" :customUpload="true" chooseLabel="Select CSV" @uploader="onUpload" />
      <small class="block mt-2 text-surface-500" v-if="tab==='lineItems'">
        Expected columns (any order): category, pricing_type, role, description, vendor_name, qty, unit, unit_cost, client_rate, margin_pct, client_charge
      </small>
      <small class="block mt-2 text-surface-500" v-else>
        Expected columns (any order): vendor_name, bid_name, bid_amount, received_date, notes
      </small>
    </div>

    <div v-if="csvHeaders.length" class="mb-4">
      <h5 class="font-medium mb-2">Map Columns</h5>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div v-for="h in csvHeaders" :key="h" class="flex items-center gap-2">
          <label class="w-1/2 text-sm">{{ h }}</label>
          <Select v-model="mapping[h]" :options="(tab==='lineItems'?LINE_ITEM_FIELDS:BID_FIELDS)" optionLabel="label" optionValue="key" class="w-1/2" @change="buildPreview" />
        </div>
      </div>
    </div>

    <div v-if="preview.length" class="mb-4">
      <h5 class="font-medium mb-2">Preview (first 20 rows)</h5>
      <DataTable :value="preview.slice(0, 20)" class="p-datatable-sm">
        <Column v-for="f in (tab==='lineItems'?LINE_ITEM_FIELDS:BID_FIELDS)" :key="f.key" :field="f.key" :header="f.label" />
      </DataTable>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" severity="secondary" outlined @click="internalVisible=false" />
        <Button label="Import" :disabled="!preview.length" @click="applyImport" />
      </div>
    </template>
  </Dialog>
</template>

