# Date Formatting Composable

The `useDateFormatting` composable provides safe date formatting functions that handle Unix epoch dates (Dec 31, 1969) and other invalid dates gracefully.

## Problem Solved

When Unix timestamps are `0` or `null` in the database, they often display as "Dec 31, 1969" due to the Unix epoch. This composable automatically detects these problematic dates and replaces them with clean fallback text like "Date Missing".

## Usage

### Basic Import

```javascript
import { useDateFormatting } from '@/composables/useDateFormatting';

const { safeDate, formatDateTime, formatRelative, isEpochDate } = useDateFormatting();
```

### Quick Examples

```javascript
// Basic safe date formatting
safeDate('1969-12-31') // Returns: "Date Missing"
safeDate('2024-01-15') // Returns: "Jan 15, 2024"
safeDate(null)         // Returns: "Date Missing"
safeDate('')           // Returns: "Date Missing"

// Custom fallback text
safeDate('1969-12-31', 'No Date Available') // Returns: "No Date Available"

// Date with time
formatDateTime('2024-01-15T10:30:00Z') // Returns: "Jan 15, 2024 10:30 AM"

// Relative dates
formatRelative('2024-01-10') // Returns: "5 days ago" (if today is Jan 15)

// Check if date is Unix epoch
isEpochDate('1969-12-31') // Returns: true
isEpochDate('2024-01-15') // Returns: false
```

### Available Functions

#### `safeDate(dateInput, customFallback?)`
Quick format for common use cases. Shows "Date Missing" for Unix epoch dates.

```javascript
safeDate('2024-01-15')                    // "Jan 15, 2024"
safeDate('1969-12-31')                    // "Date Missing"
safeDate(null, 'Not Available')           // "Not Available"
```

#### `formatDate(dateInput, format?, fallback?)`
Format a date with safe handling for Unix epoch and invalid dates.

```javascript
formatDate('2024-01-15', 'short')         // "Jan 15, 2024"
formatDate('2024-01-15', 'long')          // "Monday, January 15, 2024"
formatDate('2024-01-15', 'mm/dd/yyyy')    // "01/15/2024"
formatDate('2024-01-15', 'iso')           // "2024-01-15"
```

#### `formatDateTime(dateInput, fallback?)`
Format date with time included.

```javascript
formatDateTime('2024-01-15T10:30:00Z')    // "Jan 15, 2024 10:30 AM"
formatDateTime('1969-12-31')              // "Date Missing"
```

#### `formatRelative(dateInput, fallback?)`
Format date relative to now.

```javascript
formatRelative('2024-01-10')              // "5 days ago"
formatRelative('2024-01-20')              // "in 5 days"
formatRelative('1969-12-31')              // "Date Missing"
```

#### `formatISO(dateInput, fallback?)`
Format date in ISO format (YYYY-MM-DD).

```javascript
formatISO('2024-01-15')                   // "2024-01-15"
formatISO('1969-12-31')                   // "Date Missing"
```

#### `formatLong(dateInput, fallback?)`
Format date in long format.

```javascript
formatLong('2024-01-15')                  // "Monday, January 15, 2024"
formatLong('1969-12-31')                  // "Date Missing"
```

#### `isEpochDate(dateInput)`
Check if a date is a Unix epoch date (1969-1970).

```javascript
isEpochDate('1969-12-31')                 // true
isEpochDate('1970-01-01')                 // true
isEpochDate('2024-01-15')                 // false
```

#### `isValidDate(dateInput)`
Check if a date is valid and not an epoch date.

```javascript
isValidDate('2024-01-15')                 // true
isValidDate('1969-12-31')                 // false
isValidDate(null)                         // false
isValidDate('invalid-date')               // false
```

## Migration from Old Code

### Before (problematic)
```javascript
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString();
};

// This would show "Dec 31, 1969" for Unix epoch dates
```

### After (safe)
```javascript
import { useDateFormatting } from '@/composables/useDateFormatting';

const { safeDate } = useDateFormatting();

const formatDate = (dateStr) => {
  return safeDate(dateStr); // Shows "Date Missing" for Unix epoch dates
};
```

## Template Usage

```vue
<template>
  <div>
    <!-- Direct usage in template -->
    <span>{{ safeDate(record.created_at) }}</span>
    
    <!-- With custom fallback -->
    <span>{{ safeDate(record.due_date, 'No Due Date') }}</span>
    
    <!-- In DataTable columns -->
    <Column field="created_at" header="Created">
      <template #body="{ data }">
        {{ safeDate(data.created_at) }}
      </template>
    </Column>
  </div>
</template>
```

## Supported Date Formats

The composable handles various input types:
- ISO strings: `"2024-01-15T10:30:00Z"`
- Date strings: `"2024-01-15"`, `"Jan 15, 2024"`
- Unix timestamps (seconds): `1705315800`
- Unix timestamps (milliseconds): `1705315800000`
- Date objects: `new Date()`
- Null/undefined values
- Empty strings

## Automatic Detection

The composable automatically detects and handles:
- Unix epoch dates (1969-1970)
- Invalid date strings
- Null/undefined values
- Empty strings
- Future dates beyond year 2100
- Negative timestamps

All problematic dates are replaced with the specified fallback text (default: "Date Missing"). 