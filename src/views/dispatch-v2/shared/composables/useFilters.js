import { ref, computed, watch } from 'vue'

export function useFilters(initialFilters = {}) {
  const filters = ref({
    search: '',
    dateRange: null,
    status: [],
    priority: [],
    customer: [],
    project: [],
    technician: [],
    location: [],
    ...initialFilters
  })

  const activeFiltersCount = computed(() => {
    let count = 0
    
    if (filters.value.search?.trim()) count++
    if (filters.value.dateRange?.length === 2) count++
    if (filters.value.status?.length > 0) count++
    if (filters.value.priority?.length > 0) count++
    if (filters.value.customer?.length > 0) count++
    if (filters.value.project?.length > 0) count++
    if (filters.value.technician?.length > 0) count++
    if (filters.value.location?.length > 0) count++
    
    return count
  })

  const hasActiveFilters = computed(() => activeFiltersCount.value > 0)

  const filterParams = computed(() => {
    const params = {}
    
    if (filters.value.search?.trim()) {
      params.search = filters.value.search.trim()
    }
    
    if (filters.value.dateRange?.length === 2) {
      params.startDate = filters.value.dateRange[0]
      params.endDate = filters.value.dateRange[1]
    }
    
    if (filters.value.status?.length > 0) {
      params.status = filters.value.status
    }
    
    if (filters.value.priority?.length > 0) {
      params.priority = filters.value.priority
    }
    
    if (filters.value.customer?.length > 0) {
      params.customer = filters.value.customer
    }
    
    if (filters.value.project?.length > 0) {
      params.project = filters.value.project
    }
    
    if (filters.value.technician?.length > 0) {
      params.technician = filters.value.technician
    }
    
    if (filters.value.location?.length > 0) {
      params.location = filters.value.location
    }
    
    return params
  })

  const setFilter = (key, value) => {
    filters.value[key] = value
  }

  const clearFilter = (key) => {
    if (Array.isArray(filters.value[key])) {
      filters.value[key] = []
    } else {
      filters.value[key] = null
    }
  }

  const clearAllFilters = () => {
    filters.value = {
      search: '',
      dateRange: null,
      status: [],
      priority: [],
      customer: [],
      project: [],
      technician: [],
      location: []
    }
  }

  const setDateRange = (start, end) => {
    filters.value.dateRange = start && end ? [start, end] : null
  }

  const setQuickDateFilter = (days) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setDateRange(start, end)
  }

  const toggleArrayFilter = (key, value) => {
    const currentValues = filters.value[key] || []
    const index = currentValues.indexOf(value)
    
    if (index > -1) {
      filters.value[key] = currentValues.filter(v => v !== value)
    } else {
      filters.value[key] = [...currentValues, value]
    }
  }

  const isFilterActive = (key, value) => {
    if (Array.isArray(filters.value[key])) {
      return filters.value[key].includes(value)
    }
    return filters.value[key] === value
  }

  // Debounced search
  const debouncedSearch = ref('')
  let searchTimeout = null

  watch(() => filters.value?.search, (newValue) => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      debouncedSearch.value = newValue || ''
    }, 300)
  }, { immediate: true })

  return {
    filters,
    activeFiltersCount,
    hasActiveFilters,
    filterParams,
    debouncedSearch,
    setFilter,
    clearFilter,
    clearAllFilters,
    setDateRange,
    setQuickDateFilter,
    toggleArrayFilter,
    isFilterActive
  }
} 