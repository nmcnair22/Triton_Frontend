<template>
  <div class="visit-detail-page p-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-96">
      <ProgressSpinner size="50px" stroke-width="4" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-6">
      <div class="flex items-center gap-3">
        <i class="pi pi-exclamation-triangle text-red-600 dark:text-red-400 text-xl"></i>
        <div>
          <h3 class="text-lg font-semibold text-red-900 dark:text-red-100">Error Loading Visit</h3>
          <p class="text-red-700 dark:text-red-300">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Visit Detail Content -->
    <div v-else-if="currentVisit" class="space-y-6">
      <!-- Sticky Header Section -->
      <div class="bg-white dark:bg-surface-900 shadow-lg border border-surface-200 dark:border-surface-700 rounded-lg sticky top-6 z-20">
        <!-- Clean Header Bar -->
        <div class="flex items-center justify-between p-4 border-b border-surface-100 dark:border-surface-700">
          <div class="flex items-center gap-4">
            <Button 
              icon="pi pi-arrow-left" 
              @click="$router.push('/field-services/visit-management')"
              class="p-button-text p-button-rounded"
              v-tooltip.bottom="'Back to Visit Management'"
            />
            <div>
              <h1 class="text-xl font-bold text-surface-900 dark:text-surface-0">
                Visit #{{ currentVisit.externalId }}
              </h1>
              <div class="flex items-center gap-3 mt-1">
                <Badge 
                  :value="currentVisit.status" 
                  :severity="getStatusSeverity(currentVisit.status)"
                />
                <span class="text-surface-600 dark:text-surface-300 text-sm">
                  {{ formatDate(currentVisit.serviceDate) }} · {{ currentVisit.visitType?.charAt(0).toUpperCase() + currentVisit.visitType?.slice(1) || 'Unknown' }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Button 
              icon="pi pi-external-link" 
              label="View Ticket" 
              class="p-button-outlined"
              size="small"
              @click="openTicketDrawer"
            />
            <Button 
              icon="pi pi-list" 
              label="Back to List" 
              @click="$router.push('/field-services/visit-management')"
              class="p-button-text"
              size="small"
            />
          </div>
        </div>

        <!-- Uniform Hero Metrics -->
        <div class="bg-surface-50 dark:bg-surface-900 px-4 py-3 border-b border-surface-200 dark:border-surface-700">
          <div class="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 max-w-6xl mx-auto">
            <!-- Completion -->
            <div class="bg-white dark:bg-surface-800 rounded-lg p-4 text-center border border-surface-200 dark:border-surface-700 hover:shadow-md transition-shadow duration-200">
              <div class="text-2xl font-bold mb-1" :class="getCompletionColor()">
                {{ currentVisit.computed_metrics?.completion_percentage || 0 }}%
              </div>
              <div class="text-sm text-surface-600 dark:text-surface-400 mb-2">Completion</div>
              <div class="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-1">
                <div 
                  class="h-1 rounded-full transition-all duration-300" 
                  :class="getCompletionBgColor()"
                  :style="{ width: `${currentVisit.computed_metrics?.completion_percentage || 0}%` }"
                ></div>
              </div>
            </div>

            <!-- Quality Score -->
            <div class="bg-white dark:bg-surface-800 rounded-lg p-4 text-center border border-surface-200 dark:border-surface-700 hover:shadow-md transition-shadow duration-200">
              <div class="text-2xl font-bold mb-1" :class="getQualityColor()">
                {{ currentVisit.ai_analysis?.technician_rating?.rating_value || 'N/A' }}
                <span class="text-sm text-surface-500">/{{ currentVisit.ai_analysis?.technician_rating?.rating_scale || 10 }}</span>
              </div>
              <div class="text-sm text-surface-600 dark:text-surface-400">Quality Score</div>
            </div>

            <!-- Duration -->
            <div class="bg-white dark:bg-surface-800 rounded-lg p-4 text-center border border-surface-200 dark:border-surface-700 hover:shadow-md transition-shadow duration-200">
              <div class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-1">
                {{ currentVisit.computed_metrics?.actual_duration || currentVisit.hoursWorked + 'h' || 'N/A' }}
              </div>
              <div class="text-sm text-surface-600 dark:text-surface-400">Duration</div>
            </div>

            <!-- Issues -->
            <div class="bg-white dark:bg-surface-800 rounded-lg p-4 text-center border border-surface-200 dark:border-surface-700 hover:shadow-md transition-shadow duration-200">
              <div class="text-2xl font-bold mb-1" :class="getIssuesStatusColor()">
                {{ getUnresolvedIssuesCount() }}
                <span class="text-sm text-surface-500"> Issue{{ getUnresolvedIssuesCount() !== 1 ? 's' : '' }}</span>
              </div>
              <div class="text-sm text-surface-600 dark:text-surface-400">
                {{ getUnresolvedIssuesCount() > 0 ? 'Open' : 'Resolved' }}
              </div>
            </div>

            <!-- Revisit Needed -->
            <div class="bg-white dark:bg-surface-800 rounded-lg p-4 text-center border border-surface-200 dark:border-surface-700 hover:shadow-md transition-shadow duration-200">
              <div class="text-2xl font-bold mb-1" :class="getRevisitStatusColor()">
                {{ getRevisitRequired() ? 'Yes' : 'No' }}
              </div>
              <div class="text-sm text-surface-600 dark:text-surface-400 mb-2">Revisit Needed</div>
              <div v-if="getRevisitRequired()" class="border-t border-surface-200 dark:border-surface-600 pt-2 mt-2">
                <div class="text-xs text-surface-500 dark:text-surface-400 line-clamp-2">
                  {{ getRevisitReason() }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Tabs -->
      <div class="bg-white dark:bg-surface-900 rounded-lg shadow-sm border border-surface-200 dark:border-surface-700 mt-4">
        <Tabs v-model:value="activeTab" class="visit-detail-tabs">
          <TabList class="border-b border-surface-200 dark:border-surface-700 px-6">
            <Tab value="overview" class="tab-button">
              <div class="flex items-center gap-2">
                <i class="pi pi-home text-sm"></i>
                <span>Overview</span>
                <Badge v-if="getUnresolvedIssuesCount() > 0" :value="getUnresolvedIssuesCount()" severity="danger" class="ml-1" />
              </div>
            </Tab>
            <Tab value="ai-analysis" class="tab-button">
              <div class="flex items-center gap-2">
                <i class="pi pi-brain text-sm"></i>
                <span>AI Analysis</span>
                <Badge v-if="currentVisit.computed_metrics?.has_ai_analysis" value="✓" severity="success" class="ml-1" />
              </div>
            </Tab>
            <Tab value="scope-progress" class="tab-button">
              <div class="flex items-center gap-2">
                <i class="pi pi-chart-line text-sm"></i>
                <span>Scope & Progress</span>
              </div>
            </Tab>
            <Tab value="timeline-tasks" class="tab-button">
              <div class="flex items-center gap-2">
                <i class="pi pi-clock text-sm"></i>
                <span>Timeline & Tasks</span>
              </div>
            </Tab>
            <Tab value="materials" class="tab-button">
              <div class="flex items-center gap-2">
                <i class="pi pi-box text-sm"></i>
                <span>Materials</span>
                <Badge v-if="currentVisit.ai_analysis?.materials_used?.length" :value="currentVisit.ai_analysis.materials_used.length" severity="info" class="ml-1" />
              </div>
            </Tab>
            <Tab value="data-quality" class="tab-button">
              <div class="flex items-center gap-2">
                <i class="pi pi-exclamation-triangle text-sm"></i>
                <span>Data Quality</span>
                <Badge v-if="currentVisit.extraction_warnings?.length" :value="currentVisit.extraction_warnings.length" severity="warning" class="ml-1" />
              </div>
            </Tab>
          </TabList>

          <TabPanels>
                        <!-- Overview Tab -->
            <TabPanel value="overview" class="p-6">
              <!-- Symmetrical Two-Column Layout -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 h-full relative">
                <div class="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-surface-200 dark:bg-surface-700 transform -translate-x-1/2"></div>
                
                <!-- Left Column: Visit Snapshot & Work Summary -->
                <div class="space-y-6">
                  
                  <!-- Visit Snapshot (Merged Visit Details + AI + Team) -->
                  <div class="bg-white dark:bg-surface-900 rounded-lg p-6 border border-surface-200 dark:border-surface-700 h-fit hover:shadow-md transition-shadow duration-200">
                    <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 mb-4 flex items-center">
                      <i class="pi pi-chart-bar mr-3 text-primary-500"></i>
                      Visit Snapshot
                    </h3>
                    
                    <div class="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <div class="text-sm text-surface-600 dark:text-surface-300">Customer</div>
                        <div class="font-semibold">{{ currentVisit.customer?.name || 'N/A' }}</div>
                      </div>
                      <div>
                        <div class="text-sm text-surface-600 dark:text-surface-300">Duration</div>
                        <div class="font-semibold">{{ currentVisit.computed_metrics?.actual_duration || currentVisit.hoursWorked + 'h' || 'N/A' }}</div>
                      </div>
                      <div>
                        <div class="text-sm text-surface-600 dark:text-surface-300">Quality Score</div>
                        <div class="font-semibold">{{ currentVisit.ai_analysis?.technician_rating?.rating_value || 'N/A' }}/{{ currentVisit.ai_analysis?.technician_rating?.rating_scale || 10 }}</div>
                      </div>
                      <div>
                        <div class="text-sm text-surface-600 dark:text-surface-300">Revenue</div>
                        <div class="font-semibold">${{ (currentVisit.revenue || 0).toLocaleString() }}</div>
                      </div>
                      <div>
                        <div class="text-sm text-surface-600 dark:text-surface-300">Revisit Required</div>
                        <Badge 
                          :value="currentVisit.future_actions?.revisit_needed || 'No'" 
                          :severity="currentVisit.future_actions?.revisit_needed === 'Yes' ? 'danger' : 'success'"
                          class="px-3 py-1 rounded-full"
                        />
                      </div>
                      <div>
                        <div class="text-sm text-surface-600 dark:text-surface-300">Contact</div>
                        <div class="font-semibold text-sm">{{ currentVisit.customer?.phone || currentVisit.customer?.email || 'N/A' }}</div>
                      </div>
                    </div>

                    <!-- Team Section -->
                    <div v-if="currentVisit.technicians?.length" class="border-t border-surface-200 dark:border-surface-700 pt-4">
                      <h4 class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">Team ({{ currentVisit.technicians.length }})</h4>
                      <div class="space-y-2">
                        <div 
                          v-for="tech in currentVisit.technicians" 
                          :key="tech.id"
                          class="flex items-center justify-between p-2 bg-surface-50 dark:bg-surface-800 rounded"
                        >
                          <div class="flex items-center gap-2">
                            <Avatar :label="tech.name?.charAt(0)" size="small" />
                            <div>
                              <div class="font-medium text-sm">{{ tech.name }}</div>
                              <div class="text-xs text-surface-500">{{ tech.role }}</div>
                            </div>
                          </div>
                          <div class="text-sm font-medium">{{ tech.hoursWorked || 0 }}h</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- AI Work Summary -->
                  <div class="bg-white dark:bg-surface-900 rounded-lg p-6 border border-surface-200 dark:border-surface-700 h-fit hover:shadow-md transition-shadow duration-200">
                    <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 mb-4 flex items-center">
                      <i class="pi pi-brain mr-3 text-primary-500"></i>
                      AI Work Summary
                    </h3>
                    <p class="text-surface-700 dark:text-surface-300 leading-relaxed">
                      {{ currentVisit.work_summary || 'AI analysis is processing to provide intelligent insights about this field service visit.' }}
                    </p>
                    
                    <!-- Actions Summary -->
                    <div v-if="currentVisit.ai_analysis?.actions_performed?.length" class="mt-4 border-t border-surface-200 dark:border-surface-700 pt-4">
                      <h4 class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">Key Actions Performed</h4>
                      <div class="space-y-2">
                        <div 
                          v-for="(action, index) in currentVisit.ai_analysis.actions_performed" 
                          :key="index"
                          class="flex items-start gap-2 text-sm"
                        >
                          <div class="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span class="text-surface-700 dark:text-surface-300">{{ action }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Tasks Preview -->
                  <div class="bg-white dark:bg-surface-900 rounded-lg p-6 border border-surface-200 dark:border-surface-700 h-fit hover:shadow-md transition-shadow duration-200">
                    <div class="flex items-center justify-between mb-4">
                      <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 flex items-center">
                        <i class="pi pi-check-square mr-3 text-primary-500"></i>
                        Tasks
                      </h3>
                      <Button 
                        label="View All" 
                        link 
                        size="small"
                        @click="activeTab = 'timeline-tasks'"
                        class="text-sm"
                      />
                    </div>
                    
                    <div v-if="getPreviewTasks()?.length" class="space-y-3">
                      <div 
                        v-for="(task, index) in getPreviewTasks()" 
                        :key="index"
                        class="flex items-start gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-600"
                      >
                        <div class="flex-shrink-0 mt-1">
                          <i 
                            :class="task.completed ? 'pi pi-check-circle text-green-600' : 'pi pi-circle text-surface-400'"
                            class="text-base cursor-pointer hover:scale-110 transition-transform"
                          ></i>
                        </div>
                        <div class="flex-1 min-w-0">
                          <div 
                            class="font-semibold text-sm mb-2"
                            :class="task.completed ? 'text-surface-500 line-through' : 'text-surface-900 dark:text-surface-0'"
                          >
                            {{ task.title }}
                          </div>
                          <div v-if="task.description" class="text-xs text-surface-600 dark:text-surface-400 mb-2">
                            {{ task.description }}
                          </div>
                          <div class="flex items-center gap-2">
                            <Badge 
                              :value="task.completed ? 'Complete' : (task.status || 'Open')" 
                              :severity="task.completed ? 'success' : getTaskPrioritySeverity(task.priority)"
                              class="text-xs px-2 py-1"
                            />
                            <Badge 
                              v-if="task.priority && task.priority !== 'Normal'"
                              :value="task.priority" 
                              :severity="getTaskPrioritySeverity(task.priority)"
                              class="text-xs px-2 py-1"
                            />
                            <span v-if="task.dueDate" class="text-xs text-surface-500 ml-auto">
                              Due: {{ formatDate(task.dueDate) }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div v-else class="text-center py-4">
                      <div class="text-surface-400 text-sm">No tasks assigned</div>
                    </div>
                  </div>

                </div>

                <!-- Right Column: Issues, Data Quality & Materials -->
                <div class="space-y-6">
                  
                  <!-- Issues & Data Quality Combined -->
                  <div class="bg-white dark:bg-surface-900 rounded-lg p-6 border border-surface-200 dark:border-surface-700 h-fit hover:shadow-md transition-shadow duration-200">
                    <div class="flex items-center justify-between mb-4">
                      <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 flex items-center">
                        <i class="pi pi-exclamation-triangle mr-3 text-orange-500"></i>
                        Issues
                      </h3>
                      <Badge 
                        :value="`${getUnresolvedIssuesCount()} Open`" 
                        :severity="getUnresolvedIssuesCount() > 0 ? 'danger' : 'success'"
                        class="text-sm px-3 py-1"
                      />
                    </div>
                    
                    <div v-if="currentVisit.enhanced_data?.issues_encountered?.length" class="space-y-3">
                      <div 
                        v-for="(issue, index) in currentVisit.enhanced_data.issues_encountered" 
                        :key="index"
                        class="p-4 rounded-lg border-l-4 bg-surface-50 dark:bg-surface-800" 
                        :class="getIssueCardClass(issue.status)"
                      >
                        <div class="font-semibold text-surface-900 dark:text-surface-0 mb-3 text-base">
                          {{ issue.description }}
                        </div>
                        <div class="flex items-center gap-2">
                          <Badge 
                            :value="issue.status" 
                            :severity="getIssueBadgeSeverity(issue.status)"
                            class="text-sm px-3 py-1"
                          />
                          <span v-if="issue.needs_attention" class="text-xs text-orange-600 dark:text-orange-400">
                            <i class="pi pi-exclamation-circle mr-1"></i>
                            Needs Attention
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div v-else class="text-center py-6">
                      <i class="pi pi-check-circle text-3xl text-green-500 mb-2"></i>
                      <div class="text-surface-500 text-sm">No issues encountered</div>
                    </div>

                    <!-- Data Quality Section -->
                    <div v-if="currentVisit.extraction_warnings?.length" class="mt-6 pt-4 border-t border-surface-200 dark:border-surface-700">
                      <div class="flex items-center gap-2 mb-3">
                        <h4 class="text-sm font-medium text-amber-700 dark:text-amber-300">Data Quality</h4>
                        <Badge :value="currentVisit.extraction_warnings.length" severity="warning" class="text-xs" />
                      </div>
                      <div class="text-sm text-amber-800 dark:text-amber-200">
                        {{ currentVisit.extraction_warnings.length }} insights available for improved data capture in future visits.
                      </div>
                    </div>
                  </div>

                  <!-- Materials Used (Only if data exists) -->
                  <div 
                    v-if="currentVisit.ai_analysis?.materials_used?.length" 
                    class="bg-white dark:bg-surface-900 rounded-lg p-6 border border-surface-200 dark:border-surface-700 h-fit hover:shadow-md transition-shadow duration-200"
                  >
                    <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 mb-4 flex items-center">
                      <i class="pi pi-box mr-3 text-primary-500"></i>
                      Materials Used ({{ currentVisit.ai_analysis.materials_used.length }})
                    </h3>
                    <div class="space-y-2">
                      <div 
                        v-for="(material, index) in currentVisit.ai_analysis.materials_used" 
                        :key="index"
                        class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded"
                      >
                        <div class="flex-1">
                          <div class="font-medium">{{ formatMaterialName(material) }}</div>
                          <div v-if="formatMaterialQuantity(material)" class="text-sm text-surface-500 dark:text-surface-400">
                            Qty: {{ formatMaterialQuantity(material) }}
                          </div>
                        </div>
                        <div v-if="formatMaterialCost(material)" class="font-medium text-green-600 dark:text-green-400">
                          ${{ formatMaterialCost(material) }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Key Interactions -->
                  <div 
                    v-if="currentVisit.ai_analysis?.key_interactions?.length" 
                    class="bg-white dark:bg-surface-900 rounded-lg p-6 border border-surface-200 dark:border-surface-700 h-fit hover:shadow-md transition-shadow duration-200"
                  >
                    <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 mb-4 flex items-center">
                      <i class="pi pi-comments mr-3 text-primary-500"></i>
                      Key Interactions
                    </h3>
                    <div class="space-y-3">
                      <div 
                        v-for="(interaction, index) in currentVisit.ai_analysis.key_interactions" 
                        :key="index"
                        class="p-3 bg-surface-50 dark:bg-surface-800 rounded"
                      >
                        <div class="font-medium text-surface-900 dark:text-surface-0 mb-1">
                          {{ interaction.type || 'Communication' }}
                        </div>
                        <div class="text-sm text-surface-600 dark:text-surface-400">
                          {{ interaction.description || interaction }}
                        </div>
                        <div v-if="interaction.timestamp" class="text-xs text-surface-500 dark:text-surface-400 mt-1">
                          {{ formatDateTime(interaction.timestamp) }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Enhanced Timeline Preview -->
                  <div class="bg-white dark:bg-surface-900 rounded-lg p-6 border border-surface-200 dark:border-surface-700 h-fit hover:shadow-md transition-shadow duration-200">
                    <div class="flex items-center justify-between mb-4">
                      <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 flex items-center">
                        <i class="pi pi-clock mr-3 text-primary-500"></i>
                        Work Timeline
                      </h3>
                      <Button 
                        label="View Full Timeline" 
                        link 
                        size="small"
                        @click="activeTab = 'timeline-tasks'"
                        class="text-sm"
                      />
                    </div>
                    
                    <div v-if="timelineEvents.length > 0" class="timeline-preview">
                      <Timeline :value="timelineEvents" align="alternate" class="custom-timeline">
                        <template #marker="slotProps">
                          <div 
                            class="timeline-marker-clean"
                            :class="`marker-${slotProps.item.color}`"
                          >
                            <i :class="slotProps.item.icon" class="text-white text-xs"></i>
                          </div>
                        </template>
                        <template #content="slotProps">
                          <div class="timeline-content-clean">
                            <div class="timeline-time">
                              <strong>{{ slotProps.item.time }}</strong>
                            </div>
                            <div class="timeline-header">
                              <span class="timeline-title">{{ slotProps.item.title }}</span>
                              <Tag 
                                v-if="slotProps.item.status === 'Issue'" 
                                :severity="slotProps.item.color === 'success' ? 'success' : 'danger'" 
                                :value="slotProps.item.color === 'success' ? 'Resolved' : 'Open'"
                                size="small"
                                class="ml-auto"
                              />
                            </div>
                            <div class="timeline-details">{{ slotProps.item.details }}</div>
                          </div>
                        </template>
                      </Timeline>
                    </div>
                    
                    <div v-else class="text-center py-8">
                      <i class="pi pi-clock text-3xl text-surface-300 mb-2"></i>
                      <div class="text-surface-400 text-sm">No timeline events available</div>
                    </div>
                  </div>

                </div>
              </div>
            </TabPanel>

            <!-- AI Analysis Tab -->
            <TabPanel value="ai-analysis" class="p-6">
              <div v-if="currentVisit.ai_analysis" class="space-y-6">
                <!-- Enhanced Work Summary -->
                <div class="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg p-6">
                  <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
                    <i class="pi pi-brain text-blue-600"></i>
                    AI-Generated Work Summary
                  </h3>
                  <div class="prose prose-sm max-w-none text-surface-700 dark:text-surface-300">
                    <p class="leading-relaxed">{{ currentVisit.work_summary }}</p>
                  </div>
                </div>

                <!-- Technician Rating -->
                <div class="bg-white dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-700 p-6">
                  <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
                    <i class="pi pi-star text-yellow-600"></i>
                    Technician Performance
                  </h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-4">
                      <div class="flex justify-between items-center">
                        <span class="text-surface-600 dark:text-surface-300">Rating:</span>
                        <div class="flex items-center gap-2">
                          <Rating 
                            :value="Math.round((currentVisit.ai_analysis.technician_rating?.rating_value || 0))" 
                            readonly 
                            :cancel="false" 
                          />
                          <span class="font-medium">{{ currentVisit.ai_analysis.technician_rating?.rating_value || 0 }}/{{ currentVisit.ai_analysis.technician_rating?.rating_scale || 10 }}</span>
                        </div>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-surface-600 dark:text-surface-300">Rating Source:</span>
                        <Badge :value="currentVisit.ai_analysis.technician_rating?.rating_source || 'Unknown'" severity="info" />
                      </div>
                    </div>
                    <div v-if="currentVisit.ai_analysis.technician_rating?.rating_comments" class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                      <h4 class="font-medium text-surface-900 dark:text-surface-0 mb-2">Comments:</h4>
                      <p class="text-sm text-surface-700 dark:text-surface-300">{{ currentVisit.ai_analysis.technician_rating.rating_comments }}</p>
                    </div>
                  </div>
                </div>

                <!-- Key Interactions -->
                <div v-if="currentVisit.ai_analysis.key_interactions?.length" class="bg-white dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-700 p-6">
                  <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
                    <i class="pi pi-users text-green-600"></i>
                    Key Interactions
                  </h3>
                  <div class="space-y-3">
                    <div 
                      v-for="(interaction, index) in currentVisit.ai_analysis.key_interactions" 
                      :key="index"
                      class="flex items-start gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded border-l-4 border-green-400"
                    >
                      <i class="pi pi-comment text-green-600 mt-1"></i>
                      <div class="flex-1">
                        <div class="font-medium text-surface-900 dark:text-surface-0">{{ interaction.type || 'Interaction' }}</div>
                        <div class="text-sm text-surface-600 dark:text-surface-300">{{ interaction.description || interaction }}</div>
                        <div v-if="interaction.timestamp" class="text-xs text-surface-500 mt-1">{{ formatDateTime(interaction.timestamp) }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Materials Used -->
                <div v-if="currentVisit.ai_analysis.materials_used?.length" class="bg-white dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-700 p-6">
                  <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
                    <i class="pi pi-box text-orange-600"></i>
                    AI-Identified Materials Used
                  </h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div 
                      v-for="(material, index) in currentVisit.ai_analysis.materials_used" 
                      :key="index"
                      class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4 border border-surface-200 dark:border-surface-600"
                    >
                      <div class="font-medium text-surface-900 dark:text-surface-0 mb-2">
                        {{ formatMaterialName(material) }}
                      </div>
                      <div v-if="formatMaterialQuantity(material)" class="text-sm text-surface-600 dark:text-surface-300 mb-1">
                        <i class="pi pi-hashtag mr-1"></i>{{ formatMaterialQuantity(material) }}
                      </div>
                      <div v-if="formatMaterialDescription(material)" class="text-sm text-surface-500 dark:text-surface-400 mb-1">
                        {{ formatMaterialDescription(material) }}
                      </div>
                      <div v-if="formatMaterialCost(material)" class="text-sm text-green-600 dark:text-green-400 font-medium">
                        <i class="pi pi-dollar mr-1"></i>{{ formatMaterialCost(material) }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Actions Performed -->
                <div v-if="currentVisit.ai_analysis.actions_performed?.length" class="bg-white dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-700 p-6">
                  <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
                    <i class="pi pi-cog text-purple-600"></i>
                    Actions Performed
                  </h3>
                  <div class="space-y-2">
                    <div 
                      v-for="(action, index) in currentVisit.ai_analysis.actions_performed" 
                      :key="index"
                      class="flex items-center gap-3 p-2 bg-surface-50 dark:bg-surface-800 rounded"
                    >
                      <i class="pi pi-check-circle text-green-600"></i>
                      <span class="text-surface-700 dark:text-surface-300">{{ action }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center text-surface-500 py-12">
                <i class="pi pi-brain text-6xl mb-4 block opacity-30"></i>
                <h3 class="text-xl font-semibold mb-2">No AI Analysis Available</h3>
                <p>AI analysis has not been generated for this visit yet.</p>
              </div>
            </TabPanel>

            <!-- Scope & Progress Tab -->
            <TabPanel value="scope-progress" class="p-6">
              <div v-if="currentVisit.scope_analysis || currentVisit.outcome_analysis" class="space-y-6">
                <!-- Scope Analysis -->
                <div v-if="currentVisit.scope_analysis" class="bg-white dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-700 p-6">
                  <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
                    <i class="pi pi-list-check text-blue-600"></i>
                    Work Scope Analysis
                  </h3>
                  
                  <!-- Progress Overview -->
                  <div class="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 rounded-lg">
                    <div class="flex items-center justify-between mb-3">
                      <span class="text-lg font-semibold text-surface-900 dark:text-surface-0">Overall Completion</span>
                      <span class="text-2xl font-bold text-primary-600">{{ currentVisit.scope_analysis.completion_percentage || 0 }}%</span>
                    </div>
                    <ProgressBar :value="currentVisit.scope_analysis.completion_percentage || 0" class="h-3" />
                  </div>

                  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Planned Scope -->
                    <div class="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                      <h4 class="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                        <i class="pi pi-calendar text-blue-600"></i>
                        Planned Scope
                      </h4>
                      <div v-if="currentVisit.scope_analysis.planned_scope?.length" class="space-y-2">
                        <div 
                          v-for="(item, index) in currentVisit.scope_analysis.planned_scope" 
                          :key="index"
                          class="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2"
                        >
                          <i class="pi pi-circle text-blue-500 text-xs mt-1"></i>
                          {{ item }}
                        </div>
                      </div>
                      <div v-else class="text-blue-600 dark:text-blue-300 text-sm">No planned scope items.</div>
                    </div>

                    <!-- Completed Scope -->
                    <div class="bg-green-50 dark:bg-green-950 rounded-lg p-4">
                      <h4 class="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                        <i class="pi pi-check-circle text-green-600"></i>
                        Completed Work
                      </h4>
                      <div v-if="currentVisit.scope_analysis.completed_scope?.length" class="space-y-2">
                        <div 
                          v-for="(item, index) in currentVisit.scope_analysis.completed_scope" 
                          :key="index"
                          class="text-sm text-green-800 dark:text-green-200 flex items-start gap-2"
                        >
                          <i class="pi pi-check text-green-500 text-xs mt-1"></i>
                          {{ item }}
                        </div>
                      </div>
                      <div v-else class="text-green-600 dark:text-green-300 text-sm">No completed work recorded.</div>
                    </div>

                    <!-- Not Completed -->
                    <div class="bg-orange-50 dark:bg-orange-950 rounded-lg p-4">
                      <h4 class="font-semibold text-orange-900 dark:text-orange-100 mb-3 flex items-center gap-2">
                        <i class="pi pi-times-circle text-orange-600"></i>
                        Incomplete Work
                      </h4>
                      <div v-if="currentVisit.scope_analysis.not_completed_scope?.length" class="space-y-2">
                        <div 
                          v-for="(item, index) in currentVisit.scope_analysis.not_completed_scope" 
                          :key="index"
                          class="text-sm text-orange-800 dark:text-orange-200 flex items-start gap-2"
                        >
                          <i class="pi pi-minus-circle text-orange-500 text-xs mt-1"></i>
                          {{ item }}
                        </div>
                      </div>
                      <div v-else class="text-green-600 dark:text-green-300 text-sm">All planned work completed!</div>
                    </div>
                  </div>

                  <!-- Additional Work Discovered -->
                  <div v-if="currentVisit.scope_analysis.additional_work_discovered?.length" class="mt-6 p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <h4 class="font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
                      <i class="pi pi-plus-circle text-purple-600"></i>
                      Additional Work Discovered
                    </h4>
                    <div class="space-y-2">
                      <div 
                        v-for="(item, index) in currentVisit.scope_analysis.additional_work_discovered" 
                        :key="index"
                        class="text-sm text-purple-800 dark:text-purple-200 flex items-start gap-2"
                      >
                        <i class="pi pi-plus text-purple-500 text-xs mt-1"></i>
                        {{ item }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Outcome Analysis -->
                <div v-if="currentVisit.outcome_analysis" class="bg-white dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-700 p-6">
                  <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
                    <i class="pi pi-chart-line text-green-600"></i>
                    Outcome Analysis
                  </h3>

                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Primary Status -->
                    <div class="space-y-4">
                      <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                        <div class="flex justify-between items-center mb-2">
                          <span class="text-surface-600 dark:text-surface-300">Primary Status:</span>
                          <Badge :value="currentVisit.outcome_analysis.primary_status" :severity="getOutcomeStatusSeverity(currentVisit.outcome_analysis.primary_status)" />
                        </div>
                        <div class="flex justify-between items-center">
                          <span class="text-surface-600 dark:text-surface-300">Completion:</span>
                          <span class="font-bold text-lg">{{ currentVisit.outcome_analysis.completion_percentage || 0 }}%</span>
                        </div>
                      </div>

                      <!-- Customer Communication -->
                      <div v-if="currentVisit.outcome_analysis.customer_communication" class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                        <h4 class="font-medium text-surface-900 dark:text-surface-0 mb-3">Customer Communication</h4>
                        <div class="space-y-2 text-sm">
                          <div class="flex justify-between items-center">
                            <span class="text-surface-600 dark:text-surface-300">Outcome Explained:</span>
                            <i :class="currentVisit.outcome_analysis.customer_communication.outcome_explained_to_customer ? 'pi pi-check text-green-600' : 'pi pi-times text-red-600'"></i>
                          </div>
                          <div class="flex justify-between items-center">
                            <span class="text-surface-600 dark:text-surface-300">Follow-up Scheduled:</span>
                            <i :class="currentVisit.outcome_analysis.customer_communication.follow_up_scheduled ? 'pi pi-check text-green-600' : 'pi pi-times text-red-600'"></i>
                          </div>
                          <div class="flex justify-between items-center">
                            <span class="text-surface-600 dark:text-surface-300">Customer Approval:</span>
                            <i :class="currentVisit.outcome_analysis.customer_communication.customer_approval_for_additional_work ? 'pi pi-check text-green-600' : 'pi pi-times text-red-600'"></i>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Blocking Issues -->
                    <div>
                      <div v-if="currentVisit.outcome_analysis.blocking_issues_analysis?.length" class="bg-red-50 dark:bg-red-950 rounded-lg p-4">
                        <h4 class="font-medium text-red-900 dark:text-red-100 mb-3 flex items-center gap-2">
                          <i class="pi pi-exclamation-triangle text-red-600"></i>
                          Blocking Issues
                        </h4>
                        <div class="space-y-2">
                          <div 
                            v-for="(issue, index) in currentVisit.outcome_analysis.blocking_issues_analysis" 
                            :key="index"
                            class="text-sm text-red-800 dark:text-red-200 flex items-start gap-2"
                          >
                            <i class="pi pi-exclamation-circle text-red-500 text-xs mt-1"></i>
                            {{ issue }}
                          </div>
                        </div>
                      </div>
                      <div v-else class="bg-green-50 dark:bg-green-950 rounded-lg p-4">
                        <div class="text-center text-green-600 dark:text-green-300">
                          <i class="pi pi-check-circle text-2xl mb-2 block"></i>
                          <span class="font-medium">No blocking issues reported</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Future Actions -->
                <div v-if="currentVisit.future_actions" class="bg-white dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-700 p-6">
                  <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
                    <i class="pi pi-calendar-plus text-blue-600"></i>
                    Future Actions Required
                  </h3>

                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Revisit Information -->
                    <div class="space-y-4">
                      <div class="p-4 rounded-lg" :class="currentVisit.future_actions.revisit_needed === 'Yes' ? 'bg-orange-50 dark:bg-orange-950' : 'bg-green-50 dark:bg-green-950'">
                        <div class="flex items-center gap-3 mb-3">
                          <i :class="currentVisit.future_actions.revisit_needed === 'Yes' ? 'pi pi-calendar-plus text-orange-600' : 'pi pi-check-circle text-green-600'"></i>
                          <span class="font-medium" :class="currentVisit.future_actions.revisit_needed === 'Yes' ? 'text-orange-900 dark:text-orange-100' : 'text-green-900 dark:text-green-100'">
                            Revisit {{ currentVisit.future_actions.revisit_needed === 'Yes' ? 'Required' : 'Not Required' }}
                          </span>
                        </div>
                        <div v-if="currentVisit.future_actions.revisit_needed === 'Yes'" class="space-y-2 text-sm">
                          <div><strong>Reason:</strong> {{ currentVisit.future_actions.revisit_reason }}</div>
                          <div><strong>Scope Type:</strong> {{ currentVisit.future_actions.revisit_scope_type }}</div>
                        </div>
                      </div>

                      <!-- Outcome Summary -->
                      <div v-if="currentVisit.future_actions.outcome" class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                        <h4 class="font-medium text-surface-900 dark:text-surface-0 mb-2">Outcome Summary</h4>
                        <p class="text-sm text-surface-700 dark:text-surface-300">{{ currentVisit.future_actions.outcome }}</p>
                      </div>
                    </div>

                    <!-- Work Items -->
                    <div class="space-y-4">
                      <!-- Original Work Remaining -->
                      <div v-if="currentVisit.future_actions.original_work_remaining?.length" class="bg-orange-50 dark:bg-orange-950 rounded-lg p-4">
                        <h4 class="font-medium text-orange-900 dark:text-orange-100 mb-3 flex items-center gap-2">
                          <i class="pi pi-clock text-orange-600"></i>
                          Original Work Remaining
                        </h4>
                        <div class="space-y-1">
                          <div 
                            v-for="(item, index) in currentVisit.future_actions.original_work_remaining" 
                            :key="index"
                            class="text-sm text-orange-800 dark:text-orange-200 flex items-start gap-2"
                          >
                            <i class="pi pi-minus-circle text-orange-500 text-xs mt-1"></i>
                            {{ item }}
                          </div>
                        </div>
                      </div>

                      <!-- New Work Identified -->
                      <div v-if="currentVisit.future_actions.new_work_identified?.length" class="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                        <h4 class="font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                          <i class="pi pi-plus text-blue-600"></i>
                          New Work Identified
                        </h4>
                        <div class="space-y-1">
                          <div 
                            v-for="(item, index) in currentVisit.future_actions.new_work_identified" 
                            :key="index"
                            class="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2"
                          >
                            <i class="pi pi-plus-circle text-blue-500 text-xs mt-1"></i>
                            {{ item }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Action Button -->
                  <div v-if="currentVisit.future_actions.revisit_needed === 'Yes'" class="mt-6 pt-4 border-t border-surface-200 dark:border-surface-600">
                    <Button 
                      icon="pi pi-calendar-plus" 
                      label="Schedule Follow-up Visit" 
                      class="p-button-outlined w-full md:w-auto"
                      @click="scheduleFollowUp"
                    />
                  </div>
                </div>
              </div>
              <div v-else class="text-center text-surface-500 py-12">
                <i class="pi pi-chart-line text-6xl mb-4 block opacity-30"></i>
                <h3 class="text-xl font-semibold mb-2">No Scope Analysis Available</h3>
                <p>Scope and progress analysis has not been generated for this visit yet.</p>
              </div>
            </TabPanel>

            <!-- Timeline & Tasks Tab -->
            <TabPanel value="timeline-tasks" class="p-6">
              <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <!-- Timeline Section -->
                <div class="space-y-6">
                  <div class="flex items-center justify-between">
                    <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 flex items-center gap-2">
                      <i class="pi pi-clock text-blue-600"></i>
                      Visit Timeline
                    </h3>
                    <Button 
                      icon="pi pi-plus" 
                      label="Add Event" 
                      size="small"
                      class="p-button-outlined"
                    />
                  </div>

                  <div v-if="timelineLoading" class="flex justify-center py-12">
                    <ProgressSpinner size="40px" />
                  </div>

                  <Timeline 
                    v-else-if="currentVisit.timeline?.length" 
                    :value="currentVisit.timeline" 
                    layout="vertical"
                    class="customized-timeline"
                  >
                    <template #marker="slotProps">
                      <span class="flex w-10 h-10 items-center justify-center text-white rounded-full z-10 shadow-lg border-2 border-white dark:border-surface-800" 
                            :style="{ backgroundColor: getTimelineMarkerColor(slotProps.item.type) }">
                        <i :class="getTimelineIcon(slotProps.item.type)" class="text-sm"></i>
                      </span>
                    </template>
                    <template #content="slotProps">
                      <div class="bg-white dark:bg-surface-900 rounded-lg shadow-sm border border-surface-200 dark:border-surface-700 p-4 ml-4">
                        <h4 class="font-semibold text-surface-900 dark:text-surface-0 mb-2">
                          {{ slotProps.item.title }}
                        </h4>
                        <p class="text-surface-600 dark:text-surface-300 mb-3 text-sm">
                          {{ slotProps.item.description }}
                        </p>
                        <div class="flex items-center gap-4 text-xs text-surface-500">
                          <span class="flex items-center gap-1">
                            <i class="pi pi-clock"></i>
                            {{ formatDateTime(slotProps.item.timestamp) }}
                          </span>
                          <span v-if="slotProps.item.user" class="flex items-center gap-1">
                            <i class="pi pi-user"></i>
                            {{ slotProps.item.user }}
                          </span>
                        </div>
                      </div>
                    </template>
                  </Timeline>

                  <div v-else class="text-center text-surface-500 py-12">
                    <i class="pi pi-clock text-5xl mb-4 block opacity-30"></i>
                    <h4 class="text-lg font-medium mb-2">No Timeline Events</h4>
                    <p class="text-sm">No timeline events recorded yet for this visit.</p>
                  </div>
                </div>

                <!-- Tasks & Issues Section -->
                <div class="space-y-6">
                  <!-- Tasks -->
                  <div>
                    <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
                      <i class="pi pi-check-circle text-green-600"></i>
                      Tasks
                      <Badge :value="currentVisit.tasks?.length || 0" class="ml-2" />
                    </h3>
                    
                    <div v-if="currentVisit.tasks?.length" class="space-y-3">
                      <div 
                        v-for="task in currentVisit.tasks" 
                        :key="task.id"
                        class="bg-white dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-700 p-4 shadow-sm"
                      >
                        <div class="flex items-start justify-between mb-3">
                          <h4 class="font-medium text-surface-900 dark:text-surface-0 text-sm">{{ task.task }}</h4>
                          <Badge :value="task.status" :severity="getTaskStatusSeverity(task.status)" size="small" />
                        </div>
                        <div class="grid grid-cols-2 gap-3 mb-3 text-xs">
                          <div class="flex justify-between">
                            <span class="text-surface-600">Category:</span>
                            <span class="font-medium">{{ task.category }}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-surface-600">Duration:</span>
                            <span class="font-medium">{{ task.actualDuration || task.estimatedDuration || 0 }}min</span>
                          </div>
                        </div>
                        <div class="flex items-center justify-between mb-2">
                          <span class="text-xs text-surface-600">Progress:</span>
                          <span class="text-xs font-medium">{{ task.completionPercentage || 0 }}%</span>
                        </div>
                        <ProgressBar :value="task.completionPercentage || 0" class="h-2 mb-2" />
                        <p v-if="task.notes" class="text-xs text-surface-600 dark:text-surface-300 p-2 bg-surface-50 dark:bg-surface-800 rounded">
                          {{ task.notes }}
                        </p>
                      </div>
                    </div>
                    <div v-else class="text-center text-surface-500 py-6">
                      <i class="pi pi-check-circle text-3xl mb-2 block opacity-30"></i>
                      <p class="text-sm">No tasks recorded for this visit.</p>
                    </div>
                  </div>

                  <!-- Issues -->
                  <div>
                    <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
                      <i class="pi pi-exclamation-triangle text-orange-600"></i>
                      Issues
                      <Badge :value="currentVisit.issues?.length || 0" severity="warning" class="ml-2" />
                    </h3>
                    
                    <div v-if="currentVisit.issues?.length" class="space-y-3">
                      <div 
                        v-for="issue in currentVisit.issues" 
                        :key="issue.id"
                        class="bg-white dark:bg-surface-900 rounded-lg border-l-4 border border-surface-200 dark:border-surface-700 p-4 shadow-sm"
                        :class="getIssueBorderClass(issue.severity)"
                      >
                        <div class="flex items-start justify-between mb-3">
                          <h4 class="font-medium text-surface-900 dark:text-surface-0 text-sm">{{ issue.issue }}</h4>
                          <Badge :value="issue.severity" :severity="getIssueSeverity(issue.severity)" size="small" />
                        </div>
                        <div class="grid grid-cols-2 gap-3 mb-3 text-xs">
                          <div class="flex justify-between">
                            <span class="text-surface-600">Category:</span>
                            <span class="font-medium">{{ issue.category }}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-surface-600">Status:</span>
                            <Badge :value="issue.status" size="small" />
                          </div>
                        </div>
                        <div class="flex justify-between text-xs mb-3">
                          <span class="text-surface-600">Reported:</span>
                          <span class="font-medium">{{ formatDateTime(issue.reportedAt) }}</span>
                        </div>
                        <div v-if="issue.resolution" class="text-xs text-green-700 dark:text-green-300 p-2 bg-green-50 dark:bg-green-900 rounded border border-green-200 dark:border-green-800">
                          <strong>Resolution:</strong> {{ issue.resolution }}
                        </div>
                      </div>
                    </div>
                    <div v-else class="text-center text-surface-500 py-6">
                      <i class="pi pi-shield text-3xl mb-2 block opacity-30"></i>
                      <p class="text-sm">No issues reported for this visit.</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>

            <!-- Materials Tab -->
            <TabPanel value="materials" class="p-6">
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Materials & Inventory</h3>
                  <div class="text-right">
                    <div class="text-sm text-surface-600">Total Cost</div>
                    <div class="text-xl font-bold text-primary-600">
                      ${{ getTotalMaterialCost().toLocaleString() }}
                    </div>
                  </div>
                </div>

                <DataTable 
                  v-if="currentVisit.materials?.length"
                  :value="currentVisit.materials" 
                  class="p-datatable-sm"
                  :paginator="false"
                  responsiveLayout="scroll"
                >
                  <Column field="material" header="Material">
                    <template #body="slotProps">
                      <div class="font-medium">{{ slotProps.data.material }}</div>
                      <div class="text-sm text-surface-500">{{ slotProps.data.category }}</div>
                    </template>
                  </Column>
                  <Column field="quantity" header="Quantity" class="text-center">
                    <template #body="slotProps">
                      <Badge :value="slotProps.data.quantity" class="bg-blue-100 text-blue-800" />
                    </template>
                  </Column>
                  <Column field="unitCost" header="Unit Cost">
                    <template #body="slotProps">
                      ${{ (slotProps.data.unitCost || 0).toFixed(2) }}
                    </template>
                  </Column>
                  <Column field="totalCost" header="Total Cost">
                    <template #body="slotProps">
                      <span class="font-medium">
                        ${{ (slotProps.data.totalCost || 0).toLocaleString() }}
                      </span>
                    </template>
                  </Column>
                  <Column field="supplier" header="Supplier">
                    <template #body="slotProps">
                      {{ slotProps.data.supplier || 'N/A' }}
                    </template>
                  </Column>
                </DataTable>

                <div v-else class="text-center text-surface-500 py-8">
                  <i class="pi pi-box text-4xl mb-4 block"></i>
                  <p>No materials recorded for this visit.</p>
                </div>
              </div>
            </TabPanel>

            <!-- Data Quality Tab -->
            <TabPanel value="data-quality" class="p-6">
              <div v-if="currentVisit.extraction_warnings?.length" class="space-y-6">
                <!-- Header -->
                <div class="text-center mb-8">
                  <div class="flex justify-center mb-4">
                    <div class="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                      <i class="pi pi-exclamation-triangle text-orange-600 text-2xl"></i>
                    </div>
                  </div>
                  <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-2">Data Quality Warnings</h2>
                  <p class="text-surface-600 dark:text-surface-300">
                    {{ currentVisit.extraction_warnings.length }} data quality issue{{ currentVisit.extraction_warnings.length !== 1 ? 's' : '' }} detected during AI processing
                  </p>
                </div>

                <!-- Warnings Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div 
                    v-for="(warning, index) in currentVisit.extraction_warnings" 
                    :key="index"
                    class="bg-white dark:bg-surface-900 rounded-lg border border-orange-200 dark:border-orange-800 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div class="p-5">
                      <!-- Warning Header -->
                      <div class="flex items-start gap-3 mb-4">
                        <div class="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center flex-shrink-0">
                          <i class="pi pi-exclamation-triangle text-orange-600"></i>
                        </div>
                        <div class="flex-1">
                          <h3 class="font-semibold text-surface-900 dark:text-surface-0 mb-1">
                            {{ formatWarningField(warning) }}
                          </h3>
                          <Badge :value="`Field ${index + 1}`" severity="warning" size="small" />
                        </div>
                      </div>

                      <!-- Warning Description -->
                      <div class="bg-orange-50 dark:bg-orange-950 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                        <p class="text-sm text-orange-800 dark:text-orange-200 leading-relaxed">
                          {{ formatWarningDescription(warning) }}
                        </p>
                      </div>

                      <!-- Severity Indicator -->
                      <div class="mt-4 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="text-xs text-surface-600 dark:text-surface-400">Severity:</span>
                          <Badge value="Warning" severity="warning" size="small" />
                        </div>
                        <div class="text-xs text-surface-500">
                          Impact: Data completeness
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Summary Card -->
                <div class="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950 rounded-lg p-6 border border-orange-200 dark:border-orange-800">
                  <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-3 flex items-center gap-2">
                    <i class="pi pi-info-circle text-orange-600"></i>
                    What This Means
                  </h3>
                  <div class="space-y-3 text-sm text-surface-700 dark:text-surface-300">
                    <p>
                      These warnings indicate areas where the AI extraction process encountered incomplete or missing data in the original visit documentation.
                    </p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div class="bg-white dark:bg-surface-900 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                        <h4 class="font-medium text-surface-900 dark:text-surface-0 mb-2">Impact</h4>
                        <ul class="text-xs space-y-1 text-surface-600 dark:text-surface-400">
                          <li>• Some analytics may be incomplete</li>
                          <li>• Certain metrics might be estimated</li>
                          <li>• Future predictions may be less accurate</li>
                        </ul>
                      </div>
                      <div class="bg-white dark:bg-surface-900 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                        <h4 class="font-medium text-surface-900 dark:text-surface-0 mb-2">Recommendations</h4>
                        <ul class="text-xs space-y-1 text-surface-600 dark:text-surface-400">
                          <li>• Update documentation standards</li>
                          <li>• Train technicians on data collection</li>
                          <li>• Implement validation checks</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- No Warnings State -->
              <div v-else class="text-center py-16">
                <div class="flex justify-center mb-6">
                  <div class="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <i class="pi pi-check-circle text-green-600 text-3xl"></i>
                  </div>
                </div>
                <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-3">Excellent Data Quality</h2>
                <p class="text-surface-600 dark:text-surface-300 mb-6 max-w-md mx-auto">
                  No data quality issues were detected during AI processing. All required information was successfully extracted.
                </p>
                <div class="bg-green-50 dark:bg-green-950 rounded-lg p-4 border border-green-200 dark:border-green-800 max-w-md mx-auto">
                  <div class="flex items-center justify-center gap-2 text-green-700 dark:text-green-300">
                    <i class="pi pi-verified"></i>
                    <span class="font-medium text-sm">100% Data Completeness</span>
                  </div>
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </div>

    <!-- No Visit Found -->
    <div v-else class="text-center text-surface-500 py-12">
      <i class="pi pi-search text-6xl mb-4 block"></i>
      <h2 class="text-2xl font-semibold mb-2">Visit Not Found</h2>
      <p class="mb-4">The requested visit could not be found.</p>
      <Button 
        icon="pi pi-arrow-left" 
        label="Back to Visit Management" 
        @click="$router.push('/field-services/visit-management')"
        class="p-button-outlined"
      />
    </div>
  </div>

  <!-- Ticket Drawer -->
  <Drawer 
    v-model:visible="ticketDrawerOpen" 
    position="right" 
    class="ticket-drawer"
    :style="{ width: '65vw', minWidth: '900px' }"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-3">
          <i class="pi pi-ticket text-primary-500"></i>
          <span class="font-semibold text-lg">Ticket Details</span>
        </div>
        <div v-if="ticketData" class="flex items-center gap-2 border-l border-surface-200 dark:border-surface-600 pl-4">
          <Button 
            icon="pi pi-external-link" 
            label="View in System" 
            size="small" 
            severity="secondary" 
            outlined 
            @click="openTicketInSystem"
            v-tooltip="'Open ticket in external system'"
          />
          <Button 
            icon="pi pi-print" 
            size="small" 
            severity="secondary" 
            outlined 
            v-tooltip="'Print ticket details'"
          />
        </div>
      </div>
    </template>

    <div v-if="ticketLoading" class="flex justify-center items-center py-12">
      <ProgressSpinner size="60" />
    </div>

    <div v-else-if="ticketData" class="space-y-5">
      <!-- Enhanced Header Section -->
      <div class="bg-gradient-to-r from-surface-0 to-surface-50 dark:from-surface-900 dark:to-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-3">
              <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">
                #{{ ticketData.ticket['Ticket #'] }}
              </h1>
              <div class="flex items-center gap-1 text-surface-600 dark:text-surface-400">
                <span class="text-sm font-mono">{{ ticketData.ticket['Mask ID'] }}</span>
                <Button 
                  :icon="copiedMaskId ? 'pi pi-check' : 'pi pi-copy'"
                  :class="{ 'text-green-600': copiedMaskId }"
                  size="small" 
                  text 
                  @click="copyMaskId"
                  v-tooltip="copiedMaskId ? 'Copied!' : 'Copy Mask ID'"
                  class="p-1 transition-colors"
                />
              </div>
            </div>
            
            <!-- Status Tags with Unique Colors -->
            <div class="flex items-center gap-2 mb-4">
              <Tag 
                :value="ticketData.ticket.Status" 
                :severity="getTicketStatusSeverity(ticketData.ticket.Status)"
                class="font-medium"
              />
              <Tag 
                :value="ticketData.ticket.Type" 
                severity="info"
                class="font-medium"
              />
              <Tag 
                :value="ticketData.ticket.Priority" 
                :severity="getPriorityTagSeverity(ticketData.ticket.Priority)"
                class="font-medium"
              />
              <Tag 
                v-if="ticketData.ticket.Department"
                :value="ticketData.ticket.Department" 
                severity="secondary"
                icon="pi pi-building"
              />
            </div>

            <!-- Enhanced Subject with Tooltip -->
            <div class="bg-white dark:bg-surface-800 rounded-lg p-4 border border-surface-200 dark:border-surface-600">
              <div class="flex items-start gap-2">
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-surface-600 dark:text-surface-400 mb-2">Subject</div>
                  <div 
                    v-if="!subjectExpanded" 
                    class="text-surface-900 dark:text-surface-0 font-semibold text-lg leading-snug cursor-pointer"
                    :class="{ 'line-clamp-2': ticketData.ticket.subject.length > 100 }"
                    @click="subjectExpanded = true"
                    v-tooltip="{ value: ticketData.ticket.subject, showDelay: 500 }"
                  >
                    {{ ticketData.ticket.subject }}
                  </div>
                  <div 
                    v-else 
                    class="text-surface-900 dark:text-surface-0 font-semibold text-lg leading-snug"
                  >
                    {{ ticketData.ticket.subject }}
                  </div>
                </div>
                <Button 
                  v-if="ticketData.ticket.subject.length > 100"
                  :icon="subjectExpanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
                  size="small"
                  text
                  @click="subjectExpanded = !subjectExpanded"
                  class="p-1 mt-1 flex-shrink-0"
                  v-tooltip="subjectExpanded ? 'Show less' : 'Show full subject'"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Meta Information with Aligned Heights -->
      <Card class="ticket-meta-card">
        <template #content>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Left Column: Contact & Timing -->
            <div class="space-y-4 h-full flex flex-col">
              <h4 class="font-semibold text-surface-900 dark:text-surface-0 flex items-center gap-2">
                <i class="pi pi-user text-primary-500"></i>
                Requester Information
              </h4>
              
              <div class="flex items-start gap-3 flex-1">
                <Avatar 
                  :label="getInitials(ticketData.ticket.Requester)" 
                  shape="circle" 
                  size="large"
                  :style="{ backgroundColor: getAvatarColor(ticketData.ticket.Requester), color: 'white' }"
                  class="flex-shrink-0"
                />
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-surface-900 dark:text-surface-0 truncate">{{ ticketData.ticket.Requester }}</div>
                  <a 
                    :href="`mailto:${ticketData.ticket['Requester Email']}`" 
                    class="text-sm text-primary-500 hover:underline flex items-center gap-1 truncate"
                  >
                    <i class="pi pi-envelope text-xs"></i>
                    {{ ticketData.ticket['Requester Email'] }}
                  </a>
                  <div class="grid grid-cols-1 gap-2 mt-3 text-xs text-surface-500 dark:text-surface-400">
                    <div class="flex justify-between">
                      <span>Created:</span>
                      <span>{{ formatDateTime(ticketData.ticket['Created At']) }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Updated:</span>
                      <span>{{ formatDateTime(ticketData.ticket['Last Updated']) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column: Metrics - Aligned Height -->
            <div class="h-full flex flex-col">
              <h4 class="font-semibold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
                <i class="pi pi-chart-line text-primary-500"></i>
                Ticket Metrics
              </h4>
              
              <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4 border flex-1">
                <div class="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div class="text-center p-3 bg-white dark:bg-surface-700 rounded-lg border">
                    <div class="text-2xl font-bold text-blue-600">{{ ticketData.ticket.Replies }}</div>
                    <div class="text-xs text-surface-600 dark:text-surface-400">Replies</div>
                  </div>
                  <div class="text-center p-3 bg-white dark:bg-surface-700 rounded-lg border">
                    <div class="text-2xl font-bold text-orange-600">{{ ticketData.ticket['Resolution Time'] }}</div>
                    <div class="text-xs text-surface-600 dark:text-surface-400">Resolution Time</div>
                  </div>
                </div>
                
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-surface-600 dark:text-surface-400">First Contact:</span>
                    <Tag 
                      :value="ticketData.ticket['First Contact Resolved']" 
                      :severity="ticketData.ticket['First Contact Resolved'] === 'Yes' ? 'success' : 'warning'"
                      size="small"
                      class="font-medium"
                    />
                  </div>
                  
                  <div class="space-y-2">
                    <div class="text-sm font-medium text-surface-700 dark:text-surface-300">Flags & Indicators</div>
                    <div class="flex flex-wrap gap-1">
                      <Tag 
                        v-if="ticketData.ticket['Has Attachments'] === 'Yes'" 
                        icon="pi pi-paperclip" 
                        value="Files" 
                        severity="info" 
                        size="small" 
                        class="font-medium"
                      />
                      <Tag 
                        v-if="ticketData.ticket['Was Reopened'] === 'Yes'" 
                        icon="pi pi-refresh" 
                        value="Reopened" 
                        severity="warning" 
                        size="small" 
                        class="font-medium"
                      />
                      <Tag 
                        v-if="ticketData.ticket.Escalated === 'Yes'" 
                        icon="pi pi-exclamation-triangle" 
                        value="Escalated" 
                        severity="danger" 
                        size="small" 
                        class="font-medium"
                      />
                      <Tag 
                        v-if="ticketData.ticket.Linked === 'Yes'" 
                        icon="pi pi-link" 
                        value="Linked" 
                        severity="info" 
                        size="small" 
                        class="font-medium"
                      />
                      <Tag 
                        v-if="getPrivatePostsCount() > 0" 
                        icon="pi pi-lock" 
                        :value="`${getPrivatePostsCount()} Private`" 
                        severity="secondary" 
                        size="small" 
                        class="font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Enhanced Conversation History -->
      <Card class="conversation-card">
        <template #header>
          <div class="flex items-center justify-between w-full py-2">
            <div class="flex items-center gap-3">
              <i class="pi pi-comments text-primary-500 text-xl"></i>
              <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0">Conversation History</h3>
              <Tag :value="`${ticketData.posts_count} posts`" severity="info" />
            </div>
            <div class="flex items-center gap-2">
              <Button 
                :label="allPostsExpanded ? 'Collapse All' : 'Expand All'"
                :icon="allPostsExpanded ? 'pi pi-compress' : 'pi pi-expand'"
                size="small"
                severity="secondary"
                outlined
                @click="toggleAllPosts"
              />
              <Button 
                label="Jump to Latest"
                icon="pi pi-angle-double-down"
                size="small"
                severity="primary"
                outlined
                @click="scrollToLatest"
                v-if="ticketData.posts.length > 3"
              />
            </div>
          </div>
        </template>
        <template #content>
          <div class="conversation-timeline" ref="conversationContainer">
            <div 
              v-for="(post, index) in ticketData.posts" 
              :key="post.ticketpostid"
              class="conversation-post"
              :class="{ 'post-private': post['Is Private'] === 'Yes', 'post-alternate': index % 2 === 1 }"
            >
              <!-- Enhanced Post Header -->
              <div class="flex items-start gap-3 mb-3">
                <Avatar 
                  :label="getInitials(post.post_author)" 
                  shape="circle"
                  :style="{ backgroundColor: getAvatarColor(post.post_author, post.staffid > 0), color: 'white' }"
                  class="flex-shrink-0"
                  size="normal"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-surface-900 dark:text-surface-0">{{ post.post_author }}</span>
                      <Tag 
                        :value="post.staffid > 0 ? 'Staff' : 'User'" 
                        :severity="post.staffid > 0 ? 'info' : 'secondary'"
                        size="small"
                        class="font-medium"
                      />
                    </div>
                    <div class="text-xs text-surface-500 whitespace-nowrap">
                      {{ formatDateTime(post['Post Date']) }}
                    </div>
                  </div>
                  
                  <!-- Inline Badges -->
                  <div v-if="post['Is Private'] === 'Yes' || post['Has Attachments'] === 'Yes'" class="flex items-center gap-1 mt-1">
                    <Tag 
                      v-if="post['Is Private'] === 'Yes'" 
                      value="Private" 
                      severity="danger" 
                      size="small" 
                      icon="pi pi-lock" 
                      class="font-medium"
                    />
                    <Tag 
                      v-if="post['Has Attachments'] === 'Yes'" 
                      value="Files" 
                      severity="info" 
                      size="small" 
                      icon="pi pi-paperclip" 
                      class="font-medium"
                    />
                  </div>
                </div>
              </div>
                  
              <!-- Post Subject (if different) -->
              <div v-if="post.post_subject !== post.ticket_subject" class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-3 italic">
                "{{ post.post_subject }}"
              </div>

              <!-- Enhanced Post Content with Shadow -->
              <div class="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-600 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div v-if="!expandedPosts[post.ticketpostid] && !allPostsExpanded">
                  <pre class="whitespace-pre-wrap text-sm text-surface-700 dark:text-surface-300 font-mono leading-relaxed">{{ getPostPreview(post.contents) }}</pre>
                  <Button 
                    v-if="post.contents.length > 400"
                    label="Show more"
                    icon="pi pi-chevron-down"
                    link
                    size="small"
                    class="mt-3 p-0 text-primary-600 hover:text-primary-700 font-medium"
                    @click="expandPost(post.ticketpostid)"
                  />
                </div>
                <div v-else>
                  <pre class="whitespace-pre-wrap text-sm text-surface-700 dark:text-surface-300 font-mono leading-relaxed">{{ post.contents }}</pre>
                  <Button 
                    v-if="post.contents.length > 400 && !allPostsExpanded"
                    label="Show less"
                    icon="pi pi-chevron-up"
                    link
                    size="small"
                    class="mt-3 p-0 text-primary-600 hover:text-primary-700 font-medium"
                    @click="collapsePost(post.ticketpostid)"
                  />
                </div>
              </div>

              <!-- Compact Post Footer -->
              <div class="flex items-center gap-3 mt-2 text-xs text-surface-500">
                <span class="flex items-center gap-1">
                  <i class="pi pi-envelope"></i>
                  {{ post.post_email }}
                </span>
                <span class="flex items-center gap-1">
                  <i class="pi pi-building"></i>
                  {{ post.departmenttitle }}
                </span>
              </div>
              
              <!-- Connector Line -->
              <div v-if="index < ticketData.posts.length - 1" class="conversation-connector"></div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <div v-else-if="ticketError" class="text-center py-12">
      <div class="text-red-500 mb-4">
        <i class="pi pi-exclamation-triangle text-4xl"></i>
      </div>
      <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Failed to Load Ticket</h3>
      <div class="text-surface-600 dark:text-surface-400 mb-4">
        {{ ticketError }}
      </div>
      <Button label="Retry" icon="pi pi-refresh" @click="retryTicketLoad" />
    </div>
  </Drawer>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useVisitsStore } from '@/stores/visitsStore';
import StatsCard from '@/components/field-services/StatsCard.vue';
import IssuesList from '@/components/field-services/IssuesList.vue';
import Timeline from 'primevue/timeline';

// Router and store
const route = useRoute();
const router = useRouter();
const visitsStore = useVisitsStore();

// Reactive state
const activeTab = ref('overview');

// Ticket drawer state
const ticketDrawerOpen = ref(false);
const expandedPosts = ref({});
const subjectExpanded = ref(false);
const allPostsExpanded = ref(false);
const conversationContainer = ref(null);
const copiedMaskId = ref(false);

// Computed properties
const visitId = computed(() => route.params.id);
const currentVisit = computed(() => visitsStore.currentVisit);
const visitTimeline = computed(() => visitsStore.visitTimeline);
const loading = computed(() => visitsStore.loading);
const timelineLoading = computed(() => visitsStore.timelineLoading);
const error = computed(() => visitsStore.error);

// Ticket computed properties
const ticketData = computed(() => visitsStore.currentTicket);
const ticketLoading = computed(() => visitsStore.ticketLoading);
const ticketError = computed(() => visitsStore.ticketError);

// Timeline computed property for professional display
const timelineEvents = computed(() => {
  if (!currentVisit.value) return [];
  
  const events = [];
  const baseTime = new Date(currentVisit.value.serviceDate || new Date());
  
  // Start/Arrival event
  if (currentVisit.value.serviceDate) {
    events.push({
      type: 'Arrival',
      status: 'Arrival',
      title: 'Technician Arrival',
      time: formatTime(currentVisit.value.serviceDate),
      date: formatDateTime(currentVisit.value.serviceDate),
      details: `Arrived at ${currentVisit.value.customer?.name || 'customer location'}`,
      icon: 'pi pi-map-marker',
      color: 'primary'
    });
  }
  
  // Add AI actions performed as timeline events
  if (currentVisit.value.ai_analysis?.actions_performed?.length) {
    currentVisit.value.ai_analysis.actions_performed.forEach((action, index) => {
      const actionTime = new Date(baseTime.getTime() + (index + 1) * 30 * 60000); // Add 30 minutes per action
      events.push({
        type: 'Work',
        status: 'Work',
        title: 'Progress',
        time: formatTime(actionTime),
        date: formatDateTime(actionTime),
        details: action,
        icon: 'pi pi-wrench',
        color: 'work'
      });
    });
  }
  
  // Add key interactions as timeline events
  if (currentVisit.value.ai_analysis?.key_interactions?.length) {
    currentVisit.value.ai_analysis.key_interactions.forEach((interaction, index) => {
      const interactionTime = interaction.timestamp ? 
        new Date(interaction.timestamp) : 
        new Date(baseTime.getTime() + (index + 10) * 15 * 60000); // Add 15 minutes per interaction
        
      events.push({
        type: 'Communication',
        status: 'Communication',
        title: interaction.type || 'Communication',
        time: formatTime(interactionTime),
        date: formatDateTime(interactionTime),
        details: interaction.description || interaction,
        icon: 'pi pi-comments',
        color: 'communication'
      });
    });
  }
  
  // Add issues as timeline events
  if (currentVisit.value.enhanced_data?.issues_encountered?.length) {
    currentVisit.value.enhanced_data.issues_encountered.forEach((issue, index) => {
      const issueTime = new Date(baseTime.getTime() + (index + 5) * 45 * 60000); // Add 45 minutes per issue
      events.push({
        type: 'Issue',
        status: 'Issue',
        title: 'Issue',
        time: formatTime(issueTime),
        date: formatDateTime(issueTime),
        details: `${issue.description}\nStatus: ${issue.status}`,
        icon: 'pi pi-exclamation-triangle',
        color: issue.status === 'Resolved' ? 'success' : 'danger'
      });
    });
  }
  
  // Add approval/completion event
  if (currentVisit.value.status === 'completed') {
    const completionTime = currentVisit.value.updatedAt ? 
      new Date(currentVisit.value.updatedAt) : 
      new Date(baseTime.getTime() + 4 * 60 * 60000); // Add 4 hours as default completion time
      
    events.push({
      type: 'Completion',
      status: 'Completion',
      title: 'Completed',
      time: formatTime(completionTime),
      date: formatDateTime(completionTime),
      details: `Work completed successfully. Quality score: ${currentVisit.value.ai_analysis?.technician_rating?.rating_value || 'N/A'}`,
      icon: 'pi pi-check-circle',
      color: 'success'
    });
  }
  
  // Sort events by time
  return events.sort((a, b) => new Date(a.date) - new Date(b.date));
});

// Methods
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatTime(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStatusSeverity(status) {
  const severityMap = {
    'completed': 'success',
    'in_progress': 'warning',
    'scheduled': 'info',
    'cancelled': 'danger',
    'failed': 'danger'
  };
  return severityMap[status] || 'secondary';
}

function getRiskColor(riskLevel) {
  const colorMap = {
    'low': 'success',
    'medium': 'warning',
    'high': 'danger'
  };
  return colorMap[riskLevel?.toLowerCase()] || 'secondary';
}

function getTaskStatusSeverity(status) {
  const severityMap = {
    'completed': 'success',
    'in_progress': 'warning',
    'pending': 'info',
    'cancelled': 'danger'
  };
  return severityMap[status] || 'secondary';
}

function getIssueSeverity(severity) {
  const severityMap = {
    'low': 'info',
    'medium': 'warning',
    'high': 'danger',
    'critical': 'danger'
  };
  return severityMap[severity] || 'secondary';
}

function getIssueBorderClass(severity) {
  const classMap = {
    'low': 'border-blue-400',
    'medium': 'border-yellow-400',
    'high': 'border-orange-400',
    'critical': 'border-red-400'
  };
  return classMap[severity] || 'border-gray-400';
}

function getRiskChipClass(risk) {
  if (risk.includes('weather')) return 'bg-blue-100 text-blue-800';
  if (risk.includes('safety')) return 'bg-red-100 text-red-800';
  if (risk.includes('delay')) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-800';
}

function getOutcomeStatusSeverity(status) {
  const severityMap = {
    'Completed': 'success',
    'Partial Completion': 'warning',
    'Failed': 'danger',
    'Incomplete': 'danger',
    'Cancelled': 'secondary'
  };
  return severityMap[status] || 'info';
}

// Material formatting helpers
function formatMaterialName(material) {
  if (typeof material === 'string') return material;
  return material?.item || material?.name || material?.material || 'Unknown Material';
}

function formatMaterialQuantity(material) {
  if (typeof material === 'string') return null;
  return material?.quantity ? `Qty: ${material.quantity}` : null;
}

function formatMaterialDescription(material) {
  if (typeof material === 'string') return null;
  return material?.description || null;
}

function formatMaterialCost(material) {
  if (typeof material === 'string') return null;
  if (material?.cost === null || material?.cost === undefined) return null;
  return typeof material.cost === 'number' ? material.cost.toFixed(2) : material.cost;
}

// Warning formatting helpers
function formatWarningField(warning) {
  if (typeof warning === 'string') return 'General Warning';
  return warning?.field ? warning.field.replace(/\./g, ' → ').replace(/_/g, ' ').toUpperCase() : 'Unknown Field';
}

function formatWarningDescription(warning) {
  if (typeof warning === 'string') return warning;
  return warning?.description || warning?.message || 'No description available';
}

// Outcome analysis formatting helper
function formatOutcomeAnalysis(outcome) {
  if (typeof outcome === 'string') return outcome;
  
  if (typeof outcome === 'object' && outcome !== null) {
    const formatted = [];
    
    if (outcome.primary_status) {
      formatted.push(`Status: ${outcome.primary_status}`);
    }
    
    if (outcome.completion_percentage !== undefined) {
      formatted.push(`Completion: ${outcome.completion_percentage}%`);
    }
    
    if (outcome.customer_communication) {
      const comm = outcome.customer_communication;
      const commDetails = [];
      if (comm.outcome_explained_to_customer) commDetails.push('outcome explained to customer');
      if (comm.follow_up_scheduled) commDetails.push('follow-up scheduled');
      if (comm.customer_approval_for_additional_work) commDetails.push('additional work approved');
      if (commDetails.length > 0) {
        formatted.push(`Customer Communication: ${commDetails.join(', ')}`);
      }
    }
    
    if (outcome.revisit_analysis) {
      const revisit = outcome.revisit_analysis;
      if (revisit.revisit_required === false) {
        formatted.push('No revisit required');
      } else if (revisit.revisit_required === true) {
        let revisitText = 'Revisit required';
        if (revisit.revisit_reason) revisitText += ` - ${revisit.revisit_reason}`;
        if (revisit.estimated_revisit_duration) revisitText += ` (${revisit.estimated_revisit_duration})`;
        formatted.push(revisitText);
      }
    }
    
    if (outcome.blocking_issues_analysis && outcome.blocking_issues_analysis.length > 0) {
      formatted.push(`Blocking Issues: ${outcome.blocking_issues_analysis.join(', ')}`);
    }
    
    return formatted.join('. ') + (formatted.length > 0 ? '.' : '');
  }
  
  return outcome || 'No outcome analysis available';
}

// Issues helper functions
function getIssuesHeaderStyle() {
  const unresolvedCount = getUnresolvedIssuesCount();
  if (unresolvedCount === 0) return 'bg-green-600';
  if (unresolvedCount === 1) return 'bg-orange-600';
  return 'bg-red-600';
}

function getUnresolvedIssuesCount() {
  const issues = currentVisit.value?.enhanced_data?.issues_encountered || [];
  return issues.filter(issue => issue.status === 'Unresolved' || issue.status === 'Open').length;
}

function getIssueCardClass(status) {
  const baseClass = 'bg-surface-50 dark:bg-surface-800';
  if (status === 'Resolved') return `${baseClass} border-green-400`;
  if (status === 'Unresolved' || status === 'Open') return `${baseClass} border-red-400`;
  return `${baseClass} border-orange-400`;
}

function getIssueBadgeSeverity(status) {
  if (status === 'Resolved') return 'success';
  if (status === 'Unresolved' || status === 'Open') return 'danger';
  return 'warning';
}

// Hero metrics styling functions
function getCompletionColor() {
  const percentage = currentVisit.value?.computed_metrics?.completion_percentage || 0;
  if (percentage >= 80) return 'text-green-600 dark:text-green-400';
  if (percentage >= 50) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

function getCompletionStrokeColor() {
  const percentage = currentVisit.value?.computed_metrics?.completion_percentage || 0;
  if (percentage >= 80) return '#16a34a';
  if (percentage >= 50) return '#ea580c';
  return '#dc2626';
}

function getQualityColor() {
  const rating = currentVisit.value?.ai_analysis?.technician_rating?.rating_value || 0;
  const scale = currentVisit.value?.ai_analysis?.technician_rating?.rating_scale || 10;
  const percentage = (rating / scale) * 100;
  if (percentage >= 80) return 'text-green-600 dark:text-green-400';
  if (percentage >= 60) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

function getIssuesStatusColor() {
  const unresolvedCount = getUnresolvedIssuesCount();
  if (unresolvedCount === 0) return 'text-green-600 dark:text-green-400';
  if (unresolvedCount === 1) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

function getRevisitRequired() {
  // Check multiple possible paths for revisit data
  return currentVisit.value?.outcome_analysis?.revisit_analysis?.revisit_required || 
         currentVisit.value?.future_actions?.revisit_required ||
         false;
}

function getRevisitReason() {
  // Check multiple possible paths for revisit reason
  return currentVisit.value?.outcome_analysis?.revisit_analysis?.revisit_reason || 
         currentVisit.value?.future_actions?.revisit_reason ||
         'Additional work required';
}

function getRevisitStatusColor() {
  const revisitRequired = getRevisitRequired();
  return revisitRequired 
    ? 'text-orange-600 dark:text-orange-400' 
    : 'text-green-600 dark:text-green-400';
}

function getAIStatusColor() {
  if (currentVisit.value?.computed_metrics?.has_ai_analysis) {
    return 'text-green-600 dark:text-green-400';
  }
  return 'text-orange-600 dark:text-orange-400';
}

function getAIStatusIcon() {
  if (currentVisit.value?.computed_metrics?.has_ai_analysis) {
    return 'pi pi-check-circle';
  }
  return 'pi pi-clock';
}

function getCompletionBgColor() {
  const percentage = currentVisit.value?.computed_metrics?.completion_percentage || 0;
  if (percentage >= 75) return 'bg-green-500';
  if (percentage >= 50) return 'bg-yellow-500';
  if (percentage >= 25) return 'bg-orange-500';
  return 'bg-red-500';
}

function getMiniTimelineEvents() {
  if (!currentVisit.value) return [];
  
  // Generate timeline events from available data
  const events = [];
  
  // Add service date as start event
  if (currentVisit.value.serviceDate) {
    events.push({
      type: 'start',
      title: 'Visit Started',
      timestamp: currentVisit.value.serviceDate,
      description: `${currentVisit.value.visitType || 'Service'} visit began`
    });
  }
  
  // Add issues as timeline events
  if (currentVisit.value.enhanced_data?.issues_encountered?.length) {
    currentVisit.value.enhanced_data.issues_encountered.forEach(issue => {
      events.push({
        type: 'issue',
        title: 'Issue Identified',
        timestamp: currentVisit.value.serviceDate, // Fallback timestamp
        description: issue.description
      });
    });
  }
  
  // Add completion event if visit is completed
  if (currentVisit.value.status === 'Completed') {
    events.push({
      type: 'completion',
      title: 'Visit Completed',
      timestamp: currentVisit.value.serviceDate,
      description: `${currentVisit.value.computed_metrics?.completion_percentage || 100}% completion achieved`
    });
  }
  
  // Sort by timestamp and return first 3
  return events
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .slice(0, 3);
}

function getExtendedTimelineEvents() {
  if (!currentVisit.value) return [];
  
  // Generate comprehensive timeline events from available data
  const events = [];
  
  // Add service date as start event
  if (currentVisit.value.serviceDate) {
    events.push({
      type: 'arrival',
      title: 'Technician Arrival',
      timestamp: currentVisit.value.serviceDate,
      description: `Arrived at ${currentVisit.value.customer?.name || 'customer location'}`,
      details: `Visit type: ${currentVisit.value.visitType || 'Service'}`
    });
  }
  
  // Add work start event
  if (currentVisit.value.serviceDate) {
    const workStartTime = new Date(currentVisit.value.serviceDate);
    workStartTime.setMinutes(workStartTime.getMinutes() + 15); // Simulate 15 min after arrival
    
    events.push({
      type: 'start',
      title: 'Work Started',
      timestamp: workStartTime.toISOString(),
      description: 'Field service work commenced',
      details: `Team: ${currentVisit.value.technicians?.map(t => t.name).join(', ') || 'Technician'}`
    });
  }
  
  // Add key interactions as timeline events
  if (currentVisit.value.ai_analysis?.key_interactions?.length) {
    currentVisit.value.ai_analysis.key_interactions.forEach((interaction, index) => {
      const interactionTime = new Date(currentVisit.value.serviceDate);
      interactionTime.setMinutes(interactionTime.getMinutes() + 30 + (index * 20)); // Spread interactions
      
      events.push({
        type: 'interaction',
        title: interaction.type || 'Customer Interaction',
        timestamp: interactionTime.toISOString(),
        description: interaction.description || interaction,
        details: 'Communication with customer'
      });
    });
  }
  
  // Add issues as timeline events
  if (currentVisit.value.enhanced_data?.issues_encountered?.length) {
    currentVisit.value.enhanced_data.issues_encountered.forEach((issue, index) => {
      const issueTime = new Date(currentVisit.value.serviceDate);
      issueTime.setHours(issueTime.getHours() + 1 + index); // Spread issues over time
      
      events.push({
        type: 'issue',
        title: 'Issue Encountered',
        timestamp: issueTime.toISOString(),
        description: issue.description,
        details: issue.mitigation ? `Mitigation: ${issue.mitigation}` : `Status: ${issue.status}`
      });
    });
  }
  
  // Add materials usage event
  if (currentVisit.value.ai_analysis?.materials_used?.length) {
    const materialsTime = new Date(currentVisit.value.serviceDate);
    materialsTime.setHours(materialsTime.getHours() + 1, 30, 0, 0);
    
    events.push({
      type: 'materials',
      title: 'Materials Applied',
      timestamp: materialsTime.toISOString(),
      description: `${currentVisit.value.ai_analysis.materials_used.length} materials used`,
      details: `Primary: ${formatMaterialName(currentVisit.value.ai_analysis.materials_used[0])}`
    });
  }
  
  // Add completion event if visit is completed
  if (currentVisit.value.status === 'Completed') {
    const completionTime = new Date(currentVisit.value.serviceDate);
    completionTime.setHours(completionTime.getHours() + (currentVisit.value.hoursWorked || 2));
    
    events.push({
      type: 'completion',
      title: 'Work Completed',
      timestamp: completionTime.toISOString(),
      description: `${currentVisit.value.computed_metrics?.completion_percentage || 100}% completion achieved`,
      details: `Quality score: ${currentVisit.value.ai_analysis?.technician_rating?.rating_value || 'N/A'}/10`
    });
  }
  
  // Add departure event
  if (currentVisit.value.serviceDate) {
    const departureTime = new Date(currentVisit.value.serviceDate);
    departureTime.setHours(departureTime.getHours() + (currentVisit.value.hoursWorked || 2) + 0.25);
    
    events.push({
      type: 'departure',
      title: 'Site Departure',
      timestamp: departureTime.toISOString(),
      description: 'Technician departed from customer site',
      details: `Total duration: ${currentVisit.value.computed_metrics?.actual_duration || currentVisit.value.hoursWorked + 'h' || 'N/A'}`
    });
  }
  
  // Sort by timestamp and return all events (or limit to 6-8 for extended view)
  return events
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .slice(0, 8); // Show up to 8 events for extended timeline
}

function getPreviewTasks() {
  if (!currentVisit.value) return [];
  
  // Generate tasks from scope analysis and recommendations
  const tasks = [];
  
  // Add incomplete scope items as tasks
  if (currentVisit.value.scope_analysis?.not_completed_scope?.length) {
    currentVisit.value.scope_analysis.not_completed_scope.forEach(item => {
      tasks.push({
        title: item,
        description: 'Remaining scope work',
        completed: false,
        priority: 'High',
        dueDate: null
      });
    });
  }
  
  // Add recommended actions as tasks
  if (currentVisit.value.future_actions?.recommended_actions?.length) {
    currentVisit.value.future_actions.recommended_actions.forEach(action => {
      tasks.push({
        title: action,
        description: 'AI recommended action',
        completed: false,
        priority: 'Normal',
        dueDate: null
      });
    });
  }
  
  // Add completed scope items as completed tasks
  if (currentVisit.value.scope_analysis?.completed_scope?.length) {
    currentVisit.value.scope_analysis.completed_scope.slice(0, 1).forEach(item => {
      tasks.push({
        title: item,
        description: 'Completed scope work',
        completed: true,
        priority: 'Normal',
        dueDate: null
      });
    });
  }
  
  // Return first 2 tasks (mix of completed and pending)
  return tasks.slice(0, 2);
}

function getTimelineIcon(type) {
  const iconMap = {
    'arrival': 'pi pi-map-marker',
    'start': 'pi pi-play',
    'completion': 'pi pi-check',
    'issue': 'pi pi-exclamation-triangle',
    'departure': 'pi pi-sign-out',
    'interaction': 'pi pi-comments',
    'materials': 'pi pi-box'
  };
  return iconMap[type] || 'pi pi-circle';
}

function getTimelineMarkerColor(type) {
  const colorMap = {
    'arrival': '#3b82f6',
    'start': '#10b981',
    'completion': '#22c55e',
    'issue': '#f59e0b',
    'departure': '#6b7280',
    'interaction': '#8b5cf6',
    'materials': '#f97316'
  };
  return colorMap[type] || '#6b7280';
}

function getTotalMaterialCost() {
  if (!currentVisit.value?.materials) return 0;
  return currentVisit.value.materials.reduce((sum, material) => sum + (material.totalCost || 0), 0);
}

function scheduleFollowUp() {
  // Navigate to create visit form with pre-filled customer data
  router.push({
    path: '/field-services/visit-management',
    query: { 
      action: 'create',
      customer: currentVisit.value?.customer?.id,
      project: currentVisit.value?.project?.id,
      followUp: currentVisit.value?.id
    }
  });
}

function handleViewIssue(issue) {
  // You can implement issue detail view here
  console.log('View issue details:', issue);
}

// Issue action functions
function resolveIssue(issue, index) {
  // Update the issue status
  if (currentVisit.value?.enhanced_data?.issues_encountered?.[index]) {
    currentVisit.value.enhanced_data.issues_encountered[index].status = 'Resolved';
    // You could also make an API call here to persist the change
    console.log('Issue resolved:', issue);
  }
}

function addIssueNote(issue, index) {
  // Open a dialog or inline editor for adding notes
  const note = prompt('Add a note about this issue:');
  if (note && currentVisit.value?.enhanced_data?.issues_encountered?.[index]) {
    // Add the note to the issue (you'd need to extend the data structure)
    console.log('Note added to issue:', issue, 'Note:', note);
  }
}

function scheduleIssueFollowUp(issue) {
  // Navigate to scheduling with issue context
  router.push({
    path: '/field-services/visit-management',
    query: { 
      action: 'create',
      customer: currentVisit.value?.customer?.id,
      project: currentVisit.value?.project?.id,
      issue_followup: issue.description
    }
  });
}

function getTaskPrioritySeverity(priority) {
  switch (priority?.toLowerCase()) {
    case 'high':
    case 'urgent':
      return 'danger';
    case 'medium':
      return 'warning';
    case 'low':
      return 'info';
    default:
      return 'secondary';
  }
}

// Ticket functions
async function openTicketDrawer() {
  console.log('Opening ticket drawer, currentVisit:', currentVisit.value);
  console.log('External ID:', currentVisit.value?.externalId);
  console.log('visitsStore methods:', Object.keys(visitsStore));
  console.log('fetchTicketData available:', typeof visitsStore.fetchTicketData);
  
  const externalId = currentVisit.value?.externalId;
  
  if (!externalId) {
    console.error('No external_id available for ticket lookup. Current visit:', currentVisit.value);
    return;
  }

  ticketDrawerOpen.value = true;
  expandedPosts.value = {};
  
  if (typeof visitsStore.fetchTicketData === 'function') {
    await visitsStore.fetchTicketData(externalId);
  } else {
    console.error('fetchTicketData is not available on visitsStore');
  }
}

function getTicketStatusSeverity(status) {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'resolved':
      return 'success';
    case 'in progress':
    case 'assigned':
      return 'warning';
    case 'open':
    case 'new':
      return 'info';
    case 'escalated':
    case 'high priority':
      return 'danger';
    default:
      return 'secondary';
  }
}

function getTicketPrioritySeverity(priority) {
  switch (priority?.toLowerCase()) {
    case 'high':
    case 'urgent':
      return 'danger';
    case 'medium':
      return 'warning';
    case 'low':
      return 'info';
    case 'normal':
    default:
      return 'secondary';
  }
}

function getPostPreview(content) {
  if (!content || content.length <= 400) return content;
  return content.substring(0, 400) + '...';
}

function expandPost(postId) {
  expandedPosts.value[postId] = true;
}

function collapsePost(postId) {
  expandedPosts.value[postId] = false;
}

// Enhanced helper functions
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name, isStaff = false) {
  const colors = isStaff 
    ? ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1'] // Staff colors
    : ['#94A3B8', '#64748B', '#475569', '#334155', '#1E293B', '#0F172A']; // User colors
  
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function getPriorityTagSeverity(priority) {
  switch (priority?.toLowerCase()) {
    case 'high':
    case 'urgent':
      return 'danger';
    case 'medium':
      return 'warning';
    case 'low':
      return 'success';
    case 'normal':
    default:
      return 'secondary';
  }
}

function getPrivatePostsCount() {
  if (!ticketData.value?.posts) return 0;
  return ticketData.value.posts.filter(post => post['Is Private'] === 'Yes').length;
}

// Enhanced copy function with visual feedback
async function copyMaskId() {
  if (!ticketData.value?.ticket?.['Mask ID']) return;
  
  try {
    await navigator.clipboard.writeText(ticketData.value.ticket['Mask ID']);
    copiedMaskId.value = true;
    setTimeout(() => {
      copiedMaskId.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    // Could add a toast notification here
    console.log('Copied to clipboard:', text);
  }).catch(err => {
    console.error('Failed to copy to clipboard:', err);
  });
}

function toggleAllPosts() {
  allPostsExpanded.value = !allPostsExpanded.value;
  if (!allPostsExpanded.value) {
    // Reset individual expansions when collapsing all
    expandedPosts.value = {};
  }
}

function scrollToLatest() {
  if (conversationContainer.value) {
    const posts = conversationContainer.value.querySelectorAll('.conversation-post');
    if (posts.length > 0) {
      posts[posts.length - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

function retryTicketLoad() {
  if (currentVisit.value?.externalId) {
    openTicketDrawer();
  }
}

function openTicketInSystem() {
  if (ticketData.value?.ticket?.['Ticket #']) {
    const ticketId = ticketData.value.ticket['Ticket #'];
    const url = `https://staff.cissdm.com/ticketing/ticket/${ticketId}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

// Lifecycle
onMounted(async () => {
  if (visitId.value) {
    await visitsStore.fetchVisit(visitId.value);
  }
});

// Watch for route changes
watch(visitId, async (newId) => {
  if (newId) {
    await visitsStore.fetchVisit(newId);
  }
});
</script>

<style scoped>
.visit-detail-page {
  min-height: 100vh;
  background: #f8f9fa;
}

.visit-detail-tabs .p-tabview-nav {
  background: transparent;
  border-bottom: 1px solid var(--surface-border);
}

.visit-detail-tabs .p-tabview-header {
  background: transparent;
}

.visit-detail-tabs .p-tabview-header.p-highlight {
  background: var(--primary-color);
  color: var(--primary-color-text);
}

.customized-timeline .p-timeline-event-content {
  min-height: auto;
}

.customized-timeline .p-timeline-event-separator {
  flex: 0;
}

/* Mini Timeline Styling */
.customized-mini-timeline :deep(.p-timeline-event) {
  min-height: auto;
  margin-bottom: 0.5rem;
}

.customized-mini-timeline :deep(.p-timeline-event-connector) {
  width: 1px;
  background: var(--surface-300);
}

.customized-mini-timeline :deep(.p-timeline-event-marker) {
  border: none;
  box-shadow: none;
  margin-left: 0;
}

.customized-mini-timeline :deep(.p-timeline-event-content) {
  padding-left: 1rem;
  padding-bottom: 0.75rem;
}

/* Alternate Timeline Styling */
.customized-alternate-timeline :deep(.p-timeline-event) {
  min-height: auto;
  margin-bottom: 0.75rem;
}

.customized-alternate-timeline :deep(.p-timeline-event-connector) {
  width: 2px;
  background: linear-gradient(to bottom, var(--surface-300), var(--surface-200));
}

.customized-alternate-timeline :deep(.p-timeline-event-marker) {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.customized-alternate-timeline :deep(.p-timeline-event-content) {
  padding: 0;
  margin-top: -0.25rem; /* Overlap slightly for compactness */
}

.customized-alternate-timeline :deep(.p-timeline-event-opposite) {
  padding: 0.25rem 0.5rem;
  margin-top: 0.25rem;
}

/* Alternate sides - left content */
.customized-alternate-timeline :deep(.p-timeline-event:nth-child(odd) .p-timeline-event-content) {
  margin-right: 1rem;
  margin-left: 0;
}

/* Alternate sides - right content */
.customized-alternate-timeline :deep(.p-timeline-event:nth-child(even) .p-timeline-event-content) {
  margin-left: 1rem;
  margin-right: 0;
}

/* Connector positioning for compact layout */
.customized-alternate-timeline :deep(.p-timeline-event-separator) {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  flex-direction: column;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.75rem;
}

:deep(.p-rating .p-rating-icon) {
  font-size: 1rem;
}

.line-clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Enhanced Tab Styling */
:deep(.visit-detail-tabs .p-tablist-tab) {
  padding: 1rem 1.5rem;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
  font-weight: 500;
}

:deep(.visit-detail-tabs .p-tablist-tab:hover) {
  background: var(--surface-50);
  border-bottom-color: var(--primary-300);
}

:deep(.visit-detail-tabs .p-tablist-tab.p-tablist-tab-active) {
  background: var(--primary-50);
  border-bottom-color: var(--primary-500);
  color: var(--primary-700);
  font-weight: 600;
}

:deep(.visit-detail-tabs .p-tablist-tab.p-tablist-tab-active .pi) {
  color: var(--primary-600);
}

/* Sticky header enhancements */
.sticky {
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.95);
}

.dark .sticky {
  background: rgba(31, 41, 55, 0.95);
}

/* Hero metrics animations */
@keyframes pulse-success {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes pulse-warning {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

.text-green-600 {
  animation: pulse-success 2s infinite;
}

.text-red-600 {
  animation: pulse-warning 2s infinite;
}

/* Enhanced Ticket Drawer Styles */
:deep(.ticket-drawer .p-drawer-content) {
  padding: 1.5rem;
  background: #fafafa;
}

:deep(.dark .ticket-drawer .p-drawer-content) {
  background: var(--surface-900);
}

/* Enhanced conversation timeline */
.conversation-timeline {
  position: relative;
}

.conversation-post {
  position: relative;
  padding: 1.5rem;
  margin-bottom: 1rem;
  background: white;
  border-radius: 12px;
  border: 1px solid var(--surface-200);
  transition: all 0.2s ease;
}

.conversation-post:hover {
  border-color: var(--primary-300);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.dark .conversation-post {
  background: var(--surface-800);
  border-color: var(--surface-600);
}

.conversation-post.post-private {
  border-left: 4px solid var(--red-500);
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.05) 0%, transparent 100%);
}

.conversation-post.post-alternate {
  background: var(--surface-50);
}

.dark .conversation-post.post-alternate {
  background: var(--surface-850);
}

.conversation-connector {
  position: absolute;
  left: 50%;
  bottom: -0.5rem;
  transform: translateX(-50%);
  width: 2px;
  height: 1rem;
  background: linear-gradient(to bottom, var(--surface-300), transparent);
}

/* Enhanced card styles */
.ticket-meta-card :deep(.p-card-body) {
  padding: 1.5rem;
}

.conversation-card :deep(.p-card-header) {
  background: var(--surface-50);
  border-bottom: 1px solid var(--surface-200);
  border-radius: 8px 8px 0 0;
}

.dark .conversation-card :deep(.p-card-header) {
  background: var(--surface-800);
  border-bottom-color: var(--surface-600);
}

/* Enhanced header section */
.ticket-drawer :deep(.p-drawer-header) {
  border-bottom: 1px solid var(--surface-200);
  background: white;
}

.dark .ticket-drawer :deep(.p-drawer-header) {
  border-bottom-color: var(--surface-600);
  background: var(--surface-800);
}

/* PrimeVue Timeline Styles */
.custom-timeline :deep(.p-timeline-event-content) {
  padding-left: 1rem;
  padding-bottom: 1rem;
  min-width: 0;
  word-wrap: break-word;
}

.custom-timeline :deep(.p-timeline-event-opposite) {
  padding-right: 1rem;
  min-width: 0;
}

/* Timeline Connector Line - Multiple selectors to ensure visibility */
.custom-timeline :deep(.p-timeline-event-connector),
.custom-timeline :deep(.p-timeline::before),
.custom-timeline :deep(.p-timeline .p-timeline-event-connector) {
  width: 3px !important;
  background: #cbd5e1 !important;
  background-color: #cbd5e1 !important;
  border: none !important;
  opacity: 1 !important;
  display: block !important;
}

.dark .custom-timeline :deep(.p-timeline-event-connector),
.dark .custom-timeline :deep(.p-timeline::before),
.dark .custom-timeline :deep(.p-timeline .p-timeline-event-connector) {
  background: #64748b !important;
  background-color: #64748b !important;
}

/* Force the timeline to show the connector */
.custom-timeline :deep(.p-timeline) {
  position: relative;
}

.custom-timeline :deep(.p-timeline::before) {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #cbd5e1;
  transform: translateX(-50%);
  z-index: 0;
}

.dark .custom-timeline :deep(.p-timeline::before) {
  background: #64748b;
}

/* Clean Timeline Markers - COLORED BY TYPE */
.timeline-marker-clean {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: var(--surface-200);
  color: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 2;
  flex-shrink: 0;
}

/* Arrival - Blue */
.timeline-marker-clean.marker-primary { 
  background: #3B82F6;
}

/* Work - Purple */
.timeline-marker-clean.marker-work { 
  background: #8B5CF6;
}

/* Communication - Green */
.timeline-marker-clean.marker-communication { 
  background: #10B981;
}

/* Success/Completion - Green */
.timeline-marker-clean.marker-success { 
  background: #059669;
}

/* Issues - Red */
.timeline-marker-clean.marker-danger { 
  background: #EF4444;
}

.timeline-marker-clean.marker-secondary { 
  background: var(--surface-500); 
}

/* Clean Timeline Content */
.timeline-content-clean {
  background: transparent;
  padding: 0.25rem 0;
  min-width: 0;
  max-width: 100%;
}

.timeline-time {
  font-size: 0.75rem;
  color: var(--primary-600);
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.dark .timeline-time {
  color: var(--primary-400);
}

.timeline-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.25rem;
  gap: 0.5rem;
  min-width: 0;
}

.timeline-title {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--surface-900);
  flex: 1;
  min-width: 0;
  word-wrap: break-word;
}

.dark .timeline-title {
  color: var(--surface-0);
}

.timeline-details {
  font-size: 0.8rem;
  color: var(--surface-700);
  white-space: pre-line;
  line-height: 1.4;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}

.dark .timeline-details {
  color: var(--surface-300);
}

/* Responsive Timeline */
@media (max-width: 768px) {
  .custom-timeline :deep(.p-timeline-event-content) {
    padding-left: 0.5rem;
    padding-bottom: 0.75rem;
  }
  
  .custom-timeline :deep(.p-timeline-event-opposite) {
    padding-right: 0.5rem;
  }
  
  .timeline-marker-clean {
    width: 1.25rem;
    height: 1.25rem;
  }
  
  .timeline-title {
    font-size: 0.8rem;
  }
  
  .timeline-details {
    font-size: 0.75rem;
  }
  
  .timeline-time {
    font-size: 0.7rem;
  }
}

/* Avatar enhancements */
:deep(.p-avatar) {
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Tag enhancements */
:deep(.p-tag) {
  font-weight: 500;
  letter-spacing: 0.025em;
}

/* Button link enhancements */
:deep(.p-button-link) {
  border-radius: 6px;
  transition: all 0.2s ease;
}

:deep(.p-button-link:hover) {
  background: var(--primary-50) !important;
}

/* Responsive design */
@media (max-width: 1024px) {
  :deep(.ticket-drawer) {
    width: 80vw !important;
    min-width: 600px !important;
  }
}

@media (max-width: 768px) {
  :deep(.ticket-drawer) {
    width: 100vw !important;
    min-width: unset !important;
  }
  
  .conversation-post {
    padding: 1rem;
    margin-bottom: 0.75rem;
  }
  
  :deep(.p-card-body) {
    padding: 1rem !important;
  }
}

/* Enhanced scrollbar for conversation */
.conversation-timeline {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 8px;
}

.conversation-timeline::-webkit-scrollbar {
  width: 6px;
}

.conversation-timeline::-webkit-scrollbar-track {
  background: var(--surface-100);
  border-radius: 3px;
}

.conversation-timeline::-webkit-scrollbar-thumb {
  background: var(--surface-400);
  border-radius: 3px;
}

.conversation-timeline::-webkit-scrollbar-thumb:hover {
  background: var(--surface-500);
}

/* Subtle animations */
.conversation-post {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 