import axios from 'axios';
import { AuthService } from '@/auth/AuthService';

/**
 * Axios instance configured for API requests.
 * Includes request interceptors for authentication tokens
 * and response interceptors for handling 401 errors.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor to add authentication token
apiClient.interceptors.request.use(config => {
  const token = AuthService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Add response interceptor to handle authentication errors
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Handle authentication errors
      if (error.response.status === 401) {
        console.error('Authentication error:', error.response.data.message || 'Unauthorized');
        AuthService.clearSession();
        window.location.href = '/auth/login';
      }
      
      // Handle permission denied errors
      if (error.response.status === 403) {
        console.error('Permission denied:', error.response.data.message || 'Forbidden');
        // Optionally redirect to access denied page
        // window.location.href = '/auth/access';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * API client for making HTTP requests.
 * Provides methods for GET, POST, PUT, PATCH, and DELETE.
 */
export default {
  /**
   * Make a GET request
   * @param {string} url - The endpoint URL
   * @param {Object} params - Query parameters
   * @param {Object} options - Additional Axios options
   * @returns {Promise} The Axios response promise
   */
  async get(url, params = null, options = {}) {
    try {
      return await apiClient.get(url, { 
        params,
        ...options
      });
    } catch (error) {
      console.error(`GET ${url} error:`, error);
      throw error;
    }
  },
  
  /**
   * Make a POST request
   * @param {string} url - The endpoint URL
   * @param {Object} data - The request body
   * @param {Object} options - Additional Axios options
   * @returns {Promise} The Axios response promise
   */
  async post(url, data = null, options = {}) {
    try {
      return await apiClient.post(url, data, options);
    } catch (error) {
      console.error(`POST ${url} error:`, error);
      throw error;
    }
  },
  
  /**
   * Make a PUT request
   * @param {string} url - The endpoint URL
   * @param {Object} data - The request body
   * @param {Object} options - Additional Axios options
   * @returns {Promise} The Axios response promise
   */
  async put(url, data = null, options = {}) {
    try {
      return await apiClient.put(url, data, options);
    } catch (error) {
      console.error(`PUT ${url} error:`, error);
      throw error;
    }
  },
  
  /**
   * Make a PATCH request
   * @param {string} url - The endpoint URL
   * @param {Object} data - The request body
   * @param {Object} options - Additional Axios options
   * @returns {Promise} The Axios response promise
   */
  async patch(url, data = null, options = {}) {
    try {
      return await apiClient.patch(url, data, options);
    } catch (error) {
      console.error(`PATCH ${url} error:`, error);
      throw error;
    }
  },
  
  /**
   * Make a DELETE request
   * @param {string} url - The endpoint URL
   * @param {Object} options - Additional Axios options
   * @returns {Promise} The Axios response promise
   */
  async delete(url, options = {}) {
    try {
      return await apiClient.delete(url, options);
    } catch (error) {
      console.error(`DELETE ${url} error:`, error);
      throw error;
    }
  }
}; 