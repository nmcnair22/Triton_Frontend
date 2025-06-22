<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Checkbox from 'primevue/checkbox';
import SelectButton from 'primevue/selectbutton';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Badge from 'primevue/badge';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import ScrollPanel from 'primevue/scrollpanel';

// Toast for notifications
const toast = useToast();

// Active tab reference
const activeTab = ref(0);

// Alert configuration form
const alertForm = ref({
  name: '',
  type: null,
  metric: null,
  condition: null,
  threshold: 0,
  duration: 0,
  notifyVia: [],
  enabled: true
});

// Alert configuration options
const alertTypeOptions = ref([
  { name: 'Financial', code: 'FIN' },
  { name: 'Operational', code: 'OPS' },
  { name: 'Security', code: 'SEC' },
  { name: 'Compliance', code: 'COM' }
]);

const metricOptions = computed(() => {
  // Change available metrics based on selected alert type
  if (!alertForm.value.type) return [];
  
  switch (alertForm.value.type.code) {
    case 'FIN':
      return [
        { name: 'Cash Balance', code: 'CASH' },
        { name: 'Accounts Receivable', code: 'AR' },
        { name: 'Accounts Payable', code: 'AP' },
        { name: 'Revenue', code: 'REV' },
        { name: 'Expenses', code: 'EXP' },
        { name: 'Gross Margin', code: 'GM' }
      ];
    case 'OPS':
      return [
        { name: 'Inventory Levels', code: 'INV' },
        { name: 'Order Volume', code: 'ORD' },
        { name: 'Processing Time', code: 'PROC' },
        { name: 'Fulfillment Rate', code: 'FULFILL' }
      ];
    case 'SEC':
      return [
        { name: 'Login Attempts', code: 'LOGIN' },
        { name: 'Password Changes', code: 'PWD' },
        { name: 'Admin Actions', code: 'ADMIN' },
        { name: 'Data Access', code: 'DATA' }
      ];
    case 'COM':
      return [
        { name: 'Reporting Deadlines', code: 'REPORT' },
        { name: 'Document Expiry', code: 'DOC' },
        { name: 'License Status', code: 'LIC' },
        { name: 'Audit Requirements', code: 'AUDIT' }
      ];
    default:
      return [];
  }
});

const conditionOptions = ref([
  { name: 'Above', code: 'GT' },
  { name: 'Below', code: 'LT' },
  { name: 'Equal to', code: 'EQ' },
  { name: 'Change by', code: 'CHG' }
]);

const notificationOptions = ref([
  { name: 'Email', code: 'EMAIL' },
  { name: 'SMS', code: 'SMS' },
  { name: 'In-App', code: 'APP' },
  { name: 'Slack', code: 'SLACK' }
]);

// Validation state
const formErrors = ref({});
const validateForm = () => {
  formErrors.value = {};
  let isValid = true;
  
  if (!alertForm.value.name) {
    formErrors.value.name = 'Alert name is required';
    isValid = false;
  }
  
  if (!alertForm.value.type) {
    formErrors.value.type = 'Alert type is required';
    isValid = false;
  }
  
  if (!alertForm.value.metric) {
    formErrors.value.metric = 'Metric is required';
    isValid = false;
  }
  
  if (!alertForm.value.condition) {
    formErrors.value.condition = 'Condition is required';
    isValid = false;
  }
  
  if (alertForm.value.notifyVia.length === 0) {
    formErrors.value.notifyVia = 'At least one notification method is required';
    isValid = false;
  }
  
  return isValid;
};

// Submit alert configuration
const saveAlert = () => {
  if (!validateForm()) {
    toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Please correct the form errors', life: 3000 });
    return;
  }
  
  // In a real app, this would send the data to an API
  const newAlert = {
    id: Math.floor(Math.random() * 10000),
    ...alertForm.value,
    createdAt: new Date().toISOString(),
    status: alertForm.value.enabled ? 'Active' : 'Disabled'
  };
  
  configuredAlerts.value.unshift(newAlert);
  
  toast.add({ severity: 'success', summary: 'Alert Created', detail: `Alert "${alertForm.value.name}" has been created successfully`, life: 3000 });
  
  // Reset form
  resetForm();
};

