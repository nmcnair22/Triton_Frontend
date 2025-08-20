<template>
  <div>
    <DataTable :value="locations" :paginator="true" :rows="10">
      <Column field="location_name" header="Location" />
      <Column field="site_number" header="Site #" />
      
      <Column header="Assets">
        <template #body="slotProps">
          <div class="text-sm">
            <div v-for="(count, type) in getAssetSummary(slotProps.data)" :key="type">
              {{ type }}: {{ count }}
            </div>
          </div>
        </template>
      </Column>

      <Column header="SIM">
        <template #body="slotProps">
          <Tag v-if="slotProps.data.sim_details" :severity="getSimSeverity(slotProps.data)">
            {{ slotProps.data.sim_details.code }}
          </Tag>
          <span v-else class="text-gray-400">No SIM</span>
        </template>
      </Column>

      <Column header="Charged For">
        <template #body="slotProps">
          <div class="text-sm">
            <Tag v-for="charge in getDataCharges(slotProps.data)" :key="charge" severity="secondary">
              {{ charge }}
            </Tag>
          </div>
        </template>
      </Column>

      <Column header="Issue">
        <template #body="slotProps">
          <Tag :severity="getIssueSeverity(slotProps.data)" class="text-xs">
            {{ getIssueType(slotProps.data) }}
          </Tag>
        </template>
      </Column>

      <Column header="Impact">
        <template #body="slotProps">
          <div class="text-right font-bold">
            ${{ calculateImpact(slotProps.data) }}
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
const props = defineProps(['locations']);

const getAssetSummary = (location) => {
  const summary = {};
  Object.entries(location.mapped_counts || {}).forEach(([key, value]) => {
    if (!key.startsWith('SIM_')) {
      summary[key] = value;
    }
  });
  return summary;
};

const getDataCharges = (location) => {
  return location.charges
    .filter(c => c.item_no.includes('DATA') || c.item_no.includes('GB'))
    .map(c => c.item_no);
};

const getIssueType = (location) => {
  const hasSim = location.sim_details;
  const simCharged = location.charges.some(c => c.item_no.includes('DATA'));
  
  if (hasSim && !simCharged) return 'SIM NOT BILLED';
  if (!hasSim && simCharged) return 'NO SIM ASSET';
  if (hasSim && simCharged) {
    // Check if carriers match
    const simCarrier = location.sim_details.code.substring(0, 3);
    const chargedCarrier = getDataCharges(location)[0]?.substring(0, 3);
    if (simCarrier !== chargedCarrier) return 'WRONG CARRIER';
  }
  if (location.charges.length === 0) return 'NO BILLING';
  return 'OK';
};

const getIssueSeverity = (location) => {
  const issue = getIssueType(location);
  if (issue === 'NO BILLING') return 'danger';
  if (issue === 'WRONG CARRIER') return 'warning';
  if (issue === 'SIM NOT BILLED') return 'warning';
  if (issue === 'OK') return 'success';
  return 'info';
};

const getSimSeverity = (location) => {
  return getIssueSeverity(location);
};

const calculateImpact = (location) => {
  // Calculate monthly revenue impact
  if (location.charges.length === 0 && location.total_assets > 0) {
    return '269.00'; // Estimated lost revenue
  }
  return '0.00';
};
</script>
