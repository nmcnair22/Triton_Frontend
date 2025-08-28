<template>
  <div class="tem-location-detail">
    <!-- Loading State -->
    <div v-if="locationStore.isLoading" class="flex justify-center items-center h-64">
      <ProgressSpinner />
    </div>

    <!-- Location Detail Content -->
    <div v-else-if="locationStore.currentLocation" class="location-detail-content">
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
                <i class="pi pi-map-marker text-blue-600 text-xl"></i>
              </div>
              <div>
                <h1 class="text-3xl font-bold text-gray-900">{{ locationStore.locationName }}</h1>
                <p class="text-sm text-gray-600 mt-1">{{ locationStore.locationAddress }}</p>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <Badge
              v-if="currentDisplayAccount"
              :value="currentDisplayAccount.is_active ? 'Active' : 'Inactive'"
              :severity="currentDisplayAccount.is_active ? 'success' : 'secondary'"
              class="px-3 py-2 text-sm"
            />
            <Badge
              v-if="currentDisplayAccount?.is_flagged"
              :value="currentDisplayAccount.flagged_reason || 'Flagged'"
              severity="danger"
              class="px-3 py-2 text-sm"
            />
            <Button
              icon="pi pi-download"
              label="Export"
              outlined
              @click="exportLocationData"
            />
          </div>
        </div>

      </div>

      <!-- Clean Information Panel -->
      <div class="space-y-6">
        
        <!-- Account Information -->
        <Card v-if="locationStore.locationAccounts.length > 0">
          <template #header>
            <div class="p-4 border-b">
              <h3 class="text-lg font-semibold">Account Information</h3>
              <p v-if="locationStore.locationAccounts.length > 1" class="text-sm text-gray-600 mt-1">
                {{ locationStore.locationAccounts.length }} accounts at this location
              </p>
            </div>
          </template>
          <template #content>
            <div v-if="locationStore.accountsLoading" class="flex justify-center py-8">
              <ProgressSpinner size="small" />
            </div>
            
            <div v-else class="p-6">
              <!-- Single Account Display -->
              <div v-if="locationStore.locationAccounts.length === 1" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-4">
                  <div class="form-field">
                    <label class="form-label">Account Number</label>
                    <div class="form-value font-mono">{{ locationStore.locationAccounts[0].account_number }}</div>
                  </div>
                  
                  <div class="form-field">
                    <label class="form-label">Provider</label>
                    <div class="form-value">{{ locationStore.locationAccounts[0].provider_name }}</div>
                  </div>
                </div>

                <div class="space-y-4">
                  <div class="form-field">
                    <label class="form-label">Expected Amount</label>
                    <div class="form-value text-blue-600 font-semibold">{{ formatCurrency(locationStore.locationAccounts[0].expected_amount) }}</div>
                  </div>
                  
                  <div class="form-field">
                    <label class="form-label">Last Bill Amount</label>
                    <div class="form-value" :class="getVarianceColor(locationStore.locationAccounts[0])">{{ formatCurrency(locationStore.locationAccounts[0].last_amount) }}</div>
                  </div>
                </div>
              </div>

              <!-- Multiple Accounts - Tab Display -->
              <Tabs v-else v-model:value="selectedAccountIndex">
                <TabList>
                  <Tab 
                    v-for="(account, index) in locationStore.locationAccounts" 
                    :key="account.account_number"
                    :value="index"
                  >
                    {{ account.provider_name }} - {{ account.account_number }}
                    <Badge 
                      v-if="account.is_flagged" 
                      severity="danger" 
                      class="ml-2"
                    />
                  </Tab>
                </TabList>
                <TabPanels>
                  <TabPanel 
                    v-for="(account, index) in locationStore.locationAccounts"
                    :key="account.account_number"
                    :value="index"
                  >
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      <div class="space-y-4">
                        <div class="form-field">
                          <label class="form-label">Account Number</label>
                          <div class="form-value font-mono">{{ account.account_number }}</div>
                        </div>
                        
                        <div class="form-field">
                          <label class="form-label">Provider</label>
                          <div class="form-value">{{ account.provider_name }}</div>
                        </div>

                        <div class="form-field">
                          <label class="form-label">Status</label>
                          <div class="form-value">
                            <Badge
                              :value="account.is_active ? 'Active' : 'Inactive'"
                              :severity="account.is_active ? 'success' : 'secondary'"
                            />
                            <Badge 
                              v-if="account.is_flagged"
                              :value="account.flagged_reason || 'Flagged'"
                              severity="danger"
                              class="ml-2"
                            />
                          </div>
                        </div>
                      </div>

                      <div class="space-y-4">
                        <div class="form-field">
                          <label class="form-label">Expected Amount</label>
                          <div class="form-value text-blue-600 font-semibold">{{ formatCurrency(account.expected_amount) }}</div>
                        </div>
                        
                        <div class="form-field">
                          <label class="form-label">Last Bill Amount</label>
                          <div class="form-value" :class="getVarianceColor(account)">{{ formatCurrency(account.last_amount) }}</div>
                        </div>

                        <div class="form-field" v-if="getAccountVariance(account).hasVariance">
                          <label class="form-label">Variance</label>
                          <div class="form-value" :class="getVarianceColor(account)">
                            {{ getAccountVariance(account).variancePercent > 0 ? '+' : '' }}{{ getAccountVariance(account).variancePercent.toFixed(1) }}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </div>
          </template>
        </Card>

        <!-- Orders & Operations Accordion -->
        <Card>
          <template #content>
            <div class="p-6">
              <Accordion :value="accordionState">
                <AccordionPanel value="0">
                  <AccordionHeader>
                    <div class="flex items-center justify-between w-full pr-4">
                      <div class="flex items-center gap-3">
                        <i class="pi pi-cog text-blue-600"></i>
                        <span class="font-semibold">Orders & Cancellations</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <Badge 
                          v-if="locationStore.ordersSummary?.total_orders" 
                          :value="`${locationStore.ordersSummary.total_orders} Orders`"
                          severity="info" 
                        />
                        <Badge 
                          v-if="locationStore.cancellationsSummary?.total" 
                          :value="`${locationStore.cancellationsSummary.total} Cancellations`" 
                          severity="warning" 
                        />
                      </div>
                    </div>
                  </AccordionHeader>
                  <AccordionContent>
                    <Tabs value="0" class="w-full">
                      <TabList class="w-full">
                        <Tab value="0" class="flex-1">
                          <div class="flex items-center gap-2">
                            <i class="pi pi-shopping-cart text-blue-600"></i>
                            <span>Orders</span>
                            <Badge 
                              v-if="locationStore.ordersSummary?.total_orders" 
                              :value="locationStore.ordersSummary.total_orders"
                              severity="info"
                              class="ml-2"
                            />
                          </div>
                        </Tab>
                        <Tab value="1" class="flex-1">
                          <div class="flex items-center gap-2">
                            <i class="pi pi-times-circle text-red-600"></i>
                            <span>Cancellations</span>
                            <Badge 
                              v-if="locationStore.cancellationsSummary?.total" 
                              :value="locationStore.cancellationsSummary.total"
                              severity="warning"
                              class="ml-2"
                            />
                          </div>
                        </Tab>
                      </TabList>
                      
                      <TabPanels class="mt-4">
                        <!-- Orders Tab -->
                        <TabPanel value="0">
                          <!-- Orders Header with Time Filter - Always visible -->
                          <div class="flex justify-between items-center mb-4">
                            <h4 class="text-lg font-semibold text-gray-900">Orders History</h4>
                            <div class="flex items-center gap-2">
                              <label class="text-sm font-medium text-gray-600">Time Period:</label>
                              <Select
                                v-model="selectedOrdersTimeFilter"
                                :options="timeFrameOptions"
                                optionLabel="label"
                                optionValue="value"
                                class="w-32"
                                @change="onOrdersTimeFilterChange"
                              />
                            </div>
                          </div>

                          <div v-if="locationStore.ordersLoading" class="flex justify-center py-8">
                            <ProgressSpinner size="small" />
                          </div>
                          
                          <div v-else-if="locationStore.locationOrders.length > 0" class="space-y-4">

                            <!-- Orders Summary Metrics -->
                            <div v-if="locationStore.ordersSummary" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                              <div class="text-center p-4 bg-blue-50 rounded-lg">
                                <div class="text-xl font-bold text-blue-600">{{ locationStore.ordersSummary.total_orders || 0 }}</div>
                                <div class="text-sm text-blue-600">Total Orders</div>
                              </div>
                              <div class="text-center p-4 bg-green-50 rounded-lg">
                                <div class="text-xl font-bold text-green-600">{{ locationStore.ordersSummary.linked_orders || 0 }}</div>
                                <div class="text-sm text-green-600">TEM Linked</div>
                              </div>
                              <div class="text-center p-4 bg-orange-50 rounded-lg">
                                <div class="text-xl font-bold text-orange-600">{{ formatCurrency(locationStore.ordersSummary.total_monthly_cost || 0) }}</div>
                                <div class="text-sm text-orange-600">Monthly Cost</div>
                              </div>
                              <div class="text-center p-4 bg-purple-50 rounded-lg">
                                <div class="text-xl font-bold text-purple-600">{{ formatCurrency(locationStore.ordersSummary.total_install_cost || 0) }}</div>
                                <div class="text-sm text-purple-600">Install Cost</div>
                              </div>
                            </div>

                            <!-- Orders DataTable -->
                            <TEMDataTable
                              :data="flattenedOrdersData"
                              :columns="ordersColumns"
                              :loading="locationStore.ordersLoading"
                              title="Location Orders"
                              @action="onOrderAction"
                              searchPlaceholder="Search orders by service, provider, or status..."
                            />
                          </div>
                          
                          <div v-else class="text-center py-8">
                            <i class="pi pi-shopping-cart text-4xl text-gray-400 mb-4"></i>
                            <p class="text-gray-600">No orders found for this location</p>
                            <p class="text-sm text-gray-500 mt-2">Order data will appear here when available</p>
                          </div>
                        </TabPanel>

                        <!-- Cancellations Tab -->
                        <TabPanel value="1">
                          <!-- Cancellations Header with Time Filter - Always visible -->
                          <div class="flex justify-between items-center mb-4">
                            <h4 class="text-lg font-semibold text-gray-900">Cancellations History</h4>
                            <div class="flex items-center gap-2">
                              <label class="text-sm font-medium text-gray-600">Time Period:</label>
                              <Select
                                v-model="selectedCancellationsTimeFilter"
                                :options="timeFrameOptions"
                                optionLabel="label"
                                optionValue="value"
                                class="w-32"
                                @change="onCancellationsTimeFilterChange"
                              />
                            </div>
                          </div>

                          <div v-if="locationStore.cancellationsLoading" class="flex justify-center py-8">
                            <ProgressSpinner size="small" />
                          </div>
                          
                          <div v-else-if="locationStore.locationCancellations.length > 0" class="space-y-4">

                            <!-- Cancellations Summary Metrics -->
                            <div v-if="locationStore.cancellationsSummary" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                              <div class="text-center p-4 bg-red-50 rounded-lg">
                                <div class="text-xl font-bold text-red-600">{{ locationStore.cancellationsSummary.total || 0 }}</div>
                                <div class="text-sm text-red-600">Total Cancellations</div>
                              </div>
                              <div class="text-center p-4 bg-green-50 rounded-lg">
                                <div class="text-xl font-bold text-green-600">{{ locationStore.cancellationsSummary.linked || 0 }}</div>
                                <div class="text-sm text-green-600">TEM Linked</div>
                              </div>
                              <div class="text-center p-4 bg-orange-50 rounded-lg">
                                <div class="text-xl font-bold text-orange-600">{{ Math.round(locationStore.cancellationsSummary.link_rate || 0) }}%</div>
                                <div class="text-sm text-orange-600">Link Rate</div>
                              </div>
                              <div class="text-center p-4 bg-blue-50 rounded-lg">
                                <div class="text-xl font-bold text-blue-600">{{ locationStore.cancellationsSummary.by_status?.cancellation_complete || 0 }}</div>
                                <div class="text-sm text-blue-600">Completed</div>
                              </div>
                            </div>

                            <!-- Cancellations DataTable -->
                            <TEMDataTable
                              :data="flattenedCancellationsData"
                              :columns="cancellationsColumns"
                              :loading="locationStore.cancellationsLoading"
                              title="Location Cancellations"
                              @action="onCancellationAction"
                              searchPlaceholder="Search cancellations by provider, status, or confirmation number..."
                            />
                          </div>
                          
                          <div v-else class="text-center py-8">
                            <i class="pi pi-times-circle text-4xl text-gray-400 mb-4"></i>
                            <p class="text-gray-600">No cancellations found for this location</p>
                            <p class="text-sm text-gray-500 mt-2">Cancellation data will appear here when available</p>
                          </div>
                        </TabPanel>
                      </TabPanels>
                    </Tabs>
                  </AccordionContent>
                </AccordionPanel>
              </Accordion>
            </div>
          </template>
        </Card>

        <!-- Bills Section -->
        <Card>
          <template #header>
            <div class="flex justify-between items-center p-4 border-b">
              <div>
                <h3 class="text-lg font-semibold">Bills & Trend Analysis</h3>
                <p v-if="locationStore.locationAccounts.length > 1 && currentDisplayAccount" class="text-sm text-gray-600 mt-1">
                  Showing data for: {{ currentDisplayAccount.provider_name }} - {{ currentDisplayAccount.account_number }}
                </p>
              </div>
              <Select
                v-model="selectedMonthsFilter"
                :options="monthOptions"
                optionLabel="label"
                optionValue="value"
                class="w-24"
                @change="onMonthsFilterChange"
              />
            </div>
          </template>
          <template #content>
            <div v-if="locationStore.billsLoading" class="flex justify-center py-8">
              <ProgressSpinner />
            </div>
            
            <div v-else class="p-6">
              <!-- Bill Statistics -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="text-center p-4 bg-blue-50 rounded-lg">
                  <div class="text-xl font-bold text-blue-600">{{ billStats.minAmount }}</div>
                  <div class="text-sm text-blue-600">Minimum</div>
                </div>
                <div class="text-center p-4 bg-green-50 rounded-lg">
                  <div class="text-xl font-bold text-green-600">{{ billStats.avgAmount }}</div>
                  <div class="text-sm text-green-600">Average</div>
                </div>
                <div class="text-center p-4 bg-orange-50 rounded-lg">
                  <div class="text-xl font-bold text-orange-600">{{ billStats.maxAmount }}</div>
                  <div class="text-sm text-orange-600">Maximum</div>
                </div>
                <div class="text-center p-4 bg-purple-50 rounded-lg">
                  <div class="text-xl font-bold text-purple-600">{{ billStats.expectedAmount }}</div>
                  <div class="text-sm text-purple-600">Expected</div>
                </div>
              </div>

              <!-- Chart -->
              <div v-if="locationStore.billsLoading" class="text-center py-8">
                <ProgressSpinner size="small" />
                <p class="text-gray-600 mt-2">Loading chart data...</p>
              </div>
              
              <div v-else-if="!chartData.labels || chartData.labels.length === 0" class="text-center py-8">
                <i class="pi pi-chart-line text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-600">No billing data available</p>
              </div>
              
              <div v-else class="mb-6">
                <Chart 
                  :key="`bills-chart-${locationId}-${selectedMonthsFilter}`"
                  type="line" 
                  :data="chartData" 
                  :options="chartOptions"
                  class="w-full h-96"
                />
              </div>

              <!-- Recent Bills -->
              <div>
                <h4 class="font-medium text-gray-900 mb-3">
                  Recent Bills
                  <span v-if="locationStore.locationAccounts.length > 1 && currentDisplayAccount" class="text-sm font-normal text-gray-600">
                    - {{ currentDisplayAccount.provider_name }}
                  </span>
                </h4>
                <div class="space-y-2">
                  <div
                    v-for="bill in filteredRecentBills.slice(0, 10)"
                    :key="`${bill.vendor_name}-${bill.invoice_date}`"
                    class="flex justify-between items-center p-3 border rounded"
                    :class="{ 'border-red-200 bg-red-50': bill.is_overdue }"
                  >
                    <div class="flex-1">
                      <div class="font-medium text-sm">{{ bill.vendor_name }}</div>
                      <div class="text-xs text-gray-600">Invoice: {{ formatDate(bill.invoice_date) }}</div>
                      <div v-if="bill.account_number" class="text-xs text-gray-500">Account: {{ bill.account_number }}</div>
                      <div v-if="bill.is_overdue" class="text-xs text-red-600">
                        {{ Math.round(Math.abs(bill.days_to_due)) }} days overdue
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="font-medium">{{ formatCurrency(bill.amount) }}</div>
                      <Badge
                        :value="bill.is_overdue ? 'Overdue' : 'Current'"
                        :severity="bill.is_overdue ? 'danger' : 'success'"
                        class="text-xs"
                      />
                    </div>
                  </div>
                </div>
                <div v-if="filteredRecentBills.length === 0" class="text-center py-4 text-gray-500">
                  <i class="pi pi-info-circle text-lg mb-2"></i>
                  <p class="text-sm">No recent bills found for this account</p>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="locationStore.currentError" class="text-center py-16">
      <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
      <p class="text-red-600 mb-4">{{ locationStore.currentError }}</p>
      <Button label="Retry" @click="loadLocation" />
    </div>

    <!-- Account Detail Drawer -->
    <Drawer
      v-model:visible="showAccountDetail"
      header="Account Details"
      position="right"
      class="w-full md:w-96"
    >
      <div v-if="selectedAccount" class="space-y-4">
        <div>
          <h4 class="font-semibold text-lg">{{ selectedAccount.vendor_name }}</h4>
          <p class="text-sm text-gray-600">Account: {{ selectedAccount.account_number }}</p>
        </div>
        
        <div class="space-y-3">
          <div class="flex justify-between">
            <span>Status:</span>
            <Badge
              :value="selectedAccount.is_active ? 'Active' : 'Inactive'"
              :severity="selectedAccount.is_active ? 'success' : 'secondary'"
            />
          </div>
          <div class="flex justify-between">
            <span>Expected Amount:</span>
            <span class="font-medium">{{ formatCurrency(selectedAccount.expected_amount) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Last Bill Amount:</span>
            <span class="font-medium">{{ formatCurrency(selectedAccount.last_amount) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Bill Type:</span>
            <span>{{ selectedAccount.bill_type || 'N/A' }}</span>
          </div>
        </div>

        <div v-if="selectedAccount.billing_info" class="border-t pt-3">
          <h5 class="font-medium mb-2">Billing Information</h5>
          <div class="text-sm space-y-1">
            <div>{{ selectedAccount.billing_info.name_on_check }}</div>
            <div>{{ selectedAccount.billing_info.address }}</div>
          </div>
        </div>
      </div>
    </Drawer>

    <!-- Order Detail Drawer -->
    <Drawer
      v-model:visible="showOrderDetail"
      header="Order Details"
      position="right"
      class="!w-full md:!w-[800px] lg:!w-[900px]"
    >
      <div v-if="selectedOrder" class="space-y-4">
        <!-- Order Header -->
        <Card class="mb-4">
          <template #content>
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i class="pi pi-shopping-cart text-blue-600 text-xl"></i>
                </div>
                <div>
                  <h4 class="font-bold text-xl mb-1">Order #{{ selectedOrder.order_id }}</h4>
                  <p class="text-sm text-gray-600 mb-2">{{ selectedOrder.description }}</p>
                  <div class="flex items-center gap-2">
                    <Badge 
                      :value="selectedOrder.status" 
                      :severity="selectedOrder.status === 'ISP Installed' ? 'success' : 'warning'" 
                    />
                    <Badge 
                      :value="selectedOrder.archive_status" 
                      severity="secondary" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Service Information -->
        <Card>
          <template #header>
            <div class="p-4 pb-0">
              <h5 class="font-semibold text-lg flex items-center gap-2 mb-0">
                <i class="pi pi-info-circle text-blue-500"></i>
                Service Information
              </h5>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-field">
                <label class="form-label">Service Type</label>
                <div class="form-value">{{ selectedOrder.product }}</div>
              </div>
              <div class="form-field">
                <label class="form-label">Provider</label>
                <div class="form-value">{{ selectedOrder.provider }}</div>
              </div>
              <div class="form-field">
                <label class="form-label">Account Number</label>
                <div class="form-value font-mono">{{ selectedOrder.account_number?.trim() }}</div>
              </div>
              <div class="form-field">
                <label class="form-label">Stage</label>
                <div class="form-value">{{ selectedOrder.stage }}</div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Financial Information -->
        <Card v-if="selectedOrder.financial">
          <template #header>
            <div class="p-4 pb-0">
              <h5 class="font-semibold text-lg flex items-center gap-2 mb-0">
                <i class="pi pi-dollar text-green-500"></i>
                Financial Information
              </h5>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-field">
                <label class="form-label">Monthly Cost</label>
                <div class="form-value text-lg font-semibold text-green-600">
                  {{ formatCurrency(selectedOrder.financial.monthly_cost) }}
                </div>
              </div>
              <div class="form-field">
                <label class="form-label">Install Cost</label>
                <div class="form-value text-lg font-semibold text-blue-600">
                  {{ formatCurrency(selectedOrder.financial.install_cost) }}
                </div>
              </div>
              <div class="form-field">
                <label class="form-label">Term</label>
                <div class="form-value">{{ selectedOrder.financial.term_months }} months</div>
              </div>
              <div class="form-field">
                <label class="form-label">Cost Variance</label>
                <div class="form-value font-semibold" :class="selectedOrder.cost_variance > 0 ? 'text-red-600' : 'text-green-600'">
                  {{ formatCurrency(selectedOrder.cost_variance) }}
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Timeline Information -->
        <Card v-if="selectedOrder.timeline">
          <template #header>
            <div class="p-4 pb-0">
              <h5 class="font-semibold text-lg flex items-center gap-2 mb-0">
                <i class="pi pi-clock text-orange-500"></i>
                Timeline
              </h5>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-field">
                <label class="form-label">Ordered Date</label>
                <div class="form-value">{{ formatDate(selectedOrder.timeline.ordered_date) }}</div>
              </div>
              <div class="form-field">
                <label class="form-label">Install Date</label>
                <div class="form-value">{{ formatDate(selectedOrder.timeline.pending_install_date) }}</div>
              </div>
              <div class="form-field">
                <label class="form-label">Circuit Live Date</label>
                <div class="form-value">{{ formatDate(selectedOrder.timeline.circuit_live_date) }}</div>
              </div>
              <div class="form-field">
                <label class="form-label">Days to Complete</label>
                <div class="form-value">{{ selectedOrder.timeline.days_to_complete }} days</div>
              </div>
            </div>
          </template>
        </Card>

        <!-- TEM Integration -->
        <Card v-if="selectedOrder.tem_linkage">
          <template #header>
            <div class="p-4 pb-0">
              <h5 class="font-semibold text-lg flex items-center gap-2 mb-0">
                <i class="pi pi-link text-purple-500"></i>
                TEM Integration
              </h5>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-field">
                <label class="form-label">Link Status</label>
                <div class="form-value">
                  <Badge 
                    :value="selectedOrder.tem_linkage.status" 
                    :severity="selectedOrder.tem_linkage.status === 'Linked' ? 'success' : 'warning'"
                  />
                </div>
              </div>
              <div class="form-field">
                <label class="form-label">Match Type</label>
                <div class="form-value">{{ selectedOrder.tem_linkage.match_type }}</div>
              </div>
              <div class="form-field">
                <label class="form-label">TEM Account</label>
                <div class="form-value font-mono">{{ selectedOrder.tem_linkage.account_number }}</div>
              </div>
              <div class="form-field">
                <label class="form-label">TEM Monthly Cost</label>
                <div class="form-value font-semibold text-purple-600">
                  {{ formatCurrency(selectedOrder.tem_linkage.monthly_cost) }}
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Technical Details -->
        <Card v-if="selectedOrder.technical_details">
          <template #header>
            <div class="p-4 pb-0">
              <h5 class="font-semibold text-lg flex items-center gap-2 mb-0">
                <i class="pi pi-cog text-gray-500"></i>
                Technical Details
              </h5>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 gap-4">
              <div class="form-field">
                <label class="form-label">Bandwidth</label>
                <div class="form-value font-mono">{{ selectedOrder.technical_details.bandwidth }}</div>
              </div>
              <div class="form-field">
                <label class="form-label">Modem Information</label>
                <div class="form-value">{{ selectedOrder.technical_details.modem_info || 'Not provided' }}</div>
              </div>
              <div v-if="selectedOrder.technical_details.notes" class="form-field">
                <label class="form-label">Notes</label>
                <div class="form-value">{{ selectedOrder.technical_details.notes }}</div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Action Buttons -->
        <Card>
          <template #content>
            <div class="flex flex-col sm:flex-row gap-3">
              <Button
                v-if="!selectedOrder.is_linked"
                label="Link to TEM Account"
                icon="pi pi-link"
                class="flex-1"
                severity="secondary"
                outlined
                @click="showTemLinkDialog(selectedOrder)"
              />
              <Button
                label="View Full History"
                icon="pi pi-history"
                class="flex-1"
                outlined
                @click="viewOrderHistory(selectedOrder)"
              />
            </div>
          </template>
        </Card>
      </div>
    </Drawer>

    <!-- Cancellation Detail Drawer -->
    <Drawer
      v-model:visible="showCancellationDetail"
      header="Cancellation Details"
      position="right"
      class="!w-full md:!w-[800px] lg:!w-[900px]"
      v-if="selectedCancellation"
    >
      <div class="space-y-6">
        <!-- Cancellation Header -->
        <Card>
          <template #content>
            <div class="p-6">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <i class="pi pi-times-circle text-red-600 text-xl"></i>
                </div>
                <div>
                  <h4 class="font-bold text-xl mb-1">Cancellation #{{ selectedCancellation.cancellation_id }}</h4>
                  <p class="text-sm text-gray-600 mb-2">{{ selectedCancellation.confirmation_number }}</p>
                  <div class="flex items-center gap-2">
                    <Badge 
                      :value="selectedCancellation.status" 
                      :severity="selectedCancellation.status === 'Cancellation Complete' ? 'success' : 'warning'" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Service Information -->
        <Card>
          <template #header>
            <div class="p-4 pb-0">
              <h5 class="font-semibold text-lg flex items-center gap-2 mb-0">
                <i class="pi pi-info-circle text-blue-500"></i>
                Service Information
              </h5>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-field">
                <label class="form-label">Services Cancelled</label>
                <div class="form-value">{{ selectedCancellation.services_cancelled || selectedCancellation.product || 'N/A' }}</div>
              </div>
              <div class="form-field">
                <label class="form-label">Provider</label>
                <div class="form-value">{{ selectedCancellation.provider }}</div>
              </div>
              <div class="form-field">
                <label class="form-label">Account Number</label>
                <div class="form-value font-mono">{{ selectedCancellation.account_info?.clean_account_number || selectedCancellation.account_info?.raw_account_number || 'N/A' }}</div>
              </div>
              <div class="form-field">
                <label class="form-label">Confirmation Number</label>
                <div class="form-value font-mono">{{ selectedCancellation.confirmation_number }}</div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Timeline Information -->
        <Card v-if="selectedCancellation.dates">
          <template #header>
            <div class="p-4 pb-0">
              <h5 class="font-semibold text-lg flex items-center gap-2 mb-0">
                <i class="pi pi-clock text-orange-500"></i>
                Cancellation Timeline
              </h5>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-field">
                <label class="form-label">Submitted Date</label>
                <div class="form-value">{{ formatDate(selectedCancellation.dates.submitted) || 'Not provided' }}</div>
              </div>
              <div class="form-field">
                <label class="form-label">Due Date</label>
                <div class="form-value">{{ formatDate(selectedCancellation.dates.due) || 'Not provided' }}</div>
              </div>
              <div class="form-field">
                <label class="form-label">Billing End Date</label>
                <div class="form-value">{{ formatDate(selectedCancellation.dates.billing_end) || 'Not provided' }}</div>
              </div>
              <div class="form-field">
                <label class="form-label">Last Bill Received</label>
                <div class="form-value">{{ formatDate(selectedCancellation.dates.last_bill_received) || 'Not received' }}</div>
              </div>
            </div>
          </template>
        </Card>


        <!-- TEM Integration -->
        <Card v-if="selectedCancellation.tem_linkage">
          <template #header>
            <div class="p-4 pb-0">
              <h5 class="font-semibold text-lg flex items-center gap-2 mb-0">
                <i class="pi pi-link text-purple-500"></i>
                TEM Integration
              </h5>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-field">
                <label class="form-label">Link Status</label>
                <div class="form-value">
                  <Badge 
                    :value="selectedCancellation.tem_linkage.status" 
                    :severity="selectedCancellation.tem_linkage.status === 'Linked' ? 'success' : 'warning'"
                  />
                </div>
              </div>
              <div class="form-field">
                <label class="form-label">Match Confidence</label>
                <div class="form-value">{{ selectedCancellation.tem_linkage.match_confidence }}</div>
              </div>
              <div class="form-field">
                <label class="form-label">Linked TEM Account</label>
                <div class="form-value font-mono">{{ selectedCancellation.tem_linkage.linked_account?.account_number || 'N/A' }}</div>
              </div>
              <div class="form-field">
                <label class="form-label">TEM Monthly Expected</label>
                <div class="form-value font-semibold text-purple-600">
                  {{ formatCurrency(selectedCancellation.tem_linkage.linked_account?.monthly_expected || 0) }}
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Additional TEM Accounts -->
        <Card v-if="selectedCancellation.tem_linkage?.all_location_tem_accounts?.length">
          <template #header>
            <div class="p-4 pb-0">
              <h5 class="font-semibold text-lg flex items-center gap-2 mb-0">
                <i class="pi pi-list text-blue-500"></i>
                All Location TEM Accounts
              </h5>
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <div 
                v-for="account in selectedCancellation.tem_linkage.all_location_tem_accounts" 
                :key="account.vendor_id"
                class="p-4 border rounded-lg"
                :class="account.is_match ? 'border-green-200 bg-green-50' : 'border-gray-200'"
              >
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="form-field">
                    <label class="form-label">Account Number</label>
                    <div class="form-value font-mono">{{ account.account_number }}</div>
                  </div>
                  <div class="form-field">
                    <label class="form-label">Monthly Cost</label>
                    <div class="form-value font-semibold">{{ formatCurrency(account.monthly) }}</div>
                  </div>
                  <div class="form-field">
                    <label class="form-label">Match Status</label>
                    <div class="form-value">
                      <Badge 
                        :value="account.is_match ? `Match (${account.match_type})` : 'No Match'" 
                        :severity="account.is_match ? 'success' : 'secondary'"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Notes -->
        <Card v-if="selectedCancellation.notes">
          <template #header>
            <div class="p-4 pb-0">
              <h5 class="font-semibold text-lg flex items-center gap-2 mb-0">
                <i class="pi pi-file-edit text-gray-500"></i>
                Notes & Comments
              </h5>
            </div>
          </template>
          <template #content>
            <div class="form-field">
              <div class="form-value bg-gray-50 p-4 rounded-lg">{{ selectedCancellation.notes }}</div>
            </div>
          </template>
        </Card>

        <!-- Action Buttons -->
        <Card>
          <template #content>
            <div class="flex flex-col sm:flex-row gap-3">
              <Button
                v-if="!selectedCancellation.is_linked"
                label="Link to TEM Account"
                icon="pi pi-link"
                class="flex-1"
                severity="secondary"
                outlined
                @click="showTemLinkDialog(selectedCancellation)"
              />
              <Button
                label="View Full History"
                icon="pi pi-history"
                class="flex-1"
                outlined
                @click="viewCancellationHistory(selectedCancellation)"
              />
            </div>
          </template>
        </Card>
      </div>
    </Drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Badge from 'primevue/badge';
import Select from 'primevue/select';
import ProgressSpinner from 'primevue/progressspinner';
import Drawer from 'primevue/drawer';
import Chart from 'primevue/chart';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';
import TEMDataTable from '@/components/tem/shared/TEMDataTable.vue';
import { useTEMLocationStore } from '@/stores/tem/locationStore';

// Composables
const route = useRoute();
const router = useRouter();
const toast = useToast();
const locationStore = useTEMLocationStore();

// State
const showAccountDetail = ref(false);
const selectedAccount = ref(null);
const showOrderDetail = ref(false);
const selectedOrder = ref(null);
const showCancellationDetail = ref(false);
const selectedCancellation = ref(null);
const selectedVendorFilter = ref(null);
const selectedMonthsFilter = ref(12);
const selectedAccountIndex = ref(0);
const accordionState = ref(null); // Accordion closed by default
const selectedOrdersTimeFilter = ref(12);
const selectedCancellationsTimeFilter = ref(12);

// Filter options
const monthOptions = [
  { label: '6mo', value: 6 },
  { label: '12mo', value: 12 },
  { label: '18mo', value: 18 },
  { label: '24mo', value: 24 }
];

const timeFrameOptions = [
  { label: '6 Months', value: 6 },
  { label: '12 Months', value: 12 },
  { label: '2 Years', value: 24 },
  { label: '3 Years', value: 36 },
  { label: '5 Years', value: 60 }
];

// Computed
const customerId = computed(() => route.params.customerId);
const locationId = computed(() => route.params.locationId);

const vendorOptions = computed(() => {
  const vendors = [...new Set(locationStore.locationAccounts.map(acc => acc.vendor_name))];
  return [
    { label: 'All Vendors', value: null },
    ...vendors.map(vendor => ({ label: vendor, value: vendor }))
  ];
});

const filteredAccounts = computed(() => {
  if (!selectedVendorFilter.value) return locationStore.locationAccounts;
  return locationStore.locationAccounts.filter(acc => acc.vendor_name === selectedVendorFilter.value);
});

const vendorGroups = computed(() => locationStore.getAccountsByVendor());
const vendorCount = computed(() => Object.keys(vendorGroups.value).length);
const varianceAccounts = computed(() => locationStore.getVarianceAnalysis());

// Primary account (highest expected amount or first active account)
const primaryAccount = computed(() => {
  const accounts = locationStore.locationAccounts;
  if (!accounts || accounts.length === 0) return null;
  
  // Find the account with highest expected amount, or first active account
  const activeAccounts = accounts.filter(acc => acc.is_active);
  if (activeAccounts.length === 0) return accounts[0];
  
  return activeAccounts.reduce((max, acc) => 
    parseFloat(acc.expected_amount || 0) > parseFloat(max.expected_amount || 0) ? acc : max
  );
});

// Current account to display (for single account or selected tab account)
const currentDisplayAccount = computed(() => {
  const accounts = locationStore.locationAccounts;
  if (!accounts || accounts.length === 0) return null;
  
  // For single account, use that account
  if (accounts.length === 1) return accounts[0];
  
  // For multiple accounts, use the selected tab account
  return accounts[selectedAccountIndex.value] || accounts[0];
});

// Filtered recent bills based on selected account
const filteredRecentBills = computed(() => {
  if (!locationStore.recentBills) return [];
  
  // If single account or no account selection, show all bills
  if (locationStore.locationAccounts.length <= 1 || !currentDisplayAccount.value) {
    return locationStore.recentBills;
  }
  
  // Filter bills by current account's provider/vendor
  return locationStore.recentBills.filter(bill => 
    bill.vendor_name === currentDisplayAccount.value.provider_name ||
    bill.account_number === currentDisplayAccount.value.account_number
  );
});

// Bill statistics for the middle column
const billStats = computed(() => {
  const bills = filteredRecentBills.value;
  if (!bills || bills.length === 0) {
    return {
      minAmount: '$0.00',
      avgAmount: '$0.00',
      maxAmount: '$0.00',
      expectedAmount: '$0.00',
      maxAmountRaw: 0
    };
  }
  
  const amounts = bills.map(bill => parseFloat(bill.amount || 0));
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  const avg = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
  
  // For multiple accounts, use the current account's expected amount
  const expected = locationStore.locationAccounts.length > 1 && currentDisplayAccount.value
    ? parseFloat(currentDisplayAccount.value.expected_amount || 0)
    : locationStore.accountMetrics.totalExpected;
  
  return {
    minAmount: formatCurrency(min),
    avgAmount: formatCurrency(avg),
    maxAmount: formatCurrency(max),
    expectedAmount: formatCurrency(expected),
    maxAmountRaw: max
  };
});

// Chart data for bill trends - account-specific when multiple accounts
const billChartData = computed(() => {
  if (!locationStore.locationBillsTimeline?.data) return [];
  
  const monthlyData = locationStore.locationBillsTimeline.data;
  
  // If single account or no account selection, use all location data
  if (locationStore.locationAccounts.length <= 1 || !currentDisplayAccount.value) {
    return monthlyData
      .map(month => ({
        month: month.month_name,
        monthShort: month.month_name.split(' ')[0].substring(0, 3),
        amount: parseFloat(month.total_amount || 0)
      }))
      .sort((a, b) => new Date(a.month) - new Date(b.month))
      .reverse(); // Most recent first
  }
  
  // For multiple accounts, filter bills by current account
  const accountBills = locationStore.locationBills.filter(bill => 
    bill.vendor_name === currentDisplayAccount.value.provider_name ||
    bill.account_number === currentDisplayAccount.value.account_number
  );
  
  // Group bills by month for the selected account
  const monthlyAccountData = {};
  accountBills.forEach(bill => {
    const billDate = new Date(bill.invoice_date || bill.service_date);
    const monthKey = billDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    
    if (!monthlyAccountData[monthKey]) {
      monthlyAccountData[monthKey] = {
        month: monthKey,
        monthShort: billDate.toLocaleDateString('en-US', { month: 'short' }),
        amount: 0,
        billCount: 0
      };
    }
    
    monthlyAccountData[monthKey].amount += parseFloat(bill.amount || 0);
    monthlyAccountData[monthKey].billCount += 1;
  });
  
  return Object.values(monthlyAccountData)
    .sort((a, b) => new Date(a.month) - new Date(b.month))
    .reverse(); // Most recent first
});

// Chart.js data and options
const chartData = computed(() => {
  const data = billChartData.value.slice().reverse(); // Chronological order for chart
  
  return {
    labels: data.map(item => item.monthShort),
    datasets: [
      {
        label: 'Bill Amount',
        data: data.map(item => item.amount),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6
      },
      {
        label: 'Expected',
        data: data.map(() => {
          // For multiple accounts, use current account's expected amount
          if (locationStore.locationAccounts.length > 1 && currentDisplayAccount.value) {
            return parseFloat(currentDisplayAccount.value.expected_amount || 0);
          }
          // For single account, use total location expected
          return locationStore.accountMetrics.totalExpected;
        }),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0
      }
    ]
  };
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false
  },
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 20
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: '#3B82F6',
      borderWidth: 1,
      callbacks: {
        label: function(context) {
          return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: true,
        color: 'rgba(0, 0, 0, 0.1)'
      },
      ticks: {
        color: '#6B7280'
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        display: true,
        color: 'rgba(0, 0, 0, 0.1)'
      },
      ticks: {
        color: '#6B7280',
        callback: function(value) {
          return '$' + value.toLocaleString();
        }
      }
    }
  }
}));

// Flattened orders data for DataTable
const flattenedOrdersData = computed(() => {
  return locationStore.locationOrders.map(order => ({
    // Keep original nested data for drawer
    _original: order,
    
    // Flatten for table display
    order_id: order.order_id,
    ticket_id: order.ticket_id,
    product: order.product,
    provider: order.provider,
    account_number: order.account_number,
    status: order.status,
    stage: order.stage,
    monthly_cost: order.financial?.monthly_cost || 0,
    install_cost: order.financial?.install_cost || 0,
    term_months: order.financial?.term_months || 0,
    ordered_date: order.timeline?.ordered_date || null,
    circuit_live_date: order.timeline?.circuit_live_date || null,
    days_to_complete: order.timeline?.days_to_complete || 0,
    archive_status: order.archive_status,
    is_linked: order.is_linked,
    is_active: order.is_active,
    is_completed: order.is_completed,
    cost_variance: order.cost_variance,
    match_type: order.tem_linkage?.match_type || 'Not Linked',
    tem_status: order.tem_linkage?.status || 'Unlinked',
    bandwidth: order.technical_details?.bandwidth || 'N/A'
  }));
});

// Flattened cancellations data for DataTable
const flattenedCancellationsData = computed(() => {
  return locationStore.locationCancellations.map(cancellation => ({
    // Keep original nested data for drawer
    _original: cancellation,
    
    // Flatten for table display
    cancellation_id: cancellation.cancellation_id,
    confirmation_number: cancellation.confirmation_number,
    provider: cancellation.provider,
    status: cancellation.status,
    services_cancelled: cancellation.services_cancelled || 'N/A',
    product: cancellation.product || cancellation.services_cancelled || 'N/A',
    account_number: cancellation.account_info?.clean_account_number || cancellation.account_info?.raw_account_number || 'N/A',
    submitted_date: cancellation.dates?.submitted || null,
    due_date: cancellation.dates?.due || null,
    billing_end_date: cancellation.dates?.billing_end || null,
    is_linked: cancellation.is_linked,
    match_confidence: cancellation.tem_linkage?.match_confidence || 'Not Linked',
    tem_status: cancellation.tem_linkage?.status || 'Unlinked',
    tem_monthly_expected: cancellation.tem_linkage?.linked_account?.monthly_expected || 0,
    has_confirmation: cancellation.has_confirmation,
    has_billing_end: cancellation.has_billing_end,
    is_recent: cancellation.is_recent
  }));
});

// Orders DataTable Configuration
const ordersColumns = [
  { field: 'product', header: 'Service', sortable: true },
  { field: 'provider', header: 'Provider', sortable: true },
  { field: 'status', header: 'Status', type: 'status', sortable: true },
  { field: 'monthly_cost', header: 'Monthly Cost', type: 'currency', sortable: true },
  { field: 'install_cost', header: 'Install Cost', type: 'currency', sortable: true },
  { field: 'ordered_date', header: 'Order Date', type: 'date', sortable: true },
  { field: 'is_linked', header: 'TEM Link', type: 'boolean', sortable: true, width: '100px' },
  { field: 'cost_variance', header: 'Cost Variance', type: 'currency', sortable: true, width: '120px' },
  { field: 'match_type', header: 'Match Type', sortable: true, width: '150px' },
  {
    type: 'actions',
    header: 'Actions',
    actions: [
      { name: 'view', icon: 'pi pi-eye', label: 'View Details', outlined: true },
      { name: 'link', icon: 'pi pi-link', label: 'Link to TEM', outlined: true, condition: (row) => !row.is_linked }
    ]
  }
];

// Cancellations DataTable Configuration
const cancellationsColumns = [
  { field: 'confirmation_number', header: 'Confirmation #', sortable: true },
  { field: 'provider', header: 'Provider', sortable: true },
  { field: 'services_cancelled', header: 'Services', sortable: true },
  { field: 'status', header: 'Status', type: 'status', sortable: true },
  { field: 'account_number', header: 'Account #', sortable: true },
  { field: 'submitted_date', header: 'Submitted', type: 'date', sortable: true },
  { field: 'due_date', header: 'Due Date', type: 'date', sortable: true },
  { field: 'billing_end_date', header: 'Billing End', type: 'date', sortable: true },
  { field: 'tem_monthly_expected', header: 'TEM Monthly', type: 'currency', sortable: true },
  { field: 'is_linked', header: 'TEM Link', type: 'boolean', sortable: true, width: '100px' },
  { field: 'match_confidence', header: 'Match Confidence', sortable: true, width: '150px' },
  {
    type: 'actions',
    header: 'Actions',
    actions: [
      { name: 'view', icon: 'pi pi-eye', label: 'View Details', outlined: true },
      { name: 'link', icon: 'pi pi-link', label: 'Link to TEM', outlined: true, condition: (row) => !row.is_linked }
    ]
  }
];

// Methods
const loadLocation = async () => {
  try {
    await locationStore.fetchLocationDetail(customerId.value, locationId.value);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load location details',
      life: 3000
    });
  }
};

