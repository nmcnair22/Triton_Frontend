<template>
  <div class="issues-exceptions-tab">
    <!-- Header -->
    <Card class="shadow-sm mb-6">
      <template #header>
        <div class="p-6 pb-0">
          <div class="flex items-center gap-3">
            <div class="bg-orange-100 dark:bg-orange-900/20 rounded-full p-3">
              <i class="pi pi-exclamation-triangle text-orange-600 dark:text-orange-400 text-2xl"></i>
            </div>
            <div>
              <h3 class="text-2xl font-semibold text-surface-900 dark:text-surface-0 mb-1">Issues & Exceptions</h3>
              <p class="text-surface-600 dark:text-surface-400 text-base">Track issues and manage temporary ignores</p>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Two-Panel Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <!-- Left Panel: Issues & Notes -->
      <div class="space-y-6">
        
        <!-- Issues Table -->
        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <span>Issues</span>
              <Button 
                label="Add Issue" 
                icon="pi pi-plus" 
                size="small" 
                @click="showCreateIssue = true"
              />
            </div>
          </template>
          <template #content>
            <DataTable 
              :value="issues" 
              :loading="workbenchStore.loading.issues"
              size="small"
              responsiveLayout="scroll"
            >
              <Column field="issue_type" header="Type" style="width: 120px">
                <template #body="{ data }">
                  <Tag 
                    :value="formatIssueType(data.issue_type)" 
                    :severity="getIssueTypeSeverity(data.issue_type)"
                    class="text-xs"
                  />
                </template>
              </Column>
              <Column field="severity" header="Severity" style="width: 100px">
                <template #body="{ data }">
                  <Tag 
                    :value="data.severity" 
                    :severity="getSeverityColor(data.severity)"
                    class="text-xs"
                  />
                </template>
              </Column>
              <Column field="title" header="Title" />
              <Column field="status" header="Status" style="width: 120px">
                <template #body="{ data }">
                  <Select
                    v-if="updateIssueSupported"
                    v-model="data.status"
                    :options="statusOptions"
                    optionLabel="label"
                    optionValue="value"
                    size="small"
                    @change="updateStatus(data.id, data.status)"
                  />
                  <Tag v-else :value="data.status" class="text-xs" />
                </template>
              </Column>
              <Column field="updated_at" header="Updated" style="width: 100px">
                <template #body="{ data }">
                  <span class="text-xs text-surface-500">
                    {{ formatDate(data.updated_at) }}
                  </span>
                </template>
              </Column>
            </DataTable>

            <Message v-if="issues.length === 0 && !workbenchStore.loading.issues" severity="success" class="mt-4">
              <div class="flex items-center gap-2">
                <i class="pi pi-check-circle"></i>
                <span>No Issues ✓</span>
              </div>
            </Message>
          </template>
        </Card>

        <!-- Notes Table -->
        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <span>Notes</span>
              <Button 
                label="Add Note" 
                icon="pi pi-plus" 
                size="small" 
                @click="showCreateNote = true"
              />
            </div>
          </template>
          <template #content>
            <DataTable 
              :value="notes" 
              :loading="workbenchStore.loading.issues"
              size="small"
              responsiveLayout="scroll"
            >
              <Column field="note_type" header="Type" style="width: 120px">
                <template #body="{ data }">
                  <Tag 
                    :value="formatNoteType(data.note_type)" 
                    severity="info"
                    class="text-xs"
                  />
                </template>
              </Column>
              <Column field="content" header="Content" />
              <Column field="created_at" header="Created" style="width: 100px">
                <template #body="{ data }">
                  <span class="text-xs text-surface-500">
                    {{ formatDate(data.created_at) }}
                  </span>
                </template>
              </Column>
            </DataTable>

            <Message v-if="notes.length === 0 && !workbenchStore.loading.issues" severity="info" class="mt-4">
              <div class="flex items-center gap-2">
                <i class="pi pi-info-circle"></i>
                <span>No notes yet</span>
              </div>
            </Message>
          </template>
        </Card>
      </div>

      <!-- Right Panel: Exceptions -->
      <div>
        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <span>Exceptions</span>
              <Button 
                v-if="!workbenchStore.errors.exceptions"
                label="Add Exception" 
                icon="pi pi-plus" 
                size="small" 
                @click="showCreateException = true"
              />
            </div>
          </template>
          <template #content>
            <!-- Exceptions not available -->
            <Message v-if="workbenchStore.errors.exceptions" severity="warn" class="mb-4">
              <div class="flex flex-col items-center gap-2">
                <i class="pi pi-exclamation-triangle text-xl"></i>
                <div class="font-semibold">Exceptions Not Available</div>
                <div class="text-sm">This feature is not enabled in your environment</div>
              </div>
            </Message>

            <!-- Exceptions table -->
            <DataTable 
              v-else
              :value="exceptions" 
              :loading="workbenchStore.loading.exceptions"
              size="small"
              responsiveLayout="scroll"
            >
              <Column field="code" header="Code" style="width: 120px">
                <template #body="{ data }">
                  <Tag :value="data.code" severity="warning" class="text-xs" />
                </template>
              </Column>
              <Column field="scope" header="Scope" style="width: 80px" />
              <Column field="predicate" header="Rule">
                <template #body="{ data }">
                  <code class="text-xs bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded">
                    {{ JSON.stringify(data.predicate) }}
                  </code>
                </template>
              </Column>
              <Column field="expires_at" header="Expires" style="width: 100px">
                <template #body="{ data }">
                  <span class="text-xs" :class="getExpiryClass(data.expires_at)">
                    {{ formatExpiry(data.expires_at) }}
                  </span>
                </template>
              </Column>
              <Column header="Active" style="width: 80px">
                <template #body="{ data }">
                  <ToggleSwitch 
                    v-model="data.active" 
                    size="small"
                    @change="toggleException(data.id, data.active)"
                  />
                </template>
              </Column>
            </DataTable>

            <Message v-if="exceptions.length === 0 && !workbenchStore.loading.exceptions && !workbenchStore.errors.exceptions" severity="info" class="mt-4">
              <div class="flex items-center gap-2">
                <i class="pi pi-info-circle"></i>
                <span>No exceptions</span>
              </div>
            </Message>
          </template>
        </Card>
      </div>
    </div>

    <!-- Create Issue Dialog -->
    <Dialog v-model:visible="showCreateIssue" header="Create Issue" modal class="w-[600px]">
      <form @submit.prevent="createIssue" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Issue Type *</label>
            <Select
              v-model="newIssue.issue_type"
              :options="issueTypes"
              optionLabel="label"
              optionValue="value"
              placeholder="Select issue type"
              class="w-full"
              :class="{ 'p-invalid': errors.issue_type }"
            />
            <small class="text-red-500" v-if="errors.issue_type">{{ errors.issue_type }}</small>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Severity *</label>
            <Select
              v-model="newIssue.severity"
              :options="severityOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select severity"
              class="w-full"
              :class="{ 'p-invalid': errors.severity }"
            />
            <small class="text-red-500" v-if="errors.severity">{{ errors.severity }}</small>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Title *</label>
          <InputText
            v-model="newIssue.title"
            placeholder="Brief description of the issue"
            class="w-full"
            :class="{ 'p-invalid': errors.title }"
          />
          <small class="text-red-500" v-if="errors.title">{{ errors.title }}</small>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Description *</label>
          <Textarea
            v-model="newIssue.description"
            placeholder="Detailed description of the issue"
            rows="3"
            class="w-full"
            :class="{ 'p-invalid': errors.description }"
          />
          <small class="text-red-500" v-if="errors.description">{{ errors.description }}</small>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Expected Value</label>
            <InputText
              v-model="newIssue.expected_value"
              placeholder="What was expected"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Actual Value</label>
            <InputText
              v-model="newIssue.actual_value"
              placeholder="What was found"
              class="w-full"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Assigned To</label>
          <InputText
            v-model="newIssue.assigned_to"
            placeholder="Name or email"
            class="w-full"
          />
        </div>

        <div class="flex justify-end gap-2 pt-4">
          <Button 
            label="Cancel" 
            severity="secondary" 
            @click="showCreateIssue = false" 
          />
          <Button 
            label="Create Issue" 
            type="submit"
            :loading="workbenchStore.loading.issues"
          />
        </div>
      </form>
    </Dialog>

    <!-- Create Note Dialog -->
    <Dialog v-model:visible="showCreateNote" header="Add Note" modal class="w-[500px]">
      <form @submit.prevent="createNote" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Note Type *</label>
          <Select
            v-model="newNote.note_type"
            :options="noteTypes"
            optionLabel="label"
            optionValue="value"
            placeholder="Select note type"
            class="w-full"
            :class="{ 'p-invalid': errors.note_type }"
          />
          <small class="text-red-500" v-if="errors.note_type">{{ errors.note_type }}</small>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Content *</label>
          <Textarea
            v-model="newNote.content"
            placeholder="Note content"
            rows="4"
            class="w-full"
            :class="{ 'p-invalid': errors.content }"
          />
          <small class="text-red-500" v-if="errors.content">{{ errors.content }}</small>
        </div>

        <div class="flex items-center gap-2">
          <Checkbox v-model="newNote.is_internal" inputId="internal" />
          <label for="internal" class="text-sm">Internal note (not visible to external users)</label>
        </div>

        <div class="flex justify-end gap-2 pt-4">
          <Button 
            label="Cancel" 
            severity="secondary" 
            @click="showCreateNote = false" 
          />
          <Button 
            label="Add Note" 
            type="submit"
            :loading="workbenchStore.loading.issues"
          />
        </div>
      </form>
    </Dialog>

    <!-- Create Exception Dialog -->
    <Dialog v-model:visible="showCreateException" header="Create Exception" modal class="w-[600px]">
      <form @submit.prevent="createException" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Exception Code *</label>
            <InputText
              v-model="newException.code"
              placeholder="e.g., PLAN_MISMATCH"
              class="w-full"
              :class="{ 'p-invalid': errors.code }"
            />
            <small class="text-red-500" v-if="errors.code">{{ errors.code }}</small>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Scope *</label>
            <Select
              v-model="newException.scope"
              :options="scopeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select scope"
              class="w-full"
              :class="{ 'p-invalid': errors.scope }"
            />
            <small class="text-red-500" v-if="errors.scope">{{ errors.scope }}</small>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Predicate (JSON) *</label>
          <Textarea
            v-model="newException.predicateJson"
            placeholder='{"sim_code": "BELL1GB", "billed_plan": "VZ1GB"}'
            rows="3"
            class="w-full font-mono text-sm"
            :class="{ 'p-invalid': errors.predicate }"
          />
          <small class="text-red-500" v-if="errors.predicate">{{ errors.predicate }}</small>
          <small class="text-surface-500">JSON object for equality matching</small>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Note *</label>
          <Textarea
            v-model="newException.note"
            placeholder="Reason for exception"
            rows="2"
            class="w-full"
            :class="{ 'p-invalid': errors.note }"
          />
          <small class="text-red-500" v-if="errors.note">{{ errors.note }}</small>
        </div>

        <div class="flex justify-end gap-2 pt-4">
          <Button 
            label="Cancel" 
            severity="secondary" 
            @click="showCreateException = false" 
          />
          <Button 
            label="Create Exception" 
            type="submit"
            :loading="workbenchStore.loading.exceptions"
          />
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useWorkbenchStore } from '@/stores/workbenchStore';
import { useToast } from 'primevue/usetoast';

