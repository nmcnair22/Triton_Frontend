/**
 * Utility to set up test permissions for RBAC development
 * This file is for development purposes only and should not be included in production
 */
import { useUserStore } from '@/stores/userStore';
import { AuthService } from '@/auth/AuthService';

/**
 * Set up test permissions in localStorage for development
 */
export function setupTestPermissions() {
  console.log('Setting up test permissions for RBAC development');
  
  // Set up basic RBAC permissions
  const permissions = [
    // User management permissions
    'users.view',
    'users.create',
    'users.edit',
    'users.delete',
    
    // Role management permissions
    'roles.view',
    'roles.create',
    'roles.edit',
    'roles.delete'
  ];
  
  // Save permissions to localStorage
  localStorage.setItem('user_permissions', JSON.stringify(permissions));
  
  // Get the current authenticated user
  const currentUser = AuthService.getUser();
  
  // If no user is authenticated, create a test user
  const testUser = currentUser || {
    id: 1,
    name: 'Admin User',
    email: 'admin@example.com',
    roles: [
      { id: 1, name: 'admin' }
    ]
  };
  
  // Save user to localStorage only if not already authenticated
  if (!currentUser) {
    localStorage.setItem('user', JSON.stringify(testUser));
  }
  
  // Do NOT set a dummy token - keep the real token if it exists
  // This was causing authorization issues
  
  // Try to update the Pinia store if we're in a component context
  try {
    const userStore = useUserStore();
    if (userStore) {
      userStore.setTestUserData(testUser, permissions);
    }
  } catch (error) {
    console.log('Could not update userStore - this is normal if called outside of a component');
  }
  
  console.log('Test permissions added successfully');
  return { permissions, user: testUser };
}

/**
 * Clear test permissions from localStorage
 */
export function clearTestPermissions() {
  localStorage.removeItem('user_permissions');
  localStorage.removeItem('user');
  localStorage.removeItem('auth_token');
  
  // Try to update the Pinia store if we're in a component context
  try {
    const userStore = useUserStore();
    if (userStore) {
      userStore.resetState();
    }
  } catch (error) {
    console.log('Could not update userStore - this is normal if called outside of a component');
  }
  
  console.log('Test permissions and user cleared');
} 