// Reset form
const resetForm = () => {
  alertForm.value = {
    name: '',
    type: null,
    metric: null,
    condition: null,
    threshold: 0,
    duration: 0,
    notifyVia: [],
    enabled: true
  };
  formErrors.value = {};
};

// Configured alerts
const configuredAlerts = ref([
  {
    id: 1001,
    name: 'Low Cash Balance',
    type: { name: 'Financial', code: 'FIN' },
    metric: { name: 'Cash Balance', code: 'CASH' },
    condition: { name: 'Below', code: 'LT' },
    threshold: 50000,
    duration: 0,
    notifyVia: [{ name: 'Email', code: 'EMAIL' }, { name: 'SMS', code: 'SMS' }],
    createdAt: '2023-06-15T08:30:00Z',
    status: 'Active',
    enabled: true
  },
  {
    id: 1002,
    name: 'AR Over 30 Days',
    type: { name: 'Financial', code: 'FIN' },
    metric: { name: 'Accounts Receivable', code: 'AR' },
    condition: { name: 'Above', code: 'GT' },
    threshold: 100000,
    duration: 30,
    notifyVia: [{ name: 'Email', code: 'EMAIL' }, { name: 'In-App', code: 'APP' }],
    createdAt: '2023-07-22T14:15:00Z',
    status: 'Active',
    enabled: true
  },
  {
    id: 1003,
    name: 'Low Inventory Alert',
    type: { name: 'Operational', code: 'OPS' },
    metric: { name: 'Inventory Levels', code: 'INV' },
    condition: { name: 'Below', code: 'LT' },
    threshold: 20,
    duration: 0,
    notifyVia: [{ name: 'Email', code: 'EMAIL' }, { name: 'SMS', code: 'SMS' }, { name: 'Slack', code: 'SLACK' }],
    createdAt: '2023-08-05T11:45:00Z',
    status: 'Active',
    enabled: true
  },
  {
    id: 1004,
    name: 'Gross Margin Warning',
    type: { name: 'Financial', code: 'FIN' },
    metric: { name: 'Gross Margin', code: 'GM' },
    condition: { name: 'Below', code: 'LT' },
    threshold: 25,
    duration: 7,
    notifyVia: [{ name: 'Email', code: 'EMAIL' }],
    createdAt: '2023-09-10T09:20:00Z',
    status: 'Disabled',
    enabled: false
  },
  {
    id: 1005,
    name: 'Multiple Login Attempts',
    type: { name: 'Security', code: 'SEC' },
    metric: { name: 'Login Attempts', code: 'LOGIN' },
    condition: { name: 'Above', code: 'GT' },
    threshold: 5,
    duration: 0,
    notifyVia: [{ name: 'Email', code: 'EMAIL' }, { name: 'SMS', code: 'SMS' }, { name: 'In-App', code: 'APP' }],
    createdAt: '2023-10-18T16:30:00Z',
    status: 'Active',
    enabled: true
  }
]);

