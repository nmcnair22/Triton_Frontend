-- ==========================================
-- TEM PLATFORM ESSENTIAL QUERIES
-- ==========================================

-- 1. GET ALL TEM ACCOUNTS BY CUSTOMER WITH LOCATION DETAILS
-- This shows all active TEM accounts grouped by customer and location
SELECT 
    tmv.id_customer,
    c.name as customer_name,
    c.abbreviation as customer_abbr,
    tmv.id_location,
    l.name as location_name,
    l.siteNumber,
    l.address as location_address,
    l.city,
    l.state,
    l.zipcode,
    tmv.id_vendor as vendor_id,
    tmv.vendorName,
    tmv.providerName,
    tmv.accountNumber,
    tmv.expectedAmount as expected_monthly_amount,
    tmv.lastInvoice,
    tmv.lastBillDueDate,
    tmv.lastAmount,
    tmv.status,
    tmv.flagged,
    tmv.flaggedReason,
    tmv.multipleLocations,
    tmv.number_of_locations
FROM tem.temMasterViewUpdated tmv
LEFT JOIN cissdm.customers c ON c.id = tmv.id_customer
LEFT JOIN cissdm.locations l ON l.id = tmv.id_location
WHERE tmv.status = 1  -- Active accounts only
ORDER BY c.name, l.siteNumber, tmv.providerName;

-- 2. GET ALL BILLS FOR A SPECIFIC LOCATION
-- Replace :location_id with actual location ID
SELECT 
    tmv.id_location,
    l.name as location_name,
    l.siteNumber,
    tmv.vendorName,
    tmv.providerName,
    tmv.accountNumber,
    b.id as bill_id,
    b.invoiceNumber,
    b.invoiceDate,
    b.duedate,
    b.amount,
    b.paidAmount,
    b.dueAmount,
    b.status,
    CASE b.status
        WHEN 0 THEN 'Pending'
        WHEN 1 THEN 'Approved'
        WHEN 2 THEN 'Denied'
        WHEN 3 THEN 'Paid'
        ELSE 'Unknown'
    END as status_description,
    b.paymentStatus,
    CASE b.paymentStatus
        WHEN 0 THEN 'Not Paid'
        WHEN 1 THEN 'Paid'
        WHEN 2 THEN 'Partial'
        ELSE 'Unknown'
    END as payment_status_desc,
    b.funded,
    b.datePaid,
    b.audited_on
FROM tem.temMasterViewUpdated tmv
JOIN tem.bills b ON b.vendorId = tmv.id_vendor
LEFT JOIN cissdm.locations l ON l.id = tmv.id_location
WHERE tmv.id_location = :location_id  -- Replace with actual location ID
ORDER BY b.invoiceDate DESC;

-- 3. GET BILLS FOR A SPECIFIC CUSTOMER (ALL LOCATIONS)
-- Replace :customer_id with actual customer ID
SELECT 
    c.name as customer_name,
    l.name as location_name,
    l.siteNumber,
    tmv.providerName,
    tmv.vendorName,
    tmv.accountNumber,
    b.invoiceNumber,
    b.invoiceDate,
    b.duedate,
    b.amount,
    b.status,
    b.paymentStatus,
    b.funded,
    b.datePaid
FROM tem.temMasterViewUpdated tmv
JOIN tem.bills b ON b.vendorId = tmv.id_vendor
LEFT JOIN cissdm.customers c ON c.id = tmv.id_customer
LEFT JOIN cissdm.locations l ON l.id = tmv.id_location
WHERE tmv.id_customer = :customer_id  -- Replace with actual customer ID
ORDER BY b.invoiceDate DESC, l.siteNumber;

-- 4. PAYMENT HISTORY FOR A SPECIFIC VENDOR ACCOUNT
-- Replace :vendor_id with actual vendor ID
SELECT 
    v.name as vendor_name,
    v.accNumber as account_number,
    b.id as bill_id,
    b.invoiceNumber,
    b.invoiceDate,
    b.duedate,
    b.amount,
    b.paidAmount,
    b.datePaid,
    b.paymentStatus,
    b.funded,
    v.payBy as payment_method
FROM tem.vendors v
JOIN tem.bills b ON b.vendorId = v.id
WHERE v.id = :vendor_id  -- Replace with actual vendor ID
  AND b.paymentStatus = 1  -- Paid bills
ORDER BY b.datePaid DESC;

-- 5. CUSTOMER FUNDING STATUS
-- Shows the current funding balance for each customer
SELECT 
    c.id as customer_id,
    c.name as customer_name,
    c.abbreviation,
    f.amountFunded as total_funded,
    f.amountRemaining as balance_remaining,
    f.lastValidated,
    f.validationMsg,
    (SELECT SUM(d.amount) 
     FROM tem.deposits d 
     WHERE d.id_customer = c.id) as total_deposits,
    (SELECT COUNT(*) 
     FROM tem.temMasterViewUpdated tmv 
     WHERE tmv.id_customer = c.id AND tmv.status = 1) as active_accounts,
    (SELECT SUM(b.amount)
     FROM tem.bills b
     JOIN tem.temMasterViewUpdated tmv2 ON b.vendorId = tmv2.id_vendor
     WHERE tmv2.id_customer = c.id 
       AND b.invoiceDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       AND b.funded = 0) as unfunded_bills_30_days
FROM cissdm.customers c
LEFT JOIN tem.funding f ON f.id_customer = c.id
WHERE c.is_active = 1
ORDER BY c.name;

-- 6. RECENT DEPOSITS BY CUSTOMER
-- Shows deposit history with running balance
SELECT 
    d.id as deposit_id,
    c.name as customer_name,
    d.fundingDate,
    d.amount,
    d.description,
    d.payperiod,
    d.bank,
    SUM(d.amount) OVER (PARTITION BY d.id_customer ORDER BY d.fundingDate) as running_balance
FROM tem.deposits d
JOIN cissdm.customers c ON c.id = d.id_customer
WHERE d.fundingDate >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
ORDER BY d.fundingDate DESC;

-- 7. BILLS REQUIRING ATTENTION (UNPAID AND DUE SOON)
SELECT 
    c.name as customer_name,
    l.name as location_name,
    l.siteNumber,
    tmv.providerName,
    tmv.vendorName,
    tmv.accountNumber,
    b.invoiceNumber,
    b.invoiceDate,
    b.duedate,
    DATEDIFF(b.duedate, CURDATE()) as days_until_due,
    b.amount,
    b.status,
    b.paymentStatus,
    b.funded
FROM tem.bills b
JOIN tem.temMasterViewUpdated tmv ON b.vendorId = tmv.id_vendor
LEFT JOIN cissdm.customers c ON c.id = tmv.id_customer
LEFT JOIN cissdm.locations l ON l.id = tmv.id_location
WHERE b.paymentStatus = 0  -- Not paid
  AND b.duedate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
  AND tmv.status = 1  -- Active accounts only
ORDER BY b.duedate, c.name, l.siteNumber;

-- 8. MONTHLY SPEND BY PROVIDER FOR A CUSTOMER
-- Replace :customer_id and adjust date range as needed
SELECT 
    tmv.providerName,
    DATE_FORMAT(b.invoiceDate, '%Y-%m') as bill_month,
    COUNT(DISTINCT tmv.id_location) as location_count,
    COUNT(DISTINCT b.id) as bill_count,
    SUM(b.amount) as total_amount,
    AVG(b.amount) as avg_bill_amount
FROM tem.temMasterViewUpdated tmv
JOIN tem.bills b ON b.vendorId = tmv.id_vendor
WHERE tmv.id_customer = :customer_id  -- Replace with actual customer ID
  AND b.invoiceDate >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
GROUP BY tmv.providerName, DATE_FORMAT(b.invoiceDate, '%Y-%m')
ORDER BY bill_month DESC, tmv.providerName;

