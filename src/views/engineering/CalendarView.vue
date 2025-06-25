<template>
  <div class="engineering-calendar">
    <!-- Header Section -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-2">
          🗓️ Engineering Calendar
        </h1>
        <p class="text-surface-600 dark:text-surface-300">
          Track ticket deadlines, engineer assignments, and activity schedules
        </p>
      </div>
      
      <!-- Calendar Controls -->
      <div class="flex items-center gap-3">
        <!-- View Toggle -->
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium">View:</label>
          <Select 
            v-model="selectedView" 
            :options="viewOptions" 
            optionLabel="label" 
            optionValue="value"
            @change="onViewChange"
            class="w-32"
          />
        </div>
        
        <!-- Engineer Filter -->
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium">Engineer:</label>
          <Select 
            v-model="selectedEngineer" 
            :options="engineerOptions" 
            optionLabel="label" 
            optionValue="value"
            @change="onEngineerChange"
            class="w-40"
            placeholder="All Engineers"
            showClear
          />
        </div>
        
        <!-- Refresh Button -->
        <Button 
          icon="pi pi-refresh" 
          :loading="isLoading"
          @click="refreshCalendar"
          outlined
          severity="secondary"
          v-tooltip="'Refresh Calendar'"
        />
        
        <!-- Add Event Button -->
        <Button 
          label="Add Activity" 
          icon="pi pi-plus"
          @click="showAddActivityDialog = true"
          severity="primary"
        />
      </div>
    </div>

    <!-- Calendar Component -->
    <div class="card p-0 overflow-hidden">
      <ejs-schedule
        ref="scheduleObj"
        :height="calendarHeight"
        :selectedDate="selectedDate"
        :eventSettings="eventSettings"
        :views="scheduleViews"
        :currentView="currentView"
        :workHours="workHours"
        :timeScale="timeScale"
        :eventRendered="onEventRendered"
        :popupOpen="onPopupOpen"
        :actionBegin="onActionBegin"
        :actionComplete="onActionComplete"
        :navigating="onNavigating"
        :cellClick="onCellClick"
        :eventClick="onEventClick"
        :rendering="onScheduleRendering"
        :locale="'en-US'"
        :dateFormat="'MM/dd/yyyy'"
        :timeFormat="'h:mm a'"
        :firstDayOfWeek="0"
        :showTimeIndicator="true"
        :allowMultiDrag="false"
        :allowResizing="true"
        :allowDragAndDrop="true"
        :enableAutoRowHeight="true"
        :rowAutoHeight="true"
        :allowInline="false"
        cssClass="engineering-schedule engineering-schedule-overlap"
      >
        <e-views>
          <e-view option="Day"></e-view>
          <e-view option="Week"></e-view>
          <e-view option="WorkWeek"></e-view>
          <e-view option="Month"></e-view>
          <e-view option="Agenda"></e-view>
          <e-view option="TimelineWeek"></e-view>
          <e-view option="TimelineMonth"></e-view>
        </e-views>
      </ejs-schedule>
    </div>

    <!-- Statistics Panel -->
    <div class="calendar-statistics bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl mb-6 overflow-hidden">
      <!-- Collapsed Stats Header -->
      <div class="flex items-center justify-between p-4 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-surface-800 dark:to-surface-700 border-b border-surface-200 dark:border-surface-600">
        <div class="flex items-center gap-4">
          <!-- Quick Stats Cards -->
          <div class="flex items-center gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {{ quickStatsDisplay.total }}
              </div>
              <div class="text-xs text-surface-600 dark:text-surface-300 font-medium">
                Total Events
              </div>
            </div>
            
            <div class="h-8 w-px bg-surface-300 dark:bg-surface-600"></div>
            
            <div class="text-center">
              <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {{ quickStatsDisplay.tickets }}
              </div>
              <div class="text-xs text-surface-600 dark:text-surface-300 font-medium">
                Ticket Deadlines
              </div>
            </div>
            
            <div class="h-8 w-px bg-surface-300 dark:bg-surface-600"></div>
            
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                {{ quickStatsDisplay.activities }}
              </div>
              <div class="text-xs text-surface-600 dark:text-surface-300 font-medium">
                Activities
              </div>
            </div>
            
            <div class="h-8 w-px bg-surface-300 dark:bg-surface-600"></div>
            
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {{ quickStatsDisplay.aiTasks }}
              </div>
              <div class="text-xs text-surface-600 dark:text-surface-300 font-medium">
                AI Tasks
              </div>
            </div>
            
            <div class="h-8 w-px bg-surface-300 dark:bg-surface-600"></div>
            
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {{ quickStatsDisplay.activeEngineers }}
              </div>
              <div class="text-xs text-surface-600 dark:text-surface-300 font-medium">
                Active Engineers
              </div>
            </div>
          </div>
        </div>
        
        <!-- Expand/Collapse Controls -->
        <div class="flex items-center gap-3">
          <div class="text-sm text-surface-600 dark:text-surface-300">
            {{ currentPeriodLabel }}
          </div>
          <Button 
            :icon="showDetailedStats ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
            @click="showDetailedStats = !showDetailedStats"
            severity="secondary"
            variant="text"
            size="small"
            v-tooltip="showDetailedStats ? 'Hide detailed statistics' : 'Show detailed statistics'"
          />
        </div>
      </div>
      
      <!-- Expanded Detailed Statistics -->
      <div v-if="showDetailedStats" class="p-6 bg-surface-50 dark:bg-surface-800">
        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          
          <!-- Event Type Distribution -->
          <Card class="shadow-sm border-0">
            <template #title>
              <div class="flex items-center gap-2 text-lg font-semibold">
                <i class="pi pi-chart-pie text-primary-600"></i>
                Event Distribution
              </div>
            </template>
            <template #content>
              <div class="space-y-3">
                <div 
                  v-for="(stat, type) in eventTypeBreakdown" 
                  :key="type"
                  class="flex items-center justify-between p-2 rounded-lg bg-surface-0 dark:bg-surface-700"
                >
                  <div class="flex items-center gap-2">
                    <div 
                      class="w-3 h-3 rounded"
                      :style="{ backgroundColor: getEventTypeColor(type) }"
                    ></div>
                    <span class="text-sm font-medium">{{ getEventTypeLabel(type) }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-lg font-bold text-surface-900 dark:text-surface-0">
                      {{ stat.count }}
                    </span>
                    <span class="text-xs text-surface-500 bg-surface-100 dark:bg-surface-600 px-2 py-1 rounded">
                      {{ stat.percentage }}%
                    </span>
                  </div>
                </div>
              </div>
            </template>
          </Card>
          
          <!-- Engineer Workload -->
          <Card class="shadow-sm border-0">
            <template #title>
              <div class="flex items-center gap-2 text-lg font-semibold">
                <i class="pi pi-users text-blue-600"></i>
                Engineer Workload
              </div>
            </template>
            <template #content>
              <div class="space-y-3">
                <div 
                  v-for="engineer in engineerWorkloadDisplay" 
                  :key="engineer.name"
                  class="space-y-2"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <Avatar 
                        :label="engineer.initials" 
                        size="small" 
                        shape="circle"
                        :style="{ backgroundColor: engineer.color, color: 'white' }"
                      />
                      <span class="text-sm font-medium">{{ engineer.name }}</span>
                    </div>
                    <div class="text-right">
                      <div class="text-lg font-bold">{{ engineer.eventCount }}</div>
                      <div class="text-xs text-surface-500">{{ engineer.totalHours }}h</div>
                    </div>
                  </div>
                  <div class="w-full bg-surface-200 dark:bg-surface-600 rounded-full h-2">
                    <div 
                      class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      :style="{ width: `${engineer.workloadPercentage}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </template>
          </Card>
          
          <!-- Time Distribution & Peak Hours -->
          <Card class="shadow-sm border-0">
            <template #title>
              <div class="flex items-center gap-2 text-lg font-semibold">
                <i class="pi pi-clock text-orange-600"></i>
                Time Analysis
              </div>
            </template>
            <template #content>
              <div class="space-y-4">
                <!-- Peak Hours -->
                <div class="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                  <div class="text-sm font-medium text-orange-800 dark:text-orange-200 mb-1">
                    Peak Activity Hours
                  </div>
                  <div class="text-xl font-bold text-orange-600 dark:text-orange-400">
                    {{ peakHoursDisplay }}
                  </div>
                </div>
                
                <!-- Daily Distribution -->
                <div class="space-y-2">
                  <div class="text-sm font-medium text-surface-900 dark:text-surface-0 mb-2">
                    Daily Distribution
                  </div>
                  <div 
                    v-for="day in dailyDistribution" 
                    :key="day.name"
                    class="flex items-center justify-between"
                  >
                    <span class="text-sm text-surface-600 dark:text-surface-300">{{ day.name }}</span>
                    <div class="flex items-center gap-2">
                      <div class="w-20 bg-surface-200 dark:bg-surface-600 rounded-full h-1.5">
                        <div 
                          class="bg-gradient-to-r from-blue-500 to-purple-600 h-1.5 rounded-full"
                          :style="{ width: `${day.percentage}%` }"
                        ></div>
                      </div>
                      <span class="text-sm font-medium w-8 text-right">{{ day.count }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- Maintenance Windows -->
                <div v-if="maintenanceWindowsCount > 0" class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <div class="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                    Maintenance Windows
                  </div>
                  <div class="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                    {{ maintenanceWindowsCount }} Scheduled
                  </div>
                </div>
              </div>
            </template>
          </Card>
          
          <!-- Priority Distribution (spans full width on large screens) -->
          <Card class="xl:col-span-3 shadow-sm border-0">
            <template #title>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-lg font-semibold">
                  <i class="pi pi-exclamation-triangle text-red-600"></i>
                  Priority & Risk Analysis
                </div>
                <div class="flex items-center gap-2">
                  <span 
                    v-if="criticalEventsCount > 0"
                    class="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-full"
                  >
                    {{ criticalEventsCount }} Critical
                  </span>
                  <span 
                    v-if="overdueTicketsCount > 0"
                    class="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 rounded-full"
                  >
                    {{ overdueTicketsCount }} Overdue
                  </span>
                </div>
              </div>
            </template>
            <template #content>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  v-for="priority in priorityBreakdown" 
                  :key="priority.level"
                  class="text-center p-4 rounded-lg"
                  :class="priority.bgClass"
                >
                  <div class="text-3xl font-bold" :class="priority.textClass">
                    {{ priority.count }}
                  </div>
                  <div class="text-sm font-medium text-surface-600 dark:text-surface-300 mt-1">
                    {{ priority.level }} Priority
                  </div>
                  <div class="text-xs text-surface-500 mt-1">
                    {{ priority.percentage }}% of total
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>
        
        <!-- Statistics Footer with Actions -->
        <div class="flex items-center justify-between mt-6 pt-4 border-t border-surface-200 dark:border-surface-600">
          <div class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300">
            <i class="pi pi-info-circle"></i>
            <span>Statistics updated {{ lastStatsUpdate }}</span>
          </div>
          <div class="flex items-center gap-2">
            <Button 
              label="Export Data"
              icon="pi pi-download"
              size="small"
              severity="secondary"
              variant="outlined"
              @click="exportStatistics"
            />
            <Button 
              label="Refresh"
              icon="pi pi-refresh"
              size="small"
              severity="secondary"
              variant="outlined"
              @click="refreshStatistics"
              :loading="isRefreshingStats"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Engineering Categories Legend -->
    <div class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg mt-4">
      <h3 class="font-semibold text-sm mb-3 text-surface-900 dark:text-surface-0">Engineering Activity Categories</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div 
          v-for="(category, key) in engineeringEventTypes" 
          :key="key"
          class="flex items-center gap-2"
        >
          <div 
            class="w-3 h-3 rounded flex-shrink-0"
            :style="{ backgroundColor: category.color }"
          ></div>
          <div class="flex items-center gap-1 min-w-0">
            <i :class="category.icon" class="text-xs flex-shrink-0"></i>
            <span class="text-xs text-surface-600 dark:text-surface-300 truncate">
              {{ category.label }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- Priority Legend -->
      <div class="pt-3 border-t border-surface-200 dark:border-surface-700">
        <h4 class="font-medium text-xs mb-2 text-surface-900 dark:text-surface-0">Priority Levels</h4>
        <div class="flex flex-wrap gap-3">
          <div 
            v-for="priority in priorityOptions" 
            :key="priority.value"
            class="flex items-center gap-1"
          >
            <div 
              class="w-2 h-2 rounded-full"
              :style="{ backgroundColor: priority.color }"
            ></div>
            <span class="text-xs text-surface-600 dark:text-surface-300">
              {{ priority.label }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Activity Dialog -->
    <Dialog 
      v-model:visible="showAddActivityDialog" 
      :style="{ width: '600px' }" 
      modal 
      header="Add New Activity"
      :closable="true"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-1 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Activity Title</label>
            <InputText v-model="newActivity.title" class="w-full" placeholder="Enter activity title" />
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Activity Category</label>
            <Select 
              v-model="newActivity.type" 
              :options="activityTypeOptions" 
              optionLabel="label" 
              optionValue="value"
              class="w-full"
              @change="newActivity.subcategory = ''"
            >
              <template #option="{ option }">
                <div class="flex items-center gap-2">
                  <i :class="option.icon" :style="{ color: option.color }"></i>
                  <span>{{ option.label }}</span>
                </div>
              </template>
            </Select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Subcategory</label>
            <Select 
              v-model="newActivity.subcategory" 
              :options="subcategoryOptions" 
              optionLabel="label" 
              optionValue="value"
              class="w-full"
              placeholder="Select subcategory..."
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Priority</label>
            <Select 
              v-model="newActivity.priority" 
              :options="priorityOptions" 
              optionLabel="label" 
              optionValue="value"
              class="w-full"
            >
              <template #option="{ option }">
                <div class="flex items-center gap-2">
                  <div 
                    class="w-3 h-3 rounded-full"
                    :style="{ backgroundColor: option.color }"
                  ></div>
                  <span>{{ option.label }}</span>
                </div>
              </template>
            </Select>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Start Date & Time</label>
            <DatePicker 
              v-model="newActivity.startTime" 
              showTime 
              hourFormat="12"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">End Date & Time</label>
            <DatePicker 
              v-model="newActivity.endTime" 
              showTime 
              hourFormat="12"
              class="w-full"
            />
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Impact Level</label>
            <Select 
              v-model="newActivity.impact" 
              :options="impactOptions" 
              optionLabel="label" 
              optionValue="value"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Estimated Hours</label>
            <InputNumber 
              v-model="newActivity.estimatedHours" 
              :min="0.25" 
              :max="24" 
              :step="0.25"
              suffix=" hrs"
              class="w-full"
            />
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Assigned Engineer</label>
            <Select 
              v-model="newActivity.engineerId" 
              :options="engineerOptions.filter(e => e.value !== 'all')" 
              optionLabel="label" 
              optionValue="value"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Related Ticket</label>
            <Select 
              v-model="newActivity.ticketId" 
              :options="ticketOptions" 
              optionLabel="label" 
              optionValue="value"
              placeholder="Select a ticket..."
              class="w-full"
              filter
              filterPlaceholder="Search tickets..."
              showClear
              :pt="{
                root: { class: 'h-11' },
                input: { class: 'h-11 flex items-center' },
                filterContainer: { class: 'p-3 border-b border-surface-200' },
                filterInput: { class: 'w-full p-2 border border-surface-300 rounded-md text-sm' },
                list: { class: 'max-h-60 overflow-auto' },
                item: { class: 'p-3 hover:bg-surface-100 cursor-pointer border-b border-surface-100 last:border-b-0' }
              }"
            >
              <template #option="{ option }">
                <div v-if="option.value" class="flex flex-col gap-1 py-1">
                  <div class="flex items-center justify-between">
                    <span class="font-medium text-sm">{{ option.ticket_number }}</span>
                    <div class="flex gap-2">
                      <span 
                        class="px-2 py-1 text-xs rounded-full"
                        :class="{
                          'bg-green-100 text-green-800': option.status === 'Open',
                          'bg-yellow-100 text-yellow-800': option.status === 'Pending',
                          'bg-blue-100 text-blue-800': option.status === 'In Progress',
                          'bg-gray-100 text-gray-800': !['Open', 'Pending', 'In Progress'].includes(option.status)
                        }"
                      >
                        {{ option.status }}
                      </span>
                      <span 
                        class="px-2 py-1 text-xs rounded-full"
                        :class="{
                          'bg-red-100 text-red-800': option.priority === 'High' || option.priority === 'Critical',
                          'bg-orange-100 text-orange-800': option.priority === 'Normal',
                          'bg-gray-100 text-gray-800': option.priority === 'Low'
                        }"
                      >
                        {{ option.priority }}
                      </span>
                    </div>
                  </div>
                  <span class="text-sm text-surface-600 truncate">{{ option.subject }}</span>
                </div>
                <div v-else class="py-2 text-sm text-surface-500 italic">
                  {{ option.label }}
                </div>
              </template>
            </Select>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-center gap-3">
            <Checkbox 
              v-model="newActivity.maintenanceWindow" 
              inputId="maintenanceWindow" 
              binary 
            />
            <label for="maintenanceWindow" class="text-sm font-medium">
              Requires Maintenance Window
            </label>
          </div>
          <div class="flex items-center gap-3">
            <Checkbox 
              v-model="newActivity.customerFacing" 
              inputId="customerFacing" 
              binary 
            />
            <label for="customerFacing" class="text-sm font-medium">
              Customer-Facing Activity
            </label>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">Description</label>
          <Textarea v-model="newActivity.description" rows="3" class="w-full" />
        </div>
      </div>
      
      <template #footer>
        <Button label="Cancel" @click="showAddActivityDialog = false" text />
        <Button 
          label="Create Activity" 
          @click="createActivity" 
          :loading="isCreatingActivity"
          icon="pi pi-check"
        />
      </template>
    </Dialog>

    <!-- Edit Activity Dialog -->
    <Dialog 
      v-model:visible="showEditActivityDialog" 
      :style="{ width: '600px' }" 
      modal 
      header="Edit Activity"
      :closable="true"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-1 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Activity Title</label>
            <InputText v-model="editActivity.title" class="w-full" placeholder="Enter activity title" />
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Activity Category</label>
            <Select 
              v-model="editActivity.type" 
              :options="activityTypeOptions" 
              optionLabel="label" 
              optionValue="value"
              class="w-full"
              @change="editActivity.subcategory = ''"
            >
              <template #option="{ option }">
                <div class="flex items-center gap-2">
                  <i :class="option.icon" :style="{ color: option.color }"></i>
                  <span>{{ option.label }}</span>
                </div>
              </template>
            </Select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Subcategory</label>
            <Select 
              v-model="editActivity.subcategory" 
              :options="subcategoryOptions" 
              optionLabel="label" 
              optionValue="value"
              class="w-full"
              placeholder="Select subcategory..."
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Priority</label>
            <Select 
              v-model="editActivity.priority" 
              :options="priorityOptions" 
              optionLabel="label" 
              optionValue="value"
              class="w-full"
            >
              <template #option="{ option }">
                <div class="flex items-center gap-2">
                  <div 
                    class="w-3 h-3 rounded-full"
                    :style="{ backgroundColor: option.color }"
                  ></div>
                  <span>{{ option.label }}</span>
                </div>
              </template>
            </Select>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Start Date & Time</label>
            <DatePicker 
              v-model="editActivity.startTime" 
              showTime 
              hourFormat="12"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">End Date & Time</label>
            <DatePicker 
              v-model="editActivity.endTime" 
              showTime 
              hourFormat="12"
              class="w-full"
            />
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Impact Level</label>
            <Select 
              v-model="editActivity.impact" 
              :options="impactOptions" 
              optionLabel="label" 
              optionValue="value"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Estimated Hours</label>
            <InputNumber 
              v-model="editActivity.estimatedHours" 
              :min="0.25" 
              :max="24" 
              :step="0.25"
              suffix=" hrs"
              class="w-full"
            />
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Assigned Engineer</label>
            <Select 
              v-model="editActivity.engineerId" 
              :options="engineerOptions.filter(e => e.value !== 'all')" 
              optionLabel="label" 
              optionValue="value"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Related Ticket</label>
            <Select 
              v-model="editActivity.ticketId" 
              :options="ticketOptions" 
              optionLabel="label" 
              optionValue="value"
              placeholder="Select a ticket..."
              class="w-full"
              filter
              filterPlaceholder="Search tickets..."
              showClear
              :pt="{
                root: { class: 'h-11' },
                input: { class: 'h-11 flex items-center' },
                filterContainer: { class: 'p-3 border-b border-surface-200' },
                filterInput: { class: 'w-full p-2 border border-surface-300 rounded-md text-sm' },
                list: { class: 'max-h-60 overflow-auto' },
                item: { class: 'p-3 hover:bg-surface-100 cursor-pointer border-b border-surface-100 last:border-b-0' }
              }"
            >
              <template #option="{ option }">
                <div v-if="option.value" class="flex flex-col gap-1 py-1">
                  <div class="flex items-center justify-between">
                    <span class="font-medium text-sm">{{ option.ticket_number }}</span>
                    <div class="flex gap-2">
                      <span 
                        class="px-2 py-1 text-xs rounded-full"
                        :class="{
                          'bg-green-100 text-green-800': option.status === 'Open',
                          'bg-yellow-100 text-yellow-800': option.status === 'Pending',
                          'bg-blue-100 text-blue-800': option.status === 'In Progress',
                          'bg-gray-100 text-gray-800': !['Open', 'Pending', 'In Progress'].includes(option.status)
                        }"
                      >
                        {{ option.status }}
                      </span>
                      <span 
                        class="px-2 py-1 text-xs rounded-full"
                        :class="{
                          'bg-red-100 text-red-800': option.priority === 'High' || option.priority === 'Critical',
                          'bg-orange-100 text-orange-800': option.priority === 'Normal',
                          'bg-gray-100 text-gray-800': option.priority === 'Low'
                        }"
                      >
                        {{ option.priority }}
                      </span>
                    </div>
                  </div>
                  <span class="text-sm text-surface-600 truncate">{{ option.subject }}</span>
                </div>
                <div v-else class="py-2 text-sm text-surface-500 italic">
                  {{ option.label }}
                </div>
              </template>
            </Select>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-center gap-3">
            <Checkbox 
              v-model="editActivity.maintenanceWindow" 
              inputId="editMaintenanceWindow" 
              binary 
            />
            <label for="editMaintenanceWindow" class="text-sm font-medium">
              Requires Maintenance Window
            </label>
          </div>
          <div class="flex items-center gap-3">
            <Checkbox 
              v-model="editActivity.customerFacing" 
              inputId="editCustomerFacing" 
              binary 
            />
            <label for="editCustomerFacing" class="text-sm font-medium">
              Customer-Facing Activity
            </label>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">Description</label>
          <Textarea v-model="editActivity.description" rows="3" class="w-full" />
        </div>
      </div>
      
      <template #footer>
        <Button label="Cancel" @click="showEditActivityDialog = false" text />
        <Button 
          label="Update Activity" 
          @click="updateActivity" 
          :loading="isUpdatingActivity"
          icon="pi pi-check"
        />
      </template>
    </Dialog>

    <!-- Event Details Dialog -->
    <Dialog 
      v-model:visible="showEventDialog" 
      :style="{ width: '600px' }" 
      modal 
      :header="selectedEvent?.EventType === 'ticket_due' ? selectedEvent?.TicketNumber || 'Ticket Details' : selectedEvent?.Subject || 'Event Details'"
      :closable="true"
    >
      <div v-if="selectedEvent" class="space-y-4">
        <!-- Ticket Event Display -->
        <div v-if="selectedEvent.EventType === 'ticket_due'" class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div 
                class="w-4 h-4 rounded"
                :style="{ backgroundColor: selectedEvent.CategoryColor }"
              ></div>
              <span class="font-medium text-orange-600">{{ selectedEvent.Category || 'Overdue' }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span 
                class="px-2 py-1 text-xs rounded-full font-medium bg-blue-100 text-blue-800"
              >
                {{ selectedEvent.Priority?.charAt(0).toUpperCase() + selectedEvent.Priority?.slice(1) || 'Normal' }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4">
            <div class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg">
              <div class="space-y-3">
                <div>
                  <span class="font-medium text-sm text-surface-900 dark:text-surface-0">Ticket ID:</span>
                  <span class="ml-2 text-surface-700 dark:text-surface-200">{{ selectedEvent.TicketId }}</span>
                </div>
                <div>
                  <span class="font-medium text-sm text-surface-900 dark:text-surface-0">Customer:</span>
                  <span class="ml-2 text-surface-700 dark:text-surface-200">{{ selectedEvent.Customer || 'Unassigned' }}</span>
                </div>
                <div>
                  <span class="font-medium text-sm text-surface-900 dark:text-surface-0">Engineer:</span>
                  <span class="ml-2 text-surface-700 dark:text-surface-200">{{ selectedEvent.Owner || selectedEvent.EngineerName || 'Unassigned' }}</span>
                </div>
                <div>
                  <span class="font-medium text-sm text-surface-900 dark:text-surface-0">Subject:</span>
                  <span class="ml-2 text-surface-700 dark:text-surface-200">{{ selectedEvent.TicketSubject || selectedEvent.Subject }}</span>
                </div>
                <div>
                  <span class="font-medium text-sm text-surface-900 dark:text-surface-0">Last Update:</span>
                  <span class="ml-2 text-surface-700 dark:text-surface-200">{{ selectedEvent.LastActivity ? formatDateTime(new Date(selectedEvent.LastActivity)) : 'No recent activity' }}</span>
                </div>
                <div>
                  <span class="font-medium text-sm text-surface-900 dark:text-surface-0">Ticket Due:</span>
                  <span class="ml-2 text-surface-700 dark:text-surface-200">{{ selectedEvent.DueDate ? formatDateTime(new Date(selectedEvent.DueDate)) : 'No due date set' }}</span>
                </div>
              </div>
            </div>

            <div v-if="selectedEvent.ReasonForTicket" class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg">
              <h4 class="font-medium text-sm text-surface-900 dark:text-surface-0 mb-2">Reason for Ticket:</h4>
              <p class="text-surface-700 dark:text-surface-200 text-sm leading-relaxed">{{ selectedEvent.ReasonForTicket }}</p>
            </div>
          </div>
        </div>

        <!-- AI Task Display -->
        <div v-else-if="selectedEvent.EventType === 'ai-task'" class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-4 h-4 rounded bg-purple-600"></div>
              <span class="font-medium text-purple-600">AI-Generated Task</span>
            </div>
            <div class="flex items-center gap-2">
              <span 
                class="px-2 py-1 text-xs rounded-full font-medium"
                :class="{
                  'bg-red-100 text-red-800': selectedEvent.PriorityLevel === 'high',
                  'bg-yellow-100 text-yellow-800': selectedEvent.PriorityLevel === 'medium',
                  'bg-green-100 text-green-800': selectedEvent.PriorityLevel === 'low'
                }"
              >
                {{ selectedEvent.PriorityLevel?.charAt(0).toUpperCase() + selectedEvent.PriorityLevel?.slice(1) || 'Medium' }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4">
            <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div class="space-y-3">
                <div>
                  <span class="font-medium text-sm text-surface-900 dark:text-surface-0">Task Title:</span>
                  <span class="ml-2 text-surface-700 dark:text-surface-200">{{ selectedEvent.TaskTitle || selectedEvent.Subject }}</span>
                </div>
                <div>
                  <span class="font-medium text-sm text-surface-900 dark:text-surface-0">Assigned Engineer:</span>
                  <span class="ml-2 text-surface-700 dark:text-surface-200">{{ selectedEvent.AssignedTo || selectedEvent.EngineerName || 'Unassigned' }}</span>
                </div>
                <div v-if="selectedEvent.EstimatedDurationMinutes">
                  <span class="font-medium text-sm text-surface-900 dark:text-surface-0">Estimated Duration:</span>
                  <span class="ml-2 text-surface-700 dark:text-surface-200">{{ Math.round(selectedEvent.EstimatedDurationMinutes / 60 * 100) / 100 }} hours</span>
                </div>
                <div v-if="selectedEvent.GeneratedAt">
                  <span class="font-medium text-sm text-surface-900 dark:text-surface-0">Generated:</span>
                  <span class="ml-2 text-surface-700 dark:text-surface-200">{{ formatDateTime(new Date(selectedEvent.GeneratedAt)) }}</span>
                </div>
              </div>
            </div>

            <div v-if="selectedEvent.TaskDescription" class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg">
              <h4 class="font-medium text-sm text-surface-900 dark:text-surface-0 mb-2">Task Description:</h4>
              <p class="text-surface-700 dark:text-surface-200 text-sm leading-relaxed">{{ selectedEvent.TaskDescription }}</p>
            </div>
          </div>
        </div>

        <!-- Regular Event Display -->
        <div v-else class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div 
              class="w-4 h-4 rounded"
              :style="{ backgroundColor: selectedEvent.CategoryColor }"
            ></div>
            <span class="font-medium">{{ engineeringEventTypes[selectedEvent.Category]?.label || selectedEvent.Category }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span 
              class="px-2 py-1 text-xs rounded-full font-medium"
              :class="{
                'bg-red-100 text-red-800': selectedEvent.Priority === 'emergency' || selectedEvent.Priority === 'critical',
                'bg-orange-100 text-orange-800': selectedEvent.Priority === 'high',
                'bg-blue-100 text-blue-800': selectedEvent.Priority === 'normal',
                'bg-gray-100 text-gray-800': selectedEvent.Priority === 'low'
              }"
            >
              {{ selectedEvent.Priority?.charAt(0).toUpperCase() + selectedEvent.Priority?.slice(1) || 'Normal' }}
            </span>
          </div>
        </div>

        <div v-if="selectedEvent.Subcategory" class="bg-surface-50 dark:bg-surface-800 p-3 rounded-lg">
          <h4 class="font-medium mb-1 text-sm">Activity Type</h4>
          <p class="text-surface-600 dark:text-surface-300 text-sm">{{ selectedEvent.Subcategory }}</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 class="font-medium mb-2">Time</h4>
            <p class="text-surface-600 dark:text-surface-300">
              {{ formatEventTime(selectedEvent.StartTime, selectedEvent.EndTime) }}
            </p>
          </div>
          <div v-if="selectedEvent.EstimatedHours">
            <h4 class="font-medium mb-2">Estimated Duration</h4>
            <p class="text-surface-600 dark:text-surface-300">
              {{ selectedEvent.EstimatedHours }} hours
            </p>
          </div>
        </div>

        <div v-if="selectedEvent.Impact" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 class="font-medium mb-2">Impact Level</h4>
            <span 
              class="inline-flex px-2 py-1 text-xs rounded-full font-medium"
              :class="{
                'bg-red-100 text-red-800': selectedEvent.Impact === 'company-wide',
                'bg-orange-100 text-orange-800': selectedEvent.Impact === 'multiple-customers',
                'bg-yellow-100 text-yellow-800': selectedEvent.Impact === 'single-customer',
                'bg-green-100 text-green-800': selectedEvent.Impact === 'internal'
              }"
            >
              {{ selectedEvent.Impact?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) }}
            </span>
          </div>
          <div v-if="selectedEvent.MaintenanceWindow || selectedEvent.CustomerFacing" class="flex flex-col gap-2">
            <div v-if="selectedEvent.MaintenanceWindow" class="flex items-center gap-2">
              <i class="pi pi-clock text-orange-500"></i>
              <span class="text-sm text-surface-600 dark:text-surface-300">Maintenance Window Required</span>
            </div>
            <div v-if="selectedEvent.CustomerFacing" class="flex items-center gap-2">
              <i class="pi pi-users text-blue-500"></i>
              <span class="text-sm text-surface-600 dark:text-surface-300">Customer-Facing Activity</span>
            </div>
          </div>
        </div>
        
        <div v-if="selectedEvent.EngineerName">
          <h4 class="font-medium mb-2">Assigned Engineer</h4>
          <p class="text-surface-600 dark:text-surface-300">{{ selectedEvent.EngineerName }}</p>
        </div>
        
        <div v-if="selectedEvent.TicketNumber">
          <h4 class="font-medium mb-2">Related Ticket</h4>
          <div class="flex items-center gap-2">
            <span class="text-surface-600 dark:text-surface-300">#{{ selectedEvent.TicketNumber }}</span>
            <Button 
              label="View Ticket" 
              icon="pi pi-external-link"
              text
              size="small"
              @click="viewTicket(selectedEvent.TicketId)"
            />
          </div>
        </div>
        
        <div v-if="selectedEvent.Description">
          <h4 class="font-medium mb-2">Description</h4>
          <p class="text-surface-600 dark:text-surface-300">{{ selectedEvent.Description }}</p>
        </div>
        </div>
      </div>
      
      <template #footer>
        <Button 
          v-if="selectedEvent?.EventType === 'ticket_due' && selectedEvent?.TicketId" 
          label="View Ticket" 
          @click="viewTicket(selectedEvent.TicketId)" 
          outlined 
          icon="pi pi-external-link"
        />
        <Button 
          v-if="selectedEvent?.IsEditable" 
          label="Edit" 
          @click="editEvent" 
          icon="pi pi-pencil"
        />
        <Button label="Close" @click="showEventDialog = false" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, provide } from 'vue'
