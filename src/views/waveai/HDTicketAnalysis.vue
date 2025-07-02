<template>
    <div class="hd-ticket-analysis p-2 md:p-4 lg:p-6">
        <h1 class="text-2xl md:text-3xl font-bold mb-2 md:mb-4">HD Ticket Analysis</h1>
        <p class="text-gray-600 mb-6 md:mb-8">Enter a ticket number to analyze help desk tickets with AI-powered insights</p>

        <!-- Search Panel -->
        <Card class="mb-6 md:mb-8">
            <template #content>
                <!-- Direct Ticket ID Entry -->
                <div class="mb-6">
                    <label for="ticketInput" class="font-medium block mb-2">Enter Ticket ID:</label>
                    <div class="flex flex-wrap gap-2">
                        <InputGroup class="flex-1 min-w-[250px]">
                            <InputGroupAddon>
                                <i class="pi pi-search"></i>
                            </InputGroupAddon>
                            <InputText 
                                id="ticketInput" 
                                v-model="ticketInput" 
                                placeholder="Enter ticket number(s)..." 
                                class="w-full" 
                                @keyup.enter="searchTicket" />
                        </InputGroup>
                        <Button 
                            label="Search" 
                            icon="pi pi-search" 
                            @click="searchTicket" 
                            :loading="isSearching" />
                    </div>
                    <small class="text-gray-500 mt-2 block">
                        Enter one or more comma-separated ticket IDs for AI analysis.
                    </small>
                </div>
            </template>
        </Card>

        <!-- Results Section -->
        <div v-if="hasSearched && !isSearching" class="grid">
            <div class="col-12">
                <Card>
                    <template #content>
                        <div v-if="searchResults.length > 0">
                            <h5 class="mb-4">Analysis Results for Ticket(s): {{ searchedTicketIds }}</h5>
                            
                            <!-- Ticket Details Table -->
                            <DataTable 
                                :value="searchResults" 
                                class="p-datatable-sm mb-6"
                                responsiveLayout="scroll"
                            >
                                <Column field="id" header="Ticket ID" sortable></Column>
                                <Column field="subject" header="Subject"></Column>
                                <Column field="priority" header="Priority">
                                    <template #body="slotProps">
                                        <Tag 
                                            :value="slotProps.data.priority" 
                                            :severity="getPrioritySeverity(slotProps.data.priority)"
                                        />
                                    </template>
                                </Column>
                                <Column field="status" header="Status">
                                    <template #body="slotProps">
                                        <Tag 
                                            :value="slotProps.data.status" 
                                            :severity="getStatusSeverity(slotProps.data.status)"
                                        />
                                    </template>
                                </Column>
                                <Column field="createdAt" header="Created" sortable></Column>
                            </DataTable>

                            <!-- AI Analysis Section -->
                            <div class="grid">
                                <div class="col-12 lg:col-8">
                                    <div class="p-4 bg-blue-50 border-round border-blue-200 border-1 mb-4">
                                        <h6 class="text-blue-800 mb-3">
                                            <i class="pi pi-brain mr-2"></i>
                                            AI Analysis Results
                                        </h6>
                                        <div class="text-blue-700">
                                            <p class="mb-2"><strong>Pattern Analysis:</strong> Analyzing ticket patterns and trends...</p>
                                            <p class="mb-2"><strong>Resolution Prediction:</strong> Estimated resolution time based on historical data...</p>
                                            <p class="mb-0"><strong>Priority Assessment:</strong> AI-evaluated priority and urgency levels...</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 lg:col-4">
                                    <div class="p-4 bg-green-50 border-round border-green-200 border-1">
                                        <h6 class="text-green-800 mb-3">
                                            <i class="pi pi-lightbulb mr-2"></i>
                                            Recommendations
                                        </h6>
                                        <div class="text-green-700">
                                            <p class="mb-2">• Review similar resolved tickets</p>
                                            <p class="mb-2">• Consider escalation if needed</p>
                                            <p class="mb-0">• Apply standard resolution procedures</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="text-center py-8">
                            <i class="pi pi-info-circle text-4xl text-gray-400 mb-3"></i>
                            <p class="text-gray-500 text-lg">No tickets found for the specified ID(s)</p>
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Open Tickets Table -->
        <div class="grid mt-6">
            <div class="col-12">
                <Card>
                    <template #content>
                        <!-- Queue Statistics Header -->
                        <div class="mb-4">
                            <div class="flex justify-between items-center mb-3">
                                <h5 class="m-0">Helpdesk Tier 1 Queue</h5>
                                <Button 
                                    icon="pi pi-refresh" 
                                    text 
                                    size="small" 
                                    v-tooltip.top="'Refresh Data'" 
                                    severity="secondary" 
                                    :loading="helpdeskStore.loading" 
                                    @click="refreshOpenTickets" />
                            </div>
                            
                            <!-- Performance Metrics -->
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-inbox text-blue-600 text-lg"></i>
                                        <div>
                                            <div class="text-2xl font-bold text-blue-700 dark:text-blue-300">{{ helpdeskStore.totalOpenTickets }}</div>
                                            <div class="text-sm text-blue-600 dark:text-blue-400">Total Open</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-exclamation-triangle text-red-600 text-lg"></i>
                                        <div>
                                            <div class="text-2xl font-bold text-red-700 dark:text-red-300">{{ overdueCount }}</div>
                                            <div class="text-sm text-red-600 dark:text-red-400">Overdue</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-clock text-orange-600 text-lg"></i>
                                        <div>
                                            <div class="text-2xl font-bold text-orange-700 dark:text-orange-300">{{ dueTodayCount }}</div>
                                            <div class="text-sm text-orange-600 dark:text-orange-400">Due Today</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-user-minus text-yellow-600 text-lg"></i>
                                        <div>
                                            <div class="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{{ unassignedCount }}</div>
                                            <div class="text-sm text-yellow-600 dark:text-yellow-400">Unassigned</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Customer Statistics Panel -->
                            <div class="mb-4">
                                <Button 
                                    label="Top Customers by Tickets" 
                                    icon="pi pi-chart-bar"
                                    severity="secondary"
                                    size="small"
                                    text
                                    @click="toggleCustomerStats"
                                    class="customer-stats-toggle" />
                                <Popover ref="customerStatsPanel" class="customer-stats-panel">
                                    <div class="p-4" style="min-width: 350px;">
                                        <h6 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4">
                                            Top 10 Customers by Open Tickets
                                        </h6>
                                        <div class="space-y-3">
                                            <div 
                                                v-for="(customer, index) in helpdeskStore.topCustomersByTickets" 
                                                :key="customer.customerName"
                                                class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
                                                <div class="flex items-center gap-3">
                                                    <Badge 
                                                        :value="index + 1" 
                                                        :severity="index < 3 ? 'warning' : 'secondary'"
                                                        class="font-bold" />
                                                    <div>
                                                        <div class="font-medium text-surface-900 dark:text-surface-0">
                                                            {{ customer.customerName }}
                                                        </div>
                                                        <div class="text-xs text-surface-500 dark:text-surface-400">
                                                            {{ ((customer.ticketCount / helpdeskStore.totalOpenTickets) * 100).toFixed(1) }}% of total tickets
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="text-right">
                                                    <div class="text-lg font-bold text-surface-900 dark:text-surface-0">
                                                        {{ customer.ticketCount }}
                                                    </div>
                                                    <div class="text-xs text-surface-500 dark:text-surface-400">
                                                        tickets
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-if="helpdeskStore.topCustomersByTickets.length === 0" class="text-center py-4">
                                            <i class="pi pi-info-circle text-2xl text-surface-300 dark:text-surface-600 mb-2"></i>
                                            <p class="text-surface-500 dark:text-surface-400">No customer data available</p>
                                        </div>
                                    </div>
                                </Popover>
                            </div>

                            <!-- Quick Filter Buttons -->
                            <div class="flex flex-wrap gap-2 mb-4">
                                <Button 
                                    label="All Tickets" 
                                    :severity="activeQuickFilter === 'all' ? 'primary' : 'secondary'" 
                                    size="small" 
                                    @click="applyQuickFilter('all')" />
                                <Button 
                                    label="Unassigned" 
                                    :severity="activeQuickFilter === 'unassigned' ? 'primary' : 'secondary'" 
                                    size="small" 
                                    icon="pi pi-user-minus"
                                    @click="applyQuickFilter('unassigned')" />
                                <Button 
                                    label="Due Today" 
                                    :severity="activeQuickFilter === 'due-today' ? 'primary' : 'secondary'" 
                                    size="small" 
                                    icon="pi pi-clock"
                                    @click="applyQuickFilter('due-today')" />
                                <Button 
                                    label="Overdue" 
                                    :severity="activeQuickFilter === 'overdue' ? 'primary' : 'secondary'" 
                                    size="small" 
                                    icon="pi pi-exclamation-triangle"
                                    @click="applyQuickFilter('overdue')" />
                                <Button 
                                    label="High Priority" 
                                    :severity="activeQuickFilter === 'high-priority' ? 'primary' : 'secondary'" 
                                    size="small" 
                                    icon="pi pi-flag-fill"
                                    @click="applyQuickFilter('high-priority')" />
                            </div>
                        </div>
                        
                        <DataTable 
                            :value="filteredTickets" 
                            dataKey="ticketId"
                            :loading="helpdeskStore.loading" 
                            :rowHover="true" 
                            stripedRows
                            filterDisplay="menu" 
                            :filters="openTicketsFilters"
                            :globalFilterFields="['ticketId', 'subject', 'requestor', 'customerName', 'owner', 'priority', 'status']"
                            :globalFilter="globalFilter"
                            tableStyle="min-width: 50rem"
                            :scrollable="true" 
                            scrollHeight="650px"
                            :virtualScrollerOptions="filteredTickets?.length > 20 ? { itemSize: 75, lazy: false } : null"
                            responsiveLayout="scroll"
                            showGridlines
                            :resizableColumns="true"
                            columnResizeMode="fit"
                            stateStorage="session"
                            stateKey="hd-open-tickets-table-state"
                            :expandedRows="expandedRows"
                            @update:expandedRows="expandedRows = $event"
                            v-model:expandedRows="expandedRows"
                            :selection="selectedTickets"
                            @update:selection="selectedTickets = $event"
                            selectionMode="multiple"
                            :metaKeySelection="false"
                            class="helpdesk-queue-table"
                            :rowClass="getTicketRowClass"
                            sortField="priority"
                            :sortOrder="-1">
                            
                            <template #header>
                                <div class="flex justify-between items-center">
                                    <div class="flex items-center gap-4">
                                        <span class="text-lg font-semibold">{{ helpdeskStore.totalOpenTickets }} Open Tickets</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <IconField iconPosition="left">
                                            <InputIcon class="pi pi-search" />
                                            <InputText 
                                                v-model="globalFilter" 
                                                placeholder="Search tickets..." 
                                                class="w-64" />
                                        </IconField>
                                    </div>
                                </div>
                            </template>

                            <Column :expander="true" headerStyle="width: 3rem" />

                            <Column field="ticketId" header="Ticket #" style="min-width: 8rem" sortable>
                                <template #body="slotProps">
                                    <div class="flex items-center gap-2">
                                        <div class="flex items-center gap-2 bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded">
                                            <i class="pi pi-ticket text-blue-500 text-sm"></i>
                                            <span class="font-mono font-bold text-surface-900 dark:text-surface-0">{{ slotProps.data.ticketId }}</span>
                                        </div>
                                        <div class="flex items-center gap-1">
                                            <div v-if="isTicketOverdue(slotProps.data)" class="w-2 h-2 bg-red-500 rounded-full animate-pulse" v-tooltip.top="'Overdue'"></div>
                                            <div v-else-if="isTicketDueToday(slotProps.data)" class="w-2 h-2 bg-orange-500 rounded-full" v-tooltip.top="'Due Today'"></div>
                                            <div v-if="slotProps.data.iswatched" class="text-blue-500 text-xs">
                                                <i class="pi pi-eye" v-tooltip.top="'Watched'"></i>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                                <template #filter="{ filterModel }">
                                    <InputText 
                                        :modelValue="filterModel.value" 
                                        @update:modelValue="filterModel.value = $event" 
                                        type="text" 
                                        placeholder="Search by ticket #" 
                                        class="p-column-filter" />
                                </template>
                            </Column>

                            <Column field="status" header="Status" style="min-width: 6rem" sortable>
                                <template #body="slotProps">
                                    <Tag 
                                        :value="slotProps.data.status" 
                                        :class="getStatusClass(slotProps.data.status)"
                                        class="font-medium status-tag" />
                                </template>
                                <template #filter="{ filterModel }">
                                    <Select 
                                        :modelValue="filterModel.value" 
                                        @update:modelValue="filterModel.value = $event" 
                                        :options="['Open', 'Pending', 'In Progress', 'On Hold']" 
                                        placeholder="Select Status" 
                                        class="p-column-filter" 
                                        showClear />
                                </template>
                            </Column>

                            <Column field="type" header="Type" style="min-width: 8rem" sortable>
                                <template #body="slotProps">
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-tag text-gray-500 text-sm"></i>
                                        <span class="text-surface-700 dark:text-surface-300">{{ slotProps.data.type }}</span>
                                    </div>
                                </template>
                            </Column>

                            <Column field="subject" header="Subject" style="min-width: 20rem">
                                <template #body="slotProps">
                                    <div class="max-w-xs overflow-hidden text-ellipsis">
                                        <span class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.subject }}</span>
                                    </div>
                                </template>
                                <template #filter="{ filterModel }">
                                    <InputText 
                                        :modelValue="filterModel.value" 
                                        @update:modelValue="filterModel.value = $event" 
                                        type="text" 
                                        placeholder="Search subject..." 
                                        class="p-column-filter" />
                                </template>
                            </Column>

                            <Column field="requestor" header="Requestor" style="min-width: 12rem" sortable>
                                <template #body="slotProps">
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-user text-gray-500 text-sm"></i>
                                        <span class="text-surface-700 dark:text-surface-300">{{ slotProps.data.requestor }}</span>
                                    </div>
                                </template>
                            </Column>

                            <Column field="customerName" header="Customer" style="min-width: 14rem" sortable>
                                <template #body="slotProps">
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-building text-blue-500 text-sm"></i>
                                        <span class="text-surface-900 dark:text-surface-0 font-medium">{{ slotProps.data.customerName }}</span>
                                    </div>
                                </template>
                                <template #filter="{ filterModel }">
                                    <InputText 
                                        :modelValue="filterModel.value" 
                                        @update:modelValue="filterModel.value = $event" 
                                        type="text" 
                                        placeholder="Search customer..." 
                                        class="p-column-filter" />
                                </template>
                            </Column>

                            <Column field="lastActivity" header="Last Activity" style="min-width: 11rem" sortable>
                                <template #body="slotProps">
                                    <div class="flex items-center gap-2">
                                        <div class="flex items-center gap-1">
                                            <i class="pi pi-clock text-gray-500 text-xs"></i>
                                            <span class="font-medium text-surface-900 dark:text-surface-0 text-sm">
                                                {{ getTimeAgo(slotProps.data.lastActivity) }}
                                            </span>
                                        </div>
                                        <div v-if="isStaleTicket(slotProps.data)" class="w-2 h-2 bg-red-500 rounded-full animate-pulse" v-tooltip.top="'Stale - No activity for > 24h'"></div>
                                    </div>
                                    <div class="text-xs text-surface-500 dark:text-surface-400 mt-1">
                                        {{ formatTimestamp(slotProps.data.lastActivity, 'short') }}
                                    </div>
                                </template>
                            </Column>

                            <Column field="dueTime" header="Due Date" style="min-width: 10rem" sortable>
                                <template #body="slotProps">
                                    <div class="flex flex-col">
                                        <span class="text-surface-900 dark:text-surface-0 text-sm">
                                            {{ formatTimestamp(slotProps.data.dueTime) }}
                                        </span>
                                        <span class="text-xs" :class="getDueTimeClass(slotProps.data.dueTime)">
                                            {{ getDueTimeStatus(slotProps.data.dueTime) }}
                                        </span>
                                    </div>
                                </template>
                            </Column>

                            <Column header="Action" headerStyle="width: 8rem" bodyStyle="text-align: center">
                                <template #body="slotProps">
                                    <div class="flex justify-center gap-1">
                                        <Button 
                                            icon="pi pi-eye" 
                                            size="small" 
                                            text 
                                            rounded 
                                            severity="info"
                                            v-tooltip.top="'View Ticket'"
                                            @click="viewTicket(slotProps.data)" 
                                            class="view-button" />
                                        <Button 
                                            icon="pi pi-search-plus" 
                                            size="small" 
                                            text 
                                            rounded 
                                            severity="primary"
                                            v-tooltip.top="'Analyze Ticket'"
                                            @click="analyzeTicket(slotProps.data)" 
                                            class="analyze-button" />
                                    </div>
                                </template>
                            </Column>

                            <template #expansion="slotProps">
                                <div class="p-6 bg-surface-50 dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700">
                                    <h6 class="mb-4 text-surface-900 dark:text-surface-0 font-semibold">Extended Ticket Details</h6>
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <!-- Column 1 -->
                                        <div class="space-y-4">
                                            <div class="bg-white dark:bg-surface-900 p-3 rounded-lg border border-surface-200 dark:border-surface-700">
                                                <div class="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1">Requestor Email</div>
                                                <div class="text-sm font-medium text-surface-900 dark:text-surface-0 break-all">{{ slotProps.data.email || 'N/A' }}</div>
                                            </div>
                                            <div class="bg-white dark:bg-surface-900 p-3 rounded-lg border border-surface-200 dark:border-surface-700">
                                                <div class="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1">Source Email</div>
                                                <div class="text-sm font-medium text-surface-900 dark:text-surface-0 break-all">{{ slotProps.data.replyto || 'N/A' }}</div>
                                            </div>
                                            <div class="bg-white dark:bg-surface-900 p-3 rounded-lg border border-surface-200 dark:border-surface-700">
                                                <div class="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1">Owner Staff ID</div>
                                                <div class="text-sm font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.ownerstaffid || 'N/A' }}</div>
                                            </div>
                                            <div class="bg-white dark:bg-surface-900 p-3 rounded-lg border border-surface-200 dark:border-surface-700">
                                                <div class="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1">Total Replies</div>
                                                <div class="text-sm font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.totalreplies }}</div>
                                            </div>
                                        </div>

                                        <!-- Column 2 -->
                                        <div class="space-y-4">
                                            <div class="bg-white dark:bg-surface-900 p-3 rounded-lg border border-surface-200 dark:border-surface-700">
                                                <div class="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1">Last Staff Reply</div>
                                                <div class="text-sm font-medium text-surface-900 dark:text-surface-0">{{ formatTimestamp(slotProps.data.laststaffreplytime) }}</div>
                                            </div>
                                            <div class="bg-white dark:bg-surface-900 p-3 rounded-lg border border-surface-200 dark:border-surface-700">
                                                <div class="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1">Last User Reply</div>
                                                <div class="text-sm font-medium text-surface-900 dark:text-surface-0">{{ formatTimestamp(slotProps.data.lastuserreplytime) }}</div>
                                            </div>
                                            <div class="bg-white dark:bg-surface-900 p-3 rounded-lg border border-surface-200 dark:border-surface-700">
                                                <div class="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1">Reopened At</div>
                                                <div class="text-sm font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.reopendateline > 0 ? formatTimestamp(slotProps.data.reopendateline) : 'Never' }}</div>
                                            </div>
                                            <div class="bg-white dark:bg-surface-900 p-3 rounded-lg border border-surface-200 dark:border-surface-700">
                                                <div class="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1">Avg Response Time</div>
                                                <div class="text-sm font-medium text-surface-900 dark:text-surface-0">{{ formatDuration(slotProps.data.averageresponsetime) }}</div>
                                            </div>
                                        </div>

                                        <!-- Column 3 -->
                                        <div class="space-y-4">
                                            <div class="bg-white dark:bg-surface-900 p-3 rounded-lg border border-surface-200 dark:border-surface-700">
                                                <div class="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1">Assignment Status</div>
                                                <div class="mt-1">
                                                    <Tag 
                                                        :value="slotProps.data.assignstatus" 
                                                        :severity="slotProps.data.assignstatus === 'Assigned' ? 'success' : 'warning'" />
                                                </div>
                                            </div>
                                            <div class="bg-white dark:bg-surface-900 p-3 rounded-lg border border-surface-200 dark:border-surface-700">
                                                <div class="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1">Is Watched</div>
                                                <div class="mt-1">
                                                    <Tag 
                                                        :value="slotProps.data.iswatched ? 'Yes' : 'No'" 
                                                        :severity="slotProps.data.iswatched ? 'info' : 'secondary'" />
                                                </div>
                                            </div>
                                            <div class="bg-white dark:bg-surface-900 p-3 rounded-lg border border-surface-200 dark:border-surface-700">
                                                <div class="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1">Location ID</div>
                                                <div class="text-sm font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.locationid || 'N/A' }}</div>
                                            </div>
                                            <div class="bg-white dark:bg-surface-900 p-3 rounded-lg border border-surface-200 dark:border-surface-700">
                                                <div class="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1">Asset ID</div>
                                                <div class="text-sm font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.assetid || 'N/A' }}</div>
                                            </div>
                                            <div class="bg-white dark:bg-surface-900 p-3 rounded-lg border border-surface-200 dark:border-surface-700">
                                                <div class="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1">Resolution Time</div>
                                                <div class="text-sm font-medium text-surface-900 dark:text-surface-0">{{ formatDuration(slotProps.data.resolutionseconds) }}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </template>

                            <template #footer>
                                <div class="flex justify-between items-center p-2 bg-surface-50 dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700">
                                    <div class="flex items-center gap-4">
                                        <span class="text-sm font-medium text-surface-700 dark:text-surface-300">
                                            {{ helpdeskStore.totalOpenTickets }} open tickets
                                        </span>
                                        <span class="text-xs text-surface-500 dark:text-surface-400">
                                            Helpdesk Tier 1 Queue
                                        </span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <Button 
                                            icon="pi pi-download" 
                                            text 
                                            size="small" 
                                            v-tooltip.top="'Export Data'" 
                                            severity="secondary" />
                                        <Button 
                                            icon="pi pi-refresh" 
                                            text 
                                            size="small" 
                                            @click="refreshOpenTickets" 
                                            v-tooltip.top="'Refresh'" 
                                            severity="secondary" 
                                            :loading="helpdeskStore.loading" />
                                    </div>
                                </div>
                            </template>
                        </DataTable>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Initial State -->
        <div v-if="!hasSearched && !isSearching" class="text-center py-12">
            <i class="pi pi-search text-6xl text-gray-300 mb-4"></i>
            <h3 class="text-gray-500 mb-2">Ready for Analysis</h3>
            <p class="text-gray-400">Enter a ticket ID above to begin AI-powered analysis</p>
        </div>

        <!-- Loading State -->
        <div v-if="isSearching" class="text-center py-12">
            <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="8" />
            <p class="text-gray-500 mt-4">Analyzing ticket data...</p>
        </div>

        <!-- Ticket Detail Drawer -->
        <Drawer 
            v-model:visible="isTicketDetailVisible" 
            header="Ticket Details"
            position="right"
            class="!w-3/5"
            :blockScroll="true">
            
            <!-- Loading State -->
            <div v-if="loadingTicketDetail" class="flex flex-col items-center justify-center py-8">
                <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="8" />
                <p class="text-surface-500 mt-4">Loading ticket details...</p>
            </div>

            <!-- Ticket Detail Content -->
            <div v-else-if="currentTicketDetail && currentTicketDetail.ticket" class="h-full flex flex-col">
                <!-- Ticket Header -->
                <div class="bg-surface-50 dark:bg-surface-800 p-6 rounded-lg mb-6 border border-surface-200 dark:border-surface-700">
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 mb-2">
                                {{ currentTicketDetail.ticket.subject }}
                            </h3>
                            <div class="flex items-center gap-3 mb-3">
                                <span class="font-mono text-sm bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded">
                                    #{{ currentTicketDetail.ticket['Ticket #'] }}
                                </span>
                                <Tag 
                                    :value="currentTicketDetail.ticket.Status" 
                                    :class="getStatusClass(currentTicketDetail.ticket.Status)"
                                    class="status-tag" />
                                <Tag 
                                    :value="currentTicketDetail.ticket.Priority" 
                                    :class="getPriorityClass(currentTicketDetail.ticket.Priority)"
                                    class="priority-tag" />
                            </div>
                        </div>
                    </div>

                    <!-- Ticket Meta Information -->
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-surface-500 dark:text-surface-400 font-medium">Requester:</span>
                            <p class="text-surface-900 dark:text-surface-0">{{ currentTicketDetail.ticket.Requester }}</p>
                        </div>
                        <div>
                            <span class="text-surface-500 dark:text-surface-400 font-medium">Email:</span>
                            <p class="text-surface-900 dark:text-surface-0 break-all">{{ currentTicketDetail.ticket['Requester Email'] }}</p>
                        </div>
                        <div>
                            <span class="text-surface-500 dark:text-surface-400 font-medium">Created:</span>
                            <p class="text-surface-900 dark:text-surface-0">{{ currentTicketDetail.ticket['Created At'] }}</p>
                        </div>
                        <div>
                            <span class="text-surface-500 dark:text-surface-400 font-medium">Last Activity:</span>
                            <p class="text-surface-900 dark:text-surface-0">{{ currentTicketDetail.ticket['Last Activity'] }}</p>
                        </div>
                        <div>
                            <span class="text-surface-500 dark:text-surface-400 font-medium">Department:</span>
                            <p class="text-surface-900 dark:text-surface-0">{{ currentTicketDetail.ticket.Department }}</p>
                        </div>
                        <div>
                            <span class="text-surface-500 dark:text-surface-400 font-medium">Type:</span>
                            <p class="text-surface-900 dark:text-surface-0">{{ currentTicketDetail.ticket.Type }}</p>
                        </div>
                        <div>
                            <span class="text-surface-500 dark:text-surface-400 font-medium">Due Date:</span>
                            <p class="text-surface-900 dark:text-surface-0">{{ currentTicketDetail.ticket['Due Date'] || 'Not set' }}</p>
                        </div>
                        <div>
                            <span class="text-surface-500 dark:text-surface-400 font-medium">Replies:</span>
                            <p class="text-surface-900 dark:text-surface-0">{{ currentTicketDetail.ticket.Replies }}</p>
                        </div>
                    </div>
                </div>

                <!-- Posts/Comments Section -->
                <div class="flex-1 overflow-hidden">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="text-lg font-semibold text-surface-900 dark:text-surface-0">
                            Conversation ({{ currentTicketDetail.posts_count || 0 }} posts)
                        </h4>
                        <Button 
                            icon="pi pi-refresh" 
                            size="small" 
                            text 
                            @click="refreshTicketDetail" 
                            v-tooltip.top="'Refresh Posts'" />
                    </div>

                    <!-- Posts List -->
                    <div class="overflow-y-auto h-full space-y-4 pr-2">
                        <div 
                            v-for="post in reversedPosts" 
                            :key="post.ticketpostid"
                            class="bg-white dark:bg-surface-900 rounded-lg p-4 border border-surface-200 dark:border-surface-700 shadow-sm">
                            
                            <!-- Post Header -->
                            <div class="flex items-start justify-between mb-3">
                                <div class="flex items-center gap-3">
                                    <Avatar 
                                        :label="post.post_author ? post.post_author.charAt(0).toUpperCase() : 'U'" 
                                        class="w-8 h-8" 
                                        shape="circle" />
                                    <div>
                                        <p class="font-medium text-surface-900 dark:text-surface-0">
                                            {{ post.post_author || 'Unknown' }}
                                        </p>
                                        <p class="text-xs text-surface-500 dark:text-surface-400">
                                            {{ post['Post Date'] }}
                                        </p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <Tag 
                                        v-if="post['Is Private'] === 'Yes'" 
                                        value="Private" 
                                        severity="secondary" 
                                        class="text-xs" />
                                    <Tag 
                                        v-if="post['Has Attachments'] === 'Yes'" 
                                        value="Attachments" 
                                        severity="info" 
                                        class="text-xs" />
                                </div>
                            </div>

                            <!-- Post Subject -->
                            <h6 v-if="post.post_subject" class="font-medium text-surface-900 dark:text-surface-0 mb-2">
                                {{ post.post_subject }}
                            </h6>

                            <!-- Post Content -->
                            <div class="text-surface-700 dark:text-surface-300 text-sm whitespace-pre-wrap">
                                {{ post.contents }}
                            </div>
                        </div>

                        <!-- No Posts Message -->
                        <div v-if="reversedPosts.length === 0" 
                             class="text-center py-8">
                            <i class="pi pi-comment text-4xl text-surface-300 dark:text-surface-600 mb-3"></i>
                            <p class="text-surface-500 dark:text-surface-400">No posts available for this ticket</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Error State -->
            <div v-else-if="ticketDetailError" class="flex flex-col items-center justify-center py-8">
                <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                <p class="text-red-600 dark:text-red-400 text-center">{{ ticketDetailError }}</p>
                <Button 
                    label="Retry" 
                    icon="pi pi-refresh" 
                    @click="retryTicketDetail" 
                    class="mt-4" 
                    size="small" />
            </div>
        </Drawer>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { FilterMatchMode } from '@primevue/core/api';