-- 9. ACCOUNTS WITH MISSING RECENT BILLS (POTENTIAL ISSUES)
-- Finds accounts that haven't received bills in over 45 days
SELECT 
    c.name as customer_name,
    l.name as location_name,
    l.siteNumber,
    tmv.providerName,
    tmv.vendorName,
    tmv.accountNumber,
    tmv.expectedAmount,
    tmv.lastInvoice,
    DATEDIFF(CURDATE(), tmv.lastInvoice) as days_since_last_bill,
    tmv.lastAmount
FROM tem.temMasterViewUpdated tmv
LEFT JOIN cissdm.customers c ON c.id = tmv.id_customer
LEFT JOIN cissdm.locations l ON l.id = tmv.id_location
WHERE tmv.status = 1  -- Active accounts
  AND (tmv.lastInvoice IS NULL OR tmv.lastInvoice < DATE_SUB(CURDATE(), INTERVAL 45 DAY))
ORDER BY days_since_last_bill DESC, c.name, l.siteNumber;

-- 10. FLAGGED ACCOUNTS REQUIRING REVIEW
SELECT 
    c.name as customer_name,
    l.name as location_name,
    l.siteNumber,
    tmv.providerName,
    tmv.vendorName,
    tmv.accountNumber,
    tmv.flaggedReason,
    tmv.lastInvoice,
    tmv.lastAmount,
    v.balance as vendor_balance
FROM tem.temMasterViewUpdated tmv
LEFT JOIN cissdm.customers c ON c.id = tmv.id_customer
LEFT JOIN cissdm.locations l ON l.id = tmv.id_location
LEFT JOIN tem.vendors v ON v.id = tmv.id_vendor
WHERE tmv.flagged = 1
ORDER BY c.name, l.siteNumber;

-- 11. CONSOLIDATED VIEW - ACCOUNT DETAILS WITH RECENT BILLS
-- Comprehensive view for a specific customer showing all accounts and recent bills
-- Replace :customer_id with actual customer ID
SELECT 
    tmv.id as master_id,
    c.name as customer_name,
    l.siteNumber,
    l.name as location_name,
    CONCAT(l.address, ', ', l.city, ', ', l.state, ' ', l.zipcode) as location_address,
    tmv.providerName,
    tmv.vendorName,
    tmv.accountNumber,
    tmv.expectedAmount,
    v.payBy as payment_method,
    v.nameOnCheck,
    CONCAT(v.address1, ' ', IFNULL(v.address2, ''), ', ', v.addressCity, ', ', v.addressState, ' ', v.addressZip) as payment_address,
    -- Most recent bill info
    (SELECT b1.invoiceNumber FROM tem.bills b1 WHERE b1.vendorId = tmv.id_vendor ORDER BY b1.invoiceDate DESC LIMIT 1) as last_invoice_number,
    (SELECT b2.invoiceDate FROM tem.bills b2 WHERE b2.vendorId = tmv.id_vendor ORDER BY b2.invoiceDate DESC LIMIT 1) as last_invoice_date,
    (SELECT b3.amount FROM tem.bills b3 WHERE b3.vendorId = tmv.id_vendor ORDER BY b3.invoiceDate DESC LIMIT 1) as last_invoice_amount,
    (SELECT b4.paymentStatus FROM tem.bills b4 WHERE b4.vendorId = tmv.id_vendor ORDER BY b4.invoiceDate DESC LIMIT 1) as last_payment_status,
    -- Bill statistics
    (SELECT COUNT(*) FROM tem.bills b5 WHERE b5.vendorId = tmv.id_vendor) as total_bills,
    (SELECT SUM(b6.amount) FROM tem.bills b6 WHERE b6.vendorId = tmv.id_vendor AND b6.invoiceDate >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)) as total_12_months,
    (SELECT AVG(b7.amount) FROM tem.bills b7 WHERE b7.vendorId = tmv.id_vendor AND b7.invoiceDate >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)) as avg_3_months
FROM tem.temMasterViewUpdated tmv
LEFT JOIN cissdm.customers c ON c.id = tmv.id_customer
LEFT JOIN cissdm.locations l ON l.id = tmv.id_location
LEFT JOIN tem.vendors v ON v.id = tmv.id_vendor
WHERE tmv.id_customer = :customer_id  -- Replace with actual customer ID
  AND tmv.status = 1
ORDER BY l.siteNumber, tmv.providerName;

-- 12. AUDIT LOG ENTRIES
-- Shows recent audit activities
SELECT 
    ta.id,
    ta.`Account Number` as account_number,
    ta.`Customer` as customer,
    ta.Location as location,
    ta.Vendor as vendor,
    ta.`Next Bill Due` as next_bill_due,
    ta.`Expected Amount` as expected_amount,
    ta.`Last Invoice` as last_invoice,
    ta.`Overdue/payment due w/in a week?` as payment_urgent,
    ta.`AutoPay Disabled?` as autopay_disabled,
    ta.`If Failed, why?` as failure_reason,
    ta.`Bill Redirected?` as bill_redirected,
    ta.`Account Status` as account_status,
    ta.Notes as notes,
    ta.`Date Added` as date_added
FROM tem.tem_audit ta
WHERE ta.`Date Added` >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
ORDER BY ta.`Date Added` DESC;

-- 13. BILLING TRENDS - MONTH OVER MONTH COMPARISON
-- Shows billing trends by provider for analysis
SELECT 
    tmv.providerName,
    DATE_FORMAT(b.invoiceDate, '%Y-%m') as bill_month,
    COUNT(DISTINCT tmv.id_location) as locations_billed,
    COUNT(b.id) as bill_count,
    SUM(b.amount) as total_amount,
    AVG(b.amount) as avg_amount,
    MIN(b.amount) as min_amount,
    MAX(b.amount) as max_amount,
    LAG(SUM(b.amount), 1) OVER (PARTITION BY tmv.providerName ORDER BY DATE_FORMAT(b.invoiceDate, '%Y-%m')) as prev_month_total,
    ROUND(((SUM(b.amount) - LAG(SUM(b.amount), 1) OVER (PARTITION BY tmv.providerName ORDER BY DATE_FORMAT(b.invoiceDate, '%Y-%m'))) / 
           LAG(SUM(b.amount), 1) OVER (PARTITION BY tmv.providerName ORDER BY DATE_FORMAT(b.invoiceDate, '%Y-%m'))) * 100, 2) as pct_change
FROM tem.temMasterViewUpdated tmv
JOIN tem.bills b ON b.vendorId = tmv.id_vendor
WHERE b.invoiceDate >= DATE_SUB(CURDATE(), INTERVAL 13 MONTH)
  AND tmv.status = 1
GROUP BY tmv.providerName, DATE_FORMAT(b.invoiceDate, '%Y-%m')
ORDER BY tmv.providerName, bill_month DESC;



-- Example: Get all AT&T accounts for Hot Topic with recent billing
SELECT 
    l.siteNumber,
    l.name as location_name,
    CONCAT(l.city, ', ', l.state) as location,
    tmv.accountNumber as att_account,
    tmv.expectedAmount as expected_monthly,
    b.invoiceNumber,
    DATE(b.invoiceDate) as invoice_date,
    b.amount,
    CASE b.paymentStatus 
        WHEN 1 THEN 'Paid'
        WHEN 0 THEN 'Unpaid'
        ELSE 'Other'
    END as payment_status,
    b.funded
FROM tem.temMasterViewUpdated tmv
JOIN cissdm.locations l ON l.id = tmv.id_location
LEFT JOIN tem.bills b ON b.vendorId = tmv.id_vendor 
    AND b.invoiceDate >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
WHERE tmv.id_customer = (SELECT id FROM cissdm.customers WHERE abbreviation = 'HT')
  AND tmv.providerName LIKE '%AT&T%'
  AND tmv.status = 1
ORDER BY l.siteNumber, b.invoiceDate DESC
LIMIT 10;