const selectAccount = (account) => {
  selectedAccount.value = account;
  showAccountDetail.value = true;
};

const onVendorFilterChange = async () => {
  if (selectedVendorFilter.value) {
    await locationStore.fetchLocationAccounts(customerId.value, locationId.value, {
      vendor_id: selectedVendorFilter.value
    });
  } else {
    await locationStore.fetchLocationAccounts(customerId.value, locationId.value);
  }
};

const onMonthsFilterChange = async () => {
  await locationStore.fetchLocationBillsTimeline(customerId.value, locationId.value, {
    months: selectedMonthsFilter.value
  });
};

const onOrdersTimeFilterChange = async () => {
  try {
    await locationStore.fetchLocationOrders(customerId.value, locationId.value, {
      months: selectedOrdersTimeFilter.value
    });
  } catch (error) {
    console.error('Failed to load orders with new time filter:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load orders data',
      life: 3000
    });
  }
};

const onCancellationsTimeFilterChange = async () => {
  try {
    await locationStore.fetchLocationCancellations(customerId.value, locationId.value, {
      months: selectedCancellationsTimeFilter.value
    });
  } catch (error) {
    console.error('Failed to load cancellations with new time filter:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load cancellations data',
      life: 3000
    });
  }
};

const exportLocationData = async () => {
  try {
    // Implementation for export
    toast.add({
      severity: 'info',
      summary: 'Export',
      detail: 'Export functionality coming soon',
      life: 3000
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to export location data',
      life: 3000
    });
  }
};

