# 🚀 Audit & Topology Workbench - Master Guide

## 📋 **Project Overview**

A comprehensive auditor workflow platform that transforms raw asset scan data into validated license allocations through human-driven categorization and mapping. Built with Vue 3, PrimeVue 4, and Pinia state management.

**Current Status**: Phase 3 Complete (Raw Assets Tab)
**Next Phase**: Phase 4 - Topology & Mapping Tab (Units & Links)

---

## 🎯 **Current Capabilities**

### ✅ **Completed Features**

#### **Phase 1: Foundation (COMPLETE)**
- ✅ Customer-scoped routing (`/audit/:customerId/*`)
- ✅ API client with 15+ endpoints (`src/services/auditClient.js`)
- ✅ Route guards with real API validation
- ✅ Pinia stores for audit, locations, and workbench state
- ✅ CSRF token handling

#### **Phase 2: Dashboard & Locations (COMPLETE)**
- ✅ Audit Dashboard with real-time customer status
- ✅ Background audit start/polling/completion flow
- ✅ Locations List with server-side pagination
- ✅ Search, filter, sort functionality
- ✅ Rescan and issue creation actions

#### **Phase 3: Workbench Shell & Raw Assets (COMPLETE)**
- ✅ Location Workbench with 5-tab navigation
- ✅ Tab badge system with completion indicators
- ✅ Raw Assets Tab with enhanced DataTables
- ✅ Asset type breakdown (MD, CP, OR, SIM, MN, MU, TEM)
- ✅ Pagination, sorting, search per asset type
- ✅ Row expansion with detailed technical info
- ✅ Copy functionality for IDs/serials
- ✅ Clean header design with Asset & Charge signatures
- ✅ "Mark as Reviewed" toggle

#### **Current UI Design Standards**
- ✅ Finance page styling (colors, fonts, layout)
- ✅ Consistent typography (larger, readable fonts)
- ✅ Professional color palette (no light blue)
- ✅ Enhanced DataTable styling with gradients and shadows
- ✅ Responsive grid layouts
- ✅ Clean headers with signature display

---

## 🔮 **Remaining Roadmap**

### **Phase 4: Topology & Mapping Tab** (NEXT - Days 7-9)

#### **4.1 Core UI Layout**
- **Splitter Layout**: 2-column design
- **Left Panel**: Units DataTable
- **Right Panel**: Unlinked Raw Assets (accordion by type)

#### **4.2 Units Management**
```vue
<!-- Units DataTable Columns -->
- Label (user-defined, e.g., "MX-HA-A")
- Category (from ref API: WAN_APPLIANCE, LAN_SWITCH, etc.)
- Layer (TRANSPORT, WAN_APPLIANCE, LAN_ACCESS, etc.)
- Link Count (how many raw records attached)
- Connections (button → Unit Relationships dialog)
```

#### **4.3 Add Unit Dialog**
- **Label**: Required text input
- **Category**: Dropdown from `/audit/ref/asset-categories`
- **Layer**: Dropdown (filtered by allowed layers)
- **Virtual Asset**: Boolean toggle
- **Quick Templates**: "Wired Internet" / "Cellular Internet" buttons

#### **4.4 Raw Assets Linking**
```vue
<!-- Raw Assets Accordion (MD, MU, CP, OR, SIM, MN) -->
- ID (copyable) | hostname | model | status | IP
- "Attach to Unit" button → Unit selection dialog
- Aspect selection: DEVICE | UPLINK | INTERFACE | SIM | MONITOR
- Client-side 1:1 rule enforcement
```

#### **4.5 Unit Relationships (NEW)**
- **API Endpoints**: GET/POST/DELETE `/unit-relationships`
- **Relationship Types**: PRIMARY_UPLINK | BACKUP_UPLINK | MONITOR | REDUNDANT
- **Connections Dialog**: Per unit, manage topology connections

#### **4.6 Virtual Assets Support**
- **Display**: Same Units DataTable with "Virtual" badge
- **Functionality**: Category/layer rules apply
- **Evidence Linking**: Optional (ORION interfaces, MU paths)
- **UI Distinction**: Gray-out "Attach raw record" by default

