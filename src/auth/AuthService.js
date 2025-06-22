/**
 * Unified Authentication Service
 * Provides a centralized interface for all authentication methods
 */

import { ref } from 'vue';
import axios from 'axios';
import MicrosoftAuth from './MicrosoftAuth';
import LocalAuth from './LocalAuth';
import LogoutService from './LogoutService';

// Initialize reactive state
const token = ref(localStorage.getItem('auth_token') || null);
const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));
const permissions = ref(JSON.parse(localStorage.getItem('user_permissions') || '[]'));

/**
 * Authentication Service
 * Central service that handles authentication operations
 */
export const AuthService = {
  // Microsoft Authentication
  microsoft: MicrosoftAuth,
  
  // Local Authentication
  local: LocalAuth,
  
  // Logout Service
  logoutService: LogoutService,
  
  // Get the current auth token
  getToken() {
    return token.value;
  },
  
  // Set the auth token
  setToken(newToken) {
    token.value = newToken;
    localStorage.setItem('auth_token', newToken);
    
    // Note: We don't set axios defaults here anymore to avoid env var issues
    // Each API call will include the Authorization header individually
  },
  
  // Get the current user
  getUser() {
    return user.value;
  },
  
  // Set the current user
  setUser(newUser) {
    user.value = newUser;
    localStorage.setItem('user', JSON.stringify(newUser));
  },
  
  // Get the current user's permissions
  getPermissions() {
    return permissions.value;
  },
  
  // Set the current user's permissions
  setPermissions(newPermissions) {
    permissions.value = newPermissions;
    localStorage.setItem('user_permissions', JSON.stringify(newPermissions));
  },
  
  // Check if the user is authenticated
  isAuthenticated() {
    return !!token.value;
  },
  
  // Check if user is logged in (alias for isAuthenticated for backward compatibility)
  isLoggedIn() {
    return this.isAuthenticated();
  },
  
  // Check if user has a specific permission
  hasPermission(permission) {
    if (!permission) return true;
    return this.getPermissions().includes(permission);
  },
  
  // Check if user has a specific role
  hasRole(role) {
    if (!role) return true;
    
    const userData = this.getUser();
    if (!userData || !userData.roles) return false;
    
    return userData.roles.some(r => r === role || r.name === role);
  },
  
  // Get current user data from localStorage (for backward compatibility)
  getUserData() {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (e) {
        return null;
      }
    }
    return null;
  },
  
  // Login with Microsoft (redirect to Microsoft login)
  loginWithMicrosoft() {
    this.microsoft.login();
  },
  
  // Login with email and password
  async loginWithCredentials(email, password, remember = false) {
    const result = await this.local.login(email, password, remember);
    
    if (result.success) {
      this.setToken(result.token);
      this.setUser(result.user);
      
      if (result.permissions) {
        this.setPermissions(result.permissions);
      }
    }
    
    return result;
  },
  
  // Handle Microsoft authentication callback
  handleMicrosoftCallback() {
    // First try hash-based authentication
    let result = this.microsoft.handleCallback();
    
    // If that fails, try page content as fallback
    if (!result.success) {
      result = this.microsoft.parseAuthFromPageContent();
    }
    
    // If successful, set authentication state
    if (result.success) {
      this.setToken(result.token);
      
      if (result.user) {
        this.setUser(result.user);
      }
      
      if (result.permissions) {
        this.setPermissions(result.permissions);
      }
    }
    
    return result;
  },
  
  // Register a new user
  async register(userData) {
    const result = await this.local.register(userData);
    
    if (result.success) {
      this.setToken(result.token);
      this.setUser(result.user);
      
      if (result.permissions) {
        this.setPermissions(result.permissions);
      }
    }
    
    return result;
  },
  
  // Logout function
  async logout() {
    try {
      const currentToken = this.getToken();
      // Call the LogoutService, it will handle the POST request with the token
      await this.logoutService.logout(currentToken);
      
      // Clear the session ONLY after successful API call
      this.clearSession();
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Do NOT clear session here if API fails
      // Rethrow the error so the caller (userStore) knows it failed
      throw error; 
    }
  },
  
  // Clear local session data
  clearSession() {
    this.logoutService.clearLocalSession();
    token.value = null;
    user.value = null;
    permissions.value = [];
  },
  
  // Get current user profile from API
  async getCurrentUser() {
    if (!this.isAuthenticated()) {
      return null;
    }
    
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/user`, {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`
        }
      });
      
      // If the response includes permissions, store them
      if (response.data.permissions) {
        this.setPermissions(response.data.permissions);
      }
      
      // If the response has updated user data, store it
      if (response.data.user) {
        this.setUser(response.data.user);
        return response.data.user;
      }
      
      return response.data;
    } catch (error) {
      console.error('Error getting current user:', error);
      // If API fails, return the stored user data as fallback
      return this.getUser();
    }
  },
  
  // Get file preview URL with authentication token
  getFilePreviewUrl(fileId, fileType) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    const token = this.getToken();
    
    if (!token) {
      console.error('No authentication token available for file preview');
      return null;
    }
    
    return `${baseUrl}/files/${fileId}/preview?token=${token}&file_type=${fileType}`;
  },
  
  // Add token to a URL as a query parameter
  addTokenToUrl(url) {
    const token = this.getToken();
    if (!token) return url;
    
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}token=${token}`;
  },


};

export default AuthService; 