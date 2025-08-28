# TEM Audit Frontend Documentation

## Overview

The TEM (Telecom Expense Management) Audit toolset is a comprehensive Vue 3 frontend application for managing telecom expense auditing, customer management, and location analysis. It provides detailed views of customer accounts, locations, orders, cancellations, and billing data with TEM integration capabilities.

## Architecture

### Tech Stack
- **Framework**: Vue 3.5.17 with Composition API
- **State Management**: Pinia 3.0.3
- **UI Components**: PrimeVue 4.3.5
- **Styling**: Tailwind CSS 3.4.7, SCSS
- **HTTP Client**: Axios 1.10.0
- **Routing**: Vue Router

### Directory Structure
```
src/
├── components/tem/
│   └── shared/
│       └── TEMDataTable.vue
├── services/tem/
│   └── temClient.js
├── stores/tem/
│   └── locationStore.js
├── views/tem/
│   ├── customers/
│   │   └── CustomerDetail.vue
│   └── locations/
│       └── LocationDetail.vue
└── router/
    └── temRoutes.js
```

## Components

### TEMDataTable.vue
**Purpose**: Reusable data table component for displaying TEM audit data

**Location**: `src/components/tem/shared/TEMDataTable.vue`

**Features**:
- Pagination with customizable rows per page (10, 25, 50, 100)
- Sorting on all columns
- Selection modes: single, multiple, or none
- Built-in loading states
- Export and refresh actions
- Bulk actions for selected rows
- Virtual scrolling for large datasets
- Responsive design

**Props**:
```javascript
{
  data: Array,           // Table data
  columns: Array,        // Column definitions
  loading: Boolean,      // Loading state
  paginator: Boolean,    // Enable pagination
  rows: Number,         // Rows per page (default: 25)
  totalRecords: Number, // Total record count
  lazy: Boolean,        // Lazy loading
  selection: Array,     // Selected rows
  selectionMode: String, // 'single', 'multiple', or null
  scrollable: Boolean,  // Enable scrolling
  scrollHeight: String, // Scroll container height
  resizable: Boolean,   // Resizable columns
  showHeader: Boolean,  // Show table header
  title: String,        // Table title
  showRefresh: Boolean, // Show refresh button
  showExport: Boolean,  // Show export button
  bulkActions: Array    // Bulk action definitions
}
```

**Column Types**:
- `currency`: Formatted currency display
- `date`: Formatted date display
- `status`: Status badge with severity colors
- `progress`: Progress bar
- `actions`: Action buttons
- `boolean`: Boolean value display

**Events**:
- `@page`: Pagination change
- `@sort`: Column sort
- `@selection-change`: Selection change
- `@refresh`: Refresh button clicked
- `@export`: Export button clicked
- `@action`: Row action clicked
- `@bulk-action`: Bulk action clicked

## Views

### CustomerDetail.vue
**Purpose**: Detailed view of TEM customer information

**Location**: `src/views/tem/customers/CustomerDetail.vue`

**Features**:
- Customer overview with key metrics
- Location listing with enhanced data
- Filtering and search capabilities
- Export functionality

### LocationDetail.vue
**Purpose**: Comprehensive location analysis and management

**Location**: `src/views/tem/locations/LocationDetail.vue`

**Features**:
- Location header with status indicators
- Account information display (single/multiple accounts)
- Billing timeline with interactive charts
- Orders and cancellations management with tabbed interface
- Time period filtering (6 months to 5 years)
- Detailed drawers for orders and cancellations
- Real-time data refresh

**Sections**:
1. **Page Header**: Location name, address, status badges, export button
2. **Account Information**: Account details, variance analysis
3. **Orders & Cancellations**: Tabbed interface with:
   - Summary metrics
   - Time period filters
   - Data tables with sorting/filtering
   - Detail drawers
4. **Bills & Trend Analysis**: 
   - Statistical overview
   - Interactive Chart.js charts
   - Recent bills listing

**Time Period Options**:
- 6 Months
- 12 Months (default)
- 2 Years (24 months)
- 3 Years (36 months)
- 5 Years (60 months)

## Services

