<script setup>
import { ref, watch, computed, onMounted, nextTick } from 'vue';
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

// Ensure default tab selection on load with multiple strategies
onMounted(() => {
  // Force the active tab to be job-details (index 0)
  activeTabIndex.value = 0;
});

// Also watch for tab index changes for debugging
watch(activeTabIndex, (newValue) => {
  console.log('Tab index changed to:', newValue);
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

// Passthrough (pt) options for the PrimeVue components
const tabsPtOptions = {
  root: { class: 'mb-6' },
  navContainer: { 
    class: 'border-b border-surface-200 dark:border-surface-700 mb-1',
    // Add lifecycle hooks to handle initial tab activation
    hooks: {
      onMounted: (el) => {
        // Force active tab selection after mount
        activeTabIndex.value = 0;
      }
    }
  },
  nav: { class: 'flex' }
};

const tabListPtOptions = {
  root: { class: 'flex flex-nowrap overflow-x-auto' }
};

const tabPtOptions = ({ context }) => ({
  root: { 
    class: [
      'px-4 py-2 font-medium text-sm rounded-t-lg transition-colors duration-200',
      'focus:outline-none focus:ring-0',
      'border-b-2',
      context.selected 
        ? 'text-primary-600 dark:text-primary-400 border-primary-500 dark:border-primary-400' 
        : 'text-surface-700 dark:text-surface-300 border-transparent hover:text-surface-900 dark:hover:text-surface-100 hover:border-surface-300 dark:hover:border-surface-600'
    ]
  }
});

const tabPanelsPtOptions = {
  root: { class: 'mt-3' }
};

const tabPanelPtOptions = {
  root: { class: 'p-0' }
};

const panelPtOptions = {
  root: { class: 'mb-4 border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden shadow-sm' },
  header: { class: 'bg-surface-50 dark:bg-surface-800 px-4 py-3 border-b border-surface-200 dark:border-surface-700' },
  title: { class: 'text-base font-semibold text-surface-800 dark:text-surface-100' },
  content: { class: 'p-4 bg-white dark:bg-surface-900' },
  icons: { class: 'ml-auto' }
};

const drawerPtOptions = {
  root: { 
    class: 'bg-white dark:bg-surface-900 shadow-lg',
    style: 'max-width: 40rem; width: 100%'
  },
  header: { 
    class: 'px-6 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800' 
  },
  title: {
    class: 'text-xl font-bold text-surface-800 dark:text-white'
  },
  content: { class: 'p-4 overflow-y-auto' },
  footer: { class: 'p-4 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800' },
  closeButton: {
    class: 'p-2 rounded-full hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors'
  },
  closeButtonIcon: {
    class: 'text-surface-600 dark:text-surface-400'
  },
  mask: {
    class: 'bg-black/40'
  },
  transition: {
    enterFromClass: 'translate-x-full',
    enterActiveClass: 'transition-transform duration-300 ease-out',
    enterToClass: 'translate-x-0',
    leaveFromClass: 'translate-x-0',
    leaveActiveClass: 'transition-transform duration-300 ease-in',
    leaveToClass: 'translate-x-full'
  },
  hooks: {
    onMounted: (el) => {
      console.log('Drawer mounted');
    }
  }
};

const buttonPtOptions = ({ context }) => ({
  root: { 
    class: [
      'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400',
      context.outlined && !context.text
        ? 'border border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800'
        : context.text
          ? 'hover:bg-surface-100 dark:hover:bg-surface-800'
          : 'bg-primary-500 hover:bg-primary-600 text-white'
    ]
  }
});

const tagPtOptions = ({ props }) => ({
  root: {
    class: [
      'inline-flex items-center px-2 py-1 text-xs font-medium rounded-md',
      {
        'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300': props.severity === 'success',
        'bg-info-100 text-info-800 dark:bg-info-900 dark:text-info-300': props.severity === 'info',
        'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-300': props.severity === 'warning',
        'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-300': props.severity === 'danger'
      }
    ]
  }
});
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
        <Button icon="pi pi-arrow-left" @click="goBack" text class="mr-2" :pt="buttonPtOptions" />
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
                 :severity="billingSeverity" 
                 :pt="tagPtOptions" />
          </div>
        </div>
      </div>

      <!-- Tabbed interface -->
      <Tabs v-model:active-index="activeTabIndex" :pt="tabsPtOptions" :default-index="0">
        <TabList :pt="tabListPtOptions">
          <Tab value="0" :pt="tabPtOptions">Job Details</Tab>
          <Tab value="1" :pt="tabPtOptions">Billing</Tab>
          <Tab value="2" :pt="tabPtOptions">Notes, Scope & Technician</Tab>
        </TabList>
        <TabPanels :pt="tabPanelsPtOptions">
          <!-- Job Details Tab -->
          <TabPanel value="0" :pt="tabPanelPtOptions">
            <!-- Job Information -->
            <Panel header="Job Information" class="mb-3" :pt="panelPtOptions">
              <template #icons>
                <Button 
                  label="Close-out Notes" 
                  icon="pi pi-file-edit" 
                  outlined
                  @click="toggleNotesDrawer" 
                  size="small"
                  :pt="buttonPtOptions"
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
              <Panel header="Location" class="flex-1" :pt="panelPtOptions">
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
              <Panel header="Visit Record" class="flex-1" :pt="panelPtOptions">
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
          <TabPanel value="1" :pt="tabPanelPtOptions">
            <Panel header="Billing Details" :pt="panelPtOptions">
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
          <TabPanel value="2" :pt="tabPanelPtOptions">
            <!-- Scope of Work -->
            <Panel header="Scope of Work" class="mb-3" :pt="panelPtOptions">
              <div class="field">
                <div id="scope" class="p-inputtext w-full min-h-4rem whitespace-pre-line">{{ dispatchData.jobDetails?.scopeOfWork || 'No scope of work provided.' }}</div>
              </div>
            </Panel>

            <!-- Technician -->
            <Panel header="Technician" class="mb-3" :pt="panelPtOptions">
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
            <Panel header="Technician Comments" :pt="panelPtOptions">
              <div class="field">
                <div id="techcomments" class="p-inputtext w-full min-h-4rem whitespace-pre-line">{{ dispatchData.technicianInfo?.comments || 'No comments provided.' }}</div>
              </div>
            </Panel>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      <!-- Back button -->
      <div class="flex justify-content-end mt-3">
        <Button label="Back to Jobs" icon="pi pi-arrow-left" @click="goBack" :pt="buttonPtOptions" />
      </div>
    </div>

    <!-- Close-out Notes Drawer -->
    <Drawer v-model:visible="displayNotesDrawer" position="right" :pt="drawerPtOptions">
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
      <template #footer>
        <Button label="Close" icon="pi pi-times" @click="toggleNotesDrawer" class="w-full" :pt="buttonPtOptions" />
      </template>
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

/* Remove shadow styles since they're now in pt options */
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
</style> 