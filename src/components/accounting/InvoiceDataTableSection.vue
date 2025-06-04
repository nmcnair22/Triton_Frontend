<template>
  <!-- Invoice Table -->
  <div class="card p-4 mb-4">
            <DataTable :selection="tableSelection" 
                 @update:selection="$emit('update:tableSelection', $event)"
                 :value="customerInvoices || []" dataKey="id"
                 :loading="isLoadingCustomerInvoices" :rowHover="true" stripedRows
                 :metaKeySelection="false" 
                 :selectionMode="isMergeMode ? 'multiple' : 'single'"
                 filterDisplay="menu" :filters="filters"
                 @update:filters="$emit('update:filters', $event)"
               :globalFilterFields="['number', 'customerName', 'dueDate', 'total', 'remainingAmount', 'status']"
               @row-select="isMergeMode ? null : $emit('row-select', $event)" 
               @row-unselect="isMergeMode ? null : $emit('row-unselect', $event)"
               @sort="$emit('sort', $event)"
               :rowClass="getRowClass"
               tableStyle="min-width: 50rem"
               :scrollable="true" 
               scrollHeight="500px"
               :virtualScrollerOptions="customerInvoices?.length > 20 ? { itemSize: 65, lazy: false } : null"
               responsiveLayout="scroll"
               showGridlines
               :resizableColumns="true"
               columnResizeMode="fit"
               stateStorage="session"
               stateKey="invoice-templates-table-state">
      <template #header>
        <div class="flex flex-col gap-3 p-2">
          <!-- Top row with controls -->
          <div class="flex flex-col sm:flex-row justify-between gap-3">
            <div class="flex gap-2">
              <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined @click="$emit('clear-filter')" size="small" />
              <Button type="button" icon="pi pi-refresh" label="Refresh" outlined @click="$emit('refresh-invoices')" size="small" :loading="isLoadingCustomerInvoices" />
              <Button type="button" icon="pi pi-history" label="Merge History" outlined @click="$emit('load-merge-history')" size="small" :disabled="!selectedCustomer" />
            </div>
            <div class="flex gap-2">
              <IconField>
                <InputIcon>
                  <i class="pi pi-search" />
                </InputIcon>
                                            <InputText :modelValue="filters['global'].value" @update:modelValue="updateGlobalFilter" placeholder="Search invoices..." class="w-full sm:w-auto" />
              </IconField>
            </div>
          </div>
          
          <!-- Merge Mode Toggle -->
          <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2">
                <i class="pi pi-objects-column text-lg" :class="isMergeMode ? 'text-primary-500' : 'text-surface-400'"></i>
                <span class="font-semibold text-surface-900 dark:text-surface-0">Merge Mode</span>
              </div>
                              <ToggleSwitch :modelValue="isMergeMode" @update:modelValue="$emit('update:isMergeMode', $event)" />
              <div v-if="isMergeMode" class="flex items-center gap-2">
                <Tag :value="`${selectedInvoicesForMerge.length} selected`" 
                     :severity="selectedInvoicesForMerge.length >= 2 ? 'success' : 'secondary'" />
                <span v-if="mergeSelectionSummary" class="text-sm text-surface-600 dark:text-surface-400">
                  {{ mergeSelectionSummary }}
                </span>
              </div>
            </div>
            <div v-if="isMergeMode" class="text-sm text-surface-600 dark:text-surface-400">
              Select 2-50 invoices to merge
            </div>
          </div>
        </div>
      </template>
      <template #empty>
        <div class="flex flex-column align-items-center p-6">
          <i class="pi pi-file text-6xl text-surface-400 mb-4"></i>
          <span v-if="!selectedCustomer" class="text-lg text-surface-600 dark:text-surface-400">Please select a customer above to view invoices</span>
          <span v-else class="text-lg text-surface-600 dark:text-surface-400">No invoices found for the selected customer</span>
          <span v-if="selectedCustomer" class="text-sm text-surface-500 dark:text-surface-500 mt-2">
            Try adjusting your search criteria or filters
          </span>
        </div>
      </template>
      <template #loading>
        <div class="flex items-center justify-center p-6">
          <ProgressSpinner style="width: 40px; height: 40px" />
          <span class="ml-3 text-surface-600 dark:text-surface-400">Loading invoices...</span>
        </div>
      </template>
      
      <Column field="customerName" header="Customer" style="min-width: 12rem" sortable frozen>
        <template #body="slotProps">
          <div class="flex items-center gap-2">
            <i class="pi pi-user text-surface-500 text-sm"></i>
            <span class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.customerName }}</span>
          </div>
        </template>
        <template #filter="{ filterModel }">
          <InputText :modelValue="filterModel.value" @update:modelValue="filterModel.value = $event" type="text" placeholder="Search by customer" class="p-column-filter" />
        </template>
      </Column>
      <Column field="number" header="Invoice #" style="min-width: 10rem" sortable>
        <template #body="slotProps">
          <div class="flex items-center gap-2">
            <i class="pi pi-file text-blue-500 text-sm"></i>
            <span class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.number }}</span>
          </div>
        </template>
        <template #filter="{ filterModel }">
          <InputText :modelValue="filterModel.value" @update:modelValue="filterModel.value = $event" type="text" placeholder="Search by number" class="p-column-filter" />
        </template>
      </Column>
      <Column field="dueDate" header="Due Date" style="min-width: 10rem" sortable>
        <template #body="slotProps">
          <div class="flex flex-col">
            <span class="font-medium text-surface-900 dark:text-surface-0">
              {{ getDueDateInfo(slotProps.data.dueDate, slotProps.data.status).date }}
            </span>
            <span class="text-xs" :class="getDueDateInfo(slotProps.data.dueDate, slotProps.data.status).contextClass">
              {{ getDueDateInfo(slotProps.data.dueDate, slotProps.data.status).context }}
            </span>
          </div>
        </template>
        <template #filter="{ filterModel }">
          <DatePicker :modelValue="filterModel.value" @update:modelValue="filterModel.value = $event" dateFormat="mm/dd/yy" placeholder="mm/dd/yyyy" />
        </template>
      </Column>
      <Column field="total" header="Invoice Total" dataType="numeric" style="min-width: 10rem" sortable
             :showFilterMatchModes="true" 
             :filterMatchModeOptions="[
               {label: 'Equals', value: FilterMatchMode.EQUALS},
               {label: 'Less Than', value: FilterMatchMode.LESS_THAN},
               {label: 'Greater Than', value: FilterMatchMode.GREATER_THAN},
               {label: 'Less Than or Equal To', value: FilterMatchMode.LESS_THAN_OR_EQUAL_TO},
               {label: 'Greater Than or Equal To', value: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO}
             ]">
        <template #body="slotProps">
          <div class="text-right">
            <span class="font-semibold text-surface-900 dark:text-surface-0">{{ formatCurrency(slotProps.data.total) }}</span>
          </div>
        </template>
        <template #filter="{ filterModel }">
          <InputNumber :modelValue="filterModel.value" @update:modelValue="filterModel.value = $event" placeholder="Search by amount" class="p-column-filter" />
        </template>
      </Column>
      <Column field="remainingAmount" header="Amount Due" dataType="numeric" style="min-width: 10rem" sortable
             :showFilterMatchModes="true" 
             :filterMatchModeOptions="[
               {label: 'Equals', value: FilterMatchMode.EQUALS},
               {label: 'Less Than', value: FilterMatchMode.LESS_THAN},
               {label: 'Greater Than', value: FilterMatchMode.GREATER_THAN},
               {label: 'Less Than or Equal To', value: FilterMatchMode.LESS_THAN_OR_EQUAL_TO},
               {label: 'Greater Than or Equal To', value: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO}
             ]">
        <template #body="slotProps">
          <div class="text-right">
            <span :class="getRemainingAmountClass(slotProps.data.remainingAmount)">
              {{ formatCurrency(slotProps.data.remainingAmount) }}
            </span>
          </div>
        </template>
        <template #filter="{ filterModel }">
          <InputNumber :modelValue="filterModel.value" @update:modelValue="filterModel.value = $event" placeholder="Search by amount" class="p-column-filter" />
        </template>
      </Column>
      <Column field="status" header="Status" style="min-width: 8rem" sortable>
        <template #body="slotProps">
          <Tag :value="slotProps.data.status" 
               :severity="slotProps.data.status === 'open' ? 'info' : (slotProps.data.status === 'paid' ? 'success' : 'warning')"
               class="font-medium" />
        </template>
        <template #filter="{ filterModel }">
          <Select :modelValue="filterModel.value" @update:modelValue="filterModel.value = $event" :options="['open', 'unpaid', 'paid']" placeholder="Select Status" class="p-column-filter" showClear>
            <template #option="slotProps">
              <Tag :value="slotProps.option" 
                   :severity="slotProps.option === 'open' ? 'info' : (slotProps.option === 'paid' ? 'success' : 'warning')" />
            </template>
          </Select>
        </template>
      </Column>
      <Column headerStyle="width: 4rem" bodyStyle="text-align: center" frozen alignFrozen="right">
        <template #body="slotProps">
          <Button icon="pi pi-eye" 
                  size="small" 
                  text 
                  rounded 
                  severity="secondary"
                  v-tooltip.top="'View Invoice Details'"
                  @click="$emit('open-invoice-drawer', slotProps.data)" />
        </template>
      </Column>
      
      <template #footer>
        <div class="flex justify-between items-center p-2 bg-surface-50 dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700">
          <div class="flex items-center gap-4">
            <span class="text-sm font-medium text-surface-700 dark:text-surface-300">
              {{ customerInvoices?.length || 0 }} invoices
            </span>
            <span v-if="selectedCustomer" class="text-xs text-surface-500 dark:text-surface-400">
              for {{ selectedCustomer.name }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <Button icon="pi pi-download" text size="small" v-tooltip.top="'Export Data'" severity="secondary" />
            <Button icon="pi pi-refresh" text size="small" @click="$emit('refresh-invoices')" v-tooltip.top="'Refresh'" severity="secondary" :loading="isLoadingCustomerInvoices" />
          </div>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import DatePicker from 'primevue/datepicker';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import ToggleSwitch from 'primevue/toggleswitch';
import ProgressSpinner from 'primevue/progressspinner';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import { FilterMatchMode } from '@primevue/core/api';

const props = defineProps({
  tableSelection: [Object, Array],
  customerInvoices: Array,
  isLoadingCustomerInvoices: Boolean,
  isMergeMode: Boolean,
  filters: Object,
  selectedCustomer: Object,
  selectedInvoicesForMerge: Array,
  mergeSelectionSummary: String,
  getRowClass: Function,
  getDueDateInfo: Function,
  formatCurrency: Function,
  getRemainingAmountClass: Function
});

const emit = defineEmits([
  'update:tableSelection',
  'update:filters',
  'update:isMergeMode',
  'row-select', 
  'row-unselect', 
  'sort', 
  'clear-filter', 
  'refresh-invoices', 
  'load-merge-history', 
  'toggle-merge-mode', 
  'open-invoice-drawer'
]);

function updateGlobalFilter(value) {
  const newFilters = { ...props.filters };
  newFilters['global'].value = value;
  emit('update:filters', newFilters);
}
</script> 