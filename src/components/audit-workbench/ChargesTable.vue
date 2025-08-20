<template>
  <div class="charges-table">
    <Card>
      <template #title>Charges (Invoice View)</template>
      <template #content>
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm text-gray-600">Total: <b>${{ totalCost }}</b></div>
          <div class="flex items-center gap-2">
            <label>Filter by Bundle</label>
            <Select v-model="bundleFilter" :options="bundleOptions" class="w-56" showClear />
          </div>
        </div>

        <DataTable :value="filteredCharges" size="small" responsiveLayout="scroll" :loading="loading">
          <Column field="bundle" header="Bundle" sortable />
          <Column field="license" header="License/Product" sortable />
          <Column field="quantity" header="Qty" />
          <Column field="amount" header="Unit Price">
            <template #body="{ data }">${{ formatCurrency(data.amount) }}</template>
          </Column>
          <Column field="total_amount" header="Ext. Cost">
            <template #body="{ data }">${{ formatCurrency(data.total_amount) }}</template>
          </Column>
          <Column header="Mapped Asset">
            <template #body="{ data }">
              <Select v-model="data.mapped_unit_id" :options="unitOptions" optionLabel="label" optionValue="id" class="w-56"
                        @change="emitMapping(data)" placeholder="Select unit…" />
            </template>
          </Column>
          <Column header="Status">
            <template #body="{ data }">
              <Tag v-if="data.status==='matched'" value="Matched" severity="success" />
              <Tag v-else-if="data.status==='missing'" value="Missing" severity="warning" />
              <Tag v-else value="Extra" severity="danger" />
            </template>
          </Column>
        </DataTable>

        <!-- Pending mappings indicator -->
        <div v-if="pendingMappings.length > 0" class="mt-3">
          <Message severity="info">
            {{ pendingMappings.length }} pending mapping(s). Run allocation with save to commit changes.
          </Message>
        </div>
      </template>
    </Card>

    <!-- Optional: Locations with this Profile Roll-up -->
    <div class="mt-3">
      <Button label="Locations with this Profile" icon="pi pi-users" text @click="showRollup=true" />
      <Dialog v-model:visible="showRollup" header="Profile Roll-up" modal class="w-[900px]">
        <DataTable :value="profileLocations" size="small" :loading="loadingRollup">
          <Column field="location" header="Location" />
          <Column field="asset_signature" header="Asset Sig." />
          <Column field="monthly_cost" header="Monthly Cost">
            <template #body="{ data }">${{ formatCurrency(data.monthly_cost || 0) }}</template>
          </Column>
          <Column header="">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button icon="pi pi-eye" text size="small" @click="$emit('navigate-location', data.location_id)" />
                <Button icon="pi pi-microchip" text size="small" severity="info" @click="openAssetDrawer(data)" />
              </div>
            </template>
          </Column>
        </DataTable>
      </Dialog>
    </div>

    <!-- Asset Details Drawer (placeholder) -->
    <Dialog v-model:visible="showAssetDrawer" header="Asset Details" modal class="w-[600px]">
      <div class="p-4">
        <Message severity="info">Asset details integration coming soon.</Message>
        <pre class="text-sm bg-gray-50 p-3 rounded mt-3">{{ selectedAssetData }}</pre>
      </div>
      <template #footer>
        <Button label="Close" @click="showAssetDrawer=false" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { auditClient } from '@/services/auditClient'

const props = defineProps({
  locationId: { type:[String,Number], required:true },
  customerId: { type:[String,Number], required:true },
  units: { type:Array, default:()=>[] },
  profileId: { type:[String,Number], default:null }
})
const emit = defineEmits(['map-license','navigate-location'])

const toast = useToast()

const charges = ref([])
const bundleFilter = ref(null)
const showRollup = ref(false)
const profileLocations = ref([])
const loading = ref(false)
const loadingRollup = ref(false)
const chargesNotAvailable = ref(false)
const pendingMappings = ref([])
const showAssetDrawer = ref(false)
const selectedAssetData = ref(null)

