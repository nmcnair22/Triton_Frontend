<template>
  <div class="topology-mapping-tab">
    <Splitter style="height: calc(100vh - 320px)">
      <!-- LEFT: Units -->
      <SplitterPanel :size="45" class="pr-3">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold">Units</h3>
          <div class="flex gap-2">
            <Button label="+ Wired Internet" size="small" @click="quickAddVirtual('WIRED_TRANSPORT','TRANSPORT','Wired Internet')" />
            <Button label="+ Cellular Internet" size="small" @click="quickAddVirtual('CELLULAR_TRANSPORT','TRANSPORT','Cellular Internet')" />
            <Button label="+ Add Unit" icon="pi pi-plus" size="small" @click="openAddUnit()" />
          </div>
        </div>

        <DataTable :value="units" :loading="loading.units" dataKey="id" stripedRows responsiveLayout="scroll">
          <Column field="label" header="Label" />
          <Column field="category" header="Category" />
          <Column field="layer" header="Layer" />
          <Column header="Links">
            <template #body="{ data }">{{ data.links?.length || 0 }}</template>
          </Column>
          <Column header="Virtual">
            <template #body="{ data }">
              <Tag v-if="data.is_virtual" value="VIRTUAL" severity="info" />
            </template>
          </Column>
          <Column header="Actions" style="width: 180px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button icon="pi pi-share-alt" label="Connections" size="small" text @click="openConnections(data)" />
              </div>
            </template>
          </Column>
        </DataTable>
      </SplitterPanel>

      <!-- RIGHT: Unlinked Raw Assets -->
      <SplitterPanel :size="55" class="pl-3 border-l">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold">Unlinked Raw Assets</h3>
          <div class="flex gap-2">
            <ToggleButton v-model="hideLinked" onLabel="Hide Linked" offLabel="Show All" />
            <Button icon="pi pi-refresh" text @click="reload()" />
          </div>
        </div>

        <Accordion v-model:value="activeAccordionPanel">
          <AccordionPanel v-if="md.length" value="md">
            <AccordionHeader>Meraki Devices (MD)</AccordionHeader>
            <AccordionContent>
              <DataTable :value="filtered(md,'DEVICE')" responsiveLayout="scroll">
                <Column field="id" header="ID">
                  <template #body="{ data }"><code>{{ data.id }}</code></template>
                </Column>
                <Column field="hostname" header="Hostname" />
                <Column field="model" header="Model" />
                <Column field="status" header="Status" />
                <Column field="lan_ip" header="LAN IP" />
                <Column header="">
                  <template #body="{ data }">
                    <Button label="Attach…" size="small" @click="openAttach(data,'MERAKI','DEVICE')" :disabled="isLinked(data.id,'DEVICE')" />
                  </template>
                </Column>
              </DataTable>
            </AccordionContent>
          </AccordionPanel>

          <AccordionPanel v-if="mu.length" value="mu">
            <AccordionHeader>Meraki Uplinks (MU)</AccordionHeader>
            <AccordionContent>
              <DataTable :value="filtered(mu,'UPLINK')" responsiveLayout="scroll">
                <Column field="id" header="ID"><template #body="{ data }"><code>{{ data.id }}</code></template></Column>
                <Column field="parent_device" header="Parent" />
                <Column field="interface" header="Iface" />
                <Column field="ip" header="IP" />
                <Column header=""><template #body="{ data }"><Button label="Attach…" size="small" @click="openAttach(data,'MERAKI','UPLINK')" :disabled="isLinked(data.id,'UPLINK')" /></template></Column>
              </DataTable>
            </AccordionContent>
          </AccordionPanel>

          <AccordionPanel v-if="orion.length" value="orion">
            <AccordionHeader>Orion Nodes (OR)</AccordionHeader>
            <AccordionContent>
              <DataTable :value="filtered(orion,'MONITOR_NODE')" responsiveLayout="scroll">
                <Column field="id" header="ID"><template #body="{ data }"><code>{{ data.id }}</code></template></Column>
                <Column field="hostname" header="Hostname" />
                <Column field="ip" header="IP" />
                <Column field="status" header="Status" />
                <Column header=""><template #body="{ data }"><Button label="Attach…" size="small" @click="openAttach(data,'ORION','MONITOR_NODE')" :disabled="isLinked(data.id,'MONITOR_NODE')" /></template></Column>
              </DataTable>
            </AccordionContent>
          </AccordionPanel>

          <AccordionPanel v-if="cp.length" value="cp">
            <AccordionHeader>Cradlepoint (CP)</AccordionHeader>
            <AccordionContent>
              <DataTable :value="filtered(cp,'DEVICE')" responsiveLayout="scroll">
                <Column field="id" header="ID"><template #body="{ data }"><code>{{ data.id }}</code></template></Column>
                <Column field="hostname" header="Hostname" />
                <Column field="model" header="Model" />
                <Column header=""><template #body="{ data }"><Button label="Attach…" size="small" @click="openAttach(data,'CRADLEPOINT','DEVICE')" :disabled="isLinked(data.id,'DEVICE')" /></template></Column>
              </DataTable>
            </AccordionContent>
          </AccordionPanel>

          <AccordionPanel v-if="sims.length" value="sims">
            <AccordionHeader>SIMs</AccordionHeader>
            <AccordionContent>
              <DataTable :value="filtered(sims,'SIM')" responsiveLayout="scroll">
                <Column field="id" header="ID"><template #body="{ data }"><code>{{ data.id }}</code></template></Column>
                <Column field="iccid" header="ICCID" />
                <Column field="carrier" header="Carrier" />
                <Column field="plan" header="Plan" />
                <Column header=""><template #body="{ data }"><Button label="Attach…" size="small" @click="openAttach(data,'SIM','SIM')" :disabled="isLinked(data.id,'SIM')" /></template></Column>
              </DataTable>
            </AccordionContent>
          </AccordionPanel>

          <AccordionPanel v-if="mn.length" value="mn">
            <AccordionHeader>Meraki Networks (MN)</AccordionHeader>
            <AccordionContent>
              <DataTable :value="filtered(mn,'NETWORK')" responsiveLayout="scroll">
                <Column field="id" header="ID"><template #body="{ data }"><code>{{ data.id }}</code></template></Column>
                <Column field="name" header="Name" />
                <Column field="timezone" header="TZ" />
                <Column header=""><template #body="{ data }"><Button label="Attach…" size="small" @click="openAttach(data,'MERAKI','NETWORK')" :disabled="isLinked(data.id,'NETWORK')" /></template></Column>
              </DataTable>
            </AccordionContent>
          </AccordionPanel>
        </Accordion>
      </SplitterPanel>
    </Splitter>

    <!-- Add Unit -->
    <Dialog v-model:visible="showAddUnit" header="Add Unit" modal class="w-96">
      <div class="space-y-3">
        <div><label>Label</label><InputText v-model="newUnit.label" class="w-full" /></div>
        <div><label>Category</label><Select v-model="newUnit.category" :options="categories" optionLabel="display_name" optionValue="key" class="w-full" /></div>
        <div><label>Layer</label><Select v-model="newUnit.layer" :options="layers" optionLabel="name" optionValue="key" class="w-full" /></div>
        <div class="flex items-center gap-2"><Checkbox v-model="newUnit.is_virtual" :binary="true" /><label>Virtual asset</label></div>
      </div>
      <template #footer>
        <Button label="Cancel" text @click="showAddUnit=false" />
        <Button label="Save" :disabled="!newUnit.label || !newUnit.category || !newUnit.layer" @click="saveUnit()" />
      </template>
    </Dialog>

    <!-- Attach Link -->
    <Dialog v-model:visible="showAttachDialog" header="Attach Raw Record to Unit" modal class="w-96">
      <div class="space-y-3">
        <div><label>Raw ID</label><InputText v-model="attachForm.raw_id" class="w-full" readonly /></div>
        <div><label>Unit</label><Select v-model="attachForm.unit_id" :options="unitOptions" optionLabel="label" optionValue="id" class="w-full" /></div>
        <div><label>Aspect</label><Select v-model="attachForm.aspect" :options="aspectOptions" class="w-full" /></div>
      </div>
      <template #footer>
        <Button label="Cancel" text @click="showAttachDialog=false" />
        <Button label="Attach" :disabled="!attachForm.unit_id || !attachForm.aspect" @click="saveLink()" />
      </template>
    </Dialog>

    <!-- Connections -->
    <Dialog v-model:visible="showConnections" :header="connHeader" modal class="w-[640px]">
      <div class="space-y-3">
        <Message v-if="connError" severity="error">{{ connError }}</Message>
        <Message v-if="relationshipsNotAvailable" severity="info">Unit relationships feature coming soon.</Message>
        <div v-else>
          <div class="p-3 border rounded">
            <h4 class="font-semibold mb-2">Existing</h4>
            <DataTable :value="connectionsForCurrent" size="small">
              <Column field="type" header="Type" />
              <Column field="to_unit_label" header="To Unit" />
              <Column header="">
                <template #body="{ data }"><Button icon="pi pi-trash" text size="small" @click="removeConnection(data)" /></template>
              </Column>
            </DataTable>
          </div>
          <div class="p-3 border rounded">
            <h4 class="font-semibold mb-2">Add</h4>
            <div class="grid grid-cols-2 gap-3">
              <div><label>To Unit</label><Select v-model="connForm.to_unit_id" :options="unitOptionsExceptCurrent" optionLabel="label" optionValue="id" class="w-full" /></div>
              <div><label>Type</label><Select v-model="connForm.type" :options="relTypeOptions" class="w-full" /></div>
            </div>
            <div v-if="primaryUplinkWarning" class="mt-2">
              <Message severity="warn">This unit already has a PRIMARY_UPLINK. Consider using BACKUP_UPLINK instead.</Message>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Close" text @click="showConnections=false" />
        <Button v-if="!relationshipsNotAvailable" label="Add" :disabled="!connForm.to_unit_id || !connForm.type || hasPrimaryUplinkConflict" @click="addConnection()" />
      </template>
    </Dialog>

    <!-- Category Missing Warning -->
    <Dialog v-model:visible="showCategoryWarning" header="Category Not Available" modal class="w-96">
      <Message severity="warn">
        The {{ missingCategory }} category is not available in the system. Please create a unit manually or contact support.
      </Message>
      <template #footer>
        <Button label="OK" @click="showCategoryWarning=false" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useWorkbenchStore } from '@/stores/workbenchStore'
