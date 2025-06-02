# Backend Implementation Checklist for Dispatch V2 MVP

## 🎯 **Priority 1: Jobs Module (Critical for MVP)**

### Jobs API Endpoints (4 endpoints)
- [ ] `GET /api/jobs/` - Job list with filtering/pagination
- [ ] `GET /api/jobs/{id}` - Individual job details
- [ ] `PUT /api/jobs/{id}/status` - Update job status
- [ ] `PUT /api/jobs/{id}/assign` - Assign technician to job

### Expected Response Structures:

#### Job List Response
```json
{
  "data": [
    {
      "id": 1,
      "title": "HVAC Maintenance",
      "customer_id": 123,
      "customer_name": "ABC Corp",
      "status": "in_progress",
      "priority": "high",
      "technician_id": 456,
      "technician_name": "John Smith",
      "scheduled_date": "2024-01-15",
      "location": "123 Main St",
      "estimated_duration": 120,
      "created_at": "2024-01-10T09:00:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "per_page": 20,
    "current_page": 1
  }
}
```

#### Job Details Response
```json
{
  "id": 1,
  "title": "HVAC Maintenance",
  "description": "Quarterly maintenance check",
  "customer": {
    "id": 123,
    "name": "ABC Corp",
    "contact_person": "Jane Doe"
  },
  "status": "in_progress",
  "priority": "high",
  "technician": {
    "id": 456,
    "name": "John Smith",
    "phone": "+1234567890"
  },
  "location": {
    "address": "123 Main St",
    "city": "New York",
    "coordinates": [40.7128, -74.0060]
  },
  "schedule": {
    "scheduled_date": "2024-01-15",
    "estimated_duration": 120,
    "actual_start": null,
    "actual_end": null
  },
  "notes": [],
  "attachments": [],
  "created_at": "2024-01-10T09:00:00Z",
  "updated_at": "2024-01-14T15:30:00Z"
}
```

## 🎯 **Priority 2: Projects Module (Important for MVP)**

### Projects API Endpoints (2 endpoints)
- [ ] `GET /api/projects/` - Project list with basic info
- [ ] `GET /api/projects/{id}` - Project details with jobs

### Expected Response Structures:

#### Project List Response
```json
{
  "data": [
    {
      "id": 1,
      "name": "Office Building Renovation",
      "customer_id": 123,
      "customer_name": "ABC Corp",
      "status": "active",
      "start_date": "2024-01-01",
      "end_date": "2024-06-30",
      "total_jobs": 25,
      "completed_jobs": 12,
      "progress_percentage": 48,
      "total_value": 150000
    }
  ]
}
```

## 🎯 **Priority 3: Shared Utilities (Supporting MVP)**

### Shared API Endpoints (2 endpoints)
- [ ] `GET /api/technicians` - Available technicians for assignment
- [ ] `GET /api/options/statuses` - Status options for dropdowns

### Expected Response Structures:

#### Technicians Response
```json
{
  "data": [
    {
      "id": 456,
      "name": "John Smith",
      "email": "john@company.com",
      "phone": "+1234567890",
      "status": "available",
      "current_job_id": null,
      "skills": ["HVAC", "Electrical"],
      "location": {
        "lat": 40.7128,
        "lng": -74.0060
      }
    }
  ]
}
```

#### Status Options Response
```json
{
  "job_statuses": [
    { "value": "pending", "label": "Pending", "color": "warning" },
    { "value": "in_progress", "label": "In Progress", "color": "info" },
    { "value": "completed", "label": "Completed", "color": "success" },
    { "value": "cancelled", "label": "Cancelled", "color": "danger" }
  ],
  "priorities": [
    { "value": "low", "label": "Low", "color": "secondary" },
    { "value": "medium", "label": "Medium", "color": "warning" },
    { "value": "high", "label": "High", "color": "danger" },
    { "value": "urgent", "label": "Urgent", "color": "danger" }
  ]
}
```

## 🔄 **Real-time Events (WebSocket)**

### Events to Implement
- [ ] `job.status.updated` - When job status changes
- [ ] `job.assigned` - When technician is assigned
- [ ] `dashboard.metrics.updated` - Real-time dashboard updates

### Event Payload Examples:
```json
// job.status.updated
{
  "job_id": 1,
  "old_status": "pending",
  "new_status": "in_progress",
  "updated_by": "user_123",
  "timestamp": "2024-01-15T10:30:00Z"
}

// dashboard.metrics.updated  
{
  "active_jobs": 45,
  "online_teams": 12,
  "completed_today": 8,
  "revenue_today": 12500
}
```

## 📋 **Implementation Notes**

### Database Considerations
- Ensure proper indexing on frequently queried fields (status, customer_id, technician_id)
- Consider soft deletes for jobs and projects
- Add proper foreign key constraints

### Authentication & Authorization
- All endpoints should require authentication
- Consider role-based permissions (admin, dispatcher, technician)
- Rate limiting for API endpoints

### Performance Optimizations
- Implement pagination for list endpoints
- Use eager loading for related models
- Consider caching for frequently accessed data

### Error Handling
- Consistent error response format
- Proper HTTP status codes
- Validation error messages

## 🧪 **Testing Checklist**

### API Testing
- [ ] Unit tests for all endpoints
- [ ] Integration tests for complex workflows
- [ ] Load testing for high-traffic endpoints

### Frontend Integration Testing
- [ ] Test all API calls from frontend
- [ ] Verify error handling works correctly
- [ ] Test real-time updates

## 🚀 **Deployment Considerations**

### Environment Setup
- [ ] Configure WebSocket server (Reverb)
- [ ] Set up proper CORS headers
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging

### Performance Monitoring
- [ ] API response time monitoring
- [ ] WebSocket connection monitoring
- [ ] Error rate tracking 