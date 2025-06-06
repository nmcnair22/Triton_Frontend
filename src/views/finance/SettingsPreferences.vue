<script setup>
import { ref, reactive, computed } from 'vue';
import Card from 'primevue/card';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Checkbox from 'primevue/checkbox';
import RadioButton from 'primevue/radiobutton';
import ToggleButton from 'primevue/togglebutton';
import Dialog from 'primevue/dialog';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import Tag from 'primevue/tag';
import MultiSelect from 'primevue/multiselect';
import Toolbar from 'primevue/toolbar';
import Accordion from 'primevue/accordion';
import AccordionTab from 'primevue/accordiontab';
import Panel from 'primevue/panel';
import Divider from 'primevue/divider';
import Fieldset from 'primevue/fieldset';
import Message from 'primevue/message';
import ConfirmDialog from 'primevue/confirmdialog';
import { useConfirm } from 'primevue/useconfirm';

// Toast and Confirm services
const toast = useToast();
const confirm = useConfirm();

// Active tab reference
const activeTab = ref(0);

// ===============================
// Notification Settings section
// ===============================
const notificationSettings = reactive({
  emailNotifications: true,
  smsNotifications: false,
  appNotifications: true,
  slackNotifications: false,
  emailAddress: 'user@example.com',
  phoneNumber: '',
  slackWorkspace: '',
  frequency: { name: 'Immediately', code: 'immediate' },
  digestTime: { name: '9:00 AM', code: '9:00' },
  digestDays: ['MON', 'WED', 'FRI'],
  notificationTypes: [
    { type: 'Financial Alerts', enabled: true },
    { type: 'Operational Alerts', enabled: true },
    { type: 'Security Alerts', enabled: true },
    { type: 'Compliance Alerts', enabled: true },
    { type: 'System Notifications', enabled: true },
    { type: 'Report Generation', enabled: false }
  ]
});

// Notification frequency options
const frequencyOptions = ref([
  { name: 'Immediately', code: 'immediate' },
  { name: 'Hourly Digest', code: 'hourly' },
  { name: 'Daily Digest', code: 'daily' },
  { name: 'Weekly Digest', code: 'weekly' }
]);

// Digest time options
const digestTimeOptions = ref([
  { name: '7:00 AM', code: '7:00' },
  { name: '8:00 AM', code: '8:00' },
  { name: '9:00 AM', code: '9:00' },
  { name: '12:00 PM', code: '12:00' },
  { name: '5:00 PM', code: '17:00' }
]);

// Weekday options for weekly digest
const weekdayOptions = ref([
  { name: 'Monday', code: 'MON' },
  { name: 'Tuesday', code: 'TUE' },
  { name: 'Wednesday', code: 'WED' },
  { name: 'Thursday', code: 'THU' },
  { name: 'Friday', code: 'FRI' },
  { name: 'Saturday', code: 'SAT' },
  { name: 'Sunday', code: 'SUN' }
]);

// Save notification settings
const saveNotificationSettings = () => {
  // In a real app, this would send the data to an API
  toast.add({
    severity: 'success',
    summary: 'Settings Saved',
    detail: 'Notification preferences updated successfully',
    life: 3000
  });
};

// ===============================
// Threshold Management section
// ===============================
const thresholdCategories = ref([
  { name: 'Financial', code: 'FIN' },
  { name: 'Operational', code: 'OPS' },
  { name: 'Security', code: 'SEC' },
  { name: 'Compliance', code: 'COM' }
]);

const selectedCategory = ref(thresholdCategories.value[0]);

