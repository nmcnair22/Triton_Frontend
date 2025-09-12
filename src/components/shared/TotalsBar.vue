<script setup>
import { computed } from 'vue';
import MoneyCell from './MoneyCell.vue';
import PercentCell from './PercentCell.vue';

const props = defineProps({
  perSite: { type: Object, required: true },
  siteCount: { type: Number, default: 1 },
  targetMarginPct: { type: Number, default: null },
  mode: { type: String, default: 'both' }, // 'perSite' | 'grand' | 'both'
  view: { type: String, default: 'margin' } // 'margin' | 'markup'
});

const grand = computed(() => ({
  cost: (props.perSite.cost || 0) * (props.siteCount || 1),
  charge: (props.perSite.charge || 0) * (props.siteCount || 1),
  marginAmt: ((props.perSite.charge || 0) - (props.perSite.cost || 0)) * (props.siteCount || 1),
  marginPct: (props.perSite.charge || 0) > 0
    ? (((props.perSite.charge || 0) - (props.perSite.cost || 0)) / (props.perSite.charge || 1)) * 100
    : 0
}));

const perSitePct = computed(() => {
  if (props.view === 'markup') {
    const cost = props.perSite.cost || 0;
    const charge = props.perSite.charge || 0;
    if (cost <= 0) return 0;
    return ((charge - cost) / cost) * 100;
  }
  // margin
  const charge = props.perSite.charge || 0;
  const cost = props.perSite.cost || 0;
  return charge > 0 ? ((charge - cost) / charge) * 100 : 0;
});

const grandPct = computed(() => {
  const g = grand.value;
  if (props.view === 'markup') {
    if ((g.cost || 0) <= 0) return 0;
    return ((g.charge - g.cost) / g.cost) * 100;
  }
  return g.charge > 0 ? ((g.charge - g.cost) / g.charge) * 100 : 0;
});
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div v-if="mode!=='grand'" class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg border">
      <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Per‑site Cost</div>
      <div class="text-xl font-bold"><MoneyCell :value="perSite.cost" /></div>
    </div>
    <div v-if="mode!=='grand'" class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg border">
      <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Per‑site Client Charge</div>
      <div class="text-xl font-bold text-green-600 dark:text-green-400"><MoneyCell :value="perSite.charge" /></div>
    </div>
    <div v-if="mode!=='grand'" class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg border">
      <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Per‑site {{ view==='markup' ? 'Markup' : 'Margin' }}</div>
      <div class="text-xl font-bold text-orange-600 dark:text-orange-400"><MoneyCell :value="(perSite.charge||0)-(perSite.cost||0)" /></div>
      <div class="text-sm"><PercentCell :value="perSitePct" :warn-below="view==='margin' ? (targetMarginPct ?? null) : null"/></div>
    </div>
    <div v-if="mode!=='perSite'" class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg border">
      <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Grand Total × {{ siteCount }}</div>
      <div class="text-xl font-bold text-blue-600 dark:text-blue-400"><MoneyCell :value="grand.charge" /></div>
      <div class="text-xs text-surface-500 mt-1">{{ view==='markup' ? 'Markup %' : 'Margin %' }}: <PercentCell :value="grandPct" /></div>
    </div>
  </div>
</template>