-- Funding status for top customers with recent deposits
SELECT 
    c.name as customer_name,
    c.abbreviation,
    f.amountFunded as total_funded,
    f.amountRemaining as balance_remaining,
    DATE(f.lastValidated) as last_validated,
    -- Recent deposits
    (SELECT COUNT(*) FROM tem.deposits d WHERE d.id_customer = c.id) as total_deposit_count,
    (SELECT SUM(amount) FROM tem.deposits d WHERE d.id_customer = c.id) as total_deposits_all_time,
    -- Recent funding activity
    (SELECT MAX(fundingDate) FROM tem.deposits d WHERE d.id_customer = c.id) as last_deposit_date,
    (SELECT amount FROM tem.deposits d WHERE d.id_customer = c.id ORDER BY fundingDate DESC LIMIT 1) as last_deposit_amount,
    -- Upcoming bills needing funding
    (SELECT COUNT(*) FROM tem.bills b 
     JOIN tem.temMasterViewUpdated tmv ON b.vendorId = tmv.id_vendor 
     WHERE tmv.id_customer = c.id 
       AND b.duedate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
       AND b.paymentStatus = 0) as unpaid_bills_next_30_days,
    (SELECT SUM(b.amount) FROM tem.bills b 
     JOIN tem.temMasterViewUpdated tmv ON b.vendorId = tmv.id_vendor 
     WHERE tmv.id_customer = c.id 
       AND b.duedate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
       AND b.paymentStatus = 0) as amount_due_next_30_days
FROM cissdm.customers c
LEFT JOIN tem.funding f ON f.id_customer = c.id
WHERE c.is_active = 1
  AND f.amountFunded IS NOT NULL
ORDER BY f.amountRemaining DESC
LIMIT 10;

-- Sample data showing the relationship between customers, locations, vendors and bills
SELECT 
    c.name as customer_name,
    c.abbreviation,
    COUNT(DISTINCT tmv.id_location) as location_count,
    COUNT(DISTINCT tmv.id_vendor) as vendor_account_count,
    COUNT(DISTINCT tmv.providerName) as unique_providers,
    COUNT(DISTINCT b.id) as total_bills,
    MIN(b.invoiceDate) as earliest_bill,
    MAX(b.invoiceDate) as latest_bill,
    SUM(b.amount) as total_billed_amount
FROM tem.temMasterViewUpdated tmv
LEFT JOIN cissdm.customers c ON c.id = tmv.id_customer
LEFT JOIN tem.bills b ON b.vendorId = tmv.id_vendor
WHERE tmv.status = 1
  AND c.is_active = 1
GROUP BY c.id, c.name, c.abbreviation
ORDER BY vendor_account_count DESC
LIMIT 10;
-- ================================================
-- TEM PLATFORM COMPREHENSIVE QUERY TOOLSET
-- ================================================
-- Version 2.0 - Complete Toolset for Telecom Expense Management
-- Databases: tem (TEM data), cissdm (Customer/Location data)


-- ================================================
-- SECTION 1: ACCOUNT DISCOVERY & OVERVIEW
-- ================================================

-- 1.1 MASTER ACCOUNT INVENTORY BY CUSTOMER
-- Complete view of all accounts with full location and vendor details
SELECT 
    c.id as customer_id,
    c.name as customer_name,
    c.abbreviation as customer_code,
    l.id as location_id,
    l.siteNumber,
    l.name as location_name,
    CONCAT(l.address, ', ', l.city, ', ', l.state, ' ', l.zipcode) as full_address,
    tmv.id_vendor,
    tmv.providerName as provider,
    tmv.vendorName as vendor,
    tmv.accountNumber,
    tmv.billType,
    tmv.payType,
    tmv.expectedAmount as monthly_expected,
    tmv.lastInvoice as last_invoice_date,
    tmv.lastBillDueDate as last_due_date,
    tmv.lastAmount as last_amount,
    CASE tmv.status
        WHEN 1 THEN 'Active'
        WHEN 0 THEN 'Inactive'
        ELSE 'Unknown'
    END as account_status,
    tmv.flagged,
    tmv.flaggedReason,
    tmv.multipleLocations,
    tmv.number_of_locations,
    v.payBy as payment_method,
    v.balance as vendor_balance
FROM tem.temMasterViewUpdated tmv
LEFT JOIN cissdm.customers c ON c.id = tmv.id_customer
LEFT JOIN cissdm.locations l ON l.id = tmv.id_location
LEFT JOIN tem.vendors v ON v.id = tmv.id_vendor
WHERE 1=1
  -- Add filters as needed:
  -- AND c.id = :customer_id
  -- AND tmv.status = 1
  -- AND tmv.providerName LIKE '%AT&T%'
ORDER BY c.name, l.siteNumber, tmv.providerName;


-- 1.2 CUSTOMER SUMMARY DASHBOARD
-- High-level metrics per customer
SELECT 
    c.id as customer_id,
    c.name as customer_name,
    c.abbreviation,
    COUNT(DISTINCT tmv.id_location) as total_locations,
    COUNT(DISTINCT tmv.id_vendor) as total_accounts,
    COUNT(DISTINCT CASE WHEN tmv.status = 1 THEN tmv.id_vendor END) as active_accounts,
    COUNT(DISTINCT CASE WHEN tmv.flagged = 1 THEN tmv.id_vendor END) as flagged_accounts,
    COUNT(DISTINCT tmv.providerName) as unique_providers,
    SUM(CASE WHEN tmv.status = 1 THEN tmv.expectedAmount ELSE 0 END) as total_monthly_expected,
    -- Recent activity
    COUNT(DISTINCT b.id) as bills_last_30_days,
    SUM(CASE WHEN b.invoiceDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN b.amount ELSE 0 END) as amount_last_30_days,
    -- Funding status
    f.amountFunded as total_funded,
    f.amountRemaining as funding_balance,
    -- Issues
    COUNT(DISTINCT CASE WHEN b.paymentStatus = 0 AND b.duedate < CURDATE() THEN b.id END) as overdue_bills
FROM cissdm.customers c
LEFT JOIN tem.temMasterViewUpdated tmv ON tmv.id_customer = c.id
LEFT JOIN tem.bills b ON b.vendorId = tmv.id_vendor AND b.invoiceDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
LEFT JOIN tem.funding f ON f.id_customer = c.id
WHERE c.is_active = 1
GROUP BY c.id, c.name, c.abbreviation, f.amountFunded, f.amountRemaining
ORDER BY c.name;


-- 1.3 PROVIDER DISTRIBUTION ANALYSIS
-- Shows provider breakdown by customer
SELECT 
    c.name as customer_name,
    tmv.providerName,
    COUNT(DISTINCT tmv.id_location) as locations_served,
    COUNT(DISTINCT tmv.id_vendor) as account_count,
    SUM(tmv.expectedAmount) as total_monthly_expected,
    AVG(tmv.expectedAmount) as avg_monthly_per_account,
    MIN(tmv.expectedAmount) as min_monthly,
    MAX(tmv.expectedAmount) as max_monthly,
    COUNT(CASE WHEN tmv.flagged = 1 THEN 1 END) as flagged_accounts
FROM tem.temMasterViewUpdated tmv
JOIN cissdm.customers c ON c.id = tmv.id_customer
WHERE tmv.status = 1
  -- AND c.id = :customer_id
GROUP BY c.id, c.name, tmv.providerName
ORDER BY c.name, total_monthly_expected DESC;


-- ================================================
-- SECTION 2: BILLING OPERATIONS
-- ================================================

-- 2.1 CURRENT BILLING CYCLE OVERVIEW
-- Bills due in the next 30 days
SELECT 
    c.name as customer_name,
    l.siteNumber,
    l.name as location_name,
    tmv.providerName,
    tmv.accountNumber,
    b.invoiceNumber,
    b.invoiceDate,
    b.duedate,
    DATEDIFF(b.duedate, CURDATE()) as days_until_due,
    b.amount,
    CASE b.status
        WHEN 0 THEN 'Pending'
        WHEN 1 THEN 'Approved'
        WHEN 2 THEN 'Denied'
        WHEN 3 THEN 'Paid'
        ELSE 'Unknown'
    END as bill_status,
    CASE b.paymentStatus
        WHEN 0 THEN 'Not Paid'
        WHEN 1 THEN 'Paid'
        WHEN 2 THEN 'Partial'
        ELSE 'Unknown'
    END as payment_status,
    b.funded,
    b.hasAutoPay
