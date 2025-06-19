<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from 'primevue/card';
import Button from 'primevue/button';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Avatar from 'primevue/avatar';
import Chart from 'primevue/chart';
import Menu from 'primevue/menu';
import Divider from 'primevue/divider';
import { FilterMatchMode } from '@primevue/core/api';

const route = useRoute();
const router = useRouter();
const actionMenu = ref();
const vendorId = computed(() => route.params.id);

// Mock vendor data
const vendor = ref({
  id: 'VENDOR001',
  name: 'ABC Supplies Inc.',
  contactName: 'Robert Johnson',
  contactEmail: 'robert.johnson@abcsupplies.com',
  contactPhone: '(555) 987-6543',
  address: '456 Industry Road, Suite 200, Chicago, IL 60601',
  taxId: '12-3456789',
  category: 'Office Supplies',
  since: '2019-03-25',
  logo: '/demo/images/avatar/amyelsner.png', // Placeholder
  status: 'Active',
  rating: 4.8,
  website: 'https://abcsupplies.example.com',
  
  // Payment information
  paymentTerms: {
    terms: 'Net 30',
    discount: '2/10 Net 30',
    preferredMethod: 'ACH Transfer',
    bankAccount: '**** **** **** 5678',
    currency: 'USD',
    creditLimit: 125000,
    availableCredit: 77500,
    currentBalance: 47500
  },
  
  // Transaction statistics
  statistics: {
    totalSpend: {
      ytd: 345000,
      previous: 412000,
      change: -16.3
    },
    avgPaymentTime: 28.5,
    discountsCaptured: {
      amount: 7820,
      rate: 87.5,
      potential: 8960
    },
    purchaseVolume: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Purchase Volume',
          data: [31500, 42300, 38700, 53200, 41800, 38500],
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }
      ]
    }
  }
});

// Transaction history
const transactions = ref([
  { id: 'INV-2345', type: 'Invoice', date: '2023-10-05', dueDate: '2023-11-04', amount: 47500, balance: 47500, status: 'Open', reference: 'PO-2023-456', description: 'Office Furniture Delivery' },
  { id: 'INV-2286', type: 'Invoice', date: '2023-09-12', dueDate: '2023-10-12', amount: 32300, balance: 0, status: 'Paid', reference: 'PO-2023-445', description: 'Office Supplies Q3' },
  { id: 'PMT-1098', type: 'Payment', date: '2023-10-10', dueDate: null, amount: -32300, balance: 0, status: 'Completed', reference: 'Wire Transfer', description: 'Payment for INV-2286' },
  { id: 'INV-2198', type: 'Invoice', date: '2023-08-15', dueDate: '2023-09-14', amount: 28700, balance: 0, status: 'Paid', reference: 'PO-2023-432', description: 'Printer Cartridges and Paper' },
  { id: 'PMT-1056', type: 'Payment', date: '2023-09-12', dueDate: null, amount: -28700, balance: 0, status: 'Completed', reference: 'ACH Transfer', description: 'Payment for INV-2198' },
  { id: 'INV-2132', type: 'Invoice', date: '2023-07-22', dueDate: '2023-08-21', amount: 36200, balance: 0, status: 'Paid', reference: 'PO-2023-418', description: 'Office Chairs (25 units)' },
  { id: 'CRD-085', type: 'Credit Note', date: '2023-07-28', dueDate: null, amount: -4500, balance: 0, status: 'Applied', reference: 'RMA-2023-012', description: 'Damaged chairs return (5 units)' },
  { id: 'PMT-1021', type: 'Payment', date: '2023-08-18', dueDate: null, amount: -31700, balance: 0, status: 'Completed', reference: 'Check #8765', description: 'Payment for INV-2132 after credit' }
]);

// Open invoices only
const openInvoices = computed(() => {
  return transactions.value.filter(t => 
    t.type === 'Invoice' && ['Open', 'Partial'].includes(t.status)
  );
});

// Format and display helpers
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(value);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