const getAccountVariance = (account) => {
  const expected = parseFloat(account.expected_amount || 0);
  const actual = parseFloat(account.last_amount || 0);
  const variance = actual - expected;
  const variancePercent = expected > 0 ? (variance / expected) * 100 : 0;
  
  return {
    variance,
    variancePercent,
    hasVariance: Math.abs(variancePercent) > 5
  };
};

const getVarianceColor = (account) => {
  const variance = getAccountVariance(account);
  if (!variance.hasVariance) return 'text-gray-900 font-semibold';
  if (variance.variancePercent > 10) return 'text-red-600 font-semibold';
  if (variance.variancePercent > 5) return 'text-yellow-600 font-semibold';
  return 'text-gray-900 font-semibold';
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

const onOrderAction = (event) => {
  const { action, data } = event;
  
  switch (action) {
    case 'view':
      // Open drawer with detailed order information
      openOrderDetail(data);
      break;
    case 'link':
      // Open TEM linking dialog for unlinked orders
      showTemLinkDialog(data);
      break;
  }
};

const onCancellationAction = (event) => {
  const { action, data } = event;
  
  switch (action) {
    case 'view':
      // Open drawer with detailed cancellation information
      openCancellationDetail(data);
      break;
    case 'link':
      // Open TEM linking dialog for unlinked cancellations
      showTemLinkDialog(data);
      break;
  }
};

const openOrderDetail = (order) => {
  // Use the original nested data for drawer display
  selectedOrder.value = order._original || order;
  showOrderDetail.value = true;
};

const openCancellationDetail = (cancellation) => {
  // Use the original nested data for drawer display
  selectedCancellation.value = cancellation._original || cancellation;
  showCancellationDetail.value = true;
};

const showTemLinkDialog = (order) => {
  // Placeholder for TEM linking functionality
  toast.add({
    severity: 'info',
    summary: 'TEM Linking',
    detail: `TEM linking for order ${order.order_id || 'N/A'} - Feature coming soon`,
    life: 3000
  });
};

const viewOrderHistory = (order) => {
  // Placeholder for order history functionality
  toast.add({
    severity: 'info',
    summary: 'Order History',
    detail: `Full history for order ${order.order_id || 'N/A'} - Feature coming soon`,
    life: 3000
  });
};

const viewCancellationHistory = (cancellation) => {
  // Placeholder for cancellation history functionality
  toast.add({
    severity: 'info',
    summary: 'Cancellation History',
    detail: `Full history for cancellation ${cancellation.cancellation_id || 'N/A'} - Feature coming soon`,
    life: 3000
  });
};

// Load orders data when component mounts
const loadOrders = async () => {
  try {
    await locationStore.fetchLocationOrders(customerId.value, locationId.value);
  } catch (error) {
    console.error('Failed to load orders:', error);
  }
};

// Load cancellations data when component mounts
const loadCancellations = async () => {
  try {
    await locationStore.fetchLocationCancellations(customerId.value, locationId.value);
  } catch (error) {
    console.error('Failed to load cancellations:', error);
  }
};

// Watchers
watch(() => selectedMonthsFilter.value, () => {
  locationStore.updateBillFilters({ months: selectedMonthsFilter.value });
});

// Lifecycle
onMounted(async () => {
  await loadLocation();
  await loadOrders();
  await loadCancellations();
});
</script>

<style scoped>
.tem-location-detail {
  padding: 1.5rem;
  min-height: 100vh;
  background: var(--surface-ground);
}

.page-header h1 {
  font-weight: 700;
}

:deep(.p-card-content) {
  padding: 0;
}

:deep(.p-card-header) {
  padding: 0;
}

:deep(.p-drawer-content) {
  padding: 1.5rem;
}

/* Professional form field styling */
.form-field {
  @apply flex flex-col gap-1;
}

.form-label {
  @apply text-sm font-medium text-gray-600 uppercase tracking-wide;
  letter-spacing: 0.05em;
}

.form-value {
  @apply text-base text-gray-900 py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg;
  min-height: 40px;
  display: flex;
  align-items: center;
}

.form-value.font-mono {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
}
</style>