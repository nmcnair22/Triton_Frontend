/**
 * Role-Based Access Control (RBAC) Utilities
 * Provides functions for checking user permissions and roles
 */

import { ROLES, PERMISSIONS, ROLE_PERMISSIONS } from '@/constants/roleConstants';

/**
 * Check if the current user has a specific permission
 * @param {string} permission - The permission to check for
 * @returns {boolean} True if the user has the permission
 */
export const hasPermission = (permission) => {
  try {
    const permissions = JSON.parse(localStorage.getItem('user_permissions') || '[]');
    return Array.isArray(permissions) && permissions.includes(permission);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

/**
 * Check if the current user has any of the specified permissions
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} True if the user has any of the permissions
 */
export const hasAnyPermission = (permissions) => {
  if (!Array.isArray(permissions) || permissions.length === 0) return false;
  return permissions.some(permission => hasPermission(permission));
};

/**
 * Check if the current user has all of the specified permissions
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} True if the user has all of the permissions
 */
export const hasAllPermissions = (permissions) => {
  if (!Array.isArray(permissions) || permissions.length === 0) return false;
  return permissions.every(permission => hasPermission(permission));
};

/**
 * Check if the current user has a specific role
 * @param {string} role - The role to check for
 * @returns {boolean} True if the user has the role
 */
export const hasRole = (role) => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.roles?.some(r => r === role || r.name === role) || false;
  } catch (error) {
    console.error('Error checking role:', error);
    return false;
  }
};

/**
 * Check if the current user has any of the specified roles
 * @param {string[]} roles - Array of roles to check
 * @returns {boolean} True if the user has any of the roles
 */
export const hasAnyRole = (roles) => {
  if (!Array.isArray(roles) || roles.length === 0) return false;
  return roles.some(role => hasRole(role));
};

/**
 * Guard component for conditionally rendering based on permissions
 * Use this to conditionally render UI elements based on user permissions
 */
export const PermissionGuard = {
  name: 'PermissionGuard',
  props: {
    permission: { type: String, default: null },
    permissions: { type: Array, default: () => [] },
    allPermissions: { type: Boolean, default: false },
    role: { type: String, default: null },
    roles: { type: Array, default: () => [] },
    fallback: { type: Boolean, default: false }
  },
  setup(props, { slots }) {
    const canAccess = () => {
      // Check single permission
      if (props.permission) {
        return hasPermission(props.permission);
      }
      
      // Check multiple permissions
      if (props.permissions && props.permissions.length > 0) {
        return props.allPermissions 
          ? hasAllPermissions(props.permissions)
          : hasAnyPermission(props.permissions);
      }
      
      // Check single role
      if (props.role) {
        return hasRole(props.role);
      }
      
      // Check multiple roles
      if (props.roles && props.roles.length > 0) {
        return hasAnyRole(props.roles);
      }
      
      // No conditions specified, allow access
      return true;
    };

    return () => canAccess() 
      ? slots.default?.() 
      : (props.fallback ? slots.fallback?.() : null);
  }
};

/**
 * Get all permissions for the current user
 * @returns {string[]} Array of permission strings
 */
export const getUserPermissions = () => {
  try {
    return JSON.parse(localStorage.getItem('user_permissions') || '[]');
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
};

/**
 * Get all roles for the current user
 * @returns {string[]} Array of role names
 */
export const getUserRoles = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return Array.isArray(user.roles) 
      ? user.roles.map(r => typeof r === 'string' ? r : r.name)
      : [];
  } catch (error) {
    console.error('Error getting user roles:', error);
    return [];
  }
}; 