# Merge Groups System Implementation

## Overview

The Merge Groups system provides enhanced management capabilities for merged invoices, offering proactive conflict detection, rich metadata tracking, document versioning, and comprehensive merge history management.

## ⚠️ **Current Status**
This implementation is **BACKEND-FOCUSED** and may not align with the current frontend architecture. Review and update integration points before implementation.

---

## 🏗️ **Database Schema**

### `merge_groups` Table
- **Primary Key**: `id`
- **Unique Identifier**: `group_identifier` (e.g., "MER6041" without +)
- **Merged Invoice**: `merged_invoice_number` (e.g., "MER6041+" with +)
- **Customer Info**: `customer_number`, `customer_name`
- **Invoice Data**: `original_invoices` (JSON), `total_amount`, `invoice_count`
- **Template Info**: `template_used`, `template_override`
- **Metadata**: `document_count`, `status`, `created_by`, timestamps

### `merge_group_documents` Table
- **Primary Key**: `id`
- **Foreign Key**: `merge_group_id` → `merge_groups.id`
- **Job Linking**: `job_id` (links to existing job system)
- **Document Info**: `document_type`, `document_subtype`, `file_path`, `file_name`
- **File Metadata**: `file_size`, `mime_type`, `version`
- **Status**: `status` (active/archived)

---

## 🔧 **API Endpoints**

### Base URL: `/api/merge-groups`

#### **Conflict Checking**
```http
POST /api/merge-groups/check-conflicts
Content-Type: application/json

{
    "invoice_numbers": ["SI0006041", "SI0006042"],
    "customer_number": "CUST001"
}
```

**Response:**
```json
{
    "success": true,
    "has_conflicts": true,
    "conflicts": [
        {
            "merge_group_id": 123,
            "group_identifier": "MER6041",
            "merged_invoice_number": "MER6041+",
            "conflicting_invoices": ["SI0006041"],
            "existing_invoices": ["SI0006041", "SI0006043"],
            "total_amount": 1500.00,
            "document_count": 4,
            "created_at": "2024-01-15T10:30:00Z",
            "template_used": "paradies_mrc",
            "template_override": "mrc"
        }
    ]
}
```

#### **Get Merge Groups**
```http
GET /api/merge-groups?customer_number=CUST001&status=active&limit=50
```

#### **Get Specific Merge Group**
```http
GET /api/merge-groups/{groupIdentifier}
```

#### **Archive/Delete Operations**
```http
PATCH /api/merge-groups/{groupIdentifier}/archive
DELETE /api/merge-groups/{groupIdentifier}?delete_files=true
```

#### **Statistics**
```http
GET /api/merge-groups/statistics/customer?customer_number=CUST001
```

---

## 🔄 **Integration Considerations**

### **With Current Frontend Architecture**

⚠️ **IMPORTANT**: This implementation predates the current Vue 3 + Pinia architecture. Integration will require:

1. **Store Integration**: Create Pinia store for merge groups
2. **API Service**: Add to existing ApiService.js
3. **Component Updates**: Integrate with current PrimeVue components
4. **Real Data Policy**: Ensure no mock data in implementation

### **Recommended Integration Pattern**

#### **1. Pinia Store**
```javascript
// src/stores/mergeGroupsStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ApiService } from '@/services/ApiService'

export const useMergeGroupsStore = defineStore('mergeGroups', () => {
  const mergeGroups = ref([])
  const loading = ref(false)
  const error = ref(null)

  const checkConflicts = async (invoiceNumbers, customerNumber) => {
    try {
      loading.value = true
      const response = await ApiService.post('/merge-groups/check-conflicts', {
        invoice_numbers: invoiceNumbers,
        customer_number: customerNumber
      })
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    mergeGroups,
    loading,
    error,
    checkConflicts
  }
})
```

#### **2. API Service Integration**
```javascript
// Add to src/services/ApiService.js
const mergeGroupsEndpoints = {
  checkConflicts: (data) => ApiService.post('/merge-groups/check-conflicts', data),
  getGroups: (params) => ApiService.get('/merge-groups', { params }),
  getGroup: (id) => ApiService.get(`/merge-groups/${id}`),
  archiveGroup: (id) => ApiService.patch(`/merge-groups/${id}/archive`),
  deleteGroup: (id, deleteFiles = false) => ApiService.delete(`/merge-groups/${id}?delete_files=${deleteFiles}`)
}
```

---

## 🎯 **Implementation Priorities**

### **Phase 1: Core Backend (Required)**
- [ ] Database migrations
- [ ] API endpoints implementation
- [ ] Conflict detection logic
- [ ] Data validation

### **Phase 2: Frontend Integration (Recommended)**
- [ ] Pinia store creation
- [ ] API service integration
- [ ] Vue component development
- [ ] Real-time conflict checking

### **Phase 3: Advanced Features (Optional)**
- [ ] Bulk operations
- [ ] Advanced search
- [ ] Export functionality
- [ ] Notification system

---

## 🔒 **Security & Performance**

### **Security Considerations**
- **Authentication**: All endpoints require authentication
- **Authorization**: Role-based access for sensitive operations
- **Customer Isolation**: Ensure users can only access their customer data
- **File Access**: Secure document URLs with time-limited tokens

### **Performance Optimization**
- **Database Indexes**: Customer number, group identifier, status, created_at
- **Caching**: Customer statistics, recent groups, document URLs
- **Query Optimization**: Eager loading, pagination, selective fields

---

## 📋 **Testing Requirements**

### **Backend Testing**
- [ ] Unit tests for models and services
- [ ] Integration tests for API endpoints
- [ ] Performance tests for large datasets
- [ ] Security tests for access control

### **Frontend Testing**
- [ ] Component unit tests
- [ ] Store functionality tests
- [ ] API integration tests
- [ ] User workflow E2E tests

---

## ⚡ **Migration Strategy**

### **Database Migration**
```bash
# Create migration files
php artisan make:migration create_merge_groups_table
php artisan make:migration create_merge_group_documents_table

# Run migrations
php artisan migrate
```

### **Data Population**
```bash
# Populate from existing data
php artisan migrate:populate-merge-groups-from-existing-data
```

---

## 📊 **Monitoring & Metrics**

### **Key Metrics to Track**
- Merge group creation rate
- Conflict detection frequency
- Re-merge operations
- Document generation success rate
- API response times

### **Logging Requirements**
- Merge group lifecycle events
- Conflict detections and resolutions
- Document operations
- Performance metrics
- Error conditions

---

## 🎯 **Success Criteria**

- [ ] Zero data loss during migration
- [ ] Conflict detection accuracy > 99%
- [ ] API response times < 500ms
- [ ] Frontend integration complete
- [ ] User training completed
- [ ] Documentation updated

---

## ⚠️ **Important Notes**

1. **Backend-First**: Implementation requires backend completion before frontend integration
2. **No Mock Data**: All frontend components must use real API data
3. **Performance Impact**: Monitor database performance with large datasets
4. **User Training**: Complex system requiring user education
5. **Rollback Plan**: Maintain ability to rollback if issues arise

---

*This document requires updating to align with current frontend architecture and project standards.*
*Priority should be given to backend implementation before frontend integration.* 