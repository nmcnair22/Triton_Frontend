import { ref } from 'vue';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const BASE_URL = API_URL.replace('/api', ''); // Base URL without /api for web routes

// Create axios instance for auth operations
const authClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // Enable credentials for CSRF/session cookies
});

const token = ref(localStorage.getItem('auth_token') || null);
const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

export const AuthService = {
  // Get the current auth token
  getToken() {
    return token.value;
  },
  
  // Set the auth token
  setToken(newToken) {
    token.value = newToken;
    localStorage.setItem('auth_token', newToken);
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
  
  // Check if the user is authenticated
  isAuthenticated() {
    return !!token.value;
  },
  
  // Login with email and password
  async login(email, password) {
    try {
      // Change to use api-login endpoint which returns tokens
      const response = await authClient.post('/api-login', {
        email,
        password
      });
      
      if (response.data.token) {
        this.setToken(response.data.token);
        this.setUser(response.data.user);
        
        // Set token for all future API calls
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  // Microsoft OAuth login - uses direct link to web route, not API
  redirectToMicrosoftLogin() {
    // Use the exact URL that works in your test page
    window.location.href = `${BASE_URL}/auth/azure`;
    
    // Log the URL being accessed to help with debugging
    console.log(`Redirecting to Microsoft login at: ${BASE_URL}/auth/azure`);
  },
  
  // Logout function
  async logout() {
    try {
      const token = this.getToken();
      if (token) {
        // Include the token in the logout request
        await authClient.post('/logout', {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      this.clearSession();
    } catch (error) {
      console.error('Logout error', error);
      // Still clear session even if API call fails
      this.clearSession();
    }
  },
  
  // Clear local session data
  clearSession() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
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
    return !!localStorage.getItem('auth_token');
  },
  
  // Get current user data from localStorage
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
  
  // Handle the Microsoft callback (called from the callback page)
  async handleMicrosoftCallback(code) {
    try {
      // For direct web route authentication, the backend typically 
      // returns the token directly in the response or in the URL hash
      // We can adapt to either approach
      
      // If token is in URL hash or query params, extract it
      if (code) {
        // Use the correct callback endpoint
        const response = await fetch(`${BASE_URL}/auth/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include', // Include cookies for CSRF/session
          body: JSON.stringify({ code })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Microsoft login failed');
        }
        
        const data = await response.json();
        
        // Store the token and user
        if (data.token) {
          this.setToken(data.token);
          this.setUser(data.user);
          axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
          return data;
        } else {
          throw new Error('No token received from server');
        }
      } else {
        throw new Error('No authorization code received');
      }
    } catch (error) {
      console.error('Error handling Microsoft callback:', error);
      throw error;
    }
  },
  
  // Check if token is expired
  isTokenExpired() {
    if (!token.value) return true;
    
    try {
      const tokenData = JSON.parse(atob(token.value.split('.')[1]));
      return tokenData.exp < Date.now() / 1000;
    } catch (e) {
      return true;
    }
  },
  
  // Refresh the token
  async refreshToken() {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include' // Include cookies for CSRF/session
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }
      
      const data = await response.json();
      this.setToken(data.token);
      
      return data.token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearSession();
      throw error;
    }
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