FROM tem.bills b
JOIN tem.temMasterViewUpdated tmv ON b.vendorId = tmv.id_vendor
LEFT JOIN cissdm.customers c ON c.id = tmv.id_customer
LEFT JOIN cissdm.locations l ON l.id = tmv.id_location
WHERE b.duedate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
  AND tmv.status = 1
  -- AND c.id = :customer_id
ORDER BY b.duedate, c.name, l.siteNumber;


-- 2.2 OVERDUE BILLS REPORT
-- Critical bills past due date
SELECT 
    c.name as customer_name,
    l.siteNumber,
    l.name as location_name,
    tmv.providerName,
    tmv.accountNumber,
    b.invoiceNumber,
    b.invoiceDate,
    b.duedate,
    DATEDIFF(CURDATE(), b.duedate) as days_overdue,
    b.amount,
    b.dueAmount,
    CASE b.status
        WHEN 0 THEN 'Pending'
        WHEN 1 THEN 'Approved'
        WHEN 2 THEN 'Denied'
        WHEN 3 THEN 'Paid'
    END as bill_status,
    b.funded,
    b.reasonDenied
FROM tem.bills b
JOIN tem.temMasterViewUpdated tmv ON b.vendorId = tmv.id_vendor
LEFT JOIN cissdm.customers c ON c.id = tmv.id_customer
LEFT JOIN cissdm.locations l ON l.id = tmv.id_location
WHERE b.paymentStatus = 0
  AND b.duedate < CURDATE()
  AND tmv.status = 1
ORDER BY days_overdue DESC, c.name, l.siteNumber;


-- 2.3 BILL PAYMENT TRACKING
-- Complete payment history with details
SELECT 
    c.name as customer_name,
    l.name as location_name,
    tmv.providerName,
    tmv.accountNumber,
    b.invoiceNumber,
    b.invoiceDate,
    b.duedate,
    b.amount as bill_amount,
    b.paidAmount,
    b.dueAmount as remaining_due,
    CASE b.paymentStatus
        WHEN 0 THEN 'Not Paid'
        WHEN 1 THEN 'Paid'
        WHEN 2 THEN 'Partial'
    END as payment_status,
    b.datePaid,
    DATEDIFF(b.datePaid, b.duedate) as days_early_late,
    b.funded,
    v.payBy as payment_method
FROM tem.bills b
JOIN tem.temMasterViewUpdated tmv ON b.vendorId = tmv.id_vendor
LEFT JOIN tem.vendors v ON v.id = tmv.id_vendor
LEFT JOIN cissdm.customers c ON c.id = tmv.id_customer
LEFT JOIN cissdm.locations l ON l.id = tmv.id_location
WHERE b.invoiceDate >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
  -- AND c.id = :customer_id
  -- AND b.paymentStatus = 1  -- Only paid bills
ORDER BY b.datePaid DESC, c.name;


-- 2.4 BILLING VARIANCE ANALYSIS
-- Compare actual vs expected amounts
SELECT 
    c.name as customer_name,
    l.siteNumber,
    l.name as location_name,
    tmv.providerName,
    tmv.accountNumber,
    tmv.expectedAmount,
    b.invoiceNumber,
    b.invoiceDate,
    b.amount as actual_amount,
    (b.amount - tmv.expectedAmount) as variance,
    ROUND(((b.amount - tmv.expectedAmount) / tmv.expectedAmount * 100), 2) as variance_pct,
    CASE 
        WHEN ABS(b.amount - tmv.expectedAmount) > (tmv.expectedAmount * 0.10) THEN 'High Variance'
        WHEN ABS(b.amount - tmv.expectedAmount) > (tmv.expectedAmount * 0.05) THEN 'Medium Variance'
        ELSE 'Normal'
    END as variance_flag
FROM tem.bills b
JOIN tem.temMasterViewUpdated tmv ON b.vendorId = tmv.id_vendor
LEFT JOIN cissdm.customers c ON c.id = tmv.id_customer
LEFT JOIN cissdm.locations l ON l.id = tmv.id_location
WHERE b.invoiceDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
  AND tmv.expectedAmount > 0
  AND tmv.status = 1
  -- AND c.id = :customer_id
ORDER BY variance_pct DESC;


-- ================================================
-- SECTION 3: FUNDING MANAGEMENT
-- ================================================

