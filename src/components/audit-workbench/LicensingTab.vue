<template>
  <div class="licensing-tab">
    <!-- Header controls -->
    <div class="grid gap-3 md:grid-cols-4 mb-3">
      <div>
        <label class="block text-sm mb-1">Charge Profile</label>
        <Select v-model="profileId" :options="profiles" optionLabel="name" optionValue="id" class="w-full" 
                  placeholder="Select profile..." />
      </div>
      <div class="flex items-end">
        <Button v-if="createProfileAvailable" label="Create Profile" icon="pi pi-plus" class="w-full md:w-auto" @click="showCreateProfile=true" />
        <div v-else class="text-sm text-gray-500">Profile creation coming soon</div>
      </div>
      <div>
        <label class="block text-sm mb-1">Service Level</label>
        <Select v-model="serviceLevel" :options="serviceLevels" optionLabel="label" optionValue="key" class="w-full" 
                  placeholder="Select level..." />
      </div>
      <div class="flex items-end justify-end">
        <Button label="Run Allocation" icon="pi pi-play"
                :disabled="!canRunAllocation"
                :loading="loading.allocation"
                @click="runAllocation(true)" />
      </div>
    </div>

    <!-- Gating message when requirements not met -->
    <div v-if="!canRunAllocation" class="mb-3">
      <Message severity="info">
        <div class="flex flex-col gap-1">
          <div class="font-semibold">Requirements for Running Allocation:</div>
          <ul class="list-disc list-inside text-sm">
            <li v-if="unitCount === 0" class="text-orange-600">At least 1 unit must be created (current: {{ unitCount }})</li>
            <li v-if="!profileId" class="text-orange-600">Charge profile must be selected</li>
            <li v-if="!serviceLevel" class="text-orange-600">Service level must be selected</li>
          </ul>
        </div>
      </Message>
    </div>

    <Tabs v-model:value="activeSubTab">
      <TabList>
        <Tab value="0">Allocation</Tab>
        <Tab value="1">Charges</Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="0">
        <div v-if="!allocation && !hasRunAllocation" class="text-center p-8">
          <div class="text-gray-500 mb-4">
            <i class="pi pi-info-circle text-4xl"></i>
          </div>
          <h3 class="text-xl font-semibold mb-2">No Allocation Results</h3>
          <p class="text-gray-600 mb-4">Run allocation to see required vs available analysis, uncovered units, and mismatches.</p>
          <Button label="Run Allocation" icon="pi pi-play" :disabled="!canRunAllocation" @click="runAllocation(true)" />
        </div>

        <div v-else>
          <div class="grid md:grid-cols-3 gap-3">
            <Card>
              <template #title>Required vs Available</template>
              <template #content>
                <DataTable :value="reqAvailRows" size="small">
                  <Column field="category" header="Category" />
                  <Column field="required" header="Required" />
                  <Column field="available" header="Available" />
                  <Column header="Status">
                    <template #body="{ data }">
                      <Tag v-if="data.available >= data.required" value="OK" severity="success" />
                      <Tag v-else :value="`-${data.required - data.available}`" severity="warning" />
                    </template>
                  </Column>
                </DataTable>
              </template>
            </Card>

            <Card>
              <template #title>Uncovered Units</template>
              <template #content>
                <DataTable :value="allocation?.uncovered || []" size="small" v-if="allocation?.uncovered?.length">
                  <Column field="category" header="Category" />
                  <Column field="unit_id" header="Unit" />
                  <Column header="">
                    <template #body="{ data }">
                      <Button label="Create Issue" size="small" text @click="openIssue('missing_coverage', data)" />
                    </template>
                  </Column>
                </DataTable>
                <Message v-else severity="success">No uncovered units 🎉</Message>
              </template>
            </Card>

            <Card>
              <template #title>Unused Licenses</template>
              <template #content>
                <DataTable :value="allocation?.unused || []" size="small" v-if="allocation?.unused?.length">
                  <Column field="category" header="Category" />
                  <Column field="quantity" header="Quantity" />
                </DataTable>
                <Message v-else severity="info">No unused licenses.</Message>
              </template>
            </Card>
          </div>

          <Card class="mt-3">
            <template #title>Mismatches</template>
            <template #content>
              <DataTable :value="allocation?.mismatches || []" size="small" v-if="allocation?.mismatches?.length">
                <Column field="category" header="Category" />
                <Column field="detail" header="Detail" />
                <Column header="">
                  <template #body="{ data }">
                    <div class="flex gap-1">
                      <Button label="Create Issue" size="small" text @click="openIssue('charge_mismatch', data)" />
                      <Button label="Ignore 30d" size="small" severity="secondary" text @click="ignoreMismatch(data)" />
                    </div>
                  </template>
                </Column>
              </DataTable>
              <Message v-else severity="success">No mismatches 🎉</Message>
            </template>
          </Card>

          <!-- License Coverage Analysis -->
          <div v-if="allocation?.license_analysis" class="mt-6">
            <div class="flex items-center gap-2 mb-4">
              <i class="pi pi-key text-primary text-xl"></i>
              <h4 class="text-lg font-semibold text-surface-900 dark:text-surface-0">
                License Coverage Analysis
              </h4>
            </div>
            
            <LicenseCoveragePanel 
              :bundle-coverage="allocation.license_analysis.bundle_coverage"
              :unmapped-charges="allocation.license_analysis.unmapped_charges"
              :location-id="locationId"
              @navigate-to-mapping="navigateToMapping"
              @navigate-to-bundles="navigateToBundles"
              @refresh-coverage="refreshCoverage"
            />
          </div>

          <!-- Save License Mapping -->
          <div v-if="allocation && hasRunAllocation" class="mt-6">
            <Card class="save-mapping-card">
              <template #content>
                <div class="flex items-center justify-between">
                  <div>
                    <h5 class="font-medium mb-2">Save License Allocation</h5>
                    <p class="text-sm text-surface-600">
                      Save the current license allocation mapping for this location
                    </p>
                  </div>
                  <Button 
                    label="Save License Mapping" 
                    icon="pi pi-save"
                    @click="saveLicenseMapping"
                    :loading="loading.save"
                    severity="success"
                  />
                </div>
              </template>
            </Card>
          </div>
        </div>
        </TabPanel>

        <TabPanel value="1">
        <div v-if="chargesNotAvailable" class="text-center p-8">
          <Message severity="info">
            <div class="flex flex-col items-center gap-2">
              <i class="pi pi-info-circle text-2xl"></i>
              <div class="font-semibold">Charges View Coming Soon</div>
              <div class="text-sm">Invoice-style charges data not available yet</div>
            </div>
          </Message>
        </div>
        <ChargesTable
          v-else
          ref="chargesTableRef"
          :location-id="locationId"
          :customer-id="customerId"
          :units="units"
          :profile-id="profileId"
          @map-license="onMapLicense"
          @navigate-location="$emit('navigate-location', $event)"
        />
        </TabPanel>
      </TabPanels>
    </Tabs>

    <!-- Create Profile -->
    <Dialog v-model:visible="showCreateProfile" header="Create Charge Profile" modal class="w-[520px]">
      <div class="space-y-3">
        <div><label>Name</label><InputText v-model="createForm.name" class="w-full" /></div>
        <div><label>Description</label><Textarea v-model="createForm.description" class="w-full" rows="3" /></div>
        <div>
          <label>Contract (Optional)</label>
          <InputText v-model="createForm.contract_id" type="number" placeholder="Enter contract ID (optional)" class="w-full" />
          <small class="text-gray-500">Contract ID is optional for charge profile creation.</small>
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" text @click="showCreateProfile=false" />
        <Button label="Create" :disabled="!createForm.name" :loading="loading.createProfile" @click="createProfile()" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useWorkbenchStore } from '@/stores/workbenchStore'
