import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance for auth operations
const authClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // Important for CSRF cookie
});

export const AuthService = {
  // Login with email and password
  async login(email, password) {
    try {
      const response = await authClient.post('/login', {
        email,
        password
      });
      
      if (response.data.token) {
        localStorage.setItem('user_token', response.data.token);
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
        
        // Set token for all future API calls
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Microsoft OAuth login (if needed)
  redirectToMicrosoftLogin() {
    window.location.href = `${API_URL}/auth/microsoft`;
  },
  
  // Logout function
  async logout() {
    try {
      await authClient.post('/logout');
      this.clearSession();
    } catch (error) {
      console.error('Logout error', error);
      // Still clear session even if API call fails
      this.clearSession();
    }
  },
  
  // Clear local session data
  clearSession() {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_data');
    delete axios.defaults.headers.common['Authorization'];
  },
  
  // Get current user profile
  async getCurrentUser() {
    try {
      const response = await authClient.get('/user');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Check if user is logged in
  isLoggedIn() {
    return !!localStorage.getItem('user_token');
  },
  
  // Get current user data from localStorage
  getUserData() {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (e) {
        return null;
      }
    }
    return null;
  },
  
  // Get auth token
  getToken() {
    return localStorage.getItem('user_token');
  },
  
  // Set up interceptors to handle authentication
  setupInterceptors() {
    const token = this.getToken();
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    // Add response interceptor for 401 errors
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // Token expired or invalid, logout user
          this.clearSession();
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }
    );
  }
}; 