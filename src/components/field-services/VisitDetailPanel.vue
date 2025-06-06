<template>
  <div class="visit-detail-panel">
    <div class="p-6">
      <h3 class="text-xl font-semibold mb-4">Visit Details</h3>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Basic Information -->
        <div>
          <h4 class="font-semibold mb-3">Basic Information</h4>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-surface-600">Visit ID:</span>
              <span class="font-medium">{{ visit.externalId || visit.id }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-surface-600">Customer:</span>
              <span class="font-medium">{{ visit.customer?.name || 'N/A' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-surface-600">Service Date:</span>
              <span class="font-medium">{{ formatDate(visit.serviceDate) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-surface-600">Type:</span>
              <span class="font-medium">{{ visit.visitType }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-surface-600">Status:</span>
              <Tag 
                :value="getStatusLabel(visit.status)" 
                :severity="getStatusSeverity(visit.status)"
              />
            </div>
          </div>
        </div>

        <!-- Financial Information -->
        <div>
          <h4 class="font-semibold mb-3">Financial Summary</h4>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-surface-600">Revenue:</span>
              <span class="font-medium text-green-600">{{ formatCurrency(visit.revenue) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-surface-600">Total Cost:</span>
              <span class="font-medium">{{ formatCurrency(visit.totalCost) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-surface-600">Profit Margin:</span>
              <span class="font-medium" :class="visit.profitMargin > 0 ? 'text-green-600' : 'text-red-600'">
                {{ visit.profitMargin }}%
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-surface-600">Hours Worked:</span>
              <span class="font-medium">{{ visit.hoursWorked || 0 }}h</span>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Insights -->
      <div class="mt-6">
        <h4 class="font-semibold mb-3">AI Insights</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="text-center p-4 bg-surface-50 dark:bg-surface-800 rounded">
            <Rating 
              :model-value="visit.aiInsights?.qualityRating || 0" 
              :readonly="true" 
              :stars="5"
            />
            <div class="text-sm text-surface-600 mt-2">Quality Score</div>
          </div>
          <div class="text-center p-4 bg-surface-50 dark:bg-surface-800 rounded">
            <div class="text-2xl font-bold text-blue-600">{{ visit.aiInsights?.outcomeScore || 0 }}%</div>
            <div class="text-sm text-surface-600">Outcome Score</div>
          </div>
          <div class="text-center p-4 bg-surface-50 dark:bg-surface-800 rounded">
            <Tag 
              :value="(visit.aiInsights?.riskLevel || 'low').toUpperCase()" 
              :severity="getRiskSeverity(visit.aiInsights?.riskLevel)"
            />
            <div class="text-sm text-surface-600 mt-2">Risk Level</div>
          </div>
        </div>
      </div>

      <!-- Work Summary -->
      <div class="mt-6" v-if="visit.workSummary">
        <h4 class="font-semibold mb-3">Work Summary</h4>
        <div class="p-4 bg-surface-50 dark:bg-surface-800 rounded">
          <p>{{ visit.workSummary }}</p>
        </div>
      </div>
    </div>

    <div class="border-t border-surface-200 dark:border-surface-700 p-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Button 
            label="Update Status" 
            @click="showStatusDialog = true"
            severity="primary"
          />
          <Button 
            label="Add Note" 
            @click="showNoteDialog = true"
            outlined
          />
        </div>
        <Button 
          label="Close" 
          @click="$emit('close')"
          text
        />
      </div>
    </div>

    <!-- Status Update Dialog -->
    <Dialog 
      v-model:visible="showStatusDialog" 
      :modal="true" 
      :style="{ width: '400px' }"
      header="Update Visit Status"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">New Status</label>
          <Select 
            v-model="newStatus"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            placeholder="Select status"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Notes (optional)</label>
          <Textarea v-model="statusNotes" placeholder="Add notes about this status change" class="w-full" rows="3" />
        </div>
      </div>
      
      <template #footer>
        <Button label="Cancel" @click="cancelStatusUpdate" text />
        <Button label="Update" @click="updateStatus" :disabled="!newStatus" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  visit: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['status-updated', 'close']);

// Local state
const showStatusDialog = ref(false);
const showNoteDialog = ref(false);
const newStatus = ref('');
const statusNotes = ref('');

const statusOptions = ref([
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Failed', value: 'failed' }
]);

// Methods
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString));
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
}

function getStatusLabel(status) {
  const statusMap = {
    scheduled: 'Scheduled',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    failed: 'Failed'
  };
  return statusMap[status] || status;
}

function getStatusSeverity(status) {
  const severityMap = {
    scheduled: 'info',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'secondary',
    failed: 'danger'
  };
  return severityMap[status] || 'secondary';
}

function getRiskSeverity(riskLevel) {
  const severityMap = {
    low: 'success',
    medium: 'warning',
    high: 'danger'
  };
  return severityMap[riskLevel] || 'info';
}

function updateStatus() {
  emit('status-updated', props.visit.id, newStatus.value, statusNotes.value);
  cancelStatusUpdate();
}

function cancelStatusUpdate() {
  showStatusDialog.value = false;
  newStatus.value = '';
  statusNotes.value = '';
}
</script>

<style scoped>
.visit-detail-panel {
  max-height: 80vh;
  overflow-y: auto;
}
</style> 