import { auditClient } from '@/services/auditClient'

// props
const props = defineProps({ locationId: { type: [String,Number], required: true } })

const toast = useToast()
const store = useWorkbenchStore()

const loading = reactive({ units:false })
const units = computed(() => store.assetUnits || [])
const raw = computed(() => store.rawAssets || {})
const md   = computed(()=> raw.value.raw_assets?.meraki_devices || [])
const mu   = computed(()=> raw.value.raw_assets?.meraki_uplinks || [])
const orion= computed(()=> raw.value.raw_assets?.orion_nodes || [])
const cp   = computed(()=> raw.value.raw_assets?.cradlepoint_devices || [])
const sims = computed(()=> raw.value.raw_assets?.sims || [])
const mn   = computed(()=> raw.value.raw_assets?.meraki_networks || [])

const hideLinked = ref(false)
const activeAccordionPanel = ref(null) // Controls which accordion panel is open (single panel mode)
const categories = ref([]) // fetched ref data
const layers = ref([
  { key:'TRANSPORT', name:'Transport' },
  { key:'WAN_APPLIANCE', name:'WAN Appliance' },
  { key:'WAN_ACCESS', name:'WAN Access' },
  { key:'LAN_ACCESS', name:'LAN Access' },
  { key:'LAN_DEVICE', name:'LAN Device' },
  { key:'APP_PERF', name:'App/Perf' }
])

