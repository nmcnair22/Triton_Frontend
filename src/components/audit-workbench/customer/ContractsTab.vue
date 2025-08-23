<template>
  <div class="contracts-tab">
    <!-- Header Section -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h3 class="text-2xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Contracts Management</h3>
        <p class="text-surface-600 dark:text-surface-400">Manage contracts and pricing tiers for this customer</p>
      </div>
      <Button 
        label="New Contract" 
        icon="pi pi-plus" 
        @click="createNewContract"
        :disabled="customerContractsStore.loading.contracts"
      />
    </div>

    <!-- Loading State -->
    <div v-if="customerContractsStore.loading.contracts" class="text-center py-8">
      <ProgressSpinner size="50" />
      <p class="mt-4 text-surface-600 dark:text-surface-400">Loading contracts...</p>
    </div>

    <!-- Error State -->
    <Message 
      v-else-if="customerContractsStore.errors.contracts" 
      severity="error" 
      class="mb-6"
    >
      Failed to load contracts. {{ customerContractsStore.errors.contracts.message || 'Unknown error occurred.' }}
    </Message>

    <!-- No Data State -->
    <Card v-else-if="customerContractsStore.contracts.length === 0" class="text-center py-8 mb-6">
      <template #content>
        <i class="pi pi-file-edit text-4xl text-surface-400 mb-4"></i>
        <h4 class="text-lg font-medium text-surface-900 dark:text-surface-0 mb-2">No Contracts Found</h4>
        <p class="text-surface-600 dark:text-surface-400 mb-4">
          Create your first contract to get started with customer-level management.
        </p>
        <Button 
          label="Create First Contract" 
          icon="pi pi-plus"
          @click="showCreateContract = true"
        />
      </template>
    </Card>

    <!-- Contracts Table -->
    <Card v-else class="shadow-sm">
      <template #content>
        <DataTable 
          :value="customerContractsStore.contracts" 
          responsiveLayout="scroll"
          stripedRows
          class="contracts-table"
        >
          <Column field="name" header="Contract Name" sortable>
            <template #body="{ data }">
              <div class="font-medium">{{ data.name }}</div>
            </template>
          </Column>
          
          <Column field="term_start" header="Start Date" sortable>
            <template #body="{ data }">
              {{ formatDate(data.term_start) }}
            </template>
          </Column>
          
          <Column field="term_end" header="End Date" sortable>
            <template #body="{ data }">
              {{ formatDate(data.term_end) }}
            </template>
          </Column>
          
          <Column field="status" header="Status">
            <template #body="{ data }">
              <Tag 
                :value="data.status" 
                :severity="getStatusSeverity(data.status)"
              />
            </template>
          </Column>
          
          <Column field="global_discount_percent" header="Global Discount">
            <template #body="{ data }">
              <span v-if="data.global_discount_percent">
                {{ data.global_discount_percent }}%
              </span>
              <span v-else class="text-surface-400">No discount</span>
            </template>
          </Column>
          
          <Column header="Actions" style="width: 100px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button 
                  icon="pi pi-pencil" 
                  size="small"
                  text
                  @click="editContract(data)"
                  v-tooltip="'Edit Contract'"
                />
                <Button 
                  icon="pi pi-trash" 
                  size="small"
                  text
                  severity="danger"
                  @click="confirmDeleteContract(data)"
                  v-tooltip="'Delete Contract'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Delete Confirmation Dialog -->
    <Dialog 
      v-model:visible="showDeleteConfirm" 
      header="Confirm Deletion"
      modal 
      class="w-[400px]"
    >
      <div class="p-4 text-center">
        <i class="pi pi-exclamation-triangle text-4xl text-orange-500 mb-4"></i>
        <h4 class="text-lg font-semibold mb-2">Delete Contract</h4>
        <p class="text-surface-600 dark:text-surface-400 mb-4">
          Are you sure you want to delete the contract "{{ contractToDelete?.name }}"? 
          This action cannot be undone.
        </p>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-3">
          <Button 
            label="Cancel" 
            severity="secondary" 
            @click="showDeleteConfirm = false" 
          />
          <Button 
            label="Delete" 
            severity="danger"
            @click="deleteContract"
            :loading="customerContractsStore.loading.contracts"
          />
        </div>
      </template>
    </Dialog>

    <!-- Create/Edit Contract Dialog -->
    <Dialog 
      v-model:visible="showCreateContract" 
      :header="contractForm.id ? 'Edit Contract' : 'Create Contract'"
      modal 
      class="w-[500px]"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Contract Name</label>
          <InputText 
            v-model="contractForm.name" 
            placeholder="Enter contract name"
            class="w-full"
          />
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Start Date</label>
            <DatePicker 
              v-model="contractForm.term_start" 
              dateFormat="yy-mm-dd"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">End Date</label>
            <DatePicker 
              v-model="contractForm.term_end" 
              dateFormat="yy-mm-dd"
              class="w-full"
            />
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Status</label>
            <Select 
              v-model="contractForm.status" 
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select status"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Global Discount %</label>
            <InputNumber 
              v-model="contractForm.global_discount_percent" 
              suffix="%" 
              :min="0" 
              :max="100"
              :maxFractionDigits="2"
              class="w-full"
            />
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-3">
          <Button 
            label="Cancel" 
            severity="secondary" 
            @click="cancelEdit" 
          />
          <Button 
            :label="contractForm.id ? 'Save Changes' : 'Create Contract'" 
            @click="saveContract"
            :loading="customerContractsStore.loading.contracts"
            :disabled="!isFormValid"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useCustomerContractsStore } from '@/stores/customerContractsStore';