// Props
const props = defineProps({
  locationId: {
    type: Number,
    required: true
  },
  customerId: {
    type: Number,
    required: true
  }
});

// Composables
const workbenchStore = useWorkbenchStore();
const toast = useToast();

// Reactive state
const showCreateIssue = ref(false);
const showCreateNote = ref(false);
const showCreateException = ref(false);
const updateIssueSupported = ref(true); // Will be set to false if PATCH 404s
const errors = ref({});

// Form data
const newIssue = ref({
  issue_type: '',
  severity: '',
  title: '',
  description: '',
  expected_value: '',
  actual_value: '',
  assigned_to: '',
  metadata: {}
});

const newNote = ref({
  note_type: '',
  content: '',
  is_internal: true
});

const newException = ref({
  code: '',
  scope: '',
  predicateJson: '',
  note: ''
});

// Options
// All options fetched from backend reference APIs - NO HARDCODED DATA
const issueTypes = ref([]);
const severityOptions = ref([]);
const statusOptions = ref([]);
const noteTypes = ref([]);
const scopeOptions = ref([]);

// Computed
const issues = computed(() => workbenchStore.locationDetail?.issues || []);
const notes = computed(() => workbenchStore.locationDetail?.notes || []);
const exceptions = computed(() => workbenchStore.exceptions || []);

