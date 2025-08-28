<template>
  <div class="tem-customer-detail">
    <!-- Loading State -->
    <div v-if="customerStore.isLoading" class="flex justify-center items-center h-64">
      <ProgressSpinner />
    </div>

    <!-- Customer Detail Content -->
    <div v-else-if="customerStore.currentCustomer" class="customer-detail-content">
      <!-- Page Header -->
      <div class="page-header mb-6">
        <div class="flex items-center gap-4 mb-4">
          <Button
            icon="pi pi-arrow-left"
            text
            rounded
            @click="$router.back()"
          />
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span class="text-lg font-bold text-blue-600">
                  {{ customer.abbreviation || customer.name.charAt(0) }}
                </span>
              </div>
              <div>
                <h1 class="text-3xl font-bold text-gray-900">{{ customer.name }}</h1>
                <div class="flex items-center gap-2 mt-1">
                  <Badge 
                    :value="customer.status" 
                    :severity="customer.status === 'active' ? 'success' : 'danger'" 
                  />
                  <span class="text-sm text-gray-500">{{ customer.abbreviation }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <Button
              icon="pi pi-download"
              label="Export"
              outlined
              @click="exportCustomerData"
            />
          </div>
        </div>

        <!-- Quick Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <template #content>
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600">{{ locationMetrics.totalLocations }}</div>
                <div class="text-sm text-gray-600">Total Locations</div>
              </div>
            </template>
          </Card>
          
          <Card>
            <template #content>
              <div class="text-center">
                <div class="text-2xl font-bold text-gray-600">{{ locationMetrics.totalAccounts }}</div>
                <div class="text-sm text-gray-600">Total Accounts</div>
              </div>
            </template>
          </Card>
          
          <Card>
            <template #content>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">{{ locationMetrics.activeAccounts }}</div>
                <div class="text-sm text-gray-600">Active Accounts</div>
              </div>
            </template>
          </Card>
          
          <Card>
            <template #content>
              <div class="text-center">
                <div class="text-2xl font-bold text-orange-600">{{ formatCurrency(locationMetrics.monthlyExpected) }}</div>
                <div class="text-sm text-gray-600">Monthly Expected</div>
              </div>
            </template>
          </Card>
          
          <Card>
            <template #content>
              <div class="text-center">
                <div class="text-2xl font-bold" :class="getFundingColorClass(customer.funding_status)">
                  {{ formatCurrency(customer.funding_balance || customer.funding?.amount_remaining) }}
                </div>
                <div class="text-sm text-gray-600">Funding Balance</div>
              </div>
            </template>
          </Card>
        </div>
      </div>

      <!-- Tab Content -->
      <Card>
        <template #content>
          <Tabs v-model:value="activeTabIndex" @tab-change="onTabChange">
            <TabList>
              <Tab value="0">Overview</Tab>
              <Tab value="1">Locations</Tab>
              <Tab value="2">Accounts</Tab>
              <Tab value="3">Bills</Tab>
              <Tab value="4">Funding</Tab>
            </TabList>
            
            <TabPanels>
              <!-- Overview Tab -->
              <TabPanel value="0">
                <div class="space-y-6">
                  
                  <!-- Key Metrics Cards -->
                  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card class="metric-card">
                      <template #content>
                        <div class="text-center p-4">
                          <div class="text-2xl font-bold text-blue-600">{{ locationMetrics.totalLocations }}+</div>
                          <div class="text-sm text-gray-600 mt-1">Total Active Locations</div>
                          <div class="text-xs text-gray-500 mt-2">
                            {{ locationBreakdown.active }}/{{ locationBreakdown.closed }}/{{ locationBreakdown.unverified }}
                            <br><span class="text-green-600">Active</span>/<span class="text-red-600">Closed</span>/<span class="text-yellow-600">Unverified</span>
                          </div>
                        </div>
                      </template>
                    </Card>

                    <Card class="metric-card">
                      <template #content>
                        <div class="text-center p-4">
                          <div class="text-2xl font-bold text-green-600">{{ formatCurrency(locationMetrics.monthlyExpected) }}</div>
                          <div class="text-sm text-gray-600 mt-1">Monthly Telecom Spend</div>
                          <div class="text-xs text-gray-500 mt-2">
                            {{ locationMetrics.activeAccounts }} active accounts
                          </div>
                        </div>
                      </template>
                    </Card>

                    <Card class="metric-card" v-if="customer.funding">
                      <template #content>
                        <div class="text-center p-4">
                          <div class="text-2xl font-bold text-orange-600">{{ fundingRunwayMonths }}mo</div>
                          <div class="text-sm text-gray-600 mt-1">Funding Runway</div>
                          <div class="text-xs text-gray-500 mt-2">
                            {{ formatCurrency(customer.funding.amount_remaining) }} remaining
                          </div>
                        </div>
                      </template>
                    </Card>

                    <Card class="metric-card">
                      <template #content>
                        <div class="text-center p-4">
                          <div class="text-2xl font-bold text-purple-600">{{ accountHealthScore }}%</div>
                          <div class="text-sm text-gray-600 mt-1">Account Health Score</div>
                          <div class="text-xs text-gray-500 mt-2">
                            {{ locationMetrics.activeAccounts }}/{{ locationMetrics.totalAccounts }} active
                          </div>
                        </div>
                      </template>
                    </Card>
                  </div>

                  <!-- Billing Analytics Row -->
                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    <!-- Enhanced Activity & Performance Summary -->
                    <Card>
                      <template #header>
                        <div class="p-4 border-b">
                          <h3 class="text-lg font-semibold">Recent Activity & Performance</h3>
                          <p class="text-sm text-gray-600 mt-1">Last 30 days activity summary</p>
                        </div>
                      </template>
                      <template #content>
                        <div class="p-4 space-y-4">
                          <!-- Activity metrics -->
                          <div class="grid grid-cols-2 gap-4">
                            <div class="text-center p-3 bg-green-50 rounded-lg">
                              <div class="text-xl font-bold text-green-600">{{ enhancedMetrics.locationsWithActivity }}</div>
                              <div class="text-sm text-green-600">Active Locations</div>
                              <div class="text-xs text-gray-500">of {{ enhancedMetrics.totalLocations }}</div>
                            </div>
                            <div class="text-center p-3 bg-blue-50 rounded-lg">
                              <div class="text-xl font-bold text-blue-600">{{ formatCurrency(enhancedMetrics.totalRecentSpend) }}</div>
                              <div class="text-sm text-blue-600">Recent Spend</div>
                              <div class="text-xs text-gray-500">Last 30 days</div>
                            </div>
                          </div>

                          <!-- Provider diversity -->
                          <div class="p-3 bg-purple-50 rounded-lg">
                            <div class="flex justify-between items-center">
                              <div>
                                <div class="text-lg font-bold text-purple-600">{{ enhancedMetrics.totalProviders }}</div>
                                <div class="text-sm text-purple-600">Active Providers</div>
                              </div>
                              <i class="pi pi-users text-purple-400 text-2xl"></i>
                            </div>
                          </div>

                          <!-- Attention needed alert -->
                          <div v-if="enhancedMetrics.locationsNeedingAttention > 0" class="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div class="flex items-center gap-2 mb-2">
                              <i class="pi pi-exclamation-triangle text-red-600"></i>
                              <span class="font-medium text-red-800">Locations Need Attention</span>
                            </div>
                            <div class="text-sm text-red-700 mb-2">
                              {{ enhancedMetrics.locationsNeedingAttention }} locations with overdue bills or inactive accounts
                            </div>
                            <div class="space-y-1">
                              <div v-for="location in attentionLocations.slice(0, 3)" :key="location.name" class="text-xs text-red-600">
                                {{ location.site_number }}: {{ location.reason }}
                              </div>
                              <div v-if="attentionLocations.length > 3" class="text-xs text-red-500">
                                ...and {{ attentionLocations.length - 3 }} more
                              </div>
                            </div>
                          </div>

                          <!-- International locations (if any) -->
                          <div v-if="internationalLocations.length > 0" class="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <div class="flex items-center gap-2 mb-2">
                              <i class="pi pi-globe text-orange-600"></i>
                              <span class="font-medium text-orange-800">International Locations</span>
                            </div>
                            <div class="space-y-1">
                              <div v-for="location in internationalLocations" :key="location.id" class="flex justify-between text-sm">
                                <span class="text-orange-700">{{ location.city }}, {{ location.state }}</span>
                                <Badge :value="location.verified ? 'Verified' : 'Unverified'" 
                                       :severity="location.verified ? 'success' : 'warning'" 
                                       class="text-xs" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </template>
                    </Card>

                    <!-- Vendor Spend Distribution -->
                    <Card>
                      <template #header>
                        <div class="p-4 border-b">
                          <h3 class="text-lg font-semibold">Vendor Spend Distribution</h3>
                        </div>
                      </template>
                      <template #content>
                        <div class="p-4">
                          <Chart v-if="topVendors.length > 0" type="doughnut" :data="vendorChartData" :options="vendorChartOptions" class="w-full h-64" />
                          <div v-else class="text-center py-8 text-gray-500">
                            <i class="pi pi-chart-pie text-4xl mb-4"></i>
                            <p>No vendor data available</p>
                          </div>
                          
                          <div class="mt-4 space-y-2">
                            <div v-for="vendor in topVendors" :key="vendor.name" class="flex justify-between items-center">
                              <div class="flex items-center gap-2">
                                <div class="w-3 h-3 rounded" :style="{backgroundColor: vendor.color}"></div>
                                <span class="font-medium">{{ vendor.name }}</span>
                              </div>
                              <div class="text-right">
                                <div class="font-semibold">{{ formatCurrency(vendor.amount) }}</div>
                                <div class="text-xs text-gray-600">{{ vendor.percentage }}%</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </template>
                    </Card>
                  </div>

                  <!-- Operational Health & Action Items -->
                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    <!-- Operational Health -->
                    <Card>
                      <template #header>
                        <div class="p-4 border-b">
                          <h3 class="text-lg font-semibold">Operational Health Indicators</h3>
                        </div>
                      </template>
                      <template #content>
                        <div class="p-4 space-y-4">
                          
                          <!-- Verification Status -->
                          <div>
                            <div class="flex justify-between mb-2">
                              <span class="font-medium">Verification Status</span>
                              <span class="text-sm text-gray-600">{{ Math.round(verificationStats.verifiedPercentage) }}% verified</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-3">
                              <div class="bg-green-500 h-3 rounded-l-full" :style="{width: verificationStats.verifiedPercentage + '%'}"></div>
                            </div>
                            <div class="flex justify-between text-xs text-gray-600 mt-1">
                              <span>{{ verificationStats.verified }} Verified</span>
                              <span>{{ verificationStats.unverified }} Unverified</span>
                            </div>
                          </div>

                          <!-- Account Activity -->
                          <div>
                            <div class="flex justify-between mb-2">
                              <span class="font-medium">Account Activity</span>
                              <span class="text-sm text-gray-600">{{ Math.round(activityStats.activePercentage) }}% active</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-3">
                              <div class="bg-blue-500 h-3 rounded-l-full" :style="{width: activityStats.activePercentage + '%'}"></div>
                            </div>
                            <div class="flex justify-between text-xs text-gray-600 mt-1">
                              <span>{{ activityStats.activeAccounts }} Active</span>
                              <span>{{ activityStats.inactiveAccounts }} Inactive</span>
                            </div>
                          </div>

                          <!-- Funding Utilization -->
                          <div v-if="customer.funding">
                            <div class="flex justify-between mb-2">
                              <span class="font-medium">Funding Utilization</span>
                              <span class="text-sm text-gray-600">{{ Math.round(fundingUtilization) }}% used</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-3">
                              <div class="h-3 rounded-l-full" :class="getFundingBarColor()" :style="{width: fundingUtilization + '%'}"></div>
                            </div>
                            <div class="flex justify-between text-xs text-gray-600 mt-1">
                              <span>{{ formatCurrency(customer.funding.total_funded - customer.funding.amount_remaining) }} Used</span>
                              <span>{{ formatCurrency(customer.funding.amount_remaining) }} Remaining</span>
                            </div>
                          </div>
                        </div>
                      </template>
                    </Card>

                    <!-- Action Items -->
                    <Card>
                      <template #header>
                        <div class="p-4 border-b">
                          <h3 class="text-lg font-semibold text-red-600">Action Items</h3>
                        </div>
                      </template>
                      <template #content>
                        <div class="p-4">
                          <div class="space-y-3">
                            <div v-for="item in actionItems" :key="item.id" class="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded">
                              <i :class="item.icon" class="text-red-600 mt-0.5"></i>
                              <div class="flex-1">
                                <div class="font-medium text-red-800">{{ item.title }}</div>
                                <div class="text-sm text-red-600 mt-1">{{ item.description }}</div>
                              </div>
                              <Badge :value="item.count" severity="danger" class="text-xs" />
                            </div>
                          </div>
                          
                          <div v-if="actionItems.length === 0" class="text-center py-4 text-green-600">
                            <i class="pi pi-check-circle text-2xl mb-2"></i>
                            <p>No action items - all systems healthy!</p>
                          </div>
                        </div>
                      </template>
                    </Card>
                  </div>
                </div>
              </TabPanel>

              <!-- Locations Tab -->
              <TabPanel value="1">
                <div v-if="customerStore.customerLocations.length === 0 && !customerStore.isLoading" class="text-center py-8">
                  <i class="pi pi-map-marker text-4xl text-gray-400 mb-4"></i>
                  <p class="text-gray-600">No locations found for this customer</p>
                  <Button label="Add Location" icon="pi pi-plus" class="mt-4" />
                </div>
                
                <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card 
                    v-for="location in customerStore.customerLocations" 
                    :key="location.id"
                    class="cursor-pointer hover:shadow-lg transition-shadow"
                    @click="viewLocation(location)"
                  >
                    <template #content>
                      <div>
                        <!-- Header with location name and status -->
                        <div class="flex items-center justify-between mb-3">
                          <h4 class="font-semibold text-gray-900 truncate">{{ location.name }}</h4>
                          <Badge 
                            :value="location.status === 'active' ? 'Active' : 'Inactive'" 
                            :severity="location.status === 'active' ? 'success' : 'secondary'" 
                          />
                        </div>

                        <!-- Address Information -->
                        <div class="text-sm text-gray-600 mb-3">
                          <div v-if="location.address">{{ location.address }}</div>
                          <div v-if="location.city">{{ location.city }}, {{ location.state }} {{ location.zipcode }}</div>
                        </div>

                        <!-- TEM Metrics -->
                        <div class="space-y-2 mb-3">
                          <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Total Accounts:</span>
                            <span class="font-medium">{{ location.total_accounts || 0 }}</span>
                          </div>
                          <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Active Accounts:</span>
                            <span class="font-medium text-green-600">{{ location.active_accounts || 0 }}</span>
                          </div>
                          <div v-if="location.flagged_accounts > 0" class="flex justify-between text-sm">
                            <span class="text-gray-600">Flagged Accounts:</span>
                            <span class="font-medium text-red-600">{{ location.flagged_accounts }}</span>
                          </div>
                          <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Monthly Expected:</span>
                            <span class="font-medium text-blue-600">{{ formatCurrency(location.monthly_expected) }}</span>
                          </div>
                        </div>

                        <!-- Activity Information -->
                        <div v-if="location.last_activity" class="text-xs text-gray-500 border-t pt-2">
                          <div class="flex justify-between">
                            <span>Last Activity:</span>
                            <span>{{ formatDate(location.last_activity) }}</span>
                          </div>
                          <div v-if="location.last_bill_total" class="flex justify-between">
                            <span>Last Bill:</span>
                            <span class="font-medium">{{ formatCurrency(location.last_bill_total) }}</span>
                          </div>
                        </div>

                        <!-- Active Accounts Summary -->
                        <div v-if="location.active_account_details && location.active_account_details.length > 0" 
                             class="mt-3 pt-2 border-t">
                          <div class="text-xs text-gray-500 mb-1">Active Services:</div>
                          <div class="flex flex-wrap gap-1">
                            <Badge 
                              v-for="account in location.active_account_details.slice(0, 3)" 
                              :key="account.account_number"
                              :value="account.vendor || 'Unknown'"
                              severity="info"
                              class="text-xs"
                            />
                            <Badge 
                              v-if="location.active_account_details.length > 3"
                              :value="`+${location.active_account_details.length - 3} more`"
                              severity="secondary"
                              class="text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </template>
                  </Card>
                </div>
              </TabPanel>

              <!-- Accounts Tab -->
              <TabPanel value="2">
                <TEMDataTable
                  v-if="flattenedAccounts.length > 0"
                  :data="flattenedAccounts"
                  :columns="accountColumns"
                  :loading="customerStore.isLoading"
                  title="Customer Accounts"
                  @action="onAccountAction"
                  searchPlaceholder="Search accounts by location, provider, or account number..."
                />
                <div v-else class="text-center py-8">
                  <i class="pi pi-credit-card text-4xl text-gray-400 mb-4"></i>
                  <p class="text-gray-600">No accounts found for this customer</p>
                  <p class="text-sm text-gray-500 mt-2">Account data will appear here when locations are loaded</p>
                </div>
              </TabPanel>

              <!-- Bills Tab -->
              <TabPanel value="3">
                <TEMDataTable
                  v-if="flattenedBills.length > 0"
                  :data="flattenedBills"
                  :columns="billColumns"
                  :loading="customerStore.isLoading"
                  title="Recent Billing Activity (Last 30 Days)"
                  @action="onBillAction"
                  searchPlaceholder="Search locations by site, name, or provider..."
                />
                <div v-else class="text-center py-8">
                  <i class="pi pi-receipt text-4xl text-gray-400 mb-4"></i>
                  <p class="text-gray-600">No recent billing activity found</p>
                  <p class="text-sm text-gray-500 mt-2">Billing activity data will appear here when locations have recent transactions</p>
                </div>
              </TabPanel>

              <!-- Funding Tab -->
              <TabPanel value="4">
                <div class="funding-tab-content">
                  <p class="text-gray-600 text-center py-8">Funding details coming soon...</p>
                </div>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </template>
      </Card>
    </div>

    <!-- Error State -->
    <div v-else-if="customerStore.currentError" class="text-center py-16">
      <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
      <p class="text-red-600 mb-4">{{ customerStore.currentError }}</p>
      <Button label="Retry" @click="loadCustomer" />
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Badge from 'primevue/badge';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import ProgressSpinner from 'primevue/progressspinner';
import Chart from 'primevue/chart';
import TEMDataTable from '@/components/tem/shared/TEMDataTable.vue';
import { useTEMCustomerStore } from '@/stores/tem/customerStore';

// Composables
const route = useRoute();
const router = useRouter();
const toast = useToast();
const customerStore = useTEMCustomerStore();

// State
const activeTabIndex = ref("0");

// Computed
const customer = computed(() => customerStore.currentCustomer);
const customerId = computed(() => route.params.id);

// Computed metrics from location data
const locationMetrics = computed(() => {
  const locations = customerStore.customerLocations;
  if (!locations || locations.length === 0) {
    return {
      totalLocations: 0,
      totalAccounts: 0,
      activeAccounts: 0,
      monthlyExpected: 0,
      flaggedAccounts: 0
    };
  }
  
  return locations.reduce((totals, location) => {
    const metrics = location.metrics || {};
    return {
      totalLocations: totals.totalLocations + 1,
      totalAccounts: totals.totalAccounts + (metrics.total_accounts || location.total_accounts || 0),
      activeAccounts: totals.activeAccounts + (metrics.active_accounts || location.active_accounts || 0),
      monthlyExpected: totals.monthlyExpected + parseFloat(metrics.monthly_expected || location.monthly_expected || 0),
      flaggedAccounts: totals.flaggedAccounts + (metrics.flagged_accounts || location.flagged_accounts || 0)
    };
  }, {
    totalLocations: 0,
    totalAccounts: 0,
    activeAccounts: 0,
    monthlyExpected: 0,
    flaggedAccounts: 0
  });
});

// Location breakdown for metrics card
const locationBreakdown = computed(() => {
  const locations = customerStore.customerLocations;
  if (!locations || locations.length === 0) {
    return { active: 0, closed: 0, unverified: 0 };
  }
  
  return locations.reduce((breakdown, location) => {
    if (location.name?.includes('Closed')) {
      breakdown.closed++;
    } else if (location.verified === 1) {
      breakdown.active++;
    } else {
      breakdown.unverified++;
    }
    return breakdown;
  }, { active: 0, closed: 0, unverified: 0 });
});

// Funding runway calculation
const fundingRunwayMonths = computed(() => {
  if (!customer.value?.funding) return 0;
  const funding = customer.value.funding;
  const monthlyBurn = locationMetrics.value.monthlyExpected;
  const amountRemaining = parseFloat(funding.amount_remaining || 0);
  
  if (!monthlyBurn || monthlyBurn <= 0 || amountRemaining <= 0) return 0;
  return Math.floor(amountRemaining / monthlyBurn);
});

// Account health score
const accountHealthScore = computed(() => {
  const metrics = locationMetrics.value;
  if (metrics.totalAccounts === 0) return 100;
  return Math.round((metrics.activeAccounts / metrics.totalAccounts) * 100);
});

// International locations
const internationalLocations = computed(() => {
  const locations = customerStore.customerLocations;
  if (!locations) return [];
  
  return locations.filter(location => 
    location.state === 'Honduras' || location.state === 'Mexico'
  );
});

// Enhanced vendor spend distribution using new endpoint data
const vendorSpendData = computed(() => {
  const locations = customerStore.customerLocationsEnhanced;
  if (!locations || locations.length === 0) return [];
  
  const vendorData = {};
  locations.forEach(location => {
    // Use account_details array with correct field names
    if (location.account_details && Array.isArray(location.account_details)) {
      location.account_details.forEach(account => {
        const provider = account.provider_name || 'Unknown';
        const amount = parseFloat(account.expected_amount || 0);
        
        if (!vendorData[provider]) {
          vendorData[provider] = 0;
        }
        vendorData[provider] += amount;
      });
    }
  });
  
  return Object.entries(vendorData)
    .map(([vendor, amount]) => ({ vendor, amount }))
    .sort((a, b) => b.amount - a.amount);
});

// Top vendors with colors for chart
const topVendors = computed(() => {
  const vendors = vendorSpendData.value.slice(0, 6);
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
  const total = vendors.reduce((sum, v) => sum + v.amount, 0);
  
  return vendors.map((vendor, index) => ({
    name: vendor.vendor,
    amount: vendor.amount,
    percentage: Math.round((vendor.amount / total) * 100),
    color: colors[index] || '#6B7280'
  }));
});

// Chart data for vendor distribution
const vendorChartData = computed(() => {
  const vendors = topVendors.value;
  
  return {
    labels: vendors.map(v => v.name),
    datasets: [{
      data: vendors.map(v => v.amount),
      backgroundColor: vendors.map(v => v.color),
      borderWidth: 0
    }]
  };
});

// Chart options for vendor chart
const vendorChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const vendor = topVendors.value[context.dataIndex];
          return `${vendor.name}: ${formatCurrency(vendor.amount)} (${vendor.percentage}%)`;
        }
      }
    }
  }
}));

