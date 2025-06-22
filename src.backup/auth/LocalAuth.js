/**
 * Local Authentication Service
 * Handles email/password authentication flow for the application
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance for auth operations
const authClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // Enable credentials for CSRF/session cookies
});

/**
 * Local Authentication Service
 */
export const LocalAuth = {
  /**
   * Login with email and password
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @param {boolean} remember - Whether to remember the user
   * @returns {Promise} Promise with the login result
   */
  async login(email, password, remember = false) {
    try {
      const response = await authClient.post('/login', {
        email,
        password,
        remember
      });
      
      // Validate the response structure
      if (!response.data || !response.data.token) {
        throw new Error('Invalid response from server');
      }
      
      return {
        success: true,
        token: response.data.token,
        user: response.data.user || null,
        permissions: response.data.permissions || []
      };
    } catch (error) {
      console.error('Login error:', error);
      
      // Create a standardized error response
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Login failed'
      };
    }
  },
  
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} Promise with the registration result
   */
  async register(userData) {
    try {
      const response = await authClient.post('/register', userData);
      
      return {
        success: true,
        token: response.data.token,
        user: response.data.user || null,
        permissions: response.data.permissions || []
      };
    } catch (error) {
      console.error('Registration error:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Registration failed'
      };
    }
  },
  
  /**
   * Request a password reset
   * @param {string} email - User's email
   * @returns {Promise} Promise with the request result
   */
  async forgotPassword(email) {
    try {
      const response = await authClient.post('/forgot-password', { email });
      
      return {
        success: true,
        message: response.data.message || 'Password reset link sent to your email'
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to request password reset'
      };
    }
  },
  
  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @param {string} passwordConfirmation - Confirmation of new password
   * @returns {Promise} Promise with the reset result
   */
  async resetPassword(token, password, passwordConfirmation) {
    try {
      const response = await authClient.post('/reset-password', {
        token,
        password,
        password_confirmation: passwordConfirmation
      });
      
      return {
        success: true,
        message: response.data.message || 'Password has been reset successfully'
      };
    } catch (error) {
      console.error('Reset password error:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to reset password'
      };
    }
  },
  
  /**
   * Verify email with token
   * @param {string} token - Verification token
   * @returns {Promise} Promise with the verification result
   */
  async verifyEmail(token) {
    try {
      const response = await authClient.post('/verify-email', { token });
      
      return {
        success: true,
        message: response.data.message || 'Email verified successfully'
      };
    } catch (error) {
      console.error('Email verification error:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to verify email'
      };
    }
  }
};

export default LocalAuth; 