import { auditClient } from '@/services/auditClient'
import ChargesTable from './ChargesTable.vue'
import LicenseCoveragePanel from './LicenseCoveragePanel.vue'

const props = defineProps({ 
  locationId: { type:[String,Number], required:true }, 
  customerId:{type:[String,Number], required:true} 
})

const emit = defineEmits(['navigate-location', 'create-issue'])

const toast = useToast()
const store = useWorkbenchStore()

// state
const profiles = ref([])
const profileId = ref(null)
const serviceLevels = ref([])
const serviceLevel = ref(null)
const showCreateProfile = ref(false)
const createForm = reactive({ name:'', description:'', contract_id:null })
const allocation = ref(null)
const hasRunAllocation = ref(false)
const activeSubTab = ref("0")
const chargesNotAvailable = ref(false)
const createProfileAvailable = ref(false)
const chargesTableRef = ref(null)

// loading states
const loading = reactive({
  allocation: false,
  createProfile: false,
  save: false
})

const units = computed(()=> store.assetUnits || [])
const unitCount = computed(()=> units.value.length)

// Business logic for allocation gating
const canRunAllocation = computed(() => {
  return unitCount.value > 0 && profileId.value && serviceLevel.value
})

const reqAvailRows = computed(()=>{
  if (!allocation.value) return []
  const req = allocation.value.required || {}
  const avail = allocation.value.available || {}
  const cats = Array.from(new Set([...Object.keys(req), ...Object.keys(avail)]))
  return cats.map(c=>({ category:c, required:req[c]||0, available:avail[c]||0 }))
})

