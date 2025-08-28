<template>
  <div class="tem-search-bar">
    <div class="search-container">
      <!-- Main search input with autocomplete -->
      <div class="search-input-wrapper">
        <AutoComplete
          v-model="searchQuery"
          :suggestions="suggestions"
          @complete="onSearch"
          @item-select="onSearchSelect"
          @keyup.enter="performSearch"
          :placeholder="placeholder"
          :completeOnFocus="true"
          :delay="300"
          optionLabel="label"
          class="w-full"
        >
          <template #option="{ option }">
            <div class="flex items-center gap-2 p-2">
              <i :class="getTypeIcon(option.type)" class="text-gray-500"></i>
              <div>
                <div class="font-medium">{{ option.label }}</div>
                <div class="text-sm text-gray-500">{{ option.subtitle }}</div>
              </div>
            </div>
          </template>
        </AutoComplete>
        
        <Button
          icon="pi pi-search"
          class="search-button"
          @click="performSearch"
          :loading="searching"
        />
      </div>

      <!-- Quick filters -->
      <div v-if="quickFilters.length > 0" class="quick-filters">
        <Button
          v-for="filter in quickFilters"
          :key="filter.key"
          :label="filter.label"
          :icon="filter.icon"
          :severity="activeFilters.includes(filter.key) ? 'primary' : 'secondary'"
          :outlined="!activeFilters.includes(filter.key)"
          size="small"
          @click="toggleQuickFilter(filter.key)"
        />
      </div>
    </div>

    <!-- Advanced filters panel -->
    <div v-if="showAdvancedFilters" class="advanced-filters mt-4 p-4 bg-gray-50 rounded-lg">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Date range filter -->
        <div v-if="enableDateFilter" class="filter-group">
          <label class="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
          <DatePicker
            v-model="filters.dateRange"
            selectionMode="range"
            :showButtonBar="true"
            dateFormat="mm/dd/yy"
            placeholder="Select date range"
            class="w-full"
            @date-select="updateFilters"
          />
        </div>

        <!-- Status filter -->
        <div v-if="statusOptions.length > 0" class="filter-group">
          <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <MultiSelect
            v-model="filters.status"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select statuses"
            class="w-full"
            @change="updateFilters"
          />
        </div>

        <!-- Amount range filter -->
        <div v-if="enableAmountFilter" class="filter-group">
          <label class="block text-sm font-medium text-gray-700 mb-2">Amount Range</label>
          <div class="flex gap-2">
            <InputNumber
              v-model="filters.amountMin"
              placeholder="Min"
              mode="currency"
              currency="USD"
              locale="en-US"
              @input="updateFilters"
              class="flex-1"
            />
            <InputNumber
              v-model="filters.amountMax"
              placeholder="Max"
              mode="currency"
              currency="USD"
              locale="en-US"
              @input="updateFilters"
              class="flex-1"
            />
          </div>
        </div>

        <!-- Custom filter slots -->
        <slot name="filters" :filters="filters" :updateFilters="updateFilters"></slot>
      </div>

      <!-- Filter actions -->
      <div class="flex justify-between items-center mt-4">
        <div class="text-sm text-gray-600">
          {{ activeFilterCount }} filter{{ activeFilterCount === 1 ? '' : 's' }} applied
        </div>
        <div class="flex gap-2">
          <Button
            label="Clear All"
            outlined
            size="small"
            @click="clearAllFilters"
          />
          <Button
            label="Save Filter"
            outlined
            size="small"
            @click="$emit('save-filter', filters)"
            v-if="enableSavedFilters"
          />
        </div>
      </div>
    </div>

    <!-- Filter toggle and saved filters -->
    <div class="search-actions mt-3 flex justify-between items-center">
      <div class="flex items-center gap-2">
        <Button
          :label="showAdvancedFilters ? 'Hide Filters' : 'Show Filters'"
          :icon="showAdvancedFilters ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
          text
          size="small"
          @click="showAdvancedFilters = !showAdvancedFilters"
        />
        
        <div v-if="savedFilters.length > 0" class="saved-filters">
          <Select
            v-model="selectedSavedFilter"
            :options="savedFilters"
            optionLabel="name"
            placeholder="Saved filters"
            @change="applySavedFilter"
            class="w-40"
          />
        </div>
      </div>

      <!-- Search results info -->
      <div v-if="resultCount !== null" class="text-sm text-gray-600">
        {{ resultCount }} result{{ resultCount === 1 ? '' : 's' }} found
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { temClient } from '@/services/tem/temClient';
import AutoComplete from 'primevue/autocomplete';
import Button from 'primevue/button';
import DatePicker from 'primevue/datepicker';
import MultiSelect from 'primevue/multiselect';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';

// Props
const props = defineProps({
  placeholder: {
    type: String,
    default: 'Search customers, locations, accounts...'
  },
  quickFilters: {
    type: Array,
    default: () => []
  },
  statusOptions: {
    type: Array,
    default: () => []
  },
  enableDateFilter: {
    type: Boolean,
    default: true
  },
  enableAmountFilter: {
    type: Boolean,
    default: true
  },
  enableSavedFilters: {
    type: Boolean,
    default: false
  },
  savedFilters: {
    type: Array,
    default: () => []
  },
  resultCount: {
    type: Number,
    default: null
  },
  initialFilters: {
    type: Object,
    default: () => ({})
  }
});