// Alert history
const alertHistory = ref([
  {
    id: 5001,
    alertId: 1001,
    alertName: 'Low Cash Balance',
    type: 'Financial',
    metric: 'Cash Balance',
    condition: 'Below',
    threshold: 50000,
    value: 48500,
    timestamp: '2023-11-15T09:23:45Z',
    status: 'Triggered',
    severity: 'High'
  },
  {
    id: 5002,
    alertId: 1002,
    alertName: 'AR Over 30 Days',
    type: 'Financial',
    metric: 'Accounts Receivable',
    condition: 'Above',
    threshold: 100000,
    value: 145600,
    timestamp: '2023-11-14T14:36:12Z',
    status: 'Triggered',
    severity: 'Medium'
  },
  {
    id: 5003,
    alertId: 1003,
    alertName: 'Low Inventory Alert',
    type: 'Operational',
    metric: 'Inventory Levels',
    condition: 'Below',
    threshold: 20,
    value: 18,
    timestamp: '2023-11-12T11:15:32Z',
    status: 'Triggered',
    severity: 'High'
  },
  {
    id: 5004,
    alertId: 1001,
    alertName: 'Low Cash Balance',
    type: 'Financial',
    metric: 'Cash Balance',
    condition: 'Below',
    threshold: 50000,
    value: 52400,
    timestamp: '2023-11-16T10:05:18Z',
    status: 'Resolved',
    severity: 'High'
  },
  {
    id: 5005,
    alertId: 1005,
    alertName: 'Multiple Login Attempts',
    type: 'Security',
    metric: 'Login Attempts',
    condition: 'Above',
    threshold: 5,
    value: 8,
    timestamp: '2023-11-15T16:42:08Z',
    status: 'Triggered',
    severity: 'Critical'
  },
  {
    id: 5006,
    alertId: 1002,
    alertName: 'AR Over 30 Days',
    type: 'Financial',
    metric: 'Accounts Receivable',
    condition: 'Above',
    threshold: 100000,
    value: 98700,
    timestamp: '2023-11-17T08:22:45Z',
    status: 'Resolved',
    severity: 'Medium'
  },
  {
    id: 5007,
    alertId: 1005,
    alertName: 'Multiple Login Attempts',
    type: 'Security',
    metric: 'Login Attempts',
    condition: 'Above',
    threshold: 5,
    value: 3,
    timestamp: '2023-11-15T17:15:32Z',
    status: 'Resolved',
    severity: 'Critical'
  }
]);

// Active alerts
const activeAlerts = computed(() => {
  return alertHistory.value.filter(alert => alert.status === 'Triggered');
});

// Get badge severity for alert status
const getSeverityClass = (severity) => {
  switch (severity.toLowerCase()) {
    case 'critical': return 'p-badge-danger';
    case 'high': return 'p-badge-warning';
    case 'medium': return 'p-badge-info';
    case 'low': return 'p-badge-success';
    default: return 'p-badge-secondary';
  }
};

// Format date helper
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Get alert details
const selectedAlert = ref(null);
const showAlertDetails = ref(false);

const viewAlertDetails = (alert) => {
  selectedAlert.value = alert;
  showAlertDetails.value = true;
};

// Toggle alert status
const toggleAlertStatus = (alert) => {
  alert.enabled = !alert.enabled;
  alert.status = alert.enabled ? 'Active' : 'Disabled';
  
  toast.add({
    severity: alert.enabled ? 'success' : 'info',
    summary: alert.enabled ? 'Alert Activated' : 'Alert Disabled',
    detail: `Alert "${alert.name}" has been ${alert.enabled ? 'activated' : 'disabled'}`,
    life: 3000
  });
};

// Delete alert
const confirmDeleteAlert = ref(false);
const alertToDelete = ref(null);

const promptDeleteAlert = (alert) => {
  alertToDelete.value = alert;
  confirmDeleteAlert.value = true;
};

const deleteAlert = () => {
  if (!alertToDelete.value) return;
  
  const index = configuredAlerts.value.findIndex(a => a.id === alertToDelete.value.id);
  if (index !== -1) {
    configuredAlerts.value.splice(index, 1);
    
    toast.add({
      severity: 'success',
      summary: 'Alert Deleted',
      detail: `Alert "${alertToDelete.value.name}" has been deleted`,
      life: 3000
    });
  }
  
  confirmDeleteAlert.value = false;
  alertToDelete.value = null;
};

// Acknowledge alert
const acknowledgeAlert = (alert) => {
  const index = alertHistory.value.findIndex(a => a.id === alert.id);
  if (index !== -1) {
    alertHistory.value[index].status = 'Acknowledged';
    
    toast.add({
      severity: 'info',
      summary: 'Alert Acknowledged',
      detail: `Alert for "${alert.alertName}" has been acknowledged`,
      life: 3000
    });
  }
};

// Mark alert as resolved
const resolveAlert = (alert) => {
  const index = alertHistory.value.findIndex(a => a.id === alert.id);
  if (index !== -1) {
    alertHistory.value[index].status = 'Resolved';
    
    toast.add({
      severity: 'success',
      summary: 'Alert Resolved',
      detail: `Alert for "${alert.alertName}" has been resolved`,
      life: 3000
    });
  }
};