// Verification statistics
const verificationStats = computed(() => {
  const breakdown = locationBreakdown.value;
  const total = breakdown.active + breakdown.closed + breakdown.unverified;
  const verified = breakdown.active + breakdown.closed;
  
  return {
    verified,
    unverified: breakdown.unverified,
    verifiedPercentage: total > 0 ? (verified / total) * 100 : 0
  };
});

// Account activity statistics
const activityStats = computed(() => {
  const metrics = locationMetrics.value;
  const total = metrics.totalAccounts;
  
  return {
    activeAccounts: metrics.activeAccounts,
    inactiveAccounts: total - metrics.activeAccounts,
    activePercentage: total > 0 ? (metrics.activeAccounts / total) * 100 : 0
  };
});

// Funding utilization percentage
const fundingUtilization = computed(() => {
  if (!customer.value?.funding) return 0;
  const funding = customer.value.funding;
  const totalFunded = parseFloat(funding.total_funded || 0);
  const amountRemaining = parseFloat(funding.amount_remaining || 0);
  if (totalFunded === 0) return 0;
  return ((totalFunded - amountRemaining) / totalFunded) * 100;
});

// Enhanced metrics from new endpoint data
const enhancedMetrics = computed(() => {
  const locations = customerStore.customerLocationsEnhanced;
  if (!locations || locations.length === 0) {
    return {
      totalLocations: 0,
      locationsWithActivity: 0,
      totalOverdueBills: 0,
      totalRecentSpend: 0,
      avgDaysSinceActivity: 0,
      locationsNeedingAttention: 0,
      totalProviders: 0
    };
  }
  
  const totalOverdueBills = locations.reduce((sum, loc) => sum + loc.overdue_bills, 0);
  const totalRecentSpend = locations.reduce((sum, loc) => sum + loc.recent_spend, 0);
  const locationsWithActivity = locations.filter(loc => loc.has_recent_activity).length;
  const locationsNeedingAttention = locations.filter(loc => loc.needs_attention).length;
  
  const activeDays = locations.filter(loc => loc.days_since_activity > 0);
  const avgDaysSinceActivity = activeDays.length > 0 
    ? Math.round(activeDays.reduce((sum, loc) => sum + loc.days_since_activity, 0) / activeDays.length)
    : 0;
    
  const allProviders = new Set();
  locations.forEach(loc => loc.providers.forEach(provider => allProviders.add(provider)));
  
  return {
    totalLocations: locations.length,
    locationsWithActivity,
    totalOverdueBills,
    totalRecentSpend,
    avgDaysSinceActivity,
    locationsNeedingAttention,
    totalProviders: allProviders.size
  };
});