import { useRouter } from 'vue-router'
import { useEngineeringStore } from '@/stores/engineeringStore'
import { useToast } from 'primevue/usetoast'
import { 
  ScheduleComponent as EjsSchedule,
  ViewsDirective as EViews,
  ViewDirective as EView,
  Day, 
  Week, 
  WorkWeek, 
  Month, 
  Agenda, 
  TimelineViews,
  Resize, 
  DragAndDrop 
} from '@syncfusion/ej2-vue-schedule'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Checkbox from 'primevue/checkbox'
import Card from 'primevue/card'
import Avatar from 'primevue/avatar'

// Store and utilities
const router = useRouter()
const engineeringStore = useEngineeringStore()
const toast = useToast()

// Refs
const scheduleObj = ref(null)
const isLoading = ref(false)
const isCreatingActivity = ref(false)
const isUpdatingActivity = ref(false)
const showAddActivityDialog = ref(false)
const showEditActivityDialog = ref(false)
const showEventDialog = ref(false)
const selectedEvent = ref(null)

// Statistics Panel State
const showDetailedStats = ref(false)
const isRefreshingStats = ref(false)

// Calendar configuration
const selectedDate = ref(new Date())
const calendarHeight = ref('750px')
const selectedView = ref('Week')
const selectedEngineer = ref('all')