// Threshold configurations
const thresholdSettings = ref({
  FIN: [
    { id: 1, name: 'Low Cash Balance', description: 'Minimum available cash balance', value: 50000, unit: 'USD', severity: 'High' },
    { id: 2, name: 'AR Aging Limit', description: 'Days before AR is flagged as overdue', value: 30, unit: 'Days', severity: 'Medium' },
    { id: 3, name: 'Revenue Deviation', description: 'Percentage drop in revenue from forecast', value: 10, unit: '%', severity: 'High' },
    { id: 4, name: 'Expense Limit', description: 'Maximum expense increase', value: 15, unit: '%', severity: 'Medium' },
    { id: 5, name: 'Gross Margin Minimum', description: 'Minimum acceptable gross margin', value: 25, unit: '%', severity: 'High' }
  ],
  OPS: [
    { id: 6, name: 'Inventory Level', description: 'Minimum inventory level', value: 20, unit: '%', severity: 'High' },
    { id: 7, name: 'Order Processing Time', description: 'Maximum time to process orders', value: 24, unit: 'Hours', severity: 'Medium' },
    { id: 8, name: 'Fulfillment Rate', description: 'Minimum order fulfillment rate', value: 95, unit: '%', severity: 'High' },
    { id: 9, name: 'Return Rate', description: 'Maximum acceptable return rate', value: 5, unit: '%', severity: 'Medium' }
  ],
  SEC: [
    { id: 10, name: 'Failed Login Attempts', description: 'Number of failed login attempts before lockout', value: 5, unit: 'Attempts', severity: 'Critical' },
    { id: 11, name: 'Password Age', description: 'Maximum password age', value: 90, unit: 'Days', severity: 'Medium' },
    { id: 12, name: 'Admin Access', description: 'Admin actions requiring review', value: 1, unit: 'Actions', severity: 'High' }
  ],
  COM: [
    { id: 13, name: 'Report Deadline', description: 'Days before compliance report deadline', value: 7, unit: 'Days', severity: 'High' },
    { id: 14, name: 'Document Expiry', description: 'Days before document expiration', value: 30, unit: 'Days', severity: 'Medium' },
    { id: 15, name: 'Audit Preparation', description: 'Days needed for audit preparation', value: 14, unit: 'Days', severity: 'Medium' }
  ]
});

// Computed property to get thresholds for the selected category
const selectedCategoryThresholds = computed(() => {
  return thresholdSettings.value[selectedCategory.value.code] || [];
});

// Selected threshold for editing
const selectedThreshold = ref(null);
const thresholdDialog = ref(false);

// Edit a threshold
const editThreshold = (threshold) => {
  selectedThreshold.value = { ...threshold };
  thresholdDialog.value = true;
};

// Save threshold changes
const saveThreshold = () => {
  if (!selectedThreshold.value) return;
  
  const category = selectedCategory.value.code;
  const index = thresholdSettings.value[category].findIndex(t => t.id === selectedThreshold.value.id);
  
  if (index !== -1) {
    thresholdSettings.value[category][index] = { ...selectedThreshold.value };
    
    toast.add({
      severity: 'success',
      summary: 'Threshold Updated',
      detail: `${selectedThreshold.value.name} threshold has been updated`,
      life: 3000
    });
    
    thresholdDialog.value = false;
  }
};

// Get severity tag color
const getSeverityTag = (severity) => {
  switch (severity.toLowerCase()) {
    case 'critical': return 'danger';
    case 'high': return 'warning';
    case 'medium': return 'info';
    case 'low': return 'success';
    default: return 'secondary';
  }
};

// Severity options
const severityOptions = ref([
  { name: 'Critical', code: 'Critical' },
  { name: 'High', code: 'High' },
  { name: 'Medium', code: 'Medium' },
  { name: 'Low', code: 'Low' }
]);

