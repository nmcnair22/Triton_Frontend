import axios from 'axios';
import { AuthService } from './AuthService';

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor for authentication
apiClient.interceptors.request.use(config => {
  const token = AuthService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for handling unauthorized responses
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      AuthService.clearSession();
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// ApiService provides generic HTTP methods only
const ApiService = {
  get(resource, params = {}) {
    console.log(`API GET request to ${resource} with params:`, params);
    return apiClient.get(resource, { params })
      .then(response => {
        console.log(`API GET response from ${resource}:`, {
          status: response.status,
          statusText: response.statusText,
          data: response.data 
        });
        return response;
      })
      .catch(error => {
        console.error(`API GET error for ${resource}:`, {
          message: error.message,
          response: error.response?.data
        });
        throw error;
      });
  },
  
  post(resource, data) {
    console.log(`API POST request to ${resource} with data:`, data);
    return apiClient.post(resource, data)
      .then(response => {
        console.log(`API POST response from ${resource}:`, {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        });
        return response;
      })
      .catch(error => {
        console.error(`API POST error for ${resource}:`, {
          message: error.message,
          response: error.response?.data
        });
        throw error;
      });
  },
  
  put(resource, data) {
    console.log(`API PUT request to ${resource} with data:`, data);
    return apiClient.put(resource, data)
      .then(response => {
        console.log(`API PUT response from ${resource}:`, {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        });
        return response;
      })
      .catch(error => {
        console.error(`API PUT error for ${resource}:`, {
          message: error.message,
          response: error.response?.data
        });
        throw error;
      });
  },
  
  delete(resource, params = {}) {
    console.log(`API DELETE request to ${resource} with params:`, params);
    return apiClient.delete(resource, { params })
      .then(response => {
        console.log(`API DELETE response from ${resource}:`, {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        });
        return response;
      })
      .catch(error => {
        console.error(`API DELETE error for ${resource}:`, {
          message: error.message,
          response: error.response?.data
        });
        throw error;
      });
  }
};

export default ApiService; 