// View options
const viewOptions = ref([
  { label: 'Day', value: 'Day' },
  { label: 'Week', value: 'Week' },
  { label: 'Work Week', value: 'WorkWeek' },
  { label: 'Month', value: 'Month' },
  { label: 'Agenda', value: 'Agenda' },
  { label: 'Timeline Week', value: 'TimelineWeek' },
  { label: 'Timeline Month', value: 'TimelineMonth' }
])

// Schedule views
const scheduleViews = ref(['Day', 'Week', 'WorkWeek', 'Month', 'Agenda', 'TimelineWeek', 'TimelineMonth'])
const currentView = ref('Week')

// Work hours configuration
const workHours = ref({
  highlight: true,
  start: '08:00',
  end: '18:00'
})

// Time scale configuration
const timeScale = ref({
  enable: true,
  interval: 60,
  slotCount: 2,
  template: '${majorSlot(date)}'
})

// New activity form
const newActivity = ref({
  title: '',
  type: 'maintenance',
  subcategory: '',
  priority: 'normal',
  impact: 'internal',
  startTime: new Date(),
  endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours later
  engineerId: null,
  ticketId: null,
  description: '',
  estimatedHours: 1,
  maintenanceWindow: false,
  customerFacing: false
})

// Edit activity form
const editActivity = ref({
  id: null,
  title: '',
  type: 'maintenance',
  subcategory: '',
  priority: 'normal',
  impact: 'internal',
  startTime: new Date(),
  endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours later
  engineerId: null,
  ticketId: null,
  description: '',
  estimatedHours: 1,
  maintenanceWindow: false,
  customerFacing: false
})

// Get subcategories for selected type
const subcategoryOptions = computed(() => {
  const activityType = newActivity.value.type || editActivity.value.type
  if (!activityType || !engineeringEventTypes.value[activityType]) {
    return []
  }
  return engineeringEventTypes.value[activityType].subcategories.map(sub => ({
    label: sub,
    value: sub
  }))
})