### temClient.js
**Purpose**: Centralized API client for all TEM audit endpoints

**Location**: `src/services/tem/temClient.js`

**Base Configuration**:
```javascript
baseURL: process.env.VITE_API_BASE_URL + '/tem/audit'
timeout: 30000ms
```

**Customer Endpoints**:
```javascript
// Get customer list with filtering
getCustomers(filters)

// Get customer details
getCustomerDetail(customerId)

// Get customer locations
getCustomerLocations(customerId, filters)

// Get enhanced customer locations
getCustomerLocationsEnhanced(customerId, filters)
```

**Location Endpoints**:
```javascript
// Get location TEM accounts
getLocationTEMAccounts(customerId, locationId, filters)

// Get location bills timeline
getLocationTEMBillsTimeline(customerId, locationId, filters)

// Get location orders
getLocationTEMOrders(customerId, locationId, filters)

// Get location cancellations  
getLocationTEMCancellations(customerId, locationId, filters)
```

**Account Endpoints**:
```javascript
// Get account inventory
getAccounts(filters)

// Get account details
getAccountDetail(accountId)

// Get account bills
getAccountBills(accountId, filters)
```

**Billing Endpoints**:
```javascript
// Get bills with filtering
getBills(filters)

// Get bill details
getBillDetail(billId)

// Get billing analytics
getBillingAnalytics(filters)
```

**Filter Parameters**:
- `months`: Time period (1-60 months)
- `include_archived`: Include archived records
- `vendor_id`: Filter by vendor
- `customer_ids`: Customer ID array
- `provider_ids`: Provider ID array
- `location_ids`: Location ID array

## Stores

### locationStore.js
**Purpose**: Pinia store for location data management

**Location**: `src/stores/tem/locationStore.js`

**State Variables**:
```javascript
// Core location data
currentLocation: ref(null)
locationAccounts: ref([])
locationBillsTimeline: ref([])
locationBills: ref([])
locationSummary: ref(null)
locationOrders: ref([])
ordersGrouped: ref({})
ordersSummary: ref(null)
locationCancellations: ref([])
cancellationsGrouped: ref({})
cancellationsSummary: ref(null)

// Loading states
loading: ref(false)
accountsLoading: ref(false)
billsLoading: ref(false)
ordersLoading: ref(false)
cancellationsLoading: ref(false)
error: ref(null)

// Filters
accountFilters: ref({ vendor_id: null })
billFilters: ref({ months: 12, vendor_id: null })
ordersFilters: ref({ months: 12, include_archived: true })
cancellationsFilters: ref({ months: 12, include_archived: true })
```

**Computed Properties**:
```javascript
// Location info
locationName: computed(() => currentLocation.value?.name || '')
locationAddress: computed(() => /* formatted address */)

// Account metrics
accountMetrics: computed(() => ({
  totalAccounts: summary.total_accounts || 0,
  activeAccounts: summary.active_accounts || 0,
  totalExpected: summary.total_expected || 0,
  flaggedAccounts: summary.flagged_accounts || 0
}))

// Bill metrics
billMetrics: computed(() => ({
  totalBills: summary.total_bills || 0,
  totalAmount: summary.total_amount || 0,
  overdueBills: summary.overdue_bills || 0,
  paidBills: summary.paid_bills || 0
}))

// Filtered data
activeAccounts: computed(() => /* filtered active accounts */)
flaggedAccounts: computed(() => /* filtered flagged accounts */)
recentBills: computed(() => /* last 10 bills */)
overdueBills: computed(() => /* overdue bills only */)

// Orders data
activeOrders: computed(() => ordersGrouped.value?.active || [])
linkedOrders: computed(() => ordersGrouped.value?.linked || [])
unlinkedOrders: computed(() => ordersGrouped.value?.unlinked || [])
completedOrders: computed(() => ordersGrouped.value?.completed || [])
inProgressOrders: computed(() => ordersGrouped.value?.in_progress || [])

// Cancellations data
linkedCancellations: computed(() => /* linked cancellations */)
unlinkedCancellations: computed(() => /* unlinked cancellations */)
completedCancellations: computed(() => /* completed cancellations */)
```