// add unit dialog
const showAddUnit = ref(false)
const newUnit = reactive({ label:'', category:null, layer:null, is_virtual:false })
const showCategoryWarning = ref(false)
const missingCategory = ref('')

function openAddUnit(){ 
  Object.assign(newUnit,{label:'',category:null,layer:null,is_virtual:false}); 
  showAddUnit.value=true 
}

async function saveUnit(){
  try{
    loading.units=true
    await store.createAssetUnit(props.locationId, { ...newUnit })
    toast.add({severity:'success', summary:'Unit created'})
    showAddUnit.value=false
  }catch(e){ 
    toast.add({severity:'error', summary:'Create failed', detail:String(e.message||e)}) 
  }
  finally{ 
    loading.units=false 
  }
}

async function quickAddVirtual(category, layer, label){
  // Check if category exists
  const categoryExists = categories.value.some(c => c.key === category)
  if (!categoryExists) {
    missingCategory.value = category
    showCategoryWarning.value = true
    return
  }
  
  Object.assign(newUnit, { label, category, layer, is_virtual:true })
  await saveUnit()
}

// attach dialog
const showAttachDialog = ref(false)
const attachForm = reactive({ raw_id:'', unit_id:null, source_system:'', aspect:'' })
const aspectOptions = ref([]) // Fetched from backend ref API
const unitOptions = computed(()=> (units.value||[]).map(u=>({ id:u.id, label:u.label || `${u.category} #${u.id}` })))