// Engineering event types with hierarchical structure
const engineeringEventTypes = ref({
  'maintenance': {
    label: 'Engineering Maintenance',
    color: '#f59e0b',
    icon: 'pi pi-cog',
    subcategories: [
      'Planned Maintenance',
      'Emergency Maintenance', 
      'Firmware/Software Upgrades',
      'Configuration Changes',
      'Patching & Updates',
      'Disaster Recovery Testing'
    ]
  },
  'ticket-work': {
    label: 'Ticket Tasks',
    color: '#ef4444',
    icon: 'pi pi-ticket',
    subcategories: [
      'Troubleshooting',
      'Incident Follow-up',
      'Post-Incident Reviews (RCA)',
      'Customer Support',
      'Other'
    ]
  },
  'deployment': {
    label: 'Deployments',
    color: '#10b981',
    icon: 'pi pi-upload',
    subcategories: [
      'Turn Up',
      'Provisioning & Staging',
      'Go-Live Activities',
      'Rollback Procedures'
    ]
  },
  'customer': {
    label: 'Customer Activities',
    color: '#3b82f6',
    icon: 'pi pi-users',
    subcategories: [
      'Customer Work Sessions',
      'Vendor / SWAT',
      'Customer Meetings (QBR)',
      'Site Visits',
      'Training Delivery'
    ]
  },
  'planning': {
    label: 'Documentation & Planning',
    color: '#8b5cf6',
    icon: 'pi pi-file-edit',
    subcategories: [
      'Documentation Sessions',
      'Engineering Planning',
      'Architecture Reviews',
      'Project Planning'
    ]
  },
  'development': {
    label: 'Training & Development',
    color: '#06b6d4',
    icon: 'pi pi-graduation-cap',
    subcategories: [
      'Internal Training',
      'Skill Development',
      'Certification Study',
      'Knowledge Transfer'
    ]
  },
  'monitoring': {
    label: 'Monitoring & Analysis',
    color: '#84cc16',
    icon: 'pi pi-chart-line',
    subcategories: [
      'Network Health Checks',
      'Performance Analysis',
      'Alert & Monitoring Tuning',
      'Capacity Planning'
    ]
  },
  'administrative': {
    label: 'General & Administrative',
    color: '#6b7280',
    icon: 'pi pi-calendar',
    subcategories: [
      'Out-of-Office / PTO',
      'On-Call Schedules',
      'Company-wide Meetings',
      'Administrative Tasks',
      'Team Meetings'
    ]
  },
  'ai-task': {
    label: 'AI-Generated Tasks',
    color: '#8b5cf6',
    icon: 'pi pi-sparkles',
    subcategories: [
      'Maintenance Tasks',
      'Performance Optimization',
      'Security Updates',
      'Documentation Updates',
      'Code Review',
      'Infrastructure Monitoring'
    ]
  }
})

// Flatten for dropdown options
const activityTypeOptions = computed(() => {
  return Object.entries(engineeringEventTypes.value).map(([key, type]) => ({
    label: type.label,
    value: key,
    color: type.color,
    icon: type.icon
  }))
})

// Priority options
const priorityOptions = ref([
  { label: 'Low', value: 'low', color: '#6b7280' },
  { label: 'Normal', value: 'normal', color: '#3b82f6' },
  { label: 'High', value: 'high', color: '#f59e0b' },
  { label: 'Critical', value: 'critical', color: '#ef4444' },
  { label: 'Emergency', value: 'emergency', color: '#dc2626' }
])

// Impact options
const impactOptions = ref([
  { label: 'Internal Only', value: 'internal' },
  { label: 'Single Customer', value: 'single-customer' },
  { label: 'Multiple Customers', value: 'multiple-customers' },
  { label: 'Company-wide', value: 'company-wide' }
])

// Engineer options
const engineerOptions = computed(() => {
  const engineers = [{ label: 'All Engineers', value: 'all' }]
  
  // Use calendar engineers from backend if available
  if (engineeringStore.calendarEngineers && Array.isArray(engineeringStore.calendarEngineers) && engineeringStore.calendarEngineers.length > 0) {
    engineers.push(...engineeringStore.calendarEngineers.map(engineer => ({
      label: engineer.name,
      value: engineer.name
    })))
  } else if (engineeringStore.ownerBreakdown && Array.isArray(engineeringStore.ownerBreakdown)) {
    // Fallback to owner breakdown
    engineers.push(...engineeringStore.ownerBreakdown.map(owner => ({
      label: owner.name || 'Unassigned',
      value: owner.name || 'unassigned'
    })))
  } else {
    // Default engineers if no data available
    engineers.push(
      { label: 'Anthony Raia', value: 'Anthony Raia' },
      { label: 'Sarah Chen', value: 'Sarah Chen' },
      { label: 'David Kim', value: 'David Kim' },
      { label: 'Mike Johnson', value: 'Mike Johnson' },
      { label: 'Unassigned', value: 'unassigned' }
    )
  }
  
  return engineers
})

// Ticket options for activity creation
const ticketOptions = computed(() => {
  // Use calendar tickets from backend if available
  if (engineeringStore.calendarTickets && Array.isArray(engineeringStore.calendarTickets) && engineeringStore.calendarTickets.length > 0) {
    return [
      { label: 'Select a ticket...', value: null },
      ...engineeringStore.calendarTickets.map(ticket => ({
        label: ticket.display_text || `#${ticket.ticket_number} - ${ticket.subject}`,
        value: ticket.ticket_id,
        ticket_number: ticket.ticket_number,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority
      }))
    ]
  } else if (engineeringStore.tickets && Array.isArray(engineeringStore.tickets)) {
    // Fallback to regular tickets
    const filteredTickets = engineeringStore.tickets
      .filter(ticket => ticket.status !== 'closed' && ticket.status !== 'Closed')
      .map(ticket => ({
        label: `#${ticket.number || ticket.ticketid} - ${ticket.subject}`,
        value: ticket.id || ticket.ticketid,
        ticket_number: ticket.number || ticket.ticketid,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority
      }))
    
    return [
      { label: 'Select a ticket...', value: null },
      ...filteredTickets
    ]
  }
  
  return [{ label: 'No tickets available', value: null }]
})

// Calendar events data source

// Lifecycle
onMounted(async () => {
  await refreshCalendar()
  
  // Debug: Log ticket data after loading
  setTimeout(() => {
    console.log('Calendar Tickets:', engineeringStore.calendarTickets)
    console.log('Ticket Options:', ticketOptions.value)
  }, 1000)
})
const eventSettings = computed(() => ({
  dataSource: calendarEvents.value,
  fields: {
    id: 'Id',
    subject: { name: 'Subject' },
    startTime: { name: 'StartTime' },
    endTime: { name: 'EndTime' },
    categoryColor: { name: 'CategoryColor' },
    description: { name: 'Description' }
  },
  enableMaxHeight: true,
  ignoreWhitespace: false,
  enableTooltip: false, // We handle our own custom tooltips
  spannedEventPlacement: 'TimeSlot' // Ensures proper spacing for overlapping events
}))

// Get calendar events from store (includes both real events and ticket deadlines)
const calendarEvents = computed(() => {
  // Ensure we have an array to work with
  const storeEvents = engineeringStore.calendarEvents || []
  
  // DEBUG: Log the raw events from store
  console.log('Raw Store Events:', storeEvents)
  
  // Extract the actual events array from the store response
  let events = []
  if (Array.isArray(storeEvents)) {
    // Store now contains just the events array
    events = [...storeEvents]
  } else if (storeEvents.data && Array.isArray(storeEvents.data)) {
    // Fallback if store still has response structure
    events = [...storeEvents.data]
  }
  
  console.log('Extracted Events Array:', events)
  console.log('Events Length:', events.length)
  
  // Filter by selected engineer if not 'all'
  if (selectedEngineer.value !== 'all') {
    events = events.filter(event => 
      event.EngineerName === selectedEngineer.value || 
      event.assigned_engineer === selectedEngineer.value ||
      event.engineer_name === selectedEngineer.value
    )
  }
  
  // Apply color coding and map to Syncfusion format
  events = events.map(event => {
    const eventType = event.event_type || event.Category || 'administrative'
    const priority = event.priority || 'normal'
    
    // Get base color from event type
    let baseColor = '#6b7280' // Default gray
    if (engineeringEventTypes.value[eventType]) {
      baseColor = engineeringEventTypes.value[eventType].color
    }
    
    // Adjust color intensity based on priority
    let finalColor = baseColor
    if (priority === 'emergency') {
      finalColor = '#dc2626' // Dark red for emergency
    } else if (priority === 'critical') {
      finalColor = '#ef4444' // Red for critical
    } else if (priority === 'high') {
      // Darken the base color for high priority
      finalColor = adjustColorBrightness(baseColor, -0.2)
    } else if (priority === 'low') {
      // Lighten the base color for low priority
      finalColor = adjustColorBrightness(baseColor, 0.3)
    }
    
    // Enhanced subject with more context
    let enhancedSubject = event.subject || event.Subject || event.title || 'Untitled Event'
    let enhancedDescription = event.description || event.Description || ''
    
    // For ticket events, enhance the display with comprehensive info
    if (event.EventType === 'ticket_due') {
      const ticketId = event.TicketId || ''
      const status = event.Status || ''
      const engineer = event.Owner || event.EngineerName || ''
      const customer = event.Customer || 'Unassigned'
      const dueDate = event.DueDate ? new Date(event.DueDate) : null
      const lastActivity = event.LastActivity ? new Date(event.LastActivity) : null
      const maintenanceWindow = event.MaintenanceWindow || false
      
      // Use the clean ticket subject (without ticket number prefix)
      const cleanSubject = event.TicketSubject || event.Subject || enhancedSubject
      
      // Add ticket icon to calendar display
      enhancedSubject = `🎫 ${cleanSubject}`
      
      // Build comprehensive description for the popup
      const descriptionParts = [
        `Ticket ID: ${ticketId}`,
        `Customer: ${customer}`,
        `Engineer: ${engineer}`,
        `Subject: ${cleanSubject}`,
        lastActivity ? `Last Update: ${formatDateTime(lastActivity)}` : '',
        dueDate ? `Ticket Due: ${formatDateTime(dueDate)}` : 'Ticket Due: No due date set',
        '',
        event.ReasonForTicket ? `Reason for Ticket:\n${event.ReasonForTicket}` : ''
      ].filter(Boolean)
      
      enhancedDescription = descriptionParts.join('\n')
    } else if (event.EventType === 'ai-task') {
      // For AI-generated tasks, show special formatting
      const engineer = event.AssignedTo || event.assigned_engineer || event.engineer_name || event.EngineerName
      const duration = event.EstimatedDurationMinutes ? Math.round(event.EstimatedDurationMinutes / 60 * 100) / 100 : event.estimated_hours
      
      // Use the AI task title directly (already has 🤖 prefix from backend)
      enhancedSubject = event.TaskTitle || event.Subject || enhancedSubject
      
      enhancedDescription = [
        event.TaskDescription || event.description || event.Description || '',
        `Type: AI-Generated Task`,
        engineer ? `Engineer: ${engineer}` : '',
        event.PriorityLevel ? `Priority: ${event.PriorityLevel}` : '',
        duration ? `Duration: ${duration}h` : '',
        event.GeneratedAt ? `Generated: ${formatDateTime(new Date(event.GeneratedAt))}` : ''
      ].filter(Boolean).join('\n')
    } else {
      // For manual events, show category and engineer
      const categoryLabel = engineeringEventTypes.value[eventType]?.label || eventType
      const engineer = event.assigned_engineer || event.engineer_name || event.EngineerName
      
      enhancedSubject = `${getEventIcon(eventType)} ${enhancedSubject}`
      
      enhancedDescription = [
        event.description || event.Description || '',
        `Type: ${categoryLabel}`,
        engineer ? `Engineer: ${engineer}` : '',
        event.subcategory ? `Category: ${event.subcategory}` : '',
        event.estimated_hours ? `Duration: ${event.estimated_hours}h` : ''
      ].filter(Boolean).join('\n')
    }

    // Map backend fields to Syncfusion expected format
    const mappedEvent = {
      // Core Syncfusion fields
      Id: event.id || event.Id,
      Subject: enhancedSubject,
      StartTime: new Date(event.start_time || event.StartTime),
      EndTime: new Date(event.end_time || event.EndTime),
      Description: enhancedDescription,
      CategoryColor: finalColor,
      IsAllDay: event.is_all_day || event.IsAllDay || false,
      Location: event.location || event.Location || '',
      
      // Additional metadata
      Category: eventType,
      Priority: priority,
      Subcategory: event.subcategory,
      Impact: event.impact,
      EstimatedHours: event.estimated_hours,
      MaintenanceWindow: event.maintenance_window,
      CustomerFacing: event.customer_facing,
      EngineerName: event.assigned_engineer || event.engineer_name || event.EngineerName,
      TicketId: event.TicketId || event.related_ticket_id || event.ticket_id,
      TicketNumber: event.TicketNumber || event.ticket_number,
      EventType: event.EventType || 'manual',
      IsEditable: event.EventType !== 'ticket_due', // Tickets are read-only
      
      // Enhanced ticket fields from backend
      Status: event.Status,
      Owner: event.Owner,
      Customer: event.Customer,
      LastActivity: event.LastActivity,
      DueDate: event.DueDate,
      ReasonForTicket: event.ReasonForTicket,
      MaintenanceWindow: event.MaintenanceWindow,
      CustomerFacing: event.CustomerFacing,
      Impact: event.Impact,
      CategoryColor: event.CategoryColor,
      
      // AI Task fields from backend
      TaskTitle: event.TaskTitle,
      TaskDescription: event.TaskDescription,
      AssignedTo: event.AssignedTo,
      PriorityLevel: event.PriorityLevel,
      EstimatedDurationMinutes: event.EstimatedDurationMinutes,
      GeneratedAt: event.GeneratedAt,
      
      // Keep original data for debugging
      _originalEvent: event
    }
    
    // DEBUG: Log the mapping for first event
    if (events.indexOf(event) === 0) {
      console.log('Event Mapping Example:')
      console.log('Original:', event)
      console.log('Mapped:', mappedEvent)
    }
    
    return mappedEvent
  })
  
  // DEBUG: Log event types breakdown
  const eventTypes = events.reduce((acc, event) => {
    const type = event.EventType || 'manual'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})
  
  console.log('Final Mapped Events for Syncfusion:', events)
  console.log('Events Count:', events.length)
  console.log('Event Types Breakdown:', eventTypes)
  console.log('Current Engineer Filter:', selectedEngineer.value)
  
  return events
})