// Emits
const emit = defineEmits([
  'search',
  'filter-change', 
  'save-filter',
  'apply-saved-filter',
  'clear-filters'
]);

// State
const searchQuery = ref('');
const suggestions = ref([]);
const searching = ref(false);
const showAdvancedFilters = ref(false);
const activeFilters = ref([]);
const selectedSavedFilter = ref(null);

const filters = ref({
  dateRange: null,
  status: [],
  amountMin: null,
  amountMax: null,
  ...props.initialFilters
});

// Computed
const activeFilterCount = computed(() => {
  let count = 0;
  if (filters.value.dateRange) count++;
  if (filters.value.status?.length > 0) count++;
  if (filters.value.amountMin !== null) count++;
  if (filters.value.amountMax !== null) count++;
  count += activeFilters.value.length;
  return count;
});

// Methods
const onSearch = async (event) => {
  if (!event.query?.trim()) return;
  
  searching.value = true;
  try {
    const searchTerm = event.query.trim();
    suggestions.value = [];
    
    // Search customers
    try {
      const customerResponse = await temClient.searchCustomers(searchTerm);
      const customerData = customerResponse.data.data || customerResponse.data || [];
      
      const customerSuggestions = customerData.map(customer => ({
        label: customer.name,
        subtitle: `Customer • ${customer.abbreviation || ''}`,
        type: 'customer',
        value: customer.name,
        id: customer.id
      }));
      
      suggestions.value = [...suggestions.value, ...customerSuggestions];
    } catch (error) {
      console.warn('Customer search failed:', error.message);
    }
    
    // Search bills/invoices
    try {
      const billResponse = await temClient.searchBills(searchTerm);
      const billData = billResponse.data.data || billResponse.data || [];
      
      const billSuggestions = billData.map(bill => ({
        label: bill.invoice_number || `Bill #${bill.id}`,
        subtitle: `Invoice • ${bill.vendor_name || 'Unknown Vendor'}`,
        type: 'invoice',
        value: bill.invoice_number || bill.id,
        id: bill.id
      }));
      
      suggestions.value = [...suggestions.value, ...billSuggestions];
    } catch (error) {
      console.warn('Bill search failed:', error.message);
    }
    
    // If no results found, add general search option
    if (suggestions.value.length === 0) {
      suggestions.value = [{
        label: searchTerm,
        subtitle: 'Search all records',
        type: 'search',
        value: searchTerm
      }];
    }
    
  } catch (error) {
    console.error('Search error:', error);
    suggestions.value = [{
      label: event.query,
      subtitle: 'Search all records',
      type: 'search',
      value: event.query
    }];
  } finally {
    searching.value = false;
  }
};

const onSearchSelect = (event) => {
  performSearch(event.value.value, event.value.type);
};

const performSearch = (query = searchQuery.value, type = 'all') => {
  if (!query?.trim()) return;
  
  emit('search', {
    query: query.trim(),
    type,
    filters: filters.value
  });
};

const toggleQuickFilter = (filterKey) => {
  const index = activeFilters.value.indexOf(filterKey);
  if (index > -1) {
    activeFilters.value.splice(index, 1);
  } else {
    activeFilters.value.push(filterKey);
  }
  updateFilters();
};

const updateFilters = () => {
  const filterData = {
    ...filters.value,
    quickFilters: activeFilters.value,
    searchQuery: searchQuery.value
  };
  
  emit('filter-change', filterData);
};

const clearAllFilters = () => {
  searchQuery.value = '';
  activeFilters.value = [];
  filters.value = {
    dateRange: null,
    status: [],
    amountMin: null,
    amountMax: null
  };
  selectedSavedFilter.value = null;
  
  emit('clear-filters');
  emit('filter-change', filters.value);
};

const applySavedFilter = (event) => {
  if (!event.value) return;
  
  const savedFilter = event.value;
  filters.value = { ...savedFilter.filters };
  activeFilters.value = savedFilter.quickFilters || [];
  searchQuery.value = savedFilter.searchQuery || '';
  
  emit('apply-saved-filter', savedFilter);
  updateFilters();
};

const getTypeIcon = (type) => {
  switch (type) {
    case 'customer': return 'pi pi-building';
    case 'location': return 'pi pi-map-marker';
    case 'invoice': return 'pi pi-file-text';
    case 'account': return 'pi pi-credit-card';
    default: return 'pi pi-search';
  }
};

// Watch for external filter updates
watch(() => props.initialFilters, (newFilters) => {
  if (newFilters) {
    filters.value = { ...filters.value, ...newFilters };
  }
}, { deep: true });
</script>

<style scoped>
.tem-search-bar {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-button {
  flex-shrink: 0;
}

.quick-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.advanced-filters {
  border: 1px solid var(--surface-border);
  background: var(--surface-ground);
}

.filter-group {
  min-width: 0;
}

.filter-group label {
  font-weight: 600;
  color: var(--text-color);
}

.search-actions {
  border-top: 1px solid var(--surface-border);
  padding-top: 0.75rem;
}

.saved-filters {
  margin-left: 1rem;
}

@media (max-width: 768px) {
  .search-container {
    gap: 0.75rem;
  }
  
  .quick-filters {
    gap: 0.25rem;
  }
  
  .advanced-filters .grid {
    grid-template-columns: 1fr;
  }
}
</style>