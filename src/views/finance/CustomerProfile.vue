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
import Divider from 'primevue/divider';
import Menu from 'primevue/menu';
import { FilterMatchMode } from '@primevue/core/api';

const route = useRoute();
const router = useRouter();
const actionMenu = ref();
const customerId = computed(() => route.params.id);

// Mock customer data
const customer = ref({
  id: 'ACME001',
  name: 'Acme Corporation',
  contactName: 'John Smith',
  contactEmail: 'john.smith@acmecorp.com',
  contactPhone: '(555) 123-4567',
  address: '123 Business Ave, Suite 100, San Francisco, CA 94107',
  industry: 'Technology',
  since: '2018-05-12',
  logo: '/demo/images/avatar/amyelsner.png', // Placeholder
  creditStatus: 'Good',
  creditLimit: 150000,
  paymentTerms: 'Net 30',
  website: 'https://acmecorp.example.com',
  
  // Financial summary
  accountSummary: {
    totalBalance: 78500,
    overdueAmount: 12300,
    availableCredit: 71500,
    averageDaysToPay: 32,
    creditUtilization: 52, // percentage
    creditRating: 'A',
    agingBuckets: [
      { label: 'Current', value: 52000 },
      { label: '1-30 Days', value: 14200 },
      { label: '31-60 Days', value: 8500 },
      { label: '61-90 Days', value: 3800 },
      { label: '90+ Days', value: 0 }
    ],
    paymentTrend: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Days to Pay',
          data: [35, 33, 34, 32, 30, 32],
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
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
  { id: 'INV-2023-1001', type: 'Invoice', date: '2023-06-15', dueDate: '2023-07-15', amount: 24800, balance: 0, status: 'Paid', reference: 'PO-ACME-552' },
  { id: 'PMT-2023-542', type: 'Payment', date: '2023-07-10', dueDate: null, amount: -24800, balance: 0, status: 'Completed', reference: 'Wire Transfer' },
  { id: 'INV-2023-1087', type: 'Invoice', date: '2023-07-20', dueDate: '2023-08-19', amount: 18700, balance: 0, status: 'Paid', reference: 'PO-ACME-561' },
  { id: 'PMT-2023-601', type: 'Payment', date: '2023-08-15', dueDate: null, amount: -18700, balance: 0, status: 'Completed', reference: 'Check #4582' },
  { id: 'INV-2023-1142', type: 'Invoice', date: '2023-08-25', dueDate: '2023-09-24', amount: 12300, balance: 12300, status: 'Overdue', reference: 'PO-ACME-578' },
  { id: 'INV-2023-1203', type: 'Invoice', date: '2023-09-10', dueDate: '2023-10-10', amount: 14200, balance: 14200, status: 'Open', reference: 'PO-ACME-592' },
  { id: 'INV-2023-1245', type: 'Invoice', date: '2023-10-05', dueDate: '2023-11-04', amount: 52000, balance: 52000, status: 'Open', reference: 'PO-ACME-603' },
  { id: 'CRD-2023-078', type: 'Credit Note', date: '2023-09-12', dueDate: null, amount: -3500, balance: 0, status: 'Applied', reference: 'Return - INV-2023-1142' }
]);

// Open invoices only (for dedicated invoice list)
const openInvoices = computed(() => {
  return transactions.value.filter(t => 
    t.type === 'Invoice' && ['Open', 'Overdue'].includes(t.status)
  );
});

// Chart options
const barChartOptions = {
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          return `$${context.raw.toLocaleString()}`;
        }
      }
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
    case 'Overdue':
      return 'danger';
    case 'Partial':
      return 'warning';
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
  // In a real app, navigate to the invoice detail page
  console.log('View invoice:', invoice);
  // Example navigation (would go to a specific invoice):
  // router.push(`/finance/invoices/${invoice.id}`);
};

const sendReminder = () => {
  // In a real app, would trigger email reminder flow
  console.log('Send payment reminder');
};

// Actions menu
const menuItems = ref([
  {
    label: 'Add Transaction',
    icon: 'pi pi-plus',
    items: [
      { label: 'New Invoice', icon: 'pi pi-file' },
      { label: 'Record Payment', icon: 'pi pi-money-bill' },
      { label: 'Credit Note', icon: 'pi pi-reply' }
    ]
  },
  { separator: true },
  { label: 'Download Statement', icon: 'pi pi-download' },
  { label: 'Email Customer', icon: 'pi pi-envelope' },
  { label: 'Print Summary', icon: 'pi pi-print' },
  { separator: true },
  { label: 'Edit Customer', icon: 'pi pi-pencil' }
]);

