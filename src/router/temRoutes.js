import { temClient } from '@/services/tem/temClient';

const temRoutes = [
  {
    path: '/tem',
    redirect: '/tem/customers'
  },
  {
    path: '/tem/customers',
    name: 'TEMCustomers',
    component: () => import('@/views/tem/customers/CustomerList.vue'),
    meta: {
      requiresAuth: true,
      title: 'TEM Customers',
      breadcrumb: [
        { label: 'Home', path: '/' },
        { label: 'TEM', path: '/tem' },
        { label: 'Customers', path: '/tem/customers' }
      ]
    }
  },
  {
    path: '/tem/customers/:id',
    name: 'TEMCustomerDetail',
    component: () => import('@/views/tem/customers/CustomerDetail.vue'),
    meta: {
      requiresAuth: true,
      title: 'Customer Details',
      breadcrumb: [
        { label: 'Home', path: '/' },
        { label: 'TEM', path: '/tem' },
        { label: 'Customers', path: '/tem/customers' },
        { label: 'Customer Detail', path: '/tem/customers/:id' }
      ]
    }
  },
  {
    path: '/tem/locations',
    name: 'TEMLocations',
    component: () => import('@/views/tem/locations/LocationSearch.vue'),
    meta: {
      requiresAuth: true,
      title: 'TEM Locations',
      breadcrumb: [
        { label: 'Home', path: '/' },
        { label: 'TEM', path: '/tem' },
        { label: 'Locations', path: '/tem/locations' }
      ]
    }
  },
  {
    path: '/tem/customers/:customerId/locations/:locationId',
    name: 'TEMLocationDetail',
    component: () => import('@/views/tem/locations/LocationDetail.vue'),
    meta: {
      requiresAuth: true,
      title: 'Location Details',
      breadcrumb: [
        { label: 'Home', path: '/' },
        { label: 'TEM', path: '/tem' },
        { label: 'Customers', path: '/tem/customers' },
        { label: 'Customer Detail', path: '/tem/customers/:customerId' },
        { label: 'Location Detail', path: '/tem/customers/:customerId/locations/:locationId' }
      ]
    }
  },
  {
    path: '/tem/accounts',
    name: 'TEMAccounts',
    component: () => import('@/views/tem/accounts/AccountInventory.vue'),
    meta: {
      requiresAuth: true,
      title: 'Account Inventory',
      breadcrumb: [
        { label: 'Home', path: '/' },
        { label: 'TEM', path: '/tem' },
        { label: 'Accounts', path: '/tem/accounts' }
      ]
    }
  },
  {
    path: '/tem/bills',
    name: 'TEMBills',
    component: () => import('@/views/tem/bills/BillManagement.vue'),
    meta: {
      requiresAuth: true,
      title: 'Bill Management',
      breadcrumb: [
        { label: 'Home', path: '/' },
        { label: 'TEM', path: '/tem' },
        { label: 'Bills', path: '/tem/bills' }
      ]
    }
  },
  {
    path: '/tem/audit',
    redirect: '/tem/audit/variance'
  },
  {
    path: '/tem/audit/variance',
    name: 'TEMVarianceAnalysis',
    component: () => import('@/views/tem/audit/VarianceAnalysis.vue'),
    meta: {
      requiresAuth: true,
      title: 'Variance Analysis',
      breadcrumb: [
        { label: 'Home', path: '/' },
        { label: 'TEM', path: '/tem' },
        { label: 'Audit Center', path: '/tem/audit' },
        { label: 'Variance Analysis', path: '/tem/audit/variance' }
      ]
    }
  },
  {
    path: '/tem/audit/missing-bills',
    name: 'TEMMissingBills',
    component: () => import('@/views/tem/audit/MissingBills.vue'),
    meta: {
      requiresAuth: true,
      title: 'Missing Bills Detection',
      breadcrumb: [
        { label: 'Home', path: '/' },
        { label: 'TEM', path: '/tem' },
        { label: 'Audit Center', path: '/tem/audit' },
        { label: 'Missing Bills', path: '/tem/audit/missing-bills' }
      ]
    }
  },
  {
    path: '/tem/audit/exceptions',
    name: 'TEMExceptions',
    component: () => import('@/views/tem/audit/ExceptionQueue.vue'),
    meta: {
      requiresAuth: true,
      title: 'Exception Queue',
      breadcrumb: [
        { label: 'Home', path: '/' },
        { label: 'TEM', path: '/tem' },
        { label: 'Audit Center', path: '/tem/audit' },
        { label: 'Exceptions', path: '/tem/audit/exceptions' }
      ]
    }
  }
];

export default temRoutes;