#### **4.7 Completion Indicator**
- **Badge Logic**: ⚠ if unmapped raw assets, ✓ if all mapped

### **Phase 5: Licensing & Allocation Tab** (Days 9-11)

#### **5.1 Header Controls**
- **Profile Selector**: GET `/api/audit/profiles/:customerId?type=CP`
- **Create Profile Dialog**: Name, description, Contract linking
- **Service Level Selector**: GET `/api/audit/ref/service-levels/:customerId`
- **Run Allocation Button**: Disabled until ≥1 unit + profile selected

#### **5.2 Sub-Tabs Structure**
```vue
<Tabs>
  <Tab label="Allocation">
    <!-- Required vs Available panels -->
    <!-- Uncovered Units table -->
    <!-- Unused Charges table -->
    <!-- Mismatches table with actions -->
  </Tab>
  
  <Tab label="Charges">
    <!-- Invoice-style charges view -->
    <!-- Profile header with breakdown -->
    <!-- Charges DataTable with mapping -->
  </Tab>
  
  <Tab label="Bundles & Licenses">
    <!-- CP bundle→license matrix (optional V1.1) -->
  </Tab>
</Tabs>
```

#### **5.3 Results Zones**
- **Required vs Available Table**: Unit counts vs CP allocations
- **Uncovered Units**: Units without sufficient licenses
- **Unused Charges**: Allocated but unused licenses
- **Mismatches Table**: Plan/carrier mismatches with actions:
  - "Create Issue" button
  - "Ignore 30 days" → creates exception

#### **5.4 Profile Management**
- **Create Profile UX**: Within Licensing tab
- **Contracts Integration**: Dropdown from `/api/contracts`
- **Legacy Screens**: Keep existing charge-profile screens for admin

#### **5.5 Completion Indicator**
- **Badge Logic**: ✓ when last allocation run with `save:true` succeeded

### **Phase 6: Invoice-Style Charges View** (Days 10-11)

#### **6.1 Profile Header**
- **Signature Display**: Asset & Charge signatures
- **Metrics**: Location count, total monthly cost
- **Service Breakdown**: Cards showing service distribution

#### **6.2 Charges DataTable**
```vue
<!-- Expandable DataTable -->
Columns:
- Bundle | License/Product | Quantity | Unit Price | Extended Cost
- Mapped Asset (Dropdown) | Status
```

#### **6.3 Expandable Sections**
- **Locations with Profile**: DataTable with:
  - Location | Asset Signature | Devices | Monthly Cost
  - Actions: View Location, View Assets

#### **6.4 Dialogs & Drawers**
- **Location Details Dialog**: Detailed location breakdown
- **Asset Details Drawer**: Asset information panel

### **Phase 7: Issues & Exceptions** (Days 10-11)

#### **7.1 Issues Management**
- **Issues DataTable**: Type, severity, status, title, dates
- **Add Issue Dialog**: Full issue creation form
- **Status Management**: Quick status updates
- **Integration**: POST `/audit-management/customers/:cid/locations/:lid/issues`

#### **7.2 Exceptions Management**
- **Exceptions DataTable**: Code, scope, predicate, expiry, notes
- **30-Day Defaults**: Automatic expiry handling
- **JSON Predicate**: Equality matching for mismatch rules
- **Integration**: POST `/audit/locations/:lid/exceptions`

#### **7.3 Badge System**
- **Issue Count**: Open + in_progress issues only
- **Real-time Updates**: Refresh after CRUD operations

### **Phase 8: History & Audit Comparison** (Days 11-12)

#### **8.1 Audit Run History**
- **Timeline View**: Past audit runs with metadata
- **Comparison Mode**: Select historical run for comparison
- **Signature Tracking**: Asset/charge signature evolution

#### **8.2 Read-Only Historical View**
- **URL Parameter**: `?audit_run_id=X` for historical data
- **UI Indication**: "Comparing Run #X" banner
- **Data Isolation**: Historical data doesn't affect current state

---

## 🛠 **Technical Architecture**

### **Routing Structure**
```javascript
/audit/:customerId/dashboard        → Audit Dashboard
/audit/:customerId/locations        → Locations List  
/audit/:customerId/locations/:id    → Location Workbench
```