// Helper function to adjust color brightness
const adjustColorBrightness = (color, percent) => {
  const num = parseInt(color.replace("#", ""), 16)
  const amt = Math.round(2.55 * percent * 100)
  const R = (num >> 16) + amt
  const B = (num >> 8 & 0x00FF) + amt
  const G = (num & 0x0000FF) + amt
  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (B < 255 ? B < 1 ? 0 : B : 255) * 0x100 + (G < 255 ? G < 1 ? 0 : G : 255)).toString(16).slice(1)
}

// Helper function to extract customer name from ticket subject
const extractCustomerFromSubject = (subject) => {
  if (!subject) return null
  
  // Common patterns for customer names in ticket subjects
  const patterns = [
    /^([A-Za-z\s&]+)\s*-/,  // "Customer Name - Description"
    /^([A-Za-z\s&]+)_/,     // "Customer_Name_Description"
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/  // Capitalized words
  ]
  
  for (const pattern of patterns) {
    const match = subject.match(pattern)
    if (match && match[1] && match[1].length > 2 && match[1].length < 50) {
      // Filter out common non-customer words
      const nonCustomerWords = ['Network', 'Alert', 'Site', 'Status', 'Changed', 'Down', 'Up', 'Request', 'Update']
      if (!nonCustomerWords.some(word => match[1].includes(word))) {
        return match[1].trim()
      }
    }
  }
  
  return null
}

// Helper function to get icon for event type
const getEventIcon = (eventType) => {
  const icons = {
    'maintenance': '🔧',
    'ticket-work': '🎫',
    'deployment': '🚀',
    'customer-activity': '👥',
    'documentation': '📝',
    'training': '🎓',
    'monitoring': '📊',
    'administrative': '📋',
    'ai-task': '🤖'
  }
  return icons[eventType] || '📅'
}

// Helper function to format date and time for display
const formatDateTime = (date) => {
  if (!date) return ''
  
  const now = new Date()
  const diffDays = Math.floor((date - now) / (1000 * 60 * 60 * 24))
  
  const dateStr = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
  
  let relativePart = ''
  if (diffDays === 0) {
    relativePart = ' (today)'
  } else if (diffDays === 1) {
    relativePart = ' (tomorrow)'
  } else if (diffDays === -1) {
    relativePart = ' (yesterday)'
  } else if (diffDays > 0) {
    relativePart = ` (${diffDays} days from now)`
  } else if (diffDays < 0) {
    relativePart = ` (${Math.abs(diffDays)} days ago)`
  }
  
  return `${dateStr} ${timeStr}${relativePart}`
}

// Event handlers
const onViewChange = () => {
  currentView.value = selectedView.value
}

const onEngineerChange = () => {
  // Events will be filtered automatically through computed property
}