// ===============================
// User Access and Permissions section
// ===============================
const users = ref([
  { 
    id: 1, 
    name: 'John Smith', 
    email: 'john.smith@example.com', 
    role: 'Administrator',
    department: 'Finance',
    status: 'Active',
    lastLogin: '2023-11-20T08:45:22Z',
    permissions: {
      financialDashboard: { view: true, edit: true, admin: true },
      accountsReceivable: { view: true, edit: true, admin: true },
      accountsPayable: { view: true, edit: true, admin: true },
      financialAnalysis: { view: true, edit: true, admin: true },
      productPerformance: { view: true, edit: true, admin: true },
      alertsManagement: { view: true, edit: true, admin: true },
      settingsPreferences: { view: true, edit: true, admin: true }
    }
  },
  { 
    id: 2, 
    name: 'Jane Doe', 
    email: 'jane.doe@example.com', 
    role: 'Finance Manager',
    department: 'Finance',
    status: 'Active',
    lastLogin: '2023-11-21T09:12:18Z',
    permissions: {
      financialDashboard: { view: true, edit: true, admin: false },
      accountsReceivable: { view: true, edit: true, admin: false },
      accountsPayable: { view: true, edit: true, admin: false },
      financialAnalysis: { view: true, edit: true, admin: false },
      productPerformance: { view: true, edit: true, admin: false },
      alertsManagement: { view: true, edit: false, admin: false },
      settingsPreferences: { view: true, edit: false, admin: false }
    }
  },
  { 
    id: 3, 
    name: 'Robert Johnson', 
    email: 'robert.johnson@example.com', 
    role: 'Accountant',
    department: 'Finance',
    status: 'Active',
    lastLogin: '2023-11-21T11:05:47Z',
    permissions: {
      financialDashboard: { view: true, edit: false, admin: false },
      accountsReceivable: { view: true, edit: true, admin: false },
      accountsPayable: { view: true, edit: true, admin: false },
      financialAnalysis: { view: true, edit: false, admin: false },
      productPerformance: { view: true, edit: false, admin: false },
      alertsManagement: { view: false, edit: false, admin: false },
      settingsPreferences: { view: false, edit: false, admin: false }
    }
  },
  { 
    id: 4, 
    name: 'Sarah Williams', 
    email: 'sarah.williams@example.com', 
    role: 'Sales Manager',
    department: 'Sales',
    status: 'Active',
    lastLogin: '2023-11-20T14:35:10Z',
    permissions: {
      financialDashboard: { view: true, edit: false, admin: false },
      accountsReceivable: { view: true, edit: false, admin: false },
      accountsPayable: { view: false, edit: false, admin: false },
      financialAnalysis: { view: true, edit: false, admin: false },
      productPerformance: { view: true, edit: false, admin: false },
      alertsManagement: { view: false, edit: false, admin: false },
      settingsPreferences: { view: false, edit: false, admin: false }
    }
  },
  { 
    id: 5, 
    name: 'Michael Brown', 
    email: 'michael.brown@example.com', 
    role: 'IT Administrator',
    department: 'IT',
    status: 'Active',
    lastLogin: '2023-11-21T08:22:33Z',
    permissions: {
      financialDashboard: { view: false, edit: false, admin: false },
      accountsReceivable: { view: false, edit: false, admin: false },
      accountsPayable: { view: false, edit: false, admin: false },
      financialAnalysis: { view: false, edit: false, admin: false },
      productPerformance: { view: false, edit: false, admin: false },
      alertsManagement: { view: true, edit: false, admin: false },
      settingsPreferences: { view: true, edit: false, admin: false }
    }
  }
]);

// Role definitions
const roles = ref([
  { 
    name: 'Administrator', 
    description: 'Full system access with all permissions'
  },
  { 
    name: 'Finance Manager', 
    description: 'Full access to financial modules, limited system settings'
  },
  { 
    name: 'Accountant', 
    description: 'View access to financial data with editing capabilities for AR/AP'
  },
  { 
    name: 'Sales Manager', 
    description: 'View-only access to financial data relevant to sales'
  },
  { 
    name: 'IT Administrator', 
    description: 'Access to system settings and security functions'
  }
]);

// Permission modules
const modules = ref([
  { id: 'financialDashboard', name: 'Finance Dashboard', description: 'Financial overview and KPIs' },
  { id: 'accountsReceivable', name: 'Accounts Receivable', description: 'Customer invoices and payments' },
  { id: 'accountsPayable', name: 'Accounts Payable', description: 'Vendor bills and payments' },
  { id: 'financialAnalysis', name: 'Financial Analysis', description: 'P&L and balance sheet analysis' },
  { id: 'productPerformance', name: 'Product Performance', description: 'Product revenue and margin analysis' },
  { id: 'alertsManagement', name: 'Alerts Management', description: 'Configure and manage alerts' },
  { id: 'settingsPreferences', name: 'Settings & Preferences', description: 'System configurations and user preferences' }
]);

// Selected user for editing
const selectedUser = ref(null);
const userDialog = ref(false);

// Permission levels
const permissionLevels = ref([
  { name: 'No Access', code: 'none' },
  { name: 'View Only', code: 'view' },
  { name: 'Edit', code: 'edit' },
  { name: 'Admin', code: 'admin' }
]);

// Edit user permissions
const editUser = (user) => {
  selectedUser.value = JSON.parse(JSON.stringify(user)); // Deep clone the user
  userDialog.value = true;
};

// Save user changes
const saveUser = () => {
  if (!selectedUser.value) return;
  
  const index = users.value.findIndex(u => u.id === selectedUser.value.id);
  
  if (index !== -1) {
    users.value[index] = { ...selectedUser.value };
    
    toast.add({
      severity: 'success',
      summary: 'User Updated',
      detail: `${selectedUser.value.name}'s permissions have been updated`,
      life: 3000
    });
    
    userDialog.value = false;
  }
};

// Convert permission object to display level
const getPermissionLevel = (permissions) => {
  if (permissions.admin) return 'Admin';
  if (permissions.edit) return 'Edit';
  if (permissions.view) return 'View';
  return 'None';
};