-- 3.1 CUSTOMER FUNDING STATUS DASHBOARD
SELECT 
    c.id as customer_id,
    c.name as customer_name,
    c.abbreviation,
    f.amountFunded as total_funded,
    f.amountRemaining as current_balance,
    DATE(f.lastValidated) as last_validated,
    f.validationMsg,
    -- Recent deposits
    (SELECT MAX(fundingDate) FROM tem.deposits WHERE id_customer = c.id) as last_deposit_date,
    (SELECT SUM(amount) FROM tem.deposits WHERE id_customer = c.id AND fundingDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as deposits_30_days,
    -- Upcoming obligations
    (SELECT SUM(b.amount) 
     FROM tem.bills b 
     JOIN tem.temMasterViewUpdated tmv ON b.vendorId = tmv.id_vendor
     WHERE tmv.id_customer = c.id 
       AND b.duedate <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
       AND b.paymentStatus = 0) as unpaid_next_30_days,
    -- Calculate funding sufficiency
    CASE 
        WHEN f.amountRemaining >= (SELECT SUM(b.amount) FROM tem.bills b JOIN tem.temMasterViewUpdated tmv ON b.vendorId = tmv.id_vendor WHERE tmv.id_customer = c.id AND b.duedate <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND b.paymentStatus = 0) THEN 'Sufficient'
        WHEN f.amountRemaining > 0 THEN 'Low Balance'
        ELSE 'Insufficient'
    END as funding_status
FROM cissdm.customers c
LEFT JOIN tem.funding f ON f.id_customer = c.id
WHERE c.is_active = 1
ORDER BY funding_status DESC, c.name;


-- 3.2 DEPOSIT HISTORY WITH RUNNING BALANCE
SELECT 
    c.name as customer_name,
    d.id as deposit_id,
    d.fundingDate,
    d.amount,
    d.description,
    d.payperiod,
    d.bank,
    SUM(d.amount) OVER (PARTITION BY d.id_customer ORDER BY d.fundingDate) as running_total,
    -- Show impact on funding
    (SELECT COUNT(*) FROM tem.bills b 
     JOIN tem.temMasterViewUpdated tmv ON b.vendorId = tmv.id_vendor 
     WHERE tmv.id_customer = c.id 
       AND b.funded = 1 
       AND DATE(b.updated_at) = d.fundingDate) as bills_funded_same_day
FROM tem.deposits d
JOIN cissdm.customers c ON c.id = d.id_customer
WHERE d.fundingDate >= DATE_SUB(CURDATE(), INTERVAL 180 DAY)
ORDER BY d.fundingDate DESC, c.name;


-- 3.3 UNFUNDED BILLS REQUIRING ATTENTION
SELECT 
    c.name as customer_name,
    l.name as location_name,
    tmv.providerName,
    tmv.accountNumber,
    b.invoiceNumber,
    b.invoiceDate,
    b.duedate,
    DATEDIFF(b.duedate, CURDATE()) as days_until_due,
    b.amount,
    f.amountRemaining as customer_balance,
    CASE 
        WHEN f.amountRemaining >= b.amount THEN 'Can Fund'
        ELSE 'Insufficient Funds'
    END as funding_availability
FROM tem.bills b
JOIN tem.temMasterViewUpdated tmv ON b.vendorId = tmv.id_vendor
LEFT JOIN cissdm.customers c ON c.id = tmv.id_customer
LEFT JOIN cissdm.locations l ON l.id = tmv.id_location
LEFT JOIN tem.funding f ON f.id_customer = c.id
WHERE b.funded = 0
  AND b.paymentStatus = 0
  AND b.duedate <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
  AND tmv.status = 1
ORDER BY days_until_due, c.name;


-- ================================================
-- SECTION 4: AUDIT & COMPLIANCE
-- ================================================

-- 4.1 FLAGGED ACCOUNTS DETAIL REPORT
SELECT 
    c.name as customer_name,
    l.siteNumber,
    l.name as location_name,
    tmv.providerName,
    tmv.vendorName,
    tmv.accountNumber,
    tmv.flagged,
    tmv.flaggedReason,
    tmv.lastInvoice,
    DATEDIFF(CURDATE(), tmv.lastInvoice) as days_since_last_bill,
    tmv.lastAmount,
    tmv.expectedAmount,
    v.balance as vendor_balance,
    -- Recent bill activity
    (SELECT COUNT(*) FROM tem.bills WHERE vendorId = tmv.id_vendor AND invoiceDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as bills_last_30_days
FROM tem.temMasterViewUpdated tmv
LEFT JOIN cissdm.customers c ON c.id = tmv.id_customer
LEFT JOIN cissdm.locations l ON l.id = tmv.id_location
LEFT JOIN tem.vendors v ON v.id = tmv.id_vendor
WHERE tmv.flagged = 1
ORDER BY c.name, l.siteNumber;


-- 4.2 MISSING BILLS DETECTION
-- Accounts with no recent billing activity
SELECT 
    c.name as customer_name,
    l.siteNumber,
    l.name as location_name,
    tmv.providerName,
    tmv.accountNumber,
    tmv.expectedAmount,
    tmv.lastInvoice,
    DATEDIFF(CURDATE(), tmv.lastInvoice) as days_since_last_bill,
    tmv.lastAmount,
    -- Check for pattern
    CASE 
        WHEN DATEDIFF(CURDATE(), tmv.lastInvoice) > 60 THEN 'Critical - No bill >60 days'
        WHEN DATEDIFF(CURDATE(), tmv.lastInvoice) > 45 THEN 'Warning - No bill >45 days'
        WHEN DATEDIFF(CURDATE(), tmv.lastInvoice) > 35 THEN 'Review - No bill >35 days'
        ELSE 'Normal'
    END as alert_level
FROM tem.temMasterViewUpdated tmv
LEFT JOIN cissdm.customers c ON c.id = tmv.id_customer
LEFT JOIN cissdm.locations l ON l.id = tmv.id_location
WHERE tmv.status = 1
  AND (tmv.lastInvoice IS NULL OR tmv.lastInvoice < DATE_SUB(CURDATE(), INTERVAL 35 DAY))
ORDER BY days_since_last_bill DESC, c.name, l.siteNumber;


-- 4.3 AUDIT TRAIL REVIEW
SELECT 
    ta.id as audit_id,
    ta.`Customer` as customer,
    ta.Location as location,
    ta.`Account Number` as account_number,
    ta.Vendor as vendor,
    ta.`Next Bill Due` as next_bill_due,
    ta.`Expected Amount` as expected_amount,
    ta.`Last Invoice` as last_invoice,
    ta.`Overdue/payment due w/in a week?` as urgent_flag,
    ta.`AutoPay Disabled?` as autopay_disabled,
    ta.`If Failed, why?` as failure_reason,
    ta.`Bill Redirected?` as bill_redirected,
    ta.`Account Status` as account_status,
    ta.Notes,
    ta.`Date Added` as audit_date
FROM tem.tem_audit ta
WHERE ta.`Date Added` >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
  -- AND ta.Customer LIKE '%customer_name%'
ORDER BY ta.`Date Added` DESC;


-- 4.4 DUPLICATE ACCOUNT DETECTION
SELECT 
    c.name as customer_name,
    tmv.accountNumber,
    tmv.providerName,
    COUNT(*) as duplicate_count,
    GROUP_CONCAT(DISTINCT l.siteNumber ORDER BY l.siteNumber) as site_numbers,
    GROUP_CONCAT(DISTINCT l.name ORDER BY l.name SEPARATOR ' | ') as location_names,
    SUM(tmv.expectedAmount) as total_expected_amount
FROM tem.temMasterViewUpdated tmv
JOIN cissdm.customers c ON c.id = tmv.id_customer
LEFT JOIN cissdm.locations l ON l.id = tmv.id_location
WHERE tmv.status = 1
GROUP BY c.id, c.name, tmv.accountNumber, tmv.providerName
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, c.name;


-- ================================================
-- SECTION 5: ANALYTICS & TRENDS
-- ================================================

-- 5.1 MONTHLY SPEND TREND BY CUSTOMER
SELECT 
    c.name as customer_name,
    DATE_FORMAT(b.invoiceDate, '%Y-%m') as billing_month,
    COUNT(DISTINCT tmv.id_location) as locations_billed,
    COUNT(DISTINCT tmv.providerName) as providers,
    COUNT(b.id) as total_bills,
    SUM(b.amount) as total_amount,
    AVG(b.amount) as avg_bill,
    MIN(b.amount) as min_bill,
    MAX(b.amount) as max_bill,
    -- Month over month comparison
    LAG(SUM(b.amount), 1) OVER (PARTITION BY c.id ORDER BY DATE_FORMAT(b.invoiceDate, '%Y-%m')) as prev_month_total,
    ROUND(((SUM(b.amount) - LAG(SUM(b.amount), 1) OVER (PARTITION BY c.id ORDER BY DATE_FORMAT(b.invoiceDate, '%Y-%m'))) / 
           NULLIF(LAG(SUM(b.amount), 1) OVER (PARTITION BY c.id ORDER BY DATE_FORMAT(b.invoiceDate, '%Y-%m')), 0)) * 100, 2) as mom_change_pct
FROM tem.bills b
JOIN tem.temMasterViewUpdated tmv ON b.vendorId = tmv.id_vendor
JOIN cissdm.customers c ON c.id = tmv.id_customer
WHERE b.invoiceDate >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
  -- AND c.id = :customer_id
GROUP BY c.id, c.name, DATE_FORMAT(b.invoiceDate, '%Y-%m')
ORDER BY c.name, billing_month DESC;


-- 5.2 PROVIDER PERFORMANCE METRICS
SELECT 
    tmv.providerName,
    COUNT(DISTINCT c.id) as customer_count,
    COUNT(DISTINCT tmv.id_location) as total_locations,
    COUNT(DISTINCT tmv.id_vendor) as total_accounts,
    -- Billing metrics
    COUNT(DISTINCT b.id) as total_bills_processed,
    AVG(DATEDIFF(b.datePaid, b.invoiceDate)) as avg_days_to_payment,
    SUM(CASE WHEN b.paymentStatus = 1 THEN 1 ELSE 0 END) / COUNT(b.id) * 100 as payment_success_rate,
    -- Financial metrics
    SUM(b.amount) as total_revenue,
    AVG(b.amount) as avg_bill_amount,
    -- Issues
    SUM(CASE WHEN tmv.flagged = 1 THEN 1 ELSE 0 END) as flagged_accounts,
    SUM(CASE WHEN b.status = 2 THEN 1 ELSE 0 END) as denied_bills
FROM tem.temMasterViewUpdated tmv
LEFT JOIN tem.bills b ON b.vendorId = tmv.id_vendor
LEFT JOIN cissdm.customers c ON c.id = tmv.id_customer
WHERE tmv.status = 1
GROUP BY tmv.providerName
ORDER BY total_revenue DESC;


-- 5.3 LOCATION COST ANALYSIS
SELECT 
    c.name as customer_name,
    l.siteNumber,
    l.name as location_name,
    l.city,
    l.state,
    COUNT(DISTINCT tmv.id_vendor) as account_count,
    COUNT(DISTINCT tmv.providerName) as provider_count,
    SUM(tmv.expectedAmount) as total_monthly_expected,
    -- Actual billing
    COUNT(DISTINCT b.id) as bills_last_90_days,
    SUM(CASE WHEN b.invoiceDate >= DATE_SUB(CURDATE(), INTERVAL 90 DAY) THEN b.amount ELSE 0 END) as actual_90_days,
    AVG(CASE WHEN b.invoiceDate >= DATE_SUB(CURDATE(), INTERVAL 90 DAY) THEN b.amount END) as avg_bill_90_days,
    -- Cost per provider breakdown
    GROUP_CONCAT(DISTINCT CONCAT(tmv.providerName, ':', ROUND(tmv.expectedAmount, 2)) ORDER BY tmv.expectedAmount DESC SEPARATOR ' | ') as provider_breakdown
FROM cissdm.locations l
JOIN tem.temMasterViewUpdated tmv ON tmv.id_location = l.id
JOIN cissdm.customers c ON c.id = tmv.id_customer
LEFT JOIN tem.bills b ON b.vendorId = tmv.id_vendor AND b.invoiceDate >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
WHERE tmv.status = 1
  -- AND c.id = :customer_id
GROUP BY c.id, c.name, l.id, l.siteNumber, l.name, l.city, l.state
ORDER BY total_monthly_expected DESC;


-- 5.4 YEAR OVER YEAR COMPARISON
SELECT 
    c.name as customer_name,
    YEAR(b.invoiceDate) as bill_year,
    COUNT(DISTINCT MONTH(b.invoiceDate)) as months_with_bills,
    COUNT(DISTINCT tmv.id_location) as locations_billed,
    COUNT(DISTINCT tmv.id_vendor) as accounts_billed,
    COUNT(b.id) as total_bills,
    SUM(b.amount) as total_spend,
    AVG(b.amount) as avg_bill,
    MIN(b.amount) as min_bill,
    MAX(b.amount) as max_bill,
    -- Payment performance
    AVG(CASE WHEN b.paymentStatus = 1 THEN DATEDIFF(b.datePaid, b.duedate) END) as avg_days_early_late,
    SUM(CASE WHEN b.paymentStatus = 1 THEN 1 ELSE 0 END) / COUNT(b.id) * 100 as payment_rate
FROM tem.bills b
JOIN tem.temMasterViewUpdated tmv ON b.vendorId = tmv.id_vendor
JOIN cissdm.customers c ON c.id = tmv.id_customer
WHERE b.invoiceDate >= DATE_SUB(CURDATE(), INTERVAL 3 YEAR)
  -- AND c.id = :customer_id
GROUP BY c.id, c.name, YEAR(b.invoiceDate)
ORDER BY c.name, bill_year DESC;


-- ================================================
-- SECTION 6: OPERATIONAL REPORTS
-- ================================================

-- 6.1 AUTOPAY STATUS REPORT
SELECT 
    c.name as customer_name,
    l.siteNumber,
    l.name as location_name,
    tmv.providerName,
    tmv.accountNumber,
    tmv.payType,
    v.payBy as payment_method,
    -- AutoPay analysis from recent bills
    SUM(CASE WHEN b.hasAutoPay = 1 THEN 1 ELSE 0 END) as autopay_bills,
    COUNT(b.id) as total_bills,
    ROUND(SUM(CASE WHEN b.hasAutoPay = 1 THEN 1 ELSE 0 END) / COUNT(b.id) * 100, 2) as autopay_rate,
    MAX(b.invoiceDate) as last_bill_date
FROM tem.temMasterViewUpdated tmv
JOIN tem.vendors v ON v.id = tmv.id_vendor
LEFT JOIN tem.bills b ON b.vendorId = tmv.id_vendor AND b.invoiceDate >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
LEFT JOIN cissdm.customers c ON c.id = tmv.id_customer
LEFT JOIN cissdm.locations l ON l.id = tmv.id_location
WHERE tmv.status = 1
GROUP BY c.id, c.name, l.id, l.siteNumber, l.name, tmv.id_vendor, tmv.providerName, tmv.accountNumber, tmv.payType, v.payBy
HAVING COUNT(b.id) > 0
ORDER BY autopay_rate ASC, c.name, l.siteNumber;


-- 6.2 PAYMENT ADDRESS VERIFICATION
SELECT 
    c.name as customer_name,
    tmv.providerName,
    COUNT(DISTINCT tmv.id_vendor) as account_count,
    v.nameOnCheck,
    v.address1,
    v.address2,
    v.addressCity,
    v.addressState,
    v.addressZip,
    v.addressValidated,
    v.payBy as payment_method,
    GROUP_CONCAT(DISTINCT tmv.accountNumber ORDER BY tmv.accountNumber SEPARATOR ', ') as account_numbers
FROM tem.temMasterViewUpdated tmv
JOIN tem.vendors v ON v.id = tmv.id_vendor
JOIN cissdm.customers c ON c.id = tmv.id_customer
WHERE tmv.status = 1
  -- AND c.id = :customer_id
GROUP BY c.id, c.name, tmv.providerName, v.nameOnCheck, v.address1, v.address2, v.addressCity, v.addressState, v.addressZip, v.addressValidated, v.payBy
ORDER BY c.name, tmv.providerName;


-- 6.3 MULTI-LOCATION ACCOUNTS
-- Accounts that span multiple locations
SELECT 
    c.name as customer_name,
    tmv.providerName,
    tmv.vendorName,
    tmv.accountNumber,
    tmv.multipleLocations,
    tmv.number_of_locations,
    GROUP_CONCAT(DISTINCT CONCAT(l.siteNumber, ':', l.name) ORDER BY l.siteNumber SEPARATOR ' | ') as locations,
    SUM(tmv.expectedAmount) as total_expected,
    COUNT(DISTINCT l.id) as actual_location_count
FROM tem.temMasterViewUpdated tmv
JOIN cissdm.customers c ON c.id = tmv.id_customer
LEFT JOIN cissdm.locations l ON l.id = tmv.id_location
WHERE tmv.status = 1
  AND tmv.multipleLocations = 1
GROUP BY c.id, c.name, tmv.providerName, tmv.vendorName, tmv.accountNumber, tmv.multipleLocations, tmv.number_of_locations
ORDER BY c.name, tmv.providerName;


-- ================================================
-- SECTION 7: EXCEPTION REPORTS
-- ================================================

-- 7.1 HIGH VARIANCE BILLS (>20% from expected)
SELECT 
    c.name as customer_name,
    l.siteNumber,
    l.name as location_name,
    tmv.providerName,
    tmv.accountNumber,
    tmv.expectedAmount,
    b.invoiceNumber,
    b.invoiceDate,
    b.amount as actual_amount,
    ABS(b.amount - tmv.expectedAmount) as variance_amount,
    ROUND(((b.amount - tmv.expectedAmount) / NULLIF(tmv.expectedAmount, 0)) * 100, 2) as variance_pct,
    CASE 
        WHEN b.amount > tmv.expectedAmount THEN 'Over Budget'
        ELSE 'Under Budget'
    END as variance_type
FROM tem.bills b
JOIN tem.temMasterViewUpdated tmv ON b.vendorId = tmv.id_vendor
JOIN cissdm.customers c ON c.id = tmv.id_customer
LEFT JOIN cissdm.locations l ON l.id = tmv.id_location
WHERE tmv.status = 1
  AND tmv.expectedAmount > 0
  AND ABS(b.amount - tmv.expectedAmount) > (tmv.expectedAmount * 0.20)
  AND b.invoiceDate >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
ORDER BY variance_pct DESC, c.name;


-- 7.2 DENIED BILLS ANALYSIS
SELECT 
    c.name as customer_name,
    l.name as location_name,
    tmv.providerName,
    tmv.accountNumber,
    b.invoiceNumber,
    b.invoiceDate,
    b.amount,
    b.reasonDenied,
    b.status,
    b.updated as last_updated,
    DATEDIFF(CURDATE(), b.invoiceDate) as days_since_invoice
FROM tem.bills b
JOIN tem.temMasterViewUpdated tmv ON b.vendorId = tmv.id_vendor
JOIN cissdm.customers c ON c.id = tmv.id_customer
LEFT JOIN cissdm.locations l ON l.id = tmv.id_location
WHERE b.status = 2  -- Denied status
  AND b.invoiceDate >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
ORDER BY b.invoiceDate DESC, c.name;


-- 7.3 PAYMENT FAILURES
SELECT 
    c.name as customer_name,
    l.name as location_name,
    tmv.providerName,
    tmv.accountNumber,
    b.invoiceNumber,
    b.invoiceDate,
    b.duedate,
    b.amount,
    b.paymentStatus,
    b.hasAutoPay,
    b.funded,
    CASE 
        WHEN b.funded = 0 THEN 'Not Funded'
        WHEN b.hasAutoPay = 0 THEN 'AutoPay Disabled'
        WHEN b.status = 2 THEN 'Bill Denied'
        ELSE 'Other'
    END as failure_reason,
    DATEDIFF(CURDATE(), b.duedate) as days_overdue
FROM tem.bills b
JOIN tem.temMasterViewUpdated tmv ON b.vendorId = tmv.id_vendor
JOIN cissdm.customers c ON c.id = tmv.id_customer
LEFT JOIN cissdm.locations l ON l.id = tmv.id_location
WHERE b.paymentStatus = 0
  AND b.duedate < CURDATE()
  AND tmv.status = 1
ORDER BY days_overdue DESC, c.name;


-- ================================================
-- SECTION 8: EXECUTIVE SUMMARIES
-- ================================================

-- 8.1 EXECUTIVE DASHBOARD - CUSTOMER OVERVIEW
SELECT 
    c.name as customer_name,
    c.abbreviation,
    -- Account metrics
    COUNT(DISTINCT tmv.id_location) as locations,
    COUNT(DISTINCT tmv.id_vendor) as total_accounts,
    COUNT(DISTINCT CASE WHEN tmv.status = 1 THEN tmv.id_vendor END) as active_accounts,
    -- Financial metrics (current month)
    SUM(CASE WHEN b.invoiceDate >= DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN b.amount ELSE 0 END) as mtd_spend,
    -- Financial metrics (last month)
    SUM(CASE WHEN DATE_FORMAT(b.invoiceDate, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m') THEN b.amount ELSE 0 END) as last_month_spend,
    -- YTD metrics
    SUM(CASE WHEN YEAR(b.invoiceDate) = YEAR(CURDATE()) THEN b.amount ELSE 0 END) as ytd_spend,
    -- Operational health
    COUNT(DISTINCT CASE WHEN b.paymentStatus = 0 AND b.duedate < CURDATE() THEN b.id END) as overdue_bills,
    COUNT(DISTINCT CASE WHEN tmv.flagged = 1 THEN tmv.id_vendor END) as flagged_accounts,
    -- Funding
    f.amountRemaining as funding_balance,
    CASE 
        WHEN f.amountRemaining > SUM(CASE WHEN b.paymentStatus = 0 AND b.duedate <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN b.amount ELSE 0 END) THEN 'Healthy'
        WHEN f.amountRemaining > 0 THEN 'Low'
        ELSE 'Critical'
    END as funding_status
FROM cissdm.customers c
LEFT JOIN tem.temMasterViewUpdated tmv ON tmv.id_customer = c.id
LEFT JOIN tem.bills b ON b.vendorId = tmv.id_vendor AND b.invoiceDate >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 YEAR), '%Y-%m-01')
LEFT JOIN tem.funding f ON f.id_customer = c.id
WHERE c.is_active = 1
GROUP BY c.id, c.name, c.abbreviation, f.amountRemaining
ORDER BY ytd_spend DESC;


-- 8.2 PROVIDER SUMMARY BY CUSTOMER
SELECT 
    c.name as customer_name,
    tmv.providerName,
    COUNT(DISTINCT tmv.id_location) as locations,
    COUNT(DISTINCT tmv.id_vendor) as accounts,
    SUM(tmv.expectedAmount) as monthly_expected,
    -- Last 3 months actual
    SUM(CASE WHEN b.invoiceDate >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) THEN b.amount ELSE 0 END) as actual_3mo,
    COUNT(CASE WHEN b.invoiceDate >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) THEN b.id END) as bills_3mo,
    AVG(CASE WHEN b.invoiceDate >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) THEN b.amount END) as avg_bill_3mo,
    -- Payment performance
    AVG(CASE WHEN b.paymentStatus = 1 AND b.invoiceDate >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) 
        THEN DATEDIFF(b.datePaid, b.invoiceDate) END) as avg_pay_days,
    -- Issues
    SUM(CASE WHEN tmv.flagged = 1 THEN 1 ELSE 0 END) as flagged,
    SUM(CASE WHEN b.paymentStatus = 0 AND b.duedate < CURDATE() THEN 1 ELSE 0 END) as overdue
