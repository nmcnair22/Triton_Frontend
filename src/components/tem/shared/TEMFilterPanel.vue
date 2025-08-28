<template>
  <div class="tem-filter-panel">
    <!-- Panel Header -->
    <div class="panel-header">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-800">Filters</h3>
        <div class="flex items-center gap-2">
          <Badge 
            v-if="activeFilterCount > 0" 
            :value="activeFilterCount" 
            severity="info"
            class="mr-2"
          />
          <Button
            icon="pi pi-refresh"
            outlined
            size="small"
            @click="resetFilters"
            v-tooltip.top="'Reset filters'"
          />
          <Button
            :icon="collapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up'"
            text
            size="small"
            @click="collapsed = !collapsed"
          />
        </div>
      </div>
    </div>

    <!-- Panel Content -->
    <div v-if="!collapsed" class="panel-content">
      <!-- Quick Filter Chips -->
      <div v-if="quickFilters.length > 0" class="quick-filters mb-4">
        <div class="flex flex-wrap gap-2">
          <Button
            v-for="filter in quickFilters"
            :key="filter.key"
            :label="filter.label"
            :icon="filter.icon"
            :severity="isQuickFilterActive(filter.key) ? 'primary' : 'secondary'"
            :outlined="!isQuickFilterActive(filter.key)"
            size="small"
            @click="toggleQuickFilter(filter.key)"
          />
        </div>
      </div>

      <!-- Filter Sections -->
      <Accordion v-if="filterSections.length > 0" :activeIndex="openSections">
        <AccordionTab
          v-for="section in filterSections"
          :key="section.key"
          :header="section.title"
        >
          <template #header>
            <div class="flex items-center justify-between w-full mr-4">
              <span>{{ section.title }}</span>
              <Badge 
                v-if="getSectionActiveCount(section.key) > 0"
                :value="getSectionActiveCount(section.key)"
                severity="info"
                size="small"
              />
            </div>
          </template>
          
          <div class="filter-section-content">
            <!-- Date Range Filter -->
            <div v-if="section.key === 'date'" class="filter-group">
              <label class="filter-label">Date Range</label>
              <DatePicker
                v-model="filters.dateRange"
                selectionMode="range"
                :showButtonBar="true"
                dateFormat="mm/dd/yy"
                placeholder="Select date range"
                class="w-full"
                @date-select="onFilterChange"
              />
              
              <div class="quick-date-options mt-2">
                <div class="flex flex-wrap gap-2">
                  <Button
                    v-for="preset in datePresets"
                    :key="preset.key"
                    :label="preset.label"
                    outlined
                    size="small"
                    @click="applyDatePreset(preset)"
                  />
                </div>
              </div>
            </div>

            <!-- Status Filter -->
            <div v-else-if="section.key === 'status'" class="filter-group">
              <label class="filter-label">Status</label>
              <div class="status-options">
                <div 
                  v-for="status in statusOptions"
                  :key="status.value"
                  class="flex items-center mb-2"
                >
                  <Checkbox
                    v-model="filters.status"
                    :inputId="`status-${status.value}`"
                    :value="status.value"
                    @change="onFilterChange"
                  />
                  <label 
                    :for="`status-${status.value}`"
                    class="ml-2 flex items-center gap-2 cursor-pointer"
                  >
                    <Badge 
                      :value="status.label"
                      :severity="status.severity || 'info'"
                      class="text-xs"
                    />
                    <span v-if="status.count !== undefined" class="text-sm text-gray-500">
                      ({{ status.count }})
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Amount Range Filter -->
            <div v-else-if="section.key === 'amount'" class="filter-group">
              <label class="filter-label">Amount Range</label>
              <div class="amount-inputs">
                <div class="flex gap-2 mb-2">
                  <InputNumber
                    v-model="filters.amountMin"
                    placeholder="Min amount"
                    mode="currency"
                    currency="USD"
                    locale="en-US"
                    @input="onFilterChange"
                    class="flex-1"
                  />
                  <InputNumber
                    v-model="filters.amountMax"
                    placeholder="Max amount"
                    mode="currency"
                    currency="USD"
                    locale="en-US"
                    @input="onFilterChange"
                    class="flex-1"
                  />
                </div>
                
                <!-- Amount range slider -->
                <Slider
                  v-if="amountRange"
                  v-model="amountSliderValue"
                  :min="amountRange.min"
                  :max="amountRange.max"
                  :step="amountRange.step || 100"
                  range
                  class="mt-3"
                  @slideend="onAmountSliderChange"
                />
              </div>
            </div>

            <!-- Provider Filter -->
            <div v-else-if="section.key === 'provider'" class="filter-group">
              <label class="filter-label">Provider</label>
              <MultiSelect
                v-model="filters.providers"
                :options="providerOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select providers"
                class="w-full"
                :filter="true"
                @change="onFilterChange"
              >
                <template #option="{ option }">
                  <div class="flex items-center justify-between w-full">
                    <span>{{ option.label }}</span>
                    <span v-if="option.count !== undefined" class="text-sm text-gray-500">
                      {{ option.count }}
                    </span>
                  </div>
                </template>
              </MultiSelect>
            </div>

            <!-- Customer Filter -->
            <div v-else-if="section.key === 'customer'" class="filter-group">
              <label class="filter-label">Customer</label>
              <MultiSelect
                v-model="filters.customers"
                :options="customerOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select customers"
                class="w-full"
                :filter="true"
                @change="onFilterChange"
              />
            </div>

            <!-- Location Filter -->
            <div v-else-if="section.key === 'location'" class="filter-group">
              <label class="filter-label">Location</label>
              <div class="location-filters">
                <MultiSelect
                  v-model="filters.locations"
                  :options="locationOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select locations"
                  class="w-full mb-3"
                  :filter="true"
                  @change="onFilterChange"
                />
                
                <!-- Geographic filters -->
                <div class="grid grid-cols-2 gap-2">
                  <Select
                    v-model="filters.state"
                    :options="stateOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="State"
                    @change="onFilterChange"
                  />
                  <Select
                    v-model="filters.city"
                    :options="cityOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="City"
                    @change="onFilterChange"
                  />
                </div>
              </div>
            </div>

            <!-- Custom filter section -->
            <div v-else-if="section.slot">
              <slot 
                :name="section.slot" 
                :filters="filters" 
                :onFilterChange="onFilterChange"
              ></slot>
            </div>
          </div>
        </AccordionTab>
      </Accordion>

      <!-- Saved Filters -->
      <div v-if="enableSavedFilters && savedFilters.length > 0" class="saved-filters mt-4">
        <div class="flex items-center justify-between mb-2">
          <label class="filter-label">Saved Filters</label>
          <Button
            icon="pi pi-bookmark"
            label="Save Current"
            outlined
            size="small"
            @click="$emit('save-filter', filters)"
          />
        </div>
        
        <Select
          v-model="selectedSavedFilter"
          :options="savedFilters"
          optionLabel="name"
          placeholder="Choose saved filter"
          class="w-full"
          @change="applySavedFilter"
        >
          <template #option="{ option }">
            <div class="flex items-center justify-between w-full">
              <span>{{ option.name }}</span>
              <Button
                icon="pi pi-trash"
                text
                size="small"
                severity="danger"
                @click.stop="$emit('delete-saved-filter', option)"
              />
            </div>
          </template>
        </Select>
      </div>

      <!-- Filter Summary and Actions -->
      <div class="filter-actions mt-4 pt-4 border-t border-gray-200">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-600">
            {{ activeFilterCount }} filter{{ activeFilterCount === 1 ? '' : 's' }} applied
          </div>
          <div class="flex gap-2">
            <Button
              label="Clear All"
              outlined
              size="small"
              @click="clearAllFilters"
              :disabled="activeFilterCount === 0"
            />
            <Button
              label="Apply"
              size="small"
              @click="$emit('apply-filters', filters)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import Accordion from 'primevue/accordion';
