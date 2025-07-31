<template>
    <div class="location-scope-review h-full flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900">
            <div>
                <h1 class="text-2xl font-semibold text-surface-900 dark:text-surface-0">Flynn Project - Location Scope Review</h1>
                <p class="text-surface-600 dark:text-surface-400 mt-1">Manage and track project scope completion across all locations</p>
            </div>
        </div>

        <!-- Main Content - Split Panel -->
        <div class="flex-1 flex overflow-hidden">
            <!-- Left Panel - Location List -->
            <div class="w-96 border-r border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 flex flex-col">
                <!-- Search and Filters -->
                <div class="p-4 border-b border-surface-200 dark:border-surface-700">
                    <div class="space-y-3">
                        <!-- Search -->
                        <IconField>
                            <InputIcon class="pi pi-search" />
                            <InputText 
                                v-model="searchQuery" 
                                placeholder="Search locations..." 
                                class="w-full" />
                        </IconField>
                        
                                                 <!-- Filters -->
                         <div class="flex gap-2">
                             <Button 
                                 icon="pi pi-filter" 
                                 @click="showFilters = !showFilters"
                                 :class="{ 'bg-blue-100 dark:bg-blue-900': showFilters }"
                                 outlined
                                 size="small" />
                         </div>

                        <!-- Advanced Filters (collapsible) -->
                        <div v-if="showFilters" class="space-y-2 pt-2 border-t border-surface-200 dark:border-surface-700">
                            <Select 
                                v-model="completionFilter" 
                                :options="completionFilterOptions" 
                                placeholder="Completion Status" 
                                class="w-full text-sm" />
                            <Select 
                                v-model="issuesFilter" 
                                :options="issuesFilterOptions" 
                                placeholder="Issue Status" 
                                class="w-full text-sm" />
                        </div>
                    </div>
                </div>

                <!-- Location List -->
                <div class="flex-1 overflow-y-auto">
                    <div v-if="flynnStore.loading" class="p-4 text-center text-surface-500">
                        <i class="pi pi-spin pi-spinner text-2xl mb-2"></i>
                        <p>Loading locations...</p>
                    </div>
                    
                    <div v-else-if="flynnStore.error" class="p-4 text-center text-red-500">
                        <i class="pi pi-exclamation-triangle text-2xl mb-2"></i>
                        <p>{{ flynnStore.error }}</p>
                        <Button label="Retry" @click="refreshData" size="small" class="mt-2" />
                    </div>

                    <div v-else-if="filteredLocations.length === 0" class="p-4 text-center text-surface-500">
                        <i class="pi pi-search text-2xl mb-2"></i>
                        <p>No locations found</p>
                    </div>

                    <div v-else class="space-y-1 p-2">
                        <div 
                            v-for="location in filteredLocations" 
                            :key="location.id"
                            @click="selectLocation(location)"
                            :class="[
                                'p-3 rounded-lg cursor-pointer transition-all duration-200 border',
                                flynnStore.selectedLocation?.id === location.id 
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' 
                                    : 'bg-surface-0 dark:bg-surface-800 border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700'
                            ]">
                            
                            <!-- Location Header -->
                            <div class="flex items-center justify-between mb-2">
                                                                 <div class="flex items-center gap-2">
                                     <span class="font-semibold text-surface-900 dark:text-surface-0">Site #{{ location.siteNumber }}</span>
                                 </div>
                                <div class="flex items-center gap-1">
                                    <Badge 
                                        v-if="location.issueCount > 0" 
                                        :value="location.issueCount" 
                                        severity="danger" 
                                        size="small" />
                                    <i v-if="location.issueCount > 0" class="pi pi-exclamation-triangle text-red-500 text-sm"></i>
                                </div>
                            </div>

                            <!-- Location Details -->
                            <div class="text-sm text-surface-600 dark:text-surface-400 mb-2">
                                <p class="font-medium">{{ location.locationName }}</p>
                                <p>{{ location.city }}, {{ location.state }}</p>
                            </div>

                            <!-- Progress Bar -->
                            <div class="mb-2">
                                <div class="flex justify-between items-center mb-1">
                                    <span class="text-xs text-surface-500">Completion</span>
                                    <span class="text-xs font-semibold" :class="getCompletionTextClass(location.completionPercentage)">
                                        {{ location.completionPercentage }}%
                                    </span>
                                </div>
                                <ProgressBar 
                                    :value="location.completionPercentage" 
                                    :class="getCompletionProgressClass(location.completionPercentage)"
                                    class="h-2" />
                            </div>

                            <!-- Quick Stats -->
                            <div class="flex justify-between text-xs text-surface-500">
                                <span>{{ location.networkStatus }}</span>
                                <span v-if="location.lastActivity">
                                    {{ formatRelativeDate(location.lastActivity) }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Summary Stats -->
                <div class="p-4 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div class="text-center">
                            <div class="font-semibold text-lg text-surface-900 dark:text-surface-0">{{ flynnStore.totalLocations }}</div>
                            <div class="text-surface-500">Total Locations</div>
                        </div>
                                                 <div class="text-center">
                             <div class="font-semibold text-lg text-surface-900 dark:text-surface-0">{{ highCompletionCount }}</div>
                             <div class="text-surface-500">80%+ Complete</div>
                         </div>
                    </div>
                </div>
            </div>

            <!-- Right Panel - Analysis Workspace -->
            <div class="flex-1 flex flex-col bg-surface-50 dark:bg-surface-800">
                <div v-if="!flynnStore.selectedLocation" class="flex-1 flex items-center justify-center">
                    <div class="text-center text-surface-500">
                        <i class="pi pi-map-marker text-4xl mb-4"></i>
                        <h3 class="text-xl font-semibold mb-2">Select a Location</h3>
                        <p>Choose a location from the list to view detailed analysis and scope information.</p>
                    </div>
                </div>

                <div v-else class="flex-1 flex flex-col">
                    <!-- Selected Location Header -->
                    <div class="p-4 bg-surface-0 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700">
                        <div class="flex items-center justify-between">
                            <div>
                                <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0">
                                    Site #{{ flynnStore.selectedLocation.siteNumber }}
                                </h2>
                                <div class="flex items-center gap-2 mt-1 text-sm text-surface-600 dark:text-surface-400">
                                    <i class="pi pi-map-marker"></i>
                                    <span>{{ flynnStore.selectedLocation.address || `${flynnStore.selectedLocation.city}, ${flynnStore.selectedLocation.state}` }}</span>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <Button 
                                    icon="pi pi-play" 
                                    label="Start Scope Review" 
                                    @click="startScopeReview"
                                    :disabled="scopeReviewStarted || flynnStore.scopeReviewLoading"
                                    :loading="flynnStore.scopeReviewLoading"
                                    class="bg-green-600 hover:bg-green-700 border-green-600 text-white"
                                    size="small" />
                                <Button 
                                    icon="pi pi-robot" 
                                    label="Run AI Analysis" 
                                    @click="showScopeAnalysisModal = true"
                                    :disabled="!flynnStore.selectedLocation"
                                    class="bg-blue-600 hover:bg-blue-700 border-blue-600 text-white"
                                    size="small" />
                            </div>
                        </div>
                    </div>

                    <!-- Scope Review Action Bar -->
                    <div v-if="scopeReviewStarted" class="p-4 bg-green-50 dark:bg-green-900 border-b border-green-200 dark:border-green-700">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-check-circle text-green-600"></i>
                                    <span class="font-medium text-green-700 dark:text-green-300">Scope Review Active</span>
                                    <Tag value="In Progress" severity="success" size="small" />
                                </div>
                                <div class="text-sm text-green-600 dark:text-green-400">
                                    Review location and document remaining scope items
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <Button 
                                    icon="pi pi-plus" 
                                    label="Add Note" 
                                    @click="showAddNotesModal = true"
                                    size="small"
                                    outlined
                                    class="border-green-600 text-green-600 hover:bg-green-600 hover:text-white" />
                                <Button 
                                    icon="pi pi-tasks" 
                                    label="Add Task" 
                                    @click="showAddTaskModal = true"
                                    size="small"
                                    outlined
                                    class="border-green-600 text-green-600 hover:bg-green-600 hover:text-white" />
                            </div>
                        </div>
                    </div>

                    <!-- Compact Key Metrics -->
                    <div class="grid grid-cols-4 gap-3 mt-3">
                        <div class="text-center p-2 bg-surface-50 dark:bg-surface-800 rounded">
                            <div class="text-lg font-semibold text-blue-600">{{ flynnStore.selectedLocation.completionPercentage || 0 }}%</div>
                            <div class="text-xs text-surface-500">Completion</div>
                        </div>
                        <div class="text-center p-2 bg-surface-50 dark:bg-surface-800 rounded">
                            <div class="text-lg font-semibold text-orange-600">{{ flynnStore.networkData?.status || 'Unknown' }}</div>
                            <div class="text-xs text-surface-500">Status</div>
                        </div>
                        <div class="text-center p-2 bg-surface-50 dark:bg-surface-800 rounded">
                            <div class="text-lg font-semibold text-purple-600">{{ flynnStore.comments?.length || 0 }}</div>
                            <div class="text-xs text-surface-500">Comments</div>
                        </div>
                        <div class="text-center p-2 bg-surface-50 dark:bg-surface-800 rounded">
                            <div class="text-lg font-semibold text-green-600">{{ flynnStore.networkData?.percent_complete || 'N/A' }}</div>
                            <div class="text-xs text-surface-500">Smart Sheet</div>
                        </div>
                    </div>

                    <!-- Tabs -->
                    <div class="flex-1 flex flex-col p-4">
                        <!-- Accordion Sections -->
                        <Accordion class="space-y-4">
                            <!-- Project Information Accordion -->
                            <AccordionPanel value="project">
                                <AccordionHeader>
                                    <div class="flex items-center justify-between w-full">
                                        <div class="flex items-center gap-2">
                                            <i class="pi pi-briefcase text-indigo-600"></i>
                                            <span class="font-semibold">{{ flynnStore.projectInfo?.project_name || 'Project Information' }}</span>
                                            <Button 
                                                icon="pi pi-copy" 
                                                size="small" 
                                                outlined 
                                                @click.stop="copyProjectContent"
                                                v-tooltip.top="'Copy Content'"
                                                class="ml-2" />
                                        </div>
                                        <div class="grid grid-cols-3 gap-4 mr-4">
                                            <div class="text-center">
                                                <div class="text-lg font-bold text-indigo-600">{{ flynnStore.projectPhases?.length || 0 }}</div>
                                                <div class="text-xs text-surface-500">Phases</div>
                                            </div>
                                            <div class="text-center">
                                                <div class="text-lg font-bold text-green-600">{{ getTotalTasks() }}</div>
                                                <div class="text-xs text-surface-500">Total Tasks</div>
                                            </div>
                                            <div class="text-center">
                                                <div class="text-lg font-bold text-purple-600">{{ getTotalSubtasks() }}</div>
                                                <div class="text-xs text-surface-500">Subtasks</div>
                                            </div>
                                        </div>
                                    </div>
                                </AccordionHeader>
                                <AccordionContent>
                                    <div class="space-y-6 mt-4">
                                        <!-- Project Summary -->
                                        <div v-if="flynnStore.projectInfo" class="bg-surface-50 dark:bg-surface-800 p-4 rounded border">
                                            <h4 class="font-semibold mb-3 text-indigo-700 dark:text-indigo-300">Project Scope Summary</h4>
                                            <div class="prose dark:prose-invert max-w-none text-sm leading-relaxed max-h-48 overflow-y-auto border border-surface-200 dark:border-surface-600 rounded p-3 bg-white dark:bg-surface-900">
                                                <div v-html="formatMarkdown(flynnStore.projectInfo.scope_summary)"></div>
                                            </div>
                                        </div>

                                        <!-- Project Phases -->
                                        <div v-if="flynnStore.projectPhases?.length > 0">
                                            <h4 class="font-semibold mb-3 text-indigo-700 dark:text-indigo-300">Project Phases</h4>
                                            <div class="space-y-3">
                                                <div v-for="phase in flynnStore.projectPhases" 
                                                     :key="phase.phase_id"
                                                     class="border border-surface-200 dark:border-surface-700 rounded">
                                                    <div class="p-4 bg-surface-0 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700">
                                                        <div class="flex items-center justify-between">
                                                            <div class="flex items-center gap-3">
                                                                <Tag :value="phase.phase_id" severity="info" size="small" />
                                                                <span class="font-medium">{{ phase.phase_name }}</span>
                                                            </div>
                                                            <div class="flex items-center gap-4">
                                                                <span class="text-sm text-surface-600 dark:text-surface-400">
                                                                    {{ phase.parent_tasks?.length || 0 }} tasks
                                                                </span>
                                                                <Button 
                                                                    :label="phase.tasksLoaded ? 'Hide Tasks' : 'View Tasks'"
                                                                    :icon="phase.tasksLoaded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
                                                                    @click="togglePhaseDetails(phase)"
                                                                    text
                                                                    size="small" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <!-- Phase Tasks (Expandable) -->
                                                    <div v-if="phase.tasksLoaded && phase.parent_tasks" class="p-4 bg-surface-50 dark:bg-surface-800">
                                                        <div class="space-y-3">
                                                            <div v-for="task in phase.parent_tasks" 
                                                                 :key="task.id"
                                                                 class="bg-white dark:bg-surface-900 p-3 rounded border border-surface-200 dark:border-surface-700">
                                                                <div class="flex items-center justify-between mb-2">
                                                                    <h6 class="font-medium">{{ task.title }}</h6>
                                                                    <div class="flex items-center gap-2">
                                                                        <Tag :value="task.type || 'General'" severity="secondary" size="small" />
                                                                        <span class="text-xs text-surface-500">{{ task.subtasks?.length || 0 }} steps</span>
                                                                    </div>
                                                                </div>
                                                                
                                                                <!-- Subtasks -->
                                                                <div v-if="task.subtasks?.length > 0" class="mt-3">
                                                                    <div class="space-y-2">
                                                                        <div v-for="(subtask, index) in task.subtasks" 
                                                                             :key="subtask.id"
                                                                             class="flex items-start gap-2 text-sm">
                                                                            <span class="flex-shrink-0 w-6 h-6 bg-surface-100 dark:bg-surface-700 rounded-full flex items-center justify-center text-xs font-medium">
                                                                                {{ index + 1 }}
                                                                            </span>
                                                                            <span class="text-surface-700 dark:text-surface-300">{{ subtask.description }}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Loading State -->
                                        <div v-if="flynnStore.projectLoading" class="flex items-center justify-center py-8">
                                            <ProgressSpinner size="small" />
                                            <span class="ml-2 text-surface-600 dark:text-surface-400">Loading project information...</span>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionPanel>

                            <!-- Tickets Accordion -->
                            <AccordionPanel value="tickets">
                                <AccordionHeader>
                                    <div class="flex items-center justify-between w-full">
                                        <div class="flex items-center gap-2">
                                            <i class="pi pi-ticket text-purple-600"></i>
                                            <span class="font-semibold">Tickets Summary ({{ flynnStore.tickets?.length || 0 }} total)</span>
                                            <Button 
                                                icon="pi pi-copy" 
                                                size="small" 
                                                outlined 
                                                @click.stop="copyTicketsContent"
                                                v-tooltip.top="'Copy Content'"
                                                class="ml-2" />
                                        </div>
                                        <div class="grid grid-cols-5 gap-4 mr-4">
                                            <div class="text-center">
                                                <div class="text-lg font-bold text-blue-600">{{ flynnStore.tickets?.length || 0 }}</div>
                                                <div class="text-xs text-surface-500">Total Tickets</div>
                                            </div>
                                            <div class="text-center">
                                                <div class="text-lg font-bold text-green-600">
                                                    {{ flynnStore.tickets?.filter(t => t.ticketstatustitle === 'Completed').length || 0 }}
                                                </div>
                                                <div class="text-xs text-surface-500">Completed</div>
                                            </div>
                                            <div class="text-center">
                                                <div class="text-lg font-bold text-orange-600">
                                                    {{ flynnStore.tickets?.filter(t => t.ticketstatustitle !== 'Completed').length || 0 }}
                                                </div>
                                                <div class="text-xs text-surface-500">In Progress</div>
                                            </div>
                                            <div class="text-center">
                                                <div class="text-lg font-bold text-purple-600">
                                                    {{ Object.keys(flynnStore.ticketPosts || {}).reduce((sum, ticketId) => sum + flynnStore.ticketPosts[ticketId].length, 0) }}
                                                </div>
                                                <div class="text-xs text-surface-500">Total Posts</div>
                                            </div>
                                            <div class="text-center">
                                                <div class="text-lg font-bold text-blue-600">{{ flynnStore.tickets?.length ? 'Available' : '0' }}</div>
                                                <div class="text-xs text-surface-500">Photos</div>
                                            </div>
                                        </div>
                                    </div>
                                </AccordionHeader>
                                <AccordionContent>
                                    <!-- Tickets DataTable -->
                                    <DataTable 
                                        :value="flynnStore.tickets || []" 
                                        selectionMode="single" 
                                        @row-click="openTicketDrawer"
                                        class="mt-4">
                                        <Column field="ticketid" header="Ticket ID">
                                            <template #body="slotProps">
                                                <a 
                                                    :href="`https://staff.cissdm.com/ticketing/ticket/${slotProps.data.ticketid}`"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    class="text-blue-600 hover:text-blue-800 underline font-medium cursor-pointer"
                                                    @click.stop>
                                                    {{ slotProps.data.ticketid }}
                                                </a>
                                            </template>
                                        </Column>
                                        <Column field="subject" header="Subject"></Column>
                                        <Column field="ticketstatustitle" header="Status">
                                            <template #body="slotProps">
                                                <Tag :value="slotProps.data.ticketstatustitle" 
                                                     :severity="slotProps.data.ticketstatustitle === 'Completed' ? 'success' : 'warning'" />
                                            </template>
                                        </Column>
                                        <Column field="prioritytitle" header="Priority">
                                            <template #body="slotProps">
                                                <Tag :value="slotProps.data.prioritytitle" severity="info" size="small" />
                                            </template>
                                        </Column>
                                        <Column field="fullname" header="Creator"></Column>
                                        <Column field="dateline" header="Created">
                                            <template #body="slotProps">
                                                {{ formatDate(slotProps.data.dateline) }}
                                            </template>
                                        </Column>
                                    </DataTable>
                                </AccordionContent>
                            </AccordionPanel>

                            <!-- SmartSheet Accordion -->
                            <AccordionPanel value="smartsheet">
                                <AccordionHeader>
                                    <div class="flex items-center justify-between w-full">
                                        <div class="flex items-center gap-2">
                                            <i class="pi pi-table text-blue-600"></i>
                                            <span class="font-semibold">Smart Sheet Data</span>
                                            <Button 
                                                icon="pi pi-copy" 
                                                size="small" 
                                                outlined 
                                                @click.stop="copySmartSheetContent"
                                                v-tooltip.top="'Copy SmartSheet Data'"
                                                class="ml-2" />
                                            <Button 
                                                icon="pi pi-comment" 
                                                size="small" 
                                                outlined 
                                                @click.stop="copyCommentsContent"
                                                v-tooltip.top="'Copy Comments'"
                                                class="ml-1" />
                                        </div>
                                        <div class="grid grid-cols-3 gap-4 mr-4">
                                            <div class="text-center">
                                                <div class="text-lg font-bold text-blue-600">{{ flynnStore.networkData?.franchise_number || 'N/A' }}</div>
                                                <div class="text-xs text-surface-500">Franchise Number</div>
                                            </div>
                                            <div class="text-center">
                                                <div class="text-lg font-bold text-green-600">{{ flynnStore.networkData?.percent_complete || 'N/A' }}</div>
                                                <div class="text-xs text-surface-500">Percent Complete</div>
                                            </div>
                                            <div class="text-center">
                                                <div class="text-lg font-bold text-purple-600">{{ flynnStore.networkData?.reviewed ? 'Yes' : 'No' }}</div>
                                                <div class="text-xs text-surface-500">Reviewed</div>
                                            </div>
                                        </div>
                                    </div>
                                </AccordionHeader>
                                <AccordionContent>
                                    <div class="space-y-4 mt-4">
                                        <!-- Completion Checklist -->
                                        <div v-if="flynnStore.networkData">
                                            <h5 class="font-semibold mb-3">Completion Checklist</h5>
                                            <div class="grid grid-cols-2 gap-3">
                                                <div v-for="(value, key) in getCompletionFields(flynnStore.networkData)" 
                                                     :key="key" 
                                                     class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded border">
                                                    <span class="text-sm">{{ formatFieldName(key) }}</span>
                                                    <Tag :value="value ? 'Complete' : 'Incomplete'" 
                                                         :severity="value ? 'success' : 'danger'" 
                                                         size="small" />
                                                </div>
                                            </div>
                                        </div>

                                        <!-- SmartSheet Comments Button -->
                                        <div class="flex justify-center">
                                            <Button 
                                                :label="`SmartSheet Comments (${flynnStore.comments?.length || 0})`"
                                                icon="pi pi-comment"
                                                @click="showCommentsDrawer = true"
                                                outlined />
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionPanel>
                        </Accordion>

                        <!-- AI Analysis Session Selector (Accordion) -->
                        <Accordion class="mt-6">
                            <AccordionPanel>
                                <AccordionHeader>
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-history text-blue-600"></i>
                                        <span>AI Analysis Session</span>
                                        <Tag v-if="flynnStore.analysisSessions.length > 0" :value="flynnStore.analysisSessions.length + ' sessions'" severity="info" size="small" />
                                    </div>
                                </AccordionHeader>
                                <AccordionContent>
                                    <div class="p-4">
                                        <div class="flex items-center justify-between">
                                            <div></div>
                                            <div class="flex items-center gap-3">
                                                <div v-if="flynnStore.analysisSessions.length > 0" class="flex items-center gap-3">
                                                    <Select 
                                                        v-model="flynnStore.selectedSessionId" 
                                                        :options="sessionOptions" 
                                                        optionLabel="label" 
                                                        optionValue="value"
                                                        @change="onSessionChange"
                                                        placeholder="Select session..."
                                                        class="w-80" />
                                                    <Button 
                                                        icon="pi pi-trash" 
                                                        severity="danger" 
                                                        size="small"
                                                        outlined
                                                        @click="confirmDeleteSession"
                                                        :disabled="!flynnStore.selectedSessionId"
                                                        v-tooltip.top="'Delete selected analysis session'" />
                                                </div>
                                            </div>
                                        </div>
                            
                                        <!-- Enhanced Scope Analysis Warnings -->
                                        <div v-if="flynnStore.scopeDeduplication.length > 0" class="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded">
                                            <div class="flex items-start gap-2">
                                                <i class="pi pi-exclamation-triangle text-yellow-600 mt-1"></i>
                                                <div>
                                                    <div class="font-medium text-yellow-800 dark:text-yellow-200">
                                                        {{ flynnStore.scopeDeduplication.length }} Potential Duplicate{{ flynnStore.scopeDeduplication.length !== 1 ? 's' : '' }} Detected
                                                    </div>
                                                    <div class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                                        The AI has identified potentially similar tasks across different analysis passes. Review these items to avoid duplicate work.
                                                    </div>
                                                    <Button 
                                                        label="Review Duplicates" 
                                                        icon="pi pi-eye" 
                                                        size="small" 
                                                        severity="warning"
                                                        outlined
                                                        class="mt-2"
                                                        @click="showDeduplicationModal = true" />
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Recommendations -->
                                        <div v-if="Object.keys(flynnStore.scopeRecommendations).length > 0" class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div v-if="flynnStore.scopeRecommendations.generate_installation_document" 
                                                 class="p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded">
                                                <div class="flex items-center gap-2 text-green-700 dark:text-green-300">
                                                    <i class="pi pi-check-circle"></i>
                                                    <span class="text-sm font-medium">Ready for Installation Doc</span>
                                                </div>
                                            </div>
                                            <div v-if="flynnStore.scopeRecommendations.review_duplicates" 
                                                 class="p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded">
                                                <div class="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                                                    <i class="pi pi-exclamation-triangle"></i>
                                                    <span class="text-sm font-medium">Review Required</span>
                                                </div>
                                            </div>
                                            <div v-if="flynnStore.scopeRecommendations.address_client_concerns" 
                                                 class="p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded">
                                                <div class="flex items-center gap-2 text-red-700 dark:text-red-300">
                                                    <i class="pi pi-users"></i>
                                                    <span class="text-sm font-medium">Client Follow-up Needed</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Session Status -->
                                        <div class="mt-3">
                                            <div v-if="flynnStore.analysisSessions.length > 0" class="flex items-center justify-between text-sm">
                                                <div class="text-surface-600 dark:text-surface-400">
                                                    {{ flynnStore.analysisSessions.length }} session{{ flynnStore.analysisSessions.length !== 1 ? 's' : '' }} available
                                                    <span v-if="flynnStore.selectedSessionId" class="ml-2">
                                                        • Currently viewing Session #{{ flynnStore.selectedSessionId }}
                                                    </span>
                                                </div>
                                                <div v-if="flynnStore.selectedSessionId" class="text-xs text-surface-500">
                                                    Switch sessions to compare different analysis runs
                                                </div>
                                            </div>
                                            <div v-else-if="!flynnStore.sessionsLoading" class="text-sm text-surface-500">
                                                <i class="pi pi-info-circle mr-1"></i>
                                                No AI analysis sessions found - run an analysis to get started
                                            </div>
                                            <div v-else class="text-sm text-surface-500">
                                                <i class="pi pi-spin pi-spinner mr-1"></i>
                                                Loading analysis sessions...
                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionPanel>
                        </Accordion>

                        <!-- AI Analysis Results Section (Accordion) -->
                        <Accordion v-if="flynnStore.currentAnalysisResults.pass1 || flynnStore.currentAnalysisResults.pass2 || flynnStore.currentAnalysisResults.pass3" 
                                   class="mt-6">
                            <AccordionPanel>
                                <AccordionHeader>
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-robot text-blue-600"></i>
                                        <span>AI Analysis Results</span>
                                        <Tag value="AI Generated" severity="info" size="small" />
                                        <div v-if="flynnStore.selectedSessionId" class="text-xs text-surface-500 ml-2">
                                            Session #{{ flynnStore.selectedSessionId }}
                                        </div>
                                    </div>
                                </AccordionHeader>
                                <AccordionContent>
                                    <Accordion class="space-y-2">
                                            <!-- Pass 1: High-Level Scope Analysis -->
                                            <AccordionPanel v-if="flynnStore.currentAnalysisResults.pass1" value="pass1">
                                                <AccordionHeader>
                                        <div class="flex items-center justify-between w-full">
                                            <div class="flex items-center gap-2">
                                                <i class="pi pi-eye text-green-600"></i>
                                                <span class="font-semibold">High-Level Scope Analysis</span>
                                            </div>
                                            <div class="flex items-center gap-4 mr-4">
                                                <div class="text-center">
                                                    <div class="text-lg font-bold text-green-600">{{ flynnStore.currentAnalysisResults.pass1.scope_completed?.length || 0 }}</div>
                                                    <div class="text-xs text-surface-500">Completed</div>
                                                </div>
                                                <div class="text-center">
                                                    <div class="text-lg font-bold text-orange-600">{{ flynnStore.currentAnalysisResults.pass1.remaining_scope?.length || 0 }}</div>
                                                    <div class="text-xs text-surface-500">Remaining</div>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionHeader>
                                    <AccordionContent>
                                        <!-- Analysis Summary -->
                                        <div v-if="flynnStore.currentAnalysisResults.pass1.analysis_summary" class="mb-6 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded">
                                            <h5 class="font-medium text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                                                <i class="pi pi-info-circle"></i>
                                                Analysis Summary
                                            </h5>
                                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <span class="font-medium">Location:</span>
                                                    <div class="text-surface-600 dark:text-surface-400">{{ flynnStore.currentAnalysisResults.pass1.analysis_summary.location }}</div>
                                                </div>
                                                <div>
                                                    <span class="font-medium">Visits Analyzed:</span>
                                                    <div class="text-surface-600 dark:text-surface-400">{{ flynnStore.currentAnalysisResults.pass1.analysis_summary.total_visits_analyzed }}</div>
                                                </div>
                                                <div>
                                                    <span class="font-medium">Confidence:</span>
                                                    <Tag :value="flynnStore.currentAnalysisResults.pass1.analysis_summary.analysis_confidence" 
                                                         :severity="flynnStore.currentAnalysisResults.pass1.analysis_summary.analysis_confidence === 'high' ? 'success' : 'warning'" 
                                                         size="small" />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Analysis Notes -->
                                        <div v-if="flynnStore.currentAnalysisResults.pass1.notes" class="mb-6 p-4 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded">
                                            <h5 class="font-medium text-surface-700 dark:text-surface-300 mb-2 flex items-center gap-2">
                                                <i class="pi pi-file-edit"></i>
                                                AI Analysis Notes
                                            </h5>
                                            <p class="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">{{ flynnStore.currentAnalysisResults.pass1.notes }}</p>
                                        </div>
                                        
                                        <div class="grid grid-cols-2 gap-6">
                                            <!-- Completed Scope -->
                                            <div>
                                                <h5 class="font-medium text-green-700 dark:text-green-300 mb-3 flex items-center gap-2">
                                                    <i class="pi pi-check-circle"></i>
                                                    Completed Scope Items
                                                </h5>
                                                <div v-if="flynnStore.currentAnalysisResults.pass1.scope_completed?.length > 0" class="space-y-3">
                                                    <div v-for="item in flynnStore.currentAnalysisResults.pass1.scope_completed" 
                                                         :key="item.item_name"
                                                         class="p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded">
                                                        <div class="flex items-start justify-between">
                                                            <div class="flex-1">
                                                                <div class="font-medium text-sm">{{ item.item_name }}</div>
                                                                <div class="text-xs text-surface-600 dark:text-surface-400 mt-1">{{ item.evidence_source }}</div>
                                                                <div class="text-xs text-green-700 dark:text-green-300 mt-1">{{ item.completion_details }}</div>
                                                            </div>
                                                            <div v-if="item.date_completed" class="text-xs text-green-600 dark:text-green-400 font-medium">
                                                                {{ formatDate(item.date_completed) }}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div v-else class="text-center text-surface-500 py-4">
                                                    <i class="pi pi-info-circle text-2xl mb-2"></i>
                                                    <p>No completed scope items identified</p>
                                                </div>
                                            </div>

                                            <!-- Remaining Scope -->
                                            <div>
                                                <h5 class="font-medium text-orange-700 dark:text-orange-300 mb-3 flex items-center gap-2">
                                                    <i class="pi pi-exclamation-triangle"></i>
                                                    Remaining Scope Items
                                                </h5>
                                                <div v-if="flynnStore.currentAnalysisResults.pass1.remaining_scope?.length > 0" class="space-y-3">
                                                    <div v-for="item in flynnStore.currentAnalysisResults.pass1.remaining_scope" 
                                                         :key="item.item_name"
                                                         class="p-3 bg-orange-50 dark:bg-orange-900 border border-orange-200 dark:border-orange-700 rounded">
                                                        <div class="font-medium text-sm">{{ item.item_name }}</div>
                                                        <div class="text-xs text-surface-600 dark:text-surface-400 mt-1">{{ item.reason_incomplete }}</div>
                                                        <Tag :value="item.priority_level" 
                                                             :severity="item.priority_level === 'high' ? 'danger' : 'warning'" 
                                                             size="small" 
                                                             class="mt-2" />
                                                    </div>
                                                </div>
                                                <div v-else class="text-center text-surface-500 py-4">
                                                    <i class="pi pi-check-circle text-2xl mb-2"></i>
                                                    <p>All scope items appear completed</p>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionPanel>

                                <!-- Pass 2: Task Analysis -->
                                <AccordionPanel v-if="flynnStore.currentAnalysisResults.pass2" value="pass2">
                                    <AccordionHeader>
                                        <div class="flex items-center justify-between w-full">
                                            <div class="flex items-center gap-2">
                                                <i class="pi pi-list text-blue-600"></i>
                                                <span class="font-semibold">45-Task Detailed Analysis</span>
                                            </div>
                                            <div class="flex items-center gap-4 mr-4">
                                                <div class="text-center">
                                                    <div class="text-lg font-bold text-green-600">{{ flynnStore.currentAnalysisResults.pass2.pass_2_analysis_summary?.completed_count || 0 }}</div>
                                                    <div class="text-xs text-surface-500">Completed</div>
                                                </div>
                                                <div class="text-center">
                                                    <div class="text-lg font-bold text-red-600">{{ flynnStore.currentAnalysisResults.pass2.pass_2_analysis_summary?.needs_correction_count || 0 }}</div>
                                                    <div class="text-xs text-surface-500">Need Correction</div>
                                                </div>
                                                <div class="text-center">
                                                    <div class="text-lg font-bold text-orange-600">{{ flynnStore.currentAnalysisResults.pass2.pass_2_analysis_summary?.not_completed_count || 0 }}</div>
                                                    <div class="text-xs text-surface-500">Not Started</div>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionHeader>
                                    <AccordionContent>
                                        <!-- Phase Summary -->
                                        <div v-if="flynnStore.currentAnalysisResults.pass2.phase_summary" class="mb-6">
                                            <h5 class="font-medium text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                                                <i class="pi pi-chart-bar"></i>
                                                Phase Completion Summary
                                            </h5>
                                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div v-for="phase in flynnStore.currentAnalysisResults.pass2.phase_summary" 
                                                     :key="phase.phase_name"
                                                     class="p-3 border rounded"
                                                     :class="{
                                                         'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700': phase.completion_percentage === '100%',
                                                         'bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-700': phase.completion_percentage !== '100%'
                                                     }">
                                                    <div class="font-medium text-sm">{{ phase.phase_name }}</div>
                                                    <div class="flex items-center justify-between mt-2">
                                                        <span class="text-lg font-bold" 
                                                              :class="phase.completion_percentage === '100%' ? 'text-green-600' : 'text-yellow-600'">
                                                            {{ phase.completion_percentage }}
                                                        </span>
                                                        <ProgressBar :value="parseInt(phase.completion_percentage)" 
                                                                   class="w-20"
                                                                   :pt="{ 
                                                                       root: { class: 'h-2' },
                                                                       value: { 
                                                                           class: phase.completion_percentage === '100%' ? 'bg-green-500' : 'bg-yellow-500'
                                                                       }
                                                                   }" />
                                                    </div>
                                                    <div v-if="phase.critical_issues && phase.critical_issues !== 'None'" 
                                                         class="text-xs text-red-700 dark:text-red-300 mt-2">
                                                        <strong>Issues:</strong> {{ phase.critical_issues }}
                                                    </div>
                                                    <div v-else class="text-xs text-green-700 dark:text-green-300 mt-2">
                                                        <i class="pi pi-check"></i> No critical issues
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Task Analysis -->
                                        <div>
                                            <h5 class="font-medium text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                                                <i class="pi pi-list"></i>
                                                Detailed Task Analysis ({{ flynnStore.currentAnalysisResults.pass2.task_analysis?.length || 0 }} tasks)
                                            </h5>
                                            <div class="space-y-3">
                                                <div v-for="task in flynnStore.currentAnalysisResults.pass2.task_analysis" 
                                                     :key="task.task_id"
                                                     class="p-3 border rounded"
                                                     :class="{
                                                         'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700': task.status === 'COMPLETED',
                                                         'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700': task.status === 'NEEDS_CORRECTION',
                                                         'bg-orange-50 dark:bg-orange-900 border-orange-200 dark:border-orange-700': task.status === 'NOT_COMPLETED'
                                                     }">
                                                    <div class="flex items-start justify-between">
                                                        <div class="flex-1">
                                                            <div class="font-medium text-sm">{{ task.task_name }}</div>
                                                            <div v-if="task.correction_needed" 
                                                                 class="text-xs text-red-700 dark:text-red-300 mt-1">
                                                                {{ task.correction_needed }}
                                                            </div>
                                                            <div v-if="task.evidence_source" 
                                                                 class="text-xs text-surface-600 dark:text-surface-400 mt-1">
                                                                 Evidence: {{ task.evidence_source }}
                                                            </div>
                                                        </div>
                                                        <Tag :value="task.status.replace('_', ' ')" 
                                                             :severity="task.status === 'COMPLETED' ? 'success' : task.status === 'NEEDS_CORRECTION' ? 'danger' : 'warning'" 
                                                             size="small" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionPanel>

                                <!-- Pass 3: Client Validation -->
                                <AccordionPanel v-if="flynnStore.currentAnalysisResults.pass3" value="pass3">
                                    <AccordionHeader>
                                        <div class="flex items-center justify-between w-full">
                                            <div class="flex items-center gap-2">
                                                <i class="pi pi-comments text-purple-600"></i>
                                                <span class="font-semibold">Client Feedback Validation</span>
                                            </div>
                                            <div class="flex items-center gap-4 mr-4">
                                                <div class="text-center">
                                                    <div class="text-lg font-bold text-purple-600">{{ flynnStore.currentAnalysisResults.pass3.validation_summary?.tasks_validated || 0 }}</div>
                                                    <div class="text-xs text-surface-500">Tasks Validated</div>
                                                </div>
                                                <div class="text-center">
                                                    <div class="text-lg font-bold text-blue-600">{{ flynnStore.currentAnalysisResults.pass3.validation_summary?.status_changes_made || 0 }}</div>
                                                    <div class="text-xs text-surface-500">Status Changes</div>
                                                </div>
                                                <div class="text-center">
                                                    <div class="text-lg font-bold text-orange-600">{{ flynnStore.currentAnalysisResults.pass3.client_concerns?.length || 0 }}</div>
                                                    <div class="text-xs text-surface-500">Concerns</div>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionHeader>
                                    <AccordionContent>
                                        <!-- Validation Summary -->
                                        <div v-if="flynnStore.currentAnalysisResults.pass3.validation_summary" class="mb-6 p-4 bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-700 rounded">
                                            <h5 class="font-medium text-purple-700 dark:text-purple-300 mb-3 flex items-center gap-2">
                                                <i class="pi pi-check-circle"></i>
                                                Validation Summary
                                            </h5>
                                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <span class="font-medium">Tasks Validated:</span>
                                                    <div class="text-surface-600 dark:text-surface-400">{{ flynnStore.currentAnalysisResults.pass3.validation_summary.tasks_validated }}</div>
                                                </div>
                                                <div>
                                                    <span class="font-medium">Status Changes:</span>
                                                    <div class="text-surface-600 dark:text-surface-400">{{ flynnStore.currentAnalysisResults.pass3.validation_summary.status_changes_made }}</div>
                                                </div>
                                                <div>
                                                    <span class="font-medium">Feedback Sources:</span>
                                                    <div class="text-surface-600 dark:text-surface-400">{{ flynnStore.currentAnalysisResults.pass3.validation_summary.client_feedback_sources }}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Validated Task Analysis -->
                                        <div v-if="flynnStore.currentAnalysisResults.pass3.validated_task_analysis?.length > 0" class="mb-6">
                                            <h5 class="font-medium text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                                                <i class="pi pi-verified"></i>
                                                Client-Validated Tasks ({{ flynnStore.currentAnalysisResults.pass3.validated_task_analysis.length }})
                                            </h5>
                                            <div class="space-y-3">
                                                <div v-for="task in flynnStore.currentAnalysisResults.pass3.validated_task_analysis" 
                                                     :key="task.task_id"
                                                     class="p-3 border rounded"
                                                     :class="{
                                                         'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700': task.validated_status === 'COMPLETED',
                                                         'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700': task.validated_status === 'NOT_COMPLETED'
                                                     }">
                                                    <div class="flex items-start justify-between">
                                                        <div class="flex-1">
                                                            <div class="font-medium text-sm">{{ task.task_name }}</div>
                                                            <div class="text-xs text-surface-600 dark:text-surface-400 mt-1">
                                                                {{ task.original_status }} → {{ task.validated_status }}
                                                                <span v-if="task.status_changed" class="text-blue-600 ml-1">(Changed)</span>
                                                            </div>
                                                            <div v-if="task.client_feedback" class="text-xs bg-blue-50 dark:bg-blue-900 p-2 rounded mt-2">
                                                                <strong>Client Feedback:</strong> {{ task.client_feedback }}
                                                            </div>
                                                            <div v-if="task.client_validation_notes" class="text-xs text-surface-600 dark:text-surface-400 mt-1">
                                                                <strong>Notes:</strong> {{ task.client_validation_notes }}
                                                            </div>
                                                        </div>
                                                        <div class="flex flex-col items-end gap-1">
                                                            <Tag :value="task.validated_status.replace('_', ' ')" 
                                                                 :severity="task.validated_status === 'COMPLETED' ? 'success' : 'danger'" 
                                                                 size="small" />
                                                            <div v-if="task.status_changed" class="text-xs text-blue-600 dark:text-blue-400">
                                                                Status Updated
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- New Scope Items -->
                                        <div v-if="flynnStore.currentAnalysisResults.pass3.new_scope?.length > 0" class="mb-6">
                                            <h5 class="font-medium text-orange-700 dark:text-orange-300 mb-3 flex items-center gap-2">
                                                <i class="pi pi-plus-circle"></i>
                                                New Scope Items Identified ({{ flynnStore.currentAnalysisResults.pass3.new_scope.length }})
                                            </h5>
                                            <div class="space-y-3">
                                                <div v-for="(item, index) in flynnStore.currentAnalysisResults.pass3.new_scope" 
                                                     :key="`new-scope-${index}`" 
                                                     class="p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded">
                                                    <div class="font-medium text-surface-900 dark:text-surface-0">{{ item.item_description }}</div>
                                                    <div v-if="item.source" class="text-sm text-surface-600 dark:text-surface-400 mt-1">
                                                        Source: {{ item.source }}
                                                    </div>
                                                    <div v-if="item.priority" class="mt-2">
                                                        <Tag :value="item.priority" 
                                                             :severity="item.priority === 'high' ? 'danger' : item.priority === 'medium' ? 'warning' : 'info'" 
                                                             size="small" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Client Concerns -->
                                        <div v-if="flynnStore.currentAnalysisResults.pass3.client_concerns?.length > 0">
                                            <h5 class="font-medium text-red-700 dark:text-red-300 mb-3 flex items-center gap-2">
                                                <i class="pi pi-exclamation-triangle"></i>
                                                Outstanding Client Concerns ({{ flynnStore.currentAnalysisResults.pass3.client_concerns.length }})
                                            </h5>
                                            <div class="space-y-3">
                                                <div v-for="(concern, index) in flynnStore.currentAnalysisResults.pass3.client_concerns" 
                                                     :key="`concern-${index}`" 
                                                     class="p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded">
                                                    <div class="font-medium text-surface-900 dark:text-surface-0 mb-2">{{ concern.concern_description }}</div>
                                                    <div v-if="concern.related_tasks?.length > 0" class="mb-2">
                                                        <span class="text-sm font-medium text-surface-700 dark:text-surface-300">Related Tasks:</span>
                                                        <div class="flex flex-wrap gap-1 mt-1">
                                                            <Tag v-for="task in concern.related_tasks" 
                                                                 :key="task" 
                                                                 :value="task" 
                                                                 severity="secondary" 
                                                                 size="small" />
                                                        </div>
                                                    </div>
                                                    <div v-if="concern.recommended_action" class="text-sm text-surface-600 dark:text-surface-400">
                                                        <span class="font-medium">Recommended Action:</span> {{ concern.recommended_action }}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionPanel>
                                    </Accordion>

                                    <!-- Generate Installation Document Button -->
                                    <div class="mt-6 flex justify-between items-center">
                                <div v-if="flynnStore.enhancedScopeData?.remaining_scope_analysis?.summary_stats" class="flex items-center gap-4">
                                    <div class="text-sm text-surface-600 dark:text-surface-400">
                                        <span class="font-medium">Enhanced Analysis:</span>
                                        {{ flynnStore.enhancedScopeData.remaining_scope_analysis.summary_stats.total_remaining_items }} items
                                        <span v-if="flynnStore.enhancedScopeData.remaining_scope_analysis.summary_stats.potential_duplicates_count > 0" 
                                              class="text-yellow-600 ml-2">
                                            ({{ flynnStore.enhancedScopeData.remaining_scope_analysis.summary_stats.potential_duplicates_count }} potential duplicates)
                                        </span>
                                    </div>
                                    <div v-if="flynnStore.scopeRecommendations.priority_focus" class="flex items-center gap-1">
                                        <Tag :value="`${flynnStore.scopeRecommendations.priority_focus.toUpperCase()} Priority Focus`" 
                                             :severity="flynnStore.scopeRecommendations.priority_focus === 'high' ? 'danger' : 'warning'" 
                                             size="small" />
                                    </div>
                                </div>
                            </div>

                                    <!-- Remaining Scope Summary -->
                                    <div v-if="hasRemainingScope" class="mt-8 p-6 bg-orange-50 dark:bg-orange-900 border border-orange-200 dark:border-orange-700 rounded">
                                        <div class="flex items-center justify-between mb-6">
                                            <h4 class="text-xl font-semibold flex items-center gap-2 text-orange-700 dark:text-orange-300">
                                                <i class="pi pi-exclamation-triangle"></i>
                                                Remaining Scope Summary
                                                <Tag :value="`${totalRemainingItems} items`" severity="warning" size="small" class="ml-2" />
                                                <Tag v-if="flynnStore.enhancedScopeData?.remaining_scope_analysis?.summary_stats?.potential_duplicates_count > 0" 
                                                     :value="`${flynnStore.enhancedScopeData.remaining_scope_analysis.summary_stats.potential_duplicates_count} duplicates`" 
                                                     severity="danger" 
                                                     size="small" 
                                                     class="ml-1" />
                                            </h4>
                                            
                                            <!-- Enhanced Actions -->
                                            <div class="flex items-center gap-2">
                                                <Button label="Edit Final Scope" 
                                                        icon="pi pi-pencil" 
                                                        size="small" 
                                                        severity="info"
                                                        @click="showScopeManagementModal = true" 
                                                        :disabled="!hasRemainingScope" />
                                                <Button v-if="flynnStore.scopeDeduplication.length > 0" 
                                                        label="Review Duplicates" 
                                                        icon="pi pi-eye" 
                                                        size="small" 
                                                        severity="warning"
                                                        outlined
                                                        @click="showDeduplicationModal = true" />
                                                <Button label="Generate Installation Document" 
                                                        icon="pi pi-file-export" 
                                                        size="small" 
                                                        @click="handleGenerateInstallationDocument" 
                                                        :loading="flynnStore.installationDocumentState.generating"
                                                        :disabled="!flynnStore.currentAnalysisResults.pass1" />
                                            </div>
                                        </div>

                                        <!-- Enhanced Scope Context (if available) -->
                                        <div v-if="flynnStore.enhancedScopeData?.scope_completion_context" class="mb-6 p-4 bg-white dark:bg-surface-800 rounded border">
                                            <h5 class="font-semibold text-surface-900 dark:text-surface-0 mb-3 flex items-center gap-2">
                                                <i class="pi pi-chart-pie"></i>
                                                Enhanced Scope Analysis
                                            </h5>
                                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                        <div class="p-3 bg-blue-50 dark:bg-blue-900 rounded">
                                            <div class="text-lg font-bold text-blue-600">{{ flynnStore.enhancedScopeData.scope_completion_context.total_items_analyzed }}</div>
                                            <div class="text-xs text-surface-500">Items Analyzed</div>
                                        </div>
                                        <div class="p-3 bg-yellow-50 dark:bg-yellow-900 rounded">
                                            <div class="text-lg font-bold text-yellow-600">{{ flynnStore.enhancedScopeData.scope_completion_context.potential_duplicates_found }}</div>
                                            <div class="text-xs text-surface-500">Potential Duplicates</div>
                                        </div>
                                        <div class="p-3 bg-green-50 dark:bg-green-900 rounded">
                                            <div class="text-lg font-bold text-green-600">
                                                {{ flynnStore.enhancedScopeData.scope_completion_context.priority_distribution?.high || 0 }}
                                            </div>
                                            <div class="text-xs text-surface-500">High Priority</div>
                                        </div>
                                        <div class="p-3 bg-purple-50 dark:bg-purple-900 rounded">
                                            <div class="text-lg font-bold text-purple-600">
                                                {{ flynnStore.enhancedScopeData.scope_completion_context.priority_distribution?.medium || 0 }}
                                            </div>
                                            <div class="text-xs text-surface-500">Medium Priority</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <!-- High-Level Incomplete Scope -->
                                    <div v-if="flynnStore.currentAnalysisResults.pass1?.remaining_scope?.length > 0" class="bg-white dark:bg-surface-800 rounded border p-4">
                                        <h5 class="font-semibold text-orange-700 dark:text-orange-300 mb-3 flex items-center gap-2">
                                            <i class="pi pi-list-check"></i>
                                            High-Level Remaining Scope ({{ flynnStore.currentAnalysisResults.pass1.remaining_scope.length }})
                                        </h5>
                                        <div class="space-y-3">
                                            <div v-for="item in flynnStore.currentAnalysisResults.pass1.remaining_scope" 
                                                 :key="item.item_name" 
                                                 class="p-3 bg-orange-50 dark:bg-orange-900 border border-orange-200 dark:border-orange-700 rounded">
                                                <div class="font-medium text-surface-900 dark:text-surface-0">{{ item.item_name }}</div>
                                                <div class="text-sm text-surface-600 dark:text-surface-400 mt-1">{{ item.reason_incomplete }}</div>
                                                <div class="flex items-center gap-2 mt-2">
                                                    <Tag :value="item.priority_level" 
                                                         :severity="item.priority_level === 'high' ? 'danger' : item.priority_level === 'medium' ? 'warning' : 'info'" 
                                                         size="small" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Detailed Task Issues -->
                                    <div v-if="incompleteDetailedTasks.length > 0" class="bg-white dark:bg-surface-800 rounded border p-4">
                                        <h5 class="font-semibold text-red-700 dark:text-red-300 mb-3 flex items-center gap-2">
                                            <i class="pi pi-times-circle"></i>
                                            Detailed Task Issues ({{ incompleteDetailedTasks.length }})
                                        </h5>
                                        <div class="space-y-3 max-h-96 overflow-y-auto">
                                            <div v-for="task in incompleteDetailedTasks" 
                                                 :key="task.task_id" 
                                                 class="p-3 border rounded"
                                                 :class="{
                                                     'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700': task.status === 'NOT_COMPLETED',
                                                     'bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-700': task.status === 'NEEDS_CORRECTION'
                                                 }">
                                                <div class="flex items-start justify-between">
                                                    <div class="flex-1">
                                                        <div class="font-medium text-surface-900 dark:text-surface-0">{{ task.task_name }}</div>
                                                        <div class="text-xs text-surface-500 mb-1">Phase: {{ task.phase_name }}</div>
                                                        <div v-if="task.evidence_source" class="text-sm text-surface-600 dark:text-surface-400">
                                                            Evidence: {{ task.evidence_source }}
                                                        </div>
                                                        <div v-if="task.correction_details" class="text-sm text-surface-600 dark:text-surface-400 mt-1">
                                                            {{ task.correction_details }}
                                                        </div>
                                                    </div>
                                                    <Tag :value="task.status.replace('_', ' ')" 
                                                         :severity="task.status === 'NOT_COMPLETED' ? 'danger' : 'warning'" 
                                                         size="small" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Client Validation Issues -->
                                    <div v-if="clientValidationIssues.length > 0" class="bg-white dark:bg-surface-800 rounded border p-4">
                                        <h5 class="font-semibold text-purple-700 dark:text-purple-300 mb-3 flex items-center gap-2">
                                            <i class="pi pi-user-edit"></i>
                                            Client Validation Issues ({{ clientValidationIssues.length }})
                                        </h5>
                                        <div class="space-y-3 max-h-96 overflow-y-auto">
                                            <div v-for="task in clientValidationIssues" 
                                                 :key="`validation-${task.task_id}`" 
                                                 class="p-3 border rounded"
                                                 :class="{
                                                     'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700': task.validated_status === 'NOT_COMPLETED',
                                                     'bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-700': task.validated_status === 'NEEDS_CORRECTION'
                                                 }">
                                                <div class="flex items-start justify-between">
                                                    <div class="flex-1">
                                                        <div class="font-medium text-surface-900 dark:text-surface-0">{{ task.task_name }}</div>
                                                        <div v-if="task.status_changed" class="text-sm text-blue-600 dark:text-blue-400 mb-1">
                                                            Status changed: {{ task.original_status }} → {{ task.validated_status }}
                                                        </div>
                                                        <div v-if="task.client_feedback_source" class="text-sm text-surface-600 dark:text-surface-400">
                                                            Client feedback: {{ task.client_feedback_source }}
                                                        </div>
                                                    </div>
                                                    <div class="flex flex-col gap-1">
                                                        <Tag :value="task.validated_status.replace('_', ' ')" 
                                                             :severity="task.validated_status === 'NOT_COMPLETED' ? 'danger' : 'warning'" 
                                                             size="small" />
                                                        <Tag v-if="task.status_changed" 
                                                             value="Status Changed" 
                                                             severity="info" 
                                                             size="small" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- New Scope Items -->
                                    <div v-if="flynnStore.currentAnalysisResults.pass3?.new_scope?.length > 0" class="bg-white dark:bg-surface-800 rounded border p-4">
                                        <h5 class="font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                                            <i class="pi pi-plus-circle"></i>
                                            New Scope Items ({{ flynnStore.currentAnalysisResults.pass3.new_scope.length }})
                                        </h5>
                                        <div class="space-y-3">
                                            <div v-for="(item, index) in flynnStore.currentAnalysisResults.pass3.new_scope" 
                                                 :key="`new-scope-${index}`" 
                                                 class="p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded">
                                                <div class="font-medium text-surface-900 dark:text-surface-0">{{ item.item_description }}</div>
                                                <div v-if="item.source" class="text-sm text-surface-600 dark:text-surface-400 mt-1">
                                                    Source: {{ item.source }}
                                                </div>
                                                <div v-if="item.priority" class="mt-2">
                                                    <Tag :value="item.priority" 
                                                         :severity="item.priority === 'high' ? 'danger' : item.priority === 'medium' ? 'warning' : 'info'" 
                                                         size="small" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Outstanding Client Concerns -->
                                    <div v-if="flynnStore.currentAnalysisResults.pass3?.client_concerns?.length > 0" class="bg-white dark:bg-surface-800 rounded border p-4 lg:col-span-2">
                                        <h5 class="font-semibold text-red-700 dark:text-red-300 mb-3 flex items-center gap-2">
                                            <i class="pi pi-exclamation-triangle"></i>
                                            Outstanding Client Concerns ({{ flynnStore.currentAnalysisResults.pass3.client_concerns.length }})
                                        </h5>
                                        <div class="space-y-4">
                                            <div v-for="(concern, index) in flynnStore.currentAnalysisResults.pass3.client_concerns" 
                                                 :key="`concern-${index}`" 
                                                 class="p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded">
                                                <div class="font-medium text-surface-900 dark:text-surface-0 mb-2">{{ concern.concern_description }}</div>
                                                <div v-if="concern.related_tasks?.length > 0" class="mb-2">
                                                    <span class="text-sm font-medium text-surface-700 dark:text-surface-300">Related Tasks:</span>
                                                    <div class="flex flex-wrap gap-1 mt-1">
                                                        <Tag v-for="task in concern.related_tasks" 
                                                             :key="task" 
                                                             :value="task" 
                                                             severity="secondary" 
                                                             size="small" />
                                                    </div>
                                                </div>
                                                <div v-if="concern.recommended_action" class="text-sm text-surface-600 dark:text-surface-400">
                                                    <span class="font-medium">Recommended Action:</span> {{ concern.recommended_action }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Summary Stats -->
                                <div class="mt-6 p-4 bg-white dark:bg-surface-800 rounded border">
                                    <h6 class="font-semibold text-surface-900 dark:text-surface-0 mb-3">Summary Overview</h6>
                                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                        <div class="p-3 bg-orange-50 dark:bg-orange-900 rounded">
                                            <div class="text-lg font-bold text-orange-600">{{ flynnStore.currentAnalysisResults.pass1?.remaining_scope?.length || 0 }}</div>
                                            <div class="text-xs text-surface-500">High-Level Items</div>
                                        </div>
                                        <div class="p-3 bg-red-50 dark:bg-red-900 rounded">
                                            <div class="text-lg font-bold text-red-600">{{ incompleteDetailedTasks.length }}</div>
                                            <div class="text-xs text-surface-500">Task Issues</div>
                                        </div>
                                        <div class="p-3 bg-blue-50 dark:bg-blue-900 rounded">
                                            <div class="text-lg font-bold text-blue-600">{{ flynnStore.currentAnalysisResults.pass3?.new_scope?.length || 0 }}</div>
                                            <div class="text-xs text-surface-500">New Scope Items</div>
                                        </div>
                                        <div class="p-3 bg-purple-50 dark:bg-purple-900 rounded">
                                            <div class="text-lg font-bold text-purple-600">{{ flynnStore.currentAnalysisResults.pass3?.client_concerns?.length || 0 }}</div>
                                            <div class="text-xs text-surface-500">Client Concerns</div>
                                        </div>
                                    </div>
                                </div>
                                    </div>
                                </AccordionContent>
                            </AccordionPanel>
                        </Accordion>

                        <!-- 2-Pass Workflow: Installation Document Generation -->
                        <div v-if="flynnStore.currentAnalysisResults.pass1 || flynnStore.currentAnalysisResults.pass2 || flynnStore.currentAnalysisResults.pass3" 
                             class="mt-6 p-6 bg-surface-0 dark:bg-surface-900 rounded border border-surface-200 dark:border-surface-700">
                            <h4 class="text-lg font-semibold mb-4 flex items-center gap-2">
                                <i class="pi pi-file-edit text-green-600"></i>
                                Installation Document Workflow
                                <Tag value="2-Pass Model" severity="success" size="small" class="ml-2" />
                            </h4>
                            
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <!-- Pass 1: Analysis Complete -->
                                <div class="workflow-step">
                                    <div class="flex items-center gap-3 mb-3">
                                        <div class="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                            <i class="pi pi-check text-green-600 text-sm"></i>
                                        </div>
                                        <div>
                                            <h5 class="font-semibold text-green-700 dark:text-green-300">Pass 1: Analysis Complete</h5>
                                            <p class="text-sm text-surface-600 dark:text-surface-400">3-pass scope analysis finished</p>
                                        </div>
                                    </div>
                                    <div class="pl-11">
                                        <div class="text-sm space-y-1">
                                            <div class="flex justify-between">
                                                <span>Scope Analysis:</span>
                                                <Tag value="✓ Complete" severity="success" size="small" />
                                            </div>
                                            <div class="flex justify-between">
                                                <span>Task Analysis:</span>
                                                <Tag value="✓ Complete" severity="success" size="small" />
                                            </div>
                                            <div class="flex justify-between">
                                                <span>Client Validation:</span>
                                                <Tag value="✓ Complete" severity="success" size="small" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Pass 2: Installation Document -->
                                <div class="workflow-step">
                                    <div class="flex items-center gap-3 mb-3">
                                        <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                                             :class="{
                                                 'bg-green-100 dark:bg-green-900': flynnStore.installationDocumentState.hasDocument,
                                                 'bg-blue-100 dark:bg-blue-900': flynnStore.installationDocumentState.ready && !flynnStore.installationDocumentState.hasDocument,
                                                 'bg-gray-100 dark:bg-gray-700': !flynnStore.installationDocumentState.ready
                                             }">
                                            <i v-if="flynnStore.installationDocumentState.generating" class="pi pi-spin pi-spinner text-blue-600 text-sm"></i>
                                            <i v-else-if="flynnStore.installationDocumentState.hasDocument" class="pi pi-check text-green-600 text-sm"></i>
                                            <i v-else-if="flynnStore.installationDocumentState.ready" class="pi pi-file-edit text-blue-600 text-sm"></i>
                                            <span v-else class="text-gray-400 text-sm font-bold">2</span>
                                        </div>
                                        <div>
                                            <h5 class="font-semibold"
                                                :class="{
                                                    'text-green-700 dark:text-green-300': flynnStore.installationDocumentState.hasDocument,
                                                    'text-blue-700 dark:text-blue-300': flynnStore.installationDocumentState.ready && !flynnStore.installationDocumentState.hasDocument,
                                                    'text-gray-500': !flynnStore.installationDocumentState.ready
                                                }">
                                                Pass 2: Installation Document
                                            </h5>
                                            <p class="text-sm text-surface-600 dark:text-surface-400">
                                                {{ flynnStore.installationDocumentState.hasDocument ? 'Field-ready work order generated' : 
                                                   flynnStore.installationDocumentState.ready ? 'Ready to generate document' : 
                                                   'Waiting for analysis completion' }}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div class="pl-11">
                                        <!-- Document exists -->
                                        <div v-if="flynnStore.currentInstallationDocument || flynnStore.installationDocumentState.hasDocument" class="space-y-3">
                                            <div class="text-sm space-y-1">
                                                <div class="flex justify-between">
                                                    <span>Document Status:</span>
                                                    <Tag value="✓ Generated" severity="success" size="small" />
                                                </div>
                                                <div class="flex justify-between" v-if="flynnStore.installationDocumentState.documentLength">
                                                    <span>Size:</span>
                                                    <span class="text-surface-600">{{ flynnStore.installationDocumentState.documentLength?.toLocaleString() }} chars</span>
                                                </div>
                                                <div class="flex justify-between" v-if="flynnStore.installationDocumentState.lastGenerated">
                                                    <span>Generated:</span>
                                                    <span class="text-surface-600">{{ formatDate(flynnStore.installationDocumentState.lastGenerated) }}</span>
                                                </div>
                                            </div>
                                            <div class="flex gap-2">
                                                <Button 
                                                    label="View Document" 
                                                    icon="pi pi-eye" 
                                                    size="small"
                                                    @click="viewInstallationDocument" />
                                                <Button 
                                                    label="Print" 
                                                    icon="pi pi-print" 
                                                    size="small"
                                                    outlined
                                                    @click="printInstallationDocument" />
                                                <Button 
                                                    label="Regenerate" 
                                                    icon="pi pi-refresh" 
                                                    size="small"
                                                    outlined
                                                    @click="handleGenerateInstallationDocument"
                                                    :loading="flynnStore.installationDocumentState.generating" />
                                            </div>
                                        </div>
                                        
                                        <!-- Ready to generate -->
                                        <div v-else-if="flynnStore.currentAnalysisResults.pass1" class="space-y-3">
                                            <div class="text-sm text-blue-700 dark:text-blue-300 mb-2">
                                                <i class="pi pi-info-circle mr-1"></i>
                                                Analysis data available. Generate field installation document.
                                            </div>
                                            <Button 
                                                label="Generate Installation Document" 
                                                icon="pi pi-file-plus" 
                                                @click="handleGenerateInstallationDocument"
                                                :loading="flynnStore.installationDocumentState.generating"
                                                class="w-full" />
                                        </div>
                                        
                                        <!-- Not ready -->
                                        <div v-else class="text-sm text-gray-500">
                                            Complete 3-pass analysis first to enable installation document generation.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Ticket Detail Drawer -->
        <Drawer 
            v-model:visible="showTicketDrawer" 
            header="Ticket Details" 
            position="right" 
            :style="{ width: '60vw' }"
            class="h-full">
            <div v-if="selectedTicket" class="h-full flex flex-col">
                <!-- Ticket Header -->
                <div class="mb-4 p-4 bg-surface-50 dark:bg-surface-800 rounded flex-shrink-0">
                    <h3 class="text-lg font-semibold mb-2">Ticket #{{ selectedTicket.ticketid }}</h3>
                    <p class="text-surface-600 dark:text-surface-400 mb-3">{{ selectedTicket.subject }}</p>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <strong>Status:</strong> 
                            <Tag :value="selectedTicket.ticketstatustitle" 
                                 :severity="selectedTicket.ticketstatustitle === 'Completed' ? 'success' : 'warning'" 
                                 class="ml-2" />
                        </div>
                        <div><strong>Priority:</strong> {{ selectedTicket.prioritytitle }}</div>
                        <div><strong>Created By:</strong> {{ selectedTicket.fullname }}</div>
                        <div><strong>Created:</strong> {{ formatDate(selectedTicket.dateline) }}</div>
                        <div><strong>Last Activity:</strong> {{ formatDate(selectedTicket.lastactivity) }}</div>
                        <div><strong>Department:</strong> {{ selectedTicket.departmenttitle }}</div>
                    </div>
                </div>

                <!-- Ticket Posts -->
                <div v-if="flynnStore.ticketPosts[selectedTicket.ticketid]" class="flex-1 flex flex-col min-h-0">
                    <!-- Photos Section as Accordion -->
                    <div class="mb-4 flex-shrink-0">
                        <Accordion>
                            <AccordionPanel value="photos">
                                <AccordionHeader>
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-images text-purple-600"></i>
                                        <span class="font-semibold">Photos</span>
                                    </div>
                                </AccordionHeader>
                                <AccordionContent>
                                    <PhotoGalleria 
                                        :ticket-id="selectedTicket.ticketid" 
                                        :compact="true"
                                        :photos-per-page="8"
                                        class="mt-3" />
                                </AccordionContent>
                            </AccordionPanel>
                        </Accordion>
                    </div>

                    <h4 class="font-semibold mb-3 flex-shrink-0">Conversation ({{ flynnStore.ticketPosts[selectedTicket.ticketid].length }} posts)</h4>
                    <div class="flex-1 overflow-y-auto space-y-3">
                        <div v-for="post in flynnStore.ticketPosts[selectedTicket.ticketid]" 
                             :key="`${selectedTicket.ticketid}-${post.dateline}`"
                             class="p-3 bg-surface-0 dark:bg-surface-800 rounded border">
                            <div class="flex items-center gap-2 mb-2">
                                <Avatar :label="post.fullname.substring(0, 2)" 
                                        size="small" 
                                        shape="circle" 
                                        class="bg-blue-100 text-blue-700" />
                                <div>
                                    <div class="font-medium text-sm">{{ post.fullname }}</div>
                                    <div class="text-xs text-surface-500">{{ formatDate(post.dateline) }}</div>
                                </div>
                            </div>
                            <div class="text-sm leading-relaxed whitespace-pre-wrap">{{ post.contents }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </Drawer>

        <!-- Comments Drawer -->
        <Drawer 
            v-model:visible="showCommentsDrawer" 
            header="SmartSheet Comments" 
            position="right" 
            :style="{ width: '50vw' }"
            class="h-full">
            <div class="h-full flex flex-col">
                <div v-if="flynnStore.comments && flynnStore.comments.length > 0" class="flex-1 flex flex-col min-h-0">
                    <div class="flex-1 overflow-y-auto space-y-3">
                        <div v-for="comment in flynnStore.comments" 
                             :key="comment.id"
                             class="p-3 bg-surface-0 dark:bg-surface-800 rounded border border-surface-200 dark:border-surface-700">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center gap-2">
                                    <Avatar :label="comment.author?.substring(0, 2) || '?'" 
                                            size="small" 
                                            shape="circle" 
                                            class="bg-orange-100 text-orange-700" />
                                    <div>
                                        <div class="font-medium text-sm">{{ comment.author || 'Unknown' }}</div>
                                        <div class="text-xs text-surface-500">{{ formatDate(comment.comment_date) }}</div>
                                    </div>
                                </div>
                                <Tag v-if="comment.category" :value="comment.category" severity="secondary" size="small" />
                            </div>
                            <div class="text-sm leading-relaxed">{{ comment.comment }}</div>
                        </div>
                    </div>
                </div>
                <div v-else class="flex-1 flex items-center justify-center text-surface-500">
                    <div class="text-center">
                        <i class="pi pi-comment text-4xl mb-4"></i>
                        <p>No SmartSheet comments available.</p>
                    </div>
                </div>
            </div>
        </Drawer>

        <!-- Add Note Modal -->
        <Dialog 
            v-model:visible="showAddNotesModal" 
            modal 
            header="Add Note to Scope Review" 
            :style="{ width: '45rem' }">
            <div class="space-y-4">
                <!-- Quick Action Buttons -->
                <div class="grid grid-cols-2 gap-2 mb-4 p-3 bg-surface-50 dark:bg-surface-800 rounded border">
                    <Button 
                        label="✓ Cabling looks good" 
                        @click="setQuickNote('Cabling looks good', 'observation', 'low')"
                        outlined 
                        size="small" />
                    <Button 
                        label="⚠ Equipment properly mounted" 
                        @click="setQuickNote('Equipment properly mounted', 'observation', 'medium')"
                        outlined 
                        size="small" />
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">
                        Note Content *
                        <span class="float-right text-xs text-surface-500">{{ newScopeNote.note.length }}/1000</span>
                    </label>
                    <Textarea 
                        v-model="newScopeNote.note" 
                        rows="4" 
                        class="w-full"
                        :maxlength="1000"
                        placeholder="Enter your observation, issue, or recommendation..." />
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">
                            <i class="pi pi-tag mr-1"></i>Note Type *
                        </label>
                        <Select 
                            v-model="newScopeNote.note_type" 
                            :options="noteTypeOptions" 
                            option-label="label"
                            option-value="value"
                            placeholder="Select note type" 
                            class="w-full">
                            <template #option="slotProps">
                                <div class="flex items-center gap-2">
                                    <i :class="slotProps.option.icon" :style="{ color: slotProps.option.color }"></i>
                                    <span>{{ slotProps.option.label }}</span>
                                </div>
                            </template>
                        </Select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">
                            <i class="pi pi-exclamation-triangle mr-1"></i>Priority
                        </label>
                        <Select 
                            v-model="newScopeNote.priority" 
                            :options="priorityOptions" 
                            option-label="label"
                            option-value="value"
                            placeholder="Select priority" 
                            class="w-full">
                            <template #option="slotProps">
                                <div class="flex items-center gap-2">
                                    <Tag :value="slotProps.option.label" 
                                         :severity="slotProps.option.severity" 
                                         size="small" />
                                </div>
                            </template>
                        </Select>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">
                        <i class="pi pi-hashtag mr-1"></i>Tags
                    </label>
                    <div class="flex flex-wrap gap-2 mb-2" v-if="newScopeNote.tags.length > 0">
                        <Tag v-for="tag in newScopeNote.tags" 
                             :key="tag" 
                             :value="tag" 
                             removable
                             @remove="removeTag(tag)" />
                    </div>
                    <div class="flex gap-2">
                        <InputText 
                            v-model="currentTag" 
                            @keyup.enter="addTag"
                            placeholder="Add tag (press Enter)" 
                            class="flex-1" />
                        <Button 
                            icon="pi pi-plus" 
                            @click="addTag"
                            outlined 
                            size="small" />
                    </div>
                    <!-- Suggested Tags -->
                    <div class="flex gap-1 mt-2" v-if="tagSuggestions.length > 0">
                        <span class="text-xs text-surface-500 mr-2">Suggestions:</span>
                        <Button v-for="suggestion in tagSuggestions" 
                                :key="suggestion"
                                :label="suggestion" 
                                @click="addSuggestedTag(suggestion)"
                                text 
                                size="small" 
                                class="text-xs" />
                    </div>
                </div>
            </div>
            
            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button 
                        label="Cancel" 
                        @click="cancelAddNote" 
                        outlined />
                    <Button 
                        label="Add Note" 
                        @click="addScopeNote" 
                        :disabled="!newScopeNote.note.trim() || !newScopeNote.note_type || !newScopeNote.priority" />
                </div>
            </template>
        </Dialog>

        <!-- Add Task Modal -->
        <Dialog 
            v-model:visible="showAddTaskModal" 
            modal 
            header="Add Remaining Task" 
            :style="{ width: '50rem' }">
            <div class="space-y-4">
                <!-- Task Source Selection -->
                <div>
                    <label class="block text-sm font-medium mb-3">
                        <i class="pi pi-sitemap mr-1"></i>Task Source
                    </label>
                    <div class="grid grid-cols-3 gap-3">
                        <div class="p-3 border rounded cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800"
                             :class="{ 'border-blue-500 bg-blue-50 dark:bg-blue-900': newScopeTask.task_source === 'custom' }"
                             @click="newScopeTask.task_source = 'custom'">
                            <div class="text-center">
                                <i class="pi pi-pencil text-2xl mb-2 text-blue-600"></i>
                                <div class="font-medium">Custom Task</div>
                                <div class="text-xs text-surface-500">Write your own</div>
                            </div>
                        </div>
                        <div class="p-3 border rounded cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800"
                             :class="{ 'border-blue-500 bg-blue-50 dark:bg-blue-900': newScopeTask.task_source === 'project_subtask' }"
                             @click="newScopeTask.task_source = 'project_subtask'">
                            <div class="text-center">
                                <i class="pi pi-list text-2xl mb-2 text-green-600"></i>
                                <div class="font-medium">From Project</div>
                                <div class="text-xs text-surface-500">Select from phases</div>
                            </div>
                        </div>
                        <div class="p-3 border rounded cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800"
                             :class="{ 'border-blue-500 bg-blue-50 dark:bg-blue-900': newScopeTask.task_source === 'template' }"
                             @click="newScopeTask.task_source = 'template'">
                            <div class="text-center">
                                <i class="pi pi-clone text-2xl mb-2 text-purple-600"></i>
                                <div class="font-medium">Template</div>
                                <div class="text-xs text-surface-500">Common tasks</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Project Task Selection (conditional) -->
                <div v-if="newScopeTask.task_source === 'project_subtask'" class="space-y-3">
                    <div class="p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded">
                        <p class="text-sm text-green-700 dark:text-green-300">
                            <i class="pi pi-info-circle mr-2"></i>
                            Select a project phase and task. Title and description will be auto-populated.
                        </p>
                    </div>
                    <!-- Phase, Parent Task, and Subtask dropdowns would go here -->
                    <!-- For now, I'll add placeholders -->
                    <div class="grid grid-cols-3 gap-3">
                        <div>
                            <label class="block text-sm font-medium mb-2">Phase</label>
                            <Select placeholder="Select phase" class="w-full" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">Parent Task</label>
                            <Select placeholder="Select parent task" class="w-full" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">Subtask</label>
                            <Select placeholder="Select subtask" class="w-full" />
                        </div>
                    </div>
                </div>

                <!-- Template Selection (conditional) -->
                <div v-if="newScopeTask.task_source === 'template'" class="space-y-3">
                    <div class="grid grid-cols-2 gap-2">
                        <Button label="📸 Take completion photos" 
                                @click="setTaskTemplate('Take completion photos', 'Take photos showing completed work and equipment installation')"
                                outlined size="small" />
                        <Button label="✅ Verify equipment installation" 
                                @click="setTaskTemplate('Verify equipment installation', 'Check that all equipment is properly installed and configured')"
                                outlined size="small" />
                        <Button label="📋 Document any issues found" 
                                @click="setTaskTemplate('Document any issues found', 'Record any problems or discrepancies discovered during review')"
                                outlined size="small" />
                        <Button label="🔍 Schedule follow-up inspection" 
                                @click="setTaskTemplate('Schedule follow-up inspection', 'Arrange for additional review or completion verification')"
                                outlined size="small" />
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2">Task Title</label>
                    <InputText 
                        v-model="newScopeTask.task_title" 
                        class="w-full" 
                        placeholder="Brief title for the task..." />
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">Task Description</label>
                    <Textarea 
                        v-model="newScopeTask.task_description" 
                        rows="3" 
                        class="w-full" 
                        placeholder="Detailed description of what needs to be completed..." />
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Priority</label>
                        <Select 
                            v-model="newScopeTask.priority" 
                            :options="priorityOptions" 
                            option-label="label"
                            option-value="value"
                            placeholder="Select priority" 
                            class="w-full" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Due Date</label>
                        <DatePicker 
                            v-model="newScopeTask.due_date" 
                            placeholder="Select due date" 
                            class="w-full" />
                    </div>
                </div>
            </div>
            
            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button 
                        label="Cancel" 
                        @click="cancelAddTask" 
                        outlined />
                    <Button 
                        label="Add Task" 
                        @click="addScopeTask" 
                        :disabled="!newScopeTask.task_title.trim()" />
                </div>
            </template>
        </Dialog>

        <!-- Scope Analysis Modal -->
        <Dialog 
            v-model:visible="showScopeAnalysisModal" 
            modal 
            header="AI Scope Analysis" 
            :style="{ width: '55rem' }"
            :closable="analysisProgress.status !== 'in_progress'">
            
            <!-- Analysis Template Selection -->
            <div v-if="analysisProgress.status === 'idle'" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-3">
                        <i class="pi pi-robot mr-1"></i>Analysis Template
                    </label>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="p-4 border rounded cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800"
                             :class="{ 'border-blue-500 bg-blue-50 dark:bg-blue-900': analysisForm.analysis_template === 'complete_scope_analysis' }"
                             @click="analysisForm.analysis_template = 'complete_scope_analysis'">
                            <div class="flex items-start gap-3">
                                <i class="pi pi-cog text-2xl text-blue-600 mt-1"></i>
                                <div>
                                    <div class="font-medium">Complete Scope Analysis</div>
                                    <div class="text-xs text-surface-500 mt-1">Runs all 3 passes + generates installation document</div>
                                    <div class="text-xs text-blue-600 mt-1">• High-level scope review<br>• 45-task categorization<br>• Client validation<br>• Installation document</div>
                                </div>
                            </div>
                        </div>
                        <div class="p-4 border rounded cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800"
                             :class="{ 'border-blue-500 bg-blue-50 dark:bg-blue-900': analysisForm.analysis_template === 'task_validation_only' }"
                             @click="analysisForm.analysis_template = 'task_validation_only'">
                            <div class="flex items-start gap-3">
                                <i class="pi pi-check-square text-2xl text-green-600 mt-1"></i>
                                <div>
                                    <div class="font-medium">Task Validation Only</div>
                                    <div class="text-xs text-surface-500 mt-1">Pass 2 only - detailed task analysis</div>
                                    <div class="text-xs text-green-600 mt-1">• 45-task status check<br>• Completed/Not Completed/Needs Correction<br>• Evidence-based validation</div>
                                </div>
                            </div>
                        </div>
                        <div class="p-4 border rounded cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800"
                             :class="{ 'border-blue-500 bg-blue-50 dark:bg-blue-900': analysisForm.analysis_template === 'client_feedback_review' }"
                             @click="analysisForm.analysis_template = 'client_feedback_review'">
                            <div class="flex items-start gap-3">
                                <i class="pi pi-comments text-2xl text-purple-600 mt-1"></i>
                                <div>
                                    <div class="font-medium">Client Feedback Review</div>
                                    <div class="text-xs text-surface-500 mt-1">Pass 3 only - validate with client data</div>
                                    <div class="text-xs text-purple-600 mt-1">• Percentage completion validation<br>• Client comment analysis<br>• Disputed items identification</div>
                                </div>
                            </div>
                        </div>
                        <div class="p-4 border rounded cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800"
                             :class="{ 'border-blue-500 bg-blue-50 dark:bg-blue-900': analysisForm.analysis_template === 'installation_document' }"
                             @click="analysisForm.analysis_template = 'installation_document'">
                            <div class="flex items-start gap-3">
                                <i class="pi pi-file-export text-2xl text-orange-600 mt-1"></i>
                                <div>
                                    <div class="font-medium">Installation Document</div>
                                    <div class="text-xs text-surface-500 mt-1">Generate final work order document</div>
                                    <div class="text-xs text-orange-600 mt-1">• Remaining scope summary<br>• Technician instructions<br>• Required materials list</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Analysis Options -->
                <div>
                    <label class="block text-sm font-medium mb-3">
                        <i class="pi pi-sliders-h mr-1"></i>Data Sources to Include
                    </label>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="flex items-center">
                            <Checkbox 
                                v-model="analysisForm.analysis_options.include_tickets" 
                                binary 
                                class="mr-2" />
                            <label class="text-sm">Ticket data and posts</label>
                        </div>
                        <div class="flex items-center">
                            <Checkbox 
                                v-model="analysisForm.analysis_options.include_photos" 
                                binary 
                                class="mr-2" />
                            <label class="text-sm">Photo analysis</label>
                        </div>
                        <div class="flex items-center">
                            <Checkbox 
                                v-model="analysisForm.analysis_options.include_client_comments" 
                                binary 
                                class="mr-2" />
                            <label class="text-sm">Site comments</label>
                        </div>
                        <div class="flex items-center">
                            <Checkbox 
                                v-model="analysisForm.analysis_options.include_percentage_data" 
                                binary 
                                class="mr-2" />
                            <label class="text-sm">SmartSheet completion %</label>
                        </div>
                    </div>
                </div>

                <!-- Estimated Analysis Info -->
                <div class="p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded">
                    <div class="flex items-start gap-2">
                        <i class="pi pi-info-circle text-blue-600 mt-0.5"></i>
                        <div class="text-sm text-blue-700 dark:text-blue-300">
                            <div class="font-medium mb-1">Analysis Details:</div>
                            <div v-if="analysisForm.analysis_template === 'complete_scope_analysis'">
                                • Estimated time: 3-5 minutes<br>
                                • Will analyze {{ flynnStore.tickets?.length || 0 }} tickets and {{ flynnStore.totalPhotoCount || 0 }} photos<br>
                                • Generates actionable installation document
                            </div>
                            <div v-else-if="analysisForm.analysis_template === 'task_validation_only'">
                                • Estimated time: 1-2 minutes<br>
                                • Reviews 45 project tasks against ticket evidence<br>
                                • Provides status for each task
                            </div>
                            <div v-else-if="analysisForm.analysis_template === 'client_feedback_review'">
                                • Estimated time: 1-2 minutes<br>
                                • Validates completion percentage with actual evidence<br>
                                • Identifies discrepancies in client feedback
                            </div>
                            <div v-else-if="analysisForm.analysis_template === 'installation_document'">
                                • Estimated time: 30-60 seconds<br>
                                • Uses existing analysis results<br>
                                • Creates field-ready work order
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Analysis Progress -->
            <div v-else-if="analysisProgress.status === 'in_progress'" class="space-y-4 text-center">
                <div class="py-8">
                    <ProgressSpinner class="w-12 h-12" />
                    <div class="mt-4">
                        <h3 class="text-lg font-medium">AI Analysis in Progress</h3>
                        <p class="text-surface-600 dark:text-surface-400 mt-2">{{ analysisProgress.current_pass }}</p>
                        <div class="mt-4">
                            <ProgressBar 
                                :value="Math.round((analysisProgress.passes_completed / analysisProgress.total_passes) * 100)" 
                                class="mb-2" />
                            <div class="text-sm text-surface-500">
                                Pass {{ analysisProgress.passes_completed }} of {{ analysisProgress.total_passes }} completed
                                <span v-if="analysisProgress.estimated_time_remaining"> • {{ analysisProgress.estimated_time_remaining }} remaining</span>
                            </div>
                        </div>
                        
                        <!-- Real-time Connection Status -->
                        <div class="mt-3 text-xs text-surface-400">
                            <span v-if="analysisProgress.eventSource" class="flex items-center justify-center gap-1">
                                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                Real-time updates active
                            </span>
                            <span v-else-if="analysisProgress.pollInterval" class="flex items-center justify-center gap-1">
                                <div class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                Polling for updates
                            </span>
                        </div>
                        
                        <!-- Session Info and Cancel Button -->
                        <div class="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
                            <div class="text-xs text-surface-400 mb-3">
                                Session ID: {{ analysisProgress.session_id }}
                                <span v-if="analysisProgress.timing?.total_duration">
                                    • Running for {{ Math.round(analysisProgress.timing.total_duration) }}s
                                </span>
                            </div>
                            <Button 
                                @click="cancelAnalysis" 
                                severity="secondary" 
                                size="small"
                                icon="pi pi-times"
                                label="Cancel Analysis"
                                class="p-button-outlined p-button-danger"
                            />
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Analysis Failed State -->
            <div v-else-if="analysisProgress.status === 'failed'" class="space-y-4 text-center">
                <div class="py-8">
                    <div class="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="pi pi-exclamation-triangle text-red-600 dark:text-red-400 text-xl"></i>
                    </div>
                    <h3 class="text-lg font-medium text-red-600 dark:text-red-400">Analysis Failed</h3>
                    <p class="text-surface-600 dark:text-surface-400 mt-2">{{ analysisProgress.error_message || analysisProgress.current_pass }}</p>
                    
                    <div class="mt-6 space-x-3">
                        <Button 
                            @click="retryAnalysis" 
                            severity="primary"
                            icon="pi pi-refresh"
                            label="Retry Analysis"
                        />
                        <Button 
                            @click="resetAnalysis" 
                            severity="secondary"
                            icon="pi pi-times"
                            label="Cancel"
                            class="p-button-outlined"
                        />
                    </div>
                </div>
            </div>
            
            <!-- Analysis Cancelled State -->
            <div v-else-if="analysisProgress.status === 'cancelled'" class="space-y-4 text-center">
                <div class="py-8">
                    <div class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="pi pi-pause text-yellow-600 dark:text-yellow-400 text-xl"></i>
                    </div>
                    <h3 class="text-lg font-medium text-yellow-600 dark:text-yellow-400">Analysis Cancelled</h3>
                    <p class="text-surface-600 dark:text-surface-400 mt-2">The analysis was cancelled by user request.</p>
                    
                    <div class="mt-6">
                        <Button 
                            @click="resetAnalysis" 
                            severity="primary"
                            icon="pi pi-play"
                            label="Start New Analysis"
                        />
                    </div>
                </div>
            </div>

            <!-- Analysis Results -->
            <div v-else-if="analysisProgress.status === 'completed'" class="space-y-4">
                <div class="text-center mb-4">
                    <i class="pi pi-check-circle text-4xl text-green-600"></i>
                    <h3 class="text-lg font-medium mt-2">Analysis Complete!</h3>
                    <p class="text-surface-600 dark:text-surface-400">Results have been generated and are ready for review.</p>
                </div>

                <!-- Quick Results Summary -->
                <div class="grid grid-cols-3 gap-4 mb-4">
                    <div class="text-center p-3 bg-green-50 dark:bg-green-900 rounded border">
                        <div class="text-lg font-bold text-green-600">{{ flynnStore.currentAnalysisResults.pass1?.scope_completed?.length || 0 }}</div>
                        <div class="text-xs text-surface-500">Completed Items</div>
                    </div>
                    <div class="text-center p-3 bg-orange-50 dark:bg-orange-900 rounded border">
                        <div class="text-lg font-bold text-orange-600">{{ flynnStore.currentAnalysisResults.pass1?.remaining_scope?.length || 0 }}</div>
                        <div class="text-xs text-surface-500">Remaining Items</div>
                    </div>
                    <div class="text-center p-3 bg-blue-50 dark:bg-blue-900 rounded border">
                        <div class="text-lg font-bold text-blue-600">{{ flynnStore.currentAnalysisResults.pass2?.pass_2_analysis_summary?.needs_correction_count || 0 }}</div>
                        <div class="text-xs text-surface-500">Need Correction</div>
                    </div>
                </div>

                <div class="text-center">
                    <Button 
                        label="View Full Results" 
                        icon="pi pi-eye" 
                        @click="viewAnalysisResults"
                        class="mr-3" />
                    <Button 
                        label="Generate Installation Document" 
                        icon="pi pi-file-export" 
                        @click="generateInstallationDocument"
                        :disabled="!flynnStore.currentAnalysisResults.pass1"
                        outlined />
                </div>
            </div>
            
            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button 
                        v-if="analysisProgress.status === 'idle'"
                        label="Cancel" 
                        @click="showScopeAnalysisModal = false" 
                        outlined />
                    <Button 
                        v-if="analysisProgress.status === 'idle'"
                        label="Start Analysis" 
                        @click="startScopeAnalysis" 
                        :disabled="!analysisForm.analysis_template"
                        icon="pi pi-play" />
                    <Button 
                        v-if="analysisProgress.status === 'completed'"
                        label="Close" 
                        @click="showScopeAnalysisModal = false" />
                    <Button 
                        v-if="analysisProgress.status === 'failed'"
                        label="Try Again" 
                        @click="resetAnalysis" 
                        icon="pi pi-refresh" />
                </div>
            </template>
        </Dialog>

        <!-- Deduplication Review Modal -->
        <Dialog v-model:visible="showDeduplicationModal" 
                modal 
                header="Review Potential Duplicates" 
                :style="{ width: '80vw', maxHeight: '80vh' }"
                :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
            <div v-if="flynnStore.scopeDeduplication.length > 0" class="space-y-4">
                <div class="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded">
                    <div class="text-sm text-yellow-800 dark:text-yellow-200">
                        <i class="pi pi-info-circle mr-2"></i>
                        The AI has identified {{ flynnStore.scopeDeduplication.length }} potential duplicate{{ flynnStore.scopeDeduplication.length !== 1 ? 's' : '' }} 
                        across different analysis passes. Review these items to determine if they represent the same work.
                    </div>
                </div>

                <div v-for="(duplicate, index) in flynnStore.scopeDeduplication" 
                     :key="`duplicate-${index}`" 
                     class="p-4 border border-surface-200 dark:border-surface-700 rounded">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <!-- Item 1 -->
                        <div class="p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded">
                            <div class="flex items-center gap-2 mb-2">
                                <Tag :value="duplicate.item_1.type.replace('_', ' ').toUpperCase()" 
                                     severity="info" 
                                     size="small" />
                                <span class="text-xs text-surface-500">Source: {{ duplicate.item_1.source || 'Unknown' }}</span>
                            </div>
                            <div class="font-medium text-surface-900 dark:text-surface-0 mb-2">
                                {{ duplicate.item_1.description || duplicate.item_1.task_name || duplicate.item_1.item_name }}
                            </div>
                            <div v-if="duplicate.item_1.evidence_source" class="text-xs text-surface-600 dark:text-surface-400">
                                Evidence: {{ duplicate.item_1.evidence_source }}
                            </div>
                        </div>

                        <!-- Item 2 -->
                        <div class="p-3 bg-orange-50 dark:bg-orange-900 border border-orange-200 dark:border-orange-700 rounded">
                            <div class="flex items-center gap-2 mb-2">
                                <Tag :value="duplicate.item_2.type.replace('_', ' ').toUpperCase()" 
                                     severity="warning" 
                                     size="small" />
                                <span class="text-xs text-surface-500">Source: {{ duplicate.item_2.source || 'Unknown' }}</span>
                            </div>
                            <div class="font-medium text-surface-900 dark:text-surface-0 mb-2">
                                {{ duplicate.item_2.description || duplicate.item_2.task_name || duplicate.item_2.item_name }}
                            </div>
                            <div v-if="duplicate.item_2.evidence_source" class="text-xs text-surface-600 dark:text-surface-400">
                                Evidence: {{ duplicate.item_2.evidence_source }}
                            </div>
                        </div>
                    </div>

                    <!-- Similarity Info -->
                    <div class="mt-3 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="text-sm">
                                <span class="font-medium">Similarity:</span>
                                <Tag :value="`${Math.round(duplicate.similarity_score * 100)}%`" 
                                     :severity="duplicate.similarity_score > 0.9 ? 'danger' : duplicate.similarity_score > 0.7 ? 'warning' : 'info'" 
                                     size="small" 
                                     class="ml-1" />
                            </div>
                            <div v-if="duplicate.recommendation" class="text-sm">
                                <span class="font-medium">Recommendation:</span>
                                <Tag :value="duplicate.recommendation.replace('_', ' ')" 
                                     :severity="duplicate.recommendation === 'merge_required' ? 'danger' : 'warning'" 
                                     size="small" 
                                     class="ml-1" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="Close" 
                            icon="pi pi-times" 
                            @click="showDeduplicationModal = false" 
                            outlined />
                    <Button label="Generate Installation Document" 
                            icon="pi pi-file-export" 
                            @click="generateEnhancedInstallationDocument(); showDeduplicationModal = false" 
                            :disabled="!flynnStore.currentAnalysisResults.pass1" />
                </div>
            </template>
        </Dialog>

        <!-- Installation Document Viewer -->
        <InstallationDocumentViewer 
            v-model:visible="showInstallationDocumentViewer"
            :document="flynnStore.currentInstallationDocument"
            :session-id="flynnStore.selectedSessionId"
            :location-id="flynnStore.selectedLocation?.id"
            :document-length="flynnStore.installationDocumentState.documentLength"
            :last-generated="flynnStore.installationDocumentState.lastGenerated"
            :loading="flynnStore.installationDocumentState.generating"
            @generate-document="handleGenerateInstallationDocument"
        />

        <!-- Scope Management Modal -->
        <ScopeManagementModal 
            v-model:visible="showScopeManagementModal"
            @scope-updated="onScopeUpdated"
        />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useFlynnStore } from '@/stores/flynnStore';
