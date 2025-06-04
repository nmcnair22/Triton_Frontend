<template>
  <!-- Invoice Detail Drawer -->
  <Drawer :visible="showInvoiceDrawer" @update:visible="$emit('update:showInvoiceDrawer', $event)" header="Invoice Details" position="right" class="!w-full md:!w-[90vw] lg:!w-[80vw] xl:!w-[75vw]">
    <div v-if="drawerSelectedInvoice" class="h-full overflow-auto bg-surface-50 dark:bg-surface-900">
      <!-- Compact Professional Header -->
      <div class="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 shadow-sm">
        <div class="px-4 py-3">
          <!-- Top Row: Company Info & Invoice Number -->
          <div class="flex items-start justify-between mb-3">
            <!-- Company Branding - Compact -->
            <div class="flex items-center gap-3">
              <div class="bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg p-3" style="background: linear-gradient(135deg, #082944 0%, #1a3a5c 100%);">
                <img src="/layout/images/cis-logo-tagline-white.png" alt="CIS Logo" width="120" height="30" class="opacity-95" />
              </div>
              <div class="text-xs text-surface-600 dark:text-surface-400 leading-tight">
                <div>1023 Calle Sombra Unit B, San Clemente, CA 92673</div>
              </div>
            </div>
            
            <!-- Invoice Number & Status -->
            <div class="text-right">
              <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1">Invoice</div>
              <div class="text-xl font-bold text-surface-900 dark:text-surface-0">{{ drawerSelectedInvoice?.number || drawerSelectedInvoice?.id || '' }}</div>
              <Tag :value="drawerSelectedInvoice?.status?.toUpperCase() || 'UNKNOWN'" 
                   :severity="drawerSelectedInvoice?.status === 'paid' ? 'success' : drawerSelectedInvoice?.status === 'open' ? 'info' : 'warning'"
                   class="text-xs mt-1" />
            </div>
          </div>
          
          <!-- Bottom Row: Controls & Key Info -->
          <div class="flex items-center justify-between">
            <!-- Interactive Toggle -->
            <ToggleButton 
              :modelValue="drawerIsInteractive" 
              @update:modelValue="$emit('update:drawerIsInteractive', $event)"
              onLabel="Interactive" 
              offLabel="Standard" 
              onIcon="pi pi-cog" 
              offIcon="pi pi-eye" 
              :class="drawerIsInteractive ? 'p-button-success' : 'p-button-secondary'"
              class="text-xs"
              size="small"
              @change="$emit('drawer-interactive-toggle')"
            />
            
            <!-- Key Invoice Info - Compact -->
            <div class="flex items-center gap-4 text-xs">
              <div class="text-center">
                <div class="text-surface-500 dark:text-surface-400">Issue Date</div>
                <div class="font-medium text-surface-900 dark:text-surface-0">{{ formatDate(drawerSelectedInvoice?.date) || 'N/A' }}</div>
              </div>
              <div class="text-center">
                <div class="text-surface-500 dark:text-surface-400">Due Date</div>
                <div class="font-medium text-surface-900 dark:text-surface-0">{{ formatDate(drawerSelectedInvoice?.dueDate) || 'N/A' }}</div>
              </div>
              <div class="text-center">
                <div class="text-surface-500 dark:text-surface-400">Amount</div>
                <div class="font-bold text-lg" style="color: #FF9400;">{{ formatCurrency(drawerSelectedInvoice?.total) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Main Content Area -->
      <div class="p-4 space-y-4">
        <!-- Bill To & Invoice Details - Side by Side -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- Bill To Section - Compact -->
          <div class="bg-white dark:bg-surface-800 rounded-lg p-4 border border-surface-200 dark:border-surface-700">
            <div class="flex items-center gap-2 mb-3">
              <i class="pi pi-user text-primary-600 dark:text-primary-400 text-sm"></i>
              <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-0">Bill To</h3>
            </div>
            <div class="space-y-2">
              <div class="font-bold text-surface-900 dark:text-surface-0">
                {{ drawerSelectedInvoice?.customer?.company || drawerSelectedInvoice?.customer?.name || 'N/A' }}
              </div>
              <div class="text-sm text-surface-600 dark:text-surface-400 leading-relaxed" 
                   v-html="drawerSelectedInvoice?.customer?.address?.replace(/\n/g, '<br />') || 'No address provided'">
              </div>
              <div v-if="drawerSelectedInvoice?.customer?.id" class="inline-flex items-center gap-1 px-2 py-1 bg-surface-100 dark:bg-surface-700 rounded text-xs">
                <i class="pi pi-id-card text-xs text-surface-500"></i>
                <span class="text-surface-700 dark:text-surface-300">ID: {{ drawerSelectedInvoice.customer.id }}</span>
              </div>
            </div>
          </div>
          
          <!-- Invoice Details - Compact -->
          <div class="bg-white dark:bg-surface-800 rounded-lg p-4 border border-surface-200 dark:border-surface-700">
            <div class="flex items-center gap-2 mb-3">
              <i class="pi pi-info-circle text-blue-600 dark:text-blue-400 text-sm"></i>
              <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-0">Invoice Information</h3>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-surface-600 dark:text-surface-400">Customer ID</span>
                <span class="font-medium text-surface-900 dark:text-surface-0">{{ drawerSelectedInvoice?.customer?.id || 'N/A' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-surface-600 dark:text-surface-400">Payment Status</span>
                <Tag :value="drawerSelectedInvoice?.status?.toUpperCase() || 'UNKNOWN'" 
                     :severity="drawerSelectedInvoice?.status === 'paid' ? 'success' : drawerSelectedInvoice?.status === 'open' ? 'info' : 'warning'"
                     class="text-xs" />
              </div>
              <div v-if="drawerSelectedInvoice?.terms" class="flex justify-between">
                <span class="text-surface-600 dark:text-surface-400">Payment Terms</span>
                <span class="font-medium text-surface-900 dark:text-surface-0">{{ drawerSelectedInvoice.terms }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Interactive Tools Panel - Compact -->
        <div v-if="drawerIsInteractive" class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i class="pi pi-cog text-blue-600 dark:text-blue-400"></i>
              <span class="text-sm font-medium text-surface-900 dark:text-surface-0">Interactive Analysis</span>
            </div>
            <div class="w-48">
              <Select 
                :modelValue="drawerSelectedGroupBy" 
                @update:modelValue="$emit('update:drawerSelectedGroupBy', $event)"
                :options="groupByOptions" 
                optionLabel="name" 
                placeholder="Group By"
                class="w-full text-xs"
                size="small"
                @change="$emit('group-by-change', $event)"
              />
            </div>
          </div>
        </div>
        
        <!-- Invoice Items Section - Compact -->
        <div class="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden">
          <div class="bg-surface-50 dark:bg-surface-700 px-4 py-3 border-b border-surface-200 dark:border-surface-600">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="pi pi-list text-green-600 dark:text-green-400 text-sm"></i>
                <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-0">Line Items</h3>
              </div>
              <div v-if="drawerProducts.length > 0">
                <Tag :value="`${drawerProducts.length} items`" severity="info" class="text-xs" />
              </div>
            </div>
          </div>
          
          <div class="p-4">
            <!-- Regrouping loading state -->
            <div v-if="drawerIsRegrouping" class="flex justify-center items-center py-8">
              <div class="text-center">
                <ProgressSpinner class="w-8 h-8" />
                <div class="mt-2 text-sm text-surface-600 dark:text-surface-400">Analyzing items...</div>
              </div>
            </div>

            <!-- Standard non-grouped display -->
            <DataTable v-else-if="!drawerIsInteractive || drawerSelectedGroupBy.value === 'none'" 
                     :value="drawerProducts" 
                     tableStyle="min-width: 50rem"
                     :rowHover="true"
                     stripedRows
                     responsiveLayout="scroll"
                     class="compact-invoice-table"
                     size="small">
              <Column field="description" header="Description" class="font-medium">
                <template #body="slotProps">
                  <div class="py-1">
                    <div class="font-medium text-surface-900 dark:text-surface-0 text-sm">{{ slotProps.data.description }}</div>
                  </div>
                </template>
              </Column>
              <Column field="quantity" header="Qty" class="text-center" style="width: 80px">
                <template #body="slotProps">
                  <div class="text-center">
                    <span class="inline-flex items-center justify-center w-10 h-6 bg-surface-100 dark:bg-surface-700 rounded text-xs font-medium">
                      {{ slotProps.data.quantity }}
                    </span>
                  </div>
                </template>
              </Column>
              <Column field="price" header="Unit Price" class="text-right" style="width: 100px">
                <template #body="slotProps">
                  <div class="text-right font-medium text-surface-700 dark:text-surface-300 text-sm">{{ slotProps.data.price }}</div>
                </template>
              </Column>
              <Column field="total" header="Amount" class="text-right" style="width: 100px">
                <template #body="slotProps">
                  <div class="text-right font-bold text-surface-900 dark:text-surface-0 text-sm">{{ slotProps.data.total }}</div>
                </template>
              </Column>
            </DataTable>

            <!-- Grouped display -->
            <div v-else-if="drawerGroupedProducts.length > 0" class="space-y-4">
              <div v-for="(group, index) in drawerGroupedProducts" :key="index" class="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
                <!-- Group Header - Compact -->
                <div class="bg-primary-50 dark:bg-primary-900/30 px-4 py-2 border-b border-primary-200 dark:border-primary-700">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <i class="pi pi-tag text-primary-600 dark:text-primary-400 text-sm"></i>
                      <div>
                        <h4 class="font-bold text-primary-900 dark:text-primary-100 text-sm">{{ group.name }}</h4>
                        <p class="text-xs text-primary-700 dark:text-primary-300">{{ group.groupType }} • {{ group.items.length }} items</p>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="font-bold text-primary-900 dark:text-primary-100">{{ formatCurrency(group.total) }}</div>
                      <div class="text-xs text-primary-700 dark:text-primary-300">Group Total</div>
                    </div>
                  </div>
                </div>
                
                <!-- Group Items DataTable -->
                <div class="bg-white dark:bg-surface-800">
                  <DataTable :value="group.items.map(item => ({
                      description: item.description,
                      quantity: item.quantity.toString(),
                      price: formatCurrency(item.unitPrice),
                      total: formatCurrency(item.amountIncludingTax)
                  }))" 
                  tableStyle="min-width: 50rem"
                  :rowHover="true"
                  class="compact-invoice-table group-table"
                  size="small">
                    <Column field="description" header="Description" class="font-medium">
                      <template #body="slotProps">
                        <div class="py-1">
                          <div class="font-medium text-surface-900 dark:text-surface-0 text-sm">{{ slotProps.data.description }}</div>
                        </div>
                      </template>
                    </Column>
                    <Column field="quantity" header="Qty" class="text-center" style="width: 80px">
                      <template #body="slotProps">
                        <div class="text-center">
                          <span class="inline-flex items-center justify-center w-10 h-6 bg-surface-100 dark:bg-surface-700 rounded text-xs font-medium">
                            {{ slotProps.data.quantity }}
                          </span>
                        </div>
                      </template>
                    </Column>
                    <Column field="price" header="Unit Price" class="text-right" style="width: 100px">
                      <template #body="slotProps">
                        <div class="text-right font-medium text-surface-700 dark:text-surface-300 text-sm">{{ slotProps.data.price }}</div>
                      </template>
                    </Column>
                    <Column field="total" header="Amount" class="text-right" style="width: 100px">
                      <template #body="slotProps">
                        <div class="text-right font-bold text-surface-900 dark:text-surface-0 text-sm">{{ slotProps.data.total }}</div>
                      </template>
                    </Column>
                  </DataTable>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-else class="flex justify-center items-center p-8 h-full">
      <div class="text-center">
        <ProgressSpinner class="w-12 h-12" />
        <div class="mt-4 font-medium text-surface-600 dark:text-surface-400">Loading invoice details...</div>
        <div class="mt-1 text-sm text-surface-500 dark:text-surface-500">Please wait while we fetch the invoice information</div>
      </div>
    </div>
  </Drawer>
</template>

<script setup>
import Drawer from 'primevue/drawer';
import Tag from 'primevue/tag';
import ToggleButton from 'primevue/togglebutton';
import Select from 'primevue/select';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ProgressSpinner from 'primevue/progressspinner';

defineProps({
  showInvoiceDrawer: Boolean,
  drawerSelectedInvoice: Object,
  drawerIsInteractive: Boolean,
  drawerSelectedGroupBy: Object,
  groupByOptions: Array,
  drawerProducts: Array,
  drawerIsRegrouping: Boolean,
  drawerGroupedProducts: Array,
  formatDate: Function,
  formatCurrency: Function
});

defineEmits(['drawer-interactive-toggle', 'group-by-change', 'update:showInvoiceDrawer', 'update:drawerIsInteractive', 'update:drawerSelectedGroupBy']);
</script> 