function openAttach(row, system, aspect){ 
  Object.assign(attachForm,{ raw_id:row.id, source_system:system, aspect, unit_id:null })
  showAttachDialog.value=true 
}

async function saveLink(){
  try{
    // client 1:1 guard
    if (store.assetUnits.flatMap(u=>u.links||[]).some(l=> l.raw_id===attachForm.raw_id && l.aspect===attachForm.aspect)){
      throw new Error(`Already linked for ${attachForm.aspect}`)
    }
    await store.createAssetUnitLink(props.locationId, { ...attachForm })
    toast.add({severity:'success', summary:'Linked'})
    showAttachDialog.value=false
  }catch(e){ 
    toast.add({severity:'error', summary:'Link failed', detail:String(e.message||e)}) 
  }
}

// filter helper
function filtered(list, aspect){
  if (!hideLinked.value) return list
  const linkedIds = new Set(store.assetUnits.flatMap(u=> (u.links||[]).filter(l=> l.aspect===aspect).map(l=> l.raw_id)))
  return list.filter(x=> !linkedIds.has(x.id))
}

function isLinked(raw_id, aspect){
  return store.assetUnits.flatMap(u=>u.links||[]).some(l=> l.raw_id===raw_id && l.aspect===aspect)
}

// relationships
const showConnections = ref(false)
const currentUnit = ref(null)
const connError = ref('')
const connForm = reactive({ to_unit_id:null, type:null })
const relTypeOptions = ref([]) // Fetched from backend ref API
const unitOptionsExceptCurrent = computed(()=> 
  (units.value||[])
    .filter(u=> !currentUnit.value || u.id!==currentUnit.value.id)
    .map(u=>({ id:u.id, label:u.label || `${u.category} #${u.id}` }))
)
const connections = ref([]) // fetched list for all units
const relationshipsNotAvailable = ref(false)
const connectionsForCurrent = computed(()=> 
  connections.value
    .filter(r=> r.from_unit_id===currentUnit.value?.id)
    .map(r=> ({
      ...r, 
      to_unit_label: (units.value.find(u=>u.id===r.to_unit_id)?.label || `#${r.to_unit_id}`)
    }))
)

const connHeader = computed(() => 
  currentUnit.value ? `Connections: ${currentUnit.value.label || `#${currentUnit.value.id}`}` : 'Connections'
)

// Business rule validation
const primaryUplinkWarning = computed(() => {
  if (connForm.type !== 'PRIMARY_UPLINK') return false
  return connectionsForCurrent.value.some(conn => conn.type === 'PRIMARY_UPLINK')
})

const hasPrimaryUplinkConflict = computed(() => {
  if (connForm.type !== 'PRIMARY_UPLINK') return false
  return connectionsForCurrent.value.some(conn => conn.type === 'PRIMARY_UPLINK')
})

function openConnections(u){ 
  currentUnit.value = u
  connForm.to_unit_id=null
  connForm.type=null
  connError.value = ''
  showConnections.value=true
  loadConnections() 
}