const onEventRendered = (args) => {
  // Debug: Check if this function is being called
  console.log('onEventRendered called for:', args.data?.Subject)
  
  // Customize event appearance based on category and type
  const eventElement = args.element
  const eventData = args.data
  
  // Clear default content and create custom layout
  eventElement.innerHTML = ''
  
  // Create main container
  const container = document.createElement('div')
  container.className = 'event-card-container'
  
  // Create header section with type indicator and assignment
  const header = document.createElement('div')
  header.className = 'event-card-header'
  
  // Create type indicator
  const typeIndicator = document.createElement('div')
  typeIndicator.className = 'event-type-indicator'
  
  // Create assignment info
  const assignmentInfo = document.createElement('div')
  assignmentInfo.className = 'event-assignment-info'
  
  // Create content section
  const content = document.createElement('div')
  content.className = 'event-card-content'
  
  // Create title
  const title = document.createElement('div')
  title.className = 'event-card-title'
  
  // Create metadata
  const metadata = document.createElement('div')
  metadata.className = 'event-card-metadata'
  
  // Determine event type and styling
  let eventTypeLabel = ''
  let eventIcon = ''
  let assignedTo = eventData.EngineerName || 'Unassigned'
  
  if (eventData.EventType === 'ticket_due') {
    eventElement.classList.add('ticket-event')
    eventIcon = '🎫'
    eventTypeLabel = 'Ticket'
    
    // Add category-specific classes
    if (eventData.Category === 'Overdue') {
      eventElement.classList.add('overdue-event')
      eventTypeLabel = 'Overdue Ticket'
    } else if (eventData.Category === 'Due Today') {
      eventElement.classList.add('due-today-event')
      eventTypeLabel = 'Due Today'
    } else if (eventData.Category === 'Due This Week') {
      eventElement.classList.add('due-this-week-event')
      eventTypeLabel = 'Due This Week'
    } else {
      eventElement.classList.add('upcoming-event')
      eventTypeLabel = 'Upcoming Ticket'
    }
    
    // Get clean title without ticket number prefix
    const cleanTitle = eventData.Subject.replace(/^🎫\s*/, '')
    title.textContent = cleanTitle
    
    // Add ticket-specific metadata
    if (eventData.TicketId) {
      metadata.innerHTML = `#${eventData.TicketId}`
    }
    
  } else if (eventData.EventType === 'ai-task') {
    eventElement.classList.add('ai-task-event')
    eventIcon = '🤖'
    eventTypeLabel = 'AI Task'
    
    // Get clean title (should already have 🤖 prefix from backend)
    const cleanTitle = eventData.Subject.replace(/^🤖\s*/, '')
    title.textContent = cleanTitle
    
    // Add AI task-specific metadata
    if (eventData.EstimatedDurationMinutes) {
      const hours = Math.round(eventData.EstimatedDurationMinutes / 60 * 100) / 100
      metadata.innerHTML = `${hours}h`
    } else if (eventData.EstimatedHours) {
      metadata.innerHTML = `${eventData.EstimatedHours}h`
    }
  } else {
    eventElement.classList.add('manual-event')
    
    // Get event type info
    const eventType = eventData.Category || 'administrative'
    const eventTypeInfo = engineeringEventTypes.value[eventType] || engineeringEventTypes.value[eventType.toLowerCase()]
    
    if (eventTypeInfo) {
      eventIcon = eventTypeInfo.icon.replace('pi pi-', '').replace('fas fa-', '').replace('fab fa-', '')
      // Convert icon classes to emoji equivalents for better display
      const iconMap = {
        'wrench': '🔧',
        'rocket': '🚀', 
        'users': '👥',
        'file-text': '📝',
        'graduation-cap': '🎓',
        'chart-line': '📈',
        'cog': '⚙️',
        'tools': '🛠️',
        'sparkles': '🤖'
      }
      eventIcon = iconMap[eventIcon] || '📋'
      eventTypeLabel = eventTypeInfo.label
    } else {
      eventIcon = '📋'
      // Use the raw category name if available, otherwise fallback to 'Activity'
      eventTypeLabel = eventType.charAt(0).toUpperCase() + eventType.slice(1).replace(/[-_]/g, ' ') || 'Activity'
    }
    
    // Get clean title
    const cleanTitle = eventData.Subject.replace(/^[🔧🚀👥📝🎓📈⚙️🛠️📋🤖]\s*/, '')
    title.textContent = cleanTitle
    
          // Add activity-specific metadata
    if (eventData.EstimatedHours) {
      metadata.innerHTML = `${eventData.EstimatedHours}h`
    }
  }
  
  // Set content
  typeIndicator.innerHTML = `${eventIcon} ${eventTypeLabel}`
  assignmentInfo.textContent = assignedTo
  
  // Add priority indicator if high priority
  if (eventData.Priority && ['emergency', 'critical', 'high'].includes(eventData.Priority.toLowerCase())) {
    eventElement.classList.add(`priority-${eventData.Priority.toLowerCase()}`)
    const priorityDot = document.createElement('div')
    priorityDot.className = 'priority-indicator'
    
    // Use fast tooltip for priority indicator too
    const priorityTooltipText = `${eventData.Priority} Priority`
    priorityDot._tooltipText = priorityTooltipText
    
    const showPriorityTooltip = (e) => {
      const existingTooltip = document.querySelector('.fast-tooltip')
      if (existingTooltip) existingTooltip.remove()
      
      const tooltip = document.createElement('div')
      tooltip.className = 'fast-tooltip'
      tooltip.textContent = priorityTooltipText
      
      const rect = e.target.getBoundingClientRect()
      tooltip.style.cssText = `
        position: fixed;
        z-index: 10000;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        pointer-events: none;
        left: ${Math.min(rect.left, window.innerWidth - 100)}px;
        top: ${rect.bottom + 4}px;
        opacity: 1;
      `
      document.body.appendChild(tooltip)
    }
    
    const hidePriorityTooltip = () => {
      const tooltip = document.querySelector('.fast-tooltip')
      if (tooltip) tooltip.remove()
    }
    
    priorityDot.addEventListener('mouseenter', showPriorityTooltip)
    priorityDot.addEventListener('mouseleave', hidePriorityTooltip)
    
    header.appendChild(priorityDot)
  }
  
  // Assemble the card
  header.appendChild(typeIndicator)
  header.appendChild(assignmentInfo)
  content.appendChild(title)
  if (metadata.innerHTML) {
    content.appendChild(metadata)
  }
  container.appendChild(header)
  container.appendChild(content)
  eventElement.appendChild(container)
  
  // Apply time formatting for better display
  const startTime = new Date(eventData.StartTime)
  const endTime = new Date(eventData.EndTime)
  const timeString = `${startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
  
  // Create enhanced tooltip with comprehensive information
  let tooltipContent = []
  
  // Add title (clean, without emoji prefix)
  const cleanTitle = eventData.Subject?.replace(/^[🔧🎫🚀👥📝🎓📊📋🤖]\s*/, '') || 'Untitled Event'
  tooltipContent.push(`📋 ${cleanTitle}`)
  
  // Add time information
  tooltipContent.push(`⏰ ${timeString}`)
  
  // Add event type
  tooltipContent.push(`🏷️ Type: ${eventTypeLabel}`)
  
  // Add priority if available
  if (eventData.Priority) {
    const priorityEmoji = {
      'emergency': '🚨',
      'critical': '🔴', 
      'high': '🟠',
      'normal': '🟡',
      'low': '⚪'
    }
    const emoji = priorityEmoji[eventData.Priority.toLowerCase()] || '🟡'
    tooltipContent.push(`${emoji} Priority: ${eventData.Priority.charAt(0).toUpperCase() + eventData.Priority.slice(1)}`)
  }
  
  // Add assignment information
  if (assignedTo) {
    tooltipContent.push(`👤 Assigned: ${assignedTo}`)
  } else {
    tooltipContent.push(`👤 Unassigned`)
  }
  
  // Add ticket-specific information for ticket events
  if (eventData.EventType === 'ticket_due') {
    if (eventData.TicketId) {
      tooltipContent.push(`🎫 Ticket ID: ${eventData.TicketId}`)
    }
    if (eventData.Customer && eventData.Customer !== 'Unassigned') {
      tooltipContent.push(`🏢 Customer: ${eventData.Customer}`)
    }
    if (eventData.Status) {
      tooltipContent.push(`📊 Status: ${eventData.Status}`)
    }
    if (eventData.LastActivity) {
      const lastUpdate = new Date(eventData.LastActivity)
      const now = new Date()
      const diffTime = Math.abs(now - lastUpdate)
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      const timeAgo = diffDays === 0 ? 'Today' : diffDays === 1 ? '1 day ago' : `${diffDays} days ago`
      tooltipContent.push(`🕒 Last Update: ${timeAgo}`)
    }
  } else if (eventData.EventType === 'ai-task') {
    // Add AI task-specific information
    if (eventData.EstimatedDurationMinutes) {
      const hours = Math.round(eventData.EstimatedDurationMinutes / 60 * 100) / 100
      tooltipContent.push(`⏱️ Duration: ${hours} hours`)
    } else if (eventData.EstimatedHours) {
      tooltipContent.push(`⏱️ Duration: ${eventData.EstimatedHours} hours`)
    }
    if (eventData.PriorityLevel) {
      tooltipContent.push(`🎯 AI Priority: ${eventData.PriorityLevel}`)
    }
    if (eventData.AssignedTo) {
      tooltipContent.push(`👤 AI Assignment: ${eventData.AssignedTo}`)
    }
    if (eventData.GeneratedAt) {
      const generatedDate = new Date(eventData.GeneratedAt)
      tooltipContent.push(`🧠 Generated: ${formatDateTime(generatedDate)}`)
    }
    if (eventData.TaskDescription) {
      const shortDesc = eventData.TaskDescription.length > 100 
        ? eventData.TaskDescription.substring(0, 100) + '...' 
        : eventData.TaskDescription
      tooltipContent.push(`📝 ${shortDesc}`)
    }
  } else {
    // Add activity-specific information
    if (eventData.EstimatedHours) {
      tooltipContent.push(`⏱️ Duration: ${eventData.EstimatedHours} hours`)
    }
    if (eventData.Impact) {
      const impactEmoji = {
        'internal': '🏠',
        'single-customer': '👤',
        'multiple-customers': '👥',
        'company-wide': '🌐'
      }
      const emoji = impactEmoji[eventData.Impact] || '📊'
      tooltipContent.push(`${emoji} Impact: ${eventData.Impact.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`)
    }
    if (eventData.Subcategory) {
      tooltipContent.push(`📂 Category: ${eventData.Subcategory}`)
    }
    if (eventData.MaintenanceWindow) {
      tooltipContent.push(`⚠️ Requires Maintenance Window`)
    }
    if (eventData.CustomerFacing) {
      tooltipContent.push(`👥 Customer-Facing Activity`)
    }
  }
  
  // Add description preview if available
  if (eventData.Description && eventData.EventType !== 'ticket_due') {
    const shortDesc = eventData.Description.length > 100 
      ? eventData.Description.substring(0, 100) + '...' 
      : eventData.Description
    tooltipContent.push(`📝 ${shortDesc}`)
  }
  
  // Set comprehensive tooltip with FAST custom tooltip system
  const tooltipText = tooltipContent.join('\n')
  
  // Debug: Log tooltip setup
  console.log('Setting fast tooltip for:', eventData.Subject)
  console.log('Tooltip text length:', tooltipText.length)
  
  // REMOVE native title attributes to prevent slow browser tooltips
  eventElement.removeAttribute('title')
  container.removeAttribute('title')
  
  // Store tooltip data for our custom system
  eventElement._tooltipText = tooltipText
  container._tooltipText = tooltipText
  
  // Fast custom tooltip implementation - appears immediately on hover
  const showTooltip = (e) => {
    // Remove any existing tooltip
    const existingTooltip = document.querySelector('.fast-tooltip')
    if (existingTooltip) {
      existingTooltip.remove()
    }
    
    // Create new tooltip element
    const tooltip = document.createElement('div')
    tooltip.className = 'fast-tooltip'
    tooltip.innerHTML = tooltipText.replace(/\n/g, '<br>')
    
    // Position tooltip near mouse cursor
    const rect = e.target.getBoundingClientRect()
    tooltip.style.cssText = `
      position: fixed;
      z-index: 10000;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      line-height: 1.4;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      pointer-events: none;
      white-space: pre-wrap;
      word-wrap: break-word;
      transform: translateY(-100%);
      margin-top: -8px;
      left: ${Math.min(rect.left, window.innerWidth - 320)}px;
      top: ${rect.top}px;
      opacity: 1;
      transition: opacity 0.1s ease-in-out;
    `
    
    // Adjust position if tooltip would go off-screen
    document.body.appendChild(tooltip)
    const tooltipRect = tooltip.getBoundingClientRect()
    
    // Adjust horizontal position if needed
    if (tooltipRect.right > window.innerWidth - 10) {
      tooltip.style.left = (window.innerWidth - tooltipRect.width - 10) + 'px'
    }
    
    // Adjust vertical position if needed
    if (tooltipRect.top < 10) {
      tooltip.style.top = (rect.bottom + 8) + 'px'
      tooltip.style.transform = 'translateY(0)'
    }
  }
  
  const hideTooltip = () => {
    const tooltip = document.querySelector('.fast-tooltip')
    if (tooltip) {
      tooltip.style.opacity = '0'
      setTimeout(() => {
        if (tooltip.parentNode) {
          tooltip.remove()
        }
      }, 100)
    }
  }
  
  // Add fast tooltip event listeners - NO DELAY
  eventElement.addEventListener('mouseenter', showTooltip)
  eventElement.addEventListener('mouseleave', hideTooltip)
  container.addEventListener('mouseenter', showTooltip)
  container.addEventListener('mouseleave', hideTooltip)
  
  // Also handle mouse movement for repositioning
  eventElement.addEventListener('mousemove', (e) => {
    const tooltip = document.querySelector('.fast-tooltip')
    if (tooltip) {
      const rect = e.target.getBoundingClientRect()
      tooltip.style.left = Math.min(rect.left, window.innerWidth - 320) + 'px'
      tooltip.style.top = rect.top + 'px'
    }
  })
  
  // Ensure the element is hoverable
  eventElement.style.cursor = 'pointer'
  
  // Debug: Verify fast tooltip was set
  console.log('Fast tooltip system enabled for:', eventData.Subject)
  console.log('Element tagName:', eventElement.tagName)
  console.log('Element classes:', eventElement.className)
  
  // Trigger overlap handling after this event is rendered
  setTimeout(() => handleOverlappingEvents(), 50)
}

const onPopupOpen = (args) => {
  // Customize popup behavior
  if (args.type === 'QuickInfo') {
    args.cancel = true // Cancel default popup
    selectedEvent.value = args.data
    showEventDialog.value = true
  }
}

const onActionBegin = async (args) => {
  console.log('Action Begin:', args.requestType, args)
  
  // Handle CRUD operations
  if (args.requestType === 'eventCreate') {
    args.cancel = true // Cancel default creation, we handle it manually
  } else if (args.requestType === 'eventChange') {
    // Check if this is a ticket event (read-only)
    if (args.data && args.data.EventType === 'ticket_due') {
      args.cancel = true
      toast.add({
        severity: 'warn',
        summary: 'Read Only',
        detail: 'Ticket events cannot be edited. Please update the ticket directly.',
        life: 3000
      })
      return
    }
    
    // Allow the edit dialog to open, but cancel the actual save operation
    // We'll handle the save ourselves
    args.cancel = true
    
    console.log('=== UPDATE EVENT DEBUG ===')
    console.log('Full args object:', args)
    console.log('Update Event Data:', args.data)
    console.log('Event Data Keys:', Object.keys(args.data || {}))
    console.log('Event ID:', args.data.Id)
    
    try {
      const eventData = {
        subject: args.data.Subject,
        description: args.data.Description || '',
        start_time: args.data.StartTime.toISOString(),
        end_time: args.data.EndTime.toISOString(),
        event_type: args.data.Category || 'administrative',
        assigned_engineer: args.data.EngineerName || null,
        related_ticket_id: args.data.TicketId || null,
        location: args.data.Location || '',
        is_all_day: args.data.IsAllDay || false
      }
      
      console.log('Prepared Event Data for Backend:', eventData)
      console.log('Event Data JSON:', JSON.stringify(eventData, null, 2))
      
      await engineeringStore.updateCalendarEvent(args.data.Id, eventData)
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Event updated successfully',
        life: 3000
      })
    } catch (error) {
      console.error('Error updating event:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update event',
        life: 3000
      })
    }
  } else if (args.requestType === 'eventRemove') {
    // Check if this is a ticket event (read-only)
    if (args.data && args.data.EventType === 'ticket_due') {
      args.cancel = true
      toast.add({
        severity: 'warn',
        summary: 'Read Only',
        detail: 'Ticket events cannot be deleted. Please update the ticket directly.',
        life: 3000
      })
      return
    }
    
    args.cancel = true // Cancel default deletion
    
    // Debug: Log the event data to see what ID fields are available
    console.log('=== DELETE EVENT DEBUG ===')
    console.log('Full args object:', args)
    console.log('Delete Event Data:', args.data)
    console.log('Is args.data an array?', Array.isArray(args.data))
    
    // Handle case where args.data might be an array
    const eventData = Array.isArray(args.data) ? args.data[0] : args.data
    
    console.log('Actual Event Data:', eventData)
    console.log('Event Data Keys:', Object.keys(eventData || {}))
    console.log('Available ID fields:', {
      Id: eventData?.Id,
      id: eventData?.id,
      _originalEvent: eventData?._originalEvent,
      originalEventId: eventData?._originalEvent?.id,
      originalEventId2: eventData?._originalEvent?.Id
    })
    
    // Try to get the ID from various possible fields
    const eventId = eventData?.Id || eventData?.id || eventData?._originalEvent?.id || eventData?._originalEvent?.Id
    
    console.log('Resolved Event ID:', eventId)
    console.log('Event ID type:', typeof eventId)
    
    if (!eventId || eventId === undefined || eventId === null) {
      console.error('No valid event ID found for deletion')
      console.error('Event data structure:', JSON.stringify(args.data, null, 2))
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Cannot delete event: No valid ID found',
        life: 3000
      })
      return
    }
    
    try {
      await engineeringStore.deleteCalendarEvent(eventId)
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Event deleted successfully',
        life: 3000
      })
    } catch (error) {
      console.error('Error deleting event:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete event',
        life: 3000
      })
    }
  }
}

const onActionComplete = (args) => {
  // Handle completion of actions
  if (args.requestType === 'eventCreated') {
    toast.add({
      severity: 'success',
      summary: 'Success',
              detail: 'Activity created successfully',
      life: 3000
    })
  }
}

const onCellClick = (args) => {
  console.log('Cell clicked:', args)
}

const onEventClick = (args) => {
  selectedEvent.value = args.event
  showEventDialog.value = true
}

const onScheduleRendering = (args) => {
  // This event is triggered during the rendering process
  // We can use it to apply custom positioning for overlapping events
  if (args.requestType === 'eventRendered') {
    handleOverlappingEvents()
  }
}

const handleOverlappingEvents = () => {
  // Wait for next tick to ensure DOM is updated
  setTimeout(() => {
    if (!scheduleObj.value) return
    
    try {
      // Get all appointment elements
      const appointments = scheduleObj.value.$el.querySelectorAll('.e-appointment')
      const processedSlots = new Set()
      
      appointments.forEach((appointment, index) => {
        const appointmentRect = appointment.getBoundingClientRect()
        const slotKey = `${appointmentRect.top}-${appointmentRect.left}`
        
        if (processedSlots.has(slotKey)) return
        processedSlots.add(slotKey)
        
        // Find overlapping appointments
        const overlapping = Array.from(appointments).filter((other, otherIndex) => {
          if (otherIndex === index) return false
          const otherRect = other.getBoundingClientRect()
          
          // Check if appointments overlap vertically and horizontally
          const verticalOverlap = appointmentRect.top < otherRect.bottom && appointmentRect.bottom > otherRect.top
          const horizontalOverlap = appointmentRect.left < otherRect.right && appointmentRect.right > otherRect.left
          
          return verticalOverlap && horizontalOverlap
        })
        
        if (overlapping.length > 0) {
          // Calculate how many appointments are overlapping
          const totalOverlapping = overlapping.length + 1
          const appointmentWidth = 100 / totalOverlapping
          
          // Position the main appointment
          appointment.style.width = `${appointmentWidth - 1}%`
          appointment.style.left = '0%'
          appointment.style.zIndex = '10'
          
          // Position overlapping appointments side by side
          overlapping.forEach((overlappingAppointment, i) => {
            overlappingAppointment.style.width = `${appointmentWidth - 1}%`
            overlappingAppointment.style.left = `${(i + 1) * appointmentWidth}%`
            overlappingAppointment.style.zIndex = '10'
          })
        }
      })
    } catch (error) {
      console.warn('Error handling overlapping events:', error)
    }
  }, 100)
}

// CRITICAL: Handle navigation to load events for new date ranges
const onNavigating = async (args) => {
  if (args.action === 'date' || args.action === 'view') {
    const startDate = new Date(args.currentDate)
    const endDate = new Date(args.currentDate)
    
    // Adjust date range based on current view
    switch (args.currentView) {
      case 'Month':
        startDate.setDate(1)
        endDate.setMonth(endDate.getMonth() + 1, 0)
        break
      case 'Week':
      case 'WorkWeek':
        const dayOfWeek = startDate.getDay()
        startDate.setDate(startDate.getDate() - dayOfWeek)
        endDate.setDate(startDate.getDate() + 6)
        break
      case 'TimelineWeek':
        const timelineDayOfWeek = startDate.getDay()
        startDate.setDate(startDate.getDate() - timelineDayOfWeek)
        endDate.setDate(startDate.getDate() + 6)
        break
      case 'TimelineMonth':
        startDate.setDate(1)
        endDate.setMonth(endDate.getMonth() + 1, 0)
        break
      case 'Day':
        endDate.setDate(startDate.getDate())
        break
    }
    
    try {
      await engineeringStore.fetchCalendarEvents(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      )
    } catch (error) {
      console.error('Failed to load calendar events for navigation:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load calendar events',
        life: 3000
      })
    }
  }
}

// Utility functions
const formatEventTime = (startTime, endTime) => {
  const start = new Date(startTime)
  const end = new Date(endTime)
  
  const options = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }
  
  if (start.toDateString() === end.toDateString()) {
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
  } else {
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`
  }
}