import { usePhotosStore } from '@/stores/photosStore';

// PrimeVue Components
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Select from 'primevue/select';
import ProgressBar from 'primevue/progressbar';
import Tag from 'primevue/tag';
import Badge from 'primevue/badge';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import InputNumber from 'primevue/inputnumber';
import DatePicker from 'primevue/datepicker';
import Avatar from 'primevue/avatar';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Drawer from 'primevue/drawer';
import Textarea from 'primevue/textarea';
import ProgressSpinner from 'primevue/progressspinner';
import Checkbox from 'primevue/checkbox';

// Photo Components
import PhotoGalleria from '@/components/photos/PhotoGalleria.vue';

// Flynn Components
import InstallationDocumentViewer from '@/components/flynn/InstallationDocumentViewer.vue';
import ScopeManagementModal from '@/components/flynn/ScopeManagementModal.vue';

// Store
const flynnStore = useFlynnStore();
const photosStore = usePhotosStore();

// Reactive Data
const searchQuery = ref('');
const statusFilter = ref('');
const completionFilter = ref('');
const issuesFilter = ref('');
const showFilters = ref(false);
// Removed local selectedLocation - using flynnStore.selectedLocation instead
const showTicketDrawer = ref(false);
const showCommentsDrawer = ref(false);
const showAddNotesModal = ref(false);
const showAddTaskModal = ref(false);
const showScopeAnalysisModal = ref(false);
const newNote = ref('');
const selectedTicket = ref(null);