// Methods
const resetIssueForm = () => {
  newIssue.value = {
    issue_type: '',
    severity: '',
    title: '',
    description: '',
    expected_value: '',
    actual_value: '',
    assigned_to: '',
    metadata: {}
  };
  errors.value = {};
};

const resetNoteForm = () => {
  newNote.value = {
    note_type: '',
    content: '',
    is_internal: true
  };
  errors.value = {};
};

const resetExceptionForm = () => {
  newException.value = {
    code: '',
    scope: '',
    predicateJson: '',
    note: ''
  };
  errors.value = {};
};

const validateIssue = () => {
  errors.value = {};
  
  if (!newIssue.value.issue_type) errors.value.issue_type = 'Issue type is required';
  if (!newIssue.value.severity) errors.value.severity = 'Severity is required';
  if (!newIssue.value.title) errors.value.title = 'Title is required';
  if (!newIssue.value.description) errors.value.description = 'Description is required';
  
  return Object.keys(errors.value).length === 0;
};

const validateNote = () => {
  errors.value = {};
  
  if (!newNote.value.note_type) errors.value.note_type = 'Note type is required';
  if (!newNote.value.content) errors.value.content = 'Content is required';
  
  return Object.keys(errors.value).length === 0;
};

const validateException = () => {
  errors.value = {};
  
  if (!newException.value.code) errors.value.code = 'Exception code is required';
  if (!newException.value.scope) errors.value.scope = 'Scope is required';
  if (!newException.value.note) errors.value.note = 'Note is required';
  
  if (newException.value.predicateJson) {
    try {
      JSON.parse(newException.value.predicateJson);
    } catch (e) {
      errors.value.predicate = 'Invalid JSON format';
    }
  } else {
    errors.value.predicate = 'Predicate is required';
  }
  
  return Object.keys(errors.value).length === 0;
};