FROM tem.temMasterViewUpdated tmv
JOIN cissdm.customers c ON c.id = tmv.id_customer
LEFT JOIN tem.bills b ON b.vendorId = tmv.id_vendor
WHERE tmv.status = 1
  -- AND c.id = :customer_id
GROUP BY c.id, c.name, tmv.providerName
ORDER BY c.name, monthly_expected DESC;


-- ================================================
-- SECTION 9: QUICK LOOKUP QUERIES
-- ================================================

-- 9.1 SEARCH BY ACCOUNT NUMBER
SELECT 
    c.name as customer_name,
    l.siteNumber,
    l.name as location_name,
    tmv.providerName,
    tmv.vendorName,
    tmv.accountNumber,
    tmv.status,
    tmv.expectedAmount,
    tmv.lastInvoice,
    tmv.lastAmount,
    v.payBy,
    v.nameOnCheck
FROM tem.temMasterViewUpdated tmv
LEFT JOIN cissdm.customers c ON c.id = tmv.id_customer
LEFT JOIN cissdm.locations l ON l.id = tmv.id_location
LEFT JOIN tem.vendors v ON v.id = tmv.id_vendor
WHERE tmv.accountNumber = :account_number  -- Replace with actual account number
ORDER BY tmv.lastInvoice DESC;