**Actions**:
```javascript
// Data fetching
fetchLocationAccounts(customerId, locationId, filters)
fetchLocationBillsTimeline(customerId, locationId, filters)
fetchLocationOrders(customerId, locationId, filters)
fetchLocationCancellations(customerId, locationId, filters)
fetchLocationDetail(customerId, locationId) // Loads accounts + bills

// Filter management
updateAccountFilters(newFilters)
updateBillFilters(newFilters)
updateOrdersFilters(newFilters)
updateCancellationsFilters(newFilters)
clearFilters()

// Utility actions
setCurrentLocation(location)
clearLocationData()

// Analytics
getAccountsByVendor()
getBillTrendData()
getVarianceAnalysis()
```

**Error Handling**:
- All async actions include try-catch blocks
- Errors stored in `error` state
- User-friendly error messages
- Fallback to empty arrays/objects

## Data Structures

### Orders Data Structure
```javascript
{
  order_id: "12345",
  ticket_id: "T-67890", 
  product: "Internet Service",
  provider: "Comcast",
  account_number: "8771400030020384",
  status: "ISP Installed",
  stage: "Active",
  archive_status: "Active",
  financial: {
    monthly_cost: 124.95,
    install_cost: 99.00,
    term_months: 24
  },
  timeline: {
    ordered_date: "2024-01-15",
    pending_install_date: "2024-02-01",
    circuit_live_date: "2024-02-05",
    days_to_complete: 21
  },
  tem_linkage: {
    status: "Linked",
    match_type: "Account Match",
    account_number: "8771400030020384",
    monthly_cost: 124.95
  },
  technical_details: {
    bandwidth: "100 Mbps",
    modem_info: "DOCSIS 3.1",
    notes: "Standard installation"
  },
  is_linked: true,
  is_active: true,
  is_completed: true,
  cost_variance: 0.00
}
```

### Cancellations Data Structure
```javascript
{
  cancellation_id: 6755,
  cancellation_group_id: null,
  provider: "Comcast",
  status: "Cancellation Complete",
  product: null,
  services_cancelled: "internet",
  confirmation_number: "CR209582979",
  account_info: {
    raw_account_number: "8771 40 003 0020384 ",
    clean_account_number: "8771 40 003 0020384"
  },
  dates: {
    submitted: "2025-07-11",
    due: "2025-09-29", 
    billing_end: "2025-09-11",
    last_bill_received: null
  },
  tem_linkage: {
    status: "Linked",
    match_confidence: "Provider Match",
    linked_account: {
      vendor_id: "00901LULZOZMNW2fvo3d",
      account_number: "8771400030596888",
      provider_name: "Comcast",
      monthly_expected: 602,
      status: "Active"
    },
    all_location_tem_accounts: [
      {
        vendor_id: "00901LULZOZMNW2fvo3d",
        account_number: "8771400030020384",
        provider: "Comcast",
        monthly: 602,
        status: "Active",
        is_match: true,
        match_type: "account"
      }
    ]
  },
  is_linked: true,
  has_billing_end: true,
  has_due_date: true,
  is_recent: true,
  has_confirmation: true
}
```

### Account Data Structure
```javascript
{
  account_id: "12345",
  account_number: "8771400030020384",
  provider_name: "Comcast",
  vendor_name: "Comcast Business",
  expected_amount: 124.95,
  last_amount: 127.45,
  is_active: true,
  is_flagged: false,
  flagged_reason: null,
  variance_amount: 2.50,
  variance_percent: 2.00
}
```

### Bills Timeline Data Structure
```javascript
{
  status: "success",
  data: [
    {
      month: "2024-01",
      month_name: "January 2024", 
      total_amount: 124.95,
      bill_count: 1,
      paid_count: 1,
      overdue_count: 0
    }
  ],
  bills: [
    {
      bill_id: "67890",
      amount: 124.95,
      due_date: "2024-01-15",
      paid_date: "2024-01-10",
      is_overdue: false
    }
  ],
  summary: {
    total_bills: 12,
    total_amount: 1499.40,
    overdue_bills: 0,
    paid_bills: 12
  }
}
```

