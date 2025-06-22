# Merge Groups System Implementation

## Overview

The Merge Groups system provides enhanced management capabilities for merged invoices, offering proactive conflict detection, rich metadata tracking, document versioning, and comprehensive merge history management.

## Architecture

### Database Schema

#### `merge_groups` Table
- **Primary Key**: `id`
- **Unique Identifier**: `group_identifier` (e.g., "MER6041" without +)
- **Merged Invoice**: `merged_invoice_number` (e.g., "MER6041+" with +)
- **Customer Info**: `customer_number`, `customer_name`
- **Invoice Data**: `original_invoices` (JSON), `total_amount`, `invoice_count`
- **Template Info**: `template_used`, `template_override`
- **Metadata**: `document_count`, `status`, `created_by`, timestamps

#### `merge_group_documents` Table
- **Primary Key**: `id`
- **Foreign Key**: `merge_group_id` → `merge_groups.id`
- **Job Linking**: `job_id` (links to existing job system)
- **Document Info**: `document_type`, `document_subtype`, `file_path`, `file_name`
- **File Metadata**: `file_size`, `mime_type`, `version`
- **Status**: `status` (active/archived)

### Models

#### `MergeGroup` Model
```php
// Key Methods:
- getOriginalInvoiceNumbers(): array
- containsInvoice(string $invoiceNumber): bool
- getLatestVersionForType(string $type, ?string $subtype): int

// Relationships:
- documents(): HasMany
- activeDocuments(): HasMany
- creator(): BelongsTo

// Scopes:
- scopeForCustomer($query, string $customerNumber)
- scopeActive($query)
- scopeForTemplate($query, string $template)
```

#### `MergeGroupDocument` Model
```php
// Key Methods:
- getFileUrl(): string
- getFormattedFileSize(): string

// Relationships:
- mergeGroup(): BelongsTo

// Scopes:
- scopeOfType($query, string $type)
- scopeActive($query)
- scopeLatestVersion($query)
```

### Services

#### `MergeGroupService`
Core business logic for merge group operations:

```php
// Conflict Management
- checkMergeConflicts(array $invoiceNumbers, string $customerNumber): array

// CRUD Operations
- createMergeGroup(array $data): MergeGroup
- getMergeGroupByIdentifier(string $groupIdentifier): ?MergeGroup
- getMergeGroupsForCustomer(string $customerNumber, ...): Collection

// Document Management
- addDocument(MergeGroup $group, string $jobId, ...): MergeGroupDocument

// Lifecycle Management
- archiveMergeGroup(MergeGroup $group): bool
- deleteMergeGroup(MergeGroup $group, bool $deleteFiles): bool
- prepareMergeGroupForRemerge(MergeGroup $group): MergeGroup

// Analytics
- getMergeStatistics(string $customerNumber): array
- searchMergeGroups(array $criteria, int $limit): Collection
```

## API Endpoints

### Base URL: `/api/merge-groups`

#### Conflict Checking
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

#### Get Merge Groups
```http
GET /api/merge-groups?customer_number=CUST001&status=active&limit=50
```

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "id": 123,
            "group_identifier": "MER6041",
            "merged_invoice_number": "MER6041+",
            "customer_number": "CUST001",
            "customer_name": "Customer Name",
            "original_invoices": [
                {
                    "number": "SI0006041",
                    "amount": 750.00,
                    "date": "2024-01-01"
                }
            ],
            "template_used": "paradies_mrc",
            "template_override": "mrc",
            "total_amount": 1500.00,
            "invoice_count": 2,
            "document_count": 4,
            "status": "active",
            "created_at": "2024-01-15T10:30:00Z",
            "updated_at": "2024-01-15T10:30:00Z",
            "created_by": {
                "id": 1,
                "name": "John Doe",
                "email": "john@example.com"
            },
            "documents": [
                {
                    "id": 456,
                    "document_type": "pdf",
                    "document_subtype": "summary",
                    "file_name": "MER6041_summary.pdf",
                    "file_size": 245760,
                    "formatted_file_size": "240 KB",
                    "mime_type": "application/pdf",
                    "version": 1,
                    "created_at": "2024-01-15T10:30:00Z",
                    "download_url": "https://storage.example.com/..."
                }
            ]
        }
    ]
}
```

#### Get Specific Merge Group
```http
GET /api/merge-groups/{groupIdentifier}
```

#### Archive Merge Group
```http
PATCH /api/merge-groups/{groupIdentifier}/archive
```

#### Delete Merge Group
```http
DELETE /api/merge-groups/{groupIdentifier}?delete_files=true
```

#### Prepare for Re-merge
```http
POST /api/merge-groups/{groupIdentifier}/prepare-remerge
```

#### Get Statistics
```http
GET /api/merge-groups/statistics/customer?customer_number=CUST001
```

**Response:**
```json
{
    "success": true,
    "data": {
        "total_groups": 15,
        "active_groups": 12,
        "archived_groups": 3,
        "total_invoices_merged": 45,
        "total_documents": 60,
        "average_amount": 1250.50,
        "last_merge_date": "2024-01-15T10:30:00Z"
    }
}
```

#### Search Merge Groups
```http
GET /api/merge-groups/search/query?customer_number=CUST001&template_used=paradies_mrc&date_from=2024-01-01
```

## Integration with Existing System

### Invoice Template Controller Integration

The `InvoiceTemplateController` has been enhanced to automatically create and manage merge groups:

1. **Automatic Group Creation**: When `generateMergedTemplate()` succeeds, it calls `createOrUpdateMergeGroup()`
2. **Re-merge Handling**: When `force_overwrite=true`, existing groups are prepared for re-merge
3. **Document Linking**: Generated files are automatically linked to merge groups
4. **Error Isolation**: Merge group failures don't affect invoice generation

### Conflict Detection Flow

1. **Frontend Selection**: When users select invoices, call `/check-conflicts`
2. **Conflict Response**: If conflicts exist, show detailed information
3. **User Decision**: Allow force override or modification of selection
4. **Merge Execution**: Proceed with `force_overwrite=true` if confirmed

## Data Migration

### Historical Data Import
- Migration: `populate_merge_groups_from_existing_data`
- Source: `invoice_merge_history` table
- Mapping: Converts existing merge records to new structure
- Safe: Non-destructive, logs errors without failing

### Document Linking (Future)
A future migration can link existing documents to merge groups by:
1. Scanning job records for merged invoice patterns
2. Matching job IDs to merge groups by invoice numbers
3. Creating `merge_group_documents` records

## Frontend Integration Recommendations

### Proactive Conflict Detection
```javascript
// When user selects invoices
async function checkForConflicts(invoiceNumbers, customerNumber) {
    const response = await fetch('/api/merge-groups/check-conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_numbers: invoiceNumbers, customer_number: customerNumber })
    });
    
    const result = await response.json();
    
    if (result.has_conflicts) {
        showConflictDialog(result.conflicts);
    }
}
```

### Merge Group Management UI
```javascript
// Load merge groups for customer
async function loadMergeGroups(customerNumber) {
    const response = await fetch(`/api/merge-groups?customer_number=${customerNumber}`);
    const result = await response.json();
    
    displayMergeGroups(result.data);
}