-- 9.2 SEARCH BY INVOICE NUMBER
SELECT 
    b.invoiceNumber,
    b.invoiceDate,
    b.duedate,
    b.amount,
    CASE b.status
        WHEN 0 THEN 'Pending'
        WHEN 1 THEN 'Approved'
        WHEN 2 THEN 'Denied'
        WHEN 3 THEN 'Paid'
    END as bill_status,
    CASE b.paymentStatus
        WHEN 0 THEN 'Not Paid'
        WHEN 1 THEN 'Paid'
        WHEN 2 THEN 'Partial'
    END as payment_status,
    b.datePaid,
    c.name as customer_name,
    l.name as location_name,
    tmv.providerName,
    tmv.accountNumber
FROM tem.bills b
JOIN tem.temMasterViewUpdated tmv ON b.vendorId = tmv.id_vendor
LEFT JOIN cissdm.customers c ON c.id = tmv.id_customer
LEFT JOIN cissdm.locations l ON l.id = tmv.id_location
WHERE b.invoiceNumber = :invoice_number  -- Replace with actual invoice number
ORDER BY b.invoiceDate DESC;


-- 9.3 LOCATION DETAIL VIEW
SELECT 
    l.id as location_id,
    l.siteNumber,
    l.name as location_name,
    l.address,
    l.city,
    l.state,
    l.zipcode,
    c.name as customer_name,
    -- Account summary
    COUNT(DISTINCT tmv.id_vendor) as total_accounts,
    COUNT(DISTINCT CASE WHEN tmv.status = 1 THEN tmv.id_vendor END) as active_accounts,
    COUNT(DISTINCT tmv.providerName) as providers,
    SUM(CASE WHEN tmv.status = 1 THEN tmv.expectedAmount ELSE 0 END) as monthly_expected,
    -- Recent billing
    COUNT(DISTINCT CASE WHEN b.invoiceDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN b.id END) as bills_30d,
    SUM(CASE WHEN b.invoiceDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN b.amount ELSE 0 END) as amount_30d