import AccordionTab from 'primevue/accordiontab';
import Button from 'primevue/button';
import Badge from 'primevue/badge';
import DatePicker from 'primevue/datepicker';
import Checkbox from 'primevue/checkbox';
import InputNumber from 'primevue/inputnumber';
import MultiSelect from 'primevue/multiselect';
import Select from 'primevue/select';
import Slider from 'primevue/slider';

// Props
const props = defineProps({
  filterSections: {
    type: Array,
    default: () => [
      { key: 'date', title: 'Date Range' },
      { key: 'status', title: 'Status' },
      { key: 'amount', title: 'Amount' },
      { key: 'provider', title: 'Provider' },
      { key: 'customer', title: 'Customer' }
    ]
  },
  quickFilters: {
    type: Array,
    default: () => []
  },
  statusOptions: {
    type: Array,
    default: () => []
  },
  providerOptions: {
    type: Array,
    default: () => []
  },
  customerOptions: {
    type: Array,
    default: () => []
  },
  locationOptions: {
    type: Array,
    default: () => []
  },
  stateOptions: {
    type: Array,
    default: () => []
  },
  cityOptions: {
    type: Array,
    default: () => []
  },
  amountRange: {
    type: Object,
    default: () => ({ min: 0, max: 10000, step: 100 })
  },
  enableSavedFilters: {
    type: Boolean,
    default: false
  },
  savedFilters: {
    type: Array,
    default: () => []
  },
  initialFilters: {
    type: Object,
    default: () => ({})
  }
});

// Emits
const emit = defineEmits([
  'filter-change',
  'apply-filters',
  'save-filter',
  'delete-saved-filter',
  'clear-filters'
]);

// State
const collapsed = ref(false);
const openSections = ref([0, 1]); // Default open sections
const selectedSavedFilter = ref(null);
const activeQuickFilters = ref([]);

const filters = ref({
  dateRange: null,
  status: [],
  amountMin: null,
  amountMax: null,
  providers: [],
  customers: [],
  locations: [],
  state: null,
  city: null,
  ...props.initialFilters
});