// Watch for profile/service level changes to clear previous allocation
watch([profileId, serviceLevel], () => {
  if (hasRunAllocation.value) {
    allocation.value = null
    hasRunAllocation.value = false
  }
})

// load
onMounted(async ()=>{
  await loadInitialData()
})

async function loadInitialData() {
  try {
    // Get all profiles for customer (includes charge profiles)
    const profilesResponse = await auditClient.getProfiles(props.customerId)
    const allProfiles = profilesResponse.data?.profiles || []
    
    // Filter for charge profiles (type: CP)
    profiles.value = allProfiles.filter(p => p.profile_type === 'CP').map(p => ({
      id: p.id,
      name: p.profile_name,
      description: p.description || '',
      profile_type: p.profile_type
    }))
    
    // Service levels (ref)
    const levelsResponse = await auditClient.getServiceLevels(props.customerId)
    const levels = levelsResponse.data?.levels || []
    serviceLevels.value = levels.map(l=> ({ key:l.key, label:l.label || l.key }))
    
    // No longer need contracts endpoint - profiles include this data
    
    // Check if create profile endpoint is available
    createProfileAvailable.value = typeof auditClient.createChargeProfile === 'function'
    
    // Check if charges are available in location detail
    try {
      const locationDetail = await auditClient.getLocationDetail(props.customerId, props.locationId)
      chargesNotAvailable.value = !locationDetail.data?.charges
    } catch (error) {
      if (error.response?.status === 404) {
        chargesNotAvailable.value = true
      }
    }
    
    // Ensure units loaded (required gating)
    if (!store.assetUnits?.length) {
      await store.loadAssetUnits(props.locationId)
    }
  } catch (error) {
    console.error('Failed to load initial data:', error)
    toast.add({severity:'error', summary:'Load failed', detail:'Failed to load licensing data'})
  }
}

// actions
async function runAllocation(save){
  if (!canRunAllocation.value) {
    toast.add({severity:'warn', summary:'Cannot run allocation', detail:'Please ensure all requirements are met'})
    return
  }
  
  loading.allocation = true
  try{
    const res = await auditClient.runAllocation(props.locationId, { 
      charge_profile_id: profileId.value, 
      service_level_key: serviceLevel.value, 
      save,
      include_license_analysis: true
    })
    allocation.value = res.data
    hasRunAllocation.value = true
    
    if (save) { 
      store.tabStates.allocationSaved = true
      // Clear pending mappings in charges table
      if (chargesTableRef.value?.clearPendingMappings) {
        chargesTableRef.value.clearPendingMappings()
      }
      toast.add({severity:'success', summary:'Allocation saved'}) 
    } else {
      toast.add({severity:'info', summary:'Allocation preview generated'})
    }
  }catch(e){ 
    toast.add({severity:'error', summary:'Allocation failed', detail:String(e.message||e)}) 
  } finally {
    loading.allocation = false
  }
}

async function createProfile(){
  if (!createProfileAvailable.value) {
    toast.add({severity:'warn', summary:'Feature unavailable', detail:'Profile creation not available yet'})
    return
  }
  
  loading.createProfile = true
  try{
    const res = await auditClient.createChargeProfile?.(props.customerId, { type:'CP', ...createForm })
    if (res?.data?.id){ 
      profiles.value.push({ 
        id:res.data.id, 
        name:createForm.name, 
        description:createForm.description 
      })
      profileId.value = res.data.id
      showCreateProfile.value=false
      toast.add({severity:'success', summary:'Profile created'}) 
      
      // Reset form
      Object.assign(createForm, { name:'', description:'', contract_id:null })
    }
  }catch(e){ 
    toast.add({severity:'error', summary:'Create failed', detail:String(e.message||e)}) 
  } finally {
    loading.createProfile = false
  }
}

function onMapLicense(mapping){
  // Option A: store in FE and commit on next allocation save
  // The mapping is already handled by ChargesTable component
  console.log('License mapping:', mapping)
}

// issues/exceptions (removed duplicate - proper implementation below)