FROM cissdm.locations l
JOIN cissdm.customers c ON c.id = l.id_customers
LEFT JOIN tem.temMasterViewUpdated tmv ON tmv.id_location = l.id
LEFT JOIN tem.bills b ON b.vendorId = tmv.id_vendor
WHERE l.id = :location_id  -- Replace with actual location ID
GROUP BY l.id, l.siteNumber, l.name, l.address, l.city, l.state, l.zipcode, c.name;


-- ================================================
-- SECTION 10: DATA QUALITY CHECKS
-- ================================================

-- 10.1 DATA INTEGRITY CHECK
SELECT 
    'Orphaned Vendors' as issue_type,
    COUNT(*) as count
FROM tem.vendors v
WHERE NOT EXISTS (SELECT 1 FROM tem.temMasterViewUpdated tmv WHERE tmv.id_vendor = v.id)
UNION ALL
SELECT 
    'Bills without Master Record',
    COUNT(*)
FROM tem.bills b
WHERE NOT EXISTS (SELECT 1 FROM tem.temMasterViewUpdated tmv WHERE tmv.id_vendor = b.vendorId)
UNION ALL
SELECT 
    'Invalid Customer References',
    COUNT(*)
FROM tem.temMasterViewUpdated tmv
WHERE tmv.id_customer NOT IN (SELECT id FROM cissdm.customers)
UNION ALL
SELECT 
    'Invalid Location References',
    COUNT(*)
FROM tem.temMasterViewUpdated tmv
WHERE tmv.id_location NOT IN (SELECT id FROM cissdm.locations)
UNION ALL
SELECT 
    'Accounts with Zero Expected Amount',
    COUNT(*)
FROM tem.temMasterViewUpdated tmv
WHERE tmv.status = 1 AND (tmv.expectedAmount IS NULL OR tmv.expectedAmount = 0)
UNION ALL
SELECT 
    'Active Accounts Never Billed',
    COUNT(*)
FROM tem.temMasterViewUpdated tmv
WHERE tmv.status = 1 
  AND tmv.lastInvoice IS NULL
  AND tmv.created_at < DATE_SUB(CURDATE(), INTERVAL 60 DAY);


-- ================================================
-- END OF TEM QUERY TOOLSET
-- ================================================Let me test a few more queries to ensure comprehensive coverage, then provide you with a detailed assessment.## 🔍 Comprehensive Query Assessment
After testing your TEM Platform Query Toolset, here's my detailed evaluation:
✅ Queries That Work Perfectly (90%)
Most queries are well-structured and functional. The following sections work without issues:
* Section 1: Account Discovery (all queries functional)
* Section 2: Billing Operations (all functional)
* Section 3: Funding Management (all functional)
* Section 4: Audit & Compliance (all functional)
* Section 5: Analytics & Trends (all functional)
* Section 7: Exception Reports (all functional)
* Section 8: Executive Summaries (all functional)
* Section 10: Data Quality Checks (all functional)
🔧 Queries Requiring Minor Fixes
1. Query 6.2: PAYMENT ADDRESS VERIFICATION
Issue: Column addressValidated doesn't exist
-- CURRENT (incorrect):
v.addressValidated,

-- FIXED:
v.validated as addressValidated,
2. All Parameterized Queries (Section 9)
These queries use parameters that need to be replaced before execution:
* :customer_id
* :account_number
* :invoice_number
* :location_id
Recommendation: Add comments showing example values or create stored procedures.
📊 Optimization Recommendations
1. Add Indexes for Performance
-- Recommended indexes based on your query patterns
CREATE INDEX idx_bills_invoice_date ON tem.bills(invoiceDate);
CREATE INDEX idx_bills_due_date ON tem.bills(duedate);
CREATE INDEX idx_tmv_status_customer ON tem.temMasterViewUpdated(status, id_customer);
CREATE INDEX idx_bills_vendor_date ON tem.bills(vendorId, invoiceDate);
2. Query 2.4: BILLING VARIANCE ANALYSIS Enhancement
Add absolute value sorting option:
-- Add this to ORDER BY clause options:
ORDER BY ABS(variance_pct) DESC  -- To see biggest variances regardless of direction
3. Query 5.1: MONTHLY SPEND TREND Enhancement
Add running totals:
-- Add running total column:
SUM(SUM(b.amount)) OVER (PARTITION BY c.id ORDER BY DATE_FORMAT(b.invoiceDate, '%Y-%m')) as running_total
🆕 Suggested Additional Queries
1. Real-time Payment Success Dashboard
-- Add to Section 2: Real-time payment processing status
SELECT 
    DATE(b.invoiceDate) as invoice_date,
    COUNT(*) as total_bills,
    SUM(CASE WHEN b.paymentStatus = 1 THEN 1 ELSE 0 END) as paid,
    SUM(CASE WHEN b.paymentStatus = 0 AND b.duedate < CURDATE() THEN 1 ELSE 0 END) as overdue,
    SUM(CASE WHEN b.paymentStatus = 0 AND b.duedate >= CURDATE() THEN 1 ELSE 0 END) as pending,
    ROUND(SUM(CASE WHEN b.paymentStatus = 1 THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as success_rate
FROM tem.bills b
WHERE b.invoiceDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(b.invoiceDate)
ORDER BY invoice_date DESC;
2. Provider SLA Compliance
-- Add to Section 4: Monitor provider service levels
SELECT 
    tmv.providerName,
    COUNT(DISTINCT CASE 
        WHEN DATEDIFF(CURDATE(), tmv.lastInvoice) > 45 
        THEN tmv.id_vendor END) as missing_bills,
    COUNT(DISTINCT CASE 
        WHEN tmv.flagged = 1 
        THEN tmv.id_vendor END) as flagged_accounts,
    COUNT(DISTINCT tmv.id_vendor) as total_accounts,
    ROUND(COUNT(DISTINCT CASE 
        WHEN DATEDIFF(CURDATE(), tmv.lastInvoice) <= 35 
        THEN tmv.id_vendor END) / COUNT(DISTINCT tmv.id_vendor) * 100, 2) as billing_compliance_rate
FROM tem.temMasterViewUpdated tmv
WHERE tmv.status = 1
GROUP BY tmv.providerName
HAVING total_accounts > 5
ORDER BY billing_compliance_rate ASC;
3. Funding Burn Rate Analysis
-- Add to Section 3: Predict funding exhaustion
SELECT 
    c.name as customer_name,
    f.amountRemaining as current_balance,
    AVG(daily_spend.amount) as avg_daily_spend,
    ROUND(f.amountRemaining / NULLIF(AVG(daily_spend.amount), 0), 0) as days_until_exhaustion
FROM cissdm.customers c
JOIN tem.funding f ON f.id_customer = c.id
LEFT JOIN (
    SELECT 
        tmv.id_customer,
        SUM(b.amount) / 30 as amount
    FROM tem.bills b
    JOIN tem.temMasterViewUpdated tmv ON b.vendorId = tmv.id_vendor
    WHERE b.invoiceDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY tmv.id_customer
) daily_spend ON daily_spend.id_customer = c.id
WHERE c.is_active = 1 AND f.amountRemaining IS NOT NULL
HAVING avg_daily_spend > 0
ORDER BY days_until_exhaustion ASC;
📝 Data Quality Observations
1. Date Handling Issue: The datePaid field shows '0001-01-01' for many records, suggesting NULL dates aren't handled properly
2. Status Inconsistencies: Bills marked as "Paid" with paymentStatus = 0 (Not Paid)
3. Missing Foreign Keys: Some vendor IDs don't have corresponding master records
✅ Overall Assessment
Score: 9.5/10
Your query toolset is:
* ✅ Comprehensive and well-organized
* ✅ Covers all major operational areas
* ✅ Uses appropriate JOINs and aggregations
* ✅ Includes good commenting
* ✅ Has proper error handling considerations
Minor improvements needed:
* Fix the addressValidated column reference
* Consider adding the suggested performance indexes
* Add example values for parameterized queries
* Consider implementing the suggested additional queries for better monitoring
The toolset is production-ready with these minor adjustments. The queries provide excellent visibility into your TEM platform operations and support both operational and strategic decision-making.
