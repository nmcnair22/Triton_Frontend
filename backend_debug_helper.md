# Backend Debug Helper - Customers API 500 Error

## 🚨 **Current Issue**
- **Error**: 500 Internal Server Error
- **Endpoint**: `GET http://localhost:8000/api/customers/?page=1&limit=25`
- **Status**: Backend server error (not frontend issue)

## 🔍 **Debugging Steps**

### 1. **Verify Backend Server Status**
```bash
# Check if Laravel server is running
curl -I http://localhost:8000/api/
# Expected: 200 OK or 404 (but not connection refused)

# Check Laravel logs
tail -f storage/logs/laravel.log
```

### 2. **Test API Endpoint Directly**
```bash
# Test the customers endpoint
curl -X GET "http://localhost:8000/api/customers/?page=1&limit=25" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -v

# Test without parameters
curl -X GET "http://localhost:8000/api/customers/" \
  -H "Accept: application/json" \
  -v
```

### 3. **Check Laravel Routes**
```bash
# In your Laravel backend directory
php artisan route:list | grep customers
# Should show: GET api/customers
```

### 4. **Common 500 Error Causes**

#### A. **Missing Route Definition**
Check `routes/api.php`:
```php
<?php
// Should have something like:
Route::get('/customers', [CustomerController::class, 'index']);
// OR
Route::apiResource('customers', CustomerController::class);
```

#### B. **Missing Controller**
Check if `app/Http/Controllers/CustomerController.php` exists:
```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        // This method should exist
        return response()->json([
            'data' => [],
            'meta' => [
                'current_page' => 1,
                'per_page' => 25,
                'total' => 0
            ]
        ]);
    }
}
```

#### C. **Database Issues**
```bash
# Check database connection
php artisan tinker
# Then run: DB::connection()->getPdo();

# Check if customers table exists
php artisan migrate:status
```

#### D. **Missing Model**
Check if `app/Models/Customer.php` exists:
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'name', 'email', 'phone', 'address', 'status'
    ];
}
```

### 5. **Quick Fix Implementation**

If the endpoint doesn't exist, here's a minimal implementation:

#### **routes/api.php**
```php
<?php
use App\Http\Controllers\CustomerController;

Route::get('/customers', [CustomerController::class, 'index']);
```

#### **app/Http/Controllers/CustomerController.php**
```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        // Mock data for MVP testing
        $mockCustomers = [
            [
                'id' => 1,
                'name' => 'ABC Corporation',
                'email' => 'contact@abc-corp.com',
                'phone' => '(555) 123-4567',
                'address' => '123 Business St, City, ST 12345',
                'status' => 'active',
                'total_projects' => 5,
                'active_jobs' => 2,
                'total_visits' => 15,
                'total_revenue' => 25000,
                'last_visit' => '2024-01-10',
                'health_score' => 85,
                'satisfaction_score' => 4.5
            ],
            [
                'id' => 2,
                'name' => 'XYZ Industries',
                'email' => 'info@xyz-industries.com',
                'phone' => '(555) 987-6543',
                'address' => '456 Industrial Ave, City, ST 12345',
                'status' => 'active',
                'total_projects' => 3,
                'active_jobs' => 1,
                'total_visits' => 8,
                'total_revenue' => 18000,
                'last_visit' => '2024-01-08',
                'health_score' => 92,
                'satisfaction_score' => 4.8
            ]
        ];

        $page = $request->get('page', 1);
        $limit = $request->get('limit', 25);
        
        return response()->json([
            'data' => $mockCustomers,
            'meta' => [
                'current_page' => (int) $page,
                'per_page' => (int) $limit,
                'total' => count($mockCustomers),
                'last_page' => 1
            ]
        ]);
    }
}
```

### 6. **Test After Implementation**
```bash
# Clear Laravel cache
php artisan config:clear
php artisan route:clear
php artisan cache:clear

# Test the endpoint again
curl -X GET "http://localhost:8000/api/customers/?page=1&limit=25" \
  -H "Accept: application/json"
```

### 7. **Frontend Verification**
After fixing the backend, the frontend should automatically work. You can verify by:
1. Refreshing the customers page
2. Checking browser console for successful API calls
3. Seeing customer data displayed in the UI

## 🎯 **Expected Response Format**
The frontend expects this JSON structure:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Customer Name",
      "email": "email@example.com",
      "phone": "(555) 123-4567",
      "address": "123 Main St",
      "status": "active",
      "total_projects": 5,
      "active_jobs": 2,
      "total_revenue": 25000,
      "health_score": 85
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 25,
    "total": 100,
    "last_page": 4
  }
}
```

## 📝 **Next Steps**
1. Check Laravel logs for specific error details
2. Implement the missing controller/route
3. Test with mock data first
4. Gradually add real database integration
5. Verify frontend displays data correctly 