// Transaction status styling
const getStatusSeverity = (status) => {
  switch (status) {
    case 'Paid':
    case 'Completed':
    case 'Applied':
      return 'success';
    case 'Open':
      return 'info';
    case 'Partial':
      return 'warning';
    case 'Overdue':
      return 'danger';
    default:
      return 'secondary';
  }
};

// Return negative amounts in red
const getAmountClass = (amount) => {
  return amount < 0 ? 'text-pink-500' : '';
};

// Navigation
const viewInvoice = (invoice) => {
  console.log('View invoice:', invoice);
};

const payInvoice = (invoice) => {
  console.log('Pay invoice:', invoice);
};

// Actions menu
const menuItems = ref([
  {
    label: 'Record Transaction',
    icon: 'pi pi-plus',
    items: [
      { label: 'Enter Bill', icon: 'pi pi-file' },
      { label: 'Make Payment', icon: 'pi pi-money-bill' },
      { label: 'Issue Credit', icon: 'pi pi-reply' }
    ]
  },
  { separator: true },
  { label: 'Download Statement', icon: 'pi pi-download' },
  { label: 'Email Vendor', icon: 'pi pi-envelope' },
  { separator: true },
  { label: 'Edit Vendor', icon: 'pi pi-pencil' }
]);

const toggleMenu = (event) => {
  actionMenu.value.toggle(event);
};

// Chart options
const chartOptions = {
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          return '$' + (value/1000) + 'k';
        }
      }
    }
  },
  responsive: true,
  maintainAspectRatio: false
};

// Calculate days until due
const daysUntilDue = (dueDate) => {
  if (!dueDate) return '';
  
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `Overdue by ${Math.abs(diffDays)} days`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else {
    return `Due in ${diffDays} days`;
  }
};

// Get due date class based on days
const getDueDateClass = (dueDate) => {
  if (!dueDate) return '';
  
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'text-red-500 font-medium'; // Overdue
  if (diffDays <= 5) return 'text-orange-500'; // Due soon
  return 'text-green-600'; // Not due soon
};
</script>