// Enhanced scope analysis state
const showDeduplicationModal = ref(false);
const installDocLoading = ref(false);

// Installation Document Viewer state
const showInstallationDocumentViewer = ref(false);
const showScopeManagementModal = ref(false);

// Scope Analysis state
const analysisProgress = ref({
    status: 'idle', // idle|in_progress|completed|failed|cancelled
    passes_completed: 0,
    total_passes: 3,
    current_pass: '',
    estimated_time_remaining: '',
    session_id: null,
    eventSource: null,
    pollInterval: null,
    last_update: null,
    timing: {
        started_at: null,
        pass_1_duration: null,
        pass_2_duration: null,
        pass_3_duration: null,
        total_duration: null
    },
    error_message: null,
    show_retry_button: false
});

const analysisResults = ref({
    pass1: null, // High-level scope completed vs remaining
    pass2: null, // 45-task categorization 
    pass3: null, // Client validation
    installation_document: null
});

const analysisForm = ref({
    analysis_template: 'complete_scope_analysis',
    analysis_options: {
        include_tickets: true,
        include_photos: true,
        include_client_comments: true,
        include_percentage_data: true
    }
});

// Form state for scope review notes and tasks
const newScopeNote = ref({
    note: '',
    note_type: 'general',
    priority: 'medium',
    tags: []
});