// Top performing locations by recent spend
const topPerformingLocations = computed(() => {
  const locations = customerStore.customerLocationsEnhanced;
  if (!locations || locations.length === 0) return [];
  
  return locations
    .filter(loc => loc.recent_spend > 0)
    .sort((a, b) => b.recent_spend - a.recent_spend)
    .slice(0, 5)
    .map(loc => ({
      name: loc.name,
      site_number: loc.site_number,
      recent_spend: loc.recent_spend,
      providers: loc.providers_text,
      days_since_activity: loc.days_since_activity
    }));
});

// Locations needing attention (overdue bills or no recent activity)
const attentionLocations = computed(() => {
  const locations = customerStore.customerLocationsEnhanced;
  if (!locations || locations.length === 0) return [];
  
  return locations
    .filter(loc => loc.needs_attention)
    .sort((a, b) => b.overdue_bills - a.overdue_bills || b.days_since_activity - a.days_since_activity)
    .slice(0, 10)
    .map(loc => ({
      name: loc.name,
      site_number: loc.site_number,
      overdue_bills: loc.overdue_bills,
      days_since_activity: loc.days_since_activity,
      reason: loc.overdue_bills > 0 ? `${loc.overdue_bills} overdue bills` : `${loc.days_since_activity} days inactive`
    }));
});

