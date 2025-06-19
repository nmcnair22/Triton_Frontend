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
        :cellClick="onCellClick"
        :eventClick="onEventClick"
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
      :style="{ width: '500px' }" 
      modal 
      :header="selectedEvent?.Subject || 'Event Details'"
      :closable="true"
    >
      <div v-if="selectedEvent" class="space-y-4">
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
      
      <template #footer>
        <Button 
          v-if="selectedEvent?.TicketId" 
          label="View Ticket" 
          @click="viewTicket(selectedEvent.TicketId)" 
          outlined 
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
const calendarHeight = ref('700px')
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
  slotCount: 1
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
  }
}))

// Get calendar events from store (includes both real events and ticket deadlines)
const calendarEvents = computed(() => {
  // Ensure we have an array to work with
  const storeEvents = engineeringStore.calendarEvents || []
  let events = Array.isArray(storeEvents) ? [...storeEvents] : []
  
  // Filter by selected engineer if not 'all'
  if (selectedEngineer.value !== 'all') {
    events = events.filter(event => 
      event.EngineerName === selectedEngineer.value || 
      event.assigned_engineer === selectedEngineer.value
    )
  }
  
  // Apply color coding based on event type and priority
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
    
    return {
      ...event,
      CategoryColor: finalColor,
      // Add display text for better event info
      Subject: event.Subject || event.subject,
      Category: eventType,
      Priority: priority,
      Subcategory: event.subcategory,
      Impact: event.impact,
      EstimatedHours: event.estimated_hours,
      MaintenanceWindow: event.maintenance_window,
      CustomerFacing: event.customer_facing
    }
  })
  
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

// Event handlers
const onViewChange = () => {
  currentView.value = selectedView.value
}

const onEngineerChange = () => {
  // Events will be filtered automatically through computed property
}

