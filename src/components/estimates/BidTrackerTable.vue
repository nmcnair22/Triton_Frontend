<script setup>
import { computed, ref } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { useEstimatesStore } from '@/stores/estimatesStore';
import MoneyCell from '@/components/shared/MoneyCell.vue';
import BidRequestModal from './BidRequestModal.vue';
import BidDrawer from './BidDrawer.vue';
import BidUploadModal from './BidUploadModal.vue';

const store = useEstimatesStore();
const est = computed(() => store.current);
const showNew = ref(false);
const showDrawer = ref(false);
const activeBidId = ref(null);
const showUpload = ref(false);

const rows = computed(() => (est.value?.bidTracks || []).map(bt => {
  const top = (bt.versions || [])[0];
  return {
    ...bt,
    versionsCount: (bt.versions || []).length,
    topAmount: top?.amount || 0
  };
}));

function open(b) { activeBidId.value = b.id; showDrawer.value = true; }
function uploadBid(b) { activeBidId.value = b.id; showUpload.value = true; }
function selectWinner(b) { if (!b.selectedVersionTag && b.versions?.[0]?.tag) store.selectWinningBidVersion(est.value.id, b.id, b.versions[0].tag); }
function deleteBid(b) { store.deleteBidTrack(est.value.id, b.id); }
</script>

<template>
  <div class="flex items-center justify-between mb-3">
    <h5 class="font-medium">Bid Tracking</h5>
    <Button label="New Bid Request" icon="pi pi-plus" size="small" @click="showNew=true" />
  </div>
  <DataTable :value="rows" dataKey="id" class="p-datatable-sm" :emptyMessage="'No bids yet. Click New Bid Request.'">
    <Column field="vendor_name" header="Vendor" />
    <Column field="category" header="Category" />
    <Column field="subject" header="Subject" />
    <Column field="status" header="Status">
      <template #body="{data}"><Tag :value="data.status" severity="info"/></template>
    </Column>
    <Column field="expectedAt" header="Expected" />
    <Column field="dueAt" header="Due" />
    <Column field="receivedAt" header="Received" />
    <Column field="versionsCount" header="# Versions" />
    <Column field="topAmount" header="Latest Amount">
      <template #body="{data}"><MoneyCell :value="data.topAmount || 0" /></template>
    </Column>
    <Column header="Actions" style="width:28%">
      <template #body="{data}">
        <div class="flex gap-2">
          <Button label="Open" size="small" outlined @click="open(data)" />
          <Button label="Upload Bid…" size="small" text @click="uploadBid(data)" />
          <Button label="Select Winner" size="small" text @click="selectWinner(data)" :disabled="!!data.selectedVersionTag || !(data.versions?.length)" />
          <Button icon="pi pi-trash" size="small" text severity="danger" @click="deleteBid(data)" />
        </div>
      </template>
    </Column>
  </DataTable>

  <BidRequestModal v-model:visible="showNew" />
  <BidDrawer v-model:visible="showDrawer" :bid-id="activeBidId" />
  <BidUploadModal v-model:visible="showUpload" :bid-id="activeBidId" />
</template>