## UI Components & Features

### Status Badges
- **Success**: Green for active/completed/linked states
- **Warning**: Orange for pending/in-progress states  
- **Danger**: Red for inactive/overdue/failed states
- **Secondary**: Gray for neutral/archived states

### Time Period Filters
Available across orders and cancellations:
- 6 Months (6)
- 12 Months (12) - Default
- 2 Years (24) 
- 3 Years (36)
- 5 Years (60)

### Currency Formatting
All monetary values formatted using:
```javascript
new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
}).format(value)
```

### Date Formatting
All dates formatted using:
```javascript
new Date(value).toLocaleDateString()
```

### Chart Integration
Using Chart.js with PrimeVue wrapper:
- Line charts for billing trends
- Responsive design
- Interactive tooltips
- Legend display
- Custom styling

### Drawer Components
- **Right-positioned**: 800px-900px width
- **Card-based layout**: Organized information panels
- **Form fields**: Consistent label/value styling
- **Action buttons**: Link to TEM, view history
- **Responsive**: Mobile-friendly design

## Routing

### TEM Routes
```javascript
// Route definitions in src/router/temRoutes.js
{
  path: '/tem/customers/:customerId',
  name: 'customer-detail',
  component: CustomerDetail,
  meta: { requiresAuth: true }
},
{
  path: '/tem/customers/:customerId/locations/:locationId', 
  name: 'location-detail',
  component: LocationDetail,
  meta: { requiresAuth: true }
}
```

### Route Parameters
- `customerId`: Customer identifier
- `locationId`: Location identifier

### Navigation
- Breadcrumb navigation
- Back button functionality
- URL state management

## API Integration

### Base URL Configuration
```javascript
VITE_API_BASE_URL + '/tem/audit'
```

### Request/Response Handling
- **Timeout**: 30 seconds
- **Error Logging**: Console and user notifications
- **Loading States**: Per-endpoint loading indicators
- **Response Validation**: Status and data structure checks

### Common Response Format
```javascript
{
  status: "success",
  data: [...],        // Main data array
  grouped: {...},     // Grouped/categorized data  
  summary: {...},     // Summary statistics
  timeline: [...],    // Timeline data (if applicable)
  location: {...}     // Location context (if applicable)
}
```

## Error Handling

### Client-Side Errors
- Network connectivity issues
- API timeout errors
- Invalid response formats
- Missing data scenarios

### User Feedback
- Toast notifications for errors
- Loading spinners during requests
- Empty state messages
- Retry mechanisms

### Logging
- Console error logging
- API response logging in development
- Error context preservation

## Performance Optimizations

### Data Loading
- Lazy loading for large datasets
- Pagination to limit record counts
- Parallel API calls where possible
- Computed properties for derived data

### UI Rendering
- Virtual scrolling for large tables
- Conditional rendering based on data availability
- Chart re-rendering optimization with keys
- Component key strategies for updates

### Caching
- Pinia store state management
- Component-level computed caching
- API response reuse within sessions

## Development Guidelines

### Code Patterns
- Composition API for all Vue components
- Pinia stores for state management
- Consistent error handling
- Responsive design principles
- Accessibility considerations

### Naming Conventions
- **Components**: PascalCase (e.g., `TEMDataTable`)
- **Files**: kebab-case (e.g., `location-store.js`)
- **Variables**: camelCase (e.g., `locationAccounts`)
- **Constants**: UPPER_CASE (e.g., `API_BASE_URL`)

### File Organization
- Feature-based directory structure
- Shared components in `/shared` directories
- Clear separation of concerns
- Consistent import patterns

## Future Enhancements

### Planned Features
- Real-time data updates
- Advanced filtering options
- Bulk edit capabilities
- Export functionality expansion
- Mobile app support

### Technical Improvements
- Unit test coverage
- E2E testing implementation
- Performance monitoring
- Accessibility enhancements
- PWA capabilities

---

*This documentation covers the TEM Audit frontend toolset as of August 2025. For updates and additional details, refer to the component source code and API documentation.*