const onEventRendered = (args) => {
  // Customize event appearance based on category
  if (args.data.Category === 'Overdue') {
    args.element.classList.add('overdue-event')
  } else if (args.data.Category === 'Due Today') {
    args.element.classList.add('due-today-event')
  }
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
    await Promise.all([
      engineeringStore.fetchCalendarEvents(),
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

/* Custom event styles */
:deep(.overdue-event) {
  background: linear-gradient(135deg, #ef4444, #dc2626) !important;
  border-color: #dc2626 !important;
  color: white !important;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3) !important;
}

:deep(.due-today-event) {
  background: linear-gradient(135deg, #f97316, #ea580c) !important;
  border-color: #ea580c !important;
  color: white !important;
  box-shadow: 0 2px 4px rgba(249, 115, 22, 0.3) !important;
}

/* Schedule component styling */
:deep(.engineering-schedule) {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
  border-radius: 12px !important;
  overflow: hidden !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
}

:deep(.engineering-schedule .e-schedule-toolbar) {
  background: var(--surface-0) !important;
  border-bottom: 1px solid var(--surface-200) !important;
  padding: 12px 16px !important;
  border-radius: 12px 12px 0 0 !important;
}

:deep(.engineering-schedule .e-toolbar-item) {
  margin: 0 4px !important;
}

:deep(.engineering-schedule .e-toolbar-item .e-btn) {
  border-radius: 6px !important;
  font-weight: 500 !important;
  transition: all 0.2s ease !important;
}

:deep(.engineering-schedule .e-toolbar-item .e-btn:hover) {
  background: var(--primary-100) !important;
  color: var(--primary-700) !important;
}

:deep(.engineering-schedule .e-toolbar-item .e-btn.e-active) {
  background: var(--primary-500) !important;
  color: white !important;
  box-shadow: 0 2px 4px rgba(var(--primary-500), 0.3) !important;
}

/* Calendar header styling */
:deep(.engineering-schedule .e-date-header-wrap) {
  background: var(--surface-50) !important;
  border-bottom: 1px solid var(--surface-200) !important;
}

:deep(.engineering-schedule .e-header-cells) {
  background: var(--surface-50) !important;
  color: var(--surface-700) !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  font-size: 0.75rem !important;
  letter-spacing: 0.05em !important;
  padding: 12px 8px !important;
}

/* Time column styling */
:deep(.engineering-schedule .e-time-cells) {
  background: var(--surface-25) !important;
  color: var(--surface-600) !important;
  font-size: 0.875rem !important;
  font-weight: 500 !important;
  border-right: 1px solid var(--surface-200) !important;
}

/* Work hours highlighting */
:deep(.engineering-schedule .e-work-hours) {
  background: rgba(59, 130, 246, 0.05) !important;
}

/* Cell styling */
:deep(.engineering-schedule .e-work-cells) {
  border: 1px solid var(--surface-100) !important;
  transition: background-color 0.2s ease !important;
}

:deep(.engineering-schedule .e-work-cells:hover) {
  background: var(--surface-50) !important;
}

/* Appointment/Event styling */
:deep(.engineering-schedule .e-appointment) {
  border-radius: 8px !important;
  font-weight: 500 !important;
  font-size: 0.875rem !important;
  padding: 4px 8px !important;
  margin: 1px !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
  border: none !important;
  transition: all 0.2s ease !important;
}

:deep(.engineering-schedule .e-appointment:hover) {
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
}

/* Today highlighting */
:deep(.engineering-schedule .e-other-month) {
  color: var(--surface-400) !important;
  background: var(--surface-25) !important;
}

:deep(.engineering-schedule .e-current-day) {
  background: rgba(59, 130, 246, 0.1) !important;
}

/* Month view specific styling */
:deep(.engineering-schedule .e-month-view .e-work-cells) {
  min-height: 100px !important;
  padding: 4px !important;
}

:deep(.engineering-schedule .e-month-view .e-date-header) {
  color: var(--surface-700) !important;
  font-weight: 600 !important;
  font-size: 0.875rem !important;
}

/* Week view specific styling */
:deep(.engineering-schedule .e-week-view .e-work-cells) {
  min-height: 50px !important;
}

/* Agenda view styling */
:deep(.engineering-schedule .e-agenda-view) {
  background: var(--surface-0) !important;
}

:deep(.engineering-schedule .e-agenda-view .e-appointment) {
  background: var(--surface-50) !important;
  border-left: 4px solid var(--primary-500) !important;
  border-radius: 0 6px 6px 0 !important;
  margin: 2px 0 !important;
  padding: 8px 12px !important;
}

/* Popup styling */
:deep(.e-schedule-dialog) {
  border-radius: 12px !important;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
}

:deep(.e-schedule-dialog .e-dlg-header) {
  background: var(--surface-0) !important;
  border-bottom: 1px solid var(--surface-200) !important;
  border-radius: 12px 12px 0 0 !important;
  padding: 16px 20px !important;
}

/* Dark mode adjustments */
:deep(.app-dark .engineering-schedule) {
  background: var(--surface-900) !important;
}

:deep(.app-dark .engineering-schedule .e-schedule-toolbar) {
  background: var(--surface-800) !important;
  border-bottom-color: var(--surface-700) !important;
}

:deep(.app-dark .engineering-schedule .e-header-cells) {
  background: var(--surface-800) !important;
  color: var(--surface-200) !important;
}

:deep(.app-dark .engineering-schedule .e-time-cells) {
  background: var(--surface-850) !important;
  color: var(--surface-300) !important;
  border-right-color: var(--surface-700) !important;
}

:deep(.app-dark .engineering-schedule .e-work-cells) {
  border-color: var(--surface-700) !important;
  background: var(--surface-900) !important;
}

:deep(.app-dark .engineering-schedule .e-work-cells:hover) {
  background: var(--surface-800) !important;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .engineering-calendar {
    padding: 1rem;
  }
  
  :deep(.engineering-schedule) {
    height: 600px !important;
  }
  
  :deep(.engineering-schedule .e-toolbar-item .e-btn) {
    padding: 6px 8px !important;
    font-size: 0.875rem !important;
  }
  
  :deep(.engineering-schedule .e-header-cells) {
    padding: 8px 4px !important;
    font-size: 0.75rem !important;
  }
}

@media (max-width: 480px) {
  .engineering-calendar {
    padding: 0.5rem;
  }
  
  :deep(.engineering-schedule) {
    height: 500px !important;
  }
  
  :deep(.engineering-schedule .e-month-view .e-work-cells) {
    min-height: 80px !important;
  }
}
</style> 