<template>
  <div class="p-4">
    <!-- Page Header -->
    <div class="flex justify-content-between align-items-center mb-5">
      <div>
        <div class="flex align-items-center">
          <Avatar :image="vendor.logo" size="large" shape="circle" class="mr-3" />
          <div>
            <h1 class="text-3xl font-bold m-0">{{ vendor.name }}</h1>
            <p class="text-gray-600 mt-1 mb-0">Vendor ID: {{ vendor.id }}</p>
          </div>
        </div>
      </div>
      <div class="flex gap-2">
        <Button icon="pi pi-money-bill" label="Pay Vendor" outlined />
        <Button icon="pi pi-ellipsis-v" text rounded @click="toggleMenu" />
        <Menu ref="actionMenu" :model="menuItems" :popup="true" />
      </div>
    </div>

    <!-- Summary Cards Row -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4 mb-5">
      <!-- Vendor Information Card -->
      <div class="md:col-span-4">
        <Card>
          <template #title>
            <div class="flex justify-content-between align-items-center">
              <span>Vendor Information</span>
              <Button icon="pi pi-pencil" text rounded />
            </div>
          </template>
          <template #content>
            <div class="flex flex-column gap-3">
              <div class="flex flex-column gap-1">
                <label class="text-xs text-gray-500">Contact</label>
                <div class="font-medium">{{ vendor.contactName }}</div>
              </div>
              <div class="flex flex-column gap-1">
                <label class="text-xs text-gray-500">Contact Information</label>
                <div class="flex gap-2">
                  <i class="pi pi-envelope text-gray-500"></i>
                  <span>{{ vendor.contactEmail }}</span>
                </div>
                <div class="flex gap-2">
                  <i class="pi pi-phone text-gray-500"></i>
                  <span>{{ vendor.contactPhone }}</span>
                </div>
              </div>
              <div class="flex flex-column gap-1">
                <label class="text-xs text-gray-500">Address</label>
                <div>{{ vendor.address }}</div>
              </div>
              <div class="flex flex-column gap-1">
                <label class="text-xs text-gray-500">Additional Information</label>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <span class="text-xs text-gray-500 block">Tax ID</span>
                    <span>{{ vendor.taxId }}</span>
                  </div>
                  <div>
                    <span class="text-xs text-gray-500 block">Category</span>
                    <span>{{ vendor.category }}</span>
                  </div>
                  <div>
                    <span class="text-xs text-gray-500 block">Vendor Since</span>
                    <span>{{ formatDate(vendor.since) }}</span>
                  </div>
                  <div>
                    <span class="text-xs text-gray-500 block">Status</span>
                    <Tag :value="vendor.status" severity="success" />
                  </div>
                </div>
              </div>
              <div class="flex flex-column gap-1">
                <label class="text-xs text-gray-500">Website</label>
                <a :href="vendor.website" target="_blank" class="flex gap-2 text-blue-500 hover:text-blue-700">
                  <i class="pi pi-external-link"></i>
                  <span>{{ vendor.website.replace('https://', '') }}</span>
                </a>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Payment Info & Stats Card -->
      <div class="md:col-span-8">
        <Card>
          <template #title>
            <div class="flex justify-content-between align-items-center">
              <span>Payment Information</span>
              <Button icon="pi pi-download" text rounded />
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-12 gap-4">
              <!-- Payment Info -->
              <div class="col-span-6">
                <div class="flex flex-column gap-4">
                  <!-- Current Balance -->
                  <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    <div class="text-sm text-gray-600 dark:text-gray-400">Current Balance</div>
                    <div class="text-2xl font-bold mt-1">{{ formatCurrency(vendor.paymentTerms.currentBalance) }}</div>
                    <div class="flex justify-content-between align-items-center mt-2">
                      <span class="text-xs text-gray-500">Available Credit</span>
                      <span class="text-sm font-medium">{{ formatCurrency(vendor.paymentTerms.availableCredit) }}</span>
                    </div>
                    <div class="mt-2">
                      <div class="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          class="h-full bg-blue-500 rounded-full" 
                          :style="`width: ${(vendor.paymentTerms.currentBalance / vendor.paymentTerms.creditLimit) * 100}%`"
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Payment Terms -->
                  <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    <div class="text-sm text-gray-600 dark:text-gray-400">Payment Terms</div>
                    <div class="flex align-items-center gap-2 mt-1">
                      <span class="font-medium">{{ vendor.paymentTerms.terms }}</span>
                      <Tag value="Discount Available" severity="success" class="text-xs" v-if="vendor.paymentTerms.discount" />
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <div class="text-xs text-gray-500">Discount Terms</div>
                        <div class="font-medium">{{ vendor.paymentTerms.discount || 'None' }}</div>
                      </div>
                      <div>
                        <div class="text-xs text-gray-500">Payment Method</div>
                        <div class="font-medium">{{ vendor.paymentTerms.preferredMethod }}</div>
                      </div>
                      <div>
                        <div class="text-xs text-gray-500">Credit Limit</div>
                        <div class="font-medium">{{ formatCurrency(vendor.paymentTerms.creditLimit) }}</div>
                      </div>
                      <div>
                        <div class="text-xs text-gray-500">Currency</div>
                        <div class="font-medium">{{ vendor.paymentTerms.currency }}</div>
                      </div>
                    </div>
                    
                    <div class="mt-3 flex gap-2">
                      <div class="text-xs text-gray-500">Bank Account:</div>
                      <div class="text-xs">{{ vendor.paymentTerms.bankAccount }}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Purchase Volume Chart -->
              <div class="col-span-6">
                <div class="mb-3 flex justify-content-between align-items-center">
                  <span class="text-sm font-medium">Purchase Volume (YTD)</span>
                  <div class="text-xs">
                    <span class="font-medium">YTD: {{ formatCurrency(vendor.statistics.totalSpend.ytd) }}</span>
                    <span class="text-gray-500 ml-2">vs {{ formatCurrency(vendor.statistics.totalSpend.previous) }}</span>
                    <span :class="vendor.statistics.totalSpend.change > 0 ? 'text-green-500' : 'text-red-500'" class="ml-2">
                      ({{ vendor.statistics.totalSpend.change > 0 ? '+' : '' }}{{ vendor.statistics.totalSpend.change }}%)
                    </span>
                  </div>
                </div>
                <div class="h-52">
                  <Chart type="line" :data="vendor.statistics.purchaseVolume" :options="chartOptions" />
                </div>
                
                <!-- Additional KPIs -->
                <div class="flex justify-content-between mt-3">
                  <div class="text-center">
                    <div class="text-xs text-gray-500">Avg. Payment Time</div>
                    <div class="font-medium">{{ vendor.statistics.avgPaymentTime }} days</div>
                  </div>
                  <div class="text-center">
                    <div class="text-xs text-gray-500">Discount Capture Rate</div>
                    <div class="font-medium">{{ vendor.statistics.discountsCaptured.rate }}%</div>
                  </div>
                  <div class="text-center">
                    <div class="text-xs text-gray-500">Discount Savings</div>
                    <div class="font-medium">{{ formatCurrency(vendor.statistics.discountsCaptured.amount) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
    
    <!-- Transaction History and Open Invoices -->
    <TabView>
      <!-- Open Invoices Tab -->
      <TabPanel header="Open Invoices">
        <DataTable 
          :value="openInvoices" 
          :paginator="openInvoices.length > 5" 
          :rows="5"
          tableStyle="min-width: 50rem"
          stripedRows
          dataKey="id"
          sortField="dueDate"
          :sortOrder="1"
          class="p-datatable-sm"
        >
          <Column field="id" header="Invoice #" sortable>
            <template #body="{ data }">
              <div class="flex align-items-center gap-2">
                <i class="pi pi-file-invoice text-blue-500"></i>
                <a href="#" 
                   @click.prevent="viewInvoice(data)"
                   class="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {{ data.id }}
                </a>
              </div>
            </template>
          </Column>
          <Column field="date" header="Date" sortable>
            <template #body="{ data }">
              {{ formatDate(data.date) }}
            </template>
          </Column>
          <Column field="dueDate" header="Due Date" sortable>
            <template #body="{ data }">
              <div>
                <div>{{ formatDate(data.dueDate) }}</div>
                <div :class="getDueDateClass(data.dueDate)" class="text-xs">
                  {{ daysUntilDue(data.dueDate) }}
                </div>
              </div>
            </template>
          </Column>
          <Column field="amount" header="Amount" sortable>
            <template #body="{ data }">
              {{ formatCurrency(data.amount) }}
            </template>
          </Column>
          <Column field="reference" header="Reference" sortable>
            <template #body="{ data }">
              <span class="text-sm">{{ data.reference }}</span>
            </template>
          </Column>
          <Column field="status" header="Status" sortable>
            <template #body="{ data }">
              <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
            </template>
          </Column>
          <Column headerStyle="width: 8rem">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button icon="pi pi-eye" text rounded @click="viewInvoice(data)" />
                <Button icon="pi pi-check" text rounded severity="success" @click="payInvoice(data)" />
              </div>
            </template>
          </Column>
        </DataTable>
      </TabPanel>
      
      <!-- All Transactions Tab -->
      <TabPanel header="Transaction History">
        <DataTable 
          :value="transactions" 
          paginator 
          :rows="10" 
          :rowsPerPageOptions="[5, 10, 20, 50]"
          tableStyle="min-width: 50rem"
          stripedRows
          dataKey="id"
          sortField="date"
          :sortOrder="-1"
          class="p-datatable-sm"
        >
          <Column field="id" header="Transaction #" sortable>
            <template #body="{ data }">
              <div class="flex align-items-center gap-2">
                <i v-if="data.type === 'Invoice'" class="pi pi-file-invoice text-blue-500"></i>
                <i v-else-if="data.type === 'Payment'" class="pi pi-wallet text-green-500"></i>
                <i v-else-if="data.type === 'Credit Note'" class="pi pi-reply text-pink-500"></i>
                <a v-if="data.type === 'Invoice'" 
                   href="#" 
                   @click.prevent="viewInvoice(data)"
                   class="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {{ data.id }}
                </a>
                <span v-else>{{ data.id }}</span>
              </div>
            </template>
          </Column>
          <Column field="type" header="Type" sortable />
          <Column field="date" header="Date" sortable>
            <template #body="{ data }">
              {{ formatDate(data.date) }}
            </template>
          </Column>
          <Column field="amount" header="Amount" sortable>
            <template #body="{ data }">
              <span :class="getAmountClass(data.amount)">
                {{ formatCurrency(data.amount) }}
              </span>
            </template>
          </Column>
          <Column field="reference" header="Reference" sortable />
          <Column field="description" header="Description" sortable />
          <Column field="status" header="Status" sortable>
            <template #body="{ data }">
              <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
            </template>
          </Column>
          <Column headerStyle="width: 4rem">
            <template #body="{ data }">
              <Button 
                v-if="data.type === 'Invoice'" 
                icon="pi pi-eye" 
                text 
                rounded 
                @click="viewInvoice(data)" 
              />
            </template>
          </Column>
        </DataTable>
      </TabPanel>
      
      <!-- Payment History Chart Tab -->
      <TabPanel header="Payment Analysis">
        <div class="grid grid-cols-1 gap-4">
          <Card>
            <template #title>
              <span>Payment Performance</span>
            </template>
            <template #content>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <!-- Average Payment Time -->
                <div class="bg-white dark:bg-gray-800 border-round shadow-2 p-3">
                  <div class="text-gray-500 font-medium mb-2">Average Payment Time</div>
                  <div class="text-2xl font-bold">{{ vendor.statistics.avgPaymentTime }} days</div>
                  <div class="text-xs text-gray-500 mt-2">vs. terms of {{ vendor.paymentTerms.terms }}</div>
                </div>
                
                <!-- Discount Capture -->
                <div class="bg-white dark:bg-gray-800 border-round shadow-2 p-3">
                  <div class="text-gray-500 font-medium mb-2">Discount Capture Rate</div>
                  <div class="text-2xl font-bold">{{ vendor.statistics.discountsCaptured.rate }}%</div>
                  <div class="text-xs text-gray-500 mt-2">
                    {{ formatCurrency(vendor.statistics.discountsCaptured.amount) }} saved out of 
                    {{ formatCurrency(vendor.statistics.discountsCaptured.potential) }} potential
                  </div>
                </div>
                
                <!-- YTD Spend -->
                <div class="bg-white dark:bg-gray-800 border-round shadow-2 p-3">
                  <div class="text-gray-500 font-medium mb-2">YTD Spend vs Previous</div>
                  <div class="text-2xl font-bold" 
                       :class="vendor.statistics.totalSpend.change > 0 ? 'text-green-500' : 'text-red-500'">
                    {{ vendor.statistics.totalSpend.change }}%
                  </div>
                  <div class="text-xs text-gray-500 mt-2">
                    {{ formatCurrency(vendor.statistics.totalSpend.ytd) }} vs 
                    {{ formatCurrency(vendor.statistics.totalSpend.previous) }}
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </TabPanel>
    </TabView>
    
    <!-- Bottom Action Buttons -->
    <div class="flex justify-content-end gap-3 mt-4">
      <Button label="Schedule Payment" icon="pi pi-calendar" outlined />
      <Button label="Make Payment" icon="pi pi-check" />
    </div>
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

:deep(.p-tabview .p-tabview-nav) {
  border-width: 0 0 1px 0;
  border-color: var(--surface-border);
}

:deep(.p-tabview .p-tabview-nav li .p-tabview-nav-link) {
  padding: 1rem;
  font-weight: 500;
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

:deep(.p-datatable.p-datatable-sm .p-datatable-tbody > tr > td) {
  padding: 0.5rem 0.75rem;
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

:deep(.p-button.p-button-text) {
  color: #6b7280;
}

:deep(.dark .p-button.p-button-text) {
  color: #9ca3af;
}
</style> 