// Re-merge functionality
async function remergeGroup(groupIdentifier) {
    // Prepare for re-merge
    await fetch(`/api/merge-groups/${groupIdentifier}/prepare-remerge`, { method: 'POST' });
    
    // Get original invoice data
    const group = await fetch(`/api/merge-groups/${groupIdentifier}`).then(r => r.json());
    
    // Trigger new merge with original parameters
    triggerMerge(group.data.original_invoices, group.data.template_used, { force_overwrite: true });
}
```

### Enhanced Duplicate Detection
```javascript
// Enhanced 409 response handling
if (response.status === 409) {
    const conflict = await response.json();
    
    showEnhancedConflictDialog({
        existingMerge: conflict.existing_merge,
        requestedMerge: conflict.requested_merge,
        onConfirm: () => retryWithForceOverwrite()
    });
}
```

## Performance Considerations

### Database Optimization
- **Indexes**: Customer number, group identifier, status, created_at
- **Partitioning**: Consider partitioning by customer or date for large datasets
- **Archival**: Regular archival of old merge groups to maintain performance

### Caching Strategy
- **Customer Statistics**: Cache frequently accessed statistics
- **Recent Groups**: Cache recent merge groups per customer
- **Document URLs**: Cache document URLs with appropriate TTL

### Query Optimization
- **Eager Loading**: Load relationships efficiently
- **Pagination**: Implement proper pagination for large result sets
- **Selective Fields**: Only load required fields in list views

## Security Considerations

### Access Control
- **Authentication**: All endpoints require authentication
- **Authorization**: Consider role-based access for sensitive operations
- **Customer Isolation**: Ensure users can only access their customer data

### Data Protection
- **File Access**: Secure document URLs with time-limited tokens
- **Audit Trail**: Log all merge group operations
- **Data Retention**: Implement retention policies for archived data

## Monitoring and Logging

### Key Metrics
- Merge group creation rate
- Conflict detection frequency
- Re-merge operations
- Document generation success rate
- API response times

### Log Events
- Merge group lifecycle events
- Conflict detections and resolutions
- Document operations
- Performance metrics
- Error conditions

## Future Enhancements

### Phase 2 Features
1. **Bulk Operations**: Archive/delete multiple groups
2. **Advanced Search**: Full-text search across merge data
3. **Export Functionality**: Export merge history to CSV/Excel
4. **Notification System**: Alerts for merge conflicts or failures

### Phase 3 Features
1. **Merge Templates**: Predefined merge configurations
2. **Approval Workflows**: Multi-step approval for large merges
3. **Integration APIs**: Webhooks for external system integration
4. **Analytics Dashboard**: Visual merge analytics and trends

## Testing

### Unit Tests
- Model relationships and methods
- Service class functionality
- Validation rules

### Integration Tests
- API endpoint responses
- Database operations
- File operations

### Performance Tests
- Large dataset handling
- Concurrent operations
- Memory usage optimization

## Deployment Checklist

- [ ] Run migrations: `php artisan migrate`
- [ ] Verify routes: `php artisan route:list --path=merge-groups`
- [ ] Test API endpoints
- [ ] Monitor logs for errors
- [ ] Verify data migration results
- [ ] Update frontend integration
- [ ] Document API changes
- [ ] Train users on new features 