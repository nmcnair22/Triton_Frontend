import { auditClient } from '@/services/auditClient';

const auditRoutes = [
  {
    path: '/audit/:customerId/dashboard',
    name: 'AuditDashboard',
    component: () => import('@/views/audit-workbench/AuditDashboard.vue'),
    meta: {
      requiresAuth: true,
      title: 'Audit Dashboard'
    }
  },
  {
    path: '/audit/:customerId/locations',
    name: 'AuditLocations',
    component: () => import('@/views/audit-workbench/LocationsList.vue'),
    meta: {
      requiresAuth: true,
      title: 'Audit Locations'
    }
  },
  {
    path: '/audit/:customerId/locations/:locationId',
    name: 'LocationWorkbench',
    component: () => import('@/views/audit-workbench/LocationWorkbench.vue'),
    meta: {
      requiresAuth: true,
      title: 'Location Workbench'
    }
  }
];

export default auditRoutes;