const newScopeTask = ref({
    task_title: '',
    task_description: '',
    task_source: 'custom',
    priority: 'medium',
    due_date: null
});

// Removed status filter options since we're not showing status

const completionFilterOptions = ref([
    { label: 'All Completion %', value: '' },
    { label: '80% and above', value: 'above_80' },
    { label: '50% to 79%', value: '50_to_79' },
    { label: 'Below 50%', value: 'below_50' }
]);

const issuesFilterOptions = ref([
    { label: 'All Issues', value: '' },
    { label: 'Has Issues', value: 'has_issues' },
    { label: 'No Issues', value: 'no_issues' }
]);

// Computed Properties
const filteredLocations = computed(() => {
    let locations = flynnStore.locations || [];
    
    // Search filter
    if (searchQuery.value) {
        const search = searchQuery.value.toLowerCase();
        locations = locations.filter(location => 
            location.locationName?.toLowerCase().includes(search) ||
            location.siteNumber?.toString().includes(search) ||
            location.city?.toLowerCase().includes(search) ||
            location.state?.toLowerCase().includes(search)
        );
    }
    
    // No status filtering - removed since we're not showing status
    
    // Completion filter - just numerical ranges, no interpretation
    if (completionFilter.value) {
        locations = locations.filter(location => {
            const completion = location.completionPercentage || 0;
            switch (completionFilter.value) {
                case 'above_80': return completion >= 80;
                case '50_to_79': return completion >= 50 && completion < 80;
                case 'below_50': return completion < 50;
                default: return true;
            }
        });
    }
    
    // Issues filter
    if (issuesFilter.value) {
        locations = locations.filter(location => {
            const hasIssues = (location.issueCount || 0) > 0;
            return issuesFilter.value === 'has_issues' ? hasIssues : !hasIssues;
        });
    }
    
    return locations;
});

