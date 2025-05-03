<script setup>
import { ref, watch, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from 'primevue/button';
import { useDispatchStore } from '@/stores/dispatchStore';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import Panel from 'primevue/panel';
import Badge from 'primevue/badge';
import Tag from 'primevue/tag';
import Drawer from 'primevue/drawer';

// Router
const route = useRoute();
const router = useRouter();

// Store (if we want to fetch a single dispatch later)
const dispatchStore = useDispatchStore();

// The route should contain the ticket id as param and the row data in navigation state (for quick load)
const dispatchData = ref(history.state?.dispatch ?? null);
const ticketId = route.params.id;
const activeTabIndex = ref(0);
const displayNotesDrawer = ref(false);

// Ensure default tab selection on load
onMounted(() => {
  // Force the active tab to be job-details (index 0)
  setTimeout(() => {
    activeTabIndex.value = 0;
  }, 0);
});

// Fallback: try to locate the record in already-loaded dispatchRows
const tryLoadFromStore = () => {
  if (!dispatchData.value) {
    const match = dispatchStore.dispatchRows.find(r => String(r.id) === String(ticketId));
    if (match) dispatchData.value = match;
  }
};

// Attempt immediately and also watch for store updates
tryLoadFromStore();

watch(() => dispatchStore.dispatchRows.length, () => {
  tryLoadFromStore();
});

// Billing status tag severity
const billingSeverity = computed(() => {
  if (!dispatchData.value?.billing?.billingStatus) return 'danger';
  const status = dispatchData.value.billing.billingStatus.toLowerCase();
  if (status.includes('paid') || status.includes('complete')) return 'success';
  if (status.includes('pending') || status.includes('partial')) return 'warning';
  return 'danger';
});

// Simple back navigation
function goBack() {
  if (router.options.history.state.back) {
    router.back();
  } else {
    router.push({ name: 'dispatch-jobs' });
  }
}

// Toggle notes drawer
function toggleNotesDrawer() {
  displayNotesDrawer.value = !displayNotesDrawer.value;
}
</script>

<template>
  <div class="p-2">
    <!-- Loading state -->
    <div v-if="!dispatchData" class="flex align-items-center justify-content-center h-64">
      <span class="pi pi-spin pi-spinner text-4xl text-primary" />
    </div>
    
    <div v-else class="dispatch-details">
      <!-- Header with navigation and ticket number -->
      <div class="flex align-items-center mb-2">
        <Button icon="pi pi-arrow-left" @click="goBack" text class="mr-2" />
        <h1 class="text-xl font-medium m-0">Dispatch Ticket #{{ ticketId }}</h1>
      </div>

      <!-- Status summary -->
      <div class="surface-section p-2 border-1 border-300 border-round shadow-1 mb-3">
        <div class="flex flex-column sm:flex-row">
          <div class="flex-auto mb-1 sm:mb-0 sm:mr-4">
            <span class="text-sm text-500 mr-2">Status:</span>
            <span class="font-medium">{{ dispatchData.status || 'N/A' }}</span>
          </div>
          <div class="flex-auto mb-1 sm:mb-0 sm:mr-4">
            <span class="text-sm text-500 mr-2">Priority:</span>
            <span class="font-medium">{{ dispatchData.priority || 'N/A' }}</span>
          </div>
          <div class="flex-auto mb-1 sm:mb-0 sm:mr-4">
            <span class="text-sm text-500 mr-2">Service Date:</span>
            <span class="font-medium">{{ dispatchData.serviceDate || 'N/A' }}</span>
          </div>
          <div class="flex-auto">
            <span class="text-sm text-500 mr-2">Billing Status:</span>
            <Tag :value="dispatchData.billing?.billingStatus || 'Not Billed'" 
                 :severity="billingSeverity" />
          </div>
        </div>
      </div>

      <!-- Tabbed interface -->
      <Tabs v-model:active-index="activeTabIndex">
        <TabList>
          <Tab value="job-details">Job Details</Tab>
          <Tab value="billing">Billing</Tab>
          <Tab value="notes">Notes, Scope & Technician</Tab>
        </TabList>
        <TabPanels>
          <!-- Job Details Tab -->
          <TabPanel value="job-details">
            <!-- Job Information -->
            <Panel header="Job Information" class="mb-3 shadow-1">
              <template #icons>
                <Button 
                  label="Close-out Notes" 
                  icon="pi pi-file-edit" 
                  outlined
                  @click="toggleNotesDrawer" 
                  size="small"
                />
              </template>
              <div class="flex flex-column md:flex-row gap-2 mb-3">
                <div class="flex-1">
                  <label for="customer" class="block text-sm font-medium mb-1">Customer</label>
                  <div id="customer" class="p-inputtext w-full">{{ dispatchData.customerName || 'N/A' }}</div>
                </div>
                <div class="flex-1">
                  <label for="subject" class="block text-sm font-medium mb-1">Subject</label>
                  <div id="subject" class="p-inputtext w-full">{{ dispatchData.subject || 'N/A' }}</div>
                </div>
                <div class="flex-1">
                  <label for="project" class="block text-sm font-medium mb-1">Project</label>
                  <div id="project" class="p-inputtext w-full">{{ dispatchData.jobDetails?.projectName || 'N/A' }}</div>
                </div>
              </div>
              
              <div class="flex flex-column md:flex-row gap-2">
                <div class="flex-1">
                  <label for="itemid" class="block text-sm font-medium mb-1">Item ID</label>
                  <div id="itemid" class="p-inputtext w-full">{{ dispatchData.itemId || 'N/A' }}</div>
                </div>
                <div class="flex-1">
                  <label for="jobline" class="block text-sm font-medium mb-1">Job Line Type</label>
                  <div id="jobline" class="p-inputtext w-full">{{ dispatchData.jobLineType || 'N/A' }}</div>
                </div>
                <div class="flex-1">
                  <label for="servicedate" class="block text-sm font-medium mb-1">Service Date</label>
                  <div id="servicedate" class="p-inputtext w-full">{{ dispatchData.serviceDate || 'N/A' }}</div>
                </div>
              </div>
            </Panel>

            <div class="flex flex-column xl:flex-row gap-3 mb-3">
              <!-- Location -->
              <Panel header="Location" class="flex-1 shadow-1">
                <div class="flex flex-column md:flex-row gap-2 mb-2">
                  <div class="flex-1">
                    <label for="siteno" class="block text-sm font-medium mb-1">Site #</label>
                    <div id="siteno" class="p-inputtext w-full">{{ dispatchData.siteNumber || 'N/A' }}</div>
                  </div>
                  <div class="flex-1">
                    <label for="zipcode" class="block text-sm font-medium mb-1">Zip Code</label>
                    <div id="zipcode" class="p-inputtext w-full">{{ dispatchData.zipCode || 'N/A' }}</div>
                  </div>
                </div>
                
                <div class="field mb-2">
                  <label for="address" class="block text-sm font-medium mb-1">Address</label>
                  <div id="address" class="p-inputtext w-full">{{ dispatchData.address || 'N/A' }}</div>
                </div>
                
                <div class="field">
                  <label for="citystate" class="block text-sm font-medium mb-1">City/State</label>
                  <div id="citystate" class="p-inputtext w-full">{{ dispatchData.cityState || 'N/A' }}</div>
                </div>
              </Panel>
              
              <!-- Visit Record -->
              <Panel header="Visit Record" class="flex-1 shadow-1">
                <div class="flex flex-column md:flex-row gap-2 mb-2">
                  <div class="flex-1">
                    <label for="visitid" class="block text-sm font-medium mb-1">Visit ID</label>
                    <div id="visitid" class="p-inputtext w-full">{{ dispatchData.schedule?.visitRecordId || 'N/A' }}</div>
                  </div>
                  <div class="flex-1">
                    <label for="queue" class="block text-sm font-medium mb-1">Queue</label>
                    <div id="queue" class="p-inputtext w-full">{{ dispatchData.schedule?.queue || 'N/A' }}</div>
                  </div>
                </div>
                
                <div class="flex flex-column md:flex-row gap-2 mb-2">
                  <div class="flex-1">
                    <label for="checkin" class="block text-sm font-medium mb-1">Check-in Time</label>
                    <div id="checkin" class="p-inputtext w-full">{{ dispatchData.schedule?.checkInTime || 'N/A' }}</div>
                  </div>
                  <div class="flex-1">
                    <label for="checkout" class="block text-sm font-medium mb-1">Check-out Time</label>
                    <div id="checkout" class="p-inputtext w-full">{{ dispatchData.schedule?.checkOutTime || 'N/A' }}</div>
                  </div>
                </div>
                
                <div class="flex flex-column md:flex-row gap-2">
                  <div class="flex-1">
                    <label for="duration" class="block text-sm font-medium mb-1">Duration</label>
                    <div id="duration" class="p-inputtext w-full">{{ dispatchData.schedule?.duration || 'N/A' }}</div>
                  </div>
                  <div class="flex-1">
                    <label for="failcode" class="block text-sm font-medium mb-1">Failure Code</label>
                    <div id="failcode" class="p-inputtext w-full">{{ dispatchData.failureCode || 'N/A' }}</div>
                  </div>
                </div>
              </Panel>
            </div>
          </TabPanel>

          <!-- Billing Tab -->
          <TabPanel value="billing">
            <Panel header="Billing Details" class="shadow-1">
              <div class="flex flex-column md:flex-row gap-2 mb-2">
                <div class="flex-1">
                  <label for="invoice" class="block text-sm font-medium mb-1">Invoice #</label>
                  <div id="invoice" class="p-inputtext w-full">{{ dispatchData.billing?.invoiceNumber || 'N/A' }}</div>
                </div>
                <div class="flex-1">
                  <label for="quoted" class="block text-sm font-medium mb-1">Quoted Cost</label>
                  <div id="quoted" class="p-inputtext w-full">{{ dispatchData.billing?.quotedCost || 'N/A' }}</div>
                </div>
                <div class="flex-1">
                  <label for="quantity" class="block text-sm font-medium mb-1">Quantity</label>
                  <div id="quantity" class="p-inputtext w-full">{{ dispatchData.quantity || 'N/A' }}</div>
                </div>
              </div>
              
              <div class="flex flex-column md:flex-row gap-2 mb-2">
                <div class="flex-1">
                  <label for="daystoinvoice" class="block text-sm font-medium mb-1">Days to Invoice</label>
                  <div id="daystoinvoice" class="p-inputtext w-full">{{ dispatchData.daysToInvoice || 'N/A' }}</div>
                </div>
                <div class="flex-1">
                  <label for="final" class="block text-sm font-medium mb-1">Final Amount</label>
                  <div id="final" class="p-inputtext w-full">{{ dispatchData.billing?.finalBilledAmount || 'N/A' }}</div>
                </div>
                <div class="flex-1">
                  <label for="unitprice" class="block text-sm font-medium mb-1">Unit Price</label>
                  <div id="unitprice" class="p-inputtext w-full">{{ dispatchData.unitPrice || 'N/A' }}</div>
                </div>
              </div>
              
              <div class="mt-3 p-2 surface-100 border-round flex justify-content-between align-items-center">
                <span class="font-medium">Line Amount:</span>
                <span class="font-bold text-lg">{{ dispatchData.lineAmount || '$0.00' }}</span>
              </div>
            </Panel>
          </TabPanel>

          <!-- Notes & Scope Tab -->
          <TabPanel value="notes">
            <!-- Scope of Work -->
            <Panel header="Scope of Work" class="mb-3 shadow-1">
              <div class="field">
                <div id="scope" class="p-inputtext w-full min-h-4rem whitespace-pre-line">{{ dispatchData.jobDetails?.scopeOfWork || 'No scope of work provided.' }}</div>
              </div>
            </Panel>

            <!-- Technician -->
            <Panel header="Technician" class="mb-3 shadow-1">
              <div class="flex flex-column md:flex-row gap-2 mb-2">
                <div class="flex-1">
                  <label for="techname" class="block text-sm font-medium mb-1">Name</label>
                  <div id="techname" class="p-inputtext w-full">{{ dispatchData.technicianInfo?.name || 'N/A' }}</div>
                </div>
                <div class="flex-1">
                  <label for="vendor" class="block text-sm font-medium mb-1">Vendor</label>
                  <div id="vendor" class="p-inputtext w-full">{{ dispatchData.technicianInfo?.vendor || 'N/A' }}</div>
                </div>
              </div>
              
              <div class="flex flex-column md:flex-row gap-2">
                <div class="flex-1">
                  <label for="contact" class="block text-sm font-medium mb-1">Contact</label>
                  <div id="contact" class="p-inputtext w-full">{{ dispatchData.technicianInfo?.contactInfo || 'N/A' }}</div>
                </div>
                <div class="flex-1">
                  <label for="grade" class="block text-sm font-medium mb-1">Grade/Review</label>
                  <div id="grade" class="p-inputtext w-full">{{ dispatchData.technicianInfo?.grade || 'N/A' }}</div>
                </div>
              </div>
            </Panel>

            <!-- Notes -->
            <Panel header="Technician Comments" class="shadow-1">
              <div class="field">
                <div id="techcomments" class="p-inputtext w-full min-h-4rem whitespace-pre-line">{{ dispatchData.technicianInfo?.comments || 'No comments provided.' }}</div>
              </div>
            </Panel>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      <!-- Back button -->
      <div class="flex justify-content-end mt-3">
        <Button label="Back to Jobs" icon="pi pi-arrow-left" @click="goBack" />
      </div>
    </div>

    <!-- Close-out Notes Drawer -->
    <Drawer v-model:visible="displayNotesDrawer" position="right" style="width: 40rem">
      <template #header>
        <div class="flex align-items-center gap-2">
          <i class="pi pi-file-edit text-xl"></i>
          <span class="font-bold text-xl">Close-out Notes</span>
        </div>
      </template>
      <div class="p-2">
        <div class="p-inputtext w-full min-h-20rem whitespace-pre-line">
          {{ dispatchData.completion?.closeOutNotes || 'No close-out notes provided.' }}
        </div>
      </div>
    </Drawer>
  </div>
</template>

<style scoped>
.field {
  margin-bottom: 0;
}

.p-inputtext {
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  background-color: var(--surface-100);
  color: var(--text-color);
  min-height: 2.2rem;
  display: flex;
  align-items: center;
}

.min-h-4rem {
  min-height: 4rem;
}

.min-h-20rem {
  min-height: 20rem;
}

.shadow-1 {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

:deep(.p-tabview-nav-container) {
  position: relative;
}

:deep(.p-tabview-ink-bar) {
  z-index: 1;
  display: block;
  position: absolute;
  bottom: 0;
  height: 2px;
  background-color: var(--primary-color);
  transition: 0.3s cubic-bezier(0.35, 0, 0.25, 1);
}

:deep(.p-panel-header) {
  background-color: var(--surface-50);
  border-bottom: 1px solid var(--surface-border);
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  font-size: 0.95rem;
}

:deep(.p-panel-content) {
  padding: 0.75rem;
}

:deep(.p-badge) {
  font-size: 0.65rem;
  font-weight: 700;
}
</style> 