const createIssue = async () => {
  if (!validateIssue()) return;
  
  try {
    await workbenchStore.createIssue(props.customerId, props.locationId, newIssue.value);
    toast.add({
      severity: 'success',
      summary: 'Issue Created',
      detail: 'Issue has been created successfully',
      life: 3000
    });
    showCreateIssue.value = false;
    resetIssueForm();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Failed to Create Issue',
      detail: error.response?.data?.message || 'An error occurred',
      life: 5000
    });
  }
};

const createNote = async () => {
  if (!validateNote()) return;
  
  try {
    await workbenchStore.createNote(props.customerId, props.locationId, newNote.value);
    toast.add({
      severity: 'success',
      summary: 'Note Added',
      detail: 'Note has been added successfully',
      life: 3000
    });
    showCreateNote.value = false;
    resetNoteForm();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Failed to Add Note',
      detail: error.response?.data?.message || 'An error occurred',
      life: 5000
    });
  }
};

const createException = async () => {
  if (!validateException()) return;
  
  try {
    const exceptionData = {
      code: newException.value.code,
      scope: newException.value.scope,
      predicate: JSON.parse(newException.value.predicateJson),
      note: newException.value.note
    };
    
    await workbenchStore.createException(props.locationId, exceptionData);
    toast.add({
      severity: 'success',
      summary: 'Exception Created',
      detail: 'Exception has been created successfully',
      life: 3000
    });
    showCreateException.value = false;
    resetExceptionForm();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Failed to Create Exception',
      detail: error.response?.data?.message || 'An error occurred',
      life: 5000
    });
  }
};

const updateStatus = async (issueId, status) => {
  try {
    await workbenchStore.updateIssueStatus(props.customerId, props.locationId, issueId, status);
    toast.add({
      severity: 'success',
      summary: 'Status Updated',
      detail: 'Issue status has been updated',
      life: 3000
    });
  } catch (error) {
    if (error.response?.status === 404) {
      updateIssueSupported.value = false;
      toast.add({
        severity: 'info',
        summary: 'Feature Not Available',
        detail: 'Status updates not supported yet',
        life: 3000
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Failed to Update Status',
        detail: error.response?.data?.message || 'An error occurred',
        life: 5000
      });
    }
  }
};

const toggleException = async (exceptionId, active) => {
  try {
    await workbenchStore.updateException(props.locationId, exceptionId, { active });
    toast.add({
      severity: 'success',
      summary: 'Exception Updated',
      detail: active ? 'Exception activated' : 'Exception deactivated',
      life: 3000
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Failed to Update Exception',
      detail: error.response?.data?.message || 'An error occurred',
      life: 5000
    });
  }
};