// Action items based on enhanced data analysis
const actionItems = computed(() => {
  const items = [];
  const locations = customerStore.customerLocations || [];
  const enhanced = enhancedMetrics.value;
  
  // Overdue bills alert
  if (enhanced.totalOverdueBills > 0) {
    items.push({
      id: 'overdue-bills',
      icon: 'pi pi-exclamation-triangle',
      title: 'Overdue Bills',
      description: `${enhanced.totalOverdueBills} overdue bills requiring payment`,
      count: enhanced.totalOverdueBills
    });
  }
  
  // Locations needing attention
  if (enhanced.locationsNeedingAttention > 0) {
    items.push({
      id: 'attention-needed',
      icon: 'pi pi-flag',
      title: 'Locations Need Attention',
      description: `${enhanced.locationsNeedingAttention} locations with overdue bills or inactive accounts`,
      count: enhanced.locationsNeedingAttention
    });
  }
  
  // Stale activity alert
  if (enhanced.avgDaysSinceActivity > 30) {
    items.push({
      id: 'stale-activity',
      icon: 'pi pi-clock',
      title: 'Stale Account Activity',
      description: `Average ${enhanced.avgDaysSinceActivity} days since last activity across locations`,
      count: Math.round(enhanced.avgDaysSinceActivity)
    });
  }
  
  // International locations needing review
  if (internationalLocations.value.length > 0) {
    items.push({
      id: 'international',
      icon: 'pi pi-globe',
      title: 'International Locations',
      description: `${internationalLocations.value.length} international locations requiring special review`,
      count: internationalLocations.value.length
    });
  }
  
  return items;
});