const unitOptions = computed(()=> (props.units||[]).map(u => ({ id:u.id, label: u.label || `${u.category} #${u.id}`})))
const totalCost = computed(()=> formatCurrency(charges.value.reduce((s,c)=> s + (c.total_amount||0), 0)))
const bundleOptions = computed(()=> [...new Set(charges.value.map(c=>c.bundle).filter(Boolean))])

const filteredCharges = computed(()=>{
  if (!bundleFilter.value) return charges.value
  return charges.value.filter(c=> c.bundle === bundleFilter.value)
})

// Watch for profile changes to reload charges
watch(() => props.profileId, async (newProfileId) => {
  if (newProfileId) {
    await loadCharges()
  }
})

onMounted(async ()=>{
  await loadCharges()
})

async function loadCharges() {
  if (!props.locationId || !props.customerId) return
  
  loading.value = true
  try {
    // Get location detail which includes charges data
    const res = await auditClient.getLocationDetail(props.customerId, props.locationId)
    charges.value = res?.data?.charges || []
    chargesNotAvailable.value = false
  } catch (error) {
    if (error.response?.status === 404) {
      chargesNotAvailable.value = true
      charges.value = []
      console.log('Location detail or charges not available yet')
    } else {
      console.error('Failed to load location detail:', error)
      toast.add({severity:'error', summary:'Failed to load charges', detail:String(error.message||error)})
    }
  } finally {
    loading.value = false
  }
}

// Map license->unit (emit up; parent may commit on save)
function emitMapping(row){
  const mapping = { 
    license_key: row.license, 
    unit_id: row.mapped_unit_id, 
    bundle: row.bundle, 
    charge_item: row.item_no 
  }
  
  // Store locally for pending indicator (Option A approach)
  const existingIndex = pendingMappings.value.findIndex(m => 
    m.license_key === mapping.license_key && m.charge_item === mapping.charge_item
  )
  
  if (mapping.unit_id) {
    if (existingIndex >= 0) {
      pendingMappings.value[existingIndex] = mapping
    } else {
      pendingMappings.value.push(mapping)
    }
  } else {
    // Remove mapping if unit_id is null
    if (existingIndex >= 0) {
      pendingMappings.value.splice(existingIndex, 1)
    }
  }
  
  emit('map-license', mapping)
}

async function loadProfileRollup() {
  if (!props.profileId) return
  
  loadingRollup.value = true
  try {
    // This would be an endpoint that returns locations using this profile
    // For now, we'll use placeholder data
    profileLocations.value = [
      {
        location_id: props.locationId,
        location: "Current Location",
        asset_signature: "MD:2,CP:1,OR:1",
        monthly_cost: totalCost.value
      }
    ]
  } catch (error) {
    console.error('Failed to load profile rollup:', error)
    toast.add({severity:'error', summary:'Failed to load profile data', detail:String(error.message||error)})
  } finally {
    loadingRollup.value = false
  }
}

function openAssetDrawer(row){
  selectedAssetData.value = row
  showAssetDrawer.value = true
}

// Watch for rollup dialog opening
watch(showRollup, (isOpen) => {
  if (isOpen) {
    loadProfileRollup()
  }
})

function formatCurrency(v){ 
  return (v||0).toFixed(2) 
}

// Clear pending mappings when they're successfully saved
function clearPendingMappings() {
  pendingMappings.value = []
}

// Expose method for parent to clear pending mappings
defineExpose({
  clearPendingMappings
})
</script>

<style scoped>
.charges-table {
  min-height: 400px;
}

/* Enhanced styling consistent with other audit workbench components */
.charges-table :deep(.p-datatable) {
  border: none;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.charges-table :deep(.p-datatable .p-datatable-thead > tr > th) {
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 1rem 1.25rem;
  border-bottom: 2px solid var(--surface-border);
  background: var(--surface-50);
}

.charges-table :deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--surface-border);
  vertical-align: middle;
}

.charges-table :deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: var(--surface-50);
  transition: background 0.2s ease;
}

.charges-table :deep(.p-card) {
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.charges-table :deep(.p-card .p-card-title) {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--surface-900);
}

.charges-table :deep(.p-tag) {
  font-weight: 500;
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
}
</style>