import { useHelpdeskStore } from '@/stores/helpdeskStore';
import Button from 'primevue/button';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Select from 'primevue/select';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';
import Drawer from 'primevue/drawer';
import Divider from 'primevue/divider';
import Avatar from 'primevue/avatar';
import Popover from 'primevue/popover';
import Badge from 'primevue/badge';
import { ApiService } from '@/service/ApiService';

const toast = useToast();
const helpdeskStore = useHelpdeskStore();

// Search state
const ticketInput = ref('');
const isSearching = ref(false);
const hasSearched = ref(false);
const searchResults = ref([]);
const searchedTicketIds = ref('');

// Open tickets table state
const globalFilter = ref('');
const expandedRows = ref({});
const selectedTickets = ref([]);
const activeQuickFilter = ref('all');
const openTicketsFilters = ref({
    ticketId: { value: null, matchMode: FilterMatchMode.CONTAINS },
    priority: { value: null, matchMode: FilterMatchMode.EQUALS },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
    subject: { value: null, matchMode: FilterMatchMode.CONTAINS },
    customerName: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Ticket detail state
const isTicketDetailVisible = ref(false);
const ticketDetail = ref({});
const loadingTicketDetail = ref(false);
const currentTicketDetail = ref(null);
const ticketDetailError = ref('');
const selectedTicketId = ref(null);

// Customer statistics state
const customerStatsPanel = ref(null);

// Handle search submission
async function searchTicket() {
    if (!ticketInput.value || ticketInput.value.trim() === '') {
        toast.add({ 
            severity: 'warn', 
            summary: 'Input Required', 
            detail: 'Please enter a ticket number', 
            life: 3000 
        });
        return;
    }

    await performTicketSearch(ticketInput.value.trim());
}

// Perform ticket search
async function performTicketSearch(ticketId) {
    isSearching.value = true;
    searchedTicketIds.value = ticketId;
    
    try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simulate search results - replace with actual API call
        const mockResults = [
            {
                id: ticketId,
                subject: 'Network connectivity issues in Building A',
                priority: 'High',
                status: 'Open',
                createdAt: '2024-01-15 09:30'
            }
        ];
        
        searchResults.value = mockResults;
        hasSearched.value = true;
        
        toast.add({ 
            severity: 'success', 
            summary: 'Search Complete', 
            detail: `Found ${mockResults.length} ticket(s) for analysis`, 
            life: 3000 
        });
        
    } catch (error) {
        console.error('Search error:', error);
        searchResults.value = [];
        hasSearched.value = true;
        
        toast.add({ 
            severity: 'error', 
            summary: 'Search Error', 
            detail: 'Failed to search for tickets', 
            life: 3000 
        });
    } finally {
        isSearching.value = false;
    }
}

const getPriorityClass = (priority) => {
    switch (priority) {
        case 'Critical':
            return 'priority-critical';
        case 'High':
            return 'priority-high';
        case 'Normal':
        case 'Medium':
            return 'priority-normal';
        case 'Low':
            return 'priority-low';
        default:
            return 'priority-default';
    }
};

const getStatusClass = (status) => {
    switch (status) {
        case 'Open':
            return 'status-open';
        case 'Pending':
            return 'status-pending';
        case 'In Progress':
            return 'status-in-progress';
        case 'On Hold':
            return 'status-on-hold';
        case 'Resolved':
        case 'Closed':
            return 'status-resolved';
        default:
            return 'status-default';
    }
};

// Computed properties for queue statistics
const overdueCount = computed(() => {
    return helpdeskStore.tier1OpenTickets.filter(ticket => isTicketOverdue(ticket)).length;
});

const dueTodayCount = computed(() => {
    return helpdeskStore.tier1OpenTickets.filter(ticket => isTicketDueToday(ticket)).length;
});

const unassignedCount = computed(() => {
    return helpdeskStore.tier1OpenTickets.filter(ticket => ticket.owner === 'Unassigned').length;
});

const filteredTickets = computed(() => {
    let tickets = [...helpdeskStore.tier1OpenTickets];
    
    // Apply quick filters
    switch (activeQuickFilter.value) {
        case 'unassigned':
            tickets = tickets.filter(ticket => ticket.owner === 'Unassigned');
            break;
        case 'due-today':
            tickets = tickets.filter(ticket => isTicketDueToday(ticket));
            break;
        case 'overdue':
            tickets = tickets.filter(ticket => isTicketOverdue(ticket));
            break;
        case 'high-priority':
            tickets = tickets.filter(ticket => ticket.priority === 'High' || ticket.priority === 'Critical');
            break;
        default:
            // 'all' - no filtering
            break;
    }
    
    // Sort by priority and age
    return tickets.sort((a, b) => {
        // Priority order: Critical > High > Normal > Low
        const priorityOrder = { 'Critical': 4, 'High': 3, 'Normal': 2, 'Low': 1 };
        const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        
        if (priorityDiff !== 0) return priorityDiff;
        
        // If same priority, sort by age (older first)
        return a.lastActivity - b.lastActivity;
    });
});

// Utility functions for open tickets table
const formatTimestamp = (timestamp, format = 'full') => {
    if (!timestamp || timestamp === 0) return 'N/A';
    const date = new Date(timestamp * 1000);
    
    if (format === 'short') {
        return date.toLocaleDateString();
    }
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

const getTimeAgo = (timestamp) => {
    if (!timestamp || timestamp === 0) return '';
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
};

const getDueTimeClass = (dueTime) => {
    if (!dueTime || dueTime === 0) return 'text-surface-500';
    const now = Date.now() / 1000;
    const diff = dueTime - now;
    
    if (diff < 0) return 'text-red-500'; // Overdue
    if (diff < 3600) return 'text-orange-500'; // Due within 1 hour
    if (diff < 86400) return 'text-yellow-500'; // Due within 1 day
    return 'text-green-500'; // Due later
};

const getDueTimeStatus = (dueTime) => {
    if (!dueTime || dueTime === 0) return 'No SLA';
    const now = Date.now() / 1000;
    const diff = dueTime - now;
    
    if (diff < 0) return 'Overdue';
    if (diff < 3600) return 'Due soon';
    if (diff < 86400) return 'Due today';
    return 'On track';
};

const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

// Enhanced utility functions for visual indicators
const isTicketOverdue = (ticket) => {
    if (!ticket.dueTime || ticket.dueTime === 0) return false;
    const now = Date.now() / 1000;
    return ticket.dueTime < now;
};

const isTicketDueToday = (ticket) => {
    if (!ticket.dueTime || ticket.dueTime === 0) return false;
    const now = Date.now() / 1000;
    const diff = ticket.dueTime - now;
    return diff > 0 && diff < 86400; // Due within 24 hours
};

const isStaleTicket = (ticket) => {
    if (!ticket.lastActivity || ticket.lastActivity === 0) return false;
    const now = Date.now() / 1000;
    const diff = now - ticket.lastActivity;
    return diff > 86400; // No activity for more than 24 hours
};

const getTicketRowClass = (ticket) => {
    let classes = [];
    
    if (isTicketOverdue(ticket)) {
        classes.push('overdue-ticket');
    } else if (isTicketDueToday(ticket)) {
        classes.push('due-today-ticket');
    }
    
    if (ticket.priority === 'Critical') {
        classes.push('critical-priority');
    }
    
    if (isStaleTicket(ticket)) {
        classes.push('stale-ticket');
    }
    
    return classes.join(' ');
};

// Actions
function applyQuickFilter(filterType) {
    activeQuickFilter.value = filterType;
    selectedTickets.value = []; // Clear selection when switching filters
    
    // Show feedback for the applied filter
    const filterLabels = {
        'all': 'All tickets',
        'unassigned': 'Unassigned tickets',
        'due-today': 'Tickets due today',
        'overdue': 'Overdue tickets',
        'high-priority': 'High priority tickets'
    };
    
    toast.add({ 
        severity: 'info', 
        summary: 'Filter Applied', 
        detail: `Showing ${filterLabels[filterType]}`, 
        life: 2000 
    });
}

function analyzeTicket(ticket) {
    // Set the ticket input and perform search
    ticketInput.value = ticket.ticketId.toString();
    performTicketSearch(ticket.ticketId.toString());
    
    // Scroll to search results
    setTimeout(() => {
        const searchResults = document.querySelector('.hd-ticket-analysis');
        if (searchResults) {
            searchResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
    
    toast.add({ 
        severity: 'info', 
        summary: 'Analyzing Ticket', 
        detail: `Starting analysis for ticket #${ticket.ticketId}`, 
        life: 3000 
    });
}

async function refreshOpenTickets() {
    try {
        await helpdeskStore.fetchTier1OpenTickets();
        toast.add({ 
            severity: 'success', 
            summary: 'Data Refreshed', 
            detail: `Loaded ${helpdeskStore.totalOpenTickets} open tickets`, 
            life: 3000 
        });
    } catch (error) {
        console.error('Error refreshing open tickets:', error);
        toast.add({ 
            severity: 'error', 
            summary: 'Refresh Failed', 
            detail: 'Failed to refresh ticket data', 
            life: 3000 
        });
    }
}

function viewTicket(ticket) {
    selectedTicketId.value = ticket.ticketId;
    isTicketDetailVisible.value = true;
    fetchTicketDetail(ticket.ticketId);
}

async function fetchTicketDetail(ticketId) {
    loadingTicketDetail.value = true;
    ticketDetailError.value = '';
    currentTicketDetail.value = null;
    
    try {
        // Using ApiService to fetch ticket details with posts
        const response = await ApiService.get(`cisdb/tickets/${ticketId}`, {
            include_posts: true
        });
        
        if (response.data && response.data.success) {
            currentTicketDetail.value = response.data.data;
            
            toast.add({
                severity: 'success',
                summary: 'Ticket Loaded',
                detail: `Loaded ticket #${ticketId} with ${response.data.data.posts_count || 0} posts`,
                life: 3000
            });
        } else {
            throw new Error(response.data?.message || 'Failed to fetch ticket details');
        }
    } catch (error) {
        console.error('Error fetching ticket detail:', error);
        ticketDetailError.value = error.message || 'Failed to load ticket details';
        
        toast.add({
            severity: 'error',
            summary: 'Load Failed',
            detail: `Failed to load ticket #${ticketId}`,
            life: 3000
        });
    } finally {
        loadingTicketDetail.value = false;
    }
}

function refreshTicketDetail() {
    if (selectedTicketId.value) {
        fetchTicketDetail(selectedTicketId.value);
    }
}

function retryTicketDetail() {
    if (selectedTicketId.value) {
        fetchTicketDetail(selectedTicketId.value);
    }
}

function closeTicketDetail() {
    isTicketDetailVisible.value = false;
    currentTicketDetail.value = null;
    ticketDetailError.value = '';
    selectedTicketId.value = null;
}

function toggleCustomerStats(event) {
    customerStatsPanel.value.toggle(event);
}

// Computed property to reverse posts order (newest first)
const reversedPosts = computed(() => {
    if (!currentTicketDetail.value?.posts || !Array.isArray(currentTicketDetail.value.posts)) {
        return [];
    }
    // Create a copy and reverse it to show newest posts first
    return [...currentTicketDetail.value.posts].reverse();
});

// Load data on component mount
onMounted(async () => {
    await refreshOpenTickets();
});
</script>

<style scoped>
.card {
    background: var(--surface-card);
    padding: 2rem;
    border-radius: 10px;
    margin-bottom: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Enhanced table styling */
:deep(.helpdesk-queue-table) {
    border-radius: 0.75rem;
    overflow: hidden;
    border: 1px solid var(--surface-200);
}

:deep(.dark .helpdesk-queue-table) {
    border: 1px solid var(--surface-700);
}

/* Expansion row styling */
:deep(.helpdesk-queue-table .p-datatable-row-expansion > td) {
    padding: 0 !important;
}

.space-y-4 > * + * {
    margin-top: 1rem;
}

.grid-cols-1 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
}

.break-all {
    word-break: break-all;
}

:deep(.helpdesk-queue-table .p-datatable-tbody > tr > td) {
    padding: 0.875rem 0.75rem;
    border-bottom: 1px solid var(--surface-150);
    vertical-align: top;
}

:deep(.dark .helpdesk-queue-table .p-datatable-tbody > tr > td) {
    border-bottom: 1px solid var(--surface-650);
}

/* Remove vertical gridlines but keep horizontal ones */
:deep(.helpdesk-queue-table .p-datatable-tbody > tr > td:not(:last-child)) {
    border-right: none;
}

:deep(.helpdesk-queue-table .p-datatable-thead > tr > th) {
    background: var(--surface-50);
    border-bottom: 2px solid var(--surface-200);
    border-right: none;
    font-weight: 600;
    font-size: 0.875rem;
    padding: 1rem 0.75rem;
}

:deep(.dark .helpdesk-queue-table .p-datatable-thead > tr > th) {
    background: var(--surface-800);
    border-bottom: 2px solid var(--surface-700);
    border-right: none;
}

/* Analyze button styling */
:deep(.analyze-button) {
    transition: all 0.2s ease;
}

:deep(.analyze-button:hover) {
    background: var(--primary-50);
    color: var(--primary-600);
    transform: scale(1.1);
}

:deep(.dark .analyze-button:hover) {
    background: var(--primary-900);
    color: var(--primary-300);
}

/* View button styling */
:deep(.view-button) {
    transition: all 0.2s ease;
}

:deep(.view-button:hover) {
    background: var(--blue-50);
    color: var(--blue-600);
    transform: scale(1.1);
}

:deep(.dark .view-button:hover) {
    background: var(--blue-900);
    color: var(--blue-300);
}

/* Customer stats panel styling */
:deep(.customer-stats-toggle) {
    transition: all 0.2s ease;
}

:deep(.customer-stats-toggle:hover) {
    background: var(--surface-100);
    color: var(--surface-900);
}

:deep(.dark .customer-stats-toggle:hover) {
    background: var(--surface-700);
    color: var(--surface-100);
}

:deep(.customer-stats-panel .p-popover-content) {
    padding: 0;
}

/* Custom priority tag colors - using !important to override PrimeVue 4.3 design tokens */
:deep(.priority-tag.priority-critical) {
    background-color: #dc2626 !important; /* red-600 */
    color: #ffffff !important;
    border-color: #dc2626 !important;
}

:deep(.priority-tag.priority-high) {
    background-color: #ea580c !important; /* orange-600 */
    color: #ffffff !important;
    border-color: #ea580c !important;
}

:deep(.priority-tag.priority-normal) {
    background-color: #2563eb !important; /* blue-600 */
    color: #ffffff !important;
    border-color: #2563eb !important;
}

:deep(.priority-tag.priority-low) {
    background-color: #16a34a !important; /* green-600 */
    color: #ffffff !important;
    border-color: #16a34a !important;
}

:deep(.priority-tag.priority-default) {
    background-color: #6b7280 !important; /* gray-500 */
    color: #ffffff !important;
    border-color: #6b7280 !important;
}

/* Custom status tag colors - using !important to override PrimeVue 4.3 design tokens */
:deep(.status-tag.status-open) {
    background-color: #dc2626 !important; /* red-600 */
    color: #ffffff !important;
    border-color: #dc2626 !important;
}

:deep(.status-tag.status-pending) {
    background-color: #d97706 !important; /* amber-600 */
    color: #ffffff !important;
    border-color: #d97706 !important;
}

:deep(.status-tag.status-in-progress) {
    background-color: #2563eb !important; /* blue-600 */
    color: #ffffff !important;
    border-color: #2563eb !important;
}

:deep(.status-tag.status-on-hold) {
    background-color: #6b7280 !important; /* gray-500 */
    color: #ffffff !important;
    border-color: #6b7280 !important;
}

:deep(.status-tag.status-resolved) {
    background-color: #16a34a !important; /* green-600 */
    color: #ffffff !important;
    border-color: #16a34a !important;
}

:deep(.status-tag.status-default) {
    background-color: #6b7280 !important; /* gray-500 */
    color: #ffffff !important;
    border-color: #6b7280 !important;
}

/* Dark mode variants */
:deep(.dark .priority-tag.priority-critical) {
    background-color: #f87171 !important; /* red-400 */
    color: #1f2937 !important; /* gray-800 */
    border-color: #f87171 !important;
}

:deep(.dark .priority-tag.priority-high) {
    background-color: #fb923c !important; /* orange-400 */
    color: #1f2937 !important; /* gray-800 */
    border-color: #fb923c !important;
}

:deep(.dark .priority-tag.priority-normal) {
    background-color: #60a5fa !important; /* blue-400 */
    color: #1f2937 !important; /* gray-800 */
    border-color: #60a5fa !important;
}

:deep(.dark .priority-tag.priority-low) {
    background-color: #4ade80 !important; /* green-400 */
    color: #1f2937 !important; /* gray-800 */
    border-color: #4ade80 !important;
}

:deep(.dark .status-tag.status-open) {
    background-color: #f87171 !important; /* red-400 */
    color: #1f2937 !important; /* gray-800 */
    border-color: #f87171 !important;
}

:deep(.dark .status-tag.status-pending) {
    background-color: #fbbf24 !important; /* amber-400 */
    color: #1f2937 !important; /* gray-800 */
    border-color: #fbbf24 !important;
}

:deep(.dark .status-tag.status-in-progress) {
    background-color: #60a5fa !important; /* blue-400 */
    color: #1f2937 !important; /* gray-800 */
    border-color: #60a5fa !important;
}

:deep(.dark .status-tag.status-on-hold) {
    background-color: #9ca3af !important; /* gray-400 */
    color: #1f2937 !important; /* gray-800 */
    border-color: #9ca3af !important;
}

:deep(.dark .status-tag.status-resolved) {
    background-color: #4ade80 !important; /* green-400 */
    color: #1f2937 !important; /* gray-800 */
    border-color: #4ade80 !important;
}

:deep(.helpdesk-queue-table .p-datatable-thead > tr > th) {
    background: var(--surface-50);
    border-bottom: 1px solid var(--surface-200);
    border-right: 1px solid var(--surface-200);
    font-weight: 600;
    font-size: 0.875rem;
    padding: 1rem 0.75rem;
}

:deep(.dark .helpdesk-queue-table .p-datatable-thead > tr > th) {
    background: var(--surface-800);
    border-bottom: 1px solid var(--surface-700);
    border-right: 1px solid var(--surface-700);
}

/* Row styling based on ticket status */
:deep(.helpdesk-queue-table .overdue-ticket) {
    background: rgba(239, 68, 68, 0.05);
    border-left: 4px solid rgb(239, 68, 68);
}

:deep(.helpdesk-queue-table .due-today-ticket) {
    background: rgba(251, 146, 60, 0.05);
    border-left: 4px solid rgb(251, 146, 60);
}

:deep(.helpdesk-queue-table .critical-priority) {
    box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.2);
}

:deep(.helpdesk-queue-table .stale-ticket) {
    background: rgba(107, 114, 128, 0.05);
}

/* Dark mode adjustments */
:deep(.dark .helpdesk-queue-table .overdue-ticket) {
    background: rgba(239, 68, 68, 0.1);
}

:deep(.dark .helpdesk-queue-table .due-today-ticket) {
    background: rgba(251, 146, 60, 0.1);
}

:deep(.dark .helpdesk-queue-table .stale-ticket) {
    background: rgba(107, 114, 128, 0.1);
}

/* Improved row height and readability */
:deep(.helpdesk-queue-table .p-datatable-tbody > tr) {
    min-height: 75px;
}

:deep(.helpdesk-queue-table .p-datatable-tbody > tr:hover) {
    background: var(--surface-100);
}

:deep(.dark .helpdesk-queue-table .p-datatable-tbody > tr:hover) {
    background: var(--surface-700);
}

/* Animation for pulsing indicators */
@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Grid responsive adjustments */
@media (max-width: 768px) {
    .grid-cols-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    
    .md\:grid-cols-4 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (min-width: 768px) {
    .md\:grid-cols-3 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    
    .md\:grid-cols-4 {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}
</style> 