// Flattened accounts data from enhanced endpoint for DataTable
const flattenedAccounts = computed(() => {
  const locations = customerStore.customerLocationsEnhanced;
  if (!locations || locations.length === 0) return [];
  
  const allAccounts = [];
  locations.forEach(location => {
    if (location.account_details && Array.isArray(location.account_details)) {
      location.account_details.forEach(account => {
        allAccounts.push({
          id: `${location.id}-${account.account_number}`,
          location_id: location.id,
          location_name: location.name,
          site_number: location.site_number,
          location_address: location.address,
          account_number: account.account_number,
          provider_name: account.provider_name,
          name_on_check: account.name_on_check,
          expected_amount: parseFloat(account.expected_amount || 0),
          status: account.status,
          is_active: account.status === 'Active',
          is_flagged: account.flag_status === 'Flagged',
          flag_status: account.flag_status,
          service_type: 'Telecom', // Default since we're in TEM
          monthly_charge: parseFloat(account.expected_amount || 0), // Alias for compatibility
          
          // Location context
          location_active_accounts: location.active_accounts,
          location_recent_spend: location.recent_spend,
          location_overdue_bills: location.overdue_bills,
          location_days_since_activity: location.days_since_activity
        });
      });
    }
  });
  
  return allAccounts.sort((a, b) => b.expected_amount - a.expected_amount);
});

