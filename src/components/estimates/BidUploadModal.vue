<script setup>
import { ref, computed, watch } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import RadioButton from 'primevue/radiobutton';
import InputNumber from 'primevue/inputnumber';
import DatePicker from 'primevue/datepicker';
import Button from 'primevue/button';
import { useEstimatesStore } from '@/stores/estimatesStore';

const props = defineProps({ visible: { type: Boolean, default: false }, bidId: { type: String, default: null } });
const emit = defineEmits(['update:visible']);
const store = useEstimatesStore();
const est = computed(() => store.current);

const mode = ref('new'); // 'new' or 'replace'
const fileName = ref('');
const amount = ref(0);
const received = ref(null);
const notes = ref('');
const replaceTag = ref(null);

const bid = computed(() => (est.value?.bidTracks || []).find(b => b.id === props.bidId) || null);
const versionTags = computed(() => (bid.value?.versions || []).map(v => v.tag));

function close() { emit('update:visible', false); }

function submit() {
  if (!est.value || !bid.value) return;
  // Create a doc record (metadata only)
  const doc = store.addDocument(est.value.id, { name: fileName.value || `Bid-${Date.now()}.pdf`, type: 'vendor', source: 'vendor' });
  if (mode.value === 'replace' && replaceTag.value) {
    // Update existing version metadata and link doc
    store.updateBidVersion(est.value.id, bid.value.id, replaceTag.value, { amount: amount.value, received_date: received.value, notes, docId: doc.id });
    store.linkDocToBidVersion(est.value.id, bid.value.id, replaceTag.value, doc.id);
  } else {
    // Create a new version and link doc
    const v = store.addBidVersion(est.value.id, bid.value.id, { amount: amount.value, received_date: received.value, notes, docId: doc.id });
    if (v?.tag) store.linkDocToBidVersion(est.value.id, bid.value.id, v.tag, doc.id);
  }
  close();
}
</script>

<template>
  <Dialog :visible="visible" header="Upload Bid" :modal="true" :draggable="false" class="w-full max-w-xl" @update:visible="$emit('update:visible', $event)">
    <div class="space-y-4">
      <div class="field">
        <label class="block text-sm font-medium mb-2">Bid File Name</label>
        <InputText v-model="fileName" class="w-full" placeholder="e.g., VendorQuote_v3.pdf" />
        <small class="text-surface-500">Demo: metadata only; no binary upload.</small>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="field">
          <label class="block text-sm font-medium mb-2">Versioning</label>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2"><RadioButton v-model="mode" inputId="newver" value="new" /><label for="newver">New Version</label></div>
            <div class="flex items-center gap-2"><RadioButton v-model="mode" inputId="replacever" value="replace" /><label for="replacever">Replace Version</label></div>
          </div>
        </div>
        <div class="field" v-if="mode==='replace'">
          <label class="block text-sm font-medium mb-2">Version to Replace</label>
          <Select v-model="replaceTag" :options="versionTags" placeholder="Select version" class="w-full" />
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="field">
          <label class="block text-sm font-medium mb-2">Amount</label>
          <InputNumber v-model="amount" mode="currency" currency="USD" :min="0" :step="0.01" :minFractionDigits="2" class="w-full" />
        </div>
        <div class="field md:col-span-2">
          <label class="block text-sm font-medium mb-2">Received Date</label>
          <DatePicker v-model="received" class="w-full" />
        </div>
      </div>
      <div class="field">
        <label class="block text-sm font-medium mb-2">Notes</label>
        <InputText v-model="notes" class="w-full" />
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" severity="secondary" outlined @click="close" />
        <Button label="Upload" @click="submit" />
      </div>
    </template>
  </Dialog>
</template>