// Simulate real-time alert generation (for demo purposes)
const alertSimulator = ref(null);
const simulateAlert = () => {
  const existingAlert = configuredAlerts.value[Math.floor(Math.random() * configuredAlerts.value.length)];
  if (!existingAlert || !existingAlert.enabled) return;
  
  const randomValue = existingAlert.condition.code === 'LT' 
    ? existingAlert.threshold * 0.8 + Math.random() * existingAlert.threshold * 0.2
    : existingAlert.threshold * 0.9 + Math.random() * existingAlert.threshold * 0.3;
  
  const shouldTrigger = existingAlert.condition.code === 'LT' 
    ? randomValue < existingAlert.threshold
    : randomValue > existingAlert.threshold;
  
  if (shouldTrigger) {
    const severities = ['Low', 'Medium', 'High', 'Critical'];
    const newAlert = {
      id: 5000 + alertHistory.value.length + 1,
      alertId: existingAlert.id,
      alertName: existingAlert.name,
      type: existingAlert.type.name,
      metric: existingAlert.metric.name,
      condition: existingAlert.condition.name,
      threshold: existingAlert.threshold,
      value: Math.round(randomValue),
      timestamp: new Date().toISOString(),
      status: 'Triggered',
      severity: severities[Math.floor(Math.random() * severities.length)]
    };
    
    alertHistory.value.unshift(newAlert);
    
    toast.add({
      severity: 'warn',
      summary: 'New Alert Triggered',
      detail: `${newAlert.alertName}: ${newAlert.metric} is ${newAlert.condition} threshold`,
      life: 5000
    });
  }
};

// Start and stop alert simulation
onMounted(() => {
  alertSimulator.value = setInterval(simulateAlert, 30000); // Simulate every 30 seconds
});

onUnmounted(() => {
  if (alertSimulator.value) {
    clearInterval(alertSimulator.value);
  }
});
</script>