// Bills/Activity data from enhanced endpoint for DataTable
const flattenedBills = computed(() => {
  const locations = customerStore.customerLocationsEnhanced;
  if (!locations || locations.length === 0) return [];
  
  const allBills = [];
  locations.forEach(location => {
    if (location.recent_bill_count > 0 || location.recent_spend > 0) {
      // Create a summary "bill" entry for each location with activity
      allBills.push({
        id: `activity-${location.id}`,
        location_id: location.id,
        location_name: location.name,
        site_number: location.site_number,
        location_address: location.address,
        providers: location.providers_text,
        
        // Activity summary as "bill" data
        bill_period: 'Last 30 Days',
        bill_count: location.recent_bill_count,
        total_amount: location.recent_spend,
        overdue_count: location.overdue_bills,
        expected_amount: location.monthly_expected,
        
        // Status indicators
        has_activity: location.has_recent_activity,
        is_overdue: location.is_overdue,
        needs_attention: location.needs_attention,
        days_since_activity: location.days_since_activity,
        
        // Computed status
        status: location.is_overdue ? 'Overdue' : location.has_recent_activity ? 'Active' : 'Inactive',
        variance: location.recent_spend - location.monthly_expected,
        variance_percent: location.monthly_expected > 0 ? 
          ((location.recent_spend - location.monthly_expected) / location.monthly_expected * 100) : 0
      });
    }
  });
  
  return allBills.sort((a, b) => b.total_amount - a.total_amount);
});