// Set permission level for a module
const setPermissionLevel = (module, level) => {
  if (!selectedUser.value) return;
  
  const permissions = selectedUser.value.permissions[module];
  
  // Reset all permissions
  permissions.view = false;
  permissions.edit = false;
  permissions.admin = false;
  
  // Set according to selected level
  switch(level) {
    case 'admin':
      permissions.admin = true;
      permissions.edit = true;
      permissions.view = true;
      break;
    case 'edit':
      permissions.edit = true;
      permissions.view = true;
      break;
    case 'view':
      permissions.view = true;
      break;
    default:
      // 'none' - leave all as false
      break;
  }
};

// Get selected permission level for a module
const getSelectedLevel = (module) => {
  if (!selectedUser.value) return 'none';
  
  const permissions = selectedUser.value.permissions[module];
  
  if (permissions.admin) return 'admin';
  if (permissions.edit) return 'edit';
  if (permissions.view) return 'view';
  return 'none';
};

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return 'Never';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Create new user dialog
const newUserDialog = ref(false);
const newUser = ref({
  name: '',
  email: '',
  role: null,
  department: '',
  status: 'Active',
  permissions: {}
});

// Department options
const departments = ref([
  'Finance',
  'Sales',
  'Marketing',
  'Operations',
  'IT',
  'Human Resources',
  'Legal'
]);

// Initialize the new user permissions
const initializeNewUser = () => {
  newUser.value = {
    name: '',
    email: '',
    role: null,
    department: '',
    status: 'Active',
    permissions: {}
  };
  
  // Initialize permissions for all modules
  modules.value.forEach(module => {
    newUser.value.permissions[module.id] = { view: false, edit: false, admin: false };
  });
  
  newUserDialog.value = true;
};

// Apply role template to new user
const applyRoleTemplate = () => {
  if (!newUser.value.role) return;
  
  // In a real app, this would fetch permissions based on the selected role
  // Here, we'll just simulate it with some predefined templates
  
  const role = newUser.value.role;
  
  modules.value.forEach(module => {
    const permissions = newUser.value.permissions[module.id];
    
    // Reset permissions
    permissions.view = false;
    permissions.edit = false;
    permissions.admin = false;
    
    // Apply role-based permissions
    if (role === 'Administrator') {
      permissions.view = true;
      permissions.edit = true;
      permissions.admin = true;
    } else if (role === 'Finance Manager') {
      permissions.view = true;
      permissions.edit = module.id !== 'settingsPreferences' && module.id !== 'alertsManagement';
      permissions.admin = false;
    } else if (role === 'Accountant') {
      permissions.view = module.id !== 'alertsManagement' && module.id !== 'settingsPreferences';
      permissions.edit = module.id === 'accountsReceivable' || module.id === 'accountsPayable';
      permissions.admin = false;
    } else if (role === 'Sales Manager') {
      permissions.view = ['financialDashboard', 'accountsReceivable', 'financialAnalysis', 'productPerformance'].includes(module.id);
      permissions.edit = false;
      permissions.admin = false;
    } else if (role === 'IT Administrator') {
      permissions.view = ['alertsManagement', 'settingsPreferences'].includes(module.id);
      permissions.edit = false;
      permissions.admin = false;
    }
  });
};

// Save new user
const saveNewUser = () => {
  if (!newUser.value.name || !newUser.value.email || !newUser.value.role) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Please fill out all required fields',
      life: 3000
    });
    return;
  }
  
  // In a real app, this would send the data to an API
  const newId = Math.max(...users.value.map(u => u.id)) + 1;
  
  users.value.push({
    id: newId,
    name: newUser.value.name,
    email: newUser.value.email,
    role: newUser.value.role,
    department: newUser.value.department,
    status: newUser.value.status,
    lastLogin: null,
    permissions: newUser.value.permissions
  });
  
  toast.add({
    severity: 'success',
    summary: 'User Created',
    detail: `${newUser.value.name} has been added successfully`,
    life: 3000
  });
  
  newUserDialog.value = false;
};

// Delete user confirmation
const confirmDeleteUser = (user) => {
  confirm.require({
    message: `Are you sure you want to remove ${user.name}?`,
    header: 'Confirm Deletion',
    icon: 'pi pi-exclamation-triangle',
    accept: () => {
      const index = users.value.findIndex(u => u.id === user.id);
      if (index !== -1) {
        users.value.splice(index, 1);
        
        toast.add({
          severity: 'success',
          summary: 'User Deleted',
          detail: `${user.name} has been removed successfully`,
          life: 3000
        });
      }
    }
  });
};
</script> 