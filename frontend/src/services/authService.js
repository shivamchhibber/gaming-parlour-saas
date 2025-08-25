import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/auth/sign-in';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // Authenticated API instance
  api,

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Get current user from localStorage
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Get auth token
  getToken() {
    return localStorage.getItem('access_token');
  },

  // Login
  async login(credentials) {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
    const token = response.data.access_token;

    // Store token
    localStorage.setItem('access_token', token);

    // Get user info
    const userResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    localStorage.setItem('user', JSON.stringify(userResponse.data));
    return userResponse.data;
  },

  // Logout
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/auth/sign-in';
  },
};

// Export configured axios instance for API calls
export { api };
export default authService;