const toggleMenu = (event) => {
  actionMenu.value.toggle(event);
};

// Prepare data for aging chart
const agingData = computed(() => {
  return {
    labels: customer.value.accountSummary.agingBuckets.map(b => b.label),
    datasets: [{
      data: customer.value.accountSummary.agingBuckets.map(b => b.value),
      backgroundColor: ['#22c55e', '#3b82f6', '#facc15', '#f97316', '#ef4444'],
    }]
  };
});
</script>

<template>
  <div class="p-4">
    <!-- Page Header -->
    <div class="flex justify-content-between align-items-center mb-5">
      <div>
        <div class="flex align-items-center">
          <Avatar :image="customer.logo" size="large" shape="circle" class="mr-3" />
          <div>
            <h1 class="text-3xl font-bold m-0">{{ customer.name }}</h1>
            <p class="text-gray-600 mt-1 mb-0">Customer ID: {{ customer.id }}</p>
          </div>
        </div>
      </div>
      <div class="flex gap-2">
        <Button icon="pi pi-bell" label="Send Reminder" severity="warning" outlined @click="sendReminder" />
        <Button icon="pi pi-ellipsis-v" text rounded @click="toggleMenu" />
        <Menu ref="actionMenu" :model="menuItems" :popup="true" />
      </div>
    </div>

    <!-- Summary Cards Row -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4 mb-5">
      <!-- Customer Information Card -->
      <div class="md:col-span-4">
        <Card>
          <template #title>
            <div class="flex justify-content-between align-items-center">
              <span>Customer Information</span>
              <Button icon="pi pi-pencil" text rounded />
            </div>
          </template>
          <template #content>
            <div class="flex flex-column gap-3">
              <div class="flex flex-column gap-1">
                <label class="text-xs text-gray-500">Contact</label>
                <div class="font-medium">{{ customer.contactName }}</div>
              </div>
              <div class="flex flex-column gap-1">
                <label class="text-xs text-gray-500">Contact Information</label>
                <div class="flex gap-2">
                  <i class="pi pi-envelope text-gray-500"></i>
                  <span>{{ customer.contactEmail }}</span>
                </div>
                <div class="flex gap-2">
                  <i class="pi pi-phone text-gray-500"></i>
                  <span>{{ customer.contactPhone }}</span>
                </div>
              </div>
              <div class="flex flex-column gap-1">
                <label class="text-xs text-gray-500">Address</label>
                <div>{{ customer.address }}</div>
              </div>
              <div class="flex flex-column gap-1">
                <label class="text-xs text-gray-500">Additional Information</label>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <span class="text-xs text-gray-500 block">Industry</span>
                    <span>{{ customer.industry }}</span>
                  </div>
                  <div>
                    <span class="text-xs text-gray-500 block">Customer Since</span>
                    <span>{{ formatDate(customer.since) }}</span>
                  </div>
                </div>
              </div>
              <div class="flex flex-column gap-1">
                <label class="text-xs text-gray-500">Website</label>
                <a :href="customer.website" target="_blank" class="flex gap-2 text-blue-500 hover:text-blue-700">
                  <i class="pi pi-external-link"></i>
                  <span>{{ customer.website.replace('https://', '') }}</span>
                </a>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Account Summary Card -->
      <div class="md:col-span-8">
        <Card>
          <template #title>
            <div class="flex justify-content-between align-items-center">
              <span>Account Summary</span>
              <Button icon="pi pi-download" text rounded />
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-12 gap-4">
              <!-- Financial KPIs -->
              <div class="col-span-6">
                <div class="flex flex-column gap-4">
                  <!-- Total Balance -->
                  <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    <div class="text-sm text-gray-600 dark:text-gray-400">Total Balance</div>
                    <div class="text-2xl font-bold mt-1">{{ formatCurrency(customer.accountSummary.totalBalance) }}</div>
                    <div class="flex mt-2 text-sm">
                      <span class="text-orange-500 mr-2">{{ formatCurrency(customer.accountSummary.overdueAmount) }}</span>
                      <span class="text-gray-500">overdue</span>
                    </div>
                  </div>
                  
                  <!-- Credit Info -->
                  <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    <div class="text-sm text-gray-600 dark:text-gray-400">Credit Status</div>
                    <div class="flex align-items-center justify-content-between mt-1">
                      <span class="font-medium">{{ customer.creditStatus }}</span>
                      <Tag :value="customer.accountSummary.creditRating" 
                           severity="success" 
                           class="text-sm ml-2">
                      </Tag>
                    </div>
                    <div class="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <div class="text-xs text-gray-500">Credit Limit</div>
                        <div class="font-medium">{{ formatCurrency(customer.creditLimit) }}</div>
                      </div>
                      <div>
                        <div class="text-xs text-gray-500">Available Credit</div>
                        <div class="font-medium">{{ formatCurrency(customer.accountSummary.availableCredit) }}</div>
                      </div>
                      <div>
                        <div class="text-xs text-gray-500">Payment Terms</div>
                        <div class="font-medium">{{ customer.paymentTerms }}</div>
                      </div>
                      <div>
                        <div class="text-xs text-gray-500">Avg. Days to Pay</div>
                        <div class="font-medium">{{ customer.accountSummary.averageDaysToPay }} days</div>
                      </div>
                    </div>
                    
                    <!-- Credit Utilization Progress Bar -->
                    <div class="mt-3">
                      <div class="flex justify-content-between align-items-center mb-1">
                        <span class="text-xs text-gray-500">Credit Utilization</span>
                        <span class="text-xs font-medium">{{ customer.accountSummary.creditUtilization }}%</span>
                      </div>
                      <div class="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          class="h-full bg-blue-500 rounded-full" 
                          :style="`width: ${customer.accountSummary.creditUtilization}%`"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- AR Aging Chart -->
              <div class="col-span-6">
                <div class="mb-3 flex justify-content-between align-items-center">
                  <span class="text-sm font-medium">AR Aging</span>
                </div>
                <div class="h-60">
                  <Chart type="bar" :data="agingData" :options="barChartOptions" />
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
    
    <!-- Transaction History and Open Invoices -->
    <TabView>
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
          <Column field="dueDate" header="Due Date" sortable>
            <template #body="{ data }">
              {{ formatDate(data.dueDate) }}
            </template>
          </Column>
          <Column field="amount" header="Amount" sortable>
            <template #body="{ data }">
              <span :class="getAmountClass(data.amount)">
                {{ formatCurrency(data.amount) }}
              </span>
            </template>
          </Column>
          <Column field="balance" header="Balance" sortable>
            <template #body="{ data }">
              {{ formatCurrency(data.balance) }}
            </template>
          </Column>
          <Column field="status" header="Status" sortable>
            <template #body="{ data }">
              <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
            </template>
          </Column>
          <Column field="reference" header="Reference" sortable />
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
              {{ formatDate(data.dueDate) }}
            </template>
          </Column>
          <Column field="amount" header="Amount" sortable>
            <template #body="{ data }">
              {{ formatCurrency(data.amount) }}
            </template>
          </Column>
          <Column field="status" header="Status" sortable>
            <template #body="{ data }">
              <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
            </template>
          </Column>
          <Column field="reference" header="Reference" sortable />
          <Column headerStyle="width: 8rem">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button icon="pi pi-eye" text rounded @click="viewInvoice(data)" />
                <Button icon="pi pi-bell" text rounded severity="warning" />
              </div>
            </template>
          </Column>
        </DataTable>
      </TabPanel>
      
      <!-- Payment Trends Tab -->
      <TabPanel header="Payment Trends">
        <div class="grid grid-cols-1">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium">Days to Pay Trend</h3>
              <div class="text-sm font-medium">Average: {{ customer.accountSummary.averageDaysToPay }} days</div>
            </div>
            
            <div class="h-72">
              <Chart type="line" :data="customer.accountSummary.paymentTrend" :options="{
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Days to Pay'
                    }
                  }
                },
                elements: {
                  point: {
                    radius: 4
                  }
                },
                responsive: true,
                maintainAspectRatio: false
              }" />
            </div>
          </div>
        </div>
      </TabPanel>
    </TabView>
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