const highCompletionCount = computed(() => {
    // Just count locations above 80% - no interpretation of "completed"
    return flynnStore.locations?.filter(location => 
        (location.completionPercentage || 0) >= 80
    ).length || 0;
});

// Helper function to extract completion fields
const getCompletionFields = (data) => {
    if (!data) return {};
    
    // Extract all boolean completion fields
    const completionFields = {};
    const booleanFields = [
        'picture_cables_patch_panel', 'backer_board_installation', 'rack_equipment_installation',
        'ocb_moved_old_patch_panel', 'abatement_completed', 'picture_drop_parity_test',
        'no_free_ran_cables_wall', 'front_counter_cable_orderly', 'picture_drop_labeling_color',
        'use_of_j_hooks', 'cable_path_ceiling', 'envr_correctly_patched', 'old_equipment_removed'
    ];
    
    booleanFields.forEach(field => {
        if (data[field] !== undefined) {
            completionFields[field] = data[field];
        }
    });
    
    return completionFields;
};

// Helper function to format field names for display
const formatFieldName = (fieldName) => {
    return fieldName
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
};

// Removed unused computed properties (recentActivity, keyIssues) since Overview tab was removed

// Methods
const selectLocation = (location) => {
    console.log('Selecting location:', location);
    flynnStore.selectLocation(location);
    console.log('Store selected location:', flynnStore.selectedLocation);
    // Debug: Check tickets in UI
    setTimeout(() => {
        console.log('UI Debug - flynnStore.tickets:', flynnStore.tickets);
        console.log('UI Debug - tickets length:', flynnStore.tickets?.length);
        console.log('UI Debug - first ticket:', flynnStore.tickets?.[0]);
    }, 2000);

};