const props = defineProps({
  customerId: {
    type: [String, Number],
    required: true
  }
});

const toast = useToast();
const customerContractsStore = useCustomerContractsStore();

// State
const showCreateContract = ref(false);
const showDeleteConfirm = ref(false);
const contractToDelete = ref(null);
const contractForm = reactive({
  id: null,
  name: '',
  term_start: null,
  term_end: null,
  status: 'Proposed',
  global_discount_percent: null
});

// Options
const statusOptions = [
  { label: 'Proposed', value: 'Proposed' },
  { label: 'Signed', value: 'Signed' },
  { label: 'Active', value: 'Active' },
  { label: 'Suspended', value: 'Suspended' },
  { label: 'Cancelled', value: 'Cancelled' },
  { label: 'Expired', value: 'Expired' }
];

// Computed
const isFormValid = computed(() => {
  const hasName = contractForm.name && contractForm.name.trim().length > 0;
  const hasStatus = contractForm.status && contractForm.status.length > 0;
  
  // For now, make dates optional to allow testing
  // TODO: Make dates required once we have proper date data
  const isValid = hasName && hasStatus;
  
  // Debug: Remove this later
  // console.log('Form validation:', { hasName, hasStatus, isValid });
  
  return isValid;
});

// Methods
const formatDate = (dateString) => {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString();
};

const getStatusSeverity = (status) => {
  const severityMap = {
    'Proposed': 'secondary',
    'Signed': 'info',
    'Active': 'success',
    'Suspended': 'warning',
    'Cancelled': 'danger',
    'Expired': 'secondary'
  };
  return severityMap[status] || 'secondary';
};

const editContract = (contract) => {
  const startDate = contract.term_start ? new Date(contract.term_start) : null;
  const endDate = contract.term_end ? new Date(contract.term_end) : null;
  
  Object.assign(contractForm, {
    id: contract.id,
    name: contract.name,
    term_start: startDate,
    term_end: endDate,
    status: contract.status,
    global_discount_percent: contract.global_discount_percent
  });
  
  showCreateContract.value = true;
};

const confirmDeleteContract = (contract) => {
  contractToDelete.value = contract;
  showDeleteConfirm.value = true;
};

const deleteContract = async () => {
  if (!contractToDelete.value) return;
  
  try {
    const success = await customerContractsStore.deleteContract(contractToDelete.value.id);
    
    if (success) {
      toast.add({
        severity: 'success',
        summary: 'Contract Deleted',
        detail: `${contractToDelete.value.name} has been deleted`,
        life: 3000
      });
      showDeleteConfirm.value = false;
      contractToDelete.value = null;
    } else {
      toast.add({
        severity: 'error',
        summary: 'Delete Failed',
        detail: 'Failed to delete contract. Please try again.',
        life: 3000
      });
    }
  } catch (error) {
    console.error('Error deleting contract:', error);
    toast.add({
      severity: 'error',
      summary: 'Delete Error',
      detail: 'An error occurred while deleting the contract',
      life: 3000
    });
  }
};

const saveContract = async () => {
  try {
    const contractData = {
      ...contractForm,
      term_start: contractForm.term_start?.toISOString().split('T')[0],
      term_end: contractForm.term_end?.toISOString().split('T')[0]
    };
    
    const success = await customerContractsStore.saveContract(props.customerId, contractData);
    
    if (success) {
      toast.add({
        severity: 'success',
        summary: 'Contract Saved',
        detail: contractForm.id ? 'Contract updated successfully' : 'Contract created successfully',
        life: 3000
      });
      
      // Reload contracts to get the latest data from backend
      await customerContractsStore.loadContracts(props.customerId);
      
      showCreateContract.value = false;
      resetForm();
    } else {
      toast.add({
        severity: 'error',
        summary: 'Save Failed',
        detail: 'Failed to save contract. Please try again.',
        life: 3000
      });
    }
  } catch (error) {
    console.error('Error saving contract:', error);
    toast.add({
      severity: 'error',
      summary: 'Save Error',
      detail: 'An error occurred while saving the contract',
      life: 3000
    });
  }
};

const resetForm = () => {
  Object.assign(contractForm, {
    id: null,
    name: '',
    term_start: null,
    term_end: null,
    status: 'Proposed',
    global_discount_percent: null
  });
};

const createNewContract = () => {
  resetForm();
  showCreateContract.value = true;
};

const cancelEdit = () => {
  showCreateContract.value = false;
  resetForm();
};

// Watchers
watch(() => showCreateContract.value, (newValue) => {
  if (!newValue) {
    resetForm();
  }
});

// Lifecycle
onMounted(async () => {
  // Data is loaded by CustomerView, but we can refresh if needed
  if (customerContractsStore.contracts.length === 0 && !customerContractsStore.loading.contracts) {
    await customerContractsStore.loadContracts(props.customerId);
  }
});
</script>

<style scoped>
.contracts-tab {
  max-width: 1200px;
}

.contracts-table :deep(.p-datatable .p-datatable-thead > tr > th) {
  background-color: var(--surface-50);
  font-weight: 600;
  padding: 0.75rem;
}

.contracts-table :deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.75rem;
}
</style>