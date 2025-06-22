/**
 * Role and Permission Constants
 * Defines all supported roles and permissions for RBAC system
 */

// Supported Roles
export const ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee', 
  CUSTOMER: 'customer',
  PARTNER: 'partner'
}

// Supported Permissions
export const PERMISSIONS = {
  // System Access
  ACCESS_ADMIN_PANEL: 'access admin panel',
  ACCESS_DASHBOARD: 'view dashboard',
  
  // Communication & Collaboration
  ACCESS_CHAT: 'access chat',
  ACCESS_MAIL: 'access mail',
  
  // Operations
  ACCESS_DISPATCH: 'access dispatch',
  ACCESS_REPORTS: 'access reports',
  ACCESS_TASKLIST: 'access tasklist',
  ACCESS_STREAMLINE: 'access streamline',
  
  // Infrastructure
  ACCESS_NETWORK: 'access network',
  ACCESS_CIRCUITS: 'access circuits',
  
  // Business
  ACCESS_ECOMMERCE: 'access ecommerce',
  
  // Administration
  MANAGE_USERS: 'manage users',
  MANAGE_ROLES: 'manage roles',
  MANAGE_PERMISSIONS: 'manage permissions',
  ACCESS_SETTINGS: 'access settings',
  
  // Legacy permissions (for backward compatibility)
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  ROLES_VIEW: 'roles.view',
  ROLES_CREATE: 'roles.create',
  ROLES_EDIT: 'roles.edit',
  ROLES_DELETE: 'roles.delete',
  INCIDENTS_VIEW: 'incidents.view',
  INCIDENTS_CREATE: 'incidents.create',
  INCIDENTS_EDIT: 'incidents.edit',
  INCIDENTS_DELETE: 'incidents.delete',
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_CREATE: 'inventory.create',
  INVENTORY_EDIT: 'inventory.edit',
  INVENTORY_DELETE: 'inventory.delete',
  DISPATCH_READ: 'dispatch:read'
}

// Role-Permission Mapping
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.ACCESS_ADMIN_PANEL,
    PERMISSIONS.ACCESS_DASHBOARD,
    PERMISSIONS.ACCESS_CHAT,
    PERMISSIONS.ACCESS_MAIL,
    PERMISSIONS.ACCESS_DISPATCH,
    PERMISSIONS.ACCESS_REPORTS,
    PERMISSIONS.ACCESS_TASKLIST,
    PERMISSIONS.ACCESS_STREAMLINE,
    PERMISSIONS.ACCESS_NETWORK,
    PERMISSIONS.ACCESS_CIRCUITS,
    PERMISSIONS.ACCESS_ECOMMERCE,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.MANAGE_PERMISSIONS,
    PERMISSIONS.ACCESS_SETTINGS,
    // Legacy permissions
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.ROLES_VIEW,
    PERMISSIONS.ROLES_CREATE,
    PERMISSIONS.ROLES_EDIT,
    PERMISSIONS.ROLES_DELETE,
    PERMISSIONS.INCIDENTS_VIEW,
    PERMISSIONS.INCIDENTS_CREATE,
    PERMISSIONS.INCIDENTS_EDIT,
    PERMISSIONS.INCIDENTS_DELETE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_EDIT,
    PERMISSIONS.INVENTORY_DELETE,
    PERMISSIONS.DISPATCH_READ
  ],
  
  [ROLES.EMPLOYEE]: [
    PERMISSIONS.ACCESS_DASHBOARD,
    PERMISSIONS.ACCESS_CHAT,
    PERMISSIONS.ACCESS_DISPATCH,
    PERMISSIONS.ACCESS_REPORTS,
    PERMISSIONS.ACCESS_TASKLIST,
    PERMISSIONS.ACCESS_STREAMLINE,
    // Legacy permissions for employees
    PERMISSIONS.INCIDENTS_VIEW,
    PERMISSIONS.INCIDENTS_CREATE,
    PERMISSIONS.INCIDENTS_EDIT,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.DISPATCH_READ
  ],
  
  [ROLES.CUSTOMER]: [
    PERMISSIONS.ACCESS_DASHBOARD,
    PERMISSIONS.ACCESS_REPORTS,
    PERMISSIONS.ACCESS_CHAT
  ],
  
  [ROLES.PARTNER]: [
    PERMISSIONS.ACCESS_DASHBOARD,
    PERMISSIONS.ACCESS_REPORTS,
    PERMISSIONS.ACCESS_DISPATCH,
    PERMISSIONS.ACCESS_CHAT,
    PERMISSIONS.DISPATCH_READ
  ]
}

// Helper Functions
export const hasRole = (user, role) => {
  return user?.roles?.includes(role) || user?.role === role;
}

export const hasPermission = (user, permission) => {
  return user?.permissions?.includes(permission);
}

export const hasAnyRole = (user, roles) => {
  return roles.some(role => hasRole(user, role));
}

export const hasAllPermissions = (user, permissions) => {
  return permissions.every(permission => hasPermission(user, permission));
}

export const getUserPermissions = (user) => {
  const userRole = user?.role || user?.roles?.[0];
  return ROLE_PERMISSIONS[userRole] || [];
}

// Get effective permissions from multiple roles (union of all role permissions)
export const getEffectivePermissions = (user) => {
  const userRoles = getUserRoles(user);
  const allPermissions = new Set();
  
  userRoles.forEach(role => {
    const rolePermissions = ROLE_PERMISSIONS[role] || [];
    rolePermissions.forEach(permission => allPermissions.add(permission));
  });
  
  return Array.from(allPermissions);
}

// Get user roles as array of strings
export const getUserRoles = (user) => {
  if (user?.roles && Array.isArray(user.roles)) {
    return user.roles.map(r => typeof r === 'string' ? r : r.name);
  }
  if (user?.role) {
    return [user.role];
  }
  return [];
}

export const getAllRoles = () => Object.values(ROLES);

export const getAllPermissions = () => Object.values(PERMISSIONS); 