const refreshData = async () => {
    await flynnStore.fetchLocations();
};

// Removed all status-related functions - just showing raw completion percentage

const getCompletionTextClass = (percentage) => {
    // Just return neutral text color - no interpretation of what's "good" or "bad"
    return 'text-surface-900 dark:text-surface-0';
};

const getCompletionProgressClass = (percentage) => {
    // Just return neutral progress bar - no color coding
    return 'completion-neutral';
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const formatRelativeDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return formatDate(dateString);
};

// Removed unused issue styling methods since Overview tab was removed

// Lifecycle
onMounted(() => {
  console.log('Component mounted, fetching data...');
  flynnStore.fetchLocations();
  flynnStore.fetchProjectInformation();
});

onUnmounted(() => {
  console.log('Component unmounting, cleaning up progress tracking...');
  cleanupProgressTracking();
});

// Debug: Watch tickets changes
watch(() => flynnStore.tickets, (newTickets, oldTickets) => {
    console.log('Watcher - Tickets changed!');
    console.log('  Old tickets length:', oldTickets?.length || 0);
    console.log('  New tickets length:', newTickets?.length || 0);
    console.log('  New tickets:', newTickets);
}, { deep: true, immediate: true });

// Debug: Watch ticketPosts changes
watch(() => flynnStore.ticketPosts, (newPosts, oldPosts) => {
    console.log('Watcher - TicketPosts changed!');
    console.log('  New posts keys:', Object.keys(newPosts || {}));
    console.log('  Total posts:', Object.values(newPosts || {}).flat().length);
}, { deep: true, immediate: true });

const openTicketDrawer = (event) => {
    selectedTicket.value = event.data;
    showTicketDrawer.value = true;
};

// New methods for Project Information Accordion
const getTotalTasks = () => {
    return flynnStore.projectPhases?.reduce((sum, phase) => sum + (phase.parent_tasks?.length || 0), 0) || 0;
};

const getTotalSubtasks = () => {
    return flynnStore.projectPhases?.reduce((sum, phase) => sum + (phase.parent_tasks?.reduce((subSum, task) => subSum + (task.subtasks?.length || 0), 0) || 0), 0) || 0;
};

const formatMarkdown = (markdown) => {
    if (!markdown) return '';
    // This is a placeholder for a markdown-to-HTML converter.
    // In a real application, you would use a library like marked.js or similar.
    // For now, it just returns the raw markdown.
    return markdown;
};

const togglePhaseDetails = async (phase) => {
    if (phase.tasksLoaded) {
        phase.tasksLoaded = false;
    } else {
        try {
            await flynnStore.fetchPhaseDetails(phase.phase_id);
            // The store method updates the phase in place, so we just need to mark it as loaded
            phase.tasksLoaded = true;
        } catch (error) {
            console.error('Error loading phase details:', error);
        }
    }
};

const startScopeReview = () => {
    if (flynnStore.selectedLocation) {
        flynnStore.startScopeReview(flynnStore.selectedLocation.id);
    } else {
        console.warn('No location selected for scope review.');
    }
};

const scopeReviewStarted = computed(() => {
    return flynnStore.scopeReviewStarted;
});

// New methods for Add Note Modal
const noteTypeOptions = ref([
    { label: 'General', value: 'general', icon: 'pi pi-tag', color: '#4F46E5' },
    { label: 'Scope Review', value: 'scope_review', icon: 'pi pi-info-circle', color: '#10B981' },
    { label: 'Task Update', value: 'task_update', icon: 'pi pi-check-circle', color: '#3B82F6' },
    { label: 'Issue Report', value: 'issue_report', icon: 'pi pi-exclamation-triangle', color: '#EF4444' },
    { label: 'Photo Review', value: 'photo_review', icon: 'pi pi-image', color: '#F59E0B' }
]);

const priorityOptions = ref([
    { label: 'Low', value: 'low', severity: 'info', icon: 'pi pi-arrow-down' },
    { label: 'Medium', value: 'medium', severity: 'warning', icon: 'pi pi-exclamation-triangle' },
    { label: 'High', value: 'high', severity: 'danger', icon: 'pi pi-arrow-up' },
    { label: 'Urgent', value: 'urgent', severity: 'danger', icon: 'pi pi-bolt' }
]);

const addScopeNote = () => {
    if (flynnStore.selectedLocation) {
        flynnStore.addScopeReviewNote(flynnStore.selectedLocation.id, newScopeNote.value);
        showAddNotesModal.value = false;
        newScopeNote.value = {
            note: '',
            note_type: 'general',
            priority: 'medium',
            tags: []
        };
    } else {
        console.warn('No location selected for adding a note.');
    }
};

const cancelAddNote = () => {
    showAddNotesModal.value = false;
    newScopeNote.value = {
        note: '',
        note_type: 'general',
        priority: 'medium',
        tags: []
    };
};

// New methods for Add Note Modal
const currentTag = ref('');
const tagSuggestions = ref(['wiring', 'equipment', 'documentation', 'safety', 'network', 'photos']);