// Enhanced account table columns
const accountColumns = [
  { field: 'site_number', header: 'Site', sortable: true, width: '80px' },
  { field: 'location_name', header: 'Location', sortable: true },
  { field: 'account_number', header: 'Account Number', sortable: true, width: '150px' },
  { field: 'provider_name', header: 'Provider', sortable: true },
  { field: 'name_on_check', header: 'Billing Name', sortable: true },
  { field: 'expected_amount', header: 'Expected Amount', type: 'currency', sortable: true },
  { field: 'status', header: 'Status', type: 'status', sortable: true },
  { field: 'location_days_since_activity', header: 'Days Since Activity', sortable: true, width: '100px' },
  {
    type: 'actions',
    header: 'Actions',
    actions: [
      { name: 'view', icon: 'pi pi-eye', label: 'View Location', outlined: true }
    ]
  }
];

// Bills/Activity table columns
const billColumns = [
  { field: 'site_number', header: 'Site', sortable: true, width: '80px' },
  { field: 'location_name', header: 'Location', sortable: true },
  { field: 'providers', header: 'Providers', sortable: true },
  { field: 'bill_count', header: 'Bills (30d)', sortable: true, width: '100px' },
  { field: 'total_amount', header: 'Actual Spend', type: 'currency', sortable: true },
  { field: 'expected_amount', header: 'Expected', type: 'currency', sortable: true },
  { field: 'variance_percent', header: 'Variance %', type: 'percentage', sortable: true, width: '100px' },
  { field: 'overdue_count', header: 'Overdue', sortable: true, width: '80px' },
  { field: 'status', header: 'Status', type: 'status', sortable: true },
  {
    type: 'actions',
    header: 'Actions',
    actions: [
      { name: 'view', icon: 'pi pi-eye', label: 'View Location', outlined: true }
    ]
  }
];

