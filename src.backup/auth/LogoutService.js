/**
 * Logout Service
 * Handles user logout operations
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance for auth operations
const authClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

/**
 * Logout Service
 */
export const LogoutService = {
  /**
   * Log out a user
   * @param {string} token - The authentication token
   * @returns {Promise} Promise with the logout result
   */
  async logout(token) {
    try {
      // Only make the API call if we have a token
      if (token) {
        await authClient.post('/logout', {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if the API call fails, we consider the logout successful
      // since we'll clear the local session anyway
      return {
        success: true,
        warning: 'Server logout failed, but local session has been cleared'
      };
    }
  },
  
  /**
   * Clear all authentication data from local storage
   */
  clearLocalSession() {
    // Remove all authentication-related items
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_permissions');
    localStorage.removeItem('auth_state');
    
    // Clear Authorization header from axios defaults
    delete axios.defaults.headers.common['Authorization'];
  }
};

export default LogoutService; 