const addTag = () => {
    if (currentTag.value && !newScopeNote.value.tags.includes(currentTag.value)) {
        newScopeNote.value.tags.push(currentTag.value);
        currentTag.value = '';
        tagSuggestions.value = []; // Clear suggestions after adding
    }
};

const removeTag = (tagToRemove) => {
    newScopeNote.value.tags = newScopeNote.value.tags.filter(tag => tag !== tagToRemove);
    if (newScopeNote.value.tags.length === 0) {
        newScopeNote.value.tags = []; // Ensure it's an empty array if all tags are removed
    }
};

const addSuggestedTag = (suggestedTag) => {
    if (!newScopeNote.value.tags.includes(suggestedTag)) {
        newScopeNote.value.tags.push(suggestedTag);
        currentTag.value = '';
        tagSuggestions.value = []; // Clear suggestions after adding
    }
};

const setQuickNote = (noteText, noteType, priority) => {
    newScopeNote.value.note = noteText;
    newScopeNote.value.note_type = noteType;
    newScopeNote.value.priority = priority;
};

// New methods for Add Task Modal
const addScopeTask = () => {
    if (flynnStore.selectedLocation) {
        flynnStore.addScopeReviewTask(flynnStore.selectedLocation.id, newScopeTask.value);
        showAddTaskModal.value = false;
        newScopeTask.value = {
            task_title: '',
            task_description: '',
            task_source: 'custom',
            priority: 'medium',
            due_date: null
        };
    } else {
        console.warn('No location selected for adding a task.');
    }
};

const cancelAddTask = () => {
    showAddTaskModal.value = false;
    newScopeTask.value = {
        task_title: '',
        task_description: '',
        task_source: 'custom',
        priority: 'medium',
        due_date: null
    };
};

const setTaskTemplate = (title, description) => {
    newScopeTask.value.task_title = title;
    newScopeTask.value.task_description = description;
    newScopeTask.value.task_source = 'template';
};

// New methods for Scope Analysis Modal
const startScopeAnalysis = async () => {
    if (!flynnStore.selectedLocation) {
        console.warn('No location selected for scope analysis.');
        return;
    }

    analysisProgress.value.status = 'in_progress';
    analysisProgress.value.passes_completed = 0;
    analysisProgress.value.current_pass = 'Initializing analysis...';
    analysisProgress.value.estimated_time_remaining = '3-5 minutes';
    analysisProgress.value.session_id = null;
    analysisResults.value = { pass1: null, pass2: null, pass3: null, installation_document: null };

    try {
        // Start async analysis
        console.log('🚀 Starting scope analysis for location:', flynnStore.selectedLocation.id, 'with form:', {
            ...analysisForm.value,
            async: true
        });
        
        const startTime = Date.now();
        const response = await flynnStore.startScopeAnalysis(flynnStore.selectedLocation.id, {
            ...analysisForm.value,
            async: true // Enable async mode for SSE
        });
        const responseTime = Date.now() - startTime;
        
        console.log('📡 Backend response received after', responseTime, 'ms');
        console.log('📋 Async analysis response:', response);
        console.log('🔍 Response has session_id:', !!response.session_id);
        console.log('🔍 Response has pass_1:', !!response.pass_1);
        console.log('🔍 Response has analysis_results:', !!response.analysis_results);
        console.log('⏱️ Response time indicates:', responseTime > 30000 ? 'BACKEND WAITED FOR COMPLETION' : responseTime > 1000 ? 'POSSIBLE QUEUE PROCESSING' : 'IMMEDIATE RESPONSE');
        
        // Check if we got a session_id (async mode) or immediate results (sync mode)
        if (response.session_id && !response.pass_1 && !response.analysis_results) {
            // True async mode - analysis is queued/in progress
            analysisProgress.value.session_id = response.session_id;
            console.log('🔄 TRUE ASYNC MODE: Connecting to progress stream for session:', response.session_id);
            
            // Small delay to ensure backend has time to set up the session
            setTimeout(() => {
                connectToProgressStream(response.session_id);
            }, 100);
        } else if (response.session_id && (response.pass_1 || response.analysis_results)) {
            // Async mode but backend waited for completion - results are ready
            console.log('⚡ ASYNC MODE - BACKEND WAITED FOR COMPLETION: Processing results immediately');
            console.log('ℹ️ This means your backend processed the analysis but waited to return complete results');
            console.log('ℹ️ To get real-time updates, backend should return immediately with just session_id');
            analysisProgress.value.session_id = response.session_id;
            analysisCompleted(response);
        } else if (response.pass_1 || response.analysis_results) {
            // Sync mode - backend returned completed results immediately (no session)
            console.log('🔄 SYNC MODE: Backend returned immediate results, processing synchronously');
            handleSynchronousResponse(response);
        } else {
            console.error('❌ UNEXPECTED RESPONSE FORMAT:', response);
            throw new Error('Invalid response format from backend');
        }
        
    } catch (error) {
        console.error('💥 Error starting scope analysis:', error);
        analysisProgress.value.status = 'failed';
        analysisProgress.value.current_pass = 'Failed to start analysis';
        analysisProgress.value.estimated_time_remaining = '';
    }
};

// Connect to Server-Sent Events for real-time progress updates
const connectToProgressStream = (sessionId) => {
    if (!sessionId) {
        console.error('No session ID provided for progress stream');
        return;
    }

    // Create EventSource with authentication - fix double /api/ issue
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    const progressUrl = `${baseUrl}/flynn/scope-analysis/${sessionId}/progress`;
    console.log('Connecting to SSE endpoint:', progressUrl);
    console.log('Base URL:', baseUrl);
    console.log('Session ID:', sessionId);
    
    const eventSource = new EventSource(progressUrl);

    eventSource.onopen = () => {
        console.log('✅ Progress stream connected successfully');
    };

    eventSource.onmessage = (event) => {
        try {
            console.log('📨 Raw SSE message received:', event.data);
            const data = JSON.parse(event.data);
            console.log('📊 Parsed progress update:', data);
            
            switch (data.type) {
                case 'progress':
                    updateAnalysisProgress(data.data);
                    break;
                    
                case 'completed':
                    analysisCompleted(data.data);
                    eventSource.close();
                    break;
                    
                case 'failed':
                    analysisFailed(data.message || 'Analysis failed');
                    eventSource.close();
                    break;
                    
                case 'timeout':
                    analysisTimeout();
                    eventSource.close();
                    break;
                    
                default:
                    console.log('❓ Unknown progress event type:', data.type);
            }
        } catch (error) {
            console.error('❌ Error parsing progress data:', error);
        }
    };

    eventSource.onerror = (error) => {
        console.log('❌ Progress stream error, falling back to polling:', error);
        console.log('EventSource readyState:', eventSource.readyState);
        eventSource.close();
        
        // Fallback to polling
        startProgressPolling(sessionId);
    };

    // Store reference for cleanup
    analysisProgress.value.eventSource = eventSource;
};

// Fallback polling for unreliable connections
const startProgressPolling = (sessionId) => {
    console.log('Starting progress polling for session:', sessionId);
    
    const pollInterval = setInterval(async () => {
        try {
            const progressData = await flynnStore.getScopeAnalysisProgress(sessionId);
            console.log('Polling progress data:', progressData);
            
            // Check if analysis is still in progress
            if (progressData.status === 'in_progress' || progressData.status === 'queued') {
                updateAnalysisProgress(progressData);
            } else if (progressData.status === 'completed') {
                clearInterval(pollInterval);
                // For completed status, we need to get the full results
                try {
                    const fullResults = await flynnStore.getScopeAnalysisResults(flynnStore.selectedLocation.id, sessionId);
                    console.log('Retrieved full analysis results:', fullResults);
                    analysisCompleted(fullResults);
                } catch (error) {
                    console.error('Error retrieving full results:', error);
                    // Fallback to progress data if it contains results
                    if (progressData.analysis_results || progressData.pass_1) {
                        analysisCompleted(progressData);
                    } else {
                        analysisFailed('Failed to retrieve analysis results');
                    }
                }
            } else if (progressData.status === 'failed') {
                clearInterval(pollInterval);
                analysisFailed(progressData.error_message || 'Analysis failed');
            }
        } catch (error) {
            console.error('Polling error:', error);
            // Continue polling unless it's a critical error
            if (error.response?.status === 404) {
                clearInterval(pollInterval);
                analysisFailed('Analysis session not found');
            }
        }
    }, 2000); // Poll every 2 seconds
    
    // Store reference for cleanup
    analysisProgress.value.pollInterval = pollInterval;
};

// Update progress display with real-time data
const updateAnalysisProgress = (progressData) => {
    console.log('Updating analysis progress:', progressData);
    
    analysisProgress.value.status = 'in_progress';
    analysisProgress.value.current_pass = progressData.current_step || progressData.current_pass || 'Processing...';
    
    // Calculate passes completed based on progress percentage
    const percentage = progressData.progress_percentage || 0;
    analysisProgress.value.passes_completed = Math.floor(percentage / 33.33);
    
    // Update timing information if available
    if (progressData.timing) {
        const timing = progressData.timing;
        const elapsed = timing.total_duration || 0;
        
        if (percentage > 0 && percentage < 100) {
            // Calculate estimated time remaining based on elapsed time and progress
            const totalEstimated = (elapsed / percentage) * 100;
            const remaining = totalEstimated - elapsed;
            
            if (remaining > 60) {
                analysisProgress.value.estimated_time_remaining = `${Math.ceil(remaining / 60)} minutes`;
            } else if (remaining > 0) {
                analysisProgress.value.estimated_time_remaining = `${Math.ceil(remaining)} seconds`;
            } else {
                analysisProgress.value.estimated_time_remaining = 'Almost done...';
            }
        } else if (percentage >= 100) {
            analysisProgress.value.estimated_time_remaining = 'Finalizing...';
        }
        
        // Store timing details for display
        analysisProgress.value.timing = {
            started_at: timing.started_at,
            pass_1_duration: timing.pass_1_duration,
            pass_2_duration: timing.pass_2_duration,
            pass_3_duration: timing.pass_3_duration,
            total_duration: timing.total_duration
        };
    }
    
    // Store last update timestamp
    if (progressData.last_update) {
        analysisProgress.value.last_update = progressData.last_update;
    }
};

// Handle analysis completion
const analysisCompleted = (completedData) => {
    console.log('Analysis completed:', completedData);
    
    analysisProgress.value.status = 'completed';
    analysisProgress.value.passes_completed = 3;
    analysisProgress.value.current_pass = 'Analysis complete';
    analysisProgress.value.estimated_time_remaining = '';
    
    // Handle different response formats
    let resultsData = null;
    
    if (completedData.analysis_results) {
        // Format: { analysis_results: { pass_1: ..., pass_2: ..., pass_3: ... } }
        resultsData = completedData.analysis_results;
        console.log('Using analysis_results format');
    } else if (completedData.pass_1) {
        // Format: { pass_1: ..., pass_2: ..., pass_3: ... }
        resultsData = completedData;
        console.log('Using direct pass format');
    } else if (completedData.data && completedData.data.analysis_results) {
        // Format: { data: { analysis_results: { pass_1: ..., pass_2: ..., pass_3: ... } } }
        resultsData = completedData.data.analysis_results;
        console.log('Using nested data.analysis_results format');
    } else if (completedData.data && completedData.data.pass_1) {
        // Format: { data: { pass_1: ..., pass_2: ..., pass_3: ... } }
        resultsData = completedData.data;
        console.log('Using nested data pass format');
    }
    
    if (resultsData) {
        // Update the store's current analysis results
        flynnStore.currentAnalysisResults = {
            pass1: resultsData.pass_1 || null,
            pass2: resultsData.pass_2 || null,
            pass3: resultsData.pass_3 || null,
            installation_document: resultsData.installation_document || null
        };
        console.log('Analysis results successfully stored in store:', flynnStore.currentAnalysisResults);
        
        // Store the session ID if available
        if (completedData.session_id) {
            flynnStore.selectedSessionId = completedData.session_id;
        }
        
        // Refresh the session list to include the new analysis
        if (flynnStore.selectedLocation) {
            flynnStore.fetchScopeAnalysisSessions(flynnStore.selectedLocation.id).catch(error => {
                console.warn('Failed to refresh session list:', error);
            });
        }
    } else {
        console.error('Could not extract analysis results from:', completedData);
        flynnStore.currentAnalysisResults = { pass1: null, pass2: null, pass3: null, installation_document: null };
    }
    
    cleanupProgressTracking();

};

// Handle analysis failure
const analysisFailed = (errorMessage) => {
    console.error('Analysis failed:', errorMessage);
    
    analysisProgress.value.status = 'failed';
    analysisProgress.value.current_pass = errorMessage || 'Analysis failed';
    analysisProgress.value.estimated_time_remaining = '';
    analysisProgress.value.error_message = errorMessage;
    analysisProgress.value.show_retry_button = true;
    
    cleanupProgressTracking();



};

// Handle analysis timeout
const analysisTimeout = () => {
    console.warn('Analysis timed out');
    
    analysisProgress.value.status = 'failed';
    analysisProgress.value.current_pass = 'Analysis timed out - please try again';
    analysisProgress.value.estimated_time_remaining = '';
    analysisProgress.value.error_message = 'Analysis session timed out after 5 minutes';
    analysisProgress.value.show_retry_button = true;
    
    cleanupProgressTracking();



};

// Cleanup progress tracking resources
const cleanupProgressTracking = () => {
    if (analysisProgress.value.eventSource) {
        analysisProgress.value.eventSource.close();
        analysisProgress.value.eventSource = null;
    }
    
    if (analysisProgress.value.pollInterval) {
        clearInterval(analysisProgress.value.pollInterval);
        analysisProgress.value.pollInterval = null;
    }
};

// Cancel analysis functionality for queue worker jobs
const cancelAnalysis = async () => {
    if (!analysisProgress.value.session_id) {
        console.warn('No active analysis session to cancel');
        return;
    }

    try {
        console.log('Cancelling analysis session:', analysisProgress.value.session_id);
        
        const response = await flynnStore.cancelScopeAnalysis(analysisProgress.value.session_id);
        
        if (response.success) {
            console.log('Analysis cancelled successfully');
            
            // Clean up frontend state
            cleanupProgressTracking();



            
            // Update UI to cancelled state
            analysisProgress.value.status = 'cancelled';
            analysisProgress.value.current_pass = 'Analysis cancelled by user';
            analysisProgress.value.estimated_time_remaining = '';
            
            // Show success message
            showScopeAnalysisModal.value = false;
            
        } else {
            throw new Error(response.message || 'Failed to cancel analysis');
        }
    } catch (error) {
        console.error('Failed to cancel analysis:', error);
        analysisProgress.value.current_pass = 'Failed to cancel analysis';
    }
};

// Retry analysis functionality
const retryAnalysis = async () => {
    console.log('Retrying analysis...');
    
    // Reset error state and progress
    analysisProgress.value.status = 'idle';
    analysisProgress.value.current_pass = '';
    analysisProgress.value.estimated_time_remaining = '';
    analysisProgress.value.error_message = null;
    analysisProgress.value.show_retry_button = false;
    analysisProgress.value.passes_completed = 0;
    analysisProgress.value.session_id = null;
    analysisProgress.value.last_update = null;
    analysisProgress.value.timing = {
        started_at: null,
        pass_1_duration: null,
        pass_2_duration: null,
        pass_3_duration: null,
        total_duration: null
    };
    
    // Start new analysis
    await startScopeAnalysis();
};

// Handle synchronous response (fallback for old backend)
const handleSynchronousResponse = (results) => {
    console.log('Handling synchronous response:', results);
    
    if (results.status === 'completed') {
        analysisProgress.value.status = 'completed';
        analysisProgress.value.passes_completed = 3;
        analysisProgress.value.current_pass = 'Analysis complete';
        analysisProgress.value.estimated_time_remaining = '';
        
        flynnStore.currentAnalysisResults = {
            pass1: results.pass_1 || null,
            pass2: results.pass_2 || null,
            pass3: results.pass_3 || null,
            installation_document: null
        };
        
        console.log('Synchronous analysis results stored in store:', flynnStore.currentAnalysisResults);
        
        // Store the session ID if available
        if (results.session_id) {
            flynnStore.selectedSessionId = results.session_id;
        }
        
        // Refresh the session list to include the new analysis
        if (flynnStore.selectedLocation) {
            flynnStore.fetchScopeAnalysisSessions(flynnStore.selectedLocation.id).catch(error => {
                console.warn('Failed to refresh session list:', error);
            });
        }
    }
};

const viewAnalysisResults = () => {
    // Close the analysis modal
    showScopeAnalysisModal.value = false;
    
    console.log('Viewing full analysis results:', flynnStore.currentAnalysisResults);
    console.log('Pass1 exists:', !!flynnStore.currentAnalysisResults.pass1);
    console.log('Pass2 exists:', !!flynnStore.currentAnalysisResults.pass2);
    console.log('Pass3 exists:', !!flynnStore.currentAnalysisResults.pass3);
    console.log('Condition result:', !!(flynnStore.currentAnalysisResults.pass1 || flynnStore.currentAnalysisResults.pass2 || flynnStore.currentAnalysisResults.pass3));
    
    // Scroll to the AI Analysis Results section if it exists
    setTimeout(() => {
        const analysisSection = document.querySelector('[data-analysis-results]');
        console.log('Analysis section found:', !!analysisSection);
        if (analysisSection) {
            console.log('Scrolling to analysis section');
            analysisSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            console.error('Analysis section not found - checking if results are properly loaded');
            console.log('Current analysisResults:', flynnStore.currentAnalysisResults);
        }
    }, 100);
};