async function ignoreMismatch(row){
  try{
    await auditClient.createException(props.locationId, { 
      code:'PLAN_MISMATCH', 
      scope:'PLAN', 
      predicate:{ detail: row.detail }, 
      note:'Ignored via Licensing' 
    })
    toast.add({severity:'success', summary:'Exception added (30d)'})
    
    // Refresh allocation to update mismatches
    if (hasRunAllocation.value && canRunAllocation.value) {
      await runAllocation(false) // Preview only
    }
  }catch(e){ 
    toast.add({severity:'error', summary:'Failed to add exception', detail:String(e.message||e)}) 
  }
}

// Issue creation integration (prefill form and navigate to Issues tab)
function openIssue(issueType, data) {
  // Build prefilled issue data
  const issueData = {
    issue_type: issueType,
    severity: 'medium', // Default
    title: generateIssueTitle(issueType, data),
    description: generateIssueDescription(issueType, data),
    expected_value: data.expected || '',
    actual_value: data.actual || '',
    metadata: data
  }
  
  // Emit to parent to navigate to Issues tab with prefilled data
  emit('create-issue', issueData)
}

function generateIssueTitle(issueType, data) {
  switch (issueType) {
    case 'charge_mismatch':
      return `Charge mismatch: ${data.category || 'Unknown'}`
    case 'missing_coverage':
      return `Missing coverage: ${data.category || 'Unknown'}`
    default:
      return `${issueType.replace(/_/g, ' ')}: ${data.detail || data.category || 'Unknown'}`
  }
}

function generateIssueDescription(issueType, data) {
  const details = []
  
  if (data.category) details.push(`Category: ${data.category}`)
  if (data.detail) details.push(`Detail: ${data.detail}`)
  if (data.expected) details.push(`Expected: ${data.expected}`)
  if (data.actual) details.push(`Actual: ${data.actual}`)
  
  return `**Issue Type:** ${issueType.replace(/_/g, ' ')}\n\n**Details:**\n${details.join('\n')}\n\n**Generated from:** Licensing & Allocation tab`
}

// License coverage navigation methods
function navigateToMapping() {
  // Navigate to Location Profiles tab for billing mapping
  emit('navigate-location', 'profiles-mapping')
  toast.add({
    severity: 'info',
    summary: 'Navigation',
    detail: 'Navigate to Location Profiles to map billing codes to bundles',
    life: 4000
  })
}

function navigateToBundles() {
  // Navigate to Service Bundles tab for bundle management
  emit('navigate-location', 'bundles')
  toast.add({
    severity: 'info', 
    summary: 'Navigation',
    detail: 'Navigate to Service Bundles to configure license allocations',
    life: 4000
  })
}

function refreshCoverage() {
  // Re-run allocation with license analysis to refresh coverage
  if (hasRunAllocation.value && canRunAllocation.value) {
    runAllocation(false) // Preview only
  }
}

async function saveLicenseMapping() {
  // Save the license allocation mapping 
  if (!allocation.value || !canRunAllocation.value) return
  
  loading.save = true
  try {
    await runAllocation(true) // Save allocation
    toast.add({
      severity: 'success',
      summary: 'License Mapping Saved',
      detail: 'License allocation mapping has been saved for this location',
      life: 5000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Save Failed',
      detail: 'Failed to save license mapping',
      life: 5000
    })
  } finally {
    loading.save = false
  }
}
</script>

<style scoped>
.licensing-tab {
  min-height: 400px;
}

/* Enhanced styling consistent with other audit workbench components */
.licensing-tab :deep(.p-tabs .p-tabs-nav) {
  border-bottom: 1px solid var(--surface-border);
  background: var(--surface-50);
}

.licensing-tab :deep(.p-tabs .p-tabs-nav li .p-tabs-nav-link) {
  padding: 1rem 1.5rem;
  font-weight: 500;
  border-radius: 6px 6px 0 0;
}

.licensing-tab :deep(.p-tabs .p-tabs-panels) {
  padding: 1.5rem 0;
  background: transparent;
}

.licensing-tab :deep(.p-card) {
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.licensing-tab :deep(.p-card .p-card-title) {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--surface-900);
  margin-bottom: 0.5rem;
}

.licensing-tab :deep(.p-datatable) {
  border: none;
  border-radius: 6px;
  overflow: hidden;
}

.licensing-tab :deep(.p-datatable .p-datatable-thead > tr > th) {
  font-weight: 600;
  font-size: 0.875rem;
  padding: 0.75rem 1rem;
  background: var(--surface-100);
  border-bottom: 1px solid var(--surface-border);
}

.licensing-tab :deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.licensing-tab :deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: var(--surface-50);
}

.licensing-tab :deep(.p-tag) {
  font-weight: 500;
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
}

.licensing-tab :deep(.p-message) {
  border-radius: 6px;
  border: 1px solid var(--surface-border);
}
</style>
