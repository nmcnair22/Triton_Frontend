<script setup>
import { computed, ref } from 'vue';
import Drawer from 'primevue/drawer';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import InputNumber from 'primevue/inputnumber';
import { useEstimatesStore } from '@/stores/estimatesStore';
import MoneyCell from '@/components/shared/MoneyCell.vue';
import BidVersionItemsEditor from './BidVersionItemsEditor.vue';

const props = defineProps({ visible: { type: Boolean, default: false }, bidId: { type: String, default: null } });
const emit = defineEmits(['update:visible']);
const store = useEstimatesStore();
const est = computed(() => store.current);

const bid = computed(() => (est.value?.bidTracks || []).find(b => b.id === props.bidId) || null);
const noteText = ref('');
const showItems = ref(false);
const activeVersionTag = ref(null);

function close() { emit('update:visible', false); }
function addNote() {
  if (!noteText.value?.trim() || !est.value || !bid.value) return;
  store.addNote(est.value.id, { text: noteText.value, related: { type: 'bid', id: bid.value.id } });
  noteText.value = '';
}

function addVersion() {
  if (!est.value || !bid.value) return;
  store.addBidVersion(est.value.id, bid.value.id, { amount: 0 });
}

function selectWinner(tag) {
  if (!est.value || !bid.value) return;
  store.selectWinningBidVersion(est.value.id, bid.value.id, tag);
}

function editItems(tag) {
  activeVersionTag.value = tag;
  showItems.value = true;
}

const relatedNotes = computed(() => (est.value?.notes || []).filter(n => n.related?.type === 'bid' && n.related?.id === bid.value?.id));

// Document linking
const docToLink = ref(null);
const versionForDoc = ref(null);
const docs = computed(() => est.value?.documents || []);
function linkDocToThisBid() {
  if (!est.value || !bid.value || !docToLink.value) return;
  store.linkDocToBid(est.value.id, bid.value.id, docToLink.value);
  docToLink.value = null;
}
function linkDocToThisVersion() {
  if (!est.value || !bid.value || !docToLink.value || !versionForDoc.value) return;
  store.linkDocToBidVersion(est.value.id, bid.value.id, versionForDoc.value, docToLink.value);
  docToLink.value = null;
}
</script>

<template>
  <Drawer :visible="visible" @update:visible="$emit('update:visible', $event)" position="right" header="Bid Details" class="!w-full md:!w-[90vw] lg:!w-[80vw] xl:!w-[70vw]" :modal="true">
    <div v-if="!bid" class="text-surface-500">No bid selected.</div>
    <template v-else>
      <div class="mb-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs text-surface-500 mb-1">Vendor</label>
            <InputText v-model="bid.vendor_name" class="w-full" />
          </div>
          <div>
            <label class="block text-xs text-surface-500 mb-1">Subject</label>
            <InputText v-model="bid.subject" class="w-full" />
          </div>
          <div>
            <label class="block text-xs text-surface-500 mb-1">Category</label>
            <Select v-model="bid.category" :options="['Labor','Materials','Travel','Other Fees']" class="w-full" />
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          <div>
            <label class="block text-xs text-surface-500 mb-1">Status</label>
            <Select v-model="bid.status" :options="['Requested','Pending Vendor','Received','Selected','Not Selected','Cancelled']" class="w-full" />
          </div>
          <div>
            <label class="block text-xs text-surface-500 mb-1">Expected</label>
            <DatePicker v-model="bid.expectedAt" class="w-full" />
          </div>
          <div>
            <label class="block text-xs text-surface-500 mb-1">Due</label>
            <DatePicker v-model="bid.dueAt" class="w-full" />
          </div>
        </div>
        <div class="mt-3 flex justify-end"><Button label="Save" size="small" @click="store.updateBidTrack(est.id, bid.id, { vendor_name: bid.vendor_name, subject: bid.subject, category: bid.category, status: bid.status, expectedAt: bid.expectedAt, dueAt: bid.dueAt })" /></div>
      </div>

      <div class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <h5 class="font-medium">Versions</h5>
          <Button label="Add Version" icon="pi pi-plus" size="small" @click="addVersion" />
        </div>
        <DataTable :value="bid.versions || []" dataKey="tag" class="p-datatable-sm">
          <Column field="tag" header="Tag" />
          <Column field="received_date" header="Received">
            <template #body="{data}"><DatePicker v-model="data.received_date" class="w-full" /></template>
          </Column>
          <Column field="amount" header="Amount">
            <template #body="{data}"><InputNumber v-model="data.amount" mode="currency" currency="USD" :min="0" :step="0.01" :minFractionDigits="2" class="w-full" /></template>
          </Column>
          <Column field="notes" header="Notes">
            <template #body="{data}"><InputText v-model="data.notes" class="w-full" /></template>
          </Column>
          <Column field="status" header="Status" />
          <Column header="Actions" style="width:36%">
            <template #body="{data}">
              <div class="flex gap-2">
                <Button label="Save" size="small" text @click="store.updateBidVersion(est.id, bid.id, data.tag, { amount: data.amount, received_date: data.received_date, notes: data.notes })" />
                <Button label="Select" size="small" outlined @click="selectWinner(data.tag)" :disabled="bid.selectedVersionTag===data.tag" />
                <Button label="Enter Financials" size="small" text @click="editItems(data.tag)" />
                <Button icon="pi pi-trash" size="small" text severity="danger" @click="store.deleteBidVersion(est.id, bid.id, data.tag)" />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <div class="mb-4">
        <h5 class="font-medium mb-2">Link Documents</h5>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
          <div>
            <label class="block text-sm mb-1">Document</label>
            <Select v-model="docToLink" :options="docs" optionLabel="name" optionValue="id" class="w-full" />
          </div>
          <div>
            <label class="block text-sm mb-1">Version</label>
            <Select v-model="versionForDoc" :options="(bid.versions||[]).map(v=>v.tag)" placeholder="Optional for version link" class="w-full" />
          </div>
          <div class="flex gap-2">
            <Button label="Link to Bid" size="small" :disabled="!docToLink" @click="linkDocToThisBid" />
            <Button label="Link to Version" size="small" outlined :disabled="!docToLink || !versionForDoc" @click="linkDocToThisVersion" />
          </div>
        </div>
      </div>

      <div class="mb-4">
        <h5 class="font-medium mb-2">Notes</h5>
        <div class="flex items-center gap-2 mb-2">
          <InputText v-model="noteText" placeholder="Add a note about this bid" class="w-full" />
          <Button label="Add" size="small" @click="addNote" />
        </div>
        <div v-if="!(relatedNotes.length)" class="text-surface-500">No notes yet.</div>
        <ul v-else class="space-y-2 text-sm">
          <li v-for="n in relatedNotes" :key="n.id">
            <div class="text-surface-500">{{ n.at }}</div>
            <div>{{ n.text }}</div>
          </li>
        </ul>
      </div>
    </template>
  </Drawer>
  <BidVersionItemsEditor v-model:visible="showItems" :bid-id="bid?.id" :version-tag="activeVersionTag" />
  
</template>
