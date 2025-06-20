<template>
  <div class="engineering-calendar">
    <!-- Header Section -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-2">
          🗓️ Engineering Calendar
        </h1>
        <p class="text-surface-600 dark:text-surface-300">
          Track ticket deadlines, engineer assignments, and task schedules
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
          label="Add Task" 
          icon="pi pi-plus"
          @click="showAddTaskDialog = true"
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
        :locale="'en-US'"
        :dateFormat="'MM/dd/yyyy'"
        :timeFormat="'h:mm a'"
        :firstDayOfWeek="0"
        :showTimeIndicator="true"
        :allowMultiDrag="false"
        :allowResizing="true"
        :allowDragAndDrop="true"
        cssClass="engineering-schedule"
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

    <!-- Add Task Dialog -->
    <Dialog 
      v-model:visible="showAddTaskDialog" 
      :style="{ width: '600px' }" 
      modal 
      header="Add New Task"
      :closable="true"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-1 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Task Title</label>
            <InputText v-model="newTask.title" class="w-full" placeholder="Enter task title" />
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Activity Category</label>
            <Select 
              v-model="newTask.type" 
              :options="taskTypeOptions" 
              optionLabel="label" 
              optionValue="value"
              class="w-full"
              @change="newTask.subcategory = ''"
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
              v-model="newTask.subcategory" 
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
              v-model="newTask.priority" 
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
              v-model="newTask.startTime" 
              showTime 
              hourFormat="12"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">End Date & Time</label>
            <DatePicker 
              v-model="newTask.endTime" 
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
              v-model="newTask.impact" 
              :options="impactOptions" 
              optionLabel="label" 
              optionValue="value"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Estimated Hours</label>
            <InputNumber 
              v-model="newTask.estimatedHours" 
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
              v-model="newTask.engineerId" 
              :options="engineerOptions.filter(e => e.value !== 'all')" 
              optionLabel="label" 
              optionValue="value"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Related Ticket</label>
            <Select 
              v-model="newTask.ticketId" 
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
              v-model="newTask.maintenanceWindow" 
              inputId="maintenanceWindow" 
              binary 
            />
            <label for="maintenanceWindow" class="text-sm font-medium">
              Requires Maintenance Window
            </label>
          </div>
          <div class="flex items-center gap-3">
            <Checkbox 
              v-model="newTask.customerFacing" 
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
          <Textarea v-model="newTask.description" rows="3" class="w-full" />
        </div>
      </div>
      
      <template #footer>
        <Button label="Cancel" @click="showAddTaskDialog = false" text />
        <Button 
          label="Create Task" 
          @click="createTask" 
          :loading="isCreatingTask"
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
import { ref, onMounted, computed, watch, provide } from 'vue'
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

// Store and utilities
const router = useRouter()
const engineeringStore = useEngineeringStore()
const toast = useToast()

// Refs
const scheduleObj = ref(null)
const isLoading = ref(false)
const isCreatingTask = ref(false)
const showAddTaskDialog = ref(false)
const showEventDialog = ref(false)
const selectedEvent = ref(null)

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

// New task form
const newTask = ref({
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
  if (!newTask.value.type || !engineeringEventTypes.value[newTask.value.type]) {
    return []
  }
  return engineeringEventTypes.value[newTask.value.type].subcategories.map(sub => ({
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
  }
})

// Flatten for dropdown options
const taskTypeOptions = computed(() => {
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

// Ticket options for task creation
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
  ignoreWhitespace: false
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
    'administrative': '📋'
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
    if (eventData.TicketNumber) {
      metadata.innerHTML = `#${eventData.TicketNumber}`
    }
    
  } else {
    eventElement.classList.add('manual-event')
    
    // Get event type info
    const eventType = eventData.Category || 'administrative'
    const eventTypeInfo = engineeringEventTypes.value[eventType]
    
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
        'tools': '🛠️'
      }
      eventIcon = iconMap[eventIcon] || '📋'
      eventTypeLabel = eventTypeInfo.label
    } else {
      eventIcon = '📋'
      eventTypeLabel = 'Task'
    }
    
    // Get clean title
    const cleanTitle = eventData.Subject.replace(/^[🔧🚀👥📝🎓📈⚙️🛠️📋]\s*/, '')
    title.textContent = cleanTitle
    
    // Add task-specific metadata
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
    priorityDot.title = `${eventData.Priority} Priority`
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
  
  // Add time info as tooltip
  eventElement.title = `${eventData.Subject}\n${timeString}\n${assignedTo ? 'Assigned to: ' + assignedTo : 'Unassigned'}`
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
  // Handle CRUD operations
  if (args.requestType === 'eventCreate') {
    args.cancel = true // Cancel default creation, we handle it manually
  } else if (args.requestType === 'eventChange') {
    args.cancel = true // Cancel default edit
    
    try {
      const eventData = {
        subject: args.data.Subject,
        description: args.data.Description || '',
        start_time: args.data.StartTime.toISOString(),
        end_time: args.data.EndTime.toISOString(),
        event_type: args.data.Category || 'task',
        assigned_engineer: args.data.EngineerName || null,
        related_ticket_id: args.data.TicketId || null,
        location: args.data.Location || '',
        is_all_day: args.data.IsAllDay || false
      }
      
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
    args.cancel = true // Cancel default deletion
    
    try {
      await engineeringStore.deleteCalendarEvent(args.data.Id)
      
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
      detail: 'Task created successfully',
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

const createTask = async () => {
  if (!newTask.value.title || !newTask.value.startTime || !newTask.value.endTime) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please fill in all required fields',
      life: 3000
    })
    return
  }
  
  isCreatingTask.value = true
  try {
    // Create event data for backend
    const eventData = {
      subject: newTask.value.title,
      description: newTask.value.description,
      start_time: newTask.value.startTime.toISOString(),
      end_time: newTask.value.endTime.toISOString(),
      event_type: newTask.value.type,
      subcategory: newTask.value.subcategory,
      priority: newTask.value.priority,
      impact: newTask.value.impact,
      estimated_hours: newTask.value.estimatedHours,
      maintenance_window: newTask.value.maintenanceWindow,
      customer_facing: newTask.value.customerFacing,
      assigned_engineer: newTask.value.engineerId !== 'all' ? newTask.value.engineerId : null,
      related_ticket_id: newTask.value.ticketId || null,
      location: '',
      is_all_day: false
    }
    
    // Call backend API to create the event
    await engineeringStore.createCalendarEvent(eventData)
    
    // Reset form
    newTask.value = {
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
    
    showAddTaskDialog.value = false
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Task created successfully',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to create task',
      life: 3000
    })
  } finally {
    isCreatingTask.value = false
  }
}

const editEvent = () => {
  console.log('Edit event:', selectedEvent.value)
  showEventDialog.value = false
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

// Provide Syncfusion modules
provide('schedule', [Day, Week, WorkWeek, Month, Agenda, TimelineViews, Resize, DragAndDrop])
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

/* Enhanced Event Card Styling */
:deep(.engineering-schedule .e-appointment) {
  border-radius: 8px;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  padding: 0;
  min-height: 60px;
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