const refreshCalendar = async () => {
  isLoading.value = true
  try {
    // Load calendar events for current month if no dates are set
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    
    await Promise.all([
      engineeringStore.fetchCalendarEvents(startDate, endDate),
      engineeringStore.fetchCalendarEngineers(),
      engineeringStore.fetchCalendarTickets(),
      engineeringStore.fetchCalendarStatistics()
    ])
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Calendar refreshed successfully',
      life: 3000
    })
  } catch (error) {
    console.error('Calendar refresh error:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to refresh calendar data',
      life: 3000
    })
  } finally {
    isLoading.value = false
  }
}

const createActivity = async () => {
  if (!newActivity.value.title || !newActivity.value.startTime || !newActivity.value.endTime) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please fill in all required fields',
      life: 3000
    })
    return
  }
  
  isCreatingActivity.value = true
  try {
    // Create event data for backend
    const eventData = {
      subject: newActivity.value.title,
      description: newActivity.value.description,
      start_time: newActivity.value.startTime.toISOString(),
      end_time: newActivity.value.endTime.toISOString(),
      event_type: newActivity.value.type,
      subcategory: newActivity.value.subcategory,
      priority: newActivity.value.priority,
      impact: newActivity.value.impact,
      estimated_hours: newActivity.value.estimatedHours,
      maintenance_window: newActivity.value.maintenanceWindow,
      customer_facing: newActivity.value.customerFacing,
      assigned_engineer: newActivity.value.engineerId !== 'all' ? newActivity.value.engineerId : null,
      related_ticket_id: newActivity.value.ticketId || null,
      location: '',
      is_all_day: false
    }
    
    // Call backend API to create the event
    await engineeringStore.createCalendarEvent(eventData)
    
    // Reset form
    newActivity.value = {
      title: '',
      type: 'maintenance',
      subcategory: '',
      priority: 'normal',
      impact: 'internal',
      startTime: new Date(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      engineerId: null,
      ticketId: null,
      description: '',
      estimatedHours: 1,
      maintenanceWindow: false,
      customerFacing: false
    }
    
    showAddActivityDialog.value = false
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Activity created successfully',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to create activity',
      life: 3000
    })
  } finally {
    isCreatingActivity.value = false
  }
}

const updateActivity = async () => {
  if (!editActivity.value.title || !editActivity.value.startTime || !editActivity.value.endTime) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please fill in all required fields',
      life: 3000
    })
    return
  }
  
  isUpdatingActivity.value = true
  try {
    // Create event data for backend
    const eventData = {
      subject: editActivity.value.title,
      description: editActivity.value.description,
      start_time: editActivity.value.startTime.toISOString(),
      end_time: editActivity.value.endTime.toISOString(),
      event_type: editActivity.value.type,
      subcategory: editActivity.value.subcategory,
      priority: editActivity.value.priority,
      impact: editActivity.value.impact,
      estimated_hours: editActivity.value.estimatedHours,
      maintenance_window: editActivity.value.maintenanceWindow,
      customer_facing: editActivity.value.customerFacing,
      assigned_engineer: editActivity.value.engineerId !== 'all' ? editActivity.value.engineerId : null,
      related_ticket_id: editActivity.value.ticketId || null,
      location: '',
      is_all_day: false
    }
    
    // Call backend API to update the event
    await engineeringStore.updateCalendarEvent(editActivity.value.id, eventData)
    
    showEditActivityDialog.value = false
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Activity updated successfully',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update activity',
      life: 3000
    })
  } finally {
    isUpdatingActivity.value = false
  }
}

const editEvent = () => {
  console.log('Edit event:', selectedEvent.value)
  
  // Check if this is a ticket event (read-only)
  if (selectedEvent.value && selectedEvent.value.EventType === 'ticket_due') {
  showEventDialog.value = false
    toast.add({
      severity: 'warn',
      summary: 'Read Only',
      detail: 'Ticket events cannot be edited. Please update the ticket directly.',
      life: 3000
    })
    return
  }
  
  // Populate the edit form with current event data
  if (selectedEvent.value) {
    editActivity.value = {
      id: selectedEvent.value.Id,
      title: selectedEvent.value.Subject?.replace(/^[🔧🎫🚀👥📝🎓📊📋]\s/, '') || '', // Remove emoji prefix
      type: selectedEvent.value.Category || 'maintenance',
      subcategory: selectedEvent.value.Subcategory || '',
      priority: selectedEvent.value.Priority || 'normal',
      impact: selectedEvent.value.Impact || 'internal',
      startTime: new Date(selectedEvent.value.StartTime),
      endTime: new Date(selectedEvent.value.EndTime),
      engineerId: selectedEvent.value.EngineerName || null,
      ticketId: selectedEvent.value.TicketId || null,
      description: selectedEvent.value.Description?.split('\n')[0] || '', // Get description without metadata
      estimatedHours: selectedEvent.value.EstimatedHours || 1,
      maintenanceWindow: selectedEvent.value.MaintenanceWindow || false,
      customerFacing: selectedEvent.value.CustomerFacing || false
    }
  }
  
  showEventDialog.value = false
  showEditActivityDialog.value = true
}

const viewTicket = (ticketId) => {
  if (ticketId) {
    router.push(`/engineering/tickets/${ticketId}`)
  }
}

// Lifecycle
onMounted(async () => {
  await refreshCalendar()
})

// Cleanup fast tooltips on component unmount
onUnmounted(() => {
  // Remove any lingering tooltips
  const tooltips = document.querySelectorAll('.fast-tooltip')
  tooltips.forEach(tooltip => tooltip.remove())
})

// Provide Syncfusion modules
provide('schedule', [Day, Week, WorkWeek, Month, Agenda, TimelineViews, Resize, DragAndDrop])

// Statistics Panel Computed Properties
const quickStatsDisplay = computed(() => {
  const events = calendarEvents.value || []
  const tickets = events.filter(e => e.EventType === 'ticket_due').length
  const aiTasks = events.filter(e => e.EventType === 'ai-task').length
  const activities = events.filter(e => e.EventType !== 'ticket_due' && e.EventType !== 'ai-task').length
  const uniqueEngineers = new Set(events.map(e => e.EngineerName || e.engineer_name || e.AssignedTo).filter(Boolean)).size
  
  return {
    total: events.length,
    tickets: tickets,
    aiTasks: aiTasks,
    activities: activities,
    activeEngineers: uniqueEngineers
  }
})

const currentPeriodLabel = computed(() => {
  if (!engineeringStore.currentViewStart || !engineeringStore.currentViewEnd) return 'Current Period'
  
  const start = new Date(engineeringStore.currentViewStart)
  const end = new Date(engineeringStore.currentViewEnd)
  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 1) return 'Today'
  if (diffDays <= 7) return 'This Week'
  if (diffDays <= 31) return 'This Month'
  return `${diffDays} Days`
})

const eventTypeBreakdown = computed(() => {
  const events = calendarEvents.value || []
  const total = events.length
  
  if (total === 0) return {}
  
  const breakdown = {}
  
  events.forEach(event => {
    const type = event.EventType === 'ticket_due' ? 'ticket_due' : (event.Category || 'unknown')
    if (!breakdown[type]) {
      breakdown[type] = { count: 0, percentage: 0 }
    }
    breakdown[type].count++
  })
  
  // Calculate percentages
  Object.keys(breakdown).forEach(type => {
    breakdown[type].percentage = Math.round((breakdown[type].count / total) * 100)
  })
  
  return breakdown
})

const engineerWorkloadDisplay = computed(() => {
  const events = calendarEvents.value || []
  const engineerStats = {}
  
  // Aggregate data by engineer
  events.forEach(event => {
    const engineerName = event.EngineerName || event.engineer_name || 'Unassigned'
    
    if (!engineerStats[engineerName]) {
      engineerStats[engineerName] = {
        name: engineerName,
        eventCount: 0,
        totalHours: 0,
        initials: engineerName.split(' ').map(n => n[0]).join('').substring(0, 2),
        color: getEngineerColor(engineerName)
      }
    }
    
    engineerStats[engineerName].eventCount++
    engineerStats[engineerName].totalHours += event.EstimatedHours || event.estimated_hours || 1
  })
  
  const engineers = Object.values(engineerStats)
  const maxWorkload = Math.max(...engineers.map(e => e.eventCount), 1)
  
  // Calculate workload percentages
  engineers.forEach(engineer => {
    engineer.workloadPercentage = Math.round((engineer.eventCount / maxWorkload) * 100)
  })
  
  return engineers.sort((a, b) => b.eventCount - a.eventCount)
})

const peakHoursDisplay = computed(() => {
  const events = calendarEvents.value || []
  const hourCounts = {}
  
  events.forEach(event => {
    const startHour = new Date(event.StartTime || event.start_time).getHours()
    hourCounts[startHour] = (hourCounts[startHour] || 0) + 1
  })
  
  if (Object.keys(hourCounts).length === 0) return 'No data'
  
  const peakHour = Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0]
  
  if (!peakHour) return 'No data'
  
  const hour = parseInt(peakHour)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  
  return `${displayHour}:00 ${period}`
})

const dailyDistribution = computed(() => {
  const events = calendarEvents.value || []
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayCounts = {}
  
  events.forEach(event => {
    const dayOfWeek = new Date(event.StartTime || event.start_time).getDay()
    const dayName = dayNames[dayOfWeek]
    dayCounts[dayName] = (dayCounts[dayName] || 0) + 1
  })
  
  const maxCount = Math.max(...Object.values(dayCounts), 1)
  
  return dayNames.map(day => ({
    name: day,
    count: dayCounts[day] || 0,
    percentage: Math.round(((dayCounts[day] || 0) / maxCount) * 100)
  }))
})