### **State Management (Pinia)**
```javascript
useAuditStore      → Customer status, polling, reference data
useLocationsStore  → Paginated locations, filters, sorting
useWorkbenchStore  → Raw assets, units, allocation, issues
```

### **API Integration**
```javascript
// Customer Level
auditClient.getCustomerStatus(customerId)
auditClient.startFullAudit(customerId)
auditClient.getLocations(customerId, params)

// Location Level  
auditClient.getRawAssets(locationId, auditRunId?)
auditClient.getAssetUnits(locationId)
auditClient.createAssetUnitLinks(locationId, links)

// NEW Phase 4-6 Endpoints
auditClient.getUnitRelationships(locationId)
auditClient.getProfiles(customerId, type)
auditClient.getContracts(customerId) 
auditClient.getCharges(locationId, profileId)
```

### **Component Structure**
```
src/views/audit-workbench/
├── AuditDashboard.vue
├── LocationsList.vue
└── LocationWorkbench.vue

src/components/audit-workbench/
├── RawAssetsTab.vue                 ✅ COMPLETE
├── TopologyMappingTab.vue           🚧 PHASE 4
├── LicensingTab.vue                 🚧 PHASE 5  
├── InvoiceChargesView.vue           🚧 PHASE 6
├── IssuesExceptionsTab.vue          🚧 PHASE 7
└── HistoryTab.vue                   🚧 PHASE 8
```

---

## 📊 **Data Models**

### **Raw Assets Response**
```typescript
interface RawAssetsResponse {
  location: { id: number; name: string; site_number: string; city: string; state: string };
  audit: { audit_run_id: number; asset_signature: string; charge_signature: string };
  mapped_counts: Record<string, number>;
  raw_assets: {
    meraki_devices?: Array<{ id: string; model?: string; hostname?: string; status?: string; raw: any }>;
    cradlepoint_devices?: Array<{ id: string; hostname?: string; model?: string; raw: any }>;
    orion_nodes?: Array<{ id: string; hostname?: string; ip?: string; status?: string; raw: any }>;
    sims?: Array<{ id: string; iccid: string; carrier?: string; plan?: string; raw: any }>;
    meraki_networks?: Array<{ id: string; name?: string; timezone?: string; raw: any }>;
    meraki_uplinks?: Array<{ id: string; interface?: string; ip?: string; raw: any }>;
  };
}
```

### **Asset Units & Links**
```typescript
interface AssetUnit {
  id: number;
  label: string;
  category: string;  // WAN_APPLIANCE, LAN_SWITCH, etc.
  layer: string;     // TRANSPORT, WAN_APPLIANCE, etc.
  is_virtual: boolean;
  links: Array<{
    source_system: string;  // MERAKI, CRADLEPOINT, etc.
    raw_id: string;         // MD:Q2EX-ARC4-EGGN
    aspect: string;         // DEVICE, UPLINK, INTERFACE, SIM, MONITOR
  }>;
}
```

### **Unit Relationships (NEW)**
```typescript
interface UnitRelationship {
  id: number;
  from_unit_id: number;
  to_unit_id: number;
  type: 'PRIMARY_UPLINK' | 'BACKUP_UPLINK' | 'MONITOR' | 'REDUNDANT';
  created_at: string;
}
```

### **Allocation Result**
```typescript
interface AllocationResult {
  required: Record<string, number>;     // Required units by category
  available: Record<string, number>;    // Available licenses by category  
  uncovered: Array<UncoveredUnit>;      // Units without licenses
  unused: Array<UnusedCharge>;          // Allocated but unused licenses
  mismatches: Array<MismatchDetail>;    // Plan/carrier conflicts
}
```

---

## 🔧 **Development Guidelines**

### **Hard Rules**
- ❌ **NO MOCK DATA ANYWHERE** - All data from backend APIs
- ❌ **NO HARDCODED VALUES** - Fetch from reference endpoints
- ✅ **Real API Validation** - Route guards ping actual endpoints
- ✅ **Client-side Validation** - 1:1 linking rules, prerequisites
- ✅ **Error Handling** - JSON-only responses, proper Toast notifications