async function loadConnections(){
  try {
    const response = await auditClient.getUnitRelationships(props.locationId)
    connections.value = response.data?.relationships || []
    relationshipsNotAvailable.value = false
  } catch (error) {
    if (error.response?.status === 404) {
      relationshipsNotAvailable.value = true
      connections.value = []
    } else {
      console.error('Error loading relationships:', error)
      connError.value = 'Failed to load relationships'
    }
  }
}

async function addConnection(){
  try{
    // Single primary uplink validation
    if (connForm.type === 'PRIMARY_UPLINK' && 
        connectionsForCurrent.value.some(conn => conn.type === 'PRIMARY_UPLINK')) {
      throw new Error('Unit already has a PRIMARY_UPLINK. Use BACKUP_UPLINK instead.')
    }

    await auditClient.createUnitRelationships(props.locationId, [{ 
      from_unit_id: currentUnit.value.id, 
      to_unit_id: connForm.to_unit_id, 
      type: connForm.type 
    }])
    await loadConnections()
    connForm.to_unit_id=null
    connForm.type=null
    toast.add({severity:'success', summary:'Connection added'})
  }catch(e){ 
    connError.value = String(e.message||e)
  }
}

async function removeConnection(rel){ 
  try {
    await auditClient.deleteUnitRelationship(props.locationId, rel.id)
    await loadConnections()
    toast.add({severity:'success', summary:'Connection removed'})
  } catch(e) {
    connError.value = String(e.message||e)
  }
}

// lifecycle
async function reload(){ 
  await store.loadRawAssets(props.locationId)
  await store.loadAssetUnits(props.locationId) 
}

onMounted(async ()=>{
  try {
    // fetch ref categories (dynamic; do not hardcode)
    const categoriesResponse = await auditClient.getAssetCategories()
    categories.value = categoriesResponse.data?.categories || []
  } catch (error) {
    console.error('Failed to load asset categories:', error)
    toast.add({severity:'warn', summary:'Categories unavailable', detail:'Quick-add features may be limited'})
  }
  
  // Fetch aspect options from backend API (defensive)
  try {
    const aspectsResponse = await auditClient.http.get('/audit/ref/aspects')
    aspectOptions.value = aspectsResponse.data?.aspects || []
  } catch (error) {
    console.warn('Aspects endpoint not available, using fallback')
    aspectOptions.value = ['DEVICE','UPLINK','INTERFACE','SIM','MONITOR_NODE','NETWORK']
  }
  
  // Fetch relationship types from backend API (defensive) 
  try {
    const relTypesResponse = await auditClient.http.get('/audit/ref/relationship-types')
    relTypeOptions.value = relTypesResponse.data?.types || []
  } catch (error) {
    console.warn('Relationship types endpoint not available, using fallback')
    relTypeOptions.value = ['PRIMARY_UPLINK','BACKUP_UPLINK','MONITOR','REDUNDANT']
  }
  
  if (!store.rawAssets) await store.loadRawAssets(props.locationId)
  await store.loadAssetUnits(props.locationId)
})
</script>

<style scoped>
.topology-mapping-tab {
  min-height: 400px;
}

/* Enhanced styling consistent with RawAssetsTab */
.topology-mapping-tab :deep(.p-splitter) {
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  overflow: hidden;
}

.topology-mapping-tab :deep(.p-datatable) {
  border: none;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.topology-mapping-tab :deep(.p-datatable .p-datatable-thead > tr > th) {
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 1rem 1.25rem;
  border-bottom: 2px solid var(--surface-border);
  background: var(--surface-50);
}

.topology-mapping-tab :deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--surface-border);
  vertical-align: middle;
}

.topology-mapping-tab :deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: var(--surface-50);
  transition: background 0.2s ease;
}

.topology-mapping-tab :deep(.p-accordion .p-accordion-header) {
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.topology-mapping-tab :deep(.p-accordion .p-accordion-content) {
  border: none;
  border-radius: 0 0 6px 6px;
  padding: 1rem;
}
</style>