// Helper methods
const extractVendorFromAccount = (vendorString) => {
  if (!vendorString) return 'Unknown';
  
  // Extract vendor from patterns like "Ethan_Allen_036_ATT_7134" -> "ATT"
  const parts = vendorString.split('_');
  const commonVendors = ['ATT', 'Verizon', 'Charter', 'Spectrum', 'Lumen', 'MetTel', 'Simple', 'VoIP', 'Crown', 'Castle', 'WiLine'];
  
  for (const part of parts) {
    for (const vendor of commonVendors) {
      if (part.toUpperCase().includes(vendor.toUpperCase())) {
        return vendor;
      }
    }
  }
  
  // Fallback to last meaningful part
  return parts[parts.length - 2] || parts[parts.length - 1] || 'Other';
};


const getFundingColorClass = (status) => {
  // Handle status-based coloring (for text)
  if (status) {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'low': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }
  
  // Handle utilization-based coloring (for backgrounds)
  const utilization = fundingUtilization.value;
  if (utilization > 90) return 'bg-red-500';
  if (utilization > 75) return 'bg-yellow-500';
  return 'bg-green-500';
};

const getFundingBarColor = () => {
  const utilization = fundingUtilization.value;
  if (utilization > 90) return 'bg-red-500';
  if (utilization > 75) return 'bg-yellow-500';
  return 'bg-green-500';
};

// Methods
const loadCustomer = async () => {
  try {
    await customerStore.fetchCustomerDetail(customerId.value);
    
    // Always load location data for metric calculations
    await loadCustomerLocations();
    
    // Load enhanced data for overview dashboard
    await loadCustomerLocationsEnhanced();
    
    // Load additional data based on active tab
    if (activeTabIndex.value === 2) {
      await loadCustomerAccounts();
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load customer details',
      life: 3000
    });
  }
};

const loadCustomerLocations = async () => {
  try {
    await customerStore.fetchCustomerLocations(customerId.value);
  } catch (error) {
    console.error('Failed to load customer locations:', error);
  }
};

const loadCustomerLocationsEnhanced = async () => {
  try {
    await customerStore.fetchCustomerLocationsEnhanced(customerId.value);
  } catch (error) {
    console.error('Failed to load enhanced customer locations:', error);
  }
};

const loadCustomerAccounts = async () => {
  try {
    await customerStore.fetchCustomerAccounts(customerId.value);
  } catch (error) {
    console.error('Failed to load customer accounts:', error);
  }
};

const onTabChange = async (event) => {
  const tabValue = event.value;
  
  switch (tabValue) {
    case "1": // Locations tab - already loaded on page load
      break;
    case "2": // Accounts tab - uses enhanced data loaded on page load
      break;
    case "3": // Bills tab - uses enhanced data loaded on page load
      break;
    case "4": // Funding tab
      // Load funding details when implemented
      break;
  }
};

const viewLocation = (location) => {
  router.push(`/tem/customers/${customerId.value}/locations/${location.id}`);
};

const onAccountAction = (event) => {
  const { action, data } = event;
  
  switch (action) {
    case 'view':
      // Navigate to location detail page for this account
      router.push(`/tem/customers/${customerId.value}/locations/${data.location_id}`);
      break;
    case 'edit':
      // Open account edit dialog (future enhancement)
      console.log('Edit account:', data);
      break;
  }
};

const onBillAction = (event) => {
  const { action, data } = event;
  
  switch (action) {
    case 'view':
      // Navigate to location detail page for this billing activity
      router.push(`/tem/customers/${customerId.value}/locations/${data.location_id}`);
      break;
    case 'edit':
      // Open billing edit dialog (future enhancement)
      console.log('Edit billing:', data);
      break;
  }
};

const exportCustomerData = async () => {
  try {
    await customerStore.exportCustomers({ customer_id: customerId.value });
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Customer data exported successfully',
      life: 3000
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to export customer data',
      life: 3000
    });
  }
};


// Utility functions
const formatCurrency = (value) => {
  if (value == null) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};


// Watchers
watch(() => route.query.tab, (tab) => {
  if (tab === 'locations') {
    activeTabIndex.value = "1";
  } else if (tab === 'accounts') {
    activeTabIndex.value = "2";
  } else if (tab === 'bills') {
    activeTabIndex.value = "3";
  } else if (tab === 'funding') {
    activeTabIndex.value = "4";
  }
});


// Lifecycle
onMounted(async () => {
  await loadCustomer();
  
  // Handle initial tab from query params
  const tab = route.query.tab;
  if (tab === 'locations') {
    activeTabIndex.value = "1";
    await loadCustomerLocations();
  }
});
</script>

<style scoped>
.tem-customer-detail {
  padding: 1.5rem;
  min-height: 100vh;
  background: var(--surface-ground);
}

.page-header h1 {
  font-weight: 700;
}

:deep(.p-tabs .p-tabpanels) {
  padding: 1.5rem 0;
}

/* Metric cards styling */
.metric-card {
  transition: all 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

:deep(.p-card-content) {
  padding: 1.5rem;
}
</style>