// Computed
const activeFilterCount = computed(() => {
  let count = 0;
  if (filters.value.dateRange) count++;
  if (filters.value.status?.length > 0) count++;
  if (filters.value.amountMin !== null || filters.value.amountMax !== null) count++;
  if (filters.value.providers?.length > 0) count++;
  if (filters.value.customers?.length > 0) count++;
  if (filters.value.locations?.length > 0) count++;
  if (filters.value.state) count++;
  if (filters.value.city) count++;
  count += activeQuickFilters.value.length;
  return count;
});

const amountSliderValue = computed({
  get() {
    return [
      filters.value.amountMin || props.amountRange.min,
      filters.value.amountMax || props.amountRange.max
    ];
  },
  set(value) {
    filters.value.amountMin = value[0];
    filters.value.amountMax = value[1];
  }
});

const datePresets = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7days', label: 'Last 7 days' },
  { key: 'last30days', label: 'Last 30 days' },
  { key: 'thisMonth', label: 'This month' },
  { key: 'lastMonth', label: 'Last month' }
];

// Methods
const onFilterChange = () => {
  emit('filter-change', {
    ...filters.value,
    quickFilters: activeQuickFilters.value
  });
};

const toggleQuickFilter = (filterKey) => {
  const index = activeQuickFilters.value.indexOf(filterKey);
  if (index > -1) {
    activeQuickFilters.value.splice(index, 1);
  } else {
    activeQuickFilters.value.push(filterKey);
  }
  onFilterChange();
};

const isQuickFilterActive = (filterKey) => {
  return activeQuickFilters.value.includes(filterKey);
};

const getSectionActiveCount = (sectionKey) => {
  switch (sectionKey) {
    case 'date':
      return filters.value.dateRange ? 1 : 0;
    case 'status':
      return filters.value.status?.length || 0;
    case 'amount':
      return (filters.value.amountMin !== null || filters.value.amountMax !== null) ? 1 : 0;
    case 'provider':
      return filters.value.providers?.length || 0;
    case 'customer':
      return filters.value.customers?.length || 0;
    case 'location':
      let locationCount = filters.value.locations?.length || 0;
      if (filters.value.state) locationCount++;
      if (filters.value.city) locationCount++;
      return locationCount;
    default:
      return 0;
  }
};

const applyDatePreset = (preset) => {
  const now = new Date();
  let startDate, endDate;
  
  switch (preset.key) {
    case 'today':
      startDate = endDate = new Date(now);
      break;
    case 'yesterday':
      startDate = endDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'last7days':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = new Date(now);
      break;
    case 'last30days':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      endDate = new Date(now);
      break;
    case 'thisMonth':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now);
      break;
    case 'lastMonth':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
  }
  
  filters.value.dateRange = [startDate, endDate];
  onFilterChange();
};

const onAmountSliderChange = (value) => {
  filters.value.amountMin = value[0];
  filters.value.amountMax = value[1];
  onFilterChange();
};

const applySavedFilter = (event) => {
  if (!event.value) return;
  
  const savedFilter = event.value;
  filters.value = { ...savedFilter.filters };
  activeQuickFilters.value = savedFilter.quickFilters || [];
  
  onFilterChange();
};

const clearAllFilters = () => {
  filters.value = {
    dateRange: null,
    status: [],
    amountMin: null,
    amountMax: null,
    providers: [],
    customers: [],
    locations: [],
    state: null,
    city: null
  };
  activeQuickFilters.value = [];
  selectedSavedFilter.value = null;
  
  emit('clear-filters');
  onFilterChange();
};

const resetFilters = () => {
  clearAllFilters();
};

// Watch for external filter updates
watch(() => props.initialFilters, (newFilters) => {
  if (newFilters) {
    filters.value = { ...filters.value, ...newFilters };
  }
}, { deep: true });
</script>

<style scoped>
.tem-filter-panel {
  background: white;
  border-radius: 8px;
  border: 1px solid var(--surface-border);
  overflow: hidden;
}

.panel-header {
  padding: 1rem;
  background: var(--surface-50);
  border-bottom: 1px solid var(--surface-border);
}

.panel-content {
  padding: 1rem;
}

.filter-section-content {
  padding: 0.5rem 0;
}

.filter-group {
  margin-bottom: 1rem;
}

.filter-label {
  display: block;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.quick-filters {
  padding: 0.75rem;
  background: var(--surface-50);
  border-radius: 6px;
}

.quick-date-options {
  padding-top: 0.5rem;
  border-top: 1px solid var(--surface-border);
}

.status-options {
  max-height: 200px;
  overflow-y: auto;
}

.amount-inputs .p-slider {
  margin-top: 0.5rem;
}

.location-filters .grid {
  margin-top: 0.5rem;
}

.saved-filters {
  padding: 0.75rem;
  background: var(--surface-50);
  border-radius: 6px;
}

.filter-actions {
  background: var(--surface-50);
  margin: 1rem -1rem -1rem -1rem;
  padding: 1rem;
}

/* Accordion customization */
:deep(.p-accordion .p-accordion-header-link) {
  padding: 0.75rem 1rem;
}

:deep(.p-accordion .p-accordion-content) {
  padding: 0.75rem 1rem;
}
</style>