<template>
  <div class="p-4">
    <Toast />
    
    <!-- Page Header -->
    <div class="mb-5">
      <h1 class="text-3xl font-bold mb-2">Real-time Alerts Management</h1>
      <p class="text-gray-600 dark:text-gray-400">Configure, monitor, and manage financial and operational alerts</p>
    </div>

    <!-- Main Content Tabs -->
    <TabView v-model:activeIndex="activeTab">
      <!-- Active Alerts Tab -->
      <TabPanel header="Active Alerts">
        <div class="grid grid-cols-1 gap-4">
          <!-- Summary Cards Row -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Card class="bg-red-50 dark:bg-red-900 border-left-4 border-red-500">
              <template #content>
                <div class="flex justify-between items-center">
                  <div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">Critical Alerts</div>
                    <div class="text-2xl font-bold mt-1">{{ activeAlerts.filter(a => a.severity === 'Critical').length }}</div>
                  </div>
                  <div class="p-3 bg-red-100 dark:bg-red-800 rounded-full">
                    <i class="pi pi-exclamation-triangle text-red-500 text-xl"></i>
                  </div>
                </div>
              </template>
            </Card>
            
            <Card class="bg-orange-50 dark:bg-orange-900 border-left-4 border-orange-500">
              <template #content>
                <div class="flex justify-between items-center">
                  <div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">High Priority</div>
                    <div class="text-2xl font-bold mt-1">{{ activeAlerts.filter(a => a.severity === 'High').length }}</div>
                  </div>
                  <div class="p-3 bg-orange-100 dark:bg-orange-800 rounded-full">
                    <i class="pi pi-exclamation-circle text-orange-500 text-xl"></i>
                  </div>
                </div>
              </template>
            </Card>
            
            <Card class="bg-blue-50 dark:bg-blue-900 border-left-4 border-blue-500">
              <template #content>
                <div class="flex justify-between items-center">
                  <div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">Medium Priority</div>
                    <div class="text-2xl font-bold mt-1">{{ activeAlerts.filter(a => a.severity === 'Medium').length }}</div>
                  </div>
                  <div class="p-3 bg-blue-100 dark:bg-blue-800 rounded-full">
                    <i class="pi pi-info-circle text-blue-500 text-xl"></i>
                  </div>
                </div>
              </template>
            </Card>
            
            <Card class="bg-green-50 dark:bg-green-900 border-left-4 border-green-500">
              <template #content>
                <div class="flex justify-between items-center">
                  <div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">Low Priority</div>
                    <div class="text-2xl font-bold mt-1">{{ activeAlerts.filter(a => a.severity === 'Low').length }}</div>
                  </div>
                  <div class="p-3 bg-green-100 dark:bg-green-800 rounded-full">
                    <i class="pi pi-check-circle text-green-500 text-xl"></i>
                  </div>
                </div>
              </template>
            </Card>
          </div>
          
          <!-- Active Alerts Status Board -->
          <Card>
            <template #title>
              <div class="flex justify-between items-center">
                <span>Active Alerts Status Board</span>
                <Button icon="pi pi-refresh" text rounded tooltip="Refresh Alerts" />
              </div>
            </template>
            <template #content>
              <div v-if="activeAlerts.length === 0" class="p-4 text-center text-gray-500">
                <i class="pi pi-check-circle text-green-500 text-3xl mb-3 block"></i>
                <p class="mb-2">No active alerts at this time.</p>
                <p class="text-sm">Everything is running smoothly.</p>
              </div>
              
              <div v-else>
                <DataTable :value="activeAlerts" stripedRows responsiveLayout="scroll">
                  <Column field="severity" header="Severity" style="width: 10%">
                    <template #body="{ data }">
                      <Tag :severity="data.severity === 'Critical' ? 'danger' : 
                                    data.severity === 'High' ? 'warning' :
                                    data.severity === 'Medium' ? 'info' : 'success'" 
                          :value="data.severity" />
                    </template>
                  </Column>
                  <Column field="alertName" header="Alert" style="width: 20%">
                    <template #body="{ data }">
                      <div class="font-medium">{{ data.alertName }}</div>
                      <div class="text-xs text-gray-500">{{ data.type }}</div>
                    </template>
                  </Column>
                  <Column field="metric" header="Metric" style="width: 15%"></Column>
                  <Column field="threshold" header="Threshold" style="width: 15%">
                    <template #body="{ data }">
                      {{ data.condition }} {{ data.threshold }}
                    </template>
                  </Column>
                  <Column field="value" header="Current Value" style="width: 15%"></Column>
                  <Column field="timestamp" header="Time" style="width: 15%">
                    <template #body="{ data }">
                      {{ formatDate(data.timestamp) }}
                    </template>
                  </Column>
                  <Column header="Actions" style="width: 10%">
                    <template #body="{ data }">
                      <div class="flex gap-2">
                        <Button icon="pi pi-eye" text rounded tooltip="View Details" @click="viewAlertDetails(data)" />
                        <Button icon="pi pi-check" text rounded tooltip="Acknowledge" @click="acknowledgeAlert(data)" severity="info" />
                        <Button icon="pi pi-check-square" text rounded tooltip="Resolve" @click="resolveAlert(data)" severity="success" />
                      </div>
                    </template>
                  </Column>
                </DataTable>
              </div>
            </template>
          </Card>
        </div>
      </TabPanel>
      
      <!-- Alert Configuration Tab -->
      <TabPanel header="Alert Configuration">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- Alert Configuration Form -->
          <Card class="lg:col-span-1">
            <template #title>
              <span>Create New Alert</span>
            </template>
            <template #content>
              <div class="p-fluid">
                <div class="field mb-4">
                  <label for="alertName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alert Name</label>
                  <InputText id="alertName" v-model="alertForm.name" :class="{'p-invalid': formErrors.name}" />
                  <small v-if="formErrors.name" class="p-error">{{ formErrors.name }}</small>
                </div>
                
                <div class="field mb-4">
                  <label for="alertType" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alert Type</label>
                  <Select id="alertType" v-model="alertForm.type" :options="alertTypeOptions" optionLabel="name" 
                            placeholder="Select Alert Type" :class="{'p-invalid': formErrors.type}" />
                  <small v-if="formErrors.type" class="p-error">{{ formErrors.type }}</small>
                </div>
                
                <div class="field mb-4">
                  <label for="metric" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Metric</label>
                  <Select id="metric" v-model="alertForm.metric" :options="metricOptions" optionLabel="name" 
                            placeholder="Select Metric" :disabled="!alertForm.type" :class="{'p-invalid': formErrors.metric}" />
                  <small v-if="formErrors.metric" class="p-error">{{ formErrors.metric }}</small>
                </div>
                
                <div class="field mb-4">
                  <label for="condition" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condition</label>
                  <Select id="condition" v-model="alertForm.condition" :options="conditionOptions" optionLabel="name" 
                           placeholder="Select Condition" :class="{'p-invalid': formErrors.condition}" />
                  <small v-if="formErrors.condition" class="p-error">{{ formErrors.condition }}</small>
                </div>
                
                <div class="field mb-4">
                  <label for="threshold" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Threshold Value</label>
                  <InputNumber id="threshold" v-model="alertForm.threshold" :min="0" showButtons />
                </div>
                
                <div class="field mb-4">
                  <label for="duration" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (Days, 0 = immediately)</label>
                  <InputNumber id="duration" v-model="alertForm.duration" :min="0" :max="365" showButtons />
                </div>
                
                <div class="field mb-4">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notification Methods</label>
                  <div class="flex flex-wrap gap-3">
                    <div v-for="option in notificationOptions" :key="option.code" class="flex align-items-center">
                      <Checkbox :id="option.code" v-model="alertForm.notifyVia" :value="option" :class="{'p-invalid': formErrors.notifyVia}" />
                      <label :for="option.code" class="ml-2">{{ option.name }}</label>
                    </div>
                  </div>
                  <small v-if="formErrors.notifyVia" class="p-error">{{ formErrors.notifyVia }}</small>
                </div>
                
                <div class="field mb-4">
                  <div class="flex align-items-center">
                    <Checkbox id="enabled" v-model="alertForm.enabled" :binary="true" />
                    <label for="enabled" class="ml-2">Enable this alert immediately</label>
                  </div>
                </div>
                
                <div class="flex justify-end gap-2 mt-4">
                  <Button label="Reset" icon="pi pi-refresh" text @click="resetForm" />
                  <Button label="Save Alert" icon="pi pi-save" @click="saveAlert" />
                </div>
              </div>
            </template>
          </Card>
          
          <!-- Configured Alerts List -->
          <Card class="lg:col-span-2">
            <template #title>
              <div class="flex justify-between items-center">
                <span>Configured Alerts</span>
                <span class="p-input-icon-left">
                  <i class="pi pi-search" />
                  <InputText placeholder="Search alerts" />
                </span>
              </div>
            </template>
            <template #content>
              <DataTable :value="configuredAlerts" stripedRows responsiveLayout="scroll">
                <Column header="Status" style="width: 10%">
                  <template #body="{ data }">
                    <Tag :severity="data.enabled ? 'success' : 'danger'" :value="data.status" />
                  </template>
                </Column>
                <Column field="name" header="Alert Name" style="width: 20%">
                  <template #body="{ data }">
                    <div class="font-medium">{{ data.name }}</div>
                    <div class="text-xs text-gray-500">{{ data.type.name }}</div>
                  </template>
                </Column>
                <Column field="metric" header="Metric & Condition" style="width: 25%">
                  <template #body="{ data }">
                    {{ data.metric.name }} {{ data.condition.name }} {{ data.threshold }}
                    <div v-if="data.duration > 0" class="text-xs text-gray-500">
                      For more than {{ data.duration }} days
                    </div>
                  </template>
                </Column>
                <Column field="notifyVia" header="Notifications" style="width: 20%">
                  <template #body="{ data }">
                    <div class="flex flex-wrap gap-1">
                      <Tag v-for="method in data.notifyVia" :key="method.code" 
                           severity="info" :value="method.name" />
                    </div>
                  </template>
                </Column>
                <Column field="createdAt" header="Created" style="width: 15%">
                  <template #body="{ data }">
                    {{ formatDate(data.createdAt) }}
                  </template>
                </Column>
                <Column header="Actions" style="width: 10%">
                  <template #body="{ data }">
                    <div class="flex gap-1">
                      <Button :icon="data.enabled ? 'pi pi-pause' : 'pi pi-play'" 
                              :tooltip="data.enabled ? 'Disable Alert' : 'Enable Alert'"
                              :severity="data.enabled ? 'secondary' : 'success'"
                              text rounded @click="toggleAlertStatus(data)" />
                      <Button icon="pi pi-trash" tooltip="Delete Alert" 
                              severity="danger" text rounded @click="promptDeleteAlert(data)" />
                    </div>
                  </template>
                </Column>
              </DataTable>
            </template>
          </Card>
        </div>
      </TabPanel>
      
      <!-- Alert History Tab -->
      <TabPanel header="Alert History">
        <Card>
          <template #title>
            <div class="flex justify-between items-center">
              <span>Alert History Log</span>
              <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText placeholder="Search history" />
              </span>
            </div>
          </template>
          <template #content>
            <DataTable :value="alertHistory" stripedRows responsiveLayout="scroll" 
                      paginator :rows="10" sortField="timestamp" :sortOrder="-1">
              <Column field="status" header="Status" style="width: 10%">
                <template #body="{ data }">
                  <Tag :severity="data.status === 'Triggered' ? 'danger' :
                                data.status === 'Acknowledged' ? 'warning' : 'success'" 
                      :value="data.status" />
                </template>
              </Column>
              <Column field="severity" header="Severity" style="width: 10%">
                <template #body="{ data }">
                  <Tag :severity="data.severity === 'Critical' ? 'danger' : 
                                data.severity === 'High' ? 'warning' :
                                data.severity === 'Medium' ? 'info' : 'success'" 
                      :value="data.severity" />
                </template>
              </Column>
              <Column field="alertName" header="Alert" style="width: 20%">
                <template #body="{ data }">
                  <div class="font-medium">{{ data.alertName }}</div>
                  <div class="text-xs text-gray-500">{{ data.type }}</div>
                </template>
              </Column>
              <Column field="metric" header="Metric" style="width: 15%"></Column>
              <Column field="threshold" header="Threshold/Value" style="width: 15%">
                <template #body="{ data }">
                  <div>{{ data.condition }} {{ data.threshold }}</div>
                  <div class="text-sm font-medium" :class="data.condition === 'Below' ? 
                    (data.value < data.threshold ? 'text-red-500' : 'text-green-500') :
                    (data.value > data.threshold ? 'text-red-500' : 'text-green-500')">
                    Current: {{ data.value }}
                  </div>
                </template>
              </Column>
              <Column field="timestamp" header="Time" sortable style="width: 15%">
                <template #body="{ data }">
                  {{ formatDate(data.timestamp) }}
                </template>
              </Column>
              <Column header="Actions" style="width: 10%">
                <template #body="{ data }">
                  <div class="flex gap-2">
                    <Button icon="pi pi-eye" text rounded tooltip="View Details" @click="viewAlertDetails(data)" />
                    <Button v-if="data.status === 'Triggered'" icon="pi pi-check" text rounded tooltip="Acknowledge" @click="acknowledgeAlert(data)" severity="info" />
                    <Button v-if="data.status !== 'Resolved'" icon="pi pi-check-square" text rounded tooltip="Resolve" @click="resolveAlert(data)" severity="success" />
                  </div>
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>
      </TabPanel>
    </TabView>
    
    <!-- Alert Details Dialog -->
    <Dialog v-model:visible="showAlertDetails" header="Alert Details" :style="{width: '50vw'}" modal>
      <div v-if="selectedAlert" class="p-4">
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="col-span-2 sm:col-span-1">
            <div class="text-sm text-gray-500">Alert Name</div>
            <div class="text-lg font-medium">{{ selectedAlert.alertName }}</div>
          </div>
          <div class="col-span-2 sm:col-span-1">
            <div class="text-sm text-gray-500">Status</div>
            <Tag :severity="selectedAlert.status === 'Triggered' ? 'danger' :
                            selectedAlert.status === 'Acknowledged' ? 'warning' : 'success'" 
                :value="selectedAlert.status" />
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div class="text-sm text-gray-500">Alert Type</div>
            <div>{{ selectedAlert.type }}</div>
          </div>
          <div>
            <div class="text-sm text-gray-500">Severity</div>
            <Tag :severity="selectedAlert.severity === 'Critical' ? 'danger' : 
                            selectedAlert.severity === 'High' ? 'warning' :
                            selectedAlert.severity === 'Medium' ? 'info' : 'success'" 
                :value="selectedAlert.severity" />
          </div>
        </div>
        
        <div class="grid grid-cols-3 gap-4 mb-4">
          <div>
            <div class="text-sm text-gray-500">Metric</div>
            <div>{{ selectedAlert.metric }}</div>
          </div>
          <div>
            <div class="text-sm text-gray-500">Condition</div>
            <div>{{ selectedAlert.condition }}</div>
          </div>
          <div>
            <div class="text-sm text-gray-500">Threshold</div>
            <div>{{ selectedAlert.threshold }}</div>
          </div>
        </div>
        
        <div class="mb-4">
          <div class="text-sm text-gray-500">Current Value</div>
          <div class="text-lg font-medium" 
              :class="selectedAlert.condition === 'Below' ? 
                (selectedAlert.value < selectedAlert.threshold ? 'text-red-500' : 'text-green-500') :
                (selectedAlert.value > selectedAlert.threshold ? 'text-red-500' : 'text-green-500')">
            {{ selectedAlert.value }}
          </div>
        </div>
        
        <div class="mb-4">
          <div class="text-sm text-gray-500">Triggered At</div>
          <div>{{ formatDate(selectedAlert.timestamp) }}</div>
        </div>
        
        <Divider />
        
        <div class="flex justify-end gap-2">
          <Button label="Close" icon="pi pi-times" text @click="showAlertDetails = false" />
          <Button v-if="selectedAlert.status === 'Triggered'" label="Acknowledge" icon="pi pi-check" 
                 severity="info" @click="() => { acknowledgeAlert(selectedAlert); showAlertDetails = false; }" />
          <Button v-if="selectedAlert.status !== 'Resolved'" label="Resolve" icon="pi pi-check-square" 
                 severity="success" @click="() => { resolveAlert(selectedAlert); showAlertDetails = false; }" />
        </div>
      </div>
    </Dialog>
    
    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:visible="confirmDeleteAlert" header="Confirm Deletion" :style="{width: '450px'}" :modal="true">
      <div class="flex align-items-center justify-content-center">
        <i class="pi pi-exclamation-triangle mr-3 text-2xl text-yellow-500" />
        <span v-if="alertToDelete">Are you sure you want to delete the alert "{{ alertToDelete.name }}"?</span>
      </div>
      <template #footer>
        <Button label="No" icon="pi pi-times" text @click="confirmDeleteAlert = false" />
        <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteAlert" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
:deep(.p-card .p-card-title) {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

:deep(.p-card .p-card-content) {
  padding: 0;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background-color: #f9fafb;
  color: #374151;
  font-weight: 600;
  padding: 0.75rem;
  border-width: 0 0 1px 0;
}

:deep(.dark .p-datatable .p-datatable-thead > tr > th) {
  background-color: #1f2937;
  color: #e5e7eb;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.75rem;
  border-width: 0 0 1px 0;
}

:deep(.p-datatable .p-datatable-tbody > tr:nth-child(even)) {
  background-color: #f9fafb;
}

:deep(.dark .p-datatable .p-datatable-tbody > tr:nth-child(even)) {
  background-color: #1f2937;
}

:deep(.dark .p-datatable .p-datatable-tbody > tr) {
  background-color: #111827;
  color: #e5e7eb;
}

/* Custom styles for alert card borders */
.border-left-4 {
  border-left-width: 4px;
}
</style> 