const priorityBreakdown = computed(() => {
  const events = calendarEvents.value || []
  const total = events.length
  
  if (total === 0) return []
  
  const priorities = ['emergency', 'critical', 'high', 'normal', 'low']
  const priorityCounts = {}
  
  events.forEach(event => {
    const priority = (event.Priority || event.priority || 'normal').toLowerCase()
    priorityCounts[priority] = (priorityCounts[priority] || 0) + 1
  })
  
  return priorities.map(level => {
    const count = priorityCounts[level] || 0
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0
    
    return {
      level: level.charAt(0).toUpperCase() + level.slice(1),
      count,
      percentage,
      bgClass: getPriorityBgClass(level),
      textClass: getPriorityTextClass(level)
    }
  }).filter(p => p.count > 0)
})

const criticalEventsCount = computed(() => {
  const events = calendarEvents.value || []
  return events.filter(event => {
    const priority = (event.Priority || event.priority || '').toLowerCase()
    return priority === 'critical' || priority === 'emergency'
  }).length
})

const overdueTicketsCount = computed(() => {
  const events = calendarEvents.value || []
  return events.filter(event => {
    return event.EventType === 'ticket_due' && event.Category === 'Overdue'
  }).length
})

const maintenanceWindowsCount = computed(() => {
  const events = calendarEvents.value || []
  return events.filter(event => event.MaintenanceWindow || event.maintenance_window).length
})

const lastStatsUpdate = computed(() => {
  return new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
})

// Statistics Panel Helper Functions
const getEventTypeColor = (type) => {
  const colors = {
    'ticket_due': '#f59e0b',
    'maintenance': '#10b981',
    'deployment': '#8b5cf6',
    'customer': '#3b82f6',
    'planning': '#8b5cf6',
    'development': '#06b6d4',
    'monitoring': '#84cc16',
    'administrative': '#6b7280',
    'ticket-work': '#ef4444',
    'ai-task': '#8b5cf6'
  }
  return colors[type] || '#6b7280'
}

const getEventTypeLabel = (type) => {
  const labels = {
    'ticket_due': 'Ticket Deadlines',
    'maintenance': 'Maintenance',
    'deployment': 'Deployments',
    'customer': 'Customer Activities',
    'planning': 'Planning & Documentation',
    'development': 'Training & Development',
    'monitoring': 'Monitoring & Analysis',
    'administrative': 'Administrative',
    'ticket-work': 'Ticket Work',
    'ai-task': 'AI-Generated Tasks'
  }
  return labels[type] || type.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const getEngineerColor = (engineerName) => {
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
  ]
  
  if (!engineerName) return colors[0]
  
  const hash = engineerName.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  return colors[Math.abs(hash) % colors.length]
}

const getPriorityBgClass = (priority) => {
  const classes = {
    'emergency': 'bg-red-50 dark:bg-red-900/20',
    'critical': 'bg-red-50 dark:bg-red-900/20',
    'high': 'bg-orange-50 dark:bg-orange-900/20',
    'normal': 'bg-blue-50 dark:bg-blue-900/20',
    'low': 'bg-gray-50 dark:bg-gray-900/20'
  }
  return classes[priority] || classes['normal']
}

const getPriorityTextClass = (priority) => {
  const classes = {
    'emergency': 'text-red-600 dark:text-red-400',
    'critical': 'text-red-600 dark:text-red-400',
    'high': 'text-orange-600 dark:text-orange-400',
    'normal': 'text-blue-600 dark:text-blue-400',
    'low': 'text-gray-600 dark:text-gray-400'
  }
  return classes[priority] || classes['normal']
}

const exportStatistics = () => {
  const stats = {
    period: {
      start: engineeringStore.currentViewStart,
      end: engineeringStore.currentViewEnd,
      label: currentPeriodLabel.value
    },
    summary: quickStatsDisplay.value,
    eventTypes: eventTypeBreakdown.value,
    engineers: engineerWorkloadDisplay.value,
    timeAnalysis: {
      peakHours: peakHoursDisplay.value,
      dailyDistribution: dailyDistribution.value
    },
    priorities: priorityBreakdown.value,
    alerts: {
      critical: criticalEventsCount.value,
      overdue: overdueTicketsCount.value,
      maintenance: maintenanceWindowsCount.value
    },
    exportedAt: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `calendar-statistics-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  toast.add({
    severity: 'success',
    summary: 'Export Complete',
    detail: 'Statistics exported successfully',
    life: 3000
  })
}

const refreshStatistics = async () => {
  isRefreshingStats.value = true
  try {
    await refreshCalendar()
    toast.add({
      severity: 'success',
      summary: 'Statistics Refreshed',
      detail: 'Calendar statistics updated successfully',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Refresh Failed',
      detail: 'Failed to refresh statistics',
      life: 3000
    })
  } finally {
    isRefreshingStats.value = false
  }
}

// Lifecycle
</script>



<style scoped>
/* Import required Syncfusion Material theme styles */
@import '@syncfusion/ej2-base/styles/material.css';
@import '@syncfusion/ej2-buttons/styles/material.css';
@import '@syncfusion/ej2-calendars/styles/material.css';
@import '@syncfusion/ej2-dropdowns/styles/material.css';
@import '@syncfusion/ej2-inputs/styles/material.css';
@import '@syncfusion/ej2-navigations/styles/material.css';
@import '@syncfusion/ej2-popups/styles/material.css';
@import '@syncfusion/ej2-vue-schedule/styles/material.css';

.engineering-calendar {
  padding: 1.5rem;
  background: var(--surface-ground);
  min-height: calc(100vh - 200px);
}

/* Schedule container improvements */
.card {
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--surface-border);
}

/* Header styling */
.engineering-calendar h1 {
  color: var(--surface-900);
  font-weight: 700;
  letter-spacing: -0.025em;
}

.engineering-calendar p {
  color: var(--surface-600);
  font-size: 1rem;
  line-height: 1.5;
}

/* Controls styling */
.engineering-calendar .p-select {
  min-width: 120px;
}

.engineering-calendar .p-button {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease-in-out;
}

.engineering-calendar .p-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Legend styling */
.engineering-calendar .bg-surface-50 {
  background: var(--surface-50);
  border: 1px solid var(--surface-200);
  border-radius: 10px;
}

.engineering-calendar .dark\:bg-surface-800 {
  background: var(--surface-800);
  border-color: var(--surface-700);
}

/* Minimal Schedule component styling - Let Syncfusion Material theme handle most styling */
:deep(.engineering-schedule) {
  font-family: 'Roboto', sans-serif;
  border-radius: 8px;
  overflow: hidden;
}

/* Enhanced overlap handling for side-by-side events */
:deep(.engineering-schedule-overlap) {
  /* Enable proper event collision detection and side-by-side layout */
}

/* Force overlapping events to display side-by-side */
:deep(.engineering-schedule .e-work-cells) {
  position: relative;
  overflow: visible;
}

/* Ensure appointments can display side-by-side when overlapping */
:deep(.engineering-schedule .e-appointment-wrapper) {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 2px;
}

/* Handle overlapping events by reducing width and positioning side-by-side */
:deep(.engineering-schedule .e-appointment.e-appointment-border) {
  position: absolute;
  box-sizing: border-box;
}

/* When multiple events overlap, make them narrower and position side-by-side */
:deep(.engineering-schedule .e-work-cells .e-appointment) {
  position: absolute;
  min-width: 80px; /* Minimum width for readability when overlapping */
  max-width: calc(100% - 4px);
  box-sizing: border-box;
  transition: width 0.2s ease-in-out, left 0.2s ease-in-out;
}

/* Specific styling for overlapping appointments */
:deep(.engineering-schedule .e-appointment + .e-appointment) {
  margin-left: 2px;
}

/* Ensure proper z-index layering for overlapping events */
:deep(.engineering-schedule .e-appointment) {
  z-index: 10;
}

:deep(.engineering-schedule .e-appointment:hover) {
  z-index: 20;
}

/* Multi-day and all-day event handling */
:deep(.engineering-schedule .e-all-day-appointment-wrapper .e-appointment) {
  position: relative;
  display: inline-block;
  margin-right: 2px;
  min-width: 100px;
}

/* Enhanced Event Card Styling */
:deep(.engineering-schedule .e-appointment) {
  border-radius: 8px;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  padding: 0;
  min-height: 60px;
  /* Ensure tooltips work properly */
  cursor: pointer;
  position: relative;
}

/* Event Card Container */
:deep(.engineering-schedule .event-card-container) {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 6px 8px;
  gap: 4px;
}

/* Event Card Header */
:deep(.engineering-schedule .event-card-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.7rem;
  font-weight: 600;
  opacity: 0.9;
  position: relative;
  color: inherit !important;
}

/* Event Type Indicator */
:deep(.engineering-schedule .event-type-indicator) {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: inherit !important;
}

/* Assignment Info */
:deep(.engineering-schedule .event-assignment-info) {
  font-size: 0.65rem;
  font-weight: 500;
  opacity: 0.8;
  text-align: right;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: inherit !important;
}

/* Event Card Content */
:deep(.engineering-schedule .event-card-content) {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: inherit !important;
}

/* Event Card Title */
:deep(.engineering-schedule .event-card-title) {
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.2;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
  color: inherit !important;
}

/* Event Card Metadata */
:deep(.engineering-schedule .event-card-metadata) {
  font-size: 0.65rem;
  font-weight: 500;
  opacity: 0.7;
  margin-top: auto;
  color: inherit !important;
}

/* Priority Indicator */
:deep(.engineering-schedule .priority-indicator) {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff4444;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

/* Ticket Event Styling - Override Syncfusion theme */
:deep(.engineering-schedule .ticket-event) {
  background: linear-gradient(135deg, #ff9800, #f57c00) !important;
  color: white !important;
  border: none !important;
}

:deep(.engineering-schedule .overdue-event) {
  background: linear-gradient(135deg, #f44336, #d32f2f) !important;
  color: white !important;
  box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3) !important;
  border: none !important;
}

:deep(.engineering-schedule .due-today-event) {
  background: linear-gradient(135deg, #ff5722, #e64a19) !important;
  color: white !important;
  box-shadow: 0 2px 6px rgba(255, 87, 34, 0.3) !important;
  border: none !important;
}

:deep(.engineering-schedule .due-this-week-event) {
  background: linear-gradient(135deg, #ffc107, #ffa000) !important;
  color: #333 !important;
  border: none !important;
}

:deep(.engineering-schedule .upcoming-event) {
  background: linear-gradient(135deg, #03a9f4, #0288d1) !important;
  color: white !important;
  border: none !important;
}

/* Manual Event Styling - Override Syncfusion theme */
:deep(.engineering-schedule .manual-event) {
  background: linear-gradient(135deg, #2196f3, #1976d2) !important;
  color: white !important;
  border: none !important;
}

/* AI Task Event Styling - Override Syncfusion theme */
:deep(.engineering-schedule .ai-task-event) {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed) !important;
  color: white !important;
  border: none !important;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3) !important;
}

/* Event Type Specific Colors for Manual Events */
:deep(.engineering-schedule .manual-event.maintenance) {
  background: linear-gradient(135deg, #4caf50, #388e3c) !important;
  color: white !important;
}

:deep(.engineering-schedule .manual-event.deployment) {
  background: linear-gradient(135deg, #9c27b0, #7b1fa2) !important;
  color: white !important;
}

:deep(.engineering-schedule .manual-event.customer-activity) {
  background: linear-gradient(135deg, #00bcd4, #0097a7) !important;
  color: white !important;
}

:deep(.engineering-schedule .manual-event.documentation) {
  background: linear-gradient(135deg, #673ab7, #512da8) !important;
  color: white !important;
}

:deep(.engineering-schedule .manual-event.training) {
  background: linear-gradient(135deg, #ff9800, #f57c00) !important;
  color: white !important;
}

:deep(.engineering-schedule .manual-event.monitoring) {
  background: linear-gradient(135deg, #607d8b, #455a64) !important;
  color: white !important;
}

/* Priority Styling */
:deep(.engineering-schedule .priority-emergency .priority-indicator) {
  background: #ff1744;
  animation: pulse 1.5s infinite;
}

:deep(.engineering-schedule .priority-critical .priority-indicator) {
  background: #ff5722;
}

:deep(.engineering-schedule .priority-high .priority-indicator) {
  background: #ff9800;
}

/* Hover Effects */
:deep(.engineering-schedule .e-appointment:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

/* Animation for emergency priority */
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}


/* Responsive adjustments */
@media (max-width: 768px) {
  .engineering-calendar {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .engineering-calendar {
    padding: 0.5rem;
  }
}
</style> 