const generateInstallationDocument = async () => {
    if (!flynnStore.selectedLocation) {
        console.warn('No location selected for installation document generation.');
        return;
    }

    try {
        const document = await flynnStore.generateInstallationDocument(flynnStore.selectedLocation.id);
        analysisResults.value.installation_document = document;
        console.log('Installation document generated:', document);
        // Optionally, show a success message or open the document in a new tab
    } catch (error) {
        console.error('Error generating installation document:', error);
        // Optionally, show an error message
    }
};

const resetAnalysis = () => {
    cleanupProgressTracking();



    
    analysisProgress.value.status = 'idle';
    analysisProgress.value.passes_completed = 0;
    analysisProgress.value.current_pass = '';
    analysisProgress.value.estimated_time_remaining = '';
    analysisProgress.value.session_id = null;
    analysisProgress.value.last_update = null;
    analysisProgress.value.timing = {
        started_at: null,
        pass_1_duration: null,
        pass_2_duration: null,
        pass_3_duration: null,
        total_duration: null
    };
    analysisProgress.value.error_message = null;
    analysisProgress.value.show_retry_button = false;
    analysisResults.value = { pass1: null, pass2: null, pass3: null, installation_document: null };
};

const exportAnalysisResults = () => {
    // Export analysis results as JSON or PDF
    const dataToExport = {
        location: {
            id: flynnStore.selectedLocation.id,
            site_number: flynnStore.selectedLocation.siteNumber,
            location_name: flynnStore.selectedLocation.locationName,
            address: flynnStore.selectedLocation.address
        },
        analysis_results: analysisResults.value,
        analysis_timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flynn-analysis-${flynnStore.selectedLocation.siteNumber}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const onScopeUpdated = (finalizedScopeItems) => {
    console.log('Scope updated with finalized items:', finalizedScopeItems);
    // TODO: Update the flynnStore with the finalized scope
    // TODO: Trigger installation document generation with the new scope
    // TODO: Show success message
    showScopeManagementModal.value = false;
};

// Computed Properties
const issueCount = computed(() => {
    const data = flynnStore.selectedLocation?.siteComments || [];
    return data.filter(comment => comment.requires_follow_up).length;
});

const sessionOptions = computed(() => {
    return flynnStore.analysisSessions.map(session => ({
        label: `Session ${session.session_id} - ${formatDate(session.timing?.completed_at || session.last_update)} (${session.status})`,
        value: session.session_id,
        session: session
    }));
});

// Session Management
const onSessionChange = async (event) => {
    const sessionId = event.value;
    if (sessionId && flynnStore.selectedLocation) {
        try {
            await flynnStore.loadSessionResults(flynnStore.selectedLocation.id, sessionId);
        } catch (error) {
            console.error('Failed to load session results:', error);
            // TODO: Show error toast
        }
    }
};

const confirmDeleteSession = () => {
    if (!flynnStore.selectedSessionId) return;
    
    const session = flynnStore.analysisSessions.find(s => s.session_id === flynnStore.selectedSessionId);
    const sessionLabel = session ? `Session ${session.session_id} (${formatDate(session.timing?.completed_at || session.last_update)})` : `Session ${flynnStore.selectedSessionId}`;
    
    if (confirm(`Are you sure you want to delete ${sessionLabel}? This action cannot be undone.`)) {
        deleteSession();
    }
};

const deleteSession = async () => {
    if (!flynnStore.selectedSessionId || !flynnStore.selectedLocation) return;
    
    try {
        await flynnStore.deleteSessionAndRefresh(flynnStore.selectedLocation.id, flynnStore.selectedSessionId);
        console.log('Session deleted successfully');
        // TODO: Show success toast
    } catch (error) {
        console.error('Failed to delete session:', error);
        // TODO: Show error toast
    }
};

const hasRemainingScope = computed(() => {
    return flynnStore.currentAnalysisResults.pass1?.remaining_scope?.length > 0 ||
           flynnStore.currentAnalysisResults.pass2?.pass_2_analysis_summary?.needs_correction_count > 0 ||
           flynnStore.currentAnalysisResults.pass3?.new_scope?.length > 0 ||
           flynnStore.currentAnalysisResults.pass3?.client_concerns?.length > 0;
});

const totalRemainingItems = computed(() => {
    return (flynnStore.currentAnalysisResults.pass1?.remaining_scope?.length || 0) +
           (flynnStore.currentAnalysisResults.pass2?.pass_2_analysis_summary?.needs_correction_count || 0) +
           (flynnStore.currentAnalysisResults.pass3?.new_scope?.length || 0) +
           (flynnStore.currentAnalysisResults.pass3?.client_concerns?.length || 0);
});

const incompleteDetailedTasks = computed(() => {
    return flynnStore.currentAnalysisResults.pass2?.task_analysis?.filter(task => task.status !== 'COMPLETED') || [];
});

const clientValidationIssues = computed(() => {
    return flynnStore.currentAnalysisResults.pass3?.validated_task_analysis?.filter(task => task.validated_status !== 'COMPLETED') || [];
});

const generateEnhancedInstallationDocument = async () => {
    if (!flynnStore.selectedLocation) return;
    
    try {
        installDocLoading.value = true;
        console.log('Generating enhanced installation document for location:', flynnStore.selectedLocation.id);
        
        const result = await flynnStore.generateEnhancedInstallationDocument(
            flynnStore.selectedLocation.id, 
            flynnStore.selectedSessionId
        );
        
        console.log('Enhanced installation document generated successfully:', result);
        // TODO: Show success toast and download/display document
        
    } catch (error) {
        console.error('Failed to generate enhanced installation document:', error);
        // TODO: Show error toast
    } finally {
        installDocLoading.value = false;
    }
};

// 2-Pass Installation Document Methods
const handleGenerateInstallationDocument = async () => {
    if (!flynnStore.selectedLocation || !flynnStore.selectedSessionId) return;
    
    try {
        console.log('Generating installation document for location:', flynnStore.selectedLocation.id);
        
        const result = await flynnStore.generateInstallationDocumentV2(
            flynnStore.selectedLocation.id,
            flynnStore.selectedSessionId
        );
        
        console.log('Installation document generated successfully:', result);
        // TODO: Show success toast
        
    } catch (error) {
        console.error('Failed to generate installation document:', error);
        // TODO: Show error toast
    }
};

const viewInstallationDocument = async () => {
    if (!flynnStore.selectedLocation) return;
    
    try {
        // If document is already loaded, just show viewer
        if (flynnStore.currentInstallationDocument) {
            showInstallationDocumentViewer.value = true;
            return;
        }
        
        // Otherwise, fetch the document first
        await flynnStore.getInstallationDocumentV2(
            flynnStore.selectedLocation.id,
            flynnStore.selectedSessionId
        );
        
        showInstallationDocumentViewer.value = true;
        
    } catch (error) {
        console.error('Failed to load installation document:', error);
        // TODO: Show error toast
    }
};

const printInstallationDocument = async () => {
    await viewInstallationDocument();
    // The print functionality will be handled by the viewer component
};

// Copy content methods for accordion sections
const copyProjectContent = async () => {
    try {
        let content = `=== ${flynnStore.projectInfo?.project_name || 'Project Information'} ===\n\n`;
        
        // Add basic project info
        if (flynnStore.projectInfo) {
            content += `Project Name: ${flynnStore.projectInfo.project_name || 'N/A'}\n`;
            if (flynnStore.projectInfo.scope_summary) {
                content += `\nScope Summary:\n${flynnStore.projectInfo.scope_summary}\n\n`;
            }
            if (flynnStore.projectInfo.metadata) {
                content += `Project Statistics:\n`;
                content += `- Total Phases: ${flynnStore.projectInfo.metadata.total_phases || 'N/A'}\n`;
                content += `- Total Parent Tasks: ${flynnStore.projectInfo.metadata.total_parent_tasks || 'N/A'}\n`;
                content += `- Total Subtasks: ${flynnStore.projectInfo.metadata.total_subtasks || 'N/A'}\n`;
                content += `- Source File: ${flynnStore.projectInfo.metadata.source_file || 'N/A'}\n`;
                content += `- Imported: ${flynnStore.projectInfo.metadata.imported_at || 'N/A'}\n\n`;
            }
        }
        
        // Add phases information with detailed breakdown
        if (flynnStore.projectPhases?.length > 0) {
            content += `=== Project Phases (${flynnStore.projectPhases.length}) ===\n`;
            flynnStore.projectPhases.forEach((phase, index) => {
                content += `\n--- Phase ${phase.phase_id}: ${phase.phase_name} ---\n`;
                content += `Order: ${phase.phase_order}\n`;
                if (phase.metadata?.total_parent_tasks) {
                    content += `Parent Tasks: ${phase.metadata.total_parent_tasks}\n`;
                }
                
                // Add parent tasks if available
                if (phase.parent_tasks?.length > 0) {
                    content += `\nParent Tasks (${phase.parent_tasks.length}):\n`;
                    phase.parent_tasks.forEach(task => {
                        content += `\n  ${task.task_id}: ${task.title}\n`;
                        content += `    - Relevance Score: ${task.relevance_score}/10\n`;
                        content += `    - Technical: ${task.is_technical ? 'Yes' : 'No'}\n`;
                        content += `    - On-site: ${task.is_onsite ? 'Yes' : 'No'}\n`;
                        if (task.estimated_time) {
                            content += `    - Estimated Time: ${task.estimated_time}\n`;
                        }
                        
                        // Add subtasks
                        if (task.subtasks?.length > 0) {
                            content += `    - Subtasks (${task.subtasks.length}):\n`;
                            task.subtasks.forEach(subtask => {
                                content += `      • ${subtask.task_id}: ${subtask.description}\n`;
                                if (subtask.original_ref) {
                                    content += `        (Ref: ${subtask.original_ref})\n`;
                                }
                            });
                        }
                    });
                }
            });
        }
        
        await navigator.clipboard.writeText(content);
        console.log('Project content copied to clipboard');
    } catch (error) {
        console.error('Failed to copy project content:', error);
    }
};

const copyTicketsContent = async () => {
    try {
        let content = `=== Tickets Summary (${flynnStore.tickets?.length || 0} total) ===\n\n`;
        
        if (flynnStore.tickets?.length > 0) {
            const completed = flynnStore.tickets.filter(t => t.ticketstatustitle === 'Completed').length;
            const inProgress = flynnStore.tickets.filter(t => t.ticketstatustitle === 'In Progress').length;
            const incomplete = flynnStore.tickets.filter(t => t.ticketstatustitle === 'Incomplete').length;
            
            content += `Summary Statistics:\n`;
            content += `- Total Tickets: ${flynnStore.tickets.length}\n`;
            content += `- Completed: ${completed}\n`;
            content += `- In Progress: ${inProgress}\n`;
            content += `- Incomplete: ${incomplete}\n`;
            content += `- Available Photos: Yes\n\n`;
            
            content += `=== Ticket Details ===\n`;
            flynnStore.tickets.forEach(ticket => {
                content += `\n--- Ticket #${ticket.ticketid} ---\n`;
                content += `Mask ID: ${ticket.ticketmaskid || 'N/A'}\n`;
                content += `Subject: ${ticket.subject || 'N/A'}\n`;
                content += `Status: ${ticket.ticketstatustitle || 'N/A'}\n`;
                content += `Priority: ${ticket.prioritytitle || 'N/A'}\n`;
                content += `Department: ${ticket.departmenttitle || 'N/A'}\n`;
                content += `Type: ${ticket.tickettypetitle || 'N/A'}\n`;
                content += `Created: ${ticket.dateline || 'N/A'}\n`;
                content += `Last Activity: ${ticket.lastactivity || 'N/A'}\n`;
                content += `Due Time: ${ticket.duetime || 'N/A'}\n`;
                content += `Owner: ${ticket.fullname || 'N/A'}\n`;
                content += `Email: ${ticket.email || 'N/A'}\n`;
                content += `Last Replier: ${ticket.lastreplier || 'N/A'}\n`;
                
                // Add ticket posts if available
                const posts = flynnStore.ticketPosts[ticket.ticketid];
                if (posts?.length > 0) {
                    content += `\nPosts (${posts.length}):\n`;
                    posts.forEach((post, index) => {
                        content += `\n  Post ${index + 1}:\n`;
                        content += `  Date: ${post.dateline || 'N/A'}\n`;
                        content += `  From: ${post.fullname || 'N/A'}\n`;
                        content += `  Creator Type: ${post.creator === 1 ? 'Staff' : 'System'}\n`;
                        if (post.contents) {
                            // Clean up the contents and format nicely
                            const cleanContent = post.contents
                                .replace(/\r\n/g, '\n')
                                .replace(/\r/g, '\n')
                                .replace(/\n\s*\n/g, '\n')
                                .trim();
                            content += `  Content:\n`;
                            cleanContent.split('\n').forEach(line => {
                                if (line.trim()) {
                                    content += `    ${line.trim()}\n`;
                                }
                            });
                        }
                        content += `\n`;
                    });
                } else {
                    content += `\nPosts: No posts available\n`;
                }
                
                content += `\n${'='.repeat(50)}\n`;
            });
        } else {
            content += 'No tickets available.\n';
        }
        
        await navigator.clipboard.writeText(content);
        console.log('Tickets content copied to clipboard');
    } catch (error) {
        console.error('Failed to copy tickets content:', error);
    }
};

const copySmartSheetContent = async () => {
    try {
        let content = `=== Smart Sheet Data ===\n\n`;
        
        if (flynnStore.networkData && Object.keys(flynnStore.networkData).length > 0) {
            content += `Summary Statistics:\n`;
            content += `- Franchise Number: ${flynnStore.networkData.franchise_number || 'N/A'}\n`;
            content += `- Percent Complete: ${flynnStore.networkData.percent_complete || 'N/A'}\n`;
            content += `- Reviewed: ${flynnStore.networkData.reviewed || 'N/A'}\n\n`;
            
            content += `=== Network Data Details ===\n`;
            Object.entries(flynnStore.networkData).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    content += `${formattedKey}: ${value}\n`;
                }
            });
        } else {
            content += 'No SmartSheet data available.\n';
        }
        
        await navigator.clipboard.writeText(content);
        console.log('SmartSheet content copied to clipboard');
    } catch (error) {
        console.error('Failed to copy SmartSheet content:', error);
    }
};

const copyCommentsContent = async () => {
    try {
        let content = `=== Site Comments (${flynnStore.comments?.length || 0} total) ===\n\n`;
        
        if (flynnStore.comments?.length > 0) {
            content += `Summary Statistics:\n`;
            content += `- Total Comments: ${flynnStore.comments.length}\n`;
            
            // Count comments by type/category if available
            const commentTypes = {};
            flynnStore.comments.forEach(comment => {
                const type = comment.comment_type || comment.category || 'General';
                commentTypes[type] = (commentTypes[type] || 0) + 1;
            });
            
            if (Object.keys(commentTypes).length > 1) {
                content += `- Comment Types:\n`;
                Object.entries(commentTypes).forEach(([type, count]) => {
                    content += `  • ${type}: ${count}\n`;
                });
            }
            content += `\n`;
            
            content += `=== Comment Details ===\n`;
            flynnStore.comments.forEach((comment, index) => {
                content += `\n--- Comment ${index + 1} ---\n`;
                content += `ID: ${comment.id || 'N/A'}\n`;
                content += `Date: ${comment.created_at || comment.date || 'N/A'}\n`;
                content += `Author: ${comment.author || comment.created_by || 'N/A'}\n`;
                
                if (comment.comment_type || comment.category) {
                    content += `Type: ${comment.comment_type || comment.category}\n`;
                }
                
                if (comment.priority) {
                    content += `Priority: ${comment.priority}\n`;
                }
                
                if (comment.status) {
                    content += `Status: ${comment.status}\n`;
                }
                
                content += `Content:\n`;
                if (comment.comment || comment.content || comment.text) {
                    const commentText = comment.comment || comment.content || comment.text;
                    // Clean up and format the comment text
                    const cleanContent = commentText
                        .replace(/\r\n/g, '\n')
                        .replace(/\r/g, '\n')
                        .trim();
                    
                    cleanContent.split('\n').forEach(line => {
                        if (line.trim()) {
                            content += `  ${line.trim()}\n`;
                        }
                    });
                } else {
                    content += `  No content available\n`;
                }
                
                // Add any additional metadata
                if (comment.location || comment.area) {
                    content += `Location/Area: ${comment.location || comment.area}\n`;
                }
                
                if (comment.resolution) {
                    content += `Resolution: ${comment.resolution}\n`;
                }
                
                content += `\n${'='.repeat(50)}\n`;
            });
        } else {
            content += 'No comments available.\n';
        }
        
        await navigator.clipboard.writeText(content);
        console.log('Comments content copied to clipboard');
    } catch (error) {
        console.error('Failed to copy comments content:', error);
    }
};
</script>

<style scoped>
.location-scope-review {
    background: var(--p-surface-50);
}

.location-scope-review .dark {
    background: var(--p-surface-950);
}

/* Neutral progress bar - no color interpretation */
:deep(.completion-neutral .p-progressbar-value) {
    background: var(--p-primary-500) !important;
}

/* Custom scrollbar for location list */
.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: var(--p-surface-100);
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: var(--p-surface-300);
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: var(--p-surface-400);
}
</style>