### **Design Standards**
- ✅ **Finance Page Styling** - Match existing app design patterns
- ✅ **Readable Typography** - Larger fonts, proper hierarchy
- ✅ **Professional Colors** - No light blue, use gray/green/orange
- ✅ **Enhanced DataTables** - Gradients, shadows, hover effects
- ✅ **Responsive Layout** - Grid systems, mobile-friendly

### **Performance Requirements**
- ✅ **Server-side Pagination** - Never load all records
- ✅ **Lazy Loading** - Dynamic imports for components
- ✅ **State Caching** - Pinia stores with invalidation
- ✅ **VirtualScroller** - For large asset lists

### **UX Requirements**
- ✅ **Tab Persistence** - LocalStorage for workbench tabs
- ✅ **Badge System** - Visual completion indicators
- ✅ **Toast Notifications** - Success/error feedback
- ✅ **Loading States** - Skeletons and progress indicators

---

## 🎯 **Immediate Next Steps**

### **Phase 4 Implementation Checklist**

#### **4.1 Create TopologyMappingTab.vue Component**
```vue
<template>
  <div class="topology-mapping-tab">
    <Splitter style-class="min-h-96">
      <!-- Left Panel: Units List -->
      <SplitterPanel class="flex align-items-center justify-content-center" :size="50">
        <UnitsDataTable />
      </SplitterPanel>
      
      <!-- Right Panel: Raw Assets -->
      <SplitterPanel class="flex align-items-center justify-content-center" :size="50">
        <UnlinkedAssetsAccordion />
      </SplitterPanel>
    </Splitter>
  </div>
</template>
```

#### **4.2 Implement Units CRUD Operations**
- **GET** `/audit/locations/:locationId/asset-units`
- **POST** `/audit/locations/:locationId/asset-units`
- **POST** `/audit/locations/:locationId/asset-unit-links`

#### **4.3 Add Unit Relationships Support**
- **GET** `/audit/locations/:locationId/unit-relationships`
- **POST** `/audit/locations/:locationId/unit-relationships` 
- **DELETE** `/audit/locations/:locationId/unit-relationships/:id`

#### **4.4 Update workbenchStore.js**
```javascript
// Add to state
unitRelationships: [],

// Add to actions  
async loadUnitRelationships(locationId) { /* ... */ }
async createUnitRelationship(locationId, relationship) { /* ... */ }
async deleteUnitRelationship(locationId, relationshipId) { /* ... */ }
```

#### **4.5 Reference Data Integration**
- Fetch asset categories from `/audit/ref/asset-categories`
- Cache in auditStore with session persistence
- Use for Category/Layer dropdowns

---

## 📈 **Success Metrics**

### **Completion Criteria**
A location becomes "Completed" when:
- ✅ Raw Assets tab is "Reviewed" 
- ✅ Units & Links has no unmapped items
- ✅ Latest Allocation is saved with zero uncovered/mismatches
- ✅ All issues resolved or documented
- ✅ Auditor sets status to "completed"

### **Performance Targets**
- ✅ Sub-100ms page transitions
- ✅ Sub-200KB initial payload  
- ✅ Server-side pagination for 1000+ locations
- ✅ Real-time status updates via polling

### **Quality Assurance**
- ✅ Zero mock data in production
- ✅ All dropdowns populated from backend
- ✅ Route guards validate real customer access
- ✅ Client-side validation prevents invalid API calls
- ✅ Tab badges computed from actual data

---

## 🏁 **Project Status Summary**

**✅ COMPLETE (Phases 1-3)**
- Foundation architecture with routing and stores
- Dashboard with real-time monitoring  
- Locations list with full CRUD operations
- Raw Assets tab with enhanced DataTables and clean design

**🚧 IN PROGRESS (Phase 4)**
- Topology & Mapping Tab development
- Units CRUD system implementation
- Unit Relationships management

**📋 PLANNED (Phases 5-8)**
- Licensing & Allocation with profile management
- Invoice-style charges view with mapping
- Issues & Exceptions management
- History & audit run comparison

**Timeline**: 12 development days total (3 complete, 9 remaining)
**Current Focus**: Phase 4 - Units & Links system for asset-to-unit mapping

---

*This master guide consolidates all previous documentation and represents the single source of truth for the Audit & Topology Workbench project.*