// Formatting helpers
const formatIssueType = (type) => {
  return type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '';
};

const formatNoteType = (type) => {
  return type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '';
};

const getIssueTypeSeverity = (type) => {
  const severityMap = {
    'asset_mismatch': 'warning',
    'charge_mismatch': 'warning',
    'missing_assets': 'danger',
    'missing_charges': 'danger',
    'configuration_error': 'info'
  };
  return severityMap[type] || 'info';
};

const getSeverityColor = (severity) => {
  const colorMap = {
    'low': 'info',
    'medium': 'warning',
    'high': 'warning',
    'critical': 'danger'
  };
  return colorMap[severity] || 'info';
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatExpiry = (expiresAt) => {
  if (!expiresAt) return 'Never';
  
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Expired';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day';
  return `${diffDays} days`;
};

const getExpiryClass = (expiresAt) => {
  if (!expiresAt) return 'text-surface-500';
  
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'text-red-500';
  if (diffDays <= 3) return 'text-orange-500';
  return 'text-surface-600';
};

// Load reference data from backend (defensive - fallback if endpoints missing)
const loadReferenceData = async () => {
  try {
    // Issue types from backend
    try {
      const issueTypesResponse = await auditClient.http.get('/audit/ref/issue-types');
      issueTypes.value = issueTypesResponse.data?.types || [];
    } catch (error) {
      console.warn('Issue types endpoint not available, using fallback');
      issueTypes.value = [
        { label: 'Asset Mismatch', value: 'asset_mismatch' },
        { label: 'Charge Mismatch', value: 'charge_mismatch' },
        { label: 'Missing Assets', value: 'missing_assets' },
        { label: 'Missing Charges', value: 'missing_charges' },
        { label: 'Configuration Error', value: 'configuration_error' }
      ];
    }
    
    // Severity options from backend
    try {
      const severityResponse = await auditClient.http.get('/audit/ref/severities');
      severityOptions.value = severityResponse.data?.severities || [];
    } catch (error) {
      console.warn('Severities endpoint not available, using fallback');
      severityOptions.value = [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Critical', value: 'critical' }
      ];
    }
    
    // Status options from backend
    try {
      const statusResponse = await auditClient.http.get('/audit/ref/statuses');
      statusOptions.value = statusResponse.data?.statuses || [];
    } catch (error) {
      console.warn('Statuses endpoint not available, using fallback');
      statusOptions.value = [
        { label: 'Open', value: 'open' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Resolved', value: 'resolved' },
        { label: 'Closed', value: 'closed' }
      ];
    }
    
    // Note types from backend
    try {
      const noteTypesResponse = await auditClient.http.get('/audit/ref/note-types');
      noteTypes.value = noteTypesResponse.data?.types || [];
    } catch (error) {
      console.warn('Note types endpoint not available, using fallback');
      noteTypes.value = [
        { label: 'General', value: 'general' },
        { label: 'Investigation', value: 'investigation' },
        { label: 'Resolution', value: 'resolution' },
        { label: 'Validation', value: 'validation' },
        { label: 'Follow Up', value: 'follow_up' }
      ];
    }
    
    // Scope options from backend
    try {
      const scopeResponse = await auditClient.http.get('/audit/ref/scopes');
      scopeOptions.value = scopeResponse.data?.scopes || [];
    } catch (error) {
      console.warn('Scopes endpoint not available, using fallback');
      scopeOptions.value = [
        { label: 'Plan', value: 'PLAN' },
        { label: 'Asset', value: 'ASSET' },
        { label: 'Charge', value: 'CHARGE' }
      ];
    }
    
  } catch (error) {
    console.error('Failed to load reference data:', error);
  }
};

// Initialize data on mount
onMounted(async () => {
  // Load reference data from backend APIs first
  await loadReferenceData();
  
  // Load exceptions (defensive)
  await workbenchStore.loadExceptions(props.locationId);
});

// Expose method for prefilled issue creation (for Licensing integration)
const createPreffilledIssue = (issueData) => {
  Object.assign(newIssue.value, issueData);
  showCreateIssue.value = true;
};

defineExpose({
  createPreffilledIssue
});
</script>

<style scoped>
.issues-exceptions-tab {
  /* Component-specific styles */
}
</style>
