import { ref } from 'vue';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const BASE_URL = API_URL.replace('/api', ''); // Base URL without /api for web routes
const SPA_CALLBACK_PATH = '/auth/microsoft-callback'; // Frontend callback route

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
    
    // Also update axios default headers
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
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
  
  // Check if user is logged in (alias for isAuthenticated for backward compatibility)
  isLoggedIn() {
    return this.isAuthenticated();
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
  
  // Get current user profile from API (for backward compatibility)
  async getCurrentUser() {
    try {
      const response = await authClient.get('/user');
      return response.data;
    } catch (error) {
      console.error('Error getting current user:', error);
      // If API fails, return the stored user data as fallback
      return this.getUserData();
    }
  },
  
  // Login with email and password
  async login(email, password) {
    try {
      // Change to use login endpoint
      const response = await authClient.post('/login', {
        email,
        password
      });
      
      if (response.data.token) {
        this.setToken(response.data.token);
        this.setUser(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  // Microsoft OAuth login with SPA-friendly approach
  redirectToMicrosoftLogin() {
    // Generate a random state for security
    const state = Math.random().toString(36).substring(2, 15);
    
    // Store state in localStorage to verify later
    localStorage.setItem('auth_state', state);
    
    // Define the callback URL for our SPA (where we want to be redirected after auth)
    const redirectUri = encodeURIComponent(`${window.location.origin}${SPA_CALLBACK_PATH}`);
    
    // Build the auth URL with SPA-specific parameters
    const authUrl = `${BASE_URL}/auth/azure?state=${state}&redirect_uri=${redirectUri}&from_spa=true`;
    
    console.log(`Redirecting to Microsoft login at: ${authUrl}`);
    
    // Redirect to the auth URL
    window.location.href = authUrl;
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
    localStorage.removeItem('auth_state');
    delete axios.defaults.headers.common['Authorization'];
    token.value = null;
    user.value = null;
  },
  
  // Handle the URL hash-based authentication response
  handleAuthFromUrlHash() {
    // Check if there's a hash in the URL
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      // Check for errors
      if (hashParams.has('error')) {
        const error = decodeURIComponent(hashParams.get('error'));
        console.error('Authentication error:', error);
        return { success: false, error };
      }
      
      // Look for token
      const newToken = hashParams.get('token');
      if (newToken) {
        // Set the token
        this.setToken(newToken);
        
        // Check for user data
        if (hashParams.has('user')) {
          try {
            // User data is base64 encoded JSON
            const userData = JSON.parse(atob(hashParams.get('user')));
            this.setUser(userData);
          } catch (e) {
            console.error('Error parsing user data:', e);
          }
        }
        
        // Verify state if provided
        const state = hashParams.get('state');
        const storedState = localStorage.getItem('auth_state');
        
        if (state && storedState && state !== storedState) {
          // State mismatch - possible CSRF attack
          console.error('State mismatch in auth callback');
          this.clearSession();
          return { 
            success: false, 
            error: 'Security validation failed. Please try again.' 
          };
        }
        
        // Clear the state after use
        localStorage.removeItem('auth_state');
        
        // Clear the URL hash to avoid it being reused or bookmarked
        // But preserve the existing history state
        history.replaceState(
          history.state || {},
          document.title,
          window.location.pathname + window.location.search
        );
        
        return { success: true };
      }
    }
    
    return { success: false, error: 'No authentication data found' };
  },
  
  // Set up interceptors to handle authentication
  setupInterceptors() {
    // Get token from localStorage and set in axios defaults
    const token = this.getToken();
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    // Add response interceptor for 401 errors
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle unauthorized responses
        if (error.response && error.response.status === 401) {
          console.error('Unauthorized API request - logging out');
          this.clearSession();
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }
    );
  }
}; 